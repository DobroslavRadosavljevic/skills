---
name: vitest
description: "Build, review, debug, configure, migrate, teach, or plan Vitest testing with current docs and a full usage guide. Use for vitest, vitest.config, defineConfig from vitest/config, describe/it/test/expect, vi mocks, snapshots, coverage (@vitest/coverage-v8), browser mode (@vitest/browser-playwright), projects, pools/maxWorkers, reporters, UI, bench, typecheck, and Jest or Vitest 3 to Vitest 4 migration."
---

# Vitest

Use this skill when work touches Vitest: writing/running tests, config, mocks/snapshots, coverage, browser mode, projects/pools, reporters, or migrating from Jest / Vitest 3.

## Workflow

1. Inspect the local Vitest surface:
   - Package versions: `vitest` and aligned `@vitest/*` (snapshot **4.1.10**). Node `^20 || ^22 || >=24`. Vite peer `^6 || ^7 || ^8`.
   - Config: dedicated `vitest.config.*` (overrides `vite.config` entirely) vs `test: {}` inside Vite config.
   - Scripts: prefer `vitest run` for CI; do **not** use `bun test` (Bun’s runner) when the project uses Vitest — use `bun run test` / `bunx vitest`.
   - Environment: `node` (default) vs `jsdom` / `happy-dom` vs Browser Mode projects.
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task is browser/coverage/migration. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Config, CLI, test API, environments, setup: [config-cli-api.md](references/config-cli-api.md).
   - `vi` mocks, timers, env stubs, snapshots: [mocking-snapshots.md](references/mocking-snapshots.md).
   - Coverage, browser mode, projects, pools, reporters: [coverage-browser-projects.md](references/coverage-browser-projects.md).
   - Jest / Vitest 3 → 4: [migration.md](references/migration.md).
5. Prefer Vitest **4.x** APIs (`projects`, `maxWorkers`, browser provider factories). Keep `@vitest/*` packages on the **same version** as `vitest`.
6. Verify with the narrowest useful command (`vitest run path -t "name"`, coverage, or browser project).

## Core Judgment

- Vitest is a **Vite-powered** test runner with a Jest-compatible API — not Bun’s built-in `bun test`.
- CI / hooks: always **`vitest run`** (or `--run`). Plain `vitest` watches and hangs non-interactively unless CI/non-TTY forces run.
- Import from `vitest` unless `globals: true`. Prefer explicit imports for agent clarity.
- `vi.mock` / `vi.hoisted` are **hoisted** — factories cannot close over non-hoisted locals.
- Concurrent tests + snapshots/asserts: use **context** `expect` from the test callback, not global `expect`.
- Default pool is **`forks`**. Prefer it over `threads` when native addons misbehave.
- A dedicated `vitest.config.*` **ignores** `vite.config` options — use `mergeConfig` when extending Vite plugins/aliases.
- Coverage is root-only in projects; set `coverage.include` explicitly (v4 no longer has `coverage.all`).
- Browser Mode is **not** `environment: 'jsdom'` — use `browser.enabled` + provider packages.
- Vite transforms tests but does **not** typecheck — use optional `typecheck` or project `tsc` separately.

## Verification

Prefer repository-owned commands. For meaningful Vitest work, cover the relevant subset:

- `bunx vitest --version` and confirm `@vitest/*` version alignment.
- Focused `vitest run <file> -t "<name>"` (or `:line` filter).
- Snapshot updates only with deliberate `-u` / watch `u`; review diffs.
- Coverage: `vitest run --coverage` when thresholds or reports matter.
- Browser project: headless chromium smoke when UI/component tests change.
- Migration: no remaining `workspace`, string browser providers, `poolOptions`, or `test(name, fn, options)`.

Report which checks ran, which did not, and any Vitest version assumptions that remain.
