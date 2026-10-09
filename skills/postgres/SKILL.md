---
name: postgres
description: "Design, query, tune, migrate, review, and operate PostgreSQL 18 (18.6 stable; 19 in beta) from TypeScript apps. Use for schema design and types (uuidv7(), identity vs serial, timestamptz, numeric, jsonb, enums vs lookup tables, generated columns virtual/stored, text vs varchar), constraints (CHECK, FK, EXCLUDE, WITHOUT OVERLAPS, NOT VALID), index choice (btree, partial, expression, covering INCLUDE, GIN, GiST, BRIN, multicolumn order, skip scan), EXPLAIN (ANALYZE, BUFFERS), pg_stat_statements, slow-query triage, N+1, keyset vs offset pagination, upsert/MERGE/RETURNING, transactions, isolation levels, 40001/40P01 retries, locks, deadlocks, FOR UPDATE SKIP LOCKED queues, advisory locks, zero-downtime migrations (lock levels, CREATE INDEX CONCURRENTLY, NOT VALID + VALIDATE, lock_timeout, backfills, expand/contract), full-text search, pg_trgm, pgvector, pg_cron, partitioning, row-level security, roles and least privilege, PgBouncer transaction mode, serverless pooling, VACUUM/autovacuum/bloat/wraparound, pg_dump, PITR/WAL archiving/pgBackRest, streaming and logical replication, and the postgres.js, node-postgres (pg), and Bun.SQL clients (Drizzle named only as a library)."
---

# PostgreSQL

Use this skill for PostgreSQL schema design, SQL, query tuning, migrations, locking, pooling, and operations driven from TypeScript apps. It is ORM-agnostic: it names Drizzle and others as libraries only, and gives plain SQL plus `postgres.js`, `pg`, and `Bun.SQL` snippets.

Snapshot: PostgreSQL **18.6** is the current stable major (18.0 on 2025-09-25, EOL 2030-11-14); **19** is in beta 4 (2026-09-24). Supported: 14.24 (EOL 2026-11-12), 15, 16, 17, 18. Clients: `postgres@3.4.9`, `pg@8.23.1`, Bun 1.4 `Bun.SQL`. Refresh from [source-map.md](references/source-map.md) if the server or driver differs.

## Workflow

1. Inspect first. Do not guess the environment:
   - Server major/minor (`SHOW server_version;`), hosting (self-hosted vs managed), allowed extensions (`pg_available_extensions`), and whether a pooler (PgBouncer, provider pooler) sits in front.
   - Driver and pool: `postgres`, `pg`, `Bun.SQL`, or an ORM/query builder on top; pool `max` times instance count; prepared-statement and timeout settings.
   - Existing schema, migrations folder, and the migration runner (does it wrap each file in a transaction? `CONCURRENTLY` cannot run inside one).
   - Table sizes and traffic for the touched tables. A DDL that is safe on 10k rows can take an outage on 500M.
2. Gate on version. Features need PG18 (`uuidv7()`, virtual generated columns, `NOT NULL ... NOT VALID`, `WITHOUT OVERLAPS`, `RETURNING OLD/NEW`, skip scan, `BUFFERS` default in `EXPLAIN ANALYZE`). Offer a PG14-17 fallback when the project is not on 18.
3. Route to the focused reference:
   - Types, keys, constraints, JSONB, enums, generated columns: [schema-types-constraints.md](references/schema-types-constraints.md).
   - Index choice, `EXPLAIN`, `pg_stat_statements`, stats, planner: [indexes-explain.md](references/indexes-explain.md).
   - Pagination, N+1, upsert, transactions, isolation, locks, queues: [queries-transactions-locking.md](references/queries-transactions-locking.md).
   - Zero-downtime DDL, lock levels, backfills, expand/contract: [migrations-zero-downtime.md](references/migrations-zero-downtime.md).
   - Full-text search, trigram, partitioning: [search-partitioning.md](references/search-partitioning.md).
   - Roles, privileges, RLS, TLS, auth: [security-rls-roles.md](references/security-rls-roles.md).
   - Drivers, pooling, PgBouncer, serverless, error handling: [clients-pooling-ts.md](references/clients-pooling-ts.md).
   - VACUUM, bloat, settings, backups, PITR, replication, upgrades: [operations-vacuum-backup-replication.md](references/operations-vacuum-backup-replication.md).
   - pg_trgm, pgvector, pg_cron, pg_partman, others: [extensions.md](references/extensions.md).
   - Review checklist and slow-query triage runbook: [review-checklist-triage.md](references/review-checklist-triage.md).
