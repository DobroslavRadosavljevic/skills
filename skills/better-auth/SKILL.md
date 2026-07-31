---
name: better-auth
description: "Build, review, debug, configure, migrate, teach, or plan Better Auth TypeScript auth with current docs and official ecosystem packages. Use for better-auth, betterAuth, createAuthClient, auth.api, auth.handler, emailAndPassword, socialProviders, genericOAuth, organization, admin, twoFactor, passkey, magicLink, emailOTP, phoneNumber, username, anonymous, bearer, apiKey, jwt, oauth-provider, sso, scim, stripe, drizzleAdapter, prismaAdapter, redis-storage, Expo, Electron, nextCookies, trustedOrigins, and bunx auth@latest generate/migrate."
---

# Better Auth

Use this skill for self-hosted TypeScript authentication with **Better Auth** (`better-auth@1.6.25`): server instance, client SDK, plugins, adapters, framework mounts, and security.

## Workflow

1. Inspect the local surface:
   - Core: `better-auth` (snapshot **1.6.25**). CLI: **`bunx auth@latest`** (package `auth@1.6.25`) — not stale `@better-auth/cli@1.4.x`.
   - Env: `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL` / `baseURL`, `trustedOrigins`.
   - Database: Kysely/pool vs Drizzle/Prisma/Mongo adapter; secondary storage (Redis).
   - Plugins: server + matching **client** plugins; schema generated after changes.
   - Mount: `/api/auth/*` (default `basePath`) via `auth.handler` / framework helper.
2. For day-to-day setup, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Plugins & scoped packages: [plugins-ecosystem.md](references/plugins-ecosystem.md).
   - Schema, adapters, CLI: [adapters-schema.md](references/adapters-schema.md).
   - Framework mounts & clients: [frameworks-client.md](references/frameworks-client.md).
   - Security, sessions, patterns: [security-patterns.md](references/security-patterns.md).
5. Align every installed `@better-auth/*` at **1.6.x** with core (except separate lines: `utils`, `infra`, `agent-auth`, beta `cimd`). Prefer scoped adapters when optimizing (`better-auth/minimal`).
6. Verify with session smoke (`auth.api.getSession`), sign-in/out, plugin schema migrate, and production secret/origins checks.

## Core Judgment

- Cookie DB sessions by default — **not JWT**. Use `jwt` / `bearer` / API keys only when cookies aren’t enough.
- Singleton `auth` in `lib/auth.ts` (named export helps CLI discovery). Separate `auth-client.ts`.
- Server: `auth.api.*` with real request **headers**. Client: `createAuthClient` + framework entry (`better-auth/react`, …).
- Most features are **plugins**: register server + client, then `bunx auth@latest generate` (ORM) or `migrate` (Kysely).
- Passkey / API key / SSO / SCIM / OAuth-provider / Stripe / Expo are **scoped packages** — don’t invent old `better-auth/plugins` import paths for those.
- Prefer `@better-auth/oauth-provider` over legacy built-in `oidcProvider`.
- Never treat middleware cookie presence as auth — validate session. Don’t disable CSRF/origin checks to “fix” CORS.
- Rate limit is off/weak in dev; memory storage fails on multi-instance — use Redis/DB in prod.
- Prefer **`bun` / `bunx`** in command examples.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls better-auth` and matching `@better-auth/*` versions.
- `bunx auth@latest info` / `secret` as needed; schema `generate`/`migrate` after plugin changes.
- Smoke: mount handler, `getSession`, email or social sign-in, sign-out.
- Plugins: client methods resolve; org/2FA/passkey flows if enabled.
- Prod: `baseURL`, secret length, `trustedOrigins`, HTTPS cookies, rate-limit storage.
- Security: roles/`additionalFields` with `input: false`; no `testUtils` in prod config.

Report which checks ran, which did not, and version assumptions that remain.
