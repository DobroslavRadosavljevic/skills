# Source Map

Snapshot date: 2026-10-09.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, new API versions, Better Auth plugin peer ranges, thin events, or any Endive-specific behavior.

## Research Snapshot

- Context7 libraries: `/stripe/stripe-node` (high reputation), `/websites/stripe`, `/websites/stripe_js`, `/stripe/stripe-cli`, `/websites/better-auth`, `/elysiajs/documentation`, `/websites/tanstack_start_framework_react`. Context7 `/stripe/stripe-node` lists only v19/v22 version tags; use npm and the GitHub CHANGELOG for current facts.
- npm versions observed on 2026-10-09:
  - `stripe` `latest`: `23.0.0` (published 2026-10-01; `engines.node >= 20`; peer `@types/node >= 20`); dist-tags also `public-preview` `23.1.0-beta.1`, `private-preview` `23.1.0-alpha.2`
  - `stripe` last 22.x: `22.6.2` (2026-09-09), pinned API `2026-08-26.dahlia` (verified from the installed package `esm/apiVersion.d.ts`; no `subscriptions.pause`)
  - `stripe@23.0.0` `esm/apiVersion.d.ts`: `2026-09-30.endive`; `OPENAPI_VERSION` `v2526`
  - `@stripe/stripe-js` `latest`: `10.0.0` (2026-10-01)
  - `@stripe/react-stripe-js` `latest`: `7.0.0` (peer `@stripe/stripe-js >=10.0.0 <11`, `react >=16.8 <20`)
  - `@better-auth/stripe` `latest`: `1.7.7` (2026-09-30); peers `stripe ^18 || ^19 || ^20 || ^21 || ^22`, `better-auth ^1.7.7`, `@core ^1.7.7`; also `release-1.6` `1.6.33`
- Types in the installed packages were used as ground truth for field and method names (e.g. `Subscription.status_details`, `subscriptions.pause/resume/migrate`, `billing.meterEvents`, `v2.billing.meterEventStream`, `entitlements.activeEntitlements`, `notificationHandler`, `parseEventNotification`). Code samples in the references were typechecked with `tsc --strict` against `stripe@23.0.0`, `@stripe/stripe-js@10.0.0`, `@stripe/react-stripe-js@7.0.0`, `hono`, and `elysia`.
- Stripe CLI: docs reference v1.43.3+ (install via Homebrew or the CLI package); `stripe sandbox create` appears in CLI source. Confirm flags with `stripe <command> --help`.

## Official Stripe Documentation

- API changelog and versions: https://docs.stripe.com/changelog, https://docs.stripe.com/upgrades, https://docs.stripe.com/api-versions
- Endive release (2026-09-30): https://docs.stripe.com/changelog/endive
  - Billing cycle anchor object: https://docs.stripe.com/changelog/endive/2026-09-30/polymorphic-billing-cycle-anchor
  - `payment_method_types` removed (Checkout, Intents, Elements): https://docs.stripe.com/changelog/endive/2026-09-30/remove-payment-method-types-checkout-sessions
  - Failed tax calculation error: https://docs.stripe.com/changelog/endive/2026-09-30/failed-tax-calculation-error
  - Pause and resume subscriptions: https://docs.stripe.com/changelog/endive/2026-09-30/pause-subscription and https://docs.stripe.com/billing/subscriptions/pause
  - Thin events for v1 resources GA: https://docs.stripe.com/changelog/endive/2026-09-30/thin-events-for-api-v1-resources-generally-available
  - Snapshot to thin migration: https://docs.stripe.com/webhooks/migrate-snapshot-to-thin-events
