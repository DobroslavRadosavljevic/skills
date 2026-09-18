# Source Map

This reference captures the Takumi docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-09-18
- Stable npm package: `takumi-js@2.14.0`
- Related packages (same version line): `@takumi-rs/core@2.14.0`, `@takumi-rs/wasm@2.14.0`, `@takumi-rs/helpers@2.14.0`, `@takumi-rs/image-response@2.14.0`
- Sibling PDF package: `takumi-pdf@0.15.0` (not a `takumi-js` export)
- npm `latest` dist-tag: `2.14.0` (`beta`/`rc` tags still point at 2.0 prereleases)
- Engines: `takumi-js` / `@takumi-rs/wasm` Node `>=20.19`; `@takumi-rs/core` Node `>=18`
- Official site: https://takumi.kane.tw/
- Docs: https://takumi.kane.tw/docs/
- LLM index: https://takumi.kane.tw/llms.txt · full: https://takumi.kane.tw/llms-full.txt
- Repository: https://github.com/kane50613/takumi
- Rust crate: https://crates.io/crates/takumi (`takumi@2.14.0`)
- License: MIT / Apache-2.0
- Context7 selection: `/kane50613/takumi`

Previous skill snapshot was `takumi-js@2.5.9` (2026-08-05). There is no skip of 2.6/2.7 on npm; GitHub tags exist for every 2.6.0–2.14.0 line.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info takumi-js
   bun info @takumi-rs/core
   bun info @takumi-rs/wasm
   ```

3. Prefer https://takumi.kane.tw/docs/ and https://github.com/kane50613/takumi/releases. If docs and package metadata disagree, report the mismatch (see Uncertainties).
4. Check the local project package version before applying v2-only or 2.13+ APIs (`css`, `wasm-url`, Node 20.19).
5. Strip Fumadocs code annotations from any copied samples (`// [!code --]`, `// [!code highlight]`).

## Official Pages

- Introduction / quick start: https://takumi.kane.tw/docs/
- Integration hub: https://takumi.kane.tw/docs/integration
- Next.js: https://takumi.kane.tw/docs/integration/nextjs
- TanStack Start: https://takumi.kane.tw/docs/integration/tanstack-start
- Nitro: https://takumi.kane.tw/docs/integration/nitro
- Astro / SvelteKit / Nuxt / Fumapress: under `/docs/integration/`
- Styling: https://takumi.kane.tw/docs/styling
- Tables: https://takumi.kane.tw/docs/tables
- Typography & fonts: https://takumi.kane.tw/docs/typography-and-fonts
- Images & emoji: https://takumi.kane.tw/docs/load-images
- Output formats: https://takumi.kane.tw/docs/output-formats
- Keyframe animation: https://takumi.kane.tw/docs/keyframe-animation
- Visual effects: https://takumi.kane.tw/docs/visual-effects
- ImageResponse: https://takumi.kane.tw/docs/image-response
- Helpers: https://takumi.kane.tw/docs/helpers
- Measure API: https://takumi.kane.tw/docs/measure-api
- Comparison to Satori: https://takumi.kane.tw/docs/comparison-to-satori
- Upgrade to v2: https://takumi.kane.tw/docs/upgrade/v2
- Troubleshooting: https://takumi.kane.tw/docs/troubleshooting
- Performance: https://takumi.kane.tw/docs/performance-and-optimization
- API reference: https://takumi.kane.tw/docs/reference
- PDF (sibling package): https://takumi.kane.tw/docs/pdf
- Playground: https://takumi.kane.tw/playground
- Showcase: https://takumi.kane.tw/showcase
- Image bench: https://image-bench.kane.tw
- Releases: https://github.com/kane50613/takumi/releases

## Package Roles

