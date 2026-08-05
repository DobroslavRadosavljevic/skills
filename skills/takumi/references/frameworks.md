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

## Cloudflare Workers / Edge / browser

Use `takumi-js` as usual — it resolves to **`@takumi-rs/wasm`**. Prefer smaller payloads and explicit `fonts` / `images` (no system fonts). WebP on WASM is always lossless.

Force backends if needed: `takumi-js/wasm` or `takumi-js/node`.

## Other hosts (docs)

| Host | Notes |
| --- | --- |
| Astro | OG images at build time — https://takumi.kane.tw/docs/integration/astro |
| SvelteKit | Server render — https://takumi.kane.tw/docs/integration/sveltekit |
| Nitro | Server route — https://takumi.kane.tw/docs/integration/nitro |
| Nuxt | Via Nuxt OG Image Takumi renderer |
| Fumapress | Plugin for per-page OG images |

## Production tips

- Reuse one `Renderer` (or pass `renderer` into `ImageResponse`) when serving many cards with shared fonts/images.
- Raise `cacheMaxBytes` when many large assets stay hot (default 16 MiB).
- Prefer native core on Node for parallel renders; WASM is single-threaded.
- Cross-compile deploys: install the target `@takumi-rs/core-*` optional native package explicitly (see [pitfalls-migration.md](pitfalls-migration.md)).
