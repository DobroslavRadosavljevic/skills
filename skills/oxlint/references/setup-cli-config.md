# Setup, CLI, and Config

## Install

```sh
bun add -D oxlint
# optional
bun add -D oxlint-tsgolint@latest
bun add -D eslint-plugin-oxlint @oxlint/migrate
```

```json
{
  "scripts": {
    "lint": "oxlint",
    "lint:fix": "oxlint --fix"
  }
}
```

One-off: `bunx oxlint`.

## CLI essentials

```sh
bunx oxlint
bunx oxlint src/
bunx oxlint -c oxlint.config.ts
bunx oxlint --fix
bunx oxlint --fix-suggestions
bunx oxlint -D correctness -D suspicious -A no-debugger
bunx oxlint --import-plugin -D import/no-cycle
bunx oxlint --type-aware
bunx oxlint --deny-warnings
bunx oxlint -f github
```

| Area | Flags |
| --- | --- |
| Config | `-c/--config`, `--init`, `--print-config`, `--disable-nested-config` |
| Severity | `-A/--allow`, `-W/--warn`, `-D/--deny` (rules or categories; left→right) |
| Plugins | `--import-plugin`, `--react-plugin`, `--jest-plugin`, `--vitest-plugin`, `--jsx-a11y-plugin`, `--nextjs-plugin`, `--promise-plugin`, `--node-plugin`, `--vue-plugin`, `--jsdoc-plugin`; `--disable-{unicorn,oxc,typescript}-plugin` |
| Fix | `--fix`, `--fix-suggestions`, `--fix-dangerously` |
| Ignore | `--ignore-path`, `--ignore-pattern`, `--no-ignore` |
| Warnings | `--quiet`, `--deny-warnings`, `--max-warnings N` |
| Type-aware | `--type-aware`, `--type-check` (experimental diagnostics) |
| Output | `-f/--format`: `default`, `agent`, `json`, `unix`, `stylish`, `github`, `gitlab`, `junit`, `checkstyle`, `sarif` |

### Exit behavior

| Situation | Exit |
| --- | --- |
| Clean (warnings alone OK) | 0 |
| Lint errors | non-zero |
| Warnings + `--deny-warnings` / `--max-warnings` exceeded | 1 |
| No files matched | 1 unless `--no-error-on-unmatched-pattern` |

## Config discovery

Nearest of: `oxlint.config.ts`, `oxlint.config.mts`, `.oxlintrc.json`, `.oxlintrc.jsonc`.

- **One config type per directory** — JSON and TS cannot coexist; nor can `.ts` and `.mts`.
- `-c/--config` disables nested lookup. With `--config`, any `.js`/`.mjs`/`.cjs`/`.ts`/`.mts`/`.cts` path is accepted.
- Prefer **`oxlint.config.ts`** + `defineConfig` for new projects.
- `--init` still scaffolds `.oxlintrc.json` — replace with a TS config when starting fresh, or keep JSON if that is what the repo already uses.
- JSON shape is ESLint-v8-like; comments allowed. Schema: `./node_modules/oxlint/configuration_schema.json`.
- TS configs need the Node-based `oxlint` package and a runtime that can execute TypeScript (Node v22.18+ / v24+, or Bun). Standalone binary → use `.oxlintrc.json`.

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  categories: {
    correctness: "error",
    suspicious: "warn",
  },
  plugins: ["eslint", "typescript", "unicorn", "oxc", "import", "react"],
  ignorePatterns: ["dist/**", "coverage/**"],
  env: { browser: true },
  globals: { MY_GLOBAL: "readonly" },
  settings: { react: { version: "detect" } },
  options: { typeAware: false, maxWarnings: 0 },
  rules: {
    eqeqeq: "warn",
    "import/no-cycle": ["error", { maxDepth: 3 }],
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      plugins: ["vitest"],
      env: { vitest: true },
      rules: { "no-console": "off" },
    },
  ],
});
```

Shared package / programmatic extends (TS only — import objects, not file-path strings):

```ts
import shared from "@example-org/oxlint-config";
import { defineConfig } from "oxlint";

export default defineConfig({
  extends: [shared],
  rules: { "no-console": "warn" },
});
```

JSON fallback (existing repos / standalone binary):

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "categories": { "correctness": "error" },
  "extends": ["./configs/base.json"]
}
```

## Nested configs (monorepos)

- Nearest config to the file wins; **not** auto-merged with parent.
- Share baseline via `extends` (TS imported objects or JSON relative paths).
- Root-only options: `typeAware`, `typeCheck`, `reportUnusedDisableDirectives`, `respectEslintDisableDirectives`.
- `plugins` in extends are a **union**. Omitting `plugins` on a child can reintroduce defaults — use `"plugins": []` when inheriting an exact list.

## Ignores

| Mechanism | Notes |
| --- | --- |
| `ignorePatterns` | Preferred; relative to config; gitignore-style; `!` negation |
| `.gitignore` | Respected (not global gitignore) |
| `.eslintignore` | Migration compatibility |
| Defaults | `.git`, minified `*.min.*` patterns |
| Hidden files | Not ignored by default |

CLI: `--ignore-path`, `--ignore-pattern`, `--no-ignore`.
