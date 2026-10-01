# Packages & Frameworks

Install **one** primary SDK per runtime. Framework packages re-export core APIs — import from the framework package only.

Prefer: `bun add @sentry/<pkg>` (or `bun add -d` for build plugins).

## Choose a package

| Surface | Package | Notes |
|---|---|---|
| Plain browser | `@sentry/browser` | Loader Script / CDN bundles also exist |
| React SPA | `@sentry/react` | ErrorBoundary, Profiler, router helpers |
| Next.js | `@sentry/nextjs` | Next 14+ on v11; client + server + edge; `withSentryConfig` from `@sentry/nextjs/config` |
| Vue | `@sentry/vue` | Pass `app` (+ router) into `init` |
| Svelte | `@sentry/svelte` | Browser-focused |
| SvelteKit | `@sentry/sveltekit` | Full-stack hooks |
| Angular | `@sentry/angular` | |
| Ember | `@sentry/ember` | |
| Astro | `@sentry/astro` | Astro 4+ on v11; integration takes build options only, runtime options live in `sentry.*.config.ts` |
| Gatsby | `@sentry/gatsby` | |
| Remix | `@sentry/remix` | Vite plugin at `@sentry/remix/vite`; Remix 3 via `--import @sentry/remix/v3/node` (11.2) |
| React Router framework | `@sentry/react-router` | Out of beta in v11; RR 7.15+; Vite helpers at `@sentry/react-router/vite` |
| Solid | `@sentry/solid` | |
| SolidStart | `@sentry/solidstart` | |
| Nuxt | `@sentry/nuxt` | v11 bundles `sentry.server.config.ts` into Nitro — no `--import` preload |
| Nitro | `@sentry/nitro` | |
| TanStack Start (React) | `@sentry/tanstackstart-react` | Still **beta** (targets Start 1.0 RC); `bunx sentry@latest init`; Cloudflare often wraps with `@sentry/cloudflare` |
| Node.js | `@sentry/node` | Node >=20.19 on v11; default for Express/Fastify/Koa/Hapi (Connect instrumentation removed in v11) |
| NestJS | `@sentry/nestjs` | `SentryModule` |
| Hono | `@sentry/hono` | Runtime subpaths `/node`, `/cloudflare`, `/bun`, `/deno`; auto-instrumented since 11.2 |
| Elysia | `@sentry/elysia` | |
| Bun | `@sentry/bun` | Prefer over `@sentry/node` on Bun |
| Deno | `@sentry/deno` | Deno 2.8.3+ on v11 |
| Cloudflare Workers/Pages | `@sentry/cloudflare` | `withSentry` / `wrapFetchWithSentry`; v11 requires `nodejs_compat`; `/request` subpath for runtimes without it |
| Vercel Edge | `@sentry/vercel-edge` | Often pulled via Next.js; no `ai` instrumentation on Edge in v11 |
| AWS Lambda | `@sentry/aws-serverless` | v11 layer `SentryNodeServerlessSDKv11` (nodejs20.x+) |
| Google Cloud Functions | `@sentry/google-cloud-serverless` | |
| Effect | `@sentry/effect` | Effect runtime integration |
| Electron | `@sentry/electron` | Separate major line (7.x, embeds JS SDK 10.x) |
| Capacitor | `@sentry/capacitor` | Separate major line (4.x, embeds JS SDK 10.x) |
| React Native | `@sentry/react-native` | Separate platform + major line (8.x, embeds JS SDK 10.x) |
| Wasm helpers | `@sentry/wasm` | |
| Node profiling addon | `@sentry/profiling-node` | Pair with Node/Bun SDKs |
| OTel bridge | `@sentry/opentelemetry` | Advanced / custom OTel (most users need only `enableOpenTelemetrySetup` or `openTelemetryIntegration()`) |

Removed in v11: `@sentry/node-core` (merged into `@sentry/node`), `@sentry/types` (types from `@sentry/core`), `@sentry/tanstackstart`.

Internal / usually transitive (do not add unless docs say so): `@sentry/core` (`/browser` and `/server` subpaths in v11), `@sentry/server-utils`, `@sentry/bundler-plugins`, `@sentry/browser-utils`, replay internals.

## Docs framework guides (JS)

Official guides under `https://docs.sentry.io/platforms/javascript/guides/<slug>/`:

`angular`, `astro`, `aws-lambda`, `azure-functions`, `bun`, `capacitor`, `firebase`, `cloudflare`, `cordova`, `deno`, `effect`, `electron`, `elysia`, `ember`, `express`, `fastify`, `gatsby`, `gcp-functions`, `hapi`, `hono`, `koa`, `nestjs`, `nextjs`, `nitro`, `node`, `nuxt`, `react`, `react-router`, `remix`, `solid`, `solidstart`, `svelte`, `sveltekit`, `tanstackstart-react`, `vue`, `wasm`

Plus React Native: `https://docs.sentry.io/platforms/react-native/`

## Wizard / AI init

```sh
# Classic wizard (framework flag) — wizard 8.x installs SDK ^11
bunx @sentry/wizard@latest -i nextjs
bunx @sentry/wizard@latest -i react
bunx @sentry/wizard@latest -i sveltekit
# …other -i values per docs (angular, remix, …)

# New `sentry` CLI AI-assisted init (primary path for TanStack Start)
bunx sentry@latest init
```

Wizard creates DSN wiring, init files, and often source-map upload config. Prefer it for greenfield; for existing apps, copy patterns into the repo’s conventions.

## Full-stack pairing

| Frontend | Backend | Tip |
|---|---|---|
| `@sentry/react` | `@sentry/node` / Nest / Hono / Elysia | Set matching `tracePropagationTargets` + propagate trace headers |
| `@sentry/nextjs` | (included) | Separate `sentry.client/server/edge.config` + `instrumentation.ts` |
| `@sentry/sveltekit` | (included) | Use kit hooks |
| TanStack Start | Cloudflare / Node | Follow current TanStack Start + host guide; may need `wrapFetchWithSentry` |
| SPA + API | Two projects or one org with two projects | Link via distributed tracing, not by sharing one DSN incorrectly across unrelated apps |

## Tooling packages (dev)

| Package | Role |
|---|---|
| `@sentry/vite-plugin` | Vite source maps + release |
| `@sentry/webpack-plugin` | Webpack 5.1+ |
| `@sentry/esbuild-plugin` | esbuild |
| `@sentry/rollup-plugin` | Rollup |
| `@sentry/cli` | Releases, sourcemaps, commits, deploys |
| `@sentry/wizard` | Interactive project setup |

## Product surface (non-SDK)

Sentry the product also includes Issues, Traces, Logs, Session Replay, Profiling, Metrics, Cron Monitoring, Uptime Monitoring, User Feedback, Size Analysis, Snapshots, Seer / Autofix / AI Code Review, Agent Tracing, MCP, and SCM/chat integrations (GitHub, Slack, Linear, …). SDK setup unlocks telemetry; product features are configured in the Sentry UI and sometimes via SDK APIs or integrations (`Sentry.logger.*`, `Sentry.metrics.*`, replay integrations, cron check-ins).
