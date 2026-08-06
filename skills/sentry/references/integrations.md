# Integrations

Integrations extend the SDK for libraries and environments. Many are **auto-enabled**. Override by passing a configured instance in `integrations`, filter defaults with an `integrations` function, or set `defaultIntegrations: false`.

Docs:

- Browser: https://docs.sentry.io/platforms/javascript/configuration/integrations/
- Node: https://docs.sentry.io/platforms/javascript/guides/node/configuration/integrations/

## Browser / client (representative)

### Auto-enabled (typical)

`breadcrumbsIntegration`, `browserApiErrorsIntegration`, `browserSessionIntegration`, `dedupeIntegration`, `functionToStringIntegration`, `globalHandlersIntegration`, `httpContextIntegration`, `inboundFiltersIntegration`, `linkedErrorsIntegration`

### Commonly added

| Integration | Use |
|---|---|
| `browserTracingIntegration` | Performance / pageload / navigation / fetch/XHR |
| `replayIntegration` | Session Replay |
| `replayCanvasIntegration` | Canvas in replays |
| `feedbackIntegration` | User feedback widget |
| `browserProfilingIntegration` | Browser profiling |
| `httpClientIntegration` | Failed HTTP as errors |
| `captureConsoleIntegration` | Console → events |
| `contextLinesIntegration` / `extraErrorDataIntegration` | Richer error context |
| `rewriteFramesIntegration` | Path rewrite for readable frames |
| `webWorkerIntegration` | Web workers |
| `reportingObserverIntegration` | ReportingObserver |
| `elementTimingIntegration` | Element timing |
| `supabaseIntegration` | Supabase client |
| `graphqlClientIntegration` | GraphQL client context |
| Feature flags | `featureFlagsIntegration`, `launchDarklyIntegration`, `openFeatureIntegration`, `statsigIntegration`, `unleashIntegration` |
| GenAI (browser when applicable) | `openAIIntegration`, `anthropicAIIntegration`, `googleGenAIIntegration`, `langChainIntegration`, `langGraphIntegration` |
| `moduleMetadataIntegration` | Bundle metadata |

## Node / Bun server (representative)

### Auto-enabled when relevant (tracing-aware)

HTTP & runtime: `httpIntegration`, `nativeNodeFetchIntegration`, `nodeContextIntegration`, `childProcessIntegration`, `consoleIntegration`, `modulesIntegration`, `onUncaughtExceptionIntegration`, `onUnhandledRejectionIntegration`, `requestDataIntegration`, `contextLinesIntegration`, `dedupeIntegration`, `inboundFiltersIntegration`, `linkedErrorsIntegration`, `functionToStringIntegration`, `genericPoolIntegration`, `lruMemoizerIntegration`

Data stores / queues (when packages present): `postgresIntegration`, `mysqlIntegration`, `mysql2Integration`, `mongoIntegration`, `mongooseIntegration`, `redisIntegration`, `prismaIntegration`, `tediousIntegration`, `graphqlIntegration`, `amqplibIntegration`, `kafkaIntegration`, `firebaseIntegration`

AI (often default on Node): `openAIIntegration`, `anthropicAIIntegration`, `googleGenAIIntegration`, `langChainIntegration`, `vercelAiIntegration`

### Opt-in / notable

| Integration | Use |
|---|---|
| `nodeProfilingIntegration` | From `@sentry/profiling-node` |
| `nodeRuntimeMetricsIntegration` | Runtime metrics |
| `anrIntegration` / `eventLoopBlockIntegration` | Event-loop / ANR |
| `localVariablesIntegration` | Local vars on exceptions (costly) |
| `fsIntegration` | FS spans |
| `dataloaderIntegration` / `knexIntegration` | DataLoader / Knex |
| `captureConsoleIntegration` / `extraErrorDataIntegration` | Extra context |
| `rewriteFramesIntegration` | Frame paths |
| `supabaseIntegration` | Supabase |
| `trpcMiddleware` | tRPC |
| `zodErrorsIntegration` | Zod issue formatting |
| `pinoIntegration` | Pino → Sentry |

Exact “auto enabled” flags can differ slightly by guide (Node vs Nest vs serverless). Prefer the guide for the installed package.

## Framework wiring (not just `*Integration()`)

| Framework | Typical hooks |
|---|---|
| Express / Connect | `setupExpressErrorHandler` / Connect equivalent after routes |
| Fastify / Koa / Hapi | Framework-specific setup from guide |
| NestJS | `SentryModule` + instrument import |
| Next.js | `withSentryConfig`, `captureRequestError`, route/server wrappers as docs prescribe |
| Remix / SvelteKit / Nuxt / SolidStart | Framework hooks / plugins |
| Hono / Elysia | Middleware / plugin |
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

// remove one default by name
Sentry.init({
  integrations: (integrations) =>
    integrations.filter((i) => i.name !== "Breadcrumbs"),
});
```

## OpenTelemetry

`@sentry/node` uses OpenTelemetry under the hood for many instrumentations. `@sentry/opentelemetry` is for advanced bridging with an existing OTel setup. Prefer the high-level SDK until you have a custom OTel pipeline requirement.
