# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: 2026-10-01
- Package: **`tsdown@0.23.0`** (npm `latest`, published 2026-09-03)
- Other dist-tags (stale vs latest): `rc` → 0.23.0-rc.1, `beta` → 0.23.0-beta.3
- Last 0.22 release: **0.22.14** — the version `tsdown-migrate` installs for the first migration stage
- Engines (0.23.0): Node `^22.18.0 || ^24.11.0 || >=26.0.0` (to **run** tsdown; Node 25 dropped)
- Peers (optional): `typescript` `^5 || ^6 || ^7`, `@tsdown/css` / `@tsdown/exe` **exactly 0.23.0**, `publint` `^0.3.8`, `@arethetypeswrong/core` `^0.18.1`, `unplugin-unused` `>=0.5.0`, `@vitejs/devtools`, `tsx`, `unrun`
- Release notes / migration guide: https://github.com/rolldown/tsdown/releases/tag/v0.23.0
- Homepage: https://tsdown.dev/
- Docs ToC: https://tsdown.dev/llms.txt
- Repo: https://github.com/rolldown/tsdown
- License: MIT (VoidZero Inc. & Contributors; Kevin Deng)
- Core: Rolldown `~1.2.7` + Oxc; dts via `rolldown-plugin-dts@^0.28.5` (requires Rolldown 1.2.x)
- Related: `create-tsdown@0.23.0`, `tsdown-migrate@0.23.0`, `@tsdown/css@0.23.0`, `@tsdown/exe@0.23.0`
- dts generator options: https://github.com/sxzz/rolldown-plugin-dts#readme
- Context7 IDs: `/rolldown/tsdown`, `/websites/tsdown_dev`

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check versions:

   ```sh
   bunx tsdown --version
   bun pm ls tsdown
   # or: npm view tsdown version
   ```

3. Prefer https://tsdown.dev/ and https://tsdown.dev/llms.txt. For unreleased changes check https://main.tsdown.dev. Some pages lag the code (for example, the lint page still says the `attw` default profile is `strict`; 0.23 code uses `esm-only`). Trust release notes and source when they disagree.
4. Keep `@tsdown/css` / `@tsdown/exe` on the **same** version as `tsdown`.
5. For tsup migrations, re-read https://tsdown.dev/guide/migrate-from-tsup. For 0.22 → 0.23, re-read the v0.23.0 release notes.

## Official Pages

### Guide

- Introduction: https://tsdown.dev/guide/
- Getting started: https://tsdown.dev/guide/getting-started
- How it works: https://tsdown.dev/guide/how-it-works
- Migrate from tsup: https://tsdown.dev/guide/migrate-from-tsup
- FAQ: https://tsdown.dev/guide/faq

### Options

- Entry: https://tsdown.dev/options/entry
- Config file: https://tsdown.dev/options/config-file
- Output format: https://tsdown.dev/options/output-format
- Output directory: https://tsdown.dev/options/output-directory
- Cleaning: https://tsdown.dev/options/cleaning
- Dependencies: https://tsdown.dev/options/dependencies
- dts: https://tsdown.dev/options/dts
- Package exports: https://tsdown.dev/options/package-exports
- Unbundle: https://tsdown.dev/options/unbundle
- Watch: https://tsdown.dev/options/watch-mode
- Target / platform: https://tsdown.dev/options/target · https://tsdown.dev/options/platform
- Tree-shaking / sourcemap / minify: https://tsdown.dev/options/tree-shaking · sourcemap · minification
- CSS / copy / exe / lint: https://tsdown.dev/options/css · copy · exe · lint
- Root / log level: https://tsdown.dev/options/root · log-level
- CJS default: https://tsdown.dev/options/cjs-default

### Advanced / reference

- Plugins / hooks: https://tsdown.dev/advanced/plugins · https://tsdown.dev/advanced/hooks
- Rolldown options: https://tsdown.dev/advanced/rolldown-options
- Programmatic: https://tsdown.dev/advanced/programmatic-usage
- CLI: https://tsdown.dev/reference/cli
- UserConfig: https://tsdown.dev/reference/api/Interface.UserConfig
- `defineConfig` / `build`: https://tsdown.dev/reference/api/Function.defineConfig · Function.build

### Recipes

- Vue / React / Solid / Svelte / WASM under https://tsdown.dev/recipes/
