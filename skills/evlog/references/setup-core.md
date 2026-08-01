# Setup And Core API

## Install

```sh
bun add evlog
```

Optional CLI (early, separate package):

```sh
bunx @evlog/cli map
# pin in CI when gating: bun add -d @evlog/cli@<version>
```

Interactive wiring: `bunx @evlog/cli init` (or `evlog init` when installed). Upstream also offers `bunx skills add https://www.evlog.dev` for their agent skills pack.

Requires TypeScript **5+** for best inference. Ships its own types.

## Three Modes (Same Foundation)

| Mode | API | Emit | When |
| --- | --- | --- | --- |
| Simple | `log.info` / `warn` / `error` / `debug` | Immediate | One-off events, libraries steps, client |
| Wide (manual) | `createLogger` / `createRequestLogger` | **`log.emit()`** | Scripts, jobs, queues, non-framework HTTP |
| Wide (request) | Framework middleware + `useLogger` / `req.log` / … | Auto on response end | API routes in integrated frameworks |

All share drains, redaction, sampling, pretty(dev)/JSON(prod) defaults.

## Simple Logging

```ts
import { log } from 'evlog'

log.info('auth', 'User logged in') // tagged
log.error({ action: 'payment', error: 'card_declined' }) // structured → drains
```

## Manual Wide Events

```ts
import { initLogger, createLogger, createRequestLogger } from 'evlog'

initLogger({ env: { service: 'sync-worker' } })

const log = createLogger({ jobId: job.id, queue: 'emails' })
log.set({ batch: { size: 50, processed: 50 } })
log.emit()

const reqLog = createRequestLogger({ method: 'POST', path: '/api/checkout' })
reqLog.set({ user: { id: 1 } })
reqLog.emit()
```

**Libraries / published packages:** prefer `createLogger` (or accept a logger arg). Do not call `initLogger` in library code—host owns global config and drain.

## Request Logger (Framework)

Middleware creates and emits the wide event. Retrieve and enrich:

```ts
import { useLogger } from 'evlog'

export default defineEventHandler(async (event) => {
  const log = useLogger(event)
  log.set({ user: { id: 1, plan: 'pro' } })
  log.set({ cart: { items: 3, total: 9999 } })
  return { ok: true }
})
```

Access differs by framework (`useLogger(event)`, `useLogger()`, `req.log`, `c.get('log')`, `event.locals.log`, `useRequest().context.log`). See [frameworks-adapters.md](frameworks-adapters.md).

Service name priority (typical): explicit `useLogger(event, 'name')` → route config → `env.service` → auto-detect.

## Structured Errors

```ts
import { createError, parseError } from 'evlog'

throw createError({
  message: 'Payment failed', // user-facing
  status: 402,
  code: 'PAYMENT_DECLINED',
  why: 'Card declined by issuer',
  fix: 'Try a different payment method',
  link: 'https://docs.example.com/payments/declined',
  // internal: { stripeCode: '...' } // logs only — never in HTTP/parseError
})
```

Client:

```ts
const error = parseError(err)
// message, status, why, fix, link, code
```

## Core Methods On Wide Loggers

- `set(partial)` — deep-merge context (incremental)
- `error(err)` / `warn` / `info` — level + optional context; `error` promotes level
- `setLevel('error' | 'warn' | 'info' | 'debug')` — promote without replacing custom error shapes
- `emit()` — seal and send (manual mode)
- `getContext()` — inspect accumulated context
- `fork?(label, fn)` — child wide event with `_parentRequestId` (where supported)
- `audit(...)` — compliance who-did-what (see advanced ref)

## Minimal Standalone Init + Drain

```ts
import type { DrainContext } from 'evlog'
import { initLogger } from 'evlog'
import { createAxiomDrain } from 'evlog/axiom'
import { createDrainPipeline } from 'evlog/pipeline'

const pipeline = createDrainPipeline<DrainContext>({
  batch: { size: 50, intervalMs: 5000 },
  retry: { maxAttempts: 3 },
})

initLogger({
  env: { service: 'my-script' },
  drain: pipeline(createAxiomDrain()),
})
```
