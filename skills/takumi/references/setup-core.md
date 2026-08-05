# Setup and Core API

## Install

```sh
bun add takumi-js
```

`takumi-js` bundles `@takumi-rs/core` (native) and `@takumi-rs/wasm`. At runtime it picks native on Node.js and WASM on Cloudflare Workers, Vercel Edge, Deno, and browsers. No extra install for the common case.

Node: `>=18`.

## Prefer these entry points

| Goal | Import |
| --- | --- |
| Bytes to disk / pipeline | `import { render, renderSvg, renderAnimation } from "takumi-js"` |
| HTTP route / OG endpoint | `import { ImageResponse } from "takumi-js/response"` |
| Fonts / images helpers | `import { googleFonts, prepareImages } from "takumi-js/helpers"` |
| Reuse caches across many renders | `import { Renderer } from "@takumi-rs/core"` (escape hatch) |

`Renderer` is **not** the default. Prefer per-call `fonts` / `images` on `render` or `ImageResponse` unless you need a long-lived font/image cache.

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

## ImageResponse

Drop-in for `next/og`. Extends the web `Response`:

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
const response = new ImageResponse(<OgImage />);
try {
  await response.ready;
  return response;
} catch {
  return new Response("Failed to generate image", { status: 500 });
}
```

`onError` is for logging only; it cannot substitute a fallback body.

Pass `renderer` to reuse a configured `Renderer` across responses.

## Render inputs

`RenderInput` accepts:

- React / JSX elements (hooks run with **server** semantics: initial state, no effects; no `react-dom`)
- HTML strings
- Prebuilt Takumi node trees (`container` / `text` / `image` helpers)

Preact trees work if components do not call Preact hooks (mangled internals).

## Optional signal

```tsx
await render(<OgImage />, {
  width: 1200,
  height: 630,
  signal: request.signal,
});
```

Aborts font/image fetches; an already-aborted signal throws before work starts.

## Debug layout

```tsx
new ImageResponse(<OgImage />, {
  width: 1200,
  height: 630,
  drawDebugBorder: true,
});
```

## Default font caveat

Takumi does **not** read system fonts. One last-resort font ships in-tree: **Geist**, Latin glyphs, weights roughly **400–800**. Anything else (including CJK) needs `fonts` or glyphs render as tofu. See [fonts-images-styling.md](fonts-images-styling.md).
