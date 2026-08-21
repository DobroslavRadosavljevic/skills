# Setup and core use

## Packages

```sh
bun add effect@rc
bun add -d @effect/vitest@rc vitest
```

Keep every `@effect/*` on the **same** `4.0.0-rc.N` as `effect`. npm `latest` is v3 (`effect@3.x`, `@effect/vitest@0.30.x`).

Requirements (from Effect README, rc.111):

- TypeScript **5.9+** (`strict: true`). TypeScript 7 recommended for Effect’s TS tooling.
- Node.js 18+ generally; `@effect/sql-sqlite-node` needs Node **22.16+**.

## Imports

```ts
import { Context, Effect, Layer, Schema } from "effect"
import { HttpClient } from "effect/unstable/http"
import { TestClock } from "effect/testing"
```

Direct modules (`import * as Effect from "effect/Effect"`) are also valid. Match the repo. Unstable paths are explicit.

## Constructors

- `Effect.succeed` / `Effect.fail` / `Effect.die`
- `Effect.sync` — sync side effects
- `Effect.promise` — reject → **defect**
- `Effect.tryPromise({ try, catch })` — reject → typed `E`
- `Effect.callback` (v3 `Effect.async`)

Prefer typed failures for domain/boundary errors.

## `Effect.gen` and `Effect.fn`

Sequential logic:

```ts
const program = Effect.gen(function*() {
  const db = yield* Database
  return yield* db.query("select 1")
})
```

Named functions — **`Effect.fn("sameNameAsFunction")`**, extra combinators as extra arguments, **no `.pipe` on `Effect.fn`**:

```ts
export const loadUser = Effect.fn("loadUser")(
  function*(id: string): Effect.fn.Return<User, AppError> {
    return yield* repo.get(id)
  },
  Effect.catch((e) => Effect.logError(e).pipe(Effect.andThen(Effect.fail(e)))),
  Effect.annotateLogs({ method: "loadUser" })
)
```

`return yield*` on failures so control-flow narrowing works.

Yieldable in generators: `Effect`, `Option`, `Result`, `Config`, `Context.Service` (service keys are Effects). **Not** yieldable as effects: `Ref`, `Deferred`, `Fiber` — use module functions. Do **not** pass `Option`/`Result` to `Effect.map` without converting. Migration docs mention `.asEffect()`; **confirm it exists on the installed RC** before using it.

## Errors

| v3 | v4 |
| --- | --- |
| `catchAll` | `catch` |
| `catchAllCause` | `catchCause` |
| `catchAllDefect` | `catchDefect` |
| `catchSome` | `catchFilter` (Filter module) |
| `catchSomeCause` | `catchCauseFilter` |
| `catchTag` / `catchTags` | unchanged |

Also: `Effect.catchReason` / `catchReasons` / `unwrapReason` for nested tagged `reason` (parent tag + reason tag). `catch` recovers **typed errors only**, not defects. `catchSomeDefect` is **removed**. Array form: `Effect.catchTag(["A", "B"], handler)`.

Define errors with `Schema.TaggedError`. Observe both sides with `Effect.result` / `Effect.exit`.

## Forking

| v3 | v4 |
| --- | --- |
| `Effect.fork` | `Effect.forkChild` |
| `Effect.forkDaemon` | `Effect.forkDetach` |

`forkScoped` / `forkIn` remain. Options include `startImmediately`, `uninterruptible`. `forkAll` / `forkWithErrorHandler` removed.

```ts
const fiber = yield* Effect.forkChild(task)
const value = yield* Fiber.join(fiber)
```

## Running

Only at edges:

- `Effect.runPromise` / `runPromiseExit` / `runFork`
- `runPromiseWith(context)` / `runForkWith(context)` when you already have a `Context`
- Long-running process: `NodeRuntime.runMain` / `BunRuntime.runMain` (same shared impl in `platform-node-shared`), `DenoRuntime.runMain`, or `BrowserRuntime.runMain`. Or `Layer.launch`. Prefer those over `Runtime.makeRunMain`.
- Framework bridge: `ManagedRuntime.make(layer)` then dispose
- Tests: **fork** effects that `sleep`, then `TestClock.adjust` — otherwise they hang

Pass `AbortSignal` when bridging HTTP request cancellation.

## Config

`Config<T>` is yieldable. Default provider: `ConfigProvider.fromEnv()`. Tests: `fromUnknown`, `fromEnv({ env })`, `fromDotEnvContents`. `layer` / `layerAdd`, `constantCase`, `nested`.

Do not rip out a working env schema library only because Config exists.

## Other core renames

- `Effect.andThen` (old `zipRight`)
- `Effect.tap` (old `zipLeft` in some uses)
- `Effect.result` (old `either`)
- `Layer.effect` (old `Layer.scoped`)
- `Layer.effectDiscard` (old `scopedDiscard`)
