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

Node engines: `^20.19.0 || >=22.12.0`. `oxlint-tsgolint` is an optional peer (`>=7.0.2001`).

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
bunx oxlint --debug timings
```

| Area | Flags |
| --- | --- |
| Config | `-c/--config`, `--init`, `--print-config [path]`, `--disable-nested-config` |
| Severity | `-A/--allow`, `-W/--warn`, `-D/--deny` (rules or categories; left→right). `-D all` is all categories except nursery and does **not** auto-enable optional plugins. |
| Plugins | `--import-plugin`, `--react-plugin`, `--react-perf-plugin`, `--jest-plugin`, `--vitest-plugin`, `--jsx-a11y-plugin`, `--nextjs-plugin`, `--promise-plugin`, `--node-plugin`, `--vue-plugin`, `--jsdoc-plugin`; `--disable-{unicorn,oxc,typescript}-plugin` |
| Fix | `--fix`, `--fix-suggestions`, `--fix-dangerously` (combinable) |
| Ignore | `--ignore-path`, `--ignore-pattern`, `--no-ignore` |
| Warnings | `--quiet`, `--deny-warnings`, `--max-warnings N` |
| Type-aware | `--type-aware`, `--type-check` (experimental diagnostics) |
| Debug | `--debug files` (list files then exit), `--debug timings` (per-rule timings; comma-separated, e.g. `--debug files,timings`) |
| Other | `--silent`, `--threads N`, `--lsp`, `--rules`, `--no-error-on-unmatched-pattern` |
| Output | `-f/--format`: `default`, `agent`, `json`, `unix`, `stylish`, `github`, `gitlab`, `junit`, `checkstyle`, `sarif` |
| Directives | `--report-unused-disable-directives`, `--report-unused-disable-directives-severity <allow\|off\|warn\|error\|deny>` (mutually exclusive) |

`--tsconfig` overrides tsconfig discovery for **import resolution only**. Type-aware linting ignores it and always auto-discovers `tsconfig.json`. Do not combine `--tsconfig` with `--type-aware`.

`--rules` lists registered rules (qualified with plugin names). GitHub Actions auto-selects `-f github` (includes `file:line:col` in annotation messages since 1.77).

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
- TS configs need the Node-based `oxlint` package and a runtime that can execute TypeScript (Node v22.18+ / v24+, or Bun). Standalone binary → use `.oxlintrc.json`. CLI help still calls JS/TS config loading experimental.

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
  settings: { react: { version: "19.0.0" } },
  options: { typeAware: false, maxWarnings: 0 },
  rules: {
    eqeqeq: "warn",
    "import/no-cycle": ["error", { maxDepth: 3 }],
  },
  overrides: [
    {
      files: ["**/*.{test,spec}.{ts,tsx}"],
      excludeFiles: ["**/*.generated.ts"],
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

`extends` only merges `rules`, `plugins`, and `overrides`.

## Nested configs (monorepos)

- Nearest config to the file wins; **not** auto-merged with parent.
- Share baseline via `extends` (TS imported objects or JSON relative paths).
- Root-only options: `typeAware`, `typeCheck`, `reportUnusedDisableDirectives`, `respectEslintDisableDirectives`. Nested files that set `typeAware` / `typeCheck` error.
- `plugins` in extends are a **union**. Omitting `plugins` on a child can reintroduce defaults — use `"plugins": []` when inheriting an exact list.

## Ignores

| Mechanism | Notes |
| --- | --- |
| `ignorePatterns` | Preferred; relative to config; gitignore-style; `!` negation. Patterns with `..` or matching outside the config directory are rejected. |
| `.gitignore` | Respected for walk discovery (not global gitignore). An **explicitly named file** is still linted even if gitignored; an explicitly named ignored **directory** is skipped. |
| `.eslintignore` | Migration compatibility |
| Defaults | `.git`, minified `*.min.*` / `-min.` / `_min.` name patterns |
| Hidden files | Not ignored by default |

CLI: `--ignore-path`, `--ignore-pattern`, `--no-ignore`. `--no-ignore` does **not** disable `ignorePatterns` or `.gitignore` discovery.

## Settings (common)

- `settings.react.version` — semver string such as `"19.0.0"` (default unset); plus `linkComponents`, `formComponents`, `componentWrapperFunctions`.
- `settings.next.rootDir` — Next.js app root in a monorepo (`string` or `string[]`).
- `settings.jsx-a11y` — `components`, `attributes`, `polymorphicPropName`.
- `settings.jest.version` — major Jest version for `no-deprecated-functions`.
- `settings.vitest.typecheck` — skip some describe checks when Vitest typecheck mode is on.
- `settings.jsdoc.*` — tag preferences and ignore flags.
- Custom keys are allowed for JS plugins.

Oxlint does not support `settings` inside `overrides`.
