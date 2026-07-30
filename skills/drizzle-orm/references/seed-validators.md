# Seed and Validators (1.0 RC)

## drizzle-seed

```sh
bun add -D drizzle-seed@rc
```

Peer: `drizzle-orm` ≥ 1.0 beta/RC. Keep on the same `rc` channel.

Docs: https://orm.drizzle.team/docs/seed-overview · https://orm.drizzle.team/docs/seed-functions

```ts
import { drizzle } from "drizzle-orm/node-postgres";
import { seed, reset } from "drizzle-seed";
import * as schema from "./schema";

const db = drizzle(process.env.DATABASE_URL!);

await reset(db, schema); // dialect-aware truncate/delete — NON-PROD only

await seed(db, schema, { count: 1000, seed: 1 }).refine((f) => ({
  users: {
    count: 100,
    columns: {
      name: f.fullName({ isUnique: true }),
      email: f.email(),
      phone: f.phoneNumber({ template: "+1 (###) ###-####" }),
      photo: false, // skip → DB default
    },
    with: {
      posts: 5,
      // weighted related counts:
      // details: [{ weight: 0.6, count: [1, 2, 3] }, { weight: 0.4, count: [4, 5] }],
    },
  },
  posts: {
    columns: {
      title: f.valuesFromArray({ values: ["A", "B", "C"] }),
      body: f.loremIpsum({ sentencesCount: 3 }),
      score: f.weightedRandom([
        { weight: 0.7, value: f.int({ minValue: 1, maxValue: 10 }) },
        { weight: 0.3, value: f.int({ minValue: 11, maxValue: 100 }) },
      ]),
      tags: f.string({ arraySize: 3 }),
    },
  },
}));
```

### Options

| Option | Role |
| --- | --- |
| `count` | Default rows per table |
| `seed` | PRNG reproducibility |
| `version` | Generator version pin (`'1'`…`'4'`) when needed |

### Generators (refine `f.*`)

Includes: `int`, `number`, `boolean`, `string`, `uuid`, `email`, `phoneNumber`, `fullName`, `firstName`, `lastName`, `loremIpsum`, `date`/`time`/`timestamp`/`datetime`, `json`, `valuesFromArray`, `weightedRandom`, `intPrimaryKey`, geo (`point`, `line`, `geometry`), `inet`, `vector`, `bitString`, address/company helpers, …

Common opts: `isUnique`, `arraySize`, range bounds, templates.

### `reset` behavior

- Postgres: `TRUNCATE … CASCADE`
- MySQL: FK checks off + truncate
- SQLite: pragma + delete

Never run `reset` against production.

Also exports datasets (`firstNames`, `lastNames`, `cities`, …) and `seedForDrizzleStudio` when relevant.

---

## In-tree validators (prefer these on RC)

Standalone `drizzle-zod` / `drizzle-valibot` / … **0.x** packages peer old ORM — avoid with RC.

| Import | Replaces |
| --- | --- |
| `drizzle-orm/zod` | `drizzle-zod` |
| `drizzle-orm/valibot` | `drizzle-valibot` |
| `drizzle-orm/typebox` | `drizzle-typebox` (+ `typebox-legacy` for older TypeBox) |
| `drizzle-orm/arktype` | `drizzle-arktype` |
| `drizzle-orm/effect-schema` | Effect Schema helpers |

```ts
import { createInsertSchema, createSelectSchema, createUpdateSchema } from "drizzle-orm/zod";
import { z } from "zod";

const insertUser = createInsertSchema(users, {
  email: z.string().email(),
});

const selectUser = createSelectSchema(users);
```

Effect Schema:

```ts
import { createInsertSchema } from "drizzle-orm/effect-schema";
import { Schema, Effect } from "effect";

const UserInsert = createInsertSchema(users);
const program = Schema.decodeUnknownEffect(UserInsert)({
  email: "ada@example.com",
  role: "admin",
});
```

Docs: https://orm.drizzle.team/docs/zod · https://orm.drizzle.team/docs/effect-schema (and siblings).

---

## eslint-plugin-drizzle

```sh
bun add -D eslint-plugin-drizzle@rc
```

Use the RC plugin with RC ORM to catch Drizzle anti-patterns (keep versions aligned).
