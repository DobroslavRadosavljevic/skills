---
name: bullmq
description: "Build, review, debug, test, operate, or migrate BullMQ Node.js/TypeScript job queues with current docs. Use for bullmq 6.x, Queue, Worker, QueueEvents, FlowProducer, Job, IQueueBackend, RedisQueueBackend, PostgresQueueBackend, getBackend, createRedisBackend, createPostgresBackend, setDefaultBackendFactory, ioredis/redis/pg optional peers, createNodeRedisClient, createBunRedisClient, createValkeyGlideClient, shared connections, prefixes, Redis Cluster hash tags, JobsOptions, priorities, delay, jobId, attempts, backoff, UnrecoverableError, DelayedError, RateLimitError, WaitingChildrenError, stalled jobs, lockDuration, concurrency, sandboxed processors, worker threads, AbortSignal cancelJob, delayed jobs, upsertJobScheduler, job schedulers, rate limiting, queue.rateLimit, setGlobalConcurrency, setGlobalRateLimit, deduplication debounce throttle keepLastIfActive, parent-child flows, getChildrenValues, failParentOnFailure, ignoreDependencyOnFailure, removeDependencyOnFailure, continueParentOnFailure, removeOnComplete/removeOnFail, graceful shutdown, NestJS @nestjs/bullmq, Bull Board, BullMQ Pro vs OSS, v5-to-v6 migration (removed repeat/debounce/Job.discard), PostgreSQL backend, and production Redis/Postgres queue ops or worker testing."
---

# BullMQ

Use this skill when work touches BullMQ queues, workers, flows, retries/scheduling, NestJS BullMQ, PostgreSQL vs Redis backends, or Pro-vs-OSS decisions.

Snapshot: `bullmq@6.3.7` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if the installed major/minor differs.

## Workflow

1. Inspect the local BullMQ surface before changing code:
   - Package versions for `bullmq`, optional peers (`ioredis`, `redis`, `pg`, `bullmq-otel`), `@nestjs/bullmq` if present, Node/Bun, and TypeScript.
   - Backend: default Redis (`connection` options or a client) vs `createPostgresBackend` / `setDefaultBackendFactory`.
   - Connection shape: options object vs shared client vs adapters (`createNodeRedisClient`, `createBunRedisClient`, `createValkeyGlideClient`); Redis `prefix` vs Postgres `schema`.
   - Producers (`Queue`, `FlowProducer`) vs consumers (`Worker`); process isolation (inline vs sandboxed file / worker threads).
   - Default job options, schedulers, rate limits, dedupe usage, Nest module registration if present.
2. Refresh current official docs when the task depends on latest APIs, version drift, Pro features, adapters, Postgres, or Nest wrappers. Start from [source-map.md](references/source-map.md).
3. Route the work to the focused references:
   - Setup, Redis/Postgres backends, Queue, Worker, QueueEvents: [setup-connections.md](references/setup-connections.md).
   - Job lifecycle and JobsOptions: [jobs-options.md](references/jobs-options.md).
   - Parent-child flows / FlowProducer: [flows.md](references/flows.md).
   - Retries, delays, job schedulers, rate limits, dedupe: [retries-scheduling-limits.md](references/retries-scheduling-limits.md).
   - Ops, v5→v6 upgrade, testing, NestJS, Pro vs OSS, polyglot: [production-ops-integrations.md](references/production-ops-integrations.md).
4. Preserve the repository's existing connection factories, Nest modules, and deployment topology unless the user explicitly asks for a migration.
5. Verify behavior at the narrowest useful boundary (processor unit), then queue/worker integration.

## Core Judgment

