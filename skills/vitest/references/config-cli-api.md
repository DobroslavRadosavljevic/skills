# Config, CLI, and Test API

Configuration resolution, CLI flags, suite/test APIs, environments, and setup.

## Config resolution

1. Dedicated **`vitest.config.*`** in the **current working directory** (not parent dirs) → Vitest options apply; **Vite config is ignored**
2. Else `--config <path>`
3. Else **`vite.config.*`** with `test: { … }`
4. Or gate in Vite config via `process.env.VITEST` / mode `test`

Supports JS/TS config extensions — not JSON.

```ts
import { defineConfig, configDefaults, mergeConfig } from 'vitest/config'

export default defineConfig({
  // Vite: plugins, resolve, define — TOP LEVEL
  test: {
    // Vitest options
  },
})
```

If using Vite’s `defineConfig`, add:

```ts
/// <reference types="vitest/config" />
```

### Defaults agents should know

| Option | Default (v5) |
|---|---|
| `include` | `**/*.{test,spec}.?(c|m)[jt]s?(x)` |
| `environment` | `node` |
| `globals` | `false` |
| `pool` | `forks` |
| `fileParallelism` | `true` |
| `clearMocks` | **`true`** |
| `mockReset` / `restoreMocks` | `false` |
| `exclude` | mainly `**/node_modules/**` + `**/.git/**` |
| `fsModuleCache` | `false` |
| `sharedViteServer` | `true` (inline projects) |

Prefer `test.dir` to scope discovery over huge exclude lists. `workspace` → **`projects`**. Inline projects default to **`extends: true`**.

## CLI

| Command | Role |
|---|---|
| `vitest` | Watch in TTY; often `run` under CI/non-TTY |
| `vitest run` | Single run (CI / agents) |
| `vitest related <files>` | Tests covering files (static imports); add `--run` for hooks |
| `vitest bench` | Benchmark files only (`*.bench.*` / `benchmark.include`) |
| `vitest list` | List matching tests (**static parse** by default; `--no-static-parse` to execute) |
| `vitest doctor` | Measure pool / isolate / vm / `fsModuleCache` / happy-dom alternatives |
| `vitest init browser` | Scaffold browser setup |

Useful flags:

```sh
-t / --testNamePattern          # matches "suite > test" full name
-u / --update
-c / --config
-p / --project <name>           # repeatable; supports * and !exclusions
--environment node|jsdom|happy-dom
--globals
--changed [since]
--coverage
--reporter default|verbose|dot|json|junit|github-actions|agent|minimal|…
--passWithNoTests
--bail <n>
--repeats <n>                   # run every test n extra times (flake hunt)
--testTimeout / --hookTimeout
--maxWorkers <n|%>
--fileParallelism / --no-file-parallelism
--pool forks|threads|vmForks|vmThreads
--isolate / --no-isolate
--allowOnly
--typecheck / --typecheck.only
--shard=1/3
--browser[=chromium]
--fsModuleCache / --clearCache
--detectAsyncLeaks              # slow; debug only
```

`--merge-reports` reads blobs from `.vitest/blob/` by default and supports non-sharded multi-environment runs.

Docs: https://vitest.dev/guide/cli

## Test API

```ts
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  test,
} from 'vitest'

test === it

describe('suite', () => {
  beforeEach(() => {})
  afterEach(() => {})

  it('works', () => {
    expect(true).toBe(true)
  })

  it.skip('later', () => {})
  it.todo('idea')
  it.concurrent('parallel io', async ({ expect }) => {
    // use context expect with concurrent + snapshots
    expect(1).toBe(1)
  })
})
```

### Options signature

```ts
it('name', { timeout: 10_000, retry: 2, tags: ['slow'] }, async () => {})
// NOT: it('name', fn, { timeout })  — removed in v4
```

Opt out of inherited concurrency with `{ concurrent: false }` — **`test.sequential` / `describe.sequential` are removed**.

