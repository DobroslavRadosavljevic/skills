---
name: sentry
description: "Build, review, debug, configure, migrate, or plan Sentry observability in TypeScript/JavaScript apps with current docs and official @sentry/* packages. Use for Sentry JS SDK 11 (and v10→v11 migration), Sentry.init, DSN, dataCollection, span streaming, beforeSendSpan, ignoreSpans, errors, tracing, Session Replay, profiling, logs, metrics, source maps, releases, Seer, OpenTelemetry, enableOpenTelemetrySetup, @sentry/nextjs, @sentry/react, @sentry/node, @sentry/browser, @sentry/vue, @sentry/svelte, @sentry/sveltekit, @sentry/nuxt, @sentry/astro, @sentry/remix, @sentry/react-router, @sentry/solid, @sentry/solidstart, @sentry/tanstackstart-react, @sentry/nestjs, @sentry/hono, @sentry/elysia, @sentry/bun, @sentry/deno, @sentry/cloudflare, @sentry/aws-serverless, @sentry/electron, @sentry/react-native, @sentry/bundler-plugins, wizard, sentry CLI, vite/webpack plugins, captureException, setUser, and setAttribute."
---

# Sentry

Use this skill for application monitoring with **Sentry** in TypeScript/JavaScript: error tracking, tracing, Session Replay, profiling, logs, metrics, source maps/releases, and framework SDKs. Snapshot **JS SDK 11.2.0** (2026-10-01; v11 is a breaking major released 2026-09-23 — v10 maintenance line is 10.75.x).

## Workflow

1. Inspect the local surface before changing code:
   - Installed `@sentry/*` versions (keep app SDKs on one line; standalone bundler plugins / CLI / wizard / RN / Electron / Capacitor are separate lines). On 10.x, decide whether the task includes the v11 upgrade before touching config.
   - Init entry: `instrument.ts`, `sentry.*.config.ts`, `instrumentation.ts`, or earliest app import.
   - Env: `SENTRY_DSN` / public DSN, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `release`, `environment`.
   - Features in use: errors, `tracesSampleRate` / `tracesSampler`, replay, profiling, logs, metrics, feedback, crons, `beforeSend*` hooks, `ignoreTransactions` / `ignoreSpans`.
   - Runtime: browser, Node (v11 needs >=20.19), Bun, Deno, Cloudflare Workers/Pages, AWS/GCP serverless, Electron, React Native.
2. Pick the **one** highest-level package that matches the framework — do not stack `@sentry/browser` + `@sentry/react` + `@sentry/nextjs`. See [packages-frameworks.md](references/packages-frameworks.md).
3. For day-to-day setup (init order, sampling, PII, APIs), follow [setup-core.md](references/setup-core.md).
4. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
5. Route deeper detail:
   - Package & framework matrix: [packages-frameworks.md](references/packages-frameworks.md)
   - Browser/Node integrations & auto-instrumentation: [integrations.md](references/integrations.md)
   - Product features (replay, logs, profiling, Seer, agents): [products-features.md](references/products-features.md)
   - Source maps, releases, bundler plugins, CLI: [sourcemaps-releases.md](references/sourcemaps-releases.md)
   - Patterns, traps, verification: [patterns-troubleshooting.md](references/patterns-troubleshooting.md)
   - v10 → v11 upgrade (defaults, removed options, framework moves): [migration-v10-to-v11.md](references/migration-v10-to-v11.md)
6. Prefer **`bun` / `bunx`** in command examples. Prefer wizard for greenfield framework setup; fall back to manual init when the repo already has custom tooling.

## Sentry Judgment

- **Init first**: load `instrument` / Sentry config before other app imports so instrumentation (channel-based in v11) and default integrations attach.
- **One SDK package** per runtime surface (client vs server may differ: e.g. Next.js uses `@sentry/nextjs` for both; TanStack Start may use `@sentry/tanstackstart-react` + Cloudflare wrap).
- **Sampling**: ship `tracesSampleRate: 1.0` only for install verification; lower in production or use `tracesSampler`. Same for replay (`replaysSessionSampleRate` / `replaysOnErrorSampleRate`) and profiling.
- **PII**: v11 removed `sendDefaultPii`; leaving `dataCollection` unset now collects user info, cookies, headers, bodies, DB query data, and GenAI I/O. Set explicit `dataCollection` denies for privacy-sensitive apps. Explicit `setUser` / tags always send.
- **v11 defaults**: span streaming (`beforeSendTransaction` / `ignoreTransactions` no-op → `beforeSendSpan` + `ignoreSpans`), logs/metrics need no flag (`enableLogs` removed), `attachStacktrace: true`, scope tags don't reach spans (use `setAttribute`).
- **Source maps**: production builds need upload (`@sentry/vite-plugin` / webpack / esbuild / rollup, framework `withSentryConfig`, or `@sentry/cli`). Delete public `.map` after upload when serving clients.
- **Shared environments** (extensions, widgets, embedded libs): do **not** call global `Sentry.init()` — use isolated `BrowserClient` + `Scope`.
- **Node preload**: v11 runs `node --import ./instrument.(m)js app.js` for both ESM and CJS; `--require` and `@sentry/node/preload|init|loader` entry points are gone.
- Framework servers: v11 captures Express/Fastify/Koa/Hapi errors automatically (`setup*ErrorHandler` deprecated; tune `shouldHandleError` on the integration). Nest still uses `SentryModule`; Hono uses `@sentry/hono/<runtime>`.
- **OpenTelemetry**: v11 server SDKs no longer own the OTel provider; use `enableOpenTelemetrySetup: true` to ingest library OTel spans, or `openTelemetryIntegration()` beside your own OTel pipeline.
- Align sibling `@sentry/*` app packages at the same **11.x** version. Do not pin standalone plugins (5.x) to the SDK version. Electron / RN / Capacitor still embed 10.x.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls @sentry/node` (or the framework package) — confirm versions align.
- Trigger a test `captureException` / throw behind a button; confirm Issue + source-mapped stack in Sentry.
- With tracing on: hit an API/page and confirm a span tree (streamed segments in v11).
- After a v11 upgrade: grep for `sendDefaultPii`, `enableLogs`, `enableMetrics`, `beforeSendTransaction`, `ignoreTransactions`, `skipOpenTelemetrySetup`, `--require`, `inboundFiltersIntegration`, `@sentry/types`, `@sentry/node-core`, and `withSentryConfig` imported from `@sentry/nextjs`.
- With replay: confirm Replay linked from the issue (sample rates may delay).
- Production build: confirm source map upload succeeded (CI logs / Sentry Releases artifacts).
- `SENTRY_AUTH_TOKEN` present in CI only; DSN is public client-safe, auth token is not.

Report which checks ran, which did not, and version assumptions that remain.
