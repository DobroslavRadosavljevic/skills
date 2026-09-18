# Frameworks And Adapters

## Framework Matrix (Stable)

| Framework | Import | Logger access | Notes |
| --- | --- | --- | --- |
| Nuxt | `evlog/nuxt` | `useLogger(event)` (auto-import) | Stable |
| Next.js | `evlog/next` | `withEvlog` + `useLogger()` | Factory |
| SvelteKit | `evlog/sveltekit` | `event.locals.log` / `useLogger()` | Hooks |
| Nitro v2 | `evlog/nitro` | `useLogger(event)` | Module |
| Nitro v3 | `evlog/nitro/v3` | `useLogger(event)` | Module; `createError` from this subpath |
| TanStack Start | `evlog/nitro/v3` | `useRequest().context.log` | Needs `experimental.asyncContext` |
| NestJS | `evlog/nestjs` | `useLogger()` | `EvlogModule.forRoot()` |
| Express | `evlog/express` | `req.log` / `useLogger()` | |
| Hono | `evlog/hono` | `c.get('log')` in handlers; `useLogger()` in layers | Typed `EvlogVariables` |
| Fastify | `evlog/fastify` | `request.log` / `useLogger()` | Shadows pino |
| Elysia | `evlog/elysia` | route `log` / `useLogger()` | |
| React Router | `evlog/react-router` | `context.get(loggerContext)` / `useLogger()` | |
| oRPC | `evlog/orpc` | `context.log` / `useLogger()` | `withEvlog` + procedure middleware |
| Cloudflare Workers | `evlog/workers` | `createWorkersLogger()` | |
| AWS Lambda | `evlog` | `createLogger` / `createRequestLogger` | Guide: `initLogger` once per runtime |
| Astro | `evlog` | `createRequestLogger()` | Manual middleware guide |
| Standalone | `evlog` | `initLogger` + `createLogger` | |
| Custom | `evlog/toolkit` | `createMiddlewareLogger()` | Beta |

Always follow the framework page for exact middleware/module setup. Core APIs (`log.set`, `createError`, `parseError`) stay the same.

## Next.js Pattern

```ts
// lib/evlog.ts
import { createEvlog } from 'evlog/next'

export const { withEvlog, useLogger, log, createError } = createEvlog({
  service: 'my-app',
})

// app/api/hello/route.ts
export const GET = withEvlog(async () => {
  const log = useLogger()
  log.set({ action: 'hello' })
  return Response.json({ message: 'Hello!' })
})
```

Optional `instrumentation.ts` via `defineNodeInstrumentation` / `createInstrumentation` for startup + unhandled errors (can coexist with `createEvlog`; each may have its own drain). Keep Node-only drains out of Edge-evaluated roots.

## TanStack Start Pattern

Uses Nitro v3:

```ts
// nitro.config.ts
import { defineConfig } from 'nitro'
import evlog from 'evlog/nitro/v3'

export default defineConfig({
  experimental: { asyncContext: true },
  modules: [evlog({ env: { service: 'my-app' } })],
})
```

Add `evlogErrorHandler` on the root route server middleware so `createError` returns JSON with `why`/`fix`. Access logger: `useRequest().context.log` as `RequestLogger`. Optional `evlog/vite` for debug stripping + source locations.

TanStack Router **SPA** does not use this module—use client logging instead.

Nitro v3 standalone plugins: `definePlugin` from `nitro` (not `defineNitroPlugin`).

## Nuxt Pattern

```ts
export default defineNuxtConfig({
  modules: ['evlog/nuxt'],
  evlog: {
    env: { service: 'my-app' },
    routes: {
      '/api/auth/**': { service: 'auth-service' },
    },
  },
  $production: {
    evlog: {
      console: false,
      sampling: {
        rates: { info: 10, warn: 50, debug: 0, error: 100 },
        keep: [{ duration: 1000 }, { status: 400 }],
      },
    },
  },
})
```

`include` / `exclude` filter routes. **Exclude wins** if both match.

## Adapters (Where Events Go)

Cloud: `evlog/axiom`, `evlog/sentry`, `evlog/posthog`, `evlog/otlp`, `evlog/datadog`, `evlog/better-stack`, `evlog/hyperdx`  
Hybrid: `evlog/loki`, `evlog/clickhouse`  
Self-hosted: `evlog/fs` (NDJSON for agents), `evlog/memory` (Workers-friendly ring buffer), `@evlog/nuxthub`

Wire via framework hooks (`evlog:drain`) or `initLogger({ drain })` / factory options. Prefer env-based zero-config (`AXIOM_*`, `SENTRY_DSN`, `LOKI_ENDPOINT`, `CLICKHOUSE_ENDPOINT`, `DD_API_KEY`, …).

On Cloudflare Workers and Vercel Edge, drains use `waitUntil` so they finish after the response.

### Pipeline

```ts
import { createDrainPipeline } from 'evlog/pipeline'
import { createAxiomDrain } from 'evlog/axiom'
import { createSentryDrain } from 'evlog/sentry'

const pipeline = createDrainPipeline({
  batch: { size: 50, intervalMs: 5000 },
  retry: { maxAttempts: 3 },
  maxBufferSize: 1000,
})

export const drain = pipeline(async (batch) => {
  await Promise.allSettled([
    createAxiomDrain()(batch),
    createSentryDrain({ minLevel: 'error' })(batch),
  ])
})
```

Flush on shutdown. Non-blocking: response should not wait on drain I/O.

### Enrichers

`evlog/enrichers` (user-agent, geo, request size, traceparent) via `evlog:enrich` hooks or equivalent. Compose; don't replace the wide-event model.

## Client Logging

Browser `log` API + optional `createHttpLogDrain` (`evlog/http`) to POST batches to a server ingest (origin check, sanitization, `sendBeacon` on hide). Same structured mental model as server.

## Choosing Integration Depth

1. Framework module/middleware first (auto create/emit)
2. Add `log.set` on money/auth/user-critical routes
3. Add `createError` with `why`/`fix`
4. Add drain pipeline + production sampling
5. Add audit / AI / eve / client as product needs
