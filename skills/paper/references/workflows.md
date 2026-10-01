# Paper workflows

Each workflow assumes the load order in SKILL.md is done (tools loaded, `paper-mcp-instructions` read, `get_basic_info` called, `fileId` known).

## 1. Design a new screen

1. Post the design brief in chat: mood candidates, mood chosen (and why it is not the first instinct), 5–6 palette hex values with roles, type (font, weights, sizes), one-line direction. Skip only when the file's tokens define the system.
2. `get_font_family_info` for the fonts you will use.
3. `create_artboard` with explicit `pageId`. Sizes: desktop 1440×900, tablet 768×1024, mobile 390×844.
4. Mobile only: paste the status bar from `get_guide({ topic: "mobile-status-bar" })` as the first child. Change only its color.
5. Build in small `write_html` calls: page shell → header → hero → each section → each row. Use `var(--token)` values.
6. After each section: `get_screenshot`, one-line verdict (spacing, typography, contrast, alignment, fit, repetition), targeted fixes.
7. Repeated rows: fixed-width slots (`width` + `flex-shrink: 0`) for icons and trailing actions so columns align.
8. If content clips: `update_styles` → `height: "fit-content"` on the artboard.
9. `finish_working_on_nodes` with the artboard id.

## 2. Multiple directions

- Duplicate the base artboard with `duplicate_nodes` (it goes to empty space) or create new artboards.
- Make each direction clearly different (mood, type, layout), not color swaps.
- Name artboards "Direction A – Mineral", "Direction B – Signage", and so on.

## 3. Edit an existing design

1. `get_selection` or find the artboard by name in `get_basic_info`.
2. `get_tree_summary` for structure; `get_node_info` / `get_computed_styles` for details.
3. Edit with the smallest tool: `set_text_content` for copy, `update_styles` for style, `move_nodes` for order or parent, `write_html` replace only for real restructuring.
4. Screenshot, verify, `finish_working_on_nodes`.

## 4. Generate images for an app

1. Confirm the list of images, their purpose, and target sizes. Model: the newest, most advanced OpenAI model (user default; see image-generation.md). State the credit cost.
2. Create a staging artboard on a work page (for example "Experiments" or "Assets"), or place the images directly in the design that needs them.
3. `write_html` one `<img src="paper-gen://…">` per image, with `layer-name` set to the target file name.
4. Poll `get_node_info` until each is `ready`.
5. `get_fill_image` → check the preview → take `originalUrl`.
6. `curl -sSL -o <scratchpad>/<name>.png "<originalUrl>"`, convert to WebP/AVIF, move into the app's asset folder, wire into components with alt text and dimensions.
7. For changes: create a variant node with `reference_nodes` set to the original. Do not reuse the original node.
8. `finish_working_on_nodes`.

If Paper declines step 3 because it has 0 credits, generate the raster images with Codex CLI instead and place them with `paper-asset:///…`. See image-generation.md ("Fallback: Paper has 0 credits → Codex CLI").

## 4b. Remove a background

1. Find the source image node (`get_selection` or by name). State the cost (3 credits with the newest OpenAI edit model).
2. `write_html` a new `<img>` next to it: `paper-gen://openai-gpt-image-edit-2-5-big?prompt=<name the subject; list what to drop; "transparent background">&reference_nodes=<source id>`.
3. Poll `get_node_info` until `ready`, then `get_fill_image` → `originalUrl`.
4. `curl -sSL -o cutout.png "<originalUrl>"`, then `file cutout.png` (expect RGBA) and `magick cutout.png -format "%[fx:p{5,5}.a]" info:` (expect 0).
5. `magick cutout.png -trim +repage out.png` → `cwebp -q 85 -alpha_q 100 out.png -o out.webp` → repo.
6. Screenshot and compare with the source; it is a re-render, so check the pose and details.

## 4c. Vectorize an image

