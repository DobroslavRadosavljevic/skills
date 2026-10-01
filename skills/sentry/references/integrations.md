# Integrations

Integrations extend the SDK for libraries and environments. Many are **auto-enabled**. Override by passing a configured instance in `integrations`, filter defaults with an `integrations` function, or set `defaultIntegrations: false`.

Docs:

- Browser: https://docs.sentry.io/platforms/javascript/configuration/integrations/
- Node: https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/

## Browser / client (representative)

### Auto-enabled (typical)

`breadcrumbsIntegration`, `browserApiErrorsIntegration`, `browserSessionIntegration` (v11 default `lifecycle: 'page'`), `consoleIntegration` (console breadcrumbs in v11), `dedupeIntegration`, `functionToStringIntegration`, `globalHandlersIntegration`, `httpContextIntegration`, `eventFiltersIntegration` (renamed from `inboundFiltersIntegration` in v11), `linkedErrorsIntegration`

### Commonly added

| Integration | Use |
|---|---|
| `browserTracingIntegration` | Performance / pageload / navigation / fetch/XHR / web vitals (`webVitals: { softNavigations, bfcacheNavigations }`) |
| `userTimingIntegration` | `performance.mark/measure` spans (v11 split from browser tracing; `ignore` option) |
| `interactionsIntegration` | Click/interaction spans (v11 replacement for `_experiments.enableInteractions`) |
| `fetchStreamPerformanceIntegration` | Streamed fetch body duration (replaces `trackFetchStreamPerformance`) |
| `bfcacheMetricsIntegration` | bfcache metrics (renamed from `bfcacheIntegration`) |
| `consoleLoggingIntegration` | Console calls → Sentry Logs |
| `replayIntegration` | Session Replay |
| `replayCanvasIntegration` | Canvas in replays |
| `feedbackIntegration` | User feedback widget |
| `browserProfilingIntegration` | Browser profiling (`profileSessionSampleRate` + `profileLifecycle`) |
| `httpClientIntegration` | Failed HTTP as errors |
| `captureConsoleIntegration` | Console → events |
| `contextLinesIntegration` / `extraErrorDataIntegration` | Richer error context |
| `rewriteFramesIntegration` | Path rewrite for readable frames |
| `webWorkerIntegration` | Web workers |
| `reportingObserverIntegration` | ReportingObserver |
| `elementTimingIntegration` | Element timing |
| `thirdPartyErrorFilterIntegration` | Drop errors from third-party code (needs bundler `applicationKey`) |
| `supabaseIntegration` | Supabase client |
| `graphqlClientIntegration` | GraphQL client context |
| Feature flags | `featureFlagsIntegration`, `launchDarklyIntegration`, `openFeatureIntegration`, `statsigIntegration`, `unleashIntegration`, `growthbookIntegration` |

AI integrations are **server-only** since v11 — they were removed from the browser SDK.
| `moduleMetadataIntegration` | Bundle metadata |

## Node / Bun server (representative)

### Auto-enabled when relevant (tracing-aware)

v11 instruments through diagnostics channels (orchestrion via `@sentry/server-utils`) instead of `import-in-the-middle`, so the same integrations also run on Cloudflare, Bun, Deno, Vercel, and Netlify.

HTTP & runtime: `httpIntegration`, `nativeNodeFetchIntegration`, `nodeContextIntegration`, `childProcessIntegration`, `workerThreadsIntegration` (split out in v11), `consoleIntegration`, `modulesIntegration`, `onUncaughtExceptionIntegration`, `onUnhandledRejectionIntegration`, `requestDataIntegration`, `contextLinesIntegration`, `dedupeIntegration` (default on Node/Bun since 11.2.0), `eventFiltersIntegration`, `linkedErrorsIntegration`, `functionToStringIntegration`, `genericPoolIntegration`, `lruMemoizerIntegration`, `systemErrorIntegration`, `processSessionIntegration`

Web frameworks (auto error capture in v11): `expressIntegration`, `fastifyIntegration` (Fastify 3.21–5), `koaIntegration`, `hapiIntegration`, `honoIntegration` (orchestrion-based since 11.2.0)

Data stores / queues (when packages present): `postgresIntegration`, `postgresJsIntegration`, `mysqlIntegration`, `mysql2Integration`, `mongoIntegration`, `mongooseIntegration`, `redisIntegration`, `prismaIntegration` (Prisma 8 since 11.1.0), `tediousIntegration`, `graphqlIntegration`, `amqplibIntegration`, `kafkaIntegration`, `firebaseIntegration`, `knexIntegration`, `dataloaderIntegration`

