# Examples (Vitest layout)

## Good — domain package

```text
packages/billing/
  vitest.config.ts
  vitest.unit.config.ts
  vitest.integration.config.ts
  tests/
    unit/catalog.test.ts
    unit/math.test.ts
    integration/ledger.test.ts
    fixtures/seed-subject.ts
    setup/postgres-url.ts
```

## Good — API HTTP via Eden Treaty

```text
apps/api/
  tests/unit/billing/status.test.ts   # treaty(statusRoute) + mocks
  tests/integration/billing/…         # treaty(app) + real DB
```

## Bad — Bun runner

```ts
import { test, expect } from "bun:test";
```

Use `vitest` instead.

## Bad — root aggregator as the only config

```text
/
  vitest.config.ts    # projects: [./apps/a, ./apps/b, ./packages/…]
```

Prefer per-package configs + root `turbo run test` (or equivalent).

## Bad — everything in default test

```json
"test": "vitest run"   # runs unit + integration + Docker every time
```

Split `--project unit` vs `test:integration`.
