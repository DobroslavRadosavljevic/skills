# Versions, Client Setup, Migration

Snapshot 2026-10-09. Ground truth for types: `node_modules/stripe/esm/apiVersion.d.ts` (`ApiVersion`) and `Stripe.API_VERSION`.

## Contents

- Package matrix
- Client setup
- API version pinning rules
- Upgrade procedure
- Release trains and breaking changes (Endive, Dahlia, Basil carry-overs)
- stripe-node major changes (v21 → v23)
- Stripe.js 10 and React 7 renames

## Package matrix

| Package | Latest | Notes |
| --- | --- | --- |
| `stripe` | 23.0.0 (2026-10-01) | Node >= 20. Pins API `2026-09-30.endive`. Last v22: 22.6.2 pins `2026-08-26.dahlia`. |
| `@stripe/stripe-js` | 10.0.0 | Browser loader. Adds `initCheckoutElementsSdk`, `createEmbeddedCheckoutPage`. |
| `@stripe/react-stripe-js` | 7.0.0 | Peer: `@stripe/stripe-js >=10 <11`, React `>=16.8 <20`. Subpath `@stripe/react-stripe-js/checkout`. |
| `@better-auth/stripe` | 1.7.7 | Peer `stripe ^18 \|\| ^19 \|\| ^20 \|\| ^21 \|\| ^22`. Pair with `stripe@22`. |
| Stripe CLI | v1.43.3+ | Docs reference this minimum. Install per docs (Homebrew or the CLI package). |

Install with `bun add stripe` (server) and `bun add @stripe/stripe-js @stripe/react-stripe-js` (browser). Keep `stripe` out of client bundles.

## Client setup

```ts
// src/lib/stripe.ts
import Stripe from "stripe"

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-09-30.endive", // literal type = SDK's pinned version; omit to follow the SDK
  maxNetworkRetries: 2, // SDK default 1; retries add idempotency keys automatically
  appInfo: { name: "my-app", version: "1.0.0" },
})
```

- Omitting `apiVersion` sends the SDK's pinned version (`DEFAULT_API_VERSION`). Passing a different literal fails typechecking, which is intended: types match only the pinned version. Older versions need `// @ts-ignore stripe-version-YYYY-MM-DD` and lose type accuracy.
- `new Stripe(...)` only. v22 removed calling `Stripe(key)` as a function and callbacks/positional API-key arguments. Params come first, options second: `stripe.customers.retrieve(id, undefined, { idempotencyKey })`.
- Missing key at import time (builds): create lazily in a getter or fall back to a placeholder string so the build passes; fail at first request in production.
- Runtimes: Node, Bun, Deno, Workers all work. The worker/edge build uses fetch + SubtleCrypto, so use `constructEventAsync` for webhooks everywhere.
- Per-request overrides: `{ idempotencyKey, stripeAccount, stripeContext, apiKey, maxNetworkRetries, timeout }`. Do not pass an API key as a bare string.
- The SDK may print `Stripe-Notice` messages to test/sandbox users and to AI-agent environments. `STRIPE_SUPPRESS_NOTICES=true` suppresses them outside agent environments.
- Browser: `loadStripe(process.env.PUBLIC_STRIPE_PUBLISHABLE_KEY)` once at module scope (never inside a component render). Only `pk_` keys.

## API version pinning rules

Three independent versions can differ:

1. **Per request**: the SDK's `apiVersion` (header `Stripe-Version`). Controls response shapes you get from API calls.
2. **Per webhook endpoint / event destination**: `api_version` set at creation (default: account default at that time). Controls `event.data.object` shape. Thin events (`v1.*`) are version-independent: you fetch the current object yourself.
3. **Account default** (Dashboard / Workbench): used by raw HTTP calls and by new endpoints without an explicit version.

Rules:

- Record all three in the repo (README or `.env.example` comment). Upgrade them together.
- Do not parse webhook payloads with types from a newer SDK than the endpoint's version. Either create a new endpoint at the new version and cut over, or move to thin events.
- Never let CI or dependabot bump `stripe` majors without reading the changelog: majors move the pinned API version and often remove params.
- Within a release train (Endive), later versions are additive-only. A new train (first version) carries the breaking changes.

## Upgrade procedure

1. View the current version in Workbench (Dashboard).
2. Read the changelog for every version between current and target: https://docs.stripe.com/changelog and the stripe-node `CHANGELOG.md`.
3. Upgrade the SDK; run the typechecker; fix removed fields (see lists below).
4. Create a second webhook endpoint (or upgrade the endpoint version) at the new `api_version`; run both during cutover; dedupe by `event.id` across them if both deliver.
5. Test in a sandbox (checkout, renewal via test clock, cancel, refund, dispute). Test Connect separately if used.
6. Perform the upgrade in Workbench. Rollback is available for 72 hours.

## Release trains and breaking changes

Trains: Acacia → Basil → Clover → Dahlia (first `2026-03-25.dahlia`) → **Endive** (first `2026-09-30.endive`).

### Endive `2026-09-30` (breaking, relevant to TypeScript web apps)

