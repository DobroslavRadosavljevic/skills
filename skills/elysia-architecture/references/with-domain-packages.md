# Extension: domain packages vs HTTP modules

Load in a monorepo where shared domain logic lives in `packages/*` and Elysia apps only own HTTP (and app-specific wiring).

## Stance

**Packages** = ledger, catalog, provider clients, tagged errors, reusable Effect services.  
**Apps** = routes, webhooks, cron, email React templates, env → Layer wiring.

Multiple HTTP apps may share packages with different mounts (session UI API vs API-key jobs API).

## Tree

```text
packages/<billing|credits|api-keys|…>/
  src/… services, errors, live.ts     # no Elysia routes

apps/<session-api>/src/modules/<feature>/
  routes/ · schema/ · live.ts         # HTTP + compose package Layers with env

apps/<jobs-api>/src/modules/…
  # may use the same domain package (e.g. reserve credits) without provider admin routes
```

## MUST

1. Put reusable business rules in packages when a second app or worker would otherwise copy them.
2. Keep **provider webhooks + customer billing UI** on the control-plane/session API unless product says otherwise.
3. Jobs/worker surfaces import **only** what they need (e.g. credit reservation), not Polar admin / portal routes.
4. Wire package Layers in app `runtime.ts` with validated env; packages still never read `process.env`.

## MUST NOT

1. Implement core ledger logic inside a route file.
2. Let the worker import billing HTTP modules or email template trees “for convenience.”
3. Duplicate tagged error classes in the app when the package already owns them.

## Checklist

```text
Domain packages overlay:
- [ ] New domain logic: package vs app-only? (second consumer → package)
- [ ] App modules stay HTTP-thin
- [ ] runtime wires package Layers from env
- [ ] Jobs/worker dependency surface kept minimal
```
