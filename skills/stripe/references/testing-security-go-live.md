# Testing, Keys, Idempotency, Security, Go-Live

## Contents

- Hard rules for agents
- Keys and modes
- Sandboxes and test data
- Stripe CLI
- Test clocks
- Idempotency keys
- Errors and rate limits
- Security checklist
- Go-live checklist

## Hard rules for agents

- Never request, receive, paste, echo, or persist real card numbers, bank details, `sk_live_`, `rk_live_`, or `whsec_` values. If the user pastes one, tell them to rotate it and stop using it.
- Use only test or sandbox keys, read from environment variables or the host secret store. Do not print env values, `stripe listen` secrets, or full API responses containing `client_secret`.
- Do not run write operations (create, refund, cancel, trigger, resend) against live mode. Confirm the key prefix is `sk_test_`/`rk_test_` (or a sandbox key) before running scripts. A guard in scripts is cheap: `if (!key.startsWith("sk_test_") && !key.startsWith("rk_test_")) throw new Error("live key refused")`.
- Do not build or accept raw card forms. Card data goes from the browser straight to Stripe through Checkout or Elements.
- Treat goes-live steps (switching keys, creating live webhook endpoints, enabling payment methods) as user actions. Provide the steps; do not perform them.

## Keys and modes

| Prefix | Use | Where allowed |
| --- | --- | --- |
| `pk_test_`/`pk_live_` | Publishable; Stripe.js `loadStripe` | Browser bundles |
| `sk_test_`/`sk_live_` | Secret; full API access | Server only |
| `rk_test_`/`rk_live_` | Restricted; per-resource permissions | Server only; prefer for each service |
| `whsec_` | Webhook signing secret | Server only, one per endpoint |
| `ek_`/session tokens | Ephemeral/short-lived | Per feature |

- Create separate restricted keys per service (webhook worker: read-only on needed resources; checkout service: write on Checkout/Customers/Prices; reporting: read-only). Grant only the permissions the code uses; test by running with the key.
- Sandbox/test keys and live keys never see each other's objects. Seed scripts must run once per environment. IDs (`price_`, `prod_`, `whsec_`) differ per environment; use `lookup_key`s and config per environment.
- Secrets live in the host secret store; `.env` files stay git-ignored; only `.env.example` with placeholder names is committed. Add secret scanning to CI (the Stripe key patterns `sk_live_`, `rk_live_`, `whsec_`).
- Rotate immediately on exposure (Dashboard → API keys → roll); old key can be expired on a schedule.
- Mode comes only from the key. Toggling the Dashboard view does not change integration behavior.

## Sandboxes and test data

- Sandboxes are isolated test environments with their own keys, objects, and webhook endpoints; use one per developer, per CI, or per staging as the account allows. `stripe sandbox create` (CLI) can create one; check the CLI help for the current flags.
- Published test cards (use only in sandbox/test UIs, typed by the user, any future expiry, any CVC, any postal code):
  - `4242 4242 4242 4242` succeeds.
  - `4000 0025 0000 3155` requires 3D Secure authentication.
  - `4000 0000 0000 0002` declined.
  - `4000 0000 0000 9995` insufficient funds.
  - `4000 0000 0000 0341` attaches but fails on charge (good for renewal failures).
  More at https://docs.stripe.com/testing (bank debits, wallets, disputes `4000 0000 0000 0259`, refunds failing).
- Test mode rate limits are stricter than live (25 req/s sandbox global); keep fixtures small.
- For automated tests: unit-test handlers with signed fixtures (no network); integration-test against a sandbox with `stripe listen`; mock the Stripe client at the module boundary only for pure logic, not to "prove" webhook behavior.

## Stripe CLI

Install per https://docs.stripe.com/stripe-cli (v1.43.3 or later). The CLI stores a restricted test key after `stripe login` (expires periodically).

