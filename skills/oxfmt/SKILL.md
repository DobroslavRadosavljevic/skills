---
name: oxfmt
description: "Build, review, debug, configure, migrate, teach, or plan Oxfmt JavaScript/TypeScript formatting with current Oxc docs and a full usage guide. Use for oxfmt how-to, oxfmt.config.ts, defineConfig, .oxfmtrc.json, Prettier migration, --check/--write, printWidth, sortImports, sortTailwindcss, sortPackageJson, ignorePatterns, oxfmt-ignore, language support, Biome migration, Vite+ fmt, editors, CI format gates, and day-to-day format workflows."
---

# Oxfmt

Use this skill when work touches Oxfmt or Oxc formatting: install/config, day-to-day usage, Prettier/Biome migration, sorting extras, language support, editors, or CI `--check` gates.

## Workflow

1. Inspect the local Oxfmt surface before changing code:
   - Package version for `oxfmt` (still **0.x / beta** until 1.0).
   - Config: prefer `oxfmt.config.ts` / `.mts` with `defineConfig`; also accept `.oxfmtrc.json(c)` (one type per directory); Vite+ may use `fmt` in `vite.config.ts` instead.
   - Remaining Prettier/Biome setup, `.prettierignore`, scripts (`fmt` / `fmt:check`), editor default formatter.
2. For setup, how-to, style choices, sorting, monorepos, pairing with Oxlint, or troubleshooting, follow the full guide first: [usage-guide.md](references/usage-guide.md).
3. Refresh current official docs when versions differ from the snapshot or the work touches language support, sorting, or migration. Start from [source-map.md](references/source-map.md).
4. Route deeper detail to the focused references:
   - Install, CLI, config options, editorconfig: [setup-cli-config.md](references/setup-cli-config.md).
   - Languages, sorting, ignores, inline comments: [languages-sorting-ignores.md](references/languages-sorting-ignores.md).
   - Prettier/Biome migration, coexistence, CI: [prettier-migration-ci.md](references/prettier-migration-ci.md).
5. Preserve the project's print width and quote/semi style unless migrating or the user asks to change them.
6. Verify with `bunx oxfmt --check` (CI) or `bunx oxfmt` (write) on the touched paths.

## Core Judgment

- Oxfmt is **Prettier-compatible** for JS/TS (aim: match Prettier output; diffs vs recent Prettier are bugs). It is **not** 1.0 yet — pin lockfiles.
- Default mode is **write**. CI gate is `oxfmt --check` (exit 1 on drift).
- **No Prettier-style CLI style flags** (`--no-semi`, etc.) — style lives in the config file only.
- Default `printWidth` is **100**, not Prettier's 80. Set `printWidth: 80` when migrating to minimize diffs.
- Prefer **`oxfmt.config.ts`** + `defineConfig` for new configs. Keep or use `.oxfmtrc.json` only when the project already has it. `--init` / `--migrate` may still write JSON — convert to TS when adding a new config.
- Prefer `ignorePatterns` for new projects; `.prettierignore` still works during migration.
- Built-in sorting (`sortImports`, `sortTailwindcss`, `sortPackageJson`, `jsdoc`) replaces Prettier plugins — Prettier plugins are **unsupported**.
- `sortPackageJson` defaults **on** — expect `package.json` diffs; disable if unwanted.
- Do not run Oxfmt alongside Prettier or Biome as formatters in the same pipeline.
- Oxfmt formats; it does not replace a linter. Drop `eslint-plugin-prettier`; keep `eslint-config-prettier` only if ESLint remains.
- Astro and formats that need Prettier plugins may be blockers until Oxfmt supports them.

## Verification

Prefer repository-owned commands. For meaningful Oxfmt work, cover the relevant subset:

- `bunx oxfmt --check` on changed paths or the whole repo for CI parity.
- `bunx oxfmt` locally / lint-staged when applying format.
- After Prettier migration: spot-check JS/TS diffs; confirm `printWidth` intent; remove Prettier scripts/deps when ready.
- Sorting: confirm `sortImports` / Tailwind / `package.json` behavior matches team expectations.
- Editor format-on-save smoke when changing the Oxc extension default formatter.

Report which checks ran, which did not, and any 0.x maturity or language-support assumptions that remain.
