# Usage Guide

Day-to-day Vitest 4 workflow. Prefer this for adoption; sibling references for depth.

## 1. Install

```sh
bun add -d vitest
# optional:
bun add -d @vitest/coverage-v8
bun add -d happy-dom   # or jsdom
```

Requires **Node >= 20** and **Vite ^6 || ^7 || ^8** (peer). Align any `@vitest/*` packages to the same version as `vitest` (snapshot **4.1.10**).

**Bun:** use `bun run test` / `bunx vitest` — **not** `bun test` (that is Bun’s own runner).

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## 2. Minimal config

Prefer a dedicated config when tests need different plugins/env than the app, or use `test` inside the Vite config.

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Important:** a dedicated `vitest.config.*` **fully overrides** and ignores `vite.config` options. To reuse Vite plugins/aliases:

```ts
import { defineConfig, mergeConfig } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: { environment: 'jsdom' },
  }),
)
```

Vite options (`plugins`, `resolve.alias`, `define`) live at the **top level** of `defineConfig` from `vitest/config`, not under `test`.

## 3. Write a first test

```ts
import { describe, expect, it } from 'vitest'

describe('math', () => {
  it('adds', () => {
    expect(1 + 1).toBe(2)
  })

  it('resolves', async () => {
    await expect(Promise.resolve(1)).resolves.toBe(1)
  })
})
```

Include defaults: `**/*.{test,spec}.?(c|m)[jt]s?(x)`.

Modifiers: `.only`, `.skip`, `.todo`, `.concurrent`, `.each`, `.skipIf`, `.runIf`.  
Options (v4): **second** argument — `it('name', { timeout: 10_000 }, fn)` — not third.

## 4. Run and filter

```sh
bunx vitest run                         # CI / single run
bunx vitest                             # watch (dev TTY)
bunx vitest run src/foo.test.ts
bunx vitest run src/foo.test.ts -t "adds"
bunx vitest run src/foo.test.ts:12      # line filter (full path)
bunx vitest related src/foo.ts --run    # lint-staged: always --run
bunx vitest run --changed HEAD~1
```

Positional filters are **path substrings**, not globs (unless the shell expands them).

## 5. Environments

| Need | Approach |
|---|---|
| Unit / Node | default `environment: 'node'` |
| DOM APIs in Node | `happy-dom` or `jsdom` (+ install package) |
| Real browser | Browser Mode project (see [coverage-browser-projects.md](coverage-browser-projects.md)) |

Per-file:

```ts
// @vitest-environment jsdom
```

TS for DOM globals: `"types": ["vitest/jsdom"]` when using jsdom.

## 6. Setup files

```ts
export default defineConfig({
  test: {
    setupFiles: ['./src/test/setup.ts'], // per file, same process
    globalSetup: ['./src/test/global-setup.ts'], // once, main thread
  },
})
```

- **setupFiles:** can use Vitest APIs; run before each test file.
- **globalSetup:** separate process scope — share via `provide` / `inject`, not by mutating globals for workers.

## 7. Mocking (quick)

```ts
import { vi, expect, it } from 'vitest'

const { token } = vi.hoisted(() => ({ token: 'x' }))

vi.mock('./api', () => ({
  fetchUser: vi.fn(() => ({ id: token })),
}))

it('mocks', async () => {
  const { fetchUser } = await import('./api')
  expect(fetchUser()).toEqual({ id: 'x' })
})
```

See [mocking-snapshots.md](mocking-snapshots.md).

## 8. Coverage (quick)

```sh
bun add -d @vitest/coverage-v8
bunx vitest run --coverage
```

```ts
test: {
  coverage: {
    provider: 'v8',
    include: ['src/**/*.{ts,tsx}'],
    thresholds: { lines: 80, functions: 80, branches: 70, statements: 80 },
  },
}
```

## 9. Progressive adoption

1. Add `vitest` + `vitest run` script; write Node unit tests.
2. Share Vite aliases via `mergeConfig` or `test` in Vite config.
3. Add `setupFiles`, DOM env, and `vi` mocks as needed.
4. Enable coverage with explicit `include` + thresholds.
5. Split browser UI tests into a **project** with Playwright provider.
6. Tune `pool` / `maxWorkers` only when CI time or native-addon issues appear.

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `bun test` runs wrong runner | Use `bun run test` / `bunx vitest` |
| Watch hangs in CI | `vitest run` |
| Plugins/aliases missing | Dedicated vitest config ignored vite — `mergeConfig` |
| `vi.mock` can’t see locals | `vi.hoisted` |
| Snapshot attributed to wrong concurrent test | Context `expect` |
| Native module crashes with threads | `pool: 'forks'` (default) |
| Coverage empty / too small | Set `coverage.include` (v4) |
| `.only` fails CI | Remove `.only` or `allowOnly` (avoid in CI) |

## 11. What not to do

- Do not use `bun test` for Vitest projects.
- Do not leave `vitest` (watch) in CI without `--run`.
- Do not treat V5 beta APIs as stable.
- Do not put `coverage` / `reporters` only in a nested project config — they are root-owned.
- Do not use string browser providers (`provider: 'playwright'`) — v4 wants factory imports.