- Treat the datastore as shared infrastructure. Reuse connection options or factories deliberately. Workers and QueueEvents still duplicate connections for blocking wait; Redis clients/adapters must support `duplicate()`.
- Default Redis path requires the optional `ioredis` peer (`bun add bullmq ioredis`). Do not assume `bullmq` still bundles ioredis.
- High-level classes are datastore-agnostic. Do not use removed `Queue#client`, `Queue#redisVersion`, `Queue#databaseType`, `Worker#blockingClient`, or `FlowProducer#client`. Reach Redis via `queue.getBackend().client` (typed as `RedisQueueBackend`) only as an escape hatch.
- `waitUntilReady()` resolves to `void`. Do not treat its return as a Redis client. `await worker.resume()`.
- Attach `error` listeners on `Queue`, `Worker`, `QueueEvents`, and `FlowProducer`. Unhandled connection errors crash Node.
- Design processors as idempotent. Jobs can retry, stall after lock loss, or run more than once.
- Set `attempts` and `backoff` intentionally. Throw `UnrecoverableError` for poison/permanent failures (`Job#discard()` is removed). Throw `Error` objects, not strings.
- Prefer `FlowProducer` for parent-child graphs. Flow parents must not set `deduplication`. Flow job opts omit `repeat`. Nodes without `opts.jobId` get UUIDs. Pick child failure opts deliberately (`failParentOnFailure`, `ignoreDependencyOnFailure`, `removeDependencyOnFailure`, `continueParentOnFailure`).
- Recurring work is Job Schedulers only: `upsertJobScheduler` / `getJobSchedulers` / `removeJobScheduler`. Do not resurrect `Queue.add(..., { repeat })`, `Repeat`, `getRepeatableJobs`, `removeRepeatable`, `removeRepeatableByKey`, `debounce`, `Job#debounceId`, the `debounced` event, `QueueScheduler`, or pre-v3 `groupKey` rate limits on BullMQ 6.x. Group rate limits are Pro-only.
- Deduplication needs a stable `deduplication.id`. Choose simple vs throttle (`ttl`) vs debounce (`extend`/`replace` + `delay`) vs `keepLastIfActive`.
- Rate limiting is global per queue across workers. Prefer `queue.rateLimit` (Worker `#rateLimit` is deprecated). Optional queue-level `setGlobalConcurrency` / `setGlobalRateLimit` cap all workers; per-worker `concurrency`/`limiter` cannot exceed them.
- Priority: lower number wins among prioritized jobs (`1..2097151`); unset/`0` is unprioritized and is processed before any prioritized job. Paused queues still hold jobs as **waiting** — `paused` is not a job state in `getJobCounts()` / `JobType`.
- Tune `removeOnComplete` / `removeOnFail` (age or count keep policies). Unbounded completed/failed sets grow without bound. Never use ioredis `keyPrefix`; use BullMQ `prefix` (brace hash tags on Cluster). Postgres uses `schema`, not Redis prefix.
- Close workers gracefully on shutdown (`await worker.close()`). Killing processes mid-lock causes stalls and duplicate work unless ops expect that window.
- Prefer `@nestjs/bullmq` over legacy `@nestjs/bull`. Do not recommend BullMQ Pro-only APIs (groups, group rate limits, worker `job.getBatch()`, observables) unless the project already uses Pro.
- Keep processors thin and non-blocking on the event loop. Use sandboxed processors / `useWorkerThreads` when CPU-heavy or crash-isolating work is required. Job `data` is plaintext — avoid secrets or encrypt fields.
- Redis remains the default, battle-tested backend. Use PostgreSQL (`createPostgresBackend`, explicit `runMigrations`) only when the project chooses a single-database model. Do not mix Redis and Postgres for the same queue.

## Verification

Prefer repository-owned commands. For meaningful BullMQ changes, cover the relevant subset:

- Typecheck Queue/Worker/FlowProducer options (including backend generic), job `data`/`returnvalue`/`ProgressType` types, and Nest injection tokens if used.
- Unit-test processor success, retryable failure, `UnrecoverableError`, progress, and AbortSignal cancellation in isolation.
- Integration test against Redis or Postgres: add → process → complete/fail; assert job state transitions. `await worker.waitUntilReady()` before adding jobs (returns void).
- Delayed/scheduler tests with short intervals; assert no duplicate schedules after redeploy (`upsertJobScheduler`). Confirm no leftover `repeat` / `getRepeatableJobs` usage.
- Rate-limit / dedupe tests: assert ignored/replaced/deferred behavior and `deduplicated` events (not `debounced`).
- Flow tests: children complete before parent; parent reads `getChildrenValues`; child failure policy matches product intent; parent nodes reject `deduplication`.
- Stall/lock smoke when changing `lockDuration`, `stalledInterval`, `maxStalledCount`, or long-running processors.
- Graceful-shutdown smoke: SIGTERM/`close` path finishes in-flight work without unexpected orphaned locks beyond the stall window.
- NestJS module smoke: queue registration, `WorkerHost` processors, and FlowProducer injection when Nest is in play.
- Postgres: `runMigrations` applied; `SchemaVersionMismatchError` / `SchemaMigrationRequiredError` not hit at boot.
- Redis growth check when changing retention (`removeOnComplete`/`removeOnFail`) or adding high-throughput queues.

Report which checks ran, which did not, and any Pro/OSS, Redis-vs-Postgres, or package-version assumptions that remain.
