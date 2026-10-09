# Connect Basics and Better Auth Stripe Plugin

## Contents

- Connect: when and which model
- Connect: onboarding, charges, webhooks
- Connect: pitfalls
- Better Auth Stripe plugin: version fit
- Better Auth Stripe plugin: setup
- Better Auth Stripe plugin: behavior and limits
- Better Auth Stripe plugin: alongside your own Stripe code

## Connect: when and which model

Use Connect only when money moves between your platform and other businesses (marketplaces, platforms, payouts to sellers). A single-merchant SaaS does not need it.

- Each seller is a **connected account**. Decide who is liable for losses and fees, and who owns the dashboard (Stripe-hosted Express/Dashboard vs your embedded components). Current v1 Accounts API expresses this with `controller` properties (`stripe_dashboard.type`, `fees.payer`, `losses.payments`, `requirement_collection`) rather than legacy `type: "express" | "standard" | "custom"`. The newer Accounts v2 (`stripe.v2.core.accounts`, with `configuration.merchant|customer|recipient`, `dashboard`, `defaults`, `identity`) is the direction of the platform; read the current Connect docs and the SDK types before choosing, and do not mix v1 and v2 account APIs for one account.
- Charge types:
  - **Direct charges**: charge on the connected account (`{ stripeAccount: acct }` request option); seller is merchant of record; platform takes `application_fee_amount`.
  - **Destination charges**: charge on the platform with `transfer_data: { destination }` (+ `on_behalf_of` for settlement merchant); platform is merchant of record.
  - **Separate charges and transfers**: charge on the platform, then `transfers.create` to one or more accounts.
- Pick the type with the user's legal and refund-liability constraints in view; do not decide for them.

## Connect: onboarding, charges, webhooks

```ts
const account = await stripe.accounts.create({
  controller: { stripe_dashboard: { type: "express" }, fees: { payer: "application" }, losses: { payments: "application" } },
})
const link = await stripe.accountLinks.create({
  account: account.id,
  type: "account_onboarding",
  refresh_url: `${origin}/connect/refresh`,
  return_url: `${origin}/connect/done`,
})
// redirect seller to link.url; links are single-use and short-lived: create on demand

await stripe.paymentIntents.create({
  amount: 1000, currency: "usd", automatic_payment_methods: { enabled: true },
  application_fee_amount: 100,
  transfer_data: { destination: account.id }, // destination charge
})

await stripe.customers.list({}, { stripeAccount: account.id }) // act on a connected account (direct charges)
```

- Embedded onboarding/management: `stripe.accountSessions.create` with components; Stripe-hosted: Account Links.
- Do not treat `return_url` hit as "onboarded". Listen to `account.updated` and `capability.updated`, then read `charges_enabled`, `payouts_enabled`, `requirements` from the API.
- Create a **Connect** webhook endpoint (events on connected accounts) separate from the platform endpoint; events carry `event.account`. Platform-level events (`account.updated`, `account.application.deauthorized`, payouts) arrive on the platform endpoint as usual. Each endpoint has its own secret.
- Store `stripe_account_id` per seller, unique. Authorize every call: the signed-in user may only act for their own account id; never accept `acct_` ids from the client.
- Pass `stripeAccount` per request (`{ stripeAccount }`) or build a client with `withStripeContext` / config `stripeAccount`; v2 APIs use `stripeContext`.
- Test in a sandbox with test accounts; Connect has separate rate limits (account creation 30/s live, 5/s sandbox) and compliance steps for live.

## Connect: pitfalls

- Fees, refunds, and disputes land on different parties depending on charge type; model them in tests.
- Reuse idempotency keys per account (`${acct}:${orderId}`).
- Platform keys are powerful; keep them server-side only. Seller dashboards use account-scoped access via Stripe, not your key.
- Webhook handlers must set `stripeAccount` when re-fetching objects for connected-account events.

## Better Auth Stripe plugin: version fit

