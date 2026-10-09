# Production Checklist

Use as a release gate. Mark each item pass, fail, or not applicable with evidence.

## Server

- [ ] Server and version recorded (`INFO server`): Redis 8.x or Valkey 9.x, on a supported, patched line (latest seen 2026-10-09: Redis 8.10.2, Valkey 9.1.2). Commands used are available on that exact server.
- [ ] Topology matches need: standalone, replica + Sentinel (3 sentinels), or Cluster (3+ primaries with replicas). Failover drill done with real clients.
- [ ] `maxmemory` set, headroom for fork COW and buffers, `maxmemory-policy` matches the role. Alerts at 70/85% memory.
- [ ] Persistence chosen on purpose (none, RDB, AOF `everysec`, both). Backups copied off-host and a restore tested. THP disabled.
- [ ] `maxclients` and connection budget (instances x connections) computed. `timeout`/TCP keepalive set for idle connections.
- [ ] Slowlog and latency monitor enabled (`slowlog-log-slower-than`, `latency-monitor-threshold`).
- [ ] Dangerous commands restricted by ACL. `default` user off. Per-service users with key/channel patterns. Secrets in a secret manager, rotation planned.
- [ ] Network private. TLS on client, replication, and cluster bus; `rediss://` verified end to end.
- [ ] Monitoring: memory, evictions, hit ratio, ops/s, connected/blocked/rejected clients, replication lag, fork time, persistence status, per-shard skew, keyspace size. Alerts routed.

## Keys and Data

- [ ] Key builders centralized, namespaced and versioned. No secrets/PII in keys. Cluster hash tags only where multi-key atomicity requires them.
- [ ] Every cache/ephemeral key has TTL with jitter. Sampled `TTL` audit shows no unexplained `-1`.
- [ ] Collections bounded (`LTRIM`, `XTRIM`, rank trims, TTL). No known big keys over agreed limits. No unbounded user-driven cardinality.
- [ ] No `KEYS`, no unbounded `SMEMBERS`/`HGETALL`/`LRANGE 0 -1`/`ZRANGE 0 -1` on growing data. Bulk deletes use `SCAN` + `UNLINK`.
- [ ] Values serialized with a schema version; unparseable values treated as misses.

## Client

- [ ] Client and version pinned. RESP protocol decided (RESP3 default in ioredis 6, node-redis 6, Bun.redis); reply parsers tested.
- [ ] One shared connection per process for normal traffic. Dedicated connections for subscribers, blocking reads, `WATCH`.
- [ ] `error` listener attached. Connect and command timeouts set. Reconnect backoff bounded with jitter. Offline queue bounded.
- [ ] Redis failure behavior defined per use (cache fails open, locks/limits/idempotency policy explicit) and tested by killing the server.
- [ ] Graceful shutdown closes clients and stream consumers.
- [ ] Serverless: client at module scope, lazy/one-time connect, small retry budget, no subscribers in short-lived functions, REST client at the edge, connection count vs `maxclients` checked.
- [ ] Cluster/Sentinel-aware client config verified (`natMap`, TLS SNI, `scaleReads`/`useReplicas`, Sentinel name).

## Patterns

- [ ] Cache: stampede protection (single-flight, lease, or SWR), negative caching, invalidation path covers every writer, database fallback has concurrency cap.
- [ ] Locks: unique token, `SET NX PX`, atomic compare-and-delete release, renewal with abort, fencing token or resource-side check where correctness matters. Redlock not relied on for safety.
- [ ] Rate limits: atomic, server-time, TTL on keys, `429` + `Retry-After`, fail-open/closed documented, trusted client identity.
- [ ] Idempotency: key scope + payload fingerprint, pending vs done TTLs, durable unique constraint for money/email side effects.
- [ ] Messaging: pub/sub only for loss-tolerant fan-out. Streams have groups, `XACK` after success, `XAUTOCLAIM` for crashed consumers, DLQ path, bounded length, idempotent handlers.
- [ ] Lua/Functions: all keys in `KEYS`, short runtime, versioned deploy (`FUNCTION LOAD REPLACE` / script SHA), loaded on every Cluster primary.
- [ ] Redis 8-only commands guarded when Valkey is a possible target.

## Operations Readiness

- [ ] Runbooks: memory full, failover, replica resync, hot key, big key, slow command, connection exhaustion, restore from backup.
- [ ] Load test with production-like key sizes and eviction/persistence on. Observed p99 and memory growth recorded.
- [ ] Upgrade plan: staging on target minor, client compatibility checked, rolling upgrade order (replicas first), rollback plan.
- [ ] Ownership and on-call defined; capacity review date set.
