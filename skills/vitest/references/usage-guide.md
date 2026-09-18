# Usage Guide

Day-to-day Vitest 5 workflow. Prefer this for adoption; sibling references for depth.

## 1. Install

```sh
bun add -d vitest
# optional:
bun add -d @vitest/coverage-v8
bun add -d happy-dom   # or jsdom
```

Requires **Node `^22.12 || ^24 || >=26`** and **Vite `^6.4 || ^7 || ^8`** (required peer). Align any `@vitest/*` packages to the same version as `vitest` (snapshot **5.0.1**).

Yarn does **not** auto-install peers — add `vite` explicitly. npm, pnpm, Bun, and Deno do.

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

Gitignore generated artifacts:

```gitignore
.vitest/
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

Vitest **does not** search parent directories for a config. From a subdirectory, pass `--config` (and usually `--dir`).

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
Options: **second** argument — `it('name', { timeout: 10_000 }, fn)` — not third.

Always `await` `resolves` / `rejects` / `expect.poll` / `toMatchFileSnapshot`.

## 4. Run and filter

```sh
bunx vitest run                         # CI / single run
bunx vitest                             # watch (dev TTY)
bunx vitest run src/foo.test.ts
bunx vitest run src/foo.test.ts -t "adds"
bunx vitest run -t "math > adds"        # full name uses " > "
bunx vitest run src/foo.test.ts:12      # line filter (full path)
bunx vitest related src/foo.ts --run    # lint-staged: always --run
bunx vitest run --changed HEAD~1
bunx vitest run -p unit                 # --project shorthand
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

`vi.mock` / `vi.hoisted` must stay at **file top level**. Per-argument stubs: `vi.when(spy).calledWith(1).thenReturn('one')`.

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

Patterns match paths **relative to the project root**. A pattern with no glob (`'src'`) means `src/**`.

## 9. Progressive adoption

1. Add `vitest` + `vitest run` script; write Node unit tests; gitignore `.vitest/`.
2. Share Vite aliases via `mergeConfig` or `test` in Vite config.
3. Add `setupFiles`, DOM env, and `vi` mocks as needed.
4. Enable coverage with explicit `include` + thresholds.
5. Split browser UI tests into a **project** with Playwright provider.
6. Tune `pool` / `maxWorkers` / `fsModuleCache` only when CI time or native-addon issues appear (`vitest doctor` to measure).

## 10. Troubleshooting

| Symptom | Fix |
|---|---|
| `bun test` runs wrong runner | Use `bun run test` / `bunx vitest` |
| Watch hangs in CI | `vitest run` |
| `Cannot find package 'vite'` (Yarn) | `yarn add -D vite` |
| Config not found from a subdirectory | `--config ../vitest.config.ts` (no parent walk) |
| Plugins/aliases missing | Dedicated vitest config ignored vite — `mergeConfig` |
| `vi.mock` can’t see locals | `vi.hoisted` |
| Nested `vi.mock` throws | Move to top level (`vi.doMock` if it must stay dynamic) |
| Snapshot attributed to wrong concurrent test | Context `expect` |
| Unawaited `resolves` fails the test | `await expect(p).resolves…` |
| Call counts leak across tests unexpectedly | Default `clearMocks: true` — assert inside the test, or set `false` |
| Native module crashes with threads | `pool: 'forks'` (default) |
| Coverage empty / too small | Set `coverage.include` (relative globs) |
| `.only` fails CI | Remove `.only` or `allowOnly` (avoid in CI) |

## 11. What not to do

- Do not use `bun test` for Vitest projects.
- Do not leave `vitest` (watch) in CI without `--run`.
- Do not import `bench` from `vitest` — use the `{ bench }` fixture in `*.bench.*` files.
- Do not nest `vi.mock` / `vi.hoisted` inside `describe` / functions.
- Do not put `coverage` / `reporters` only in a nested project config — they are root-owned.
- Do not use string browser providers (`provider: 'playwright'`) — factory imports.
- Do not treat `test.sequential` as valid — use `{ concurrent: false }`.
