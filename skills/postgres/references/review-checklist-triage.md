# Review Checklist and Slow-Query Triage

Table of contents: schema review, query review, migration review, operations review, slow-query triage runbook, incident quick checks.

## Review checklist

Use the relevant sections when reviewing a PR, schema, or migration. Cite evidence (EXPLAIN output, lock level) for each finding.

### Schema
- [ ] PKs defined; `identity` or `uuidv7()`; no new `serial`; no random UUID PKs on large insert-heavy tables without reason.
- [ ] `timestamptz` for instants; `numeric`/integer minor units for money; `text` not `varchar(n)`; `boolean NOT NULL DEFAULT`.
- [ ] `NOT NULL`, `CHECK`, `UNIQUE`, FK constraints enforce the real invariants; `ON DELETE` is deliberate.
- [ ] FK columns indexed; composite indexes ordered equality-first; no redundant or unused indexes added.
- [ ] JSONB only for sparse/external data; hot keys promoted to columns; GIN/expression index justified.
- [ ] Enums/lookup/CHECK choice fits how often values change.
- [ ] Generated columns explicit (`STORED` when indexed; PG18 `VIRTUAL` not indexable).
- [ ] Multi-tenant tables have `tenant_id` first in indexes and RLS or equivalent guard.
- [ ] Soft delete handled with partial unique indexes; retention plan for growing tables (partitioning/archival).

### Queries
- [ ] Parameterized; identifiers allowlisted; no string-built SQL.
- [ ] No N+1; arrays via `= ANY($1)`; no `SELECT *` on hot paths.
- [ ] Keyset pagination with unique tiebreaker; no deep `OFFSET`; no unbounded result sets.
- [ ] `EXPLAIN (ANALYZE, BUFFERS)` attached for new/changed hot queries on realistic data; estimates vs actuals sane.
- [ ] Read-modify-write races handled (atomic `UPDATE`, `FOR UPDATE`, unique constraint + `ON CONFLICT`, or Serializable with retry).
- [ ] Transactions are short, no external I/O inside, consistent lock order; retry on `40001`/`40P01`.
- [ ] Timeouts: `statement_timeout`, `lock_timeout` where appropriate; `idle_in_transaction_session_timeout` set on roles.
- [ ] Bulk operations batched; `COPY`/`unnest` for bulk insert; parameter limit (65,535) respected.
- [ ] Queue workers use `SKIP LOCKED` with idempotent handlers, attempts cap, reaper.

### Migrations
- [ ] Lock level and rewrite stated for each statement ([migrations-zero-downtime.md](migrations-zero-downtime.md)).
- [ ] `lock_timeout` set; retry strategy; runs outside transaction when `CONCURRENTLY`.
- [ ] Indexes `CONCURRENTLY`; constraints `NOT VALID` then `VALIDATE`; no `INVALID` leftovers.
- [ ] Backfill batched, resumable, throttled; not inside the DDL transaction.
- [ ] Expand/contract with both app versions compatible; destructive drops in a later release.
- [ ] Tested on production-shaped copy; rollback plan documented.

### Access and security
- [ ] App role is not owner/superuser/`BYPASSRLS`; DML-only grants; default privileges set.
- [ ] SCRAM, TLS `verify-full`, no public exposure, secrets not in logs.
- [ ] RLS: `ENABLE` + `FORCE`, policies have `USING` and `WITH CHECK`, tested with the app role.

### Connections and clients
- [ ] One pool per process; `max` x instances within `max_connections`; pool error listener attached.
- [ ] Pooler mode compatible: no session `SET`, session advisory locks, `LISTEN`, or unsupported prepared statements behind transaction pooling.
- [ ] Graceful shutdown closes pools; serverless uses tiny pools or pooler endpoint.
- [ ] Type handling tested: `int8`, `numeric`, `date`, `timestamptz`, JSON.

### Operations
- [ ] Autovacuum tuned for hot/large tables; no long idle-in-transaction sessions; slots monitored.
- [ ] XID age and bloat monitored; alerts exist.
- [ ] Backups + WAL archiving verified by a recent restore drill; RPO/RTO known.
- [ ] Replica lag handled in app reads; failover plan tested.
- [ ] Version support: current minor applied; EOL dates tracked.

## Slow-query triage procedure

Run in order. Stop when the cause is found. Record evidence at each step.

