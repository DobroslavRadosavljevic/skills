# Source Map

Snapshot date: 2026-09-05.

Refresh official pages and package metadata for latest/current APIs, preset changes, experimental flags, or version mismatches.

## Research Snapshot

- Official site: [https://nitro.build/](https://nitro.build/)
- npm package: `nitro` **3.0.260903-beta** (“Build and Deploy Universal JavaScript Servers”).
- Nitro v2 package name was `nitropack`. Do not mix import paths.

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
- ocache (cache engine): Nitro cache docs
- Vite plugin: `nitro/vite` — https://nitro.build/docs

## Refresh Triggers

Refresh when:

- Installed `nitro` version is not the 3.0 beta line, or the app still depends on `nitropack`.
- The task is preset/provider, experimental database/tasks/OpenAPI, WebSocket, or Vite plugin behavior.
- Compatibility dates or Cloudflare/Vercel/Netlify platform APIs changed.
