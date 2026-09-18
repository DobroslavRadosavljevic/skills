# Rules, Plugins, and Type-Aware

## Categories

| Category | Meaning | Default |
| --- | --- | --- |
| `correctness` | Definitely wrong / useless | **on (error)** |
| `suspicious` | Likely wrong | off |
| `pedantic` | Strict / higher false-positive risk | off |
| `perf` | Performance | off |
| `style` | Idiomatic style | off |
| `restriction` | Ban patterns/APIs | off |
| `nursery` | Unstable / changing | off |

CLI: `-D all` enables all except nursery and does **not** auto-enable optional plugins.

Individual `rules` override category settings.

Snapshot: **870** built-in rules; **111** on by default.

## Plugins

| Plugin | Default on | Ecosystem source |
| --- | --- | --- |
| `eslint` | Yes | ESLint core |
| `typescript` | Yes | typescript-eslint (+ type-aware via tsgolint) |
| `unicorn` | Yes | eslint-plugin-unicorn |
| `oxc` | Yes | Oxc / deepscan-style |
| `react` | No | React, hooks, refresh, and **experimental React Compiler** rules |
| `react-perf` | No | react-perf |
| `nextjs` | No | `@next/eslint-plugin-next` |
| `import` | No | eslint-plugin-import / import-x (multi-file / `no-cycle`) |
| `jsdoc` | No | eslint-plugin-jsdoc |
| `jsx-a11y` | No | jsx-a11y (also `eslint-plugin-jsx-a11y-x`) |
| `node` | No | eslint-plugin-n |
| `promise` | No | eslint-plugin-promise |
| `jest` / `vitest` | No | test plugins |
| `vue` | No | Vue **script-tag** rules |

No new native plugin names between 1.76 and 1.83. **Critical:** `"plugins": [...]` **replaces** the default set. Always re-list defaults you still want.

Enable via config or CLI (`--import-plugin`, `--react-plugin`, `--react-perf-plugin`, …).

### React Compiler (experimental, 1.79+)

Oxlint runs React Compiler analysis in lint-only mode as per-category `react/*` rules. They are experimental and off until the **`react` plugin** is enabled; then category settings apply. Default `correctness` therefore turns on the **recommended** compiler rules.

**Breaking (1.79):** nursery `react/react-compiler` was split. Delete that rule name from configs.

| Oxlint category | Rules |
| --- | --- |
| correctness (recommended) | `error-boundaries`, `globals`, `immutability`, `incompatible-library`, `preserve-manual-memoization`, `purity`, `refs`, `set-state-in-effect`, `set-state-in-render`, `static-components`, `use-memo`, `void-use-memo` |
| restriction (recommended) | `unsupported-syntax` |
| suspicious (off) | `capitalized-calls`, `exhaustive-effect-dependencies`, `hooks`, `memo-dependencies` |
| restriction (off) | `invariant`, `rule-suppression`, `syntax`, `todo` |
| perf (off) | `no-deriving-state-in-effects` |

Not implemented: `config`, `gating`, `fbt`, `memoized-effect-dependencies`.

1.83 updates React plugin rules for React **19.3**. Skip `node_modules` by default for compiler analysis. Opt out of compiler noise by turning specific `react/<rule>` ids off — do not re-add `react/react-compiler`.

### Notable native rules since 1.76

- **1.78:** `eslint/one-var`, `jsdoc/no-blank-blocks`; `jsx-a11y/anchor-has-content` options aligned with ESLint.
- **1.81:** `nextjs/no-typos` suggestion.
- **1.82:** `eslint/no-unmodified-loop-condition` `checkConditionalExpressions` option; `--rules` output is plugin-qualified.
- **1.77:** `eslint/prefer-promise-reject-errors` moved to `pedantic` (prefer the type-aware equivalent when `--type-aware`).

List available rules:

```sh
bunx oxlint --rules
```

### JS plugins (`jsPlugins`)

