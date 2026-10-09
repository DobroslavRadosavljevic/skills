# Operations: Memory, Persistence, HA, SCAN, Diagnosis, Security

Commands are `redis-cli` (also `valkey-cli`). Run diagnostics against the right node (primary vs replica, each Cluster shard).

## Memory and Eviction

- Set `maxmemory` explicitly (container limit minus headroom). Without it Redis grows until the OS OOM-kills it. Leave 20-50% headroom if persistence is on: `BGSAVE`/AOF rewrite fork uses copy-on-write and a write-heavy workload can nearly double RSS. Replication and client output buffers are not counted toward `maxmemory` (see `mem_not_counted_for_evict`).
- Policy by role:

| Role | `maxmemory-policy` |
| --- | --- |
| Pure cache, all keys have TTL or are re-creatable | `allkeys-lru` (default choice), `allkeys-lfu` for stable hot sets, `allkeys-lrm` (Redis 8.6+) to evict data not recently written |
| Mixed cache + persistent keys on one instance | `volatile-lru` / `volatile-lfu` / `volatile-ttl` (only keys with TTL evict). Prefer two instances |
| Primary data, queues, locks, sessions you cannot lose | `noeviction` (writes fail with OOM error; alert before the limit) |

- Tuning: `maxmemory-samples` (default 5, 10 approximates true LRU), `lfu-log-factor`, `lfu-decay-time`, `maxmemory-clients` (cap client buffers), `activedefrag yes` for fragmentation, `lazyfree-lazy-eviction/expire/server-del/user-del yes` to free memory off the main thread.
- Read: `INFO memory` (`used_memory`, `used_memory_rss`, `mem_fragmentation_ratio`, `used_memory_dataset`, `mem_clients_normal`), `INFO stats` (`evicted_keys`, `expired_keys`, `keyspace_hits`, `keyspace_misses`), `MEMORY STATS`, `MEMORY DOCTOR`, `MEMORY USAGE key SAMPLES 0`.
- Hit ratio = `keyspace_hits / (hits + misses)`. High `evicted_keys` with low hit ratio means undersized memory or poor policy. Eviction of keys you did not mean to lose means the instance mixes roles.
- Reduce memory: shorter keys, hashes instead of many strings (small hashes use compact encodings, `hash-max-listpack-entries/value`), smaller values, compression, TTLs, bounded collections, quantized vectors, Redis 8.6 hashtable/skiplist memory reductions, Redis 8.10 compact hashes (Redis only).
- Delete big keys with `UNLINK`. Avoid `FLUSHALL`/`FLUSHDB` without `ASYNC`.

## Persistence

| Mode | Behavior | Loss window | Notes |
| --- | --- | --- | --- |
| None | RAM only | Everything on restart | Pure cache |
| RDB (`save 3600 1 300 100 60 10000`, `BGSAVE`) | Point-in-time snapshots by fork | Since last snapshot (minutes) | Compact, fast restart, good for backups. Fork pause grows with dataset |
| AOF (`appendonly yes`) | Write log, multi-part AOF directory since 7.0 | `appendfsync everysec` (default): ~1 s; `always`: ~0 but slow; `no`: OS decides | Larger, slower restart. `aof-use-rdb-preamble yes` (default) speeds loads |
| RDB + AOF | Both | AOF's | Recommended when data matters |

- Durability beyond one node: replicas plus `min-replicas-to-write` / `min-replicas-max-lag`, and `WAIT numreplicas ms` / `WAITAOF` for individual critical writes. Replication is asynchronous, so a failover can lose acknowledged writes.
- Test restores. A backup never loaded is a hope. Copy RDB/AOF off the host. Watch `rdb_last_bgsave_status`, `aof_last_write_status`, `latest_fork_usec`.
- Disable Transparent Huge Pages on the host (fork latency). Provision disk IOPS for AOF fsync. Redis 8.10 adds a `BACKUP` command (node-side backup over multi-part AOF).
- Managed services often fix persistence settings. Read their durability docs rather than assuming.

## Replication, Sentinel, Cluster

