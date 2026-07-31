# Better Auth Usage Guide

Snapshot: **`better-auth@1.6.25`**. Docs: https://www.better-auth.com/docs · LLMs: https://www.better-auth.com/llms.txt

## Install

```sh
bun add better-auth
bunx auth@latest secret   # → BETTER_AUTH_SECRET (≥32 chars)
```

Optional (align patch with core):

```sh
bun add @better-auth/drizzle-adapter@1.6.25   # or prisma / mongo / memory / kysely
bun add @better-auth/passkey@1.6.25           # example scoped plugin
```

CLI is the **`auth`** package (`bunx auth@latest`), **not** lagged `@better-auth/cli@1.4.x`.

Ignore npm dist-tag `next` (stale 0.8.x). Use `latest` (1.6.x) or explicit `rc`/`beta` for 1.7.

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

## Mount handler

Default path: `/api/auth/*`.

| Stack | Pattern |
|---|---|
| Next App Router | `toNextJsHandler(auth)` from `better-auth/next-js` in `app/api/auth/[...all]/route.ts`; add `nextCookies()` **last** for server actions |
| TanStack Start | `auth.handler(request)` on `api/auth/$`; `tanstackStartCookies()` last |
| Hono | `app.on(["POST","GET"], "/api/auth/*", (c) => auth.handler(c.req.raw))` |
| Elysia | `.all("/api/auth/*", (ctx) => auth.handler(ctx.request))` or `.mount(auth.handler)` |
| Express | `toNodeHandler(auth)` from `better-auth/node` **before** `express.json()` |
| Bun / Workers | `if (url.pathname.startsWith("/api/auth")) return auth.handler(request)` |

## Server session

```ts
const session = await auth.api.getSession({
  headers: request.headers, // or await headers() in Next
})
// session?.user, session?.session
```

## Env checklist

```env
BETTER_AUTH_SECRET=...          # ≥32, high entropy
BETTER_AUTH_URL=https://app.example.com
# Optional rotation: BETTER_AUTH_SECRETS=2:new,1:old
```

## After adding plugins

1. Register server plugin + client plugin (same feature).
2. `bunx auth@latest generate` (Drizzle/Prisma) then run ORM migrate — **or** `bunx auth@latest migrate` for Kysely only.
3. Typecheck `$Infer` / client methods.

## Auth methods (quick)

| Method | Where |
|---|---|
| Email/password | Core `emailAndPassword` |
| Social OAuth | Core `socialProviders` (google, github, apple, …) |
| Arbitrary OAuth | Plugin `genericOAuth` |
| Magic link | Plugin `magicLink` + `sendMagicLink` |
| Email OTP | Plugin `emailOTP` + `sendVerificationOTP` |
| Passkeys | `@better-auth/passkey` |
| 2FA | Plugin `twoFactor` |
| Username | Plugin `username` (+ email/password) |
| Phone | Plugin `phoneNumber` + `sendOTP` |
| Anonymous | Plugin `anonymous` |
| Orgs | Plugin `organization` |
| Admin | Plugin `admin` |
| API keys | `@better-auth/api-key` |
| Bearer session | Plugin `bearer` |
| JWT for services | Plugin `jwt` |

Details: [plugins-ecosystem.md](plugins-ecosystem.md).
