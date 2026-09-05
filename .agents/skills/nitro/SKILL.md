---
name: nitro
description: "Build, review, debug, configure, migrate, cache, store, and deploy Nitro v3 servers anywhere. Use for nitro, nitro.config, nitro/vite, create-nitro-app, filesystem routes, server.ts / server.node.ts entries (H3, Hono, Elysia, Express, Fastify), defineHandler, defineCachedHandler, useStorage, presets, Cloudflare, Vercel, Netlify, Node, Bun, Deno, routeRules, plugins, tasks, WebSocket, OpenAPI, renderer, and nitropack→nitro migration."
---

# Nitro

Use this skill when work touches Nitro v3 ([nitro.build](https://nitro.build/)): scaffolding, Vite integration, file routes, server entry, storage/cache, presets, or deploying the same codebase to Node, Bun, Deno, workers, or serverless.

Nitro compiles routes at build time (no runtime router in the bundle). Production output is `.output/` — deploy that artifact, not the source tree.

## Workflow

1. Inspect the local Nitro surface:
   - Package: **`nitro` v3** (not `nitropack` v2). Snapshot **`3.0.260903-beta`**. Node **≥ 20**.
   - Config: `nitro.config.ts` (`defineConfig` from `"nitro"`), and/or `nitro` key + `nitro()` from `"nitro/vite"` in `vite.config.ts`.
   - Layout: `serverDir` (`false` default; often `"server"` in Vite apps), `routes/`, `middleware/`, `plugins/`, `public/`, `assets/`, optional `server.ts` / `server.node.ts`, `renderer`.
   - Preset: explicit `preset`, `NITRO_PRESET`, or CI auto-detect. Confirm `compatibilityDate` when provider features matter.
2. Refresh current docs when APIs, presets, experimental flags, or v2→v3 migration matter. Start from [source-map.md](references/source-map.md).
3. Route the work:
   - Scaffold, Vite, `defineConfig`, runtime config, dirs: [setup-config.md](references/setup-config.md).
   - Filesystem routes, methods, middleware, `routeRules`: [routing.md](references/routing.md).
   - `server.ts`, frameworks, Node vs Web format: [server-entry.md](references/server-entry.md).
   - Cache, unstorage, SQL (experimental): [cache-storage-database.md](references/cache-storage-database.md).
   - Plugins, request lifecycle, errors: [plugins-lifecycle.md](references/plugins-lifecycle.md).
   - Public/server assets, renderer, SPA: [assets-renderer.md](references/assets-renderer.md).
   - Tasks, OpenAPI, WebSocket, SSE: [tasks-openapi-websocket.md](references/tasks-openapi-websocket.md).
   - Presets, platforms, `.output`, env: [deploy.md](references/deploy.md).
   - v2 (`nitropack`) → v3: [migration.md](references/migration.md).
4. Preserve the repo’s existing framework entry and preset unless the user asks to change host or migrate.
5. Verify with a production build for the **actual** preset, then smoke the host-specific entry (see [production.md](references/production.md)).

## Core Judgment

- Prefer **`bunx create-nitro-app`**, **`bunx nitro`**, **`bunx vite`**. Keep registry names (`nitro`, dist-tags) as package facts.
- Handlers: `defineHandler` from `"nitro"`; H3 `event`. Return JSON, string, `Response`, or streams. One handler per file.
- Filesystem: `routes/` (and `routes/api/`). Method suffix `hello.get.ts`. Params `[id]`, catch-all `[...]` or `[...].ts`. Groups `(admin)` do not appear in the URL. Env suffixes `.dev` / `.prod` / `.prerender`.
- **Server entry** runs as `/**` for unmatched routes (specific `routes/` win). Returning a response stops the chain; returning nothing continues to renderer. Web `fetch` apps use `server.ts`; Node `(req, res)` use `server.node.ts` (srvx). Elysia: `export default app.compile()`. Fastify: `await app.ready(); export default app.routing`.
- **Do not** put secrets in client Vite env. Server secrets go in `runtimeConfig` and **`NITRO_`** (or custom `runtimeConfig.nitro.envPrefix`) platform env. `.env` / `.env.local` load in **`nitro dev` only**.
- Cache: `defineCachedHandler` / `defineCachedFunction` from `"nitro/cache"`. Only GET/HEAD. Default **SWR on**. Headers dropped unless `varies`. Production cache mount defaults to **memory** — mount Redis/KV/`fs` on `storage.cache` for persistence. On edge, pass `event` first into cached functions so `waitUntil` can finish writes.
- Storage: `useStorage` from `"nitro/storage"`. Root mount is in-memory. Persist via `storage` / `devStorage`. Server files live under `assets:server` / `assets/server`.
- Database (`experimental.database`) and tasks (`experimental.tasks`) are **experimental**. OpenAPI is experimental; keep production UIs off or authenticated (`openAPI.production`).
- WebSocket: `features.websocket: true` + `defineWebSocketHandler`. SSE: `createEventStream` from `"nitro/h3"`.
- Deploy: one codebase; switch with `preset` / `NITRO_PRESET`. Prefer auto-detect in CI. Cloudflare: prefer **`cloudflare_module`** over Pages unless Pages-only features are required. Node default: **`node_server`** → `node .output/server/index.mjs`. Do not treat `vite preview` as production.
- Plugins: `definePlugin` (not v2 `defineNitroPlugin`). Plugin **functions are sync**; hooks may be async. Prefix plugin filenames for order.

## Verification

Prefer repository-owned commands. For meaningful Nitro work, cover the relevant subset from [production.md](references/production.md):

- `bunx nitro --version` / lockfile `nitro` major (v3 vs `nitropack` v2).
- `bun run dev` (or `vite` with `nitro()`): hit new routes, methods, and middleware order.
- `bunx nitro build` (or `vite build`) for the **target preset**; inspect `.output/`.
- Run the preset entry locally (`node` / `bun` / wrangler) and smoke health, cookies, proxy headers, static `public/`, and API JSON.
- Cache: confirm GET cached, POST bypassed, `varies` if multi-tenant.
- Platform: env `NITRO_*`, bindings, cron/`scheduledTasks`, WebSocket, and ISR/SWR `routeRules` on that host.

Report which checks ran, which did not, and any v3-beta or preset assumptions that remain.
