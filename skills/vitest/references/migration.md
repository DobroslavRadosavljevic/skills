# Migration (Jest, Vitest 3 → 4, Vitest 4 → 5)

Checklists and breaking changes. Sources: https://vitest.dev/guide/migration/ · https://v4.vitest.dev/guide/migration · https://vitest.dev/guide/migration/jest

## Target stack

| Field | Value |
|---|---|
| Package | **`vitest@^5`** (snapshot **5.0.1**) |
| Node | `^22.12 \|\| ^24 \|\| >=26` |
| Vite peer | `^6.4 \|\| ^7 \|\| ^8` (required; Yarn must list `vite`) |
| Align | All `@vitest/*` at the same version (WebdriverIO may lag) |

Archives: V4 https://v4.vitest.dev/ (`vitest@4` / tag `V4` → **4.1.11**). V3 https://v3.vitest.dev/ (`vitest@3` / tag `V3` → **3.2.7**).

If the project is still on Vitest 3, apply **3 → 4** first, then **4 → 5**.

## Migrating from Jest

| Jest | Vitest |
|---|---|
| Globals on by default | Off — import from `vitest` or `globals: true` |
| `jest.fn` / `jest.mock` | `vi.fn` / `vi.mock` |
| Factory return = default export | Return `{ default: …, named }` as needed |
| `__mocks__` auto | Only with `vi.mock()` (or setup) |
| `jest.requireActual` | `await vi.importActual` |
| Callback `done` | Use `async` / Promises |
| `before` / `after` | `beforeAll` / `afterAll` |
| Hooks sequential like Jest | `sequence.hooks: 'list'` if needed |
| `jest.setTimeout` | `vi.setConfig({ testTimeout })` |
| `JEST_WORKER_ID` | `VITEST_POOL_ID` / `VITEST_WORKER_ID` (**1-based** in v5) |
| Space-joined titles | Joined with ` > ` (`-t 'math > adds'`) |
| Types `jest.Mock` | `import type { Mock } from 'vitest'` |
| `jest.Matchers` only | Also augment `vitest` `Matchers<R, T>` |
| `mockReset` → empty fn | Vitest `mockReset` restores original impl |
| Snapshot helpers from `jest-snapshot` | `Snapshots` from `vitest` |

Install path: `bun add -d vitest` (+ coverage/DOM/browser packages as needed). Share Vite aliases/plugins via `vitest/config` `defineConfig` / `mergeConfig`.

Stubborn CJS deps: `server.deps.inline: ['pkg']`.

## Migrating to Vitest 5

### Requirements

- Drop Node 20 (and 18). Need **Node ≥ 22.12** (engines also `^24` and `>=26`; odd Node 23/25 are outside the published range).
- Vite **≥ 6.4** (7/8 OK). `vite` is a **required peer**, not a `vitest` dependency. Yarn: `yarn add -D vite`.

### Config / runtime

| Old / v4 behavior | v5 action |
|---|---|
| Parent-dir config discovery | Gone — pass `--config` from subdirs |
| Inline project without `extends` | Now **inherits root** (`extends: true`). Use `extends: false` to isolate |
| Referenced config’s `projects` ignored | Nested projects run (`app (unit)`). Don’t merge root-with-projects into a leaf |
| One Vite server per inline project | Shared by default (`sharedViteServer: false` to opt out) |
| `clearMocks: false` default | Default **`true`** |
| `-t 'suite test'` (space) | `-t 'suite > test'` |
| `test.sequential` / `{ sequential: true }` | `{ concurrent: false }` |
| `browser.api` | Top-level `api` |
| `attachmentsDir` `.vitest-attachements/` | `.vitest/attachments/` |
| Blob `.vitest-reports/` | `.vitest/blob/` |
| HTML reporter `html/` | `.vitest/` (`outputDir`, not `outputFile`) |
| JSON/JUnit to stdout | Files under `.vitest/json` and `.vitest/junit` (`{ stdout: true }` to pipe) |
| Worker ids 0-based | **1-based** `VITEST_POOL_ID` / `VITEST_WORKER_ID` |
| `resolveConfig` `{ viteConfig, vitestConfig }` | Returns Vite config; Vitest options on `.test` |

Gitignore `.vitest/`.

### Mocks / assertions

- Nested `vi.mock` / `vi.unmock` / `vi.hoisted` **throw** — top-level only (`vi.doMock` if dynamic).
- Browser automock without factory no longer calls the real impl — stubs / `{ spy: true }`.
- Class mocks keep prototype methods and pass `instanceof`.
- Unawaited `resolves` / `rejects` / `toMatchFileSnapshot` **fail**.
- `expect.poll` **fails** on timeout; callback gets `{ signal }`.
- `toThrow('')` matches any message; use `/^$/` for empty.
- Custom matchers: `interface Matchers<R, T>`. `Assertion<void, T>` not `Assertion<T>`.
- `test.each` `$` strings lose quotes; titles use pretty-format.

### Browser

- Locators **exact** by default (`locators.exact: false` to revert).
- `toHaveTextContent` is exact; regex/partial → `toMatchTextContent`.
- Custom commands: `{ selector, locator }` not a string.
- `await render()` in `vitest-browser-vue` / `vitest-browser-svelte`.
- UI requires `?token=` from the printed URL.
- Orchestrator URL needs `sessionId`.
- `toMatchScreenshot` directory: `browser.expect.toMatchScreenshot.screenshotDirectory` (default `__screenshots__`).

