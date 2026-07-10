# Services, Layers, And Runtime

Use this reference for v4 dependency injection, layer wiring, scopes, memoization, and managed runtimes.

## Services

Effect v4 replaces v3 service forms with `Context.Service`.

Function syntax:

```ts
import { Context } from "effect";

interface Database {
  readonly query: (sql: string) => string;
}

const Database = Context.Service<Database>("Database");
```

Class syntax:

```ts
import { Context, Effect } from "effect";

class Notifications extends Context.Service<Notifications, {
  readonly notify: (message: string) => Effect.Effect<void>;
}>()("Notifications") {}
```

Avoid v3 service forms in v4 code:

- `Context.Tag`
- `Context.GenericTag`
- `Effect.Tag`
- `Effect.Service`

## Accessing Services

Prefer generator access:

```ts
const program = Effect.gen(function*() {
  const notifications = yield* Notifications;
  yield* notifications.notify("hello");
});
```

`Service.use` and `Service.useSync` exist for small callbacks:

```ts
const program = Notifications.use((n) => n.notify("hello"));
const port = ConfigService.useSync((c) => c.port);
```

Prefer `yield*` for non-trivial logic because dependencies stay visible and co-located.

## Service Constructors

`Context.Service` can hold a `make` effect:

```ts
class Logger extends Context.Service<Logger>()("Logger", {
  make: Effect.gen(function*() {
    const config = yield* ConfigService;
    return {
      log: (message: string) => Effect.log(`[${config.prefix}] ${message}`)
    };
  })
}) {
  static readonly layer = Layer.effect(this, this.make).pipe(
    Layer.provide(ConfigService.layer)
  );
}
```

Unlike old v3 `Effect.Service`, v4 does not auto-generate a default layer and does not support a `dependencies` option. Define layers explicitly.

Use `layer` for the primary layer and clear suffixes for variants, such as `layerTest`, `layerMemory`, or `layerLive`, following the local project style.

## References

Use `Context.Reference<T>(id, { defaultValue })` for context values with defaults, including fiber-local style settings.

Built-in v4 references replace many old `FiberRef` values and are exported from modules such as `References`.

Read references with `yield*`:

```ts
const level = yield* References.CurrentLogLevel;
```

Set scoped values with `Effect.provideService(effect, reference, value)`.

## Layers

Core constructors:

- `Layer.succeed(Service)(implementation)` for pure service values.
- `Layer.effect(Service)(effect)` or `Layer.effect(Service, effect)` for effectful construction.
- `Layer.effectDiscard(effect)` for startup/migration effects that provide no service.
- `Layer.merge`, `Layer.mergeAll`, `Layer.provide`, and `Layer.provideMerge` for composition.
- `Layer.launch(layer)` to run a layer as a long-lived effect.

Example:

```ts
class State extends Context.Service<State, {
  readonly id: number;
}>()("State") {}

const StateLayer = Layer.effect(State)(
  Effect.gen(function*() {
    return { id: Date.now() };
  })
);
```

## Layer Composition

Prefer composing the dependency graph before providing it:

```ts
const AppLayer = Layer.mergeAll(
  ConfigLayer,
  DatabaseLayer,
  HttpLayer
);

const main = program.pipe(Effect.provide(AppLayer));
```

Use `Layer.provide` to satisfy a layer's dependencies with another layer.

Use `Layer.provideMerge` when you need to provide dependencies while keeping the provided services in the resulting layer.

## Memoization

Effect v4 shares layer memoization across `Effect.provide` calls by default. This avoids v3's repeated-build footgun, but it is still not a substitute for clear layer composition.

Use isolation tools deliberately:

- `Layer.fresh(layer)` bypasses shared memoization for that layer.
- `Effect.provide(effect, layer, { local: true })` builds the entire provided subtree with a local memo map.

Use these for tests, independent resource pools, or intentionally fresh state.

## Scopes

- `Scope.provide` replaces old `Scope.extend`.
- `Scope.provide(scope)(effect)` provides an existing scope without closing it when the effect completes.
- `Effect.scoped` is still the usual way to run scoped resources with automatic close.
- Use scoped tests for effects that require `Scope`.

## ManagedRuntime

`Runtime<R>` is removed in v4. Use `Context<R>` plus `Effect.run*With` when you already have services.

`ManagedRuntime` still exists and is useful for repeated JS entrypoint runs against a layer-built service graph.

```ts
const runtime = ManagedRuntime.make(AppLayer);

await runtime.runPromise(program);
await runtime.dispose();
```

Rules:

- Create managed runtimes at process, worker, or integration boundaries.
- Do not create one inside every service method.
- Dispose them when the owning lifecycle ends.
- Use `runtime.runPromise(effect, { signal })` when bridging cancellation-aware request handlers.

## Process Main

The v4 `Runtime` module is reduced to process lifecycle utilities such as `makeRunMain`. Do not use it as an application service container.

For platform-specific main runners, prefer the platform package or existing project convention.