```bash
stripe login                                           # browser auth, test mode
stripe listen --forward-to localhost:3000/webhooks/stripe
stripe listen --events invoice.paid,customer.subscription.updated --forward-to localhost:3000/webhooks/stripe
stripe trigger checkout.session.completed              # fixture events (generic data)
stripe events resend evt_123                           # re-deliver an event
stripe logs tail                                       # live API request logs (test mode)
stripe products list --limit 3                         # quick object inspection
```

- `listen` prints a session-specific `whsec_`; put it in the local `.env` as `STRIPE_WEBHOOK_SECRET`. Do not commit it.
- Triggered fixtures create unrelated sample objects; they will not match your `app_user_id` metadata. For realistic flows, run a real sandbox Checkout or a test clock.
- Add `--api-key` only from env, never inline in shell history for live keys; avoid `--live`.
- Run `stripe --help` / `stripe <cmd> --help` for current flags rather than guessing.

## Test clocks

Simulate time for trials, renewals, failed payments, cancellations, and proration without waiting. Sandbox/test mode only.

```ts
const clock = await stripe.testHelpers.testClocks.create({ frozen_time: Math.floor(Date.now() / 1000), name: "renewal-test" })
const customer = await stripe.customers.create({ email: "clock@example.com", test_clock: clock.id }) // attach at creation
// ...create subscription with a test payment method (pm_card_visa / tok / Checkout in sandbox)...
await stripe.testHelpers.testClocks.advance(clock.id, { frozen_time: clock.frozen_time + 31 * 86400 })
// poll testClocks.retrieve(clock.id) until status === "ready", then assert DB state from webhooks
await stripe.testHelpers.testClocks.del(clock.id) // cleanup removes its customers/subscriptions
```

- Attach the clock when creating the Customer; it cannot be attached later.
- Advance in steps: you cannot advance more than two billing intervals past the shortest subscription (or two years with none). Advance past each boundary one at a time to see every event.
- Advancing is asynchronous: status `advancing` → `ready`. Webhook handlers see events with clock-time timestamps.
- Use test payment methods such as `pm_card_visa` or `pm_card_chargeCustomerFail` (fails on charge) to exercise dunning.
- Assert: status transitions, `has_access`, `current_period_end`, invoice counts, emails queued, entitlements refreshed.

## Idempotency keys

- Send on every POST that must not run twice: `{ idempotencyKey }` as request options. Up to 255 chars, not secret, ideally derived from your stable ids (`checkout:${userId}:${priceId}:${bucket}`, `refund:${paymentIntentId}:${amount}`).
- Stripe saves the first response (including errors once execution began) and replays it for the same key for at least 24 hours. Reusing a key with different params returns an idempotency error (`StripeIdempotencyError`).
- A random key per retry defeats the feature. Generate once per user action and reuse across retries.
- The SDK auto-adds keys on its own network retries (`maxNetworkRetries`); you still need explicit keys for application-level retries and double clicks.
- GET and DELETE do not use idempotency keys; meter events use `identifier` instead.

## Errors and rate limits

```ts
try {
  await stripe.paymentIntents.create(params, { idempotencyKey })
} catch (err) {
  if (err instanceof Stripe.errors.StripeCardError) return userMessage(err.code, err.decline_code) // show safe message
  if (err instanceof Stripe.errors.StripeRateLimitError) return retryLater()
  if (err instanceof Stripe.errors.StripeInvalidRequestError) throw err // bug: log err.param, err.requestId
  if (err instanceof Stripe.errors.StripeAuthenticationError) throw err // wrong/rotated key
  if (err instanceof Stripe.errors.StripeConnectionError) return retryLater() // safe with idempotency key
  throw err
}
```

