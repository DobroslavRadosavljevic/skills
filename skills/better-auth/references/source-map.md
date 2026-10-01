# Source Map

Research snapshot: **2026-10-01**.

## Versions

| Package | Tag / version |
|---|---|
| `better-auth` | **1.7.7** (`latest`, 2026-09-30). `release-1.6` → 1.6.33 (no fix for the 1.7.7 advisories). `release-1.4` → 1.4.22. `rc` → 1.7.0-rc.6. `beta` → 1.7.0-beta.10 |
| `auth` (CLI) | **1.7.7** — use this. Engines: Node.js ≥ 22.12 |
| `@better-auth/cli` | **1.4.21** — **stale, ignore** |
| Scoped **1.7.7** line | passkey, api-key, sso, scim, oauth-provider, mcp, cimd, stripe, expo, electron, i18n, adapters, redis-storage, telemetry, test-utils, core |
| Separate lines | `@better-auth/utils@0.5.0`, `@better-auth/infra@0.4.13`, `@better-auth/agent-auth@0.6.2`, `@better-auth/dash@0.1.6` |
| Misleading tag | npm `next` → 0.8.7-beta.5 — **do not use** |

**1.7.7 is current stable.** CIMD and MCP live on `latest`, not a beta channel.

1.7.7 notes (security): fixes critical **GHSA-965c-763c-88jm** (OAuth state accepted as a Magic Link token → account takeover; affects `>= 1.4.0-beta.18, < 1.7.7` with Magic Link + social/Generic OAuth + database state) and high **GHSA-r4xp-prcw-77qf** (OAuth Proxy accepts sign-in state as a provider profile; `>= 1.5.0-beta.12, < 1.7.7`). Also: ID-token sign-in respects provider `disableSignUp`; JSON `Content-Type` on captcha/rate-limit errors; `@better-auth/oauth-provider` adds `validateRedirectUri` and `verifyOAuthQueryParams`; `@better-auth/drizzle-adapter` fixes concurrent PostgreSQL rate-limit overrun (GHSA-44jh-23m7-hpcf, low).

1.7.6 notes: admin `bannedUserMessage` may be a function of the banned user; captcha provider `"vercel-botid"`; `PASSWORD_TOO_LONG` before hashing; React hydration and overlapping auth-query fixes; D1/SQLite schema-validation fixes; CLI `check` / `check schema`.

Other recent advisories: `@better-auth/sso` GHSA-mx9r-x6ww-qjw9 (personal SSO providers, fixed 1.7.3); device authorization GHSA-q84f-53jg-9ppm (fixed 1.7.0-rc.3).

1.7.5 notes: `database.schemaName` for direct PostgreSQL; CIMD consecutive-fetch pacing; Drizzle lazy-init with relations; core DB option types outside Workers.

## Canonical docs

1. https://better-auth.com/docs
2. https://better-auth.com/llms.txt (indexes 1.7; 1.6 at `/docs/1.6/llms.txt`)
3. https://better-auth.com/docs/llms.txt
4. https://better-auth.com/docs/installation
5. https://better-auth.com/docs/guides/1-7-upgrade-guide
6. https://better-auth.com/blog/1-7
7. https://better-auth.com/changelog
8. https://better-auth.com/docs/concepts/database
9. https://better-auth.com/docs/concepts/cli
10. https://better-auth.com/docs/concepts/plugins
11. https://better-auth.com/docs/concepts/session-management
12. https://better-auth.com/docs/concepts/client
13. https://better-auth.com/docs/reference/options
14. https://better-auth.com/docs/reference/security
15. https://better-auth.com/docs/plugins
16. https://better-auth.com/docs/plugins/mcp
17. https://better-auth.com/docs/plugins/cimd
18. https://better-auth.com/docs/plugins/oauth-provider
19. https://better-auth.com/docs/integrations
20. https://github.com/better-auth/better-auth
21. Docs MCP: `https://mcp.better-auth.com/mcp`

Context7 library ids: `/better-auth/better-auth`, `/websites/better-auth`.

## Refresh

```sh
bun info better-auth
bun info auth
npm view better-auth version dist-tags
npm view @better-auth/passkey version
npm view @better-auth/mcp version
npm view @better-auth/cimd version
npm view @better-auth/cli version
```

## Stale-doc traps

- Treating 1.7 as rc/beta, or installing `rc`/`beta` tags instead of `latest`.
- Tutorials importing passkey/api-key/MCP from `better-auth/plugins` — use scoped packages.
- `@better-auth/cli` vs `auth` CLI mismatch.
- Legacy `oidcProvider` (removed in 1.7) vs `@better-auth/oauth-provider`.
- `signIn.oauth2` / `genericOAuthClient` — replaced by `signIn.social` / `linkSocial`.
- `experimental: { joins: true }` — now `advanced.database.joins`.
- `withMcpAuth` / `mcpHandler` / `/mcp/*` OAuth paths — 1.7 names are `requireMcpAuth`, `createMcpProtectedRequestHandler`, `/oauth2/*`.
- Account `issuer` column required — only 1.7.0–1.7.2; 1.7.3+ uses `(providerId, accountId)` like 1.6.
- Comparison blogs and download charts — not API truth.
- Staying on 1.6.x or 1.7.0–1.7.6 with Magic Link or OAuth Proxy enabled — upgrade to 1.7.7 or apply the advisory workarounds.

Advisories: https://github.com/better-auth/better-auth/security/advisories
