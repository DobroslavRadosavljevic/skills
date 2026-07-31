# Usage Guide

Day-to-day ClickHouse from TypeScript with `@clickhouse/client`. Prefer this for adoption; sibling refs for depth.

## 1. Mental model

| Fact | Implication for TS apps |
|---|---|
| Columnar OLAP | Wide scans + aggregations; not row-OLTP |
| Immutable parts | Each insert batch → part(s); merges in background |
| Sparse primary index | Great range filters on `ORDER BY`; weak for random point lookups |
| HTTP client | `@clickhouse/client` uses HTTP(S), not native TCP |

## 2. Install

```sh
bun add @clickhouse/client
# browser / Cloudflare Workers:
bun add @clickhouse/client-web
```

Node **`>=20`**. Pin with server **24.8+** when possible.

## 3. Connect

```ts
import { createClient } from '@clickhouse/client'

const client = createClient({
  url: process.env.CLICKHOUSE_URL ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
  database: process.env.CLICKHOUSE_DB ?? 'default',
  request_timeout: 30_000,
  clickhouse_settings: {
    // optional defaults
  },
})

// Cloud example:
// url: 'https://xxxxx.clickhouse.cloud:8443'
// access_token: process.env.CLICKHOUSE_JWT  // XOR with username/password
```

Prefer `url` over deprecated `host`. One client per process; `await client.close()` (or `await using`) on shutdown.

Health: `ping()` does **not** throw — check `{ success }`. Use `ping({ select: true })` to verify credentials (Node default `/ping` skips auth).

## 4. Schema (first table)

```ts
await client.command({
  query: `
    CREATE TABLE IF NOT EXISTS events (
      event_date Date,
      event_time DateTime,
      user_id UInt64,
      event_type LowCardinality(String),
      props String
    )
    ENGINE = MergeTree
    PARTITION BY toYYYYMM(event_date)
    ORDER BY (event_type, user_id, event_time)
  `,
  clickhouse_settings: { wait_end_of_query: 1 },
})
```

Design order: **`ORDER BY` first** (query filters), then coarse **`PARTITION BY`** (month), then MVs/projections. See [sql-engines-modeling.md](sql-engines-modeling.md).

## 5. Insert

```ts
await client.insert({
  table: 'events',
  format: 'JSONEachRow', // always set for object rows
  values: [
    {
      event_date: '2026-07-31',
      event_time: '2026-07-31 12:00:00',
      user_id: '42', // UInt64 as string is safest
      event_type: 'click',
      props: '{}',
    },
  ],
})
```

- Empty `values: []` → **no HTTP call** (`executed: false`).
- Batch **≥1k rows** when possible (ideally 10k–100k).
- High-frequency tiny payloads:

```ts
createClient({
  clickhouse_settings: {
    async_insert: 1,
    wait_for_async_insert: 1,
  },
})
```

SQL functions in values (`now()`, `unhex()`) → `command` + `query_params`, not `insert()`.

## 6. Query

```ts
interface Row {
  c: string // count() may be UInt64 → string
}

const rs = await client.query({
  query: `
    SELECT count() AS c
    FROM events
    WHERE event_date = {day:Date}
      AND event_type = {type:String}
  `,
  query_params: { day: '2026-07-31', type: 'click' },
  format: 'JSONEachRow',
})
const rows = await rs.json<Row>()
```

**Never** interpolate user input into SQL. Placeholders are `{name: Type}` only — not `?` / `$1` / `:name`.

Do **not** put `FORMAT` in the SQL string — the client appends it.

## 7. Streams (must consume)

```ts
const rs = await client.query({
  query: 'SELECT * FROM events WHERE event_date = {day:Date}',
  query_params: { day: '2026-07-31' },
  format: 'JSONEachRow',
})

for await (const chunk of rs.stream()) {
  for (const row of chunk) {
    const obj = row.json<Record<string, unknown>>()
  }
}
// Or abandon early: rs.close()
```

Unconsumed ResultSets → dangling sockets → `ECONNRESET`.

## 8. Progressive adoption

1. Connect + `ping({ select: true })`.
2. One MergeTree table with a real `ORDER BY`.
3. Batched `insert` + parameterized `query`.
4. Add async_insert / streams as volume grows.
5. Upserts → ReplacingMergeTree; rollups → MV + AggregatingMergeTree.
6. Cloud harden: TLS URL, keep-alive TTL, allowlists.

## 9. Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNRESET` | Consume/close streams; lower `keep_alive.idle_socket_ttl` below server timeout (Cloud ~3s → client 2500 default) |
| `TOO_MANY_PARTS` (252) | Larger batches / async_insert / fewer partitions |
| Auth fails but ping OK | Use `ping({ select: true })` |
| Wrong numbers / money | Decimal as strings; UInt64 as strings |
| Insert objects mangled | Set `format: 'JSONEachRow'` explicitly |
| `ERR_SSL_WRONG_VERSION_NUMBER` | Use `https://` for Cloud |

## 10. What not to do

- Do not use Python/Go/Java clients from this skill’s guidance.
- Do not use the stale unscoped `clickhouse` npm package as primary.
- Do not treat ClickHouse as Postgres (no reliance on unique PK / row updates).
- Do not partition by user_id.
- Do not leave ResultSets unread.
- Do not build SQL with string concatenation of user values.
