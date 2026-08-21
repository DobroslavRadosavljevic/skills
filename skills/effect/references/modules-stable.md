# Stable modules

All modules below live in `packages/effect/src/<Name>.ts` and are re-exported from `"effect"` as `import { Name } from "effect"` or `import * as Name from "effect/Name"`. Unstable APIs are **not** here — see [modules-unstable.md](modules-unstable.md). Testing helpers: `effect/testing` (`FastCheck`, `TestClock`, `TestConsole`, `TestSchema`).

Do not use `Utils` / `Unify` / `Effectable` / `HKT` / `Types` in app code unless you are writing libraries that extend Effect.

**Prefer (from module JSDoc):** `Stream`/`Sink` over `Channel`/`Pull`/`Take`; `Schema` over `SchemaAST`; `Effect.scoped`/`Layer` over raw `Scope`; platform `runMain` over `Runtime.makeRunMain`; `Reducer` when a fold needs an empty value (`Combiner` is merge-only); `Ref` over `MutableRef` for fiber-safe state; `Exit` when Cause/die/interrupt must be kept, `Result` for plain success/failure; SHA-256+ over SHA-1 except legacy interop.

## Core runtime

| Module | Use when | Avoid when |
| --- | --- | --- |
| **Effect** | Describe workflows `Effect<A, E, R>`: succeed/fail/sync/promise/tryPromise/callback, `gen`/`fn`, provide, catch, retry, fork, run | Using combinators alone for long sequential logic (prefer `gen`/`fn`) |
| **Fiber** | Join/interrupt/await forked work; inspect current fiber | Yielding a fiber as if it were an Effect — use `Fiber.join` |
| **FiberHandle** | At most one background fiber in a scope (replace interrupts previous) | Many keyed fibers — use `FiberMap` |
| **FiberMap** | Keyed set of background fibers (per tenant, connection, job id) | Unkeyed bag — `FiberSet` |
| **FiberSet** | Many fibers, interrupt all on scope close | Need replacement-by-key |
| **Runtime** | Process lifecycle / teardown helpers (`Runtime<R>` **removed**). `makeRunMain` exists | Prefer `@effect/platform-node` `NodeRuntime.runMain` (or Bun) |
| **ManagedRuntime** | Bridge Effect into Hono/Express/queues: build once from a Layer, `runPromise`/`runFork` repeatedly, dispose | One-shot CLI — `runMain` / `Layer.launch` |
| **Scheduler** | Custom fiber scheduling / yield policy | Normal apps (default scheduler) |
| **Scope** | Explicit resource lifetimes, `addFinalizer` | Prefer `Effect.scoped`, `acquireRelease`, Layers |
| **Layer** | Build/provide services: `succeed`, `effect`, `effectDiscard`, `unwrap`, `provide`, `provideMerge`, `fresh`, `launch` | Hidden globals |
| **LayerMap** | Dynamically build/release layers keyed by id (multi-tenant) | Static app graph |
| **LayerRef** | Swap the current layer/value over time | Static wiring |
| **Context** | `Context.Service`, `Context.Reference`, typed service maps | v3 `Tag` / `GenericTag` |
| **References** | Fiber-local / request-local refs (replaces `FiberRef`) | New code that should be a `Context.Reference` service |
| **Resource** | Cached acquire with refresh | Simple acquire/release — `Effect.acquireRelease` |
| **RcRef** / **RcMap** | Shared refcounted scoped resources | Single owner — `ScopedRef` |
| **Clock** | Testable wall/monotonic time. Everyday delay is **`Effect.sleep`** (uses Clock) | `Date.now()` / `currentTimeMillis` for elapsed duration |
| **Random** | Testable randomness | `Math.random` in Effects |
| **Console** | Console as a service (swap in tests) | Direct `console.log` when you need TestConsole |
| **Logger** / **LogLevel** | Structured logs, log level filtering | Ad-hoc string logs without spans when tracing matters |
| **Tracer** | Spans, sampling, parent context | Raw OTel APIs unless integrating `@effect/opentelemetry` |
| **Metric** | Counters, gauges, histograms, frequency | Business metrics that belong in a dedicated TSDB client only |
| **ErrorReporter** | Forward non-interrupt Causes to Sentry/etc. | Using it as the only error channel (still prefer typed `E`) |
| **Config** / **ConfigProvider** | Typed env/object/dotenv config | Replacing an existing validated env module without cause |
| **ExecutionPlan** | Ordered fallbacks with per-step layers, retries, predicates | Simple `orElse` / `retry` |
| **Request** / **RequestResolver** | Batched/deduped remote calls (N+1) | One-off HTTP — `HttpClient` |
| **Pool** | Bounded pool of resources | Unbounded create-per-call |
| **Cache** | Memoize Effect lookups by key (TTL, capacity, in-flight share) | Scoped resources — `ScopedCache` |
| **ScopedCache** | Cached values that own a Scope | Pure data cache |
| **Redacted** / **Redactable** | Secrets that must not log/serialize | Plain strings for tokens |

## Errors and results

