---
name: bun
description: "Build, review, debug, configure, migrate, teach, or plan Bun JavaScript/TypeScript work with current docs and a full usage guide. Use for bun runtime, bun install/add/remove/update/ci, bun.lock, workspaces catalogs overrides, trustedDependencies, bunx, Bun.serve, bun:sqlite, Bun.redis, Bun.SQL, Bun.file, Bun.$, bun test, bun build --compile, bunfig.toml, Node.js compatibility, --hot/--watch, and npm/pnpm/yarn migration to Bun."
---

# Bun

Use this skill when work touches the Bun runtime, package manager, test runner, bundler, `bunfig.toml`, Node compatibility, or migrating installs/scripts to Bun.

## Workflow

1. Inspect the local Bun surface:
   - `bun --version` / `bun --revision` (stable line is **1.3.x**; prefer upgrading toward current stable when APIs matter).
   - Lockfile: `bun.lock` (text, default since 1.2) vs legacy `bun.lockb`.
   - `package.json` scripts, workspaces, catalogs, overrides, `trustedDependencies`.
   - `bunfig.toml` (project + optional global), `.npmrc`, `@types/bun` / `tsconfig` `"types": ["bun"]`.
   - Whether code uses Bun-native APIs (`Bun.serve`, `bun:sqlite`, …) or Node APIs (`node:*`).
2. For day-to-day how-to, progressive adoption, and troubleshooting, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task touches Redis/SQL/HTTP3/FFI or lockfile/linker defaults. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Runtime APIs, HTTP, files, shell, SQLite/Redis/S3/SQL: [runtime-apis.md](references/runtime-apis.md).
   - Install, lockfile, workspaces, trust, bunx, CI: [package-manager.md](references/package-manager.md).
   - `bun test`, `bun build`, `--compile`, init/create: [test-bundler-build.md](references/test-bundler-build.md).
   - Node compat, globals, watch/hot, bunfig overview: [node-compat-config.md](references/node-compat-config.md).
5. Prefer Bun-native APIs and `bun` / `bunx` commands for greenfield Bun projects. Keep Node APIs when the codebase is already Node-shaped and works.
6. Verify with the narrowest useful `bun` command (`bun test`, `bun run`, `bun ci`, or a focused `Bun.serve` smoke).

## Core Judgment

- Bun is **runtime + package manager + test runner + bundler** in one binary — not “just a faster Node”.
- Prefer **`bun` / `bunx`** over `npm` / `npx` / `yarn` / `pnpm` in commands for Bun projects.
- Commit **`bun.lock`**. CI install: `bun ci` (frozen lockfile).
- Dependency lifecycle scripts are **blocked by default** unless trusted — check `bun pm untrusted` after adding native packages (`sharp`, etc.).
- New workspace lockfiles often default to **isolated** linker; legacy migrations may stay **hoisted** via `configVersion`.
- Prefer `Bun.serve` for new HTTP services; know the default **10s idle timeout** (SSE needs `server.timeout(req, 0)`).
- Prefer `bun:sqlite` / `Bun.SQL` / `Bun.redis` over heavier Node clients when writing Bun-first code.
- `bun --watch` hard-restarts; `bun --hot` soft-reloads (`globalThis` persists) — good for servers.
- Bun flags go **before** `run`: `bun --watch run dev`, not `bun run dev --watch`.
- `Bun.env` is a launch snapshot; prefer `process.env` when values change at runtime.
- `bun build` does **not** typecheck or emit `.d.ts` — run `tsc` when types matter.
- `bun:ffi` and several features (HTTP/3, Redis pub/sub, Workers terminate) are experimental — prefer Node-API natives for production FFI.

## Verification

Prefer repository-owned commands. For meaningful Bun work, cover the relevant subset:

- `bun --version` and confirm lockfile / linker expectations.
- Focused `bun test` (path or `-t` pattern); coverage / junit when CI cares.
- `bun ci` or `bun install --frozen-lockfile` after lockfile edits.
- Smoke `bun run <entry>` or `Bun.serve` with `port: 0` + `fetch`.
- After native deps: `bun pm untrusted` / trust as needed.
- After `bun build` / `--compile`: run the output on the target platform.
- Node-compat migrations: run the same suite under Bun and note partial modules.

Report which checks ran, which did not, and any Bun version assumptions that remain.
