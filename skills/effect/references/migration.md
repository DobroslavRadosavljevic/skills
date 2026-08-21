# Migration, platform, and testing

Effect v4 is a **release candidate**. Pin matching `4.0.0-rc.N`. v3 remains on npm `latest` / branch `v3`.

## Status

- One version number across the ecosystem.
- Former `@effect/platform`, `@effect/rpc`, `@effect/cluster`, `@effect/sql` *core* APIs live in `effect` or `effect/unstable/*`.
- Drivers stay separate: `@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`, `@effect/atom-*`, `@effect/opentelemetry`, `@effect/vitest`.
- Unstable modules may break in minor RCs. Call that out in reviews.

`MIGRATION.md` in the Effect repo still says “beta” in places; treat **RC + `main`** as current. Full rename maps: `migration/v3-to-v4.md`.

## Package moves (examples)

- `@effect/platform/FileSystem` → `effect/FileSystem`
- `@effect/platform/Path` → `effect/Path`
- `@effect/platform/Error` → `effect/PlatformError`
- `effect/Either` → `effect/Result`
- `effect/FiberRef` → `effect/References` + `Context.Reference`
- `effect/JSONSchema` → `effect/JsonSchema`
- STM `TRef`/`TQueue`/… → `TxRef`/`TxQueue`/…
- `effect/TestClock` → `effect/testing/TestClock`
- HTTP → `effect/unstable/http` (+ platform package)
- HttpApi → `effect/unstable/httpapi`
- SQL core → `effect/unstable/sql` + `@effect/sql-*`
- RPC → `effect/unstable/rpc`
- CLI → `effect/unstable/cli`
- Cluster → `effect/unstable/cluster`
- AI → `effect/unstable/ai` + `@effect/ai-*`

## API renames

| v3 | v4 |
| --- | --- |
| `Effect.async` | `Effect.callback` |
| `Effect.zipRight` | `Effect.andThen` |
| `Effect.zipLeft` | `Effect.tap` (verify call site) |
| `Effect.either` | `Effect.result` |
| `Effect.catchAll` | `Effect.catch` |
| `Effect.catchAllCause` | `Effect.catchCause` |
| `Effect.catchAllDefect` | `Effect.catchDefect` |
| `Effect.catchSome` | `Effect.catchFilter` |
| `Effect.catchSomeCause` | `Effect.catchCauseFilter` |
| `Effect.fork` | `Effect.forkChild` |
| `Effect.forkDaemon` | `Effect.forkDetach` |
| `Layer.scoped` | `Layer.effect` |
| `Layer.scopedDiscard` | `Layer.effectDiscard` |
| `Scope.extend` | `Scope.provide` |
| `Either` | `Result` |
| `Mailbox` | `Queue` |
| `decodeUnknown` (Effect) | `decodeUnknownEffect` |
| `Schema.Date` (ISO strings) | `DateFromString` |

Do not blindly rewrite `catchSome`. Read whether it was Option-based (`catchFilter`) or boolean (`catchIf`).

## Services / runtime / yieldable / Cause

See [services-layers-runtime.md](services-layers-runtime.md) and [setup-core.md](setup-core.md).

- Cause is a flat `reasons` array, not Sequential/Parallel trees. Use `Cause.isFailReason`, `hasFails` / `hasDies` / `hasInterrupts`. `*Exception` → `*Error`.
- Equality is structural by default; `Equal.byReference` when needed.
- `Runtime<R>` removed.
- Layers memoize **across** `Effect.provide`.

## HTTP

```ts
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/unstable/http"
```

`yield* HttpClient.HttpClient`, `HttpClient.mapRequest`, `HttpClientRequest.schemaBodyJson`, `HttpClientResponse.schemaBodyJson`. Provide a platform client layer. Schema-first servers: `effect/unstable/httpapi` + `HttpApiTest`.

## Tests

Install `@effect/vitest@rc`. Details: [vitest-testing.md](vitest-testing.md).

## Verification

Typecheck; grep `Context.Tag`, `Either`, `FiberRef`, `catchAll`, `Effect.fork`, `Effect.async`, `Runtime<R>`, `Scope.extend`, old `@effect/platform` imports without `-node`/`-bun`; Schema encode/decode tests; smoke HTTP/SQL against a real platform/driver layer.
