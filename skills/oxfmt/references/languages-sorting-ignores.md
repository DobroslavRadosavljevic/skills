# Languages, Sorting, and Ignores

## Language engines

Docs split **native Rust** vs **bundled Prettier** (no separate Prettier install). Re-check language-support docs when versions change.

### Native (fast path)

| Language | Extensions (typical) |
| --- | --- |
| JS / JSX | `.js`, `.jsx`, `.mjs`, `.cjs` |
| TS / TSX | `.ts`, `.tsx`, `.mts`, `.cts`, `.d.ts` |
| JSON / JSONC / JSON5 | `.json`, `.jsonc`, `.json5`, named JSON configs (`.babelrc`, `.swcrc`, …) |
| CSS / SCSS / Less | `.css`, `.scss`, `.less`, `.pcss`, `.postcss` |
| GraphQL | `.graphql`, `.gql`, `.graphqls` |
| TOML | `.toml` |
| YAML | `.yml`, `.yaml` |

JS/TS: beta claims **100%** of Prettier JS/TS conformance tests (closest to Prettier v3.8).

YAML has been native since **0.62**. YAML-in-CSS frontmatter uses the native YAML formatter (**0.63**). YAML `tabWidth: 0` is clamped to `1` (**0.68**) so nesting stays valid.

### Prettier-backed (WIP toward native)

| Language | Notes |
| --- | --- |
| HTML | `.html`, `.htm`, `.xhtml` — `<script>` still Prettier, not native |
| Angular | `*.component.html` |
| Vue | `.vue` — **`<script>` is native** JS/TS |
| Svelte | `.svelte` — set `svelte` option; install `svelte` `^5` yourself. `<script>` native |
| Markdown / MDX | `.md`, `.markdown`, `.mdx` |
| Handlebars | `.hbs`, `.handlebars` |
| MJML | `.mjml` — Ember templates; no `.gjs`/`.gts` yet |

These need the **npm** package (Node). The standalone binary skips them.

### Compatibility caveats

- **Astro:** needs Prettier plugins → often **unsupported** today
- **XML/SVG:** not on the language-support table
- Out of scope examples: Prisma, SQL, Shell, Nginx

Compatibility matrix: https://oxc.rs/compatibility.html

Embedded languages follow the same split (native vs Prettier-backed). See https://oxc.rs/docs/guide/usage/formatter/embedded-formatting.html.

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
- Tune nested settings below when defaults are wrong.

### Import sorting (`sortImports`)

Off by default. Pass `true` (Oxfmt defaults) or an options object. Languages: JS/JSX/TS/TSX. Runs on **format**, not TS organize-imports.

Oxfmt default `groups` (schema):

```json
["builtin", "external", ["internal", "subpath"], ["parent", "sibling", "index"], "style", "unknown"]
```

That default does **not** split type vs value imports. Combined names join modifiers then selector with `-`, selector last: `value-builtin`, `type-import`, `type-internal`. **`side_effect` / `side_effect_style` use underscores** (not `side-effect`).

Selectors (most → least specific): `type`, `side_effect_style`, `side_effect`, `style`, `index`, `sibling`, `parent`, `subpath`, `internal`, `builtin`, `external`, `import`.

Modifiers: `side_effect`, `type`, `value`, `default`, `wildcard`, `named`.

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  sortImports: {
    // Perfectionist-like split (example — not Oxfmt's default)
    groups: [
      "type-import",
      ["value-builtin", "value-external"],
      "type-internal",
      "value-internal",
      ["type-parent", "type-sibling", "type-index"],
      ["value-parent", "value-sibling", "value-index"],
      "unknown",
    ],
    newlinesBetween: true,
    ignoreCase: true,
    order: "asc",
    internalPattern: ["~/", "@/", "#"],
    sortSideEffects: false,
  },
});
```

| Option | Default | Role |
| --- | --- | --- |
| `groups` | see JSON above | Order of buckets; nest arrays to merge; `{ newlinesBetween: boolean }` markers override the global gap |
| `customGroups` | `[]` | Named groups; first match wins; higher priority than predefined. `elementNamePattern` is **glob**, not regex |
| `internalPattern` | `["~/", "@/", "#"]` | Globs/prefixes for internal (no `tsconfig` path-alias resolution) |
| `newlinesBetween` | `true` | Blank line between groups |
| `ignoreCase` | `true` | Case-insensitive within a group |
| `order` | `"asc"` | `"asc" \| "desc"` |
| `partitionByComment` | `false` | Comments become sort boundaries |
| `partitionByNewline` | `false` | Existing blank lines become sort boundaries |
| `sortSideEffects` | `false` | Off for security; custom side-effect groups work (0.66+) |

`customGroups.groupName` cannot be a reserved predefined name (`side_effect`, `external`, `unknown`, …). Match with `elementNamePattern` + optional `selector` / `modifiers` (AND). No `tsconfigPath` — list aliases in `internalPattern` or `customGroups`.

Enable import sorting in a **dedicated PR** after the base format migration.

### Tailwind CSS class sorting (`sortTailwindcss`)

Same algorithm as `prettier-plugin-tailwindcss`. **Off by default.** Pass `true` or an options object to enable. Do **not** install `prettier-plugin-tailwindcss` — it is bundled in Oxfmt.

Languages: JS/JSX/TS/TSX, HTML, Vue, Angular, Handlebars, CSS/SCSS/Less, Svelte.

```ts
import { defineConfig } from "oxfmt";

