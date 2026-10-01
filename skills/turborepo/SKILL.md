---
name: turborepo
description: "Build, review, debug, configure, migrate, teach, or plan Turborepo 2.11 monorepos with current docs and a full usage guide. Use for turbo, create-turbo, turbo.json, turbo.jsonc, tasks dependsOn ^build, inputs outputs, deferred input hashing (jit, dependencyOutputs), task tags and --filter=tag:, envMode strict, remote cache TURBO_TOKEN TURBO_TEAM, local cache eviction (cacheMaxAge, cacheMaxSize), filters --affected, futureFlags, turbo watch, turbo query, turbo prune --production and Docker, package configurations, boundaries, generators, devEngines.packageManager, bun/pnpm/nub/aube workspaces, experimental Rust/Python/Go (Cargo, uv, go.work) toolchains, agentGuidance AGENTS.md block, Next.js Vite Vitest Playwright oxlint oxfmt task graphs, and CI."
---

# Turborepo

Use this skill when work touches Turborepo task orchestration, caching, monorepo structure, filters/affected CI, prune/Docker, watch/dev graphs, or migrations onto `turbo`.

Snapshot: `turbo@2.11.6`, `create-turbo@2.11.6` (2026-10-01). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local Turborepo surface before changing code:
   - Package versions for `turbo` / `create-turbo` (2.x line; snapshot **2.11.6**). Many features below need 2.10+ (deferred hashing, cache eviction) or the 2.11 release (`devEngines.packageManager`, nub/aube, `prune --production` — first shipped in 2.10.1–2.10.3 patches; native Rust/Python/Go need 2.11; task tags need **2.11.6**).
   - Root `turbo.json` / `turbo.jsonc`, package-level `turbo.json`, workspace globs, lockfile, `devEngines.packageManager` / `packageManager`.
   - Root and package `package.json` scripts that turbo invokes.
   - CI remote-cache env (`TURBO_TOKEN`, `TURBO_TEAM`), prune/Docker usage, `--affected` / filters, `futureFlags` in root `turbo.json`.
2. For setup, day-to-day runs, progressive adoption, baselines, and troubleshooting, follow the full guide first: [usage-guide.md](references/usage-guide.md).
3. Refresh current official docs when versions differ from the snapshot or the work touches caching, env hashing, prune, or future flags. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Task graph, `dependsOn`/`with`, inputs/outputs, package configs: [turbo-json-tasks.md](references/turbo-json-tasks.md).
   - `turbo run`, filters, `--affected`, watch, generators: [cli-filtering-watch.md](references/cli-filtering-watch.md).
   - Local/remote cache, eviction, env modes, framework inference: [caching-env-remote.md](references/caching-env-remote.md).
   - CI vendors, prune, Docker: [ci-docker-prune.md](references/ci-docker-prune.md).
   - Internal packages, framework/tool graphs, boundaries, package managers, Rust/Python/Go toolchains, migrations: [packages-integrations.md](references/packages-integrations.md).
5. Preserve the repository's package manager and existing script names unless the user asks to migrate them.
6. Verify with the narrowest useful `bunx turbo run …` (`--dry`, `--filter`, or `--affected`).

## Core Judgment

- Turborepo orchestrates **existing** `package.json` scripts. It is not a package manager and not a replacement for workspaces.
- Prefer `turbo run <tasks>` in CI (not bare `turbo build`) so future CLI subcommands do not collide with task names.
- Declare **`outputs`** for every cacheable build task. Missing outputs → cache hits restore nothing useful.
- Use `"dependsOn": ["^build"]` for dependency builds; `"dependsOn": ["build"]` for same-package ordering. Do not confuse them.
- Default **`envMode` is `strict`**. List hash-affecting vars in `env` / `globalEnv`; use `passThroughEnv` only when values must not bust the cache.
- Never recurse: package scripts must not call `turbo run` for the same task turbo is already running.
- Mark `dev` / watch / servers `"cache": false` and `"persistent": true`. Use `"with"` to co-run related persistent tasks.
- Prefer `--cache=local:…,remote:…` over deprecated `--no-cache` / `--remote-only`.
- Install dependencies **where used** (not root-hoisted) for better cache/prune fidelity.
- Prefer transit nodes (`topo` / `transit`) for parallel typecheck over TypeScript Project References with Turbo.
- Lint/format tools (for example Oxlint and Oxfmt) often fit as root tasks `//#lint` / `//#format`.
- For files written by an upstream task (codegen) or dependency outputs (`.d.ts`), use deferred `inputs` objects (`{ "mode": "jit" }` / `{ "mode": "dependencyOutputs" }`) instead of `cache: false`.
- Declare the package manager with **`devEngines.packageManager`** (2.10.1+, announced with 2.11). Top-level `packageManager` still works but is slated for removal in a future major.
- Changing any `futureFlags` entry busts the global hash (every task misses once). Set them only in the root `turbo.json`.
- Since 2.11.5, when `turbo` detects a coding agent it keeps a managed Turborepo block in the root `AGENTS.md` (default `agentGuidance: true`). Expect that diff; set root `"agentGuidance": false` to opt out.
- Rust (Cargo), Python (uv), and Go (`go.work`) workspaces are **experimental** future flags — do not enable them in production CI unless the user asks.

## Verification

Prefer repository-owned commands. For meaningful Turborepo work, cover the relevant subset:

- `bunx turbo run <task> --dry=json` or `--graph` to validate the DAG before expensive runs.
- Focused `bunx turbo run <task> --filter=<pkg>` then widen to `--affected` when CI-shaped.
- Cache correctness: change an input/env → expect miss; unchanged → expect hit (`--summarize` if hashing is unclear).
- Remote cache smoke when changing `TURBO_*` or `remoteCache` config.
- Prune/Docker: `turbo prune <app> --docker` then install+build from `out/` when changing deploy graphs.
- Watch/dev: confirm `interruptible` / `with` / `persistent` behavior for long-running tasks.

Report which checks ran, which did not, and any turbo-version or remote-cache assumptions that remain.
