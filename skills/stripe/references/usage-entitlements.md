# Usage-Based Billing and Entitlements

Snippets typechecked against `stripe@23.0.0`.

## Contents

- Meters model
- Create meter and metered price
- Report usage (v1 and v2 stream)
- Corrections and reading usage
- Pitfalls
- Entitlements
- Credits and alerts

## Meters model

A **Meter** defines which events to count (`event_name`), how to aggregate (`count`, `sum`, `last`), and how to find the customer. **Meter events** are the raw usage you send. A **metered Price** (`recurring.usage_type: "metered"` with `recurring.meter`) bills the aggregate at the end of each period via the subscription invoice. The legacy "usage records" API is replaced by meters; do not write new code against it.

## Create meter and metered price

```ts
const meter = await stripe.billing.meters.create({
  display_name: "API calls",
  event_name: "api_call",
  default_aggregation: { formula: "sum" },
  customer_mapping: { event_payload_key: "stripe_customer_id", type: "by_id" },
  value_settings: { event_payload_key: "value" },
})

await stripe.prices.create({
  product: productId,
  currency: "usd",
  unit_amount: 2, // or tiers with billing_scheme: "tiered"
  recurring: { interval: "month", usage_type: "metered", meter: meter.id },
  lookup_key: "api_calls_metered",
})
```

Add the metered Price as an item on the subscription (no `quantity`). Combine with a flat recurring Price for "base fee + usage". Credit grants and tiered/graduated pricing are configured on the Price/Dashboard.

## Report usage

```ts
await stripe.billing.meterEvents.create({
  event_name: "api_call",
  payload: { stripe_customer_id: customerId, value: "5" }, // all payload values are strings
  identifier: `req_${requestId}`, // dedupe key, unique for at least 24 h, max 100 chars
  // timestamp: unix seconds; within past 35 days or up to 5 minutes ahead
})
```

- Always set `identifier` from your own stable id (request id, job id) so retries do not double-bill.
- Send `value` as a string of a whole number; since Dahlia, values with more than 15 digits are rejected.
- Event ingestion is asynchronous. Invalid events (no customer, wrong payload key, no meter) are reported as thin events such as `v1.billing.meter.error_report_triggered` and `v1.billing.meter.no_meter_found`. Subscribe to them through a thin event destination and alert.
- v1 `meterEvents.create` suits normal traffic. For high throughput use the v2 stream (docs cite 10,000 events/s for the stream; confirm current limits for your account):

```ts
const session = await stripe.v2.billing.meterEventSession.create() // short-lived token; refresh before expires_at
const streamClient = new Stripe(session.authentication_token)
await streamClient.v2.billing.meterEventStream.create({
  events: [{ event_name: "api_call", payload: { stripe_customer_id: customerId, value: "1" } }],
})
```

Batch locally (aggregate per customer per few seconds) before sending when exact per-event audit trails are not required.

- Buffer with a durable queue so Stripe outages do not drop usage. Retry with the same `identifier`.
- Never send usage from the browser; use a server with the secret key.

## Corrections and reading usage

- Cancel a bad event: `stripe.billing.meterEventAdjustments.create({ event_name, type: "cancel", cancel: { identifier } })`. You can only cancel events within 24 hours of Stripe receiving them, so fix mistakes quickly.
- Read aggregates: `stripe.billing.meters.listEventSummaries(meterId, { customer, start_time, end_time, value_grouping_window })`. Summaries are eventually consistent, aligned to minute boundaries. Use them for dashboards, not for authorization.
- Upcoming invoice estimate: `stripe.invoices.createPreview({ customer, subscription })`.
- Keep your own usage ledger for in-app limits (fast, immediate); reconcile against Stripe summaries.
- Deactivate (not delete) meters you retire: `meters.deactivate(id)`.

## Pitfalls

- Meter `event_name` must match exactly (case-sensitive, max 100 chars).
- A customer with no subscription item for the metered price accrues no charge, but events still count toward the meter.
- Backdated events beyond 35 days fail.
- Sandbox and live meters are separate; recreate in each account (seed script).
- Do not mix the same meter into several prices unless you intend to bill the same usage twice.

## Entitlements

Entitlements map plan → feature access without hard-coding price ids in app code.

1. Create Features (stable `lookup_key` is your code's identifier): `stripe.entitlements.features.create({ name: "Advanced export", lookup_key: "advanced-export" })`.
2. Attach to Products: `stripe.products.createFeature(productId, { entitlement_feature: featureId })`. Anyone with an active subscription to the product gets the feature.
3. Read: `stripe.entitlements.activeEntitlements.list({ customer: customerId })` returns `lookup_key`s the customer currently has.
4. Stay current with the event `entitlements.active_entitlement_summary.updated` (thin: `v1.entitlements.active_entitlement_summary.updated`). On it, re-list entitlements for `event.data.object.customer` and cache them in your DB.

```ts
async function refreshEntitlements(customerId: string) {
  const keys: string[] = []
  for await (const e of stripe.entitlements.activeEntitlements.list({ customer: customerId, limit: 100 })) keys.push(e.lookup_key)
  await db.replaceCustomerFeatures(customerId, keys) // cache; gate with can(user, "advanced-export")
}
```

- Gate on the cached feature key, not on `status` alone. Fall back to the subscription row if the cache is empty and a re-list fails.
- Entitlements reflect Stripe subscription state, so the "source of truth" rule still holds: fetch after the event.
- Numeric limits (seats, quotas) are not entitlements; model them as subscription item `quantity`, Price metadata, or your own plan table.

## Credits and alerts

- Credit grants: `stripe.billing.creditGrants` (prepaid or promotional usage credit applied to metered invoices); balance via `billing.creditBalanceSummary`.
- Billing alerts: `stripe.billing.alerts` fire `billing.alert.triggered` (thin: `v1.billing.alert.triggered`) when usage thresholds are hit; use for soft limits and notifications.
- Check Dashboard availability (some features are gated by account or region) before building on them.
