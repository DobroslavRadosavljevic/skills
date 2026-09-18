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
        // perFile: true, // or { lines: 50, … }
        // 100: true,
      },
    },
  },
})
```

| Provider | Package | Notes |
|---|---|---|
| `v8` | `@vitest/coverage-v8` | Default; AST remapping |
| `istanbul` | `@vitest/coverage-istanbul` | Instrument-based; `@vitest/istanbuljs` internals |

`include` / `exclude` match paths **relative to the project root** (no picomatch `contains`). A pattern with no wildcard is a directory (`'src'` → `src/**`). Default report is **files loaded by tests** unless `include` is set.

Glob-pattern thresholds do **not** inherit top-level `perFile` — set `perFile` on each glob. `thresholds.perFile` may be an object; `thresholds.autoUpdate` may be a `(new, previous) => number` function.

`coverage.autoAttachSubprocess` (v8, default `false`) tracks `child_process` / `worker_threads` via `NODE_V8_COVERAGE` (I/O cost).

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
      locators: { exact: true, errorFormat: 'aria' }, // exact is default
      traceView: false, // DOM snapshot replay in UI / HTML reporter
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
| `@vitest/browser-preview` | Local preview only — **not for CI** |
| `@vitest/browser-webdriverio` | Community-maintained; npm lags core — prefer Playwright for new work |

Provider is a **factory**, not a string; import page from **`vitest/browser`**. `@vitest/browser` is not required for typical setups (still used for `SerializedLocator` in custom commands). `browser.api` is gone — set top-level `api` (default port **63315**).

CLI: `--browser=chromium`, `--browser.headless`. Without config `browser`, bare `--browser` fails.

Locator defaults:

- **`locators.exact: true`** — `getByText('Item')` does not match `Item 1`. Set `exact: false` to restore substring matching.
- Locator errors can print the **ARIA tree** (`errorFormat: 'aria' | 'html' | 'all'`).
- `toHaveTextContent` is **exact string equality** (no `RegExp`). Partial/regex → `toMatchTextContent`.
- Custom commands receive `{ selector, locator }` (`SerializedLocator`), not a bare selector string.
- `vitest-browser-vue` / `vitest-browser-svelte` `render` is **async** (`await render(…)`).

`browser.traceView: true` records DOM snapshots for replay in browser UI, Vitest UI, and the HTML reporter (all providers). Playwright `.trace.zip` is a separate `browser.trace` path.

Failure screenshots go under `.vitest/attachments/failure-screenshots/`. `toMatchScreenshot` references default to `__screenshots__` via `browser.expect.toMatchScreenshot.screenshotDirectory` (not `browser.screenshotDirectory`).

Orchestrator URLs require `sessionId` — use the URL Vitest prints, not a bare `/__vitest_test__/`.

Framework helpers: `vitest-browser-react`, `vitest-browser-vue`, `vitest-browser-svelte`. Prefer `userEvent` from `vitest/browser` when applicable.

Docs: https://vitest.dev/guide/browser/

## Projects (ex-workspace)

```ts
import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'

export default defineConfig({
  test: {
    projects: [
      {
        // extends: true is the default — inherits root plugins/pool
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

- `test.workspace` → **`test.projects`**.
- **Inline** projects inherit the declaring config (`extends: true`) and **share its Vite server** when they do not change Vite options (`sharedViteServer`, default on). Arrays like `setupFiles` **concat**. Set `extends: false` / `sharedViteServer: false` to opt out. Duplicate `extends: true` on an already-inheriting project can double plugins — drop the redundant flag.
- **File/dir** projects do **not** inherit root options. If a referenced config declares `projects`, it becomes a **container** for nested projects named `app (unit)`, `app (e2e)`, … (v4 ignored nested `projects`). Do not `mergeConfig` the root (which has `projects`) into a leaf.
- Root config is **not** automatically a project unless listed.
- Root owns **coverage**, **reporters**, `attachmentsDir`, `resolveSnapshotPath`.
- Filter: `vitest run -p unit` (repeatable). `--project app` matches nested `app (unit)`. Supports `*` and `!exclude`.
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
| `vmThreads` / `vmForks` | Faster isolation tradeoffs; `require(esm)` supported; ESM memory / Error global quirks |

`VITEST_POOL_ID` / `VITEST_WORKER_ID` are **1-based** (v4 was 0-based). Node and browser pools do not share ids.

`fileParallelism: false` effectively serializes files (`maxWorkers: 1`).

`vitest doctor` measures alternative pool/isolate/vm/`fsModuleCache` configs against a passing baseline.

Docs: https://vitest.dev/guide/parallelism

## Reporters and UI

```sh
bun add -d @vitest/ui
bunx vitest --ui
# prints http://localhost:<port>/__vitest__/?token=...  — token is required
```

Default artifact root: **`.vitest/`** (gitignore it).

| Reporter | Default output (v5) |
|---|---|
| `html` | `.vitest/index.html` (`outputDir`; `singleFile: true` inlines assets) |
| `json` | `.vitest/json/output.json` (no longer stdout; `{ stdout: true }` to pipe) |
| `junit` | `.vitest/junit/output.xml` |
| `blob` | `.vitest/blob/blob-*.json` |

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

`basic` reporter remains `['default', { summary: false }]`. Duration output includes percentages (`environment 79%, import 13%, …`).

## Benchmarks

`bench` is a **test-context fixture**, not a top-level import. Only files matching `benchmark.include` (default `**/*.{bench,benchmark}.?(c|m)[jt]s?(x)`).

```ts
import { expect, test } from 'vitest'

test('sort', async ({ bench }) => {
  const result = await bench.compare(
    bench('native', () => {
      ;[3, 1, 2].sort()
    }),
    bench('custom', () => customSort()),
  )
  expect(result.get('native')).toBeFasterThan(result.get('custom'))
})
```

```sh
bunx vitest bench
# persist: writeResult option + bench.from() — not --outputJson / --compare
```

- `vitest` ignores bench files unless `benchmark.enabled: true`.
- `vitest bench` runs only benchmarks (sequential; no file parallelism).
- Removed: top-level `bench`, `bench.only/skip/todo`, `benchmark.reporters` / `outputFile` / `compare` / `outputJson`, `--compare`, `--outputJson`.
- Use `test.skip` / `test.only` on the surrounding test; JSON reporter includes a `benchmarks` field.
- Custom provider: `benchmark.provider` (advanced).
