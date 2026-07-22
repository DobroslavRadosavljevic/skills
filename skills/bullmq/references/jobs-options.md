# Jobs, Lifecycle, and Options

## Anatomy

- **Queue name**: Redis key namespace for the queue.
- **Job name**: discriminator string (`job.name`) for routing inside a processor.
- **`data`**: JSON-serializable payload.
- **`jobId`**: optional custom id. Must not contain `:`; digits-only ids (for example `"123"`) are rejected. Custom ids enforce uniqueness per queue; a second add with the same id is ignored. After remove / auto-removal, the id can be reused.

Type jobs when useful:

```typescript
import { Job, Queue, Worker } from 'bullmq';

type EmailData = { to: string; template: string };
type EmailResult = { messageId: string };

const queue = new Queue<EmailData, EmailResult, 'send'>('email', { connection });
const worker = new Worker<EmailData, EmailResult, 'send'>(
  'email',
  async (job: Job<EmailData, EmailResult, 'send'>) => {
    return { messageId: '...' };
  },
  { connection },
);
```

## Lifecycle States

Common states: `waiting`, `active`, `completed`, `failed`, `delayed`, `paused`, `waiting-children` (parent awaiting children), plus prioritized waiting variants.

Jobs move through supported APIs only (`add`, worker completion/failure, delay/move helpers, clean/obliterate). Do not rewrite Redis keys by hand.

## Core JobsOptions

Set per `queue.add` / `addBulk`, or as `defaultJobOptions` on the Queue.

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
| `deduplication` | See [retries-scheduling-limits.md](retries-scheduling-limits.md) |
| `repeat` / scheduler | Prefer `upsertJobScheduler` for factories |

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

## Results and Progress

- Return a value from the processor → stored as `job.returnvalue` and emitted on `completed`.
- `await job.updateProgress(number | object)` → `progress` events on Worker / QueueEvents.
- Failed jobs store `failedReason` and stack (subject to limits).

## Reading Jobs

Use Queue getters (`getJob`, `getJobs`, counts by state) and Job methods. Prefer QueueEvents for live cross-process notifications rather than polling when possible.

## Custom jobId Guidance

Use a custom `jobId` when exactly-once enqueue for a business key matters (for example `invoice-${id}-pdf`, without `:`). Do not overload `jobId` for debounce/throttle — use `deduplication` instead. Do not invent scheduler job ids; Job Scheduler assigns special ids. Aggressive `removeOnComplete`/`removeOnFail` plus `jobId` is not a durable throttle.

## Retention

Unbounded `completed`/`failed` sets are a common Redis OOM cause. Prefer count or age-based keep policies on the Queue defaults and on high-volume job adds.
