# Source Map

Snapshot date: 2026-10-01.

Refresh official pages and package metadata for latest/current APIs, preset changes, experimental flags, or version mismatches.

## Research Snapshot

- Official site: [https://nitro.build/](https://nitro.build/)
- npm package: `nitro` **3.0.260903-beta** (`latest` dist-tag; released 2026-09-03). Nightly builds publish as `nitro-nightly` (`3.0.1-<date>-<sha>`).
- Nitro v2 package name was `nitropack` (`latest` `2.13.4`, maintenance). Do not mix import paths.
- `3.0.260903-beta` upgraded h3, srvx, rou3 0.9, ocache 0.3, db0 0.4, crossws 0.4.12, and dropped all peer dependencies. Release notes: https://github.com/nitrojs/nitro/releases/tag/v3.0.260903-beta

## Official Docs (current)

- Introduction: https://nitro.build/docs
- Quick start: https://nitro.build/docs/quick-start
- Routing: https://nitro.build/docs/routing
- Server entry: https://nitro.build/docs/server-entry
- Cache: https://nitro.build/docs/cache
- KV storage: https://nitro.build/docs/storage
- Assets: https://nitro.build/docs/assets
- Configuration: https://nitro.build/docs/configuration
- Config reference: https://nitro.build/config
- Database (experimental): https://nitro.build/docs/database
- Lifecycle: https://nitro.build/docs/lifecycle
- OpenAPI (experimental): https://nitro.build/docs/openapi
- Plugins: https://nitro.build/docs/plugins
- Tasks (experimental): https://nitro.build/docs/tasks
- WebSocket: https://nitro.build/docs/websocket
- Renderer: https://nitro.build/docs/renderer
- Prerendering: https://nitro.build/docs/prerendering
- Modules: https://nitro.build/docs/modules
- CLI: https://nitro.build/docs/cli
- Vite: https://nitro.build/docs/vite
- Utils: https://nitro.build/docs/utils
- TypeScript: https://nitro.build/docs/typescript
- Migration v2→v3: https://nitro.build/docs/migration
- Nightly: https://nitro.build/docs/nightly
- Deploy: https://nitro.build/deploy
- Examples: https://nitro.build/examples

## Deploy

- Node: https://nitro.build/deploy/runtimes/node
- Bun: https://nitro.build/deploy/runtimes/bun
- Deno: https://nitro.build/deploy/runtimes/deno
- Cloudflare: https://nitro.build/deploy/providers/cloudflare
- Vercel: https://nitro.build/deploy/providers/vercel
- Netlify: https://nitro.build/deploy/providers/netlify
- AWS Lambda: https://nitro.build/deploy/providers/aws
- Azure: https://nitro.build/deploy/providers/azure
- Full provider list: https://nitro.build/deploy

## Adjacent libraries (Nitro-owned integrations)

- H3: https://h3.dev/
- unstorage: https://unstorage.unjs.io/
- db0: https://db0.unjs.io/
- CrossWS: https://crossws.h3.dev/
- ocache (cache engine): https://ocache.unjs.io/ (migration: https://ocache.unjs.io/docs/migration)
- rou3 / h3 route rules: https://h3.dev/guide/rules
- Vite plugin: `nitro/vite` — https://nitro.build/docs

## Refresh Triggers

Refresh when:

- Installed `nitro` version is not the 3.0 beta line, or the app still depends on `nitropack`.
- The task is preset/provider, experimental database/tasks/OpenAPI, WebSocket, or Vite plugin behavior.
- Compatibility dates or Cloudflare/Vercel/Netlify platform APIs changed.