- **Replication**: primary -> replicas, async. Replicas serve reads that may be stale. Size `repl-backlog-size` so short disconnects resync partially. Use `replica-serve-stale-data`, `replica-read-only yes` defaults deliberately.
- **Sentinel** (non-cluster HA): at least 3 sentinels on separate failure domains, quorum 2. Clients must be Sentinel-aware (ioredis `sentinels` + `name`, node-redis `createSentinel`, GLIDE via its own topology; Bun.redis has no Sentinel). Apps connect to the master name, not an IP. Test failover (`SENTINEL FAILOVER`) with real clients and confirm reconnect and `READONLY` handling.
- **Cluster**: 16,384 hash slots over primaries, each with replicas. Keys map by `CRC16(key) mod 16384`; `{tag}` substring overrides the hashed part. Multi-key commands, `MULTI`, Lua, and Functions need one slot (`CROSSSLOT` error otherwise). Clients follow `MOVED`/`ASK` and refresh topology. Only one logical database (Valkey 9.0+ adds numbered DBs in cluster mode).
  - Hot slot/tag: one shard saturates while others idle. Spread keys, avoid mega-tags.
  - `cluster-require-full-coverage yes` (default) makes the whole cluster refuse queries if any slot is uncovered. Consider `no` for partial availability.
  - Resharding: Redis 8.4+ and Valkey 9.0+ have atomic slot migration (`CLUSTER MIGRATION` on Redis). Older versions migrate key by key and can stall on big keys.
  - Cluster bus must be on a private network. Without `tls-cluster` it is unauthenticated; Redis 8.10.2 warns at startup and adds `cluster-bus-port-protected-mode`.
  - Behind NAT/Kubernetes: set `cluster-announce-ip`/ports and client `natMap`.
  - Scan/keys/flush are per node. node-redis 6.2 aggregates cluster-wide for `SCAN`; others need per-node loops. Valkey 9.1 adds `CLUSTERSCAN`.
- Failover drill before launch: kill a primary, confirm client reconnect time, error rates, and that retried commands are idempotent.

## SCAN, Not KEYS

- `KEYS pattern` is O(N) and blocks the server. Never use it in application code or production tooling.
- `SCAN cursor [MATCH pat] [COUNT n] [TYPE t]` iterates incrementally. Loop until the returned cursor is `0`. It may return duplicates and `MATCH` filters after fetching, so a page can be empty. `COUNT` is a hint, not a result size. Keys added or removed during the scan may or may not appear.
- Use `SSCAN`/`HSCAN`/`ZSCAN` for big collections instead of `SMEMBERS`/`HGETALL`/`ZRANGE 0 -1`.
- Bulk delete pattern: `SCAN ... COUNT 500` -> `UNLINK` batch (pipeline) -> short sleep. Run in a worker, not request path.
- Cluster: scan every primary. Client helpers: ioredis `scanStream` per `cluster.nodes("master")`, node-redis `scanIterator` (cluster-aware in 6.2), Bun `send("SCAN", ...)` (standalone only).
- Design to avoid scans: maintain index sets, versioned namespaces, or TTL-based expiry.

## Big Keys and Hot Keys

Big key symptoms: latency spikes on `DEL`/`HGETALL`/`LRANGE`/`SMEMBERS`, uneven shard memory, slow replication/fork, failed migrations.

```
redis-cli --bigkeys           # sampled per type (SCAN based; run off-peak)
redis-cli --memkeys           # by memory (needs MEMORY USAGE)
MEMORY USAGE key SAMPLES 0    # exact bytes
OBJECT ENCODING key ; DEBUG OBJECT key   # (DEBUG is often disabled)
```

Redis 8.2+ exposes key-size distribution metrics in `INFO` (per DB, per type); 8.6 adds `key-memory-histograms`. Fixes: split by bucket (`user:{id}:feed:{n}`), cap with `LTRIM`/`ZREMRANGEBYRANK`/`XTRIM`, use hash-field TTL, expire members, page with `*SCAN`, delete with `UNLINK`.

Hot key symptoms: one shard or one core pegged, high `instantaneous_ops_per_sec` on one node, `slowlog` quiet.

- Redis 8.6+: `HOTKEYS START METRICS 2 CPU NET COUNT 10 DURATION 60 [SAMPLE ratio] [SLOTS ...]` then `HOTKEYS GET`, `HOTKEYS STOP`, `HOTKEYS RESET`. Admin command with sampling overhead; run time-boxed.
- Older: `redis-cli --hotkeys` requires an LFU `maxmemory-policy`; or `OBJECT FREQ key`. Avoid `MONITOR` on busy production nodes (large overhead).
- Valkey: use `INFO commandstats`, `COMMANDLOG` (8.1+), and client-side sampling.
- Fixes: client-side caching or an in-process TTL cache for read-hot keys; replicate reads (`scaleReads`, `useReplicas`); shard the key (`counter:{n}` summed on read, random suffix writes); batch with `MGET`; move counters to approximate structures.

## Latency Troubleshooting

Work from the box outward:

