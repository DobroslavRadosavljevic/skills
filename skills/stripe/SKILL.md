---
name: stripe
description: "Build, review, debug, test, secure, or migrate Stripe payments and billing in TypeScript apps with current docs. Use for stripe-node 23.x (API version 2026-09-30.endive), apiVersion pinning and Endive/Dahlia breaking changes (ui_mode hosted_page/embedded_page/elements, payment_method_types removal, billing_cycle_anchor object), @stripe/stripe-js 10, @stripe/react-stripe-js 7, Checkout Sessions (hosted, embedded, Elements), Payment Element, PaymentIntents, SetupIntents, Customers, Products, Prices, lookup_key, Billing subscriptions (trialing, active, past_due, unpaid, incomplete, paused, canceled), proration, pause/resume, Customer Portal (billingPortal.sessions), usage-based billing (Meters, meterEvents, v2 meterEventStream), Entitlements, coupons, promotion codes, Stripe Tax, invoices, refunds, disputes, webhooks (constructEventAsync, raw body in Bun/Elysia/Hono/TanStack Start, idempotent processing, ordering, retries), thin events and event destinations (parseEventNotification, notificationHandler), idempotency keys, sk_/rk_/pk_ keys, Stripe CLI (listen, trigger, events resend), test clocks, sandboxes, Connect basics, @better-auth/stripe, and go-live or security checklists."
---

# Stripe

Use this skill when work touches Stripe payments, subscriptions, webhooks, Stripe.js/React Elements, Stripe CLI testing, API-version upgrades, or the Better Auth Stripe plugin in a TypeScript app.

Snapshot: **2026-10-09**. `stripe@23.0.0` (2026-10-01, Node >= 20) pins API `2026-09-30.endive`. `@stripe/stripe-js@10.0.0`, `@stripe/react-stripe-js@7.0.0`. `@better-auth/stripe@1.7.7` peers `stripe ^18 – ^22` (not 23): use `stripe@22.6.2` (pinned `2026-08-26.dahlia`) with it. Refresh from [source-map.md](references/source-map.md) if versions differ.

## Safety (read first)

- Never ask for, accept, echo, or store real card numbers, `sk_live_`/`rk_live_` keys, or `whsec_` secrets in chat, files, logs, or commits. Read keys from env only; never print them. Ask the user to set secrets themselves.
- Work in test mode or a sandbox only. Never run write commands, `stripe trigger`, refunds, or cancellations against live keys. Use only Stripe's published test card numbers, in the user's own sandbox UI.
- Card data must never touch your server: use Checkout, Payment Element, or Stripe.js tokens. Do not build raw-card forms.

## Workflow

