# Paper MCP tool reference

All tools are named `mcp__plugin_paper-desktop_paper__<tool>`. Load them all at once with `ToolSearch` query `+paper`, `max_results: 40`.

Budget: the Free plan allows 100 MCP tool calls per week; Pro allows 1M. Every row below is one call. Prefer the batch forms.

Almost every tool requires `fileId`. Every result starts with a file header `{ file: { id, name }, contentHash: { tokens } }`. If `contentHash.tokens` changed since your last `get_tokens`, someone edited the tokens; read them again.

Positions: `worldX` / `worldY` / `width` / `height` are `null` when a size depends on layout and the page is not active (not measured). That is normal for flex children on a background page.

## Guides

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_guide` | `topic`: `paper-mcp-instructions` \| `image-generation` \| `mobile-status-bar` \| `figma-import` | Read `paper-mcp-instructions` once per session before other tools. |

## Files and pages

| Tool | Parameters | Notes |
| --- | --- | --- |
| `list_files` | `limit?` (1–200, default 50) | Open files first, then recent files in the active team, newest first. |
| `open_file` | `fileId` (id, `/file/<id>` path, or URL), `pageId?` | `pageId` applies only if the file was not open. Returns `get_basic_info`. |
| `create_file` | `name?`, `cloneFileId?` | Returns the new id. Call `open_file` next. |
| `create_page` | `fileId`, `name?` | Returns `pageId`. Default name is "Page N". |
| `rename_pages` | `fileId`, `updates` [{ `pageId`, `name` }] | Batch-renames pages in the page list. Does not switch the user's page. Get page ids from `get_basic_info`. |
| `get_basic_info` | `fileId?`, `pageId?` | File, page, `rootNodeId`, artboards (id, name, size, position), `pages` with `isActive`, font families, compact token list. |

## Read the canvas

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_selection` | `fileId?` | What the user has selected: ids, names, types, sizes, artboard. |
| `get_tree_summary` | `fileId`, `nodeId`, `depth?` (default 3, max 10) | Compact indented tree. Much cheaper than `get_jsx`. Use for orientation. |
| `get_children` | `fileId`, `nodeId` | Direct children with child counts and positions. |
| `get_node_info` | `fileId`, `nodeId` | Size, visibility, lock, parent, children, text content, and `imageGeneration { status, output }` for generated images. |
| `get_screenshot` | `fileId`, `nodeId`, `scale?` (1 default, 2 for small text) | Verification only. Does not wait for image generation. |
| `find_nodes` | `fileId`, `filters?` [{ `styleName?`, `styleValue?` }] (AND), `textValue?`, `pageId?`, `nodeId?` | Searches the whole file by default. `*` wildcards. Colors match by equivalence. A literal color also finds token-bound uses. `textValue` is case-insensitive and anchored ("Get *", "\*started\*"). |

## Create

| Tool | Parameters | Notes |
| --- | --- | --- |
| `create_artboard` | `fileId`, `name`, `styles` (camelCase; `width` and `height` in whole px, required), `pageId?` | Default layout: flex column. Placed automatically in empty space. Keep 80px between artboards if you set `top`/`left`. |
| `write_html` | `fileId`, `targetNodeId`, `mode`: `insert-children` \| `replace`, `html` | HTML → design nodes. Inline styles only (classes and `<style>` are dropped). `<x-paper-clone node-id="…" style="…"/>` reuses an existing node. Attributes: `layer-name`, `data-paper-locked`, `hidden`. `paper-asset:///abs/path` for local images; remote `<img>` / `background-image` URLs must be public and are uploaded to Paper. `paper-gen://…` for AI images (a raster `<img>` becomes a Frame with a `backgroundImage` fill; an SVG model gives an `SVGPlaceholder` that turns into an `SVG` node). Returns `createdNodes`. |
| `duplicate_nodes` | `fileId`, `nodes` [{ `id`, `parentId?` }] | Deep clone. Returns `descendantIdMap` (original → clone) so you can edit cloned children at once. Duplicated artboards go to empty space. |

## Edit

