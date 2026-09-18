# Configuration (Intlayer 9.5)

Files: `intlayer.config.ts` | `.js` | `.mjs` | `.cjs` | `.json` | `.json5` | `.jsonc` | `.intlayerrc`.

This page is the knob map. Setup defaults live in [setup-tanstack-start.md](setup-tanstack-start.md). Do not copy the giant “all options” example into an app — set only what you need.

Defaults below follow `@intlayer/types@9.5.4` plus the live configuration page. When those disagree, prefer types + the live page and report it.

## `internationalization`

| Field | Default | Notes |
| --- | --- | --- |
| `locales` | `[Locales.ENGLISH]` | Supported locales |
| `defaultLocale` | `Locales.ENGLISH` | Fallback |
| `requiredLocales` | `[]` | Must exist in every dictionary; empty + `strict` ⇒ all locales required |
| `strictMode` | `"inclusive"` | `strict` (error on missing/undeclared) · `inclusive` (warn) · `loose` |

## `routing`

| Field | Default | Notes |
| --- | --- | --- |
| `mode` | `"prefix-no-default"` | `prefix-no-default` · `prefix-all` · `no-prefix` · `search-params` |
| `enableProxy` | `undefined` (auto) | See [routing-ssr-seo.md](routing-ssr-seo.md). v9 notes and some Vite plugin pages still say `true`. |
| `storage` | `["cookie", "header"]` | Also `localStorage`, `sessionStorage`, or mixed array |
| `basePath` | `""` | App URL prefix |
| `domains` | unset | Host → locale (no path prefix; URLs become absolute) |
| `rewrite` | unset | Locale-specific path aliases |

Cookie name default remains `INTLAYER_LOCALE`; locale header default `x-intlayer-locale`.

On Start, prefer rewrite helpers that exist in `intlayer/routing` for this stack. `nextjsRewrite` is Next-oriented.

## `dictionary`

| Field | Default | Notes |
| --- | --- | --- |
| `importMode` | `"static"` | `static` · `dynamic` (Suspense) · `fetch` (live sync; falls back to dynamic). Rewrites `useIntlayer` at build. Ignored if `build.optimize` is off. Keys must be static. Does not change `getIntlayer` / `getIntlayerAsync`. |
| `fill` | `true` | AI fill strategy: boolean, path pattern, or per-locale object |
| `location` | `"local"` | `local` · `remote` · `hybrid` · plugin label |
| `format` | `"intlayer"` | `intlayer` · `icu` · `i18next` · `vue-i18n` · `po` — default message format |
| `contentAutoTransformation` | `false` | Markdown → `md()`, HTML → `html()`, `{{var}}` → `insert()` |

Per-file `fill` overrides this. See [content-dictionaries.md](content-dictionaries.md).

## `content`

| Field | Default | Notes |
| --- | --- | --- |
| `contentDir` | `["."]` | Where `.content.*` live. Start apps: set `["src"]`. |
| `codeDir` | `["."]` | Source for compiler / optimize |
| `fileExtensions` | `.content.{ts,js,json,…}` | |
| `excludedPath` | `node_modules`, `.intlayer`, `.tanstack`, … | |
| `watch` | true in development | Rebuild dictionaries on change |
| `formatCommand` | unset | Formatter for generated `.content` files (`"{{file}}"` placeholder). Prefer the project's formatter via `bunx`. |

## `compiler`

Default **off**. Bundled into `intlayer()` when enabled.

| Field | Default | Notes |
| --- | --- | --- |
| `enabled` | `false` | `false` · `true` · `"build-only"` (skip in dev) |
| `output` | unset | Function or template. `./` relative to the component; `/` relative to project root. `{{locale}}` splits per locale. |
| `saveComponents` | `false` | `true` rewrites source on disk (one-shot extract). `false` transforms in memory only. |
| `noMetadata` | `false` | Emit content only (i18next / ICU JSON) |
| `dictionaryKeyPrefix` | `""` | Prefix extracted keys |

Requires `compiler.output` when enabling. Details: [compiler-compat.md](compiler-compat.md).

## `build`

