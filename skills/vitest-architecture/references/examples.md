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

## Good — API unit via HTTP handle

```text
apps/api/
  tests/unit/billing/status.test.ts   # plugin.handle(new Request(...))
  tests/integration/billing/…         # real DB
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
