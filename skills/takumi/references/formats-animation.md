# Output Formats and Animation

## Raster formats (`render`)

| Format | Alpha | `quality` | `lossless` | Notes |
| --- | --- | --- | --- | --- |
| `png` (default) | Yes | No | No | Lossless; transparency / exact pixels. Photo-like PNGs encode smaller/faster as of 2.14 |
| `jpeg` | No | Yes | No | Lossy; alpha flattened |
| `webp` | Yes | Yes (native) | Yes (native) | Native: omit both → lossless; `lossless: true` wins over quality. WASM: always lossless, no `lossless` knob |
| `ico` | Yes | No | No | Favicon; PNG inside |
| `raw` | Yes | No | No | Uncompressed RGBA, `width × height × 4` |

```tsx
await render(<OgImage />, { width: 1200, height: 630, format: "png" });
await render(<OgImage />, { width: 1200, height: 630, format: "jpeg", quality: 80 });
await render(<OgImage />, { width: 1200, height: 630, format: "webp", lossless: true });
```

`quality` is `0`–`100` where honored. JPEG docs still cite default `75` when the knob applies.

On **`@takumi-rs/wasm`**, WebP is always lossless and `quality` is ignored for WebP; `quality` still applies to JPEG.

### Device pixel ratio

```tsx
await render(<OgImage />, { width: 1200, height: 630, devicePixelRatio: 2 });
// → 2400×1260 pixels; CSS layout sizes unchanged
```

### Dithering

`none` (default) | `ordered-bayer` — reduces banding when gradient fills quantize (static + `raw`).

`floyd-steinberg` is a **deprecated alias of `ordered-bayer`** (removed in v3).

### Canvas budget

Max **64 megapixels** (was 16). `3840×2160` is fine; `7680×4320` and `4096×16384` fit. Over budget: `Invalid viewport dimensions: a canvas holds 1 to 64 megapixels`. A full 64 MP buffer is 256 MiB before encoding.

## Vector SVG (`renderSvg`)

Same inputs as `render`; returns an SVG **document string** (real `<rect>`, `<path>`, gradients, glyph outlines, embedded images). SVG `<text>` / `<tspan>` / `textPath` in **image sources** draw with registered fonts (color emoji glyphs inside SVG text are not supported).

```tsx
import { renderSvg } from "takumi-js";

const svg = await renderSvg(<OgImage />, { width: 1200, height: 630 });
```

Raster-only knobs do **not** apply: `format`, `quality`, `lossless`, `dithering`, `drawDebugBorder`, `devicePixelRatio`.

Drop-in mental model for `satori()` → `renderSvg()` when you need SVG; prefer `render()` when you need a bitmap.

Text inside a zero-size box paints in SVG the same way it does in raster (2.14).

## Animation

Two paths:

1. **`renderAnimation()`** — encode GIF / APNG / animated WebP from scenes
2. **`render(..., { timeMs, css })`** — sample one frame (e.g. pipe `format: "raw"` into ffmpeg)

FPS caps (throws if exceeded): **90** WebP/APNG, **50** GIF.

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

CSS `@keyframes`, `animation`, and Tailwind utilities (`animate-spin`, `animate-ping`, `animate-pulse`, `animate-bounce`, arbitrary `animate-[…]`) resolve along the time axis. Images/fonts are shared across scenes. Scenes are concatenated, not tweened.

`steps()` accepts `jump-start` | `jump-end` | `jump-none` | `jump-both`; `steps(4)` means `jump-end`.

Native WebP animation: omit `quality`/`lossless` → lossless; later frames can encode only the changed rectangle (2.13.1).

### Object keyframes (preferred over deprecated `keyframes`)

```tsx
const output = await render(<div tw="animate-[move_1s_ease-in-out_infinite_alternate]" />, {
  width: 100,
  height: 100,
  format: "png",
  timeMs: 500,
  css: {
    keyframes: "move",
    steps: [
      { offset: "from", style: { transform: "translateX(0)" } },
      { offset: "50%", style: { transform: "translateX(60px)" } },
      { offset: "to", style: { transform: "translateX(120px)" } },
    ],
  },
});
```

Offsets: `from` | `to` | `"<n>%"`. The `keyframes` **render option** takes a nested record and is **deprecated** (removed in v3).

### Raw frames → ffmpeg

```tsx
const frame = await render(scene, {
  width,
  height,
  format: "raw",
  css: move,
  timeMs,
});
// write RGBA frames to ffmpeg rawvideo stdin
```

Example: https://github.com/kane50613/takumi/blob/master/example/ffmpeg-keyframe-animation/

## Measure (layout only)

`measure` is a **`Renderer` method**, not a top-level `takumi-js` export. Use it to inspect layout without encoding pixels when optimizing templates. See [setup-core.md](setup-core.md).
