# createEnv Options and Presets

## Option map

| Option | Default | Role |
| --- | --- | --- |
| `server` | `{}` | Secrets. Undefined on the client; access throws. |
| `client` | `{}` | Browser-safe keys. Must start with `clientPrefix`. |
| `clientPrefix` | required in core when `client` is set; Next `NEXT_PUBLIC_`; Nuxt `NUXT_PUBLIC_` | Type-level and runtime prefix. |
| `shared` | `{}` | Available on server and client **without** the prefix (`NODE_ENV`, `VERCEL_URL` if not using the Vercel preset, …). |
| `runtimeEnv` | core: optional; Next: strict listing; Nuxt: filled | Object that holds values (`process.env` / `import.meta.env`). |
| `runtimeEnvStrict` | — | Core-only. Same as `runtimeEnv` but every schema key must be listed. Mutually exclusive with `runtimeEnv`. |
| `experimental__runtimeEnv` | — | Next >= 13.4.4. Client + shared keys only. Mutually exclusive with `runtimeEnv`. |
| `emptyStringAsUndefined` | `false` | Delete `""` keys before parse so defaults and number/url schemas work. **Recommend `true` on new projects.** |
| `skipValidation` | `false` | Return raw runtime env (and skip presets as of 0.13.9). Types still claim the schema. Lint/Docker image build only. |
| `isServer` | `typeof window === "undefined" \|\| "Deno" in window` | Override for unusual runtimes (Deno counts as server). |
| `onValidationError` | log issues, throw `"Invalid environment variables"` | Must not return. Receives `readonly StandardSchemaV1.Issue[]` (not `ZodError`) since 0.12. |
| `onInvalidAccess` | throw server-on-client error | Must not return. Argument is the variable name. |
| `extends` | `[]` | Other `createEnv` results or official presets. Call preset factories: `vercel()`. |
| `createFinalSchema` | dictionary parse | `(shape, isServer) =>` a Standard Schema for cross-field refine/transform. **0.13+**. |

Import `StandardSchemaV1` from `@t3-oss/env-core` when typing custom error handlers.

## `emptyStringAsUndefined`

Walks the **runtime object** and `delete`s keys whose value is `""`. Passing `process.env` therefore mutates `process.env`. That is usually acceptable; do not pass a shared object that must keep empty strings.

## `skipValidation`

```ts
skipValidation: !!process.env.SKIP_ENV_VALIDATION,
```

Use for:

- Lint / typecheck without a full `.env`
- Docker **image build** when server secrets are injected only at **container run**

Do not skip in production runtime. Client keys still need real values at **build** because bundlers inline them.

## `isServer`

Override when `window` exists on the server (or is missing on the client). Default already treats Deno as server.

## Error handlers

```ts
import { createEnv, type StandardSchemaV1 } from "@t3-oss/env-core";

onValidationError: (issues: readonly StandardSchemaV1.Issue[]) => {
  console.error("❌ Invalid environment variables:", issues);
  throw new Error("Invalid environment variables");
},
onInvalidAccess: (variable: string) => {
  throw new Error(
    `❌ Attempted to access a server-side environment variable on the client: ${variable}`,
  );
},
```

Both callbacks are typed to return `never` — they must throw (or otherwise not return).

## `createFinalSchema`

Use for cross-field rules (auth required unless `SKIP_AUTH`, etc.). The callback receives the combined shape and `isServer`. Skip server-only rules on the client.

```ts
createFinalSchema: (shape, isServer) =>
  z.object(shape).transform((env, ctx) => {
    if (env.SKIP_AUTH || !isServer) return { SKIP_AUTH: true as const };
    if (!env.EMAIL || !env.PASSWORD) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "EMAIL and PASSWORD are required if SKIP_AUTH is false",
      });
      return z.NEVER;
    }
    return { EMAIL: env.EMAIL, PASSWORD: env.PASSWORD };
  }),
```

## Preset entrypoints

| Import | Validator |
| --- | --- |
| `@t3-oss/env-core/presets-zod` | Zod |
| `@t3-oss/env-core/presets-valibot` | Valibot |
| `@t3-oss/env-core/presets-arktype` | ArkType |
| `@t3-oss/env-nextjs/presets-zod` (and valibot/arktype) | Same presets, Next package |
| `@t3-oss/env-nuxt/presets-zod` (and valibot/arktype) | Same presets, Nuxt package |

Removed: `@t3-oss/env-core/presets` (pre-0.12 Zod-only path).

Import presets from the **same package** as `createEnv`.

```ts
import { createEnv } from "@t3-oss/env-nextjs";
import { vercel, uploadthing } from "@t3-oss/env-nextjs/presets-zod";

export const env = createEnv({
  server: { AUTH_SECRET: z.string().min(32) },
  experimental__runtimeEnv: {},
  extends: [vercel(), uploadthing()],
});

env.VERCEL_URL; // string | undefined
```

## Official presets

All factories: `vercel()`, `neonVercel()`, … Export name for Fly is **`fly`**, not `fly.io`.

| Export | Required-ish keys (others optional unless noted) |
| --- | --- |
| `vercel` | System vars optional: `VERCEL_ENV`, `VERCEL_URL`, `VERCEL_TARGET_ENV`, git metadata, … |
| `neonVercel` | `DATABASE_URL` required; Neon/Postgres URLs optional |
| `supabaseVercel` | `POSTGRES_URL` required; `SUPABASE_*` / `NEXT_PUBLIC_SUPABASE_*` optional |
| `uploadthing` | `UPLOADTHING_TOKEN` required (current UploadThing) |
| `uploadthingV6` | Legacy UploadThing v6; same token shape in current source |
| `render` | Render runtime vars optional |
| `railway` | Railway runtime vars optional |
| `fly` | Fly machine vars optional |
| `netlify` | Netlify / `CONTEXT` / deploy URLs optional |
| `upstashRedis` | `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` required |
| `coolify` | Coolify vars optional (`PORT`, `HOST`, …) |
| `vite` | `BASE_URL`, `MODE`, `DEV`, `PROD`, `SSR` |
| `wxt` | WXT extension `MANIFEST_VERSION`, `BROWSER`, … |

Do not re-declare a required preset key in `server` unless replacing it. `extends` merges preset objects onto the parsed env.

## Custom / monorepo presets

A preset is any `createEnv` result:

```ts
// packages/auth/env.ts
export const env = createEnv({ /* auth secrets */ runtimeEnv: process.env });

// apps/web/env.ts
import { env as authEnv } from "@repo/auth/env";

export const env = createEnv({
  // app keys...
  extends: [authEnv],
});
```
