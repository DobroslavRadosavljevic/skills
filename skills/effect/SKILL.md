---
name: effect
description: "Build, review, debug, migrate, or plan Effect v4 RC TypeScript. Use for effect@rc, Effect.fn, Effect.gen, Context.Service, Context.Reference, Layer, ManagedRuntime, Config, Schema v4, Stream, Queue, Tx*, Result, Cause, Fiber, unstable modules (http, httpapi, sql, ai, rpc, cluster, workflow, cli), platform/sql/ai/atom packages, @effect/vitest@rc, and v3 to v4 migrations."
---

# Effect

Use this skill for Effect **v4 RC** (`effect@rc`, currently `4.0.0-rc.x`). npm `latest` is still Effect **v3**. Do not mix v3 and v4 packages.

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
5. Implement in project style: match the installed RC, keep framework edges thin, compose layers explicitly, treat `effect/unstable/*` as RC-plus-unstable (may break in minor releases).

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

- Align every `@effect/*` package to the **same** `4.0.0-rc.N` as `effect`.
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

- Typecheck `Effect<A, E, R>`, layers, Schema encoded/type sides, RC names.
- `@effect/vitest@rc`: `it.effect`, TestClock, Exit/Result, per-test `Effect.provide` when isolation matters.
- Schema: valid/invalid input, defaults, excess keys, classes, tagged errors, JSON Schema.
- Migration scan: v3 imports, `Either`, `FiberRef`, old catch/fork/runtime/Schema APIs.
