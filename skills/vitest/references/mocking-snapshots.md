# Mocking and Snapshots

`vi` APIs, module mocks, timers/env stubs, and snapshot testing.

## vi essentials

```ts
import { vi, expect, it } from 'vitest'

const fn = vi.fn((x: number) => x + 1)
fn(1)
expect(fn).toHaveBeenCalledWith(1)

const obj = { ping: () => 'pong' }
const spy = vi.spyOn(obj, 'ping').mockReturnValue('spy')
```

| API | Role |
|---|---|
| `vi.fn` | Mock function; class mocks keep the implementation prototype |
| `vi.spyOn` | Spy on object method / export |
| `vi.mock` / `vi.unmock` | **Hoisted** module mock — **top-level only** (throws if nested) |
| `vi.doMock` / `vi.doUnmock` | Not hoisted — call anywhere (`using` auto-unmocks) |
| `vi.hoisted(() => …)` | Values available to hoisted `vi.mock` factories — top-level only |
| `vi.when(spy)` | Per-argument `calledWith` / `thenReturn` / `thenResolve`… |
| `vi.mocked` | Typed mock helper |
| `vi.importActual` / `vi.importMock` | Original / auto-mocked module |
| `vi.resetModules` | Clear module cache |
| `vi.clearAllMocks` | Clear call history (also the `clearMocks` default) |
| `vi.resetAllMocks` | Clear history + reset impl |
| `vi.restoreAllMocks` | Restore **`spyOn`** spies (not automocks) |
| `vi.useFakeTimers` / `useRealTimers` | Fake timers (`Temporal` included when present) |
| `vi.setSystemTime` | Mock `Date` and `Temporal.Now` |
| `vi.stubEnv` / `unstubAllEnvs` | `process.env` / `import.meta.env` |
| `vi.stubGlobal` / `unstubAllGlobals` | Globals |

Docs: https://vitest.dev/api/vi · https://vitest.dev/guide/mocking

`clearMocks` defaults to **`true`**: history is wiped before each test; implementations stay. Tests that record calls in `beforeAll` / module scope must assert in that hook, move the call into the test, or set `clearMocks: false`.

## Module mocks and hoisting

`vi.mock`, `vi.unmock`, and `vi.hoisted` are rewritten to the **top of the file**. Factories cannot close over ordinary locals. Nested calls **throw**.

```ts
import { vi } from 'vitest'

const { userId } = vi.hoisted(() => ({ userId: 'u1' }))

vi.mock('./db', async (importOriginal) => {
  const actual = await importOriginal<typeof import('./db')>()
  return {
    ...actual,
    getUser: vi.fn(async () => ({ id: userId })),
  }
})
```

Type-friendly form:

```ts
vi.mock(import('./db.js'), () => ({ getUser: vi.fn() }))
```

Keep the original implementation while tracking calls:

```ts
vi.mock('./calculator.ts', { spy: true })
```

Notes:

- Prefer returning `{ default, named }` explicitly when replacing modules (Jest factories that return “default only” differ).
- Internal calls inside the real module are **not** redirected by mocking its exports from the outside.
- Automocked getters often return `undefined` until configured.
- Browser automocks without a factory now return **stubs** (`undefined` by default), not the real implementation. Use `{ spy: true }` or a factory if a test relied on the old leak-through.
- `using _ = vi.doMock('mod')` unmocks when the block exits (Explicit Resource Management).

## `vi.when` (5.0)

```ts
const findById = vi.fn()

vi.when(findById)
  .calledWith(1)
  .thenResolve({ id: 1, name: 'Ella' })
  .calledWith(expect.any(Number))
  .thenReject(new Error('not found'))

await expect(findById(1)).resolves.toEqual({ id: 1, name: 'Ella' })
```

- Matchers: deep equality + `expect.any()` etc.
- `thenReturn` / `thenThrow` / `thenResolve` / `thenReject` (+ `Once` / `{ times }`).
- Unmatched calls: `onUnmatched: 'passthrough' | 'throw' | fn` (default passthrough).
- `expect(whenChain).toHaveBeenExhausted()` when every registered behavior was consumed.
- `using w = vi.when(spy)…` restores the original implementation on block exit.

## Class mocks

`vi.fn(Dog)` / `spyOn` class / `.mockImplementation(class …)` now chain `prototype` to the implementation. Instances keep methods and pass `instanceof Dog`. Arrow-function implementations still throw “is not a constructor”. `mockReset` reverts the chain.

## Timers

```ts
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-01-01'))

vi.advanceTimersByTime(1000)
await vi.runAllTimersAsync()

vi.useRealTimers()
```

When `Temporal` exists (native or polyfill), fake timers and `setSystemTime` mock `Temporal.Now` as well. Keep it native with `toNotFake: ['Temporal']`.

Configure defaults via `test.fakeTimers` when many suites need the same policy.

## Env and globals

```ts
vi.stubEnv('VITE_API', 'http://localhost')
vi.stubGlobal('fetch', vi.fn())

// restore:
vi.unstubAllEnvs()
vi.unstubAllGlobals()
```

Assigning `import.meta.env.FOO = …` does not auto-reset. Prefer `stubEnv` + config `unstubEnvs: true` or explicit restore in `afterEach`.

Config helpers: `clearMocks`, `mockReset`, `restoreMocks`, `unstubEnvs`, `unstubGlobals` — be careful with **concurrent** tests (sibling state can be wiped).

## Snapshots

```ts
expect(value).toMatchSnapshot()
expect(value).toMatchInlineSnapshot(`"ok"`)
await expect(html).toMatchFileSnapshot('./out.html')
```

| API | Behavior |
|---|---|
| `toMatchSnapshot` | File under `__snapshots__` |
| `toMatchInlineSnapshot` | Rewrites source |
| `toMatchFileSnapshot` | Raw file path (async — **must await**) |
| `toMatchScreenshot` | Browser visual regression |
| `toMatchAriaSnapshot` / inline | ARIA tree |

Update: `vitest -u` / watch key `u`. In CI (`CI` truthy), snapshots are not written — mismatches fail.

Inspected values and `test.each` / `test.for` titles use **pretty-format**. String `$` placeholders are no longer quoted (`case a1`, not `case 'a1'`).

### Concurrent + snapshots

```ts
it.concurrent('a', async ({ expect }) => {
  expect(await render()).toMatchSnapshot()
})
```

Use the **local** `expect` from the test context so assertions attach to the right test.

### Serializers

```ts
expect.addSnapshotSerializer({
  test: val => val instanceof MyClass,
  serialize: (val, config, indentation, depth, refs, printer) =>
    printer(val.toJSON(), config, indentation, depth, refs),
})
```

Or config: `snapshotSerializers: ['./serializer.ts']`, plus `snapshotFormat`, `resolveSnapshotPath` (root-only).

Custom elements print **shadow root** by default (`printShadowRoot: false` to revert).

Docs: https://vitest.dev/guide/snapshot
