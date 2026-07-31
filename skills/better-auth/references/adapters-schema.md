# Adapters, Schema & CLI

## Core tables

| Table | Key fields |
|---|---|
| `user` | `id`, `name`, `email` (unique), `emailVerified`, `image?`, timestamps |
| `session` | `id`, `userId`, `token` (unique), `expiresAt`, `ipAddress?`, `userAgent?`, timestamps |
| `account` | `id`, `userId`, `accountId`, `providerId`, tokens/password, timestamps |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, timestamps |

Rename via `modelName` / `fields` (TS still uses canonical names). Extend with `user.additionalFields` / `session.additionalFields`:

```ts
user: {
  additionalFields: {
    role: { type: "string", defaultValue: "user", input: false }, // not user-writable
  },
}
```

Plugins add tables/columns (orgs, passkeys, apikey, twoFactor, jwks, …). Always regenerate after enabling plugins.

## Adapter modes

| Mode | How | CLI migrate |
|---|---|---|
| Built-in Kysely | Pass `pg` Pool / `mysql2` / `better-sqlite3` as `database` | `bunx auth@latest migrate` applies |
| Drizzle | `drizzleAdapter(db, { provider: "pg"\|"mysql"\|"sqlite" })` | `generate` → Drizzle migrate |
| Prisma | `prismaAdapter(prisma, { provider: "postgresql"\|... })` | `generate` → Prisma migrate |
| MongoDB | `mongodbAdapter(db, { client? })` — pass `MongoClient` for transactions | generate per docs |
| Memory | memory adapter | tests/dev only |
| Stateless | omit `database` | cookie-only; most plugins still need DB |

Imports (prefer scoped when bundling with `better-auth/minimal`):

```ts
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
// or: import { drizzleAdapter } from "better-auth/adapters/drizzle"
```

## Secondary storage

```ts
import { redisStorage } from "@better-auth/redis-storage"
import Redis from "ioredis"

secondaryStorage: redisStorage({
  client: new Redis(process.env.REDIS_URL!),
  // keyPrefix?: string
})
```

Custom: `{ get, set, delete }`. Use for sessions, verification, rate limits on serverless/multi-instance. Options like `storeSessionInDatabase` / `preserveSessionInDatabase` matter when mixing Redis + DB.

## CLI (`auth` package)

```sh
bunx auth@latest generate   # emit Prisma/Drizzle/Kysely schema
bunx auth@latest migrate    # apply — Kysely path only
bunx auth@latest init
bunx auth@latest secret
bunx auth@latest info       # diagnostics (--json)
bunx auth@latest mcp        # wire docs MCP into agents
```

Flags: `--config`, `--output`, `--yes`.

Discovery looks for `auth.ts` under `./`, `./lib`, `./utils`, `src/*`, etc. Export named `auth`.

**Gotcha:** `@better-auth/cli@1.4.x` is stale — always `auth@latest`.

## Session defaults (concepts)

- Cookie session token → `session` row (unless secondary/stateless).
- Typical: `expiresIn` 7d, `updateAge` 1d, `freshAge` 1d for sensitive ops.
- Optional `session.cookieCache` (`compact` \| `jwt` \| `jwe`) to cut DB reads — short `maxAge` or disable when revocation must be immediate.

## Account linking

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
  },
}
```

Keep patched (≥1.6.x latest) — OAuth linking ownership issues have appeared in advisories.
