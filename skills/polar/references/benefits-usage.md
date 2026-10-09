# Benefits and Usage-Based Billing

## Contents

- Benefit model
- Benefit types
- Usage-based billing flow
- Event ingestion
- Meters and metered prices
- Credits and limits
- Enforcement pattern

## Benefit model

Benefits are standalone resources attached to one or many products. Customers hold them while a subscription is active or trialing, or forever after a one-time purchase. Cancelled or revoked subscriptions lose them. Each (benefit, customer or member, source order or subscription) pair is a benefit grant with events `benefit_grant.created|updated|cycled|revoked`.

- Adding or removing a benefit on a product propagates to existing customers.
- Several sources can grant the same benefit to one customer; revoke access only when no active grant remains (or use Customer State).
- Seat products grant to members after a seat is claimed.
- Manage benefits in the dashboard or via `polar.benefits.*`, `polar.products.updateBenefits`, and `polar.benefitGrants.list`.

## Benefit types

`BenefitType` values in the 2026-10 spec: `custom`, `discord`, `github_repository`, `downloadables`, `license_keys`, `meter_credit`, `feature_flag`, `slack_shared_channel`.

| Type | Use and rules |
|---|---|
| `feature_flag` | Recommended entitlement for app features. Granted at each cycle start, revoked on cancel; one-time purchases grant lifetime. Optional key-value metadata (role, limits) read from Customer State. Gate via `customers.getStateExternal` or `customer.state_changed` |
| `license_keys` | Brandable prefix, expiry, activation limits, per-key usage quota, rotate. Keys are used by your client or API with unauthenticated endpoints that require your `organization_id`: `POST /v1/customer-portal/license-keys/validate` and `.../activate` (SDK: `polar.customerPortal.licenseKeys.validate` / `activate`). Validate `benefit_id` when you sell more than one key type. `increment_usage` meters per-key quotas. Statuses `granted`, `revoked`, `disabled`; only granted/disabled keys can be rotated (`POST /v1/license-keys/{id}/rotate`). License keys carry `member_id` for seat holders in 2026-10 |
| `downloadables` | Files up to 10 GB with SHA-256 checksums and signed personal URLs. Disabling a file hides it from new customers only; deleting removes it for everyone. Re-enabling or adding files grants retroactively |
| `github_repository` | Invites buyers as collaborators on organization repositories (not personal ones by default). Needs the dedicated Polar GitHub App. Use Read role; paid GitHub organizations bill collaborators as seats |
| `discord` | Invites and roles via the Polar Discord app (needs manage roles, kick members, create invite). The connected server cannot be changed after creation |
| `slack_shared_channel` | Shared Slack Connect channel for customers |
| `custom` | Markdown private note shown on success page, email, and portal (links, onboarding, partner coupons). Not for entitlement checks anymore; use `feature_flag` |
| `meter_credit` | Credits a customer's meter balance at each cycle (subscriptions) or once (one-time); optional rollover of unused credits (applies to newly issued credits only) |

Never put secrets in benefit descriptions or metadata that customers can see. Provision external side effects (Discord, GitHub) through Polar's benefit, not by re-implementing them from webhooks, unless you need custom logic; then drive it from `benefit_grant.*` with idempotent handlers.

## Usage-based billing flow

1. Create a meter (name, filter, aggregation).
2. Add a metered price (`metered_unit` or `metered_tiers`) to a recurring product, optionally with a cap, alongside a fixed base fee.
3. Ingest events from trusted server code.
4. Customers see estimated charges in the portal; usage is invoiced with the subscription at period end (monthly or yearly per billing interval). Cancelled subscriptions get a final invoice for consumed usage. A subscription discount applies to the whole invoice including usage.

## Event ingestion

```ts
const result = await polar.events.ingest({
  events: [
    {
      name: "ai_generation",                       // must match the meter filter
      external_customer_id: user.id,               // or customer_id; exactly one customer reference
      external_id: `gen_${generationId}`,          // stable, unique per logical event
      timestamp: new Date().toISOString(),         // optional, ISO 8601
      metadata: { input_tokens: 1200, output_tokens: 350, model: "gpt-x" }, // numbers stay numbers
    },
  ],
});
// result.inserted, result.duplicates
```

- Needs `events:write`. Ingest from the same server code that performs the metered action. Never trust a browser to report usage (the Better Auth `usage.ingest` client endpoint is non-authoritative for that reason).
- Persist the `external_id` (outbox row) before sending. On timeout or retry reuse the same `external_id`; treat `duplicates` as success. Never mint a new ID on retry.
- Optional fields: `member_id` / `external_member_id` for team attribution, `parent_id` (Polar event ID or external event ID) for trace trees (cost insights).
- Events are immutable and cannot be deleted. Polar attributes an event to the billing period in which it is received, not by `timestamp`; replaying old events never edits closed invoices. `timestamp` only affects charts and the displayed date range.
- Cost insights: add cost metadata to events for per-customer margin tracking (see source map). The `@polar-sh/ingestion` strategy helpers (LLM, S3, Stream, DeltaTime) at 0.4.2 still depend on SDK `^0.41`; prefer calling `events.ingest` directly unless the project already uses them and tests pass.

## Meters and metered prices

- Filter clauses combine with `and`/`or` over event name or metadata keys (write the metadata key directly, no `metadata.` prefix). Operators: equals, not equals, greater/less than (or equals), contains, does not contain. Values parse as number, then boolean, then string.
- Aggregations: count, sum, average, minimum, maximum, unique.
- Meter `unit` (scalar, token, custom label and multiplier) is display only and never changes billing.
- A meter's filter or aggregation can change only while it has no processed events and no customer purchases. Plan the event schema before launch.
- Pricing: unit (flat per unit), volume (total usage sets one rate for all units), graduated (each range its own rate). Prices are entered per single unit. Cap limits what a customer pays regardless of usage.
- Metered prices work on subscription products only. Credits-only plans omit the metered price.

## Credits and limits

Credits pre-pay usage. Meter balance is `credited_units - consumed_units`; credits are consumed before overage is billed. Issue them with a `meter_credit` benefit. Read balances from Customer State (`active_meters[].balance`) or `polar.customerMeters.list`. Polar never blocks a customer at zero: the app must stop or degrade the feature itself.

## Enforcement pattern

1. Before the metered action, read the cached or fresh balance for the customer; reject or degrade when it is insufficient.
2. Perform the action.
3. Write an outbox row with a stable `external_id`, then ingest (retry safely).
4. Refresh the cache on `customer.state_changed`; reconcile periodically against `customerMeters.list`.
Accept that concurrent requests can overshoot a balance slightly; reserve conservatively when overshoot has a real cost.
