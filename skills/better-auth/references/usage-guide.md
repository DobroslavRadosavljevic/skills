# Better Auth Usage Guide

Snapshot: **`better-auth@1.7.5`** (2026-09-18). Docs: https://better-auth.com/docs · LLMs: https://better-auth.com/llms.txt

## Install

```sh
bun add better-auth
bunx auth@latest secret   # → BETTER_AUTH_SECRET (≥32 chars)
```

Optional (align patch with core):

```sh
bun add @better-auth/drizzle-adapter@1.7.5   # or prisma / mongo / memory / kysely
bun add @better-auth/passkey@1.7.5           # example scoped plugin
```

CLI is the **`auth`** package (`bunx auth@latest`), **not** lagged `@better-auth/cli@1.4.x`. The CLI requires **Node.js ≥ 22.12**.

Ignore npm dist-tag `next` (stale 0.8.x). Use **`latest` (1.7.5)**. Dist-tags `rc` / `beta` are leftover 1.7.0 prereleases — not current. Maintenance line `release-1.6` is 1.6.33 only.

From 1.6:

```sh
bunx auth@latest upgrade   # better-auth + synchronized @better-auth/* together
```

Then `generate` / `migrate`. Generated schema is **not** the full 1.7 upgrade — OAuth clients, MCP, SCIM, Microsoft `oid`, and device codes need the [1.7 upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide). Details: [security-patterns.md](security-patterns.md).

## Minimal server

```ts
import { betterAuth } from "better-auth"
// With ORM adapters prefer: import { betterAuth } from "better-auth/minimal"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { db } from "./db"

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }), // pg | mysql | sqlite
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: ["http://localhost:3000"],
  emailAndPassword: { enabled: true },
  socialProviders: {
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },
  plugins: [
    // organization(), twoFactor(), ...
  ],
})
```

Also valid: pass a `pg`/`mysql2`/`better-sqlite3` pool as `database` (built-in Kysely path).

`user.validateUserInfo` can reject an identity before create/link across OAuth, SSO, credentials, passwordless, and SCIM.

## Client

```ts
import { createAuthClient } from "better-auth/react" // or /client, /vue, /svelte, /solid

export const authClient = createAuthClient({
  // baseURL optional on same origin
  plugins: [
    // organizationClient(), twoFactorClient(), ...
  ],
})

// authClient.signIn.email({ email, password })
// authClient.signIn.social({ provider: "github", callbackURL: "/" })
// authClient.useSession()
```

Infer types: `typeof auth.$Infer.Session` / `typeof authClient.$Infer.Session`.

SSR: pass the server session into `authClient.hydrateSession(initialSession)` so `useSession` has data on first paint. Only the first non-null hydrate wins. See [frameworks-client.md](frameworks-client.md).

## Mount handler

Default path: `/api/auth/*`. The auth instance is fetch-compatible (`auth.handler(request)`).

| Stack | Pattern |
|---|---|
| Next App Router | `toNextJsHandler(auth)` from `better-auth/next-js` in `app/api/auth/[...all]/route.ts`; add `nextCookies()` **last** for server actions |
| TanStack Start | `createFileRoute("/api/auth/$")` + `auth.handler(request)`; `tanstackStartCookies()` last |
| Hono | `app.on(["POST","GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))` |
| Elysia | `.all("/api/auth/*", (ctx) => auth.handler(ctx.request))` or `.mount(auth.handler)` |
| Express | `toNodeHandler(auth)` from `better-auth/node` **before** `express.json()` (Express 5: `/api/auth/{*any}`) |
| Bun / Workers | `if (url.pathname.startsWith("/api/auth")) return auth.handler(request)` |

## Server session

```ts
const session = await auth.api.getSession({
  headers: request.headers, // or await headers() in Next
})
// session?.user, session?.session
```

Account APIs take the **local** `account.id` as `accountId`, or `{ useAccountCookie: true }`. Do not pass `providerId` as the selector.

## Env checklist

```env
BETTER_AUTH_SECRET=...          # ≥32, high entropy
BETTER_AUTH_URL=https://app.example.com
# Optional rotation: BETTER_AUTH_SECRETS=2:new,1:old
```

## After adding plugins

1. Register server plugin + client plugin (same feature). Generic OAuth is the exception: **no** client plugin — use `signIn.social` / `linkSocial`.
2. `bunx auth@latest generate` (Drizzle/Prisma) then run ORM migrate — **or** `bunx auth@latest migrate` for Kysely only.
3. Typecheck `$Infer` / client methods.

Admin bootstrap: `bunx auth@latest create-admin --email admin@example.com --name Admin --role admin` (requires `admin()` plugin + DB).

## Auth methods (quick)

| Method | Where |
|---|---|
| Email/password | Core `emailAndPassword` |
| Social OAuth | Core `socialProviders` (google, github, apple, cloudflare, …) |
| Arbitrary OAuth | Plugin `genericOAuth` via `signIn.social({ provider })` — PKCE on; callback `/api/auth/callback/:id` |
| Magic link | Plugin `magicLink` + `sendMagicLink` |
| Email OTP | Plugin `emailOTP` + `sendVerificationOTP` |
| Passkeys | `@better-auth/passkey` |
| 2FA | Plugin `twoFactor` (`enableTwoFactor` method `"otp"` \| `"totp"`) |
| Username | Plugin `username` (+ email/password) |
| Phone | Plugin `phoneNumber` + `sendOTP` |
| Anonymous | Plugin `anonymous` |
| Orgs | Plugin `organization` |
| Admin | Plugin `admin` |
| API keys | `@better-auth/api-key` |
| Bearer session | Plugin `bearer` |
| JWT for services | Plugin `jwt` |
| OAuth/OIDC **provider** | `@better-auth/oauth-provider` (legacy `oidcProvider` removed) |
| MCP auth | `@better-auth/mcp` + `@better-auth/cimd` + `jwt()` |
| Device (app session) | Plugin `deviceAuthorization` → `/device/token` |
| Device (OAuth API) | `oauthDeviceAuthorization()` from `@better-auth/oauth-provider` → `/oauth2/token` |

Details: [plugins-ecosystem.md](plugins-ecosystem.md).
