---
name: tsdown
description: "Build, review, debug, configure, migrate, teach, or plan tsdown library bundling with current docs and a full usage guide. Use for tsdown, tsdown.config, defineConfig, entry, format esm/cjs, dts, deps.neverBundle/alwaysBundle, exports, unbundle, watch, minify, target, platform, copy, CSS (@tsdown/css), plugins, workspace, programmatic build(), and tsup to tsdown migration."
---

# tsdown

Use this skill when work touches tsdown: library builds, `tsdown.config`, dts/exports, dependency externalization, watch/unbundle, CSS/plugins/workspace, or migrating from tsup.

## Workflow

1. Inspect the local tsdown surface:
   - Package version (`tsdown@0.22.x` preferred; snapshot **0.22.14**). Node to **run** the tool: `^22.18.0 || >=24.11.0`.
   - Config: `tsdown.config.ts` / `package.json#tsdown`; peers (`typescript`, `@tsdown/css`, `publint`, …).
   - `package.json` `type`, `exports`, `types`, `engines.node` (feeds target/dts auto-detect).
   - Whether migrating from tsup (`external`, `entryPoints`, `bundle: false`, …).
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift (especially **0.23 beta**). Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Config/CLI/defaults: [config-cli.md](references/config-cli.md).
   - dts, package exports, deps: [dts-exports-deps.md](references/dts-exports-deps.md).
   - Plugins, CSS, copy, workspace, programmatic: [plugins-css-workspace.md](references/plugins-css-workspace.md).
   - tsup migration: [migrate-from-tsup.md](references/migrate-from-tsup.md).
5. Prefer current APIs: `entry`, `deps.neverBundle` / `alwaysBundle`, `unbundle`, `copy`, `cjsDefault`. Treat CJS as maintenance; prefer ESM-only for new libraries.
6. Verify with `bunx tsdown` (or project `build`), check `dist` + `exports`/types, then consume the package from a smoke import.

## Core Judgment

- tsdown = **library bundler** on **Rolldown + Oxc** — spiritual successor to tsup, not an app bundler.
- Defaults differ from tsup: **`format: 'esm'`**, **`clean: true`**, dts often **auto** from `package.json` types/exports, target from **`engines.node`**.
- Prefer **`deps.neverBundle` / `alwaysBundle`** over deprecated `external` / `noExternal`.
- Default dep policy: package **dependencies/peers** are externalized; used **devDependencies** may be bundled — override with `deps` when wrong.
- Install **`typescript`** for dts (unless oxc fast path via `isolatedDeclarations`).
- `@tsdown/css` / `@tsdown/exe` must **match** the `tsdown` version when used.
- No stub mode — use `--watch` and/or `exports.devExports`.
- Code splitting is always on — no `splitting: false`.
- Pin skill guidance to **0.22.14** unless the project is on 0.23 beta; clear deprecations on 0.22 before jumping to 0.23.
- Prefer **`bun` / `bunx`** in command examples.

## Verification

Prefer repository-owned commands. For meaningful tsdown work, cover the relevant subset:

- `bunx tsdown --version` and confirm Node engine for the CLI.
- Clean build: `bunx tsdown` / `bun run build`; inspect `dist` formats and extensions (`.mjs`/`.cjs`/`.js`).
- Types: consume `.d.ts` / `exports.types` from a dependent package or `tsc`.
- Dual-format: require + import smoke when `format` includes both.
- After `exports: true`: validate `package.json` with publint/attw if enabled.
- Migration: zero deprecation warnings on 0.22 before upgrading to 0.23+.

Report which checks ran, which did not, and any version assumptions that remain.
