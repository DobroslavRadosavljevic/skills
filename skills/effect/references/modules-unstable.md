# Subpath areas (`effect/<area>`)

Import from `effect/<area>` (barrel) or `effect/<area>/<Module>`. In **4.0.0** these areas moved out of `effect/unstable/*`; there are **no compatibility exports** for the old `effect/unstable/...` paths. Moving them did **not** stabilize them: every module below is `@stability unstable` (may break in minor releases) except the byte encodings in `effect/encoding` (`Base64`, `Base64Url`, `Hex`, `EncodingError`), which follow strict semver. APIs that expose a third-party dependency (driver clients, vendor option types, generated provider schemas) are also `@stability unstable`. Check installed types.

Core HTTP/SQL/AI/RPC **interfaces** live here. **Runtime drivers** are separate `@effect/*` packages — [ecosystem.md](ecosystem.md).

Snapshot: **4.0.0**, checked against every area barrel on 2026-10-01.

| v4 RC path | 4.0 path |
| --- | --- |
| `effect/unstable/<area>` | `effect/<area>` |
| `effect/unstable/httpapi` (and briefly `effect/httpapi`) | **`effect/http-api`** |
| `effect/Encoding` (root) | `effect/encoding/Base64`, `Base64Url`, `Hex`, `EncodingError` |
| `effect/unstable/encoding/Msgpack` | **removed** (use `SchemaBinary` or NDJSON) |
| `effect/unstable/arbitrary/Arbitrary`, `effect/testing/FastCheck` | root `Arbitrary` (`import { Arbitrary } from "effect"`) |

## `ai`

Public modules: `AiError`, `AnthropicStructuredOutput`, `Chat`, `Decision`, `DecisionModel`, `EmbeddingModel`, `IdGenerator`, `LanguageModel`, `McpProtocol`, `McpSchema`, `McpServer`, `Model`, `OpenAiStructuredOutput`, `Prompt`, `Response`, `ResponseIdTracker`, `Telemetry`, `Tokenizer`, `Tool`, `Toolkit`.

Provider-agnostic LLM surface: `LanguageModel`, `Chat`, `EmbeddingModel`, `Tokenizer`, `Tool`/`Toolkit`, `Prompt`/`Response`, `McpServer`/`McpSchema`, `Telemetry`, `AiError`.

Use for text, schema-validated objects, streaming, tool calling, MCP. Install a provider: `@effect/ai-openai`, `@effect/ai-anthropic`, `@effect/ai-openai-compat`, `@effect/ai-openrouter`.

New in 4.0: **`Decision` + `DecisionModel`** — batched classification, ordered ratings, and probability estimates over one schema-encoded input in a single provider call (`Decision.make`, `DecisionModel.decide`; `probabilityPrecision` option on `DecisionModel.make`). Providers: `@effect/ai-typesafe` and OpenRouter.

4.0 changes: `Reactivity`, `LanguageModel`, `EmbeddingModel`, and `Chat` use branded interfaces — refer to the same-name type, not `.Service` / `["Service"]`; custom implementations must include `[TypeId]: TypeId`. `Toolkit.handle` requires handler services on the outer Effect too. Tool parameter validation failures go through the tool's `failureMode`. MCP servers accept `instructions` and prompt titles, and support protocol version 2026-07-28.

## `cli`

Public modules: `Argument`, `CliConfig`, `CliError`, `CliOutput`, `Command`, `Completions`, `Flag`, `GlobalFlag`, `HelpDoc`, `Param`, `Primitive`, `Prompt`.

Typed CLI: `Command`, `Argument`, `Flag`, `Prompt`, `HelpDoc`, `CliError`, completions.

4.0 renamed constructors to **PascalCase** (parsing unchanged): `Flag.string` → `Flag.String`, `integer` → `Int`, `float` → `Finite`, `none` → `Never`, `choice` → `Literals` (in `Param`/`Flag`/`Argument`; `Primitive.choice` → `Primitive.Choice`). `Prompt.text` → `Prompt.String`, `Prompt.integer` → `Prompt.Int`, `Prompt.float` → `Prompt.Number`; `GlobalFlag.action`/`setting` → `Action`/`Setting`. Factories such as `Command.make` keep their names. `_tag` values changed (`"Integer"` → `"Int"`, `"Float"` → `"Finite"`, `"None"` → `"Never"`).

Use for Effect CLIs instead of raw `process.argv`. Pair with platform `runMain`.

## `cluster`