- Dahlia release (2026-03-25 to 2026-08-26): https://docs.stripe.com/changelog/dahlia (ui_mode values: https://docs.stripe.com/changelog/dahlia/2026-03-25/updates-available-checkout-session-ui-modes)
- Basil/Clover history (for older code): https://docs.stripe.com/changelog/basil, https://docs.stripe.com/changelog/clover
- Checkout: https://docs.stripe.com/payments/checkout, https://docs.stripe.com/api/checkout/sessions, embedded: https://docs.stripe.com/checkout/embedded/quickstart, Elements with Checkout Sessions: https://docs.stripe.com/payments/accept-a-payment?api-integration=checkout&payment-ui=elements
- Payment Element / Payment Intents: https://docs.stripe.com/payments/payment-element, https://docs.stripe.com/payments/payment-intents, SetupIntents: https://docs.stripe.com/payments/setup-intents
- Billing: https://docs.stripe.com/billing/subscriptions/overview, webhooks: https://docs.stripe.com/billing/subscriptions/webhooks, billing mode: https://docs.stripe.com/billing/subscriptions/billing-mode, testing/test clocks: https://docs.stripe.com/billing/testing, quickstart: https://docs.stripe.com/billing/quickstart
- Customer Portal: https://docs.stripe.com/customer-management
- Usage-based billing / meters: https://docs.stripe.com/billing/subscriptions/usage-based, API: https://docs.stripe.com/api/billing/meter-event, v2 stream: https://docs.stripe.com/changelog/acacia/2024-09-30/usage-based-billing-v2-meter-events-api
- Entitlements: https://docs.stripe.com/billing/entitlements, API: https://docs.stripe.com/api/entitlements/active-entitlement
- Coupons and promotion codes: https://docs.stripe.com/billing/subscriptions/coupons
- Stripe Tax: https://docs.stripe.com/tax
- Refunds and disputes: https://docs.stripe.com/refunds, https://docs.stripe.com/disputes
- Webhooks: https://docs.stripe.com/webhooks, signatures: https://docs.stripe.com/webhooks/signatures, event destinations: https://docs.stripe.com/event-destinations, event notification handlers: https://docs.stripe.com/webhooks/event-notification-handlers
- Idempotent requests: https://docs.stripe.com/api/idempotent_requests; errors: https://docs.stripe.com/api/errors/handling; rate limits: https://docs.stripe.com/rate-limits
- API keys and restricted keys: https://docs.stripe.com/keys, best practices: https://docs.stripe.com/keys-best-practices
- Testing: https://docs.stripe.com/testing, sandboxes: https://docs.stripe.com/sandboxes
- Stripe CLI: https://docs.stripe.com/stripe-cli, GitHub: https://github.com/stripe/stripe-cli
- Connect: https://docs.stripe.com/connect
- Stripe docs for agent tooling: https://docs.stripe.com/skills.md

## stripe-node and Stripe.js

- stripe-node GitHub: https://github.com/stripe/stripe-node, changelog: https://github.com/stripe/stripe-node/blob/master/CHANGELOG.md, README: https://github.com/stripe/stripe-node#readme
- Examples: `examples/webhook-signing`, `examples/snippets/event_notification_handler_endpoint.ts`, `event_notification_webhook_handler.ts`, `meter_event_stream.ts`
- Migration guides: https://github.com/stripe/stripe-node/wiki/Migration-guide-for-v21, https://github.com/stripe/stripe-node/wiki/Migration-guide-for-v22
- Stripe.js: https://docs.stripe.com/js, https://github.com/stripe/stripe-js; React: https://github.com/stripe/react-stripe-js

## Framework docs used for webhook adapters

- Elysia lifecycle `parse: "none"`: https://elysiajs.com/essential/life-cycle
- TanStack Start server routes: https://tanstack.com/start/latest/docs/framework/react/guide/server-routes
- Hono: use `c.req.raw` for the untouched `Request` (https://hono.dev)
- Bun.serve routes: https://bun.sh/docs/api/http

## Better Auth Stripe plugin

- Docs: https://better-auth.com/docs/plugins/stripe
- Package: https://www.npmjs.com/package/@better-auth/stripe (peer ranges, schema, and endpoints verified from the installed 1.7.7 `dist/*.d.mts` and `index.mjs`: `/stripe/webhook`, `/subscription/{upgrade,cancel,restore,list,billing-portal,success}`)

## Notes On Gaps

- Not independently verified in this snapshot: exact Accounts v2 create payloads, trial offers (`productCatalog`) API details, billing credit grant semantics, the Customer Portal `flow_data` field matrix, CLI flags beyond `login`, `listen`, `trigger`, `events resend`, `logs tail`, and `sandbox create`. Check current docs before relying on them.
- The 23-hour `incomplete` expiry, approximate card refund window, and 24-hour idempotency key retention are documented behaviors; re-check if a project depends on exact numbers.
