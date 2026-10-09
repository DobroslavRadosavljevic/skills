# Rate Limiting, Distributed Locks, Idempotency

## Rate Limiting

Pick the algorithm by what you must guarantee:

| Algorithm | Behavior | Cost | Use |
| --- | --- | --- | --- |
| Fixed window counter | Count per window. Allows a 2x burst across a window edge | 1 key, O(1) | Coarse quotas, login attempts, cheap protection |
| Sliding window log | Exact. One sorted-set member per request | O(log N), memory ~ limit per identity | Low limits (<= few hundred) needing exactness |
| Sliding window counter | Weighted sum of current + previous fixed window | 2 keys, O(1) | Good accuracy at API scale |
| Token bucket / GCRA | Smooth rate with bounded burst | 1 hash, O(1), needs Lua | Public APIs, per-key quotas, cost-weighted requests |
| Concurrency limit | Cap in-flight work | `INCR`/`DECR` or sorted set of leases with expiry | Expensive endpoints, upstream protection |

Design rules:

- One atomic server-side step per decision (single command, `MULTI`, or Lua). Never `GET` then `SET` from the client.
- Use server time (`redis.call("TIME")` in Lua) instead of client clocks. Skewed pods otherwise give inconsistent windows.
- Key per identity + route class: `rl:{scope}:{id}`. In Cluster each limiter touches one key, so no slot issue.
- Always expire limiter keys. On deny, return `429` with `Retry-After` (and `RateLimit-*` headers).
- Decide fail-open vs fail-closed per limiter. Abuse controls on auth usually fail closed or fall back to a local in-memory limiter. General API limits usually fail open with a short command timeout.
- Identify the client carefully (API key, user id, then trusted-proxy-resolved IP). Do not trust raw `X-Forwarded-For`.
- Single-process or edge scenarios: `@upstash/ratelimit` (fixedWindow, slidingWindow, tokenBucket, cachedFixedWindow) over REST, with `ephemeralCache`, `timeout`, and `pending` handling (see [clients.md](clients.md)).

### Fixed window

Portable (Redis 7.0+, Valkey 7.2+):

```ts
const [count] = (await redis.multi().incr(k).expire(k, windowSec, "NX").exec())!.map(([, v]) => v as number);
const allowed = count <= limit;
```

Redis 8.8+ single command (Redis only). `INCREX` skips the increment when the cap is reached and reports `applied = 0`:

```ts
const [value, applied] = (await redis.call("INCREX", k, "BYINT", 1, "UBOUND", limit, "EX", windowSec, "ENX")) as [number, number];
const allowed = applied !== 0;
```

`ENX` sets the TTL only when none exists, so the window does not slide on each hit. Use `SATURATE` only when you want the counter capped instead of skipped.

### Token bucket (Lua, works on Redis and Valkey)

```ts
const TOKEN_BUCKET = `
local t = redis.call('TIME')
local now = t[1] * 1000 + math.floor(t[2] / 1000)
local capacity, rate, cost = tonumber(ARGV[1]), tonumber(ARGV[2]), tonumber(ARGV[3])
local s = redis.call('HMGET', KEYS[1], 'tokens', 'ts')
local tokens, ts = tonumber(s[1]), tonumber(s[2])
if tokens == nil then tokens = capacity; ts = now end
tokens = math.min(capacity, tokens + (now - ts) / 1000 * rate)
local allowed, retry = 0, 0
if tokens >= cost then tokens = tokens - cost; allowed = 1
else retry = math.ceil((cost - tokens) / rate * 1000) end
redis.call('HSET', KEYS[1], 'tokens', tokens, 'ts', now)
redis.call('PEXPIRE', KEYS[1], math.ceil(capacity / rate * 1000) + 1000)
return { allowed, math.floor(tokens), retry }`;

redis.defineCommand("tokenBucket", { numberOfKeys: 1, lua: TOKEN_BUCKET });
type TokenBucket = { tokenBucket(key: string, capacity: number, ratePerSec: number, cost: number): Promise<[number, number, number]> };
const [allowed, remaining, retryMs] = await (redis as unknown as TokenBucket).tokenBucket(`rl:api:${id}`, 20, 5, 1);
```

On node-redis use `client.eval(script, { keys: [k], arguments: [...] })` or register a Function. On Bun use `send("EVALSHA", ...)`/`send("EVAL", ...)`.

### Sliding window log (Lua)

```lua
-- KEYS[1]=zset  ARGV: windowMs, limit, uniqueMember
local t = redis.call('TIME'); local now = t[1] * 1000 + math.floor(t[2] / 1000)
redis.call('ZREMRANGEBYSCORE', KEYS[1], 0, now - tonumber(ARGV[1]))
if redis.call('ZCARD', KEYS[1]) < tonumber(ARGV[2]) then
  redis.call('ZADD', KEYS[1], now, ARGV[3]); redis.call('PEXPIRE', KEYS[1], ARGV[1]); return 1
end
return 0
```

Use a unique member (`now-randomSuffix`), not just the timestamp, or same-millisecond requests collapse.

## Distributed Locks

