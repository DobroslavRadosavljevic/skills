# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: 2026-07-30
- Package: **`tsdown@0.22.14`** (npm `latest`, published 2026-07-23)
- Beta: `0.23.0-beta.2` (`dist-tag` `beta`) — unreleased docs often at https://main.tsdown.dev
- Engines (0.22.14): Node `^22.18.0 || >=24.11.0` (to **run** tsdown)
- Homepage: https://tsdown.dev/
- Docs ToC: https://tsdown.dev/llms.txt
- Repo: https://github.com/rolldown/tsdown
- License: MIT (VoidZero Inc. & Contributors; Kevin Deng)
- Core: Rolldown ~1.2 + Oxc; dts via `rolldown-plugin-dts`
- Related: `create-tsdown@0.22.14`, `tsdown-migrate@0.22.14`
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

3. Prefer https://tsdown.dev/ and https://tsdown.dev/llms.txt. If installed package is 0.23-beta, also check https://main.tsdown.dev.
4. Keep `@tsdown/css` / `@tsdown/exe` on the **same** version as `tsdown`.
5. For tsup migrations, re-read https://tsdown.dev/guide/migrate-from-tsup.

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
