# Compiler, bundle optimization, compat adapters

## Compiler (opt-in)

v9+ default: `compiler.enabled: false`. The Vite `intlayer()` plugin registers `intlayerCompiler` when `enabled` is `true` or `"build-only"` **and** `compiler.output` is set.

What it does: extract inline copy from components into dictionaries at transform time (optional on-disk rewrite).

```ts
const config: IntlayerConfig = {
  compiler: {
    enabled: true, // or "build-only" to skip during `vite dev`
    output: ({ fileName }) => `./${fileName}.content.ts`,
    saveComponents: false,
  },
};
```

| `output` style | Effect |
| --- | --- |
| `({ fileName, extension }) => \`./${fileName}${extension}\`` | Multilingual `.content.ts` next to the component |
| `({ key, locale }) => \`/locales/${locale}/${key}.content.json\`` | Central per-locale JSON (`/` = project root) |
| Template strings with `{{fileName}}`, `{{key}}`, `{{locale}}`, `{{extension}}` | Same as the function form |

`saveComponents: true` rewrites the component on disk (one-shot extract, then you can remove the compiler). `false` keeps source intact and injects `useIntlayer()` only in the build graph.

`noMetadata: true` emits bare messages (i18next / ICU JSON). `dictionaryKeyPrefix` prefixes extracted keys.

Standalone `intlayerCompiler()` still exists for plugin order; with `intlayer()` it is deduped. `intlayer extract` is the CLI equivalent for pulling strings into a nearby `.content` file without leaving the compiler on.

## Bundle optimization

Master switch: `build.optimize` (default **true in production**).

| Knob | Default | Notes |
| --- | --- | --- |
| `dictionary.importMode` | `static` | See below. Ignored if optimize is off. |
| `build.minify` | `false` | Shrink dictionaries. **Ignored if `editor.enabled`**. |
| `build.purge` | `false` | Drop unused keys. Ignored if optimize is off. |
| `build.outputFormat` | `["cjs","esm"]` | Generated module shape |
| `build.mode` | `auto` | `manual` ⇒ you run `intlayer build` |

`importMode`:

| Mode | Behaviour |
| --- | --- |
| `static` | Build-time static import (`useIntlayer` → `useDictionary`) |
| `dynamic` | Dynamic import + Suspense (`useDictionaryDynamic`) |
| `fetch` | Live/CMS fetch; falls back to `dynamic` |

Requires `@intlayer/babel` / `@intlayer/swc` (wired by the Vite/Next plugins). **Dictionary keys in `useIntlayer("key")` must be static string literals** for the rewrite. Per-file `importMode` on a dictionary overrides the global default. `getIntlayer` / `getIntlayerAsync` / `useDictionary` are not rewritten by importMode; `getIntlayerAsync` has its **own** rewrite to per-locale chunks.

Do not index content objects with runtime keys (`content.status[type]`). That marks the branch opaque for minify/purge. Use `select()` / `enu()` / `cond()` / `gender()` and call the node.

## 9.4 `getIntlayerAsync` vs `getIntlayer`

| | `getIntlayer` | `getIntlayerAsync` |
| --- | --- | --- |
| Returns | content | `Promise` of content |
| Dictionary | merged, all locales | requested locale chunk only (optimized builds) |
| Use | sync render / legacy | `head`, loaders, server functions |

Without optimize plugins, async falls back to the sync registry. Concurrent loads of the same chunk are coalesced.

## Compat adapter packages (v9)

Drop-in APIs that keep `useTranslation` / next-intl / vue-i18n call sites but resolve through `@intlayer/core/messageFormat` (ICU `{{var}}`, `{v, number, percent}`, `plural`/`enu`/`gender`/`insert`, numbered XML tags).

Packages include: `@intlayer/i18next`, `@intlayer/react-i18next`, `@intlayer/next-intl`, `@intlayer/react-intl`, `@intlayer/next-i18next`, `@intlayer/vue-i18n`, `@intlayer/lingui`.

**Start default remains `react-intlayer`.** Use adapters only when migrating an existing i18n library without rewriting call sites.

```ts
import { useTranslation } from "@intlayer/react-i18next";
```

Or rewrite imports at build time via `/plugin` (Vite example):

```ts
import { reactI18nextCallerConfig } from "@intlayer/react-i18next/plugin";
import { intlayer } from "vite-intlayer";

intlayer({ compatCallers: [reactI18nextCallerConfig] });
```

Runtime parser interpolates MessageFormat, nested nodes, and numbered tags (`<1>children</1>`).

## `syncJSON` / `loadJSON` (keep existing JSON)

Package: `@intlayer/sync-json-plugin`. Bridge i18next / next-intl / vue-i18n JSON **without** changing the render runtime. CMS/AI fill/test work on those files. Visual editor and advanced insertions/plurals of the *other* library are **not** fully supported.

```ts
import { syncJSON, loadJSON } from "@intlayer/sync-json-plugin";

plugins: [
  loadJSON({
    source: ({ key }) => `./src/**/${key}.i18n.json`,
    locale: Locales.ENGLISH,
    priority: 1,
    format: "intlayer",
  }),
  syncJSON({
    source: ({ key, locale }) => `./locales/${locale}/${key}.json`,
    format: "icu", // or "i18next" | "intlayer"
    priority: 0,
    splitKeys: false, // true: each top-level JSON key → its own dictionary
  }),
],
```

`syncJSON` reads and **writes back**. `loadJSON` only reads. `intlayer fill` then updates missing keys in those JSON files.

`dictionary.format` (`intlayer` | `icu` | `i18next` | `vue-i18n` | `po`) is the project-wide default when not set per plugin.

## Message format runtime

Compat + ICU paths share `@intlayer/core/messageFormat`:

- `{{var}}`, ICU `{v, number, percent}`, bare `{var}`
- Nested `insert()`, `plural()` (CLDR), `enu()`, `gender()`, HTML, arrays, callable nodes
- Tokenized tags including numbered tags for rich text

For new Start apps, declare native Intlayer nodes (`t`, `plural`, `enu`, …) rather than wrapping another i18n runtime.
