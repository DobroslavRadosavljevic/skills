# Checkout, Payment Element, Customers, Prices

All snippets typechecked against `stripe@23.0.0`, `@stripe/stripe-js@10.0.0`, `@stripe/react-stripe-js@7.0.0`.

## Contents

- Choosing an integration
- Customers and mapping to app users
- Products, Prices, lookup keys
- Checkout Sessions (hosted, embedded, Elements)
- Fulfillment from Checkout
- Payment Element with PaymentIntents
- SetupIntents and saved payment methods
- Common mistakes

## Choosing an integration

| Need | Use | `ui_mode` / API |
| --- | --- | --- |
| Fastest, Stripe-hosted page, most payment methods, Tax, promo codes, trials | Checkout hosted | `hosted_page`, redirect to `session.url` |
| Same Checkout, inside your page | Checkout embedded | `embedded_page`, `client_secret`, `createEmbeddedCheckoutPage` or `EmbeddedCheckoutProvider` |
| Fully custom layout, still Checkout Session state (taxes, shipping, discounts, line items) | Elements with Checkout Sessions | `elements`, `initCheckoutElementsSdk` or `CheckoutElementsProvider` |
| Arbitrary amounts, marketplace flows, full control | Payment Element + PaymentIntent | `paymentIntents.create`, `Elements` |
| Save a method for later, no charge now | Checkout `mode: "setup"` or SetupIntent | |
| No code, shareable link | Payment Links | `paymentLinks` |

`form` mode exists in types but needs beta access. Ask the user before using it.

Default to hosted Checkout for subscriptions and one-time purchases unless the user needs custom UI. Fewer PCI and SCA edge cases, Stripe maintains payment-method coverage.

## Customers and mapping to app users

- Store `stripe_customer_id` on the user (or org) row with a unique constraint. Create the Customer lazily at first checkout, or at sign-up, never twice.
- Make creation idempotent and race-safe: key `customer-create:${userId}`, then persist the id with `UPDATE ... WHERE stripe_customer_id IS NULL` and re-read on conflict.
- Put `metadata: { app_user_id }` on Customer, Subscription (`subscription_data.metadata`), and PaymentIntent (`payment_intent_data.metadata`). Webhooks then map back without extra lookups.
- Authorize: the signed-in user may only act on their own Customer. Never accept a `customer` id from the client.
- Email is not identity: users change emails; Stripe allows duplicate emails. Use `customers.update` to sync email.
- `customers.search` is eventually consistent; use it for admin tools, not for correctness.
- For organizations, one Customer per org and map members through your own tables.
- Deleting a Customer cancels its subscriptions immediately; prefer archiving in your DB.

```ts
export async function ensureCustomer(user: { id: string; email: string; name?: string }, saved: string | null) {
  if (saved) return saved
  const customer = await stripe.customers.create(
    { email: user.email, name: user.name, metadata: { app_user_id: user.id } },
    { idempotencyKey: `customer-create:${user.id}` },
  )
  return customer.id // persist with a conditional update
}
```

## Products, Prices, lookup keys

- Products describe what you sell; Prices describe how it is billed. Prices are immutable (amount, currency, interval). Change by creating a new Price, moving the `lookup_key` with `transfer_lookup_key: true`, and archiving the old one.
- Use `lookup_key` (e.g. `pro_monthly`) so code works in sandbox and live with different `price_` ids.
- Amounts are in the smallest currency unit (integers). Zero-decimal currencies (JPY) differ.
- Set `tax_behavior` (`exclusive`/`inclusive`) on Prices and `tax_code` on Products when using Stripe Tax.
- Create catalog objects with a seed script run once per account (sandbox, then live), not at app boot. Keep it idempotent (`lookup_key` lookups first).

```ts
const { data: [price] } = await stripe.prices.list({ lookup_keys: ["pro_monthly"], active: true, expand: ["data.product"] })
await stripe.prices.create({
  product: "prod_x", currency: "usd", unit_amount: 1900,
  recurring: { interval: "month" }, lookup_key: "pro_monthly", transfer_lookup_key: true, tax_behavior: "exclusive",
})
```

## Checkout Sessions

Hosted subscription Checkout:

