# Migration (Nitro 2 → 3)

Living guide: https://nitro.build/docs/migration

Nitro 3 is published as **`nitro`** (beta). Nitro 2 was **`nitropack`**.

## Package and imports

```diff
- "nitropack": "..."
+ "nitro": "..."
```

Nightly: `nitro-nightly` / docs nightly channel — only when the user asked for main-branch bits.

```diff
- import { defineNitroConfig } from "nitropack/config"
+ import { defineConfig } from "nitro"
```

```diff
- export default defineNitroPlugin((nitroApp) => {
+ import { definePlugin } from "nitro"
+ export default definePlugin((nitroApp) => {
```

Runtime utils moved to **subpath exports**:

```diff
- import { useStorage } from "nitropack/runtime/storage"
+ import { useStorage } from "nitro/storage"
```

Also: `nitro/cache`, `nitro/database`, `nitro/runtime-config`, `nitro/task`, `nitro/vite`, `nitro/h3`.

## Platform

Node **`^20.19.0 || >=22.12.0`**.

No peer dependencies: Nitro resolves builders (`vite@^7 || ^8`, `rollup@^4`, `rolldown@>=1`), preset packages, storage drivers, and DB connector clients from the project and prompts to install missing ones (auto-installs in CI).

`srcDir` → `serverDir`.

Vite is a first-class plugin (`nitro()` from `nitro/vite`), not an afterthought.

Server entry + BYO framework (Hono/Elysia/Express) is the v3 way to wrap an existing app.

## Behavior to re-test

- Auto-imports vs explicit `nitro/*` imports
- Preset names (`cloudflare_module` vs older Workers/Pages names)
- Cache mount (memory in prod) — v3 apps that “worked” on one Node process will miss cache on serverless
- Plugin hook names (`request` / `response` / `error` / `close`)
- `basicAuth` route rules (removed; use `basicAuth` from `nitro/h3` middleware)
- OpenAPI / tasks / database flags

## Upgrading earlier v3 betas to `3.0.260903-beta`

- **Cache defaults changed (ocache 0.1 → 0.3):** `swr` defaults to `false`; query params are ignored unless `allowQuery`; cookies are stripped and `Set-Cookie` responses are not cached unless `allowCookies`; `authorization` stripped unless `allowAuthorization`; GET and HEAD cache separately; keys include the request origin (drop `varies: ['host']`); 30 s `maxResolveTime`; `Last-Modified` is no longer generated. Re-check every `defineCachedHandler`, `defineCachedFunction`, and `cache`/`swr` route rule.
- **Route rules:** new rou3 0.9 engine (canonical path, specificity order); `GET` answers `HEAD`; new `cors` rule; `basicAuth` rule removed.
- **Types:** `NitroRouteConfig` / `NitroRouteRules` are deprecated aliases for `RouteRuleConfig` / `NormalizedRouteRules`.
- **Database:** db0 0.4 passes client libraries explicitly to connectors; new `neon`, `prisma`, `libsql-core` connectors.
- **Dev tasks endpoints** (`/_nitro/tasks*`) accept only local requests.
- **Cloudflare dev** uses Miniflare/`workerd` directly; bindings are on `event.req.runtime.cloudflare.env`.

Do not leave both `nitropack` and `nitro` in dependencies.
