# Extension: cron

Load when periodic jobs run inside the API process (Elysia plugin + Effect runtime), not as a separate worker HTTP server.

## Stance

Cron belongs on the **control-plane / session API** (or a dedicated ops app) — the process that already owns billing sync, reservation expiry, etc. Prefer Redis/BullMQ workers for heavy browser/job work; use API cron for lightweight ledger/ops ticks.

## Tree

```text
apps/<control-plane-api>/src/plugins/cron/plugin.ts
  # schedule → runtime.runPromise(Effect.…)
  # catchCause / log; do not crash the HTTP process on a single tick failure
```

## MUST

1. Implement cron as an **app plugin**, not inside `modules/<feature>/routes/`.
2. Call domain services through the same `runtime` as HTTP.
3. Swallow/log tick failures so one bad run does not take down the server.
4. Gate enabling cron with env when local/dev should not fire provider syncs.

## MUST NOT

1. Put long Chromium / browser pool work in API cron.
2. Duplicate cron on both session and jobs APIs for the same sync without intent.

## Checklist

```text
Cron overlay:
- [ ] Plugin under src/plugins/cron
- [ ] Uses app runtime + domain services
- [ ] Failures logged, process stays up
```
