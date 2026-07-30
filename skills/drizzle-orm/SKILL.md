---
name: drizzle-orm
description: "Build, review, debug, configure, migrate, teach, or plan Drizzle ORM 1.0 RC (not 0.x) with kit, seed, validators, and Effect drivers. Use for drizzle-orm@rc, drizzle-kit@rc, drizzle-seed@rc, defineRelations RQBv2, pgTable/mysqlTable/sqliteTable, generate migrate push pull studio, drizzle-orm/zod|valibot|typebox|arktype|effect-schema, drizzle-orm/effect-postgres and other effect-* drivers, codecs, snakeCase, InferSelectModel, and 0.x-to-1.0 upgrades."
---

# Drizzle ORM (1.0 RC)

Use this skill for Drizzle **1.0 release candidates** (`drizzle-orm@rc`, currently **1.0.0-rc.4**), plus **drizzle-kit**, **drizzle-seed**, in-tree validators, Studio, and official **Effect** drivers.

Do **not** treat npm `latest` (`0.45.x`) as current for new work. Pin the `rc` channel for ORM + Kit + Seed together.

## Workflow

1. Inspect the local Drizzle surface:
   - Exact versions / dist-tags for `drizzle-orm`, `drizzle-kit`, `drizzle-seed`, `eslint-plugin-drizzle`.
   - Dialect + driver entrypoints (`postgres-js`, `neon-http`, `bun-sql`, `libsql`, `effect-postgres`, …).
   - Schema files, `defineRelations`, `drizzle.config.ts`, migrations folder shape (v3 folders vs legacy journal).
   - Whether Effect (`effect@beta` + `drizzle-orm/effect-*`) or Promise drivers are in use.
2. For install, day-to-day usage, baselines, and troubleshooting, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task touches RQBv2, kit v3 migrations, codecs, or Effect. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Schema + SQL query builder: [schema-queries.md](references/schema-queries.md).
   - RQBv2 `defineRelations` / `db.query`: [relations-rqb.md](references/relations-rqb.md).
   - Kit CLI, config, generate/migrate/push/pull/studio: [kit-migrations.md](references/kit-migrations.md).
   - Seed + Zod/Valibot/TypeBox/ArkType/Effect Schema: [seed-validators.md](references/seed-validators.md).
   - Effect drivers vs `@effect/sql-drizzle`: [effect-integration.md](references/effect-integration.md).
   - Driver matrix + 0.x → RC upgrade: [drivers-upgrade.md](references/drivers-upgrade.md).
5. Preserve the project's dialect and driver unless the user asks to switch.
6. Verify with the narrowest useful query, `bunx drizzle-kit check` / `generate --explain`-style dry runs, or a focused migrate against a disposable DB.

## Core Judgment

- **Always install `@rc`** for new Drizzle 1.0 work: `bun add drizzle-orm@rc` and `bun add -D drizzle-kit@rc`. Never mix RC ORM with Kit `0.31.x`.
- **RQBv1 is gone.** Use `defineRelations(schema, …)` and pass `{ relations }` into `drizzle()` — not per-table `relations()` + `{ schema }` for `db.query`.
- Prefer SQL query builder for joins/aggregations; prefer RQB for nested graphs.
- Casing is on **tables** (`snakeCase.table` / `camelCase.table`), not `drizzle({ casing })`.
- Production schema changes: **generate → migrate**. Use **push** only for local prototyping (`--explain` first).
- After leaving 0.x: run `bunx drizzle-kit up` once to convert migration folders to v3 (no `journal.json`).
- Validators live **in-tree**: `drizzle-orm/zod`, `…/valibot`, `…/typebox`, `…/arktype`, `…/effect-schema`. Avoid standalone `drizzle-zod@0.x` with RC.
- Effect on RC: use **`drizzle-orm/effect-*` + Effect v4 beta** (`effect@beta`, matching `@effect/sql-*`). Do **not** pair RC with `@effect/sql-drizzle` (Effect v3 / drizzle `<0.50` only).
- Prefer `$inferSelect` / `$inferInsert` (aliases: `InferSelectModel` / `InferInsertModel`).
- Companion Effect architecture details: use the `effect` skill alongside this one.

## Verification

Prefer repository-owned commands. For meaningful Drizzle RC work, cover the relevant subset:

- Typecheck schema + relations + client factory.
- Focused insert/select/update/delete or `db.query.*.findMany` against a real or test DB.
- `bunx drizzle-kit generate` then review SQL; `migrate` on disposable DB; `check` for branch conflicts.
- Seed: `reset` + `seed` on a non-prod database only.
- Effect path: provide `PgClient` (or dialect) layer and run one Effect program end-to-end.
- After 0.x upgrades: confirm RQBv2 rewrite, casing builders, migrator folder v3, and codec-sensitive columns (arrays, timestamps, JSON).

Report which checks ran, which did not, and any `@rc` vs `latest` assumptions that remain.
