# Migration, Platform, And Testing

Use this reference for Effect v3 to v4 migration, unstable modules, platform packages, HTTP, and tests.

## Beta Status

Effect v4 is beta. The official release note says beta releases may include breaking changes and v3 remains recommended for production users while v4 stabilizes.

When implementing v4 anyway:

- Pin and align beta versions.
- Check local declarations for every unstable or recently changed API.
- Prefer small migrations with focused verification over broad mechanical rewrites.
- Report any ambiguity instead of hiding it behind casts.

## Package Migration

v4 uses one version number across the ecosystem. Keep `effect` and `@effect/*` beta packages aligned.

Many old packages moved into core `effect` or `effect/unstable/*` import paths. Examples:

- `@effect/platform/FileSystem` -> `effect/FileSystem`
- `@effect/platform/Path` -> `effect/Path`
- `@effect/platform/Error` -> `effect/PlatformError`
- `effect/Either` -> `effect/Result`
- `effect/FiberRef` -> `effect/References`
- `@effect/platform/FetchHttpClient` -> `effect/unstable/http/FetchHttpClient`
- `@effect/platform/HttpClient` -> `effect/unstable/http/HttpClient`
- `@effect/platform/HttpClientRequest` -> `effect/unstable/http/HttpClientRequest`
- `@effect/platform/HttpClientResponse` -> `effect/unstable/http/HttpClientResponse`
- `@effect/platform/HttpServer` -> `effect/unstable/http/HttpServer`
- `@effect/platform/HttpApi*` -> `effect/unstable/httpapi/*`
- `@effect/sql/*` core APIs -> `effect/unstable/sql/*`
- `@effect/rpc/*` -> `effect/unstable/rpc/*`

Platform-specific implementations remain separate, such as `@effect/platform-node`, `@effect/platform-bun`, and `@effect/platform-browser`.

## API Rename Checks

Important v4 renames:

- `Effect.async` -> `Effect.callback`
- `Effect.zipRight` -> `Effect.andThen`
- `Effect.zipLeft` -> `Effect.tap`
- `Effect.either` -> `Effect.result`
- `Effect.catchAll` -> `Effect.catch`
- `Effect.catchAllCause` -> `Effect.catchCause`
- `Effect.catchAllDefect` -> `Effect.catchDefect`
- `Effect.catchSome` -> `Effect.catchIf` or `Effect.catchFilter`, depending on old usage.
- `Effect.catchSomeCause` -> `Effect.catchCauseIf` or `Effect.catchCauseFilter`, depending on old usage.
- `Effect.tapErrorCause` -> `Effect.tapCause`
- `Effect.ignoreLogged` -> `Effect.ignore`
- `Effect.fork` -> `Effect.forkChild`
- `Effect.forkDaemon` -> `Effect.forkDetach`
- `Layer.scoped` -> `Layer.effect`
- `Layer.scopedDiscard` -> `Layer.effectDiscard`
- `Layer.tapErrorCause` -> `Layer.tapCause`
- `Scope.extend` -> `Scope.provide`
- `Either` -> `Result`
- `Mailbox` -> `Queue`

Do not blindly rewrite ambiguous `catchSome` patterns. Read the old handler shape first.

## Service Migration

Replace v3 service declarations:

- `Context.GenericTag<T>(id)`
- `Context.Tag(id)<Self, Shape>()`
- `Effect.Tag(id)<Self, Shape>()`
- `Effect.Service<Self>()(id, opts)`

with v4 `Context.Service`.

Old static accessor proxy methods are removed. Replace with either:

- `const service = yield* Service` inside `Effect.gen`.
- `Service.use((service) => service.method(...))` for small one-liners.

Replace auto-generated `Default`/dependency wiring from old `Effect.Service` with explicit `static readonly layer = Layer.effect(this, this.make).pipe(...)`.

## Runtime Migration

Old `Runtime<R>` is removed. Use:

- `Effect.context<R>()` to get services as a `Context`.
- `Effect.runForkWith(context)(effect)` to fork with explicit services.
- `Effect.runPromiseWith(context)(effect)` and related variants to run with explicit services.
- `ManagedRuntime.make(layer)` when many external calls need to share a layer-built context.