- Log `err.requestId` (Stripe's `req_...`) for support; never log request bodies with PII.
- Other classes: `StripeAPIError` (Stripe-side 5xx; retry with same key), `StripePermissionError` (restricted key lacks permission), `StripeIdempotencyError`, `StripeSignatureVerificationError`.
- Live rate limit about 100 req/s per account, sandbox 25 req/s, most endpoints 25 req/s; specific caps exist (e.g. 1,000 PaymentIntent updates per object per hour). On 429 back off exponentially with jitter; raise `maxNetworkRetries` carefully.
- Use auto-pagination (`for await (const x of stripe.customers.list({ limit: 100 }))`) instead of manual cursors.

## Security checklist

- [ ] No `sk_`/`rk_`/`whsec_` in client code, repo history, logs, error trackers, or CI output.
- [ ] Secrets only via env/secret store; `.env` ignored; scanning enabled.
- [ ] Restricted keys with minimal permissions per service; wide `sk_` only where needed.
- [ ] Webhook route: raw body, signature verified, per-endpoint secret, 400 on failure, no auth middleware that rewrites bodies.
- [ ] Dedupe by event id in the same transaction as side effects; handlers convergent (re-fetch).
- [ ] Amounts, prices, and customers chosen server-side; authorization check that the user owns the customer/subscription/order.
- [ ] Redirect/return pages never grant access; only verified webhooks (or a server-side retrieve) do.
- [ ] Customer Portal and Checkout session creation endpoints require auth, are CSRF-safe, rate-limited, and use `origin`-allowlisted return URLs (no open redirects from user input).
- [ ] `client_secret`s are sent only to the paying user's browser, never logged or put in URLs/analytics.
- [ ] Promotion code and card-testing abuse controls: rate limits, CAPTCHA/bot protection on public checkout creation, Radar rules, minimum amounts.
- [ ] PII minimized: store ids, last4, brand; not PANs. Customer metadata has no secrets or sensitive personal data.
- [ ] Idempotency keys on money-moving POSTs; refunds/cancellations audit-logged and permission-gated.
- [ ] Dependencies pinned; `stripe` upgrades reviewed against the changelog; Dependabot major bumps need review.
- [ ] Connect: platform keys never exposed to connected users; `Stripe-Account` set server-side only.
- [ ] PCI: Checkout/Elements only (SAQ A eligibility). No card data in your logs, forms, or backend.

## Go-live checklist

Provide this to the user; they perform the account actions.

1. Account: business profile, bank account, identity verification, public business details, statement descriptor, support email/URL, branding (Checkout, Portal, invoices, receipts).
2. Products/Prices: recreate or copy sandbox catalog to live; same `lookup_key`s; `tax_behavior` and `tax_code` set.
3. Billing settings: Smart Retries and dunning, failed-payment emails, trial and cancellation behavior, Customer Portal configuration (live is separate), invoice template, billing mode.
4. Tax: registrations in live mode, head office address, product tax codes; test a taxed Checkout with a real-looking address.
5. Payment methods: enable the methods you want in live; wallets (Apple Pay domain verification via `paymentMethodDomains`); 3DS/SCA behavior reviewed.
6. Keys: live restricted keys per service in the production secret store; no test keys in production; publishable live key in the front-end build.
7. Webhooks: create live endpoint(s) over HTTPS at the correct `api_version` and event format (snapshot or thin); put the live `whsec_` in production; subscribe only to handled events; verify a live delivery succeeds (Dashboard shows 2xx).
8. Pin versions: `stripe` and `apiVersion` recorded; endpoint API version matches; upgrade rollback plan noted (72 h Workbench rollback).
9. Radar: review rules, 3DS requirements, block lists; set dispute notification email.
10. Monitoring: alerts on webhook failures, `invoice.payment_failed` spikes, dispute events, meter error events, 5xx on checkout creation; logs include `evt_`/`req_` ids, not secrets.
11. Reconciliation: a job or runbook comparing active Stripe subscriptions with DB rows; a documented way to resend events.
12. Legal/UX: terms and refund policy linked at checkout (`consent_collection`), receipts, cancellation self-serve via Portal, tax-ID collection if B2B.
13. Smoke test in live with a real low-value purchase **performed by the user**, then refund it. Agents do not use real cards.
14. Rollback: feature flag to disable checkout creation; documented steps to pause webhooks without losing events (events are retried for up to 3 days).
