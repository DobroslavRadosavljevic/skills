# Setup Core

## Minimal browser / React

```ts
// instrument.ts — import this first from the app entry
import * as Sentry from "@sentry/react"; // or @sentry/browser

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN, // or process.env / public env
  environment: import.meta.env.MODE,
  release: import.meta.env.VITE_APP_VERSION, // or omit if bundler plugin injects
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration(),
    // Sentry.feedbackIntegration({ colorScheme: "system" }),
  ],
  tracesSampleRate: 0.1,
  tracePropagationTargets: ["localhost", /^https:\/\/api\.example\.com/],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  // v11: logs need no flag — they flow once you call Sentry.logger.* or add a logging integration.
  dataCollection: {
    // v11 defaults are permissive (user info, cookies, headers, bodies, genAI I/O).
    // Tighten in privacy-sensitive apps:
    // userInfo: false,
    // cookies: false,
    // httpBodies: [],
  },
});
```

```tsx
// main.tsx
import "./instrument";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <Sentry.ErrorBoundary fallback={<p>Something went wrong</p>}>
    <App />
  </Sentry.ErrorBoundary>,
);
```

## Minimal Node / Express

Requires Node **>=20.19.0** (22.x needs >=22.12) on SDK v11.

```ts
// instrument.mjs — preloaded before any app code
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

```ts
// app.mjs
import express from "express";

const app = express();
// routes… — v11 expressIntegration captures 5xx / status-less route errors automatically
app.listen(3000);
```

```sh
node --import ./instrument.mjs app.mjs
```

- v11 removed `--require` support; `--import` also works for CommonJS instrument files.
- `Sentry.setupExpressErrorHandler(app)` (and the Fastify/Koa/Hapi equivalents) are deprecated in v11 — remove them. Customize capture with `Sentry.expressIntegration({ shouldHandleError })`.
- Late `init` breaks HTTP/DB auto-instrumentation, and v11 can no longer warn about it.

## Common `Sentry.init` options

| Option | Purpose |
|---|---|
| `dsn` | Project ingest URL (required to send) |
| `environment` | `production` / `staging` / … |
| `release` | Version string; ties to Releases + suspect commits |
| `debug` | SDK stderr logging while installing |
| `tracesSampleRate` / `tracesSampler` | Performance sampling |
| `profileSessionSampleRate` + `profileLifecycle` | Profiling (`'trace'` or `'manual'`; legacy `profilesSampleRate` removed in v11) |
| `replaysSessionSampleRate` / `replaysOnErrorSampleRate` | Session Replay |
| `traceLifecycle` | `'stream'` (v11 default, span streaming) or `'static'` (legacy transactions, temporary) |
| `enableOpenTelemetrySetup` | Server SDKs: register a minimal OTel provider so `@opentelemetry/api` spans reach Sentry (replaces `skipOpenTelemetrySetup`) |
| `integrations` | Add/override integrations |
| `defaultIntegrations` | Set `false` to disable all defaults |
| `tracePropagationTargets` | Which outbound URLs get trace headers |
| `tunnel` | Proxy ingest (ad-block / first-party) |
| `dataCollection` | PII / bodies / headers / genAI / DB query / queue data controls (`sendDefaultPii` removed in v11) |
| `beforeSend` / `beforeSendSpan` / `beforeSendLog` / `beforeSendMetric` | Filter or scrub events, streamed spans, logs, metrics (`beforeSendTransaction` is a no-op in v11) |
| `ignoreSpans` | Drop spans/segments at start (replaces `ignoreTransactions`) |
| `ignoreErrors` / `denyUrls` / `allowUrls` | Client-side noise control |
| `attachStacktrace` | Defaults to `true` in v11 |

## Everyday APIs

```ts
Sentry.captureException(err);
Sentry.captureMessage("something odd", "warning");
Sentry.setUser({ id: "42", email: "a@b.co" });
Sentry.setTag("tenant", "acme"); // errors only in v11
Sentry.setAttribute("tenant", "acme"); // spans, logs, metrics (v11)
Sentry.setContext("order", { id: orderId });
Sentry.addBreadcrumb({ category: "auth", message: "login", level: "info" });

await Sentry.startSpan({ name: "checkout", op: "ui.action" }, async () => {
  // work
});

Sentry.logger.info("checkout.started", { orderId });
Sentry.logger.error("checkout.failed", { reason: "timeout" });

Sentry.metrics.count("orders_created", 1, { attributes: { tier: "pro" } });
Sentry.metrics.distribution("api_latency", 187, { unit: "millisecond" });
```

Flush on short-lived runtimes (Lambda, scripts):

```ts
await Sentry.flush(2000);
```

## Next.js (shape, v11 — Next.js 14+)

1. `bunx @sentry/wizard@latest -i nextjs` **or** manual:
2. `instrumentation-client.ts` (client init + `export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;`), `sentry.server.config.ts`, `sentry.edge.config.ts`
3. `instrumentation.ts` with `register()` importing server/edge configs by `NEXT_RUNTIME` + `export const onRequestError = Sentry.captureRequestError;`
4. Wrap `next.config` with `withSentryConfig(…, { org, project, authToken })` imported from **`@sentry/nextjs/config`** (v11 moved it off the main entry)

## NestJS (shape)

- Package: `@sentry/nestjs`
- Import instrument first in `main.ts`
- Register `SentryModule` in the root module per current Nest guide

## Cloudflare (shape)

```ts
import * as Sentry from "@sentry/cloudflare";

export default Sentry.withSentry(
  (env) => ({ dsn: env.SENTRY_DSN, tracesSampleRate: 0.2 }),
  { async fetch(request, env, ctx) { /* … */ } },
);
```

## Bun / Elysia / Hono

- Bun: `@sentry/bun`, init in `instrument`, import first
- Elysia: `@sentry/elysia` (plugin/onError patterns per guide)
- Hono: `@sentry/hono` with a runtime subpath — `@sentry/hono/node` (plus `@sentry/node`), `/cloudflare`, `/bun`, `/deno` — and `app.use(sentry(app, { dsn }))`. 11.2.0 added orchestrion auto-instrumentation (route-named spans, per-middleware spans, handler errors).

## React Router (SPA helpers vs framework package)

- SPA React Router v6/v7/v8: v11 adds `@sentry/react/react-router` — `reactRouterBrowserTracingIntegration()` with no hook arguments (needs `react-router` resolvable). `@sentry/react` helpers (`wrapCreateBrowserRouterV6`, etc.) still work.
- React Router **framework** mode: `@sentry/react-router`

## Sampling guidance

| Stage | Traces | Replay session | Replay on error |
|---|---|---|---|
| Install / staging | `1.0` briefly | `1.0` briefly | `1.0` |
| Production default starting point | `0.05`–`0.2` (tune) | `0.01`–`0.1` | `1.0` |

Use `tracesSampler` to drop health checks and keep checkout/auth at higher rates.

## Env vars

| Var | Who sees it |
|---|---|
| Public DSN (`VITE_…` / `NEXT_PUBLIC_…` / `SENTRY_DSN`) | Client + server OK |
| `SENTRY_AUTH_TOKEN` | CI/build only — never ship to browsers |
| `SENTRY_ORG` / `SENTRY_PROJECT` | Build plugins / CLI |
| `.env.sentry-build-plugin` | Local plugin auth (gitignore) |
