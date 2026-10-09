# Full-Text Search, Trigram, and Partitioning

Table of contents: full-text search, fuzzy/substring search, when to leave Postgres search, partitioning design, partition operations.

## Full-text search (FTS)

```sql
ALTER TABLE articles ADD COLUMN search tsvector GENERATED ALWAYS AS (
  setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
  setweight(to_tsvector('english', coalesce(body,  '')), 'B')
) STORED;
CREATE INDEX CONCURRENTLY articles_search_idx ON articles USING gin (search);

SELECT id, title, ts_rank_cd(search, q) AS rank
FROM articles, websearch_to_tsquery('english', $1) AS q
WHERE search @@ q
ORDER BY rank DESC, id
LIMIT 20;
```

- Use `websearch_to_tsquery` for user input (quotes, `or`, `-`). `plainto_tsquery` for simple AND. `to_tsquery` throws on bad syntax: never feed it raw user input.
- Use a `STORED` generated column (or trigger) for the `tsvector`; PG18 `VIRTUAL` columns cannot be indexed. Or index the expression directly and repeat the exact expression in queries.
- Always pass the language config (`'english'`) explicitly, in the index and the query. Mismatch = no index use. Multi-language: store a `regconfig` column.
- `unaccent` extension for accent-insensitive search (build a custom text search configuration).
- Ranking: `ts_rank` / `ts_rank_cd` with weights. Ranking scans all matches; keep result sets bounded with extra filters.
- Highlight snippets: `ts_headline` is expensive; run it on the final page of rows only.
- Prefix search: `to_tsquery('simple', 'foo:*')`.
- `GIN` (default, faster reads) vs `GiST` (smaller, slower). RUM index is a third-party extension (ranking from index); check availability.
- PG18: FTS and `pg_trgm` use the cluster's default collation provider. Reindex FTS/trigram indexes after upgrading when using ICU or builtin collations.

## Fuzzy and substring search (pg_trgm)

```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX CONCURRENTLY customers_name_trgm_idx ON customers USING gin (name gin_trgm_ops);

SELECT id, name, similarity(name, $1) AS sim
FROM customers
WHERE name % $1                    -- uses pg_trgm.similarity_threshold (default 0.3)
ORDER BY name <-> $1               -- distance: use a GiST (gist_trgm_ops) index for KNN ordering
LIMIT 10;

SELECT * FROM customers WHERE name ILIKE '%' || $1 || '%';   -- accelerated by the GIN trigram index
```

- Trigram GIN speeds `LIKE '%x%'`, `ILIKE`, regex, and `%`. Patterns shorter than 3 characters degrade to scans.
- Escape `%`, `_`, `\` in user input for `LIKE`.
- Set `pg_trgm.similarity_threshold` per session when needed (`SET LOCAL`).
- For autocomplete on prefixes, a btree with `text_pattern_ops` or `lower(col) text_pattern_ops` is cheaper.

## When to use something else

Stay with Postgres FTS for modest corpora, simple relevance, strong transactional consistency with the primary data. Move to a dedicated search engine for typo tolerance at scale, faceting over huge sets, multi-language analyzers, or heavy relevance tuning. Vector/semantic search with pgvector is in [extensions.md](extensions.md); hybrid search = FTS rank + vector distance fused in SQL (RRF).

## Partitioning

Declarative partitioning splits one logical table into physical partitions by `RANGE`, `LIST`, or `HASH`.

When it pays off:
- Time-series or append-heavy data with **retention** (drop/detach old partitions instantly instead of `DELETE` + bloat).
- Tables so large that index maintenance, vacuum, or backups are painful, with queries that always filter by the partition key (partition pruning).
- Hot/cold storage tiering (tablespaces).

When it does not: general "make queries faster" on a table under a few hundred GB. A right index is usually better; partitioning adds planning cost, constraints, and ops work.

```sql
CREATE TABLE events (
  id         uuid NOT NULL DEFAULT uuidv7(),
  tenant_id  bigint NOT NULL,
  occurred_at timestamptz NOT NULL,
  payload    jsonb NOT NULL,
  PRIMARY KEY (id, occurred_at)            -- PK/unique must include the partition key
) PARTITION BY RANGE (occurred_at);

CREATE TABLE events_2026_10 PARTITION OF events
  FOR VALUES FROM ('2026-10-01') TO ('2026-11-01');

CREATE INDEX ON events (tenant_id, occurred_at DESC);   -- created on every partition
```

Rules of thumb:
- Partition key must be in every `PRIMARY KEY`/`UNIQUE`. Global uniqueness on another column is impossible.
- Queries must include the partition key (with parameters of the right type) to prune. Check `EXPLAIN` for the partitions touched; `enable_partition_pruning` is on by default.
- Keep partition count moderate (tens to low thousands). Thousands of partitions raise planning time and memory.
- Pre-create future partitions (job or `pg_partman`); a missing partition fails inserts unless a `DEFAULT` partition exists. A default partition blocks `DETACH ... CONCURRENTLY` and slows `ATTACH` (needs scan).
- Hash partitioning for even spread when no natural range; list for tenant/region.
- Foreign keys to partitioned tables work (PG12+); FKs from partitioned tables work.
- Unlogged partitioned tables are disallowed (PG18).
- Create indexes on partitioned tables without long locks: `CREATE INDEX ... ON ONLY parent`, build `CONCURRENTLY` per partition, `ALTER INDEX ... ATTACH PARTITION`. `CREATE INDEX CONCURRENTLY` directly on a partitioned parent is not supported.

Retention and archive:

```sql
ALTER TABLE events DETACH PARTITION events_2025_09 CONCURRENTLY;   -- SHARE UPDATE EXCLUSIVE
-- then pg_dump it, move to cold storage, and DROP TABLE events_2025_09;
```

Attach a pre-loaded partition without a long scan:

```sql
CREATE TABLE events_2026_11 (LIKE events INCLUDING ALL);
-- load data...
ALTER TABLE events_2026_11 ADD CONSTRAINT p CHECK (occurred_at >= '2026-11-01' AND occurred_at < '2026-12-01') NOT VALID;
ALTER TABLE events_2026_11 VALIDATE CONSTRAINT p;
ALTER TABLE events ATTACH PARTITION events_2026_11 FOR VALUES FROM ('2026-11-01') TO ('2026-12-01');
ALTER TABLE events_2026_11 DROP CONSTRAINT p;
```

- Converting an existing big table: create the new partitioned table, copy/backfill in batches with dual-write (or logical replication), then swap names. In-place conversion does not exist.
- Partition on a real `timestamptz` column. A UUIDv7 id is time-ordered, but range-by-time pruning works on the timestamp column your queries filter by.
