---
name: effect
description: "Build, review, debug, migrate, or plan Effect v4 beta TypeScript code with current docs. Use for effect@beta, Effect, Effect.gen, Context.Service, Context.Reference, Layer, ManagedRuntime, Config, ConfigProvider, Scope, Fiber, Stream, Queue, Result, Cause, Schema v4, Schema.Class, Schema.TaggedErrorClass, Schema.decodeUnknown, Schema.encode, unstable modules, effect/unstable/http, platform packages, @effect/vitest, and Effect v3 to v4 migrations."
---

# Effect

Use this skill when work touches Effect v4 beta usage, service/layer architecture, runtime entrypoints, Schema v4, platform modules, testing, or migrations from Effect v3.

## Workflow

1. Inspect the local Effect surface before changing code:
   - Package versions for `effect`, `@effect/*`, TypeScript, runtime platform packages, test libraries, and adapters.
   - Imports: root `effect`, direct modules like `effect/Effect`, `effect/Schema`, `effect/unstable/*`, platform packages, or old v3 packages.
   - Runtime boundary: CLI, HTTP handler, worker, server, browser, test, library, or framework-managed entrypoint.
   - Dependency shape: services, layers, config providers, platform layers, managed runtimes, and scope ownership.
2. Refresh current docs whenever the task asks for latest behavior or the local beta version is different. Start from [source-map.md](references/source-map.md).
3. For install/version, core Effect usage, generator style, typed errors, async interop, config, and runtime boundaries, use [setup-core.md](references/setup-core.md).
4. For services, `Context.Service`, references, layers, memoization, scopes, and `ManagedRuntime`, use [services-layers-runtime.md](references/services-layers-runtime.md).
5. For Schema v4 shapes, validation, classes, tagged errors, transformations, codecs, serialization, and JSON Schema generation, use [schema-v4.md](references/schema-v4.md).
6. For v3 to v4 migration, unstable modules, HTTP/platform packages, and `@effect/vitest`, use [migration-platform-testing.md](references/migration-platform-testing.md).
7. Implement in the existing project style:
   - Match the installed beta version and local import style.
   - Prefer explicit service and layer composition over hidden globals.
   - Keep framework/process edges thin; push business logic into Effects, services, and layers.
   - Treat `effect/unstable/*` APIs as beta-plus-unstable. Check installed declarations before using or recommending them.

## Effect Judgment

- Effect v4 is beta. Be honest about API drift and verify local declarations before making broad changes.
- Use `Context.Service` for v4 services. Do not introduce v3 `Context.Tag`, `Context.GenericTag`, `Effect.Tag`, or `Effect.Service` patterns in v4 code.
- Prefer `yield* Service` inside `Effect.gen` for service access. Use `Service.use` and `useSync` only for small, local one-liners.
- Define layers explicitly with `Layer.succeed`, `Layer.effect`, or `Layer.effectDiscard`; wire dependencies with `Layer.provide` and `Layer.provideMerge`.
- Compose and provide layers once when possible. Use `Layer.fresh` or `Effect.provide(..., { local: true })` only for intentional isolation.
- Use `ManagedRuntime.make(layer)` for repeated JS entrypoint runs against shared services, and dispose it when done.
- Use `Effect.runPromise`, `runPromiseExit`, `runFork`, or their `With` variants only at application edges.
- Inside `Effect.gen`, `yield*` works with Yieldable values. Outside generators, convert non-Effect Yieldables explicitly or use module functions such as `Ref.get`, `Deferred.await`, and `Fiber.join`.
- Prefer typed failures and tagged error classes over throwing. Use defects only for unrecoverable programmer errors.
- Keep Schema v4 encode/decode direction visible at boundaries; do not assume decoded `Type` and encoded input are the same.

## Verification

Prefer the repo's existing checks. For meaningful Effect v4 work, include the relevant subset:

- Typecheck for `Effect<A, E, R>` requirements, service availability, layer composition, Schema encoded/type sides, and beta API names.
- Focused tests with `@effect/vitest` for service behavior, layer isolation, test clocks, scoped resources, and typed failures.
- Runtime smoke at JS/framework edges where Effects are run or managed runtimes are disposed.
- Schema decode/encode tests for valid input, invalid input, defaults, excess properties, transformations, classes, tagged errors, and generated JSON Schema.
- Migration scans for v3-only APIs, old package imports, old catch/fork names, old runtime patterns, `FiberRef`, `Either`, and removed Schema APIs.
