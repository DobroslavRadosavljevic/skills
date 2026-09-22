# Unstable modules

Import from `effect/unstable/<area>` (barrel) or `effect/unstable/<area>/<Module>`. These **may break in minor RC releases**. Check installed types. As they stabilize they move to top-level `effect/*`.

Core HTTP/SQL/AI/RPC **interfaces** live here. **Runtime drivers** are separate `@effect/*` packages — [ecosystem.md](ecosystem.md).

Snapshot: **4.0.0-rc.112**, checked against every unstable barrel on 2026-09-22.

## `ai`

Public modules: `AiError`, `AnthropicStructuredOutput`, `Chat`, `EmbeddingModel`, `IdGenerator`, `LanguageModel`, `McpProtocol`, `McpSchema`, `McpServer`, `Model`, `OpenAiStructuredOutput`, `Prompt`, `Response`, `ResponseIdTracker`, `Telemetry`, `Tokenizer`, `Tool`, `Toolkit`.

Provider-agnostic LLM surface: `LanguageModel`, `Chat`, `EmbeddingModel`, `Tokenizer`, `Tool`/`Toolkit`, `Prompt`/`Response`, `McpServer`/`McpSchema`, `Telemetry`, `AiError`.

Use for text, schema-validated objects, streaming, tool calling, MCP. Install a provider: `@effect/ai-openai`, `@effect/ai-anthropic`, `@effect/ai-openai-compat`, `@effect/ai-openrouter`.

## `cli`

Public modules: `Argument`, `CliConfig`, `CliError`, `CliOutput`, `Command`, `Completions`, `Flag`, `GlobalFlag`, `HelpDoc`, `Param`, `Primitive`, `Prompt`.

Typed CLI: `Command`, `Argument`, `Flag`, `Prompt`, `HelpDoc`, `CliError`, completions.

Use for Effect CLIs instead of raw `process.argv`. Pair with platform `runMain`.

## `cluster`

Public modules: `ClusterCron`, `ClusterError`, `ClusterMetrics`, `ClusterSchema`, `ClusterWorkflowEngine`, `DeliverAt`, `Entity`, `EntityAddress`, `EntityId`, `EntityProxy`, `EntityProxyServer`, `EntityResource`, `EntityType`, `Envelope`, `HttpRunner`, `K8sHttpClient`, `K8sTypes`, `MachineId`, `Message`, `MessageStorage`, `Reply`, `Runner`, `RunnerAddress`, `RunnerHealth`, `Runners`, `RunnerServer`, `RunnerStorage`, `ShardId`, `Sharding`, `ShardingConfig`, `ShardingRegistrationEvent`, `SingleRunner`, `Singleton`, `SingletonAddress`, `Snowflake`, `SocketRunner`, `SqlMessageStorage`, `SqlRunnerStorage`, `TestRunner`.

Distributed entities, sharding, runners, message/runner storage, HTTP/socket runners, singletons, cron, workflow engine bridge.

Use when you need multi-machine stateful entities/RPC. **`SingleRunner` is local/embedded but still requires a SQL client** (mailboxes/replies). Platform: `NodeClusterHttp` / `NodeClusterSocket` (or Bun). Test: `TestRunner`.

## `devtools`

Public modules: `DevTools`, `DevToolsClient`, `DevToolsSchema`, `DevToolsServer`.

DevTools client/server/schema. Default WebSocket `ws://localhost:34437`. Wire protocol is marked experimental. Needs platform `Socket`.

## `encoding`

Public modules: `Ini`, `Msgpack`, `Ndjson`, `SchemaBinary`, `Sse`, `Toml`, `Yaml`.

Structured codecs over streams/bytes: **Msgpack**, **Ndjson**, **Sse**, plus **Yaml**, **Toml**, **Ini**.

Use with `Stream.pipeThroughChannel` for NDJSON/msgpack. Binary/text Base64 stays in stable `Encoding`.

## `eventlog`

Public modules: `Event`, `EventGroup`, `EventJournal`, `EventLog`, `EventLogEncryption`, `EventLogMessage`, `EventLogRemote`, `EventLogServer`, `EventLogServerEncrypted`, `EventLogServerUnencrypted`, `EventLogSessionAuth`, `SqlEventJournal`, `SqlEventLogServerEncrypted`, `SqlEventLogServerUnencrypted`.

