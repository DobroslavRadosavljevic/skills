# Source Map

Snapshot date: 2026-07-22.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, adapter work, Pro features, Nest wrappers, or version mismatches.

## Research Snapshot

- Context7 libraries: `/taskforcesh/bullmq`, `/websites/bullmq_io`, `/websites/api_bullmq_io` (high source reputation).
- npm versions observed on 2026-07-22:
  - `bullmq`: `5.80.9` (published 2026-07-18)
  - Peer for node-redis adapter: `redis >= 5.0.0`
- Related packages when present in the app: `@nestjs/bullmq`, `ioredis`, `redis`, Bull Board (`@bull-board/*`).

Do not assume Nest or UI packages share the BullMQ patch version. Check the application's lockfile before changing them.

## Official Core Documentation

- Home: https://docs.bullmq.io/
- Guide overview: https://docs.bullmq.io/guide
- Connections: https://docs.bullmq.io/guide/connections
- Queues: https://docs.bullmq.io/guide/queues
- Workers: https://docs.bullmq.io/guide/workers
- Jobs: https://docs.bullmq.io/guide/jobs
- Delayed jobs: https://docs.bullmq.io/guide/jobs/delayed
- Deduplication: https://docs.bullmq.io/guide/jobs/deduplication
- Retrying failing jobs: https://docs.bullmq.io/guide/retrying-failing-jobs
- Job schedulers: https://docs.bullmq.io/guide/job-schedulers
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
- Redis Cluster pattern: https://docs.bullmq.io/bull/patterns/redis-cluster
- Sandboxed processors: https://docs.bullmq.io/guide/workers/sandboxed-processors
- Concurrency: https://docs.bullmq.io/guide/workers/concurrency
- Stalled jobs: https://docs.bullmq.io/guide/workers/stalled-jobs
- Graceful shutdown: https://docs.bullmq.io/guide/workers/graceful-shutdown
- Going to production: https://docs.bullmq.io/guide/going-to-production
- NestJS: https://docs.bullmq.io/guide/nestjs
- Bull → BullMQ migration: https://docs.bullmq.io/guide/migration-to-newer-versions/bull-to-bullmq
- Architecture: https://docs.bullmq.io/guide/architecture
- Patterns (stop retrying): https://docs.bullmq.io/patterns/stop-retrying-jobs
- Patterns (step / DelayedError): https://docs.bullmq.io/patterns/process-step-jobs
- BullMQ Pro: https://docs.bullmq.io/bullmq-pro
- Docs sitemap / full corpus: https://docs.bullmq.io/sitemap.md · https://docs.bullmq.io/llms-full.txt
## API Reference

- API home (v5.80.9 at snapshot): https://api.docs.bullmq.io/
- Worker: https://api.docs.bullmq.io/classes/v5.Worker.html
- WorkerOptions: https://api.docs.bullmq.io/interfaces/v5.WorkerOptions.html

## Product and Packages

- Product site: https://bullmq.io/
- npm: https://www.npmjs.com/package/bullmq
- GitHub: https://github.com/taskforcesh/bullmq
- NestJS package: https://www.npmjs.com/package/@nestjs/bullmq

## Polyglot Note

BullMQ also ships Python, Rust, Elixir, and PHP clients that can share Redis queues with Node producers/consumers. This skill's procedural guidance targets **Node.js/TypeScript OSS**. For other languages, refresh language-specific docs; do not invent API parity from Node examples.

## Refresh Triggers

Refresh the relevant official pages and package metadata when:

- The user asks for latest/current behavior, a migration, or an upgrade.
- The installed `bullmq` major/minor differs from `5.x`, or the patch drifts far from `5.80.x`.
- The task touches Redis client adapters, dedupe modes, flows failure options, job schedulers, rate-limit APIs, Nest wrappers, Pro features, sandboxed/worker-thread processors, or production Redis settings.
- Observed runtime or TypeScript declarations disagree with this skill text — prefer lockfile + current docs + Redis evidence.
