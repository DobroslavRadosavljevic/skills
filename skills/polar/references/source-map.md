# Source Map

Research snapshot: **2026-10-09**.

## Versions (npm registry)

| Package | `latest` | Published | Notes |
|---|---|---|---|
| `@polar-sh/sdk` | **1.0.2** | 2026-10-02 | 1.0.0 on 2026-09-28; `next` = 1.0.3-alpha.1 (2026-10-08); last 0.x was 0.49.0 (2026-07-20); engines Node >=22; ships bundled agent notes under `.agents/` in the tarball (SDK usage, webhooks, usage events, migration from 0.x) |
| `@polar-sh/better-auth` | **2.1.0** | 2026-10-06 | peers `better-auth ^1.7.0`, `@polar-sh/sdk ^1.0.2`, `zod ^3.25 \|\| ^4`; deps `@polar-sh/adapter-utils 1.1.0`, `@polar-sh/checkout 0.4.3`; `engines.node >=24` (docs say Node 22+) |
| `@polar-sh/nextjs` | **1.1.0** | 2026-10-06 | peer `next ^15 \|\| ^16`; pins `@polar-sh/sdk 1.0.2` |
| `@polar-sh/tanstack-start` | **1.1.0** | 2026-10-06 | peer `@tanstack/react-start ^1.168.0` |
| `@polar-sh/nuxt` | **1.1.0** | 2026-10-06 | `@nuxt/kit ^4.5.2`, peer `zod` |
| `@polar-sh/adapter-utils` | 1.1.0 | 2026-10-06 | shared internals |
| `@polar-sh/checkout` | 0.4.3 | 2026-10-06 | embed, payment-method embed; Stripe JS peers |
| `@polar-sh/cli` | 2.0.2 | 2026-10-05 | binary `polar`; also `curl -fsSL https://polar.sh/install.sh \| bash` |
| `@polar-sh/express` / `hono` / `elysia` / `fastify` | 0.6.6 / 0.5.6 / 0.5.6 / 0.5.6 | 2026-05-06 | deprecated in docs; SDK `^0.47` |
| `@polar-sh/remix` / `sveltekit` / `astro` / `supabase` | 0.6.6 / 0.7.6 / 0.7.6 / 0.4.5 | 2026-05-06 | deprecated in docs; SDK `^0.47` |
| `@polar-sh/ingestion` | 0.4.2 | 2025-11-21 | SDK `^0.41.5`; stale |
| `@convex-dev/polar` | 0.9.2 | 2026-06-25 | third-party Convex component |
| `better-auth` (context) | 1.7.7 | n/a | project baseline from the Better Auth security advisories |

Names that do not exist on npm as of this snapshot: `@polar-sh/laravel`, `deno`, `convex`, `payload`, `tanstack-router`, `cloudflare`, `nitro`, `react-router`, `solid-start`, `fresh`.

API versions in docs/OpenAPI: `2026-04`, `2026-10` (Current from the first week of October 2026; the SDK README default), `2027-01` (Next). Verify the exact Deprecated/Current/Next mapping on the versioning page before relying on it.

## Official documentation

Index: https://polar.sh/docs/llms.txt (every page is also available as `.md`; OpenAPI specs at `https://polar.sh/docs/openapi/2026-04.openapi.json`, `.../2026-10.openapi.json`, `.../2027-01.openapi.json`).

