# Recipes and Pitfalls

Env values are **strings** (or missing). Start from a string schema, then transform or coerce.

## Booleans

**Do not** use `z.coerce.boolean()`. In Zod, any non-empty string becomes `true`, including `"false"` and `"0"`.

Zod 4: `z.stringbool()` is the documented coercion helper.

Otherwise be explicit:

```ts
server: {
  COERCED_BOOLEAN: z
    .string()
    .transform((s) => s !== "false" && s !== "0"),

  ONLY_BOOLEAN: z
    .string()
    .refine((s) => s === "true" || s === "false")
    .transform((s) => s === "true"),
},
```

## Numbers

```ts
server: {
  SOME_NUMBER: z
    .string()
    .transform((s) => parseInt(s, 10))
    .pipe(z.number()),

  ZOD_NUMBER_COERCION: z.coerce.number(),
},
```

`z.coerce.number()` is acceptable for numbers. Pair with `emptyStringAsUndefined: true` so `PORT=` becomes `undefined` and can hit `.default()`.

## Defaults and optionals

```ts
PORT: z.coerce.number().default(3000),
SENTRY_DSN: z.url().optional(),
```

Without `emptyStringAsUndefined`, `DOMAIN=` is `""` and `.default()` never runs.

## Storybook

Storybook’s bundler does not walk `runtimeEnv`. Merge the **client** env object into Storybook `env`:

```ts
// .storybook/main.ts
import { env as t3Env } from "~/env/client";

const config = {
  env: (config) => ({
    ...config,
    ...t3Env,
  }),
};
```

Use the client schema file, not the server one.

## Docker and CI

- **Client** vars are inlined at **build**. Provide them as build args / `.env` during `docker build`.
- **Server** vars should be injected at **container run**. Use `skipValidation` (for example `SKIP_ENV_VALIDATION=true`) only on the image-build step that lacks those secrets.
- Turborepo `--env-mode` defaults to strict: undeclared env is stripped. List keys in `turbo.json` `env` / `globalEnv`, or use `--env-mode=loose` only when that is the project policy.

## Next.js client vs server

```ts
// OK on a Client Component
env.NEXT_PUBLIC_APP_URL;

// Throws at runtime on the client
env.DATABASE_URL;
```

Do not pass server env into client components as props if that would leak secrets. Fetch from a Route Handler / server function instead.

## Prefix mistakes

| Package | Required client prefix |
| --- | --- |
| `@t3-oss/env-nextjs` | `NEXT_PUBLIC_` |
| `@t3-oss/env-nuxt` | `NUXT_PUBLIC_` |
| Vite via core | `VITE_` |
| Astro via core | `PUBLIC_` |

`VITE_PUBLIC_API_URL` is invalid when `clientPrefix` is `PUBLIC_`. The prefix is the **start** of the key, not a substring.

## `runtimeEnv` holes (Next / strict)

Missing a key in `runtimeEnv` / `runtimeEnvStrict` is a **type error**. If a var is `undefined` at runtime, the schema still fails unless `.optional()` / `.default()`.

For Next >= 13.4.4, omitting a **client or shared** key from `experimental__runtimeEnv` means Next may tree-shake it out of the client bundle even if the schema lists it.

## Importing env from Vite config

`import.meta.env` is empty in `vite.config` until `loadEnv` runs. See [frameworks.md](frameworks.md). App modules can keep `runtimeEnv: import.meta.env`.

## ESM / resolution errors

`ERR_REQUIRE_ESM`, empty exports, or “does not provide an export named `createEnv`”: set `moduleResolution` to `Bundler` or `NodeNext`. Do not add a CJS wrapper; the package is ESM-only.

## Zod 3 vs 4 in examples

Official docs mix `z.url()` (Zod 4) and `z.string().url()` (Zod 3/4). Match the installed Zod major. Peer range starts at **3.24**.

## `onValidationError` after 0.12

Handlers receive `StandardSchemaV1.Issue[]`, not `ZodError`. Do not call `.flatten()` on the argument.

## Preset import and call shape

```ts
// 0.12+
import { vercel } from "@t3-oss/env-core/presets-zod";
extends: [vercel()];

// Removed
import { vercel } from "@t3-oss/env-core/presets";
extends: [vercel];
```

## Do not

- Read `process.env.SECRET` after defining `env` (transforms/defaults will not apply).
- Put secrets in `client` or `shared`.
- Use `z.coerce.boolean()` for flags.
- Skip validation in production runtime.
- Stack `@t3-oss/env-nextjs` on a Vite app, or core-with-`NEXT_PUBLIC_` when the Next package already enforces the prefix.
- Expect `env` assignment to stick; treat it as read-only.
- Ship canary (`0.13.4-canary.*`) unless the repo already pins it.