| Module | Use when |
| --- | --- |
| **Cause** | Inspect full failure: typed error + defects + interruption + annotations |
| **Exit** | Completed Effect as success \| `Cause` (tests, runPromiseExit) |
| **Result** | Sync success/failure (`Either` renamed). Yieldable in `gen` |
| **Option** | Presence/absence. Yieldable (`None` → `NoSuchElementError`) |
| **UndefinedOr** | `A \| undefined` without wrapping `Option` |
| **Filter** | Composable type-narrowing predicates (used by `catchFilter`) |
| **Match** | Pattern matching on tagged unions / values |
| **Data** | Tagged classes, errors, equality-friendly models (lighter than Schema classes) |
| **PrimaryKey** | Identity for batching/equality of domain objects |
| **Equal** / **Equivalence** / **Hash** / **Order** / **Ordering** | Structural equality, custom eq, hashing, ordering |
| **Combiner** / **Reducer** | Merge two values / reduce collections with identity |

## Data and stdlib

| Module | Use when |
| --- | --- |
| **Array** | JS arrays (readonly, non-empty helpers) |
| **Chunk** | Immutable ordered collection, cheap append/concat |
| **Iterable** / **NonEmptyIterable** | Generic iterable ops |
| **Record** / **Struct** | String-keyed maps / plain objects |
| **Tuple** | Fixed-length arrays |
| **HashMap** / **HashSet** | Immutable hashed collections (Equal + Hash) |
| **HashRing** | Consistent hashing / shard placement (`PrimaryKey`) |
| **Graph** | Directed graphs, paths, analysis |
| **MutableHashMap** / **MutableHashSet** / **MutableList** / **MutableRef** | Local mutation for performance; do not share across fibers unsafely |
| **Trie** | String prefix maps (routes, autocomplete) |
| **String** / **Number** / **BigInt** / **BigDecimal** / **Boolean** / **Symbol** / **RegExp** | Pipe-friendly primitives; **BigDecimal** for money |
| **Brand** | Nominal types; optional runtime `check`/`make` |
| **Newtype** | Wrap/unwrap with **no** extra runtime object |
| **Function** | `pipe`, `flow`, `identity` (also on the root export) |
| **Predicate** | `isString`, `isObject`, `and`/`or`/`not` — **do not** write these yourself |
| **Encoding** | Base64 / Base64Url / hex (`Result` on decode). Structured formats → `unstable/encoding` |
| **JsonSchema** | JSON Schema AST/document helpers used with Schema |
| **JsonPatch** / **JsonPointer** | RFC JSON Patch / pointers (Schema can derive differs) |
| **Inspectable** / **Pipeable** | Library author protocols |
| **Formatter** | Human-readable Cause/Schema issue formatting |
| **SchemaAST** / **SchemaGetter** / **SchemaIssue** / **SchemaParser** / **SchemaRepresentation** / **SchemaTransformation** | Schema internals / compilers — app code uses **Schema** |
| **Schema** | All validation, domain classes, tagged errors, codecs — [schema-v4.md](schema-v4.md) |
| **Optic** | Lenses/prisms over nested data (often derived from Schema) |
| **ChannelSchema** | Schema encode/decode at Channel boundaries |
| **Differ** | Patch-based diffs |
| **Types** | Type-level utilities only |
| **HKT** | Higher-kinded types for library authors |
| **Unify** / **Utils** / **Effectable** | Protocol / generator plumbing — not app utilities |
| **Crypto** | Platform-independent digest/random bytes (impl from platform packages) |
| **Duration** | Time spans, timeouts, TTL |
| **DateTime** | Instants, zones, parsing, Clock-backed now |
| **Cron** | Calendar schedules |
| **Schedule** | Retry/repeat/poll policies (compose with Duration/Cron) |

## Concurrency and streaming

See [concurrency.md](concurrency.md) for decision rules. Modules: **Stream**, **Sink**, **Channel**, **Pull**, **Take**, **Queue**, **PubSub**, **Deferred**, **Latch**, **Semaphore**, **PartitionedSemaphore**, **Ref**, **SynchronizedRef**, **SubscriptionRef**, **ScopedRef**, plus transactional **TxRef**, **TxQueue**, **TxHashMap**, **TxHashSet**, **TxChunk**, **TxDeferred**, **TxPubSub**, **TxPriorityQueue**, **TxReentrantLock**, **TxSemaphore**, **TxSubscriptionRef**.

## Platform-shaped (stable, implementations in `@effect/platform-*`)

| Module | Use when |
| --- | --- |
| **FileSystem** | Read/write files as a service |
| **Path** | Path manipulation service |
| **Terminal** | Interactive TTY (size, keys, line read) |
| **Stdio** | argv + stdin/stdout/stderr as a service |
| **PlatformError** | Shared platform error type (old `@effect/platform/Error`) |

Provide live implementations via `@effect/platform-node` (or bun/deno/browser).

## Testing (`effect/testing`)

| Module | Use when |
| --- | --- |
| **TestClock** | Deterministic time in `it.effect`. **Fork** sleepers, then `adjust` — otherwise they hang |
| **TestConsole** | Capture console |
| **FastCheck** | Property testing arbitraries (also via Schema / `it.prop`) |
| **TestSchema** | Schema testing helpers |
