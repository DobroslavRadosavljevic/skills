---
name: evlog
description: "Build, review, debug, configure, migrate, or plan evlog TypeScript logging with current docs. Use for evlog, initLogger, createLogger, createRequestLogger, useLogger, log.set, createError, parseError, withEvlog, createEvlog, drain pipelines, Axiom/Sentry/PostHog/OTLP/fs adapters, sampling, redaction, catalogs, log.audit, createAILogger, client HTTP drains, @evlog/cli map/doctor/init, Nuxt/Next/Nitro/TanStack Start/Hono/Express/Elysia integrations, and wide-event observability."
---

# evlog

Use this skill when work touches [evlog](https://www.evlog.dev/) — wide events, structured errors, drains, sampling, audit trails, AI SDK telemetry, client logging, or `@evlog/cli map` coverage scoring.

## Workflow

1. Inspect the local logging surface before changing code:
   - Package versions for `evlog`, optional `@evlog/cli`, framework peers, and drain destinations in use.
   - Integration path: Nuxt/Nitro module, Next `createEvlog`/`withEvlog`, TanStack Start `evlog/nitro/v3`, Hono/Express/Fastify/Elysia middleware, standalone `initLogger`, Workers, etc.
   - Patterns: scattered `console`/`pino` lines vs `log.set` wide events, `createError({ why, fix })`, audits, AI wraps, client ingest.
2. Refresh docs when versions or APIs are unclear. Start from [source-map.md](references/source-map.md).
3. For install, three logging modes, `initLogger`, and core APIs, use [setup-core.md](references/setup-core.md).
4. For wide-event design, sealing/`fork`, structured errors, catalogs, and redaction, use [wide-events-errors.md](references/wide-events-errors.md).
5. For framework wiring and adapter choice, use [frameworks-adapters.md](references/frameworks-adapters.md).
6. For pipelines, sampling, audit, AI, client logs, and `evlog map`/CI, use [cli-advanced.md](references/cli-advanced.md).

## Implementation Judgment

- Prefer **one wide event per unit of work** (`log.set` then auto-`emit` or manual `emit`) over many info lines in the same request/job.
- Group context into nested objects (`user`, `cart`, `payment`) with meaningful keys—not flat `userId`/`cartId` soup or a generic `data` bag.
- Use the right mode: `log.*` for one-shots; `createLogger` / `createRequestLogger` when you own the lifecycle; framework `useLogger` / `req.log` / `c.get('log')` when middleware owns create+emit.
- Throw `createError({ message, status, why, fix, link?, code?, internal? })` instead of bare `Error`. Parse on clients with `parseError`.
- After emit (or sampled drop), the logger is **sealed**—post-response `set` is ignored. Use `log.fork` (where available) for intentional background child events.
- Libraries and shared packages: use `createLogger` / accept a logger; do **not** call `initLogger` and force a drain on the host.
- Production: wrap adapters in `createDrainPipeline` (batch + retry); enable head+tail sampling; keep errors and money/auth paths.
- On Nuxt/Nitro/Next/TanStack Start, run `bunx @evlog/cli map` (or `npx @evlog/cli map`) before large logging refactors—fix FIX FIRST first. Pin CLI version in CI.

## Verification

Prefer the repo's existing checks. For meaningful evlog changes, include the relevant subset:

- Hit a route/job locally and confirm **one** wide event with expected nested fields (pretty in dev).
- Force a `createError` path and confirm `why`/`fix` in logs and client `parseError`.
- `bunx @evlog/cli map` / `doctor` when changing entry-point coverage or setup.
- Drain smoke (Axiom/Sentry/fs NDJSON) when changing pipelines; flush on shutdown.
- Sampling config check: errors and `keep` rules still retained in production-shaped config.
- Typecheck for `RequestLogger`, typed fields, and catalog imports.
