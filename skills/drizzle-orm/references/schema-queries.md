# Schema and SQL Query Builder (1.0 RC)

## Dialect cores

| Dialect | Import |
| --- | --- |
| PostgreSQL | `drizzle-orm/pg-core` |
| MySQL / TiDB / PlanetScale MySQL | `drizzle-orm/mysql-core` |
| SQLite / D1 / Turso / Bun SQLite | `drizzle-orm/sqlite-core` |
| MSSQL | `drizzle-orm/mssql-core` |
| Cockroach | `drizzle-orm/cockroach-core` |
| SingleStore | `drizzle-orm/singlestore-core` |

## Tables and columns

RC style: omit the DB name when it matches the JS key; pass a string when it differs.

```ts
import {
  pgTable, pgEnum, integer, text, timestamp,
  index, primaryKey, type AnyPgColumn,
} from "drizzle-orm/pg-core";
import { sql, type SQL } from "drizzle-orm";

export const roleEnum = pgEnum("role", ["guest", "user", "admin"]);

export const users = pgTable("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  email: text().notNull().unique(),
  role: roleEnum().default("guest").notNull(),
  invitedBy: integer("invited_by").references((): AnyPgColumn => users.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
}, (t) => [
  index("users_email_idx").on(t.email),
]);

export const posts = pgTable("posts", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  title: text().notNull(),
  authorId: integer("author_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [
  index("posts_author_idx").on(t.authorId),
]);
```

Extra table config callback returns an **array** (indexes, checks, composite PKs, FKs).

### Casing (breaking vs 0.x)

Do **not** use `drizzle({ casing: "snake_case" })`.

```ts
import { snakeCase, integer, text } from "drizzle-orm/pg-core";

export const users = snakeCase.table("users", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  fullName: text(), // → full_name
});
```

(`camelCase.table` also exists.)

### Generated columns / RLS

- `.generatedAlwaysAs()` accepts `sql` or `() => sql` only (not raw strings).
- Prefer `pgTable.withRLS(...)` over legacy `.enableRLS()` patterns.

### Types

```ts
type User = typeof users.$inferSelect;
type NewUser = typeof users.$inferInsert;
// aliases: InferSelectModel / InferInsertModel from "drizzle-orm"
```

Prefer `$infer*`. `getColumns(table)` replaces deprecated `getTableColumns`.

## Client factory

```ts
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { relations } from "./relations";

const client = postgres(process.env.DATABASE_URL!);
export const db = drizzle({
  client,
  relations,
  logger: true,
  // jit: true, // opt-in JIT mappers
});

// also valid:
// drizzle(url)
// drizzle(url, { relations })
// drizzle({ connection: url | options, relations })
// drizzle.mock({ relations })
```

## CRUD

```ts
import { eq, and, sql } from "drizzle-orm";

await db
  .select({ id: users.id, title: posts.title })
  .from(users)
  .leftJoin(posts, eq(posts.authorId, users.id))
  .where(eq(users.email, "a@b.com"));

await db.insert(users).values({ email: "a@b.com" }).returning();
await db.update(users).set({ email: "c@d.com" }).where(eq(users.id, 1));
await db.delete(users).where(eq(users.id, 1));

await db.select({ n: sql<number>`count(*)` }).from(users);

const q = db
  .select()
  .from(users)
  .where(eq(users.id, sql.placeholder("id")))
  .prepare("get_user"); // name optional in 1.0
await q.execute({ id: 1 });

await db.transaction(async (tx) => {
  await tx.insert(users).values({ email: "x@y.com" });
});
```

### Batch

Supported on drivers that expose it (LibSQL, Neon, D1, …):

```ts
await db.batch([
  db.insert(users).values({ email: "a@b.com" }),
  db.select().from(users),
]);
```

## Codecs

1.0 adds stronger driver-aware encode/decode (especially Postgres/MySQL arrays, JSON, timestamps). After upgrading, retest those columns — silent mapping differences are a top RC pitfall.

## When to use SQL QB vs RQB

| Need | Prefer |
| --- | --- |
| Joins, aggregates, complex SQL | SQL query builder |
| Nested graphs / `with` | RQBv2 (`db.query`) |
| Partial updates, bulk writes | SQL QB |
| Simple by-id reads with relations | RQB |

See [relations-rqb.md](relations-rqb.md).
