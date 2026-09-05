# Deploy Anywhere

Same source → `.output/` in the format the host expects. **No adapter package** for first-party presets. Set `preset` or `NITRO_PRESET` when auto-detect is wrong.

Priority: explicit `preset` > `NITRO_PRESET` > CI provider detect > `defaultPreset` > runtime (`node` / `bun` / `deno`).

Providers listed at [nitro.build/deploy](https://nitro.build/deploy) include Alwaysdata, AWS Amplify, AWS Lambda, Azure, Cleavr, Cloudflare, Deno Deploy, DigitalOcean, EdgeOne, Firebase, Flightcontrol, Genezio, GitHub/GitLab Pages, Heroku, IIS, Koyeb, Netlify, Platform.sh, Render, StormKit, Vercel, Zeabur, Zephyr, Zerops, plus Node/Bun/Deno runtimes.

## Output

Typical Node build:

```bash
bunx nitro build
node .output/server/index.mjs
```

Deploy the **entire** `.output/` tree (server + public). Do not upload only `dist/` from a frontend tool unless the preset is static.

Vite: `vite build` with `nitro()` produces the same `.output/` contract.

## Node

| Preset | Use |
| --- | --- |
| `node_server` | Default standalone server |
| `node_cluster` | Multi-core (`NITRO_CLUSTER_WORKERS`) |
| `node_middleware` | Export middleware for a custom Node host |

Env: `NITRO_PORT` / `PORT` (default 3000), `NITRO_HOST` / `HOST`, `NITRO_UNIX_SOCKET`, `NITRO_SSL_CERT` + `NITRO_SSL_KEY` (testing only — terminate TLS at a proxy), `NITRO_SHUTDOWN_DISABLED`, `NITRO_SHUTDOWN_SIGNALS` (default `SIGINT SIGTERM`), `NITRO_SHUTDOWN_TIMEOUT` (ms, default 30000), `NITRO_SHUTDOWN_FORCE`.

## Bun / Deno

`preset: "bun"` — run the bun-optimized output with Bun.

Deno: `deno_server` / Deno Deploy provider docs. Prefer native Deno preset over faking Node on Deno.

## Cloudflare

Prefer **`cloudflare_module`** (Workers). **`cloudflare_pages`** only when Pages-specific routing is required; Workers is the current recommendation.

Zero-config in Cloudflare CI when detected; still set preset in GitHub Actions.

Preview: Wrangler against the generated output (see current Cloudflare deploy page).

- Extra Worker handlers: `exports.cloudflare.ts` (**no default export**) or `cloudflare.exports` in config. Hooks: `cloudflare:scheduled`, `email`, `queue`, `tail`, `trace`.
- `scheduledTasks` → Cron Triggers in generated wrangler config.
- Optional tracingChannel → custom spans plus Cloudflare instrumentation.
- Pages: generated `_routes.json`; override `cloudflare.pages.routes`.
- Bindings (KV, D1, R2): configure via Wrangler/Nitro Cloudflare options; use matching `storage` / `database` connectors.

## Vercel / Netlify

Auto-detect on those CIs. ISR/`isr` route rules and SWR map to platform primitives — do not copy Next.js-only APIs.

Vercel cron from `scheduledTasks`. Netlify: `routeRules` redirects and/or `public/_redirects`.

ISR revalidate patterns are host-specific (e.g. Vercel bypass token headers). Read the provider page before inventing cache busting.

## AWS / Azure / Firebase / others

Use the named preset on [deploy docs](https://nitro.build/deploy). Match binary/native deps to the Lambda/container ABI. SQLite files on ephemeral serverless filesystems are **not** durable.

## GitHub / GitLab Pages

Static-oriented. `static: true` / prerender must cover every public URL. No Node server on plain Pages.

## Runtime config in production

Set **`NITRO_*`** (and optional custom prefix) in the host dashboard. Do not rely on committed `.env`.

## Checklist before switching hosts

1. Build with the **target** preset locally (`NITRO_PRESET=cloudflare_module bunx nitro build`).
2. Confirm WebSocket, cron, SQLite, and `fs` storage exist on that host — replace with KV/D1/Redis as needed.
3. Confirm `compatibilityDate` if using new platform APIs.
4. Smoke the generated entry (`node`, `bun`, `wrangler`, platform CLI).
5. Check public asset URLs with `baseURL` / CDN.
