# Testing With `@effect/vitest`

Deep guide for testing Effect **4.x** programs under Vitest. Snapshot: `@effect/vitest@4.0.0` with `effect@4.0.0`, peer **`vitest >=5.0.0 <6.0.0`** (Vitest 5 needs Node `^22.12 || ^24 || >=26` and Vite 6.4+ within majors 6–8).

## Install (Effect v4)

```sh
bun add effect
bun add -d @effect/vitest vitest@^5
```

Keep `effect` and `@effect/vitest` on the **same** version (`4.0.0`). npm `latest` is v4 since 2026-10-01. `@effect/vitest@0.30.x` is the Effect v3 line; the `@rc` / `@beta` tags are frozen prereleases — do not install them.

**Gotcha:** `@effect/vitest@4.0.0` does not work with Vitest 4. Upgrading also means applying the Vitest 5 changes below.

## How it works

Import Vitest’s API from `@effect/vitest` (re-exports Vitest) and use the Effect-enhanced `it`:

```ts
import { describe, expect, it, layer } from "@effect/vitest"
import { Effect } from "effect"
```

Internally (conceptual):

```ts
// Conceptual — from package internals
TestEnv = Layer.mergeAll(TestConsole.layer, TestClock.layer())

it.effect  → Effect.scoped + Effect.provide(TestEnv) → Effect.exit → Effect.runPromise({ signal })
it.live    → Effect.scoped                              → Effect.exit → Effect.runPromise({ signal })
```

Implications:

1. **`it.effect` already provides a `Scope`** — do **not** also wrap with `Effect.scoped`. `acquireRelease` typechecks without a separate scoped runner.
2. **Test environment** is `TestClock` + `TestConsole` from **`effect/testing`**. **`it.effect` suppresses logs**; **`it.live`** uses the live clock and shows logs.
3. Vitest’s abort **signal** is forwarded to `Effect.runPromise`. Default timeout **5000**.
4. Failed `Cause`s are pretty-logged before the test fails.
5. Use **`it.effect`**, not `test.effect`. `TestClock.adjust("1000 millis")` or milliseconds. Fork sleepers first.

## Core runners

| API | Environment | Scope | Use for |
|---|---|---|---|
| `it.effect` | TestClock + TestConsole | Yes | Unit tests, time control, captured console |
| `it.live` | Live Effect services | Yes | Real clock / real I/O timing |
| `it.flakyTest(effect, timeout?)` | (wrapper) | Retries under sandbox | Non-deterministic effects |
| `layer(L)(…)` / `it.layer(L)(…)` | Shared layer (+ TestEnv by default) | Suite-scoped | Expensive shared deps |

Modifiers on `it.effect` / `it.live`: `.skip`, `.skipIf`, `.runIf`, `.only`, `.each`, `.fails`, `.prop`.

### Stale names — do not use for Effect Scope

| Name | Reality in v4 |
|---|---|
| `it.scoped` | **Vitest fixtures** API — not Effect Scope |
| `it.scopedLive` | **Removed** — use `it.live` |

## Writing tests

### Success path

```ts
import { expect, it } from "@effect/vitest"
import { Effect } from "effect"

function divide(a: number, b: number) {
  if (b === 0) return Effect.fail("Cannot divide by zero")
  return Effect.succeed(a / b)
}

it.effect("divides", () =>
  Effect.gen(function*() {
    const result = yield* divide(4, 2)
    expect(result).toBe(2)
  }))
```

Put assertions **inside** the Effect. The runner fails the test if the Effect fails/dies.

### Success and failure as `Exit`

```ts
import { expect, it } from "@effect/vitest"
import { Effect, Exit } from "effect"

it.effect("failure as Exit", () =>
  Effect.gen(function*() {
    const result = yield* Effect.exit(divide(4, 0))
    expect(result).toStrictEqual(Exit.fail("Cannot divide by zero"))
  }))
```

### Utils for Option / Result / Exit

