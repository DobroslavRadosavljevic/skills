# Source Map

Snapshot date: 2026-10-09.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, major upgrades, extension availability, pooler behavior, or version mismatches.

## Research Snapshot

- Context7 libraries: `/websites/postgresql_18` (high reputation; used for ALTER TABLE, locking, UUID functions, generated columns, partitioning, vacuum parameters), `/websites/postgresql_19`, `/websites/postgresql_current`, `/postgres/postgres`.
- PostgreSQL versions observed on postgresql.org/support/versioning (2026-10-09):
  - **18.6** current minor of the current stable major (18.0 released 2025-09-25; EOL 2030-11-14)
  - 17.11, 16.15, 15.19, 14.24 (14 reaches EOL 2026-11-12)
  - **19 Beta 4** announced 2026-09-24; no GA yet. Do not recommend 19 for production; use its notes only to flag upcoming behavior.
- PG18 changes that shape guidance: `uuidv7()` / `uuidv4()` alias, virtual generated columns (default), btree skip scan, async I/O (`io_method`, `pg_aios`), `WITHOUT OVERLAPS` / `PERIOD`, `RETURNING OLD/NEW`, named and `NOT VALID` not-null constraints, `EXPLAIN ANALYZE` includes `BUFFERS`, `pg_upgrade` keeps planner stats, data checksums on by default, MD5 password deprecation warnings, `OAuth` auth, FTS/`pg_trgm` collation provider change, FK collation requirements, `VACUUM`/`ANALYZE` recurse into inheritance children, subscriptions default `streaming = parallel`.
- PG19 beta items referenced as "beta": `REPACK [CONCURRENTLY]`, `WAIT` command, sequence logical replication, parallel autovacuum and scoring, `EXPLAIN (IO)`, JIT off by default, `max_locks_per_transaction` 128, `log_lock_waits` default on, `pg_plan_advice`/`pg_stash_advice`, `standard_conforming_strings` always on.
- npm versions observed on 2026-10-09:
  - `postgres` (postgres.js) `latest`: `3.4.9` (2026-04-05), ESM
  - `pg` `latest`: `8.23.1` (2026-09-30), Node `>= 16`, optional peer `pg-native`; `pg-pool` `3.14.0`; `pg-cursor` `2.22.1`; `pg-query-stream` `4.17.1`; `@types/pg` `8.23.1`
  - `bun`: docs reflect Bun 1.4.2 `Bun.SQL`
  - `drizzle-orm` `rc` tag `1.0.0-rc.4` (latest tag `0.45.4`); `kysely` `0.29.6`; `@neondatabase/serverless` `1.2.0`; `pgvector` (npm) `0.3.0`; `node-pg-migrate` `9.0.0`; `@electric-sql/pglite` `0.5.8`
- Related server tools observed on GitHub releases (2026-10-09):
  - PgBouncer `1.26.0` (2026-09-23): tracks `search_path` and `default_transaction_read_only`; per-user/db `query_wait_timeout`; removes `-R`; `max_prepared_statements` default 200 since 1.24, protocol-level prepared statements since 1.21
  - pgvector `v0.8.7` (supports Postgres 13+; iterative scans since 0.8.0)
  - pg_cron `v1.6.8` (2026-09-08)
  - pgBackRest `2.59.3` (2026-10-04), Barman `3.20.1` (2026-09-29), TimescaleDB `2.30.2` (2026-09-29)

Verification notes:

- Fetched from official docs or READMEs on 2026-10-09: version and EOL table, PG18/PG19 release notes, `uuidv7` and generated-column rules, `NOT VALID` lock levels, `DETACH PARTITION CONCURRENTLY`, the partitioned-index attach recipe, `pg_stat_statements` columns and settings, postgres.js / node-postgres Pool / Bun.SQL option names, PgBouncer prepared-statement behavior, pgvector index parameters, pg_cron settings.
- Executed on a throwaway `postgres:18` container (18.4) on 2026-10-09: the schema, constraint, `NOT VALID` / `VALIDATE`, keyset, upsert, `SKIP LOCKED` queue, partition attach/detach, RLS, FTS, trigram, statistics, and diagnostic queries in these references ran without error. A virtual generated column index failed as documented.
- Written from long-standing documented behavior, not re-fetched: the lock-level cheat-sheet rows, autovacuum defaults, isolation semantics, PITR procedure, replication guidance, and baseline tuning numbers. Re-check the exact docs page when precision matters.

## Official PostgreSQL Documentation (version 18; replace `18` with `current` or `19` as needed)

