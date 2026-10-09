# Source Map

Snapshot date: 2026-10-09.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, version-gated commands, client upgrades, licensing, and security patches.

## Research Snapshot

- Context7 libraries used: `/redis/docs`, `/redis/node-redis`, `/redis/ioredis` (versions `v5_4_0`, `v6.0.0`), `/websites/glide_valkey_io`, `/valkey-io/valkey-glide`, `/websites/upstash_redis`, `/websites/upstash_redis_sdks_ratelimit-`, `/websites/valkey_io`.
- Servers (GitHub releases, 2026-10-09):
  - Redis Open Source `8.10.2` (2026-09-17, urgency SECURITY). Parallel patches 8.8.3, 8.6.7, 8.4.7, 8.2.10 same day. 8.10.0 GA 2026-07-29, 8.8.0 GA 2026-05-25, 8.6.0 GA 2026-02-10, 8.4.0 GA 2025-11-18, 8.2.0 GA 2025-08-04, 8.0.0 GA 2025-05-02. No 9.x tag seen.
  - Valkey `9.1.2` and `9.0.6` (2026-09-01), `8.1.10`/`8.0.11` maintenance, `9.2.0-rc1` (2026-09-16, pre-release). 9.1.0 GA 2026-05-19. 9.0.0 GA 2025-10-21.
- Licensing facts: Redis 8.0 release notes (tri-license RSALv2 / SSPLv1 / AGPLv3; "Redis Community Edition" renamed "Redis Open Source"); Valkey `COPYING` is BSD 3-Clause (Valkey contributors + Redis Ltd. 2006-2020). Redis 7.4-7.x RSALv2/SSPLv1 and pre-7.4 BSD are background knowledge, not re-fetched.
- npm (registry, 2026-10-09):
  - `redis` `6.3.0` (2026-09-30), `@redis/client` `6.3.0`, `@redis/json|search|bloom|time-series` `6.3.0`; Node >= 20
  - `ioredis` `6.0.0` (2026-07-31), Node >= 20; `latest` was 5.11.1 before; `release-v4` tag 4.31.0
  - `iovalkey` `0.4.0` (2026-07-27), Node >= 18.12
  - `@valkey/valkey-glide` `2.5.3` (2026-09-24), Node >= 16
  - `@upstash/redis` `1.39.0` (2026-09-21), `@upstash/ratelimit` `2.2.0` (2026-09-23)
  - `redlock` `5.0.0-beta.2` (2022-03-06)
  - `bun-types` `1.4.2`; Bun release `bun-v1.4.2` (2026-09-05)

Client release notes that change guidance:

- node-redis 6.0.0 (2026-05-28): RESP3 default, Node 20 minimum, `keepAliveInitialDelay` 30 s, `commandOptions.timeout` 5 s, Redis 8.8 coverage. Migration doc `docs/v5-to-v6.md` at tag `redis@6.0.0`.
- node-redis 6.1.0: key prefixing, `cluster.getNodeClientForKey` for WATCH/MULTI/EXEC. 6.2.0: cluster request/response policies (cross-slot split, fan-out, cluster-wide `SCAN`), raw `sendCommand` behavior change. 6.2.0-beta: Redis 8.10 commands (`LMOVEM`, `SUNIONCARD`, `HIMPORT` experimental).
- ioredis 6.0.0: RESP3 default (`protocol: 2` keeps v5), Node 20; Redis 8.10 commands; 5.11.0 added Array, `INCREX`, `MSETEX`, `XNACK`, vector set commands, `TracingChannel`. The 5.11 changelog also lists "typed GCRA command support"; no matching `GCRA` command was found in the `redis/redis` command definitions (unstable, 8.10), so treat it as unverified.

## Redis Documentation

- Release notes (GitHub): https://github.com/redis/redis/releases
- Release notes index: https://redis.io/docs/latest/operate/oss_and_stack/stack-with-enterprise/release-notes/
- What's new in 8.8: https://redis.io/docs/latest/develop/whats-new/8-8/
- Commands: https://redis.io/docs/latest/commands/
  - SET: https://redis.io/docs/latest/commands/set/
  - DELEX: https://redis.io/docs/latest/commands/delex/
  - INCREX: https://redis.io/docs/latest/commands/increx/
  - XADD: https://redis.io/docs/latest/commands/xadd/
  - HOTKEYS START: https://redis.io/docs/latest/commands/hotkeys-start/
