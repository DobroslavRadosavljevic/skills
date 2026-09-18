---
name: oxlint
description: "Build, review, debug, configure, migrate, teach, or plan Oxlint JavaScript/TypeScript linting with current Oxc docs and a full usage guide. Use for oxlint how-to, oxlint.config.ts, defineConfig, .oxlintrc.json, categories correctness suspicious pedantic style, plugins react import typescript unicorn vitest jest jsx-a11y nextjs, React Compiler react/immutability react/purity (1.79+ split from react/react-compiler), type-aware linting, oxlint-tsgolint, eslint-plugin-oxlint, @oxlint/migrate, jsPlugins alpha, ignorePatterns, oxlint-disable comments, --fix, --debug timings, CI formats, progressive adoption, and ESLint-to-Oxlint migration."
---

# Oxlint

Use this skill when work touches Oxlint or Oxc linting: install/config, day-to-day usage, rules/plugins, React Compiler lint rules, type-aware linting, ESLint coexistence or migration, editors, or CI.

## Workflow

1. Inspect the local Oxlint surface before changing code:
   - Package versions for `oxlint`, optional `oxlint-tsgolint`, `eslint-plugin-oxlint`, `@oxlint/migrate`.
   - Config: prefer `oxlint.config.ts` / `.mts` with `defineConfig`; also accept `.oxlintrc.json(c)` (one type per directory).
   - Remaining ESLint setup, ignore files, scripts (`lint` / `lint:fix`), and editor Oxc settings.
   - Whether type-aware linting, JS plugins, or React Compiler rules are in play.
2. For setup, how-to, progressive adoption, diagnostics loops, baselines, or troubleshooting, follow the full guide first: [usage-guide.md](references/usage-guide.md).
3. Refresh current official docs when versions differ from the snapshot or the work touches type-aware, JS plugins, React Compiler, or migration. Start from [source-map.md](references/source-map.md).
4. Route deeper detail to the focused references:
   - Install, CLI, config shape, nested configs, ignores: [setup-cli-config.md](references/setup-cli-config.md).
   - Categories, plugins, React Compiler, JS plugins, rules, inline ignores, type-aware: [rules-plugins-typeaware.md](references/rules-plugins-typeaware.md).
   - ESLint coexistence, migration, editors, CI: [eslint-ci-editors.md](references/eslint-ci-editors.md).
5. Preserve the repository's existing lint severity and plugin choices unless the user asks to migrate or expand coverage.
6. Verify with the narrowest useful `bunx oxlint` / `bun run lint` invocation.

## Core Judgment

- Default Oxlint enables only the **`correctness`** category. Turn on other categories and plugins deliberately.
- Setting `plugins: [...]` **replaces** the default plugin set. Re-list `eslint`, `typescript`, `unicorn`, and `oxc` when you still want them.
- Prefer **`oxlint.config.ts`** + `defineConfig` for new configs (typed, shareable via imports). Keep or use `.oxlintrc.json` only when the project already has it, or when using a standalone binary without a Node runtime. CLI help still labels JS/TS config loading as experimental; official config docs treat `oxlint.config.ts` as first-class.
- Nested configs do **not** auto-merge with parents — use `extends` (TS: imported objects; JSON: relative paths). `-c/--config` disables nested lookup.
- Prefer `ignorePatterns` in config over scattered ignore files for editor/CI consistency. `.gitignore` applies to walk discovery; an **explicitly named file** is still linted.
- Prefer `oxlint-disable*` comments long-term; `eslint-disable*` still works while migrating (`respectEslintDisableDirectives` default true).
- Type-aware linting needs `oxlint-tsgolint` + `--type-aware` / `options.typeAware`. Those options are **root-only**. Do not pass `--tsconfig` together with type-aware.
- Keep `oxlint` and `eslint-plugin-oxlint` on the same minor. Put oxlint flat configs **last** in ESLint so they disable overlapping rules.
- JS plugins (`jsPlugins`) are **alpha** and outside normal semver — avoid unless required.
- React Compiler lint rules are **experimental**. Since 1.79 they are per-category `react/*` rules (not `react/react-compiler`). Enabling the `react` plugin with default `correctness` turns on the recommended compiler rules. Remove any leftover `react/react-compiler` entry.
- Vue/Svelte/Astro/Angular: Oxlint covers **script blocks only**, not templates.
- Do not treat Oxlint as a formatter. Formatting belongs in a separate formatter tool (for example Oxfmt or Prettier).

## Verification

Prefer repository-owned commands. For meaningful Oxlint work, cover the relevant subset:

- `bunx oxlint` (or project `lint` script) on changed paths.
- `bunx oxlint --fix` when autofixes are expected; review remaining diagnostics.
- Type-aware: `bunx oxlint --type-aware` after dependents are built so `.d.ts` exist.
- CI-shaped run with `--deny-warnings` or `--max-warnings` when those gates are project policy.
- After ESLint coexistence changes: run `oxlint && eslint` and confirm no duplicate rule noise.
- Editor/LSP smoke when changing Oxc extension settings or `options.typeAware`.
- After enabling the `react` plugin on 1.79+: confirm whether experimental compiler rules should stay on.

Report which checks ran, which did not, and any package-version, React Compiler, or type-aware assumptions that remain.
