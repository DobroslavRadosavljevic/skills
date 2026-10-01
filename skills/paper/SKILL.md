---
name: paper
description: >-
  Operate the Paper design canvas through the Paper MCP (paper-desktop plugin,
  tools named mcp__plugin_paper-desktop_paper__*). Use when the user invokes
  /paper or $paper, mentions Paper, paper.design, a Paper file, page, artboard,
  or design nodes, or asks to design a screen on the canvas, turn a Paper design
  into code (design-to-code), recreate app UI in Paper (code-to-design,
  Snapshot), generate AI images with paper-gen:// (OpenAI Image, Nano Banana,
  Flux, Recraft, Ideogram, Seedream, Grok, QuiverAI SVG), remove an image
  background (transparent PNG cutout), vectorize a raster image to SVG, make
  image variants, apply image filters, download or export images, SVG, PDF, or
  video from Paper into a codebase, sync design tokens with Tailwind v4,
  bulk-edit styles or copy, import from Figma, or work through Paper comment
  threads. Do not invent canvas edits from memory or skip Paper MCP.
---

# Paper

Paper is a design canvas built on HTML and CSS. Its MCP lets an agent read the canvas, write HTML that becomes real design nodes, edit nodes, generate and edit AI images, export assets, sync tokens, and handle comments. All changes are live: the user watches the canvas while you work.

## Hard gate