1. **Is it Redis?** `redis-cli --latency` / `--latency-history` from the app host, `redis-cli --intrinsic-latency 100` on the server host (baseline for the VM). Compare with client-measured time. Large gaps point to network, DNS, TLS handshakes, connection storms, or event-loop lag in Node.
2. **Slow commands**: `SLOWLOG GET 20` (`slowlog-log-slower-than`, default 10 ms; `SLOWLOG` records execution time only, not queueing). Valkey 8.1+ `COMMANDLOG` also tracks large requests/replies. `INFO commandstats` shows calls, usec per call. Common offenders: `KEYS`, big-key reads/deletes, `SORT`, `SUNION` of huge sets, `ZRANGE` large, long Lua, `FLUSH*`.
3. **Latency monitor**: `CONFIG SET latency-monitor-threshold 100`, then `LATENCY LATEST`, `LATENCY HISTORY event`, `LATENCY DOCTOR`. Events: `fork`, `aof-fsync-always`, `expire-cycle`, `eviction-cycle`.
4. **Fork and disk**: `INFO persistence` `latest_fork_usec`. THP enabled, slow disks with `appendfsync always`, AOF rewrite during peak.
5. **Memory pressure**: swapping (RSS vs `used_memory`, `vmstat`), eviction storms (`evicted_keys` rising), fragmentation.
6. **Clients**: `CLIENT LIST` (`qbuf`, `obl`/`omem`, `age`, `idle`, `cmd`), `INFO clients` (`blocked_clients`, `connected_clients`), `INFO stats` (`rejected_connections`). Pending output buffers, a stuck `MONITOR`, or an unbounded pipeline cause latency for others.
7. **CPU**: one saturated core = single-thread bound. Reduce O(N) work, use pipelining, scale out with Cluster; enable `io-threads` (Redis 8, Valkey 8) for network-bound loads.
8. **App side**: connection count churn, per-request client creation, TLS handshakes per call, offline-queue backlog during reconnect, overly large JSON (de)serialization blocking the event loop, no command timeout.

`CLIENT PAUSE ms WRITE` and `DEBUG SLEEP` are useful for failure-injection on test boxes only.

## Security

- Network: bind to private interfaces, keep `protected-mode yes`, security groups limiting source ranges, never publish 6379/16379 (cluster bus) to the internet. Redis is not safe to expose publicly even with a password.
- Authentication: replace the default open `default` user. Create per-service ACL users with minimal commands, key patterns, and channel patterns:

```
ACL SETUSER default off
ACL SETUSER api on >STRONG_RANDOM_SECRET ~shop:* &events:* +@read +@write +@connection -@dangerous -@admin
ACL SETUSER cache-ro on >SECRET2 ~shop:cache:* +get +mget +ttl +pttl +exists
ACL SETUSER admin on >SECRET3 ~* &* +@all
ACL SAVE        # persist to aclfile; or manage via ACL LOAD from file
ACL LOG         # denied commands, auth failures
```

  Selectors (7.0+) allow multiple permission sets per user. Block commands that app code never needs: `FLUSHALL`, `FLUSHDB`, `CONFIG`, `DEBUG`, `KEYS`, `SHUTDOWN`, `REPLICAOF`, and also `RESTORE`/`EVAL` where unused (recent Lua and `RESTORE` memory-safety CVEs; keep servers patched). Store passwords in a secret manager, rotate by adding a second password then removing the first.
- TLS: server `port 0`, `tls-port 6379`, `tls-cert-file`, `tls-key-file`, `tls-ca-cert-file`, `tls-auth-clients yes` (mTLS), `tls-protocols "TLSv1.2 TLSv1.3"`; also `tls-replication yes` and `tls-cluster yes` for replication and the cluster bus. Redis 8.6+ can map client certificates to ACL users. Clients: `rediss://` URLs; ioredis `tls: {}`; node-redis `socket: { tls: true }`; GLIDE `useTLS: true`. Verify the server certificate hostname.
- Patch cadence: Redis shipped a patch wave on 2026-09-17 (8.10.2, 8.8.3, 8.6.7, 8.4.7, 8.2.10; 8.10.2 is marked `SECURITY` urgency: ACL bypass for queued transactions, unauthenticated cluster bus warning) and Valkey shipped 9.1.2/9.0.6 on 2026-09-01. Read the notes, subscribe to upstream security advisories, and upgrade patches promptly.
- Logging: keys appear in `SLOWLOG`, `MONITOR`, and logs. Keep PII and secrets out of keys. Valkey `hide-user-data-from-log` and Redis `slowlog-entry-max-*` (8.8+) help.
- Managed services: use private networking/VPC endpoints, IAM or ACL auth, encryption in transit and at rest.
