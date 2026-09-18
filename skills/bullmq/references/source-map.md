# Source Map

Snapshot date: 2026-09-18.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, adapter work, Pro features, Nest wrappers, PostgreSQL, or version mismatches.

## Research Snapshot

- Context7 libraries: `/taskforcesh/bullmq`, `/websites/bullmq_io`, `/websites/api_bullmq_io` (high source reputation). Context7 API pages may still mix v5 URLs; prefer `https://docs.bullmq.io/api/` v6 pages.
- npm versions observed on 2026-09-18:
  - `bullmq` `latest`: `6.3.7` (published 2026-09-18)
  - `bullmq` `release-v5.x`: `5.81.5`
  - `bullmq` `release-v4.x`: `4.18.3`
  - `bullmq` `release-v3.x`: `3.16.2`
  - Optional peers on 6.3.7: `ioredis >= 5.0.0`, `redis >= 5.0.0`, `pg >= 8.0.0`, `bullmq-otel >= 2.0.0`
  - Direct deps: `cron-parser` `5.10.1`, `msgpackr` `2.1.0`, `semver` `7.8.5`, `tslib` `2.8.1`, `node-abort-controller` `3.1.1`
  - Engines: Node `>= 14.17.0`
- Related packages when present in the app:
  - `@nestjs/bullmq` `12.0.0` (peer `bullmq` `^3 || ^4 || ^5 || ^6`)
  - `bullmq-otel` `2.0.1` (peer `bullmq >= 6.0.0`)
  - `ioredis`, `redis`, `pg`, Bull Board (`@bull-board/*`)
  - `@valkey/valkey-glide` (Glide adapter; **not** a declared `bullmq` peer)

Do not assume Nest or UI packages share the BullMQ patch version. Check the application's lockfile before changing them.

`docs.bullmq.io/llms.txt` and `docs.bullmq.io/sitemap.md` returned 404 on this snapshot. Use the VitePress docs, `https://docs.bullmq.io/changelog`, GitHub `docs/gitbook/SUMMARY.md`, and `https://docs.bullmq.io/api/`.

## Official Core Documentation

- Home: https://docs.bullmq.io/
- Guide overview: https://docs.bullmq.io/guide
- Connections / backends: https://docs.bullmq.io/guide/connections
- PostgreSQL backend: https://docs.bullmq.io/guide/postgresql
- Queues: https://docs.bullmq.io/guide/queues
- Global concurrency: https://docs.bullmq.io/guide/queues/global-concurrency
- Global rate limit: https://docs.bullmq.io/guide/queues/global-rate-limit
- Batches (OSS vs Pro): https://docs.bullmq.io/guide/queues/batches
- Workers: https://docs.bullmq.io/guide/workers
- Cancelling jobs: https://docs.bullmq.io/guide/workers/cancelling-jobs
- Jobs: https://docs.bullmq.io/guide/jobs
- Delayed jobs: https://docs.bullmq.io/guide/jobs/delayed
- Deduplication: https://docs.bullmq.io/guide/jobs/deduplication
- Repeatable (removed APIs): https://docs.bullmq.io/guide/jobs/repeatable
- Retrying failing jobs: https://docs.bullmq.io/guide/retrying-failing-jobs
- Job schedulers: https://docs.bullmq.io/guide/job-schedulers
- Manage schedulers: https://docs.bullmq.io/guide/job-schedulers/manage-job-schedulers
- Flows: https://docs.bullmq.io/guide/flows
- Fail parent: https://docs.bullmq.io/guide/flows/fail-parent
- Ignore dependency: https://docs.bullmq.io/guide/flows/ignore-dependency
- Remove dependency: https://docs.bullmq.io/guide/flows/remove-dependency
- Continue parent: https://docs.bullmq.io/guide/flows/continue-parent
- Rate limiting: https://docs.bullmq.io/guide/rate-limiting
- Prioritized jobs: https://docs.bullmq.io/guide/jobs/prioritized
- Job ids: https://docs.bullmq.io/guide/jobs/job-ids
- Events: https://docs.bullmq.io/guide/events
- Metrics: https://docs.bullmq.io/guide/metrics
- Telemetry metrics: https://docs.bullmq.io/guide/telemetry/metrics
- Redis™ compatibility: https://docs.bullmq.io/guide/redis-tm-compatibility
- Dragonfly: https://docs.bullmq.io/guide/redis-tm-compatibility/dragonfly
- Redis Cluster: https://docs.bullmq.io/patterns/redis-cluster
- Sandboxed processors: https://docs.bullmq.io/guide/workers/sandboxed-processors
- Concurrency: https://docs.bullmq.io/guide/workers/concurrency
- Stalled jobs: https://docs.bullmq.io/guide/workers/stalled-jobs
- Graceful shutdown: https://docs.bullmq.io/guide/workers/graceful-shutdown
- Going to production: https://docs.bullmq.io/guide/going-to-production
- NestJS: https://docs.bullmq.io/guide/nestjs
- Migrate v5 → v6: https://docs.bullmq.io/guide/migrations/migrate-from-v5-to-v6
- Bull → BullMQ: https://docs.bullmq.io/guide/migrations/bull-to-bullmq
- Architecture: https://docs.bullmq.io/guide/architecture
- Patterns (stop retrying): https://docs.bullmq.io/patterns/stop-retrying-jobs
- Patterns (step / DelayedError): https://docs.bullmq.io/patterns/process-step-jobs
- BullMQ Pro: https://docs.bullmq.io/bullmq-pro
- Changelog: https://docs.bullmq.io/changelog

## API Reference (v6)

API docs live on the main site (not `api.docs.bullmq.io` v5 URLs):

- API home: https://docs.bullmq.io/api/
- Queue: https://docs.bullmq.io/api/classes/v6.Queue.html
- Worker: https://docs.bullmq.io/api/classes/v6.Worker.html
- WorkerOptions: https://docs.bullmq.io/api/interfaces/v6.WorkerOptions.html
- JobsOptions: https://docs.bullmq.io/api/types/v6.JobsOptions.html
- FlowProducer: https://docs.bullmq.io/api/classes/v6.FlowProducer.html
- RedisQueueBackend: https://docs.bullmq.io/api/classes/v6.RedisQueueBackend.html
- createPostgresBackend: https://docs.bullmq.io/api/variables/v6.createPostgresBackend.html

## Product and Packages

- Product site: https://bullmq.io/
- npm: https://www.npmjs.com/package/bullmq
- GitHub: https://github.com/taskforcesh/bullmq
- NestJS package: https://www.npmjs.com/package/@nestjs/bullmq

## Polyglot Note

BullMQ ships Python, Rust, Elixir, PHP, and .NET clients that can share Redis queues (and, where implemented, Postgres) with Node producers/consumers. This skill's procedural guidance targets **Node.js/TypeScript OSS**. For other languages, refresh language-specific docs; do not invent API parity from Node examples.

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current behavior, a migration, or an upgrade.
- The installed `bullmq` major/minor differs from `6.x`, or the patch drifts far from `6.3.x`.
- The task touches Redis client adapters, PostgreSQL backend/migrations, dedupe modes, flows failure options, job schedulers, rate-limit APIs, Nest wrappers, Pro features, sandboxed/worker-thread processors, or production Redis/Postgres settings.
- Observed runtime or TypeScript declarations disagree with this skill text — prefer lockfile + current docs + datastore evidence.
