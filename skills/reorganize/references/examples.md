# Examples

Before → after trees for `reorganize`. Copy the **shape**, not the names.
Names stay descriptive. See [organization-model.md](organization-model.md) and
[split-heuristics.md](split-heuristics.md).

Each example lists **friction**, **target**, and a **split map** sketch.

---

## 1. God domain file → domain tree

**Friction:** `billing.ts` owns invoices, payments, tax, HTTP handlers, and
shared types (~900 LOC).

Before:

```text
src/billing.ts
src/billing.test.ts
```

After:

```text
src/billing/
  invoices/
    create.ts
    create.test.ts
    list.ts
    list.test.ts
    summary.ts
    types.ts
  payments/
    capture.ts
    capture.test.ts
    refund.ts
    types.ts
  tax/
    calculate.ts
    rates.ts
  http/
    invoice-routes.ts
    payment-routes.ts
```

Split map (sketch):

| Before | After | What moves |
| --- | --- | --- |
| `billing.ts` `CreateInvoice*` | `invoices/create.ts` | create workflow + its types if local |
| `billing.ts` `listInvoices` | `invoices/list.ts` | list query |
| `billing.ts` `Invoice` types used by both | `invoices/types.ts` | shared invoice types first |
| `billing.ts` `capturePayment` | `payments/capture.ts` | capture workflow |
| `billing.ts` route handlers | `http/*-routes.ts` | HTTP adapters last |

---

## 2. Unrelated roommates in `lib/misc.ts`

**Friction:** dates, money, HTML, and feature flags share one module.

Before:

```text
src/lib/misc.ts
src/lib/helpers.ts
src/lib/utils.ts
```

After:

```text
src/lib/
  dates/
    format-local.ts
    parse-iso.ts
  money/
    format-minor-units.ts
    round-currency.ts
  html/
    escape.ts
    strip-tags.ts
  feature-flags/
    read-flag.ts
    flags.ts
```

Do not create `src/lib/shared.ts` as the leftover bucket. If a helper has no
domain, name it after the operation and put it in the closest real category.

---

## 3. Scattered feature (feature envy)

**Friction:** the same user-profile feature lives in three roots.

Before:

```text
src/users/profile.ts
src/helpers/user-profile-map.ts
src/api/users-profile-handler.ts
src/types/user-profile.ts
```

After (slice-shaped app):

```text
src/users/profile/
  map.ts
  map.test.ts
  handler.ts
  types.ts
  load.ts
```

After (layer-shaped app — keep layers, group inside):

```text
src/api/users/profile-handler.ts
src/users/profile/map.ts
src/users/profile/types.ts
src/users/profile/load.ts
```

Pick the variant that matches the repo. Do not invent slices on top of a
strict layer codebase.

---

## 4. Mega React page

**Friction:** `OrderPage.tsx` owns layout, header, table, badge, dialog, and
data hook (~700 LOC).

Before:

```text
src/routes/orders/$orderId.tsx    # framework route — keep this filename
src/components/OrderPage.tsx
```

After:

```text
src/routes/orders/$orderId.tsx    # composes the panel; required name stays
src/orders/
  detail-panel.tsx
  detail-header.tsx
  line-items-table.tsx
  status-badge.tsx
  cancel-order-dialog.tsx
  use-order-detail.ts
```

The route file stays. Extract UI and the hook beside the domain, not into
`components/ui/misc/`.

---

## 5. Mega form

**Friction:** one `CheckoutForm.tsx` with schema, fields, submit, and three
unrelated field groups.

Before:

```text
src/checkout/CheckoutForm.tsx
```

After:

```text
src/checkout/
  checkout-form.tsx          # composition only
  checkout-schema.ts
  use-checkout-submit.ts
  fields/
    shipping-fields.tsx
    payment-fields.tsx
    review-fields.tsx
```

Keep field components that are only used here under `checkout/`. Promote to a
shared inputs folder only when a second feature actually uses them.

---

## 6. Service blob → service folder

**Friction:** `analytics-traffic-read.service.ts` mixes query windowing, SQL,
errors, and the public `run` method.

Before:

```text
services/analytics-traffic-read.service.ts
```

After:

```text
services/analytics-traffic-read/
  service.ts                 # public run()
  query-window.ts
  sql/
    traffic-read-query.ts
  errors/
    missing-range.ts
    invalid-filter.ts
```

Keep the durable service folder id. Split internals with names that say what
they are. Do not rename the service to `atr/`.

---

## 7. Trust buckets (do not flatten)

**Friction:** `private/ingest.ts` is a god file; `public/` is the HTTP contract.

Before:

```text
feature/ingest/
  public/index.ts
  private/ingest.ts          # parse, validate, write, metrics
  internal/…
```