| Tool | Parameters | Notes |
| --- | --- | --- |
| `update_styles` | `fileId`, `updates` [{ `nodeIds`, `styles` }] | Batch. Token vars allowed. `top`/`left` on an artboard moves it on the canvas. Inert styles come back in `ignoredStyles`. `paper-gen://` in `backgroundImage` generates an image. |
| `set_text_content` | `fileId`, `updates` [{ `nodeId`, `textContent` }] | Text nodes only. Batch. |
| `rename_nodes` | `fileId`, `updates` [{ `nodeId`, `name` }] | Names over 50 characters are cut. |
| `move_nodes` | `fileId`, `moves` [{ `nodeId`, `before` } \| { `nodeId`, `after` } \| { `nodeId`, `parentId`, `index?` }] | Keeps ids. Applied in order. `parentId: "root"` = page root. Works across pages. Returns `affectedParents`. |
| `delete_nodes` | `fileId`, `nodeIds` | Deletes descendants too. Check the node with `get_node_info` first. |
| `finish_working_on_nodes` | `fileId`, `nodeIds?` | Mandatory when done. Pass the artboard ids you touched. |

## Typography

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_font_family_info` | `familyNames` [] | Local fonts, Google Fonts, web-safe fonts, and CSS system fonts. Returns weights and styles. Required before the first typographic styling. |

## Tokens

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_tokens` | `fileId`, `format?`: `json` \| `css` \| `tailwind`, `types?`, `namePattern?` (glob) | `tailwind` returns a Tailwind v4 `@theme { … }` block. |
| `create_tokens` | `fileId`, `tokens` [{ `type`, `name` (`--x`), `value`, `description?` }] | Types: breakpoint, color, container, fontFamily, fontSize, fontWeight, letterSpacing, lineHeight, opacity, radius, spacing. Alias with `var(--other)`. Order: semantic colors, then neutrals, primary, secondary, accent; other types smallest first. |
| `set_tokens` | `fileId`, `tokens` [{ `name`, `newName?`, `value?`, `description?`, `delete?` }] | Rename, change value, or delete. Applied in order. |

## Design → code and assets

| Tool | Parameters | Notes |
| --- | --- | --- |
| `get_jsx` | `fileId`, `nodeId`, `format?`: `tailwind` (default) \| `inline-styles` | Structure and styles as JSX. Also the way to read generated SVG output. |
| `get_computed_styles` | `fileId`, `nodeIds` [] | Exact CSS per node. Batch. |
| `get_fill_image` | `fileId`, `nodeId` | Preview JPEG (resized; transparent areas show as black) plus metadata `{ originalUrl, mimeType, width, height }`. `originalUrl` is the full-quality original (PNG, RGBA when transparent) on `app.paper.design/file-assets/…`; download it with `curl -L` (no auth needed in testing). Returns the raw fill without node styles such as filters. Errors if the image is still generating or is SVG. |

## Export

| Tool | Parameters | Notes |
| --- | --- | --- |
| `export` | `fileId`, `nodes`: `{ [nodeId]: [{ format, scale, … }] }` or `"nodes-with-exports-only"`, `type?`: `image` \| `video`, `pageId?` | Formats: avif, jpg, png, webp, svg (SVG nodes only), pdf (`pdfQuality`, `pdfResampling`), mp4 (opaque), webm (transparent, `durationSeconds` 1–300, default 10). Video needs the Pro plan. Scale: `1x`, `2x`, `0.5x`, `512w`, `512h`, `1440p`. Pass `[]` to use the node's default settings. Do not override defaults unless the user asks. **Writes to `~/Downloads/<layer name>.<ext>`**; the result returns `exports[].filePath`. Move the file right away. Bakes in node styles (radius, filters). |
| `export_combined_pdf` | `fileId`, `nodeIds` [] | One PDF, one page per node, ordered top-to-bottom then left-to-right on the canvas. |

## Comments

| Tool | Parameters | Notes |
| --- | --- | --- |
| `list_comment_threads` | `fileId`, `status?` (`open` default \| `resolved` \| `all`), `pageId?`, `currentPageOnly?`, `nodeId?`, `participantUserId?`, `threadAuthorUserId?` (`"current-user"` allowed), `search?`, `searchScope?`, `sortField?`, `sortDirection?`, `limit?`, `offset?`, `previewLength?` | Compact summaries. |
| `get_comment_thread` | `fileId`, `commentThreadId` | Full thread with replies, reactions, attachments, pinned node. |
| `list_comment_thread_authors` | `fileId`, `pageId?` | Resolve a person's name to a user id. Never guess user ids. |
| `set_comment_thread_status` | `fileId`, `commentThreadId`, `status`: `open` \| `resolved` | Resolve only after the feedback is fully handled. |
