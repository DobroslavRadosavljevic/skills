---
name: tsdown
description: "Build, review, debug, configure, migrate, teach, or plan tsdown 0.23 library bundling with current docs and a full usage guide. Use for tsdown, tsdown.config, defineConfig, entry, format esm/cjs, dts and dts.generator (oxc/tsc/tsgo), deps.neverBundle/alwaysBundle/onlyBundle/onlyImport, exports, unbundle, watch, minify, target, platform, copy, CSS (@tsdown/css), publint/attw, report, plugins, workspace, programmatic build() handle, tsdown 0.22 to 0.23 upgrades, and tsup to tsdown migration."
---

# tsdown

Use this skill when work touches tsdown: library builds, `tsdown.config`, dts/exports, dependency externalization, watch/unbundle, CSS/plugins/workspace, upgrading 0.22 → 0.23, or migrating from tsup.

Snapshot: `tsdown@0.23.0` (2026-10-01). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local tsdown surface:
   - Package version (`tsdown@0.23.x` preferred; snapshot **0.23.0**). Node to **run** the tool: `^22.18.0 || ^24.11.0 || >=26.0.0` (Node 25 dropped in 0.23).
   - Config: `tsdown.config.ts` / `package.json#tsdown`; peers (`typescript`, `@tsdown/css`, `publint`, …).
   - `package.json` `type`, `exports`, `types`, `engines.node` (feeds target/dts auto-detect).
   - Whether migrating from tsup (`external`, `entryPoints`, `bundle: false`, …).
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Config/CLI/defaults: [config-cli.md](references/config-cli.md).
   - dts, package exports, deps: [dts-exports-deps.md](references/dts-exports-deps.md).
   - Plugins, CSS, copy, workspace, programmatic: [plugins-css-workspace.md](references/plugins-css-workspace.md).
   - tsup migration and 0.22 → 0.23 upgrade: [migrate-from-tsup.md](references/migrate-from-tsup.md).
5. Prefer current APIs: `entry`, `deps.neverBundle` / `alwaysBundle` / `onlyBundle`, `unbundle`, `copy`, `cjsDefault`, `dts.generator`. Treat CJS as maintenance; prefer ESM-only for new libraries.
6. Verify with `bunx tsdown` (or project `build`), check `dist` + `exports`/types, then consume the package from a smoke import.

## Core Judgment

- tsdown = **library bundler** on **Rolldown + Oxc** — spiritual successor to tsup, not an app bundler.
- Defaults differ from tsup: **`format: 'esm'`**, **`clean: true`**, dts often **auto** from `package.json` types/exports, target from **`engines.node`**.
- Prefer **`deps.neverBundle` / `alwaysBundle`** over deprecated `external` / `noExternal` (still accepted in 0.23; setting both forms throws).
- 0.23 **removed** the tsup-compat options (`bundle`, `outExtension`, `publicDir`, `removeNodeProtocol`, `injectStyle`, `inlineOnly`, `skipNodeModulesBundle`, `deps.onlyAllowBundle`, `dts.cjsReexport`); they fail typecheck and are ignored at runtime.
- Default dep policy: package **dependencies/peers** are externalized; used **devDependencies** may be bundled — override with `deps` when wrong.
- Install **`typescript`** for dts. Pick the generator only with **`dts.generator: 'oxc' | 'tsc' | 'tsgo'`** (omitted → `oxc` when `isolatedDeclarations`, `tsgo` when TypeScript 7 is installed, else `tsc`). `dts.oxc: true` / `dts.tsgo: true` no longer select a generator.
- `deps.resolveDepSubpath` defaults to **`false`** in 0.23 — external subpaths stay as written.
- `build()` returns a handle: `const { bundles, watch } = await build(...)`.
- `@tsdown/css` / `@tsdown/exe` must **match** the `tsdown` version when used.
- No stub mode — use `--watch` and/or `exports.devExports`.
- Code splitting is always on — no `splitting: false`.
- Upgrading from 0.22 or tsup: build once on **0.22.14** with zero deprecation warnings, then move to **0.23** (`tsdown-migrate` pins 0.22.14 for that first stage).
- Prefer **`bun` / `bunx`** in command examples.

## Verification

Prefer repository-owned commands. For meaningful tsdown work, cover the relevant subset:

- `bunx tsdown --version` and confirm Node engine for the CLI.
- Clean build: `bunx tsdown` / `bun run build`; inspect `dist` formats and extensions (`.mjs`/`.cjs`/`.js`).
- Types: consume `.d.ts` / `exports.types` from a dependent package or `tsc`.
- Dual-format: require + import smoke when `format` includes both.
- After `exports: true`: validate `package.json` with publint/attw if enabled.
- Migration: zero deprecation warnings on 0.22.14 before upgrading to 0.23; after upgrading, no removed options remain and `attw` still passes (default profile is now `esm-only`).

Report which checks ran, which did not, and any version assumptions that remain.
