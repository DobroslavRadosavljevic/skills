---
name: effect
description: "Build, review, debug, plan, or migrate Effect v4 TypeScript applications. Use for Effect services, Schema, layers, concurrency, streams, integrations, and v3 migrations. Enforce consistent Effect usage across application logic, with thin adapters for non-Effect frameworks and libraries."
---

# Effect

Use Effect throughout the application code covered by the task. A Promise application wrapped in one Effect is incomplete adoption.

The verified reference snapshot is **4.0.0-rc.112**. Check installed versions and current release tags before changing dependencies. Do not mix v3 and v4 APIs.

## Required adoption policy

- Keep use cases, service methods, I/O, expected failures, resource ownership, and concurrent work inside Effect.
- Choose the matching Effect capability before writing a custom helper or adding an overlapping library. Consult the index below.
- Use Effect Schema for application-owned validation and codecs; Context and Layer for dependencies; Scope for cleanup.
- Use Effect scheduling, concurrency, state, configuration, and observability instead of parallel custom systems for the same responsibility.
- Keep Promise, callback, framework, and vendor APIs at named adapters. Convert once on entry and once on exit.
- Existing Elysia routes may return Promises. Their handlers delegate to Effect use cases; business logic stays outside handlers.
- Never call a runtime runner inside a domain service to make Effect look like a Promise API.
- Keep pure calculations and ordinary TypeScript data simple. They need no Effect wrapper unless they fail or perform effects.
- Prefer Effect's standard library over new duplicate utilities. Do not mechanically replace clear language operators or native data structures.
- Respect the requested scope. Convert each touched use case end to end; do not start an unrelated repository-wide migration.
- Record remaining non-Effect boundaries and their concrete constraints. Convenience alone does not justify a second application architecture.

Read [adoption-boundaries.md](references/adoption-boundaries.md) when implementing, reviewing, or migrating a mixed codebase.

## Dense capability index

Use this map before choosing an implementation. The linked catalogs cover every public module namespace and public monorepo package in the snapshot.
This is a capability/module index, not a list of every function. Confirm signatures in installed declarations.

| Responsibility | Effect capability |
| --- | --- |
| Use cases, typed failure, recovery | `Effect.fn`, `Effect.gen`, `Cause`, `Exit`, `Result`, `Option`, `Match` |
| Dependencies, application lifetime | `Context`, `Layer`, `ManagedRuntime`, `Scope`, `LayerMap`, `LayerRef` |
| Validation, codecs, domain types, derived formats | `Schema`, `Brand`, `Data`, `StandardSchema`, `JsonSchema`, `Optic`, Schema compiler modules |
| Configuration, secrets, time, randomness | `Config`, `ConfigProvider`, `Redacted`, `Clock`, `DateTime`, `Duration`, `Random` |
| Retry, repeat, timeout, fallback | `Schedule`, `Cron`, Effect timeout/retry, `ExecutionPlan` |
| Concurrency, cancellation, synchronization | `Fiber`, fiber collections, `Deferred`, `Latch`, `Semaphore`, `PartitionedSemaphore` |
| Shared and transactional state | `Ref`, `SynchronizedRef`, `SubscriptionRef`, `ScopedRef`, `Effect.tx`, all `Tx*` modules |
| Streaming and backpressure | `Stream`, `Sink`, `Queue`, `PubSub`; low-level `Channel`, `Pull`, `Take`, `ChannelSchema` |
| Cache, batching, reusable resources | `Cache`, `ScopedCache`, `Request`, `RequestResolver`, `Pool`, `Resource`, `RcRef`, `RcMap` |
| Collections, text, numbers, equality, algorithms | Array/Chunk/Record/Hash collections, `Graph`, `Trie`, `HashRing`, `BigDecimal`, primitive and protocol modules |
| Files, paths, terminal, crypto | `FileSystem`, `Path`, `Stdio`, `Terminal`, `Crypto`, platform implementations |
| Logs, traces, metrics, diagnostics | `Logger`, `LogLevel`, `Tracer`, `Metric`, `ErrorReporter`; unstable `observability`, `devtools` |
| HTTP, typed APIs, sockets, RPC | unstable `http`, `httpapi`, `socket`, `rpc` |
| Database, models, migrations | unstable `sql`, `schema`; SQL driver packages |
| Persistence, rate limits, event sourcing | unstable `persistence`, `eventlog` |
| AI, tools, MCP, embeddings | unstable `ai`; provider packages |
| UI state, invalidation, hydration | unstable `reactivity`; React/Solid/Vue bindings |
| Commands, subprocesses, worker pools | unstable `cli`, `process`, `workers` |
| Distributed entities, durable work | unstable `cluster`, `workflow` |
| Structured wire formats | unstable `encoding`: JSON lines, SSE, MessagePack, YAML, TOML, INI, binary schemas |
| Tests, property checks, generated docs/clients | `effect/testing`, `@effect/vitest`, docgen/doctest/OpenAPI tools |

