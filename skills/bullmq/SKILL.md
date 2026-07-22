---
name: bullmq
description: "Build, review, debug, test, operate, or migrate BullMQ Node.js/TypeScript Redis job queues with current docs. Use for bullmq 5.x, Queue, Worker, QueueEvents, FlowProducer, Job, Redis/ioredis connections, createNodeRedisClient, createBunRedisClient, shared connections, prefixes, Redis Cluster hash tags, JobsOptions, priorities, delay, jobId, attempts, backoff, UnrecoverableError, DelayedError, RateLimitError, WaitingChildrenError, stalled jobs, lockDuration, concurrency, sandboxed processors, worker threads, delayed jobs, upsertJobScheduler, repeatable/cron jobs, rate limiting, deduplication debounce throttle keepLastIfActive, parent-child flows, getChildrenValues, failParentOnFailure, ignoreDependencyOnFailure, removeDependencyOnFailure, continueParentOnFailure, removeOnComplete/removeOnFail, graceful shutdown, NestJS @nestjs/bullmq, Bull Board, BullMQ Pro vs OSS, and production Redis queue ops or worker testing."
---

# BullMQ

Use this skill when work touches BullMQ Redis queues, workers, flows, retries/scheduling, NestJS BullMQ, or Pro-vs-OSS decisions.

## Workflow

1. Inspect the local BullMQ surface before changing code:
   - Package versions for `bullmq`, `@nestjs/bullmq` if present, Redis clients (`ioredis`, `redis`), Node/Bun, and TypeScript.
   - Connection shape: options object vs shared client vs adapters (`createNodeRedisClient`, `createBunRedisClient`); `prefix`; Redis DB index.
   - Producers (`Queue`, `FlowProducer`) vs consumers (`Worker`); process isolation (inline vs sandboxed file / worker threads).
   - Default job options, schedulers, rate limits, dedupe usage, Nest module registration if present.
2. Refresh current official docs when the task depends on latest APIs, version drift, Pro features, adapters, or Nest wrappers. Start from [source-map.md](references/source-map.md).
3. Route the work to the focused references:
   - Setup, Redis connections, Queue, Worker, QueueEvents: [setup-connections.md](references/setup-connections.md).
   - Job lifecycle and JobsOptions: [jobs-options.md](references/jobs-options.md).
   - Parent-child flows / FlowProducer: [flows.md](references/flows.md).
   - Retries, delays, job schedulers, rate limits, dedupe: [retries-scheduling-limits.md](references/retries-scheduling-limits.md).
   - Ops, testing, NestJS, Pro vs OSS, polyglot: [production-ops-integrations.md](references/production-ops-integrations.md).
4. Preserve the repository's existing connection factories, Nest modules, and deployment topology unless the user explicitly asks for a migration.
5. Verify behavior at the narrowest useful boundary (processor unit), then queue/worker integration.

## Core Judgment

- Treat Redis as shared infrastructure. Reuse connection options or factories deliberately; Workers and QueueEvents still duplicate connections for blocking commands, so the client must support `duplicate()`.
- Attach `error` listeners on `Queue`, `Worker`, `QueueEvents`, and `FlowProducer`. Unhandled connection errors crash Node.
- Design processors as idempotent. Jobs can retry, stall after lock loss, or run more than once—side effects need safe keys or transactional checks.
- Set `attempts` and `backoff` intentionally. Throw `UnrecoverableError` for poison/permanent failures; throw `Error` objects (not strings) from processors.
- Prefer `FlowProducer` for parent-child dependency graphs. Do not hand-roll “wait for children” with races across queues. Flow job opts omit `repeat`, `deduplication`, and `debounce`. Pick child failure opts deliberately (`failParentOnFailure`, `ignoreDependencyOnFailure`, `removeDependencyOnFailure`, `continueParentOnFailure`).
- Rate limiting is global per queue across workers. Do not resurrect removed patterns (`QueueScheduler`, pre-v3 groupKey rate limits) on BullMQ 5.x. Group rate limits are Pro-only.
- Deduplication needs a stable `deduplication.id`. Choose simple vs throttle (`ttl`) vs debounce (`extend`/`replace` + delay) vs `keepLastIfActive` for the product semantics.
- Priority: lower number wins among prioritized jobs (`1..2097151`); unset/`0` is unprioritized and is processed before any prioritized job.
- Tune `removeOnComplete` / `removeOnFail` (age or count keep policies). Unbounded completed/failed sets grow Redis without bound. Never use ioredis `keyPrefix`; use BullMQ `prefix` (brace hash tags on Cluster).
- Close workers gracefully on shutdown (`worker.close()`). Killing processes mid-lock causes stalls and duplicate work unless ops expect that window.
- Prefer `queue.upsertJobScheduler` over legacy `repeat` / `QueueScheduler` for cron/interval factories. Prefer `@nestjs/bullmq` over legacy `@nestjs/bull`.
- Do not recommend BullMQ Pro-only APIs (groups, group rate limits, batches, observables) unless the project already uses Pro. Call the boundary out explicitly.
- Keep processors thin and non-blocking on the event loop. Use sandboxed processors / `useWorkerThreads` when CPU-heavy or crash-isolating work is required. Job `data` is plaintext in Redis — avoid secrets or encrypt fields.

## Verification

Prefer repository-owned commands. For meaningful BullMQ changes, cover the relevant subset:

- Typecheck Queue/Worker/FlowProducer options, job `data`/`returnvalue` types, and Nest injection tokens if used.
- Unit-test processor success, retryable failure, `UnrecoverableError`, and progress updates in isolation.
- Integration test against Redis: add → process → complete/fail; assert job state transitions.
- Delayed/scheduler tests with short intervals; assert no duplicate schedules after redeploy when that matters (`upsertJobScheduler`).
- Rate-limit / dedupe tests: assert ignored/replaced/deferred behavior and any `deduplicated` events.
- Flow tests: children complete before parent; parent reads `getChildrenValues`; child failure policy (`failParentOnFailure` / `ignoreDependencyOnFailure` / `removeDependencyOnFailure` / `continueParentOnFailure`) matches product intent.
- Stall/lock smoke when changing `lockDuration`, `stalledInterval`, `maxStalledCount`, or long-running processors.
- Graceful-shutdown smoke: SIGTERM/`close` path finishes in-flight work without unexpected orphaned locks beyond the stall window.
- NestJS module smoke: queue registration, `WorkerHost` processors, and FlowProducer injection when Nest is in play.
- Redis growth check when changing retention (`removeOnComplete`/`removeOnFail`) or adding high-throughput queues.

Report which checks ran, which did not, and any Pro/OSS or package-version assumptions that remain.
