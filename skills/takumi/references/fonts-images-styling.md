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

- Raw bytes / `{ name, data, weight, style }` descriptors
- Bare URL strings (`"https://…/Inter.woff2"`)
- `fontFromUrl(url, options?)` lazy entries

Weight ranges or `axes` load the **variable** font so `font-weight` / `font-variation-settings` drive axes per element.

### `googleFonts` options

```tsx
await googleFonts([
  { name: "Inter", weight: [400, 700], style: "italic" },
  { name: "Noto Sans JP", weight: "600..700" },
  { name: "Fraunces", weight: "100..900", axes: { opsz: "9..144" } },
]);
```

Fetch limits shared with image helpers: `timeout` (default 5s), `maxBytes`, `allowUrl`, custom `fetch`.

### Reuse across many renders

```ts
import { Renderer } from "@takumi-rs/core";

const renderer = new Renderer();
await renderer.registerFont(archivoBytes);
// then pass { renderer, fonts: [...] } or rely on registered fonts + fontFamilies
```

`registerFont` replaces v1 `loadFont` / `loadFonts` / `loadFontSync`. Use only for preloading **outside** the hot request path when needed.

### Fallback chain

`fontFamilies: ["Inter", "Noto Sans JP"]` — ordered families tried when a glyph is missing. Defaults to registered families in registration order.

**Important:** CSS generics like `sans-serif` resolve to **registered** families, **not** the built-in Geist last-resort.

### Performance note

Prefer **TTF** when decode speed matters; **WOFF2** when transfer size matters (WOFF2 decompresses before use).

## Images

Takumi fetches remote URLs in `src`, `background-image`, and `mask-image`.

### Shared byte cache

```tsx
const fetchCache = new Map<string, Promise<ArrayBuffer>>();

await render(element, {
  images: { fetchCache },
});
```

Use a bounded LRU for high-cardinality URLs; a plain `Map` never evicts.

### Fetch limits / SSRF

| Option | Default | Use |
| --- | --- | --- |
| `timeout` | `5000` ms | Hang protection (`0` disables) |
| `maxBytes` | 32 MiB | Reject huge bodies |
| `allowUrl` | allow all | Allowlist when markup is user-influenced |
| `fetch` | `globalThis.fetch` | Custom fetch |

Redirects are capped (5 hops); `allowUrl` runs on each hop. DNS is not inspected — use custom `fetch` for resolved-IP policies.

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

Group form: `{ sources, fetch, fetchCache, cache }`.

Decode cache modes: `auto` (default) | `none` (read but don't populate). Renderer `cacheMaxBytes` defaults to 16 MiB.

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

## Emoji

Default provider: `twemoji`. Set `emoji` on render / `ImageResponse`:

`twemoji` | `blobmoji` | `noto` | `openmoji` | `fluent` | `fluentFlat` | `"from-font"`

Compatible with the satori/`next/og` emoji option shape. Helpers: `extractEmojis` from `takumi-js/helpers/emoji`.

## Styling (four paths)

1. **`style` prop** — inline CSSProperties  
2. **`tw` prop** — built-in Tailwind-like parser (arbitrary values OK; **no theme config**; **no Preflight** → UA margins remain)  
3. **`<style>` in JSX** — embedded CSS  
4. **`stylesheets`** — compiled CSS matched against class/id selectors  

### Full Tailwind via stylesheets

```tsx
import stylesheet from "~/styles/global.css?inline";

new ImageResponse(
  <div className="bg-background text-foreground flex w-full h-full items-center justify-center text-4xl">
    Hello Tailwind!
  </div>,
  { width: 1200, height: 630, stylesheets: [stylesheet] },
);
```

Requires a bundler that can emit inline CSS (e.g. Vite + `@tailwindcss/vite`).

### CSS surface (high level)

Supported beyond typical OG subsets: Grid, block, inline, float, `calc()`, `z-index`, `:is()` / `:where()`, `::before` / `::after`, masks, `clip-path`, `backdrop-filter`, blend modes, `background-clip: text`, conic gradients, `@keyframes` / `animation`, RTL.
