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

Other flat slices: `flat/all`, `flat/typescript`, `flat/react`, `flat/import`, `flat/correctness`, …  
Legacy: `extends: ["plugin:oxlint/recommended"]`.

Keep `oxlint` and `eslint-plugin-oxlint` on the **same minor**.

## Migrate from ESLint

Paths:

1. **Replace** — `@oxlint/migrate` → edit `oxlint.config.ts` (or `.oxlintrc.json`) → drop ESLint when coverage is enough.
2. **Incremental** — `oxlint && eslint` + `eslint-plugin-oxlint`.

```sh
bunx @oxlint/migrate
bunx @oxlint/migrate --type-aware
bunx @oxlint/migrate --js-plugins=false
```

Legacy eslintrc: convert to flat first (`@eslint/migrate-config`) or hand-port (shape is close to Oxlint JSON). Move `.eslintignore` → `ignorePatterns`. Local custom plugins: add under `jsPlugins` manually (alpha).

Docs: https://oxc.rs/docs/guide/usage/linter/migrate-from-eslint.html

## Editors

Install local `oxlint`. LSP: `oxlint --lsp`.

- VS Code / Cursor: `oxc.oxc-vscode`
- Also: Zed, JetBrains, Neovim (`oxlint` LSP), coc-oxc

```json
{
  "recommendations": ["oxc.oxc-vscode"],
  "editor.codeActionsOnSave": {
    "source.fixAll.oxc": "always"
  },
  "oxc.typeAware": true
}
```

## CI

```yaml
- run: bun install --frozen-lockfile
- run: bun run lint
# optionally: bunx oxlint --type-aware --deny-warnings
```

GitHub Actions often use `-f github` for annotations (auto in many setups). Other formats: `gitlab`, `sarif`, `junit`, `checkstyle`, `agent` (AI-friendly).

Policy gates:

- Fail on warnings: `--deny-warnings` or `options.denyWarnings`
- Cap warnings: `--max-warnings N` / `options.maxWarnings`

## Monorepo checklist

- Nested package configs + `extends` for shared baseline.
- Root-only `options.typeAware`.
- Build package graph before type-aware CI jobs.
- Next.js: `settings.next.rootDir` when using the nextjs plugin across apps.

## Hooks

lint-staged on `*.{js,jsx,ts,tsx,mjs,cjs,mts,cts}`; run `oxlint --fix` on staged files when autofix is desired.

## When to keep ESLint

- Template lint for Vue/Svelte/Astro
- Exotic plugins Oxlint does not port and JS plugins cannot cover
- Custom rule packs that must stay on ESLint until migrated
