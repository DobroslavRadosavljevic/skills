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

Minimum **Node 20**.

`srcDir` → `serverDir`.

Vite is a first-class plugin (`nitro()` from `nitro/vite`), not an afterthought.

Server entry + BYO framework (Hono/Elysia/Express) is the v3 way to wrap an existing app.

## Behavior to re-test

- Auto-imports vs explicit `nitro/*` imports
- Preset names (`cloudflare_module` vs older Workers/Pages names)
- Cache mount (memory in prod) — v3 apps that “worked” on one Node process will miss cache on serverless
- Plugin hook names (`request` / `response` / `error` / `close`)
- OpenAPI / tasks / database flags

Do not leave both `nitropack` and `nitro` in dependencies.
