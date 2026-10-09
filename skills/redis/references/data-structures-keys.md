# Data Structures, Key Design, TTLs, Version Gates

## Pick the Structure

| Need | Use | Notes |
| --- | --- | --- |
| Opaque value, counter, flag, cache blob, lock | **String** | `SET k v EX s`, `INCR`, `GETEX`, `GETDEL`, `SET ... NX`. Max 512 MB, keep values small |
| Object with fields, partial reads/updates | **Hash** | `HSET`, `HGET`, `HMGET`, `HINCRBY`, `HGETALL` (small only). Small hashes use compact listpack encoding. Per-field TTL available (below) |
| Queue/stack, recent-N feed | **List** | `LPUSH`/`RPOP`, `LMOVE`/`BLMOVE`, `LTRIM`. Not a reliable job queue by itself |
| Unique members, tags, membership | **Set** | `SADD`, `SISMEMBER`, `SINTER`, `SSCAN`. `SMEMBERS` only on small sets |
| Ranking, time index, delayed work, sliding windows | **Sorted set** | `ZADD`, `ZRANGE ... REV`, `ZRANK`, `ZINCRBY`, `ZREMRANGEBYSCORE`, `ZRANGEBYSCORE` via `ZRANGE BYSCORE` |
| Durable log, consumer groups, event bus | **Stream** | `XADD`, `XREADGROUP`, `XACK`, `XAUTOCLAIM`, `XTRIM`. See [messaging-scripting.md](messaging-scripting.md) |
| Nested documents, partial JSON updates | **JSON** (built into Redis 8; `valkey-json` module for Valkey) | `JSON.SET`, `JSON.GET path`. Prefer hashes when flat. JSON string in a plain `SET` when you only read/write whole values |
| Boolean per integer id (DAU, feature flags) | **Bitmap** | `SETBIT`, `GETBIT`, `BITCOUNT`, `BITOP`, `BITFIELD`. Memory scales with highest offset, so avoid sparse huge ids. Redis 8.2 added `BITOP DIFF/DIFF1/ANDOR/ONE` |
| Approx distinct count | **HyperLogLog** | `PFADD`, `PFCOUNT`, `PFMERGE`. ~12 KB, ~0.8% error. Cannot list members |
| Membership/frequency/top-k/quantiles approx | **Bloom, Cuckoo, Count-min, Top-k, t-digest** | Built into Redis 8, `valkey-bloom` for Valkey |
| Geo lookup | **Geo (sorted set)** | `GEOADD`, `GEOSEARCH` |
| Time series | **TimeSeries** (Redis 8) | `TS.ADD`, `TS.RANGE` with aggregators |
| Embedding similarity with simple filters | **Vector set** (Redis 8.0+, introduced as beta, check docs for current status) | `VADD`, `VSIM`, `VSETATTR`, `VREM`, `VCARD`. Use `FILTER` on JSON attributes. For rich hybrid search use the Redis query engine (`FT.CREATE`, `FT.SEARCH`, `FT.HYBRID`) |
| Sparse index-addressed sequence | **Array** (Redis 8.8 new) | `ARSET`, `ARGET`. New and Redis-only, evaluate before relying |

Rules of thumb:

- Many small fields on one entity: one hash per entity, not one string per field. Many small hashes: watch per-key overhead; Redis 8.10 compact hashes cut memory when many hashes share a field schema (read release docs before relying; Redis-only).
- Collections must be bounded: cap with `LTRIM`, `ZREMRANGEBYRANK`, stream `XTRIM`, or TTL. Unbounded collections become big keys.
- Redis has no secondary indexes without the query engine. Maintain index sets/sorted sets yourself, or use `FT.*` / `valkey-search`.
- Store serialized JSON with a schema version when using string blobs; compression only above a size threshold.
- Use `HSET` with multiple field/value pairs in one call. Use `MGET`/`MSET` (or a pipeline) rather than N round trips.

## Hash-Field TTL

Per-field expiry on hashes: Redis 7.4+, Valkey 9.0+.

```
HEXPIRE key 3600 [NX|XX|GT|LT] FIELDS 2 f1 f2    # also HPEXPIRE, HEXPIREAT, HPEXPIREAT
HTTL key FIELDS 1 f1                              # -2 field missing, -1 no TTL
HPERSIST key FIELDS 1 f1
HSETEX key [FNX|FXX] [EX s|PX ms|EXAT|PXAT|KEEPTTL] FIELDS 2 f1 v1 f2 v2   # Redis 8.0+, Valkey 9.0+
HGETEX key [EX|PX|EXAT|PXAT|PERSIST] FIELDS 1 f1                          # Redis 8.0+, Valkey 9.0+
HGETDEL key FIELDS 1 f1                           # Redis 8.0+, Valkey 9.1+
```

Use it for: per-device tokens in one hash, per-feature caches under one entity key, short-lived sub-entries (OTP codes per user). Do not use it to replace key TTL: the whole key stays until its own TTL or last field expiry. Field expiry has memory overhead and the key still counts as a big key if wide. Redis 8.8 adds field-level keyspace notifications.

