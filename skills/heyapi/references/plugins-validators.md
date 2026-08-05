# Plugins, Validators, and App Integrations

## Plugin model

Plugins generate artifacts from the parsed OpenAPI input. Core plugins:

- TypeScript types
- SDK
- Transformers
- Schemas

Other plugins reuse core artifacts instead of inventing parallel primitives. Compose only what the app needs.

String shorthand or object form:

```ts
plugins: [
  'zod',
  {
    name: '@tanstack/react-query',
    queryOptions: true,
    mutationOptions: true,
  },
]
```

Duplicate plugin entries are merged (as of v0.99); prefer a single explicit config per plugin name.

## Validators

Supported validators (shipping vs voted may change — verify docs):

- Valibot — https://heyapi.dev/docs/openapi/typescript/plugins/valibot
- Zod — https://heyapi.dev/docs/openapi/typescript/plugins/zod
- Ajv, Arktype, Joi, TypeBox, Yup — may be vote / incomplete

### Zod

```ts
plugins: [
  {
    name: 'zod',
    // use current docs for Zod 3 vs 4 / compatibilityVersion
  },
  {
    name: '@hey-api/sdk',
    validator: true,
    // transformer: true,
  },
]
```

Typical usage after generation:

```ts
import { createOrder, zOrder } from './trading-client';

const { data, error } = await createOrder({ body: { /* ... */ } });
if (error) return;
const order = zOrder.parse(data);
```

Notes:

- Prefer Zod plugin docs for `compatibilityVersion`, `types.infer`, and request/response schema export shape.
- Since ~v0.95, Valibot/Zod may export request layers separately instead of a single composite `Data` schema. Restore composites with `requests.shouldExtract: true` when needed.
- Re-export schemas from the entry file with `includeInEntry: true` (or a predicate) on the Zod plugin.

### Valibot

```ts
plugins: [
  'valibot',
  {
    name: '@hey-api/sdk',
    validator: true,
    transformer: true,
  },
]
```

## TanStack Query v5

Framework plugins:

- `@tanstack/react-query`
- `@tanstack/vue-query`
- `@tanstack/svelte-query`
- `@tanstack/solid-query`
- `@tanstack/preact-query`
- `@tanstack/angular-query-experimental`

```ts
plugins: [
  '@hey-api/sdk',
  {
    name: '@tanstack/react-query',
    queryOptions: true,
    mutationOptions: true,
    queryKeys: true, // optional dedicated key helpers / tags
  },
]
```

### Queries

Generated helpers follow SDK names and append `Options` by default:

```ts
import { useQuery } from '@tanstack/react-query';
import { getPetByIdOptions } from './client/react-query.gen';

const query = useQuery({
  ...getPetByIdOptions({
    path: { petId: 1 },
  }),
});
```

Query keys normalize SDK params plus metadata (`_id`, `baseUrl`, …). Read `queryKey` from options results, or call `getPetByIdQueryKey(...)` when key helpers are enabled. Set `queryKeys.tags: true` to embed operation tags for broader invalidation.

### Mutations

```ts
import { useMutation } from '@tanstack/react-query';
import { createOrderMutation } from './client/react-query.gen';

const { mutate, isPending } = useMutation({
  ...createOrderMutation(),
});

mutate({
  body: {
    symbol: 'AAPL',
    side: 'buy',
    type: 'limit',
    quantity: 10,
    price: 189.5,
  },
});
```

Customize naming/casing via plugin `.name` / `.case` options. Attach `meta` with a function on `queryOptions.meta`.

Older option names (`queryOptionsNameBuilder`, etc.) were renamed around v0.75 — use current option names when editing configs.

## Web framework plugins

For spec-first server validation / stubs, see https://heyapi.dev/docs/openapi/typescript/web-frameworks.

Documented framework plugins include Angular, Fastify, Nest, and oRPC. Others (Elysia, Express, Hono, Koa, TanStack Start, Adonis) may be vote-only — confirm before depending on them.

## Custom plugins and clients

Build with the same APIs as built-ins:

- Custom plugin guide: https://heyapi.dev/docs/openapi/typescript/plugins/custom
- Custom client guide: https://heyapi.dev/docs/openapi/typescript/clients/custom

Custom plugin authors: track Migrating for `plugin.imports` (formerly `symbols`), removed `external()` / `registerSymbol()`, and Imports API changes in recent 0.9x releases.
