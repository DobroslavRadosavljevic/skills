---
name: clickhouse
description: "Build, review, debug, configure, migrate, teach, or plan ClickHouse analytics work from TypeScript with current docs and a full usage guide. Use for @clickhouse/client, @clickhouse/client-web, createClient, query, insert, command, exec, JSONEachRow, query_params, streaming, MergeTree family, ORDER BY/PARTITION BY, materialized views, projections, async_insert, FINAL, lightweight deletes, ClickHouse Cloud HTTPS, system.query_log, and TS schema/ingest patterns. TypeScript/Node SDKs only — not Python/Go/Java clients."
---

# ClickHouse (TypeScript)

Use this skill for ClickHouse OLAP work driven from TypeScript/Node: official JS clients, SQL the app runs, table design, ingest, Cloud vs self-hosted, and ops the app can query.

## Workflow

1. Inspect the local surface:
   - Packages: `@clickhouse/client` (Node) and/or `@clickhouse/client-web` (browser/Workers). Snapshot **1.23.1**. Node **`>=20`**. Server target **24.8+** for modern clients.
   - Connection: `url` (HTTPS Cloud `:8443` vs local HTTP `:8123`), auth (password vs Cloud JWT `access_token`), `database`, TLS.
   - Schema: engine (MergeTree family), `ORDER BY`, `PARTITION BY`, MVs/projections.
   - Ingest path: `insert()` batches vs `async_insert`, streams, empty-array no-op.
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Client API, formats, streams, settings: [client-ts.md](references/client-ts.md).
   - Engines, keys, MVs, projections, indexes: [sql-engines-modeling.md](references/sql-engines-modeling.md).
   - Insert/select SQL patterns, FINAL, JOINs, mutations: [ingest-query-patterns.md](references/ingest-query-patterns.md).
   - Types, Cloud, system tables, errors: [types-cloud-ops.md](references/types-cloud-ops.md).
   - Testcontainers + SQL migrations: [testing-migrations.md](references/testing-migrations.md).
5. Prefer official **`@clickhouse/client`** over unscoped/`clickhouse` community packages. Never interpolate user input into SQL — use `{name: Type}` + `query_params`.
6. Verify with focused `query`/`insert` smokes, part-count awareness for ingest, and consume/close every `ResultSet`.

## Core Judgment

- ClickHouse is **columnar OLAP**, not OLTP. Optimize for batched analytics, not high-QPS point lookups.
- JS clients speak **HTTP(S) only** (not native TCP 9000).
- Default to **MergeTree** + strong **`ORDER BY`**; partitions are for data management (TTL/DROP), not a substitute for the sort key.
- Prefer **batched `insert({ format: 'JSONEachRow' })`**; tiny sync inserts → `TOO_MANY_PARTS`. Use `async_insert=1` + `wait_for_async_insert=1` when clients cannot batch.
- Specialized engines (Replacing/Summing/Aggregating/Collapsing) need **correctness SQL** (`FINAL` or merge-aware aggregation) — merges are eventual.
- Prefer insert-only / RMT / MVs over chatty `ALTER UPDATE`/`DELETE` mutations; lightweight `DELETE FROM` for row deletes.
- Type traps: **UInt64 → string** in JSON; **Decimal as string**; Date as `'YYYY-MM-DD'`; always set `format: 'JSONEachRow'` for object rows (insert default is JSONCompactEachRow).
- Always **consume or `close()`** ResultSets — dangling streams cause `ECONNRESET`.
- One shared client per process; `close()` / `await using` on shutdown. Sessions → `max_open_connections: 1`.
- Cloud: HTTPS `:8443`, managed replication, no app-level `Distributed(...)` — use `remoteSecure` when needed.
- Prefer **`bun` / `bunx`** in command examples.

## Verification

Prefer repository-owned commands. For meaningful ClickHouse work, cover the relevant subset:

- `bun pm ls @clickhouse/client` and Node ≥20.
- Smoke: `ping({ select: true })`, DDL via `command`, `insert` + `query` with `JSONEachRow`.
- Ingest: batch size / async_insert settings; watch for error **252** too many parts.
- Streaming: full consume or `close()`; backpressure on insert streams.
- Cloud: TLS URL, credentials/JWT, keep-alive idle TTL &lt; server timeout (~2500 ms client default).
- Schema: `ORDER BY` matches filter patterns; RMT/MV correctness under `FINAL` or merge aggs.
- Tests: `@testcontainers/clickhouse` + `getClientOptions()` when integration tests exist.

Report which checks ran, which did not, and version/Cloud assumptions that remain.