Use a lock for efficiency (avoid duplicate work), not as the only protection for correctness. A lease can expire while the holder is paused (GC, network stall, VM pause) or after a failover that loses the key; two holders then act at once.

### Single-instance lease

```ts
const RELEASE = `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end`;
const EXTEND  = `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('PEXPIRE',KEYS[1],ARGV[2]) else return 0 end`;

export async function withLock<T>(name: string, ttlMs: number, fn: (signal: AbortSignal) => Promise<T>): Promise<T | null> {
  const key = `lock:${name}`;
  const token = crypto.randomUUID();                          // unguessable, unique per attempt
  if ((await redis.set(key, token, "PX", ttlMs, "NX")) !== "OK") return null;
  const ac = new AbortController();
  const timer = setInterval(async () => {                     // renew at ~1/3 TTL; abort work if lost
    const ok = await redis.eval(EXTEND, 1, key, token, ttlMs).catch(() => 0);
    if (ok !== 1) ac.abort(new Error("lock lost"));
  }, ttlMs / 3);
  try { return await fn(ac.signal); }
  finally { clearInterval(timer); await redis.eval(RELEASE, 1, key, token).catch(() => {}); }
}
```

Rules:

- Acquire with one atomic `SET key token NX PX ttl`. Never `SETNX` then `EXPIRE`.
- Token must be unique and unguessable. Release must be compare-and-delete in one step. Plain `DEL` can delete someone else's lock.
- Native compare-and-delete: `DELEX key IFEQ token` (Redis 8.4+) or `DELIFEQ key token` (Valkey 9.0+). Use Lua when targeting both or older servers.
- Choose TTL as p99 critical-section time with margin. Renew while healthy (watchdog) and abort the work when renewal fails.
- Bound waiting: retry with jittered backoff and a deadline. Return a busy result instead of queueing forever.
- In Cluster the lock key lives on one shard; failover can lose it (async replication). `WAIT 1 100` after acquire narrows the window but does not eliminate it.
- Do not hold a lock across network calls you cannot time out.

### Fencing tokens

Make the protected resource reject stale holders:

```ts
// acquire: monotonically increasing token from the same shard
const fence = await redis.incr(`fence:${name}`);
// every write to the resource carries it, and the resource enforces order, e.g. in SQL:
// UPDATE jobs SET state=$1, fence=$2 WHERE id=$3 AND fence < $2   -- 0 rows => stale holder, abort
```

If the resource cannot check a token (a third-party API, a plain file), prefer idempotency keys, a unique constraint, or a single-writer queue instead of a lock.

### Redlock

Redlock acquires the same key on N (typically 5) independent masters and treats a majority within a validity window as success. Caveats to state when it is proposed:

- It depends on bounded clock drift and bounded process pauses. The classic critique (Kleppmann) shows a paused client can still act after its lease expired, and Redlock hands out no fencing token. The author's reply defends the timing assumptions. Treat it as contested and not suitable where correctness depends on mutual exclusion.
- Needs 5 independent masters (not replicas of one cluster). More operational cost, still not linearizable.
- The npm `redlock` package's latest tag is `5.0.0-beta.2` (2022). Check maintenance before adopting.
- Redis docs still document Redlock; Valkey docs show the single-instance + `DELIFEQ` pattern. For strict correctness use a database row lock/advisory lock, a consensus store (etcd, ZooKeeper), or fencing against the resource.

## Idempotency Keys

Goal: a retried request produces one effect and the same response.

```ts
const k = `idem:${tenant}:${route}:${idemKey}`;
const owner = crypto.randomUUID();
const fingerprint = sha256(method + path + canonicalBody);       // same key + different payload = client bug
const claimed = await redis.set(k, JSON.stringify({ s: "pending", fp: fingerprint, owner }), "EX", 120, "NX");

if (claimed !== "OK") {
  const cur = JSON.parse((await redis.get(k)) ?? "null");
  if (!cur) return retryClaim();                                  // expired between SET and GET
  if (cur.fp !== fingerprint) return respond(422, "idempotency key reused with different payload");
  if (cur.s === "done") return replay(cur.response);              // same status + body as the first call
  return respond(409, "request in progress", { "Retry-After": "1" });
}
try {
  const response = await handle();
  await redis.set(k, JSON.stringify({ s: "done", fp: fingerprint, response }), "EX", 86_400);
  return response;
} catch (e) {
  if (isRetryable(e)) await releaseIfOwner(k, owner);             // Lua compare owner then DEL
  throw e;
}
```

- Short `pending` TTL covers crashes mid-request. Longer `done` TTL covers client retry horizons (hours to days).
- Redis is the fast path, not the system of record. Money-moving or email-sending effects should also have a durable unique constraint (idempotency table, outbox) so a flushed Redis cannot cause a double charge.
- Scope keys by tenant/user and route. Hash large payloads for the fingerprint.
- For stream producers, Redis 8.6+ `XADD ... IDMP producerId idempotentId` (or `IDMPAUTO producerId`) dedupes adds server-side; configure retention with `XCFGSET`. Redis only.
- Consumers still need idempotent handlers: streams and queues deliver at-least-once.
