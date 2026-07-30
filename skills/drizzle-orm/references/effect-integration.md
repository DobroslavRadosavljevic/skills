# Effect Integration (Drizzle 1.0 RC)

Two different stacks exist. **Only the native RC drivers belong with `drizzle-orm@rc`.**

For Effect services, layers, and Schema v4 patterns beyond the Drizzle drivers, use current Effect v4 docs for the installed `effect@beta` version.

## Recommended: native `drizzle-orm/effect-*` (Effect v4)

Peers (approx):

- `drizzle-orm@rc`
- `effect@beta` (≥ `4.0.0-beta.83`)
- Matching `@effect/sql-pg` / `@effect/sql-mysql2` / `@effect/sql-pglite` / `@effect/sql-libsql` / … on the Effect v4 beta line
- Driver peers (`pg`, etc.) as required by the SQL package

```sh
bun add drizzle-orm@rc effect@beta @effect/sql-pg pg
bun add -D drizzle-kit@rc @types/pg
```

Entrypoints include:

| Module | Use |
| --- | --- |
| `drizzle-orm/effect-postgres` | Postgres via `@effect/sql-pg` |
| `drizzle-orm/effect-mysql2` | MySQL |
| `drizzle-orm/effect-pglite` | PGLite |
| `drizzle-orm/effect-libsql` | LibSQL / Turso |
| `drizzle-orm/effect-d1` | Cloudflare D1 |
| `drizzle-orm/effect-sqlite-bun` / `effect-sqlite-node` / … | SQLite variants |
| `drizzle-orm/effect-schema` | Table → Effect Schema |
| `drizzle-orm/effect-*/migrator` | Runtime migrations |

```ts
import * as PgDrizzle from "drizzle-orm/effect-postgres";
import { PgClient } from "@effect/sql-pg";
import * as Effect from "effect/Effect";
import * as Redacted from "effect/Redacted";
import { sql } from "drizzle-orm";
import { relations } from "./relations";

const PgClientLive = PgClient.layer({
  url: Redacted.make(process.env.DATABASE_URL!),
});

const program = Effect.gen(function* () {
  const db = yield* PgDrizzle.makeWithDefaults({ relations });
  return yield* db.execute<{ id: number }>(sql`SELECT 1 as id`);
});

Effect.runPromise(program.pipe(Effect.provide(PgClientLive)));
```

Exact `make` / `makeWithDefaults` / layer helpers can vary slightly by driver — check the installed module exports and https://orm.drizzle.team/docs/connect-effect-postgres.

### Effect Schema from tables

```ts
import { createInsertSchema, createSelectSchema } from "drizzle-orm/effect-schema";
import { Schema } from "effect";

const UserInsert = createInsertSchema(users);
```

Prefer this over inventing parallel schemas by hand when the table is the source of truth.

## Do not use with RC: `@effect/sql-drizzle`

| | `@effect/sql-drizzle@0.51` |
| --- | --- |
| Effect | **v3** (`effect ^3.22`) |
| Drizzle peer | **`>=0.43 <0.50`** (0.x line) |
| Exports | `./Pg`, `./Mysql`, `./Sqlite` |
| Role | Patch drizzle to run through Effect `SqlClient` |

**Incompatible with `drizzle-orm@1.0.0-rc.*`.** Keep it only for Effect v3 + drizzle 0.x codebases.

```ts
// Effect v3 + drizzle 0.x only — NOT for this skill's RC target
const db = yield* Pg.PgDrizzle;
yield* db.insert(users).values({ name: "Alice" });
```

## npm dist-tag confusion

| Tag on `drizzle-orm` | Meaning |
| --- | --- |
| **`rc`** | **Current release candidate — use this** |
| `effect` / `effect3` / `drizzle-effect` / `effect-fixes` / … | Old **beta snapshots** — do not install for new work |
| `latest` | Still 0.45.x until stable 1.0 ships |

```sh
# good
bun add drizzle-orm@rc

# bad for RC + Effect v4
bun add drizzle-orm@effect3
bun add @effect/sql-drizzle
```

## Decision table

| Stack | Approach |
| --- | --- |
| Drizzle 1.0 RC + Effect v4 | **`drizzle-orm/effect-*`** + `@effect/sql-*@beta` + `effect@beta` |
| Effect v3 stable today | Stay on drizzle **0.x** + `@effect/sql-drizzle`, or wait for alignment |
| Promise/async app, no Effect | Normal `drizzle-orm/<driver>` factories |

## Pitfalls

- Mixing Effect v3 mental model (`@effect/sql-drizzle`) with RC packages.
- Forgetting to provide the SQL client layer before running programs.
- Using standalone `drizzle-zod` instead of `drizzle-orm/effect-schema` / `drizzle-orm/zod` on RC.
- Assuming Gel/DuckDB Effect drivers exist because docs mention a dialect — verify package exports.
