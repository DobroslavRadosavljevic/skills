# SQL Engines and Data Modeling

Table engines, keys, materialized views, projections, and skipping indexes — designed for apps that run SQL via `@clickhouse/client`.

## MergeTree family

| Engine | Use when | Correctness |
|---|---|---|
| **MergeTree** | Append-only events/logs/facts (default) | Plain `SELECT` |
| **ReplacingMergeTree** | Upserts / “latest row wins” (optional `ver`, soft-delete) | Eventual — `FINAL` or query-time dedupe (`argMax`) |
| **SummingMergeTree** | Pre-summed counters for same sort key | Always `sum()` + `GROUP BY` (merges incomplete) |
| **AggregatingMergeTree** | Incremental agg states via MVs | Insert `*-State`, select `*-Merge` + `GROUP BY` |
| **CollapsingMergeTree(Sign)** | Mutable state when writer emits cancel (+1/−1) rows | `sum(col * Sign)` + `HAVING sum(Sign) > 0` or `FINAL` |
| **VersionedCollapsingMergeTree(Sign, Version)** | Collapsing with out-of-order concurrent writers | Same; safer for multi-writer |

Rules:

- Uniqueness ≈ **`ORDER BY`**, not a unique constraint.
- Never rely on background merges alone for answers on specialized engines.
- Prefer RMT / insert patterns over frequent `ALTER UPDATE`.

Replication: self-hosted `ReplicatedMergeTree(...)` with Keeper paths; **Cloud** often uses `ENGINE = MergeTree` / `ReplicatedMergeTree` without ZK path args — Cloud manages replication.

Docs: https://clickhouse.com/docs/engines/table-engines/mergetree-family

## ORDER BY / PRIMARY KEY / PARTITION BY / SAMPLE BY

### ORDER BY (most important)

- Physical sort + sparse index (granules ~8192 rows).
- Put selective filter columns first; low→high cardinality often helps.
- Prefer `toDate(ts)` in the key when day filters dominate.
- Avoid `Nullable` in keys.
- Fixed at create; change via new table or projections.

### PRIMARY KEY

- Defaults to `ORDER BY`.
- Optional shorter prefix of `ORDER BY` for Summing/Aggregating with wide sort keys.

### PARTITION BY

- Prefer none, or month: `toYYYYMM(date)`.
- Keep distinct partition values low (~&lt;100–1000).
- **Never** partition by high-cardinality IDs (user_id) → too many parts.
- Merges do not cross partitions — good for TTL / `DROP PARTITION`.

### SAMPLE BY

- Must be in primary key; unsigned int (often `intHash32(user_id)`).
- Enables `SAMPLE 0.1` + `_sample_factor`.

## Materialized views

- **Insert-triggered**, not a stored full snapshot (unless refreshable MV).
- Pattern: raw MergeTree → MV aggregating into AggregatingMergeTree / SummingMergeTree.
- Read with `sumMerge` / `uniqMerge` / etc.

```sql
CREATE MATERIALIZED VIEW events_hourly_mv
TO events_hourly
AS SELECT
  toStartOfHour(event_time) AS hour,
  event_type,
  countState() AS c
FROM events
GROUP BY hour, event_type;
```

## Projections

- Alternate physical layout / pre-agg picked automatically at query time.
- Disk cost (data duplication).
- `ALTER TABLE ... ADD PROJECTION ...` then `MATERIALIZE PROJECTION`.
- Prefer after getting `ORDER BY` right.

## Skipping indexes

- Skip granules (`minmax`, `set`, bloom, …) — not B-trees.
- Helpful when many granules can be excluded; correlate with PK or sparse values.
- Backfill: `MATERIALIZE INDEX`.
- Last resort after ORDER BY / projections / MVs.

## Cloud vs self-hosted modeling notes

| Topic | Cloud | Self-hosted |
|---|---|---|
| Replication DDL | Managed; often no ZK paths | Explicit Replicated* + Keeper |
| `Distributed` engine | **Not supported** — use `remote` / `remoteSecure` | OK with cluster config |
| Endpoint | `https://…clickhouse.cloud:8443` | `:8123` / `:8443` |

## Example schemas (TS apps)

### Append-only events

```sql
ENGINE = MergeTree
PARTITION BY toYYYYMM(event_date)
ORDER BY (event_type, event_date, user_id)
```

### Latest profile per user (RMT)

```sql
ENGINE = ReplacingMergeTree(updated_at)
ORDER BY user_id
-- SELECT ... FINAL or argMax(...) GROUP BY user_id
```

### Hourly rollup target

```sql
ENGINE = AggregatingMergeTree
ORDER BY (hour, event_type)
-- columns: AggregateFunction(count, ...) etc.
```