Exact inventories: [core and testing](references/modules-stable.md), [all unstable namespaces](references/modules-unstable.md), [all public packages](references/ecosystem.md).

## Workflow

1. Inspect the local Effect surface: `effect` / `@effect/*` versions, import style (`from "effect"` vs `effect/Effect`), runtime (CLI, HTTP, worker, browser, test), and whether layers/config/platform are already in play.
2. Prefer a local checkout of **`Effect-TS/effect` `main`** under `.temp/effect` (v4 RC source). `Effect-TS/effect-smol` is **archived**; v4 history now lives in `Effect-TS/effect`. Browse sources, `LLMS.md`, `MIGRATION.md`, `migration/*`, `packages/effect/SCHEMA.md`, and `ai-docs/`. Details: [source-map.md](references/source-map.md).
3. Refresh docs when the installed RC differs from the snapshot or the task asks for latest APIs. Resolve library docs, then check installed `.d.ts`.
4. Route by concern:
   - Install, `Effect.fn`/`gen`, errors, forks, run, Config → [setup-core.md](references/setup-core.md)
   - Services, layers, scopes, `ManagedRuntime`, `Layer.launch` → [services-layers-runtime.md](references/services-layers-runtime.md)
   - Full **stable** module catalog (what each module is for) → [modules-stable.md](references/modules-stable.md)
   - Stream, Queue/PubSub, fibers, STM-like `Tx*`, caching, requests → [concurrency.md](references/concurrency.md)
   - Schema v4 → [schema-v4.md](references/schema-v4.md)
   - `effect/unstable/*` → [modules-unstable.md](references/modules-unstable.md)
   - `@effect/platform-*`, `sql-*`, `ai-*`, `atom-*`, OTel, tools → [ecosystem.md](references/ecosystem.md)
   - `@effect/vitest@rc` → [vitest-testing.md](references/vitest-testing.md)
   - v3 → v4 → [migration.md](references/migration.md)
5. Implement the required adoption policy, preserving compatible project conventions: match the installed RC, keep framework edges thin, compose layers explicitly, treat `effect/unstable/*` as RC-plus-unstable (may break in minor releases).

## Coding style (canonical)

From Effect’s own `LLMS.md` / `ai-docs`:

- Named effectful functions use **`Effect.fn("name")`** (span + stack). Library internals in Effect’s own repo prefer **`Effect.fnUntraced`**. Do **not** wrap `Effect.gen` in a plain function; do **not** `.pipe` the result of `Effect.fn`.
- Domain errors: **`Schema.TaggedError`**. Always `return yield*` when failing so TypeScript narrows.
- Services: **`Context.Service`**, identifier like `"myapp/db/Database"`, implement with **`Database.of({ ... })`**, attach **`static readonly layer`**. Prefer `yield* Service` over `Service.use` except one-liners.
- Untrusted data: **Schema**, not ad-hoc predicates. Use **`Predicate`** for `isString` / `isObject` / composition — do not invent those helpers.
- Dates/time in Effect programs: **`DateTime`** + **`Clock`**, not raw `Date.now()`.
- Observability: logs/traces/metrics in core; new projects prefer `effect/unstable/observability` OTLP. Use `@effect/opentelemetry` when an existing OTel SDK is required.
- Process entry: **`NodeRuntime.runMain` / `BunRuntime.runMain`** (`BunRuntime` is the shared Node runner) or **`DenoRuntime` / `BrowserRuntime`**, or **`Layer.launch`**. Prefer those over `Runtime.makeRunMain`. Cloudflare: no platform package — Fetch + SQL D1/DO drivers.
- Prefer **Stream/Sink** over Channel; **Schema** over SchemaAST; **Cache vs ScopedCache vs Pool vs RcMap** per [concurrency.md](references/concurrency.md).

