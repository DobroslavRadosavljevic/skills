# Indexes, EXPLAIN, and Query Statistics

Table of contents: index types, multicolumn order, partial/expression/covering, index hygiene, reading EXPLAIN, planner statistics, pg_stat_statements.

## Choosing an index type

| Type | Use for | Notes |
|---|---|---|
| **btree** (default) | `=`, `<`, `>`, `BETWEEN`, `ORDER BY`, `LIKE 'prefix%'` (C collation or `text_pattern_ops`), uniqueness | Handles most workloads. |
| **GIN** | `jsonb @>`/`?`, arrays `&& @>`, full-text `tsvector`, `pg_trgm` (`%`, `ILIKE '%x%'`) | Slower writes; `fastupdate` pending list (`gin_pending_list_limit`). `jsonb_path_ops` is smaller for `@>`. |
| **GiST** | Ranges (`&&`), geometry/PostGIS, exclusion constraints, nearest-neighbor `<->`, trigram alt | Lossy; recheck. `btree_gist` adds scalar opclasses. |
| **SP-GiST** | Partitioned search spaces (ip, text prefix trees) | Niche. |
| **BRIN** | Huge append-mostly tables with physical correlation (time, serial id) | Tiny. Poor if rows are updated or inserted out of order. `WITH (pages_per_range = 32)`. |
| **hash** | Equality only | Rarely better than btree. WAL-logged since PG10. |
| **HNSW / IVFFlat** (pgvector) | Vector similarity | See [extensions.md](extensions.md). |

## Multicolumn btree order

- Put equality columns first, then the range or sort column: `WHERE tenant_id = $1 AND status = $2 ORDER BY created_at DESC` -> `(tenant_id, status, created_at DESC)`.
- Index can serve `ORDER BY` without a sort only if order and direction match (mixed directions need matching index: `(a ASC, b DESC)`).
- PG18 skip scan lets a multicolumn btree help when the leading column has no condition (or only non-equality) and has few distinct values, if later columns have conditions. `EXPLAIN` shows `Index Searches: N`. It is not a replacement for a correctly ordered index on high-cardinality leading columns.
- One composite index usually beats several single-column indexes (bitmap AND/OR works, but costs more).
- Do not index every column. Each index slows writes, bloats, and blocks HOT updates on its columns.

## Partial, expression, covering

```sql
-- Partial: small, targeted, also for soft delete and queues
CREATE INDEX CONCURRENTLY jobs_ready_idx ON jobs (priority DESC, id) WHERE status = 'queued';

-- Expression: query must use the exact same expression
CREATE UNIQUE INDEX CONCURRENTLY users_email_lower_key ON users (lower(email));

-- Covering: INCLUDE payload columns for index-only scans (not searchable keys)
CREATE INDEX CONCURRENTLY orders_cust_idx ON orders (customer_id, created_at DESC) INCLUDE (total);
```

- Planner uses a partial index only if the query's `WHERE` provably implies the index predicate. Parameters in prepared statements can defeat this (`WHERE status = $1`): use a literal or `plan_cache_mode`.
- Index-only scans need an up-to-date visibility map (VACUUM). `Heap Fetches: N` in `EXPLAIN` shows misses.
- Do not `INCLUDE` large or frequently updated columns.
- Unique index on partitioned tables must include the partition key.

## Index hygiene

```sql
-- Unused (idx_scan = 0 since stats reset). Check replicas and rare jobs before dropping.
SELECT s.relname AS tbl, s.indexrelname AS idx, s.idx_scan,
       pg_size_pretty(pg_relation_size(s.indexrelid)) AS size
FROM pg_stat_user_indexes s JOIN pg_index i USING (indexrelid)
WHERE s.idx_scan = 0 AND NOT i.indisunique AND NOT i.indisprimary
ORDER BY pg_relation_size(s.indexrelid) DESC;

-- Invalid leftovers from a failed CONCURRENTLY build
SELECT indexrelid::regclass FROM pg_index WHERE NOT indisvalid;

-- FKs without a supporting index on the referencing side (quick heuristic)
SELECT c.conrelid::regclass AS tbl, c.conname
FROM pg_constraint c
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i
                  WHERE i.indrelid = c.conrelid AND (i.indkey::int2[])[0:cardinality(c.conkey)-1] @> c.conkey);
```

Rebuild bloated indexes with `REINDEX INDEX CONCURRENTLY`. Build progress: `pg_stat_progress_create_index`.

## Reading EXPLAIN

```sql
BEGIN;                                  -- ANALYZE executes the statement; roll back DML
EXPLAIN (ANALYZE, BUFFERS, VERBOSE, SETTINGS) SELECT ...;
ROLLBACK;
```

