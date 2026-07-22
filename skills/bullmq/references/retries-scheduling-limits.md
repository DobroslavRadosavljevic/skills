# Retries, Scheduling, Rate Limits, and Deduplication

## Retries and Backoff

A job fails when the processor throws (must be an `Error`) or when it exceeds `maxStalledCount` after stalls.

```typescript
await queue.add(
  'flaky',
  { id: 1 },
  {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 }, // 1s, 2s, 4s, ...
  },
);

await queue.add(
  'flaky',
  { id: 2 },
  {
    attempts: 5,
    backoff: { type: 'fixed', delay: 3000, jitter: 0.5 },
  },
);
```

Without backoff, retries run immediately. Retried jobs keep their priority when returning to waiting.

### Special errors

```typescript
import {
  UnrecoverableError,
  DelayedError,
  RateLimitError,
  WaitingChildrenError,
} from 'bullmq';

// Stop retries immediately (poison payload, permanent business failure)
throw new UnrecoverableError('invalid invoice');

// Step-job pattern: move to delayed, then throw DelayedError
await job.moveToDelayed(Date.now() + 200, token);
await job.updateData({ step: next });
throw new DelayedError();

// Manual rate limit: park job without counting as a normal failure
await queue.rateLimit(durationMs);
throw new RateLimitError();

// Parent waiting for dynamically added children
const shouldWait = await job.moveToWaitingChildren(token);
if (shouldWait) throw new WaitingChildrenError();
```

`RateLimitError`, `DelayedError`, and `WaitingChildrenError` do **not** increment `attemptsMade`. Use `attemptsStarted` / `maxStartedAttempts` when looping these paths. Always pass the lock `token` into `moveToDelayed` / `moveToWaitingChildren`.
## Delayed Jobs

```typescript
await queue.add('reminder', { userId }, { delay: 60_000 });
```

## Job Schedulers (Repeatable Jobs)

Prefer `upsertJobScheduler` so redeploys update rather than duplicate schedules:

```typescript
await queue.upsertJobScheduler(
  'daily-digest',
  { pattern: '0 15 3 * * *' }, // cron
  {
    name: 'digest',
    data: { type: 'daily' },
    opts: { attempts: 3, removeOnFail: 1000 },
  },
);

await queue.upsertJobScheduler('heartbeat', { every: 1000 });
```

Notes:

- Historically called “repeatable jobs”; the modern factory API is Job Scheduler. Prefer it over `queue.add(..., { repeat })` (legacy/deprecated path since ~5.16).
- New jobs are produced when the previous scheduler job **starts** processing — backlog/low concurrency can stretch the effective interval.
- While active, a scheduler keeps one associated job in `delayed`.
- You cannot set a custom `jobId` on scheduler-produced jobs.
- Deduplication is not available directly on scheduler template opts; add a follow-up job from the processor if needed.
- `QueueScheduler` is **not** required on BullMQ 2.0+ and must not be added on 5.x. Some older rate-limit doc snippets still show it — ignore those.

## Rate Limiting

Global per queue (all workers share the budget):

```typescript
const worker = new Worker('painter', async job => paint(job), {
  connection,
  limiter: { max: 10, duration: 1000 },
});
```

Rate-limited jobs stay waiting. Group-key rate limiting was removed from OSS in 3.0+; group rate limits are **Pro**.

Manual / external 429 handling:

```typescript
const worker = new Worker(
  'api',
  async job => {
    const [limited, ms] = await callApi(job.data);
    if (limited) {
      await queue.rateLimit(ms);
      throw new RateLimitError();
    }
  },
  { connection, limiter: { max: 1, duration: 500 } },
);
```

Helpers: `queue.getRateLimitTtl(maxJobs)`, `queue.removeRateLimitKey()`.

## Deduplication

Always set a stable `deduplication.id`. Modes:

| Mode | Options | Behavior |
| --- | --- | --- |
| Simple | `{ id }` | While job incomplete, same id is ignored |
| Throttle | `{ id, ttl }` | Same id ignored until TTL expires |
| Debounce | `{ id, ttl, extend: true, replace: true }` + `delay` | Latest data wins; TTL resets |
| Keep last if active | `{ id, keepLastIfActive: true }` | While active, store latest; enqueue after completion |

```typescript
// Simple
await queue.add('sync', data, { deduplication: { id: `user:${id}` } });

// Throttle
await queue.add('sync', data, { deduplication: { id: `user:${id}`, ttl: 5000 } });

// Debounce
await queue.add(
  'sync',
  data,
  {
    delay: 5000,
    deduplication: { id: `user:${id}`, ttl: 5000, extend: true, replace: true },
  },
);

// Keep last while active (e.g. deploy latest commit)
await queue.add('deploy', { commit }, {
  deduplication: { id: `deploy:${repo}`, keepLastIfActive: true },
});
```

Listen for `deduplicated` on `QueueEvents` when ignored adds matter. Combine modes carefully; verify against current docs when mixing with delay.

## Choosing a Control

| Need | Prefer |
| --- | --- |
| Transient failure | `attempts` + backoff |
| Permanent failure | `UnrecoverableError` |
| Run later once | `delay` |
| Cron / interval factory | `upsertJobScheduler` |
| Protect downstream QPS | worker `limiter` / `rateLimit` |
| Collapse duplicate enqueues | `deduplication` mode matching product |
| Multi-step wait | `DelayedError` + `moveToDelayed`, or flows |
