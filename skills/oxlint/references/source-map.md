# Source Map

This reference captures the Oxlint docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-09-18
- Official site: https://oxc.rs/
- Linter docs: https://oxc.rs/docs/guide/usage/linter.html
- npm `oxlint`: **1.83.0**
- npm `eslint-plugin-oxlint`: **1.83.0** (peer `oxlint ~1.83.0`)
- npm `oxlint-tsgolint`: **7.0.2002** (tracks TypeScript **7.0.2** / typescript-go; patch `002`)
- npm `@oxlint/migrate`: **1.83.0**
- Node engines (`oxlint`): `^20.19.0 || >=22.12.0`
- Optional peers (`oxlint`): `oxlint-tsgolint >=7.0.2001`, `vite-plus *`
- Rules index: **870** built-in rules; **111** on by default
- Preferred config: **`oxlint.config.ts`** + `defineConfig` (JSON `.oxlintrc.json(c)` still supported; `--init` and `@oxlint/migrate` still write JSON)
- Context7 IDs: `/websites/oxc_rs`, `/websites/oxc_rs_guide_usage`, `/oxc-project/oxc`, `/oxc-project/website`, `/oxc-project/eslint-plugin-oxlint`, `/oxc-project/tsgolint`

Treat JS plugins as **alpha** (outside semver). Type-aware is feature-stable but still listed as not subject to full semver. `typeCheck` remains experimental. React Compiler lint rules are experimental (lint-only compiler analysis under `react/*`).

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check registry metadata:

   ```sh
   bun info oxlint
   bun info eslint-plugin-oxlint
   bun info oxlint-tsgolint
   bun info @oxlint/migrate
   ```

3. Prefer official pages under https://oxc.rs/docs/guide/usage/linter/. If docs and package metadata disagree, report the mismatch.
4. Check the local lockfile before applying guidance that requires a minimum Oxlint or tsgolint version.
5. For type-aware work, confirm `oxlint-tsgolint` is installed and TypeScript ≥ 7.0 when required by that package line.
6. For React Compiler work, confirm the project is on Oxlint ≥ 1.79 (per-category `react/*` rules) rather than nursery `react/react-compiler`.

## In-skill usage guide

- Full how-to / progressive adoption / troubleshooting: [usage-guide.md](usage-guide.md)

## Official Pages

- Overview: https://oxc.rs/docs/guide/usage/linter.html
- Quickstart: https://oxc.rs/docs/guide/usage/linter/quickstart.html
- Config: https://oxc.rs/docs/guide/usage/linter/config.html
- Config file reference: https://oxc.rs/docs/guide/usage/linter/config-file-reference.html
- CLI: https://oxc.rs/docs/guide/usage/linter/cli.html
- Plugins: https://oxc.rs/docs/guide/usage/linter/plugins.html
- JS plugins: https://oxc.rs/docs/guide/usage/linter/js-plugins.html
- Writing JS plugins: https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html
- Ignore files: https://oxc.rs/docs/guide/usage/linter/ignore-files.html
- Ignore comments: https://oxc.rs/docs/guide/usage/linter/ignore-comments.html
- Nested config: https://oxc.rs/docs/guide/usage/linter/nested-config.html
- Automatic fixes: https://oxc.rs/docs/guide/usage/linter/automatic-fixes.html
- Multi-file analysis: https://oxc.rs/docs/guide/usage/linter/multi-file-analysis.html
- Output formats: https://oxc.rs/docs/guide/usage/linter/output-formats.html
- Type-aware: https://oxc.rs/docs/guide/usage/linter/type-aware.html
- Editors: https://oxc.rs/docs/guide/usage/linter/editors.html
- LSP config: https://oxc.rs/docs/guide/usage/linter/lsp-config-reference.html
- CI: https://oxc.rs/docs/guide/usage/linter/ci.html
- Migrate from ESLint: https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html
- Versioning: https://oxc.rs/docs/guide/usage/linter/versioning.html
- Rules index: https://oxc.rs/docs/guide/usage/linter/rules
- Compatibility: https://oxc.rs/compatibility
- Type-aware stable blog: https://oxc.rs/blog/2026-07-22-type-aware-linting-stable.html
- JS plugins alpha blog: https://oxc.rs/blog/2026-03-11-oxlint-js-plugins-alpha.html
- React Compiler support: https://oxc.rs/blog/2026-08-18-react-compiler-support.html
- Schema: `node_modules/oxlint/configuration_schema.json`
- GitHub: https://github.com/oxc-project/oxc · https://github.com/oxc-project/tsgolint · https://github.com/oxc-project/eslint-plugin-oxlint · https://github.com/oxc-project/oxlint-migrate
- Releases: https://github.com/oxc-project/oxc/releases (apps tags such as `apps_v1.83.0`)
