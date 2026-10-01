# Products & Features

SDK flags unlock telemetry; most product workflows live in the Sentry UI (https://sentry.io / https://docs.sentry.io/product/).

## Issues (errors)

Always-on once `dsn` is set. Captures unhandled exceptions, rejections, and `captureException` / `captureMessage`.

Correlate with: suspect commits, releases, owners, breadcrumbs, tags, user context.

## Tracing / performance

Enable with `browserTracingIntegration` / Node auto HTTP + `tracesSampleRate` or `tracesSampler`.

Use for: distributed traces FE→BE, N+1 / slow spans, Trace Explorer.

v11 streams spans in small batches by default (`traceLifecycle: 'stream'`) — no 1000-span-per-transaction limit. Filter with `ignoreSpans`, scrub with `beforeSendSpan` (`StreamedSpanJSON`), and put searchable span data in `Sentry.setAttribute(s)`; scope tags no longer reach spans.

Custom work:

```ts
await Sentry.startSpan({ name: "charge", op: "payment" }, async () => { /* … */ });
```

## Session Replay (web)

```ts
integrations: [Sentry.replayIntegration()],
replaysSessionSampleRate: 0.1,
replaysOnErrorSampleRate: 1.0,
```

Privacy: masking/blocking options on `replayIntegration` (text, media, inputs). Canvas via `replayCanvasIntegration`.

Mobile replay: React Native / mobile product docs (separate from web SDK).

## Profiling

- Browser: `browserProfilingIntegration` + `profileSessionSampleRate` + `profileLifecycle`
- Node: `@sentry/profiling-node` → `nodeProfilingIntegration()` + `profileSessionSampleRate` + `profileLifecycle: 'trace' | 'manual'`
- The legacy per-transaction `profilesSampleRate` was removed in v11.

Shows function-level hot paths linked to traces.

## Logs

```ts
Sentry.init({ dsn }); // v11: no flag — `enableLogs` was removed
Sentry.logger.info("job.start", { jobId });
Sentry.logger.error(Sentry.logger.fmt`job ${jobId} failed`, { reason });
```

Levels: `trace`, `debug`, `info`, `warn`, `error`, `fatal`. Logs are captured whenever a logger API or logging integration (`consoleLoggingIntegration()`, `pinoIntegration()`, `Sentry.createConsolaReporter()`) is used; filter with `beforeSendLog` (return `null` to drop).

Search alongside errors/traces in the Logs product. Some platforms also support log drains (Vercel, Cloudflare, Heroku) without app code.

## Metrics

Application metrics — trace-connected, no init flag in v11 (`enableMetrics` removed):

```ts
Sentry.metrics.count("orders_created", 1, { attributes: { endpoint: "/api/orders" } });
Sentry.metrics.gauge("active_connections", 42);
Sentry.metrics.distribution("api_latency", 187, { unit: "millisecond" });
```

Filter or enrich with top-level `beforeSendMetric` (was `_experiments.beforeSendMetric`). CDN users need a `*.logs.metrics` bundle in v11.

## User Feedback

`feedbackIntegration` widget and/or API to attach user reports to events/replays.

## Cron monitoring

SDK check-in APIs for scheduled jobs (monitor slugs in Sentry). Pair with product Cron Monitors.

## Uptime monitoring

Configured in Sentry product (HTTP checks) — not an app SDK install.

## Releases & regression

Set `release` (or let bundler plugin inject). Upload source maps + commits (`sentry-cli commits` / plugin `setCommits`) for suspect commits and release health.

## AI / Seer / agents

Product:

- **Seer** — root cause, Autofix patches, AI code review
- **Agent Tracing** — LLM/tool spans in traces
- **Sentry MCP** — agent tooling against Sentry context

SDK integrations for AI libraries (server-side only in v11, auto when the package is present): OpenAI, Anthropic, Google GenAI, LangChain, LangGraph, Vercel AI, Mistral, Groq, Together, Mastra, eve, TypeSafe, and MCP servers (`mcpServerIntegration`, 11.1.0) — see [integrations.md](integrations.md). GenAI inputs/outputs are recorded by default in v11; turn off with `dataCollection.genAI`.

## Size analysis / Snapshots

Mobile size budgets and visual Snapshots are product/CI features; wire via Sentry UI + CI docs when relevant (RN/mobile more than typical web TS).

## Alerts & integrations

Slack, PagerDuty, GitHub, Linear, Jira, email, webhooks — configure in Sentry project/org settings. Not substituted by SDK install.

## Feature checklist for “full” TS app integration

1. Errors + `environment` + `release`
2. Source maps upload in CI
3. Tracing with sane production sampling + `tracePropagationTargets`
4. Session Replay (web) with privacy defaults
5. `setUser` after auth; clear on logout
6. Logs if the team wants correlated log search (call `Sentry.logger.*` or add a logging integration)
7. Profiling on critical Node/browser paths if needed
8. Framework error boundaries / server error middleware
9. Optional: feedback widget, cron check-ins, AI integrations, metrics
10. Alerts + SCM linking in the Sentry project
