---
name: better-auth
description: "Build, review, debug, configure, migrate, teach, or plan Better Auth TypeScript auth with current docs and official ecosystem packages. Use for better-auth 1.7, betterAuth, createAuthClient, auth.api, auth.handler, emailAndPassword, socialProviders, genericOAuth, organization, admin, twoFactor, passkey, magicLink, emailOTP, phoneNumber, username, anonymous, bearer, apiKey, jwt, oauth-provider, mcp, cimd, oauthDeviceAuthorization, sso, scim, stripe, drizzleAdapter, prismaAdapter, redis-storage, Expo, Electron, hydrateSession, nextCookies, trustedOrigins, validateUserInfo, and bunx auth@latest generate/migrate/upgrade/create-admin."
---

# Better Auth

Use this skill for self-hosted TypeScript authentication with **Better Auth** (`better-auth@1.7.5`): server instance, client SDK, plugins, adapters, framework mounts, and security.

Snapshot: **2026-09-18**. `latest` is **1.7.5** (stable). Do not treat 1.7 as rc/beta. Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local surface:
   - Core: `better-auth` (snapshot **1.7.5**). CLI: **`bunx auth@latest`** (package `auth@1.7.5`) — not stale `@better-auth/cli@1.4.x`. CLI needs **Node.js ≥ 22.12**.
   - Env: `BETTER_AUTH_SECRET` (≥32), `BETTER_AUTH_URL` / `baseURL`, `trustedOrigins`.
   - Database: Kysely/pool vs Drizzle/Prisma/Mongo adapter; secondary storage (Redis). Schema validation is **on by default**.
   - Plugins: server + matching **client** plugins; schema generated after changes.
   - Mount: `/api/auth/*` (default `basePath`) via `auth.handler` / framework helper.
2. For day-to-day setup, follow [usage-guide.md](references/usage-guide.md) first. From 1.6, start with `bunx auth@latest upgrade` and the [1.7 upgrade guide](https://better-auth.com/docs/guides/1-7-upgrade-guide) — generated SQL is not the full upgrade.
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Plugins & scoped packages: [plugins-ecosystem.md](references/plugins-ecosystem.md).
   - Schema, adapters, CLI: [adapters-schema.md](references/adapters-schema.md).
   - Framework mounts & clients: [frameworks-client.md](references/frameworks-client.md).
   - Security, sessions, 1.7 identity/OAuth gotchas: [security-patterns.md](references/security-patterns.md).
5. Align every installed `@better-auth/*` at **1.7.x** with core (except separate lines: `utils`, `infra`, `agent-auth`, `dash`). Prefer scoped adapters when optimizing (`better-auth/minimal`).
6. Verify with session smoke (`auth.api.getSession`), sign-in/out, plugin schema migrate, and production secret/origins checks.

## Core Judgment

- Cookie DB sessions by default — **not JWT**. Use `jwt` / `bearer` / API keys only when cookies aren’t enough.
- Singleton `auth` in `lib/auth.ts` (named export helps CLI discovery). Separate `auth-client.ts`.
- Server: `auth.api.*` with real request **headers**. Client: `createAuthClient` + framework entry (`better-auth/react`, …).
- Most features are **plugins**: register server + client, then `bunx auth@latest generate` (ORM) or `migrate` (Kysely).
- Passkey / API key / SSO / SCIM / OAuth-provider / MCP / CIMD / Stripe / Expo are **scoped packages**. MCP is **`@better-auth/mcp`**, not `better-auth/plugins`.
- **`oidcProvider` is removed.** Use `@better-auth/oauth-provider`. Do not also register `oauthProvider()` next to `mcp()` — `mcp()` is the provider.
- Generic OAuth uses **`signIn.social` / `linkSocial`** and `/api/auth/callback/:id`. There is no `genericOAuthClient()`.
- Never treat middleware cookie presence as auth — validate session. Don’t disable CSRF/origin checks to “fix” CORS.
- Rate limit is off/weak in dev; memory storage fails on multi-instance — use Redis/DB in prod.
- Prefer **`bun` / `bunx`** in command examples.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls better-auth` and matching `@better-auth/*` versions (all 1.7.x together).
- `bunx auth@latest info` / `secret` as needed; schema `generate`/`migrate` after plugin changes.
- Smoke: mount handler, `getSession`, email or social sign-in, sign-out.
- Plugins: client methods resolve; org/2FA/passkey/OAuth-provider/MCP flows if enabled.
- Prod: `baseURL`, secret length, `trustedOrigins`, HTTPS cookies, rate-limit storage, schema validation not failing.
- Security: roles/`additionalFields` with `input: false`; no `testUtils` in prod config.
- After 1.6→1.7: Microsoft `oid` rows, OAuth clients, SCIM reprovision, Expo `await getCookie()`, and 1.7.0–1.7.2 `issuer` cleanup if that schema was applied.

Report which checks ran, which did not, and version assumptions that remain.