Event sourcing / encrypted event log: events, journals, remote/server, SQL journals.

Use for durable event streams, not for simple `PubSub`.

## `http`

Public modules: `Cookies`, `Etag`, `FetchHttpClient`, `FindMyWay`, `Headers`, `HttpBody`, `HttpClient`, `HttpClientError`, `HttpClientRequest`, `HttpClientResponse`, `HttpEffect`, `HttpIncomingMessage`, `HttpMethod`, `HttpMiddleware`, `HttpPlatform`, `HttpRouter`, `HttpServer`, `HttpServerError`, `HttpServerRequest`, `HttpServerRespondable`, `HttpServerResponse`, `HttpStaticServer`, `HttpStatus`, `HttpTraceContext`, `Multipart`, `MultipartParser`, `Template`, `Url`, `UrlParams`.

HTTP client + server primitives: `HttpClient`, `HttpClientRequest`/`Response`, `FetchHttpClient`, `HttpServer`, `HttpRouter`, `HttpMiddleware`, cookies, headers, multipart, URL, template, static server.

Use for hand-rolled HTTP. For schema-first APIs prefer **httpapi**. Live servers/clients come from `@effect/platform-*`.

## `httpapi`

Public modules: `HttpApi`, `HttpApiBuilder`, `HttpApiClient`, `HttpApiEndpoint`, `HttpApiError`, `HttpApiGroup`, `HttpApiMiddleware`, `HttpApiScalar`, `HttpApiSchema`, `HttpApiSecurity`, `HttpApiSwagger`, `HttpApiTest`, `OpenApi`.

Schema-first HTTP: `HttpApi`, groups/endpoints, builder, typed `HttpApiClient`, security/middleware, OpenAPI/Swagger/Scalar, `HttpApiTest` (in-memory, no real server).

Prefer this for public APIs you want typed on both sides.

## `observability`

Public modules: `Otlp`, `OtlpExporter`, `OtlpLogger`, `OtlpMetrics`, `OtlpResource`, `OtlpSerialization`, `OtlpTracer`, `PrometheusMetrics`.

Lightweight **OTLP** export: tracer, metrics, logs, Prometheus metrics, resource.

Prefer for new apps. Use `@effect/opentelemetry` when you already run an OTel Node SDK.

## `persistence`

Public modules: `KeyValueStore`, `Persistable`, `PersistedCache`, `PersistedQueue`, `Persistence`, `RateLimiter`, `Redis`.

`KeyValueStore`, `Persistence`/`Persistable`/`PersistedCache`/`PersistedQueue`, `RateLimiter`. **`Redis` is a service interface**, not a client — provide `NodeRedis` / `BunRedis`. Memory/FS/Web Storage/SQL/IndexedDB layers exist on KeyValueStore. Some error type IDs still say `@effect/experimental`.

## `process`

Public modules: `ChildProcess`, `ChildProcessSpawner`.

`ChildProcess` + `ChildProcessSpawner` (`Command` as Effect). Needs `NodeChildProcessSpawner` or Bun. CLI prompts also need Terminal/Stdio.

## `reactivity`

Public modules: `AsyncResult`, `Atom`, `AtomHttpApi`, `AtomRef`, `AtomRegistry`, `AtomRpc`, `Hydration`, `Reactivity`.

Two layers: (1) **`Reactivity`** key invalidation (SQL uses this); (2) **`Atom`** registry. UI bindings: `@effect/atom-react` / `atom-solid` / `atom-vue`. Also `AtomHttpApi` / `AtomRpc` / `Hydration` / `AsyncResult`.

## `rpc`

Public modules: `Rpc`, `RpcClient`, `RpcClientError`, `RpcGroup`, `RpcMessage`, `RpcMiddleware`, `RpcSchema`, `RpcSerialization`, `RpcServer`, `RpcTest`, `RpcWorker`, `Utils`.

Schema-typed RPC: `Rpc`, `RpcGroup`, `RpcClient`/`Server`, middleware, serialization, workers, `RpcTest`.

Use for binary/app protocols; HTTP APIs still use httpapi.

## `schema`

Public modules: `Model`, `VariantSchema`.

Unstable Schema extras: **`Model`** (SQL/JSON dual models), `VariantSchema`.

Used heavily with `unstable/sql`. Stable validation stays in `Schema`.

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