```ts
import * as U from "@effect/vitest/utils"
import { Exit, Option, Result } from "effect"

U.assertSome(Option.some(1), 1)
U.assertNone(Option.none())
U.assertSuccess(Result.succeed(1), 1)
U.assertFailure(Result.fail("e"), "e")
U.assertExitSuccess(Exit.succeed(1), 1)
U.assertExitFailure(exit, expectedCause)
U.assertEquals(a, b) // Equal.equals, with deepStrictEqual fallback for diffs
```

Note: `import { assert } from "@effect/vitest"` is **Vitest/Chai assert**, not these helpers.

v3 → v4 utils renames:

| v3 | v4 |
|---|---|
| `assertLeft` / `assertRight` (Either) | `assertSuccess` / `assertFailure` (**Result**) |
| `assertSuccess` / `assertFailure` (Exit) | `assertExitSuccess` / `assertExitFailure` |

### TestClock

```ts
import { it } from "@effect/vitest"
import { Clock, Effect, Fiber } from "effect"
import { TestClock } from "effect/testing"

it.effect("clock starts at 0", () =>
  Effect.gen(function*() {
    expect(yield* Clock.currentTimeMillis).toBe(0)
  }))

it.effect("adjust time", () =>
  Effect.gen(function*() {
    yield* TestClock.adjust("1000 millis")
    expect(yield* Clock.currentTimeMillis).toBe(1000)
  }))
```

**Import `TestClock` / `TestConsole` from `effect/testing`**, not from `"effect"` (v4 does not re-export them there).

Time-dependent sleeps: **fork first**, then `adjust` — otherwise the test waits on a sleep that never advances:

```ts
it.effect("timeout", () =>
  Effect.gen(function*() {
    const fiber = yield* Effect.sleep("5 minutes").pipe(
      Effect.as("done"),
      Effect.forkChild
    )
    yield* TestClock.adjust("5 minutes")
    expect(yield* Fiber.join(fiber)).toBe("done")
  }))
```

Use `it.live` when you intentionally want the real system clock.

### Logging / console

- `it.effect` uses `TestConsole` — default console logging is captured, not dumped like live.
- To see logs under `it.effect`, provide a logger (e.g. `Logger.pretty`) or switch to `it.live`.
- Inspect captured lines via `TestConsole` APIs from `effect/testing`.

### Scoped resources

```ts
import { it } from "@effect/vitest"
import { Effect } from "effect"

const resource = Effect.acquireRelease(
  Effect.succeed("db"),
  () => Effect.void
)

// OK — it.effect already scopes
it.effect("manages resource", () =>
  Effect.gen(function*() {
    const r = yield* resource
    expect(r).toBe("db")
  }))
```

### Flaky tests

```ts
import { it } from "@effect/vitest"
import { Effect, Random } from "effect"

const flaky = Effect.gen(function*() {
  if (yield* Random.nextBoolean) {
    return yield* Effect.fail("random")
  }
})

it.effect("retries until success or timeout", () =>
  it.flakyTest(flaky, "5 seconds"))
```

Default timeout is **30 seconds**. Internals retry under a sandbox with a bounded schedule — do **not** use this to hide broken determinism in unit tests; prefer `TestClock` / seeded randomness.

### Property tests

`it.effect.prop` / `it.prop` / top-level `prop` take **Schemas or `Arbitrary` values** (root `effect/Arbitrary`). `effect/testing/FastCheck` was removed in 4.0 — there is no `fast-check` dependency.

```ts
import { assert, it } from "@effect/vitest"
import { Arbitrary, Effect, Schema } from "effect"

it.effect.prop("sum is commutative", [Schema.Int, Schema.Int], ([a, b]) =>
  Effect.sync(() => assert.strictEqual(a + b, b + a)))

it.prop(
  "non-empty arrays",
  [Arbitrary.array(Arbitrary.schema(Schema.String), { minLength: 1 })],
  ([xs]) => {
    assert.isTrue(xs.length > 0)
  },
  { arbitrary: { runs: 200, seed: 42 } }
)
```

