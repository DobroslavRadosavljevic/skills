# Services, layers, and runtime

## Services

v4: **`Context.Service` only**. Forbidden: `Context.Tag`, `Context.GenericTag`, `Effect.Tag`, `Effect.Service`.

Function form:

```ts
const Database = Context.Service<Database>("myapp/db/Database")
```

Class form (preferred for apps). Identifier should include package + path:

```ts
export class Database extends Context.Service<Database, {
  query(sql: string): Effect.Effect<ReadonlyArray<unknown>, DatabaseError>
}>()("myapp/db/Database") {
  static readonly layer = Layer.effect(
    Database,
    Effect.gen(function*() {
      const query = Effect.fn("Database.query")(function*(sql: string) {
        return [{ id: 1 }]
      })
      return Database.of({ query })
    })
  )
}

export type DatabaseService = Database["Service"]
```

No auto-generated default layer and no `dependencies` option. Wire with `Layer.provide`.

`Context.Reference` (replaces `FiberRef`): values with defaults. Built-ins on **`References`**: `CurrentLogLevel`, `MinimumLogLevel`, `CurrentLogAnnotations`, `CurrentLogSpans`, `Scheduler`, `MaxOpsBeforeYield`, `TracerEnabled`, `UnhandledLogLevel`. Read with `yield* References.CurrentLogLevel`. Override with **`Effect.provideService`**, not `FiberRef.set` / `locally`. Custom: `Context.Reference<T>(id, { defaultValue })`.

Name layers **`layer` / `layerTest` / `layerConfig`**, not `Default`.

## Access

Prefer `yield* Database` in `Effect.gen`. `Database.use((db) => db.query(sql))` / `useSync` only for tiny callbacks. v3 static accessor proxies are gone (they erased generics).

## Layers

- `Layer.succeed(Service, impl)` — pure
- `Layer.effect(Service, makeEffect)` — acquire (scoped if the effect needs Scope)
- `Layer.effectDiscard(effect)` — background work with no service interface
- `Layer.unwrap` — layer from an Effect/Config
- `Layer.provide` / `Layer.provideMerge` / `Layer.merge`
- `Layer.fresh` / `Effect.provide(layer, { local: true })` — disable sharing
- `Layer.launch` — run a layer as the process (keeps app alive until interrupted)

**Memoization:** v4 shares a MemoMap across `Effect.provide` calls. The same layer instance is built once. Isolate with `{ local: true }` or `Layer.fresh`.

Name variants `layer`, `layerTest`, `layerMemory`, `layerLive`.

## Scopes

`Effect.acquireRelease`, `Effect.scoped`, layer construction. `Scope.provide` replaces v3 `Scope.extend`. Closing a scope runs finalizers with the completing `Exit`.

Dynamic per-key resources: `LayerMap.Service`.

## ManagedRuntime

```ts
const runtime = ManagedRuntime.make(AppLive)
await runtime.runPromise(program)
await runtime.dispose()
```

Use when non-Effect frameworks call Effect many times. Do not build a new runtime per request unless you need isolation.

## Running with context

`Runtime<R>` removed. Use `Effect.context<R>()` + `Effect.runForkWith(services)` / `runPromiseWith`, or provide layers first so `R` is `never`.
