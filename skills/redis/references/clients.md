# Clients and Connection Management

Versions observed 2026-10-09. Re-check lockfile versions before applying.

## Client-Choice Table

| Client | Version | Transport / runtime | Pick when | Watch out |
| --- | --- | --- | --- | --- |
| `Bun.redis` / `RedisClient` | Bun 1.4.2 | Native TCP (Rust), RESP3, Bun only. Server 7.2+. Reads `REDIS_URL`, then `VALKEY_URL` | Bun app, simple KV/hash/set/pub-sub, zero deps, auto-pipelining by default | No Cluster, no Sentinel. `MULTI`/`EXEC` only via `send()`. Few typed helpers (no sorted-set methods, use `send`). Pub/sub is experimental and takes over the connection (`duplicate()` for commands). `idleTimeout` closes without reconnect |
| `ioredis` | 6.0.0 | Node >= 20, TCP, RESP3 default (`protocol: 2` keeps v5) | Mature Cluster + Sentinel, `defineCommand` Lua, pipelines, auto-pipelining, big existing codebases | No client-side caching. Reply shapes changed with RESP3. `keyPrefix` and cluster/Lua interplay is subtle. Library peers may still test ioredis 5, check peer ranges |
| `redis` (node-redis) | 6.3.0 (`@redis/client`) | Node >= 20, TCP, RESP3 default (`RESP: 2` keeps v5) | Official client, best new-command coverage (8.x), client-side caching, JSON/Search/Bloom/TimeSeries modules, OTel, Sentinel, cluster routing policies (6.2+), key prefixing (6.1+) | v6 defaults: `commandOptions.timeout` 5 s, `keepAliveInitialDelay` 30 s. Needs explicit `connect()`. Cluster/Sentinel clients differ from single-client API |
| `iovalkey` | 0.4.0 (Node >= 18.12) | ioredis fork for Valkey | Valkey target with an existing ioredis-style codebase | Smaller ecosystem and release cadence than ioredis. Verify RESP3/Valkey-9 features you need |
| `@valkey/valkey-glide` | 2.5.3 | Rust core, `GlideClient` / `GlideClusterClient` | Valkey (also Redis OSS) with built-in cluster topology refresh, reconnection, client-side caching, batching, AZ-aware reads, pub/sub config | Different API from ioredis/node-redis (`Batch`, `ClusterBatch`, `exec(batch, raiseOnError)`, `customCommand`). Reply types are `GlideString`, set a `Decoder` when you need strings |
| `@upstash/redis` | 1.39.0 | HTTPS REST (also native TCP exists on the service) | Edge/serverless runtimes without TCP, per-request billing, short-lived functions | Auto JSON (de)serialization changes stored values vs other clients. No long-lived connections. Check supported commands (service tracks Redis up to 8.4). `@upstash/ratelimit` 2.2.0 for limits |

Default recommendation: node-redis 6 for Redis 8 on Node, ioredis 6 where the codebase already uses it or needs mature Cluster/Sentinel, Bun.redis for Bun apps that stay on standalone/managed single endpoints, GLIDE for Valkey-first fleets, Upstash REST for edge. Do not mix two clients on the same hot path without a reason.

## Common Setup Rules

- One long-lived client per process for normal commands. Redis multiplexes requests on one connection, so a pool is rarely needed. Add dedicated connections for: pub/sub subscribers, blocking commands (`BLPOP`, `XREAD BLOCK`, `BLMOVE`), `WATCH` transactions, and non-cache-friendly traffic under client-side caching.
- Always attach the `error` event handler (`client.on("error", ...)`). An unhandled client error event can crash Node.
- Bound everything: connect timeout, command timeout, reconnect backoff with jitter and a ceiling, max offline queue. An unbounded offline queue turns a Redis outage into a memory leak.
- Decide fail-open vs fail-closed per use: cache reads fail open to the database, rate limits and locks usually fail open or closed by explicit policy, idempotency fails closed.
- Close on shutdown: `await client.quit()` (ioredis), `await client.close()` (node-redis, `destroy()` for immediate), `client.close()` (Bun, GLIDE).
- Use `rediss://` (or `tls` options) for TLS. Never disable certificate verification in production.
- Read `INFO` fields `connected_clients`, `maxclients`, `rejected_connections` when sizing instances x pods.

## ioredis 6

