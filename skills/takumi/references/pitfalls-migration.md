# Pitfalls, Migration, and Troubleshooting

## vs Satori / `next/og`

| Topic | Satori / next/og | Takumi |
| --- | --- | --- |
| Pipeline | JSX → SVG → resvg/sharp | One engine → encoded bytes (or SVG) |
| Layout | Flexbox only; forces flex | Flexbox, Grid, block, inline, float, tables |
| Bare `<div>` | Effectively flex | CSS `display: block` |
| Fonts required? | Yes (throws without) | Geist Latin last-resort built in (300–800) |
| Animation | Static only | GIF / APNG / WebP / raw frames |
| Runtimes | Node / Edge / browser | + CF Workers, Rust crate |

Migration:

```tsx
// next/og → Takumi
import { ImageResponse } from "takumi-js/response";

// satori() → SVG
import { renderSvg } from "takumi-js";

// satori + sharp → bitmap
import { render } from "takumi-js";
```

Templates that already set `display: flex` usually render unchanged. Keep explicit Flexbox and compare pixels before deploying.

## v1 → v2 checklist

Docs: https://takumi.kane.tw/docs/upgrade/v2

Treat v1 as **legacy**. Do not generate `loadFonts`, `fetchedResources`, or `createImageResponse`.

- [ ] `await` all top-level renders and Renderer methods
- [ ] `new Renderer()` with **no** constructor fonts; pass `fonts` per call (`cacheMaxBytes` on the constructor is fine)
- [ ] Replace `loadFont*` with per-call `fonts` or `registerFont`
- [ ] `fetchedResources` → `images`; `resourcesOptions` → `images.fetch` / `timeout` / `fetchCache`
- [ ] `extractResourceUrls` + `fetchResources` → `prepareImages({ node, fetchCache? })`
- [ ] `createImageResponse(opts)(jsx)` → `new ImageResponse(jsx, opts)` from `takumi-js/response`
- [ ] Remove `encodeFrames` → `renderAnimation` or per-frame `render`
- [ ] Format is a string (`"png"` | `"jpeg"` | `"webp"` | …) plus optional `quality` / `lossless`
- [ ] `@takumi-rs/image-response/wasm` → `@takumi-rs/image-response` (or `takumi-js/response`)
- [ ] Re-check CSS defaults visually (`position` static, border medium, transform-origin center)

v2.0–v2.5: SVG `currentColor` ignored the host. **v2.6+** uses host color as fallback again.

## 2.5 → 2.14 deltas (this snapshot)

| Change | Action |
| --- | --- |
| `stylesheets` → `css` (2.13) | Rename; both is an error. `fromJsx`/`fromHtml` return `css` |
| `keyframes` option deprecated | Use `css: { keyframes, steps }` |
| Fetch `timeout` default **30s** (was 5s) | Set an explicit timeout under any outer route deadline |
| Decode cache **64 MiB** (was 16); canvas **64 MP** (was 16) | Oversized viewports now fit; memory is higher |
| Node **`>=20.19`** for `takumi-js` / WASM (2.13.5) | `@takumi-rs/core` remains `>=18` |
| Browser WASM entries | `takumi-js/wasm/no-init` + `takumi-js/wasm-url` |
| Geist weights **300–800** (docs; was often cited 400–800) | Light weights may resolve without a custom font |
| `tw` vs unlayered CSS | Stylesheet rules win; use `@layer` or `!` |
| `@import "tailwindcss"` | Turns Preflight on |
| Tables / list markers | Real table/list rendering; do not assume block fallback |
| Animated GIF/WebP/APNG **sources** | Play in animations; stills use frame 0 |
| `floyd-steinberg` dither | Alias of `ordered-bayer`; do not document as a third algorithm |

## Common pitfalls

| Symptom | Fix |
| --- | --- |
| Blank / tiny content | Root needs `w-full h-full` (or 100% width/height) |
| Tofu / missing glyphs | Pass `fonts` / `googleFonts`; CJK never uses built-in Geist |
| `sans-serif` wrong face | Generics resolve to registered families, not Geist |
| Unexpected block layout | Satori forced flex; set `display: flex` or `tw="flex …"` explicitly |
| UA margins with `tw` | No Preflight — reset margins or `@import "tailwindcss"` / compiled `css` |
| `tw` lost to a stylesheet | Expected since 2.13; layer the rule or mark `!` |
| `Cannot find native binding` | Hoist `@takumi-rs/core-*` (pnpm) or install target platform package |
| Deploy OS ≠ install OS | Explicitly add e.g. `@takumi-rs/core-linux-x64-gnu` |
| Node `fetch failed` on images | Use data URLs or pre-fetched `images` entries |
| SSRF risk | Set `images.allowUrl` when users influence markup |
| Shared `fetchCache` leaks hosts | Do not share across URL policies; hits recheck entry URL only |
| `InvalidViewport` | Shrink below 64 MP; zero-size also fails |
| Animation throws on fps | Cap at 90 (WebP/APNG) or 50 (GIF) |
| `Export default doesn't exist` / `?url` | Browser bundle: `wasm/no-init` + `wasm-url` |
| `Cannot bundle node:fs/promises` | Same WASM pair; need 2.13.5+ |
| Copied docs broken | Strip `[!code --]` / `[!code highlight]` annotations |
| `calc()` with 5+ unit types | Parse error since 2.11 (max four distinct units) |

## Native platform packages

| Target | Package |
| --- | --- |
| Linux x64 glibc | `@takumi-rs/core-linux-x64-gnu` |
| Linux x64 musl | `@takumi-rs/core-linux-x64-musl` |
| Linux arm64 glibc | `@takumi-rs/core-linux-arm64-gnu` |
| Linux arm64 musl | `@takumi-rs/core-linux-arm64-musl` |
| macOS x64 | `@takumi-rs/core-darwin-x64` |
| macOS arm64 | `@takumi-rs/core-darwin-arm64` |
| Windows x64 | `@takumi-rs/core-win32-x64-msvc` |
| Windows arm64 | `@takumi-rs/core-win32-arm64-msvc` |

pnpm hoist example:

```yaml
publicHoistPattern:
  - "@takumi-rs/core-*"
```

pnpm older than 10.5.0: `public-hoist-pattern[]=@takumi-rs/core-*` in `.npmrc`.

## Debug

```tsx
drawDebugBorder: true
```

File upstream issues at https://github.com/kane50613/takumi when layout remains wrong after borders + verified CSS.