### Coverage

- `include` / `exclude` match **relative** paths, no `contains`. `'src'` means `src/**`.
- Glob thresholds no longer inherit top-level `perFile`.

### Benchmarks

```ts
// v4
import { bench } from 'vitest'
bench('sort', () => { [3, 1, 2].sort() })

// v5 — file must match benchmark.include (*.bench.*)
import { test } from 'vitest'
test('sort', async ({ bench }) => {
  await bench('sort', () => { [3, 1, 2].sort() }).run()
})
```

Removed: `bench.only/skip/todo`, `benchmark.reporters` / `outputFile` / `compare` / `outputJson`, `--compare`, `--outputJson`. Persist with `writeResult` + `bench.from()`.

### Fake timers

`Temporal.Now` follows fake time when `Temporal` exists. Opt out: `toNotFake: ['Temporal']`.

### Packages / entrypoints

Deprecated (no new features): `@vitest/runner`, `@vitest/ws-client`. Use `expect` from `vitest`, not `@vitest/expect`.

Removed: `vitest/coverage` → `vitest/node`; `vitest/reporters` → `vitest/node`; `vitest/environments` / `vitest/snapshot` → `vitest/runtime`; `vitest/runners` / `vitest/suite` → `TestRunner` on `vitest`; `vitest/mocker` → `@vitest/mocker`; `vitest/internal/module-runner`.

WebdriverIO provider is community-maintained (`@vitest/browser-webdriverio` may lag **5.0.1**). Prefer `@vitest/browser-playwright`.

### Checklist (4 → 5)

1. Bump Node ≥ 22.12 + Vite ≥ 6.4 + `vitest@^5` + matching `@vitest/*`. Yarn: add `vite`.
2. Gitignore `.vitest/`. Fix reporter `outputFile` / HTML `outputDir` if CI expected old paths.
3. Move nested `vi.mock` to top level. Re-check `clearMocks` / `beforeAll` call counts.
4. `await` every async assertion. Update `-t` patterns that span suite+test.
5. Replace `test.sequential` with `{ concurrent: false }`.
6. Inline projects: drop redundant `extends: true`, or set `extends: false` if inheritance is wrong. Stop merging root-with-`projects` into leaves.
7. Browser: exact locators, `toMatchTextContent`, `api` not `browser.api`, `await render` for Vue/Svelte.
8. Rewrite `import { bench }` suites to `{ bench }` fixtures in `*.bench.*` files.
9. Update worker-id math to 1-based. Review coverage globs.
10. Run `vitest run` + coverage + (if used) headless browser project.

## Migrating to Vitest 4

Still required when jumping from 3.x. Full guide: https://v4.vitest.dev/guide/migration

### Requirements

- Drop Node 18. Need Node ≥ 20 and Vite ≥ 6.

### Config renames / removals

| Old | New / action |
|---|---|
| `test.workspace` | `test.projects` |
| `poolOptions.*` | Flatten: `execArgv`, `isolate`, `vmMemoryLimit`, … |
| `maxThreads` / `maxForks` | `maxWorkers` |
| `singleThread` / `singleFork` | `maxWorkers: 1` (+ `isolate: false` as needed) |
| `poolMatchGlobs` / `environmentMatchGlobs` | Use projects / per-file env comments |
| Top-level `deps.external\|inline` | `server.deps.*` |
| Reporter `basic` | `['default', { summary: false }]` |
| `minWorkers` | Removed (no effect) |

### Coverage

- Remove `coverage.all`, `coverage.extensions`, `ignoreEmptyLines`, `experimentalAstAwareRemapping`.
- Set explicit `coverage.include` for “all source files” style reports.

### Browser

```ts
// v3
browser: { provider: 'playwright', instances: [{ browser: 'chromium', launch: {…} }] }

// v4 / v5
import { playwright } from '@vitest/browser-playwright'
browser: {
  provider: playwright({ launchOptions: {…} }),
  instances: [{ browser: 'chromium' }],
}
```

```ts
import { page } from '@vitest/browser/context' // v3
import { page } from 'vitest/browser'          // v4 / v5
```

### Mocks / API

- `test`/`describe` options are the **2nd** argument (not 3rd). Timeout number as last arg still works.
- `restoreAllMocks` restores `spyOn` spies only (not automocks).
- Constructor/`new` mock behavior improved — no arrow functions as class mocks.

### Snapshots / pools

- Custom elements print shadow roots by default (`printShadowRoot: false` to revert).
- Prefer default `forks`; only switch to `threads` after validating native dependencies.

### Checklist (3 → 4)

1. Bump Node + Vite + `vitest@^4` + matching `@vitest/*`.
2. Rename `workspace` → `projects`; flatten pool options.
3. Fix coverage `include`; delete removed coverage keys.
4. Convert browser providers to factories; update `vitest/browser` imports.
5. Fix `test(name, fn, options)` call sites.
6. Then continue with the **4 → 5** checklist if targeting 5.x.

## What stayed familiar

- `describe` / `it` / `expect` / snapshots
- Vite-powered transforms and shared config model
- Watch mode DX and smart invalidation
- Optional DOM environments via happy-dom/jsdom
