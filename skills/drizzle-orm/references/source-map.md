# Source Map

This reference captures the Drizzle **1.0 RC** docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-30
- Docs: https://orm.drizzle.team
- Machine index: https://orm.drizzle.team/llms.txt
- Context7: `/drizzle-team/drizzle-orm-docs`, `/websites/orm_drizzle_team`

### Package versions (npm)

| Package | `latest` (avoid for new 1.0 work) | **`rc` (skill target)** |
| --- | --- | --- |
| `drizzle-orm` | 0.45.2 | **1.0.0-rc.4** |
| `drizzle-kit` | 0.31.10 | **1.0.0-rc.4** |
| `drizzle-seed` | 0.3.1 | **1.0.0-rc.4** |
| `eslint-plugin-drizzle` | 0.2.3 | **1.0.0-rc.4** |

Install:

```sh
bun add drizzle-orm@rc
bun add -D drizzle-kit@rc
bun add -D drizzle-seed@rc          # optional
bun add -D eslint-plugin-drizzle@rc # optional
```

Keep ORM + Kit (+ Seed) on the **same `rc` channel**. Historical dist-tags like `effect`, `effect3`, `drizzle-effect`, `beta` are **not** the RC line — do not use them for new work.

### Effect peers (RC native drivers)

- `effect` ≥ `4.0.0-beta.83` (prefer `effect@beta`)
- Matching `@effect/sql-pg` / `sql-mysql2` / `sql-pglite` / `sql-libsql` / … on the Effect v4 beta line
- **Not** `@effect/sql-drizzle@0.51` (Effect v3 + drizzle 0.x only)

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering "latest" questions — confirm whether `rc` or stable 1.0 has shipped.
2. Check registry:

   ```sh
   bun info drizzle-orm
   npm view drizzle-orm dist-tags
   npm view drizzle-kit dist-tags
   ```

3. Prefer https://orm.drizzle.team/docs/upgrade-v1 and dialect pages under `/docs/`. If docs and the installed RC disagree, report the mismatch.
4. Re-check Gel / DuckDB availability in the installed package exports before recommending those drivers.
5. For Effect work, confirm `effect@beta` and matching `@effect/sql-*` peers against current Effect docs.

## Official Pages

### Upgrade / 1.0

- https://orm.drizzle.team/docs/upgrade-v1
- https://orm.drizzle.team/docs/v0-v1-changes
- https://orm.drizzle.team/docs/relations-v1-v2
- Dialect variants: `/docs/{pg,mysql,sqlite}/v0-v1-changes`, `/docs/{pg,mysql,sqlite}/relations-v1-v2`

### Core

- Overview: https://orm.drizzle.team/docs/overview
- Get started: https://orm.drizzle.team/docs/get-started
- SQL schema: https://orm.drizzle.team/docs/sql-schema-declaration
- Relations declare: https://orm.drizzle.team/docs/relations-schema-declaration
- Relations: https://orm.drizzle.team/docs/relations
- RQB: https://orm.drizzle.team/docs/rqb
- Data querying: https://orm.drizzle.team/docs/data-querying
- Indexes & constraints: https://orm.drizzle.team/docs/indexes-constraints
- Generated columns: https://orm.drizzle.team/docs/generated-columns
- Migrations: https://orm.drizzle.team/docs/migrations
- JIT mappers: https://orm.drizzle.team/docs/jit-mappers

### Kit

- Kit overview: https://orm.drizzle.team/docs/kit-overview
- Config: https://orm.drizzle.team/docs/drizzle-config-file
- Generate / migrate / push / pull / studio / check / up / export — under kit docs on orm.drizzle.team
- Studio: https://orm.drizzle.team/docs/drizzle-kit-studio
- Team migrations: https://orm.drizzle.team/docs/kit-migrations-for-teams

### Seed & validators

- Seed: https://orm.drizzle.team/docs/seed-overview
- Seed functions: https://orm.drizzle.team/docs/seed-functions
- Zod: https://orm.drizzle.team/docs/zod
- Valibot: https://orm.drizzle.team/docs/valibot
- TypeBox: https://orm.drizzle.team/docs/typebox
- ArkType: https://orm.drizzle.team/docs/arktype
- Effect Schema: https://orm.drizzle.team/docs/effect-schema

### Effect

- Connect Effect Postgres: https://orm.drizzle.team/docs/connect-effect-postgres
- (Other Effect get-started pages under `/docs/get-started/effect-*`)

### Releases

- https://github.com/drizzle-team/drizzle-orm/releases/tag/v1.0.0-rc.4
- https://github.com/drizzle-team/drizzle-orm/releases