| Package / export | Role |
| --- | --- |
| `takumi-js` | All-in-one: auto native vs WASM, `render` / `renderSvg` / `renderAnimation`, `setGlyphCacheMaxBytes` |
| `takumi-js/response` | `ImageResponse` (`next/og`-compatible); also default export |
| `takumi-js/helpers` | `googleFonts`, `prepareImages`, `subsetFonts`, `fontFromUrl`, node builders, length helpers |
| `takumi-js/helpers/jsx` | `fromJsx`, `Bitmap` → `{ node, css }` |
| `takumi-js/helpers/html` | `fromHtml` |
| `takumi-js/helpers/emoji` | Emoji extraction helpers |
| `takumi-js/node` | Force native backend (`Renderer` re-export) |
| `takumi-js/wasm` | Force WASM with auto-init |
| `takumi-js/wasm/no-init` | WASM without auto-init (pair with `wasm-url`) |
| `takumi-js/wasm-url` | Bundler-rewritten URL to the `.wasm` asset |
| `@takumi-rs/core` | Native Node binding + `Renderer` |
| `@takumi-rs/wasm` | WASM backend (Workers, Edge, browser) |
| `@takumi-rs/helpers` | Shared helpers (re-exported by `takumi-js/helpers`) |
| `@takumi-rs/image-response` | Standalone `ImageResponse` implementation |
| `takumi-pdf` | Paged PDF (invoices/reports); not this skill's primary API |
| `takumi` (crates.io) | Embed the engine in Rust |

## Changelog 2.6–2.14 (API-relevant)

| Version | What to encode |
| --- | --- |
| 2.6.0 | Google Fonts subset ranking by declared unicode-range; SVG `currentColor` host fallback restored |
| 2.7.0 | JPEG/WebP/GIF decoding restored in the engine |
| 2.7.1 | `fromHtml` keeps `<head>` `<style>`; HTML character references decode |
| 2.7.2 | Emoji presentation selectors (`FE0F` / `FE0E` / text-default pictographs) |
| 2.8.0 | List markers; Vite SSR WASM asset next to server bundle; SVG fragment/memo/forwardRef children |
| 2.8.1 | Smaller WASM (hinting interpreter gated) |
| 2.9.0 | `wasm-url` + `wasm/no-init`; webpack Node condition |
| 2.10.0 | HTML tables (grid rewrite); list marker spacing |
| 2.11.0 | Animated WebP/APNG **sources**; `steps()` jump positions; `calc()` ≤4 unit types; table `vertical-align` |
| 2.12.0 | `table-layout: fixed`, `border-spacing`, `border-collapse`; `page-break-*` |
| 2.13.0 | `css` option; `tw` CSS variables; `@theme` / `@apply` / Preflight import; cascade vs utilities; object `css` entries; `!important` inline; fetchCache policy on hits |
| 2.13.1–2.13.2 | Animated WebP dirty-rect encode; oversized node no longer panics |
| 2.13.5 | Node `>=20.19`; browser-only WASM entry (no `node:fs`) |
| 2.13.6 | Fetch retries; Google Fonts cache bounds |
| 2.13.7 | Export `CssInput` from `@takumi-rs/core` |
| 2.14.0 | 64 MP canvas; 64 MiB decode cache; `min/max/fit-content`/`stretch`; `flex-wrap: balance`; `contain`; overflow clip at padding; taffy 0.14; faster PNG |

## Architecture (one line)

Templates → node tree (`container` / `image` / `text`) → taffy layout → parley/skrifa text → composite (resvg for SVG sources) → raster encoders or SVG backend; a **time axis** samples CSS animations for GIF/WebP/APNG/raw frames.

## Uncertainties

- Official **tables** page still describes equal-split columns and unimplemented `border-collapse`. Changelogs 2.12–2.14 implemented collapse, fixed layout, and content-weighted auto columns. Prefer releases over that page until it is updated.
- Context7 library rules still say pass compiled CSS through `stylesheets`. **2.13+ uses `css`**; `stylesheets` is deprecated.
- Context7 library rules still say `Renderer` constructor takes no arguments. Fonts stay off the constructor; **`cacheMaxBytes` is valid**.
- WASM `signal` during encode: 2.14 checks abort around resource loading; the WASM encode itself is blocking. Unreleased changesets on `master` (`wasm-abort-signal.md`, `per-request-fetch-timeout.md`, …) are **not** in 2.14.0.
- Satori comparison page still cites `takumi-js` **2.2.0** install/bundle sizes — treat as historical.
- Typography docs still say there is no manual override for text *run* direction (issue #330). `direction` **does** control layout, RTL list markers, and bidi base direction (2.11).
- `takumi-pdf` is documented on the same site but is a different npm package; do not invent `renderPdf` on `takumi-js`.
