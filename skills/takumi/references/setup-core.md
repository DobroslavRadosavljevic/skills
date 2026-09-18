# Setup and Core API

## Install

```sh
bun add takumi-js
```

`takumi-js` bundles `@takumi-rs/core` (native) and `@takumi-rs/wasm`. At runtime it picks native on Node.js / Bun and WASM on Cloudflare Workers, Vercel Edge, Deno, and browsers. No extra install for the common case.

Engines:

| Package | Node |
| --- | --- |
| `takumi-js`, `@takumi-rs/wasm`, `@takumi-rs/image-response` | `>=20.19` |
| `@takumi-rs/core` | `>=18` |

`takumi-js@2.13.5` raised the umbrella/WASM floor to 20.19 (`process.getBuiltinModule` in the Vite server entry).

Invoices, reports, and paged documents: `bun add takumi-pdf` (separate package, WASM-only, `takumi-pdf@0.15.0` with this snapshot). See https://takumi.kane.tw/docs/pdf.

## Prefer these entry points

| Goal | Import |
| --- | --- |
| Bytes to disk / pipeline | `import { render, renderSvg, renderAnimation } from "takumi-js"` |
| HTTP route / OG endpoint | `import { ImageResponse } from "takumi-js/response"` |
| Fonts / images helpers | `import { googleFonts, prepareImages } from "takumi-js/helpers"` |
| Force native | `import { render, Renderer } from "takumi-js/node"` |
| Force WASM (auto-init) | `import { render, Renderer } from "takumi-js/wasm"` |
| Browser bundle WASM | `takumi-js/wasm/no-init` + `takumi-js/wasm-url` |
| Reuse caches across many renders | `Renderer` from `takumi-js/node` or `@takumi-rs/core` |

`Renderer` is **not** the default. Prefer per-call `fonts` / `images` on `render` or `ImageResponse` unless you need a long-lived font/image cache.

`render` also accepts `module` to pass a WASM binary when you are not using the auto-init entry.

## Static render

```tsx
import { render } from "takumi-js";
import { writeFile } from "node:fs/promises";

const png = await render(
  <div
    style={{
      fontSize: 72,
      background: "linear-gradient(to bottom right, #fff7ed, #fecaca)",
    }}
    tw="w-full h-full flex items-center justify-center"
  >
    Hello Takumi
  </div>,
  { width: 1200, height: 630 },
);

await writeFile("hello.png", png);
```

Rules:

- `render` / `renderSvg` / `renderAnimation` are **async** — always `await`.
- `width` / `height` set the **canvas**. The root does **not** fill it unless you set `w-full h-full` or `width`/`height: 100%`.
- Default format is PNG.
- Canvas budget is **64 megapixels** (was 16). Over that, `render` throws `InvalidViewport` (`8192×8192` is the largest square). Each pixel is 4 bytes before encoding.

## ImageResponse

Drop-in for `next/og`. Extends the web `Response`. Named and default exports both work.

```tsx
import { ImageResponse } from "takumi-js/response";

export function GET() {
  return new ImageResponse(
    <div tw="w-full h-full grid place-items-center">Hello Takumi</div>,
    { width: 1200, height: 630 },
  );
}
```

Options = render options + `ResponseInit` + optional `onError`.

- `content-type` follows `format`.
- Set cache headers via `headers`.
- `ready` resolves on success / rejects on failure — await it to serve a fallback:

```tsx
const response = new ImageResponse(<OgImage />, { width: 1200, height: 630 });
try {
  await response.ready;
  return response;
} catch {
  return new Response("Failed to generate image", { status: 500 });
}
```

`onError` is for logging only; it cannot substitute a fallback body.

Pass `renderer` to reuse a configured `Renderer` across responses.

`jsx` forwards to `fromJsx`: `{ defaultStyles: false }` drops Chromium UA presets; `tailwindClassesProperty` defaults to `"tw"`.

Low-level package: `@takumi-rs/image-response` (same version line). Prefer `takumi-js/response`.

## Render inputs

`RenderInput` accepts:

- React / JSX elements (hooks run with **server** semantics: initial state, no effects; no `react-dom`)
- HTML strings (`fromHtml` collects `<style>` in `<head>`, decodes character references)
- Prebuilt Takumi node trees (`container` / `text` / `image` helpers)

Preact trees work if components do not call Preact hooks (mangled internals).

`fonts` may be a `Promise` — `googleFonts([...])` can be passed without `await`.

## Optional signal

```tsx
await render(<OgImage />, {
  width: 1200,
  height: 630,
  signal: request.signal,
});
```

Aborts font/image fetches; an already-aborted signal throws before work starts. On WASM the actual encode is blocking and ignores `signal` during the call — Takumi rechecks abort after loading, before encode.

## Debug layout

```tsx
new ImageResponse(<OgImage />, {
  width: 1200,
  height: 630,
  drawDebugBorder: true,
});
```

## Caches and measure

`render` / `ImageResponse` reuse a managed renderer. When constructing `Renderer` yourself:

```ts
import { Renderer } from "takumi-js/node";

const renderer = new Renderer({ cacheMaxBytes: 64 * 1024 * 1024 });
```

Default decode/stylesheet budget is **64 MiB** (was 16). `0` disables. One decoded image may use the whole budget.

Glyph outlines/masks are process-wide (not per renderer). Call **before the first render**:

```ts
import { setGlyphCacheMaxBytes } from "takumi-js";

setGlyphCacheMaxBytes(64 * 1024 * 1024); // default 8 MiB
```

`measure` is a **`Renderer` method**, not a top-level `takumi-js` export:

```tsx
import { Renderer } from "takumi-js/node";
import { fromJsx } from "takumi-js/helpers/jsx";

const renderer = new Renderer();
const { node, css } = await fromJsx(<span tw="text-xl">Headline</span>);
const { width, height, transform, children, runs } = await renderer.measure(node, { css });
```

Lengths are device pixels (`20px` → `40` at `devicePixelRatio: 2`). `transform` is absolute; run `x`/`y` are relative to the owning node's content box.

## Default font caveat

Takumi does **not** read system fonts. One last-resort font ships in-tree: **Geist**, Latin glyphs, weights **300–800**. Anything else (including CJK) needs `fonts` or glyphs render as tofu. See [fonts-images-styling.md](fonts-images-styling.md).
