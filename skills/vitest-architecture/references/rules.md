# Rules and anti-patterns (Vitest core)

## MUST

1. Use Vitest as the test runner — import from `vitest` (or `@effect/vitest` when that overlay applies).
2. Keep Vitest config **per workspace** with named `unit` / `integration` projects.
3. Put tests under `tests/unit` and `tests/integration` by default.
4. Keep the default `test` script on **unit only**.
5. Enable **`passWithNoTests`** for orchestrated monorepo runs.
6. Keep unit tests free of required Docker / paid third parties.
7. Give integration tests realistic timeouts when they touch real infra.
8. Name test files by aspect; let the folder carry the package/feature noun.

## MUST NOT

1. Use `bun:test` / `bun test` as the monorepo runner when Vitest is the house style.
2. Assume a monorepo-root Vitest config lists every package’s projects.
3. Put paid provider calls or live production APIs in unit tests.
4. Treat “integration” as only Docker — host DB URLs and live `skipIf` harnesses are valid integration styles (see overlays).
5. Colocate `*.test.ts` under `src/` as the **default** layout (UI packages may opt in via overlay).

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

## Conflict with local docs

If `AGENTS.md` / CONTRIBUTING defines a different test layout, follow the repo unless the user asks to migrate.
