# Drizzle 1.0 RC Usage Guide

End-to-end guide for **`drizzle-orm@rc` / `drizzle-kit@rc`** (1.0.0-rc.4). Prefer `bun` / `bunx`.

**Critical:** npm `latest` is still **0.45.x**. This skill targets the **`rc`** channel only unless stable 1.0 has shipped and the project has moved.

Companion docs: [schema-queries.md](schema-queries.md) · [relations-rqb.md](relations-rqb.md) · [kit-migrations.md](kit-migrations.md) · [seed-validators.md](seed-validators.md) · [effect-integration.md](effect-integration.md) · [drivers-upgrade.md](drivers-upgrade.md)

---

## 1. Install (always `@rc`)

```sh
bun add drizzle-orm@rc
bun add -D drizzle-kit@rc

# optional
bun add -D drizzle-seed@rc eslint-plugin-drizzle@rc

# driver peers (pick one)
bun add postgres          # postgres.js
# bun add pg              # node-postgres
# bun add @neondatabase/serverless
# bun add @libsql/client
```

```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:check": "drizzle-kit check"
  }
}
```

Verify:

```sh
bun pm ls drizzle-orm drizzle-kit
# expect 1.0.0-rc.x — not 0.45.x / 0.31.x
```

---

## 2. Greenfield layout

```
src/db/
  schema.ts          # tables
  relations.ts       # defineRelations
  index.ts           # drizzle client
drizzle.config.ts
drizzle/             # kit migrations output (v3 folders)
```

### `drizzle.config.ts`

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dbCredentials: { url: process.env.DATABASE_URL! },
});
```

### Minimal schema + relations + client

```ts
// schema.ts
import { integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

```ts
// relations.ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    // add r.many.* / r.one.* as tables grow
  },
}));
```

```ts
// index.ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { relations } from "./relations";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({ client, relations });
```

```sh
bunx drizzle-kit push --explain   # local prototype
bunx drizzle-kit generate         # then migrate for real workflows
bunx drizzle-kit migrate
```

---

## 3. Day-to-day commands

| Goal | Command |
| --- | --- |
| Generate SQL from schema | `bunx drizzle-kit generate` |
| Apply migrations | `bunx drizzle-kit migrate` |
| Push schema (dev) | `bunx drizzle-kit push` / `--explain` |
| Introspect DB → TS | `bunx drizzle-kit pull` |
| Commutativity check | `bunx drizzle-kit check` |
| Upgrade 0.x migration folders | `bunx drizzle-kit up` |
| Studio | `bunx drizzle-kit studio` |
| Export DDL | `bunx drizzle-kit export` |
| Runtime migrate | `migrate(db, { migrationsFolder: "./drizzle" })` |

---

## 4. Progressive adoption

### Phase A — Client + tables

Dialect core + driver factory; one or two tables; `push` locally.

### Phase B — Migrations

Switch to `generate` + `migrate`; commit `drizzle/` folders; wire CI migrate job.

### Phase C — Relations

Add `defineRelations`; pass `{ relations }`; use `db.query` for nested reads.

### Phase D — Validators / seed

`drizzle-orm/zod` (or valibot/typebox/arktype/effect-schema); optional `drizzle-seed@rc` for fixtures.

### Phase E — Effect (optional)

Move to `drizzle-orm/effect-postgres` (or dialect) with `effect@beta` + `@effect/sql-*`. See [effect-integration.md](effect-integration.md).

---

## 5. Query style cheat sheet

```ts
import { eq, sql } from "drizzle-orm";

// SQL QB
await db.select().from(users).where(eq(users.email, "a@b.com"));
await db.insert(users).values({ email: "a@b.com" }).returning();
await db.update(users).set({ email: "c@d.com" }).where(eq(users.id, 1));
await db.delete(users).where(eq(users.id, 1));

await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: "x@y.com" });
});

// RQB (needs relations on client)
await db.query.users.findMany({
  where: { email: { like: "%@example.com" } },
  orderBy: { id: "desc" },
});
```

---

## 6. Production vs local

| Environment | Prefer |
| --- | --- |
| Local spike | `push` (+ `--explain`) |
| Shared / prod | `generate` → review SQL → `migrate` |
| Brownfield DB | `pull` → refine schema → generate |
| Seed data | `drizzle-seed` on **non-prod** only |

---

## 7. Coming from 0.x (`latest`)

```sh
bun add drizzle-orm@rc
bun add -D drizzle-kit@rc
bunx drizzle-kit up
```

Then rewrite RQBv1 → v2, remove `drizzle({ casing })`, move validators in-tree, retest codecs. Full checklist: [drivers-upgrade.md](drivers-upgrade.md).

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Types / APIs look like old training data | On `0.45.x` or RQBv1 snippets | Install `@rc`; use `defineRelations` |
| Kit fails resolving ORM | Kit RC without ORM RC | Install both `@rc` |
| `db.query` missing relations | Passed `{ schema }` only | Pass `{ relations }` |
| Wrong column names | Expected instance casing | Use `snakeCase.table` / explicit names |
| Cache-like wrong timestamps/JSON | Codec changes | Retest; read v0–v1 notes |
| Migration folder chaos | Still on journal.json | `drizzle-kit up` |
| Effect peer errors | `@effect/sql-drizzle` + RC | Use `drizzle-orm/effect-*` + Effect v4 |

---

## 9. Agent checklist

1. Confirm versions are **1.0.0-rc.x**, not 0.x `latest`.
2. Match dialect + driver entrypoint to the runtime (Node/Bun/edge).
3. Prefer generate+migrate for anything beyond a throwaway DB.
4. Never invent RQBv1 APIs.
5. For Effect apps, use native `effect-*` drivers — not `@effect/sql-drizzle` on RC.
6. Do not seed or `push --force` against production without explicit user intent.
