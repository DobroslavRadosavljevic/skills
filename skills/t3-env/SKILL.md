---
name: t3-env
description: "Build, review, debug, configure, migrate, or plan type-safe environment variables with T3 Env (@t3-oss/env-core, @t3-oss/env-nextjs, @t3-oss/env-nuxt) and current docs. Use for t3-env, createEnv, runtimeEnv, runtimeEnvStrict, experimental__runtimeEnv, clientPrefix, NEXT_PUBLIC_, NUXT_PUBLIC_, VITE_, PUBLIC_, emptyStringAsUndefined, skipValidation, onValidationError, onInvalidAccess, isServer, shared, extends, createFinalSchema, Standard Schema, Zod, Valibot, ArkType, presets-zod, presets-valibot, presets-arktype, vercel, railway, netlify, fly, render, coolify, vite, wxt, neonVercel, supabaseVercel, uploadthing, upstashRedis, and Next.js or Vite env validation."
---

# T3 Env

Use this skill for **T3 Env** type-safe env validation: `createEnv`, server/client split, Standard Schema validators, platform presets, and framework packages. Snapshot **0.13.11** (2026-03-22). Docs: [env.t3.gg](https://env.t3.gg/docs/introduction).

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `@t3-oss/env-core`, `@t3-oss/env-nextjs`, `@t3-oss/env-nuxt` (keep them on the same **0.13.x** line).
   - Validator: Zod (`^3.24 || ^4`), Valibot (`^1`), ArkType (`^2`), or another Standard Schema v1 library.
   - Schema file(s): `src/env.ts` vs split `env/server.ts` + `env/client.ts`.
   - Runtime source: `process.env` vs `import.meta.env`; `runtimeEnv` vs `runtimeEnvStrict` vs Next `experimental__runtimeEnv`.
   - Client prefix: `NEXT_PUBLIC_`, `NUXT_PUBLIC_`, `VITE_`, `PUBLIC_`, or custom.
   - Options in use: `emptyStringAsUndefined`, `skipValidation`, `shared`, `extends`, `createFinalSchema`.
2. Refresh docs when versions drift or work touches presets, Next runtime env, or Standard Schema. Start from [source-map.md](references/source-map.md).
3. Route deeper detail:
   - Install, packages, ESM, validators: [setup-core.md](references/setup-core.md)
   - Next.js, Nuxt, Vite/Astro/core: [frameworks.md](references/frameworks.md)
   - `createEnv` options and presets: [options-presets.md](references/options-presets.md)
   - Coercion recipes, Docker, Storybook, traps: [recipes-pitfalls.md](references/recipes-pitfalls.md)
4. Import and use the `env` object everywhere. Do not read `process.env.X` after the schema exists (transforms and defaults would lie).
5. Prefer **`bun` / `bunx`** in command examples.

## Package Decision Tree

```
Next.js?
  → @t3-oss/env-nextjs (clientPrefix NEXT_PUBLIC_ is baked in)
     Next >= 13.4.4 → experimental__runtimeEnv { client + shared only }
     Next < 13.4.4  → runtimeEnv { every server + client + shared key }

Nuxt?
  → @t3-oss/env-nuxt (clientPrefix NUXT_PUBLIC_; runtimeEnv filled from process.env)

Anything else (Vite, Astro, TanStack Start, Node, Bun, …)?
  → @t3-oss/env-core
     Set clientPrefix to the framework public prefix (VITE_, PUBLIC_, …)
     runtimeEnv: process.env or import.meta.env
     Use runtimeEnvStrict when the bundler tree-shakes unused env keys
```

## Core Judgment

- Treat `env` as the runtime contract. Import it; do not augment `process.env` types and keep using `process.env`.
- Put secrets in `server`. Put browser-exposed keys in `client` with the required prefix (type-checked and runtime-checked). Put unprefixed both-sides keys (`NODE_ENV`) in `shared`.
- Default to **one schema file**. Split server/client files only when leaking **server variable names** in the client bundle is unacceptable.
- Set **`emptyStringAsUndefined: true`** on new schemas so `PORT=` and `DOMAIN=` do not skip defaults or fail number/url checks.
- Use **`skipValidation` only** for lint, Docker image builds, or similar stages that lack real env. It desyncs types from runtime values; it also skips extended presets (0.13.9+).
- Match preset imports to the validator: `presets-zod`, `presets-valibot`, or `presets-arktype`. Do not import the removed `/presets` path. Call presets as functions: `extends: [vercel()]`.
- Validation is **synchronous**. Do not use async Standard Schema validators.
- Do not use `z.coerce.boolean()` for env flags (every non-empty string is `true`). Prefer `z.stringbool()` on Zod 4, or an explicit string transform. See [recipes-pitfalls.md](references/recipes-pitfalls.md).
- Client access to a server key throws via `onInvalidAccess`. That is intended.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls @t3-oss/env-core` (and `env-nextjs` / `env-nuxt`) — same **0.13.x**.
- Typecheck: missing `runtimeEnv` keys, wrong client prefix, and `env.UNKNOWN` all fail at compile time.
- Import the env module from the framework config so **build** fails on invalid/missing vars (Next `next.config`, Nuxt `nuxt.config`, Vite `vite.config` with `loadEnv` if needed).
- Server smoke: `env.SECRET` works. Client smoke: `env.NEXT_PUBLIC_*` (or equivalent) works; accessing a server key throws.
- Empty-string defaults: `VAR=` with `emptyStringAsUndefined: true` applies `.default()`.
- Docker/CI: client vars present at **build**; server vars present at **run**; `skipValidation` only on the image-build step that lacks secrets.
- Standalone Next: `transpilePackages` includes `@t3-oss/env-nextjs` and `@t3-oss/env-core`.

Report which checks ran, which did not, and version/validator assumptions that remain.
