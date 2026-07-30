---
name: oxlint
description: "Build, review, debug, configure, migrate, teach, or plan Oxlint JavaScript/TypeScript linting with current Oxc docs and a full usage guide. Use for oxlint how-to, .oxlintrc.json, oxlint.config.ts, categories correctness suspicious pedantic style, plugins react import typescript unicorn vitest jest jsx-a11y nextjs, type-aware linting, oxlint-tsgolint, eslint-plugin-oxlint, @oxlint/migrate, ignorePatterns, oxlint-disable comments, --fix, CI formats, progressive adoption, and ESLint-to-Oxlint migration."
---

# Oxlint

Use this skill when work touches Oxlint or Oxc linting: install/config, day-to-day usage, rules/plugins, type-aware linting, ESLint coexistence or migration, editors, or CI.

## Workflow

1. Inspect the local Oxlint surface before changing code:
   - Package versions for `oxlint`, optional `oxlint-tsgolint`, `eslint-plugin-oxlint`, `@oxlint/migrate`.
   - Config: `.oxlintrc.json(c)` or `oxlint.config.ts` / `.mts` (one type per directory).
   - Remaining ESLint setup, ignore files, scripts (`lint` / `lint:fix`), and editor Oxc settings.
   - Whether type-aware linting or JS plugins are in play.
2. For setup, how-to, progressive adoption, diagnostics loops, baselines, or troubleshooting, follow the full guide first: [usage-guide.md](references/usage-guide.md).
3. Refresh current official docs when versions differ from the snapshot or the work touches type-aware, JS plugins, or migration. Start from [source-map.md](references/source-map.md).
4. Route deeper detail to the focused references:
   - Install, CLI, config shape, nested configs, ignores: [setup-cli-config.md](references/setup-cli-config.md).
   - Categories, plugins, rules, inline ignores, type-aware: [rules-plugins-typeaware.md](references/rules-plugins-typeaware.md).
   - ESLint coexistence, migration, editors, CI: [eslint-ci-editors.md](references/eslint-ci-editors.md).
5. Preserve the repository's existing lint severity and plugin choices unless the user asks to migrate or expand coverage.
6. Verify with the narrowest useful `bunx oxlint` / `bun run lint` invocation.

## Core Judgment

- Default Oxlint enables only the **`correctness`** category. Turn on other categories and plugins deliberately.
- Setting `plugins: [...]` **replaces** the default plugin set. Re-list `eslint`, `typescript`, `unicorn`, and `oxc` when you still want them.
- Prefer `.oxlintrc.json` with `$schema` for most projects; use `oxlint.config.ts` + `defineConfig` when you need programmatic shares or non-relative extends.
- Nested configs do **not** auto-merge with parents — use `extends`. `-c/--config` disables nested lookup.
- Prefer `ignorePatterns` in config over scattered ignore files for editor/CI consistency.
- Prefer `oxlint-disable*` comments long-term; `eslint-disable*` still works while migrating (`respectEslintDisableDirectives` default true).
- Type-aware linting needs `oxlint-tsgolint` + `--type-aware` / `options.typeAware`. Those options are **root-only**. Do not pass `--tsconfig` together with type-aware.
- Keep `oxlint` and `eslint-plugin-oxlint` on the same minor. Put oxlint flat configs **last** in ESLint so they disable overlapping rules.
- JS plugins (`jsPlugins`) are **alpha** and outside normal semver — avoid unless required.
- Vue/Svelte/Astro: Oxlint covers **script blocks only**, not templates.
- Companion formatter is **Oxfmt** (separate skill). Do not treat Oxlint as a formatter.

## Verification

Prefer repository-owned commands. For meaningful Oxlint work, cover the relevant subset:

- `bunx oxlint` (or project `lint` script) on changed paths.
- `bunx oxlint --fix` when autofixes are expected; review remaining diagnostics.
- Type-aware: `bunx oxlint --type-aware` after dependents are built so `.d.ts` exist.
- CI-shaped run with `--deny-warnings` or `--max-warnings` when those gates are project policy.
- After ESLint coexistence changes: run `oxlint && eslint` and confirm no duplicate rule noise.
- Editor/LSP smoke when changing Oxc extension settings or `options.typeAware`.

Report which checks ran, which did not, and any package-version or type-aware assumptions that remain.
