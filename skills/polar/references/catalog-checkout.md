# Products, Prices, Checkout, Discounts

## Contents

- Product model
- Price types
- Checkout: links vs sessions vs embedded
- Checkout session fields
- Success flow
- Discounts, trials, custom fields

## Product model

Everything is a product: one-time or recurring (daily/weekly/monthly/yearly, with `recurring_interval_count`). Billing cycle and pricing type are fixed at creation; to change them, create a new product. Monthly vs yearly plans are separate products shown together in one checkout. Archive instead of delete; archived products vanish from new checkouts while existing subscriptions keep renewing. Only products with no orders, subscriptions, trials, or discounts can be deleted.

- Changing a fixed price affects new purchases only. Existing subscribers are grandfathered; move them per subscription (`subscriptions.update` with `product_id`).
- Benefit changes propagate: adding a benefit grants it to existing customers; removing it revokes.
- `metadata` on a product travels on orders, subscriptions, and webhooks. Never store secrets there.
- A customer can hold only one active subscription per organization unless the organization setting "Allow multiple subscriptions" is on.
- Customers always buy a single product per checkout. Multiple `products` means a choice, not a bundle.
- Create the catalog in the dashboard or via API/CLI per environment and keep IDs in env/config keyed by environment.

## Price types

| Type (`amount_type`) | Use | Notes |
|---|---|---|
| `fixed` | Set price | `price_amount` in the smallest currency unit |
| `custom` | Pay what you want | `minimum_amount`, `maximum_amount`, `preset_amount`; checkout `amount` only for custom prices |
| `free` | Free tier, lead magnet, benefit gate | Free recurring products still create subscriptions; `subscriptions.create` can subscribe a customer to a free product without checkout |
| `metered_unit` (`meter_id`, `unit_amount`, `cap_amount`) or `metered_tiers` | Usage billing | Recurring products only; stacks on other prices; see [benefits-usage.md](benefits-usage.md) |
| `seat_based` (`seat_tiers`: `min_seats`, `max_seats`, `price_per_seat`) | Team plans | Fixed per seat, graduated, or volume; max 1,000 seats per subscription |
| `unit_based` (`tiers`, `minimum_units`, `unit_label`) | Paid-up-front quantity (devices, GB) | One unit-based price per product; cannot combine with seat-based or PWYW; benefits granted once regardless of quantity |

- Multi-currency: price in several currencies; the organization default currency price is required (missing means the product is treated as free). Polar picks the currency from the customer's geolocation, so forward `customer_ip_address` when creating sessions from a server.
- `tax_behavior` per price controls tax-inclusive vs exclusive display; by default Polar follows the customer's country convention.
- Metered prices only apply to subscriptions. Volume pricing applies one rate to all units; graduated charges each range at its own rate.

## Checkout: links vs sessions vs embedded

| Option | When | Notes |
|---|---|---|
| Checkout Link | No per-user logic: marketing pages, emails | Long-lived URL created in the dashboard (`checkout_links`). Each visit creates a new session. Share the link, never a session URL. Query params prefill email, name, discount, locale, `amount`, `reference_id`, `utm_*`, `theme` |
| Checkout Session API | Authenticated users, per-customer data, multiple products, ad-hoc prices | `polar.checkouts.create(...)` returns `url`, `client_secret`, `expires_at`, `status`. Redirect to `url` |
| Embedded checkout | Keep the user on your site | `@polar-sh/checkout/embed` (`PolarEmbedCheckout.create(url, { theme })` or `data-polar-checkout` links). Dynamic sessions need `embed_origin` set to the embedding page origin |

Embedded checkout requires every embedding host to be listed under Settings → Preferences → Embedding (enforced since 2026-08-17; organizations created after 2026-08-04 need a list first). Entries are hosts without scheme (`example.com`, `*.example.com`, `localhost:3000`); public HTTP hosts cannot be listed. A `frame-ancestors` console error means the host is missing. Events on the embed: `loaded` (use the `onLoaded` option), `confirmed`, `success`, `close`.

