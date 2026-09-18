# Adapters, Schema & CLI

## Core tables

| Table | Key fields |
|---|---|
| `user` | `id`, `name`, `email` (unique), `emailVerified`, `image?`, timestamps |
| `session` | `id`, `userId`, `token` (unique), `expiresAt`, `ipAddress?`, `userAgent?`, timestamps |
| `account` | `id`, `userId`, `accountId`, `providerId`, tokens/password, timestamps. Identity key: **`(providerId, accountId)`**. `id` is the local row used by account APIs |
| `verification` | `id`, `identifier`, `value`, `expiresAt`, timestamps |

Rename via `modelName` / `fields` (TS still uses canonical names). Extend with `user.additionalFields` / `session.additionalFields`:

```ts
user: {
  additionalFields: {
    role: { type: "string", defaultValue: "user", input: false }, // not user-writable
  },
}
```

`input` and `returned` are independent. Roles/flags: `input: false`. `mapProfileToUser` cannot fill `input: false` fields.

Plugins add tables/columns (orgs, passkeys, apikey, twoFactor, jwks, oauthClient, scim*, deviceCode, …). Always regenerate after enabling plugins.

**1.7.0–1.7.2 only:** those releases added a required `account.issuer` column. **1.7.3+ restored the 1.6 key** and no longer writes `issuer`. If that column exists, relax/drop it (drop the unique index **before** the column on MySQL). New 1.6→1.7.5 upgrades do not add it. See the [upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide#account-identity-keeps-the-provider-key).

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

Drizzle Relations v2 is supported. Joins are stable:

```ts
advanced: { database: { joins: true } }  // not experimental.joins
```

Regenerate Drizzle/Prisma relations after enabling joins. With Drizzle `usePlural: true`, many-to-one relation **keys are singular** — update readers of the old plural keys.

PostgreSQL non-default schema (Kysely / direct PG, 1.7.5):

```ts
database: {
  dialect: new PostgresDialect({ pool }),
  type: "postgres",
  schemaName: "auth", // CLI qualify + create schema
}
```

Passing a raw `pg.Pool` still uses `search_path`. `schemaName` wins when both are set.

## Schema validation

On by default **including production**. Init and requests fail if the live schema (Kysely) or configured model (Drizzle/Prisma) does not match what Better Auth writes. Disable only if needed:

```ts
advanced: { database: { validateSchema: false } }
```

`auth migrate` / `generate` keep their own diagnostics. Restart after applying schema outside the CLI. Custom adapters without a registered check are not validated.

Programmatic Kysely migrations (Workers/D1, not Prisma/Drizzle):

```ts
import { getMigrations } from "better-auth/db/migration"
const { runMigrations } = await getMigrations(auth.options)
await runMigrations()
```

SCIM needs **native transactions**. D1 cannot host the 1.7 SCIM plugin.

## Secondary storage

```ts
import { redisStorage } from "@better-auth/redis-storage"
import Redis from "ioredis"

secondaryStorage: redisStorage({
  client: new Redis(process.env.REDIS_URL!),
  // keyPrefix?: string  — default "better-auth:"
})
```

Custom storage **must** implement `{ get, set, delete, increment, getAndDelete }`. `increment` and `getAndDelete` are required in 1.7. Official Redis storage already does.

Rate-limit custom storage uses a single **`consume(key, rule)`** — separate `get`/`set` are rejected.

Options `storeSessionInDatabase` / `preserveSessionInDatabase` matter when mixing Redis + DB. Sign-out with secondary storage runs deletion hooks and revokes bound OAuth tokens.

## CLI (`auth` package)

Node.js **≥ 22.12**. Discovery looks for `auth.ts` under `./`, `./lib`, `./utils`, `src/*`, `app/*`, `server/*`. Export named `auth`.

```sh
bunx auth@latest generate   # Prisma/Drizzle/Kysely schema (--adapter, --dialect, --output, --yes)
bunx auth@latest migrate    # apply — Kysely path only
bunx auth@latest init
bunx auth@latest secret
bunx auth@latest info       # diagnostics (--json); reports installed versions
bunx auth@latest upgrade    # 1.6 → 1.7 synchronized packages
bunx auth@latest create-admin --email admin@example.com --name Admin --role admin
```

Flags: `--config`, `--output`, `--yes`. `generate --adapter prisma|drizzle|kysely` can emit schema without a live DB (Kysely still introspects). `--output` to a **directory** picks an adapter-specific default filename.

**Gotcha:** `@better-auth/cli@1.4.x` is stale — always `auth@latest`.

## Session defaults (concepts)

- Cookie session token → `session` row (unless secondary/stateless).
- Typical: `expiresIn` 7d, `updateAge` 1d, `freshAge` 1d for sensitive ops.
- Optional `session.cookieCache` (`compact` \| `jwt` \| `jwe`) to cut DB reads — short `maxAge` or disable when revocation must be immediate.
- JWKS-backed cache JWTs: `jwt({ sessionCookieCache: true })` + `strategy: "jwt"`. Not interchangeable with `/token` JWTs.
- Replica-friendly: `session.deferSessionRefresh: true` makes GET `/get-session` read-only (`needsRefresh`); client POSTs to refresh.

## Account linking

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "github"],
  },
}
```

Microsoft accounts use directory **`oid`**, not pairwise `sub`. Migrate existing `microsoft` / `microsoft-entra-id` rows before production traffic. `microsoftEntraId` helper needs a concrete tenant GUID (`common` / `organizations` / `consumers` → built-in Microsoft provider).
