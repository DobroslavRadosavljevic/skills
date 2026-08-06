---
name: sentry
description: "Build, review, debug, configure, migrate, or plan Sentry observability in TypeScript/JavaScript apps with current docs and official @sentry/* packages. Use for Sentry.init, DSN, errors, tracing, Session Replay, profiling, logs, metrics, source maps, releases, Seer, OpenTelemetry, @sentry/nextjs, @sentry/react, @sentry/node, @sentry/browser, @sentry/vue, @sentry/svelte, @sentry/sveltekit, @sentry/nuxt, @sentry/astro, @sentry/remix, @sentry/react-router, @sentry/solid, @sentry/solidstart, @sentry/tanstackstart-react, @sentry/nestjs, @sentry/hono, @sentry/elysia, @sentry/bun, @sentry/deno, @sentry/cloudflare, @sentry/aws-serverless, @sentry/electron, @sentry/react-native, wizard, vite/webpack plugins, captureException, and setUser."
---

# Sentry

Use this skill for application monitoring with **Sentry** in TypeScript/JavaScript: error tracking, tracing, Session Replay, profiling, logs, metrics, source maps/releases, and framework SDKs. Snapshot **JS SDK 10.69.0** (2026-08-06).

## Workflow

1. Inspect the local surface before changing code:
   - Installed `@sentry/*` versions (keep app SDKs on one line; bundler plugins / CLI / wizard / RN / Electron / Capacitor are separate lines).
   - Init entry: `instrument.ts`, `sentry.*.config.ts`, `instrumentation.ts`, or earliest app import.
   - Env: `SENTRY_DSN` / public DSN, `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, `SENTRY_PROJECT`, `release`, `environment`.
   - Features in use: errors, `tracesSampleRate` / `tracesSampler`, replay, profiling, `enableLogs`, metrics, feedback, crons.
   - Runtime: browser, Node, Bun, Deno, Cloudflare Workers/Pages, AWS/GCP serverless, Electron, React Native.
2. Pick the **one** highest-level package that matches the framework — do not stack `@sentry/browser` + `@sentry/react` + `@sentry/nextjs`. See [packages-frameworks.md](references/packages-frameworks.md).
3. For day-to-day setup (init order, sampling, PII, APIs), follow [setup-core.md](references/setup-core.md).
4. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
5. Route deeper detail:
   - Package & framework matrix: [packages-frameworks.md](references/packages-frameworks.md)
   - Browser/Node integrations & auto-instrumentation: [integrations.md](references/integrations.md)
   - Product features (replay, logs, profiling, Seer, agents): [products-features.md](references/products-features.md)
   - Source maps, releases, bundler plugins, CLI: [sourcemaps-releases.md](references/sourcemaps-releases.md)
   - Patterns, traps, verification: [patterns-troubleshooting.md](references/patterns-troubleshooting.md)
6. Prefer **`bun` / `bunx`** in command examples. Prefer wizard for greenfield framework setup; fall back to manual init when the repo already has custom tooling.

## Sentry Judgment

- **Init first**: load `instrument` / Sentry config before other app imports so OpenTelemetry hooks and default integrations attach.
- **One SDK package** per runtime surface (client vs server may differ: e.g. Next.js uses `@sentry/nextjs` for both; TanStack Start may use `@sentry/tanstackstart-react` + Cloudflare wrap).
- **Sampling**: ship `tracesSampleRate: 1.0` only for install verification; lower in production or use `tracesSampler`. Same for replay (`replaysSessionSampleRate` / `replaysOnErrorSampleRate`) and profiling.
- **PII**: prefer `dataCollection` (since 10.57) over deprecated `sendDefaultPii`. Explicit `setUser` / tags always send.
- **Source maps**: production builds need upload (`@sentry/vite-plugin` / webpack / esbuild / rollup, framework `withSentryConfig`, or `@sentry/cli`). Delete public `.map` after upload when serving clients.
- **Shared environments** (extensions, widgets, embedded libs): do **not** call global `Sentry.init()` — use isolated `BrowserClient` + `Scope`.
- **Node CJS vs ESM**: CJS `require("./instrument")` first; ESM needs `--import` / loader hook patterns from current Node docs.
- Framework servers (Express/Fastify/Koa/Hono/Nest/Elysia): register **error handlers after routes** (`setupExpressErrorHandler`, Nest `SentryModule`, etc.).
- Align sibling `@sentry/*` app packages at the same **10.x** version. Do not pin plugins to the SDK version.

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls @sentry/node` (or the framework package) — confirm versions align.
- Trigger a test `captureException` / throw behind a button; confirm Issue + source-mapped stack in Sentry.
- With tracing on: hit an API/page and confirm a transaction/span tree.
- With replay: confirm Replay linked from the issue (sample rates may delay).
- Production build: confirm source map upload succeeded (CI logs / Sentry Releases artifacts).
- `SENTRY_AUTH_TOKEN` present in CI only; DSN is public client-safe, auth token is not.

Report which checks ran, which did not, and version assumptions that remain.
