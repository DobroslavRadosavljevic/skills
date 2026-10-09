# Messaging, Pipelines, Transactions, Lua and Functions

## Pub/Sub vs Streams vs Lists

| Need | Use | Delivery |
| --- | --- | --- |
| Ephemeral broadcast (cache invalidation, presence, live UI fan-out) | Pub/Sub (`PUBLISH`, `SUBSCRIBE`, `PSUBSCRIBE`; cluster: `SPUBLISH`/`SSUBSCRIBE`) | At-most-once. Offline subscribers miss messages. No replay, no ack |
| Durable events, work distribution, retries, multiple independent consumers | Streams + consumer groups | At-least-once with `XACK`, replay by id, pending list |
| Simple FIFO handoff, single consumer, loss acceptable | List (`LPUSH` + `BLMOVE` to a processing list) | Manual reliability |
| Jobs with retries, backoff, delay, schedulers, rate limits | A queue library (for example BullMQ) on top of Redis | Library-defined |

Pub/sub rules:

- A subscribed RESP2 connection can only run subscribe-family commands, so use a dedicated connection (`duplicate()`). RESP3 connections can mix, but still isolate subscribers for clarity and reconnect handling.
- Resubscribe after reconnect (ioredis and node-redis restore subscriptions automatically; verify). Messages sent during the gap are gone.
- Slow subscribers are disconnected when the pubsub output buffer exceeds `client-output-buffer-limit pubsub`. Keep handlers fast, hand off to a queue.
- Cluster: classic `PUBLISH` broadcasts across the cluster bus (cost grows with nodes). Prefer sharded pub/sub (`SPUBLISH`/`SSUBSCRIBE`), which keeps traffic within a shard by channel slot.
- Payload small, versioned JSON. Channel names namespaced (`events:{tenant}:orders`).

## Streams with Consumer Groups

```ts
const STREAM = "ev:orders", GROUP = "billing", CONSUMER = `${hostname}-${process.pid}`;

// producer: bounded stream, approximate trim is cheap
await redis.xadd(STREAM, "MAXLEN", "~", 100_000, "*", "type", "order.paid", "payload", JSON.stringify(evt));

// setup once; BUSYGROUP means it already exists
await redis.xgroup("CREATE", STREAM, GROUP, "$", "MKSTREAM").catch((e) => { if (!String(e).includes("BUSYGROUP")) throw e; });

// worker: blocking reads need their own connection
const reader = redis.duplicate();
while (!stopping) {
  // 1) take over entries abandoned by crashed consumers (idle > 60 s)
  const [, claimed] = await redis.xautoclaim(STREAM, GROUP, CONSUMER, 60_000, "0-0", "COUNT", 50);
  // 2) then new entries
  const res = await reader.xreadgroup("GROUP", GROUP, CONSUMER, "COUNT", 50, "BLOCK", 5_000, "STREAMS", STREAM, ">");
  for (const [id, fields] of [...claimed, ...(res?.[0]?.[1] ?? [])]) {
    try { await handle(toObject(fields)); await redis.xack(STREAM, GROUP, id); }   // ack only after success
    catch (err) { await onFailure(id, err); }                                      // see DLQ below
  }
}
```

Rules:

- Handlers must be idempotent. Delivery is at-least-once: a crash between handling and `XACK` redelivers.
- `$` = only new entries; `0` = from the beginning. In `XREADGROUP`, `>` = never-delivered entries, an explicit id (`0`) re-reads this consumer's own pending entries.
- Stable consumer names per worker. Remove dead names with `XGROUP DELCONSUMER`. Inspect with `XINFO GROUPS|CONSUMERS|STREAM`, `XPENDING key group` (and extended `XPENDING key group IDLE ms - + count` for delivery counts).
- Poison messages: check delivery count from `XPENDING`. After N attempts `XADD` to a `:dlq` stream with error context, then `XACK`.
- Trim streams (`XADD MAXLEN ~ N` or `XTRIM MINID ~ <ms-cutoff>-0`) or memory grows forever. Trimming past a lagging group's position drops unread entries. Watch group `lag` in `XINFO GROUPS`.
- Redis 8.2+: `XACKDEL`, `XDELEX`, and trim `ACKED`/`DELREF` options to delete only fully acked entries. Redis 8.4+: `XREADGROUP ... CLAIM minIdle` returns idle pending and new entries together. Redis 8.8+: `XNACK` releases a pending entry. Redis 8.10: `MAXCOUNT`/`MAXSIZE` on `XREAD`/`XREADGROUP` cap batch size. None of these are documented for Valkey; keep the `XAUTOCLAIM` loop for portability.
- Ordering is per stream. Partition by key across multiple streams (`ev:orders:{0..N}`) when throughput needs it; in Cluster each stream is one shard.
- Streams are replicated asynchronously and RDB/AOF persisted. After failover, recent entries and group state can be lost. For hard durability needs use a log system built for it.
- Reply shapes differ across clients/protocols (ioredis 6 and node-redis 6 default to RESP3). Test stream parsing after upgrades.

