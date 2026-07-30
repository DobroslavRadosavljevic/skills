---
name: testcontainers
description: "Build, review, debug, configure, migrate, or plan Testcontainers integration tests with real Docker dependencies and current docs. Use for testcontainers (Node/Java/Python/Go/.NET/Rust), GenericContainer, DockerContainer, modules (@testcontainers/*, org.testcontainers, modules/postgres), PostgreSQL MySQL Redis MongoDB Kafka LocalStack Elasticsearch, Wait strategies, Network, Docker Compose, Ryuk, reuse, TESTCONTAINERS_* env vars, Vitest Jest JUnit pytest go test fixtures, CI DinD Colima Podman OrbStack, and Testcontainers Cloud."
---

# Testcontainers

Use this skill when work touches disposable Docker containers for integration tests: databases, brokers, cloud emulators, Compose stacks, wait strategies, Ryuk cleanup, or CI container runtimes.

## Workflow

1. Inspect the local Testcontainers surface before changing code:
   - Language and package versions (`testcontainers`, `@testcontainers/*`, Java `org.testcontainers:*`, Python extras, Go `modules/...`).
   - Container runtime: Docker Desktop, Colima, Podman, OrbStack, Rancher, DinD, or Testcontainers Cloud.
   - Test runner lifecycle: Vitest/Jest global setup, JUnit `@Container`, pytest fixtures, Go `CleanupContainer`.
   - Existing modules vs hand-rolled generic containers; networks; Compose; reuse flags.
2. Refresh current official docs when versions are unclear, the language API differs, or the work touches CI/runtimes/Cloud. Start from [source-map.md](references/source-map.md).
3. Route the work to the focused references:
   - Node/TypeScript core, waits, networks, modules, runners: [node-core.md](references/node-core.md).
   - Java, Python, Go, and other languages: [languages.md](references/languages.md).
   - Cross-language modules catalog: [modules-catalog.md](references/modules-catalog.md).
   - Env vars, CI, runtimes, Ryuk, reuse, security: [ci-runtimes-ops.md](references/ci-runtimes-ops.md).
4. Prefer the project's language and existing module packages. Do not introduce a second language binding.
5. Verify at the narrowest useful boundary (one module + client), then the suite lifecycle.

## Core Judgment

- Prefer **official modules** over `GenericContainer` / `DockerContainer` when a module exists for the dependency.
- Always resolve **runtime host + mapped port** (`getHost()` / `getMappedPort()` / language equivalents). Never hardcode `localhost:5432` or fixed host ports.
- Pin **image tags** (`postgres:16.3`, `redis:7.4`). Avoid floating `latest` in CI.
- Prefer **copy into container** over bind mounts (bind mounts break under DinD/remote Docker).
- Use **networks + aliases** for multi-container DNS. Avoid fixed container names and hostnames.
- Pick wait strategies deliberately: listening ports (default), log message, HTTP, healthcheck, or composite. On Colima/Rancher, pair log/HC waits with listening-port waits.
- Keep Ryuk enabled in CI unless the environment cannot support it; if disabled, ensure another cleanup path.
- Enable **reuse** only on local developer machines (`withReuse` / `TESTCONTAINERS_REUSE_ENABLE`). Do not rely on reuse in CI.
- Reserve Testcontainers for **integration/contract** boundaries. Keep pure unit tests free of Docker.
- Match module majors to core (Node 12.x modules with `testcontainers@12`; Java 2.x `testcontainers-*` artifacts + BOM).
- Throwaway credentials only. Never put production secrets in container env.

## Language defaults

| Language | Core package | Prefer |
| --- | --- | --- |
| Node/TS | `testcontainers` + `@testcontainers/<svc>` | Modules + `await using` / reliable teardown |
| Java | `org.testcontainers:testcontainers` + BOM 2.x | Modules + try-with-resources or JUnit `@Container` |
| Python | `testcontainers[extras]` | Modules + context managers / fixtures |
| Go | `testcontainers-go` + `modules/<svc>` | `testcontainers.Run` + `CleanupContainer(t, …)` |

## Verification

Prefer repository-owned commands. For meaningful Testcontainers work, cover the relevant subset:

- Confirm Docker (or Cloud agent) is reachable before diagnosing test failures.
- Focused integration test: start module → connect with real client → assert one behavior → stop/cleanup.
- Multi-container / network / Compose smoke when those APIs changed.
- Wait-strategy failure modes: assert useful timeout errors, not hung suites.
- CI-shaped run when changing env vars, Ryuk, DinD, socket mounts, or Cloud setup.
- Parallelism check: random ports + no shared mutable container state unless suite-scoped by design.
- Snapshot/restore checks for Postgres modules (do not use database name `postgres` for snapshots).

Report which checks ran, which did not, and any runtime or package-version assumptions that remain.
