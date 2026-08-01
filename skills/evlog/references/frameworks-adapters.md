# Frameworks And Adapters

## Framework Matrix (Stable)

| Framework | Import | Logger access |
| --- | --- | --- |
| Nuxt | `evlog/nuxt` | `useLogger(event)` (auto-import) |
| Next.js | `evlog/next` | `withEvlog` + `useLogger()` |
| SvelteKit | `evlog/sveltekit` | `event.locals.log` / `useLogger()` |
| Nitro v2 | `evlog/nitro` | `useLogger(event)` |
| Nitro v3 / TanStack Start | `evlog/nitro/v3` | `useRequest().context.log` |
| NestJS | `evlog/nestjs` | module middleware |
| Express | `evlog/express` | `req.log` |
| Hono | `evlog/hono` | `c.get('log')` |
| Fastify | `evlog/fastify` | `request.log` |
| Elysia | `evlog/elysia` | route context `log` |
| React Router | `evlog/react-router` | context / `useLogger()` |
| oRPC | `evlog/orpc` | `withEvlog` + procedure middleware |
| Cloudflare Workers | `evlog/workers` | worker fetch helpers |
| Standalone | `evlog` | `initLogger` + `createLogger` |

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

Add `evlogErrorHandler` on the root route server middleware so `createError` returns JSON with `why`/`fix`. Access logger: `useRequest().context.log`. Optional `evlog/vite` for debug stripping + source locations.

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

## Adapters (Where Events Go)

Cloud: `evlog/axiom`, `evlog/sentry`, `evlog/posthog`, `evlog/otlp`, `evlog/datadog`, `evlog/better-stack`, `evlog/hyperdx`  
Self-hosted: `evlog/fs` (NDJSON for agents), `evlog/memory` (Workers-friendly ring buffer)

Wire via framework hooks (`evlog:drain`) or `initLogger({ drain })` / factory options. Prefer env-based zero-config where documented (Axiom/Sentry/…).

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

`evlog/enrichers` (user-agent, request size, …) via `evlog:enrich` hooks or equivalent. Compose; don't replace the wide-event model.

## Client Logging

Browser `log` API + optional `createHttpLogDrain` (`evlog/http`) to POST batches to a server ingest (origin check, sanitization, `sendBeacon` on hide). Same structured mental model as server.

## Choosing Integration Depth

1. Framework module/middleware first (auto create/emit)
2. Add `log.set` on money/auth/user-critical routes
3. Add `createError` with `why`/`fix`
4. Add drain pipeline + production sampling
5. Add audit / AI / client as product needs
