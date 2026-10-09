# Operations: VACUUM, Settings, Backups, Replication, Upgrades

Table of contents: MVCC and VACUUM, autovacuum tuning, bloat and wraparound, baseline settings, monitoring, backups and PITR, replication and failover, upgrades.

## MVCC, VACUUM, and autovacuum

Updates and deletes leave dead row versions. `VACUUM` marks space reusable, updates the visibility map (index-only scans) and freezes old rows. `ANALYZE` refreshes planner stats. Autovacuum does both.

Defaults that matter (trigger = threshold + scale_factor x rows):
- Vacuum: `autovacuum_vacuum_threshold = 50`, `autovacuum_vacuum_scale_factor = 0.2` (20% dead rows). Insert-driven vacuum: `autovacuum_vacuum_insert_threshold = 1000`, `autovacuum_vacuum_insert_scale_factor = 0.2`. Analyze: 50 + 0.1.
- PG18 adds `autovacuum_vacuum_max_threshold` (caps the trigger on huge tables) and eager freezing (`vacuum_max_eager_freeze_failure_rate`, default 0.03). PG19 beta adds parallel index vacuum in autovacuum and table scoring.
- 20% on a 500M-row table means 100M dead rows before cleanup. Tune hot/large tables per table:

```sql
ALTER TABLE jobs SET (
  autovacuum_vacuum_scale_factor = 0.01,
  autovacuum_vacuum_insert_scale_factor = 0.02,
  autovacuum_analyze_scale_factor = 0.02,
  autovacuum_vacuum_cost_limit = 2000     -- more work per cycle for this table
);
```

- Global: raise `autovacuum_max_workers` (default 3; needs restart), `autovacuum_vacuum_cost_limit` (shared among workers), `maintenance_work_mem`/`autovacuum_work_mem`. Keep `autovacuum_naptime` default.
- `log_autovacuum_min_duration = 0` (or 1s) to see what it does.
- Fillfactor + HOT updates: for hot-update tables, `ALTER TABLE t SET (fillfactor = 85)` and avoid indexing frequently updated columns so updates stay HOT (no index writes).
- Don't disable autovacuum. For bulk loads use `COPY` then `VACUUM (ANALYZE)`.

## What blocks vacuum (the real bloat causes)

Dead rows cannot be removed while an old snapshot might see them. Find the holders:

```sql
-- Oldest transactions and idle-in-transaction sessions
SELECT pid, state, now() - xact_start AS age, left(query,80) FROM pg_stat_activity
WHERE xact_start IS NOT NULL ORDER BY xact_start LIMIT 10;
-- Replication slots holding back xmin / WAL
SELECT slot_name, active, restart_lsn, pg_size_pretty(pg_wal_lsn_diff(pg_current_wal_lsn(), restart_lsn)) AS retained FROM pg_replication_slots;
-- Forgotten prepared transactions
SELECT * FROM pg_prepared_xacts;
-- Dead tuples and last vacuum
SELECT relname, n_live_tup, n_dead_tup, last_autovacuum, last_autoanalyze FROM pg_stat_user_tables ORDER BY n_dead_tup DESC LIMIT 20;
```

Also: long-running replica queries with `hot_standby_feedback = on`.
Set `idle_in_transaction_session_timeout`, drop unused slots, cap `max_slot_wal_keep_size`.

## Bloat remediation

- Measure with `pgstattuple` (`pgstattuple_approx`) rather than heuristics.
- `VACUUM` only makes space reusable; the file rarely shrinks. `VACUUM FULL`/`CLUSTER` rewrite under `ACCESS EXCLUSIVE`. Online options: `pg_repack` extension; PG19 beta `REPACK` (and `REPACK CONCURRENTLY`). `REINDEX INDEX CONCURRENTLY` for indexes.
- Prevent: keep transactions short, tune autovacuum, avoid full-table `UPDATE`, batch deletes, partition queue/time-series tables and drop old partitions.

## Transaction ID wraparound

32-bit XIDs wrap; vacuum must freeze old rows. Monitor and alert:

```sql
SELECT datname, age(datfrozenxid) AS xid_age, mxid_age(datminmxid) AS mxid_age FROM pg_database ORDER BY 2 DESC;
SELECT c.oid::regclass, age(c.relfrozenxid) FROM pg_class c WHERE c.relkind IN ('r','m','t') ORDER BY 2 DESC LIMIT 10;
```

`autovacuum_freeze_max_age` (default 200M) forces an anti-wraparound vacuum; alert at ~50% of the 2.1B limit and investigate holders (above). If it approaches the limit, Postgres stops accepting writes. Emergency: run `VACUUM (FREEZE)` on the oldest tables, remove blockers.

## Baseline settings

Start from provider defaults, then adjust with evidence. Typical self-hosted starting points (tune to the box):

| Setting | Starting point | Why |
|---|---|---|
| `shared_buffers` | ~25% RAM | Page cache owned by Postgres |
| `effective_cache_size` | 50-75% RAM | Planner hint only |
| `work_mem` | 4-64MB | Per sort/hash node per query. `connections x nodes x work_mem` can OOM. Raise per role/session for reports. |
| `maintenance_work_mem` | 256MB-2GB | Index builds, vacuum |
| `max_connections` | 100-300 behind a pooler | More = more memory |
| `random_page_cost` | 1.1 on SSD | Planner favors indexes |
| `max_wal_size` / `checkpoint_timeout` | e.g. 8-32GB / 10-15min | Fewer checkpoints; watch `pg_stat_checkpointer` |
| `wal_compression` | `lz4`/`zstd` | Less WAL I/O |
| `idle_in_transaction_session_timeout` | 30s-60s | Kill stuck transactions |
| `statement_timeout` | per role (web: 5-30s) | Bound runaway queries |
| `log_min_duration_statement` | 500ms-1s | Slow query log |
| `track_io_timing` | on | I/O times in EXPLAIN and stats |
| `log_lock_waits`, `log_temp_files`, `log_checkpoints` | on | Diagnostics (lock waits log by default on PG19 beta) |
| `io_method` (PG18) | `worker` default; `io_uring` on supported Linux; `sync` = old behavior | Async I/O for seq scans, bitmap scans, vacuum |
| `jit` | consider off for OLTP | JIT is off by default in PG19 beta |
| `max_locks_per_transaction` | 64 (128 default in PG19 beta) | Raise for many partitions per transaction |

