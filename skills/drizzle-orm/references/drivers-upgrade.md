# Drivers Matrix and 0.x → 1.0 RC Upgrade

## Driver entrypoints (`import { drizzle } from "…"`)

| Target | Entrypoint | Typical peer |
| --- | --- | --- |
| postgres.js | `drizzle-orm/postgres-js` | `postgres` ≥3 |
| node-postgres | `drizzle-orm/node-postgres` | `pg` ≥8 |
| Neon HTTP | `drizzle-orm/neon-http` | `@neondatabase/serverless` |
| Neon WebSocket | `drizzle-orm/neon-serverless` | same |
| Vercel Postgres | `drizzle-orm/vercel-postgres` | `@vercel/postgres` |
| PlanetScale | `drizzle-orm/planetscale-serverless` | `@planetscale/database` |
| mysql2 | `drizzle-orm/mysql2` | `mysql2` |
| better-sqlite3 | `drizzle-orm/better-sqlite3` | `better-sqlite3` |
| libSQL / Turso | `drizzle-orm/libsql` (+ `/http`, `/web`, `/ws`, `/node`, `/wasm`) | `@libsql/client` |
| Turso Database | `drizzle-orm/tursodatabase` (+ variants) | `@tursodatabase/*` |
| Bun SQLite | `drizzle-orm/bun-sqlite` | `bun:sqlite` |
| Bun SQL | `drizzle-orm/bun-sql` (+ `/postgres`, `/mysql`, `/sqlite`) | Bun |
| D1 | `drizzle-orm/d1` | Workers types |
| Durable Objects SQLite | `drizzle-orm/durable-sqlite` | |
| PGLite | `drizzle-orm/pglite` | `@electric-sql/pglite` |
| AWS Data API PG | `drizzle-orm/aws-data-api/pg` | |
| MSSQL | `drizzle-orm/node-mssql` | `mssql` |
| Cockroach | `drizzle-orm/cockroach` | pg drivers |
| Effect drivers | `drizzle-orm/effect-*` | Effect v4 + `@effect/sql-*` |

Each driver usually also exports `…/migrator`.

### Caveats in rc.4

- **Gel:** docs may mention `gel` / `gel-core`; verify the installed package actually exports them before recommending.
- **DuckDB:** not a first-class RC get-started path in the published tarball — don’t assume it works without checking exports / kit dialect support.

Prefer Bun examples when the runtime is Bun: `drizzle-orm/bun-sqlite` or `drizzle-orm/bun-sql/postgres`.

---

## Upgrade checklist (0.x `latest` → `rc`)

Official: https://orm.drizzle.team/docs/upgrade-v1 · https://orm.drizzle.team/docs/v0-v1-changes

1. **Install same channel**

   ```sh
   bun add drizzle-orm@rc
   bun add -D drizzle-kit@rc
   # optional: drizzle-seed@rc eslint-plugin-drizzle@rc
   ```

2. **Upgrade migration folders**

   ```sh
   bunx drizzle-kit up
   ```

3. **Rewrite Relational Queries** to RQBv2 (`defineRelations` + `{ relations }`). Drop MySQL RQB `mode`.

4. **Replace instance casing** with `snakeCase.table` / `camelCase.table`.

5. **Move validators** to `drizzle-orm/zod` (etc.); remove standalone 0.x validator packages from the RC app.

6. **Fix schema APIs:** `.generatedAlwaysAs(sql|fn)`, array dimensions API, RLS helpers, table config arrays.

7. **Replace** `getTableColumns` → `getColumns`.

8. **Review `schemaFilter`** — kit now considers all schemas by default.

9. **Drop** `drizzle-kit drop` / push `--strict` habits; use `--force` / `--explain` deliberately.

10. **Retest codecs** — arrays, timestamps, JSON, and dialect-specific mappings.

11. **Effect users:** leave `@effect/sql-drizzle` behind; adopt `drizzle-orm/effect-*` + Effect v4, or stay on 0.x until ready.

12. Typecheck + run generate/migrate against a disposable database before production.

---

## Version channel rules

| Goal | Install |
| --- | --- |
| New 1.0 work (this skill) | `drizzle-orm@rc` + `drizzle-kit@rc` |
| Stay on stable 0.x | `latest` — **out of scope** for this skill’s defaults |
| Old Effect beta snapshots | Never — ignore `effect` / `effect3` / `drizzle-effect` tags |

When stable **1.0.0** eventually lands on `latest`, re-check dist-tags and update the skill snapshot; until then, **`@rc` is mandatory** for 1.0 APIs.
