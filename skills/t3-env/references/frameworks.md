# Framework Packages

## Next.js (`@t3-oss/env-nextjs`)

Baked in: `clientPrefix: "NEXT_PUBLIC_"`. Client keys that omit the prefix are a type error.

Unlike core, **`runtimeEnv` is strict**: every `server`, `client`, and `shared` key must appear. Next only inlines env keys that are accessed as `process.env.NAME`.

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    OPEN_AI_API_KEY: z.string().min(1),
  },
  client: {
    NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  },
  shared: {
    NODE_ENV: z.enum(["development", "production", "test"]),
  },
  // Next.js < 13.4.4: list every key
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
    NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

### Next.js >= 13.4.4 — `experimental__runtimeEnv`

Server `process.env` is no longer statically analyzed the same way. Destructure **client + shared** only. Do not pass both `runtimeEnv` and `experimental__runtimeEnv`.

```ts
export const env = createEnv({
  server: { DATABASE_URL: z.url() },
  client: { NEXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1) },
  shared: { NODE_ENV: z.enum(["development", "production", "test"]) },
  experimental__runtimeEnv: {
    NEXT_PUBLIC_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_PUBLISHABLE_KEY,
    NODE_ENV: process.env.NODE_ENV,
  },
});
```

Server-only schema on Next >= 13.4.4 may use `experimental__runtimeEnv: process.env`.

### Validate on Next build

Import the env module from `next.config` so missing vars fail the build.

**Next 16+** (`next.config.ts` can import TypeScript):

```ts
import "./src/env";

const nextConfig = { /* ... */ };
export default nextConfig;
```

**Next < 16** — use [jiti](https://github.com/unjs/jiti):

```js
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url);
await jiti.import("./src/env");

export default { /* ... */ };
```

### `output: "standalone"`

```ts
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@t3-oss/env-nextjs", "@t3-oss/env-core"],
};
```

## Nuxt (`@t3-oss/env-nuxt`)

Baked in: `clientPrefix: "NUXT_PUBLIC_"` and `runtimeEnv: process.env`. Do not pass `runtimeEnv` / `clientPrefix`.

```ts
import { createEnv } from "@t3-oss/env-nuxt";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
    OPEN_AI_API_KEY: z.string().min(1),
  },
  client: {
    NUXT_PUBLIC_PUBLISHABLE_KEY: z.string().min(1),
  },
});
```

Official split-file samples sometimes show `PUBLIC_*` client keys. Those fail the Nuxt prefix. Use `NUXT_PUBLIC_*`.

Build-time check:

```ts
import "./env";

export default defineNuxtConfig({
  // ...
});
```

## Core: Vite, Astro, TanStack Start, Node

Use `@t3-oss/env-core`. Set prefix from the framework:

| Framework | Typical `clientPrefix` | Typical `runtimeEnv` |
| --- | --- | --- |
| Vite / TanStack Start | `VITE_` | `import.meta.env` |
| Astro | `PUBLIC_` | `import.meta.env` or `process.env` |
| Node / Bun / workers | omit client | `process.env` |

```ts
import { createEnv } from "@t3-oss/env-core";
import { vite } from "@t3-oss/env-core/presets-zod";
import * as z from "zod";

export const env = createEnv({
  server: {
    DATABASE_URL: z.url(),
  },
  clientPrefix: "VITE_",
  client: {
    VITE_APP_URL: z.url(),
  },
  runtimeEnv: import.meta.env,
  emptyStringAsUndefined: true,
  extends: [vite()],
});
```

`vite()` types `BASE_URL`, `MODE`, `DEV`, `PROD`, `SSR`.

### `runtimeEnv` vs `runtimeEnvStrict` (core only)

Pass **exactly one**.

- `runtimeEnv`: pass the whole object (`process.env`, `import.meta.env`). Fine when the bundler keeps unused keys.
- `runtimeEnvStrict`: must list every schema key. Use when the bundler tree-shakes unused `process.env.X` / `import.meta.env.X` accesses.

```ts
runtimeEnvStrict: {
  DATABASE_URL: process.env.DATABASE_URL,
  OPEN_AI_API_KEY: process.env.OPEN_AI_API_KEY,
  PUBLIC_PUBLISHABLE_KEY: process.env.PUBLIC_PUBLISHABLE_KEY,
},
```

### Vite build-time validation

Vite does **not** load `.env` into `import.meta.env` inside `vite.config`. Importing `./src/env` from the config with `runtimeEnv: import.meta.env` sees an empty object.

Load env first, then import the schema. `loadEnv(mode, cwd, "")` (third arg `""`) includes unprefixed server vars; `"VITE_"` loads only public keys.

If `import.meta.env` is readonly, pass `loadEnv(...)` into a factory that sets `runtimeEnv` / `runtimeEnvStrict`.

App code (not the Vite config) can keep `runtimeEnv: import.meta.env`.