- PG18: `ANALYZE` includes `BUFFERS` by default. PG16: `EXPLAIN (GENERIC_PLAN)` plans a parameterized query without values. PG19 beta: `EXPLAIN (ANALYZE, IO)` for async I/O, WAL full-page bytes, Memoize estimates. `FORMAT JSON` for tools; text for humans.
- Read bottom-up, inner-most first. Cost units are arbitrary; times are ms **per loop**: multiply `actual time` by `loops`.
- **Estimated vs actual rows** is the first check. Off by 10x or more means stale or insufficient statistics, correlated columns, or a non-sargable predicate.
- Red flags and fixes:

| Symptom in plan | Likely cause | Fix |
|---|---|---|
| `Seq Scan` + large `Rows Removed by Filter` | Missing/unusable index, function on column, type mismatch, implicit cast | Add index matching predicate; remove function on column or add expression index; align parameter types |
| `Index Scan` with `Filter:` removing many rows | Index only covers part of the predicate | Extend index key or add partial index |
| `Sort Method: external merge Disk` | `work_mem` too small or no index for ORDER BY | Index for order; raise `work_mem` for that role/session, not globally |
| `Hash ... Batches: >1` | Hash join spilled | Reduce rows early; targeted `work_mem` |
| `Nested Loop` with huge `loops` | Bad row estimate or missing join index | `ANALYZE`, index the join key, check stats |
| `Buffers: shared read` high | Cold cache or too many pages | Narrow columns/rows, covering index, check cache fit |
| `temp read/written` | Spills to disk | See sort/hash |
| `Heap Fetches` high on Index Only Scan | Visibility map stale | VACUUM; tune autovacuum |
| `Planning Time` large | Many partitions/joins, or `track_planning` hints | Fewer partitions, prepared statements |
| `JIT:` time big on OLTP query | JIT overhead | `SET jit = off` for OLTP roles (PG19 beta defaults JIT off) |

- Compare plans for **realistic data and parameters**. Tiny dev data picks sequential scans legitimately. Skewed parameters need per-value checks (generic vs custom plan; `plan_cache_mode = force_custom_plan` for skew).
- For diagnosis only, `SET enable_seqscan = off` (session) proves whether an index could win. Never ship it.
- Look for `Parallel Seq Scan` only on large scans; parallelism does not fix missing indexes.

## Planner statistics

- `ANALYZE table;` after bulk loads. Autovacuum runs analyze, but not instantly.
- Raise detail for skewed columns: `ALTER TABLE t ALTER COLUMN c SET STATISTICS 500; ANALYZE t;` (default `default_statistics_target = 100`).
- Correlated columns: `CREATE STATISTICS s (dependencies, ndistinct, mcv) ON a, b FROM t; ANALYZE t;`. `pg_upgrade` keeps normal stats in PG18 but not extended stats: run `ANALYZE` after upgrade.
- On SSD set `random_page_cost = 1.1` (default 4.0 favors seq scans too much).
- Stale or missing stats show up as bad row estimates, not as slow `ANALYZE`.

## pg_stat_statements

Enable (restart required): `shared_preload_libraries = 'pg_stat_statements'`, `compute_query_id = auto|on`, then `CREATE EXTENSION pg_stat_statements;` in each database. Useful settings: `pg_stat_statements.max` (default 5000), `track = top|all`, `track_planning = off` (adds contention when on), `track_io_timing = on` for block read/write times.

```sql
-- Where total time goes
SELECT queryid, calls, round(total_exec_time::numeric,1) AS total_ms,
       round(mean_exec_time::numeric,2) AS mean_ms, rows,
       round(100.0 * shared_blks_hit / nullif(shared_blks_hit + shared_blks_read,0),1) AS hit_pct,
       left(query, 120) AS query
FROM pg_stat_statements
ORDER BY total_exec_time DESC LIMIT 20;
```

- Sort by `total_exec_time` (impact), `mean_exec_time` and `stddev_exec_time` (latency/variance), `shared_blks_read` (I/O), `temp_blks_written` (spills), `wal_bytes` (write load), `calls` (N+1 hints: tiny mean, huge calls).
- Queries are normalized (`$1`). Use `queryid` to join with logs and `auto_explain` output.
- `pg_stat_statements_reset(0,0,queryid)` resets one entry after a fix. `pg_stat_statements_info.dealloc` rising means `max` is too small.
- Non-superusers need `pg_read_all_stats` (or `pg_monitor`) to see others' text.
- PG18 groups `FETCH` of different sizes and tracks generic/custom plan counts in newer versions (19 beta).

Companion tools: `auto_explain` (`log_min_duration = '500ms'`, `log_analyze`, `log_buffers`), `log_min_duration_statement`, `log_lock_waits` (default on in PG19 beta), `log_temp_files`, `pg_stat_user_tables` (`seq_scan`, `n_dead_tup`), `pg_stat_io`, `pg_stat_activity`.
