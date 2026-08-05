# Source Map

This reference captures the Takumi docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-05
- Stable npm package: `takumi-js@2.5.9`
- Related packages (same version line): `@takumi-rs/core@2.5.9`, `@takumi-rs/wasm@2.5.9`, `@takumi-rs/helpers@2.5.9`
- npm `latest` dist-tag: `2.5.9`
- Engines: Node `>=18`
- Official site: https://takumi.kane.tw/
- Docs: https://takumi.kane.tw/docs/
- LLM index: https://takumi.kane.tw/llms.txt · full: https://takumi.kane.tw/llms-full.txt
- Repository: https://github.com/kane50613/takumi
- Rust crate: https://crates.io/crates/takumi
- License: MIT / Apache-2.0
- Context7 selection: `/kane50613/takumi`

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info takumi-js
   bun info @takumi-rs/core
   ```

3. Prefer https://takumi.kane.tw/docs/ and the GitHub README. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version before applying v2-only APIs (`fonts` per call, `images`, `renderSvg`, `ready` on `ImageResponse`).
5. Strip Fumadocs code annotations from any copied samples (`// [!code --]`, `// [!code highlight]`).

## Official Pages

- Introduction / quick start: https://takumi.kane.tw/docs/
- Integration hub: https://takumi.kane.tw/docs/integration
- Next.js: https://takumi.kane.tw/docs/integration/nextjs
- TanStack Start: https://takumi.kane.tw/docs/integration/tanstack-start
- Styling: https://takumi.kane.tw/docs/styling
- Typography & fonts: https://takumi.kane.tw/docs/typography-and-fonts
- Images & emoji: https://takumi.kane.tw/docs/load-images
- Output formats: https://takumi.kane.tw/docs/output-formats
- Keyframe animation: https://takumi.kane.tw/docs/keyframe-animation
- ImageResponse: https://takumi.kane.tw/docs/image-response
- Helpers: https://takumi.kane.tw/docs/helpers
- Comparison to Satori: https://takumi.kane.tw/docs/comparison-to-satori
- Upgrade to v2: https://takumi.kane.tw/docs/upgrade/v2
- Troubleshooting: https://takumi.kane.tw/docs/troubleshooting
- Performance: https://takumi.kane.tw/docs/performance-and-optimization
- Playground: https://takumi.kane.tw/playground
- Showcase: https://takumi.kane.tw/showcase
- Image bench: https://image-bench.kane.tw

## Package Roles

| Package / export | Role |
| --- | --- |
| `takumi-js` | All-in-one: auto native vs WASM, `render` / `renderSvg` / `renderAnimation` |
| `takumi-js/response` | `ImageResponse` (`next/og`-compatible) |
| `takumi-js/helpers` | `googleFonts`, `prepareImages`, node builders, length helpers |
| `takumi-js/helpers/jsx` | `fromJsx`, `Bitmap` |
| `takumi-js/helpers/html` | `fromHtml` |
| `takumi-js/helpers/emoji` | Emoji extraction helpers |
| `takumi-js/node` / `takumi-js/wasm` | Force a backend |
| `@takumi-rs/core` | Native Node binding + `Renderer` |
| `@takumi-rs/wasm` | WASM backend (Workers, Edge, browser) |
| `@takumi-rs/helpers` | Shared helpers (re-exported by `takumi-js/helpers`) |
| `takumi` (crates.io) | Embed the engine in Rust |

## Architecture (one line)

Templates → node tree (`container` / `image` / `text`) → taffy layout → parley/skrifa text → composite (resvg for SVG sources) → raster encoders or SVG backend; a **time axis** samples CSS animations for GIF/WebP/APNG/raw frames.
