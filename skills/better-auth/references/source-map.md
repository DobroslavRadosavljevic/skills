# Source Map

Research snapshot: **2026-07-31**.

## Versions

| Package | Tag / version |
|---|---|
| `better-auth` | **1.6.25** (`latest`); `rc` 1.7.0-rc.2; `beta` 1.7.0-beta.10 |
| `auth` (CLI) | **1.6.25** — use this |
| `@better-auth/cli` | **1.4.21** — **stale, ignore** |
| Scoped 1.6.25 line | passkey, api-key, sso, scim, oauth-provider, stripe, expo, electron, i18n, adapters, redis-storage, telemetry, test-utils, core |
| Separate lines | `@better-auth/utils@0.5.x`, `@better-auth/infra@0.3.x`, `@better-auth/agent-auth@0.6.x`, `@better-auth/cimd@1.7-beta` |
| Misleading tag | npm `next` → 0.8.7-beta.5 — **do not use** |

## Canonical docs

1. https://www.better-auth.com/docs
2. https://www.better-auth.com/llms.txt
3. https://www.better-auth.com/docs/installation
4. https://www.better-auth.com/docs/concepts/database
5. https://www.better-auth.com/docs/concepts/cli
6. https://www.better-auth.com/docs/concepts/plugins
7. https://www.better-auth.com/docs/concepts/session-management
8. https://www.better-auth.com/docs/concepts/client
9. https://www.better-auth.com/docs/reference/options
10. https://www.better-auth.com/docs/reference/security
11. https://www.better-auth.com/docs/plugins
12. https://www.better-auth.com/docs/integrations
13. https://github.com/better-auth/better-auth
14. Docs MCP: `https://mcp.better-auth.com/mcp`
15. Security post (example): https://better-auth.com/blog/security-update-june-2026

Context7 library id: `/better-auth/better-auth` (also `/websites/better-auth`).

## Refresh

```sh
bun info better-auth
bun info auth
npm view better-auth version dist-tags
npm view @better-auth/passkey version
```

## Stale-doc traps

- Tutorials importing passkey/api-key from `better-auth/plugins` — use scoped packages.
- `@better-auth/cli` vs `auth` CLI mismatch.
- Legacy `oidcProvider` vs `@better-auth/oauth-provider`.
- Comparison blogs and download charts — not API truth.
- 1.7 beta features (CIMD, etc.) only on beta/rc channels.