- Docs home: https://www.postgresql.org/docs/18/
- Versioning and EOL: https://www.postgresql.org/support/versioning/
- Release notes index: https://www.postgresql.org/docs/release/
- PG18 release notes: https://www.postgresql.org/docs/18/release-18.html
- PG19 beta release notes: https://www.postgresql.org/docs/19/release-19.html
- Data types: https://www.postgresql.org/docs/18/datatype.html
- UUID functions: https://www.postgresql.org/docs/18/functions-uuid.html
- Generated columns: https://www.postgresql.org/docs/18/ddl-generated-columns.html
- Constraints: https://www.postgresql.org/docs/18/ddl-constraints.html
- ALTER TABLE: https://www.postgresql.org/docs/18/sql-altertable.html
- CREATE TABLE: https://www.postgresql.org/docs/18/sql-createtable.html
- CREATE INDEX: https://www.postgresql.org/docs/18/sql-createindex.html
- Index types: https://www.postgresql.org/docs/18/indexes-types.html
- Multicolumn indexes: https://www.postgresql.org/docs/18/indexes-multicolumn.html
- Using EXPLAIN: https://www.postgresql.org/docs/18/using-explain.html
- EXPLAIN reference: https://www.postgresql.org/docs/18/sql-explain.html
- Planner statistics: https://www.postgresql.org/docs/18/planner-stats.html
- pg_stat_statements: https://www.postgresql.org/docs/18/pgstatstatements.html
- Monitoring statistics: https://www.postgresql.org/docs/18/monitoring-stats.html
- Explicit locking: https://www.postgresql.org/docs/18/explicit-locking.html
- SELECT (locking clause, SKIP LOCKED): https://www.postgresql.org/docs/18/sql-select.html
- Transaction isolation: https://www.postgresql.org/docs/18/transaction-iso.html
- INSERT ON CONFLICT: https://www.postgresql.org/docs/18/sql-insert.html
- MERGE: https://www.postgresql.org/docs/18/sql-merge.html
- Full-text search: https://www.postgresql.org/docs/18/textsearch.html
- pg_trgm: https://www.postgresql.org/docs/18/pgtrgm.html
- Partitioning: https://www.postgresql.org/docs/18/ddl-partitioning.html
- Row security: https://www.postgresql.org/docs/18/ddl-rowsecurity.html
- Privileges and roles: https://www.postgresql.org/docs/18/ddl-priv.html
- Database roles: https://www.postgresql.org/docs/18/user-manag.html
- Client authentication / pg_hba: https://www.postgresql.org/docs/18/client-authentication.html
- Routine vacuuming: https://www.postgresql.org/docs/18/routine-vacuuming.html
- Autovacuum and vacuum settings: https://www.postgresql.org/docs/18/runtime-config-vacuum.html
- Resource consumption settings: https://www.postgresql.org/docs/18/runtime-config-resource.html
- Backup and restore (continuous archiving, PITR): https://www.postgresql.org/docs/18/continuous-archiving.html
- pg_dump: https://www.postgresql.org/docs/18/app-pgdump.html
- pg_basebackup / pg_combinebackup: https://www.postgresql.org/docs/18/app-pgbasebackup.html
- High availability and replication: https://www.postgresql.org/docs/18/high-availability.html
- Logical replication: https://www.postgresql.org/docs/18/logical-replication.html
- pg_upgrade: https://www.postgresql.org/docs/18/pgupgrade.html
- Upgrading a cluster: https://www.postgresql.org/docs/18/upgrading.html
- Async I/O settings: https://www.postgresql.org/docs/18/runtime-config-resource.html#RUNTIME-CONFIG-RESOURCE-IO

## TypeScript Clients and Tools

- postgres.js README: https://github.com/porsager/postgres
- node-postgres docs: https://node-postgres.com/ (Pool API: https://node-postgres.com/apis/pool)
- Bun.SQL docs: https://bun.com/docs/runtime/sql
- Drizzle ORM: https://orm.drizzle.team/ (library named only)
- PgBouncer: https://www.pgbouncer.org/ (changelog: https://www.pgbouncer.org/changelog.html; config: https://www.pgbouncer.org/config.html)
- pgvector: https://github.com/pgvector/pgvector
- pg_cron: https://github.com/citusdata/pg_cron
- pg_partman: https://github.com/pgpartman/pg_partman
- pg_repack: https://github.com/reorg/pg_repack
- pgBackRest: https://pgbackrest.org/
- Barman: https://pgbarman.org/

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current behavior, a major upgrade, or an upgrade plan (check whether PG19 reached GA and which minor is current).
- The server major differs from 18 or the driver majors differ from `postgres@3`, `pg@8`, Bun 1.4.
- The task touches lock levels for an unusual `ALTER TABLE` form, extension availability on a managed provider, PgBouncer/pooler prepared-statement support, backup tooling, or logical replication features.
- Observed server behavior, `EXPLAIN` output, or TypeScript declarations disagree with this skill text: prefer the live server (`SHOW`, `pg_settings`, `pg_available_extensions`) plus current docs.
