---
name: vitest-architecture
description: >-
  Enforce portable Vitest house style in apps/packages: per-workspace unit +
  integration projects, tests/ layout, scripts, passWithNoTests, fixtures/setup,
  unit vs integration boundaries, and a high-signal test policy (integration
  over unit when that setup exists, never add new setups unasked, no post-hoc
  unit tests, failure modes first). Use when scaffolding tests, reviewing test
  layout, adding Vitest to a package, or when the user asks for
  vitest-architecture. Optional with-* overlays for testcontainers, Effect
  testing, Elysia Eden treaty, React happy-dom, typecheck projects, Storybook
  browser, live harnesses, and coverage. Not a Vitest API docs skill.
disable-model-invocation: true
---

# Vitest Architecture

Portable testing house style for Vitest 5 in monorepos (and single packages).
Use this skill alone — it does not depend on other skills.

**Job:** where tests live, how projects/scripts are split, unit vs integration,
and which tests are worth writing at all ([test-signal.md](references/test-signal.md)).

**Not this skill:** Vitest API details, mocks, snapshots, or latest docs. Prefer
current Vitest documentation for those.

If the target repo already documents testing (e.g. `AGENTS.md`) and it
conflicts, **repo wins** unless the user asks to migrate toward this skill.

## Stack defaults (core)

| Piece | Default |
| --- | --- |
| Runner | Vitest 5 — never Bun’s `bun test` / `bun:test` |
| Config | **Per workspace** `vitest.config.ts` + unit/integration projects (not a monorepo-root Vitest workspace) |
| Layout | `tests/unit/**`, `tests/integration/**` (integration only when that setup exists) |
| Default gate | Unit only locally (`test` / `test:watch`); CI also runs `test:integration` when it exists |
| Empty packages | `passWithNoTests` so Turbo/CI stays green |

## Modes

1. **Scaffold** — add Vitest to a package from [checklist.md](references/checklist.md) + [tree.md](references/tree.md). Add the `integration` project only when the package already has real-dependency tests or the user asks for it.
2. **Apply** — place new tests in the right project and folder. Prefer the existing highest-level setup; see [test-signal.md](references/test-signal.md).
3. **Review** — compare to [rules.md](references/rules.md) and [test-signal.md](references/test-signal.md); propose moves and flag low-signal unit tests.

## Hard rules (core)

1. **`import { … } from "vitest"`** (or `@effect/vitest` when that overlay applies). Never `bun:test`.
2. **Per package/app owns its Vitest configs** — `vitest.config.ts` lists projects; do not assume a root aggregator config.
3. **Two projects when both setups exist:** `unit` and `integration`, selected via `--project`. Never add an integration setup (Testcontainers, test DB, compose stack) or a browser setup on your own — suggest it and wait for approval.
4. **Default local gate = unit.** Integration is a separate script (`test:integration`). CI must run it when it exists, because it carries the main signal.
5. **Tests live under `tests/`** (not colocated under every `src/` file). Name by aspect (`status.test.ts`), not `package-status.test.ts`.
6. **Unit = fast and high-signal** — pure logic and in-memory; no required Docker. Never write unit tests after the code. Write the failure-mode list first, then one test per listed failure, then the code. No mock-the-world tests that only check calls.
7. **Integration = real deps allowed** — longer timeouts; often `fileParallelism: false` when sharing containers/DB.
8. **`passWithNoTests`** on run scripts (and usually in `defineConfig`) so empty workspaces do not fail orchestration.
9. Align **`vitest` and `@vitest/*`** on the same version (catalog pin when the monorepo uses a catalog).

Details: [rules.md](references/rules.md), [tree.md](references/tree.md), [examples.md](references/examples.md).

## Progressive disclosure

| Need | Read |
| --- | --- |
| Canonical trees | [references/tree.md](references/tree.md) |
| Rules + anti-patterns | [references/rules.md](references/rules.md) |
| Which tests to write, delete, or move | [references/test-signal.md](references/test-signal.md) |
| Scaffold / review checklists | [references/checklist.md](references/checklist.md) |
| Good vs bad layouts | [references/examples.md](references/examples.md) |
| Optional overlays | [Extensions](#extensions) below |

## Extensions

Load **only** when the matching stack is present (or the user asks). Never load an overlay to introduce its stack on your own:

| When | Extension |
| --- | --- |
| Testcontainers / Docker in integration | [with-testcontainers.md](references/with-testcontainers.md) |
| `@effect/vitest` / Layers in tests | [with-effect-testing.md](references/with-effect-testing.md) |
| Elysia Eden `treaty(app)` | [with-elysia-eden.md](references/with-elysia-eden.md) |
| React + happy-dom / Testing Library | [with-react-happy-dom.md](references/with-react-happy-dom.md) |
| `*.test-d.ts` type projects | [with-typecheck-project.md](references/with-typecheck-project.md) |
| Storybook + Vitest browser | [with-storybook-browser.md](references/with-storybook-browser.md) |
| Health probe + `skipIf` live tests | [with-live-harness.md](references/with-live-harness.md) |
| Package-local coverage thresholds | [with-coverage.md](references/with-coverage.md) |

## Monorepo note

If Turbo (or similar) orchestrates scripts from the repo root, root `test` /
`test:integration` should call each package’s Vitest scripts — not a single
root Vitest project list. Task graph / `transit` details belong in monorepo
architecture docs for that repo.