`status` values: `open`, `expired`, `confirmed`, `succeeded`, `failed`. Use them for UX only; entitlement comes from webhooks.

## Checkout session fields

```ts
const checkout = await polar.checkouts.create({
  products: [productId],                  // required; shown in this order
  external_customer_id: user.id,          // your immutable ID
  success_url: "https://app.example.com/billing/success?checkout_id={CHECKOUT_ID}",
  return_url: "https://app.example.com/pricing",
  customer_ip_address: clientIp,          // forward when calling from a server/edge
  metadata: { app_account_id: user.id },  // copied to order/subscription
});
return Response.redirect(checkout.url, 302);
```

Verified fields (2026-10 `CheckoutProductsCreate`): `products`, `external_customer_id`, `customer_id`, `customer_email`, `customer_name`, `customer_billing_name`, `customer_billing_address`, `customer_tax_id`, `is_business_customer`, `customer_ip_address`, `customer_metadata`, `metadata`, `custom_field_data`, `discount_id`, `allow_discount_codes`, `require_billing_address`, `seats`/`min_seats`/`max_seats`, `units`/`min_units`/`max_units`, `amount`, `currency`, `prices` (ad-hoc, per product ID), `subscription_id` (upgrade a free subscription), `trial_interval`/`trial_interval_count`/`allow_trial`, `success_url`, `return_url`, `embed_origin`, `locale`. The older `product_id` / `product_price_id` body is deprecated.

- When `customer_id` or `external_customer_id` is set, the email is prefilled and locked on the checkout page. After success Polar creates the customer with that `external_id`.
- `customer_metadata` lands on the new customer; `metadata` lands on the order/subscription. Use stable keys (`app_account_id`, `source`).
- Ad-hoc prices (`prices`) are session-scoped (`source: "ad_hoc"`) and support fixed, custom, free, seat-based, and metered; use only for genuinely dynamic pricing.
- Append `?theme=light|dark` to `checkout.url` to force a theme; it is not an API field.
- Server-created sessions are attributed to your server's IP. Always pass `customer_ip_address` (for example from `CF-Connecting-IP` or the first trusted `x-forwarded-for` hop) so currency and tax country are right.
- Do not accept arbitrary `products`, `discount_id`, `prices`, `amount`, or `success_url` from the client. Allow-list product IDs server-side.

## Success flow

`success_url` supports the literal `{CHECKOUT_ID}` placeholder. Use it only to show a "processing" page and poll your own entitlement state (which a webhook updates). Never grant access from the redirect or from a client-provided checkout ID alone. If you omit `success_url`, the customer stays on Polar's confirmation page; with seat-based products and the default confirmation page the buyer's seat is auto-claimed, but with a custom `success_url` the buyer must assign themselves a seat.

## Discounts, trials, custom fields

- Discounts: percentage or fixed; duration `once`, repeating months, or `forever`; optional `code` (case-insensitive); restrictions: products, start/end, max redemptions, max per customer (matched by customer ID, email ignoring plus-aliases, or card). Codeless discounts apply only via Checkout Link preset or API (`discount_id`). A discount on a subscription applies to the whole invoice including metered usage. Refunding an order frees the customer's slot; a partial refund does not.
- Apply or remove on a subscription: `subscriptions.update(id, { discount_id })` (or `null`); applies from the next cycle.
- Trials: unit (day/week/month/year) plus count on the product, checkout link, or session; the session/link overrides the product. Card is collected up front. Enable "Prevent trial abuse" to track normalized email and card fingerprint. Reminders go out automatically (3 days before for trials of 3+ days).
- Custom fields (text, number, date, checkbox, select) are defined at organization level, enabled per product, and returned as `custom_field_data`.
- Localization: pass `locale` (BCP 47) or let the browser decide.