| Field | Default | Notes |
| --- | --- | --- |
| `mode` | `"auto"` | `auto` prepares `.intlayer` during app build; `manual` needs `intlayer build` |
| `optimize` | `undefined` (auto) | Auto = on in production builds. Master switch for import-mode rewrite, minify, purge, chunk grouping, preload |
| `minify` | `false` | Ignored if `optimize` is off. Field-renaming skipped if `editor.enabled` |
| `purge` | `false` | Drop unused keys; ignored if `optimize` is off |
| `chunkGrouping` | `true` | 9.5: group per-locale dynamic chunks by code-split boundary (one request per lazy route, not per dictionary). Client production only; `importMode: "dynamic"` only |
| `dictionariesPreload` | `true` | 9.5: start the locale fetch with the chunk that needs it (hover preload / `import()`), so readers often render without Suspense. Client only; collections/variants stay on-demand |
| `outputFormat` | `["cjs", "esm"]` | Generated dictionary modules |
| `checkTypes` | `false` | Typecheck during Intlayer build |
| `cache` | `true` | Dictionary compile cache |
| `traversePattern` | JS/TS globs, skip `node_modules` | Limit optimize/purge/minify file walk |

Leave `chunkGrouping` / `dictionariesPreload` at defaults unless a bundler plugin order problem appears. Disable grouping only to let the bundler chunk dictionaries itself.

## `editor` / CMS

| Field | Default | Notes |
| --- | --- | --- |
| `enabled` | `false` | Visual editor |
| `applicationURL` | `""` | Origin of the app (required when editor/CMS is used) |
| `port` / `editorURL` | `8000` / `http://localhost:8000` | Local editor |
| `cmsURL` | `https://app.intlayer.org` | Self-host override |
| `backendURL` | `https://back.intlayer.org` | API + analytics ingest |
| `clientId` / `clientSecret` | unset | Dashboard project credentials. `clientId` also gates analytics. |
| `liveSync` | `true` (types) | Runtime CMS updates. Confirm against the installed package if behavior disagrees. |
| `dictionaryPriorityStrategy` | `"local_first"` | Or `"distant_first"` |
| `liveSyncPort` / `liveSyncURL` | `4000` / localhost | Remote live-sync override |

## `analytics`

Requires `@intlayer/analytics` **and** `editor.clientId`. If the package is missing, config resolves `enabled` to `false` and the integration tree-shakes.

| Field | Default | Notes |
| --- | --- | --- |
| `enabled` | `true` when the package is installed | 9.3.3+: on by install |
| `flushInterval` | `20000` | Batch period (ms) |
| `sampleRate` | `1` | 0–1 fraction of sessions |

## `ai`

Used by `intlayer fill` / `doc translate` / extract.

| Field | Notes |
| --- | --- |
| `provider` | `openai` (default), `anthropic`, `mistral`, `deepseek`, `gemini`, `ollama`, `openrouter`, `alibaba`, `fireworks`, `groq`, `huggingface`, `bedrock`, `googlevertex`, `googlegenerativeai`, `togetherai`, `lmstudio`, `moonshotai`, … |
| `model` | Provider model id |
| `apiKey` | From env |
| `applicationContext` | Extra prompt context (plus per-dictionary `description`) |
| `baseURL` | Custom endpoint |
| `dataSerialization` | `json` (default) or `toon` (fewer tokens, less consistent) |
| `temperature` | Optional sampling |

## `log` / `system` / `schemas` / `plugins`

- `log.mode`: `default` · `verbose` · `disabled`. Prefix default `[intlayer]`.
- `system.*`: `.intlayer/dictionary`, `types`, `unmerged_dictionary`, `remote_dictionary`, `dynamic_dictionary`, `fetch_dictionary`, `main`, `config`, `cache`, `tmp` — leave defaults unless you own a custom layout.
- `schemas`: optional Zod (or compatible `safeParse`) maps for dictionary validation.
- `plugins`: e.g. `syncJSON` / `loadJSON` from `@intlayer/sync-json-plugin` — see [compiler-compat.md](compiler-compat.md).
