# Extension: env ownership

Load when the Start app validates environment with T3 Env (`@t3-oss/env-core` `createEnv`), including public client keys (`VITE_` on Vite, `PUBLIC_` on Rsbuild by default).

## Stance

The Start app owns `.env` / `.env.example` and `src/env.ts`. Workspace packages receive options — they do not read `process.env` in library code.

Do not invent a homemade env parser (Zod/`ProcessEnv` merge, Effect Schema env module, or a workspace `packages/env` helper). Use T3 Env.

Start’s own guidance: **read server secrets in per-request handlers** (server functions, middleware, server routes), not at module scope — especially on edge/Workers where env is injected per request. Validated `env.ts` still centralizes schema; call sites that need secrets should run on the server path.

## MUST

1. **`src/env.ts`** uses T3 Env `createEnv` from `@t3-oss/env-core` with `clientPrefix` matching the bundler (`VITE_` or `PUBLIC_`, etc.).
2. Wire **`import.meta.env`** (and server `process.env` when needed) into `runtimeEnv`.
3. **Server-only keys must not leak** to the client bundle; client code only imports client/shared values.
4. Pass URLs/secrets into auth clients and generated API client config from `env`, not scattered `import.meta.env` / `process.env` reads.

## Tree

```text
apps/<web>/
  .env · .env.example
  src/env.ts                 # T3 Env createEnv
```

## MUST NOT

1. Reading raw `import.meta.env.VITE_*` / `PUBLIC_*` all over modules when `env.ts` exists.
2. Putting server secrets in `client:` env schema.
3. Relying on module-scope `process.env.SECRET` reads for server-only values in edge SSR runtimes.
4. A custom env validation module instead of T3 Env.

## Checklist

```text
Env overlay:
- [ ] src/env.ts is T3 Env createEnv
- [ ] clientPrefix matches bundler + runtimeEnv wired
- [ ] Packages take options; no process.env in libs
- [ ] Server secrets used from server handlers / server-only paths
- [ ] .env.example updated
```