**Alpha — not under semver.** ESLint v9+ style JS plugins mostly work. Duplicate JS plugin names are rejected. JS plugins can live on overrides.

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  jsPlugins: [
    "eslint-plugin-playwright",
    { name: "jsdoc-js", specifier: "eslint-plugin-jsdoc" },
  ],
  rules: {
    "playwright/no-skipped-test": "error",
    "jsdoc-js/check-alignment": "error",
  },
});
```

Reserved native names (alias if you need the JS package): `react` (includes react-hooks), `unicorn`, `typescript`, `oxc`, `import` (includes import-x), `jsdoc`, `jest`, `vitest`, `jsx-a11y` (includes jsx-a11y-x), `nextjs`, `react-perf`, `promise`, `node`, `vue`, `eslint`.

TypeScript plugin files: Bun/Deno natively; Node `^20.19.0` or `>=22.18.0` (type-stripping). Older Node: JS plugins only.

Known conformance-tested plugins include cypress, mocha, playwright, regexp, sonarjs, storybook, stylistic, testing-library, `@e18e/eslint-plugin`, and `eslint-plugin-react-hooks` (prefer native `react` rules when they exist).

Supported: AST traversal, `node.parent` / ancestors, fixes, rule options, selectors, SourceCode + tokens, scope, code paths, inline disable directives, LSP + suggestions.

Not yet: custom file formats/parsers (Vue/Svelte/Angular templates), type-aware JS plugin rules.

Authoring extras (still alpha): `createOnce` + `eslintCompatPlugin` from `@oxlint/plugins`; `RuleTester` from `oxlint/plugins-dev`. Docs: https://oxc.rs/docs/guide/usage/linter/writing-js-plugins.html

## Rule severity and naming

Severities: `"off"` / `"allow"`, `"warn"`, `"error"` / `"deny"`, or `[severity, options]`.

Unique ESLint core names may omit the prefix (`no-console` ≡ `eslint/no-console`). Plugin rules use `plugin/rule` (`import/no-cycle`, `typescript/no-floating-promises`, `react/immutability`).

## Inline ignores

Preferred:

```ts
// oxlint-disable-next-line typescript/no-floating-promises
doSomethingAsync();

/* oxlint-disable no-console */
console.log("temp");
/* oxlint-enable no-console */
```

Also: `oxlint-disable`, `oxlint-enable`, `oxlint-disable-line`.

`eslint-disable*` forms still work while migrating (`options.respectEslintDisableDirectives` default **true**). Inline comments cannot change rule options — only enable/disable.

Unused directives: `--report-unused-disable-directives` or `options.reportUnusedDisableDirectives` (`"off"` / `"warn"` / `"error"` / `"allow"` / `"deny"`). Root-only.

## Type-aware linting

Architecture: Oxlint (Rust) owns files/config/reporting; **tsgolint** (Go / typescript-go) runs type-aware rules. Coverage: **59 / 61** typescript-eslint type-aware rules. Not implemented: `naming-convention`, `prefer-destructuring`.

```sh
bun add -D oxlint oxlint-tsgolint@latest
bunx oxlint --type-aware
# optional experimental TS diagnostics in the same run:
bunx oxlint --type-aware --type-check
```

```ts
import { defineConfig } from "oxlint";

export default defineConfig({
  options: { typeAware: true },
  plugins: ["eslint", "typescript", "unicorn", "oxc"],
  rules: {
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error",
  },
});
```

`oxlint-tsgolint` **7.0.2002** tracks TypeScript **7.0.2** (version `7.0.2` + patch `002`). 7.0.2002 is mostly diagnostics, correctness, and performance — no new type-aware rule ids.

### Type-aware rules of thumb

- `options.typeAware` / `typeCheck` are **root-only**. Nested configs that set them error.
- CLI `--type-aware` / `--type-check` override config (including when config is `false`).
- Do **not** combine `--tsconfig` with type-aware (resolution/type programs can diverge).
- Monorepos: build dependents so `.d.ts` exist before type-aware runs.
- Avoid root `tsconfig` `include: ["**/*"]` that builds huge programs; scope includes. Root solution-style configs should use `"files": []`.
- Debug with `OXC_LOG=debug` and `--debug timings` (labels `native` vs `type-aware`).
- TypeScript **7.0+** required. Legacy options such as `baseUrl` are unsupported. `--type-check` reports invalid tsconfig options.
- Type-aware rules accept the same options as typescript-eslint equivalents.
- `--fix` applies to type-aware rules too.
- Editor: prefer `options.typeAware` in the root config; `oxc.typeAware` in VS Code overrides when set. 1.81 fixes an LSP leak that kept tsgolint processes alive.

High-signal rules: `typescript/no-floating-promises`, `typescript/no-misused-promises`, `typescript/no-unsafe-assignment`, `typescript/await-thenable`, `typescript/strict-boolean-expressions`.

## Multi-file analysis

The **import** plugin enables graph-aware rules such as `import/no-cycle`. Enable the plugin explicitly — it is off by default. Oxlint auto-discovers `tsconfig.json` for `compilerOptions.paths`.

## Framework SFCs

Vue / Svelte / Astro / Angular / Ember / Nuxt: lint **script blocks only**. Keep ESLint (or other tools) for templates when required. Solid / React Native extras typically come from JS plugins.
