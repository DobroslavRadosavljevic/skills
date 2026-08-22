# Extension: env ownership (packages)

Load when apps validate env with T3 Env and packages must receive options (no `process.env` in libraries).

Do not invent a homemade env parser (Zod/`ProcessEnv` merge, Effect Schema env module, or a workspace `packages/env` helper). Each app uses T3 Env (`@t3-oss/env-core` / framework package).

## MUST

1. Each app owns `.env` / `.env.example` and `src/env.ts` via T3 Env `createEnv`.
2. Packages expose `.make(options)` / `createX(options)` / Layer factories.
3. Wire options at the app boundary (`runtime.ts` / `main.ts`).
4. Client apps use a client key prefix (`VITE_`, …); server keys must not leak to the client.

## MUST NOT

1. `process.env` inside reusable package source (tooling scripts reading `--env-file` for drizzle/seed are OK when documented).
2. Importing another app’s `env.ts` from a package.
3. A custom env validation module instead of T3 Env.

## Checklist

```text
Env packages overlay:
- [ ] App src/env.ts is T3 Env createEnv
- [ ] New package APIs take options
- [ ] runtime/main wires env → layers/clients
```
