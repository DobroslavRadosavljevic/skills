# Setup and core use

## Packages

```sh
bun add effect
bun add -d @effect/vitest vitest@^5
```

Keep every `@effect/*` monorepo package on the **same** version as `effect` (`4.0.0`). npm `latest` is v4 since 2026-10-01; v3 is `effect@3.x` (last `3.22.2`) with `@effect/vitest@0.30.x`. Effect 4.x is an LTS line.

Requirements (from Effect README, 4.0.0):

- TypeScript **5.9+** (`strict: true`). TypeScript 7 recommended for Effect’s TS tooling.
- Node.js 18+ generally; `@effect/sql-sqlite-node` needs Node **22.16+**.

## Imports

```ts
import { Context, Effect, Layer, Schema } from "effect"
import { HttpClient } from "effect/http"
import { TestClock } from "effect/testing"
```

Direct modules (`import * as Effect from "effect/Effect"`) are also valid. Match the repo. Area barrels (`effect/http`, `effect/sql`, `effect/ai`, …) are mostly `@stability unstable` even without an `unstable` path segment. `effect/unstable/*` imports no longer exist.

## Constructors

- `Effect.succeed` / `Effect.fail` / `Effect.die`
- `Effect.sync` — sync side effects
- `Effect.promise` — reject → **defect**
- `Effect.tryPromise({ try, catch })` — reject → typed `E`
- `Effect.callback` (v3 `Effect.async`)

Prefer typed failures for domain/boundary errors.

## `Effect.gen`, `Effect.fn`, and `Effect.fnUntraced`

Inline sequential logic:

```ts
const program = Effect.gen(function*() {
  const db = yield* Database
  return yield* db.query("select 1")
})
```

Reusable functions that are useful tracing boundaries — **`Effect.fn("sameNameAsFunction")`**, extra combinators as extra arguments, **no `.pipe` on `Effect.fn`**:

```ts
export const loadUser = Effect.fn("loadUser")(
  function*(id: string): Effect.fn.Return<User, AppError> {
    return yield* repo.get(id)
  },
  Effect.catch((e) => Effect.logError(e).pipe(Effect.andThen(Effect.fail(e)))),
  Effect.annotateLogs({ method: "loadUser" })
)
```

Reusable functions that are not useful tracing boundaries (library internals, hot paths) — **`Effect.fnUntraced`** (no span, no stack-frame capture):

```ts
export const validateBatchSize = Effect.fnUntraced(
  function*(size: number): Effect.fn.Return<number, BatchError> {
    if (!Number.isInteger(size) || size <= 0) {
      return yield* new BatchError({ message: "Batch size must be a positive integer" })
    }
    return size
  }
)
```

Avoid plain functions that only wrap and return `Effect.gen`. `return yield*` on failures so control-flow narrowing works.

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

4.0 constructors are **PascalCase** (renamed late in the RC series):

| RC / v3 | 4.0 |
| --- | --- |
| `Config.string` / `nonEmptyString` | `Config.String` / `Config.NonEmptyString` |
| `Config.number` / `finite` / `int` | `Config.Number` / `Config.Finite` / `Config.Int` |
| `Config.boolean` / `literal` / `literals` | `Config.Boolean` / `Config.Literal` / `Config.Literals` |
| `Config.duration` / `port` / `logLevel` | `Config.Duration` / `Config.Port` / `Config.LogLevel` |
| `Config.redacted` / `url` / `date` | `Config.Redacted` / `Config.URL` / `Config.Date` |
| `Config.mapOrFail` | `Config.mapEffect` |

New: `Config.Array`, `Config.Record` (construct configs directly, path-first or pathless overloads), `Config.ByteSize`, `Config.flatMap`. Combinators keep lowercase names (`map`, `orElse`, `all`, `withDefault`, `option`, `unwrap`, `schema`, `nested`).

```ts
const Server = Config.all({
  host: Config.String("HOST").pipe(Config.withDefault("0.0.0.0")),
  port: Config.Port("PORT"),
  apiKey: Config.Redacted("API_KEY")
})
```

Use Config for application-owned configuration. Adapt existing validated framework configuration once at the boundary; avoid duplicate validation.

## Other core renames

- `Effect.andThen` (old `zipRight`)
- `Effect.zip` + `Effect.map` (old `zipLeft`; `Effect.tap` when the right side is a side effect)
- `Effect.result` (old `either`)
- `Layer.effect` (old `Layer.scoped`)
- `Layer.effectDiscard` (old `scopedDiscard`)
