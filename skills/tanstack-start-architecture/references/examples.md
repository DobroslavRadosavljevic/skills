# Examples (TanStack Start layout)

Anonymized good and bad trees. Not tied to any product.

## Good — dashboard shell + pages

```text
routes/
  __root.tsx
  _app/
    route.tsx
    -components/shell.tsx
    -components/sidebar.tsx
    -hooks/use-app-nav.ts
    index.tsx
    billing/
      index.tsx
      -components/billing-page.tsx
      -hooks/use-billing-summary.ts
      credits/
        index.tsx
        -components/credits-page.tsx
```

## Good — promoted module after reuse

```text
modules/billing/
  hooks/use-checkout.ts
  schema/checkout-form.ts
routes/_app/billing/
  index.tsx
  -components/billing-page.tsx          # page-only composition
routes/_app/billing/credits/
  index.tsx
  -components/credits-page.tsx          # imports use-checkout from modules
```

## Bad — flat page leaf + leaked route

```text
routes/
  billing.tsx                 # flat leaf
  billing.helpers.ts          # becomes a route accidentally
```

Fix: `billing/index.tsx` + `billing/-lib/helpers.ts`.

## Bad — premature modules

```text
modules/billing/
  components/…                # only used by one page
  hooks/…
  index.ts                    # fat barrel
routes/billing/index.tsx      # thin re-export only
```

Keep page UI under `routes/billing/-components` until a second consumer appears.

## Bad — modules import routes

```ts
// modules/billing/hooks/use-shell.ts
import { Shell } from "@/routes/_app/-components/shell";
```

Move `Shell` to `src/components/` or keep the hook under the route tree.

## Bad — duplicate trees

```text
src/features/billing/…
src/modules/billing/…
src/views/billing/…
```

Pick `routes` + `modules` + `components` + `lib` and migrate.
