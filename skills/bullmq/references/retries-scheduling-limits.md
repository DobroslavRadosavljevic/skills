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

Without backoff, retries run immediately. Retried jobs keep their priority when returning to waiting. `jitter` is 0..1.

Custom backoff: `settings.backoffStrategy` on the Worker. Return `0` to requeue immediately; `-1` to fail without retry.

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

`Job#discard()` is **removed** — use `UnrecoverableError`. `RateLimitError`, `DelayedError`, and `WaitingChildrenError` do **not** increment `attemptsMade`. Use `attemptsStarted` / Worker `maxStartedAttempts` when looping these paths. Always pass the lock `token` into `moveToDelayed` / `moveToWaitingChildren`.

`WaitingError` (`bullmq:movedToWait`) is thrown when a job is moved from active back to wait/prioritized.

## Delayed Jobs

```typescript
await queue.add('reminder', { userId }, { delay: 60_000 });
```

## Job Schedulers (Repeatable Jobs)

Legacy `Queue.add(..., { repeat })`, `Repeat`, `getRepeatableJobs`, `removeRepeatable`, and `removeRepeatableByKey` are **removed in v6**. v6 errors if it finds leftover v5 repeatable metadata. Migrate on v5 first — see [production-ops-integrations.md](production-ops-integrations.md).

Prefer `upsertJobScheduler` so redeploys update rather than duplicate schedules:

```typescript
await queue.upsertJobScheduler(
  'daily-digest',
  { pattern: '0 15 3 * * *', tz: 'UTC' },
  {
    name: 'digest',
    data: { type: 'daily' },
    opts: { attempts: 3, removeOnFail: 1000 },
  },
);

await queue.upsertJobScheduler('heartbeat', { every: 1000 });
```

Notes:

- New jobs are produced when the previous scheduler job **starts** processing — backlog/low concurrency can stretch the effective interval.
- While active, a scheduler keeps one associated job in `delayed`.
- You cannot set a custom `jobId` on scheduler-produced jobs.
- Deduplication is not available on scheduler template opts; add a follow-up job from the processor if needed.
- `repeat.utc` is gone. Use `{ tz: 'UTC' }` for UTC cron. `RepeatOptions` also dropped cron-parser `currentDate` / `nthDayOfWeek`.
- Manage with `getJobSchedulers()`, `getJobScheduler(id)`, `getJobSchedulersCount()`, `removeJobScheduler(id)`.
- `QueueScheduler` is not required on BullMQ 2.0+ and must not be added on 6.x. Ignore old rate-limit snippets that still import it.

## Rate Limiting

Global per queue (all workers share the budget):

```typescript
const worker = new Worker('painter', async job => paint(job), {
  connection,
  limiter: { max: 10, duration: 1000 },
});
```

Rate-limited jobs stay waiting. Group-key rate limiting was removed from OSS in 3.0+; group rate limits are **Pro**.

Queue-level cap (all workers; worker `limiter` cannot override it):

```typescript
await queue.setGlobalRateLimit(1, 1000);
const { max, duration } = await queue.getGlobalRateLimit();
await queue.removeGlobalRateLimit();
```

Same idea for concurrency: `setGlobalConcurrency(n)` / `getGlobalConcurrency()` / `removeGlobalConcurrency()`. Worker `concurrency` is a local max that cannot exceed the global cap.

Manual / external 429 handling — use **`queue.rateLimit`** (`Worker#rateLimit` is deprecated):

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

Always set a stable `deduplication.id`. The `debounce` option, `Job#debounceId`, and the `debounced` event are **removed**. Use `deduplication` and listen for `deduplicated`. Deprecated aliases `getDebounceJobId` / `removeDebounceKey` still exist — prefer `getDeduplicationJobId` / `removeDeduplicationKey`.

Modes:

| Mode | Options | Behavior |
| --- | --- | --- |
| Simple | `{ id }` | While job incomplete, same id is ignored |
| Throttle | `{ id, ttl }` | Same id ignored until TTL expires |
| Debounce | `{ id, ttl, extend: true, replace: true }` + `delay` | Latest data wins; TTL resets |
| Keep last if active | `{ id, keepLastIfActive: true }` | While active, store latest; enqueue after completion (`ttl` ignored) |

```typescript
await queue.add('sync', data, { deduplication: { id: `user:${id}` } });

await queue.add('sync', data, { deduplication: { id: `user:${id}`, ttl: 5000 } });

await queue.add(
  'sync',
  data,
  {
    delay: 5000,
    deduplication: { id: `user:${id}`, ttl: 5000, extend: true, replace: true },
  },
);

await queue.add('deploy', { commit }, {
  deduplication: { id: `deploy:${repo}`, keepLastIfActive: true },
});
```

`keepLastIfActive` guarantees at most 1 active + 1 waiting per id. Combining it with `delay` yields a continuous debounce window after the active job finishes.

Listen for `deduplicated` on `QueueEvents` (`jobId` kept, `deduplicatedJobId` ignored/replaced, `deduplicationId`). Manual `job.remove()` disables dedupe. `await job.removeDeduplicationKey()` or `queue.removeDeduplicationKey(id)` to stop early.

## Choosing a Control

| Need | Prefer |
| --- | --- |
| Transient failure | `attempts` + backoff |
| Permanent failure | `UnrecoverableError` |
| Run later once | `delay` |
| Cron / interval factory | `upsertJobScheduler` |
| Protect downstream QPS | worker `limiter` / `queue.rateLimit` / `setGlobalRateLimit` |
| Cap parallelism across workers | `setGlobalConcurrency` |
| Collapse duplicate enqueues | `deduplication` mode matching product |
| Multi-step wait | `DelayedError` + `moveToDelayed`, or flows |
