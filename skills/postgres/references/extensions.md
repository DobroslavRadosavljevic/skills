# Useful Extensions

Table of contents: availability, built-in contrib, pg_trgm, pgvector, pg_cron, partitioning/maintenance helpers, others.

Check availability before designing around an extension: `SELECT name, default_version, installed_version FROM pg_available_extensions ORDER BY 1;`. Managed providers allow a curated list and may lag in versions. `CREATE EXTENSION IF NOT EXISTS ...;` needs privileges (trusted extensions can be created by non-superusers with `CREATE` on the database). Install extensions in a migration and pin versions where the provider allows.

## Contrib you will use often

| Extension | Use |
|---|---|
| `pg_stat_statements` | Query statistics ([indexes-explain.md](indexes-explain.md)); needs `shared_preload_libraries`. |
| `auto_explain` | Log plans of slow queries (`auto_explain.log_min_duration`, `log_analyze`, `log_buffers`). PG19 beta adds `log_io`. |
| `pg_trgm` | Trigram similarity, fast `LIKE '%x%'`/`ILIKE`. |
| `btree_gist` / `btree_gin` | Scalar columns in GiST/GIN indexes and exclusion constraints. |
| `citext` | Case-insensitive text (lowercase expression index is usually clearer). |
| `unaccent` | Accent-insensitive FTS and matching. |
| `pgstattuple` | Measure bloat. |
| `pg_buffercache` | See what is cached. |
| `pg_prewarm` | Warm cache after restart. |
| `postgres_fdw` | Query other Postgres servers (PG19 beta: read-only transaction state propagates). |
| `pgcrypto` | `gen_random_bytes`, digests; do not hash passwords in SQL. `gen_random_uuid()` is built in. `uuid-ossp` is unnecessary now (`uuidv7()` is built in on PG18). |
| `pg_walinspect`, `amcheck` | WAL and index integrity inspection. |
| `pg_plan_advice`, `pg_stash_advice` | PG19 beta: stabilize or pin planner choices. |

## pg_trgm

See [search-partitioning.md](search-partitioning.md): `gin_trgm_ops` for substring/fuzzy, `gist_trgm_ops` for distance ordering, `similarity()`, `word_similarity()`, `%` with `pg_trgm.similarity_threshold`.

## pgvector (v0.8.7)

Vector similarity in SQL. Supports Postgres 13+. Types: `vector` (float4, up to 16,000 dims stored, 2,000 indexed), `halfvec` (4,000 indexed), `bit`, `sparsevec`.

```sql
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE docs (id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY, tenant_id bigint NOT NULL,
                   body text NOT NULL, embedding vector(1536) NOT NULL);

CREATE INDEX CONCURRENTLY docs_embedding_hnsw ON docs USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

SET LOCAL hnsw.ef_search = 100;                -- recall vs speed (default 40)
SELECT id, embedding <=> $1::vector AS dist FROM docs
WHERE tenant_id = $2
ORDER BY embedding <=> $1::vector LIMIT 10;
```

- Operators: `<->` L2, `<=>` cosine, `<#>` negative inner product, `<+>` L1, `<~>` Hamming, `<%>` Jaccard. The operator class in the index must match the query operator. Query must be `ORDER BY distance LIMIT n` ascending to use the index.
- **HNSW**: better recall/speed, slower build, more memory, can build on an empty table. **IVFFlat**: faster build, less memory; build after loading data; `lists` about rows/1000 (up to 1M rows) or sqrt(rows); query `ivfflat.probes` about sqrt(lists).
- Filtering: approximate indexes filter after the index scan, so selective `WHERE` can return too few rows. Enable iterative scans (`SET hnsw.iterative_scan = relaxed_order;` or `strict_order`; `ivfflat.iterative_scan = relaxed_order`), use partial indexes for few filter values, partitioning (tenant/category) for many, or a btree on the filter for very selective predicates.
- Large builds: raise `maintenance_work_mem` and `max_parallel_maintenance_workers`; use `CREATE INDEX CONCURRENTLY` on live tables.
- Store embeddings as `halfvec` when precision allows to halve storage. Keep the embedding model/version in a column to support re-embedding.
- TS: `pgvector` npm package (0.3.0 observed) serializes arrays for `pg`/`postgres.js`, or pass `'[0.1,0.2,...]'` text cast to `::vector`.

## pg_cron (v1.6.8)

Cron scheduler inside Postgres. Setup: `shared_preload_libraries = 'pg_cron'`, `cron.database_name = 'appdb'` (one database per cluster), restart, `CREATE EXTENSION pg_cron;`.

```sql
SELECT cron.schedule('purge-sessions', '0 3 * * *', $$DELETE FROM sessions WHERE expires_at < now()$$);
SELECT cron.schedule('refresh-stats', '30 seconds', $$REFRESH MATERIALIZED VIEW CONCURRENTLY daily_stats$$);
SELECT cron.schedule_in_database('job', '*/5 * * * *', $$SELECT 1$$, 'otherdb');
SELECT cron.unschedule('purge-sessions');
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 20;
```

- Default timezone is GMT (`cron.timezone`). Use named jobs so migrations can upsert/unschedule idempotently.
- Run history is not pruned automatically: schedule a cleanup of `cron.job_run_details`.
- Jobs run as the scheduling role. Keep commands short; long jobs overlap and hold locks; use `cron.max_running_jobs` and batching.
- Good for retention deletes, partition creation, materialized view refresh, vacuum nudges. Business workflows belong in the app/queue.
- Not available on every managed provider (some offer their own scheduler).

## Partition and bloat helpers

- **pg_partman**: automates creation/retention of time/id partitions; run its maintenance via `pg_cron` or an app job.
- **pg_repack**: online table/index rebuild without long exclusive locks (needs a primary key or unique index; needs free disk space).
- **TimescaleDB** (2.30.2 observed): hypertables, compression, continuous aggregates, for heavy time-series. Different licensing tiers apply; check the provider.

## Others to know

- **PostGIS**: geospatial types and GiST indexes.
- **pg_search/ParadeDB, RUM**: alternative ranking/search indexes.
- **pgaudit**: audit logging for compliance.
- **pg_hint_plan**: planner hints (third-party); PG19 beta has built-in advice extensions.
- **Foreign data wrappers** (`postgres_fdw`, `file_fdw`): migration and federation, not hot-path joins.
- Prefer built-in features (generated columns, partitioning, `uuidv7()`, FTS) before adding an extension dependency that complicates upgrades and managed-provider portability.
