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

## Good — unit test from a failure-mode list

```ts
/**
 * Failure modes for applyDiscount(cart, code):
 * 1. Unknown code → InvalidCodeError, cart unchanged.
 * 2. Discount larger than total → total is 0, never negative.
 * 3. Percent discount → exact cents, rounds half up.
 * Covered by integration: valid code persists new total (tests/integration/checkout.test.ts).
 */
describe("applyDiscount", () => {
  it("rejects an unknown code and keeps the cart unchanged", () => {});
  it("never makes the total negative", () => {});
  it("rounds percent discounts to exact cents, half up", () => {});
});
```

## Bad — mock-the-world unit test

```ts
it("creates an order", async () => {
  const repo = { insert: vi.fn() };
  await createOrder(repo, input);
  expect(repo.insert).toHaveBeenCalledWith(input);
});
```

Restates the implementation and catches no real bug. Delete it, or assert the stored row in an existing integration test.

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
