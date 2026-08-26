# Content Dictionaries

## Declaration files

Default extensions: `.content.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,json5,md,mdx,yaml,yml}`.

Scan roots come from `content.contentDir` (config default `["."]`; for TanStack Start set `["src"]`).

Co-locate dictionaries with features. Ignore them from the router via `routeFileIgnorePattern` (see setup reference).

Optional dictionary metadata: `title`, `description`, `tags`, `fill`, `location` (`local` | `remote` | `hybrid` | plugin label). `description` plus `ai.applicationContext` guides `intlayer fill`.

## Basic dictionary

```ts
import { t, type Dictionary } from "intlayer";

const appContent = {
  key: "app",
  content: {
    title: t({
      en: "Home",
      fr: "Accueil",
      es: "Inicio",
    }),
    links: {
      about: t({ en: "About", fr: "À propos", es: "Acerca de" }),
    },
  },
} satisfies Dictionary;

export default appContent;
```

- `t()` belongs in **declarations**, not as a runtime global translate call in components.
- Export `default` and keep a unique `key` per dictionary (collections share `key` + `item`).
- JSON declarations use `"$schema": "https://intlayer.org/schema.json"` and `nodeType` objects (`translation`, `condition`, `enumeration`, …).

## Node helpers

Import from `intlayer`. Nesting is allowed except where noted.

| Helper | Use |
| --- | --- |
| `t` / `getTranslation` | Locale map |
| `plural` | CLDR categories (`zero`/`one`/`two`/`few`/`many`/`other`) via `Intl.PluralRules`. Requires `other`. Call as `node(count)` or `node({ count, …placeholders })`. **Cannot wrap child nodes** — put `plural` *inside* `t`, not `t` inside `plural`. |
| `enu` | Custom numeric ranges (`"0"`, `">1"`, `"<-1"`, `fallback`) |
| `cond` | Boolean `true` / `false` / `fallback` |
| `gender` | `male` / `female` / `fallback` |
| `select` | Arbitrary string discriminant (status, plan, role). ICU `{value, select, …}`. Call as `node("draft")`. Prefer over `node[key]`. |
| `insert` | `{{placeholder}}` substitution (wrap `t(...)` for multilingual) |
| `nest` | Reference another dictionary: `nest("other-key")` or `nest("other-key", "path")` |
| `md` | Markdown (string, `file()`, or `t({ en: md(...) })`) |
| `html` | HTML string or `html(file("./x.html"))` |
| `file` | Track a sidecar file (`file("./copy.md")`) |

Prefer `plural` for grammatical pluralization (ru/pl/ar/…). Prefer `enu` for ad-hoc numeric buckets. Prefer `select` for free-form strings (never `content[runtimeKey]` — that blocks minify/purge).

```ts
import { enu, insert, md, nest, plural, select, t, type Dictionary } from "intlayer";

export default {
  key: "inbox",
  content: {
    summary: t({
      en: plural({
        one: "{{count}} opening",
        other: "{{count}} openings",
      }),
      ru: plural({
        one: "{{count}} вакансия",
        few: "{{count}} вакансии",
        many: "{{count}} вакансий",
        other: "{{count}} вакансий",
      }),
    }),
    cars: enu({
      "0": t({ en: "No cars", fr: "Aucune voiture" }),
      "1": t({ en: "One car", fr: "Une voiture" }),
      ">1": t({ en: "Several cars", fr: "Plusieurs voitures" }),
      fallback: t({ en: "Cars", fr: "Voitures" }),
    }),
    greeting: insert(t({ en: "Hello, {{name}}", fr: "Bonjour, {{name}}" })),
    status: select({
      draft: t({ en: "Draft", fr: "Brouillon" }),
      published: t({ en: "Live", fr: "En ligne" }),
      fallback: t({ en: "Unknown", fr: "Inconnu" }),
    }),
    docs: nest("docs", "title"),
    body: md("## Title\n\nBody"),
  },
} satisfies Dictionary;
```

Runtime:

```tsx
const { summary, greeting, cars, status } = useIntlayer("inbox");
summary(3);
greeting({ name: "Ada" });
cars(2);
status("draft"); // not status["draft"]
```

Composite arrays and async fetches in declarations are valid (`["Hi", " ", getName()]`, `fetch(url).then(...)`). JSX nodes are allowed in `react-intlayer` dictionaries. `dictionary.contentAutoTransformation` (default `false`) can turn Markdown into HTML at interpret time.

Per-dictionary overrides: `format` (`intlayer` | `icu` | `i18next`), `importMode`, `locale` (per-locale file — each field is already that locale, no `t()` needed), `schema`. Without `fallback` on `select`/`cond`/`gender`, only declared cases type-check; with `fallback`, any value is accepted.

## Client consumption

```tsx
import { useIntlayer } from "react-intlayer";

function Home() {
  const content = useIntlayer("app");
  return <h1>{content.title}</h1>;
}
```

Second argument is a **locale string** (legacy) or a **selector object** (preferred):

```ts
useIntlayer("faq", { item: 2 });
useIntlayer("hero-banner", { variant: "black_friday" });
useIntlayer("product-copy", {
  locale: "fr",
  variant: { id: "prod_123", category: "books" },
});
```

