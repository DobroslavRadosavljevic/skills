# Source Map

Docs and package snapshot used to create this skill. **TypeScript/JS clients only.**

## Snapshot

- Captured: 2026-07-31
- Official client: **`@clickhouse/client@1.23.1`** (Node), **`@clickhouse/client-web@1.23.1`**
- Engines: Node `>=20`; TypeScript `>=4.5`
- ClickHouse server: client 1.12+ targets **24.8+** (older best-effort)
- Protocol: **HTTP(S)** only (8123 / 8443)
- Repo: https://github.com/ClickHouse/clickhouse-js
- Context7: `/clickhouse/clickhouse-js`
- Optional: `@clickhouse/datatype-parser@0.1.3`, `@clickhouse/rowbinary@0.2.0`
- Deprecated: `@clickhouse/client-common` (bundled into clients as of 1.23.0)
- Not primary: unscoped npm `clickhouse@2.6.0` (stale community)

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before “latest” answers.
2. Check:

   ```sh
   bun pm ls @clickhouse/client
   npm view @clickhouse/client version
   ```

3. Prefer https://clickhouse.com/docs/integrations/javascript and https://clickhouse.com/docs/.
4. Re-check Keep-Alive / Cloud ports when diagnosing `ECONNRESET`.

## Official Pages

### Client (TS)

- JS client: https://clickhouse.com/docs/integrations/javascript
- Alt path: https://clickhouse.com/docs/integrations/language-clients/js
- HTTP interface: https://clickhouse.com/docs/interfaces/http
- GitHub: https://github.com/ClickHouse/clickhouse-js
- Examples: https://github.com/ClickHouse/clickhouse-js/tree/main/examples/node
- Keep-Alive: https://github.com/ClickHouse/clickhouse-js/blob/main/docs/howto/keep_alive_timeout.md
- Tracing: https://github.com/ClickHouse/clickhouse-js/blob/main/docs/howto/tracing.md

### Product / modeling

- Intro: https://clickhouse.com/docs/intro
- MergeTree family: https://clickhouse.com/docs/engines/table-engines/mergetree-family
- Choosing PK: https://clickhouse.com/docs/best-practices/choosing-a-primary-key
- Partitioning: https://clickhouse.com/docs/best-practices/choosing-a-partitioning-key
- Insert strategy: https://clickhouse.com/docs/best-practices/selecting-an-insert-strategy
- Async inserts: https://clickhouse.com/docs/optimize/asynchronous-inserts
- Materialized views: https://clickhouse.com/docs/materialized-views
- Skipping indexes: https://clickhouse.com/docs/optimize/skipping-indexes
- Projections: https://clickhouse.com/docs/sql-reference/statements/alter/projection
- Lightweight delete: https://clickhouse.com/docs/guides/developer/lightweight-delete
- Mutations: https://clickhouse.com/docs/guides/developer/mutations
- ReplacingMergeTree guide: https://clickhouse.com/docs/guides/replacing-merge-tree
- Joins: https://clickhouse.com/docs/guides/joining-tables
- Replication: https://clickhouse.com/docs/engines/table-engines/mergetree-family/replication
- Distributed: https://clickhouse.com/docs/engines/table-engines/special/distributed
- Cloud connect: https://clickhouse.com/docs/cloud/guides/sql-console/gather-connection-details
- Schema migrations KB: https://clickhouse.com/docs/knowledgebase/schema_migration_tools

### Related TS libs (not ClickHouse-core)

- `@testcontainers/clickhouse`: https://node.testcontainers.org/modules/clickhouse/
- `clickhouse-migrations`: https://www.npmjs.com/package/clickhouse-migrations
