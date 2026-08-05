# Pitfalls, Migration, and Troubleshooting

## vs Satori / `next/og`

| Topic | Satori / next/og | Takumi |
| --- | --- | --- |
| Pipeline | JSX → SVG → resvg/sharp | One engine → encoded bytes (or SVG) |
| Layout | Flexbox only; forces flex | Flexbox, Grid, block, inline, float |
| Bare `<div>` | Effectively flex | CSS `display: block` |
| Fonts required? | Yes (throws without) | Geist Latin last-resort built in |
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

Templates that already set `display: flex` usually render unchanged.

## v1 → v2 checklist

Docs: https://takumi.kane.tw/docs/upgrade/v2

- [ ] `await` all top-level renders and Renderer methods
- [ ] `new Renderer()` with **no** constructor fonts; pass `fonts` per call
- [ ] Replace `loadFont*` with per-call `fonts` or `registerFont`
- [ ] `fetchedResources` → `images`; `resourcesOptions` → `images.fetch` / `timeout` / `fetchCache`
- [ ] `extractResourceUrls` + `fetchResources` → `prepareImages({ node, fetchCache? })`
- [ ] `createImageResponse(opts)(jsx)` → `new ImageResponse(jsx, opts)` from `takumi-js/response`
- [ ] Remove `encodeFrames` → `renderAnimation` or per-frame `render`
- [ ] Format is a string (`"png"` | `"jpeg"` | `"webp"` | …) plus optional `quality` / `lossless`
- [ ] Re-check CSS defaults visually (e.g. `position` static, border medium, transform-origin center)

## Common pitfalls

| Symptom | Fix |
| --- | --- |
| Blank / tiny content | Root needs `w-full h-full` (or 100% width/height) |
| Tofu / missing glyphs | Pass `fonts` / `googleFonts`; CJK never uses built-in Geist |
| `sans-serif` wrong face | Generics resolve to registered families, not Geist |
| Unexpected block layout | Satori forced flex; set `display: flex` or `tw="flex …"` explicitly |
| UA margins with `tw` | No Preflight — reset margins or use full Tailwind `stylesheets` |
| `Cannot find native binding` | Hoist `@takumi-rs/core-*` (pnpm) or install target platform package |
| Deploy OS ≠ install OS | Explicitly add e.g. `@takumi-rs/core-linux-x64-gnu` |
| Node `fetch failed` on images | Use data URLs or pre-fetched `images` entries |
| SSRF risk | Set `images.allowUrl` when users influence markup |
| Copied docs broken | Strip `[!code --]` / `[!code highlight]` annotations |

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

## Debug

```tsx
drawDebugBorder: true
```

File upstream issues at https://github.com/kane50613/takumi when layout remains wrong after borders + verified CSS.
