# Patterns & Troubleshooting

## Correct init order

```text
instrument / Sentry.init
  → framework / DB / HTTP clients
    → routes
      → Sentry error middleware (Express etc.)
        → other error handlers
```

Breaking this is the #1 cause of “SDK installed but no spans / missing request context”.

## Package anti-patterns

- Mixing `@sentry/browser` + `@sentry/react` + `@sentry/nextjs` in one app surface
- Divergent 10.x patch versions across `@sentry/*` app packages
- Expecting `@sentry/vite-plugin@10` (plugins are **5.x**)
- Using `@sentry/node` on Bun/Cloudflare when `@sentry/bun` / `@sentry/cloudflare` exist

## PII & privacy

- Prefer `dataCollection` over deprecated `sendDefaultPii`
- Replay: enable masking for text/inputs in regulated apps
- Scrub with `beforeSend` for secrets that escape denylists
- `setUser` is explicit — clear on logout: `Sentry.setUser(null)`

## Shared environments

Browser extensions, embedded widgets, multi-tenant script hosts: build an isolated `BrowserClient` + `Scope` — do **not** `Sentry.init()` into the global hub. See docs: shared environments / browser extensions.

## Noise control

- `ignoreErrors`, `denyUrls`, `allowUrls`
- Inbound filters in Sentry project settings (browser extensions, web crawlers)
- Drop health-check transactions in `tracesSampler`
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
| No transactions | `tracesSampleRate` 0; tracing integration missing; late init |
| No replay | Integration missing; sample rates 0; ad-block; only error replays and no error |
| Duplicate events | Double `init` / multiple SDK copies |
| Extension polluting site | Global `init` in shared environment |
| Nest/Express gaps | Missing framework error handler registration |

## Migration notes

- v7 → v8+: integration constructors → functional `*Integration()`; see upstream `MIGRATION.md`
- v8 → v10: keep reading current migration guides when bumping majors
- Replace legacy `@sentry/tracing` imports

## When to refresh docs

Any of: new major, new framework package (e.g. TanStack Start beta), `dataCollection` / logs / metrics API changes, or wizard recommending different file layout than this skill snapshot.
