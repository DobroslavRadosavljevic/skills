---
name: evlog
description: "Build, review, debug, configure, migrate, or plan evlog TypeScript logging with current docs. Use for evlog 2.29, initLogger, createLogger, createRequestLogger, useLogger, log.set, createError, parseError, withEvlog, createEvlog, drain pipelines, Axiom/Sentry/PostHog/OTLP/Datadog/Loki/ClickHouse/Better Stack/HyperDX/fs/NuxtHub adapters, sampling, redaction, catalogs, log.audit, createAILogger, evlog/eve, @evlog/telemetry, definePlugin, client HTTP drains, @evlog/cli map/doctor/init/agents, Nuxt/Next/Nitro/TanStack Start/Hono/Express/Elysia/Astro/AWS Lambda integrations, and wide-event observability."
---

# evlog

Use this skill when work touches [evlog](https://www.evlog.dev/) — wide events, structured errors, drains, sampling, audit trails, AI SDK / eve telemetry, CLI product telemetry, client logging, plugins, or `@evlog/cli map` coverage scoring.

Snapshot: `evlog@2.29.0`, `@evlog/cli@0.6.3`, `@evlog/telemetry@0.3.1` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local logging surface before changing code:
   - Package versions for `evlog`, optional `@evlog/cli` / `@evlog/telemetry` / `@evlog/nuxthub`, framework peers, and drain destinations in use.
   - Integration path: Nuxt/Nitro module, Next `createEvlog`/`withEvlog`, TanStack Start `evlog/nitro/v3`, Hono/Express/Fastify/Elysia middleware, Workers, Astro/Lambda guides, standalone `initLogger`.
   - Patterns: scattered `console`/`pino` lines vs `log.set` wide events, `createError({ why, fix })`, audits, AI wraps, eve hooks, client ingest, plugins.
2. Refresh docs when versions or APIs are unclear. Start from [source-map.md](references/source-map.md).
3. For install, three logging modes, `initLogger`, and core APIs, use [setup-core.md](references/setup-core.md).
4. For wide-event design, sealing/`fork`, structured errors, catalogs, and redaction, use [wide-events-errors.md](references/wide-events-errors.md).
5. For framework wiring and adapter choice, use [frameworks-adapters.md](references/frameworks-adapters.md).
6. For pipelines, sampling, audit, AI, client logs, and `evlog map`/CI, use [cli-advanced.md](references/cli-advanced.md).
7. For plugins, stream, diagnostics, toolkit, `@evlog/telemetry`, and `evlog/eve`, use [extend.md](references/extend.md).

## Implementation Judgment

- Prefer **one wide event per unit of work** (`log.set` then auto-`emit` or manual `emit`) over many info lines in the same request/job/turn.
- Group context into nested objects (`user`, `cart`, `payment`) with meaningful keys—not flat `userId`/`cartId` soup or a generic `data` bag.
- Use the right mode: `log.*` for one-shots; `createLogger` / `createRequestLogger` when you own the lifecycle; framework `useLogger` / `req.log` / `c.get('log')` when middleware owns create+emit.
- Tagged `log.info('tag', 'message')` is console-only in pretty mode. Object form always hits drains.
- Throw `createError({ message, status, why, fix, link?, code?, internal? })` instead of bare `Error`. Parse on clients with `parseError`.
- After emit (or sampled drop), the logger is **sealed**—post-response `set` is ignored. Use `log.fork` (where available) for intentional background child events.
- Libraries and shared packages: use `createLogger` / accept a logger; do **not** call `initLogger` and force a drain on the host.
- Production: wrap adapters in `createDrainPipeline` (batch + retry); enable head+tail sampling; keep errors and money/auth paths.
- On Nuxt/Nitro/Next/TanStack Start/Hono, run `bunx @evlog/cli map` before large logging refactors—fix FIX FIRST first. Pin CLI version in CI.

## Verification

Prefer the repo's existing checks. For meaningful evlog changes, include the relevant subset:

- Hit a route/job locally and confirm **one** wide event with expected nested fields (pretty in dev).
- Force a `createError` path and confirm `why`/`fix` in logs and client `parseError`.
- `bunx @evlog/cli map` / `doctor` when changing entry-point coverage or setup.
- Drain smoke (Axiom/Sentry/Loki/fs NDJSON) when changing pipelines; flush on shutdown.
- Sampling config check: errors and `keep` rules still retained in production-shaped config.
- Typecheck for `RequestLogger`, typed fields, and catalog imports.
