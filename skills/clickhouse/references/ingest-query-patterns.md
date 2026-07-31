# Ingest and Query Patterns

Insert strategies, SELECT correctness, joins, and mutations — SQL that TypeScript apps run via the client.

## Insert strategy

| Pattern | When | Settings / API |
|---|---|---|
| Sync batched `insert()` | App can buffer ≥1k–100k rows | `format: 'JSONEachRow'` |
| `async_insert` | Many small clients / hard to batch | `async_insert=1`, `wait_for_async_insert=1` |
| Stream insert | Large files / generators | Node `Readable` into `insert` |
| `INSERT … SELECT` | Transform in-server | `command()` |

Rules:

- Sync insert ≈ **one part per insert per partition** → tiny inserts hurt.
- Aim ~**1 insert/sec** per table for sync strategy, or use async insert.
- Error **252** `TOO_MANY_PARTS` → slow down / batch / fewer partitions / async insert.
- `wait_for_async_insert=0` is fire-and-forget — weak for TS error handling.
- Async insert does **not** apply to `INSERT … SELECT`.
- Parse errors reject the **whole** payload for that query.

```ts
await client.insert({
  table: 'events',
  format: 'JSONEachRow',
  values: batch,
  clickhouse_settings: {
    async_insert: 1,
    wait_for_async_insert: 1,
  },
})
```

Docs: https://clickhouse.com/docs/best-practices/selecting-an-insert-strategy

## SELECT: FINAL and merge engines

```sql
SELECT * FROM users FINAL WHERE user_id = {id:UInt64}
-- or SETTINGS final = 1
```

- `FINAL` applies merge semantics at query time (costly).
- Alternatives:
  - RMT: `argMax(col, ver) … GROUP BY key`
  - Summing: `sum(col) … GROUP BY`
  - Aggregating: `sumMerge(state) … GROUP BY`
  - Collapsing: `sum(col * Sign) … HAVING sum(Sign) > 0`

## PREWHERE

- Usually automatic: filter columns read first.
- Manual `PREWHERE` only to override heuristics.
- With `FINAL`, PREWHERE before FINAL can skew if filtering non-ORDER-BY fields — see `optimize_move_to_prewhere_if_final`.

## JOINs

- Prefer denormalization, dictionaries, or MVs over many joins.
- Keep joins few (≤3–4) for latency-sensitive paths.
- Prefer `IN (subquery)` for some semi-join cases.
- Push filters into both sides.
- Self-hosted Distributed right side may need `GLOBAL JOIN`.
- Cloud: no `Distributed` table engine — use `remoteSecure` table functions.

## LIMIT BY and windows

```sql
SELECT *
FROM events
ORDER BY event_time DESC
LIMIT 5 BY user_id
```

- `LIMIT n BY expr` = top-n per group after ORDER BY.
- Window functions: `OVER (PARTITION BY … ORDER BY … ROWS|RANGE …)` — no `GROUPS`; no `INTERVAL` in RANGE.

## Aggregations

Prefer ClickHouse-native functions: `uniq`, `quantile`, `argMax`, `sumMap`, `countIf`, …

On Summing/Aggregating/Collapsing engines, always express merge semantics in SQL.

## Mutations vs deletes

| Mechanism | SQL | Prefer when |
|---|---|---|
| Lightweight delete | `DELETE FROM t WHERE …` | Row deletes on MergeTree family (marks rows; physical on merge) |
| Heavy delete | `ALTER TABLE t DELETE WHERE …` | Explicit mutation rewrite |
| Heavy update | `ALTER TABLE t UPDATE … WHERE …` | Rare bulk fixes; **cannot** update sort key cols |
| Soft delete (RMT) | Insert row with `is_deleted=1` + higher `ver` | Upsert pipelines |
| Partition drop | `ALTER … DROP PARTITION` | Fastest mass retention deletes |
| Truncate | `TRUNCATE TABLE` | Clear all |

Prefer **insert-only** designs. Mutations are async (tune `mutations_sync`); mutation backlog hurts.

```ts
await client.command({
  query: 'DELETE FROM events WHERE event_date < {d:Date}',
  query_params: { d: '2025-01-01' },
})
```

Docs: https://clickhouse.com/docs/guides/developer/lightweight-delete

## Query hygiene from TS

```ts
const rs = await client.query({
  query: 'SELECT …',
  query_params: { … },
  format: 'JSONEachRow',
  query_id: myId, // optional; must be unique if set
  abort_signal: AbortSignal.timeout(30_000),
})
const data = await rs.json()
// log rs.query_id for system.query_log correlation
```

Idempotent read retries OK with backoff. Write retries need dedup tokens / ReplicatedMergeTree awareness — see [types-cloud-ops.md](types-cloud-ops.md).
