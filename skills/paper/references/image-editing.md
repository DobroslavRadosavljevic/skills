# Image editing through Paper MCP: remove background, vectorize, variants

Paper MCP has no dedicated "remove background", "vectorize", or "upscale" tool. You get these results with **image-to-image `paper-gen://` models**: pass the source image node in `reference_nodes`. Every recipe spends the user's credits; get consent first.

Tested 2026-09-26 on a 1248×832 OpenAI Image 2.5 illustration. Results below are from that test.

## Remove background (tested: works)

**New asset? Skip this section.** The OpenAI text-to-image model makes transparent PNGs directly when the prompt asks for a transparent background (tested; see image-generation.md, "Transparent background straight from text-to-image"). That costs one generation instead of two. Use the recipe below only for images that already exist with a background.

```html
<img
  layer-name="Mascot – transparent"
  src="paper-gen://openai-gpt-image-edit-2-5-big?prompt=Remove%20the%20background%20completely.%20Keep%20only%20the%20robot%20character%20exactly%20as%20it%20is%2C%20same%20style%20and%20colors.%20Transparent%20background%2C%20no%20props.&reference_nodes=<SOURCE_NODE_ID>"
  style="width: 360px"
/>
```

- Model: the newest, most advanced OpenAI edit model (user default; `openai-gpt-image-edit-2-5-big`, 3 credits, on 2026-09-26). The OpenAI edit models are the only ones that list transparency support. The test used the non-big `openai-gpt-image-edit-2-5`.
- Output: RGBA PNG at the reference's size (1248×832). Measured alpha: corners 0, subject about 0.99, mean 0.25. The transparency is real.
- **Caveat: this is a re-render, not a pixel mask.** The model redraws the subject. Pose, crop, and small details can change (in the test, the desk and laptop went away and the arms were redrawn). If the user needs exact original pixels, say so and offer a local matting tool instead (for example `rembg` or an ImageMagick flood-fill for flat backgrounds).
- Name the subject precisely in the prompt and list what to drop ("no desk, no laptop, no props"). Otherwise the model may keep parts of the scene.
- **The `get_fill_image` preview is JPEG, so transparent areas show as black.** Check the real file:

```bash
curl -sSL -o cutout.png "<originalUrl>"
file cutout.png                        # expect: RGBA
magick cutout.png -format "corner=%[fx:p{5,5}.a] mean=%[fx:mean.a]\n" info:
magick cutout.png -trim +repage cutout-trimmed.png   # crop the empty margin
cwebp -q 85 -alpha_q 100 cutout-trimmed.png -o cutout.webp
```

## Vectorize a raster image into SVG (tested: works well)

```html
<img
  layer-name="Illustration – vector"
  src="paper-gen://quiver-arrow-edit?prompt=Vectorize%20this%20illustration%20as%20a%20clean%20flat%20vector%20SVG.%20Keep%20the%20same%20composition%20and%20palette.&reference_nodes=<SOURCE_NODE_ID>"
  style="width: 360px; height: 240px"
/>
```

- Model: `quiver-arrow-edit-telos` (4 credits, most detail; default because it is the top tier) or `quiver-arrow-edit` (3 credits, faster; the tested one). OpenAI has no SVG model in Paper. SVG models work **only** as `<img>` in `write_html`, never as a background.
- The node starts as `SVGPlaceholder`. When `imageGeneration.status` is `ready` and `output` is `svg`, it becomes an `SVG` node with editable path children. The test produced 129 child nodes, 111 `<path>` elements, and linear gradients, in a 20 KB file. The result was faithful: flat vector style, same palette and composition.
- Output viewBox was square (`0 0 80 80`) with the art letterboxed inside. Size the node to match the art, or fix the `viewBox` after export.
- Get the SVG out:
  - `export({ nodes: { <id>: [{ format: "svg", scale: "1x" }] } })` writes `~/Downloads/<layer name>.svg`. Move it into the repo, then optimize it (`bunx svgo file.svg`).
  - Or `get_jsx({ nodeId })` for inline JSX markup.
- The user can edit the result in Paper with the Pen tool (P) and path mode (Enter).
- Good inputs: flat illustrations, logos, icons, stickers. Poor inputs: photos (you get a stylized illustration, not a trace).
- Text-only SVG (no source image): `quiver-arrow` / `quiver-arrow-telos` from a prompt. The in-app equivalent is the "Create SVG" tool (⌘⇧J).

## Variants and consistent sets

- Make a new node with the original in `reference_nodes`. Do not change the original's URL; that would overwrite it with a new generation.
- Use the newest OpenAI edit model (user default). Put several node ids in `reference_nodes` to combine references ("put the mascot from ref 1 in the scene from ref 2").
- To keep a series consistent, use one approved hero image as the reference for every other image.
- Per the changelog, AI image editing keeps sizes consistent between prompts, and the output follows the first reference's aspect ratio.

## Other edits (by prompt, untested)

These use the same pattern (image-to-image model + a clear instruction). They are not verified; screenshot and check before you ship them.

| Goal | Suggested model | Prompt pattern |
| --- | --- | --- |
| Recolor to brand palette | newest OpenAI edit model | "Same image, recolor accents to #E8590C, keep everything else" |
| Extend or reframe (outpaint) | newest OpenAI edit model | "Same scene extended to a wide 16:9 banner, more empty space on the right" (the aspect ratio follows the reference, so the result may not change shape) |
| Higher resolution | newest OpenAI edit model (big tier); `nano-banana-pro-edit` (2K) only if the user asks | "Same image, higher detail" — this is a re-render, not a true upscale |
| Remove an object | newest OpenAI edit model | "Remove the coffee mug, fill the area naturally" |
| Style transfer | newest OpenAI edit model | "Same composition in 3D clay style" |

## Free, non-destructive adjustments (no credits)

A generated or uploaded image is a node whose fill is `backgroundImage: url(https://app.paper.design/file-assets/…)` with `backgroundSize`, `backgroundPosition`, and `aspectRatio`. Normal CSS on that node works:

- **Filters (tested: works):** `update_styles` → `{ filter: "grayscale(100%) blur(2px)" }`. `get_computed_styles` shows the filter and the canvas renders it. Supported functions match the app's Filter panel: blur, saturate, grayscale, brightness, sepia, invert, hue-rotate. Reset with `filter: "none"`.
- Crop or reframe: change `backgroundSize` / `backgroundPosition` / `aspectRatio`, or the node size with `overflow: hidden`.
- Rounding, shadows, blend: `borderRadius`, `boxShadow`, `mixBlendMode`.
- `export` bakes these into the file. `get_fill_image` / `originalUrl` return the **raw** fill without them.

## Things done only in the Paper app

Tell the user to do these by hand when needed:
- Crop an image by ⌘-dragging.
- Shaders on images (halftone, dithering, fluted glass, paper texture, water, lens distortion): press S. They export as video from the Video panel (Pro plan).
- The in-app "vectorize" feature from the alpha. The MCP route is `quiver-arrow-edit`.
- Create image panel (⌘⇧I), Create SVG panel (⌘⇧J), upload image (⌘⇧K).
