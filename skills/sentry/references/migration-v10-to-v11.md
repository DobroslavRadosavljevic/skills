# Migration: JS SDK v10 → v11

v11.0.0 shipped 2026-09-23. Full guides: https://docs.sentry.io/platforms/javascript/migration/v10-to-v11/ (pick the framework) and `MIGRATION.md` in `getsentry/sentry-javascript`. Many changes are behavioral and are **not** caught by TypeScript — read this list before bumping.

## Upgrade procedure

1. Confirm runtimes: Node **>=20.19.0** (22 needs >=22.12, 23 needs >=23.2), Deno **>=2.8.3**, Safari **15+**, TypeScript **>=5.0.4**. Frameworks: Next.js 14+, React 17+, Astro 4+, React Router framework mode 7.15+, Fastify 3.21+, webpack 5.1+. Self-hosted Sentry **26.4.2+**.
2. Bump every `@sentry/*` app package to the same 11.x. Remove `@sentry/types`, `@sentry/node-core`, `@sentry/tanstackstart`.
3. Leave Electron / Capacitor / React Native SDKs alone — they still embed JS SDK 10.x.
4. Work through the sections below, then run the repo's verification (errors, traces, logs, source maps).
5. `bunx @sentry/wizard@latest -i <framework>` (wizard 8.x) installs `^11` and prints the migration link when it detects v10.

## Defaults that changed

| Area | v10 | v11 |
|---|---|---|
| PII / data | `sendDefaultPii` (off = restrictive) | `sendDefaultPii` **removed**; unset `dataCollection` collects `userInfo`, `cookies`, headers, all `httpBodies`, `genAI` inputs/outputs, `databaseQueryData`, `queues` |
| Spans | Transactions (1000-span limit) | **Span streaming** (`traceLifecycle: 'stream'`) |
| Logs | `enableLogs: true` | Option removed — logs flow when `Sentry.logger.*` or a logging integration is used |
| Metrics | `enableMetrics` | Option removed — `Sentry.metrics.*` just works; `beforeSendMetric` is top-level |
| `attachStacktrace` | `false` | `true` (new issue groups; `captureMessage` marks sessions errored) |
| OpenTelemetry | Sentry registered an OTel provider | No OTel provider by default (`enableOpenTelemetrySetup: false`), except `@sentry/nextjs` / `@sentry/sveltekit` |
| Node instrumentation | `import-in-the-middle` loader hooks | Channel-based (orchestrion), also works on Cloudflare, Bun, Deno, Vercel, Netlify |
| Browser session lifecycle | `'route'` | `'page'` (restore with `browserSessionIntegration({ lifecycle: 'route' })`) |
| Browser crashed sessions | `crashed` | `unhandled` |
| Web vitals | One set per page lifetime | Per soft navigation (Chromium 151+); bfcache restores report their own vitals |
| `tracePropagationTargets` | Case-sensitive | Case-insensitive |
| Next.js env on Vercel | `vercel-production` | `VERCEL_TARGET_ENV` (`production`, `preview`, …) |
| Node/Bun `dedupeIntegration` | Not default | Default since **11.2.0** |

### Keep v10 privacy behavior

```ts
Sentry.init({
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
      response: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    },
    httpBodies: [],
    urlQueryParams: { deny: ["forwarded", "-ip", "remote-", "via", "-user"] },
    genAI: { inputs: false, outputs: false },
    databaseQueryData: false,
    queues: false,
    graphQL: { document: false, variables: false },
  },
});
```

Key-value categories accept `true`, `false`, `{ allow: [...] }`, or `{ deny: [...] }`. If the app previously set `sendDefaultPii: true`, delete the option.

## Span streaming fallout

