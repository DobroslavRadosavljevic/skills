---
name: bun
description: "Build, review, debug, configure, migrate, teach, or plan Bun JavaScript/TypeScript work with current docs and a full usage guide. Use for bun 1.4 runtime, bun install/add/remove/update/ci/audit/dedupe/prune, bun.lock, isolated linker and globalStore, workspaces catalogs overrides, trustedDependencies, bunx, Bun.serve (HTTP/2), Bun.Image, Bun.WebView, Bun.markdown, Bun.cron, Bun.Terminal, bun:sqlite, Bun.redis, Bun.SQL, Bun.file, Bun.$, bun test --parallel/--isolate/--shard, bun build --compile --bytecode, bunfig.toml, Node.js 26 compatibility, --hot/--watch, and npm/pnpm/yarn migration to Bun."
---

# Bun

Use this skill when work touches the Bun runtime, package manager, test runner, bundler, `bunfig.toml`, Node compatibility, or migrating installs/scripts to Bun.

Snapshot: `bun@1.4.2`, `@types/bun@1.4.2` / `bun-types@1.4.2` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local Bun surface:
   - `bun --version` / `bun --revision` (stable line is **1.4.x**; prefer `bun upgrade` toward **1.4.2** when APIs matter).
   - Lockfile: `bun.lock` (text; `lockfileVersion` 2, or 3 with nested/version-scoped overrides) vs legacy `bun.lockb`.
   - `package.json` scripts, workspaces, catalogs, overrides, `trustedDependencies`, optional `nativeDependencies` / `ignoreScripts` / `selfContained`.
   - `bunfig.toml` (project + optional global), `.npmrc`, `@types/bun`, and TypeScript 6/7 `"types": ["bun"]`.
   - Whether code uses Bun-native APIs (`Bun.serve`, `Bun.Image`, `bun:sqlite`, …) or Node APIs (`node:*`).
2. For day-to-day how-to, progressive adoption, and troubleshooting, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task touches Redis/SQL/HTTP2/HTTP3/FFI, lockfile/linker/`globalStore`, or a 1.3→1.4 upgrade. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Runtime APIs, HTTP, files, shell, Image/WebView/markdown/cron, SQLite/Redis/S3/SQL: [runtime-apis.md](references/runtime-apis.md).
   - Install, lockfile, workspaces, trust, bunx, CI, audit/dedupe/prune: [package-manager.md](references/package-manager.md).
   - `bun test`, `bun build`, `--compile`, init/create: [test-bundler-build.md](references/test-bundler-build.md).
   - Node 26 compat, globals, watch/hot, bunfig, 1.3→1.4 breaking changes: [node-compat-config.md](references/node-compat-config.md).
5. Prefer Bun-native APIs and `bun` / `bunx` commands for greenfield Bun projects. Keep Node APIs when the codebase is already Node-shaped and works.
6. Verify with the narrowest useful `bun` command (`bun test`, `bun run`, `bun ci`, or a focused `Bun.serve` smoke).

## Core Judgment

- Bun is **runtime + package manager + test runner + bundler** in one binary — not “just a faster Node”. 1.4 is a Rust rewrite of that binary with a larger stdlib (Image, WebView, markdown, cron, Terminal, XML/JSON5/JSONL).
- Prefer **`bun` / `bunx`** over `npm` / `npx` / `yarn` / `pnpm` in commands for Bun projects.
- Commit **`bun.lock`**. CI install: `bun ci` (frozen lockfile).
- Dependency lifecycle scripts are **blocked by default** unless trusted — check `bun pm untrusted` after adding native packages (`sharp`, etc.).
- New workspace lockfiles default to **isolated** linker (`configVersion: 1`); legacy lockfiles stay **hoisted**. Global virtual store is **opt-in** (`[install] globalStore = true`) and only applies to isolated.
- Prefer `Bun.serve` for new HTTP services; know the default **10s idle timeout** (SSE needs `server.timeout(req, 0)`). HTTP/2 (`http2: true`) and HTTP/3 (`http3: true`) are **experimental**.
- Prefer `bun:sqlite` / `Bun.SQL` / `Bun.redis` / `Bun.Image` over heavier Node clients when writing Bun-first code.
- `bun --watch` hard-restarts; `bun --hot` soft-reloads (`globalThis` persists) — good for servers.
- Bun flags go **before** `run`: `bun --watch run dev`, not `bun run dev --watch`.
- `Bun.env` is a launch snapshot; prefer `process.env` when values change at runtime.
- `bun build` does **not** typecheck or emit `.d.ts` — run `tsc` when types matter.
- `bun:ffi` is engine-native in 1.4 (`cstring` is a plain string). Prefer Node-API natives for production-critical FFI.
- 1.3→1.4: Bun reports **Node.js 26** (`process.versions.modules` **147**); `bunfig.toml` strings must be quoted. Full list: [node-compat-config.md](references/node-compat-config.md).

## Verification

Prefer repository-owned commands. For meaningful Bun work, cover the relevant subset:

- `bun --version` and confirm lockfile / linker / `globalStore` expectations.
- Focused `bun test` (path or `-t` pattern); `--parallel` / coverage / junit when CI cares.
- `bun ci` or `bun install --frozen-lockfile` after lockfile edits.
- Smoke `bun run <entry>` or `Bun.serve` with `port: 0` + `fetch`.
- After native deps: `bun pm untrusted` / trust as needed.
- After `bun build` / `--compile`: run the output on the target platform.
- Node-compat migrations: run the same suite under Bun and note partial modules.
- After a 1.3→1.4 bump: native addons rebuilt for `NODE_MODULE_VERSION` 147; quoted `bunfig.toml`; no `res.writeHeader()`.

Report which checks ran, which did not, and any Bun version assumptions that remain.
