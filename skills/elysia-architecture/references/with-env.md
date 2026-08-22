# Extension: env ownership

Load when the app validates environment with T3 Env (`@t3-oss/env-core` `createEnv`), and packages must not read `process.env`.

## Stance

Apps own `.env` / `.env.example` and T3 Env `env` exports. Packages receive options via `.make(options)` / `createX(options)` / Layer factories.

Do not invent a homemade env parser (Zod/`ProcessEnv` merge, Effect Schema env module, or a workspace `packages/env` helper). Use T3 Env.

## MUST

1. **App-owned `src/env.ts`** — `createEnv` from `@t3-oss/env-core` (`server`, optional `client` / `shared`).
2. **Packages never read `process.env`** (except dedicated tooling: drizzle config, seeds, codegen scripts).
3. **Pass validated values** into Layers, auth factories, and clients at the app boundary (`runtime.ts` / `main.ts`).
4. **Client keys** use a required prefix (e.g. `VITE_`) when exposed to the browser; server keys must throw if read on the client.
5. Keep **`.env.example`** in sync with required keys (no secrets).

## Tree

```text
apps/<app>/
  .env
  .env.example
  src/env.ts                 # T3 Env createEnv — app wires packages from here

packages/<domain>/
  src/….make({ url, … })     # options in — no process.env
```

## MUST NOT

1. `process.env.FOO` inside a workspace package’s library code.
2. Importing another app’s `env.ts`.
3. Leaking server-only keys into client bundles.
4. A custom env validation module instead of T3 Env.

## Checklist

```text
Env overlay:
- [ ] App has src/env.ts as T3 Env createEnv
- [ ] New package APIs take options / Layer.make args
- [ ] Client vs server split respected
- [ ] .env.example updated
```
