# Testing and Migrations (TypeScript)

Integration testing and schema change patterns for ClickHouse apps using the official JS client.

## Integration tests — `@testcontainers/clickhouse`

Library (not an ORM): Docker ClickHouse for Vitest/Jest/etc.

```sh
bun add -d @testcontainers/clickhouse testcontainers
```

Snapshot aligned with ecosystem: **`@testcontainers/clickhouse@12.0.4`**.

```ts
import { createClient } from '@clickhouse/client'
import { ClickHouseContainer } from '@testcontainers/clickhouse'

const container = await new ClickHouseContainer('clickhouse/clickhouse-server:24.8')
  .withUsername('test')
  .withPassword('test')
  .start()

const client = createClient(container.getClientOptions())
// or createClient({ url: container.getHttpUrl(), username, password })

await client.command({
  query: 'CREATE TABLE … ENGINE = MergeTree ORDER BY id',
  clickhouse_settings: { wait_end_of_query: 1 },
})

await client.insert({ table: '…', format: 'JSONEachRow', values: […] })
const rs = await client.query({ query: 'SELECT …', format: 'JSONEachRow' })
await rs.json()

await client.close()
await container.stop()
```

Notes:

- Exposes **8123** (HTTP — use this) and **9000** (native — ignore for `@clickhouse/client`).
- Prefer `getClientOptions()` / `getHttpUrl()`.
- Docs: https://node.testcontainers.org/modules/clickhouse/

## Schema migrations — raw SQL

ClickHouse’s official stance: **versioned imperative SQL**, not a first-party ORM.

### Lightweight in-app

```ts
await client.command({
  query: migrationSql,
  clickhouse_settings: { wait_end_of_query: 1 }, // avoid DDL/insert races
})
```

Track applied versions in a `_migrations` table yourself if needed.

### `clickhouse-migrations` (Node ecosystem)

```sh
bun add -d clickhouse-migrations
```

- Version **1.4.0** depends on `@clickhouse/client@^1.23.1`.
- Numbered files `N_name.sql`; tracks `_migrations`.
- npm: https://www.npmjs.com/package/clickhouse-migrations

Official KB also lists cross-language tools (Atlas, golang-migrate, Goose, Flyway) — use when the monorepo already standardizes on them.

KB: https://clickhouse.com/docs/knowledgebase/schema_migration_tools

## Migration SQL tips for MergeTree

- Changing `ORDER BY` / partition key usually means **new table + insert select + rename**.
- Prefer additive columns (`ALTER TABLE ADD COLUMN`) with defaults.
- Backfill projections/indexes with `MATERIALIZE …`.
- Use `ON CLUSTER` carefully on self-hosted; Cloud DDL differs (no Distributed engine).

## Test checklist

1. Container HTTP URL → `createClient`.
2. DDL with `wait_end_of_query: 1`.
3. Insert `JSONEachRow` + query assert.
4. Consume/close ResultSets (no leaked sockets between tests).
5. For RMT/MV tests: assert with `FINAL` or merge-aware SQL, not plain SELECT alone.