AI (server-side; default when the package is present): `openAIIntegration`, `anthropicAIIntegration`, `googleGenAIIntegration`, `langChainIntegration`, `langGraphIntegration`, `vercelAIIntegration`, `mistralAIIntegration`, `groqIntegration`, `togetherAIIntegration`, `mastraIntegration`, `eveIntegration`, `typesafeIntegration` (11.1.0), `mcpServerIntegration` (11.1.0 — auto-wraps every `McpServer`; `wrapMcpServerWithSentry` only for option overrides). v11 AI spans cover inference, tool calls, and agent invocations only; GenAI inputs/outputs are collected by default via `dataCollection.genAI`.

### Opt-in / notable

| Integration | Use |
|---|---|
| `nodeProfilingIntegration` | From `@sentry/profiling-node` |
| `nodeRuntimeMetricsIntegration` | Runtime metrics (`bunRuntimeMetricsIntegration` on Bun/Elysia) |
| `openTelemetryIntegration` | Attach errors/logs/metrics/crons to your own active OTel span (v11 rename of `otlpIntegration`; no options) |
| `consoleLoggingIntegration` / `pinoIntegration` | Console / Pino → Sentry Logs |
| `anrIntegration` / `eventLoopBlockIntegration` | Event-loop / ANR |
| `localVariablesIntegration` | Local vars on exceptions (in defaults; activate with `includeLocalVariables: true`; costly) |
| `fsIntegration` | FS spans |
| `dataloaderIntegration` / `knexIntegration` | DataLoader / Knex |
| `captureConsoleIntegration` / `extraErrorDataIntegration` | Extra context |
| `rewriteFramesIntegration` | Frame paths |
| `supabaseIntegration` | Supabase |
| `trpcMiddleware` | tRPC |
| `zodErrorsIntegration` | Zod issue formatting |

Exact “auto enabled” flags can differ slightly by guide (Node vs Nest vs serverless). Prefer the guide for the installed package.

## Framework wiring (not just `*Integration()`)

| Framework | Typical hooks |
|---|---|
| Express | v11: automatic via `expressIntegration({ shouldHandleError })`; `setupExpressErrorHandler` deprecated |
| Fastify / Koa / Hapi | v11: automatic; `setupFastifyErrorHandler` / `setupKoaErrorHandler` / `setupHapiErrorHandler` deprecated |
| Connect | Instrumentation removed in v11 |
| NestJS | `SentryModule` + instrument import |
| Next.js | `withSentryConfig` from `@sentry/nextjs/config`, `captureRequestError`, `captureRouterTransitionStart` |
| Remix / SvelteKit / Nuxt / SolidStart | Framework hooks / plugins |
| Hono / Elysia | `@sentry/hono/<runtime>` `sentry(app)` middleware / Elysia plugin |
| Cloudflare | `withSentry`, Pages plugins |
| AWS Lambda | `@sentry/aws-serverless` wrapper / layer patterns |
| React | `ErrorBoundary`, `withErrorBoundary`, `Profiler`, router wraps |
| Vue | `app` (+ `router`) in `init` |
| Electron | Main + renderer init per Electron guide |
| React Native | Native init + Metro / Expo plugins |

## Adding / removing

```ts
Sentry.init({
  integrations: [
    Sentry.browserTracingIntegration(),
    Sentry.replayIntegration({ maskAllText: true }),
  ],
});

// or later
Sentry.addIntegration(Sentry.captureConsoleIntegration());

// remove one default by name (v11 names: "EventFilters", "WorkerThreads", "OpenTelemetry", "Dedupe", …)
Sentry.init({
  integrations: (integrations) =>
    integrations.filter((i) => i.name !== "Breadcrumbs"),
});
```

## OpenTelemetry

v11 server SDKs no longer register an OpenTelemetry tracer provider by default (only `@sentry/nextjs` and `@sentry/sveltekit` do). Three modes:

1. **Sentry only** (default) — spans from `@opentelemetry/api` are ignored.
2. `enableOpenTelemetrySetup: true` — minimal OTel-compatible provider; library OTel spans become Sentry spans (no OTLP export). Not supported on `@sentry/cloudflare/request`.
3. **Own OTel pipeline** — leave `tracesSampleRate` unset, register your provider/exporter (optionally to `Sentry.getOtlpTracesEndpoint(dsn)`), add `Sentry.openTelemetryIntegration()`.

`SentrySpanProcessor` / `SentrySampler` / `SentryContextManager` were removed; `@opentelemetry/api` is the only remaining OTel dependency. See [migration-v10-to-v11.md](migration-v10-to-v11.md).
