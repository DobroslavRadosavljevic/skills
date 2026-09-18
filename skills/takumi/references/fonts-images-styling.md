# Fonts, Images, Emoji, and Styling

## Fonts

### Per-render `fonts` (default)

```tsx
import { render } from "takumi-js";
import { googleFonts } from "takumi-js/helpers";

const png = await render(
  <div
    style={{
      fontSize: 72,
      fontFamily: "Fraunces",
      fontVariationSettings: "'opsz' 72, 'wght' 700",
    }}
    tw="w-full h-full flex items-center justify-center"
  >
    Hello Takumi
  </div>,
  {
    width: 1200,
    height: 630,
    fonts: googleFonts([
      {
        name: "Fraunces",
        weight: "100..900",
        axes: { opsz: "9..144" },
      },
    ]),
  },
);
```

`fonts` also accepts:

- Raw bytes / `{ name, data, weight, style, generic? }` descriptors
- Bare URL strings (`"https://…/Inter.woff2"`)
- `fontFromUrl(url, options?)` lazy entries
- `{ name, data: () => arrayBuffer, ranges?, key? }` loaders
- A `Promise` of the list

Weight ranges or `axes` load the **variable** font so `font-weight` / `font-variation-settings` drive axes per element.

`generic` claims a CSS generic family so stacks like Tailwind `font-mono` resolve without naming the face:

```tsx
fonts: [{ name: "Geist Mono", generic: "monospace", data: geistMonoBytes }]
```

Keywords: `serif` | `sans-serif` | `monospace` | `cursive` | `fantasy` | `system-ui` | `ui-serif` | `ui-sans-serif` | `ui-monospace` | `ui-rounded` | `emoji` | `math` | `fangsong`.

### `googleFonts` options

```tsx
await googleFonts([
  { name: "Inter", weight: [400, 700], style: "italic" },
  { name: "Noto Sans JP", weight: "600..700" },
  { name: "Fraunces", weight: "100..900", axes: { opsz: "9..144" }, generic: "serif" },
]);

await googleFonts({
  families: ["Inter"],
  timeout: 3000,
  baseUrl: "https://fonts.bunny.net/css2",
});
```

`googleFonts` fetches one CSS response; files load when coverage subsets are needed. `render` keeps only subsets the text uses. Trim earlier with `subsetFonts({ fonts, source })`.

Request-level fields (shared with image helpers): `timeout` (default **30s**, including retries), `maxBytes` (32 MiB), `allowUrl`, `signal`, custom `fetch`, `display`, `cache` (CSS metadata), `baseUrl`.

Requests with `signal` or `allowUrl` bypass the CSS cache. Transient GET/HEAD failures retry (100 ms, then 200 ms; `Retry-After` up to 1 s) for `408`/`429`/`5xx` and connection errors.

CI / offline: bundle files with `readFile` and pass `{ name, data }`. Do not depend on Google Fonts in unit tests.

### Reuse across many renders

```ts
import { Renderer } from "takumi-js/node";

const renderer = new Renderer();
await renderer.registerFont(archivoBytes);
// then pass { renderer, fonts: [...] } or rely on registered fonts + fontFamilies
```

`registerFont` replaces v1 `loadFont` / `loadFonts` / `loadFontSync`. Use only for preloading **outside** the hot request path. It accepts the same entries as `fonts` and returns produced families.

### Fallback chain

`fontFamilies: ["Inter", "Noto Sans JP"]` — ordered families tried when a glyph is missing. Defaults to registered families in registration order, Geist last.

**Important:** CSS generics like `sans-serif` resolve to **registered** families, **not** the built-in Geist last-resort.

### Performance note

Prefer **TTF** when decode speed matters; **WOFF2** when transfer size matters (WOFF2 decompresses before use). Raise `setGlyphCacheMaxBytes` for large CJK glyph sets (default 8 MiB, process-wide).

`lang` on render or a node is BCP-47 (Han unification, line breaking). Per-node `lang` overrides the render default.

