# Ecosystem packages

All public v4 app packages share one version (`4.0.0-rc.N`, snapshot **rc.111**). Install with `@rc`. npm `latest` is v3.

There is **no** `@effect/platform`, `@effect/sql`, or `@effect/ai` umbrella. Portable APIs live in `effect` / `effect/unstable/*`. Extra packages are **runtime implementations or vendor adapters**.

| Need | Stay on `effect` | Install |
| --- | --- | --- |
| Schema, Layer, HTTP/SQL/AI *interfaces*, Fetch client, Atom registry, OTLP HTTP | `effect`, `unstable/http`, `sql`, `ai`, `reactivity`, `observability`, `workers`, `process`, `socket`, `cluster` | — |
| `runMain`, FS, HTTP *server*, sockets, workers, terminal, crypto | — | matching `@effect/platform-*` |
| Real DB | `unstable/sql` | `@effect/sql-*` |
| Real LLM vendor | `unstable/ai` | `@effect/ai-*` |
| React/Solid/Vue Atom | `unstable/reactivity` | `@effect/atom-*` |
| Full OTel SDK | OTLP-only: `unstable/observability` | `@effect/opentelemetry` |
| Vitest Effect runners | `effect/testing` | `@effect/vitest` |

**Cloudflare:** no platform package. Use core (`FetchHttpClient`, workers) plus `@effect/sql-d1` and/or `@effect/sql-sqlite-do`.

```sh
bun add effect@rc @effect/platform-node@rc
```

## `runMain`

| Runtime | Import | Notes |
| --- | --- | --- |
| Node | `NodeRuntime` from `@effect/platform-node` | Impl is `@effect/platform-node-shared` (`SIGINT`/`SIGTERM`) |
| Bun | `BunRuntime` from `@effect/platform-bun` | **Same shared `NodeRuntime.runMain`** |
| Deno | `DenoRuntime` from `@effect/platform-deno` | Own signals/`Deno.exit`; Deno **≥2.5** |
| Browser | `BrowserRuntime` from `@effect/platform-browser` | `pagehide` interrupt |

Do **not** install `@effect/platform-node-shared` in apps — node/bun/deno pull it in.

Typical: `program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)`.

## Platform (`4.0.0-rc.111`, peer `effect`)

| Package | When |
| --- | --- |
| `@effect/platform-node` | Node **≥18**: FS, Undici HTTP, server, workers, `NodeRedis` (peer `redis` 5–6), cluster, `NodeRuntime` |
| `@effect/platform-bun` | Bun: `Bun*` FS/HTTP/socket/worker/redis/cluster/crypto + `BunRuntime` |
| `@effect/platform-deno` | Deno ≥2.5: `Deno*` services |
| `@effect/platform-browser` | Browser: IndexedDB, clipboard, geolocation, KV, workers, `BrowserRuntime`. Fetch *types* also in core |
| `@effect/platform-node-shared` | Shared Node-compat (canonical `runMain`). Transitive only |

## SQL drivers

Pair `effect/unstable/sql` with **one** driver. Only **`@effect/sql-sqlite-node` requires Node ≥22.16** (`node:sqlite` backup API). Other Node SQL drivers are Node ≥18.

| Package | Engine / runtime |
| --- | --- |
| `@effect/sql-pg` | PostgreSQL (`pg`) — Node |
| `@effect/sql-pglite` | PGlite WASM — browser/Node/Bun |
| `@effect/sql-mysql2` | MySQL — Node |
| `@effect/sql-mssql` | SQL Server (`tedious`) — Node |
| `@effect/sql-libsql` | libSQL / Turso — Node-oriented |
| `@effect/sql-clickhouse` | ClickHouse — Node (+ platform-node) |
| `@effect/sql-d1` | Cloudflare D1 — Workers |
| `@effect/sql-sqlite-node` | `node:sqlite` — **Node ≥22.16** |
| `@effect/sql-sqlite-bun` | `bun:sqlite` — Bun |
| `@effect/sql-sqlite-wasm` | WASM / OPFS — browser |
| `@effect/sql-sqlite-do` | Durable Object SQLite — Cloudflare |
| `@effect/sql-sqlite-react-native` | `@op-engineering/op-sqlite` |

Key exports are typically `*Client` + `*Migrator`.

## AI / Atom / OTel / tests / tools

| Package | When |
| --- | --- |
| `@effect/ai-openai` / `ai-anthropic` / `ai-openai-compat` / `ai-openrouter` | Vendor HTTP + `LanguageModel` layers |
| `@effect/atom-react` | React 19 hooks + SSR hydration |
| `@effect/atom-solid` | Solid ≥1.9 |
| `@effect/atom-vue` | Vue 3.5 |
| `@effect/opentelemetry` | `NodeSdk` / `WebSdk` when you already use the OTel SDK |
| `@effect/vitest` | `it.effect` / `it.live` / `it.layer` / `it.prop`; vitest ^4.1 |
| `@effect/docgen` / `doctest` / `openapi-generator` | Dev tooling (`openapigen` uses `NodeRuntime.runMain`) |

Skip private `packages/tools/*` packages at version `0.0.0` (`ai-codegen`, `bundle`, `oxc`, …).

## Version rule

If `effect` is `4.0.0-rc.111`, every `@effect/*` in the app must match (or `@rc` resolving to that). Do not mix beta, rc, and v3 `latest`.
