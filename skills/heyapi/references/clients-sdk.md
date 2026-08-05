# Clients and SDK

## HTTP clients

Native clients:

| Plugin | Notes |
| --- | --- |
| `@hey-api/client-fetch` | Default. Uses `baseUrl`. |
| `@hey-api/client-axios` | Uses Axios-style `baseURL`. |
| `@hey-api/client-ky` | Ky options may go under `kyOptions`. |
| `@hey-api/client-next` | Next.js client |
| `@hey-api/client-nuxt` | Nuxt client |
| `@hey-api/client-ofetch` | OFetch client |
| `@hey-api/client-angular` | Angular client |

Effect and Got clients may appear as voted / not generally available — check current docs before selecting them.

Config:

```ts
export default {
  input: './openapi.json',
  output: 'src/client',
  plugins: ['@hey-api/client-fetch', '@hey-api/sdk'],
};
```

CLI client flag:

```sh
bunx @hey-api/openapi-ts -i ./openapi.json -o src/client -c @hey-api/client-fetch
```

## Configuring the client

Generated `client.gen.ts` exports a shared `client`. Prefer configuring it at app bootstrap.

### `setConfig`

Fetch example:

```ts
import { client } from './client/client.gen';

client.setConfig({
  baseUrl: 'https://api.example.com',
  auth: () => getAccessToken(),
});
```

Auth can also be set via request hooks / headers:

```ts
client.setConfig({
  onRequest: ({ options }) => {
    options.headers.set('Authorization', `Bearer ${getAccessToken()}`);
  },
});
```

Axios uses `baseURL` instead of `baseUrl`. Always match the active client docs.

### Runtime config path

Avoid race conditions where code runs before `setConfig` by pointing the client plugin at a local runtime module:

```ts
plugins: [
  {
    name: '@hey-api/client-fetch',
    runtimeConfigPath: './src/hey-api.ts',
  },
],
```

```ts
// src/hey-api.ts
import type { CreateClientConfig } from './client/client.gen';

export const createClientConfig: CreateClientConfig = (config) => ({
  ...config,
  baseUrl: 'https://api.example.com',
});
```

Since v0.97, `runtimeConfigPath` resolves relative to the **output** folder.

### Custom instance

```ts
import { createClient } from './client/client';
import { getFoo } from './client';

const myClient = createClient({
  baseUrl: 'https://other.example.com',
});

await getFoo({ client: myClient });
```

Per-call overrides also accept client config fields such as `baseUrl`.

## Interceptors

Clients expose `client.interceptors.request` / `.response` (and error interceptors where supported):

- `use(fn)` — register, returns id
- `eject(idOrFn)` — remove
- `update(idOrFn, fn)` — replace

Request interceptor must return the request; response interceptor must return the response. Since v0.97, error interceptors receive the previous interceptor's result when chained.

## `throwOnError`

Configure on the **client** plugin, not `@hey-api/sdk`:

```ts
plugins: [
  {
    name: '@hey-api/client-fetch',
    throwOnError: true,
  },
  '@hey-api/sdk',
],
```

Default ergonomics without throwing:

```ts
const { data, error } = await createOrder({
  body: {
    symbol: 'AAPL',
    side: 'buy',
    type: 'limit',
    quantity: 10,
    price: 189.5,
  },
});

if (error) {
  // handle
  return;
}

// use data
```

Returned `request` / `response` objects may be typed optional even when present at runtime.

## SDK plugin

`@hey-api/sdk` is enabled by default with TypeScript types.

### Flat functions (default)

Tree-shakeable. `operations.strategy: 'flat'`.

```ts
import { addPet } from './client';

await addPet({
  body: { name: 'Fluffy', type: 'cat' },
  path: { petId: 1234 },
  query: { color: 'red' },
});
```

Parameters are namespaced: `body`, `path`, `query`, `header`.

### Class instance

```ts
plugins: [
  {
    name: '@hey-api/sdk',
    operations: {
      strategy: 'single',
      containerName: 'PetStore',
    },
  },
],
```

Use `operations.nesting` (presets or a custom function) to reshape method paths. Prefer flat unless the project already standardized on classes.

### Validators and transformers

Runtime validation is off by default (cost). Enable via SDK plugin:

```ts
plugins: [
  'zod',
  {
    name: '@hey-api/sdk',
    validator: 'zod', // or true when zod plugin is present
    transformer: true, // optional response/request transforms
  },
],
```

Same pattern works with `valibot`. Setting `validator: 'zod'` can auto-add the Zod plugin with defaults.

## Consumption rules

- Import from specific generated files (`sdk.gen.ts`, `types.gen.ts`, `zod.gen.ts`, `react-query.gen.ts`) when entry re-exports are ambiguous.
- Pass `client` into SDK calls for multi-tenant or test doubles.
- Do not duplicate generated operation types by hand; regenerate when the spec changes.
- Keep auth token providers sync or async as the client plugin documents; prefer a single bootstrap site for `setConfig` / `createClientConfig`.
