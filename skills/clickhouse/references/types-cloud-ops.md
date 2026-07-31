# Types, Cloud, and Ops

TypeScript JSON mapping, Cloud connection, system tables, and errors.

## Type mapping (JSONEachRow)

| ClickHouse | TS / JSON notes |
|---|---|
| `UInt64` / `Int64` / 128 / 256 | Default **strings** (avoid Number precision loss). Type as `string` or parse to `bigint`. |
| `Decimal(P,S)` | **Insert as strings** (`"123.45"`). Prefer `toString(col)` when reading if JSON emits numbers. |
| `Date` / `Date32` | Strings `'YYYY-MM-DD'` only — JS `Date` does not work for Date. |
| `DateTime` / `DateTime64` | Strings; JS `Date` OK if `date_time_input_format: 'best_effort'` (often Cloud default). |
| `UUID` | UUID string into `UUID` columns. UUID→`UInt128` via JSONEachRow needs conversion — prefer native `UUID`. |
| `Array(T)` | JS arrays; SQL indexes from **1**. |
| `Map(K,V)` | JS objects; duplicate keys possible. |
| `Nested` | Parallel arrays (`Goals.ID`, …); prefer `Array(Tuple)` / `Map` for greenfield. |
| `JSON` | Production-ready OSS **≥ 25.3**. Semi-structured queryable paths; slower full-doc vs `String`. |
| `LowCardinality(T)` | Dictionary encode; best with low cardinality (&lt;~10k). Prefer over Enum for evolving dims. |
| `Enum` | Rigid named ints; invalid string → insert error. |
| `Nullable(T)` | JS `null`; bind with `query_params`. |
| Bool-ish | Often `UInt8` 0/1; JSON may map true/false. |

Custom BigInt JSON: `createClient({ json: { parse, stringify } })` (e.g. json-bigint). Setting `output_format_json_quote_64bit_integers: 0` returns numbers (precision risk).

## ClickHouse Cloud

```ts
createClient({
  url: 'https://HOST.REGION.CSP.clickhouse.cloud:8443',
  username: 'default',
  password: process.env.CH_PASSWORD,
  // or access_token: process.env.CH_JWT
})
```

| Topic | Guidance |
|---|---|
| TLS | Required; public CA usually enough |
| Native 9440 | For `clickhouse-client` CLI — **not** used by `@clickhouse/client` |
| Keep-Alive | Client idle TTL default 2500 &lt; Cloud ~3s |
| Replication | Managed |
| Distributed engine | Unsupported — `remoteSecure` |
| async_insert flush | Often longer busy timeout (~1s) vs OSS (~200ms) |
| Networking | IP allowlists / private link |

Self-hosted: often `http://host:8123`; private CA → `tls: { ca_cert }`; mTLS → cert+key buffers.

## System tables apps query

| Table | Use |
|---|---|
| `system.query_log` | Duration, rows, memory, exceptions by `query_id` |
| `system.processes` | Live queries / kill |
| `system.parts` / `part_log` | Part pressure / merges / TOO_MANY_PARTS |
| `system.metrics` / `asynchronous_metrics` / `metric_log` | Load / memory trends |
| `system.errors` / `error_log` | Aggregate codes |
| `system.tables` / `columns` | Schema introspection |

Enable `log_queries` for useful query_log. Filter by `application` / User-Agent when set.

```ts
await client.query({
  query: `
    SELECT type, query_duration_ms, read_rows, exception
    FROM system.query_log
    WHERE query_id = {id:String}
    ORDER BY event_time DESC
    LIMIT 5
  `,
  query_params: { id: rs.query_id },
  format: 'JSONEachRow',
})
```

## Errors and retries

`ClickHouseError`: `code`, `type?`, `message`. Distinguish from transport `Error`.

| Code | Name | Retry? |
|---|---|---|
| 159 | `TIMEOUT_EXCEEDED` | No blind retry — raise timeouts / fix query |
| 202 | `TOO_MANY_SIMULTANEOUS_QUERIES` | Yes — backoff + concurrency cap |
| 209 | `SOCKET_TIMEOUT` | Transient — yes with backoff |
| 210 | `NETWORK_ERROR` | Transient — yes; check allowlists/TLS |
| 241 | `MEMORY_LIMIT_EXCEEDED` | No — reshape query / limits |
| 252 | `TOO_MANY_PARTS` | No — ingest/partition design |
| 60 | `UNKNOWN_TABLE` | No |
| 62 | `SYNTAX_ERROR` | No |
| 164/242 | Readonly | No |

Official client has **no built-in retry**. Retry idempotent reads and admission/network errors. For writes: ReplicatedMergeTree dedup / `insert_deduplication_token` before retrying inserts.

## Observability hooks

- Every call returns `query_id` — log it.
- Node: HTTP summary on insert/command/exec (`written_rows`, …).
- Optional `tracer` (OTEL-shaped, no OTEL dependency required).
- Progress: headers settings or `JSONEachRowWithProgress`.