After:

```text
feature/ingest/
  public/index.ts            # unchanged contract
  private/
    parse-payload.ts
    validate-payload.ts
    write-rows.ts
    metrics.ts
  internal/…
```

Do not move `private/` files into `public/` for convenience. Do not flatten
`public/private/internal` into one folder.

---

## 8. Route file with everything

**Friction:** TanStack / file-route module contains loader, component, schema,
and helpers. The **filename** is required.

Before:

```text
src/routes/settings/billing.tsx   # 800 LOC
```

After:

```text
src/routes/settings/billing.tsx   # route export only
src/settings/billing/
  billing-page.tsx
  billing-loader.ts
  plan-card.tsx
  invoice-list.tsx
  change-plan-schema.ts
```

---

## 9. Query / data layer mixed domains

**Friction:** flat `queries/` with prefix-disambiguated files that are actually
several domains (names may stay long).

Before:

```text
src/queries/
  users-profile-query.ts
  users-list-query.ts
  orders-detail-query.ts
  billing-invoice-query.ts
  billing-invoice-summary-query.ts
```

After:

```text
src/queries/
  users/
    profile-query.ts
    list-query.ts
  orders/
    detail-query.ts
  billing/
    invoice-query.ts
    invoice-summary-query.ts
```

Descriptive suffixes like `-query` may stay if the repo already uses them.
The win is grouping, not renaming `profile-query.ts` → `profile.ts`.

---

## 10. Errors and types buried in a handler

**Friction:** HTTP handler file exports Zod schemas, error classes, and the
handler.

Before:

```text
src/api/create-invoice.ts
```

After:

```text
src/api/invoices/
  create-handler.ts
  create-schema.ts
  errors/
    duplicate-invoice-number.ts
    invalid-line-item.ts
```

Move types/schemas first, then errors, then the handler.

---

## 11. Test god file

**Friction:** source was split; tests were not.

Before:

```text
src/billing/invoices/create.ts
src/billing/invoices/list.ts
src/billing/invoices/summary.ts
src/billing/billing.test.ts      # still tests all three + payments
```

After:

```text
src/billing/invoices/create.ts
src/billing/invoices/create.test.ts
src/billing/invoices/list.ts
src/billing/invoices/list.test.ts
src/billing/invoices/summary.ts
src/billing/invoices/summary.test.ts
src/billing/invoices/fixtures.ts
src/billing/payments/capture.ts
src/billing/payments/capture.test.ts
```

---

## 12. Package public export stays put

**Friction:** published import is `@acme/billing`; internals are one file.

Before:

```text
packages/billing/src/index.ts    # everything; also the public export
```

After:

```text
packages/billing/src/index.ts    # re-exports public API only
packages/billing/src/invoices/create.ts
packages/billing/src/invoices/list.ts
packages/billing/src/payments/capture.ts
```

Do not change the package export map unless the user asks.

---

## 13. Cohesive long file — do not split

**Friction (false):** `event-kind-map.ts` is 450 LOC of exhaustive
`switch (kind)` cases, one table, one job.

Keep:

```text
src/events/event-kind-map.ts
src/events/event-kind-map.test.ts
```

Split later only if kinds diverge into independent domains (billing events vs
auth events) with separate callers.

---

## 14. Ceremony nesting — collapse, then group

**Friction:** vague layers, no domain.

Before:

```text
src/core/common/shared/utils/helpers.ts
src/core/common/shared/utils/index.ts
```

After (only if this is the real dump):

```text
src/lib/
  dates/format-local.ts
  money/format-minor-units.ts
```

Do not replace ceremony with new ceremony (`src/platform/foundation/…`).

---

## 15. Compound UI already local — extract pieces, keep the root

Before:

```text
src/components/date-range-picker.tsx   # trigger, calendar, presets, footer
```

After:

```text
src/components/date-range-picker/
  date-range-picker.tsx     # root composition
  calendar-panel.tsx
  preset-list.tsx
  footer-actions.tsx
  types.ts
```

The public component name stays discoverable. Internals are not dumped into
`components/ui/`.

---

## Anti-pattern recap

```text
# God file
src/app.ts                      # routes, db, jobs, emails, config

# Unrelated roommates
src/lib/misc.ts

# Scattered siblings
src/users/profile.ts
src/helpers/user-profile-map.ts
src/api/users-profile-handler.ts

# Ceremony without cohesion
src/core/common/shared/utils/helpers.ts

# Layer barrels mixing every domain
src/controllers/index.ts
src/services/index.ts
src/models/index.ts

# Leftover dump after a split
src/billing/utils.ts
src/billing/shared2.ts
```
