# Setup, Connections, Queue, and Worker

## Install

Default Redis backend (ioredis is an **optional peer**; install it explicitly):

```bash
bun add bullmq ioredis
```

| Peer | When |
| --- | --- |
| `ioredis` `>= 5.0.0` | Default Redis driver (lazy-loaded) |
| `redis` `>= 5.0.0` | node-redis adapter (`createNodeRedisClient`) |
| `pg` `>= 8.0.0` | PostgreSQL backend (`createPostgresBackend`) |
| `bullmq-otel` `>= 2.0.0` | OpenTelemetry (`bullmq-otel` 2.x requires `bullmq` `>= 6`) |

Node engines: `>= 14.17.0`. In native ESM where `require('ioredis')` is unavailable, pass an already-constructed client instead of host/port options.

## Connection Patterns

Pass connection options or an adapted client to every BullMQ class. High-level classes talk to an `IQueueBackend`. The default factory is `createRedisBackend`; you normally just pass `connection` and BullMQ wires Redis for you.

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

Raw ioredis instances are still accepted: BullMQ wraps them in an `IRedisClient` proxy (`runCommand`, structured `hset`/`set`/`zrange`/…, `duplicate()` returns another wrapped proxy). The underlying instance is not mutated.

### Client rules

- Workers with ioredis: `maxRetriesPerRequest` must be `null` so workers keep retrying while Redis is temporarily unreachable. BullMQ sets this by default for Workers it constructs; do not override when passing a shared client.
- Producers (`Queue`) often want fast-fail on disconnect (`maxRetriesPerRequest` left at client default, offline queue disabled) so HTTP handlers do not hang.
- node-redis (wrap explicitly; peer `redis >= 5.0.0`):

```typescript
import { createClient } from 'redis';
import { Queue, Worker, createNodeRedisClient } from 'bullmq';

const raw = createClient({ url: 'redis://localhost:6379' });
const connection = createNodeRedisClient(raw);

const queue = new Queue('email', { connection });
const worker = new Worker('email', async job => {}, { connection });
```

- Bun Redis (run under Bun, not Node):

```typescript
import { RedisClient } from 'bun';
import { Queue, Worker, createBunRedisClient } from 'bullmq';

const rawClient = new RedisClient('redis://localhost:6379');
const connection = createBunRedisClient(rawClient);

const queue = new Queue('email', { connection });
const worker = new Worker('email', async job => {}, { connection });
```

Close a shared Bun wrapper with `connection.disconnect()` / `await connection.quit()` after every Queue/Worker `close()`. Do **not** `close()` the raw Bun `RedisClient` directly — the wrapper treats that as unexpected and tries to reconnect.

- Valkey Glide (`createValkeyGlideClient`; install `@valkey/valkey-glide` yourself — it is not a declared peer):

```typescript
import { GlideClusterClient } from '@valkey/valkey-glide';
import { Queue, Worker, createValkeyGlideClient } from 'bullmq';

const rawClient = await GlideClusterClient.createClient({
  addresses: [{ host: 'localhost', port: 6379 }],
});
const connection = createValkeyGlideClient(rawClient);
```

- Optional global factory: set `RedisConnection.clientFactory` at startup when every new Redis connection should use a non-ioredis client. The factory receives merged options and must return an `IRedisClient`.
- Built-in adapters: `createIORedisClient`, `createNodeRedisClient`, `createBunRedisClient`, `createValkeyGlideClient`. Custom drivers implement `IRedisClient` (`duplicate()`, `defineCommand()`, `multi()`/`pipeline()`, lifecycle events).
- Prefixes isolate Redis key namespaces across apps/envs sharing one instance. Prefer explicit BullMQ `prefix` over Redis DB indexes alone. `prefix` is Redis-only (`KeyPrefixOptions`); PostgreSQL namespaces with `schema`.
- **Never** set ioredis `keyPrefix` — incompatible with BullMQ. Use BullMQ `prefix` only.
- Redis Cluster / MemoryDB / Dragonfly threading: put braces in the prefix or queue name so multi-key Lua stays on one hash slot, for example `prefix: '{orders}'`. Use different hash tags per queue when spreading slots. Confirm current Redis™ compatibility docs for Valkey/Dragonfly before production.