- Key eviction (incl. LRM): https://redis.io/docs/latest/develop/reference/eviction/
- Client-side caching: https://redis.io/docs/latest/develop/clients/client-side-caching/
- Vector sets: https://redis.io/docs/latest/develop/data-types/vector-sets/
- Data types: https://redis.io/docs/latest/develop/data-types/
- Streams: https://redis.io/docs/latest/develop/data-types/streams/
- Distributed locks (Redlock): https://redis.io/docs/latest/develop/clients/patterns/distributed-locks/
- Persistence: https://redis.io/docs/latest/operate/oss_and_stack/management/persistence/
- Replication: https://redis.io/docs/latest/operate/oss_and_stack/management/replication/
- Sentinel: https://redis.io/docs/latest/operate/oss_and_stack/management/sentinel/
- Cluster: https://redis.io/docs/latest/operate/oss_and_stack/management/scaling/
- Security / ACL: https://redis.io/docs/latest/operate/oss_and_stack/management/security/
- TLS: https://redis.io/docs/latest/operate/oss_and_stack/management/security/encryption/
- Latency diagnosis: https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/latency/
- Memory optimization: https://redis.io/docs/latest/operate/oss_and_stack/management/optimization/memory-optimization/
- Programmability (Lua, Functions): https://redis.io/docs/latest/develop/programmability/
- Node.js clients: https://redis.io/docs/latest/develop/clients/nodejs/
- node-redis docs: https://github.com/redis/node-redis/tree/master/docs
- ioredis: https://github.com/redis/ioredis

Operational pages in this list (persistence, replication, Sentinel, Cluster, security, TLS, latency, memory optimization, programmability, data types, streams, distributed locks) are canonical doc paths used from background knowledge and were not re-fetched in this snapshot. Command pages for SET, DELEX, INCREX, XADD, HOTKEYS, the eviction page, the client-side caching page, the vector sets page, and the 8.8 what's-new page were fetched.

## Valkey Documentation

- Site: https://valkey.io/
- Valkey 9.0 announcement: https://valkey.io/blog/introducing-valkey-9/
- Valkey 9.1 announcement: https://valkey.io/blog/valkey-9-1-delivers-improvements-in-security-performance-and-more/
- Release notes (GitHub): https://github.com/valkey-io/valkey/releases
- Commands: https://valkey.io/commands/ (`DELIFEQ`, `SET`, `HGETDEL`, `MSETEX`, `CLUSTERSCAN`)
- Distributed locks: https://valkey.io/topics/distlock/
- Valkey Bundle (json, bloom, search, ldap modules): https://valkey.io/topics/valkey-bundle/
- GLIDE docs: https://glide.valkey.io/ (Node.js API: https://glide.valkey.io/languages/nodejs/api)
- GLIDE repository: https://github.com/valkey-io/valkey-glide
- iovalkey: https://github.com/valkey-io/iovalkey

## Bun

- Bun Redis client: https://bun.com/docs/runtime/redis
- Bun releases: https://github.com/oven-sh/bun/releases

## Upstash

- Redis SDK (TypeScript): https://upstash.com/docs/redis/sdks/ts/overall
- Pipelining and transactions: https://upstash.com/docs/redis/sdks/ts/pipelining/pipeline-transaction
- Auto-pipelining: https://upstash.com/docs/redis/sdks/ts/pipelining/auto-pipeline
- Rate limit SDK: https://upstash.com/docs/redis/sdks/ratelimit-ts/overview
- Compatibility: https://upstash.com/docs/redis/overall/rediscompatibility (protocol support up to Redis 8.4 at snapshot)

## Background Reading (opinions, not specs)

- Kleppmann, "How to do distributed locking" and the Redlock author's reply: the Redlock safety debate summarized in the lock guidance.
- Brandur, "Rate Limiting, Cells, and GCRA": https://brandur.org/rate-limiting

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current versions, licensing, or an upgrade plan (`bun pm ls`, `bun info <pkg>`, GitHub releases).
- The task depends on a Redis 8.x-only command (`INCREX`, `DELEX`, `MSETEX`, `HOTKEYS`, `XNACK`, `IDMP`, vector sets, Array, compact hashes `HIMPORT`) or on Valkey parity for it.
- A Redis 9.x or Valkey 9.2 GA appears (not present at this snapshot).
- The project upgrades ioredis or node-redis across a major (RESP3 reply shapes), or adopts GLIDE batching/client-side caching.
- Production incidents involve cluster bus security, ACL behavior inside `MULTI`, or `RESTORE`/Lua memory-safety advisories.
- Observed server behavior disagrees with this skill text: prefer `INFO server`, `COMMAND DOCS`, and the lockfile over memory.
