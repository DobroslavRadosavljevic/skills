---
name: polar
description: "Build, review, debug, secure, or migrate Polar.sh (merchant of record) payments and billing in TypeScript apps with current docs. Use for @polar-sh/sdk 1.0 (createPolar, createPolarCore, date-versioned imports like @polar-sh/sdk/2026-10, snake_case fields, iterList, PolarClientError/PolarRateLimitError), organization access tokens and scopes, sandbox vs production (sandbox-api.polar.sh), products and prices (fixed, pay-what-you-want, free, metered, seat-based, unit-based, multi-currency), checkout links vs checkouts.create vs embedded checkout (@polar-sh/checkout), external_customer_id and external_id, Customer State (getStateExternal), customerSessions.create and the customer portal, subscription lifecycle (proration invoice/prorate/next_period/reset, cancel_at_period_end, revoke, pause/resume, trials, past_due), benefits (feature_flag, license_keys, downloadables, github_repository, discord, meter_credit, custom), usage-based billing (meters, events.ingest, external_id dedupe, credits), discounts, refunds, webhooks (webhooks.validateEvent, Standard Webhooks, webhook-id dedupe, customer.state_changed, order.paid, subscription.* events), adapters (@polar-sh/better-auth 2.1, @polar-sh/nextjs, @polar-sh/tanstack-start, @polar-sh/nuxt, deprecated express/hono/elysia/fastify/remix/sveltekit/astro), the Better Auth polar plugin (checkout, portal, usage, webhooks), the polar CLI (listen, trigger), and migrations from Stripe, Lemon Squeezy, or the pre-1.0 SDK."
---

# Polar

Use this skill when work touches Polar.sh billing: checkout, customers, subscriptions, benefits and entitlements, usage-based billing, webhooks, the Better Auth plugin, or a move from Stripe, Lemon Squeezy, or the old SDK.

Snapshot: `@polar-sh/sdk@1.0.2` (2026-10-02), API version `2026-10` (Current). Refresh from [source-map.md](references/source-map.md) if the installed package or API version differs.

## Workflow

1. Inspect the local surface before editing:
   - `@polar-sh/sdk` version. `<1.0` means `new Polar({ server })`, camelCase fields, and `@polar-sh/sdk/webhooks`. `>=1.0` means `createPolar` from a versioned path. Never mix the two.
   - Adapters in use (`@polar-sh/better-auth`, `@polar-sh/nextjs`, `@polar-sh/tanstack-start`, `@polar-sh/nuxt`) and whether any deprecated framework adapter pins SDK `^0.47`.
   - Environment: sandbox vs production tokens, `environment` option, webhook endpoint URL and `api_version`, secret storage (names only, never values).
   - Identity: which immutable app ID maps to Polar `external_id` (user or organization), and where entitlements are stored.
   - Existing webhook handler: raw body, verification, dedupe table, queue, event list.
2. Refresh current docs when the task depends on latest APIs, API-version changes, or adapter versions. Start from [source-map.md](references/source-map.md). Prefer installed SDK types over docs prose for exact field names.
3. Route the work to the focused references:
   - Client, API versions, tokens and scopes, sandbox, errors, pagination: [sdk-setup.md](references/sdk-setup.md).
   - Products, prices, checkout links/sessions/embed, discounts, trials: [catalog-checkout.md](references/catalog-checkout.md).
   - Customers, external IDs, Customer State, portal, subscriptions, seats, orders, refunds: [customers-subscriptions.md](references/customers-subscriptions.md).
   - Benefits, meters, event ingestion, credits: [benefits-usage.md](references/benefits-usage.md).
   - Webhook receiver, signing, idempotency, event sequences, local testing: [webhooks.md](references/webhooks.md).
   - Framework adapters and the Better Auth plugin: [adapters-better-auth.md](references/adapters-better-auth.md).
   - Migrations from Stripe, Lemon Squeezy, or SDK 0.x: [migration.md](references/migration.md).
   - Security and go-live checklists: [security-go-live.md](references/security-go-live.md).
