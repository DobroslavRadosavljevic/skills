# CLI, Sampling, Audit, AI, Production

## `@evlog/cli map`

Static observability score (Lighthouse-style) for **Nuxt, Nitro, Next.js App Router, TanStack Start**.

```sh
bunx @evlog/cli map
bunx @evlog/cli map --json --no-write
bunx @evlog/cli map --min-score 80
bunx @evlog/cli map server/api/checkout.post.ts
bunx @evlog/cli doctor
```

- Writes `evlog.map.json` by default (gitignore unless you track baselines).
- **Early days** — pin CLI version when gating CI; rule sharpening can change scores without code changes.
- Fix **FIX FIRST** (sensitive routes first), then re-run to confirm score movement.
- Disable noisy checks: `// evlog-map-disable-next-line wide-event, context -- reason`

Map does **not** prove runtime quality—only that instrumentation shape exists. It follows imports one hop.

## Sampling

Two tiers:

1. **Head** — per-level keep rates (`info: 10`, `warn: 50`, `debug: 0`, `error: 100`)
2. **Tail** — force-keep after outcome: `{ status: 400 }`, `{ duration: 1000 }`, `{ path: '/api/payments/**' }` (OR)

Tail runs first conceptually for rescue; unmatched events then face head rates. Errors default to 100% unless you set `error: 0`.

Custom: `keep(ctx)` callback or Nuxt/Nitro `evlog:emit:keep` hook (`ctx.shouldKeep = true`). Prefer full logging in dev; sample in production overrides.

## Audit Trails

First-class `log.audit({ action, actor, target, outcome, ... })` on the main pipeline—not a parallel logger. Helpers include `auditOnly(drain)`, signing/hash-chain options, denials, redact-aware diffs, idempotency keys, typed action catalogs. Money/auth routes should show audit coverage in `evlog map`.

## AI Observability

```ts
import { createAILogger } from 'evlog/ai'

const ai = createAILogger(log, {
  cost: { 'claude-sonnet-4.6': { input: 3, output: 15 } },
})

// wrap model / attach telemetry integration per AI SDK docs
```

Captures tokens, tool calls, streaming metrics, estimated cost onto the wide event. Requires optional `ai` peer when using that stack.

## Filesystem Drain For Agents

```ts
import { createFsDrain } from 'evlog/fs'

createFsDrain({ dir: '.evlog/logs', maxFiles: 14 })
```

NDJSON local logs let agents analyze failures without cloud access. Pair with map + structured `why`/`fix`.

## Client → Server

`createHttpLogDrain` with batch/retry/`sendBeacon`; server validates origin and tags source. Don't expose unrestricted ingest.

## Production Checklist

- [ ] `env.service` (and route-based services if multi-service)
- [ ] Framework integration on all entry points that matter
- [ ] Wide events + nested business context on critical paths
- [ ] `createError` with `why`/`fix` on user-facing failures
- [ ] Drain pipeline with batch/retry; flush on shutdown
- [ ] Head + tail sampling in production only
- [ ] Redaction on; no secrets in context
- [ ] Audit on money/auth
- [ ] `evlog map --min-score` in CI when using supported frameworks (pinned CLI)
- [ ] Libraries don't call `initLogger`

## Common Failures

| Symptom | Fix |
| --- | --- |
| Empty / missing request logs | Integration not wrapping route; or path excluded |
| Context missing after response | Sealed logger—use `fork` or set before emit |
| `createError` not JSON on TanStack Start | Missing `evlogErrorHandler` middleware |
| Drain loss under load | Pipeline buffer/retry; await flush on shutdown |
| Map false positives | Sensitivity heuristic—inspect `evlog map <file>`; disable with comment if intentional |
| Next Edge crash on fs drain | Keep Node-only drains in Node instrumentation / route config only |