## Judgment

- Align v4 monorepo integration packages to the same release as `effect`. Check independent tooling packages against their own peers.
- TypeScript **5.9+** (7 recommended for Effect’s TS tooling). `strict: true`. Node 18+ generally; some SQL drivers need Node 22.16+.
- No v3 APIs in v4 code: `Context.Tag` / `GenericTag`, `Effect.Tag` / `Effect.Service`, `Either`, `FiberRef`, `Effect.catchAll`, `Effect.fork` (use `forkChild`), `Effect.async` (use `callback`).
- Layers memoize **across** `Effect.provide` unless `{ local: true }` or `Layer.fresh`.
- `Runtime<R>` is gone. Run with `Effect.run*` / `run*With(context)` or `ManagedRuntime`.
- `Ref` / `Deferred` / `Fiber` are **not** yieldable Effects — use `Ref.get`, `Deferred.await`, `Fiber.join`.
- Prefer typed failures over throw/die. Defects are programmer errors.
- Keep Schema `Encoded` vs `Type` visible at boundaries.
- Tests: `@effect/vitest@rc` + `vitest@^4.1.0`. Prefer `it.effect` (already scoped + TestClock; **do not** wrap in `Effect.scoped`). Import `TestClock` from `effect/testing`. `it.effect` suppresses logs; `it.live` does not.
- Do not: `catchAll`/`fork`/`forkDaemon`/`Context.Tag`/`Effect.Service`/`.Default`/`Either`/`FiberRef`/`Date.now`/`try/catch` in `gen`/`Schema.Date` for ISO strings/`Union(A,B)`/`it.effect` + extra `Effect.scoped`.

## Module routing (quick)

| Need | Use |
| --- | --- |
| Workflows, errors, concurrency | `Effect`, `Cause`, `Exit`, `Result`, `Fiber` |
| DI | `Context`, `Layer`, `ManagedRuntime` |
| Config | `Config`, `ConfigProvider` |
| Validation / domain types | `Schema` (+ `Schema.Class` / `TaggedError`) |
| Time | `Clock`, `Duration`, `DateTime`, `Cron`, `Schedule` |
| Collections | `Array`, `Chunk`, `HashMap`, `HashSet`, `Record`, `Option` |
| One producer, many consumers | `PubSub` |
| Work queue | `Queue` |
| Pull streams | `Stream` / `Sink` / `Channel` (low-level) |
| Atomic multi-ref updates | `Effect.tx` + `TxRef` / `TxQueue` / … |
| HTTP client/server | `effect/unstable/http` + `@effect/platform-*` |
| Schema-first HTTP API | `effect/unstable/httpapi` |
| SQL | `effect/unstable/sql` + `@effect/sql-*` |
| LLM / tools | `effect/unstable/ai` + `@effect/ai-*` |
| Tests | `@effect/vitest`, `effect/testing` |

Every stable module: [modules-stable.md](references/modules-stable.md). Every unstable area: [modules-unstable.md](references/modules-unstable.md).

## Verification

- Typecheck `Effect<A, E, R>`, layers, Schema encoded/type sides, and installed API names.
- Review the whole touched use case for hidden Promises, runtime calls, unmanaged resources, and duplicate infrastructure.
- Test adapter error mapping, cancellation, request cleanup, and application shutdown where those behaviors change.
- Report justified non-Effect boundaries and any remaining migration work; do not claim complete adoption while gaps remain.
- `@effect/vitest@rc`: `it.effect`, TestClock, Exit/Result, per-test `Effect.provide` when isolation matters.
- Schema: valid/invalid input, defaults, excess keys, classes, tagged errors, JSON Schema.
- Migration scan: v3 imports, `Either`, `FiberRef`, old catch/fork/runtime/Schema APIs.
