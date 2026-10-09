# Migration

## Contents

- SDK 0.x to 1.0
- Stripe to Polar
- Lemon Squeezy to Polar
- Cutover and verification

## SDK 0.x to 1.0

Triggers: `@polar-sh/sdk<1.0.0`, `new Polar({ accessToken, server })`, unversioned imports, camelCase fields, `@polar-sh/sdk/webhooks`, or any deprecated framework adapter (they depend on `^0.47`). Migrate one integration boundary at a time and treat the installed 1.x types as the source of truth. Never run old and new clients against the same mutation as a "comparison"; that can create duplicate customers, checkouts, subscriptions, or usage events.

| Area | Before (0.x) | After (1.0.x) |
|---|---|---|
| Client | `new Polar({ accessToken, server: "sandbox" })` | `createPolar({ accessToken, environment: "sandbox" })` from `@polar-sh/sdk/2026-10` |
| Core / adapters | n/a | `createPolarCore` plus `@polar-sh/sdk/2026-10/services/<name>` |
| Fields | `externalCustomerId`, `successUrl`, `checkout.customerId` | `external_customer_id`, `success_url`, `checkout.customer_id` (no automatic conversion; never rename `metadata` keys) |
| Method names | `organizations.listOrganizations` | normalized: `organizations.list`; check `dist/2026-10/index.d.mts` |
| Args | single request object mixing path/query/body | path params positional, query object next, body object last |
| Pagination | `for await (const page of await list())` yields pages | `for await (const item of polar.x.iterList())` yields resources; `list()` for page metadata |
| Errors | old SDK error classes | `PolarError`, `PolarNetworkError`, `PolarServerError`, `PolarClientError`, `PolarRateLimitError`, plus version-specific `errors.*` |
| Retries | `retryConfig` | removed; add bounded backoff and honor `retryAfter` |
| Webhooks | `validateEvent` from `@polar-sh/sdk/webhooks` (sync), `WebhookVerificationError` | `await webhooks.validateEvent(...)` from the versioned import; `webhooks.PolarWebhookVerificationError` / `PolarWebhookUnknownTypeError` / `PolarWebhookError` |
| Runtime | Node 18+ | Node >=22 |

Steps:

1. Inventory imports, client construction, calls, request objects, response reads, error handlers, retry config, pagination loops, webhook receivers, and mocks/fixtures. Search for `new Polar(`, `@polar-sh/sdk/webhooks`, `server:`, `retryConfig`, `listOrganizations`, and camelCase fields such as `externalCustomerId`, `successUrl`, `customerId`, `customerPortalUrl`.
2. Pick the API version once (`2026-10`) and use versioned imports everywhere. Do not deep-import across versions.
3. Replace client setup, then calls, then pagination, errors/retries, and webhooks.
4. Convert persistence mappings, JSON fixtures, and anything typed `any`. TypeScript catches request mistakes but not property-string access or loose fixtures.
5. Upgrade the webhook endpoint `api_version` separately once the handler is migrated; payload shape follows the endpoint version, not your client.
6. Swap deprecated adapters: Next.js/TanStack Start/Nuxt move to their 1.x adapter; others move to direct SDK routes. Better Auth plugin 2.x needs `createPolarCore`.
7. Run the full sandbox suite (checkout, portal, webhook signature, entitlement grant and revoke).

## Stripe to Polar

Polar has an official, rolling-out Stripe migration under Settings → Migrations (ask Polar support if it is not visible). Billing moves progressively; each subscription has exactly one system charging its next renewal. The importer needs a restricted Stripe key whose mode matches the Polar environment (live for production, test for sandbox).

Stages: (1) move new sales to Polar; (2) connect Stripe with a restricted key; (3) assess and import catalog and customers (billing stays on Stripe); (4) copy saved cards account-to-account (Stripe account owner starts it; Polar accepts in about one business day; Stripe moves data in hours, up to 72 h; sandbox cannot copy real cards); (5) switch selected subscriptions (irreversible; Polar cancels on Stripe immediately without proration or final invoice, then activates in Polar with the same paid period; renewals within 24 h or already scheduled to end stay on Stripe; do not activate a Polar subscription yourself); (6) reconcile and clean up. Not supported: Stripe Connect platform accounts, Stripe accounts in India. Needs attention: multiple items, quantity >1, no supported price in the default currency, past_due/unpaid/paused, uncopyable payment methods. Historical Stripe payments never become Polar orders; keep Stripe for refunds, disputes, and accounting on old transactions. The `/v1/merchant-migrations` endpoints are internal; do not script against them.

Application work (do not paste Stripe or Polar secrets into chat):