PG18 checksum default: `initdb` enables data checksums (check clusters you upgrade from).

## Monitoring essentials

- Connections by state, longest transaction, locks waiting, replication lag, WAL retained by slots, disk free, XID age, autovacuum activity and dead tuples, cache hit ratio per table (`pg_statio_user_tables`), `pg_stat_statements` top N, checkpoint stats, temp file usage, error rates by SQLSTATE.
- `pg_stat_io` (since PG16) for I/O by backend type; `pg_stat_wal`, `pg_stat_bgwriter`/`pg_stat_checkpointer`.
- Use a monitoring role (`pg_monitor`), exporters or provider dashboards; alert on symptoms (p95 latency, lock waits, disk, XID age).

## Backups and PITR

Two layers, test both:

1. **Logical**: `pg_dump -Fc -f app.dump appdb` / `pg_restore -d newdb app.dump` (`-j N` parallel). Good for single DB/table moves, cross-major upgrades of small DBs, and schema review. Not a point-in-time recovery tool; slow on large data. Dump `pg_dumpall --globals-only` for roles.
2. **Physical + WAL archive (PITR)**: periodic base backup plus continuous WAL archiving restores to any moment (for example just before a bad `DELETE`).
   - Enable `wal_level = replica`, `archive_mode = on`, `archive_command` / `archive_library` that reliably copies WAL to durable object storage (check exit code; a failing archiver fills the disk).
   - Base backups: `pg_basebackup` or a tool: **pgBackRest** (2.59.3 observed 2026-10-04) or **Barman** (3.20.1) for retention, compression, parallelism, encryption, verification. PG17 adds incremental backup (`summarize_wal = on`, `pg_basebackup --incremental`, `pg_combinebackup`).
   - Restore: restore base backup, set `restore_command`, `recovery_target_time` (or `recovery_target_lsn`/`_xid`/named point), create `recovery.signal`, start, verify, then promote (`recovery_target_action = promote`).
- Define RPO/RTO; time a full restore on a production-sized copy regularly; alert on archive lag; store backups in another account/region; protect them from deletion (object lock); encrypt.
- Managed services: confirm automated backups, retention window, PITR granularity, cross-region copies, and how restore creates a new instance. Practice the restore procedure and app cutover.
- Backups do not protect from logical corruption you do not notice for weeks; keep long-retention snapshots for that.

## Replication and failover basics

- **Streaming (physical) replication**: byte-for-byte replica of the whole cluster. Hot standby serves read-only queries. Async by default: replicas lag; sync (`synchronous_standby_names`, `synchronous_commit = on|remote_write|remote_apply`) trades latency for zero data loss.
- Replica read pitfalls: stale reads (read-your-writes violations), query conflicts with replay (`max_standby_streaming_delay`, `hot_standby_feedback`), lag spikes after bulk writes. Route reads that must see a user's own write to the primary, or wait for an LSN (PG19 beta adds a `WAIT` command for this).
- Monitor `pg_stat_replication` (`write_lag`, `flush_lag`, `replay_lag`), `pg_stat_wal_receiver`, slots retained size.
- **Replication slots** guarantee WAL retention; an abandoned slot fills the primary's disk. Set `max_slot_wal_keep_size`.
- **Logical replication**: publications/subscriptions per table, across major versions and for CDC/zero-downtime upgrades. Needs primary keys (replica identity). DDL is not replicated (apply schema changes on both sides first); sequences are not replicated before PG19 beta (`ALL SEQUENCES`). PG17 slot failover and `pg_createsubscriber`; PG18 subscription default `streaming = parallel`.
- **Failover**: use orchestration (Patroni, managed service, operator). Avoid manual promotion without fencing the old primary (split-brain). Apps need DNS/proxy to the new primary, retry on connection loss, and `max_lifetime` to cycle connections.
- Pooler/proxy health checks should detect `pg_is_in_recovery()`.

## Upgrades

- **Minor** (18.5 -> 18.6): binaries only; restart; low risk; apply promptly (security). Read release notes for steps (rare reindex notes).
- **Major** (17 -> 18): `pg_upgrade` (use `--link` for speed, with a tested rollback), dump/restore, or logical replication for near-zero downtime. PG18 `pg_upgrade` keeps optimizer statistics (not extended stats): run `ANALYZE` for extended stats. Run `vacuumdb --all --analyze-in-stages` where needed on older versions.
- Pre-flight: extension versions available on the target, removed settings, reindex needs (collation provider changes, PG18 FTS/trigram note), `md5` passwords (SCRAM migration), PG18 FK collation rules (deterministic or same nondeterministic collation, or restore fails), checksums mismatch (`initdb --no-data-checksums` if the old cluster has none), driver compatibility, plan changes (compare top queries from `pg_stat_statements`).
- PG14 reaches EOL 2026-11-12. Plan upgrades before EOL. PG19 beta: `standard_conforming_strings` always on, JIT off by default, `btree_gist` `inet`/`cidr` indexes block `pg_upgrade` until recreated, names with CR/LF disallowed, `MULE_INTERNAL` removed. Do not run beta in production.