Do not treat `Runtime` as a dependency container in v4.

## Yieldable Migration

v4 removes many structural subtypes of `Effect`.

Still yieldable in generators:

- `Effect`
- `Option`
- `Result`
- `Config`
- `Context.Service`

No longer plain Effect subtypes:

- `Ref`: use `Ref.get(ref)`.
- `Deferred`: use `Deferred.await(deferred)`.
- `Fiber`: use `Fiber.join(fiber)`.

When a combinator expects an `Effect`, do not pass a non-Effect Yieldable directly. Use a generator or an explicit conversion where available.

## Cause And Equality

Cause changed from a recursive tree to a flat `reasons` array.

- Iterate `cause.reasons` instead of matching `Sequential` and `Parallel`.
- Empty cause is `cause.reasons.length === 0`.
- Use reason guards such as `Cause.isFailReason`.
- Use cause predicates such as `Cause.hasFails`, `Cause.hasDies`, and `Cause.hasInterrupts`.
- `*Exception` names generally became `*Error`.

Equality is structural by default in v4 for plain objects, arrays, maps, sets, dates, and regexes. Use `Equal.byReference` or `Equal.byReferenceUnsafe` only when reference equality is required.

## Unstable Modules

`effect/unstable/*` modules may change in minor releases. Use them with caution and match local installed types.

Current unstable areas include AI, CLI, cluster, devtools, encoding, eventlog, HTTP, HTTP API, observability, persistence, process, reactivity, RPC, schema, socket, SQL, workflow, and workers.

Do not hide unstable status in skill output or code review. Call it out when it affects maintenance risk.

## HTTP And Platform

HTTP APIs currently live under `effect/unstable/http` and `effect/unstable/httpapi`.

Common imports:

```ts
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http";
```

Platform packages supply concrete clients and servers:

- `@effect/platform-node`
- `@effect/platform-bun`
- `@effect/platform-browser`

Common HTTP patterns from v4 examples:

- Get the default client with `yield* HttpClient.HttpClient`.
- Transform clients with helpers such as `HttpClient.mapRequest`.
- Build requests with `HttpClientRequest`.
- Encode JSON bodies with schema helpers such as `HttpClientRequest.schemaBodyJson(schema)(value)`.
- Decode response bodies with `HttpClientResponse.schemaBodyJson(schema)` or `schemaJson(...)`.
- Provide a concrete platform client layer around programs using HTTP.

## Testing With `@effect/vitest`

Install and align `@effect/vitest@beta` for v4 beta projects.

Use:

```ts
import { assert, describe, expect, it, layer } from "@effect/vitest";
import { Effect } from "effect";
```

Core helpers:

- `it.effect` runs an Effect test with `TestContext`.
- `it.live` runs with live services.
- `it.scoped` runs scoped Effects.
- `it.scopedLive` combines live and scoped.
- `it.flakyTest` supports flaky test workflows.
- `layer(Layer)(...)` and `it.layer(...)` provide layers to nested Effect tests.
- `it.effect.each`, `.skip`, `.only`, `.skipIf`, `.runIf`, and `.fails` exist for common Vitest patterns.

Example:

```ts
it.effect("loads service", () =>
  Effect.gen(function*() {
    const service = yield* MyService;
    const value = yield* service.load;
    expect(value).toEqual("ok");
  }));
```

For success/failure assertions, use `Effect.exit` and compare `Exit` values.

For time, `it.effect` provides test services such as `TestClock`; use `it.live` for real time.

For isolation, provide fresh or local layers intentionally. The v4 test package includes layer isolation patterns that build fresh state for each `it.layer` block.

## Migration Verification

Run checks that expose both type and runtime mistakes:

- Typecheck after import and API renames.
- Search for old service declarations and old package imports.
- Search for old `catchAll`, `fork`, `FiberRef`, `Either`, `Runtime<R>`, and `Scope.extend` patterns.
- Test service layers with `@effect/vitest`.
- Test edge runners and managed runtime disposal.
- Test Schema decode/encode separately from business logic.
- For unstable HTTP/RPC/SQL modules, run a small integration smoke against the concrete platform layer.