1. **Confirm and scope.** Is it one query, one endpoint, or everything? When did it start (deploy, data growth, traffic, config, autovacuum)? Compare against `pg_stat_statements` top by `total_exec_time` and by `mean_exec_time`; check `stats_since`.
2. **Is it the database at all?** Check app-side time vs `pg_stat_statements.mean_exec_time`, pool wait (`connectionTimeoutMillis` errors, `cl_waiting` in PgBouncer), N+1 (`calls` huge). If DB time is small, fix the app or pool.
3. **Is it waiting?** Look at `pg_stat_activity` (`wait_event_type`, `wait_event`, `state`, `pg_blocking_pids`).
   - `Lock` -> find the blocker ([queries-transactions-locking.md](queries-transactions-locking.md)); often an idle-in-transaction session or a migration waiting on `ACCESS EXCLUSIVE`.
   - `IO` -> cache misses, seq scans, checkpoints, autovacuum. Check `pg_stat_io`, `Buffers: shared read`.
   - `LWLock`/`BufferContent`/`LockManager` spikes -> too many connections, too many partitions/locks (`max_locks_per_transaction`), hot rows.
   - `Client` -> app is slow consuming rows; transaction held open.
4. **Capture the plan.** Get real parameters (log, `auto_explain`, `pg_stat_statements` + sampled values). Run `BEGIN; EXPLAIN (ANALYZE, BUFFERS, SETTINGS) ...; ROLLBACK;` against production-like data. Prepared statements: also check the generic plan (`EXPLAIN (GENERIC_PLAN)`) and `plan_cache_mode`.
5. **Read the plan** ([indexes-explain.md](indexes-explain.md)): estimated vs actual rows; scan type; `Rows Removed by Filter`; sort/hash spills; `loops` x time; buffers read/temp; heap fetches; partitions touched.
6. **Fix in this order** (cheapest, safest first):
   1. Stats: `ANALYZE`; raise statistics target; `CREATE STATISTICS` for correlated columns.
   2. Query shape: remove functions on indexed columns, fix type mismatches, push filters down, replace `OFFSET` with keyset, replace `IN (subquery)`/correlated subquery with join or `EXISTS`, avoid `SELECT *`, limit `OR` across columns (use `UNION ALL`), batch N+1.
   3. Index: add the right composite/partial/covering index `CONCURRENTLY`; drop one it replaces.
   4. Data volume: archive/partition old data; summarize with materialized views or rollup tables.
   5. Config for a role/session: `work_mem` bump for a report role; `random_page_cost`; `jit = off` for OLTP.
   6. Hardware/pooler/replica routing, only with evidence.
7. **Verify.** Re-run `EXPLAIN (ANALYZE, BUFFERS)`; compare buffers and time; load test the endpoint; watch `pg_stat_statements` after `pg_stat_statements_reset(0,0,queryid)`; confirm the new index is used (`idx_scan`) and writes did not regress.
8. **Guard.** Add a regression test or alert (query budget, p95, timeouts), and document the index's purpose in the migration.

## Incident quick checks

```sql
-- 1. Connections and states
SELECT state, count(*) FROM pg_stat_activity GROUP BY 1 ORDER BY 2 DESC;
-- 2. Blocked and blockers
SELECT pid, pg_blocking_pids(pid) AS blockers, wait_event, left(query,80) FROM pg_stat_activity WHERE cardinality(pg_blocking_pids(pid)) > 0;
-- 3. Longest running
SELECT pid, now() - query_start AS runtime, state, left(query,80) FROM pg_stat_activity WHERE state <> 'idle' ORDER BY query_start LIMIT 10;
-- 4. Cache hit ratio and temp use
SELECT datname, round(100.0 * blks_hit / nullif(blks_hit + blks_read, 0), 2) AS hit_pct, temp_files, deadlocks FROM pg_stat_database;
-- 5. Replication lag
SELECT application_name, state, replay_lag FROM pg_stat_replication;
-- 6. XID age
SELECT datname, age(datfrozenxid) FROM pg_database ORDER BY 2 DESC;
```

Cancel with `pg_cancel_backend(pid)` first; `pg_terminate_backend(pid)` if needed. Prefer fixing the blocker's cause over killing repeatedly. Disk full: check WAL retained by slots and failing `archive_command` before deleting anything under `pg_wal` by hand (never delete WAL files manually).