- Use **Paper MCP** for every Paper canvas task. Do not guess node IDs, layout, sizes, or colors from screenshots or memory.
- Do not create, edit, inspect, or export Paper designs until Paper MCP has been used for this task.
- If Paper MCP is missing, unauthorized, or errors, stop and report the blocker. Do not continue on memory. Troubleshooting: [references/paper-app.md](references/paper-app.md#how-the-mcp-connects).
- Do not substitute Figma, HTML mocks, or invented layouts for Paper MCP.

## Load order (every session)

1. `ToolSearch` with query `+paper` and `max_results: 40`. This loads every Paper tool in one call. Do not load them one at a time.
2. `get_guide({ topic: "paper-mcp-instructions" })`. This is mandatory once per session, before other Paper tools. It holds Paper's design-quality rules and review checkpoints. Read it again if the thread is long.
3. `get_basic_info()`. It returns the file id, pages, artboards, fonts, and tokens. Keep the `fileId`; almost every tool requires it.
4. Read topic guides when needed:
   - `"image-generation"` before any `paper-gen://` URL, including background removal and vectorize.
   - `"mobile-status-bar"` before any mobile artboard.
   - `"figma-import"` before any agent-driven Figma → Paper import.

The live guides are the source of truth. If this skill and a guide disagree (model list, credit costs, rules), follow the guide.

## Capability map

| Area | What you can do | How |
| --- | --- | --- |
| Files and pages | List, open, create, and clone files. Create and rename pages. Work on a page or background tab the user is not viewing. | `list_files`, `open_file`, `create_file`, `create_page`, `rename_pages`, `get_basic_info` |
| Read the canvas | Selection, tree summary, children, node info, screenshots, search by style or text | `get_selection`, `get_tree_summary`, `get_children`, `get_node_info`, `get_screenshot`, `find_nodes` |
| Create | Artboards, HTML → design nodes, clones, locked or hidden layers | `create_artboard`, `write_html` (+ `<x-paper-clone>`, `data-paper-locked`, `hidden`), `duplicate_nodes` |
| Edit | Styles (batch), text (batch), rename, move or reparent (keeps ids), delete | `update_styles`, `set_text_content`, `rename_nodes`, `move_nodes`, `delete_nodes` |
| Typography | Check that a font exists and which weights it has | `get_font_family_info` |
| Tokens | Read as JSON, CSS `:root`, or Tailwind v4 `@theme`. Create, alias, rename, delete. | `get_tokens`, `create_tokens`, `set_tokens` |
| AI images | Text-to-image (raster), text-to-SVG, image-to-image variants | `paper-gen://` in `write_html` / `update_styles` / `create_artboard` |
| Image editing | **Remove background** (transparent PNG), **vectorize** raster → editable SVG, recolor or restyle, CSS filters | image-to-image `paper-gen://` models; `update_styles` `filter` |
| Design → code | JSX (Tailwind or inline styles), exact computed CSS, original image files | `get_jsx`, `get_computed_styles`, `get_fill_image` (`originalUrl`) |
| Export | png, jpg, webp, avif, svg, pdf; mp4/webm video (Pro); combined PDF. Files go to `~/Downloads/<layer name>.<ext>`. | `export`, `export_combined_pdf` |
| Comments | List, filter, and search threads. Read a full thread. Resolve or reopen. | `list_comment_threads`, `get_comment_thread`, `list_comment_thread_authors`, `set_comment_thread_status` |
| Close-out | Remove the "agent working" indicator from artboards | `finish_working_on_nodes` (mandatory at the end) |

References:
- [tools.md](references/tools.md): every tool and parameter.
- [image-generation.md](references/image-generation.md): models, costs, lifecycle, download.
- [image-editing.md](references/image-editing.md): background removal, vectorize, variants, filters (tested recipes).
- [design-to-code.md](references/design-to-code.md): design → code, code → design, token sync.
- [workflows.md](references/workflows.md): step lists.
- [paper-app.md](references/paper-app.md): plans and limits, HTML paste rules, Snapshot and CORS, Figma paste, shaders, export, roadmap.

## Rules

- **Pass `fileId` on every call.** Check the file header in each result. If the id is not the file you meant, stop and correct it.
- **Pass `pageId` explicitly** to page-scoped tools (`create_artboard`, `export`, `get_basic_info`, `find_nodes`). The active page can change while you work. You cannot switch the user's page. Do trial work on a separate page (for example "Experiments") so you do not disrupt the user.
- **Mind the MCP budget.** The Free plan allows **100 MCP tool calls per week** (Pro: 1M). Batch multi-node edits, avoid redundant reads and screenshots, and ask before a large job if the plan is unknown.
- **Write small, but not wastefully.** One visual group per `write_html` call: a header, one row, one button bar. Create the container first, then the children. Prefer `duplicate_nodes` + `set_text_content` / `update_styles`, or `<x-paper-clone node-id="…" style="…"/>`, over new HTML.
- **HTML subset:** inline `style` only; class names and `<style>` are dropped. Use flexbox (wrap is allowed), `padding`, and `gap`. Do not use `margin`, `display: grid`, `display: inline`, or `<table>`. All boxes are border-box. One style per text node (no rich text). Use `<pre>` or `white-space: pre` for code. Use SVG icons, not emoji. Name layers with `layer-name="…"`. Local files: `<img src="paper-asset:///absolute/path.png">`. Remote image URLs must be public.
- **Use the file's tokens** as `var(--token)` when they exist. Reduce token opacity with `color-mix(var(--color-primary) 40%, transparent)`.
- **Fonts:** call `get_font_family_info` before the first typographic styling. Font size in `px`, letter-spacing in `em`, line-height in `px`.
- **Fit:** if content clips, set the artboard to `height: "fit-content"` with `update_styles`. Do not guess a new pixel height.
- **Review:** call `get_screenshot` after each meaningful section. Give a one-line verdict on spacing, typography, contrast, alignment, artboard fit, and repetition. Fix with targeted edits. Do not delete and restart a whole piece unless nothing else works.
- **New designs:** post the design brief in chat (mood candidates, mood chosen, palette hex values with roles, type scale, one-line direction) **before** any change to the canvas. Skip the brief only if a design system is already given (the file's tokens count).
- **Model default: always the newest, most advanced OpenAI model Paper offers** (user preference). Resolve it from the live `image-generation` guide: highest `openai-*` version, top (`-big`) tier. Use the `-edit-` twin for image-to-image. On 2026-09-26 that is `openai-gpt-image-2-5-big` (2 credits) and `openai-gpt-image-edit-2-5-big` (3 credits). Only exceptions: SVG output (use `quiver-arrow-telos*`, since OpenAI has no SVG model), or a model the user names. Details: [image-generation.md](references/image-generation.md#model-choice-user-default--the-newest-most-advanced-openai-model).
- **Transparent assets: generate them transparent.** The OpenAI models output real RGBA PNGs when the prompt says "transparent background, isolated object, no floor, no shadow" (tested on text-to-image: background and enclosed empty areas at alpha 0). Do not generate a backdrop and remove it later. Background removal is only for existing images.
- **Generation spends the user's Paper credits** (1–4 per image). Use `paper-gen://` (including background removal and vectorize) only when the user asks. The limit is 10 images per call. State the model and cost before a batch.
- **0 Paper credits → Codex CLI.** If Paper declines generation for lack of credits, generate the raster image with `codex exec` (built-in image tool, newest OpenAI GPT Image model, uses the Codex plan quota), then place it with `paper-asset:///…` or move it into the repo. No SVG fallback. Steps: [image-generation.md](references/image-generation.md#fallback-paper-has-0-credits--codex-cli).
- **Iterate on images with a new node** that has the original in `reference_nodes`. Changing a node's `paper-gen://` URL regenerates it and loses the old image.
- **Waiting:** generation is async. Poll `get_node_info` for `imageGeneration.status` (`processing` → `ready` / `error`). Do not `sleep` in Bash.
- **Previews are not files.** The `get_fill_image` preview is resized JPEG (transparency shows as black). Download `originalUrl` for the real PNG, and verify alpha with `file` / `magick`.
- **Exports land in `~/Downloads`.** Move them into the repo or the scratchpad at once; do not leave them behind.
- **Never show raw node ids** to the user. Refer to layers by name.
- **Always end with `finish_working_on_nodes`.** Pass the ids of the artboards you touched.

## Core workflows

Step lists: [references/workflows.md](references/workflows.md).

1. **Design a new screen.** Brief → `create_artboard` (desktop 1440×900, tablet 768×1024, mobile 390×844 with status bar) → small `write_html` steps → screenshot and critique → fixes → finish.
2. **Edit an existing design.** `get_selection` / `get_tree_summary` → targeted `update_styles` / `set_text_content` / `move_nodes` → screenshot → finish.
3. **Generate images for an app.** `<img src="paper-gen://openai-gpt-image-2-5-big?prompt=…&aspect_ratio=…">` (or a newer OpenAI id) → poll → `get_fill_image` → `curl -L` the `originalUrl` → convert to WebP/AVIF → put in the app's asset folder → reference it in code.
4. **Remove a background** (existing images only; for new assets ask for a transparent background in the text-to-image prompt). New `<img>` with the newest OpenAI edit model (`openai-gpt-image-edit-2-5-big` today) + `reference_nodes=<source>` + a prompt that names the subject and asks for a transparent background → download the RGBA PNG → `magick -trim` → WebP with alpha. It re-renders the subject; it is not a pixel-exact mask.
5. **Vectorize.** New `<img>` with `quiver-arrow-edit-telos` (top SVG tier; OpenAI has no SVG model) + `reference_nodes=<source>` → it becomes an editable SVG node → `export` svg (to `~/Downloads`) or `get_jsx` → `svgo` → repo.
6. **Design → code.** `get_tree_summary` → `get_jsx` → `get_computed_styles` → `get_tokens({ format: "tailwind" })` → rewrite with the codebase's own components. Use screenshots only to verify.
7. **Code → design.** For a running app, suggest the Snapshot extension first (needs CORS for `https://app.paper.design`). Otherwise read the source, map classes to tokens, and rebuild with `write_html`.
8. **Token sync.** `get_tokens({ format: "tailwind" })` ↔ the app's `@theme`; update one side with `create_tokens` / `set_tokens` or a CSS edit.
9. **Bulk edits.** `find_nodes` by style (a literal color also finds token-bound uses) or by text → batch `update_styles` / `set_text_content`.
10. **Resolve feedback.** `list_comment_threads` → `get_comment_thread` → edit → `set_comment_thread_status("resolved")`.
11. **Export deliverables.** `export` (format + scale `2x` / `512w` / `1440p`), `export_combined_pdf`, or `type: "video"` (Pro).
12. **Figma → Paper.** Suggest clipboard paste first (⌘C in Figma, ⌘V in Paper). For agent import, follow the `figma-import` guide and resolve every token to literal CSS.
13. **Real content.** Combine Paper MCP with another MCP (Notion, Sheets, an API) to replace placeholder copy or translate it, using batch `set_text_content`.

## Limits

- You cannot switch the page the user is viewing. You can work on any page with `pageId`, and on any open file with `fileId`.
- There is no version history and no undo tool. `move_nodes` keeps ids; `delete_nodes` does not.
- A text node has one style. There is no rich text inside one node. CSS Grid is not supported yet.
- You cannot post comments or replies. You can only read, resolve, and reopen threads.
- You cannot place shaders, run the in-app vectorize, or crop images by hand; the user does those in the app (see paper-app.md). CSS `filter` via `update_styles` does work.
- Background removal, vectorize, recolor, and "upscale" are AI re-renders. Check the result visually before you ship it.
- Every generated image spends credits. Free-plan MCP calls are capped at 100 per week.

## Report to the user

- Say what changed on the canvas and where (page and artboard name).
- For image work, give the model, the credit cost, and the local path of each downloaded file.
- For design → code, list the files you created or changed, and any values you could not map to tokens.
