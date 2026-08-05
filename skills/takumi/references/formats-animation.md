# Output Formats and Animation

## Raster formats (`render`)

| Format | Alpha | `quality` | `lossless` | Notes |
| --- | --- | --- | --- | --- |
| `png` (default) | Yes | No | No | Lossless; transparency / exact pixels |
| `jpeg` | No | Yes | No | Lossy; alpha flattened |
| `webp` | Yes | Yes | Yes | `lossless: true` wins over quality |
| `ico` | Yes | No | No | Favicon; PNG inside |
| `raw` | Yes | No | No | Uncompressed RGBA, `width × height × 4` |

```tsx
await render(<OgImage />, { width: 1200, height: 630, format: "png" });
await render(<OgImage />, { width: 1200, height: 630, format: "jpeg", quality: 80 });
await render(<OgImage />, { width: 1200, height: 630, format: "webp", lossless: true });
```

`quality` is `0`–`100` (default `75`) where honored.

On **`@takumi-rs/wasm`**, WebP is always lossless and the `lossless` knob may be absent from types; `quality` still applies to JPEG.

### Device pixel ratio

```tsx
await render(<OgImage />, { width: 1200, height: 630, devicePixelRatio: 2 });
// → 2400×1260 pixels; CSS layout sizes unchanged
```

### Dithering

`none` (default) | `ordered-bayer` | `floyd-steinberg` — reduces banding when colors quantize (static + `raw`).

## Vector SVG (`renderSvg`)

Same inputs as `render`; returns an SVG **document string** (real `<rect>`, `<path>`, gradients, glyph outlines, embedded images).

```tsx
import { renderSvg } from "takumi-js";

const svg = await renderSvg(<OgImage />, { width: 1200, height: 630 });
```

Raster-only knobs do **not** apply: `format`, `quality`, `lossless`, `dithering`, `drawDebugBorder`, `devicePixelRatio`.

Drop-in mental model for `satori()` → `renderSvg()` when you need SVG; prefer `render()` when you need a bitmap.

## Animation

Two paths:

1. **`renderAnimation()`** — encode GIF / APNG / animated WebP from scenes  
2. **`render(..., { timeMs, keyframes })`** — sample one frame (e.g. pipe `format: "raw"` into ffmpeg)

### `renderAnimation`

```tsx
import { renderAnimation } from "takumi-js";
import { writeFile } from "node:fs/promises";

const animation = await renderAnimation({
  width: 400,
  height: 400,
  fps: 30,
  format: "webp",
  scenes: [
    {
      durationMs: 1000,
      node: (
        <div tw="w-full h-full flex items-center justify-center">
          <div tw="w-32 h-32 bg-blue-500 animate-spin rounded-lg" />
        </div>
      ),
    },
  ],
});

await writeFile("./output.webp", animation);
```

CSS `@keyframes`, `animation`, and Tailwind utilities (`animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, arbitrary `animate-[…]`) resolve along the time axis. Images/fonts are shared across scenes.

### Raw frames → ffmpeg

```tsx
const frame = await render(scene, {
  width,
  height,
  format: "raw",
  keyframes,
  timeMs,
});
// write RGBA frames to ffmpeg rawvideo stdin
```

## Measure (layout only)

`measure` is a **`Renderer` method**, not a top-level `takumi-js` export. Use it to inspect layout without encoding pixels when optimizing templates.
