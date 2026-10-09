# Customers, Customer State, Portal, Subscriptions, Orders, Refunds

## Contents

- Customers and external IDs
- Customer State and entitlement checks
- Customer portal and sessions
- Subscription lifecycle and calls
- Proration
- Seats and members
- Orders, invoices, refunds

## Customers and external IDs

Every buyer is a Polar customer, created automatically at checkout or explicitly with `customers.create`.

- `external_id` is your immutable user/org ID. It is unique within the Polar organization, may be set later if still unset, and cannot be changed or removed once set. Checkout `external_customer_id` becomes the customer's `external_id`.
- Prefer the external-ID endpoints so you never store Polar IDs: `customers.getExternal`, `updateExternal`, `deleteExternal`, `getStateExternal`.
- Creation is not atomic with a preflight lookup. If `create` reports an existing email or external ID, fetch and reconcile that customer instead of creating a second mapping. Never overwrite an existing `external_id`.
- Customers have `type: "individual"` or `"team"` (a customer becomes `team` permanently on its first seat-based purchase). `metadata` is for context, not the relational source of truth.
- Email is not a durable key. If portal email changes are enabled, sync `customer.updated` back into your user table.
- Delete the Polar customer when you delete the user (GDPR); the Better Auth plugin does this for you when `createCustomerOnSignUp` is on.

```ts
const customer = await polar.customers.create({
  external_id: user.id,
  email: user.email,
  name: user.name,
});
```

## Customer State and entitlement checks

One call or one webhook returns everything needed to provision: the customer, `active_subscriptions`, `granted_benefits`, and `active_meters` with `balance`.

```ts
const state = await polar.customers.getStateExternal(user.id);
const canUsePro = state.granted_benefits.some((g) => g.benefit_id === PRO_FEATURE_BENEFIT_ID);
```

- Prefer a `feature_flag` benefit attached to the relevant products over inferring access from subscription status or product IDs. Optional `benefit_metadata` (for example `max_upload_size`) travels in `granted_benefits[].benefit_metadata`.
- `customer.state_changed` fires when a customer is created/updated/deleted, a subscription is created/updated, or a benefit is granted/revoked. Use it as a snapshot: compute desired access from `granted_benefits` and idempotently write both enabled and disabled states. A missing benefit must disable access.
- For hot paths, cache state locally and refresh from the webhook; fall back to the API on cache miss or after a failed webhook. Enforce hard usage limits locally (see [benefits-usage.md](benefits-usage.md)).
- Alternative incremental ledger: upsert on `benefit_grant.created`/`updated`, mark revoked on `benefit_grant.revoked`, and derive access from "any grant with `is_granted` and not `is_revoked`" for that customer, member, and benefit. One revoked grant does not mean no access, since another subscription or order may still grant it.

## Customer portal and sessions

The hosted portal lets customers view subscriptions and orders, download invoices and receipts, edit billing details, see benefits (license keys, downloads), cancel, and update their payment method. It cannot be disabled or restyled, and updating a payment method exists only in the hosted portal (this keeps you out of PCI scope). Toggles under Settings → Customer portal control optional capabilities: metered usage, seat management, email change, plan changes, unit changes, pause.

Default URL: `https://polar.sh/<org-slug>/portal` (customer signs in with an emailed code). For a signed-in user, create a pre-authenticated session on demand:

```ts
const session = await polar.customerSessions.create({
  external_customer_id: user.id,               // from your server-side session, never the request
  return_url: "https://app.example.com/billing", // validate against an allow-list
});
return Response.redirect(session.customer_portal_url, 302);
```

- Sessions are short-lived (the token is valid about one hour). Generate a fresh link at click time; never store the URL.
- Union body: pass `customer_id` or `external_customer_id`, plus optional `member_id` / `external_member_id` to scope a team member's view (members see only their own benefits).
- Needs `customer_sessions:write`. The returned `token` can drive the Customer Portal API (`polar.customerPortal.*`) from your own UI; treat it as a bearer credential for that single customer.
- Link prominently to the portal when a subscription is `past_due`; updating the card triggers an immediate retry.

## Subscription lifecycle and calls

Statuses: `incomplete`, `incomplete_expired`, `trialing`, `active`, `past_due`, `canceled`, `unpaid`, `paused`. Paid recurring products create a subscription and first order at checkout. Free recurring products can be subscribed via `subscriptions.create` (no order, no email, no charge).

| Intent | Call |
|---|---|
| Upgrade/downgrade plan | `subscriptions.update(id, { product_id, proration_behavior })` |
| Change seats / units | `{ seats: 25, proration_behavior }` / `{ units: 40, proration_behavior }` |
| Cancel at period end | `{ cancel_at_period_end: true, customer_cancellation_reason?, customer_cancellation_comment? }` |
| Uncancel | `{ cancel_at_period_end: false }` |
| Revoke now | `subscriptions.revoke(id)` (irreversible, no refund) |
| Pause at period end | `{ pause_at_period_end: true, resumes_at? }`; cancel the pause with `false` |
| Resume now | `{ resume: true }` (charges immediately, new period) |
| Add/extend/end trial | `{ trial_end: isoDate }` / `{ trial_end: "now" }` |
| Move renewal date | `{ current_billing_period_end: isoDate }` |
| Discount | `{ discount_id }` or `null` (next cycle) |
| Drop a scheduled change | `{ pending_update: null }` |