```ts
import { Redis, Cluster } from "ioredis";

export const redis = new Redis(process.env.REDIS_URL!, {
  // protocol: 2,               // keep v5 reply shapes if parsers are not migrated
  lazyConnect: true,            // connect on first command; call redis.connect() at boot to fail fast
  connectTimeout: 5_000,
  commandTimeout: 2_000,
  maxRetriesPerRequest: 2,      // default 20; lower so requests fail fast during outages
  enableAutoPipelining: true,   // batches same-tick commands
  retryStrategy: (times) => Math.min(times * 100, 3_000) + Math.random() * 100,
});
redis.on("error", (err) => logger.warn({ err }, "redis error"));
```

- Sentinel: `new Redis({ sentinels: [{ host, port }, ...], name: "mymaster", password, sentinelPassword })`.
- Cluster: `new Cluster([{ host, port }], { scaleReads: "slave", redisOptions: { password, tls: {} }, natMap, dnsLookup })`. Use `natMap` behind NAT/Docker and `dnsLookup: (a, cb) => cb(null, a)` for TLS with managed endpoints that need the original hostname for SNI/cert checks.
- Lua: `redis.defineCommand("name", { numberOfKeys: 1, lua })` caches via `EVALSHA` with `EVAL` fallback. Cast to a local interface to type the method.
- `scanStream({ match, count })` per node. In Cluster iterate `cluster.nodes("master")`.
- Do not use `keyPrefix` with Lua/`eval`/`scan` or libraries that build keys themselves. Prefer explicit key builders.
- Pipeline results are `[error, value][]`. Check each error. `multi().exec()` returns `null` if `WATCH` aborted.

## node-redis 6

```ts
import { createClient } from "redis";

export const redis = createClient({
  url: process.env.REDIS_URL,
  // RESP: 2,                      // keep v5 reply shapes
  socket: {
    connectTimeout: 5_000,
    reconnectStrategy: (retries, cause) =>
      cause instanceof Error && cause.name === "SocketTimeoutError"
        ? false
        : Math.min(2 ** retries * 50, 2_000) + Math.floor(Math.random() * 200),
  },
  // clientSideCache: { ttl: 0, maxEntries: 10_000, evictPolicy: "LRU" }, // RESP3 only
})
  .on("error", (err) => logger.warn({ err }, "redis error"));
await redis.connect();

await redis.set("k", "v", { expiration: { type: "PX", value: 30_000 }, condition: "NX" });
```

- `SET` options use `expiration: { type, value }` and `condition`; legacy `EX`/`PX`/`NX` booleans are deprecated. `condition: "IFEQ"` + `matchValue` exists for Redis 8.4+ (experimental).
- Close with `await client.close()` (graceful) or `client.destroy()`. `quit()` is deprecated.
- Pub/sub: `const sub = redis.duplicate(); await sub.connect(); await sub.subscribe("ch", (msg, channel) => ...)`.
- `scanIterator({ MATCH, COUNT })` yields arrays of keys. With `keyPrefix` configured (6.1+) yielded keys are already prefixed, so strip before reuse.
- Pipelines: `client.multi().set(...).get(...).execAsPipeline()`. Transactions: `.exec()`. Cluster `WATCH`: `await cluster.getNodeClientForKey(key)` then watch/multi on that node client (6.1+).
- Cluster (`createCluster`): 6.2 routes by server `COMMAND` policies, splits cross-slot `MGET`/`MSET`/`DEL`/`EXISTS`/`TOUCH`/`UNLINK` per slot, fans out `KEYS`/`DBSIZE`/`SCAN`. Raw `sendCommand` behavior changed in 6.2, retest raw callers.
- Sentinel: `createSentinel({ name, sentinelRootNodes })`. `commandOptions` live at the top level since v6.
- Modules: JSON, Search, Bloom, TimeSeries ship in `redis`; with Redis 8 they exist server-side by default.

## Bun.redis

```ts
import { RedisClient, redis } from "bun"; // `redis` reads REDIS_URL then VALKEY_URL

const client = new RedisClient(process.env.REDIS_URL!, {
  connectionTimeout: 10_000,
  idleTimeout: 0,
  autoReconnect: true,       // default; backoff 50 ms doubling to 2 s
  maxRetries: 20,
  enableOfflineQueue: true,  // false = reject commands immediately while disconnected
  enableAutoPipelining: true,
  tls: false,                // or { rejectUnauthorized, ca, cert, key }; rediss:// also enables TLS
});
await client.set("k", "v");
await client.expire("k", 60);
await client.send("SET", ["lock:x", token, "NX", "PX", "30000"]); // anything without a typed method
const sub = await client.duplicate();
await sub.subscribe("news", (message, channel) => {});
client.close();
```