| Change | Migration |
| --- | --- |
| `payment_method_types` removed from Checkout Sessions, PaymentIntents, SetupIntents | Manage methods in the Dashboard (payment method configurations), or use `allowed_payment_method_types` / `excluded_payment_method_types`. Keep `automatic_payment_methods: { enabled: true }` on intents. |
| Elements `paymentMethodTypes` option removed (deferred intent) | Use `allowedPaymentMethodTypes` or Dashboard-managed methods. |
| `billing_cycle_anchor` is an object on `subscriptions.update`, `subscriptions.resume`, and `invoices.createPreview` `subscription_details` | `"now"` → `{ type: "now" }`, `"unchanged"` → `{ type: "unchanged" }`; preview timestamp → `{ type: "timestamp", timestamp }`. |
| New error code `failed_tax_calculation` (automatic tax) | Handle it where you branch on `err.code` / `last_finalization_error.code` / `last_payment_error.code`. Contact Stripe Support for persistent cases. |
| Payment request button deprecated (Stripe.js) | Use Express Checkout Element. |
| Elements with Checkout Sessions: `canConfirm` false while updates pending; billing details required when Payment Element collection is disabled | Re-test custom Elements checkouts. |
| `stripe.handleNextAction` shows pending-authorization UI for MB WAY, Bizum, BLIK | UI behavior only. |
| Connect/Treasury/Financial Connections changes (rejected capability status, SEPA settings, `countries` → `country`, reserve enums, dispute evidence page limits) | Only if you use those products. |
| Additive: pause/resume subscriptions on demand (`subscriptions.pause`), pause on payment failure, `status_details`, thin events for v1 resources GA, trial offers GA, invoice `status_details` for uncollectible, `PaymentIntent.payment_record`, Standalone 3DS API, new payment methods (SeQura, PayPay) | See [billing-subscriptions.md](billing-subscriptions.md) and [webhooks-events.md](webhooks-events.md). |

### Dahlia `2026-03-25` through `2026-08-26`

- Checkout `ui_mode`: `hosted` → `hosted_page`, `embedded` → `embedded_page`, `custom` → `elements`; new `form` (gated beta). Legacy values fail.
- Stripe.js: `initCheckout` → `initCheckoutElementsSdk`; embedded checkout init → `createEmbeddedCheckoutPage`; `elements.update()` returns a Promise; boolean `layout.radios` removed; legacy PaymentIntent/SetupIntent/Sources methods removed.
- `billed_until` on subscription items no longer included by default (expand it).
- Meter event values with more than 15 digits are validated (send values as strings of at most 15 digits).
- Event destinations `events_from` accepts string values; new subscription cancellation reason `canceled_by_retention_policy`.

### Basil carry-overs (code from before 2025-03-31 still trips on these)

- `subscription.current_period_start/end` moved to each `SubscriptionItem`. Subscription-level "period end" = min over `items.data[].current_period_end`.
- `invoice.subscription` → `invoice.parent.subscription_details.subscription`; `invoice.payment_intent` → `invoice.payments` (`InvoicePayment`, `stripe.invoicePayments`); client secret for the first payment → `invoice.confirmation_secret.client_secret`.
- `billing_mode`: `classic` (default for existing) vs `flexible`; pause-on-demand and some proration features need `flexible`.
- Promotion codes: `promotionCodes.create({ promotion: { type: "coupon", coupon } })`.
- Handle `checkout.session.completed` for subscription provisioning, not `payment_intent.succeeded` (the subscription and invoice may not exist yet there).

## stripe-node major changes

| Version | Pinned API | Breaking items |
| --- | --- | --- |
| 21.0.0 (2026-03-25) | `2026-03-25.dahlia` | API-level Dahlia changes. |
| 22.0.0 (2026-04-02) | same | `new Stripe()` required; callbacks removed; no positional API key; params/options no longer mixed; per-request `host` removed (set on client); `Stripe.StripeContext` is no longer a type (use `Stripe.StripeContextType`); CJS default export shape. |
| 22.6.0 (2026-08-26) | `2026-08-26.dahlia` | Adds `EventNotificationHandler` (`stripe.notificationHandler`). |
| 22.6.2 | same | Empty webhook secrets now throw. |
| 23.0.0 (2026-09-30) | `2026-09-30.endive` | Node 18 dropped; `Stripe.constructEventWithoutVerification` removed (use `stripe.webhooks.constructEventWithoutVerification`, still unsafe); `ErrorType` export removed (use `Stripe.errors`); `verifyHeader` now defaults to `DEFAULT_TOLERANCE` (300 s) and tolerance `0` skips the timestamp check; truncated response bodies throw `StripeConnectionError`; V2 list types lose `object`/`has_more`/`url`. |

## Stripe.js 10 and React 7

```ts
import { loadStripe } from "@stripe/stripe-js"
const stripe = await loadStripe(publishableKey)
stripe.createEmbeddedCheckoutPage({ fetchClientSecret }) // was initEmbeddedCheckout
stripe.initCheckoutElementsSdk({ clientSecret })          // was initCheckout (ui_mode: "elements")
```

- React default entry: `Elements`, `PaymentElement`, `useStripe`, `useElements`, `EmbeddedCheckoutProvider`, `EmbeddedCheckout`.
- React `@stripe/react-stripe-js/checkout`: `CheckoutElementsProvider` (props `stripe`, `options: { clientSecret }`), `useCheckoutElements`, `useCheckout` (back-compat, Elements shape), and `PaymentElement`, `BillingAddressElement`, `ShippingAddressElement`, `ExpressCheckoutElement`, `TaxIdElement`, `CurrencySelectorElement`, `TermsElement`. `CheckoutFormProvider`/`useCheckoutForm` belong to the gated `form` mode.
- Do not mix the default `PaymentElement` (with `Elements`) and the checkout-subpath `PaymentElement` (with `CheckoutElementsProvider`); import from the matching entry.