1. Inspect first: `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `@better-auth/stripe` versions; `apiVersion` in the client; webhook endpoint/destination API version and event format (snapshot vs thin); server framework and runtime; DB tables for customer/subscription/event mapping; key names in `.env.example` (not values).
2. Refresh docs when the task needs current API names, new Endive features, or a version differs. Start from [source-map.md](references/source-map.md); prefer the SDK's own `.d.ts` types as ground truth.
3. Route to focused references:
   - Versions, client setup, apiVersion pinning, breaking changes, v21→v23 and Stripe.js 10 migration: [versions-migration.md](references/versions-migration.md).
   - Checkout Sessions, Payment Element, PaymentIntents/SetupIntents, Customers, Products/Prices: [checkout-payments.md](references/checkout-payments.md).
   - Subscription lifecycle, statuses, proration, pause, trials, Customer Portal, state sync: [billing-subscriptions.md](references/billing-subscriptions.md).
   - Meters, meter events, Entitlements, credits: [usage-entitlements.md](references/usage-entitlements.md).
   - Coupons, promotion codes, Stripe Tax, invoices, refunds, disputes: [invoices-tax-discounts-disputes.md](references/invoices-tax-discounts-disputes.md).
   - Webhook handlers (Bun, Elysia, Hono, TanStack Start), idempotency, ordering, thin events: [webhooks-events.md](references/webhooks-events.md).
   - Stripe CLI, test clocks, sandboxes, keys, idempotency keys, errors, security and go-live checklists: [testing-security-go-live.md](references/testing-security-go-live.md).
   - Connect basics and the Better Auth Stripe plugin: [connect-better-auth.md](references/connect-better-auth.md).
4. Keep the repo's existing structure (client module, webhook route, DB schema). Do not swap integration style (Checkout vs Elements) unless asked.
5. Verify at the narrowest boundary (types, signature test, handler unit), then end to end with `stripe listen` + `stripe trigger` or a test clock in a sandbox.

## Core Judgment

- **Source of truth**: Stripe owns billing state; your DB is a projection kept current by webhooks. Never grant or revoke access from a redirect URL, `success_url` page load, or client callback. Grant from verified webhook events, then re-fetch the object from the API instead of trusting a stale payload. See [billing-subscriptions.md](references/billing-subscriptions.md).
- **Version trap**: the SDK sends its pinned API version on every request, but each webhook endpoint/destination has its own `api_version`. A mismatch gives payload shapes that differ from the SDK types. Pin both, upgrade together (Workbench upgrade has a 72-hour rollback), or use thin events, which are version-independent.
- Create the client once (`new Stripe(key, { apiVersion })`, never call `Stripe()` without `new`). Initialize lazily or with a placeholder if builds run without env. Types reflect only the SDK's pinned version.
- Verify webhooks with the **raw, unparsed body**, the `Stripe-Signature` header, and the endpoint's own secret. Use `constructEventAsync` (works on Bun, Workers, edge). Never skip verification or pass tolerance `0` outside tests.
- Webhooks are at-least-once, unordered, and retried (live: up to 3 days with backoff). Dedupe by `event.id` in the same DB transaction as the side effects; return 2xx fast; move slow work to a queue.
- Send an `idempotencyKey` on every POST that creates money-affecting or unique objects (customers, sessions, intents, refunds, meter events use `identifier`). Derive keys from your own stable ids, not random values per retry.
- Compute prices and amounts server-side from Price ids or your catalog. Never trust client-sent amounts, price ids, or `customer` ids without authorization checks.
- Map one app user or org to one Customer with a stored `stripe_customer_id` (unique) and `metadata.app_user_id`. Do not use email as identity. Do not rely on `customers.search` for correctness (eventually consistent).
- Prefer Prices with `lookup_key` over hard-coded `price_` ids across sandbox/live. Prices are immutable; create new ones and archive old ones.
- Endive removed `payment_method_types` from Checkout Sessions, PaymentIntents, and SetupIntents: use dashboard-managed (dynamic) payment methods, `allowed_payment_method_types`, or `excluded_payment_method_types`. Checkout `ui_mode` values are `hosted_page`, `embedded_page`, `elements` (and `form`, gated); the old `hosted`/`embedded`/`custom` fail.
- Subscription `current_period_start/end` live on **subscription items**, not the subscription. Invoice's subscription is at `invoice.parent.subscription_details.subscription`. `billing_cycle_anchor` on update/resume is an object (`{ type: "now" }`).
- Treat unknown `status` and enum values as possible: SDK enums are open (`OtherString`). Default to "no access" for unknown subscription states.
- Use restricted keys (`rk_`) with minimum permissions for services that do not need full access. Publishable keys (`pk_`) are the only keys allowed in client bundles.
- Stripe Tax, Billing, and Connect have account-level prerequisites (registrations, Dashboard settings, capabilities). Check them before debugging code.
- Use the Better Auth Stripe plugin only when the app already uses Better Auth and its subscription model fits; otherwise own the webhook handler.

## Verification

Prefer repository-owned commands. For meaningful Stripe changes cover the relevant subset:

- Typecheck against the installed `stripe` types; grep for removed APIs (`payment_method_types`, `ui_mode: "hosted"|"embedded"|"custom"`, `subscription.current_period_end`, `invoice.subscription`, `invoice.payment_intent`, `Stripe(` without `new`, `constructEventWithoutVerification` on the class).
- Signature test: valid header passes; altered body, wrong secret, and old timestamp fail with 400 (`stripe.webhooks.generateTestHeaderString`).
- Idempotency: replay the same event id twice; assert one side effect. Deliver events out of order; assert final state matches the API.
- Sandbox end to end: `stripe listen --forward-to`, then `stripe trigger` or a real test Checkout with a published test card; assert DB state per status (trialing, active, past_due, canceled, paused).
- Time-based flows (trials, renewals, dunning, proration) with a test clock, not sleeps.
- Report which checks ran, which did not, and open assumptions (API version, snapshot vs thin, Billing mode classic vs flexible, Tax enabled, Connect model).