- Identity: use your immutable app user/org ID as `external_customer_id` on every new Polar checkout. Keep Stripe IDs while subscriptions still renew there. Imported customers may lack `external_id`; match once by exact unique email, then set `external_id` via `customers.update` (never overwrite an existing one). Review missing, duplicate, or changed emails.
- Catalog: Stripe Price/Product map to Polar products (one product per interval and price model; the importer creates new IDs, so keep a Stripe-to-Polar map and verify by interval, currency, amount, never by name).
- Tables: customer map, catalog map, subscription map (which system bills next), and a webhook receipt table keyed by `webhook-id`.
- Access: accept entitlements from either provider during coexistence; route cancel, pause, resume, and plan changes to whichever system currently bills the subscription; do not change a subscription while it is switching.
- Cutover signals: Stripe `customer.subscription.deleted` with `cancellation_details.comment` starting `Migrated to Polar` (not churn, do not revoke access or send cancellation emails; turn off Stripe's canceled-subscription emails and pause automations first), Polar `subscription.migrated` (the definitive signal; carries `provider`, `provider_subscription_id`), `subscription.updated`, `customer.state_changed`, `customer.updated`, `benefit_grant.*`, and `order.paid` at the first Polar renewal. Event order is not guaranteed; reconcile with the Subscriptions API before recording Polar as the billing system.
- Retire Stripe checkout, jobs, and secrets only when no subscription renews there.

Concept mapping:

| Stripe | Polar |
|---|---|
| Checkout Session | `checkouts.create` (`products`, `external_customer_id`); hosted URL or embed |
| Customer (metadata app id) | Customer with `external_id` |
| Product + recurring Price | Product with recurring interval and a price; one product per interval |
| Billing Portal session | `customerSessions.create` and the hosted portal |
| Subscription update with proration | `subscriptions.update` with `proration_behavior` (`invoice`/`prorate`/`next_period`/`reset`) |
| `cancel_at_period_end` / cancel now | `cancel_at_period_end` / `subscriptions.revoke` |
| Pause collection | `pause_at_period_end` and `resume` |
| Coupon / promotion code | Discount (code optional, per-customer limits) |
| Metered usage / Billing Meters | Meters, `events.ingest`, metered price, `meter_credit` benefit |
| Entitlements / your own flags | `feature_flag` benefit plus Customer State |
| Webhook signature (`Stripe-Signature`) | Standard Webhooks (`webhook-id`, `webhook-timestamp`, `webhook-signature`) via `webhooks.validateEvent` |
| `checkout.session.completed` | `order.paid` / `subscription.active` / `customer.state_changed` (not `checkout.updated`) |
| `invoice.paid` / `invoice.payment_succeeded` | `order.paid` |
| `invoice.payment_failed` | `subscription.past_due` |
| `customer.subscription.updated` | `subscription.updated` |
| `customer.subscription.deleted` | `subscription.revoked` |
| `charge.refunded` | `order.refunded`, `refund.created` |
| Idempotency-Key header | none for mutations; reconcile by `external_id`; usage events use `external_id` |
| Test mode keys | separate sandbox environment (`sandbox.polar.sh`) |

Differences that bite: Polar is the merchant of record (it owns tax, invoices, receipts, payouts, chargebacks; you cannot bring your own Stripe account for charging); no Stripe-style test mode; one active subscription per customer by default; grandfathered price changes; refunds do not end subscriptions; benefit grants, not raw subscription status, are the recommended entitlement.

## Lemon Squeezy to Polar

Polar's docs offer no automated Lemon Squeezy importer (only Stripe). Treat this as a manual, staged migration. The mappings below come from general Lemon Squeezy knowledge plus Polar's documented model; verify Lemon Squeezy specifics against its current docs and confirm with both vendors before cutover.

| Lemon Squeezy | Polar |
|---|---|
| Store | Organization (create sandbox and production) |
| Product + Variant | Product (one per variant or interval) with price(s); license keys and files become benefits |
| Checkout API / checkout URL with custom data | `checkouts.create` with `external_customer_id` and `metadata`, or Checkout Links |
| Customer portal URL | `customerSessions.create` |
| Subscription | Subscription (re-created through a new Polar checkout) |
| License keys + License API (`activate`/`validate`/`deactivate`) | `license_keys` benefit; validate/activate against `/v1/customer-portal/license-keys/*` with your `organization_id` |
| Discounts | Discounts |
| Webhooks (HMAC `X-Signature`, events like `order_created`, `subscription_created|updated|cancelled|resumed|expired|paused`, `subscription_payment_success|failed`, `order_refunded`) | Standard Webhooks (`order.paid`, `subscription.*`, `order.refunded`, `customer.state_changed`) |
| Usage-based items | Meters and `events.ingest` |

Plan:

1. Build and test the Polar integration in sandbox. Add `external_customer_id` mapping and a webhook receipt table.
2. Route new sales to Polar first; keep Lemon Squeezy webhooks and validation running for existing subscribers.
3. Both are merchants of record and payment methods are held by the processor. No card-transfer path exists in Polar's docs for Lemon Squeezy. Ask both vendors whether any export or tokenized transfer exists; otherwise existing subscribers re-subscribe on Polar and you cancel the Lemon Squeezy subscription at period end to avoid double billing. Communicate the change to customers before billing moves.
4. Licenses: run dual validation (Polar first, then Lemon Squeezy) until old keys expire or are reissued. Check with Polar support about bulk key import; do not fabricate keys.
5. Replace Lemon Squeezy webhook handling with the Polar receiver, preserving your internal event semantics (grant, renew, past due, cancel, refund).
6. Reconcile: every paying user maps to one active billing system and one entitlement.

## Cutover and verification

- Freeze catalog changes during cutover; snapshot customer, subscription, and entitlement tables.
- Migrate in small cohorts; verify each cohort's next renewal charge and first Polar `order.paid`.
- Alert on unknown webhook types, repeated signature failures, and entitlement drift between local state and Customer State.
- Keep a documented rollback for the application (re-enable the old provider's entitlement path), but note Stripe switches are not reversible.
