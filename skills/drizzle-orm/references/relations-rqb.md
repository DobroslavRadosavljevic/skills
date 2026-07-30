# Relational Queries v2 (RQB)

In **1.0 RC, RQBv1 is removed**. Only RQBv2 via `defineRelations` is supported for `db.query`.

Docs: https://orm.drizzle.team/docs/rqb · https://orm.drizzle.team/docs/relations-v1-v2

## Define relations

```ts
import { defineRelations } from "drizzle-orm";
import * as schema from "./schema";

export const relations = defineRelations(schema, (r) => ({
  users: {
    posts: r.many.posts(),
    groups: r.many.groups({
      from: r.users.id.through(r.usersToGroups.userId),
      to: r.groups.id.through(r.usersToGroups.groupId),
    }),
  },
  posts: {
    author: r.one.users({
      from: r.posts.authorId,
      to: r.users.id,
      optional: false,
    }),
  },
}));
```

Pass to the client:

```ts
const db = drizzle({ client, relations });
// NOT: drizzle({ client, schema }) for RQB in v1
```

## Query API

Object filters / orderBy (not v1 callbacks):

```ts
const data = await db.query.users.findMany({
  where: {
    email: { like: "%@example.com" },
    OR: [{ role: "admin" }, { role: "user" }],
  },
  orderBy: { id: "desc" },
  with: {
    posts: {
      where: { title: { ilike: "hello%" } },
      limit: 10,
      orderBy: { id: "asc" },
    },
  },
});

await db.query.users.findFirst({
  where: { id: 1 },
  with: { posts: true },
});
```

### M2M

Use `through(...)` on `from` / `to` as above — do not require hand-joined junction queries for simple graphs.

### Prefiltered relations

```ts
export const relations = defineRelations(schema, (r) => ({
  groups: {
    verifiedUsers: r.many.users({
      from: r.groups.id.through(r.usersToGroups.groupId),
      to: r.users.id.through(r.usersToGroups.userId),
      where: { verified: true },
    }),
  },
}));
```

## v1 → v2 map

| RQBv1 (removed) | RQBv2 |
| --- | --- |
| Per-table `relations(table, …)` | `defineRelations(schema, …)` |
| `drizzle({ schema })` for query | `drizzle({ relations })` |
| `fields` / `references` | `from` / `to` |
| Callback `where` / `orderBy` | Object maps (`{ id: 1 }`, `{ id: "asc" }`) |
| MySQL `{ mode: "planetscale" }` | Removed |
| `db._query` escape hatch | Removed |

Legacy type names may exist under `drizzle-orm/_relations` for tooling — **not** for writing new `db.query` code.

## Pitfalls

- Nested `where` / `orderBy` / `extras` callbacks must use the **callback table parameter**, not imported table objects.
- Split large graphs with `defineRelationsPart` and merge `{ relations: { ...a, ...b } }` when needed.
- Training-data snippets that show `relations(users, ({ many }) => …)` are **wrong** for RC.
