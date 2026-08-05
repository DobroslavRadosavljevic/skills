# Extension: env ownership

Load when the app validates environment with a shared `createEnv` helper (or equivalent Effect Schema / Zod env module), and packages must not read `process.env`.

## Stance

Apps own `.env` / `.env.example` and validated `env` exports. Packages receive options via `.make(options)` / `createX(options)` / Layer factories.

## MUST

1. **App-owned env module** — e.g. `src/env.ts` calling `createEnv({ server, client?, shared? })`.
2. **Packages never read `process.env`** (except dedicated tooling: drizzle config, seeds, codegen scripts).
3. **Pass validated values** into Layers, auth factories, and clients at the app boundary (`runtime.ts` / `main.ts`).
4. **Client keys** use a required prefix (e.g. `VITE_`) when exposed to the browser; server keys must throw if read on the client.
5. Keep **`.env.example`** in sync with required keys (no secrets).

## Tree

```text
apps/<app>/
  .env
  .env.example
  src/env.ts                 # createEnv — only place packages get config from

packages/<env>/              # optional shared createEnv helpers
packages/<domain>/
  src/….make({ url, … })     # options in — no process.env
```

## MUST NOT

1. `process.env.FOO` inside a workspace package’s library code.
2. Importing another app’s `env.ts`.
3. Leaking server-only keys into client bundles.

## Checklist

```text
Env overlay:
- [ ] App has src/env.ts (or equivalent) as single validated source
- [ ] New package APIs take options / Layer.make args
- [ ] Client vs server split respected
- [ ] .env.example updated
```
