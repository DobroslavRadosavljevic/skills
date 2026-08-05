# Canonical trees (Vitest)

## Per workspace (unit of config)

```text
<app|package>/
  vitest.config.ts                 # defineConfig — projects + passWithNoTests
  vitest.unit.config.ts            # defineProject — name: "unit"
  vitest.integration.config.ts     # defineProject — name: "integration"
  tests/
    unit/**/*.{test,spec}.ts(x)
    integration/**/*.{test,spec}.ts(x)
    fixtures/                      # builders, seeds, static assets
    setup/                         # setupFiles helpers OR container starters
```

Optional extras (overlays):

```text
  vitest.types.config.ts           # name: "types" + typecheck
  vitest.storybook.config.ts       # browser / Storybook
  tests/types/**/*.test-d.ts
```

## Typical configs

```ts
// vitest.config.ts
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    passWithNoTests: true,
    projects: ["./vitest.unit.config.ts", "./vitest.integration.config.ts"],
  },
});
```

```ts
// vitest.unit.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "unit",
    environment: "node", // or "happy-dom" for React packages
    include: ["tests/unit/**/*.{test,spec}.ts"],
  },
});
```

```ts
// vitest.integration.config.ts
import { defineProject } from "vitest/config";

export default defineProject({
  test: {
    name: "integration",
    environment: "node",
    include: ["tests/integration/**/*.{test,spec}.ts"],
    testTimeout: 60_000,
    hookTimeout: 60_000,
    fileParallelism: false, // when sharing containers / DB
  },
});
```

## Scripts (per package)

```json
{
  "test": "vitest run --project unit --passWithNoTests",
  "test:watch": "vitest --project unit",
  "test:integration": "vitest run --project integration --passWithNoTests"
}
```

Soft: `bun --bun vitest …` when Bun resolution/runtime is required.

## Repo root (orchestration only)

```text
package.json
  "test": "turbo run test"                 # or equivalent
  "test:integration": "turbo run test:integration"
# NO requirement for root vitest.config.ts aggregating all packages
```

## Naming

| Pattern | Example |
| --- | --- |
| Aspect file | `status.test.ts`, `grants.test.ts` |
| Feature folders under tests | `tests/unit/billing/…` |
| Fixtures | `tests/fixtures/seed-owner.ts` |
| Setup | `tests/setup/unit.ts`, `tests/setup/redis-container.ts` |

Prefer `.test.ts`; `.spec.ts` is allowed if the include glob already accepts it.
