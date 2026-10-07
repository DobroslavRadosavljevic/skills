# Rules and anti-patterns (Vitest core)

## MUST

1. Use Vitest as the test runner — import from `vitest` (or `@effect/vitest` when that overlay applies).
2. Keep Vitest config **per workspace** with named `unit` / `integration` projects (integration only when that setup exists).
3. Put tests under `tests/unit` and `tests/integration` by default.
4. Keep the default `test` script on **unit only**. Run `test:integration` in CI when it exists.
5. Enable **`passWithNoTests`** for orchestrated monorepo runs.
6. Keep unit tests free of required Docker / paid third parties.
7. Give integration tests realistic timeouts when they touch real infra.
8. Name test files by aspect; let the folder carry the package/feature noun.
9. Put new behavior tests in the highest existing setup: E2E, then integration, then unit.
10. Write the failure-mode list before a unit test and before the code. One unit test per listed failure.
11. Every unit test must be able to catch a real bug the existing integration and E2E tests miss. See [test-signal.md](test-signal.md).

## MUST NOT

1. Use `bun:test` / `bun test` as the monorepo runner when Vitest is the house style.
2. Assume a monorepo-root Vitest config lists every package’s projects.
3. Put paid provider calls or live production APIs in unit tests.
4. Treat “integration” as only Docker — host DB URLs and live `skipIf` harnesses are valid integration styles (see overlays).
5. Colocate `*.test.ts` under `src/` as the **default** layout (UI packages may opt in via overlay).
6. Add an integration, browser, or E2E setup that the package lacks without user approval.
7. Write unit tests after the code, or to raise coverage.
8. Weaken assertions, add retries, or add skips to make a test pass.

## Soft defaults

| Topic | Default |
| --- | --- |
| Unit environment | `node` |
| React packages | `happy-dom` + Testing Library setup (overlay) |
| Integration timeouts | `60_000` ms |
| Shared infra | `fileParallelism: false` |
| Container lifecycle | `beforeAll` / `afterAll` helpers in `tests/setup` — not Vitest `globalSetup` unless the repo already uses it |
| Coverage | Package-local only when explicitly wanted (overlay) |

## Anti-patterns → fix

| Smell | Fix |
| --- | --- |
| One mega `vitest.config` at repo root for all apps | Per-package projects; root orchestrates scripts |
| `tests/` mixed unit+integration without projects | Split folders + `--project` |
| Integration in the default `test` script | Move to `test:integration` |
| `billing-service.test.ts` under package `billing` | `tests/unit/service.test.ts` or `services.test.ts` |
| Docker required for every `bun run test` | Keep containers in integration only |
| Unit test mocks every collaborator and asserts calls | Delete it, or move the behavior to an existing integration test |
| Unit test duplicates a path an integration test already covers | Delete the unit test |
| Big snapshot nobody reads | Assert the few values that matter, or delete |
| New package scaffolded with Testcontainers nobody asked for | Remove it; scaffold `unit` only and suggest integration |

## Conflict with local docs

If `AGENTS.md` / CONTRIBUTING defines a different test layout, follow the repo unless the user asks to migrate.