## Images

Takumi fetches remote URLs in `src`, `background-image`, `mask-image`, and `list-style-image`.

Animated **GIF / WebP / APNG** sources play along the animation time axis. Still-image / SVG-backend paths use the first frame.

### Shared byte cache

```tsx
const fetchCache = new Map<string, Promise<ArrayBuffer>>();

await render(element, {
  images: { fetchCache },
});
```

Use a bounded LRU for high-cardinality URLs; a plain `Map` never evicts. Do **not** share `fetchCache` across different `allowUrl` policies.

### Fetch limits / SSRF

| Option | Default | Use |
| --- | --- | --- |
| `timeout` | `30000` ms | Hang protection (`0` disables); includes retries |
| `maxBytes` | 32 MiB | Reject huge bodies |
| `allowUrl` | allow all | Allowlist when markup is user-influenced |
| `fetch` | `globalThis.fetch` | Custom fetch |
| `signal` | none | Cancel a request and pending retry |

Redirects are capped (5 hops). On a cache **miss**, `allowUrl` runs on each hop. On a cache **hit**, only the entry URL is rechecked (no redirect history). DNS is not inspected — use custom `fetch` for resolved-IP policies.

### Pre-fetched sources

```tsx
new ImageResponse(<OgImage />, {
  images: [
    {
      src: "my-logo",
      data: () => fetch("/logo.png").then((r) => r.arrayBuffer()),
    },
  ],
});
// <img src="my-logo" /> or backgroundImage: "url(my-logo)"
```

Group form: `{ sources, fetch, fetchCache, cache, timeout, allowUrl }`.

Decode cache modes: `auto` (default) | `none` (read but don't populate). Renderer `cacheMaxBytes` defaults to **64 MiB**. Decode limits: **8192×8192** stills; animated GIF summed frames 4× that.

### Node fetch flake

If Node `fetch` drops the socket on remote `img` URLs, pass a **base64 data URL** instead so Takumi skips the fetch.

### Raw pixels

```tsx
import { Bitmap } from "takumi-js/helpers/jsx";

await render(<Bitmap width={64} height={64} data={rgbaUint8} />, {
  width: 64,
  height: 64,
});
```

Set `premultiplied` when bytes are already alpha-premultiplied.

## Emoji

Default provider: `twemoji`. Set `emoji` on render / `ImageResponse`:

`twemoji` | `blobmoji` | `noto` | `openmoji` | `fluent` | `fluentFlat` | `"from-font"`

Pictographs that default to **text** presentation (`‼`, `▶`) stay text. `U+FE0F` forces the emoji image; `U+FE0E` forces the text glyph.

`from-font` draws COLR / bitmap emoji from registered fonts (no CDN). Helpers: `extractEmojis` from `takumi-js/helpers/emoji`.

## Styling

| You have | Use |
| --- | --- |
| One-off styles | `style` prop |
| Tailwind classes, no bundler | `tw` prop |
| Compiled CSS / Tailwind v4 source | `css` |
| Design tokens | `:root` / `@theme` / `{ selector: ":root", style }` |

**`css` replaces `stylesheets`.** `stylesheets` still works and warns once; removed in v3. Do not pass both.

```tsx
await render(<div className="card">Hello</div>, {
  width: 1200,
  height: 630,
  css: `.card { display: flex; padding: 48px; background: #0f172a; color: white; }`,
});
```

`css` also accepts a list and **rule objects**:

| Entry | Writes |
| --- | --- |
| `{ selector, style, rules }` | a style rule |
| `{ keyframes, steps }` | `@keyframes` (replaces deprecated `keyframes` option) |
| `{ media, rules }` / `{ supports, rules }` / `{ layer, rules }` | at-rule groups |

A `<style>` tag in JSX is extracted automatically. `fromJsx` / `fromHtml` return `{ node, css }` (`stylesheets` is a deprecated alias).

### Full Tailwind via compiled CSS

```tsx
import stylesheet from "~/styles/global.css?inline";

