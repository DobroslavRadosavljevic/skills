---
name: redis
description: "Build, review, debug, tune, secure, or operate Redis and Valkey from TypeScript with current docs. Covers Redis 8.10 (Redis Open Source, RSALv2/SSPLv1/AGPLv3) and Valkey 9.1 (BSD-3), clients Bun.redis (RedisClient), ioredis 6, node-redis 6 (redis/@redis/client createClient), iovalkey, Valkey GLIDE (GlideClient, Batch), and Upstash REST (@upstash/redis, @upstash/ratelimit), with a client-choice table. Use for data-structure choice (strings, hashes, lists, sets, sorted sets, streams, JSON, bitmaps, HyperLogLog, vector sets, hash-field TTL HEXPIRE/HGETEX/HSETEX), key naming and TTL discipline, cache-aside, stampede protection, stale-while-revalidate, invalidation, client-side caching (CLIENT TRACKING), rate limiting (fixed/sliding window, token bucket, INCREX, Lua), distributed locks (SET NX PX, DELEX/DELIFEQ, fencing tokens, Redlock caveats), idempotency keys, sessions, leaderboards, pub/sub vs streams and consumer groups (XREADGROUP, XAUTOCLAIM, XACK, IDMP), pipelining, MULTI/EXEC/WATCH, EVAL, Redis Functions (FCALL), SCAN vs KEYS, big-key and hot-key diagnosis (HOTKEYS), latency troubleshooting, maxmemory eviction (LRU/LFU/LRM), RDB/AOF, replication, Sentinel, Cluster hash tags, ACLs, TLS, serverless connection management, and a production checklist."
---

# Redis and Valkey (TypeScript)

Use this skill for application-side and operational work against Redis or Valkey: pick the right structure, write safe commands, choose and configure a client, and diagnose memory, latency, and failover problems.

Snapshot (2026-10-09): Redis Open Source **8.10.2** (8.10 GA 2026-07-29), Valkey **9.1.2** (9.2.0-rc1 exists). Clients: `redis` (node-redis) **6.3.0**, `ioredis` **6.0.0**, `iovalkey` **0.4.0**, `@valkey/valkey-glide` **2.5.3**, `@upstash/redis` **1.39.0**, `@upstash/ratelimit` **2.2.0**, Bun **1.4.2**. Refresh from [source-map.md](references/source-map.md) when versions drift.

## Workflow

1. Inspect the local surface first:
   - Server: Redis or Valkey, exact version (`INFO server`), managed service or self-hosted, standalone vs Sentinel vs Cluster, persistence mode, `maxmemory-policy`, ACL users, TLS.
   - Client: package + version, protocol (RESP2/RESP3), connection factory, timeouts, reconnect policy, how many connections each process opens, serverless or long-lived runtime.
   - Key design: prefixes, TTL coverage, hash tags, largest keys, scan usage, Lua/Functions already in the repo.
2. Check version gates before using any command. Redis 8.x additions (`DELEX`, `MSETEX`, `INCREX`, `XNACK`, `HOTKEYS`, `IDMP`, vector sets, Array) are not portable to Valkey. Use [data-structures-keys.md](references/data-structures-keys.md) for the gate table.
3. Route the work:
   - Client choice, setup, reconnect, serverless connections: [clients.md](references/clients.md).
   - Structures, key naming, TTLs, hash-field TTL: [data-structures-keys.md](references/data-structures-keys.md).
   - Cache-aside, stampede, stale-while-revalidate, invalidation, client-side caching, sessions, leaderboards: [caching-patterns.md](references/caching-patterns.md).
   - Rate limits, locks, fencing, idempotency keys: [rate-limits-locks-idempotency.md](references/rate-limits-locks-idempotency.md).
   - Pub/sub, streams, consumer groups, pipelines, MULTI/WATCH, Lua, Functions: [messaging-scripting.md](references/messaging-scripting.md).
   - Memory, eviction, persistence, HA/Cluster, SCAN, big/hot keys, latency, ACL/TLS: [operations.md](references/operations.md).
   - Release gate: [production-checklist.md](references/production-checklist.md).
4. Keep the repo's existing client and connection factory unless the user asks for a migration.
5. Verify against a real server of the same major (container), not a mock.