Public modules: `ClusterCron`, `ClusterError`, `ClusterMetrics`, `ClusterSchema`, `ClusterWorkflowEngine`, `DeliverAt`, `Entity`, `EntityAddress`, `EntityId`, `EntityProxy`, `EntityProxyServer`, `EntityResource`, `EntityType`, `Envelope`, `HttpRunner`, `K8sHttpClient`, `K8sTypes`, `MachineId`, `Message`, `MessageStorage`, `Reply`, `Runner`, `RunnerAddress`, `RunnerHealth`, `Runners`, `RunnerServer`, `RunnerStorage`, `ShardId`, `Sharding`, `ShardingConfig`, `ShardingRegistrationEvent`, `SingleRunner`, `Singleton`, `SingletonAddress`, `Snowflake`, `SocketRunner`, `SqlMessageStorage`, `SqlRunnerStorage`, `TestRunner`.

Distributed entities, sharding, runners, message/runner storage, HTTP/socket runners, singletons, cron, workflow engine bridge.

Use when you need multi-machine stateful entities/RPC. **`SingleRunner` is local/embedded but still requires a SQL client** (mailboxes/replies). Platform: `NodeClusterHttp` / `NodeClusterSocket` (or Bun). Test: `TestRunner`.

## `devtools`

Public modules: `DevTools`, `DevToolsClient`, `DevToolsSchema`, `DevToolsServer`.

DevTools client/server/schema. Default WebSocket `ws://localhost:34437`. Wire protocol is marked experimental. Needs platform `Socket`.

## `encoding`

Public modules: `Base64`, `Base64Url`, `EncodingError`, `Hex`, `Ini`, `Ndjson`, `SchemaBinary`, `Sse`, `Toml`, `Yaml`.

Stable byte encodings: **Base64**, **Base64Url**, **Hex** (replace the removed root `Encoding` module; `randomHex` → `Hex.random`; narrow failures with `EncodingError`). Unstable structured codecs: **Ndjson**, **Sse**, **SchemaBinary**, **Yaml**, **Toml**, **Ini**.

Use with `Stream.pipeThroughChannel` for NDJSON / SchemaBinary streams. MessagePack (`Msgpack`, RPC msgpack serialization, `msgpackr` dependency) was **removed** in 4.0; event log and cluster transports now use SchemaBinary.

## `eventlog`

Public modules: `Event`, `EventGroup`, `EventJournal`, `EventLog`, `EventLogEncryption`, `EventLogMessage`, `EventLogRemote`, `EventLogServer`, `EventLogServerEncrypted`, `EventLogServerUnencrypted`, `EventLogSessionAuth`, `SqlEventJournal`, `SqlEventLogServerEncrypted`, `SqlEventLogServerUnencrypted`.

Event sourcing / encrypted event log: events, journals, remote/server, SQL journals.

Use for durable event streams, not for simple `PubSub`.

## `http`

Public modules: `Cookies`, `Etag`, `FetchHttpClient`, `FindMyWay`, `Headers`, `HttpBody`, `HttpClient`, `HttpClientError`, `HttpClientRequest`, `HttpClientResponse`, `HttpEffect`, `HttpIncomingMessage`, `HttpMethod`, `HttpMiddleware`, `HttpPlatform`, `HttpRouter`, `HttpServer`, `HttpServerError`, `HttpServerRequest`, `HttpServerRespondable`, `HttpServerResponse`, `HttpStaticServer`, `HttpStatus`, `HttpTraceContext`, `Mime`, `Multipart`, `MultipartParser`, `Template`, `Url`, `UrlParams`.

HTTP client + server primitives: `HttpClient`, `HttpClientRequest`/`Response`, `FetchHttpClient`, `HttpServer`, `HttpRouter`, `HttpMiddleware`, cookies, headers, multipart, URL, template, static server.

Use for hand-rolled HTTP. For schema-first APIs prefer **http-api**. Live servers/clients come from `@effect/platform-*`.

4.0 additions: `Mime` (vendored MIME lookup; replaces the `mime` dependency), HTTP `QUERY` method support, `HttpClientResponse.url`. The `Cookie`/`Cookies`/`Headers`/`UrlParams` **schemas** moved to `Schema`.

## `http-api`

Import from **`effect/http-api`** (was `effect/unstable/httpapi`).

Public modules: `HttpApi`, `HttpApiBuilder`, `HttpApiClient`, `HttpApiEndpoint`, `HttpApiError`, `HttpApiGroup`, `HttpApiMiddleware`, `HttpApiScalar`, `HttpApiSchema`, `HttpApiSecurity`, `HttpApiSwagger`, `HttpApiTest`, `OpenApi`.

Schema-first HTTP: `HttpApi`, groups/endpoints, builder, typed `HttpApiClient`, security/middleware, OpenAPI/Swagger/Scalar, `HttpApiTest` (in-memory, no real server).

Prefer this for public APIs you want typed on both sides. 4.0 adds `HttpApi.ParseOptions` (API, group, or endpoint level) and per-slot parse options for params, query, headers, payload, success, and error codecs.

## `net`

Public modules: `IpInterface`, `IpNetwork`, `NetAddress`.