new ImageResponse(
  <div className="bg-background text-foreground flex w-full h-full items-center justify-center text-4xl">
    Hello Tailwind!
  </div>,
  { width: 1200, height: 630, css: stylesheet },
);
```

Requires a bundler that can emit inline CSS (e.g. Vite + `@tailwindcss/vite`).

### Tailwind v4 source in `css` (no compile)

- `@theme` → `:root` (nested `@keyframes` register; `prefix()` unsupported)
- `@import "tailwindcss"` → **Preflight** (UA margins, list markers, heading sizes go away). Other `@import` targets unsupported
- `@apply` expands utilities in place (`!` ok; `md:` variants rejected)

Unsupported as source: `@utility`, `@custom-variant`, `@source`, `@plugin`, `@config` — compile those.

### `tw` cascade

Utilities sit in the last layer:

| Against a utility | Winner |
| --- | --- |
| Unlayered stylesheet rule | the rule |
| Named `@layer` rule | the utility |
| `style` prop | `style` |
| `!` utility vs unlayered important CSS | the `!` utility |

Templates that relied on `tw` beating a matching unlayered rule need a layer or `!`.

Without Preflight, UA margins remain (`h1` has `0.67em` top margin until `mt-0`). `box-sizing` still defaults to `border-box`.

Tokens: `--color-brand-500` makes `bg-brand-500` work; `--spacing` / `--spacing-*`, `--font-*`, `--radius-*`, `--animate-*`, `--breakpoint-*` follow Tailwind namespaces. Gradients need `bg-linear-*` / `bg-radial` / `bg-conic` — stops alone paint nothing. `animate-(--custom-property)` is **not** supported.

### CSS surface (high level)

Supported beyond typical OG subsets: Grid, block, inline, float, tables, lists, `calc()` (≤4 distinct units), `z-index`, `:is()` / `:where()`, `::before` / `::after`, masks, `clip-path`, `backdrop-filter`, blend modes, `background-clip: text`, conic gradients, `@keyframes` / `animation`, `@media` / `@supports` / `@layer`, `!important` in inline styles, custom properties, RTL layout via `direction`.

Sizing keywords (2.14): `min-content`, `max-content`, `fit-content`, `fit-content(<length-percentage>)`, `stretch` on `width`/`height`/`flex-basis` (`content` on `flex-basis`). Tailwind: `w-min` / `w-max` / `w-fit` / `basis-content`. Not on `min-`/`max-` size properties.

`flex-wrap: balance` + `flex-line-count`; `display: flow-root`; `self-start` / `self-end`; `contain: layout | style | paint | content` (`size` / `strict` parse-error). Overflow/`contain: paint` clip at the **padding** edge.

`@media` sees viewport size, orientation, resolution, and `screen` (images) vs `print` (PDF). `prefers-color-scheme` never matches.

Interactive pseudos (`:hover`) parse but never match.

### Tables and lists

HTML/JSX presets: `table`, `thead`, `tbody`, `tfoot`, `tr`, `td`, `th`, `caption` (`colSpan`/`rowSpan` both work). Layout is a **grid rewrite**, not the full CSS table algorithm.

- `table-layout: fixed` sizes from the first row
- `border-spacing` (UA `2px` on `<table>`; `0` on a bare `display: table` box); `border-collapse: collapse` (2.12)
- Auto columns share free width in proportion to max-content (2.13+)
- `vertical-align`: `top` / `middle` / `bottom`; `baseline` still paints as `top`

Lists: `display: list-item` draws markers (`list-style-type` / `position` / `image`). `<ol start>` and `<li value>` count. `disclosure-open` / `disclosure-closed` accepted. `<ol reversed>` counts **up**. Gradient `list-style-image` falls back to the counter. Only `ul`/`ol` scope counting.

The official tables guide at https://takumi.kane.tw/docs/tables still describes an older equal-split / no-collapse approximation — prefer the 2.12–2.14 release notes when they disagree.
