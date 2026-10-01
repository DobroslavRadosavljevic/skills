# Ecosystem packages

All public v4 app packages share one version (snapshot **4.0.0**, npm `latest` since 2026-10-01). Install without a tag. `rc` / `beta` dist-tags are historical prereleases.

There is **no** `@effect/platform`, `@effect/sql`, or `@effect/ai` umbrella in v4 — `@effect/platform@latest` still resolves to the v3-era `0.97.x`, so never install it in a v4 app. Portable APIs live in `effect` / `effect/<area>`. Extra packages are **runtime implementations or vendor adapters**. The core `effect` package has **no runtime dependencies** in 4.0 (`fast-check` and `msgpackr` were dropped).

| Need | Stay on `effect` | Install |
| --- | --- | --- |
| Schema, Layer, HTTP/SQL/AI *interfaces*, Fetch client, Atom registry, OTLP HTTP | `effect`, `effect/http`, `sql`, `ai`, `reactivity`, `observability`, `workers`, `process`, `socket`, `net`, `cluster` | — |
| `runMain`, FS, HTTP *server*, sockets, workers, terminal, crypto | — | matching `@effect/platform-*` |
| Real DB | `effect/sql` | `@effect/sql-*` |
| Real LLM vendor / decision model | `effect/ai` | `@effect/ai-*` |
| React/Solid/Vue Atom | `effect/reactivity` | `@effect/atom-*` |
| Full OTel SDK | OTLP-only: `effect/observability` | `@effect/opentelemetry` |
| Vitest Effect runners | `effect/testing` | `@effect/vitest` |

**Cloudflare:** no platform package. Use core (`FetchHttpClient`, workers) plus `@effect/sql-d1` and/or `@effect/sql-sqlite-do`.

```sh
bun add effect @effect/platform-node
```

## `runMain`

| Runtime | Import | Notes |
| --- | --- | --- |
| Node | `NodeRuntime` from `@effect/platform-node` | Impl is `@effect/platform-node-shared` (`SIGINT`/`SIGTERM`) |
| Bun | `BunRuntime` from `@effect/platform-bun` | **Same shared `NodeRuntime.runMain`** |
| Deno | `DenoRuntime` from `@effect/platform-deno` | Own signals/`Deno.exit`; Deno **≥2.8.3** |
| Browser | `BrowserRuntime` from `@effect/platform-browser` | `pagehide` interrupt |

Do **not** install `@effect/platform-node-shared` in apps — node/bun/deno pull it in.

Typical: `program.pipe(Effect.provide(NodeServices.layer), NodeRuntime.runMain)`.

## Platform (`4.0.0`, peer `effect`)

| Package | When |
| --- | --- |
| `@effect/platform-node` | Node **≥18**: FS, Undici HTTP, server, workers, `NodeRedis` (peer `redis` 5–6), cluster, `NodeRuntime`. `mime` dependency dropped (core `Mime`). `Undici` re-export is `@stability unstable` |
| `@effect/platform-bun` | Bun: `Bun*` FS/HTTP/socket/worker/redis/cluster/crypto + `BunRuntime` |
| `@effect/platform-deno` | Deno **≥2.8.3**: `Deno*` services |
| `@effect/platform-browser` | Browser: IndexedDB, clipboard, geolocation, KV, workers, `BrowserRuntime`. Fetch *types* also in core |
| `@effect/platform-node-shared` | Shared Node-compat (canonical `runMain`). Transitive only |

## SQL drivers

Pair `effect/sql` with **one** driver. Only **`@effect/sql-sqlite-node` requires Node ≥22.16** (`node:sqlite` backup API). Other Node SQL drivers are Node ≥18.

| Package | Engine / runtime |
| --- | --- |
| `@effect/sql-pg` | PostgreSQL — **native wire-protocol client** in 4.0 (no `pg` dependency) |
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

`@effect/sql-pg` 4.0 breaking changes (from rc): `fromPool` / `fromClient` / `makeWith` removed — use `PgClient.make` (pool) or `makeClient` (one connection); `PgClient.listen` returns a scoped `Dequeue<string>` instead of a `Stream`; `types` takes a `PgTypes.Registry`; one statement per query string; binary codecs (`int8` → `bigint`, `date` → string, timestamps → epoch ms, `bytea` → `Uint8Array`); plain objects are no longer inferred as JSON (wrap with `sql.json`); named prepared statements on by default (`prepare: false` behind a pooler that cannot keep prepared statements between queries). New modules: `PgAuth`, `PgConnection`, `PgPool`, `PgProtocol`, `PgTypes`; `startupParameters` sets per-connection session defaults.

## AI / Atom / OTel / tests / tools

| Package | When |
| --- | --- |
| `@effect/ai-openai` / `@effect/ai-anthropic` / `@effect/ai-openai-compat` / `@effect/ai-openrouter` | Vendor HTTP + `LanguageModel` layers (generated provider schemas are `@stability unstable`) |
| `@effect/ai-typesafe` | New in 4.0: TypeSafe `DecisionModel` provider (`TypeSafeClient.layerConfig()` reads `TYPESAFE_API_KEY`) |
| `@effect/atom-react` | React 19 hooks + SSR hydration (peer `scheduler` `>=0.25 <0.28`) |
| `@effect/atom-solid` | Solid ≥1.9 |
| `@effect/atom-vue` | Vue 3.5 |
| `@effect/opentelemetry` | `NodeSdk` / `WebSdk` when you already use the OTel SDK (whole integration is `@stability unstable`) |
| `@effect/vitest` | `it.effect` / `it.live` / `it.layer` / `it.prop`; peer **vitest `>=5 <6`** |
| `@effect/docgen` / `@effect/doctest` / `@effect/openapi-generator` | Dev tooling (`openapigen` uses `NodeRuntime.runMain`; `doctest` peers vite `>=8.1.5 <9`, vitest `>=5 <6`) |

Skip private `packages/tools/*` packages at version `0.0.0` (`ai-codegen`, `bundle`, `oxc`, …).

## Version rule

If `effect` is `4.0.0`, the v4 monorepo integrations in the app must match (`4.0.x` together). Independently versioned tools (`@effect/language-service`, `@effect/tsgo`) require their own peer checks. Do not mix `4.0.0-beta.*`, `4.0.0-rc.*`, `4.0.x`, and v3 (`3.x` / `@effect/platform@0.x`).