Also: `test.extend` fixtures; `onTestFinished` / `onTestFailed`; `aroundEach` / `aroundAll`.

### Expect essentials

- Equality: `toBe`, `toEqual`, `toStrictEqual`
- Async: **always** `await expect(p).resolves…` / `.rejects…` (unawaited **fails**)
- Soft: `expect.soft`
- Poll: `await expect.poll(async ({ signal }) => …, { timeout }).toBe(…)` — times out by **failing**; cancel with `AbortSignal`
- Extend: `expect.extend`
- Assertions count: `expect.assertions(n)`
- Custom matcher types: `interface Matchers<R, T> { … }` (`R` = return, `T` = received). Do **not** augment only `jest.Matchers`.

`toThrow('')` is a substring match (matches every message). Use `/^$/` for an empty message.

Docs: https://vitest.dev/api/expect

### Concurrency

- **Files:** parallel via pool workers (`fileParallelism`, `maxWorkers`)
- **Tests in a file:** sequential by default; `.concurrent` / `sequence.concurrent` for parallel within the same worker (helps I/O waits)

`test.for` / `test.each` `$` placeholders no longer wrap strings in quotes; truncate with `taskTitleValueFormatTruncate` (default 40).

## Environments

| Name | Package | Notes |
|---|---|---|
| `node` | — | Default |
| `jsdom` | `jsdom` | Broader DOM |
| `happy-dom` | `happy-dom` | Faster, fewer APIs |
| `edge-runtime` | `@edge-runtime/vm` | Edge-like |

```ts
test: {
  environment: 'happy-dom',
  environmentOptions: { /* provider-specific */ },
}
```

Browser Mode is separate (`test.browser`) — not an `environment` string.

Assignments to `globalThis` / `window` in jsdom/happy-dom now update the **underlying window** (e.g. `innerWidth` can affect `matchMedia`).

CSS/asset import errors from deps → `server.deps.inline: ['pkg']`.

Custom environments: `populateGlobal` `originals` map holds **property descriptors** — restore with `Object.defineProperty`.

## setupFiles vs globalSetup

| | setupFiles | globalSetup |
|---|---|---|
| When | Before each test file | Once before workers |
| Process | Same as tests | Main thread, isolated |
| Vitest APIs | Yes | Limited — use `provide`/`inject` |
| Teardown | afterEach/afterAll in files | Exported teardown / return fn |

Root `globalSetup` is **not** inherited by inline projects (it already runs once). Non-root extended configs still inherit `globalSetup`.

## globals

```ts
test: { globals: true }
```

```json
{ "compilerOptions": { "types": ["vitest/globals"] } }
```

Prefer explicit imports unless Testing Library cleanup (or similar) requires globals.

## TypeScript / typecheck

- Runtime TS via Vite — **no typecheck** on normal runs.
- Optional `typecheck` (docs: experimental): `*.test-d.ts`, `expectTypeOf` / `assertType`.
- Path aliases: configure Vite `resolve.alias` (or a paths plugin). Vitest does **not** auto-apply `tsconfig` `paths` alone.

## Useful config knobs

```ts
test: {
  testTimeout: 5_000,
  hookTimeout: 10_000,
  retry: 0,
  bail: 0,
  passWithNoTests: false,
  allowOnly: !process.env.CI,
  clearMocks: true, // v5 default
  mockReset: false,
  restoreMocks: false,
  unstubEnvs: false,
  unstubGlobals: false,
  sequence: { concurrent: false, hooks: 'stack' },
  css: false, // or true / options
  fsModuleCache: false, // persist transforms across processes
  injectCjsGlobals: true, // module/exports/require/__dirname in ESM
  detectAsyncLeaks: false, // slow; debug leftover timers
}
```

`experimental.diagnostics` (default on) prints pool/isolate/`fsModuleCache` hints after a run. Disable with `experimental: { diagnostics: false }` if the noise is unwanted. Measure instead of guessing: `vitest doctor`.
