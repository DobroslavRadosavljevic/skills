# Production, Ops, Testing, NestJS, and Pro vs OSS

## Upgrade 5 → 6

Official path: stay on latest v5 until application **and Redis data** use Job Schedulers, then deploy v6 everywhere together.

1. Upgrade to latest v5 (`release-v5.x` dist-tag, currently `5.81.5`).
2. Replace `Queue.add(..., { repeat })`, `getRepeatableJobs`, `removeRepeatable`, `removeRepeatableByKey`, and `Repeat`.
3. Recreate each definition with `upsertJobScheduler`. Map `repeat.pattern/every/limit/startDate/endDate/tz`; `repeat.utc: true` → `{ tz: 'UTC' }`. Template `name` / `data` / `opts` go in the third argument.
4. Verify with `getJobSchedulers()`, then delete legacy repeatable keys.
5. Deploy v6 only after every producer and worker is on Job Schedulers. Leftover v5 repeatable metadata makes v6 throw.

Other v6 breaks to fix in code (not Redis data):

| Removed / changed | Use instead |
| --- | --- |
| `Queue#client`, `redisVersion`, `databaseType`, `Worker#blockingClient`, `FlowProducer#client` | `getBackend()` (`RedisQueueBackend.client`, `.redisVersion`, …) |
| Constructor `Connection` class arg | Optional `BackendFactory` last argument |
| `waitUntilReady()` → Redis client | `Promise<void>` |
| Sync `Worker#resume()` | `await worker.resume()` |
| `repeat` on `add` / `addBulk` | `upsertJobScheduler` |
| `debounce`, `Job#debounceId`, `debounced` event | `deduplication`, `Job#deduplicationId`, `deduplicated` |
| `Job#discard()` | `throw new UnrecoverableError(...)` |
| `paused` in `JobType` / default `getJobCounts()` | Jobs in a paused queue are `waiting` |
| Direct `ioredis` dependency | `bun add ioredis` (optional peer) |
| `Scripts`, `createScripts`, `JobJsonRaw`, `RedisJobOptions` | Backend APIs |
| Telemetry `JobFinishedTimestamp` / `JobStatus`; optional `createGauge` | `JobState`; `Meter#createGauge()` required |
| Flow parent `deduplication` | Leaves only; missing `jobId` → UUID |

`Queue#clean()` telemetry now records the cleaned **count**, not job-id arrays. Custom `IQueueBackend` method renames: `reprocessJob` → `retryFinishedJob`, `retryJobs` → `retryFinishedJobs`, `cleanJobsInSet` → `cleanJobsByState`, `isJobInList`/`isJobInZSet` → `isJobInState`.

Stay on 5.x if the lockfile is still `bullmq@5` and the user did not ask to upgrade. Dist-tags: `latest` = 6.x, `release-v5.x` = 5.x line.

## Production Redis

- Enable persistence (recommend AOF; ~1s fsync is typical). Benchmark the impact.
- Set `maxmemory-policy` to **`noeviction`**. Cache-style eviction corrupts queues. On ElastiCache, use a custom parameter group.
- Recommended Redis **≥ 6.2.0** (code minimum 5.0.0; prefer the recommended floor).
- Plan memory for job payloads + retention (`removeOnComplete` / `removeOnFail`).
- Configure client reconnect deliberately: Workers should wait/retry (`maxRetriesPerRequest: null`); HTTP-facing Queues should fail fast (low retries, often `enableOfflineQueue: false`).
- Redis Cluster / MemoryDB: multi-key Lua needs **hash tags** — `prefix: '{tenantA}'` or braced queue names. Different tags per queue to spread slots.
- Dragonfly / Valkey: follow current Redis™ compatibility docs (Dragonfly has a dedicated page). Brace queue names so Dragonfly can pin a thread per queue.
- Never set ioredis `keyPrefix`.
- Install `ioredis` for the default driver. For node-redis / Bun adapters, configure that client's reconnect/timeout so producers fail fast and workers retry.

## Production PostgreSQL

When using `createPostgresBackend`:

- Run `runMigrations` from a dedicated deploy step before workers boot. Schema downgrades are unsupported.
- Size `max_connections` for each backend's pool (`max`) **plus** one dedicated LISTEN connection per blocking Worker/QueueEvents.
- Prefer the default `bullmq` schema and a dedicated database. Co-locate workers with the database; Postgres throughput is typically lower than Redis for high-concurrency processing.
- Redis knobs (`noeviction`, Cluster hash tags) do not apply.

## Process Topology

- Run workers as long-lived processes (or containers), separate from request/API processes when scale and blast radius matter.
- Do not use serverless request handlers as long-running Workers unless the platform explicitly supports the worker lifetime and connection model.
- Scale horizontally by adding Worker processes/machines; tune `concurrency` per process for I/O, and `setGlobalConcurrency` when a cluster-wide cap is required.

## Graceful Shutdown

```typescript
const shutdown = async (signal: string) => {
  console.log(`shutting down on ${signal}`);
  await worker.close(); // waits for active jobs; no built-in timeout
  process.exit(0);
};

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
```

Ungraceful kills rely on the stalled-job mechanism. Size `lockDuration`, `stalledInterval`, and `maxStalledCount` for worst-case processor work, and keep the event loop free enough to renew locks. Orchestrator termination grace must exceed worst-case in-flight job duration or jobs stall and retry elsewhere.

