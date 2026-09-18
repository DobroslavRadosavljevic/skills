# Source Map

Research snapshot: **2026-09-18**.

## Versions

| Package | Tag / version |
|---|---|
| `better-auth` | **1.7.5** (`latest`). `release-1.6` → 1.6.33. `rc` → 1.7.0-rc.6. `beta` → 1.7.0-beta.10 |
| `auth` (CLI) | **1.7.5** — use this. Engines: Node.js ≥ 22.12 |
| `@better-auth/cli` | **1.4.21** — **stale, ignore** |
| Scoped **1.7.5** line | passkey, api-key, sso, scim, oauth-provider, mcp, cimd, stripe, expo, electron, i18n, adapters, redis-storage, telemetry, test-utils, core |
| Separate lines | `@better-auth/utils@0.5.0`, `@better-auth/infra@0.4.9`, `@better-auth/agent-auth@0.6.2`, `@better-auth/dash@0.1.6` |
| Misleading tag | npm `next` → 0.8.7-beta.5 — **do not use** |

**1.7.5 is current stable.** CIMD and MCP live on `latest`, not a beta channel.

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