- `beforeSendTransaction` and `ignoreTransactions` are **no-ops**. Drop/filter with `ignoreSpans` (string, RegExp, or `{ name, attributes: { 'sentry.op': ... } }`); scrub with `beforeSendSpan` and guard on `span.is_segment`.
- `beforeSendSpan` receives `StreamedSpanJSON`: `description`→`name`, `data`→`attributes`, `op`→`attributes['sentry.op']`, `timestamp`→`end_timestamp`, `status` is `'ok' | 'error'`. It cannot drop spans.
- Scope `tags` / `extra` no longer reach spans. Use `Sentry.setAttribute(s)` (also applies to logs and metrics); tags still apply to errors.
- `spanToJSON` returns the streamed format; `spanToStreamedSpanJSON` was removed; `withStreamedSpan()` is a deprecated no-op.
- `ignoreStatusCodes` on HTTP integrations is deprecated and only works in static mode — use `tracesSampler` or `httpIntegration({ ignoreIncomingRequests })`.
- Temporary opt-out: `traceLifecycle: 'static'` (or env `SENTRY_TRACE_LIFECYCLE=static` on Node/Bun/Vercel Edge/Cloudflare) and wrap `beforeSendSpan` in `Sentry.withStaticSpan()`. A callback that does not match the lifecycle is silently never called.

## Node / server changes

- `node --require ./instrument.js` is unsupported → `node --import ./instrument.js app.js` (works for CJS files too).
- Removed entry points: `@sentry/node/init`, `@sentry/node/preload`, `@sentry/node/loader` and the framework `*/loader` variants → use `--import @sentry/<sdk>/import` or your own instrument file. `preloadOpenTelemetry()`, `registerEsmLoaderHooks`, `generateInstrumentOnce`, `SentryContextManager`, `SentrySampler`, `SentrySpanProcessor` are gone.
- Express, Fastify, Koa, Hapi errors are captured automatically. `setupExpressErrorHandler`, `setupFastifyErrorHandler`, `setupKoaErrorHandler`, `setupHapiErrorHandler` are deprecated; move `shouldHandleError` onto `expressIntegration()` / `fastifyIntegration()`.
- `httpIntegration` option renames: `trackIncomingRequestsAsSessions`→`sessions`, `maxIncomingRequestBodySize`→`maxRequestBodySize`, `ignoreIncomingRequestBody`→`ignoreRequestBody`, `incomingRequestSpanHook` / `instrumentation.*` → `onSpanCreated` (incoming) or `outgoingRequestHook` / `outgoingResponseHook` / `outgoingRequestApplyCustomAttributes` (outgoing).
- `childProcessIntegration` split: worker thread errors now come from `workerThreadsIntegration` (`captureWorkerErrors` removed).
- `otlpIntegration` → `openTelemetryIntegration()` (no options, no exporter). Use `Sentry.getOtlpTracesEndpoint(dsn)` to point your own OTLP exporter at Sentry.
- `@sentry/core` is isomorphic only; browser-only helpers moved to `@sentry/core/browser`, server-only to `@sentry/core/server`. AI helpers moved to `@sentry/server-utils` (platform SDK re-exports unchanged).
- Profiling: legacy `profilesSampleRate` removed → `profileSessionSampleRate` + `profileLifecycle: 'trace' | 'manual'`.
- AWS Lambda layer: `SentryNodeServerlessSDKv11` (`nodejs20.x`/`22.x`/`24.x`).

## OpenTelemetry modes

1. **Sentry only** (default): `tracesSampleRate` set; `@opentelemetry/api` spans are ignored.
2. **OTel-compatible, all to Sentry**: `enableOpenTelemetrySetup: true` — minimal provider so library OTel spans become Sentry spans. No OTLP output.
3. **Your own OTel**: leave `tracesSampleRate` unset, register your provider, add `Sentry.openTelemetryIntegration()`; on Next.js/SvelteKit also set `enableOpenTelemetrySetup: false`.

`OTEL_SERVICE_NAME` / `OTEL_RESOURCE_ATTRIBUTES` are no longer read.

## Browser changes

