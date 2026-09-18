# Framework Integration

Official guides: https://takumi.kane.tw/docs/integration

## Next.js

1. `bun add takumi-js`
2. Mark the native core external so Next does not bundle it:

```ts
// next.config.ts
import type { NextConfig } from "next";

const config: NextConfig = {
  serverExternalPackages: ["@takumi-rs/core"],
};

export default config;
```

3. App Router route handler:

```tsx
// app/og/route.tsx
import { ImageResponse } from "takumi-js/response";
import OgImage from "./OgImage";

export function GET(request: Request) {
  const url = new URL(request.url);
  const title = url.searchParams.get("title") ?? "Takumi + Next.js";
  const description =
    url.searchParams.get("description") ?? "Render OG images with React.";

  return new ImageResponse(
    <OgImage title={title} description={description} />,
    { width: 1200, height: 630 },
  );
}
```

Migrate from `next/og` by swapping the `ImageResponse` import. See also `opengraph-image.tsx` patterns in the Next.js guide.

Do **not** add `turbopack.rules["*.wasm"] = { type: "wasm" }` — that looks for wasm-bindgen glue Takumi does not ship.

## TanStack Start

File route with `server.handlers`:

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { ImageResponse } from "takumi-js/response";

export const Route = createFileRoute("/og-image")({
  server: {
    handlers: {
      GET({ request }) {
        const url = new URL(request.url);
        const title = url.searchParams.get("title") ?? "Takumi + TanStack Start";
        const description =
          url.searchParams.get("description") ??
          "Render OG images from a route handler.";

        return new ImageResponse(
          <div
            style={{
              width: "100%",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              padding: "64px",
              backgroundImage:
                "linear-gradient(to bottom right, #eff6ff, #dbeafe)",
            }}
          >
            <p style={{ fontSize: 72, fontWeight: 700, color: "#111827" }}>
              {title}
            </p>
            <p style={{ fontSize: 42, fontWeight: 500, color: "#4b5563" }}>
              {description}
            </p>
          </div>,
          { width: 1200, height: 630 },
        );
      },
    },
  },
});
```

Hit `/og-image?title=Hello&description=From%20TanStack%20Start`.

(Named or default import of `ImageResponse` both work — the module exports both.)

## Cloudflare Workers / Edge

Use `takumi-js` as usual — it resolves to **`@takumi-rs/wasm`**. Prefer smaller payloads and explicit `fonts` / `images` (no system fonts). WebP on WASM is always lossless.

Force backends if needed: `takumi-js/wasm` or `takumi-js/node`.

Override the WASM binary: `render(node, { module, width, height })`.

## Browser / webpack / Turbopack WASM

Vite, webpack, and Turbopack set the same browser export conditions. The Vite `?url` entry **only works in Vite**. For a portable browser bundle, load the binary yourself. `takumi-js/wasm/no-init` re-exports `@takumi-rs/wasm` (`init`, `Renderer`) — it is **not** the JSX `render` helper:

```ts
import init, { Renderer } from "takumi-js/wasm/no-init";
import wasmUrl from "takumi-js/wasm-url";

await init({ module_or_path: wasmUrl });
const renderer = new Renderer();
```

`wasm-url` resolves the binary via `new URL(specifier, import.meta.url)` so Vite, webpack, and Turbopack emit the asset. Pair it with `wasm/no-init` so the auto-init entry stays out of the bundle. High-level `render` from `takumi-js` can take the same asset as `module` instead of constructing `Renderer`.

Client builds that hit `Cannot bundle Node.js built-in "node:fs/promises"` need this pair (fixed for `browser` condition in 2.13.5).

esbuild / Rollup / Bun bundler flattening the Node entry: mark `takumi-js` **external**, or the `new URL(...)` path lands next to the output instead of `node_modules`.

Vite SSR: `ssr: { external: ["takumi-js"] }` (or `@takumi-rs/wasm`) if you see `Unable to locate Takumi WASM asset for SSR`. A plain `vite build --ssr` with `ssrEmitAssets` writes the asset under `assets/` (2.8.0).

## Nitro

Every Nitro preset defaults to the **WASM** backend (`unwasm` condition while `wasm` is on). Same route deploys to edge and WebContainers.

Prefer native on the Node preset:

```ts
// nitro.config.ts
export default defineNitroConfig({
  exportConditions: ["!unwasm"],
});
```

Do not set `wasm: false` just to get native — that also breaks other `.wasm` imports. Negate the condition instead.

JSX-free Nitro route: `container` / `text` from `takumi-js/helpers` + `ImageResponse`.

## Other hosts (docs)

| Host | Notes |
| --- | --- |
| Astro | OG images at build time — https://takumi.kane.tw/docs/integration/astro |
| SvelteKit | Server render — https://takumi.kane.tw/docs/integration/sveltekit |
| Nuxt | Via Nuxt OG Image Takumi renderer — https://takumi.kane.tw/docs/integration/nuxt |
| Fumapress | Plugin for per-page OG images — https://takumi.kane.tw/docs/integration/fumapress |
| Bun `serve` | Return `ImageResponse` from `fetch` |

## Production tips

- Reuse one `Renderer` (or pass `renderer` into `ImageResponse`) when serving many cards with shared fonts/images.
- Raise `cacheMaxBytes` when many large assets stay hot (default **64 MiB**).
- Call `setGlyphCacheMaxBytes` before the first render for large CJK sets (default 8 MiB, process-wide).
- Prefer native core on Node/Bun for parallel renders; WASM is single-threaded.
- Cross-compile deploys: install the target `@takumi-rs/core-*` optional native package explicitly (see [pitfalls-migration.md](pitfalls-migration.md)).
