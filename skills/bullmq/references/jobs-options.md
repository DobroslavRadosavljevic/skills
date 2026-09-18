# Jobs, Lifecycle, and Options

## Anatomy

- **Queue name**: Redis key namespace (or Postgres queue identity) for the queue.
- **Job name**: discriminator string (`job.name`) for routing inside a processor.
- **`data`**: JSON-serializable payload. `JSON.stringify` stores enumerable own properties only — class instances lose prototype methods when a worker reads `job.data`. Prefer plain objects or implement `toJSON()`.
- **`jobId`**: optional custom id. Must not contain `:`; digits-only ids (for example `"123"`) are rejected (`Error: Custom Id cannot be integers`). Custom ids enforce uniqueness per queue; a second add with the same id is ignored. After remove / auto-removal, the id can be reused.

Type jobs when useful (`ProgressType` is optional; defaults to `number | object`):

```typescript
import { Job, Queue, Worker, RedisQueueBackend } from 'bullmq';

type EmailData = { to: string; template: string };
type EmailResult = { messageId: string };
type EmailProgress = { pct: number };

const queue = new Queue<EmailData, EmailResult, 'send'>('email', { connection });
const worker = new Worker<
  EmailData,
  EmailResult,
  'send',
  RedisQueueBackend,
  EmailProgress
>(
  'email',
  async (job: Job<EmailData, EmailResult, 'send', EmailProgress>) => {
    return { messageId: '...' };
  },
  { connection },
);
```

Omit the backend/progress generics when the defaults (`RedisQueueBackend`, `JobProgress`) are enough.

## Lifecycle States

Job states: `waiting`, `active`, `completed`, `failed`, `delayed`, `waiting-children` (parent awaiting children), plus prioritized waiting.

**`paused` is not a job state** on BullMQ 6. Jobs in a paused queue are represented as `waiting`. `getJobCounts()` without types does not return a `paused` count. `getJobState()` returns `'completed' | 'failed' | 'delayed' | 'active' | 'waiting' | 'waiting-children' | 'unknown'`.

Jobs move through supported APIs only (`add`, worker completion/failure, delay/move helpers, clean/obliterate). Do not rewrite Redis keys or Postgres rows by hand.

## Core JobsOptions

Set per `queue.add` / `addBulk`, or as `defaultJobOptions` on the Queue.

There is **no** `repeat` option on `Queue.add` / `addBulk` (removed in v6). There is **no** `debounce` option (use `deduplication`). `Job#discard()` is removed — throw `UnrecoverableError`.

| Option | Use |
| --- | --- |
| `priority` | `1..2097151`, lower = higher priority; unset/`0` = unprioritized and runs **before** prioritized jobs |
| `delay` | Milliseconds before the job becomes waitable |
| `lifo` | Process as LIFO instead of FIFO |
| `attempts` | Total tries including the first (`> 1` enables retries) |
| `backoff` | `{ type: 'fixed' \| 'exponential', delay, jitter? }` or custom |
| `jobId` | Stable unique id |
| `removeOnComplete` | `true`, count, or `{ age, count }` keep policy |
| `removeOnFail` | Same shape for failed jobs |
| `stackTraceLimit` | Cap stored stack frames |
| `sizeLimit` | Max JSON-serialized `data` bytes |
| `keepLogs` | Cap stored log lines |
| `deduplication` | See [retries-scheduling-limits.md](retries-scheduling-limits.md) |
| Flow child opts | `failParentOnFailure`, `ignoreDependencyOnFailure`, `removeDependencyOnFailure`, `continueParentOnFailure` — see [flows.md](flows.md) |

```typescript
await queue.add(
  'send',
  { to: 'a@example.com', template: 'welcome' },
  {
    attempts: 5,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { age: 24 * 3600 },
    priority: 1,
  },
);

await queue.addBulk([
  { name: 'send', data: { to: 'a@x.com', template: 'a' } },
  { name: 'send', data: { to: 'b@x.com', template: 'b' } },
]);
```

`addBulk` is OSS (many independent jobs). Worker-side `job.getBatch()` is **Pro**. Putting many ids in one job payload is a third, OSS-safe pattern when they must share one retry/completion.

## Results and Progress

- Return a value from the processor → stored as `job.returnvalue` and emitted on `completed`.
- `await job.updateProgress(number | object)` → `progress` events on Worker / QueueEvents. Progress must be JSON-serializable.
- Failed jobs store `failedReason` and stack (subject to limits).
- Use `job.deduplicationId` (not removed `debounceId`).

## Reading Jobs

Use Queue getters (`getJob`, `getJobs`, counts by state) and Job methods. Prefer QueueEvents for live cross-process notifications rather than polling when possible.

## Custom jobId Guidance

Use a custom `jobId` when exactly-once enqueue for a business key matters (for example `invoice-${id}-pdf`, without `:`). Do not overload `jobId` for debounce/throttle — use `deduplication` instead. Do not invent scheduler job ids; Job Scheduler assigns special ids. Aggressive `removeOnComplete`/`removeOnFail` plus `jobId` is not a durable throttle.

Flow nodes without `opts.jobId` receive **UUIDs** (not Redis incremental ids). See [flows.md](flows.md).

## Retention

Unbounded `completed`/`failed` sets are a common OOM cause. Prefer count or age-based keep policies on the Queue defaults and on high-volume job adds. Eviction is best-effort when another job finishes — there is no background timer. `{ count: 0 }` removes jobs as soon as they finalize.