## Core Judgment

- Redis is single-threaded for command execution (I/O threads only offload socket work). One slow command stalls every client. Never run `KEYS`, unbounded `SMEMBERS`/`HGETALL`/`LRANGE 0 -1` on large keys, or long Lua in the request path. Use `SCAN` family and `UNLINK`.
- Licensing: Redis 8.0+ is tri-licensed (RSALv2, SSPLv1, or AGPLv3 at your choice); 7.4-7.x was RSALv2/SSPLv1; up to 7.2 was BSD. Valkey is a BSD-3-Clause Linux Foundation fork of Redis 7.2.4. State this once when asked to choose a server; do not lecture.
- Valkey is wire-compatible with Redis 7.2 and the usual clients work, but it does not track Redis 8-only commands or built-in modules (JSON, search, probabilistic, vector sets come from `valkey-bundle` modules). Never emit a Redis 8-only command on a Valkey target.
- Every cache key gets a TTL with jitter. Keys without TTL need a written reason. `SET` without `KEEPTTL` clears the TTL.
- Cache is an optimization, not the source of truth. A cache outage must degrade to the database, not to errors. Put a command timeout on every client and fail open or closed deliberately.
- Lock = lease with a random token, TTL, atomic compare-and-delete release. A lock alone never guarantees mutual exclusion under pauses or failover; protect the resource with a fencing token or a database constraint. Redlock does not fix this.
- Pub/sub is fire-and-forget, at-most-once. Use streams with consumer groups when messages must survive disconnects and restarts. Use a job-queue library (for example BullMQ) rather than hand-rolled list queues for retries and scheduling.
- Pipelines cut round trips but are not atomic. `MULTI/EXEC` is atomic but has no rollback. `WATCH` state is per connection, so never run it on a shared multiplexed connection. Prefer a Lua script or Function for read-modify-write.
- Cluster: multi-key commands, `MULTI`, and Lua need all keys in one slot. Use hash tags (`{tenant:42}:cart`) only where atomicity needs it, because a hot tag is a hot shard.
- Treat replication as asynchronous. Replica reads can be stale and a failover can lose recent writes. Use `WAIT`/`WAITAOF` only for the writes that need it.
- Memory is the budget. Set `maxmemory`, pick a policy that matches the role (`allkeys-lru`/`allkeys-lfu` for pure cache, `noeviction` when Redis holds data you cannot lose), and leave headroom for fork copy-on-write and replication buffers.
- Pin client behavior: attach an `error` listener, bound reconnect backoff, set command and connect timeouts, share one connection per process for normal commands, and use dedicated connections for pub/sub, blocking reads, and `WATCH`.
- RESP3 is now the default in ioredis 6 and node-redis 6 and in Bun.redis. Reply shapes changed (maps, doubles, search/stream results). Pin `protocol: 2` (ioredis) or `RESP: 2` (node-redis) to keep v5 shapes, or retest every reply parser.
- Do not put secrets, tokens, or PII in key names (they appear in `MONITOR`, `SLOWLOG`, logs, and metrics). Do not expose Redis to the public internet; require ACL users and TLS beyond a trusted private network.
- Prefer `bun` / `bunx` in command examples.

## Verification

Prefer repository-owned commands. For meaningful Redis work, cover the relevant subset:

- Server version and client reply shapes: `INFO server`, a smoke test per command family used, RESP2/RESP3 parity for parsers.
- TTL audit: sample keys with `SCAN` + `TTL`; expect no unexplained `-1`.
- Atomicity: lock release, rate-limit, and idempotency paths tested with concurrent callers against a real server.
- Failure paths: kill the server or block it (`DEBUG SLEEP` on a test box, or `CLIENT PAUSE`) and confirm timeouts, reconnect, and graceful degradation.
- Cluster: keys in multi-key paths share a slot; test with a real 3-primary cluster when hash tags matter.
- Memory and latency: `MEMORY USAGE` on representative large keys, `SLOWLOG GET`, `LATENCY DOCTOR`, eviction counters under load.
- Shutdown: `close()` or `quit()` is called, subscriber and blocking connections released.

Report which checks ran, which did not, and the server and client version assumptions that remain.
