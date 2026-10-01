# Source Map

This reference captures the Oxlint docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-10-01
- Official site: https://oxc.rs/
- Linter docs: https://oxc.rs/docs/guide/usage/linter.html
- npm `oxlint`: **1.86.0** (published 2026-09-28)
- npm `eslint-plugin-oxlint`: **1.86.0** (peer `oxlint ~1.86.0`)
- npm `oxlint-tsgolint`: **7.0.2003** (tracks TypeScript **7.0.2** / typescript-go; patch `003`)
- npm `@oxlint/migrate`: **1.86.0**
- npm `@oxlint/plugins` (JS plugin authoring helpers): **1.86.0**
- Node engines (`oxlint`): `^20.19.0 || >=22.12.0`
- Optional peers (`oxlint`): `oxlint-tsgolint >=7.0.2003`, `vite-plus *`
- Rules index: **871** built-in rules; **111** on by default
- Vite+ **1.0.0** (2026-09-28) pins `oxlint` 1.85.0 + `oxlint-tsgolint` 7.0.2003 — `vp lint` users may trail npm `latest` by a minor
- Preferred config: **`oxlint.config.ts`** + `defineConfig` (JSON `.oxlintrc.json(c)` still supported; `--init` and `@oxlint/migrate` still write JSON)
- Context7 IDs: `/websites/oxc_rs`, `/websites/oxc_rs_guide_usage`, `/oxc-project/oxc`, `/oxc-project/website`, `/oxc-project/eslint-plugin-oxlint`, `/oxc-project/tsgolint`

## 1.84.0–1.86.0 (user-facing)

| Version | Date | What agents should know |
| --- | --- | --- |
| **1.84.0** | 2026-09-21 | `--debug timings` now reports **JS plugin** rule timings. LSP treats `configPath: ""` as unset (nested config stays on). Vite+ mode finds every `vite.config.*` variant. `unicorn/no-unreadable-iife` suggestion. Many `no-unused-vars` fix-safety fixes. |
| **1.85.0** | 2026-09-21 | Vite+ mode **never discovers nested configs** (CLI and LSP). |
| **1.86.0** | 2026-09-28 | New type-aware `typescript/no-generated-empty-object-type` (suspicious; needs tsgolint ≥ 7.0.2003). `react/only-export-components` `allowCompoundComponents`. `node/no-exports-assign` moved **style → suspicious**. React Compiler: `new Date()` treated as impure; recursive function expressions handled. |

No breaking config changes and no new CLI flags in this range.

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
- Releases: https://github.com/oxc-project/oxc/releases (tags `oxlint_v1.86.0` since 1.85; combined `apps_v1.84.0` and older)
