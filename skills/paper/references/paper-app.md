# Paper platform knowledge (from paper.design docs, fetched 2026-09-26)

Sources: paper.design/docs, /docs/mcp, /docs/tokens, /docs/svg, /docs/paste (+ /figma, /html), /docs/support, /docs/support/snapshot-local-images, /pricing, /roadmap, /build-log, shaders.paper.design. Check the live pages if something seems out of date.

## How the MCP connects

- The MCP server runs inside **Paper Desktop**. A file must be open for reads and writes.
- Current transport: stdio through the Paper CLI (`paper mcp`), installed when Desktop opens. The Claude Code plugin is `paper-desktop@paper`. The old HTTP endpoint `http://127.0.0.1:29979/mcp` still works while a file is open. Do not configure both, or you get two Paper servers.
- Generic config: `{ "mcpServers": { "paper": { "type": "stdio", "command": "/path/to/paper", "args": ["mcp"] } } }`. Copy the CLI path from the MCP panel in Desktop.
- Desktop has tabs: agents can work on several files at once, including files in background tabs. Pass `fileId` on every call.
- Troubleshooting, in order:
  1. Restart the agent session. Long sessions are the most common cause of trouble.
  2. Make sure Desktop is open with a file loaded.
  3. Call `get_basic_info` to confirm which file the MCP sees.
  4. Toggle or reconnect the server.
  5. On a network proxy, allowlist `*.paper.design`.
  6. On WSL, turn on mirrored networking.
- After upgrading to Pro, if the limits did not reset: update Desktop (About → Check for updates) and restart it.

## Plans and limits (pricing page)

| | Free | Pro ($16/editor/month, billed yearly) |
| --- | --- | --- |
| **MCP tool calls** | **100 per week** | 1M per week |
| Image generation | "Limited" | "100× more per week" |
| Max image size | 25 MB | 100 MB |
| Video export | no | yes |

- Viewers and editors are unlimited on Free.
- **On Free, 100 MCP calls a week is a hard budget.** Batch work: use multi-node `update_styles`, `set_text_content`, and `rename_nodes`; write slightly larger `write_html` chunks; skip extra screenshots; use `get_tree_summary` before `get_jsx`. If the user's plan is unknown and the task is large, ask.
- Generation credits (1–4 per image, see image-generation.md) are separate from MCP tool calls.

## `write_html` / HTML paste rules (from /docs/paste/html)

- Only inline styles. Class names and selector-based CSS are dropped.
- Attributes:
  - `layer-name="…"` sets the layer name.
  - `data-paper-locked` locks the layer.
  - `hidden` makes the layer invisible.
  - `<x-paper-clone node-id="…">` clones an existing node.
- `<img src>` and `background-image` URLs are uploaded to Paper. They must be publicly reachable, or you use `paper-asset:///abs/path` for local files.
- Text: no rich text. A block with only inline children becomes one Text node. Inline elements become inline-block. Frame styles move to a wrapping frame.
- Everything is border-box. Inputs become frames with text children. `display: none` elements stay hidden. Redundant styles are stripped.
- Flex wrap and negative gap are supported. CSS Grid is on the roadmap (not supported yet).

## Tokens (from /docs/tokens)

- Types: color, radius, spacing, container, breakpoint, font family, font weight, font size, line height, letter spacing (and opacity via MCP).
- Maps directly to Tailwind v4 `@theme`. `get_tokens({ format: "tailwind" })` gives a block you can paste.
- Users can copy tokens from the Theme tab (⌘A → right-click → Copy) and paste them into another file or into CSS. Copies do not stay in sync.
- Not yet supported (roadmap): theme modes (dark/compact values per token), text-style bundles, token libraries. Model dark mode as separate tokens (for example `--color-dark-*`) until then.

## Vectors (from /docs/svg)

- SVG sources: paste, the "Create SVG" AI tool (⌘⇧J, Quiver), `quiver-arrow*` via MCP, or vectorize.
- Editable in the app: move, resize, rotate, fill, stroke, and paths (Enter = path mode, P = pen, M = move, Esc = exit). Pixel snapping is ⌘⇧'.
- Roadmap: create shapes from scratch, boolean operations, convert shapes to paths, crop/scale SVGs.