- A property fails (and shrinks) when the callback returns `false`, throws, or the Effect fails/dies (non-interruption). Returning anything else, including `void`, passes.
- Per-test options: `{ arbitrary: { runs, size, seed, maxShrinks, maxDiscards, replay } }` (replaces `fastCheck` options). Defaults: `Arbitrary.configureGlobal(...)`.
- The Vitest `timeout` interrupts generation/evaluation/shrinking; finalizers run; it is reported as a timeout, not a falsification. A non-returning synchronous callback cannot be preempted.

### Vitest fixtures

Pass a `test.extend(...)` test to `makeMethods` to get Effect helpers that receive fixtures:

```ts
import { makeMethods, test } from "@effect/vitest"

const it = makeMethods(
  test.extend("db", { scope: "file" }, async ({}, { onCleanup }) => {
    const db = await openDb()
    onCleanup(() => db.close())
    return db
  })
)

it.effect("query", ({ db }) => Effect.promise(() => db.query("select 1")))
```

Destructure the fixtures you use (Vitest rejects `(ctx) =>` once fixtures exist). Build `makeMethods` from `test` / `test.extend`, not from the `it` a `describe` callback receives. Property tests cannot request fixtures.

## Layers in tests

```ts
import { expect, layer } from "@effect/vitest"
import { Context, Effect, Layer } from "effect"

class Foo extends Context.Service<Foo, string>()("Foo") {
  static Live = Layer.succeed(this, "foo")
}

class Bar extends Context.Service<Bar, string>()("Bar") {
  static Live = Layer.effect(
    this,
    Effect.map(Foo, () => "bar")
  )
}

layer(Foo.Live)("foo suite", (it) => {
  it.effect("sees Foo", () =>
    Effect.gen(function*() {
      expect(yield* Foo).toEqual("foo")
    }))

  it.layer(Bar.Live)("nested", (it) => {
    it.effect("sees Foo + Bar", () =>
      Effect.gen(function*() {
        expect(yield* Foo).toEqual("foo")
        expect(yield* Bar).toEqual("bar")
      }))
  })
})
```

Options:

```ts
layer(MyLive, {
  memoMap?: Layer.MemoMap
  timeout?: Duration.Input          // hook timeout
  excludeTestServices?: boolean     // default false → merge TestEnv
  concurrent?: boolean              // 4.0: false serializes the named suite, true runs it concurrently; omit to inherit
})
```

In concurrent tests use the callback's `ctx.expect` so snapshots and assertion counts belong to the right test.

### Sharing vs isolation

| Pattern | Behavior |
|---|---|
| `layer(L)("name", …)` | Builds **once** (`beforeAll`), **shares** across tests, closes in `afterAll` |
| Nested `it.layer` | Forks memo map, merges onto parent |
| Inside layer block | `it.effect` / `it.layer` / `flakyTest` / `prop` — **no `it.live`** |

**Shared mutable state leaks across tests** (e.g. a `Ref` mutated in test A is visible in test B). That is intentional for expensive read-mostly deps — not for isolation.

For **per-test isolation**, provide inside the test:

```ts
it.effect("isolated", () =>
  myProgram.pipe(Effect.provide(MyService.Live, { local: true })))
```

or construct a **fresh** layer per test (avoid a single shared `MemoMap`).

## Good patterns

1. Install matching v4 versions: `effect@4.x` + `@effect/vitest@4.x` + `vitest@^5`.
2. Prefer `it.effect` + in-body `expect` / `Effect.exit`.
3. Control time with `TestClock` from `effect/testing`; fork before `adjust`.
4. Use `it.effect` for scoped resources (already scoped).
5. Use shared `layer()` only for expensive, preferably immutable/read-only services.
6. Isolate mutable services with per-test `Effect.provide(layer, { local: true })` or `Layer.fresh`.
7. Use `it.live` only when live clock/network/time is required.
8. Use `@effect/vitest/utils` for Option/Result/Exit assertions.
9. Keep Vitest config normal (`vitest run` in CI); Effect runners compose with standard Vitest.

