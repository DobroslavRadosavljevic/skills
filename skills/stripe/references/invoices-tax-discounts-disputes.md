# Invoices, Tax, Discounts, Refunds, Disputes

Snippets typechecked against `stripe@23.0.0`.

## Contents

- Invoices
- Coupons and promotion codes
- Stripe Tax
- Refunds and credit notes
- Disputes and fraud warnings
- Events to subscribe to

## Invoices

- Subscriptions generate invoices automatically. Statuses: `draft` → `open` → `paid` | `uncollectible` | `void`. Drafts auto-finalize about one hour after creation; Stripe waits one hour after a successful `invoice.created` webhook response before attempting payment, so a failing endpoint can delay collection.
- `collection_method: "charge_automatically"` (card on file) or `"send_invoice"` (customer pays by link/bank transfer; set `days_until_due`). `hosted_invoice_url` and `invoice_pdf` are customer-facing links.
- Manual flows: `invoices.create` → `invoiceItems.create` (or `pending_invoice_items_behavior`) → `finalizeInvoice` → `pay`/`sendInvoice`. `voidInvoice` for unpaid errors; `markUncollectible` for write-offs. Paid invoices are corrected with credit notes, not edits.
- Use `invoice.paid` (fires when paid, including out-of-band) rather than `invoice.payment_succeeded` for "access paid". Also available: `invoice.payment_failed`, `invoice.payment_action_required`, `invoice.finalization_failed`, `invoice.overdue`, `invoice.overpaid`, `invoice.will_be_due`, `invoice.upcoming`, `invoice_payment.paid`.
- Invoice to subscription: `invoice.parent?.subscription_details?.subscription`. Payments: `invoice.payments` (expand) or `stripe.invoicePayments.list({ invoice })`. First-payment client secret: `invoice.confirmation_secret?.client_secret`. Endive adds `status_details` explaining `uncollectible`.
- Preview what a change will cost: `stripe.invoices.createPreview(...)`. This replaces the old upcoming-invoice endpoint.
- Never compute totals yourself for display after a change; read `total`, `amount_due`, `lines`.
- Invoices carry `metadata` from the subscription at finalization (`parent.subscription_details.metadata`).

## Coupons and promotion codes

A **Coupon** is the discount definition (percent or amount, duration `once`, `repeating`, `forever`). A **Promotion Code** is a customer-facing code that points at a Coupon, with restrictions.

```ts
const coupon = await stripe.coupons.create({ percent_off: 20, duration: "repeating", duration_in_months: 3 })
const promo = await stripe.promotionCodes.create({
  promotion: { type: "coupon", coupon: coupon.id },
  code: "SAVE20",
  max_redemptions: 100,
  restrictions: { first_time_transaction: true },
})
```

- Checkout: `allow_promotion_codes: true` lets customers type a code; or apply one with `discounts: [{ promotion_code: promo.id }]`. These two options are mutually exclusive.
- API subscriptions: `discounts: [{ coupon }]` or `[{ promotion_code }]` on create/update (not the removed top-level `coupon`).
- Restrictions: `first_time_transaction`, `minimum_amount` + `minimum_amount_currency`, `customer`, `expires_at`, `max_redemptions`.
- Validate codes server-side by looking up `promotionCodes.list({ code, active: true })`; never trust client-side "valid" flags. Rate-limit lookups to prevent code guessing.
- Currency-restricted amount coupons fail on other currencies. Percent coupons are safest across currencies.
- Discount details appear on `invoice.total_discount_amounts` and `subscription.discounts`.

## Stripe Tax

Prerequisites (Dashboard, per account and mode): tax settings (head office address, default `tax_behavior`, default product tax code) and tax registrations for places where you collect tax (`stripe.tax.registrations`). Stripe Tax calculates; it does not register or file for you unless you use the separate filing service.