Related hooks (same package): `useDictionary` (pass a dictionary object), `useDictionaryDynamic` (Suspense + key), `useDictionaryAsync` (promise map). `dictionary.importMode` rewrites `useIntlayer` toward these at build time — see [compiler-compat.md](compiler-compat.md).

## Server / non-hook consumption (9.4)

```ts
import { getIntlayerAsync } from "intlayer";

const content = await getIntlayerAsync("app", locale);
// selectors work the same: await getIntlayerAsync("faq", { item: 2, locale: "fr" })
```

Use **`getIntlayerAsync`** in `createServerFn`, async route `head`, loaders, and any non-React context so optimized builds load **only the requested locale chunk** (`.intlayer/dynamic_dictionaries/`). Sync `getIntlayer` still works but pulls the merged all-locales dictionary.

Without `@intlayer/babel` / `@intlayer/swc` (unoptimized build), `getIntlayerAsync` falls back to the sync registry — same content, no per-locale split.

`getDictionaryAsync` is the lower-level API the plugins rewrite `getIntlayerAsync` into. Prefer `getIntlayerAsync` at call sites.

Use `useIntlayer` only under `IntlayerProvider`.

## String attributes

Content nodes are not always plain strings. For `alt`, `title`, `aria-label`, `href` text, etc.:

```tsx
<img alt={content.image.value} src={content.image.src.value} />
{/* or .toString() / String(...) */}
```

## Collections

Same `key`, different `item` numbers across files:

```ts
// faq.1.content.ts
export default {
  key: "faq",
  item: 1,
  content: {
    question: t({ en: "What is Intlayer?", fr: "Qu'est-ce qu'Intlayer ?" }),
    answer: t({ en: "An i18n toolkit.", fr: "Une boîte à outils i18n." }),
  },
} satisfies Dictionary;
```

```ts
const allFaqs = useIntlayer("faq"); // array
const one = useIntlayer("faq", { item: 2 });
```

## Variants (string + object)

9.1 merged former **dynamic records** (`meta`) into **object `variant`**. Do not use `meta`.

```ts
export default {
  key: "hero-banner",
  variant: "default",
  content: {
    control: t({ en: "Welcome", fr: "Bienvenue" }),
    black_friday: t({ en: "Shop now", fr: "Acheter maintenant" }),
  },
} satisfies Dictionary;
```

```ts
const banner = useIntlayer("hero-banner", { variant: "black_friday" });
```

Object variants (CMS / product records) may need Suspense when fetched dynamically:

```ts
export default {
  key: "product-copy",
  variant: { id: "prod_123", category: "books" },
  content: { title: t({ en: "Clean Code", fr: "Code Propre" }) },
} satisfies Dictionary;

const product = useIntlayer("product-copy", {
  variant: { id: "prod_123", category: "books" },
});
```

A key may declare both dimensions. Selector order: **variant → item**. `{ variant: "promo" }` returns every promo item as an array; add `{ item: 2 }` to narrow.

For A/B assignment without flicker, use `@intlayer/analytics` `getVariant` — see [cli-cms-ai.md](cli-cms-ai.md).

## Per-locale files and `fill`

Per-dictionary `fill` (overrides `dictionary.fill`):

```ts
fill: false
fill: "./translations/about.content.json"
fill: "/messages/{{locale}}/{{key}}/{{fileName}}.content.json"
fill: { en: true, fr: "./example.fr.content.json", es: false }
```

Run `bunx intlayer fill` to AI-complete missing locales. Do not invent huge shared JSON trees without keys tied to features.

## Formatters (locale-aware)

Client (locale from `IntlayerProvider`):

```ts
import {
  useCompact,
  useCurrency,
  useDate,
  useIntl,
  useList,
  useNumber,
  usePercentage,
  useRelativeTime,
  useUnit,
} from "react-intlayer/format";
```

Non-React / Node: import `number`, `currency`, `date`, `percentage`, `compact`, `list`, `relativeTime`, `units`, `Intl`, plus locale helpers (`getLocaleName`, `getLocaleLang`, `getLocaleFromPath`, `getPathWithoutLocale`, `getLocalizedUrl`, `getHTMLTextDir`) from `intlayer` and pass locale explicitly.

Do **not** import `next-intlayer/client/format` or `next-intlayer/server/format` in Start.

## Anti-patterns

- Declaring translations only as huge shared JSON without keys tied to features (unless `syncJSON` is the explicit bridge).
- Calling Next.js `next-intlayer/server` hooks in Start.
- Using sync `getIntlayer` in route `head` on 9.4+ when `getIntlayerAsync` is available (loads every locale).
- Passing `t()` around `plural` categories instead of `plural` inside `t`.
- Using `meta` for dynamic records (use object `variant`).
- Indexing content with a runtime key (`status[type]`) instead of `select(type)` / `enu(n)` / `cond(b)`.
- Forgetting `routeFileIgnorePattern` so `.content.ts` becomes a route.
- Enabling `compiler.enabled` without intending build-time extraction (default is off).
