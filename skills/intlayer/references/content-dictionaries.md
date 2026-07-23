# Content Dictionaries

## Declaration files

Default extensions: `.content.{ts,tsx,js,jsx,mjs,cjs,json,jsonc,json5,md,mdx,yaml,yml}`.

Scan roots come from `content.contentDir`. For TanStack Start, set this to `["src"]` (or your app root) instead of assuming a Next-style `./app` default.

Co-locate dictionaries with features. Ignore them from the router via `routeFileIgnorePattern` (see setup reference).

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

## Client consumption

```tsx
import { useIntlayer } from "react-intlayer";

function Home() {
  const content = useIntlayer("app");
  return <h1>{content.title}</h1>;
}
```

v9 options object (preferred second argument):

```ts
useIntlayer("faq", { item: 2 });
useIntlayer("hero-banner", { variant: "black_friday" });
useIntlayer("product-copy", {
  locale: "fr",
  variant: { id: "prod_123", category: "books" },
});
```

A locale string as the second argument still works; prefer the options object for new code.

## Server / non-hook consumption

```ts
import { getIntlayer } from "intlayer";

const content = getIntlayer("app", locale);
```

Use `getIntlayer` in `createServerFn`, route `head`, sitemap helpers, and any non-React context. Use `useIntlayer` only under `IntlayerProvider`.

## String attributes

Content nodes are not always plain strings. For `alt`, `title`, `aria-label`, `href` text, etc.:

```tsx
<img alt={content.image.value} src={content.image.src.value} />
{/* or .toString() / String(...) */}
```

## Collections (v9)

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

## Variants (v9)

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

Object variants (dynamic records) may need Suspense when fetched dynamically.

## Import modes

Configured under `dictionary.importMode`:

| Mode | Behavior |
| --- | --- |
| `static` (default) | Build-time static imports |
| `dynamic` | Dynamic import + Suspense |
| `fetch` | Live/CMS fetch sync |

## CLI helpers

```bash
bunx intlayer build
bunx intlayer build --watch
bunx intlayer content test
bunx intlayer fill
bunx intlayer push
bunx intlayer pull
```

Prefer project scripts when present. Use fill/push/pull only when AI fill or CMS sync is in scope.

## Anti-patterns

- Declaring translations only as huge shared JSON without keys tied to features.
- Calling Next.js `next-intlayer/server` hooks in Start.
- Forgetting `routeFileIgnorePattern` so `.content.ts` becomes a route.
- Enabling `compiler.enabled` without intending build-time extraction (v9 default is off).
