# Blume: Theming, Customization, Search, Export

Scope: configure `theme` tokens, `theme.css`, component overrides and layout slots, Astro integrations, the `blume add` registry, eject, every `blume/search` adapter, and PDF/EPUB export (Blume 2.2.2).

## Contents

1. [Theming](#theming)
   - [Config tokens](#config-tokens)
   - [Accent](#accent)
   - [Radius and mode](#radius-and-mode)
   - [Fonts](#fonts)
   - [Per-mode colors, action, background image](#per-mode-colors-action-background-image)
   - [theme.css and design tokens](#themecss-and-design-tokens)
   - [Tailwind utilities](#tailwind-utilities)
   - [Cascade order](#cascade-order)
2. [Customization](#customization)
   - [Component overrides (components.ts)](#component-overrides-componentsts)
   - [Reference forms and hydration](#reference-forms-and-hydration)
   - [Typing an override](#typing-an-override)
   - [Layout slots](#layout-slots)
   - [Islands and custom pages](#islands-and-custom-pages)
   - [Registry: blume add](#registry-blume-add)
   - [Astro integrations](#astro-integrations)
   - [Eject](#eject)
3. [Search](#search)
   - [Config shapes](#config-shapes)
   - [Adapter overview](#adapter-overview)
   - [Adapters in detail](#adapters-in-detail)
   - [Popular pages](#popular-pages)
   - [What is indexed](#what-is-indexed)
   - [Version and locale scoping](#version-and-locale-scoping)
   - [Frontmatter: tags, keywords, boost, exclude](#frontmatter-tags-keywords-boost-exclude)
   - [Ranking per adapter](#ranking-per-adapter)
   - [Sync behavior and env vars](#sync-behavior-and-env-vars)
   - [Search analytics](#search-analytics)
   - [Disabling search](#disabling-search)
4. [Export (PDF / EPUB)](#export-pdf--epub)
5. [Error and warning codes](#error-and-warning-codes)
6. [Gotchas](#gotchas)

---

## Theming

The theme is token-driven and supports light and dark mode out of the box. Three layers: config tokens, `theme.css`, Tailwind utilities.

### Config tokens

```ts
// blume.config.ts
theme: {
  accent: "teal",   // named preset or any CSS color
  radius: "md",     // none | sm | md | lg
  mode: "system",   // system | light | dark
  fonts: {          // self-hosted
    display: "inter",
    body: "inter",
    mono: "ibm-plex-mono",
  },
}
```

All `theme` keys:

| Key | Values | Default |
| --- | --- | --- |
| `accent` | preset, CSS color, or `{ light, dark }` | `blue` |
| `action` | preset or CSS color | same as `accent` |
| `background` | CSS color or `{ light, dark }` (either key optional) | built-in |
| `backgroundImage` | URL or path under `public/`, or `{ light, dark }` (either key optional) | none |
| `radius` | `none` `sm` `md` `lg` | `md` |
| `mode` | `system` `light` `dark` | `system` |
| `fonts` | `{ display, body, mono }` | `inter` / `inter` / `ibm-plex-mono` |

### Accent

The accent tints step markers, active tabs, badges, card hovers, and similar elements.

- Presets: `blue` (default), `green`, `orange`, `pink`, `purple`, `red`, `teal`.
- Each preset has a darker light-mode shade and a lighter dark-mode shade (WCAG AA 4.5:1 in both modes).
- Any CSS color works: hex, `oklch()`, `rgb()`, `var(--brand)`, `color-mix()`.
- A string applies to both modes. An object `{ light, dark }` sets each mode.
- A value that is neither a preset nor a CSS color (`"deep purple"`, a hex without `#`) warns `BLUME_THEME_COLOR_INVALID` at the line in `blume.config.ts`. The same check covers `action`, `background`, and `seo.og.palette`.
- Text on an accent or action fill is white while white meets AA, and dark otherwise. A light accent gets dark labels without extra config.
- `bunx blume audit` checks a custom accent, action, or background for contrast (`theme-contrast-low`).

### Radius and mode

- `radius` sets corner rounding for cards, code blocks, callouts, and inputs.
- `mode` sets the initial color scheme. A header toggle always lets readers switch, and the choice is remembered.
- Dark mode is applied as `data-theme="dark"` on `<html>`.

### Fonts

`fonts` has three roles:

| Role | Styles |
| --- | --- |
| `display` | Headings `h1`-`h6` |
| `body` | Body text, UI, prose |
| `mono` | Code blocks and inline code |

- Set only the roles you want to change. The rest keep defaults: `fonts: { display: "geist" }`.
- Fonts are self-hosted: downloaded at build time, served from your site. No runtime Google request. Astro generates fallback-metric faces.
- Headings get `-0.05em` letter-spacing from the theme itself.

Curated slugs (bare string):

| Category | Slugs |
| --- | --- |
| Sans | `dm-sans` `figtree` `geist` `ibm-plex-sans` `inter` `inter-tight` `manrope` `open-sans` `plus-jakarta-sans` `roboto` `source-sans-3` `space-grotesk` `work-sans` |
| Serif | `ibm-plex-serif` `lora` `merriweather` `playfair-display` `source-serif-4` |
| Mono | `fira-code` `geist-mono` `ibm-plex-mono` `jetbrains-mono` `roboto-mono` `source-code-pro` `space-mono` |

#### Provider family (object form)

```ts
theme: {
  fonts: {
    display: { name: "Noto Sans JP", weights: [400, 700] },
    body: { name: "Noto Sans JP", weights: [400, 500, 700] },
  },
}
```

| Option | Meaning | Default |
| --- | --- | --- |
| `name` | Family name exactly as the provider lists it | required |
| `provider` | `google`, `fontsource`, `bunny`, `fontshare` | `google` |
| `weights` | Numbers or a variable range like `"100..900"` | `[400, 500, 600, 700]` |
| `subsets` | Provider subset names (`latin`, `latin-ext`, `vietnamese`, `cyrillic`, `greek`, ...) | `latin` plus subsets your `i18n.locales` need |
| `fallback` | System stack: `sans`, `serif`, `mono` | `mono` for the mono role, `sans` otherwise |

Subsets and locales:

- Google, Bunny, and Fontsource split families into per-script subsets. Only loaded subsets get a `@font-face`.
- Blume derives the list from `i18n.locales` (Vietnamese loads `vietnamese`, Polish loads `latin-ext`, Russian loads `cyrillic`, Greek loads `greek`). No `i18n`, or only Latin-1 languages, loads `latin` only.
- Override with `subsets`: `body: { name: "Be Vietnam Pro", subsets: ["latin", "vietnamese"] }`.
- Curated slugs follow the locale-derived list. Use the object form to pin subsets for them.

#### Local font files

```ts
theme: {
  fonts: {
    display: {
      name: "Berkeley Mono",
      variants: [
        { src: "./fonts/BerkeleyMono-Regular.woff2", weight: 400 },
        { src: "./fonts/BerkeleyMono-Bold.woff2", weight: 700 },
      ],
    },
  },
}
```

- Each variant becomes one `@font-face`. Paths resolve from the project root.
- `weight` and `style` (`normal`, `italic`, `oblique`) are optional. Astro reads them from the file when omitted.
- When `theme.fonts` is set explicitly, display and body fonts also style generated Open Graph cards. Non-Google provider families are skipped there (card renderer fetches only from Google Fonts). Local files work everywhere.
- To use the system stack, override `--blume-font-*` in `theme.css`.

### Per-mode colors, action, background image

```ts
theme: {
  accent: { light: "blue", dark: "teal" },
  background: { light: "#ffffff", dark: "#0a0a0a" },
  action: "#ff0066",                       // secondary accent for CTAs; bg-action / text-action
  backgroundImage: { light: "/bg-light.svg", dark: "/bg-dark.svg" },
}
```

- `background: { dark: "#0a0a0a" }` overrides one mode and keeps the default for the other. Same for `backgroundImage`.

### theme.css and design tokens

Put `theme.css` in the project root. It is the last layer and overrides everything.

```css
/* theme.css */
:root {
  --blume-accent: oklch(0.68 0.14 180);
  --blume-radius: 0.5rem;
}
:root[data-theme="dark"] {
  --blume-background: oklch(0.16 0 0);
}
```

- Light mode: `:root`. Dark mode: `:root[data-theme="dark"]`.
- Color tokens have distinct built-in dark values at the dark selector's higher specificity. A `:root`-only override of `--blume-accent`, `--blume-background`, and similar tokens changes light mode only. Declare the dark block too.
- `theme.css` is inlined into the site's Tailwind entry, so Tailwind directives work in it.
- Monorepo: add `@source` so Tailwind scans sibling workspace packages. The path is relative to `theme.css`:

```css
@source "../../packages/ui/src";
```

| Token | Controls |
| --- | --- |
| `--blume-background` | Page background |
| `--blume-foreground` | Body text |
| `--blume-muted` | Subtle surfaces (callouts, table headers) |
| `--blume-muted-foreground` | Secondary text |
| `--blume-border` | Borders and dividers |
| `--blume-accent` | Accent color |
| `--blume-accent-foreground` | Text and icons on an accent background |
| `--blume-action` | Secondary accent (defaults to accent) |
| `--blume-action-foreground` | Text and icons on action background (defaults to accent foreground) |
| `--blume-code-background` | Code block surface |
| `--blume-code-highlight`, `--blume-code-highlight-border` | Highlighted line (`// [!code highlight]` or `{1,4-5}`) |
| `--blume-code-add`, `--blume-code-add-border` | Added line (`// [!code ++]`) |
| `--blume-code-remove`, `--blume-code-remove-border` | Removed line (`// [!code --]`) |
| `--blume-code-error`, `--blume-code-error-border` | Error line (`// [!code error]`) |
| `--blume-code-warning`, `--blume-code-warning-border` | Warning line (`// [!code warning]`) |
| `--blume-code-word`, `--blume-code-word-border` | Highlighted word (`// [!code word:...]`) |
| `--blume-content-width` | Max width of prose column: article, breadcrumb, TOC, feedback, pagination (default `42rem`) |
| `--blume-radius` | Corner radius |
| `--blume-font-display` | Heading font |
| `--blume-font-body` | Body / UI font |
| `--blume-font-mono` | Code font |

```css
:root { --blume-font-body: ui-sans-serif, system-ui, sans-serif; }
```

### Tailwind utilities

Blume uses Tailwind v4 internally. Project `.astro`, `.jsx`, `.mdx`, `.ts`, `.tsx` files are scanned. No Tailwind setup needed in your project.

| Token | Utilities |
| --- | --- |
| `--blume-background` | `bg-background` |
| `--blume-foreground` | `text-foreground` |
| `--blume-muted` | `bg-muted` |
| `--blume-muted-foreground` | `text-muted-foreground` |
| `--blume-border` | `border-border` |
| `--blume-accent` | `bg-accent`, `text-accent` |
| `--blume-accent-foreground` | `text-accent-foreground` |
| `--blume-action` | `bg-action`, `text-action` |
| `--blume-action-foreground` | `text-action-foreground` |
| `--blume-code-background` | `bg-code` |
| `--blume-content-width` | `max-w-content` |
| `--blume-radius` | `rounded-blume` |
| `--blume-font-display` | `font-display` |
| `--blume-font-body` | `font-sans` |
| `--blume-font-mono` | `font-mono` |

### Cascade order

1. Base: Blume reset, default tokens, component styles.
2. Config tokens: `--blume-accent`, `--blume-radius`, `--blume-font-*` from `theme`.
3. `theme.css`: final word.

---

## Customization

### Component overrides (components.ts)

Add `components.ts` (or `components.tsx` for React components) at the project root. Export `defineComponents`. The `mdx` map replaces a built-in or adds a new component, available in every `.mdx` page with no import.

```ts
// components.ts
import { defineComponents } from "blume";
import Callout from "./components/Callout.astro";
import Pricing from "./components/Pricing.astro";

export default defineComponents({
  mdx: {
    Callout, // replace built-in
    Pricing, // add <Pricing />
  },
});
```

- Keys are the tag names written in MDX.
- A capitalized tag that is not a built-in, an island, or an override fails the page render. `blume dev`, `blume build`, and `blume check` warn first as `BLUME_UNKNOWN_COMPONENT` (once per tag, listing every page that uses it).

### Reference forms and hydration

Every override in `mdx` or `layout` accepts three forms:

```ts
export default defineComponents({
  mdx: {
    Callout,                                        // 1. imported component
    Note: "./components/Note.astro",                // 2. path string (from project root)
    Chart: { component: "./components/Chart.tsx", client: "load" }, // 3. descriptor
  },
});
```

- Blume reads `components.ts` statically and never runs it. Only these three forms are accepted.
- An inline function or expression, a component declared in the file, a spread, a computed key, or an invalid `client` string is a `BLUME_COMPONENTS_INVALID` error naming the entry. `blume dev` shows it in terminal and browser overlay. `blume build` fails.
- Without a `client` mode, a React/Vue/Svelte component renders as static HTML. Blume prints a build warning.

| `client` | Hydrates |
| --- | --- |
| `"load"` | Immediately on page load |
| `"idle"` | When the main thread is idle |
| `"visible"` | When scrolled into view |
| `"media"` | When a `media` query matches (add `media: "(min-width: 40rem)"`) |
| `"only"` | Client only, never server-rendered |

An `mdx` entry with a `client` mode is an island, available on every page. The `islands/` folder is the zero-config path. Use a `components.ts` entry for a different name than the file, a `media` query, or to keep islands next to other overrides.

### Typing an override

```tsx
import type { CalloutProps } from "blume/components";

export default function Callout(props: CalloutProps) { /* ... */ }
```

Prop types are exported for content components: `CalloutProps`, `CardProps`, `TabsProps`, `StepsProps`, `BadgeProps`, and more.

### Layout slots

The `layout` map replaces chrome. Each override receives the same props as the built-in, so you can wrap the default or start fresh.

```ts
export default defineComponents({
  layout: {
    Logo,   // brand mark + title
    Footer, // site-wide footer, replaces the one `footer` configures
  },
});
```

Slot names are case-sensitive. Any other key under `layout` renders nowhere and Blume warns.

| Slot | Replaces | Props |
| --- | --- | --- |
| `Layout` | Entire page shell (`RootLayout`) | Everything the built-in receives, plus the `layout` map |
| `Header` | Top navigation bar | `site`, `logo`, `navigation`, `route`, `searchEnabled`, ... |
| `Logo` | Brand link in header | `site`, `logo`, `locale` |
| `Search` | Header search trigger + modal | `navigation`, `strings`, `locale`, `assistantEnabled` |
| `Sidebar` | Primary navigation tree | `items`, `currentRoute` |
| `MobileNav` | Nav inside mobile drawer (defaults to `Sidebar`) | `items`, `currentRoute` |
| `Breadcrumbs` | Breadcrumb trail | `crumbs` |
| `TableOfContents` | On-this-page outline: right rail (`variant: "desktop"`) and dropdown above content on narrower screens (`"mobile"`) | `headings`, `title`, `variant` |
| `Pagination` | Prev/next links | `prev`, `next`, `strings` |
| `Feedback` | "Was this page helpful?" rating (rendered only when `feedback` is on) | `strings`, `comments` |
| `PageHeader` | Injection point above the article (no built-in) | `page`, `headings`, `route` |
| `PageFooter` | Injection point below the article (no built-in) | `page`, `headings`, `route` |
| `Footer` | Site footer after the content grid: links, social profiles, repository link, Cookie settings | `footer`, `locale`, `site`, `navigation`, `ui` |

Notes:

- The `mobile` TableOfContents variant gets the page actions as children (an empty element the actions move into below 1,280px). Render a `<slot />` in it to keep them. It also renders on pages with no headings (`headings` empty).
- `PageHeader` and `PageFooter` render nothing until set. Use them for a promo banner or a "last updated" note. `PageFooter` renders on every content page, API operation pages included, before `Feedback` and `Pagination`.
- Pages in `custom` or `frame` layout mode drop the page-end area, title, and breadcrumbs.
- A custom page under `pages/` renders the layout it wraps itself in. `RootLayout` takes slot overrides through its `layout` prop. `PageLayout` has no page-end area.
- The built-in `Footer` holds the only links to your repository and social profiles. A `Footer` override should keep them.
- With `consent` set, keep a way to reopen it: any element with `data-blume-consent-open` works as the Cookie settings link.
- Slots accept the same three reference forms, so an interactive header or footer can be `{ component, client }`.

### Islands and custom pages

- Islands: put a React/Vue/Svelte component in `islands/` and use it in MDX. Blume hydrates it with no wrapper or registration.

```tsx
// islands/Counter.tsx
import { useState } from "react";
export default function Counter() {
  const [n, setN] = useState(0);
  return <button onClick={() => setN(n + 1)}>Clicked {n}</button>;
}
```

```mdx
Use it anywhere: <Counter />
```

- Custom pages: add `.astro` files under `pages/` for custom routes (landing, pricing). Relative imports and `getStaticPaths` work. They read config, navigation, and routes from the `blume:data` module.

### Registry: blume add

`blume add` copies a Blume-maintained component into your project as source. You own and can edit it.

```bash
bunx blume add            # list available components
bunx blume add callout
bunx blume add pagination
```

- Installable: layout slots (header, sidebar, breadcrumbs, table of contents, pagination, feedback) and content components (callout, card, tabs, steps, accordion, and more).
- The copy imports the rest of the framework from `blume/*`, so it renders like the built-in until you change it.
- The command prints the `defineComponents` snippet to register it: content components under `mdx`, layout pieces under `layout`.

### Astro integrations

Add integrations via the top-level `integrations` array in `blume.config.ts`. Install the package first. Blume does not add it to the generated runtime's dependencies and does not manage Astro compatibility.

```bash
bun add @astrojs/partytown
```

```ts
import partytown from "@astrojs/partytown";
import { defineConfig } from "blume";

export default defineConfig({
  integrations: [
    partytown({ config: { forward: ["dataLayer.push"] } }),
  ],
});
```

- Order: Blume's built-in integrations first, then yours in declaration order. No sorting or dedup (two integrations with the same `name` both run).
- Blume validates that `integrations` is an array. Astro validates each entry.
- Blume re-imports `blume.config.ts` from the generated Astro config, so the config module evaluates twice per run. Keep integration factories side-effect free.
- Same integrations run in `blume dev` and `blume build`.
- With a non-empty `integrations`, every edit to `blume.config.ts` restarts the dev server. Edits to files it imports do not trigger regeneration. Restart `blume dev` after those.
- After eject, the owned `astro.config.mjs` keeps a relative bridge to `blume.config.ts`, so integrations keep running. You can move them into the Astro config later.

### Eject

```bash
bunx blume eject --yes
```

- One-way. The hidden `.blume/` runtime becomes a normal Astro app you own. The `blume` package stays importable (components, theme, Markdown processors).
- `package.json` scripts point at `astro dev` and `astro build`.
- Eject adds packages the Astro app imports by name, at Blume's ranges: `astro`, `@tailwindcss/vite`, `tailwindcss`, `@tailwindcss/typography`, the search client, integrations, and adapter the config wires in, React when an island, example, or the assistant uses it, `ai` for the assistant route, `epub-gen-memory` for EPUB export. Run an install before `dev` or `build`. Eject lists what it added.
- All paths in the ejected app are relative, so it builds from any checkout, CI included.
- Afterward run `bun run dev` / `bun run build`. `blume dev`, `blume build`, `blume check`, `blume sync`, `blume preview` stop and point you to those scripts.
- `blume eject` refuses to run again. `--force` regenerates the app and overwrites edits.

What eject keeps:

- Routes the hidden runtime served as pages are written to `src/pages`: each page's Markdown twin, the 404 page with `/404.md` and `/404.json`, the hosted MCP server, the JSON docs API at `/api/docs/...` and `/openapi.json`.
- Plain `astro build` still produces: search index (and hosted index sync), `llms.txt`, `llms-full.txt`, `sitemap.xml`, `robots.txt`, `agent-readability.json`, `.well-known` discovery files, Agent Skills, and `_redirects`/`_headers`. The Blume integration writes them from `astro:build:done`.
- The ejected build does NOT do the CLI's adapter post-processing:
  - Vercel and Cloudflare `Accept: text/markdown` routing splices
  - Vercel function-bundle audit
  - `node()` server-entry wrapper (`.well-known` media types and CORS headers, SVG download sandbox, each redirect's exact status)
  - `netlify()` header rules in `.netlify/v1/config.json`
  - Cloudflare Worker naming and the `.wrangler/deploy` redirect for `wrangler deploy` from project root
  - the `--analyze` / `--budget-*` gate

---

## Search

Default search is client-side, keyless, and works in `blume dev` and `blume build`. It indexes real content only (no navigation chrome, no excluded pages). Switch backends by changing only the adapter passed to `search`.

### Config shapes

```ts
import { defineConfig } from "blume";
import { algolia } from "blume/search";

export default defineConfig({
  search: algolia({ appId: "YOUR_APP_ID", apiKey: "YOUR_SEARCH_ONLY_KEY", indexName: "docs" }),
});
```

Object form (needed for `popular`, `indexing`, `analytics`):

```ts
import { pagefind } from "blume/search";

search: {
  provider: pagefind(),   // omit to keep default Orama; false disables the provider
  popular: [{ href: "/guides/getting-started", icon: "rocket", label: "Getting started" }],
  indexing: { includeCodeBlocks: true },
  analytics: { queries: false },
},
```

| Form | Meaning |
| --- | --- |
| omitted | Orama (default) |
| `search: <adapter>` | Use that adapter |
| `search: { provider, popular, indexing, analytics }` | Adapter plus options |
| `search: false` | Search off |
| `search: { provider: false, indexing }` | Dialog off, `indexing` still applies to the MCP server's index |

An adapter is a plain description (not a live client), so Blume can inline it into the generated site and an ejected project.

### Adapter overview

All imported from `blume/search`:

| Adapter | Install | Type | Env var (secret) | Runs in `blume dev` |
| --- | --- | --- | --- | --- |
| `orama()` | bundled | client, keyless | none | yes |
| `flexsearch()` | `flexsearch` | client, keyless | none | yes |
| `pagefind()` | bundled | client, built HTML, sharded | none | no (build only) |
| `algolia({...})` | `algoliasearch` | hosted | `ALGOLIA_ADMIN_API_KEY` | n/a |
| `oramaCloud({...})` | `@oramacloud/client` | hosted | `ORAMA_PRIVATE_API_KEY` | n/a |
| `typesense({...})` | `typesense` | hosted | `TYPESENSE_ADMIN_API_KEY` | n/a |
| `mixedbread({...})` | `@mixedbread/sdk` | hosted, semantic, server endpoint | `MIXEDBREAD_API_KEY` (endpoint); `MXBAI_API_KEY` (CLI sync) | n/a |

- Orama and Pagefind ship with Blume. Every other SDK is an optional peer dependency you install yourself (`bun add <package>`).
- If the package is missing, `blume build` stops before Vite runs, names the package and install command. `blume doctor` reports it too.
- Client-side adapters take no options. An unknown key is rejected by config validation.
- Hosted adapters take public credentials only (safe in the browser). Secrets come from env vars at build time and never land in config or the client bundle.
- Every option passed to a hosted adapter is kept verbatim and handed to its browser client (Algolia `liteClient`, Typesense `Client`, `OramaClient`) or, for Mixedbread, to the search endpoint. Unnamed options still reach the SDK.
- Options must be JSON values. A function, `undefined`, or bigint fails config validation with a path.

### Adapters in detail

#### Orama (default)

```ts
import { orama } from "blume/search";
search: orama(),
```

- Builds a JSON index served at `/blume-search.json`, queried in the browser. Live in `blume dev`.
- Non-Latin scripts: Orama's standard tokenizer keeps only basic Latin letters, digits, and a few accented vowels. Blume automatically uses a word-segmenting tokenizer (`Intl.Segmenter`) for locales that resolve to a non-Latin script (Japanese, Chinese, Korean, Thai, Russian, Greek, Hebrew, Hindi). Declare locales:

```ts
i18n: {
  defaultLocale: "ja",
  locales: [{ code: "ja", label: "日本語" }],
}
```

- Same tokenizers serve the dialog, the MCP `search_docs` tool, and assistant grounding.
- The script decides, not the language name: `az-Cyrl` is segmented, `sr-Latn` is not.
- Non-Latin default locale: every page shares the default locale's tokenizer (Latin words survive). Latin default: Latin pages keep the standard tokenizer, each non-Latin translation gets its own locale's tokenizer.
- Latin languages heavy on diacritics (Vietnamese, Serbian Latin) do worse on the standard tokenizer.
- Japanese and Chinese: Han, Hiragana, Katakana are indexed as overlapping character pairs. Queries prefer pages carrying all pairs, loosening to any-pair when none do. Korean and Thai keep segmented words.

#### FlexSearch

```ts
import { flexsearch } from "blume/search";
search: flexsearch(),
```

- Install `flexsearch`. Reuses the same `/blume-search.json` index and builds a FlexSearch document index in the browser. Works in dev and build.
- No segmentation hook. For non-Latin sites prefer Orama or Pagefind (`pagefind_extended` segments Chinese, Japanese, Korean natively).

#### Pagefind

```ts
import { pagefind } from "blume/search";
search: pagefind(),
```

- Indexes built HTML, loads index shards on demand. Suits very large docs.
- Only runs during `blume build`. Search is unavailable in `blume dev`.
- Indexes each docs page's article only (not header, sidebar, footer). Custom pages on `PageLayout`, the 404 page, and the generated changelog index are not in results.

#### Algolia

```ts
import { algolia } from "blume/search";
search: algolia({
  appId: "YOUR_APP_ID",
  apiKey: "YOUR_SEARCH_ONLY_KEY", // public
  indexName: "docs",
}),
```

- Install `algoliasearch`. Browser queries Algolia with the search-only key.
- Each `blume build` replaces the whole index using `ALGOLIA_ADMIN_API_KEY` (warns and skips if unset). Deleted or renamed pages do not linger.
- The sync adds `filterOnly(locale)` and `filterOnly(version)` to `attributesForFaceting`, keeping your own facets. Needed because a filter on an undeclared facet attribute matches nothing.
- Records cap at 10 KB on Build and Grow plans. The sync splits longer pages into several records (title, description, URL, plus a stretch of text) and sets `attributeForDistinct` to `url` unless you set your own, so a split page appears once.
- `search.tags` first tag uploads as `tag`. Add `tag` to `attributesForFaceting` yourself; the sync keeps it.
- The sync adds `desc(boost)` to custom ranking, after your ranking.

#### Orama Cloud

```ts
import { oramaCloud } from "blume/search";
search: oramaCloud({
  endpoint: "https://cloud.orama.run/v1/indexes/your-index",
  apiKey: "YOUR_PUBLIC_API_KEY",
  indexId: "your-index-id", // for the build-time sync
}),
```

- Install `@oramacloud/client`. Browser queries `endpoint` with the public key. `blume build` pushes records using `ORAMA_PRIVATE_API_KEY`.
- `indexId` enables the sync. Without it the build warns and skips the sync even when the key is set.

#### Typesense

```ts
import { typesense } from "blume/search";
search: typesense({
  host: "xyz.a1.typesense.net",
  collection: "docs",
  apiKey: "YOUR_SEARCH_ONLY_KEY", // public
  // port + protocol default to 443 / https
}),
```

- Install `typesense`. Browser queries the collection with the search-only key.
- Each build imports pages into a new collection using `TYPESENSE_ADMIN_API_KEY`, repoints an alias named after `collection` at it, and drops the replaced collection. Searches read the previous collection until the new one is complete. If the sync fails, the build fails and the alias keeps serving the last complete sync.
- The admin key must manage collections and aliases.
- First sync: a collection already named `collection` (from an earlier Blume version) is replaced by the alias. Search keys scoped to that name keep working.
- Hand-tuned collection settings do not carry over. Reapply them after a build.
- Typesense declares `tag` as a facet.
- Non-spaced scripts: set `locale` to a two-letter code (`"ja"`, `"zh"`, `"th"`). The sync tokenizes the searched fields for it. One collection holds every language, so `locale` applies to all. Without it, a query only matches from the start of a run of text.

#### Mixedbread

```ts
import { mixedbread } from "blume/search";
search: mixedbread({ storeId: "YOUR_STORE_ID" }),
```

- Install `@mixedbread/sdk`. Semantic search. Queries are proxied through a generated `/api/search` endpoint that holds the key, which reads `MIXEDBREAD_API_KEY`.
- Requires server output: a host adapter such as `deployment: vercel()` from `blume/deploy`.
- Blume does not upload to the store. Sync your content folder with the Mixedbread CLI during your build:

```bash
mxbai store sync <STORE_ID> ./docs --yes   # CLI reads MXBAI_API_KEY
```

- Results link to the page a file renders, found by the path the CLI records. Run the sync from the project root or a folder above (e.g. monorepo root).
- A page appears once, at its best-matching passage. Passages from non-page files or excluded pages are left out.
- The dialog waits for a typing pause before sending, and drops a query the reader typed past. Each query counts toward the endpoint's rate limit.

### Popular pages

Before a query, the dialog shows a "Popular" list. Default: first six sidebar pages (often the wrong section on multi-tab sites). Pin links:

```ts
search: {
  popular: [
    { href: "/guides/getting-started", icon: "rocket", label: "Getting started" },
    { href: "/guides/install", icon: "download", label: "Install" },
    { href: "/concepts/overview", label: "Overview" },
  ],
},
```

| Field | Required | Meaning |
| --- | --- | --- |
| `href` | yes | Internal route or external URL |
| `label` | yes | Link text |
| `icon` | no | Built-in icon name, image path/URL, or inline SVG. Default: file glyph |

- Omit `popular` or leave it empty to keep the sidebar fallback.
- Write `href` as if the site were at the root. `basePath` is applied for you (like `navigation.featured`). External URLs pass through.
- With `i18n`, the sidebar fallback follows the reader's locale but `popular` entries go wherever `href` says. One list is shared by all languages.

### What is indexed

- Orama, FlexSearch, Algolia, Orama Cloud, Typesense, and the MCP `search_docs` tool index each page's title, description, and body as plain text (code blocks, images, markup stripped). Built from source files, so identical in dev and production.
- Pagefind indexes built HTML. Mixedbread syncs raw Markdown. Both always search code.
- Opt fenced code into the source-built indexes:

```ts
search: { indexing: { includeCodeBlocks: true } },
```

- Each fence's body and title become searchable (not the language or fence markers).
- On `.mdx` pages, components are indexed as the text they show (Card title, Tab label, TypeTable descriptions) using the agent-surface serializers. An `agents.markdownComponents` entry covers your own components.
- No effect on Pagefind or Mixedbread. Expect larger indexes (the client index ships to every reader; Algolia splits more records). A hit inside a fence shows flattened code in the excerpt.
- Hidden pages are excluded by default. Opt in:

```ts
search: { indexing: { includeHiddenPages: true } }
```

- Queries match titles (ranked highest), then descriptions, then body.
- Shortcuts: search icon, `⌘K` / `Ctrl K`, or `/` outside a field. `Esc` closes. `⌘J` / `Ctrl J` toggles the result preview pane.

### Version and locale scoping

| Adapter | Version scoping | Locale scoping |
| --- | --- | --- |
| Orama | yes | filters index in browser |
| FlexSearch | yes | filters index in browser |
| Algolia | yes (`version` facet; current docs uploaded as `"current"`) | `locale` record field |
| Typesense | yes (`version` facet) | `locale` record field |
| Orama Cloud | no | `locale` record field |
| Pagefind | no | index per language; searches page's own, "All languages" merges others (stemmed with page language) |
| Mixedbread | no | no |

- Versioned sites: results default to the viewed version. The dialog footer has an "All versions" toggle (remembered per reader). Cross-version hits name their version. Where scoping is unsupported, results span all versions and the toggle is hidden.
- i18n sites: results default to the page's language with an "All languages" toggle (remembered per reader). Mixedbread has no toggle.

### Frontmatter: tags, keywords, boost, exclude

```yaml
search:
  tags: [api, reference]
  keywords: [install, setup, getting started]
  boost: 3
  exclude: true
```

| Field | Effect |
| --- | --- |
| `search.tags` | First tag uploads as `tag` on the record in Algolia, Orama Cloud, Typesense. The dialog does not read tags. Its section filters use the sidebar section (shown with Orama and FlexSearch) |
| `search.keywords` | Extra terms the page is found by. Searched on every adapter except Mixedbread |
| `search.boost` | Relevance multiplier. Above 1 raises, below 1 lowers |
| `search.exclude` | `true` leaves the page out of the index |

Boost guidance: use values 2 to 5 on a few key pages (quickstart, overview). Use below 1 (e.g. `0.5`) for legacy pages. Keep under 10: beyond that a boost drowns out match quality.

### Ranking per adapter

| Adapter | Boost behavior |
| --- | --- |
| Orama, FlexSearch | Multiplies every match by the boost before sorting (3 counts exactly 3x). MCP server and assistant search rank the same way |
| Pagefind | Weighs boosted text more heavily, damps repeats, so lift is smaller than the multiplier (5 is closer to 2x). A boost over 10 counts as 10 |
| Algolia | Sorts by boost among near-equal matches (`desc(boost)` custom ranking, after yours) |
| Typesense | Sorts by relevance, then boost on ties |
| Orama Cloud | Fetches a wider result set, re-sorts by relevance times boost |
| Mixedbread | Boosts and keywords do not reach it (Blume does not upload to your store) |

### Sync behavior and env vars

| Adapter | Secret env var | Sync |
| --- | --- | --- |
| Algolia | `ALGOLIA_ADMIN_API_KEY` | Replaces whole index each build |
| Orama Cloud | `ORAMA_PRIVATE_API_KEY` | Pushes records; needs `indexId` |
| Typesense | `TYPESENSE_ADMIN_API_KEY` | New collection, alias swap, drop old |
| Mixedbread | `MIXEDBREAD_API_KEY` (endpoint), `MXBAI_API_KEY` (CLI) | No Blume sync; use `mxbai store sync` |

- Algolia, Orama Cloud, and Typesense upload at the end of each `blume build`.
- Admin key unset: the build warns and skips the upload (local builds still work).
- Key set and upload fails (wrong key, unreachable host, rejected record): the build fails with `BLUME_SEARCH_SYNC_FAILED`.

### Search analytics

With an analytics adapter configured, search emits events:

| Event | Props |
| --- | --- |
| `search` | `query`, `results`, `path` (recorded after 1 second without typing, or on pick/close; `results: 0` shows gaps) |
| `search_select` | `query`, `position` (1-based), `url`, `path` |

- Queries are sent as typed, up to 100 characters. Treat them as reader input (Google Analytics and Plausible forbid personal data).
- Turn query text off:

```ts
search: { analytics: { queries: false } },
```

- Events then carry `queryChars` (length) instead of `query`. The text travels only on the `blume:track` DOM event as `query` in `detail.props`, for your own listener.
- With cookie consent on, only readers who allowed analytics are counted.

### Disabling search

```ts
search: false,
```

Use `provider: false` in the object form to keep `indexing` applied to the MCP server's index.

---

## Export (PDF / EPUB)

Adds an Export action to the page actions under the table of contents. Off by default. Fully client-side, so static builds stay static.

```ts
export: true,            // both formats
```

```ts
export: { pdf: true, epub: false },   // one format; omitted or false = left out
```

With both off (default) the Export action does not appear.

| Format | How it works |
| --- | --- |
| PDF | Opens the browser print dialog with a print stylesheet. Strips header, sidebars, navigation, everything after the article (last updated, feedback, prev/next, site footer), and code copy buttons. `expandable` code blocks print in full. Dark theme prints light. Same stylesheet applies to browser-menu printing. No dependencies. |
| EPUB | Generates a self-contained `.epub` in the browser and downloads it. Generator loads only on click. |

EPUB details:

- Page is rewritten to standalone HTML: highlighted code becomes plain monospace, decorative icons and copy buttons dropped, built-in e-reader stylesheet for spacing, code, tables.
- Links to other pages point at the live site.
- Title is the page heading, language is the page's, author and publisher are the site `title`.
- Images are fetched into the book. An image the browser cannot fetch (cross-origin without CORS) is left out with a console warning.
- Tabbed content (package-install blocks, code groups) is expanded to show all panels. Client-rendered embeds such as Mermaid are not included.

Scope: both formats export the single page being viewed, not the whole site. Placement: right column at 1,280px and wider; in the "On this page" dropdown on narrower windows and phones.

---

## Error and warning codes

| Code | Raised when |
| --- | --- |
| `BLUME_THEME_COLOR_INVALID` | `accent`, `action`, `background`, or `seo.og.palette` is neither a preset nor a CSS color (warning, at the config line) |
| `BLUME_UNKNOWN_COMPONENT` | MDX uses a capitalized tag that is not a built-in, island, or override (warning from dev/build/check) |
| `BLUME_COMPONENTS_INVALID` | `components.ts` uses a form other than imported component, path string, or `{ component, client }` descriptor (error; `blume build` fails) |
| `BLUME_SEARCH_SYNC_FAILED` | Hosted index upload fails with an admin key set (build fails) |

---

## Gotchas

- `theme.css` overrides under `:root` change light mode only for color tokens. Add a `:root[data-theme="dark"]` block for dark.
- A hex color without `#` or a descriptive string (`"deep purple"`) warns `BLUME_THEME_COLOR_INVALID` and the styles using it are ignored by browsers.
- `components.ts` is read statically. No inline functions, spreads, computed keys, or locally declared components. Import the component or use a path string.
- A React/Vue/Svelte component in `mdx` with no `client` renders as static HTML. Use the descriptor form or put it in `islands/`.
- Layout slot names are case-sensitive. Unknown `layout` keys render nowhere (with a warning).
- A `Footer` override loses the repo and social links unless you re-render them. With `consent` set, include an element with `data-blume-consent-open`.
- `PageHeader` and `PageFooter` have no built-in. They render nothing until set.
- The `integrations` config evaluates twice per run (Blume read plus Astro load). Keep factories side-effect free. A non-empty `integrations` makes every `blume.config.ts` edit restart the dev server.
- Eject is one-way. After it, `blume dev/build/check/sync/preview` refuse to run. Use `bun run dev` / `bun run build`, and run an install first. The ejected build skips the CLI's adapter post-processing and the `--analyze` / `--budget-*` gate.
- Only Orama and Pagefind ship with Blume. For any other adapter, install its SDK or `blume build` stops before Vite.
- Pagefind does not work in `blume dev`. Orama and FlexSearch do.
- Pagefind, Orama Cloud, and Mixedbread ignore version scoping. Mixedbread also ignores locale scoping.
- Mixedbread needs server output (`deployment: vercel()` from `blume/deploy` or similar) and a separate `mxbai store sync` step. Boosts and keywords do not reach it.
- Orama Cloud syncs only when `indexId` is set, even with `ORAMA_PRIVATE_API_KEY` present.
- A missing admin key only warns and skips the upload. A set-but-wrong key fails the build with `BLUME_SEARCH_SYNC_FAILED`.
- Algolia needs `tag` in `attributesForFaceting` set by you to filter on it. The sync only adds `locale`/`version` filters and keeps yours.
- Typesense settings hand-tuned on a collection are lost on the next build because each build creates a new collection. Set `locale: "ja"` / `"zh"` / `"th"` for non-spaced scripts.
- Hosted adapter options must be JSON values. Functions, `undefined`, and bigint fail validation.
- `includeCodeBlocks` has no effect on Pagefind or Mixedbread (they already search code). It grows the client index.
- `search.tags` is not read by the dialog. It only labels records for hosted adapters.
- Keep `search.boost` under 10. Pagefind clamps it to 10. A high boost makes a barely-matching page top the results.
- `popular` entries are one shared list. On i18n sites, locale-prefixed `href`s send every reader to that language.
- EPUB and PDF export one page only. PDF needs "Background graphics" enabled in the print dialog to keep code and callout backgrounds.
