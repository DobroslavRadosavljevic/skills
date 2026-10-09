# Billing: Subscriptions, Portal, State Sync

Snippets typechecked against `stripe@23.0.0`.

## Contents

- Source-of-truth rule
- Subscription statuses and access mapping
- Creating subscriptions
- Changing plans, proration, anchors
- Trials
- Cancel, pause, resume
- Dunning and failed payments
- Customer Portal
- Syncing state into your DB
- Billing mode classic vs flexible

## Source-of-truth rule

Stripe is the system of record for subscription and invoice state. Your database holds a projection (status, price ids, period end, cancel flags, `has_access`) updated only by verified webhook handlers, plus an on-demand re-fetch when a user lands on a page right after checkout.

- Never write `status = active` because a redirect, `success_url`, or client callback fired.
- Never derive state from your own timers (e.g. "30 days after signup"). Read `items.data[].current_period_end` and Stripe's status.
- On every relevant event, **retrieve the subscription from the API** and overwrite your row (full upsert). Do not patch from `previous_attributes` or trust the embedded object; events can arrive late or out of order, and the API gives the current truth.
- Keep your own column for derived access (`has_access`) so authorization checks are a local query. Recompute on every sync.
- Store `stripe_subscription_id`, `stripe_customer_id`, `status`, price ids (or lookup keys), `current_period_end` (min over items), `cancel_at_period_end`, `cancel_at`, `trial_end`, `synced_at`, last event id.
- Add a reconciliation job (nightly or on demand) that lists active subscriptions from Stripe and repairs drift. Never rely on it as the primary path.

## Statuses and access mapping

| Status | Meaning | Typical access |
| --- | --- | --- |
| `incomplete` | First payment not yet successful or needs customer action; expires to `incomplete_expired` (about 23 h) | none |
| `incomplete_expired` | Terminal; first payment never completed | none |
| `trialing` | In trial | yes |
| `active` | Paid and in good standing (also while `pause_collection` is set, and while `cancel_at_period_end` is true) | yes |
| `past_due` | Renewal payment failed; retries/dunning in progress | product decision: grace period with banner, or none |
| `unpaid` | Retries exhausted and the Dashboard dunning setting leaves it unpaid; invoices keep accruing | none |
| `paused` | Paused (on-demand pause in flexible billing mode, or trial ended without a payment method and the trial end behavior is pause); see `status_details.paused` | none |
| `canceled` | Terminal | none |

- Default for unknown or future statuses: no access. SDK enums are open (`| OtherString`).
- `cancel_at_period_end: true` keeps `active` until the period ends, then `customer.subscription.deleted`.
- `status_details.paused.subscription.type` explains why: `pause_requested`, `first_payment_failure`, `final_payment_failure`, `trial_end_without_payment_method`, `system`.
- Lifecycle events to subscribe to: `checkout.session.completed`, `customer.subscription.created|updated|deleted|paused|resumed|trial_will_end`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.upcoming`, `customer.subscription.pending_update_applied|expired`.

## Creating subscriptions

Prefer Checkout `mode: "subscription"` (see [checkout-payments.md](checkout-payments.md)). Create directly via API only for custom UIs:

```ts
const sub = await stripe.subscriptions.create(
  {
    customer: customerId,
    items: [{ price: price.id }],
    payment_behavior: "default_incomplete",
    payment_settings: { save_default_payment_method: "on_subscription" },
    expand: ["latest_invoice.confirmation_secret"],
    metadata: { app_user_id: user.id },
  },
  { idempotencyKey: `sub-create:${user.id}:${price.id}` },
)
const invoice = sub.latest_invoice as Stripe.Invoice
const clientSecret = invoice.confirmation_secret?.client_secret // confirm with Payment Element
```

`default_incomplete` returns `incomplete` until the customer pays; the webhook `invoice.paid` then moves it to `active`. `error_if_incomplete` and `pending_if_incomplete` exist for specific flows; `allow_incomplete` is legacy-style.

## Changing plans, proration, anchors

```ts
await stripe.subscriptions.update(sub.id, {
  items: [{ id: sub.items.data[0].id, price: newPrice.id }], // replace the item, do not add
  proration_behavior: "create_prorations", // or "always_invoice" | "none"
})
```

- Replace by passing the existing item `id`; omitting it adds a second item (double billing).
- `create_prorations` (default) adds prorations to the next invoice; `always_invoice` bills the difference now; `none` skips proration.
- Preview before applying: `stripe.invoices.createPreview({ subscription, subscription_details: { items, proration_behavior, proration_date } })` and show `total`/lines to the user. Use the same `proration_date` in the update.
- `billing_cycle_anchor` is an object since Endive: `{ type: "now" }` resets the cycle; `{ type: "unchanged" }` keeps it.
- Upgrades usually bill now; downgrades often take effect at period end: use a Subscription Schedule (`subscriptionSchedules`) or Portal settings rather than ad-hoc date math.
- Quantity (seats): update `quantity` on the item; Subscriptions have per-hour quantity-update limits (see rate limits).
- Changing currency or interval across items has restrictions; when an update fails, read `err.code`/`err.param`.

## Trials

- Checkout: `subscription_data.trial_period_days` or `trial_end`; add `payment_method_collection: "if_required"` for no-card trials.
- API: `trial_period_days`, `trial_end`, `trial_settings.end_behavior.missing_payment_method: "cancel" | "pause" | "create_invoice"`.
- Listen to `customer.subscription.trial_will_end` (sent 3 days before the end) to prompt for a payment method.
- Trial offers (reusable trial definitions, GA in Endive) exist under `productCatalog`; check docs before using.
- Prevent trial abuse in your app (one trial per user/org/email domain); Stripe does not do this for you. Billing Evaluations (Radar, preview channel) are an option.

## Cancel, pause, resume

```ts
// at period end (reversible until then)
await stripe.subscriptions.update(id, { cancel_at_period_end: true, cancellation_details: { comment, feedback: "too_expensive" } })
// undo
await stripe.subscriptions.update(id, { cancel_at_period_end: false })
// immediately (terminal)
await stripe.subscriptions.cancel(id, { invoice_now: false, prorate: false, cancellation_details: { comment } })
```

- Prefer `cancel_at_period_end` for self-serve cancel; the Portal does this by default.
- Immediate cancel with `prorate: true` + `invoice_now: true` issues credit/final invoice; refunds are separate (see [invoices-tax-discounts-disputes.md](invoices-tax-discounts-disputes.md)).
- **Pause payment collection** (older, any billing mode): `update(id, { pause_collection: { behavior: "void" | "keep_as_draft" | "mark_uncollectible", resumes_at } })`. Status stays `active`, invoices are still created; you decide access.
- **Pause subscription** (Endive, needs `billing_mode.type: "flexible"`): `stripe.subscriptions.pause(id, { type: "subscription", invoicing_behavior, bill_for })` stops invoice generation; status becomes `paused`; events `customer.subscription.paused` / `resumed`. Resume: `stripe.subscriptions.resume(id, { billing_cycle_anchor: { type: "now" }, payment_behavior: "resume_on_payment_success" | "resume_on_payment_attempt", proration_behavior })`. Subscription Schedules can plan pauses via `pause_schedules`. Handle `paused` status and `status_details` or revoke/restore access wrongly.
- Settings for automatic pause after payment failures exist in Endive; check Dashboard billing settings.
- Win-back: set `cancellation_details` and use Feedback Options API (`billing.feedbackOptions`) for structured reasons.

## Dunning and failed payments

- Smart Retries, retry schedule, emails, and final action (cancel, mark `unpaid`, leave) are Dashboard settings (Billing → Revenue recovery). Code cannot rely on a fixed number of retries.
- `invoice.payment_failed`: notify the user and show a banner linking to the Portal payment-method update. Do not revoke access here unless policy says so; status `past_due` is the signal.
- `invoice.payment_action_required`: customer must authenticate (SCA); send them to the hosted invoice URL (`hosted_invoice_url`) or Portal.
- Final failure arrives as `customer.subscription.updated` (to `unpaid`/`canceled`) or `deleted`.
- `automatic_tax` failures surface as `failed_tax_calculation` or `customer_tax_location_invalid` on invoice finalization errors.

## Customer Portal

Self-serve cancel, plan switch, payment method update, invoice history. Configure in Dashboard (or `stripe.billingPortal.configurations`); the default configuration applies when `configuration` is omitted.

```ts
const portal = await stripe.billingPortal.sessions.create({
  customer: customerId, // from your DB for the signed-in user only
  return_url: `${origin}/billing`,
})
return Response.redirect(portal.url, 303)

