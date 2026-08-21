# Unstable modules

Import from `effect/unstable/<area>` (barrel) or `effect/unstable/<area>/<Module>`. These **may break in minor RC releases**. Check installed types. As they stabilize they move to top-level `effect/*`.

Core HTTP/SQL/AI/RPC **interfaces** live here. **Runtime drivers** are separate `@effect/*` packages — [ecosystem.md](ecosystem.md).

## `ai`

Provider-agnostic LLM surface: `LanguageModel`, `Chat`, `EmbeddingModel`, `Tokenizer`, `Tool`/`Toolkit`, `Prompt`/`Response`, `McpServer`/`McpSchema`, `Telemetry`, `AiError`.

Use for text, schema-validated objects, streaming, tool calling, MCP. Install a provider: `@effect/ai-openai`, `@effect/ai-anthropic`, `@effect/ai-openai-compat`, `@effect/ai-openrouter`.

## `cli`

Typed CLI: `Command`, `Argument`, `Flag`, `Prompt`, `HelpDoc`, `CliError`, completions.

Use for Effect CLIs instead of raw `process.argv`. Pair with platform `runMain`.

## `cluster`

Distributed entities, sharding, runners, message/runner storage, HTTP/socket runners, singletons, cron, workflow engine bridge.

Use when you need multi-machine stateful entities/RPC. **`SingleRunner` is local/embedded but still requires a SQL client** (mailboxes/replies). Platform: `NodeClusterHttp` / `NodeClusterSocket` (or Bun). Test: `TestRunner`.

## `devtools`

DevTools client/server/schema. Default WebSocket `ws://localhost:34437`. Wire protocol is marked experimental. Needs platform `Socket`.

## `encoding`

Structured codecs over streams/bytes: **Msgpack**, **Ndjson**, **Sse**, plus **Yaml**, **Toml**, **Ini**.

Use with `Stream.pipeThroughChannel` for NDJSON/msgpack. Binary/text Base64 stays in stable `Encoding`.

## `eventlog`

Event sourcing / encrypted event log: events, journals, remote/server, SQL journals.

Use for durable event streams, not for simple `PubSub`.

## `http`

HTTP client + server primitives: `HttpClient`, `HttpClientRequest`/`Response`, `FetchHttpClient`, `HttpServer`, `HttpRouter`, `HttpMiddleware`, cookies, headers, multipart, URL, template, static server.

Use for hand-rolled HTTP. For schema-first APIs prefer **httpapi**. Live servers/clients come from `@effect/platform-*`.

## `httpapi`

Schema-first HTTP: `HttpApi`, groups/endpoints, builder, typed `HttpApiClient`, security/middleware, OpenAPI/Swagger/Scalar, `HttpApiTest` (in-memory, no real server).

Prefer this for public APIs you want typed on both sides.

## `observability`

Lightweight **OTLP** export: tracer, metrics, logs, Prometheus metrics, resource.

Prefer for new apps. Use `@effect/opentelemetry` when you already run an OTel Node SDK.

## `persistence`

`KeyValueStore`, `Persistence`/`Persistable`/`PersistedCache`/`PersistedQueue`, `RateLimiter`. **`Redis` is a service interface**, not a client — provide `NodeRedis` / `BunRedis`. Memory/FS/Web Storage/SQL/IndexedDB layers exist on KeyValueStore. Some error type IDs still say `@effect/experimental`.

## `process`

`ChildProcess` + `ChildProcessSpawner` (`Command` as Effect). Needs `NodeChildProcessSpawner` or Bun. CLI prompts also need Terminal/Stdio.

## `reactivity`

Two layers: (1) **`Reactivity`** key invalidation (SQL uses this); (2) **`Atom`** registry. UI bindings: `@effect/atom-react` / `atom-solid` / `atom-vue`. Also `AtomHttpApi` / `AtomRpc` / `Hydration` / `AsyncResult`.

## `rpc`

Schema-typed RPC: `Rpc`, `RpcGroup`, `RpcClient`/`Server`, middleware, serialization, workers, `RpcTest`.

Use for binary/app protocols; HTTP APIs still use httpapi.

## `schema`

Unstable Schema extras: **`Model`** (SQL/JSON dual models), `VariantSchema`.

Used heavily with `unstable/sql`. Stable validation stays in `Schema`.

## `socket`

`Socket` / `SocketServer` abstractions. Implementations from platform packages.

## `sql`

`SqlClient`, `Statement`, `SqlSchema`, `SqlStream`, `Migrator`, `SqlError`, `SqlModel`, `SqlResolver`, `SqlConnection`.

Use with a driver `@effect/sql-pg`, `sql-mysql2`, `sql-sqlite-*`, `sql-d1`, `sql-clickhouse`, etc. Define models with Schema/`Model.Class`.

## `workers`

`Worker`, `WorkerRunner`, transferable types, `WorkerError`.

Use for thread/worker pools. Platform packages supply the runtime.

## `workflow`

Durable workflows: `Workflow`, `Activity`, `DurableClock`, `DurableDeferred`, `DurableQueue`, `WorkflowEngine`, proxies.

Use for long-running, replayable work. In-memory `WorkflowEngine` for tests; production usually `ClusterWorkflowEngine` + SQL.
