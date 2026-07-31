# TypeScript Client (`@clickhouse/client`)

Official HTTP client API for Node. Web/Workers: `@clickhouse/client-web` (select streaming; insert streaming limited).

## Packages

| Package | Use |
|---|---|
| `@clickhouse/client@1.23.1` | Node apps (primary) |
| `@clickhouse/client-web@1.23.1` | Browser / Workers |
| `@clickhouse/datatype-parser` | Optional type AST (replaces deprecated `parseColumnType`) |
| `@clickhouse/rowbinary` | Optional RowBinary decode building blocks |
| `@clickhouse/client-common` | **Do not install** (deprecated, bundled) |

Docs: https://clickhouse.com/docs/integrations/javascript

## createClient

```ts
import { createClient } from '@clickhouse/client'

const client = createClient({
  url: 'http://localhost:8123',
  username: 'default',
  password: '',
  database: 'default',
  request_timeout: 30_000,
  max_open_connections: 10,
  compression: {
    response: true, // or { codec: 'gzip' | 'zstd' | 'br' } — zstd needs Node ≥22.15
    request: false,  // Node only
  },
  keep_alive: {
    enabled: true,
    idle_socket_ttl: 2500, // must be < server Keep-Alive (Cloud ~3000)
  },
  clickhouse_settings: {},
  // access_token: '…', // Cloud JWT — mutually exclusive with user/pass
  // tls: { ca_cert: Buffer }, // private CA / mTLS + cert/key
  // session_id, role, application, http_headers, json: { parse, stringify }
})
```

URL DSN also works; prefer explicit object fields in app code. URL params override object fields (warning logged).

## Methods

| Method | When | Notes |
|---|---|---|
| `query` | SELECT / result sets | Client appends `FORMAT`; default format `"JSON"` — prefer `JSONEachRow` |
| `insert` | Primary ingest API | Default format `JSONCompactEachRow` — set `JSONEachRow` for objects; empty array = no request |
| `command` | DDL / no useful body / `INSERT … SELECT` / SQL functions in VALUES | Stream destroyed immediately |
| `exec` | Need raw response stream | **Must** consume/destroy stream |
| `ping` | Health | Does not throw; `{ select: true }` verifies auth |
| `close` | Shutdown | Also `Symbol.asyncDispose` |

### Shared params

```ts
{
  query?: string
  query_params?: Record<string, unknown>
  clickhouse_settings?: Record<string, string | number>
  abort_signal?: AbortSignal
  query_id?: string
  session_id?: string
  role?: string | string[]
  auth?: { username: string; password: string } | { access_token: string }
  http_headers?: Record<string, string>
}
```

## Formats

| Goal | Format |
|---|---|
| JS object rows (select/insert) | **`JSONEachRow`** |
| Large newline streams | `JSONEachRow` / `JSONCompactEachRow` |
| Progress events in stream | `JSONEachRowWithProgress` + `isProgressRow` / `isRow` |
| Single document | `JSON` (not streamable) |
| Files | `CSV*`, `Parquet`, … via streams/`exec` |

## ResultSet

```ts
rs.query_id
await rs.json<T>()   // T[] for *EachRow
await rs.text()
rs.stream()          // async iter of Row[] chunks
rs.close()           // free socket early
```

## Parameterized queries

```ts
await client.query({
  query: 'SELECT * FROM t WHERE id = {id:UInt64} AND name = {name:String}',
  query_params: { id: '1', name: 'x' },
  format: 'JSONEachRow',
})
```

Server-side binding — the injection-safe path. `TupleParam` / `Map` for Tuple/Map types. Large params: `use_multipart_params` / `use_multipart_params_auto`.

## Streaming insert (Node)

```ts
import { Readable } from 'node:stream'

const stream = Readable.from(async function* () {
  for (const row of rows) yield row
}())

await client.insert({
  table: 'events',
  format: 'JSONEachRow',
  values: stream,
})
```

Respect backpressure (`push` returning `false`). Web client: no Node-style streaming inserts.

## Sessions

```ts
createClient({
  session_id: crypto.randomUUID(),
  max_open_connections: 1, // sticky — avoid concurrent session errors
})
```

## Long queries / progress

```ts
createClient({
  request_timeout: 400_000,
  clickhouse_settings: {
    send_progress_in_http_headers: 1,
    http_headers_progress_interval_ms: '110000', // UInt64 → string often safest
  },
  max_response_headers_size: 1024 * 1024,
})
```

Aborting HTTP may **not** cancel a server query — track `query_id` and `KILL QUERY` / `system.processes` when needed.

## Insert vs command

| Need | API |
|---|---|
| Array/stream of row objects | `insert` |
| `INSERT … SELECT` | `command` |
| `VALUES (now(), unhex(...))` | `command` + `query_params` |
| Parquet/CSV file body | `insert`/`exec` with byte stream + format |

## Keep-Alive

Client `idle_socket_ttl` **must be strictly less** than server Keep-Alive timeout. Cloud ≈ 3s → default **2500** ms. Too high → intermittent `ECONNRESET`.