export default defineConfig({
  sortTailwindcss: {
    stylesheet: "./src/index.css", // v4 CSS entry
    // config: "./tailwind.config.ts", // v3
    functions: ["clsx", "cn", "cva", "tv", "tw"],
    attributes: ["classList"],
    preserveWhitespace: false,
    preserveDuplicates: false,
  },
});
```

| Option | Default | Role |
| --- | --- | --- |
| `stylesheet` | Installed Tailwind `theme.css` | **v4** CSS entry (paths relative to the Oxfmt config file) |
| `config` | Auto-find `tailwind.config.js` | **v3** config path (relative to Oxfmt config) |
| `functions` | `[]` | Exact function names whose string args get sorted. **Regex not supported** |
| `attributes` | `[]` | Extra attrs beyond always-sorted `class` / `className` |
| `preserveWhitespace` | `false` | Keep whitespace around classes |
| `preserveDuplicates` | `false` | Keep duplicate class tokens |

Rules of thumb:

1. **v4** → set `stylesheet` to the app CSS that has `@import "tailwindcss"` / `@theme`. Relying on the default `theme.css` often sorts against the wrong theme and fights CLI vs editor.
2. **v3** → set `config` (or keep auto-discovery) — do not also set a v4 `stylesheet` unless you know you need both.
3. List every class helper in `functions`. Exact names only.
4. Put custom props (`:class`, `classList`, design-system props) in `attributes`. Exact match only.
5. Paths resolve **relative to the Oxfmt config file**, not the formatted file. In monorepos, put Tailwind options on the package config that owns the CSS, or use a root path that reaches that stylesheet.
6. Oxfmt does **not** read `.vscode/settings.json` `tailwindCSS.classAttributes` / `tailwindCSS.classFunctions`. Keep those IntelliSense lists in sync by hand.
7. Migrating from Prettier: drop the plugin; map `tailwindConfig` → `config`, `tailwindStylesheet` → `stylesheet`, `tailwindFunctions` → `functions`, `tailwindAttributes` → `attributes`, `tailwindPreserveWhitespace` / `tailwindPreserveDuplicates` → the unprefixed names.

Enable Tailwind sorting in a **dedicated PR** after the base format migration so class-order diffs stay reviewable.

### package.json (`sortPackageJson`)

On by default. Not identical to prettier-plugin-packagejson. Field order: https://github.com/oxc-project/sort-package-json#field-ordering

```ts
sortPackageJson: false;
// or
sortPackageJson: { sortScripts: true }; // scripts alpha; default false
```

### JSDoc (`jsdoc`)

Off by default. Pass `true` or an object. Canonicalizes tag aliases, capitalizes descriptions, wraps long lines, collapses short comments.

| Option | Default |
| --- | --- |
| `addDefaultToDescription` | `true` |
| `bracketSpacing` | `false` (`{string}` → `{ string }`) |
| `capitalizeDescriptions` | `true` |
| `commentLineStrategy` | `"singleLine"` (`"singleLine" \| "multiline" \| "keep"`) |
| `descriptionTag` | `false` |
| `descriptionWithDot` | `false` |
| `keepUnparsableExampleIndent` | `false` |
| `lineWrappingStyle` | `"greedy"` (`"greedy" \| "balance"`) |
| `preferCodeFences` | `false` |
| `separateReturnsFromParam` | `false` |
| `separateTagGroups` | `false` |

### Svelte (`svelte`)

Off by default. `true` or object enables `.svelte`. Setting `true` **resets** inherited svelte options (useful as `false` in overrides). Requires installed `svelte` (`svelte/compiler`); Oxfmt does not bundle it.

| Option | Default |
| --- | --- |
| `allowShorthand` | `true` |
| `indentScriptAndStyle` | `true` |
| `sortOrder` | `"options-scripts-markup-styles"` or `"none"` |

## Ignore files

| Mechanism | Scope | Notes |
| --- | --- | --- |
| `ignorePatterns` in config | That config only | Preferred for new projects. **Cannot** format matched files even if named on the CLI |
| `.prettierignore` / `--ignore-path` | Global | Fine during migration. Also cannot force-format listed files |
| `.gitignore` (+ parents / exclude) | Walk targets | Explicit **file** args can still force-format. Directory args still honor gitignore (`oxfmt dist` skips ignored `dist/`; `oxfmt dist/index.js` formats that file) |
| CLI `!` excludes | Global | Quote in shells |
| Always skipped | VCS dirs, `node_modules`, lockfiles | `--with-node-modules` to include |

`ignorePatterns` uses gitignore syntax, rooted at the config file directory. Patterns containing `..`, or that can only match **outside** that directory, are a **configuration error**.

Moving `.prettierignore` → `ignorePatterns` can change behavior under nested configs (patterns become config-scoped).

Quoted globs are **not** expanded by the shell; Oxfmt walks them with gitignore applied. Unquoted `dist/**/*.js` is expanded by the shell into explicit files, which bypasses gitignore.

## Inline ignore comments

JS/TS:

```ts
// oxfmt-ignore
const ugly = {a:1,b:2}

const also = { a: 1 }; // oxfmt-ignore
```

Also: `/* oxfmt-ignore */` and Prettier’s `prettier-ignore` (needed for many non-JS regions and Vue template/style). Trailing comments and JSX `{/* oxfmt-ignore */}` work.

TOML: no ignore comments.

## Nested configs

Prefer per-package `oxfmt.config.ts` (or `.oxfmtrc.json` if already present), or one root config with `overrides` globs. Use `--disable-nested-config` when a single root config is enough and nested search is wasteful.
