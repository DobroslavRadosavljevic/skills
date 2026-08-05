# Examples (Elysia layout)

Anonymized good and bad trees. Not tied to any product.

## Good — billing feature

```text
modules/billing/
  routes/
    index.ts          # .use(statusRoute).use(checkoutRoute).use(portalRoute)
    status.ts
    checkout.ts
    portal.ts
    webhooks.ts
  schema/
    body.ts
    response.ts
  services/
    checkout.ts
    catalog.ts
```

`routes/index.ts` only mounts. `checkout.ts` route calls `services/checkout.ts` and maps errors to `status(…)`.

## Good — nested mount

```text
modules/billing/routes/index.ts   # .use(creditsRoutes, { prefix: "/credits" })
modules/credits/
  routes/
    index.ts
    balance.ts
    ledger.ts
  schema/
    response.ts
  services/
    balance.ts
```

## Bad — layer cake at app root

```text
src/
  controllers/billingController.ts
  services/billingService.ts
  dto/billingDto.ts
  routes.ts                 # registers everything
```

Prefer feature modules instead.

## Bad — mega route file

```text
modules/users/routes.ts     # list, get, update, delete, permissions, avatar…
```

Split into `routes/<action>.ts` + `routes/index.ts`.

## Bad — HTTP utils

```text
modules/billing/utils/makeBillingRoute.ts
modules/billing/utils/mapBillingErrorToHttp.ts
```

Inline mapping in each route (or a global error plugin if universal).

## Bad — duplicated contracts

```ts
// routes/status.ts
interface StatusResponse { plan: string }  // hand-written
// plus separate Elysia t.Object / schema unused for typing
```

One schema under `schema/response.ts`, used as the route `response` contract.
