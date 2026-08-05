---
name: takumi
description: "Build, review, debug, migrate, or plan OG/social image and animation rendering with Takumi (takumi-js). Use for takumi-js, @takumi-rs/core, @takumi-rs/wasm, ImageResponse, render, renderSvg, renderAnimation, googleFonts, tw prop, stylesheets, next/og replacement, Satori migration, TanStack Start OG routes, Cloudflare Workers WASM, animated WebP/GIF/APNG, and JSX-to-image without a headless browser."
---

# Takumi

Use this skill when work touches **Takumi** / **`takumi-js`**: rendering JSX, HTML, or node trees to PNG/JPEG/WebP/ICO/SVG/animations without Chromium; `ImageResponse` OG routes; fonts/images/emoji; Tailwind `tw` vs full stylesheets; or migrating from `next/og` / Satori.

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `takumi-js` (preferred all-in-one), optionally `@takumi-rs/core`, `@takumi-rs/wasm`, `@takumi-rs/helpers`.
   - Version: target **v2** (current `2.5.x`). Treat v1 APIs (`loadFonts`, `fetchedResources`, `createImageResponse`) as legacy.
   - Runtime: Node (native) vs Edge / Cloudflare Workers / browser (WASM). `takumi-js` auto-picks; pin platform natives for cross-compile deploys.
   - Entry: `render` / `renderSvg` / `renderAnimation` vs `ImageResponse` from `takumi-js/response`.
   - Styling path: inline `style`, built-in `tw`, `<style>`, or compiled CSS via `stylesheets`.
2. Refresh docs when the user asks for latest behavior, the installed major is unclear, or work touches v2 resource options / animation. Start from [source-map.md](references/source-map.md).
3. For install, packages, `render` / `ImageResponse`, inputs, and canvas sizing, use [setup-core.md](references/setup-core.md).
4. For fonts, images, emoji, `tw`, and stylesheets, use [fonts-images-styling.md](references/fonts-images-styling.md).
5. For formats, DPR, SVG, animation, and raw/ffmpeg frames, use [formats-animation.md](references/formats-animation.md).
6. For Next.js, TanStack Start, Workers, Astro, and other hosts, use [frameworks.md](references/frameworks.md).
7. For v2 upgrades, Satori/`next/og` migration, and troubleshooting, use [pitfalls-migration.md](references/pitfalls-migration.md).
8. Prefer `bun` / `bunx` in command examples. Never copy Fumadocs annotations (`[!code --]`, `[!code highlight]`) into generated code.

## Judgment

- Default to **`render(node, options)`** or **`new ImageResponse(node, options)`**. Use `Renderer` from `@takumi-rs/core` only to reuse font/image caches across many renders.
- **Always `await`** `render`, `renderSvg`, and `renderAnimation` (and napi/WASM `Renderer` methods).
- Put **`w-full h-full`** (or `width`/`height: 100%`) on the **root** — the canvas size alone does not stretch the root.
- Pass **fonts per call** via `fonts`. Built-in last-resort is Geist Latin (~400–800). Register anything else (CJK, custom brands). Generic `sans-serif` resolves to **registered** families, not the built-in.
- Prefer **`googleFonts`** from `takumi-js/helpers` for Google families; weight ranges / `axes` load variable fonts.
- `tw` is a **built-in Tailwind subset with no Preflight** (UA margins remain). For full Tailwind v4 + themes, compile CSS and pass `stylesheets`.
- Bare `<div>` is **`display: block`** (CSS), not flex — unlike Satori. Explicit `display: flex` from old templates still works.
- When user input can influence remote `src` / background URLs, set **`images.allowUrl`** (SSRF). Prefer `fetchCache` for hot shared URLs.
- Prefer native **`@takumi-rs/core`** on Node for multi-threaded renders; WASM is single-threaded.
- Drop-in for **`next/og`**: swap import to `takumi-js/response`. Skip Chromium / Satori+sharp pipelines unless the project already depends on them for non-Takumi reasons.

## Verification

Prefer the repo's existing checks. For meaningful Takumi work, include the relevant subset:

- Typecheck route handlers / render scripts (`ImageResponse`, `RenderOptions`).
- Smoke-render one static OG (`1200×630`) and open the bytes (or hit the route).
- Confirm root fills the canvas; use `drawDebugBorder: true` when layout looks wrong.
- For CJK/custom type, confirm `fonts` / `googleFonts` and no tofu glyphs.
- On deploy: native binding present for the **target** OS/arch (or WASM path on Workers).
- After v1→v2: re-check `await`, `fonts`/`images` options, and `new ImageResponse(jsx, opts)`.