Optional: `worker.cancelAllJobs('shutdown')` so processors see `AbortSignal` and clean up; still `close()` afterward. On `lockRenewalFailed`, cancel those job ids locally — the worker cannot move them to failed without the lock; the stalled checker recovers them.

## Observability

- Attach Worker and QueueEvents listeners for `completed`, `failed`, `progress`, `stalled`, `deduplicated`, `error`. Do not listen for removed `debounced`.
- Built-in metrics: Worker `metrics: { maxDataPoints }` (same setting on all workers for a queue); `queue.getMetrics(...)`; `exportPrometheusMetrics()`.
- OpenTelemetry: `bullmq-otel` **≥ 2.0.0** for BullMQ 6 (`createGauge` is required on telemetry meters).
- Optional UIs (Bull Board, Taskforce) help operators; they are not a substitute for alerts on failed/stalled growth and Redis/Postgres memory. Put admin UIs behind auth — they expose job payloads.

## Security

- Job `data` is stored **plaintext**. Prefer not storing secrets; otherwise encrypt sensitive fields before `add`.
- Production Redis: ACL/password, TLS, private network. Production Postgres: roles, TLS, private network.
- Sandboxed processors isolate crashes/CPU — not a security sandbox for arbitrary untrusted code.

## Testing

- Prefer real Redis or Postgres (Docker/testcontainers), not mocks pretending to be BullMQ. Match the app's backend.
- Unique queue names or `prefix` / Postgres schema per test run to avoid cross-talk.
- `await worker.waitUntilReady()` / `queueEvents.waitUntilReady()` before adding jobs or asserting (returns void).
- Turn retries down in unit tests unless testing retry behavior.
- Always `close()` workers, queues, events, and flow producers in `after` hooks.
- Test processors in isolation; use the datastore for state-transition integration tests.
- For schedulers/delays, use short intervals and assert upsert idempotency across “redeploy” double-calls.
- Do not call `getRepeatableJobs` or pass `{ repeat }` in new tests.

## NestJS (`@nestjs/bullmq`)

Prefer `@nestjs/bullmq` over legacy `@nestjs/bull`. `@nestjs/bullmq@12` peers `bullmq` `^3 || ^4 || ^5 || ^6`.

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Module({
  imports: [
    BullModule.forRoot({
      connection: { host: 'localhost', port: 6379 },
    }),
    BullModule.registerQueue({ name: 'email' }),
    BullModule.registerFlowProducer({ name: 'flows' }),
  ],
  providers: [EmailProcessor],
})
export class AppModule {}

@Processor('email')
class EmailProcessor extends WorkerHost {
  async process(job: Job): Promise<any> {
    // ...
  }

  @OnWorkerEvent('completed')
  onCompleted() {}
}
```

Install with `bun add @nestjs/bullmq`. Inject queues with Nest's `@InjectQueue('email')` patterns from current Nest BullMQ docs. Keep processors as Nest providers. Path-based sandboxed Nest processors have **no Nest DI**. Core BullMQ judgment still applies inside Nest wrappers. Nest docs show Redis `connection` objects; do not invent Nest-specific Postgres factory wiring unless Nest documents it.

## Bull vs BullMQ

BullMQ is the modern Redis (and now optional Postgres) queue line. Migrating from Bull (`bull` package) is not a rename — safest pattern is new queue names or different `prefix`, dual-run, switch producers, drain old queues, then retire. Replace Nest `@nestjs/bull` with `@nestjs/bullmq` when applicable. Do not mix Bull and BullMQ assumptions in one queue.

## BullMQ Pro vs OSS

OSS covers queues, workers, flows, retries, schedulers, rate limits, dedupe, sandboxes, Redis + PostgreSQL backends, and multi-language clients.

**Pro-only** (do not recommend unless Pro is installed): groups, group rate limits / group concurrency, worker-side batches (`WorkerPro` + `job.getBatch()`), observables, and other Pro comparison-table features. OSS `addBulk` / `FlowProducer.addBulk` are not Pro batches.

When reviewing code that imports `@taskforcesh/bullmq-pro` APIs in an OSS-only lockfile, flag it as blocked.

## Polyglot

Node producers can feed Python / Rust / Elixir / PHP / .NET consumers on the same Redis queues when versions and key prefixes align. Refresh language-specific docs for client APIs; this skill does not claim feature parity across languages. Postgres schema must also match across languages.

## Review Checklist

- Redis `noeviction` + persistence called out for production; Cluster hash tags when needed. Postgres: migrations + `max_connections`.
- Redis users installed `ioredis`; Worker `maxRetriesPerRequest: null` respected; no ioredis `keyPrefix`.
- No `queue.client` / `worker.blockingClient`; `waitUntilReady()` not treated as a client; `await worker.resume()`.
- `error` listeners present; graceful `close` on SIGTERM; grace ≥ job duration.
- Retention policies set; prefixes/schemas isolate environments/tenants.
- No `QueueScheduler`, `repeat` on `add`, `getRepeatableJobs`, `debounce`, `Job.discard`, or removed groupKey rate-limit patterns on 6.x.
- No accidental Pro APIs in OSS projects.
- Nest uses `@nestjs/bullmq` when Nest is present.
- Processors idempotent; special errors used correctly; job data not storing cleartext secrets.
