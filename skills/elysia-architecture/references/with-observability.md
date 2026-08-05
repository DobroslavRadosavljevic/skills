# Extension: observability

Load when the API uses structured request logging and/or OpenTelemetry, and Effect spans should nest under HTTP requests.

## Stance

Mount telemetry **early**. Flush logs on shutdown. Enrich logs with active `trace_id` / `span_id` when a span exists. Exclude noisy paths (docs, health, auth noise) when the repo already does.

## Tree

```text
apps/<api>/src/
  plugins/opentelemetry/plugin.ts    # HTTP instrumentation — mount early
  plugins/evlog/plugin.ts            # or equivalent request logger
  telemetry/layer.ts                 # Effect OtelTracer.layerGlobal (+ optional DevTools)
  runtime.ts                         # provide telemetry Layer into ManagedRuntime
  main.ts                            # dispose runtime + flush logger on SIGINT/SIGTERM
```

## MUST

1. Register OTEL / tracing plugins **before** feature routes.
2. Wire Effect’s global tracer so `Effect.fn` spans nest under the request span.
3. Flush the log drain on process shutdown (with runtime dispose).
4. Keep secret headers / cookies out of log bodies.

## Soft defaults

- Pretty console in local; JSON/NDJSON files in app `.evlog/` (or repo convention).
- DevTools tracer tab only outside production.

## MUST NOT

1. Ad-hoc `console.log` as the primary request log line in new code.
2. Export traces without scrubbing sensitive fields when a scrubber exists.

## Checklist

```text
Observability overlay:
- [ ] OTEL/logging plugins early in main
- [ ] Effect tracer layer in runtime
- [ ] Shutdown flushes logs + disposes runtime
```
