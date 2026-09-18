# Plugins, Stream, Telemetry, eve

## `definePlugin`

Canonical multi-hook extension (`evlog` or `evlog/toolkit`):

```ts
import { definePlugin } from 'evlog'

export const tenantPlugin = definePlugin({
  name: 'tenant',
  onRequestStart({ logger, headers }) {
    const tenantId = headers?.['x-tenant-id']
    if (tenantId) logger.set({ tenant: { id: tenantId } })
  },
  enrich({ event }) {
    event.region = process.env.REGION
  },
})
```

Hooks (opt in as needed): `setup`, `enrich`, `drain`, `keep`, `onRequestStart`, `onRequestFinish`, `onClientLog`, `extendLogger`. Prefer one plugin object when several hooks share state.

## Observe Events

| Need | Import / API | Constraint |
| --- | --- | --- |
| Live in-process or SSE | `evlog/stream` (`createStreamDrain`) | **Local process only** — not serverless |
| Historic NDJSON | FS reader `readFsLogs` / `tailFsLogs` | Disk drain present |
| Subscribe without importing evlog | `evlog/diagnostics` (`evlog.event` channel) | Node diagnostics + Cloudflare Tail Worker |

## Toolkit (custom drains / frameworks)

`evlog/toolkit`: `defineDrain`, `defineHttpDrain`, `resolveAdapterConfig`, `httpPost`, `composeDrains`, `createMiddlewareLogger`, `defineFrameworkIntegration`. Use when no built-in adapter or framework exists.

Drain identity headers: `User-Agent` and `X-Evlog-Source` on outbound drain HTTP (override/suppress documented).

## `@evlog/telemetry` (product telemetry)

Separate package (`0.3.1`). One **run** → one `RunEvent`. Not the same as `evlog telemetry` CLI self-stats.

```sh
bun add @evlog/telemetry
```

| Surface | Entry |
| --- | --- |
| citty CLI | `withTelemetry()` + optional `defineTelemetryCommands` |
| Script | `createTelemetry({ name, version })` + `t.run('command', fn)` |
| GitHub Action | `createGitHubActionsTelemetry()` |
| Ingest API | `parseIngestBody()` from `@evlog/telemetry/ingest` |

Never reads raw `argv`. Outbox `~/.config/{tool}/telemetry/outbox.ndjson` then POST to your endpoint. Consent: `DO_NOT_TRACK`, `EVLOG_TELEMETRY=0`, persisted opt-out. Generate `TELEMETRY.md` with `generateDisclosure()`. Telemetry must not throw or block process exit.

## `evlog/eve`

One wide event per **eve agent turn** (eve `>=0.30`). Additive to eve Agent Runs / OTel.

```ts
// agent/hooks/evlog.ts
import { defineEvlogHook } from 'evlog/eve'
import { createAxiomDrain } from 'evlog/axiom'

export default defineEvlogHook({
  init: { env: { service: 'my-agent' } },
  drain: createAxiomDrain(),
})
```

In tools: `useLogger()` from `evlog/eve` (ALS). `useLogger()` never throws—missing turn logger is a no-op with a one-time warning.

Optional `defineEvlogInstrumentation()` in `agent/instrumentation.ts` stamps `evlog.request_id` / `evlog.session_id` on AI SDK spans.

Defaults: `message: 'omit'` (no user text). Pin `eve` + `evlog` in production; stream shapes may still change.

Keep eve Agent Runs. Use `evlog/eve` when you need your drains, audit, billing, or tail sampling on turns.