1. State the cost: 4 credits for `quiver-arrow-edit-telos` (default, top tier), 3 for `quiver-arrow-edit`.
2. `write_html` `<img src="paper-gen://quiver-arrow-edit-telos?prompt=Vectorize…&reference_nodes=<source id>" style="width:…;height:…">`. It must be an `<img>`, not a background.
3. Poll until `ready` with `output: "svg"`. The node becomes an `SVG` with editable path children.
4. `export({ nodes: { <id>: [{ format: "svg", scale: "1x" }] } })` → `~/Downloads/<layer name>.svg` → move to the repo → `bunx svgo`. Or `get_jsx` for inline markup.
5. Check the `viewBox`: output may be square with the art letterboxed. Crop the viewBox if needed.

## 5. Bulk style or copy change

1. `find_nodes` with `filters` (for example `{ styleName: "color", styleValue: "#FF5500" }` or `{ styleValue: "--color-brand" }`) and/or `textValue` ("Upgrade*").
2. Review the matches; each result lists what matched.
3. One `update_styles` call with all `nodeIds`, or one `set_text_content` call with all updates.
4. Screenshot a sample of affected artboards.

## 6. Replace raw colors with tokens

1. `get_tokens` for the token list.
2. For each raw color used in the file, `find_nodes` with the literal color; token-bound matches show as `var(--token)` and can be skipped.
3. `update_styles` the raw matches to `var(--token)`.

## 7. Work through comments

1. `list_comment_threads` (open only by default; add `pageId` or `search` to narrow).
2. `get_comment_thread` for the full conversation and the pinned node.
3. Make the change on the pinned node.
4. Screenshot to confirm.
5. `set_comment_thread_status` → `resolved`. Tell the user which threads you resolved and which need a human answer (you cannot reply).

## 8. Export deliverables

- Single assets: `export({ nodes: { <id>: [{ format: "webp", scale: "2x" }] } })`.
- Nodes that already have export settings: `export({ nodes: "nodes-with-exports-only", pageId })`.
- Deck or handoff PDF: `export_combined_pdf({ nodeIds: [...] })` (ordered by canvas position).
- Motion: `export({ type: "video", nodes: { <id>: [{ format: "mp4", scale: "1x", durationSeconds: 8 }] } })`; `webm` for transparency.
- Read the output path from the result and confirm it with `ls` before moving files.

## 9. Figma → Paper

0. First suggest clipboard paste: select in Figma, ⌘C, then ⌘V in Paper. The user must connect Paper's Figma extension for images. Components and variables are detached, and masks paste hidden. Use the steps below only when the user wants the agent to do it.
1. `get_guide({ topic: "figma-import" })`.
2. Read the Figma node with the Figma MCP. For instance ids like `I700:1100;2000:1000`, query the last segment (`2000:1000`).
3. Resolve every variable, token, and Tailwind class to literal CSS. Fill in missing sizes with more Figma calls.
4. Use Figma localhost asset URLs directly in `<img src>`. Tiled backgrounds: a `div` with `background-image`, `background-repeat: repeat`, `background-size`.
5. Build with small `write_html` calls; screenshot; finish.

## 10. Capture a running app into Paper (Snapshot)

1. The user installs the Paper Snapshot Chrome extension.
2. For local dev images, add CORS for origin `https://app.paper.design` to the dev server. For Vite: `server: { cors: { origin: 'https://app.paper.design' } }`; serve `/@fs/` assets from `public/`. Other frameworks: paper-app.md.
3. The user captures a section, or the full page with ⌘Enter, and pastes it into Paper.
4. The agent then cleans it up with the MCP: rename layers, replace literals with tokens (workflow 6), and fix layout.

## 11. Real content and translations

1. Load the content MCP (Notion, Google Sheets, an API).
2. `get_tree_summary` on the target section to find the Text nodes.
3. One batch `set_text_content` with the real copy (or translated copy for a length test).
4. Screenshot and look for overflow; set `height: "fit-content"` where needed.

## 12. New file or page

- `create_file({ name })` or `create_file({ cloneFileId })` → `open_file`.
- `create_page({ fileId, name })` → pass the returned `pageId` to later calls.
