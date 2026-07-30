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

## Plugins

| Plugin | Default on | Ecosystem source |
| --- | --- | --- |
| `eslint` | Yes | ESLint core |
| `typescript` | Yes | typescript-eslint (+ type-aware via tsgolint) |
| `unicorn` | Yes | eslint-plugin-unicorn |
| `oxc` | Yes | Oxc / deepscan-style |
| `react` | No | React, hooks, refresh (+ experimental react-compiler) |
| `react-perf` | No | react-perf |
| `nextjs` | No | `@next/eslint-plugin-next` |
| `import` | No | eslint-plugin-import / import-x (multi-file / `no-cycle`) |
| `jsdoc` | No | eslint-plugin-jsdoc |
| `jsx-a11y` | No | jsx-a11y |
| `node` | No | eslint-plugin-n |
| `promise` | No | eslint-plugin-promise |
| `jest` / `vitest` | No | test plugins |
| `vue` | No | Vue script-tag rules |

**Critical:** `"plugins": [...]` **replaces** the default set. Always re-list defaults you still want.

Enable via config or CLI (`--import-plugin`, `--react-plugin`, …).

### JS plugins (`jsPlugins`)

Alpha — **not under semver**. ESLint v9+ style JS plugins mostly supported. Reserved native names (`react`, `typescript`, `import`, …) need aliases. Do not expect type-aware or custom template parsers (Vue/Svelte templates) yet.

## Rule severity and naming

Severities: `"off"` / `"allow"`, `"warn"`, `"error"` / `"deny"`, or `[severity, options]`.

Unique ESLint core names may omit the prefix (`no-console` ≡ `eslint/no-console`). Plugin rules use `plugin/rule` (`import/no-cycle`, `typescript/no-floating-promises`).

```sh
bunx oxlint --rules   # list available rules
```

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

Unused directives: `--report-unused-disable-directives` or `options.reportUnusedDisableDirectives`.

## Type-aware linting

Architecture: Oxlint (Rust) owns files/config/reporting; **tsgolint** (Go / typescript-go) runs type-aware rules.

```sh
bun add -D oxlint oxlint-tsgolint@latest
bunx oxlint --type-aware
# optional experimental TS diagnostics in the same run:
bunx oxlint --type-aware --type-check
```

```json
{
  "options": { "typeAware": true },
  "plugins": ["eslint", "typescript", "unicorn", "oxc"],
  "rules": {
    "typescript/no-floating-promises": "error",
    "typescript/no-misused-promises": "error"
  }
}
```

### Type-aware rules of thumb

- `options.typeAware` / `typeCheck` are **root-only**.
- CLI `--type-aware` / `--type-check` override config.
- Do **not** combine `--tsconfig` with type-aware (resolution/type programs can diverge).
- Monorepos: build dependents so `.d.ts` exist before type-aware runs.
- Avoid root `tsconfig` `include: ["**/*"]` that builds huge programs; scope includes.
- Debug with `OXC_LOG=debug` and `--debug timings`.
- `oxlint-tsgolint` versioning tracks TypeScript 7.x (e.g. `7.0.2001` → TS 7.0.2 + patch).

## Multi-file analysis

The **import** plugin enables graph-aware rules such as `import/no-cycle`. Enable the plugin explicitly — it is off by default.

## Framework SFCs

Vue / Svelte / Astro: lint **script blocks only**. Keep ESLint (or other tools) for templates when required.
