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
| `vi.fn` | Mock function (v4: better `new` / constructor support) |
| `vi.spyOn` | Spy on object method / export |
| `vi.mock` / `vi.unmock` | **Hoisted** module mock |
| `vi.doMock` / `vi.doUnmock` | Not hoisted — call anywhere |
| `vi.hoisted(() => …)` | Values available to hoisted `vi.mock` factories |
| `vi.mocked` | Typed mock helper |
| `vi.importActual` / `vi.importMock` | Original / auto-mocked module |
| `vi.resetModules` | Clear module cache |
| `vi.clearAllMocks` | Clear call history |
| `vi.resetAllMocks` | Clear history + reset impl |
| `vi.restoreAllMocks` | Restore **`spyOn`** spies (v4: not automocks) |
| `vi.useFakeTimers` / `useRealTimers` | Fake timers |
| `vi.setSystemTime` | Mock `Date` |
| `vi.stubEnv` / `unstubAllEnvs` | `process.env` / `import.meta.env` |
| `vi.stubGlobal` / `unstubAllGlobals` | Globals |

Docs: https://vitest.dev/api/vi · https://vitest.dev/guide/mocking

## Module mocks and hoisting

`vi.mock`, `vi.unmock`, and `vi.hoisted` are rewritten to the **top of the file**. Factories cannot close over ordinary locals.

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

Notes:

- Prefer returning `{ default, named }` explicitly when replacing modules (Jest factories that return “default only” differ).
- Internal calls inside the real module are **not** redirected by mocking its exports from the outside.
- Do not nest `vi.mock` inside `describe` (warn now; **error in v5**).
- Automocked getters often return `undefined` until configured (v4).

## Timers

```ts
vi.useFakeTimers()
vi.setSystemTime(new Date('2026-01-01'))

vi.advanceTimersByTime(1000)
await vi.runAllTimersAsync()

vi.useRealTimers()
```

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
| `toMatchFileSnapshot` | Raw file path (async) |
| `toMatchScreenshot` | Browser visual regression |
| `toMatchAriaSnapshot` / inline | ARIA tree (experimental, 4.1.4+) |

Update: `vitest -u` / watch key `u`. In CI (`CI` truthy), snapshots are not written — mismatches fail.

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

v4: custom elements print **shadow root** by default (`printShadowRoot: false` to revert).

Docs: https://vitest.dev/guide/snapshot