## Bad patterns

| Anti-pattern | Why |
|---|---|
| `@effect/vitest@0.30.x` in a v4 repo | Effect **v3** package — use `@effect/vitest@4` |
| `@effect/vitest@4` with `vitest@4` | Peer mismatch — Vitest 5 required |
| `test.sequential` / `{ sequential: true }` | Removed in Vitest 5 — use `{ concurrent: false }` |
| Top-level `bench` import | Removed in Vitest 5 — use the `bench` test-context fixture |
| Unawaited async assertions | Vitest 5 requires awaiting them |
| `effect/testing/FastCheck` | Removed — use `Arbitrary` / Schemas |
| `import { TestClock } from "effect"` | Not exported — use `effect/testing` |
| `test.effect(...)` | Not wired — use `it.effect` |
| `it.scoped` / `it.scopedLive` for Effect Scope | Wrong API in v4 (`scoped` is Vitest fixtures / removed) |
| Assuming `layer()` isolates mutable state | State is **shared** across tests |
| Live `Effect.sleep` in unit tests | Slow and flaky — use TestClock |
| `adjust` without forking sleepers | Deadlock / hang |
| Relying on `addEqualityTesters()` | Often a no-op stub — verify installed types |
| v3 utils (`assertLeft`/`assertRight`, Exit-named `assertSuccess`) | Renamed for Result/Exit |
| Mixing `4.0.0-rc.N` / `4.0.0` across packages | Peer mismatch |
| Using `it.flakyTest` to paper over race bugs | Hides nondeterminism instead of fixing it |

## Public surface (4.0.0)

### `@effect/vitest`

- Re-exports Vitest (`describe`, `expect`, `it`, `vi`, hooks, …)
- `it.effect`, `it.live`, `it.layer`, `it.flakyTest`, `it.prop` (and standalone `effect`, `live`, `layer`, `flakyTest`, `prop`)
- `makeMethods(test | test.extend(...))` (fixture-aware), `describeWrapped`
- `addEqualityTesters` (stub)
- `Vitest` namespace types

### `@effect/vitest/utils`

`fail`, `deepStrictEqual`, `notDeepStrictEqual`, `strictEqual`, `assertEquals`, `doesNotThrow`, `throws`, `throwsAsync`, `assertInstanceOf`, `assertTrue`, `assertFalse`, `assertInclude`, `assertMatch`, `assertDefined`, `assertUndefined`, `assertNone`, `assertSome`, `assertSuccess`, `assertFailure`, `assertExitSuccess`, `assertExitFailure`

## Migration from `@effect/vitest` v3 (`0.30.x`)

| v3 | v4 |
|---|---|
| `it.effect` = TestServices, often no Scope | `it.effect` = TestClock+TestConsole + **Scope** |
| `it.scoped` / `it.scopedLive` | Removed — use `it.effect` / `it.live` |
| `TestContext` / `TestServices` from `effect` | `TestClock` / `TestConsole` from `effect/testing` |
| Fiber interrupt on test end | `runPromise` + AbortSignal |
| `addEqualityTesters` registers Equal | Empty stub |
| Either left/right utils | Result success/failure utils |
| Exit helpers named `assertSuccess` | `assertExitSuccess` / `assertExitFailure` |
| Vitest peer `^3.2` | `>=5 <6` (4.0.0; RCs used `^4.1`) |
| `FastCheck` arbitraries | `Arbitrary` / Schemas |

## Sources

- Package README: https://github.com/Effect-TS/effect/blob/main/packages/vitest/README.md
- Tagged: https://github.com/Effect-TS/effect/blob/effect@4.0.0/packages/vitest/README.md (includes “Migrating to Vitest 5”)
- Vitest 5 migration: https://vitest.dev/guide/migration/
- Sources: `packages/vitest/src/index.ts`, `utils.ts`, `internal/internal.ts`
- TestClock site docs are often v3-leaning — prefer `effect/testing` + this package for v4
- npm: https://www.npmjs.com/package/@effect/vitest
