# Setup and Core Concepts

## Why T3 Env

Parsing `process.env` with a validator and then reading `process.env` again loses transforms and defaults: types show the output type, values stay raw strings. T3 Env returns a **Proxy object** (`env`) whose values match the schema output. Server keys are `undefined` on the client; accessing them throws.

Do not replace T3 Env with a `ProcessEnv` interface merge unless the user explicitly wants that weaker pattern.

## Packages

| Package | When |
| --- | --- |
| `@t3-oss/env-core` | Any framework. Set `clientPrefix` and `runtimeEnv` yourself. |
| `@t3-oss/env-nextjs` | Next.js. Prefix `NEXT_PUBLIC_`. Strict runtime env. |
| `@t3-oss/env-nuxt` | Nuxt. Prefix `NUXT_PUBLIC_`. `runtimeEnv` is `process.env`. |

`env-nextjs` and `env-nuxt` wrap core. Keep all three on the same version when more than one is installed.

## Install

```sh
bun add @t3-oss/env-core zod
bun add @t3-oss/env-nextjs zod
bun add @t3-oss/env-nuxt zod
```

JSR (Deno):

```sh
deno add jsr:@t3-oss/env-core
deno add jsr:@t3-oss/env-nextjs
deno add jsr:@t3-oss/env-nuxt
```

Install the validator the project already uses. Peers (all optional except that **one** validator is required at runtime):

- `typescript` >= 5.0.0
- `zod` ^3.24.0 \|\| ^4.0.0
- `valibot` ^1.0.0-beta.7 \|\| ^1.0.0
- `arktype` ^2.1.0

## Module and TypeScript constraints

- ESM-only since **0.9.0**. `tsconfig` `moduleResolution` must read `package.json#exports` (`Bundler` recommended; `NodeNext` if compiling with `tsc`).
- TypeScript **5.0+**.
- File is usually `src/env.ts`. Some tools emit `env.d.ts` that collides with `env.ts` — pick another name (`env.mjs`, `src/env/index.ts`).

## Minimal core schema

```ts
import { createEnv } from "@t3-oss/env-core";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    OPEN_AI_API_KEY: z.string().min(1),
  },
  clientPrefix: "PUBLIC_",
  client: {
    PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  emptyStringAsUndefined: true,
});
```

Zod 3: use `z.string().url()` instead of `z.url()`.

Server-only: omit `client` and `clientPrefix`.

## Standard Schema validators

T3 Env accepts any Standard Schema **v1** validator. Match presets to the same library.

### Zod (docs default)

```ts
import * as z from "zod";

server: {
  DATABASE_URL: z.url(),
  PORT: z.coerce.number().default(3000),
}
```

Prefer `import * as z from "zod"` (0.13.11 tree-shaking fix for Webpack/esbuild).

### Valibot

```ts
import * as v from "valibot";

server: {
  DATABASE_URL: v.pipe(v.string(), v.url()),
  PORT: v.optional(v.pipe(v.string(), v.transform(Number)), "3000"),
}
```

### ArkType

```ts
import { type } from "arktype";

server: {
  DATABASE_URL: type("string.url"),
  PORT: type("string.numeric.parse"),
}
```

Validation must finish **synchronously**. Async parsers are rejected.

## Usage

```ts
import { env } from "~/env";

const key = env.OPEN_AI_API_KEY; // typed; throws on the client
```

Same import on server and client. Client code may only read `client` and `shared` keys.

## Schema files vs secret names

One file is the default DX. The **server schema object** still ships to the client bundle, so **key names** (not values) are visible. Split files when names are sensitive:

```ts
// env/server.ts — import only from server code
export const env = createEnv({
  server: { DATABASE_URL: z.url() },
  runtimeEnv: process.env,
});

// env/client.ts — import from client code
export const env = createEnv({
  clientPrefix: "PUBLIC_",
  client: { PUBLIC_APP_URL: z.url() },
  runtimeEnv: process.env,
});
```