New in 4.0. Pure, platform-neutral MAC, IP, internet socket, and Unix path addresses: checked parsing, `Equal`/`Hash`, canonical string and URL formatting, interface/network values. Matching validating schemas live on `Schema` (`Schema.IpAddress`, `Schema.Ipv4Network`, `Schema.MacAddress`, `Schema.SocketAddress`, `*FromString` variants).

## `observability`

Public modules: `Otlp`, `OtlpExporter`, `OtlpLogger`, `OtlpMetrics`, `OtlpResource`, `OtlpSerialization`, `OtlpTracer`, `PrometheusMetrics`.

Lightweight **OTLP** export: tracer, metrics, logs, Prometheus metrics, resource.

Prefer for new apps. Use `@effect/opentelemetry` when you already run an OTel Node SDK.

## `persistence`

Public modules: `KeyValueStore`, `Persistable`, `PersistedCache`, `PersistedQueue`, `Persistence`, `RateLimiter`, `Redis`.

`KeyValueStore`, `Persistence`/`Persistable`/`PersistedCache`/`PersistedQueue`, `RateLimiter`. **`Redis` is a service interface**, not a client — provide `NodeRedis` / `BunRedis`. Memory/FS/Web Storage/SQL/IndexedDB layers exist on KeyValueStore.

## `process`

Public modules: `ChildProcess`, `ChildProcessSpawner`.

`ChildProcess` + `ChildProcessSpawner` (`Command` as Effect). Needs `NodeChildProcessSpawner` or Bun. CLI prompts also need Terminal/Stdio.

## `reactivity`

Public modules: `AsyncResult`, `Atom`, `AtomHttpApi`, `AtomRef`, `AtomRegistry`, `AtomRpc`, `Hydration`, `Reactivity`.

Two layers: (1) **`Reactivity`** key invalidation (SQL uses this); (2) **`Atom`** registry. UI bindings: `@effect/atom-react` / `atom-solid` / `atom-vue`. Also `AtomHttpApi` / `AtomRpc` / `Hydration` / `AsyncResult`.

## `rpc`

Public modules: `Rpc`, `RpcClient`, `RpcClientError`, `RpcGroup`, `RpcMessage`, `RpcMiddleware`, `RpcSchema`, `RpcSerialization`, `RpcServer`, `RpcTest`, `RpcWorker`, `Utils`.

Schema-typed RPC: `Rpc`, `RpcGroup`, `RpcClient`/`Server`, middleware, serialization, workers, `RpcTest`.

Use for binary/app protocols; HTTP APIs still use http-api. MessagePack serialization was removed in 4.0 — use JSON/NDJSON or SchemaBinary serialization.

## `schema`

Public modules: `Model`, `SchemaAOTCompiler`, `SchemaCompiler`, `SchemaJITCompiler`, `VariantSchema`.

Schema extras: **`Model`** (SQL/JSON dual models), `VariantSchema`, and new experimental decoder compilers. `SchemaCompiler` is the shared decoder registry consumed transparently by `SchemaParser`; `SchemaJITCompiler` installs runtime-generated decoders (import `effect/schema/SchemaJITCompiler/enable` to enable globally); `SchemaAOTCompiler` generates static modules (no `new Function`, CSP-friendly).

Used heavily with `effect/sql`. Stable validation stays in `Schema`.

## `socket`

Public modules: `Socket`, `SocketServer`.

`Socket` / `SocketServer` abstractions. Implementations from platform packages.

## `sql`

Public modules: `Migrator`, `SqlClient`, `SqlConnection`, `SqlError`, `SqlModel`, `SqlResolver`, `SqlSchema`, `SqlStream`, `Statement`.

`SqlClient`, `Statement`, `SqlSchema`, `SqlStream`, `Migrator`, `SqlError`, `SqlModel`, `SqlResolver`, `SqlConnection`.

Use with a driver `@effect/sql-pg`, `sql-mysql2`, `sql-sqlite-*`, `sql-d1`, `sql-clickhouse`, etc. Define models with Schema/`Model.Class`.

## `workers`

Public modules: `Transferable`, `Worker`, `WorkerError`, `WorkerRunner`.

`Worker`, `WorkerRunner`, transferable types, `WorkerError`.

Use for thread/worker pools. Platform packages supply the runtime.

## `workflow`

Public modules: `Activity`, `DurableClock`, `DurableDeferred`, `DurableQueue`, `Workflow`, `WorkflowEngine`, `WorkflowProxy`, `WorkflowProxyServer`.

Durable workflows: `Workflow`, `Activity`, `DurableClock`, `DurableDeferred`, `DurableQueue`, `WorkflowEngine`, proxies.

Use for long-running, replayable work. In-memory `WorkflowEngine` for tests; production usually `ClusterWorkflowEngine` + SQL.