4. Prefer evidence over folklore: run `EXPLAIN (ANALYZE, BUFFERS)` on realistic data, read `pg_stat_statements`, and check `pg_locks`/`pg_stat_activity` before changing indexes, settings, or code.
5. Preserve the project's migration runner, naming, and schema conventions unless asked to change them. Show the SQL for any DDL and state its lock level and rewrite behavior.

## Core Judgment

- Let the database enforce invariants: `NOT NULL`, `CHECK`, `UNIQUE`, foreign keys, exclusion constraints. App-only validation races.
- Keys: `bigint GENERATED ALWAYS AS IDENTITY` or `uuid DEFAULT uuidv7()` (PG18). Avoid `serial` in new schemas and random UUIDv4 PKs on large insert-heavy tables (poor index locality, more WAL).
- Time: `timestamptz` always; never `timestamp` for instants. Money: `numeric` or integer minor units, never `float`. Strings: `text` (plus `CHECK` for length), not `varchar(n)`/`char(n)`.
- JSONB for sparse or external-shaped data, not for core relational columns you filter, join, or constrain on.
- Every foreign key needs an index on the referencing column (Postgres does not create one). Index for the queries you run; drop unused and duplicate indexes (check replicas before dropping).
- Never interpolate user input into SQL. Use parameters (`$1`, tagged templates). Identifiers need `format('%I')`, a driver identifier helper, or an allowlist.
- Fix N+1 in SQL: one query with `= ANY($1)`, a join, or `json_agg`/lateral, not one query per row.
- Paginate with keyset `(created_at, id) < ($1, $2)` plus a matching index. `OFFSET` cost grows with depth and drifts under writes.
- Keep transactions short. No network calls, user waits, or `await` on slow work while holding a transaction or row locks. Set `idle_in_transaction_session_timeout`.
- Retry on `40001` (serialization failure) and `40P01` (deadlock) with the whole transaction. Take locks in a consistent order.
- Queues in Postgres: `FOR UPDATE SKIP LOCKED` with a partial index, a visibility timeout, and an attempts cap. Prefer a real queue when throughput or fan-out grows.
- Migrations: set `lock_timeout` (and `statement_timeout`) on every DDL session, then retry. A DDL waiting on `ACCESS EXCLUSIVE` blocks every query behind it. Use `CREATE INDEX CONCURRENTLY`, `NOT VALID` then `VALIDATE`, batched backfills, and expand/contract for renames and type changes.
- Pooling: size by server capacity, not by app instance count. In PgBouncer transaction mode avoid session state: `SET` (use `SET LOCAL`), session advisory locks, `LISTEN`, temp tables, `WITH HOLD` cursors. Prepared statements need PgBouncer 1.21+ with `max_prepared_statements` (default 200 since 1.24) or `prepare: false`.
- Roles: the migration/owner role is not the app role. App roles get DML only, no `SUPERUSER`/`BYPASSRLS`. Use SCRAM, TLS (`verify-full`). RLS needs `FORCE ROW LEVEL SECURITY` if the owner connects.
- Autovacuum is a feature, not a nuisance. Tune per hot table, kill long transactions and stale replication slots, and monitor wraparound age. `VACUUM FULL` locks the table; prefer `pg_repack` or (PG19, beta) `REPACK CONCURRENTLY`.
- A backup is real only after a tested restore. PITR needs continuous WAL archiving plus base backups.
- `int8` and `numeric` arrive as strings (or `BigInt` with opt-in) in JS drivers. `date` and `timestamptz` parsing differs by driver. Smoke test types.
- Use `bun` / `bunx` in command examples. `psql` runs with `-v ON_ERROR_STOP=1` in scripts.

## Verification

Prefer repository-owned commands. For meaningful Postgres work, cover the relevant subset:

- `SELECT version();` and `SHOW` for the settings you rely on; `bun pm ls postgres pg` for drivers.
- Migrations apply to a copy of production-shaped data; note lock level, rewrite, and duration per statement; run twice for idempotence where claimed.
- `EXPLAIN (ANALYZE, BUFFERS)` before/after for changed queries on realistic row counts; compare `Buffers`, estimated vs actual rows, and plan shape, not just time.
- New indexes: confirm the planner uses them (`pg_stat_user_indexes.idx_scan`), the build used `CONCURRENTLY`, and no `INVALID` index remains (`pg_index.indisvalid`).
- Concurrency tests for locks, `SKIP LOCKED` workers, retries on `40001`/`40P01`, and unique-violation (`23505`) handling.
- Pool: `max` x instances below `max_connections` minus reserve; graceful `end()` on shutdown; error listener on `pg` pools.
- Security: app role cannot DDL, RLS policies tested as the app role with and without tenant context.
- Restore drill or PITR proof when changing backup config.

Report which checks ran, which did not, and version, hosting, or pooler assumptions that remain.