```ts
const session = await stripe.checkout.sessions.create(
  {
    mode: "subscription",
    ui_mode: "hosted_page",
    customer: customerId,
    client_reference_id: user.id,
    line_items: [{ price: price.id, quantity: 1 }],
    allow_promotion_codes: true,
    automatic_tax: { enabled: true },
    customer_update: { address: "auto" },
    subscription_data: { metadata: { app_user_id: user.id }, trial_period_days: 14 },
    success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/billing`,
  },
  { idempotencyKey: `checkout:${user.id}:${price.id}:${bucket}` },
)
return Response.redirect(session.url!, 303)
```

- `mode`: `payment`, `subscription`, `setup`. Subscription mode requires recurring Prices only; payment mode accepts one-time Prices.
- Idempotency: include a time bucket or cart hash so a legitimate second attempt later is not blocked by a reused key with different params.
- `success_url` page may show a friendly message but must not grant access. Optionally retrieve the session to show status.
- Sessions expire (default 24 h). Expired or abandoned sessions do not create subscriptions.
- `allow_promotion_codes` and explicit `discounts` are mutually exclusive.
- Do not set `payment_method_types` (removed in Endive). Control methods in the Dashboard, or use `allowed_payment_method_types` / `excluded_payment_method_types`.
- Do not pass both `customer` and `customer_email`. For guests, omit both and read `customer_details` on completion; set `customer_creation: "always"` in payment mode if you need a Customer.

Embedded:

```ts
// server
const s = await stripe.checkout.sessions.create({
  mode: "payment", ui_mode: "embedded_page", customer: customerId,
  line_items: [{ price: price.id, quantity: 1 }],
  return_url: `${origin}/return?session_id={CHECKOUT_SESSION_ID}`,
})
return Response.json({ clientSecret: s.client_secret })
```

```tsx
// client
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY) // module scope
<EmbeddedCheckoutProvider stripe={stripePromise} options={{ fetchClientSecret }}>
  <EmbeddedCheckout />
</EmbeddedCheckoutProvider>
```

Elements with Checkout Sessions: create with `ui_mode: "elements"` and a `return_url`; pass `client_secret` to `CheckoutElementsProvider` from `@stripe/react-stripe-js/checkout`; render `PaymentElement`, `BillingAddressElement`, etc.; the Session is the source of totals, so read amounts from the Checkout object, not your own math. Constraints: `custom_fields`, `branding_settings`, and `after_expiration` cannot be set with `elements`.

## Fulfillment from Checkout

Handle both events; the second covers delayed methods (bank debits, vouchers):

- `checkout.session.completed`: if `payment_status === "paid"`, fulfill. If `"unpaid"`, wait.
- `checkout.session.async_payment_succeeded`: fulfill. `checkout.session.async_payment_failed`: notify/cancel order.
- `checkout.session.expired`: release reserved inventory.

Fulfillment must be idempotent (webhook retries, plus a possible success-page lookup). Retrieve line items with `stripe.checkout.sessions.listLineItems(id)` or `expand: ["line_items"]`. For subscriptions, store `session.subscription` and `session.customer`, then let `customer.subscription.*` and `invoice.paid` drive state (see [billing-subscriptions.md](billing-subscriptions.md)).

## Payment Element with PaymentIntents

Server:

```ts
const intent = await stripe.paymentIntents.create(
  {
    amount: await priceForOrder(order), // server-side, minor units
    currency: "usd",
    customer: customerId,
    automatic_payment_methods: { enabled: true },
    metadata: { order_id: order.id },
  },
  { idempotencyKey: `pi:${order.id}` },
)
return Response.json({ clientSecret: intent.client_secret })
```

Client:

```tsx
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <PayForm />
</Elements>

// inside PayForm
const { error } = await stripe.confirmPayment({ elements, confirmParams: { return_url: `${origin}/return` } })
```

- Reuse the same PaymentIntent for retries of one order (retrieve/update by id); creating a new one per click causes duplicate charges and abandoned intents.
- After redirect, call `stripe.retrievePaymentIntent(clientSecret)` for UX only. Fulfill on `payment_intent.succeeded` (verified webhook).
- Amount changes before confirmation: `paymentIntents.update` server-side, then `elements.fetchUpdates()` client-side.
- Statuses: `requires_payment_method`, `requires_confirmation`, `requires_action`, `processing`, `succeeded`, `canceled`, `requires_capture`. `processing` is not success.
- Deferred-intent flow (create intent after the customer clicks pay) uses `Elements` with `mode`, `amount`, `currency` and `elements.submit()`; do not set the removed `paymentMethodTypes` option.
- Manual capture: `capture_method: "manual"`, then `paymentIntents.capture`. Authorizations expire (typically 7 days for cards).

## SetupIntents and saved payment methods

- `setupIntents.create({ customer, usage: "off_session", automatic_payment_methods: { enabled: true } })` + Payment Element with `stripe.confirmSetup`. Fulfill on `setup_intent.succeeded`.
- Charge later off-session: `paymentIntents.create({ customer, payment_method, off_session: true, confirm: true, amount, currency })`. Handle `StripeCardError` with `code: "authentication_required"` by emailing the customer a link to an on-session payment flow.
- For subscriptions, Stripe stores the default method; set `payment_settings.save_default_payment_method: "on_subscription"` when you create subscriptions directly.
- Listing methods: `customers.listPaymentMethods(customerId, { type: "card" })`. Show only brand/last4/exp from the API; never store PANs.

## Common mistakes

- Granting access in the `success_url` handler instead of the webhook.
- Trusting client-sent `amount`, `price`, or `customer`.
- Creating a PaymentIntent per render/click.
- Using `payment_intent.succeeded` to provision subscriptions (invoice and subscription may not exist yet).
- Logging full Checkout Session / PaymentIntent objects (contain `client_secret`; treat as secret, send only to the paying browser).
- Calling `loadStripe` inside render or with a `sk_` key.