// deep link
await stripe.billingPortal.sessions.create({
  customer: customerId,
  return_url: `${origin}/billing`,
  flow_data: { type: "subscription_cancel", subscription_cancel: { subscription: subId } },
})
```

`flow_data.type`: `payment_method_update`, `subscription_cancel`, `subscription_update`, `subscription_update_confirm`, `customer_update`. Portal changes arrive as normal subscription events, so no extra handling beyond the sync below. Portal sessions are short-lived URLs; create one per click, never cache or log them.

## Syncing state into your DB

```ts
const ACCESS = new Set(["active", "trialing"]) // add "past_due" only if policy grants grace

export async function loadSubscriptionRow(subscriptionId: string): Promise<SubRow> {
  const sub = await stripe.subscriptions.retrieve(subscriptionId, { expand: ["items.data.price"] })
  const customerId = typeof sub.customer === "string" ? sub.customer : sub.customer.id
  const periodEnds = sub.items.data.map((i) => i.current_period_end)
  return {
    stripeSubscriptionId: sub.id,
    stripeCustomerId: customerId,
    userId: sub.metadata.app_user_id ?? null,
    status: sub.status,
    priceIds: sub.items.data.map((i) => i.price.id),
    currentPeriodEnd: periodEnds.length ? new Date(Math.min(...periodEnds) * 1000) : null,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    cancelAt: sub.cancel_at ? new Date(sub.cancel_at * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    hasAccess: ACCESS.has(sub.status),
    syncedAt: new Date(),
  }
}
```

The full handler (event → subscription id → API read outside the DB transaction → dedupe insert + upsert in one transaction) is in [webhooks-events.md](webhooks-events.md). Map events to the subscription id:

| Event | How to find the subscription |
| --- | --- |
| `customer.subscription.*` | `event.data.object.id` |
| `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required` | `invoice.parent?.subscription_details?.subscription` |
| `checkout.session.completed` | `session.subscription` when `mode === "subscription"` |
| `entitlements.active_entitlement_summary.updated` | by `customer`, then list entitlements |

One-time purchases: store an `orders` row keyed by `payment_intent` or `checkout_session` id and mark paid from `checkout.session.completed`/`payment_intent.succeeded` with a unique constraint to make fulfillment idempotent.

## Billing mode classic vs flexible

- `billing_mode.type`: `classic` (long-standing behavior) or `flexible` (newer proration, per-item billing, pause-on-demand, more discount behavior). New subscriptions can opt in at creation (`billing_mode: { type: "flexible" }`); existing ones can be migrated with `subscriptions.migrate(id, { billing_mode: { type: "flexible" } })`. Treat migration as one-way: test with a test clock first.
- Behavior of proration and invoice line shapes differs between modes; recheck expectations in tests when switching.
