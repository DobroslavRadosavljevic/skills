# Migration (Jest and Vitest 3 → 4)

Checklists and breaking changes. Source: https://vitest.dev/guide/migration

## Target stack

| Field | Value |
|---|---|
| Package | **`vitest@^4`** (snapshot **4.1.10**) |
| Node | `^20 \|\| ^22 \|\| >=24` |
| Vite peer | `^6 \|\| ^7 \|\| ^8` |
| Align | All `@vitest/*` at the same version |

V3 archive: https://v3.vitest.dev/ (`vitest@3` / tag `V3`). V5 is **beta** — do not treat as current stable.

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
| `JEST_WORKER_ID` | `VITEST_POOL_ID` / `VITEST_WORKER_ID` |
| Space-joined titles | Joined with ` > ` |
| Types `jest.Mock` | `import type { Mock } from 'vitest'` |

Install path: `bun add -d vitest` (+ coverage/DOM/browser packages as needed). Share Vite aliases/plugins via `vitest/config` `defineConfig` / `mergeConfig`.

Stubborn CJS deps: `server.deps.inline: ['pkg']`.

## Migrating to Vitest 4

### Requirements

- Drop Node 18.
- Ensure Vite >= 6 (7/8 OK).

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

### Coverage

- Remove `coverage.all`, `coverage.extensions`, `ignoreEmptyLines`, `experimentalAstAwareRemapping`.
- Set explicit `coverage.include` for “all source files” style reports.

### Browser

```ts
// v3
browser: { provider: 'playwright', instances: [{ browser: 'chromium', launch: {…} }] }

// v4
import { playwright } from '@vitest/browser-playwright'
browser: {
  provider: playwright({ launchOptions: {…} }),
  instances: [{ browser: 'chromium' }],
}
```

```ts
// v3
import { page } from '@vitest/browser/context'
// v4
import { page } from 'vitest/browser'
```

### Mocks / API

- `test`/`describe` options are the **2nd** argument (not 3rd).
- `restoreAllMocks` restores `spyOn` spies only (not automocks).
- Constructor/`new` mock behavior improved — verify custom class mocks.
- Nested `vi.mock` inside `describe` will hard-error in v5 — fix now.

### Snapshots

- Custom elements print shadow roots by default (`printShadowRoot: false` to revert).

### Pools

Prefer default `forks` after upgrade; only switch to `threads` after validating native dependencies.

## Checklist

1. Bump Node + Vite + `vitest@^4` + matching `@vitest/*`.
2. Rename `workspace` → `projects`; flatten pool options.
3. Fix coverage `include`; delete removed coverage keys.
4. Convert browser providers to factories; update `vitest/browser` imports.
5. Fix `test(name, fn, options)` call sites.
6. Run `vitest run` + coverage + (if used) browser project headless.
7. Update Jest leftovers (`jest.*`, `done` callbacks, globals assumptions).

## What stayed familiar

- `describe` / `it` / `expect` / snapshots
- Vite-powered transforms and shared config model
- Watch mode DX and smart invalidation
- Optional DOM environments via happy-dom/jsdom