- Checkout: `automatic_tax: { enabled: true }`. With a saved Customer add `customer_update: { address: "auto" }` (and `name: "auto"` when collecting tax IDs) so the collected address is stored. Optionally `tax_id_collection: { enabled: true }` and `billing_address_collection: "required"`.
- Subscriptions/Invoices via API: `automatic_tax: { enabled: true }`; the Customer needs a valid address or tax location (`customer.address`, `shipping`) or finalization fails with `customer_tax_location_invalid`. Endive adds `failed_tax_calculation`; handle both when branching on error codes.
- Prices: set `tax_behavior` (`inclusive`/`exclusive`) explicitly; Products: `tax_code` (a `txcd_` id from `stripe.taxCodes.list()`; pick the one matching what you sell).
- Custom payment flows (PaymentIntents): create a calculation with `stripe.tax.calculations.create`, charge `calculation.amount_total`, then record with `stripe.tax.transactions.createFromCalculation({ calculation, reference })` after payment success.
- Reverse charge/B2B: collect Tax IDs (`customers.createTaxId` / Checkout `tax_id_collection`).
- Test with real-looking addresses in sandbox; unregistered jurisdictions return zero tax with `taxability_reason` explaining why.
- Endive additions: new tax types (admissions, hospitality, luxury, tourism, digital excise, utility users, etc.), ticket-sales support, `performance_location` on calculation line items.

## Refunds and credit notes

```ts
const refund = await stripe.refunds.create(
  { payment_intent: pi, amount: 500, reason: "requested_by_customer", metadata: { order_id } },
  { idempotencyKey: `refund:${orderId}:${amount}` },
)
```

- Refund by `payment_intent` (preferred) or `charge`. Omit `amount` for a full refund. You cannot refund more than the remaining captured amount.
- Refund status is `pending`/`succeeded`/`failed`/`canceled`/`requires_action`. Handle `refund.created`, `refund.updated`, `refund.failed`, and `charge.refunded`. Update order state from events, not from the refund call alone.
- Refunds do not cancel subscriptions and do not return Stripe processing fees. Cancel and refund are two separate actions.
- Subscription proration credits and partial invoice corrections use `stripe.creditNotes.create({ invoice, lines | amount, reason })`; a credit note can refund to the payment method, credit the customer balance, or mark outside Stripe.
- Gate refund endpoints behind authorization and an audit log; require a human approval path for large amounts. Agents must not issue refunds in live mode.
- Refund windows are limited and differ by payment method (commonly around 180 days for cards; check docs). Older refunds need another payout route.

## Disputes and fraud warnings

- Events: `charge.dispute.created`, `.updated`, `.funds_withdrawn`, `.funds_reinstated`, `.closed`; `radar.early_fraud_warning.created`; `review.opened|closed`.
- Dispute statuses: `needs_response`, `under_review`, `won`, `lost`, `warning_*` (inquiries), `prevented`. `evidence_details.due_by` is the deadline.
- On `charge.dispute.created`: flag the order/user, pause fulfillment of undelivered goods, notify finance, and gather evidence (receipt, delivery/access logs, IP, customer communication, ToS acceptance, usage proof).
- Submit: `stripe.disputes.update(id, { evidence: { ... }, submit: true })`. Upload files with `stripe.files.create({ purpose: "dispute_evidence", file })` and pass the file ids. Endive validates evidence page limits. Accept a loss with `stripe.disputes.close(id)`.
- Subscription `cancellation_details.reason: "payment_disputed"` marks cancellations caused by disputes. Revoke access on `lost`, or earlier by policy.
- Early fraud warnings: consider proactive refund to avoid a dispute fee; decide by policy, not automatically in code that an agent edits without review.
- Keep evidence data in your DB (access logs, order history) so a response can be assembled quickly.

## Events to subscribe to

Minimum for subscription SaaS: `checkout.session.completed`, `checkout.session.async_payment_succeeded|failed`, `customer.subscription.created|updated|deleted|paused|resumed|trial_will_end`, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`, `entitlements.active_entitlement_summary.updated` (if using Entitlements), `charge.dispute.created|closed`, `charge.refunded`. Add `payment_intent.succeeded|payment_failed` for one-time Payment Element flows and `setup_intent.succeeded` for saved methods. Subscribe narrowly: unused events add load and failure surface.
