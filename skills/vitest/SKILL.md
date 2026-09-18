---
name: vitest
description: "Build, review, debug, configure, migrate, teach, or plan Vitest testing with current docs and a full usage guide. Use for vitest 5, vitest.config, defineConfig from vitest/config, describe/it/test/expect, vi mocks, vi.when, snapshots, coverage (@vitest/coverage-v8), browser mode (@vitest/browser-playwright), projects, pools/maxWorkers, reporters, UI, bench fixture, typecheck, vitest doctor, fsModuleCache, and Jest / Vitest 3→4 / 4→5 migration."
---

# Vitest

Use this skill when work touches Vitest: writing/running tests, config, mocks/snapshots, coverage, browser mode, projects/pools, reporters, or migrating from Jest / Vitest 3 / Vitest 4.

Snapshot: `vitest@5.0.1` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local Vitest surface:
   - Package versions: `vitest` and aligned `@vitest/*` (snapshot **5.0.1**). Node `^22.12 || ^24 || >=26`. Vite peer `^6.4 || ^7 || ^8` (required; Yarn must list `vite` explicitly).
   - Config: dedicated `vitest.config.*` (overrides `vite.config` entirely) vs `test: {}` inside Vite config. Config is **not** looked up from parent directories.
   - Scripts: prefer `vitest run` for CI; do **not** use `bun test` (Bun’s runner) when the project uses Vitest — use `bun run test` / `bunx vitest`.
   - Environment: `node` (default) vs `jsdom` / `happy-dom` vs Browser Mode projects.
   - Artifacts: `.vitest/` at the project root (gitignore it).
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task is browser/coverage/migration. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Config, CLI, test API, environments, setup: [config-cli-api.md](references/config-cli-api.md).
   - `vi` mocks, `vi.when`, timers, env stubs, snapshots: [mocking-snapshots.md](references/mocking-snapshots.md).
   - Coverage, browser mode, projects, pools, reporters, bench: [coverage-browser-projects.md](references/coverage-browser-projects.md).
   - Jest / Vitest 3 → 4 / 4 → 5: [migration.md](references/migration.md).
5. Prefer Vitest **5.x** APIs (`projects` with default `extends: true`, `maxWorkers`, browser provider factories, `bench` as a test-context fixture, `vi.when`). Keep `@vitest/*` packages on the **same version** as `vitest`.
6. Verify with the narrowest useful command (`vitest run path -t "name"`, coverage, or browser project). Use `vitest doctor` only when tuning pool/isolate/cache.

## Core Judgment

- Vitest is a **Vite-powered** test runner with a Jest-compatible API — not Bun’s built-in `bun test`.
- CI / hooks: always **`vitest run`** (or `--run`). Plain `vitest` watches and hangs non-interactively unless CI/non-TTY forces run.
- Import from `vitest` unless `globals: true`. Prefer explicit imports for agent clarity.
- `vi.mock` / `vi.unmock` / `vi.hoisted` are **hoisted** and **must be top-level** — nested calls throw. Factories cannot close over non-hoisted locals.
- `clearMocks` defaults to **`true`** (call history cleared before each test; implementations stay). Concurrent tests that share mocks may need `clearMocks: false`.
- Concurrent tests + snapshots/asserts: use **context** `expect` from the test callback, not global `expect`.
- Always **`await`** `resolves` / `rejects` / `toMatchFileSnapshot` / `expect.poll` — unawaited async assertions **fail** the test.
- Default pool is **`forks`**. Prefer it over `threads` when native addons misbehave.
- A dedicated `vitest.config.*` **ignores** `vite.config` options — use `mergeConfig` when extending Vite plugins/aliases.
- Inline `test.projects` **inherit the root config** (`extends: true` default) and may **share the Vite server**. File/dir projects do not inherit.
- Coverage is root-only in projects; set `coverage.include` explicitly. Patterns match paths **relative to the project root** (no `contains`).
- Browser Mode is **not** `environment: 'jsdom'` — use `browser.enabled` + provider packages. Locators are **exact** by default.
- `bench` is **not** a top-level import — use the `{ bench }` fixture inside `*.bench.*` files.
- Vite transforms tests but does **not** typecheck — use optional `typecheck` or project `tsc` separately.

## Verification

Prefer repository-owned commands. For meaningful Vitest work, cover the relevant subset:

- `bunx vitest --version` and confirm `@vitest/*` version alignment.
- Focused `vitest run <file> -t "<name>"` (or `:line` filter). Full names use ` > ` (`-t 'suite > test'`).
- Snapshot updates only with deliberate `-u` / watch `u`; review diffs.
- Coverage: `vitest run --coverage` when thresholds or reports matter.
- Browser project: headless chromium smoke when UI/component tests change.
- Migration: no remaining `workspace`, string browser providers, `poolOptions`, `test(name, fn, options)`, nested `vi.mock`, top-level `bench` import, `test.sequential`, or `browser.api`.

Report which checks ran, which did not, and any Vitest version assumptions that remain.