- `inboundFiltersIntegration` → `eventFiltersIntegration` (integration name `EventFilters`).
- `performance.mark/measure` spans moved to `userTimingIntegration({ ignore })` (was `ignorePerformanceApiSpans`).
- Interaction spans moved to `interactionsIntegration()` (was `_experiments.enableInteractions`).
- `bfcacheIntegration` → `bfcacheMetricsIntegration`; `trackFetchStreamPerformance` → `fetchStreamPerformanceIntegration()`.
- Console breadcrumbs come from `consoleIntegration` (the `console` option on `breadcrumbsIntegration` is gone).
- AI integrations are server-only now.
- CDN: metrics only ship in the `*.logs.metrics` bundles.
- `Scope.clear()` removed — use `withScope` / `withIsolationScope`.

## Framework changes

| SDK | Change |
|---|---|
| `@sentry/nextjs` | `withSentryConfig` / `SentryBuildOptions` import from `@sentry/nextjs/config`. Old top-level build options removed (use `webpack.*`, `routeManifestInjection: false`, `applicationKey`). Top-level `reactComponentAnnotation` drives webpack and Turbopack (Turbopack needs Next 16+). Tunnel route now passes through middleware. `ai` monitoring no longer works on Edge. |
| `@sentry/nuxt` | Server config is bundled into Nitro — drop `--import` / `NODE_OPTIONS` preloads. `public/instrument.server.ts` → `sentry.server.config.ts` at project root. `sourceMapsUploadOptions` fields move to module root (`url`→`sentryUrl`). |
| `@sentry/sveltekit` | `sentrySvelteKit` imports from `@sentry/sveltekit/vite`. `sourceMapsUploadOptions` flattened (`url`→`sentryUrl`). |
| `@sentry/react-router` | Out of beta. Vite helpers from `@sentry/react-router/vite`. `wrapServerLoader` / `wrapServerAction` removed → export `instrumentations = [Sentry.createSentryServerInstrumentation()]` from `entry.server.tsx`. |
| `@sentry/remix` | `sentryRemixVitePlugin` from `@sentry/remix/vite`; it now does build-time instrumentation and source map upload. Remix 3 supported (11.1+, `--import @sentry/remix/v3/node` in 11.2). |
| `@sentry/react` | New `@sentry/react/react-router` entry: `reactRouterBrowserTracingIntegration()` with no hook arguments. |
| `@sentry/astro` | Runtime options (`dsn`, sample rates, `environment`) no longer accepted by the integration — put them in `sentry.client.config.ts` / `sentry.server.config.ts`. `trackClientIp` follows `dataCollection.userInfo`. |
| `@sentry/cloudflare` | Requires `nodejs_compat` (not `nodejs_als`). `@sentry/cloudflare/nodejs_compat` subpath removed. `wrapRequestHandler` → `@sentry/cloudflare/request`. `enableRpcTracePropagation` → `rpcTracePropagationBindings: ['ORDERS', /^SVC_/]`. `instrumentD1WithSentry` removed (D1 auto-instrumented). Vite plugin auto-instruments Worker/DO/Workflow entries (`autoInstrumentation: false` to opt out). |
| `@sentry/ember` | v2 addon; call `Sentry.init()` in `app/app.ts`, add `instrumentAppInstancePerformance` instance-initializer. |
| `@sentry/deno` | `onIncomingSpanCreated`/`onIncomingSpanEnd` → `onSpanCreated`/`onSpanEnd`; `node:http` requests now tracked as sessions. |
| All meta-frameworks | `unstable_sentry*PluginOptions` removed — set options (e.g. `applicationKey`, `moduleMetadata`) directly on Sentry build options. |

## Span ops and attributes

Span ops and attribute names were normalized (`http.*`/`net.*` → OTel semantic conventions such as `url.full`, `middleware` / `handler` / `router` / `function` ops, snake_case browser ops). Dashboards, alerts, saved searches, `ignoreSpans`, and `tracesSampler` rules keyed on old ops or names need updating — see the "Span operation changes" and "Span name changes" tables in `MIGRATION.md`.