- Intro and MoR: https://polar.sh/docs/introduction , https://polar.sh/docs/merchant-of-record/introduction , https://polar.sh/docs/merchant-of-record/account-reviews
- Auth and tokens: https://polar.sh/docs/integrate/authentication , https://polar.sh/docs/integrate/oat
- Sandbox: https://polar.sh/docs/integrate/sandbox
- TypeScript SDK: https://polar.sh/docs/integrate/sdk/typescript , SDK README in the npm tarball
- API versioning: https://polar.sh/docs/api-reference/current/versioning ; API changelog https://polar.sh/docs/changelog/api ; product changelog https://polar.sh/docs/changelog/recent
- Customer State: https://polar.sh/docs/integrate/customer-state
- Products: https://polar.sh/docs/features/products
- Checkout: https://polar.sh/docs/features/checkout/links , .../session , .../embed , .../embed-payment-method , .../localization , .../payment-methods
- Pricing: https://polar.sh/docs/features/seat-based-pricing , .../unit-based-pricing , .../tax-inclusive-pricing , .../custom-fields , .../discounts
- Seat guide: https://polar.sh/docs/guides/seat-based-pricing
- Subscriptions: https://polar.sh/docs/features/subscriptions/introduction , .../manage , .../proration , .../failed-payments , .../trials
- Orders and refunds: https://polar.sh/docs/features/orders , https://polar.sh/docs/features/refunds
- Customers and portal: https://polar.sh/docs/features/customer-management , https://polar.sh/docs/features/customer-portal/introduction , .../navigate-customers , .../settings
- Benefits: https://polar.sh/docs/features/benefits/introduction , .../feature-flags , .../license-keys , .../file-downloads , .../github-access , .../discord-access , .../slack-shared-channel , .../custom , .../credits
- Usage billing: https://polar.sh/docs/features/usage-based-billing/introduction , .../event-ingestion , .../meters , .../credits , .../billing , .../ingestion-strategies/ingestion-strategy ; cost insights https://polar.sh/docs/features/cost-insights/introduction
- Webhooks: https://polar.sh/docs/integrate/webhooks/endpoints , .../delivery , .../events
- CLI: https://polar.sh/docs/integrate/cli/introduction , .../authentication , .../webhooks , .../reference
- Adapters: https://polar.sh/docs/integrate/sdk/adapters/introduction , .../better-auth , .../nextjs , .../tanstack-start , .../nuxt (deprecated pages: express, hono, elysia, fastify, remix, sveltekit, astro, deno, supabase)
- Stripe migration: https://polar.sh/docs/migrate
- MCP: https://polar.sh/docs/integrate/mcp (production `https://mcp.polar.sh/mcp/polar-mcp`, sandbox `https://mcp.polar.sh/mcp/polar-sandbox`)
- Source: https://github.com/polarsource/polar (`sdk/typescript`, `clients/adapters/*`); examples https://github.com/polarsource/examples ; Polar's integration notes repo https://github.com/polarsource/skills (its integration recipe still targets SDK 0.x and says all framework adapters are deprecated, which contradicts the current docs and npm for Better Auth, Next.js, TanStack Start, and Nuxt)

Context7 (docs lookup): `/polarsource/polar-js` (TypeScript SDK, may lag the 1.0 rewrite), `/polarsource/polar`, `/llmstxt/polar_sh_llms-full_txt`.

## Evidence notes and open doubts

- Scope names, event types, enum values, request fields, and method names were checked against the 2026-10 OpenAPI spec and the 1.0.2 `.d.mts` types, not only prose.
- Docs inconsistency: the webhook delivery page still shows `@polar-sh/sdk/webhooks` with the old synchronous `validateEvent`; the SDK 1.0.2 README and bundled notes use the versioned `webhooks` namespace and `await`. This skill follows the SDK.
- Docs inconsistency: some guides still show `polar.customerSeats.assign`, camelCase fields, or `polar.subscriptions.update({ id, ... })`; 1.0.2 types expose `customerSeats.assignSeat` and `subscriptions.update(id, body)`.
- Docs say Better Auth plugin needs Node 22+, package metadata says `>=24`.
- Lemon Squeezy details in [migration.md](migration.md) come from general knowledge, not Polar docs; Polar documents only a Stripe importer.
- Fees, payout timing, and supported countries were not captured; read https://polar.sh/docs/merchant-of-record/fees and .../supported-countries when asked.
- Webhook IP allowlist and `webhook-id`/signing details were current on 2026-09; re-read the delivery page before pinning firewall rules.
- Embedded checkout host enforcement, pause/resume, per-customer discount limits, unit-based pricing, `reset` proration (preview), and off-session orders (preview) are recent; confirm availability on the target organization's plan.
