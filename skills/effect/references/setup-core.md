# Setup And Core Use

Use this reference for package versions, imports, core Effect APIs, config, and JS runtime boundaries.

## Package Setup

- To try Effect v4 beta, install the beta dist-tag:

  ```sh
  npm install effect@beta
  ```

- Keep all Effect ecosystem packages on matching beta versions. If `effect` is `4.0.0-beta.94`, packages such as `@effect/vitest` and platform/provider packages should also use `4.0.0-beta.94` when available.
- Stable npm `latest` may still be Effect v3. Always check `dist-tags` before assuming the installed package is v4.
- Effect core requires TypeScript 5.4 or newer and strict type checking.
- Use project package manager conventions and existing lockfile policy. Do not install packages without approval if the task is only research or skill creation.

## Imports

Common v4 imports:

```ts
import { Context, Effect, Layer, Schema } from "effect";
```

Direct module imports are also used in the repository:

```ts
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Schema from "effect/Schema";
```

Use the local project style. Use direct imports when the project already prefers them or when tree-shaking/import clarity matters.

Unstable modules use explicit paths:

```ts
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";
```

Check installed declarations first: unstable APIs can change during beta.

## Core Constructors

- `Effect.succeed(value)` for pure success.
- `Effect.fail(error)` for typed failure.
- `Effect.sync(() => value)` for synchronous side effects.
- `Effect.promise(() => promise)` for promises that should reject as defects.
- `Effect.tryPromise({ try, catch })` for expected promise rejection mapped to typed failure.
- `Effect.callback(...)` for callback-style async APIs.
- `Effect.die(defect)` for unrecoverable defects.

Prefer typed failures for domain and boundary errors.

## `Effect.gen`

Use `Effect.gen` for sequential effectful code:

```ts
const program = Effect.gen(function*() {
  const service = yield* MyService;
  const value = yield* service.load("id");
  return value;
});
```

In v4, many values are Yieldable but not Effect subtypes. `yield*` works inside generators, but outside generators use module functions or `.asEffect()` where available.

Important examples:

- `Ref` is not yielded as an effectful read; use `Ref.get(ref)`.
- `Deferred` is not yielded as an await; use `Deferred.await(deferred)`.
- `Fiber` is not yielded as a join; use `Fiber.join(fiber)`.
- `Option`, `Result`, `Config`, and `Context.Service` remain yieldable in generators.

## Error Handling

Important v4 names:

- `Effect.catch` replaces `Effect.catchAll`.
- `Effect.catchCause` replaces `Effect.catchAllCause`.
- `Effect.catchDefect` replaces `Effect.catchAllDefect`.
- `Effect.catchFilter` and `Effect.catchCauseFilter` replace the old `catchSome*` style.
- `Effect.catchTag` and `Effect.catchTags` remain central for tagged errors.
- `Effect.catchReason` and `Effect.catchReasons` handle nested tagged reasons.

Capture failures with `Effect.result` or `Effect.exit` when tests or callers need to observe both success and failure.

## Forking And Fibers

Important v4 names:

- `Effect.forkChild` replaces old `Effect.fork`.
- `Effect.forkDetach` replaces old `Effect.forkDaemon`.
- `Effect.forkScoped` and `Effect.forkIn` remain.
- Fork variants accept options such as `startImmediately` and `uninterruptible`.
- `Effect.forkAll` and `Effect.forkWithErrorHandler` are removed.

Join fibers explicitly:

```ts
const fiber = yield* Effect.forkChild(task);
const value = yield* Fiber.join(fiber);
```

## Running Effects

Run Effects at application or integration boundaries, not deep in business logic.

- `Effect.runPromise(effect)` resolves success or rejects on failure.
- `Effect.runPromiseExit(effect)` returns an `Exit`.
- `Effect.runFork(effect)` starts a fiber for effects with no service requirements.
- `Effect.runPromiseWith(context)(effect)` and related `With` variants run with explicit services.
- `Effect.runForkWith(context)(effect)` replaces old `Runtime.runFork(runtime)` usage.

Use `AbortSignal` run options when bridging request lifetimes or cancellation-aware JS APIs.

## Config

- `Config<T>` describes how to read, decode, and validate typed configuration.
- Config values are yieldable in `Effect.gen` and read from the active `ConfigProvider`.
- The default provider is `ConfigProvider.fromEnv()`.
- `ConfigProvider.fromUnknown(value)` is useful for tests and embedded defaults.
- `ConfigProvider.fromEnv({ env })` reads a supplied env record or the default runtime env.
- `ConfigProvider.fromDotEnvContents(contents)` parses `.env` text.
- `ConfigProvider.fromDotEnv()` reads a `.env` file and requires `FileSystem`.
- `ConfigProvider.layer(provider)` replaces the active provider.
- `ConfigProvider.layerAdd(provider, { asPrimary })` composes a provider with the current provider.
- `ConfigProvider.constantCase` bridges camelCase config paths to `CONSTANT_CASE` env vars.
- `ConfigProvider.nested(provider, prefix)` scopes lookups under a prefix.

Keep environment policy explicit. If a project already uses a schema-backed env library, do not replace it with Effect Config just because Effect offers Config.

## Runtime Boundary Judgment

- Keep framework callbacks, request handlers, CLIs, and workers as thin bridges.
- Construct the app layer once per process or request according to the platform's data isolation needs.
- Do not rebuild expensive layers for every operation unless isolation is required.
- Dispose scopes and managed runtimes when their lifecycle ends.
