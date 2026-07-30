# Coverage, Browser Mode, Projects, and Pools

Advanced Vitest surfaces for CI quality gates, real-browser tests, monorepos, and parallelism.

## Coverage

```sh
bun add -d @vitest/coverage-v8
# or: bun add -d @vitest/coverage-istanbul
bunx vitest run --coverage
```

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    coverage: {
      provider: 'v8', // default | 'istanbul' | 'custom'
      enabled: true,
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/test/**'],
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 70,
        statements: 80,
        // perFile: true,
        // 100: true,
      },
    },
  },
})
```

| Provider | Package | Notes |
|---|---|---|
| `v8` | `@vitest/coverage-v8` | Default; AST remapping on by default in v4 |
| `istanbul` | `@vitest/coverage-istanbul` | Instrument-based |

v4 removals: `coverage.all`, `coverage.extensions`, `ignoreEmptyLines`, `experimentalAstAwareRemapping`. Default report is **files loaded by tests** unless `include` is set.

Ignore hints need `@preserve` so transforms keep them:

```ts
/* v8 ignore next -- @preserve */
```

**Projects:** coverage is **root-only** (process-wide), not per-project.

Docs: https://vitest.dev/guide/coverage · https://vitest.dev/config/coverage

## Browser Mode

Not `environment: 'jsdom'`. Runs tests in a real browser via a provider.

```sh
bun add -d @vitest/browser-playwright
bunx vitest init browser   # optional scaffold
```

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    browser: {
      enabled: true,
      provider: playwright({
        launchOptions: { /* … */ },
      }),
      instances: [{ browser: 'chromium' }], // firefox | webkit too
      headless: true,
    },
  },
})
```

```ts
import { expect, test } from 'vitest'
import { page } from 'vitest/browser'

test('ui', async () => {
  await expect.element(page.getByRole('button', { name: 'Save' })).toBeVisible()
})
```

| Package | Role |
|---|---|
| `@vitest/browser-playwright` | Recommended provider |
| `@vitest/browser-webdriverio` | WDIO |
| `@vitest/browser-preview` | Local preview only — **not for CI** |

v4: provider is a **factory**, not a string; import page from **`vitest/browser`** (not `@vitest/browser/context`). `@vitest/browser` package is no longer required for typical setups.

CLI: `--browser=chromium`, `--browser.headless`. Without config `browser`, bare `--browser` fails (v3.2+).

Framework helpers (community/ecosystem): `vitest-browser-react`, `vitest-browser-vue`, etc. Prefer `userEvent` from `vitest/browser` when applicable.

Docs: https://vitest.dev/guide/browser/

## Projects (ex-workspace)

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      {
        extends: true, // inherit root plugins/pool
        test: {
          name: 'unit',
          include: ['**/*.unit.test.ts'],
          environment: 'node',
        },
      },
      {
        test: {
          name: 'browser',
          include: ['**/*.browser.test.ts'],
          browser: {
            enabled: true,
            provider: playwright(),
            instances: [{ browser: 'chromium' }],
          },
        },
      },
      'packages/*',
    ],
  },
})
```

- `test.workspace` → **`test.projects`** (deprecated since 3.2, gone as primary API in v4 docs).
- Root config is **not** automatically a project unless listed.
- Root owns **coverage**, **reporters**, and other process-global options.
- Filter: `vitest run --project unit` (repeatable).
- Project files may use `defineProject` to reject root-only options.

Docs: https://vitest.dev/guide/projects

## Pools and parallelism

```ts
test: {
  pool: 'forks', // default | threads | vmForks | vmThreads
  maxWorkers: 4, // or '50%'
  fileParallelism: true,
  isolate: true,
  maxConcurrency: 5, // within-file concurrent tests
  execArgv: ['--expose-gc'],
  vmMemoryLimit: '300Mb',
}
```

| Pool | Notes |
|---|---|
| `forks` | Default; safest with native addons; `chdir` OK |
| `threads` | Faster IPC; Prisma/bcrypt-style natives may crash |
| `vmThreads` / `vmForks` | Faster isolation tradeoffs; ESM memory / Error global quirks |

v4 pool rewrite:

- `maxThreads` / `maxForks` → **`maxWorkers`**
- `VITEST_MAX_THREADS` / `FORKS` → **`VITEST_MAX_WORKERS`**
- `singleThread` / `singleFork` → `maxWorkers: 1` + often `isolate: false`
- **`poolOptions` removed** — flatten to top-level options

`fileParallelism: false` effectively serializes files (`maxWorkers: 1`).

Docs: https://vitest.dev/guide/parallelism

## Reporters and UI

```sh
bun add -d @vitest/ui
bunx vitest --ui
```

```ts
test: {
  reporters: [
    'default',
    ['junit', { suiteName: 'unit' }],
    process.env.GITHUB_ACTIONS === 'true' ? 'github-actions' : undefined,
  ].filter(Boolean),
  outputFile: {
    junit: './junit.xml',
    json: './report.json',
  },
}
```

Useful reporters: `default`, `verbose`, `tree`, `dot`, `json`, `junit`, `html`, `github-actions`, `agent`, `minimal`, `blob` (sharding).

```sh
vitest run --shard=1/2 --reporter=blob --coverage
vitest run --merge-reports --reporter=junit --coverage
```

v4: `basic` reporter removed → `['default', { summary: false }]`.

## Benchmarks (experimental)

```ts
import { bench, describe } from 'vitest'

describe('sort', () => {
  bench('native', () => {
    ;[3, 1, 2].sort()
  })
})
```

```sh
bunx vitest bench
bunx vitest bench --outputJson main.json
bunx vitest bench --compare main.json
```

Does **not** follow SemVer — treat as experimental. Config under `test.benchmark`.
