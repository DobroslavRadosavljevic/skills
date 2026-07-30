# Config, CLI, and Test API

Configuration resolution, CLI flags, suite/test APIs, environments, and setup.

## Config resolution

1. Dedicated **`vitest.config.*`** → Vitest options apply; **Vite config is ignored**
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

| Option | Default (v4) |
|---|---|
| `include` | `**/*.{test,spec}.?(c|m)[jt]s?(x)` |
| `environment` | `node` |
| `globals` | `false` |
| `pool` | `forks` |
| `fileParallelism` | `true` |
| `clearMocks` / `mockReset` / `restoreMocks` | `false` |
| `exclude` | mainly `**/node_modules/**` + `**/.git/**` (simplified vs v3) |

Prefer `test.dir` to scope discovery over huge exclude lists. v4 renamed `workspace` → **`projects`**.

## CLI

| Command | Role |
|---|---|
| `vitest` | Watch in TTY; often `run` under CI/non-TTY |
| `vitest run` | Single run (CI / agents) |
| `vitest related <files>` | Tests covering files (static imports); add `--run` for hooks |
| `vitest bench` | Benchmarks only (experimental) |
| `vitest list` | List matching tests |
| `vitest init browser` | Scaffold browser setup |

Useful flags:

```sh
-t / --testNamePattern
-u / --update
-c / --config
--environment node|jsdom|happy-dom
--globals
--changed [since]
--coverage
--reporter default|verbose|dot|json|junit|github-actions|agent|minimal|…
--passWithNoTests
--bail <n>
--testTimeout / --hookTimeout
--maxWorkers <n|%>
--fileParallelism / --no-file-parallelism
--pool forks|threads|vmForks|vmThreads
--isolate / --no-isolate
--allowOnly
--typecheck / --typecheck.only
--project <name>          # repeatable
--shard=1/3
--browser[=chromium]
```

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

### Options signature (v4)

```ts
it('name', { timeout: 10_000, retry: 2, tags: ['slow'] }, async () => {})
// NOT: it('name', fn, { timeout })  — removed in v4
```

Also: `test.extend` fixtures; `onTestFinished` / `onTestFailed`; `aroundEach` / `aroundAll` (4.1+).

### Expect essentials

- Equality: `toBe`, `toEqual`, `toStrictEqual`
- Async: **always** `await expect(p).resolves…` / `.rejects…`
- Soft: `expect.soft`
- Poll: `expect.poll`
- Extend: `expect.extend`
- Assertions count: `expect.assertions(n)`

Docs: https://vitest.dev/api/expect

### Concurrency

- **Files:** parallel via pool workers (`fileParallelism`, `maxWorkers`)
- **Tests in a file:** sequential by default; `.concurrent` / `sequence.concurrent` for parallel within the same worker (helps I/O waits)

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

CSS/asset import errors from deps → `server.deps.inline: ['pkg']`.

## setupFiles vs globalSetup

| | setupFiles | globalSetup |
|---|---|---|
| When | Before each test file | Once before workers |
| Process | Same as tests | Main thread, isolated |
| Vitest APIs | Yes | Limited — use `provide`/`inject` |
| Teardown | afterEach/afterAll in files | Exported teardown / return fn |

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
  clearMocks: false,
  mockReset: false,
  restoreMocks: false,
  unstubEnvs: false,
  unstubGlobals: false,
  sequence: { concurrent: false, hooks: 'stack' },
  css: false, // or true / options
}
```