## Pipelining

Batches many commands into one round trip. Not atomic: other clients' commands interleave, and one failure does not stop the rest.

- ioredis: `const r = await redis.pipeline().set(a, 1).get(b).exec()` gives `[[err, value], ...]`. `enableAutoPipelining` batches same-tick commands automatically.
- node-redis: concurrent commands pipeline on the socket automatically; explicit: `client.multi().set(...).get(...).execAsPipeline()`.
- Bun.redis: auto-pipelined by default (`Promise.all`). GLIDE: `new Batch(false)` / `ClusterBatch(false)`. Upstash: `redis.pipeline()` (one HTTP call).
- Chunk large batches (a few hundred to a few thousand commands) so reply buffers stay bounded. Do not pipeline a million-key read in one go.
- Cluster: clients split pipelines per node; cross-slot ordering is not guaranteed.

## MULTI / EXEC / WATCH

- `MULTI` ... `EXEC` queues commands then runs them as one isolated unit. Syntax errors at queue time abort the whole transaction; runtime errors (wrong type) do not roll back the others.
- `WATCH key` makes `EXEC` return `null` if the key changed since the watch, enabling optimistic locking:

```ts
const tx = redis.duplicate();                       // WATCH state is per connection: use a dedicated one
try {
  for (let attempt = 0; attempt < 5; attempt++) {
    await tx.watch(key);
    const cur = Number(await tx.get(key) ?? 0);
    const res = await tx.multi().set(key, String(cur + 1)).exec();
    if (res) return;                                // null => conflict, retry with backoff
  }
} finally { tx.disconnect(); }
```

- Never `WATCH` on a shared multiplexed connection: other async callers' commands interleave and `UNWATCH`/`EXEC` semantics break. Use a dedicated connection (`duplicate()`), or write a Lua script.
- Cluster: all keys in a transaction must share a slot (hash tags). node-redis 6.1: `cluster.getNodeClientForKey(key)` then `watch`/`multi`.
- A Lua script is simpler, atomic, and a single round trip. Prefer it for read-modify-write.

## Lua Scripts (`EVAL`, `EVALSHA`)

- Scripts run atomically and block the server. Keep them O(small); avoid loops over unbounded data. Runtime beyond `busy-reply-threshold` (5 s) makes other clients get `BUSY`; `SCRIPT KILL` only works before the script writes.
- Pass every key via `KEYS` (needed for Cluster routing and ACL key checks), everything else via `ARGV`. All `KEYS` must share a slot in Cluster.
- Use `redis.call` (raises on error) or `redis.pcall` (returns error table). Return types convert: Lua number -> integer (truncates floats), `false` -> nil, tables -> arrays (stop at first `nil`). Floats as strings via `tostring`.
- Use `redis.call("TIME")` for time. Replication ships script effects, so non-deterministic commands are allowed in current servers.
- Load once: clients cache by SHA (`EVALSHA`, with `NOSCRIPT` fallback to `EVAL`). The script cache is lost on restart and not shared across failover assumptions. ioredis `defineCommand` handles this.
- Mark read-only scripts with `#!lua flags=no-writes` and use `EVAL_RO`/`EVALSHA_RO` so replicas can serve them.
- Test with a real server. Version-control scripts as files, not string-concatenated.

## Redis Functions (`FCALL`)

Functions are named, versioned, server-persisted library code (Redis 7.0+, Valkey 7.2+). They survive restarts, replicate, and are in RDB/AOF, unlike the script cache.

```lua
#!lua name=ratelimit
local function take(keys, args)
  -- keys[1]=bucket; args[1]=capacity ... (same logic as the token bucket)
  return { 1, 19, 0 }
end
redis.register_function{ function_name = "take", callback = take }
redis.register_function{ function_name = "peek", callback = function(keys) return redis.call("HGETALL", keys[1]) end, flags = { "no-writes" } }
```

```ts
await redis.call("FUNCTION", "LOAD", "REPLACE", libSource);       // deploy step, not on every request
const r = await redis.call("FCALL", "take", 1, `rl:api:${id}`, 20, 5, 1);
// read-only: FCALL_RO ; inspect: FUNCTION LIST WITHCODE, FUNCTION STATS, FUNCTION DELETE lib, FUNCTION DUMP/RESTORE
```

- Deploy functions in migrations/startup with `FUNCTION LOAD REPLACE`, and name libraries with a version if signatures change.
- Cluster: load the library on every primary (and on replicas it replicates; reload on new/failed-over nodes in provisioning). Cross-slot keys still fail.
- Flags: `no-writes` (allows `FCALL_RO` and replica execution), `allow-stale`, `no-cluster`, `allow-cross-slot-keys`, `allow-oom`.
- Choose Functions when scripts are shared across services/languages and you want versioned server-side logic; choose `EVAL`/`defineCommand` for app-owned scripts shipped with the client code.
- node-redis 6 can register functions in `createClient({ functions })` with typed `parseCommand`. Other clients use `FCALL` via `call`/`sendCommand`/`send`.