## Version Gates (Redis vs Valkey)

| Capability | Redis | Valkey | Portable fallback |
| --- | --- | --- | --- |
| Hash-field TTL (`HEXPIRE`, `HTTL`) | 7.4 | 9.0 | Separate keys or sorted-set expiry index |
| `HGETEX`, `HSETEX` | 8.0 | 9.0 | `HSET` + `HEXPIRE` in `MULTI` |
| `HGETDEL` | 8.0 | 9.1 | Lua or `MULTI` with `HGET`+`HDEL` |
| `MSETEX` (multi-set with shared TTL) | 8.4 | 9.1 | Pipeline `SET ... EX` |
| `SET ... IFEQ/IFNE/IFDEQ/IFDNE`, `DELEX`, `DIGEST` | 8.4 | `SET IFEQ` 8.1, `DELIFEQ` 9.0 (`IFNE` reported for 9.2) | Lua compare-and-set/delete |
| `XREADGROUP ... CLAIM` | 8.4 | not documented | `XAUTOCLAIM` loop |
| `XDELEX`, `XACKDEL` | 8.2 | not documented | `XACK` + `XDEL` |
| `XADD ... IDMP/IDMPAUTO` idempotent adds | 8.6 | not documented | App-side dedupe key |
| `XNACK` | 8.8 | not documented | Let pending entries idle then `XAUTOCLAIM` |
| `INCREX` (bounded counter + expiry) | 8.8 | no | Lua or `INCR` + `EXPIRE NX` |
| `HOTKEYS` | 8.6 | no | `redis-cli --hotkeys` with LFU policy |
| `volatile-lrm` / `allkeys-lrm` | 8.6 | no | LRU/LFU |
| Vector sets, Array | 8.0 / 8.8 | no (`valkey-search` for vectors) | Module or external vector DB |
| Atomic slot migration | 8.4 | 9.0 | n/a (ops) |
| Numbered DBs in cluster mode | no | 9.0 | n/a |
| `CLUSTERSCAN` | no | 9.1 | per-node `SCAN` |
| Built-in JSON/Search/TimeSeries/Bloom | 8.0 | modules via `valkey-bundle` (json, bloom, search, ldap) | n/a |
| Licence | RSALv2 / SSPLv1 / AGPLv3 (8.0+) | BSD-3-Clause | n/a |

Detect at runtime when one codebase targets both: `INFO server` returns `redis_version` and, on Valkey, `server_name:valkey` and `valkey_version`. Treat `redis_version` on Valkey as the compatibility floor (7.2.4), not the real version. Gate Redis-8 commands on `server_name`.

## Key Naming

- Pattern: `{app}:{env?}:{entity}:{id}[:{attr}]`, colon separated, lowercase, stable. Example `shop:cart:u_123`, `shop:cache:v3:product:42`. Environment usually lives in a separate instance or ACL prefix rather than the key.
- Schema/version token in cache keys (`v3`) lets you invalidate a whole class by bumping the version without scanning.
- Put high-cardinality ids last. Never put unbounded user input directly in keys without length and charset limits. Hash long inputs (SHA-256, truncated) for query-keyed caches.
- Keep keys short but readable. Thousands of long prefixes cost memory at scale; millions of keys with 60-byte names cost real RAM.
- Centralize key builders in one module. Do not string-concatenate keys in handlers.
- Cluster: use `{tag}` only when several keys must share a slot (`{order:42}:items`, `{order:42}:lock`). The tag is the substring between the first `{` and next `}`. Avoid a single tag for a whole tenant if the tenant is large.
- ACL prefix isolation: give each service a key pattern (`~shop:*`) and optionally channel patterns (`&events:*`).
- Do not store secrets or raw PII in key names.

## TTL Discipline

- Every cache and ephemeral key sets TTL at write time: `SET k v EX 300` (atomic), not `SET` then `EXPIRE`. `SET` without `KEEPTTL` removes an existing TTL.
- Add jitter: `ttl = base + random(0..base*0.1)` to avoid synchronized expiry waves.
- Counters: set expiry on creation only (`EXPIRE k 60 NX`, 7.0+, or `INCREX ... ENX` on Redis 8.8+). `INCR` then `EXPIRE` unconditionally extends windows.
- `TTL`/`PTTL` return `-1` (no expiry) and `-2` (missing). Audit for `-1` keys via sampled `SCAN`.
- `EXPIRE` flags: `NX` (only if none), `XX`, `GT`, `LT`. `GETEX k EX 60` extends on read (sliding TTL).
- Expiry is lazy + sampled active: expired keys can still occupy memory for a while. `INFO stats` `expired_keys`, `INFO keyspace` `expires` and `avg_ttl` show the picture.
- Deleting big keys: `UNLINK` (async free), not `DEL`.
- Persistent data and cache data should not share an instance when avoidable. If they do, give cache keys TTL and use a `volatile-*` policy, or run two instances.
