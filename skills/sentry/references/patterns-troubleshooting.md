# Patterns & Troubleshooting

## Correct init order

```text
instrument / Sentry.init
  → framework / DB / HTTP clients
    → routes
      → (v10 only) Sentry error middleware — v11 captures Express/Fastify/Koa/Hapi errors automatically
        → other error handlers
```

Breaking this is the #1 cause of “SDK installed but no spans / missing request context”.

## Package anti-patterns

- Mixing `@sentry/browser` + `@sentry/react` + `@sentry/nextjs` in one app surface
- Divergent 11.x (or mixed 10/11) versions across `@sentry/*` app packages
- Installing removed packages next to v11: `@sentry/types`, `@sentry/node-core`, `@sentry/tanstackstart`
- Expecting `@sentry/vite-plugin@11` (standalone plugins are **5.x**)
- Forcing `@sentry/*` 11 into Electron / Capacitor / React Native apps whose SDKs still embed 10.x
- Using `@sentry/node` on Bun/Cloudflare when `@sentry/bun` / `@sentry/cloudflare` exist

## PII & privacy

- `sendDefaultPii` is removed in v11; configure `dataCollection`. Its v11 defaults are **permissive** (user info, cookies, headers, request/response bodies, DB query data, GenAI I/O) — set explicit denies in regulated apps
- Replay: enable masking for text/inputs in regulated apps
- Scrub with `beforeSend` for secrets that escape denylists
- `setUser` is explicit — clear on logout: `Sentry.setUser(null)`

## Shared environments

Browser extensions, embedded widgets, multi-tenant script hosts: build an isolated `BrowserClient` + `Scope` — do **not** `Sentry.init()` into the global hub. See docs: shared environments / browser extensions.

## Noise control

- `ignoreErrors`, `denyUrls`, `allowUrls`
- Inbound filters in Sentry project settings (browser extensions, web crawlers)
- Drop health checks with `ignoreSpans` or `tracesSampler` (`ignoreTransactions` / `beforeSendTransaction` are no-ops in v11)
- Avoid `captureConsoleIntegration` in production unless intentionally desired

## Distributed tracing checklist

1. FE and BE both have tracing enabled
2. `tracePropagationTargets` includes API origins
3. CORS allows Sentry trace headers if applicable
4. Same org; projects can differ but traces still link with proper headers

## Serverless

- Wrap handlers with the platform SDK (`aws-serverless`, Cloudflare `withSentry`)
- Always `await Sentry.flush()` (or rely on documented wrapper flush) before freeze/exit
- Cold start: init outside the handler when the platform allows

## Verification script

```ts
Sentry.captureException(new Error("sentry.skill.verify"));
await Sentry.flush(2000);
```

Then confirm: Issue appears → stack is deminified → (optional) linked Replay / Trace.

## Common failures

| Symptom | Likely cause |
|---|---|
| No events | Missing/incorrect DSN; `beforeSend` drop; init never runs |
| Minified stacks | No source map upload / release mismatch |
| No transactions | `tracesSampleRate` 0; tracing integration missing; late init; v11 `--require` preload (use `--import`) |
| `beforeSendSpan` never runs | v11 callback/lifecycle mismatch (`withStaticSpan` with stream mode or vice versa) |
| Tags missing on spans | v11: scope tags apply to errors only — use `Sentry.setAttribute(s)` |
| No logs | v10: `enableLogs` unset; v11: no `Sentry.logger.*` calls or logging integration |
| New issue groups after upgrade | v11 `attachStacktrace: true` default |
| No replay | Integration missing; sample rates 0; ad-block; only error replays and no error |
| Duplicate events | Double `init` / multiple SDK copies |
| Extension polluting site | Global `init` in shared environment |
| Nest/Express gaps | v10: missing error handler registration; v11: `shouldHandleError` filtering on the integration |

## Migration notes

- v7 → v8+: integration constructors → functional `*Integration()`; see upstream `MIGRATION.md`
- v8 → v10: keep reading current migration guides when bumping majors
- v10 → v11: see [migration-v10-to-v11.md](migration-v10-to-v11.md)
- Replace legacy `@sentry/tracing` imports

## When to refresh docs

Any of: new 11.x minor with "Important Changes", new framework package (e.g. TanStack Start leaving beta), `dataCollection` / span streaming / logs / metrics API changes, Electron/RN/Capacitor moving to JS SDK 11, or wizard recommending different file layout than this skill snapshot.