- Package: `@better-auth/stripe@1.7.7` (latest), requires `better-auth@^1.7.7` and `@better-auth/core@^1.7.7`. Keep all `@better-auth/*` on the same 1.7.x patch and `better-auth` at 1.7.7 or later (earlier versions have published Magic Link and OAuth Proxy account-takeover advisories).
- Peer range: `stripe ^18 || ^19 || ^20 || ^21 || ^22`. **`stripe@23` is outside the range.** Install `stripe@22.6.2` (pinned API `2026-08-26.dahlia`) for projects using this plugin and set `apiVersion: "2026-08-26.dahlia"` (the literal must match the installed SDK's type; older doc examples show `2026-06-24.dahlia`).
- On `stripe@22`, do not copy Endive-only shapes from this skill: `subscriptions.pause`, object-form `billing_cycle_anchor`, and `allowed_payment_method_types` on Checkout may not exist there. Check the installed `.d.ts`.
- Re-check peer ranges when upgrading: a future `@better-auth/stripe` release is expected to add stripe 23.

## Better Auth Stripe plugin: setup

```bash
bun add better-auth @better-auth/stripe stripe@22.6.2
bunx auth@latest generate   # or migrate; adds subscription table + user.stripeCustomerId
```

```ts
// auth.ts
import { betterAuth } from "better-auth"
import { stripe } from "@better-auth/stripe"
import Stripe from "stripe"

const stripeClient = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-08-26.dahlia" })

export const auth = betterAuth({
  // ...database, emailAndPassword, etc.
  plugins: [
    stripe({
      stripeClient,
      stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET!,
      createCustomerOnSignUp: true,
      subscription: {
        enabled: true,
        plans: [
          { name: "basic", priceId: "price_...", limits: { projects: 5 } },
          { name: "pro", priceId: "price_...", annualDiscountPriceId: "price_...", freeTrial: { days: 14 } },
        ], // or an async function loading plans from your DB
        authorizeReference: async ({ user, referenceId, action }) => /* may this user manage this reference? */ true,
      },
      onEvent: async (event) => { /* extra events: invoice.payment_failed, etc. */ },
    }),
  ],
})
```

```ts
// auth-client.ts
import { createAuthClient } from "better-auth/client"
import { stripeClient } from "@better-auth/stripe/client"
export const authClient = createAuthClient({ plugins: [stripeClient({ subscription: true })] })
// authClient.subscription.upgrade({ plan: "pro", successUrl, cancelUrl })
// authClient.subscription.list(), .cancel(), .restore(), billing portal (path /subscription/billing-portal)
```

- Webhook endpoint: `POST <basePath>/stripe/webhook` (default `/api/auth/stripe/webhook`). Register that URL in Stripe with the endpoint's own secret. It is mounted through the Better Auth handler; ensure your framework mount passes the raw `Request` (Hono `app.on(["POST","GET"], "/api/auth/*", c => auth.handler(c.req.raw))`, Elysia `.mount(auth.handler)`, TanStack Start route handler calling `auth.handler(request)`), with no earlier middleware consuming the body.
- Plugin-handled events: `checkout.session.completed`, `customer.subscription.created`, `.updated`, `.deleted`. Everything else (e.g. `invoice.payment_failed`, `charge.dispute.created`, `entitlements...`) needs `onEvent` or your own endpoint.
- Callbacks: `onSubscriptionComplete`, `onSubscriptionCreated`, `onSubscriptionUpdate`, `onSubscriptionCancel`, `onSubscriptionDeleted`, `onCustomerCreate`, `getCheckoutSessionParams` (add tax, promo, metadata), `requireEmailVerification`.
- Organizations: org-scoped subscriptions need the Better Auth `organization` plugin **and** `organization: { enabled: true }` inside `stripe()`; use `customerType: "organization"` and `authorizeReference` to guard `referenceId`.
- Stored columns (`subscription` table): `plan`, `referenceId`, `stripeCustomerId`, `stripeSubscriptionId`, `status`, `periodStart`, `periodEnd`, `trialStart`, `trialEnd`, `cancelAtPeriodEnd`, `cancelAt`, `canceledAt`, `endedAt`, `seats`, `billingInterval`, `stripeScheduleId`; plus `user.stripeCustomerId`. Statuses are Stripe's raw strings.

## Better Auth Stripe plugin: behavior and limits

- Source-of-truth rule still applies: the plugin's `subscription` table is a webhook-fed projection. Gate features from it (or `authClient.subscription.list()`), not from redirect pages.
- Plan ids are matched by `priceId`; moving to new Prices means updating `plans` (static array redeploy, or dynamic async plans reading `lookup_key`s from your catalog).
- The plugin covers Checkout-based subscriptions, upgrades/downgrades, cancel/restore, billing portal, trials, seats. It does not provide Meters/usage billing, Entitlements, Tax setup, refunds, or dispute handling. Use the same `stripeClient` directly for those and add handlers through `onEvent`.
- Plugin errors are typed (`STRIPE_ERROR_CODES`, e.g. `ALREADY_SUBSCRIBED_PLAN`, `SUBSCRIPTION_NOT_ACTIVE`, `EMAIL_VERIFICATION_REQUIRED`, `AUTHORIZE_REFERENCE_REQUIRED`); map them to UI.
- Require a verified email (`requireEmailVerification`) before creating Stripe customers or checkouts if account abuse matters.

## Better Auth Stripe plugin: alongside your own Stripe code

- Use one shared `stripeClient` module for both the plugin and your own routes so the `apiVersion` is identical.
- Do not run your own subscription-writing webhook on the same events against the same tables; either extend with `onEvent` or own the entire flow and skip the plugin.
- If you outgrow the plugin (usage billing, entitlements, custom proration), migrate by keeping its tables read-only and writing your own projection from the webhook handler in [webhooks-events.md](webhooks-events.md).
- Verification: sign up → customer created; `upgrade` → Checkout in sandbox; `stripe listen --forward-to localhost:3000/api/auth/stripe/webhook`; assert `subscription` row `active`; cancel via Portal → row shows `cancelAtPeriodEnd`.
