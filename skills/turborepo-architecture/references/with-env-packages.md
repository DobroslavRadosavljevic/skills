# Extension: env ownership (packages)

Load when apps validate env and packages must receive options (no `process.env` in libraries).

## MUST

1. Each app owns `.env` / `.env.example` and `src/env.ts` (`createEnv` or equivalent).
2. Packages expose `.make(options)` / `createX(options)` / Layer factories.
3. Wire options at the app boundary (`runtime.ts` / `main.ts`).
4. Client apps use a client key prefix (`VITE_`, …); server keys must not leak to the client.

## MUST NOT

1. `process.env` inside reusable package source (tooling scripts reading `--env-file` for drizzle/seed are OK when documented).
2. Importing another app’s `env.ts` from a package.

## Checklist

```text
Env packages overlay:
- [ ] App env module exists
- [ ] New package APIs take options
- [ ] runtime/main wires env → layers/clients
```