4. Build against sandbox first. Verify at the narrowest boundary (signature check, handler, entitlement write), then end to end with `polar listen` / `polar trigger` or a sandbox purchase.

## Core Judgment

- **Webhooks are the source of truth.** Checkout `success_url`, the browser redirect, and `checkout.status` do not prove payment or entitlement. Grant and revoke access from verified webhooks (`customer.state_changed`, `benefit_grant.*`, `order.paid`, `subscription.*`), with Customer State API reads as reconciliation.
- Verify the signature on the raw body with `webhooks.validateEvent` before parsing. Persist the `webhook-id` with a unique constraint, ack with 2xx fast (target under 2 seconds), process in a worker, and make every write idempotent and order-tolerant. Never dedupe on `data.id`.
- Pin the API version in code (`@polar-sh/sdk/2026-10`) and on the webhook endpoint (`api_version`). SDK package version and API version are separate. Do not deep-import across versions.
- SDK 1.0 fields are `snake_case` (`external_customer_id`, `success_url`, `customer_portal_url`); service and method names stay camelCase (`customerSessions.create`, `customers.getStateExternal`). Do not rename user-defined `metadata` keys. Use `createPolarCore` plus service functions only where an adapter or bundle size requires it.
- Map your user or org to Polar with `external_customer_id` at checkout and `external_id` on the customer. It is unique per Polar organization and immutable once set. Never use email as the durable key.
- Create checkouts and customer sessions on the server for the authenticated user. Never accept `customer_id`, `external_customer_id`, or `return_url` from an untrusted caller.
- Organization access tokens are server-only, scoped, and separate per environment (sandbox tokens fail in production). Request least-privilege scopes.
- Gate features with a `feature_flag` benefit plus Customer State or `customer.state_changed`, not by guessing from subscription status. Reconcile both grants and revocations. For seats, identify users by `member`, not the paying `customer`.
- Metered usage: every event needs a stable `external_id`, one customer reference, and an exact match to the meter filter. Polar never blocks usage when a balance hits zero; enforce limits in the app.
- Prefer `cancel_at_period_end` over revoke. Revoke is immediate and irreversible and does not refund. Refunding an order does not end a subscription.
- Polar is the merchant of record. There is no Stripe-style test mode: use the separate sandbox (`sandbox.polar.sh`). Do not run test purchases with real cards in production.
- Framework adapters: maintained now are `@polar-sh/better-auth`, `@polar-sh/nextjs`, `@polar-sh/tanstack-start`, `@polar-sh/nuxt`. Express, Hono, Elysia, Fastify, Remix, SvelteKit, Astro, Deno, and Supabase adapters are deprecated and pin SDK `^0.47`; use the SDK directly.
- Never ask for, paste, echo, or log live tokens, webhook secrets, or customer data. Refer to env var names only. If a secret leaks, tell the user to rotate it in the Polar dashboard.
- Prefer `bun` / `bunx` in command examples.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- Typecheck against the installed SDK types; grep for leftover `new Polar(`, `@polar-sh/sdk/webhooks`, camelCase Polar fields, or mixed API-version imports.
- Webhook: invalid signature returns 403, malformed payload 400, unknown signed event type is acked, handler errors surface as 5xx, duplicate `webhook-id` is a no-op, out-of-order events converge.
- Entitlement: purchase grants, cancel at period end keeps access until `ends_at`, revoke and `past_due` follow the organization grace period, refund behavior is as intended.
- Checkout: `external_customer_id` set, `success_url` contains `{CHECKOUT_ID}` only for display, `customer_ip_address` forwarded when created server-side.
- Usage: duplicate `external_id` returns `duplicates`, not double billing; hard limits enforced locally.
- Sandbox end-to-end with the CLI or a sandbox checkout; production smoke only with a free product or 100% discount.
- Run the go-live checklist in [security-go-live.md](references/security-go-live.md) before switching `environment` to production.

Report which checks ran, which did not, and any version, API-version, or sandbox-vs-production assumptions that remain.
