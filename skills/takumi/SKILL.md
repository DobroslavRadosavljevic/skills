---
name: takumi
description: "Build, review, debug, migrate, or plan OG/social image and animation rendering with Takumi (takumi-js 2.14). Use for takumi-js, @takumi-rs/core, @takumi-rs/wasm, @takumi-rs/helpers, ImageResponse, render, renderSvg, renderAnimation, css option, googleFonts, fonts/generic, setGlyphCacheMaxBytes, wasm-url/no-init, next/og replacement, Satori migration, TanStack Start OG routes, Cloudflare Workers WASM, animated WebP/GIF/APNG, tables, and JSX-to-image without a headless browser."
---

# Takumi

Use this skill when work touches **Takumi** / **`takumi-js`**: rendering JSX, HTML, or node trees to PNG/JPEG/WebP/ICO/SVG/animations without Chromium; `ImageResponse` OG routes; fonts/images/emoji; Tailwind `tw` vs compiled `css`; WASM bundling; or migrating from `next/og` / Satori / v1.

Snapshot: `takumi-js@2.14.0` with matching `@takumi-rs/core`, `@takumi-rs/wasm`, `@takumi-rs/helpers`, `@takumi-rs/image-response` (2026-09-18). Sibling PDF package is `takumi-pdf@0.15.0`. Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `takumi-js` (preferred all-in-one), optionally `@takumi-rs/core`, `@takumi-rs/wasm`, `@takumi-rs/helpers`.
   - Version: target **v2.14**. Treat v1 APIs (`loadFonts`, `fetchedResources`, `createImageResponse`) as legacy. `stylesheets` and the `keyframes` render option are deprecated (removed in v3) — use `css`.
   - Runtime: Node/Bun native vs Edge / Cloudflare Workers / browser WASM. `takumi-js` auto-picks; `takumi-js` and `@takumi-rs/wasm` require **Node `>=20.19`**. Pin platform natives for cross-compile deploys.
   - Entry: `render` / `renderSvg` / `renderAnimation` vs `ImageResponse` from `takumi-js/response`. Force backends with `takumi-js/node` or `takumi-js/wasm`. Browser bundles: `takumi-js/wasm/no-init` + `takumi-js/wasm-url`.
   - Styling path: inline `style`, built-in `tw`, `<style>`, or `css` (string, list, or rule objects).
2. Refresh docs when the user asks for latest behavior, the installed version is unclear, or work touches `css` / WASM bundling / animation. Start from [source-map.md](references/source-map.md).
3. For install, packages, `render` / `ImageResponse`, inputs, caches, and canvas sizing, use [setup-core.md](references/setup-core.md).
4. For fonts, images, emoji, `tw`, `css`, tables, and lists, use [fonts-images-styling.md](references/fonts-images-styling.md).
5. For formats, DPR, SVG, animation, and raw/ffmpeg frames, use [formats-animation.md](references/formats-animation.md).
6. For Next.js, TanStack Start, Workers, Nitro, WASM bundlers, and other hosts, use [frameworks.md](references/frameworks.md).
7. For v1→v2, 2.5→2.14 deltas, Satori/`next/og` migration, and troubleshooting, use [pitfalls-migration.md](references/pitfalls-migration.md).
8. Prefer `bun` / `bunx` in command examples. Never copy Fumadocs annotations (`[!code --]`, `[!code highlight]`) into generated code.

## Judgment

- Default to **`render(node, options)`** or **`new ImageResponse(node, options)`**. Use `Renderer` from `takumi-js/node` (or `@takumi-rs/core`) only to reuse font/image caches across many renders.
- **Always `await`** `render`, `renderSvg`, and `renderAnimation` (and napi/WASM `Renderer` methods).
- Put **`w-full h-full`** (or `width`/`height: 100%`) on the **root** — the canvas size alone does not stretch the root.
- Pass **fonts per call** via `fonts` (array or `Promise`). Built-in last-resort is Geist Latin, weights **300–800**. Register anything else (CJK, custom brands). Generic `sans-serif` resolves to **registered** families, not the built-in. Prefer **`googleFonts`** from `takumi-js/helpers`; weight ranges / `axes` load variable fonts. Use `generic: "monospace"` (etc.) so `font-mono` resolves.
- Prefer **`css`** over deprecated `stylesheets`. Pass compiled Tailwind, a Tailwind v4 source (`@theme`, `@import "tailwindcss"`, `@apply`), or rule objects `{ selector, style }`. Do not pass both `css` and `stylesheets`.
- `tw` is a **built-in Tailwind subset**. No Preflight unless `css` includes `@import "tailwindcss"`. Unlayered stylesheet rules beat utilities; `!` flips that. Tokens on `:root` / `@theme` drive utilities (`--color-brand-500` → `bg-brand-500`).
- Bare `<div>` is **`display: block`** (CSS), not flex — unlike Satori. Explicit `display: flex` from old templates still works.
- When user input can influence remote `src` / background URLs, set **`images.allowUrl`** (SSRF). Do not share `fetchCache` across trust boundaries. Fetch timeout default is **30s** (not 5s).
- Prefer native **`takumi-js/node`** on Node/Bun for multi-threaded renders; WASM is single-threaded. Browser/webpack/Turbopack: `wasm/no-init` + `wasm-url`, not the Vite `?url` entry.
- Drop-in for **`next/og`**: swap import to `takumi-js/response`. Skip Chromium / Satori+sharp pipelines unless the project already depends on them for non-Takumi reasons.
- Invoices/reports: **`takumi-pdf`**, not `takumi-js`.

## Verification

Prefer the repo's existing checks. For meaningful Takumi work, include the relevant subset:

- Typecheck route handlers / render scripts (`ImageResponse`, `RenderOptions`, `css`).
- Smoke-render one static OG (`1200×630`) and open the bytes (or hit the route).
- Confirm root fills the canvas; use `drawDebugBorder: true` when layout looks wrong.
- For CJK/custom type, confirm `fonts` / `googleFonts` and no tofu glyphs.
- On deploy: native binding present for the **target** OS/arch (or WASM path on Workers). Node **20.19+** for `takumi-js` / WASM.
- After v1→v2: re-check `await`, `fonts`/`images` options, and `new ImageResponse(jsx, opts)`.
- After 2.5→2.14: re-check `css` (not only `stylesheets`), fetch timeout, 64 MiB / 64 MP budgets, and WASM bundler entries.
