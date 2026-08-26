# Configuration (Intlayer 9.4)

Files: `intlayer.config.ts` | `.js` | `.mjs` | `.cjs` | `.json` | `.json5` | `.jsonc` | `.intlayerrc`.

This page is the knob map. Setup defaults live in [setup-tanstack-start.md](setup-tanstack-start.md). Do not copy the giant “all options” example into an app — set only what you need.

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
| `enableProxy` | `undefined` (auto) | See [routing-ssr-seo.md](routing-ssr-seo.md). Older v9 notes said `true`. |
| `storage` | `["cookie", "header"]` | Also `localStorage`, `sessionStorage`, or mixed array |
| `basePath` | `""` | App URL prefix |
| `domains` | unset | Host → locale (no path prefix; URLs become absolute) |
| `rewrite` | unset | Locale-specific path aliases |

Cookie name default remains `INTLAYER_LOCALE`; locale header default `x-intlayer-locale`.

## `dictionary`

| Field | Default | Notes |
| --- | --- | --- |
| `importMode` | `"static"` | `static` · `dynamic` (Suspense) · `fetch` (live sync; falls back to dynamic). Rewrites `useIntlayer` at build. Ignored if `build.optimize` is off. Keys must be static. Does not change `getIntlayer` / `getIntlayerAsync`. |
| `fill` | `true` | AI fill strategy: boolean, path pattern, or per-locale object |
| `location` | `"local"` | `local` · `remote` · `hybrid` · plugin label |
| `format` | `"intlayer"` | `intlayer` · `icu` · `i18next` · `vue-i18n` · `po` — default message format |
| `contentAutoTransformation` | `false` | e.g. Markdown → HTML |

Per-file `fill` overrides this. See [content-dictionaries.md](content-dictionaries.md).

## `content`

| Field | Default | Notes |
| --- | --- | --- |
| `contentDir` | `["."]` | Where `.content.*` live. Start apps: set `["src"]`. |
| `codeDir` | `["."]` | Source for compiler / optimize |
| `fileExtensions` | `.content.{ts,js,json,…}` | |
| `excludedPath` | `node_modules`, `.intlayer`, … | |
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
| `optimize` | true in production | Master switch for import-mode rewrite, minify, purge |
| `minify` | `false` | Ignored if `optimize` is off **or** `editor.enabled` is true |
| `purge` | `false` | Drop unused keys; ignored if `optimize` is off |
| `outputFormat` | `["cjs", "esm"]` | Generated dictionary modules |
| `checkTypes` | `false` | Typecheck during Intlayer build |

## `editor` / CMS

| Field | Default | Notes |
| --- | --- | --- |
| `enabled` | `false` | Visual editor |
| `applicationURL` | `""` | Origin of the app (required when editor/CMS is used) |
| `port` / `editorURL` | `8000` / `http://localhost:8000` | Local editor |
| `cmsURL` | `https://app.intlayer.org` | Self-host override |
| `backendURL` | `https://back.intlayer.org` | API + analytics ingest |
| `clientId` / `clientSecret` | unset | Dashboard project credentials. `clientId` also gates analytics. |
| `liveSync` | `false` | Runtime CMS updates |

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
| `provider` | `openai` (default), `anthropic`, `mistral`, `deepseek`, `gemini`, `ollama`, `openrouter`, `alibaba`, `fireworks`, `groq`, `huggingface`, `bedrock`, `googlevertex`, `togetherai`, `lmstudio`, `moonshotai`, … |
| `model` | Provider model id |
| `apiKey` | From env |
| `applicationContext` | Extra prompt context (plus per-dictionary `description`) |
| `baseURL` | Custom endpoint |
| `dataSerialization` | `json` (default) or `toon` (fewer tokens, less consistent) |

## `log` / `system` / `schemas` / `plugins`

- `log.mode`: `default` · `verbose` · `disabled`. Prefix default `[intlayer]`.
- `system.*`: `.intlayer/dictionary`, `types`, `unmerged_dictionary`, `main`, `config`, `cache` — leave defaults unless you own a custom layout.
- `schemas`: optional Zod (or compatible) maps for dictionary validation.
- `plugins`: e.g. `syncJSON` / `loadJSON` from `@intlayer/sync-json-plugin` — see [compiler-compat.md](compiler-compat.md).
