# Setup and Configuration

## Install

Requires Node.js 22+ (22.13+ for recent releases). Package is ESM-only.

```sh
bun add @hey-api/openapi-ts -D
```

Pin an exact version. With npm/pnpm/yarn, use `-D -E`.

Optional Vite integration (Vite 5–8):

```sh
bun add @hey-api/vite-plugin -D
```

## Quick generate

```sh
bunx @hey-api/openapi-ts -i ./openapi.json -o src/client
```

Registry shorthand example:

```sh
bunx @hey-api/openapi-ts -i hey-api/backend -o src/client
```

Add a package script once config exists:

```json
{
  "scripts": {
    "openapi-ts": "openapi-ts"
  }
}
```

## Config file

Prefer `openapi-ts.config.ts` at the project root (jiti/c12 loader also accepts `.js`, `.mjs`, `.cjs`).

```ts
import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: './openapi.json',
  output: 'src/client',
  plugins: ['@hey-api/sdk', 'zod', '@tanstack/react-query'],
});
```

Defaults without an explicit plugin list generate TypeScript interfaces and an SDK (Fetch client).

### Programmatic API

```ts
import { createClient } from '@hey-api/openapi-ts';

await createClient({
  input: './openapi.json',
  output: 'src/client',
});
```

### Vite plugin

```ts
import { heyApiPlugin } from '@hey-api/vite-plugin';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    heyApiPlugin({
      config: {
        input: './openapi.json',
        output: 'src/client',
      },
    }),
  ],
});
```

## Input

`input` may be:

| Form | Example |
| --- | --- |
| Local path | `'./openapi.json'` / `'./openapi.yaml'` |
| URL | `'https://api.example.com/openapi.json'` |
| Hey API registry | `'hey-api/backend'` |
| Scalar registry | `'scalar:@scalar/access-service'` |
| ReadMe registry | `'readme:nysezql0wwo236'` |
| Object | `{ path: '...', branch: 'main', watch: true, fetch: { headers: {...} } }` |
| Inline spec | `{ openapi: '3.1.1', info: {...}, paths: {...} }` |

All valid OpenAPI versions and common file formats are supported.

Protected remote specs:

```ts
export default defineConfig({
  input: {
    path: 'https://secret.example/openapi.json',
    fetch: {
      headers: {
        Authorization: 'Bearer xxx',
      },
    },
  },
  output: 'src/client',
});
```

Self-signed HTTPS in development may need `NODE_TLS_REJECT_UNAUTHORIZED=0`.

### Watch

Watch supports remote URL inputs. Config: `input: { path: '...', watch: true }`. CLI: `-w` / `--watch`.

## Output

```ts
export default defineConfig({
  input: './openapi.json',
  output: {
    path: 'src/client',
    entryFile: false, // optional: skip index.ts re-exports
  },
});
```

Treat the output directory as generated. Do not hand-edit it.

## Multi-job configs

Array of jobs:

```ts
export default [
  { input: 'foo.yaml', output: 'src/foo' },
  { input: 'bar.yaml', output: 'src/bar' },
];
```

Job matrix (matching-length arrays):

```ts
export default defineConfig({
  input: ['foo.yaml', 'bar.yaml'],
  output: ['src/foo', 'src/bar'],
});
```

Merge multiple inputs into one output:

```ts
export default defineConfig({
  input: ['foo.yaml', 'bar.yaml'],
  output: 'src/client',
});
```

## Plugins checklist

When composing `plugins`, decide:

1. HTTP client — default Fetch, or Axios / Ky / Next / Nuxt / OFetch / Angular
2. SDK shape — flat tree-shakeable functions (default) vs class instance
3. Validators — Zod or Valibot (and whether SDK `validator` / `transformer` is enabled)
4. App integrations — TanStack Query framework package, Fastify/Nest/Angular framework plugins
5. Entry re-exports — `includeInEntry` on plugins that should appear in `index.ts`
