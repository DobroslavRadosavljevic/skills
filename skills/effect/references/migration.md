# Migration, platform, and testing

Effect **4.0.0** is stable (npm `latest` since 2026-10-01) and an LTS line. v3 lives on branch `v3` (last npm `3.22.2`).

## Status

- One version number across the ecosystem (`4.0.0` everywhere).
- Former `@effect/platform`, `@effect/rpc`, `@effect/cluster`, `@effect/sql` *core* APIs live in `effect` or `effect/<area>`.
- Drivers stay separate: `@effect/platform-*`, `@effect/sql-*`, `@effect/ai-*`, `@effect/atom-*`, `@effect/opentelemetry`, `@effect/vitest`.
- `@stability unstable` APIs may break in minor releases; `@stability experimental` APIs in patches. Call that out in reviews.

Full per-API map: `migration/v3-to-v4.md` (curated `v3 -> v4` lines with guidance; ~17k lines — search it, do not read it whole). Schema: `migration/schema.md`.

## Package moves (examples)

- `@effect/platform/FileSystem` → `effect/FileSystem`
- `@effect/platform/Path` → `effect/Path`
- `@effect/platform/Error` → `effect/PlatformError`
- `effect/Either` → `effect/Result`
- `effect/FiberRef` → `effect/References` + `Context.Reference`
- `effect/JSONSchema` → `effect/JsonSchema`
- STM `TRef`/`TQueue`/… → `TxRef`/`TxQueue`/…
- `effect/TestClock` → `effect/testing/TestClock`
- `effect/FastCheck` → install `fast-check` directly, or use the Schema-first `Arbitrary` module
- HTTP → `effect/http` (+ platform package)
- HttpApi → `effect/http-api`
- SQL core → `effect/sql` + `@effect/sql-*`
- RPC → `effect/rpc`
- CLI → `effect/cli` (`@effect/cli/Options` → `Flag`, `Args` → `Argument`)
- Cluster → `effect/cluster`
- Workflow → `effect/workflow`
- AI → `effect/ai` + `@effect/ai-*`

## API renames

| v3 | v4 |
| --- | --- |
| `Effect.async` | `Effect.callback` |
| `Effect.zipRight` | `Effect.andThen` |
| `Effect.zipLeft` | `Effect.zip` + `Effect.map` (or `Effect.tap` when the right side is only a side effect) |
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
| `Effect.Tag` / `Effect.Service` | `Context.Service` + explicit `Layer.effect` (no `Default`, no `dependencies`) |
| `Runtime.Runtime<R>` | `Context.Context<R>` + `Effect.run*With` |

Do not blindly rewrite `catchSome`. Read whether it was Option-based (`catchFilter`) or boolean (`catchIf`).

## Services / runtime / yieldable / Cause

See [services-layers-runtime.md](services-layers-runtime.md) and [setup-core.md](setup-core.md).

- Cause is a flat `reasons` array, not Sequential/Parallel trees. Use `Cause.isFailReason`, `hasFails` / `hasDies` / `hasInterrupts`. `*Exception` → `*Error`.
- Equality is structural by default; `Equal.byReference` when needed.
- `Runtime<R>` removed.
- Layers memoize **across** `Effect.provide`.

## HTTP

```ts
import { HttpClient, HttpClientRequest, HttpClientResponse } from "effect/http"
```

`yield* HttpClient.HttpClient`, `HttpClient.mapRequest`, `HttpClientRequest.schemaBodyJson`, `HttpClientResponse.schemaBodyJson`. Provide a platform client layer. Schema-first servers: `effect/http-api` + `HttpApiTest`.

## Tests

Install `@effect/vitest` (4.x) with `vitest@^5`. Details: [vitest-testing.md](vitest-testing.md).

## v4 RC / beta → 4.0.0

Projects pinned to `4.0.0-rc.N` or `4.0.0-beta.N` must upgrade every `effect` / `@effect/*` package to `4.0.0` together. Breaking changes landed in `rc.113`–`4.0.0` (see `packages/effect/CHANGELOG.md`):

| Area | Before (RC) | 4.0.0 |
| --- | --- | --- |
| Import paths | `effect/unstable/<area>` | `effect/<area>` — **no compatibility exports**. Still `@stability unstable` |
| HttpApi path | `effect/unstable/httpapi` | `effect/http-api` (TypeIds/service keys/SSE failure event use `http-api`) |
| Byte encodings | `effect/Encoding` | `effect/encoding/Base64`, `Base64Url`, `Hex`, `EncodingError`; `randomHex` → `Hex.random` |
| MessagePack | `effect/unstable/encoding/Msgpack`, msgpack RPC serialization | Removed (use SchemaBinary / NDJSON) |
| Property tests | `effect/testing/FastCheck`, `Schema.toArbitrary` | Root `Arbitrary` (`Arbitrary.schema`, `checkEffect`, `sampleEffect`, `configureGlobal`) |
| Config | `Config.string`, `Config.int`, `Config.redacted`, `Config.url`, `Config.mapOrFail`, … | `Config.String`, `Config.Int`, `Config.Redacted`, `Config.URL`, `Config.mapEffect`, … |
| CLI | `Flag.string`, `Flag.integer`, `Flag.choice`, `Prompt.text`, `GlobalFlag.action`, … | `Flag.String`, `Flag.Int`, `Flag.Literals`, `Prompt.String`, `GlobalFlag.Action`, … |
| Schema checks | `isLengthBetween`, `isSizeBetween`, `isPropertiesLengthBetween`, `isStartsWith`, `isEndsWith`, `isIncludes` | `isBetweenLength`, `isBetweenSize`, `isBetweenProperties`, `isStartingWith`, `isEndingWith`, `isIncluding` |
| Schema transformations | `SchemaGetter.transformOrFail`, `SchemaTransformation.transformOrFail` | `transformEffect` |
| Schema brands | `Schema.brand` stored in AST, multiple keys | Type-only, one concrete identifier per call; chain `brand` / `fromBrand` for several |
| Schema revivers | `Schema.*Reviver` | Moved to `SchemaRepresentation` |
| AI services | `LanguageModel.Service`, `Chat["Service"]` | Same-name branded types (`LanguageModel.LanguageModel`, …); custom impls include `[TypeId]` |
| Scope | `Scope.close(scope)` on any `Scope` | Requires `Scope.Closeable` (from `Scope.make` / `Scope.fork`) |
| Channel | `Channel.runDone` | `Channel.runDrain` |
| SQL Postgres | `pg`-backed `PgClient.fromPool` / `fromClient` / `makeWith` | Native client: `PgClient.make` / `makeClient`; see [ecosystem.md](ecosystem.md) |
| Tests | `@effect/vitest` peer `vitest@^4.1` | Peer `vitest >=5 <6` |
| Deno | `@effect/platform-deno` Deno ≥2.5 | Deno ≥2.8.3 |

Scan: `rg "effect/unstable/|effect/Encoding|FastCheck|Config\.(string|number|int|boolean|redacted|url|port|duration|literal|mapOrFail)\b|transformOrFail|isLengthBetween|isStartsWith|isEndsWith|isIncludes|runDone|Msgpack"`.

## Verification

Typecheck; grep `Context.Tag`, `Either`, `FiberRef`, `catchAll`, `Effect.fork`, `Effect.async`, `Runtime<R>`, `Scope.extend`, old `@effect/platform` imports without `-node`/`-bun`; Schema encode/decode tests; smoke HTTP/SQL against a real platform/driver layer.