## Backends

`Queue`, `Worker`, `QueueEvents`, and `FlowProducer` take an optional last-argument `BackendFactory`. Default is Redis.

```typescript
import { Queue, RedisClient } from 'bullmq';

const queue = new Queue('email', { connection });
const client: RedisClient = await queue.getBackend().client; // Redis escape hatch
```

`getBackend()` returns the concrete backend (`RedisQueueBackend` by default). Redis-only fields: `client`, `blockingClient` (Worker), `redisVersion`, `databaseType`, underlying `connection`. Prefer high-level APIs; backend-specific access is outside the datastore-agnostic contract.

Inject a custom factory when not using Redis:

```typescript
import { Queue, BackendFactory } from 'bullmq';

const queue = new Queue('email', { connection: {} }, myBackendFactory);
```

`setDefaultBackendFactory(factory)` changes the process-wide default (pass `undefined` to reset to Redis). Classes are generic over the backend: `new Queue<MyData, MyResult, string, MyBackend>(name, opts, createMyBackend)`.

### PostgreSQL backend

Optional OSS backend: same Queue/Worker/QueueEvents/FlowProducer API on PostgreSQL 13+ (14+ recommended). Peer `pg >= 8.0.0`, loaded lazily.

```typescript
import {
  Queue,
  Worker,
  PostgresQueueBackend,
  createPostgresBackend,
} from 'bullmq';

const opts = { connection: 'postgres://user:password@localhost:5432/mydb' };

const queue = new Queue<any, any, string, PostgresQueueBackend>(
  'email',
  opts,
  createPostgresBackend,
);
const worker = new Worker('email', async job => {}, opts, createPostgresBackend);
```

Or process-wide:

```typescript
import { setDefaultBackendFactory, createPostgresBackend, Queue } from 'bullmq';

setDefaultBackendFactory(createPostgresBackend);
const queue = new Queue('email', {
  connection: 'postgres://user:password@localhost:5432/mydb',
});
```

`connection` may be a connection string, a `pg.PoolConfig` (optional `schema`, `skipVersionCheck`), or an existing `pg.Pool` (you own its lifecycle; BullMQ does not `end()` it). Default schema is `bullmq`. Schema is only applied when BullMQ builds the pool; a passed-in `Pool` must already have `search_path` covering that schema.

Migrations are **not** automatic. Run them from a dedicated deploy step:

```typescript
import { Pool } from 'pg';
import { runMigrations } from 'bullmq';

const pool = new Pool({ connectionString: 'postgres://localhost:5432/mydb' });
const client = await pool.connect();
try {
  await runMigrations(client);
} finally {
  client.release();
  await pool.end();
}
```

`runMigrations` is idempotent and serialized with a per-schema advisory lock. Schema compatibility is scoped to BullMQ major versions. Uninitialized schema → `SchemaMigrationRequiredError`. Newer schema than this client major → `SchemaVersionMismatchError`. Downgrades are not supported. Server older than 13 → `UnsupportedPostgresVersionError` (bypass with `skipVersionCheck: true` at your risk).

Do not mix Redis and Postgres for the same queue. Redis Cluster / `maxmemory-policy` do not apply; size PostgreSQL `max_connections` for pools plus one dedicated LISTEN connection per backend that blocks.

## Class Roles

| Class | Role | Constructor tail |
| --- | --- | --- |
| `Queue` | Add/manage jobs, pause/resume, clean, getters | `(name, opts, backendFactory?)` |
| `Worker` | Process jobs; starts immediately unless `autorun: false` | `(name, processor, opts, backendFactory?)` |
| `QueueEvents` | Cross-process job lifecycle events | `(name, opts, backendFactory?)` |
| `FlowProducer` | Atomic parent-child job trees (see [flows.md](flows.md)) | `(opts, backendFactory?)` |