Behavior to remember:

- Cancel at period end keeps `status: "active"` with `cancel_at_period_end: true` until `ends_at`, then the subscription becomes `canceled` and benefits are revoked. Final metered usage is invoiced at that point.
- Plan changes need a compatible recurring destination: same currency, not a pay-what-you-want product, not on a canceled or cancel-scheduled subscription (uncancel first). Non-seat to seat is allowed (customer is promoted to `team`, applies immediately); seat back to non-seat is not. Trialing subscriptions can change plan; the trial end is recomputed.
- Only customer-initiated cancel and payment-method update are always available in the portal; plan, seat, and pause changes follow the portal toggles. Revoke, discount, trial, and reschedule are merchant-only.
- Record a cancellation reason only when it comes from the customer (they can read the comment).
- Failed renewals: status `past_due`, `past_due_at` set, customer emailed, retries at +2, +7, +14, +21 days from first failure, then the subscription is revoked. A decline code that can never succeed (for example `lost_card`) revokes sooner. The organization setting "Grace period for benefit revocation" (immediately, 2, 7, 14, or 21 days) delays only benefit revocation, not retries. Branch on `status === "past_due"` in `subscription.updated` to show a banner or reduce features.
- Multiple parallel subscriptions per customer require the organization setting "Allow multiple subscriptions".
- Event sequences per action are in [webhooks.md](webhooks.md).

## Proration

Set the organization default under Settings → Subscriptions (also used for portal-initiated changes) or pass `proration_behavior` per call:

| Value | Effect |
|---|---|
| `invoice` | Apply now, charge or credit the prorated difference immediately |
| `prorate` | Apply now, carry the difference to the next invoice (promoted to `invoice` if the interval changes) |
| `next_period` | Schedule for the next cycle (`pending_update`), no proration; any later immediate change discards it |
| `reset` | Preview, paid plans only: new plan now, full price charged, billing cycle restarts |

Proration is per second over the real length of the current period. For `invoice` and `prorate` the update applies only if the immediate payment succeeds; on failure the API errors and nothing changes. Downgrade without credits: `next_period`. Upgrade that collects revenue now: `invoice`.

## Seats and members

Seat-based products separate payer from user: the Customer pays (becomes `team`), Members use (`owner`, `billing_manager`, `member`), a CustomerSeat links a member to the product (`pending`, `claimed`, `revoked`). Benefits are granted when a seat is claimed, not at purchase (except the buyer's auto-claim on the default confirmation page).

```ts
await polar.customerSeats.assignSeat({
  subscription_id,
  email: "engineer@company.com",
  immediate_claim: true, // skip the invitation email when you own authentication
});
```

- Identify end users by `grant.member`, never `grant.customer_id` (that is the buyer).
- Claim links expire after 24 hours; resend with `resendInvitation`. Revoking a seat does not reduce the paid seat count; reduce the subscription `seats` (cannot go below pending + claimed). Max 1,000 seats; seat metadata max 10 keys, 1 KB.
- Cancelling a subscription revokes each seat and grant individually (5 seats x 3 benefits is 21 events), so handlers must be idempotent.
- One-time seat products: each order has its own seat pool; more seats means a new checkout.
- Events: `customer_seat.assigned|claimed|revoked`, `member.created|updated|deleted`.

## Orders, invoices, refunds

- An order is every paid transaction. `billing_reason`: `purchase`, `subscription_create`, `subscription_cycle`, `subscription_update`, `subscription_meter_cycle`. Status: `draft`, `pending`, `paid`, `refunded`, `partially_refunded`, `void`. Act on `order.paid`, not `order.created`.
- Invoices: `orders.generateInvoice` then `orders.invoice`; receipts via `orders.receipt` (first call may return 202 while rendering). Billing details freeze after invoice generation; customers edit via the portal.
- Off-session charges (preview, paid plan): create a `draft` order, then `orders.finalize`; 402 means declined or SCA required.
- Refund: `polar.refunds.create({ order_id, reason, amount, comment?, revoke_benefits? })`. `amount` is the net amount excluding tax in cents; tax is refunded proportionally. Reasons: `duplicate`, `fraudulent`, `customer_request`, `service_disruption`, `satisfaction_guarantee`, `dispute_prevention`, `other`.
- Payment fees are not returned on refunds. Refunding a subscription order returns money but does not end access; cancel or revoke the subscription separately. For one-time purchases `revoke_benefits` removes access.
- Polar may refund proactively within 60 days to prevent chargebacks (cancelling the subscription and revoking benefits). Handle `order.refunded` / `refund.created` and `subscription.revoked` accordingly, and never assume refunds only originate from your code.
- Never run refunds or revokes against production from an agent without explicit user approval for that specific action.
