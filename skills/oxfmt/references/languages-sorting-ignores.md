# Languages, Sorting, and Ignores

## Language engines

Docs split **native Rust** vs **bundled Prettier** (no separate Prettier install). Re-check language-support docs when versions change.

### Native (fast path)

| Language | Extensions (typical) |
| --- | --- |
| JS / JSX | `.js`, `.jsx`, `.mjs`, `.cjs` |
| TS / TSX | `.ts`, `.tsx`, `.mts`, `.cts`, `.d.ts` |
| JSON / JSONC / JSON5 | `.json`, `.jsonc`, `.json5`, named JSON configs |
| CSS / SCSS / Less | `.css`, `.scss`, `.less`, `.pcss`, `.postcss` |
| GraphQL | `.graphql`, `.gql`, `.graphqls` |
| TOML | `.toml` |

JS/TS: beta claims **100%** of Prettier JS/TS conformance tests (closest to Prettier v3.8).

### Prettier-backed (WIP toward native)

| Language | Notes |
| --- | --- |
| HTML / Angular | Angular often `*.component.html`; plain `.html` may need overrides |
| Vue | Script blocks use **native** JS/TS |
| Svelte | Set `svelte` option; install `svelte` yourself |
| Markdown / MDX | |
| YAML | Verify current page — native YAML work has landed in some minors |
| Handlebars / MJML | Ember `.hbs`; no `.gjs`/`.gts` yet |

### Compatibility caveats

- **Astro:** needs Prettier plugins → often **unsupported** today
- **XML/SVG:** planned around Oxfmt 1.0
- Out of scope examples: Prisma, SQL, Shell, Nginx

Compatibility matrix: https://oxc.rs/compatibility.html

## Sorting

Docs: https://oxc.rs/docs/guide/usage/formatter/sorting.html

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: true,
  sortTailwindcss: true,
  sortPackageJson: true,
  jsdoc: true,
});
```

- These replace common Prettier plugins — do not install the Prettier plugins alongside Oxfmt.
- `sortPackageJson` is **on by default** — large `package.json` diffs on first run; set `false` if the team wants hand-ordered keys.
- Tune each option’s nested settings via the config file reference when defaults are wrong.

## Ignore files

| Mechanism | Scope | Notes |
| --- | --- | --- |
| `ignorePatterns` in config | That config only | Preferred for new projects |
| `.prettierignore` / `--ignore-path` | Global | Fine during migration |
| `.gitignore` (+ parents / exclude) | Global | Explicit path args can still force-format |
| CLI `!` excludes | Global | Quote in shells |
| Always skipped | VCS dirs, `node_modules`, lockfiles | `--with-node-modules` to include |

Moving `.prettierignore` → `ignorePatterns` can change behavior under nested configs (patterns become config-scoped).

## Inline ignore comments

JS/TS:

```ts
// oxfmt-ignore
const ugly = {a:1,b:2}

const also = { a: 1 }; // oxfmt-ignore
```

Also: `/* oxfmt-ignore */` and Prettier’s `prettier-ignore` (needed for many non-JS regions and Vue template/style).

TOML: no ignore comments.

## Nested configs

Prefer per-package `oxfmt.config.ts` (or `.oxfmtrc.json` if already present), or one root config with `overrides` globs. Use `--disable-nested-config` when a single root config is enough and nested search is wasteful.
