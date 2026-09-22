# Consistent Effect adoption

## Ownership rule

Effect owns application behavior: use cases, I/O, failure, dependencies, cancellation, resources, scheduling, and observability.
Frameworks own their required entry points and presentation contracts. Vendor SDKs stay behind Effect service implementations.
A boundary is a named module where these models meet, not permission to mix them throughout a feature.

For each touched use case, trace entry → validation → business rules → external calls → response.
Keep that path in Effect until the response adapter. Wrapping a large existing async function does not complete the conversion.
Convert its internal orchestration too, within the authorized feature scope.

## Choose Effect before duplicating infrastructure

| Existing or proposed code | Required direction |
| --- | --- |
| Async service methods and nested Promise chains | Return `Effect<A, E, R>` and compose with `Effect.fn` / `Effect.gen` |
| `Promise.all`, manual races, detached tasks | Effect concurrency with explicit bounds and owned fibers |
| Retry loops, timers, polling | `Schedule`, Effect retry/repeat/timeout/sleep; retry only safe operations |
| Mutable shared objects, locks, custom event buses | `Ref`, `SynchronizedRef`, transactional modules, `Queue`, `PubSub` as semantics require |
| Custom dependency containers and global clients | `Context.Service`, explicit `Layer` wiring and scoped acquisition |
| Custom TTL caches, batching, pools | `Cache`, `ScopedCache`, `RequestResolver`, `Pool` or reference-counted resources |
| Application-owned parsers and validators | Schema with explicit encoded and decoded forms |
| Scattered environment reads and secret strings | Config supplied through layers; `Redacted` for secrets |
| Raw fetch, filesystem, subprocess calls | Effect HTTP/platform/process APIs when they support the needed behavior |
| Direct vendor or ORM calls | Existing suitable Effect adapter, otherwise one typed service wrapper |
| Application logging and tracing | Effect logs, spans, metrics; adapt existing sinks/exporters once |
| Custom asynchronous iteration pipelines | Stream/Sink with cancellation, backpressure, and scoped consumption |
| Hand-built durable job execution | Evaluate workflow/cluster only when persistence and distributed execution are required |

Do not introduce cluster, SQL, AI, or any other subsystem just to increase Effect usage.
Prefer the smallest Effect capability that meets the feature's requirements.
Do not install dependencies or migrate frameworks without the required authorization.

## Foreign library adapters

- Expose Effect-returning service methods, not the raw Promise client, to application code.
- Create Promise work lazily inside `Effect.tryPromise`; map expected SDK failures into meaningful tagged errors.
- Forward the supplied abort signal when the SDK supports cancellation. Document when cancellation cannot stop underlying work.
- Use `Effect.try` for synchronous operations that can throw expected errors; `Effect.sync` for non-failing synchronous effects.
- Use `Effect.callback` for callback APIs; register listener removal or cancellation as cleanup.
- Acquire clients, subscriptions, and handles with scoped cleanup when they require disposal.
- Preserve error causes for diagnosis. Do not turn every failure into success, `undefined`, or an unstructured string.
- Keep driver transactions in the adapter and expose the transaction behavior required by the use case.
- Do not pretend fiber interruption can undo an already committed external write.

For SDKs that already return Effect, compose those effects directly. Avoid Effect → Promise → Effect conversions.

## Elysia and other HTTP frameworks

Keep the existing framework when the task requires it. Do not replace Elysia merely because Effect has an HTTP server.

1. Build one `ManagedRuntime` per application instance from shared service layers.
2. Let the route adapter extract framework inputs and request metadata.
3. Decode application inputs with Schema. Reuse compatible schema contracts where the framework supports them.
4. Call one Effect use case; provide request-specific services locally, never through shared mutable request state.
5. Run the use case only at this edge. Forward the request abort signal when the host supplies a meaningful one.
6. Translate expected failures into deliberate HTTP responses. Keep defects and interruption distinct using `Exit` / `Cause` when needed.
7. Close request resources at request completion. Dispose the application runtime through the host's actual shutdown lifecycle.

A framework handler returning a Promise is acceptable. An async business service that repeatedly invokes the runtime is not.
Framework validation may remain necessary. Avoid maintaining two independent definitions of the same application contract.
Verify the framework's lifecycle and validation APIs against its installed version before writing the adapter.

Conceptual flow; map the final step to the framework's real response API:

```text
request adapter
  → schema decoding and request context
  → Effect use case
      → Effect services
          → Effect-native client or isolated SDK adapter
  → runtime result and HTTP response mapping
```

For streaming responses, keep the stream's scope alive until consumption completes or the client disconnects.
Do not close its scope when returning the response object. Test cancellation and cleanup during partial consumption.
Background work needs an application-owned scope or a durable queue; request completion must not orphan it.

## Pure code and UI boundaries

Pure arithmetic, comparisons, object construction, and deterministic domain calculations can remain ordinary TypeScript.
Use `Option` or `Result` when explicit absence or synchronous failure improves the contract; avoid gratuitous wrappers.
Prefer Effect modules when they replace custom logic or provide meaningful semantics, not to inflate import counts.

Keep framework components, hooks, rendering, and required callbacks in their native form.
Use Effect services for application behavior behind them. Use Atom bindings when they fit the selected UI architecture.
Do not replace an unrelated UI state system during a focused backend task.

## Migration and review

- Identify the application-owned code and unavoidable external boundaries before editing.
- Follow one use case through all its touched services. Do not stop after wrapping its public async entry point.
- Remove superseded local helpers and duplicate paths only when they belong to the authorized change.
- Keep untouched legacy features outside scope; state their remaining gaps clearly.
- Accept non-Effect code for a concrete framework contract, vendor capability gap, or pure calculation.
- Reject convenience wrappers that retain custom retry, lifecycle, errors, or concurrency inside an Effect shell.

Search touched files for `async`, `Promise`, `runPromise`, `runFork`, `setTimeout`, `setInterval`, `fetch`, `process.env`, and `try/catch`.
Also inspect direct clock/random access, global mutable clients, event listeners, and custom caches.
Classify each hit by ownership; a search match alone is not a defect.

Verify typed failures, cancellation, finalizers, concurrency limits, request isolation, and shutdown where the change affects them.
Use test layers and TestClock for deterministic tests. Report untested external adapter behavior explicitly.
