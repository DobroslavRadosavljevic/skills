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

### Tailwind CSS class sorting (`sortTailwindcss`)

Same algorithm as `prettier-plugin-tailwindcss`. **Off by default.** Pass `true` or an options object to enable. Do **not** install `prettier-plugin-tailwindcss` — it is bundled in Oxfmt.

Languages: JS/JSX/TS/TSX, HTML, Vue, Angular, Handlebars, CSS/SCSS/Less, Svelte.

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  // Minimal: enable with defaults
  // sortTailwindcss: true,

  // Recommended for real Tailwind apps
  sortTailwindcss: {
    // Tailwind v4 — path to the CSS entry that imports Tailwind / @theme
    stylesheet: "./src/index.css",
    // Tailwind v3 — use `config` instead (auto-finds tailwind.config.* if omitted)
    // config: "./tailwind.config.ts",
    functions: ["clsx", "cn", "cva", "tv", "tw"],
    attributes: ["classList"], // extras beyond class / className
    preserveWhitespace: false,
    preserveDuplicates: false,
  },
});
```

| Option | Default | Role |
| --- | --- | --- |
| `stylesheet` | Installed Tailwind `theme.css` | **v4** CSS entry (paths relative to the Oxfmt config file) |
| `config` | Auto-find `tailwind.config.js` | **v3** config path (relative to Oxfmt config) |
| `functions` | `[]` | Exact function names whose string args get sorted (`clsx`, `cn`, …) |
| `attributes` | `[]` | Extra attrs beyond always-sorted `class` / `className` |
| `preserveWhitespace` | `false` | Keep whitespace around classes |
| `preserveDuplicates` | `false` | Keep duplicate class tokens |

Rules of thumb:

1. **v4** → set `stylesheet` to the app CSS that has `@import "tailwindcss"` / `@theme`. Relying on the default `theme.css` often sorts against the wrong theme and fights CLI vs editor.
2. **v3** → set `config` (or keep auto-discovery) — do not also set a v4 `stylesheet` unless you know you need both.
3. List every class helper in `functions` (`cn`, `clsx`, `cva`, `tv`, …). Exact names only — **regex not supported**.
4. Put custom props (`:class`, `classList`, design-system props) in `attributes`. Exact match only.
5. Paths resolve **relative to the Oxfmt config file**, not the formatted file. In monorepos, put Tailwind options on the package config that owns the CSS, or use a root path that reaches that stylesheet.
6. Oxfmt does **not** read `.vscode/settings.json` `tailwindCSS.classAttributes` / `tailwindCSS.classFunctions`. Keep those IntelliSense lists in sync with `attributes` / `functions` by hand (or import settings from a TS config if desired).
7. Migrating from Prettier: drop the plugin; map `tailwindConfig` → `config`, `tailwindStylesheet` → `stylesheet`, `tailwindFunctions` → `functions`, `tailwindAttributes` → `attributes`, `tailwindPreserveWhitespace` / `tailwindPreserveDuplicates` → the unprefixed names.

Enable Tailwind sorting in a **dedicated PR** after the base format migration so class-order diffs stay reviewable.

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