- Typed helpers cover strings, `incr`/`decr`, hashes, sets, `expire`/`ttl`, pub/sub; everything else goes through `send(command, args)`. `EXISTS` and `SISMEMBER` return booleans; RESP3 maps become objects; `getBuffer` returns bytes.
- Auto-pipelining skips `AUTH`, `INFO`, `MULTI`, `EXEC`, `WATCH`, `SCRIPT`, `SELECT`, `CLUSTER`, pub/sub commands. Run transactions through `send`, and expect no Cluster or Sentinel support.
- Error codes: `ERR_REDIS_CONNECTION_CLOSED`, `ERR_REDIS_AUTHENTICATION_FAILED`, `ERR_REDIS_INVALID_RESPONSE`, `ERR_REDIS_SERVER_ERROR`.

## Valkey GLIDE

```ts
import { GlideClient, GlideClusterClient, Batch } from "@valkey/valkey-glide";

const client = await GlideClusterClient.createClient({
  addresses: [{ host, port: 6379 }],
  useTLS: true,
  credentials: { username, password },
  requestTimeout: 500,
  clientName: "api",
});
const batch = new Batch(true).set("k", "v").incr("n"); // true = atomic (MULTI/EXEC); false = pipeline
const results = await client.exec(batch, /* raiseOnError */ false);
client.close();
```

- Use `ClusterBatch` for cluster; non-atomic cluster batches may span slots, atomic ones may not.
- Client-side cache: `clientSideCache: ClientSideCache.create(maxSizeKB, ttl)`. Pub/sub: config-time `pubsubSubscriptions` or dynamic `subscribe`/`subscribeLazy`, messages via callback or `getPubSubMessage()`.
- Multiple numbered databases in cluster mode (`databaseId`) need Valkey 9.0+.

## Upstash REST

```ts
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(10, "10 s"),
  prefix: "rl:api",
  ephemeralCache: globalCache, // module-level Map, outside the handler
  timeout: 1_000,              // fail open if Redis is slow
});
const { success, pending } = await ratelimit.limit(ip);
waitUntil(pending);            // flush analytics/multi-region sync before the runtime freezes
```

- HTTP per call: batch with `redis.pipeline()` (not atomic) or `redis.multi()` (atomic). Auto-pipelining is on by default (`enableAutoPipelining: false` to disable).
- Values are JSON-serialized automatically. Keys written by another client (raw strings) may deserialize differently. Set `automaticDeserialization: false` when sharing data with TCP clients.
- Keep the REST token server-side. It is a full-access credential.

## Serverless and Short-Lived Runtimes

- TCP runtimes (Lambda, containers, Vercel Node functions, Bun/Node servers): create the client at module scope so warm invocations reuse it. Do not connect, `quit`, and reconnect per request. Use `lazyConnect` or connect once at init with a bounded timeout.
- Multiply connections: instances x clients per instance x (1 + subscribers). Compare with server `maxclients` and managed-tier limits. Autoscaling bursts are the usual cause of `max number of clients reached`.
- Lower retry budgets inside request handlers (`maxRetriesPerRequest` 1-2, short `commandTimeout`) so a Redis blip does not consume the function timeout.
- Freeze/thaw can leave half-open sockets. Enable TCP keepalive (node-redis v6 default 30 s `keepAliveInitialDelay`; ioredis `keepAlive`), and treat the first command after idle as retryable only if it is idempotent.
- Edge runtimes without raw TCP: use an HTTP client (Upstash REST) or an HTTP proxy in front of Redis. Do not ship TCP clients to the edge bundle.
- Pub/sub subscribers and blocking stream readers need long-lived processes. Do not run them in short-lived functions. Use a worker service, or poll with `XREADGROUP` without `BLOCK`.
- Cold start TLS handshakes add tens of milliseconds. Warm the connection during init, not on the first user request.
- Use an in-process LRU/TTL map in front of Redis for ultra-hot reads when the runtime keeps memory between calls (invalidate by short TTL, or pub/sub where long-lived).
