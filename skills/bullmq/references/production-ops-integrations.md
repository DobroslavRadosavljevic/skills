# Production, Ops, Testing, NestJS, and Pro vs OSS

## Production Redis

From BullMQ going-to-production guidance:

- Enable persistence (recommend AOF; ~1s fsync is typical). Benchmark the impact.
- Set `maxmemory-policy` to **`noeviction`**. Cache-style eviction corrupts queues. On ElastiCache, use a custom parameter group.
- Recommended Redis **≥ 6.2.0** (code minimum lower; prefer the recommended floor).
- Plan memory for job payloads + retention (`removeOnComplete` / `removeOnFail`).
- Configure client reconnect behavior deliberately: Workers should wait/retry (`maxRetriesPerRequest: null`); HTTP-facing Queues should fail fast (low retries, often `enableOfflineQueue: false`).
- Redis Cluster / MemoryDB: BullMQ multi-key Lua needs **hash tags** — `prefix: '{tenantA}'` or braced queue names. Different tags per queue to spread slots.
- Dragonfly / Valkey: runtime may accept them; follow current Redis™ compatibility docs (Dragonfly has a dedicated page; Valkey may not). Prefer documented setups over assumptions.
- Never set ioredis `keyPrefix`.

## Process Topology

- Run workers as long-lived processes (or containers), separate from request/API processes when scale and blast radius matter.
- Do not use serverless request handlers as long-running Workers unless the platform explicitly supports the worker lifetime and Redis connection model.
- Scale horizontally by adding Worker processes/machines; tune `concurrency` per process for I/O.

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

## Observability

- Attach Worker and QueueEvents listeners for `completed`, `failed`, `progress`, `stalled`, `deduplicated`, `error`.
- Built-in metrics: Worker `metrics: { maxDataPoints }` (same setting on all workers for a queue); `queue.getMetrics(...)`; optional Prometheus export — confirm current API in docs/types.
- OpenTelemetry: community/official `bullmq-otel` (or current documented telemetry package) when the app already uses OTel.
- Optional UIs (Bull Board, Taskforce) help operators; they are not a substitute for alerts on failed/stalled growth and Redis memory. Put admin UIs behind auth — they expose job payloads.

## Security

- Job `data` is stored **plaintext** in Redis. Prefer not storing secrets; otherwise encrypt sensitive fields before `add`.
- Production Redis: ACL/password, TLS, private network.
- Sandboxed processors isolate crashes/CPU — not a security sandbox for arbitrary untrusted code.

## Testing

- Prefer real Redis (Docker/testcontainers), not mocks pretending to be BullMQ.
- Unique queue names or `prefix` per test run to avoid cross-talk.
- `await worker.waitUntilReady()` / `queueEvents.waitUntilReady()` before adding jobs or asserting.
- Turn retries down in unit tests unless testing retry behavior.
- Always `close()` workers, queues, events, and flow producers in `after` hooks.
- Test processors in isolation; use Redis for state-transition integration tests.
- For schedulers/delays, use short intervals and assert upsert idempotency across “redeploy” double-calls.

## NestJS (`@nestjs/bullmq`)

Prefer `@nestjs/bullmq` over legacy `@nestjs/bull`.

```typescript
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { Processor, WorkerHost, OnWorkerEvent, InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';

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

Inject queues with Nest's `@InjectQueue('email')` patterns from current Nest BullMQ docs. Keep processors as Nest providers. Path-based sandboxed Nest processors have **no Nest DI**. Core BullMQ judgment still applies inside Nest wrappers.

## Bull vs BullMQ

BullMQ is the modern Redis queue line (TypeScript, flows, richer APIs). Migrating from Bull (`bull` package) is not a rename — safest pattern is new queue names or different `prefix`, dual-run, switch producers, drain old queues, then retire. Refresh migration notes and replace Nest `@nestjs/bull` with `@nestjs/bullmq` when applicable. Do not mix Bull and BullMQ assumptions in one queue.

## BullMQ Pro vs OSS

OSS covers queues, workers, flows, retries, schedulers, rate limits, dedupe, sandboxes, and multi-language clients.

**Pro-only** (do not recommend unless Pro is installed): group support, group rate limits, batches, observables, and other Pro comparison-table features.

When reviewing code that imports Pro APIs in an OSS-only lockfile, flag it as blocked.

## Polyglot

Node producers can feed Python/Rust/Elixir/PHP consumers on the same Redis queues when versions and key prefixes align. Refresh language-specific docs for client APIs; this skill does not claim feature parity across languages.

## Review Checklist

- Redis `noeviction` + persistence called out for production; Cluster hash tags when needed.
- Worker `maxRetriesPerRequest: null` (ioredis) respected; no ioredis `keyPrefix`.
- `error` listeners present; graceful `close` on SIGTERM; grace ≥ job duration.
- Retention policies set; prefixes isolate environments/tenants.
- No `QueueScheduler` / removed groupKey rate-limit patterns on 5.x.
- No accidental Pro APIs in OSS projects.
- Nest uses `@nestjs/bullmq` when Nest is present.
- Processors idempotent; special errors used correctly; job data not storing cleartext secrets.
