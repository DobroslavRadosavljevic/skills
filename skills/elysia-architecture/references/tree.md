# Canonical trees (Elysia)

App root may be `src/` (single app) or `apps/<api>/src/` (monorepo). Paths below are relative to that `src/`.

## Feature module

```text
modules/<feature>/
  routes/
    index.ts                 # mount table only (.use + optional prefix)
    <action>.ts              # one Elysia plugin; one verb or tight group
  schema/
    body.ts                  # request bodies (optional split files OK)
    response.ts              # response shapes
    query.ts                 # optional
    params.ts                # optional
  services/                  # or domain/ if not using a services naming
    <name>.ts                # domain logic (no HTTP)
    <name>.service.ts        # same role; use .service.ts when Effect overlay applies
  utils/                     # rare; pure domain helpers only — never HTTP mappers
```

Optional at feature root:

```text
  live.ts                    # compose multi-service wiring (Effect overlay)
  index.ts                   # public re-exports for other modules / app runtime only when needed
```

## App entry wiring

```text
src/
  main.ts                    # create Elysia app; .use(featureRoutes) …
  modules/
    billing/
    users/
    health/
```

Parent features may remount children:

```text
modules/billing/routes/index.ts   # .use(creditsRoutes) with prefix
modules/credits/routes/…
```

## Route file shape (conceptual)

```ts
export const featureActionRoute = new Elysia({ name: "FEATURE_ACTION_ROUTE" })
  // .use(authPlugin) / guards as needed
  .post("/…", async ({ body, status }) => {
    // thin: call domain, map outcomes to status(...)
  }, {
    body: BodySchema,
    response: { 200: OkSchema, 400: ErrorSchema },
  });
```

## Naming

| Kind | Pattern | Examples |
| --- | --- | --- |
| Feature folder | kebab or short noun | `api-keys`, `billing`, `users` |
| Route file | verb or aspect | `create.ts`, `search.ts`, `status.ts`, `webhooks.ts` |
| Plugin `name` | stable SCREAMING_SNAKE | `BILLING_STATUS_ROUTE` |
| Schema files | role | `body.ts`, `response.ts` |
| Domain module | noun or verb | `checkout.ts`, `ledger.ts` |

Path context replaces filename prefixes: under `modules/billing/routes/`, use `status.ts` not `billing-status-route.ts`.

## Tests (when Vitest is used)

Prefer package-level `tests/` (not colocated under `routes/`):

```text
tests/
  unit/**/*.test.ts
  integration/**/*.test.ts
```

Name tests by aspect (`status.test.ts`), not by repeating the whole package name.
