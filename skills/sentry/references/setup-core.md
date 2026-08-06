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
  enableLogs: true,
  dataCollection: {
    // tighten in privacy-sensitive apps:
    // userInfo: false,
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

```ts
// instrument.ts — must load before express/db imports
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  enableLogs: true,
});
```

```ts
// app.ts
import "./instrument";
import express from "express";
import * as Sentry from "@sentry/node";

const app = express();
// routes…
Sentry.setupExpressErrorHandler(app);
app.listen(3000);
```

**ESM / Node:** follow current Express/Node guide for `--import ./instrument.mjs` (or equivalent). Late `init` breaks HTTP/DB auto-instrumentation.

## Common `Sentry.init` options

| Option | Purpose |
|---|---|
| `dsn` | Project ingest URL (required to send) |
| `environment` | `production` / `staging` / … |
| `release` | Version string; ties to Releases + suspect commits |
| `debug` | SDK stderr logging while installing |
| `tracesSampleRate` / `tracesSampler` | Performance sampling |
| `profileSessionSampleRate` / profiling integrations | Continuous profiling |
| `replaysSessionSampleRate` / `replaysOnErrorSampleRate` | Session Replay |
| `enableLogs` | Structured logs product |
| `integrations` | Add/override integrations |
| `defaultIntegrations` | Set `false` to disable all defaults |
| `tracePropagationTargets` | Which outbound URLs get trace headers |
| `tunnel` | Proxy ingest (ad-block / first-party) |
| `dataCollection` | PII / bodies / headers / genAI content controls (prefer over `sendDefaultPii`) |
| `beforeSend` / `beforeSendTransaction` / `beforeSendLog` | Filter or scrub events |
| `ignoreErrors` / `denyUrls` / `allowUrls` | Client-side noise control |

## Everyday APIs

```ts
Sentry.captureException(err);
Sentry.captureMessage("something odd", "warning");
Sentry.setUser({ id: "42", email: "a@b.co" });
Sentry.setTag("tenant", "acme");
Sentry.setContext("order", { id: orderId });
Sentry.addBreadcrumb({ category: "auth", message: "login", level: "info" });

await Sentry.startSpan({ name: "checkout", op: "ui.action" }, async () => {
  // work
});

Sentry.logger.info("checkout.started", { orderId });
Sentry.logger.error("checkout.failed", { reason: "timeout" });
```

Flush on short-lived runtimes (Lambda, scripts):

```ts
await Sentry.flush(2000);
```

## Next.js (shape)

1. `bunx @sentry/wizard@latest -i nextjs` **or** manual:
2. `sentry.client.config.ts` / `sentry.server.config.ts` / `sentry.edge.config.ts`
3. `instrumentation.ts` with `register()` importing server/edge configs + `onRequestError = Sentry.captureRequestError`
4. Wrap `next.config` with `withSentryConfig(…, { org, project, authToken })` for source maps

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
- Hono: `@sentry/hono` middleware

## React Router (SPA helpers vs framework package)

- SPA React Router v6/v7: helpers on `@sentry/react` (`wrapCreateBrowserRouterV6`, etc.)
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
