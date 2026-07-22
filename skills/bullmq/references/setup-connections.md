# Setup, Connections, Queue, and Worker

## Install

```bash
bun add bullmq
```

Default Redis client path is ioredis (options objects are passed through). For node-redis, install `redis >= 5.0.0` and wrap with `createNodeRedisClient`. For Bun, wrap Bun's client with `createBunRedisClient`.

## Connection Patterns

Pass connection options or an adapted client to every BullMQ class:

```typescript
import { Queue, Worker } from 'bullmq';

const connection = { host: '127.0.0.1', port: 6379 };

const queue = new Queue('email', { connection });
const worker = new Worker(
  'email',
  async job => {
    // process
  },
  { connection },
);
```

Reuse a shared ioredis instance across producers or across workers. Workers and `QueueEvents` still create an internal duplicate for blocking commands; the client/adapter must support `duplicate()`.

```typescript
import IORedis from 'ioredis';
import { Queue, Worker } from 'bullmq';

const connection = new IORedis({ maxRetriesPerRequest: null });

const queue = new Queue('email', { connection });
const worker = new Worker('email', async job => {}, { connection });
```

### Client rules

- Workers with ioredis: `maxRetriesPerRequest` must be `null` so workers keep retrying while Redis is temporarily unreachable. BullMQ sets this by default for Workers it constructs; do not override when passing a shared client.
- Producers (`Queue`) often want fast-fail on disconnect (`maxRetriesPerRequest` left at client default, offline queue disabled) so HTTP handlers do not hang.
- node-redis:

```typescript
import { createClient } from 'redis';
import { Queue, Worker, createNodeRedisClient } from 'bullmq';

const raw = createClient({ url: 'redis://localhost:6379' });
const connection = createNodeRedisClient(raw);

const queue = new Queue('email', { connection });
const worker = new Worker('email', async job => {}, { connection });
```

- Optional global factory: set `RedisConnection.clientFactory` at startup when every new connection should use a non-ioredis client.
- Prefixes isolate key namespaces across apps/envs sharing one Redis. Prefer explicit BullMQ `prefix` over Redis DB indexes alone.
- **Never** set ioredis `keyPrefix` — incompatible with BullMQ. Use BullMQ `prefix` only.
- Redis Cluster / MemoryDB / Dragonfly threading: put braces in the prefix or queue name so multi-key Lua stays on one hash slot, for example `prefix: '{orders}'`. Use different hash tags per queue when spreading slots. Confirm current Redis™ compatibility docs for Valkey/Dragonfly before production.

## Class Roles

| Class | Role |
| --- | --- |
| `Queue` | Add/manage jobs, pause/resume, clean, getters |
| `Worker` | Process jobs; starts immediately unless `autorun: false` |
| `QueueEvents` | Cross-process job lifecycle events |
| `FlowProducer` | Atomic parent-child job trees (see [flows.md](flows.md)) |

## Minimal Worker

```typescript
import { Worker, Job, QueueEvents } from 'bullmq';

const worker = new Worker(
  'email',
  async (job: Job, token?: string, signal?: AbortSignal) => {
    await job.updateProgress(10);
    return { sent: true };
  },
  {
    connection,
    concurrency: 5,
    // autorun: false  → then call worker.run()
  },
);

worker.on('completed', (job, result) => {});
worker.on('failed', (job, err) => {});
worker.on('error', err => {
  console.error(err);
});

const events = new QueueEvents('email', { connection });
events.on('completed', ({ jobId, returnvalue }) => {});
events.on('failed', ({ jobId, failedReason }) => {});
events.on('deduplicated', ({ jobId, deduplicationId }) => {});
events.on('error', err => console.error(err));
// Events carry jobId (and payloads) — hydrate with Job.fromId(queue, jobId) when a Job instance is needed.
```

QueueEvents uses Redis streams (auto-trim ~10k; override via Queue `streams.events.maxLen` or `queue.trimEvents`).
## Ops-Critical Worker Options

- `concurrency`: parallel jobs per worker process (good for I/O). Update live via `worker.concurrency = n`.
- `lockDuration` / `lockRenewTime`: how long a job lock lasts and when it renews. Long CPU blocks that starve the event loop cause stalls.
- `stalledInterval` / `maxStalledCount`: how often stalled jobs are recovered and how many stalls before fail.
- `limiter`: see [retries-scheduling-limits.md](retries-scheduling-limits.md).
- `removeOnComplete` / `removeOnFail`: retention defaults for this worker's completions/failures.

## Sandboxed Processors

Pass a processor **file path** (not an inline function) for process isolation:

```typescript
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'bullmq';

const processorFile = path.join(__dirname, 'email-processor.js');
const worker = new Worker('email', processorFile, {
  connection,
  useWorkerThreads: true, // optional; threads instead of child processes (≥ 3.13)
});
// On Windows prefer: pathToFileURL(processorFile)
```

Use sandboxes for CPU-heavy work or crash isolation. Inline processors are fine for thin I/O handlers. Sandboxing is **not** a security boundary for untrusted code.

## Closing

```typescript
await worker.close(); // finishes in-flight jobs; no built-in timeout
await queue.close();
await events.close();
```

## Anti-Patterns

- Missing `error` listeners on BullMQ classes.
- Sharing one Redis DB across unrelated environments without prefixes.
- Using ioredis `keyPrefix` instead of BullMQ `prefix`.
- Blocking the Node event loop inside an inline processor (stalls + lock loss).
- Passing a shared ioredis client to Workers without `maxRetriesPerRequest: null`.
- Assuming connection reuse means one TCP connection for Workers/`QueueEvents` (blocking duplicate still exists).
- Redis Cluster without `{hash tags}` on prefix/queue name.
