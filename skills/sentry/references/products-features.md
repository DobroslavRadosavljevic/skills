# Products & Features

SDK flags unlock telemetry; most product workflows live in the Sentry UI (https://sentry.io / https://docs.sentry.io/product/).

## Issues (errors)

Always-on once `dsn` is set. Captures unhandled exceptions, rejections, and `captureException` / `captureMessage`.

Correlate with: suspect commits, releases, owners, breadcrumbs, tags, user context.

## Tracing / performance

Enable with `browserTracingIntegration` / Node auto HTTP + `tracesSampleRate` or `tracesSampler`.

Use for: distributed traces FE→BE, N+1 / slow spans, Trace Explorer.

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

- Browser: `browserProfilingIntegration` + profile sample options
- Node: `@sentry/profiling-node` → `nodeProfilingIntegration()` + `profileSessionSampleRate`

Shows function-level hot paths linked to traces.

## Logs

```ts
Sentry.init({ enableLogs: true });
Sentry.logger.info("job.start", { jobId });
Sentry.logger.error("job.fail", { reason });
```

Search alongside errors/traces in the Logs product. Some platforms also support log drains (Vercel, Cloudflare, Heroku) without app code.

## Metrics

Application metrics (counters, gauges, distributions) — trace-connected. Use current JS metrics APIs from the platform guide for your SDK version (surface evolves; refresh docs).

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

SDK integrations for AI libraries (Node often auto): OpenAI, Anthropic, Google GenAI, LangChain, LangGraph, Vercel AI — see [integrations.md](integrations.md).

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
6. Logs if the team wants correlated log search
7. Profiling on critical Node/browser paths if needed
8. Framework error boundaries / server error middleware
9. Optional: feedback widget, cron check-ins, AI integrations, metrics
10. Alerts + SCM linking in the Sentry project
