# Production Checklist

Use this before calling a Nitro change “done.” Match the **actual preset**, not Node-on-laptop alone.

## Build identity

- [ ] Dependency is `nitro` v3 (not `nitropack`)
- [ ] `nitro.config.ts` / Vite `nitro()` agree on `serverDir`, `preset`, `runtimeConfig`
- [ ] `bunx nitro build` or `vite build` succeeds for `NITRO_PRESET` / auto-detect
- [ ] `.output/server` and `.output/public` both exist when the host needs them
- [ ] No secrets in client bundles; server secrets only via `NITRO_*` (or configured prefix)

## HTTP surface

- [ ] File routes: methods, params, groups, ignore globs
- [ ] Middleware order (`01_` prefixes) and no accidental returns
- [ ] Server entry does not steal `/api/**` (specific routes win)
- [ ] Renderer/SPA does not swallow API routes
- [ ] Error handler JSON vs HTML as intended
- [ ] CORS, cookies, `x-forwarded-*`, `baseURL`

## Data

- [ ] `storage` mounts are durable on the target (not memory) if data must persist
- [ ] `cache` mount is shared across instances if SWR/ISR must be consistent
- [ ] Cached handlers: GET-only, `varies` for Host/auth variance, edge `event` first arg
- [ ] Database connector matches the platform (D1 vs SQLite file vs Postgres)
- [ ] `devDatabase` / `devStorage` not accidentally used in production config

## Platform

- [ ] Cloudflare: Workers vs Pages preset; bindings; `exports.cloudflare.ts` if needed
- [ ] Cron: `scheduledTasks` generated for CF/Vercel; `CRON_SECRET` on Vercel
- [ ] WebSocket enabled only where the host supports it
- [ ] OpenAPI production endpoints authenticated or disabled
- [ ] Tasks HTTP triggers authenticated
- [ ] Graceful shutdown env on Node
- [ ] Compatibility date set if relying on new provider behavior

## Smoke

- [ ] Process starts (`node .output/server/index.mjs` or host CLI)
- [ ] `GET` health + one dynamic route + one `POST`
- [ ] Static file from `public/` + 304
- [ ] One cached route (second request faster / 304)
- [ ] Log/error hook fires on a thrown handler

Report skipped boxes and why (no WS host, experimental flag off, etc.).
