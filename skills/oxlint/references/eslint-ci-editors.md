# ESLint Migration, Editors, and CI

## Coexistence with ESLint

Run Oxlint first for speed, then ESLint for remaining rules:

```json
{ "scripts": { "lint": "oxlint && eslint ." } }
```

```sh
bun add -D eslint-plugin-oxlint
```

```js
// eslint.config.js — put oxlint LAST so overlapping rules are disabled
import oxlint from "eslint-plugin-oxlint";
import tseslint from "typescript-eslint";

export default [
  ...tseslint.configs.recommended,
  ...oxlint.configs["flat/recommended"],
  // or: ...oxlint.buildFromOxlintConfigFile("./oxlint.config.ts"),
  // or: ...oxlint.buildFromOxlintConfigFile("./.oxlintrc.json"),
];
```

Other flat slices: `flat/all`, `flat/typescript`, `flat/react`, `flat/import`, `flat/correctness`, `flat/tree-shaking`, …  
Legacy: `extends: ["plugin:oxlint/recommended"]`.

Keep `oxlint` and `eslint-plugin-oxlint` on the **same minor** (plugin peer is `oxlint ~1.83.0` on this snapshot).

`buildFromOxlintConfigFile` is flat-config only. Prefer it when an Oxlint config already exists so ESLint disable-sets match.

## Migrate from ESLint

Paths:

1. **Replace** — `@oxlint/migrate` → edit `oxlint.config.ts` (or keep generated `.oxlintrc.json`) → drop ESLint when coverage is enough.
2. **Incremental** — `oxlint && eslint` + `eslint-plugin-oxlint`.

```sh
bunx @oxlint/migrate
bunx @oxlint/migrate --type-aware
bunx @oxlint/migrate --js-plugins=false
bunx @oxlint/migrate --merge
bunx @oxlint/migrate --details
bunx @oxlint/migrate --replace-eslint-comments
bunx @oxlint/migrate --output-file .oxlintrc.json
```

Default output is **`.oxlintrc.json`**. Pin `@oxlint/migrate` to the same version as `oxlint`. 1.83 uses current default plugins when merging.

| Flag | Notes |
| --- | --- |
| `--type-aware` | Include type-aware rules and set `options.typeAware` |
| `--js-plugins [bool]` | Default **on**; `--js-plugins=false` skips ESLint plugins without a native port |
| `--with-nursery` | Include nursery rules |
| `--merge` | Merge into an existing Oxlint config (enabling categories + plugins can turn on extra rules) |
| `--details` | List rules that could not be migrated |
| `--replace-eslint-comments` | Convert `eslint-disable*` comments in the tree |
| `--output-file` | Destination path |

Legacy eslintrc: convert to flat first (`@eslint/migrate-config`) or hand-port (shape is close to Oxlint JSON). Move `.eslintignore` → `ignorePatterns`. Local custom plugins: add under `jsPlugins` manually (alpha). Migrated `settings` cover `jsx-a11y`, `next`, `react`, `jsdoc`, `vitest`; unknown keys migrate for JS plugins unless `--js-plugins=false`. Settings inside ESLint `files` overrides are skipped.

TypeScript ESLint configs (`eslint.config.mts`): Bun/Deno; Node ≥22.18 type-stripping; Node ≥22.6 `NODE_OPTIONS=--experimental-strip-types`.

Docs: https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html

## Editors

Install local `oxlint`. LSP: `oxlint --lsp`.

- VS Code / Cursor: `oxc.oxc-vscode`
- Also: Zed, JetBrains, Neovim (`oxlint` LSP / nvim-lspconfig), coc-oxc

```json
{
  "recommendations": ["oxc.oxc-vscode"],
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  }
}
```

Prefer `options.typeAware: true` in the **root** Oxlint config. `oxc.typeAware` in editor settings overrides when set; when unset, the editor follows the config. Requires `oxlint-tsgolint`. 1.81 stops tsgolint processes from leaking in the LSP.

## CI

```yaml
- run: bun install --frozen-lockfile
- run: bun run lint
# optionally: bunx oxlint --type-aware --deny-warnings
```

GitHub Actions auto-uses `-f github` for annotations (override with `--format`). Other formats: `gitlab` (Code Quality JSON), `sarif`, `junit`, `checkstyle`, `agent` (AI-friendly).

Policy gates:

- Fail on warnings: `--deny-warnings` or `options.denyWarnings`
- Cap warnings: `--max-warnings N` / `options.maxWarnings`

GitLab: write `--format=gitlab` to an artifact and attach it as `codequality`.

## Monorepo checklist

- Nested package configs + `extends` for shared baseline.
- Root-only `options.typeAware` / `typeCheck`.
- Build package graph before type-aware CI jobs.
- Next.js: `settings.next.rootDir` when using the nextjs plugin across apps.

## Hooks

lint-staged on `*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`; run `oxlint --fix` on staged files when autofix is desired.

pre-commit mirror: `https://github.com/oxc-project/mirrors-oxlint` (pin `rev` to a release tag).

Third-party: `unplugin-oxlint`, `vite-plugin-oxlint`.

## When to keep ESLint

- Template lint for Vue/Svelte/Astro/Angular
- Exotic plugins Oxlint does not port and JS plugins cannot cover (custom parsers)
- Custom rule packs that must stay on ESLint until migrated
