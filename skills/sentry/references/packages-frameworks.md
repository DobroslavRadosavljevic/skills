# Packages & Frameworks

Install **one** primary SDK per runtime. Framework packages re-export core APIs — import from the framework package only.

Prefer: `bun add @sentry/<pkg>` (or `bun add -d` for build plugins).

## Choose a package

| Surface | Package | Notes |
|---|---|---|
| Plain browser | `@sentry/browser` | Loader Script / CDN bundles also exist |
| React SPA | `@sentry/react` | ErrorBoundary, Profiler, router helpers |
| Next.js | `@sentry/nextjs` | Client + server + edge; `withSentryConfig` |
| Vue | `@sentry/vue` | Pass `app` (+ router) into `init` |
| Svelte | `@sentry/svelte` | Browser-focused |
| SvelteKit | `@sentry/sveltekit` | Full-stack hooks |
| Angular | `@sentry/angular` | |
| Ember | `@sentry/ember` | |
| Astro | `@sentry/astro` | `astro add` / config integration |
| Gatsby | `@sentry/gatsby` | |
| Remix | `@sentry/remix` | |
| React Router framework | `@sentry/react-router` | Framework mode (not only SPA helpers) |
| Solid | `@sentry/solid` | |
| SolidStart | `@sentry/solidstart` | |
| Nuxt | `@sentry/nuxt` | |
| Nitro | `@sentry/nitro` | |
| TanStack Start (React) | `@sentry/tanstackstart-react` | Beta vs Start 1.0 RC; Cloudflare often wraps with `@sentry/cloudflare` |
| Node.js | `@sentry/node` | Default for Express/Fastify/Koa/Connect/Hapi |
| NestJS | `@sentry/nestjs` | `SentryModule` |
| Hono | `@sentry/hono` | |
| Elysia | `@sentry/elysia` | |
| Bun | `@sentry/bun` | Prefer over `@sentry/node` on Bun |
| Deno | `@sentry/deno` | |
| Cloudflare Workers/Pages | `@sentry/cloudflare` | `withSentry` / `wrapFetchWithSentry` |
| Vercel Edge | `@sentry/vercel-edge` | Often pulled via Next.js |
| AWS Lambda | `@sentry/aws-serverless` | |
| Google Cloud Functions | `@sentry/google-cloud-serverless` | |
| Effect | `@sentry/effect` | Effect runtime integration |
| Electron | `@sentry/electron` | Separate major line |
| Capacitor | `@sentry/capacitor` | Separate major line |
| React Native | `@sentry/react-native` | Separate platform + major line |
| Wasm helpers | `@sentry/wasm` | |
| Node profiling addon | `@sentry/profiling-node` | Pair with Node/Bun SDKs |
| OTel bridge | `@sentry/opentelemetry` | Advanced / custom OTel |
| Low-level Node | `@sentry/node-core` | Prefer `@sentry/node` unless you need the slim core |

Internal / usually transitive (do not add unless docs say so): `@sentry/core`, `@sentry/types`, `@sentry/browser-utils`, replay internals.

## Docs framework guides (JS)

Official guides under `https://docs.sentry.io/platforms/javascript/guides/<slug>/`:

`angular`, `astro`, `aws-lambda`, `azure-functions`, `bun`, `capacitor`, `firebase`, `cloudflare`, `connect`, `cordova`, `deno`, `effect`, `electron`, `elysia`, `ember`, `express`, `fastify`, `gatsby`, `gcp-functions`, `hapi`, `hono`, `koa`, `nestjs`, `nextjs`, `nitro`, `node`, `nuxt`, `react`, `react-router`, `remix`, `solid`, `solidstart`, `svelte`, `sveltekit`, `tanstackstart-react`, `vue`, `wasm`

Plus React Native: `https://docs.sentry.io/platforms/react-native/`

## Wizard / AI init

```sh
# Classic wizard (framework flag)
bunx @sentry/wizard@latest -i nextjs
bunx @sentry/wizard@latest -i react
bunx @sentry/wizard@latest -i sveltekit
# …other -i values per docs (angular, remix, …)

# Newer AI-assisted init (documented for some frameworks e.g. TanStack Start)
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
| `@sentry/webpack-plugin` | Webpack 5 |
| `@sentry/esbuild-plugin` | esbuild |
| `@sentry/rollup-plugin` | Rollup |
| `@sentry/cli` | Releases, sourcemaps, commits, deploys |
| `@sentry/wizard` | Interactive project setup |

## Product surface (non-SDK)

Sentry the product also includes Issues, Traces, Logs, Session Replay, Profiling, Metrics, Cron Monitoring, Uptime Monitoring, User Feedback, Size Analysis, Snapshots, Seer / Autofix / AI Code Review, Agent Tracing, MCP, and SCM/chat integrations (GitHub, Slack, Linear, …). SDK setup unlocks telemetry; product features are configured in the Sentry UI and sometimes via extra SDK flags (`enableLogs`, replay integrations, cron check-ins).