## Figma → Paper by clipboard (from /docs/paste/figma)

- In Figma, select and ⌘C; in Paper, ⌘V. The user must connect Paper's Figma extension, or images do not import (and Figma's image API is rate-limited).
- Lost or approximated:
  - Components, instances, and variables are detached; code-connected components are unsupported.
  - Masks are pasted hidden.
  - Diamond gradients become radial.
  - Dashed, gradient, and independent strokes are lost.
  - Noise, texture, glass, repeat, and symmetry effects are lost.
  - Rich text is flattened.
  - Pass-through blending is approximated.
- Clipboard paste is often cheaper and more faithful than building from the Figma MCP. Suggest it first. Use the `figma-import` guide when the user wants the agent to do it.

## Snapshot (browser extension)

- A Chrome extension that copies any live web page or section into Paper as editable layers. ⌘Enter captures the full page. Use it for code → design of an existing running app: often faster and more exact than rebuilding with `write_html`.
- **Local dev images need CORS for origin `https://app.paper.design`:**
  - Vite / Remix / SvelteKit / TanStack Start (Vite): `server: { cors: { origin: 'https://app.paper.design' } }`. Vite 6+ also blocks `/@fs/` subresources; serve those assets from `public/`.
  - Next.js: `headers()` on `'/:path*'` with `Access-Control-Allow-Origin: https://app.paper.design`, `Access-Control-Allow-Methods: GET,OPTIONS`, and `Vary: Origin`.
  - Express: `cors({ origin: 'https://app.paper.design' })`. Fastify: `@fastify/cors` with the same origin.
  - Astro 5.14+: add `security.allowedDomains` **and** the Vite cors setting.
  - Nuxt: `vite.server.cors` plus `routeRules` headers.
  - Webpack: `devServer.headers`.
  - Also documented: Django (`django-cors-headers`), Flask (`flask_cors`), Rails (`rack-cors`).

## Export (app and MCP)

- MCP `export` writes to **`~/Downloads/<layer name>.<ext>`** (seen in testing). The result gives `filePath`. Move the file into the repo, and keep Downloads clean.
- Formats: PNG, JPG, WebP, AVIF, SVG (SVG nodes only), PDF (single or combined), MP4/WebM video (Pro). The app's default export scale is @2x.
- App shortcuts to tell users:
  - ⌥T copy as Tailwind, ⌥R copy as React CSS.
  - ⌘⇧C copy as PNG, ⌘⇧E export, ⌥⌘R export video.

## Shaders

- Library: `@paper-design/shaders-react` (zero-dependency WebGL shaders; source github.com/paper-design/shaders).
  - Effects: mesh gradient, grain gradient, dithering, dot grid, warp, swirl, waves, noise, voronoi, metaballs, god rays, smoke ring, and more.
  - Image filters: paper texture, fluted glass, water, halftone dots/CMYK, lens distortion.
  - Logo animations: liquid metal, heatmap, gem smoke.
- Shaders are added in the app (S key). The MCP cannot place a shader. To use one in the app codebase, install the package and match the parameters the user shows you.

## Useful app features to point users to

- Comments (C): agents can read and resolve them through the MCP.
- Canvas-aware agent assistant inside Paper.
- Presence: teammates and agents are shown in the file. There is an option to reduce agent animations.
- Real-content workflows: pair Paper MCP with Notion, Google Sheets, or API MCPs to fill designs with real data or translations.
- Design → site: the docs recommend flex layouts in the design, building one small section at a time, and a git checkpoint after each section. Use one frame per breakpoint for responsive layouts.

## Roadmap items that will change this skill

- Native Tailwind integration.
- Code components with props and slots.
- CSS Grid.
- Theme modes.
- **Hosting assets from Paper as a CDN link** (in progress). This may remove the download step.
- A script/prompt engine pane.
- Video generation.
- Remix (variations).
- Boolean vector operations.
