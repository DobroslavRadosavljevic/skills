# drizzle-kit and Migrations (1.0 RC)

Install: `bun add -D drizzle-kit@rc` with matching `drizzle-orm@rc`.

Docs: https://orm.drizzle.team/docs/kit-overview · https://orm.drizzle.team/docs/drizzle-config-file

## Commands

| Command | Role |
| --- | --- |
| `generate` | Schema → SQL migration folders + snapshots |
| `migrate` | Apply pending SQL to the database |
| `push` | Schema → DB directly (no files) |
| `pull` | Introspect DB → TypeScript schema |
| `studio` | Local Studio (proxy → local.drizzle.studio) |
| `check` | Commutativity / race checks across branches |
| `up` | Upgrade 0.x migration folders → v3 |
| `export` | Print DDL for external migrators |
| `mcp` | MCP server over stdio exposing generate/push/check/export/up/pull as tools |
| `skills` | Installs Drizzle Kit's bundled agent skills into the project |

**Removed:** `drizzle-kit drop` (now prints "remove the migration folder manually") and `meta/_journal.json`. Dialect-suffixed legacy commands (`generate:pg`, `check:sqlite`, …) only print the new name.

```sh
bunx drizzle-kit generate
bunx drizzle-kit migrate
bunx drizzle-kit push --explain
bunx drizzle-kit push --force          # data-loss without prompts — careful
bunx drizzle-kit pull
bunx drizzle-kit check
bunx drizzle-kit up
bunx drizzle-kit studio
bunx drizzle-kit export
```

`--strict` was removed from push — prompting is default; use `--force` to skip. `generate` also takes `--ignore-conflicts` to skip the commutativity check (avoid unless you ran `check` yourself).

## Non-interactive runs (CI, scripts, agents)

Since rc.4, `generate`, `push`, `pull`, `up`, `export`, and `check` accept `--output text|json`.

- `--output json` emits one typed JSON envelope (status, errors, payload) and never prompts.
- `--output text` with a non-TTY stdin is also non-interactive.
- Unresolved renames and destructive changes come back as a `missing_hints` envelope (or a missing-decisions report in text mode). Re-run with the decisions supplied up front: `--hints '<json array>'` or `--hints-file ./hints.json`.

```sh
bunx drizzle-kit generate --output json
bunx drizzle-kit push --output json --hints-file ./drizzle-hints.json
```

Programmatic SDK (same contract as the JSON CLI):

```ts
import { generate, push, check } from "drizzle-kit/cli";
// also: pull, up, exportSql; types GenerateOptions, PushOptions, Hint, MissingHint, …
```

Contract docs live next to the kit source: `OUTPUT_MODES.md`, `JSON_CONTRACT.md`, `HINTS.md`, `SDK.md`, `MCP.md` (see [source-map.md](source-map.md)). Never answer a `confirm_data_loss` hint for a production database without explicit user approval.

## `defineConfig`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql", // mysql | sqlite | turso | singlestore | mssql | cockroach | …
  schema: "./src/db/schema.ts", // string | string[] | globs
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
  // driver: "pglite" | "aws-data-api" | … when needed

  migrations: {
    table: "__drizzle_migrations",
    schema: "drizzle", // PG schema for the log table
  },

  breakpoints: true,
  verbose: true,
  tablesFilter: "*",
  schemaFilter: ["public"], // v1 default if omitted: ALL schemas — set explicitly
  extensionsFilters: ["postgis"],
  introspect: { casing: "camel" }, // pull only
});
```

Kit `introspect.casing` ≠ ORM table casing builders.

## Workflows

| Workflow | When |
| --- | --- |
| **generate → migrate** | Production / teams — reviewable SQL history |
| **push** | Local prototyping only |
| **pull** | DB-first / brownfield |
| **export** | Hand off to Atlas / other migrators |
| **check** | Detect conflicting migrations across branches |
| **up** | Once when leaving 0.x |

## Migration folder v3

- No `meta/_journal.json`.
- Each migration is its own folder (SQL + snapshot).
- Migrator applies **all missing** migrations by folder name (not only “newer than last timestamp”).
- Migration table gains `name` / `applied_at`-style columns — `up` rewrites for you.

## Runtime migrator

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const client = postgres(process.env.DATABASE_URL!, { max: 1 });
const db = drizzle({ client });
await migrate(db, { migrationsFolder: "./drizzle" });
await client.end();
```

Same pattern under `drizzle-orm/<driver>/migrator` and Effect `drizzle-orm/effect-*/migrator`.

Config: `{ migrationsFolder, migrationsTable?, migrationsSchema? }`.

## Studio

```sh
bunx drizzle-kit studio
# --host / --port / --verbose
```

Opens the hosted Studio UI against a local proxy. Not open source. Gateway (remote Studio) is a separate product/alpha.

## Teams / CI tips

- Commit generated SQL; run `migrate` in deploy pipelines.
- Run `check` on PRs that touch migrations (use `--output json` when CI parses the result).
- Never `push --force` in production pipelines.
- Keep Kit + ORM versions locked together in the lockfile.
