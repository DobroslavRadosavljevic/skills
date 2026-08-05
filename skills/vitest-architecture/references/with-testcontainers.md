# Extension: testcontainers

Load when integration tests start Docker containers via Testcontainers (Redis, Postgres, MinIO, Kafka, ClickHouse, …).

## Stance

Containers belong to **integration**, not unit. Prefer helpers under `tests/setup/` started in `beforeAll` / stopped in `afterAll` — not Vitest `globalSetup` unless the repo already standardizes on it.

## Tree

```text
tests/
  setup/<dep>-container.ts     # start/stop helpers; pin image near compose versions
  integration/**/*.test.ts     # import helper; beforeAll start; afterAll stop
```

## MUST

1. Keep container startup out of the default unit gate.
2. Use longer `testTimeout` / `hookTimeout` and usually `fileParallelism: false`.
3. Tear down containers in `afterAll` (or equivalent) even on failure when possible.
4. Document required Docker daemon for `test:integration`.

## MUST NOT

1. Starting Testcontainers inside unit projects.
2. Hitting unpaid/random public images without pinning tags.

## Checklist

```text
Testcontainers overlay:
- [ ] Helper in tests/setup
- [ ] Integration-only
- [ ] beforeAll/afterAll lifecycle
- [ ] Timeouts + fileParallelism tuned
```