Generics: `Worker<DataType, ResultType, NameType, Backend, ProgressType>`. `ProgressType` defaults to `JobProgress` (`number | object`) and must be JSON-serializable.

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
events.on('deduplicated', ({ jobId, deduplicationId, deduplicatedJobId }) => {});
events.on('error', err => console.error(err));
```

QueueEvents uses Redis streams (auto-trim ~10k; override via Queue `streams.events.maxLen` or `queue.trimEvents`). Events carry `jobId` (and payloads) — hydrate with `Job.fromId(queue, jobId)` when a `Job` instance is needed.

`await worker.waitUntilReady()` / `await queue.waitUntilReady()` resolve to **void** (not a Redis client). `await worker.resume()` — resume is async.

Cancel in-flight processors with `worker.cancelJob(jobId, reason?)` / `worker.cancelAllJobs(reason?)`. The processor `signal` is an `AbortSignal`. Throwing a normal `Error` on abort still retries; throw `UnrecoverableError` for a permanent cancel. On `lockRenewalFailed`, cancel locally and let the stalled checker recover the lock — the worker no longer owns it.

## Ops-Critical Worker Options

- `concurrency`: parallel jobs per worker process (good for I/O). Update live via `worker.concurrency = n`. Queue-level `setGlobalConcurrency(n)` caps **all** workers; a worker cannot exceed the global cap.
- `lockDuration` (default 30000) / `lockRenewTime`: how long a job lock lasts and when it renews. Long CPU blocks that starve the event loop cause stalls.
- `stalledInterval` / `maxStalledCount`: how often stalled jobs are recovered and how many stalls before fail. Do not set `stalledInterval` to 0.
- `limiter`: see [retries-scheduling-limits.md](retries-scheduling-limits.md).
- `removeOnComplete` / `removeOnFail`: retention defaults for this worker's completions/failures.
- `maxStartedAttempts`: cap `attemptsStarted` (includes DelayedError / rate-limit loops that do not burn `attemptsMade`).

## Sandboxed Processors

Pass a processor **file path** or `URL` (not an inline function) for process isolation:

```typescript
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { Worker } from 'bullmq';

const processorFile = path.join(__dirname, 'email-processor.js');
const worker = new Worker('email', processorFile, {
  connection,
  useWorkerThreads: true, // optional; threads instead of child processes
});
// On Windows prefer: pathToFileURL(processorFile)
```

Sandbox files typically `module.exports = async (job: SandboxedJob) => { ... }`. Use sandboxes for CPU-heavy work or crash isolation. Inline processors are fine for thin I/O handlers. Sandboxing is **not** a security boundary for untrusted code. Optional `workerForkOptions` / `workerThreadsOptions` apply only to file processors.

## Closing

```typescript
await worker.close(); // finishes in-flight jobs; no built-in timeout
await queue.close();
await events.close();
```

`worker.close(true)` skips waiting for active jobs (can stall them; also can drop in-flight telemetry spans).

## Anti-Patterns

- Missing `error` listeners on BullMQ classes.
- Installing `bullmq` without `ioredis` while still using host/port Redis options.
- Using removed `queue.client` / `worker.blockingClient` instead of `getBackend()`.
- Sharing one Redis DB or one Postgres schema across unrelated environments without prefixes/schemas.
- Using ioredis `keyPrefix` instead of BullMQ `prefix`.
- Blocking the Node event loop inside an inline processor (stalls + lock loss).
- Passing a shared ioredis client to Workers without `maxRetriesPerRequest: null`.
- Assuming connection reuse means one TCP connection for Workers/`QueueEvents` (blocking duplicate still exists).
- Redis Cluster without `{hash tags}` on prefix/queue name.
- Mixing Redis and PostgreSQL backends for the same queue.
