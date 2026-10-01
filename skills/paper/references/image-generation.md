# AI image generation in Paper

Read `get_guide({ topic: "image-generation" })` first in each session. The model list and costs below were correct on 2026-09-26; the guide wins if they differ.

## Consent and cost

- Generation spends the user's Paper credits. Generate only when the user asks for images.
- One call may author at most 10 images. If a call exceeds 10 images or the remaining credits, Paper declines the whole call and nothing generates.
- Before a batch, tell the user the model and the total credit cost.

## URL format

```
paper-gen://{model_id}?prompt={url-encoded}&aspect_ratio={w:h}&reference_nodes={id,id}
```

- `model_id` (required) — see the tables below.
- `prompt` (required) — URL-encode it (`%20` for spaces, `%2C` for commas).
- `aspect_ratio` (optional, default `1:1`) — must be one the model supports; otherwise Paper falls back to `1:1` with a warning. Ignored when reference images exist (output follows the first reference). SVG models ignore it; size the node with styles.
- `reference_nodes` (optional) — node ids. Text in those nodes is prepended to the prompt. Images in those nodes are references for image-to-image models.

Where it works:

- `<img src="paper-gen://…" style="width: 720px" layer-name="Hero image">` in `write_html`
- `background-image: url("paper-gen://…")` in `write_html`
- `backgroundImage: 'url("paper-gen://…")'` in `update_styles` or `create_artboard` styles
- SVG models (`quiver-*`) work only as `<img>` in `write_html`, never as a background.

## Models

Text-to-image:

| id | Strength | Credits | Aspect ratios |
| --- | --- | --- | --- |
| `openai-gpt-image-2-5` | OpenAI Image 2.5, good with text | 1 | 1:1, 3:2, 4:3, 16:9, 2:1, 3:1, 2:3, 3:4, 9:16, 1:2, 1:3 |
| `openai-gpt-image-2-5-big` | Highest precision, slower | 2 | same as above |
| `google-nano-banana-2` | General default | 1 | 1:1, 4:3, 3:4, 16:9, 9:16 |
| `flux-2-pro` | Fast, versatile | 1 | 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16 |
| `grok-imagine-quality` | Very fast | 1 | 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 2:1, 1:2 |
| `recraft-v4-1` | Design taste, strong text | 1 | 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16, 2:1, 1:2 |
| `ideogram-v3-balanced` | Dreamy, striking | 2 | 1:1, 3:2, 4:3, 16:9, 2:1, 3:1, 2:3, 3:4, 9:16, 1:2, 1:3 |
| `seedream-4-5` | Precise, good with text | 1 | 1:1, 3:2, 2:3, 4:3, 3:4, 16:9, 9:16 |
| `nano-banana-pro` | 2K resolution | 4 | 1:1, 4:3, 3:4, 16:9, 9:16 |
| `quiver-arrow` | Editable SVG, balanced | 3 | n/a |
| `quiver-arrow-telos` | Detailed SVG, slower | 4 | n/a |

Image-to-image (need at least one reference image in `reference_nodes`):

| id | Strength | Credits |
| --- | --- | --- |
| `openai-gpt-image-edit-2-5` | High quality, **supports transparency** | 2 |
| `openai-gpt-image-edit-2-5-big` | Highest precision, transparency | 3 |
| `google-nano-banana-2` | Good at combining images | 1 |
| `flux-2-pro-edit` | Fast, versatile | 1 |
| `grok-imagine-quality-edit` | Fast edits | 2 |
| `nano-banana-pro-edit` | 2K | 4 |
| `quiver-arrow-edit` | SVG | 3 |
| `quiver-arrow-edit-telos` | Detailed SVG | 4 |

## Model choice: user default = the newest, most advanced OpenAI model

**The user's standing preference: for every raster image, use the newest and most capable OpenAI model Paper offers.** Do not choose Nano Banana, Flux, Recraft, Ideogram, Seedream, or Grok unless the user names one for a task.

How to resolve "newest, most advanced" each time:

1. Read the live `image-generation` guide.
2. Among the `openai-*` ids, take the highest version number. Within that version, take the top tier (the `-big` / highest-precision variant).
3. Text-to-image uses the non-edit id. Image-to-image (variants, background removal, recolor, a consistent set) uses the matching `openai-*-edit-*` id.

On 2026-09-26 this resolves to:

| Job | Model | Credits |
| --- | --- | --- |
| Text-to-image | `openai-gpt-image-2-5-big` | 2 |
| Image-to-image, background removal, variants | `openai-gpt-image-edit-2-5-big` | 3 |

If the guide lists a newer OpenAI model (for example a 3.x id), use that instead and update this table.

Exceptions:
- **SVG / vector output** (icons, vectorize): OpenAI has no SVG model in Paper. Use `quiver-arrow-telos` / `quiver-arrow-edit-telos` (or the non-telos ids for speed).
- The user names a different model, or asks for the cheapest option. Then follow the request for that task only.

Include the model's cost in the pre-batch cost statement. The top OpenAI tier costs 2–3 credits per image, compared with 1 for the defaults Paper suggests.

### Transparent background straight from text-to-image (tested: works)

The OpenAI text-to-image models can output a **transparent PNG directly**. No second background-removal pass is needed. Paper's guide lists transparency only on the edit models, but this was tested on 2026-09-26 with `openai-gpt-image-2-5-big`:

- Prompt: "isolated object, transparent background, PNG with alpha channel, no background, no floor, no shadow".
- Result: 1024×1024 **RGBA** PNG. Corner alpha 0; the **empty inside of a line-art cube was also alpha 0**; stroke pixels alpha about 0.98; mean alpha 0.024. It composited cleanly on `#FAFAFA`.
- Use this for icons, spot illustrations, stickers, mascots, and isolated objects that sit on app backgrounds (light or dark).
- Say "transparent background" and forbid floors, shadows, and backdrops. A drop shadow or floor plane may come out as semi-transparent pixels.
- The `get_fill_image` preview shows transparent areas as **black**. Always check the downloaded original: `file x.png` (expect RGBA) and `magick x.png -format "%[fx:p{5,5}.a]" info:` (expect 0).
- Remove background with an edit model (image-editing.md) only for **existing** images that already have a background.

Other patterns:
- A consistent set (onboarding series, empty states): generate one hero image with the text-to-image model, then make the others with the edit model and the hero in `reference_nodes`.
- Cut-outs with a transparent background (mascots, stickers): generate them transparent from the start with the text-to-image model (see above). For variants of a transparent asset, use the edit model and say "transparent background" again.

## Lifecycle

1. The tool call returns at once; the node shows a generating state.
2. Poll `get_node_info` on the created node. `imageGeneration.status` is `processing`, then `ready` or `error`. `imageGeneration.output` is `raster` or `svg`. Do not `sleep` in Bash; poll the tool.
3. Read the result:
   - `raster` → `get_fill_image` returns a preview and `originalUrl`.
   - `svg` → `get_jsx` returns the SVG markup.
4. `get_screenshot` and `export` do not wait; capturing early shows placeholders.
5. Setting a `paper-gen://` URL again always starts a new generation. To iterate, create a **new** node with the original in `reference_nodes`. Do not reuse the original node.
6. Validation problems do not fail the call. The node is created with an error visual and the result has a note. Fix the URL and rewrite it (`write_html` replace, or `update_styles` for backgrounds).

## Get the file into a codebase

```bash
curl -sSL -o hero.png "<originalUrl from get_fill_image>"
```

- In testing the `app.paper.design/file-assets/<file>/<asset>.png` URL returned HTTP 200 without auth, as a full-resolution PNG (a 3:2 OpenAI Image 2.5 render was 1248×832, 1.4 MB).
- Download into the session scratchpad first, then convert. PNG from a generator is too heavy for the web:

```bash
cwebp -q 82 hero.png -o hero.webp          # if libwebp is installed
bunx sharp-cli -i hero.png -o hero.webp -f webp -q 82   # alternative
```

- Place the file in the app's static asset folder (for example `apps/web/public/images/…`) or import it from source, following the repo's convention. Give it a descriptive kebab-case name.
- Add meaningful `alt` text, width and height (to stop layout shift), and lazy loading below the fold.
- For SVG output, take the markup from `get_jsx`, clean it (remove fixed colors if it should inherit `currentColor`), and save it as a `.svg` file or an icon component.
- Alternative path: `export` the node (`webp`, `2x`) when you want the node's crop, radius, filters, and effects baked in rather than the raw fill. The file lands in `~/Downloads/<layer name>.webp`.
- The `get_fill_image` preview is a resized JPEG, so transparent pixels look black. Always judge transparency and resolution from the downloaded original.

Background removal, vectorize, recolor, and filters: see [image-editing.md](image-editing.md).

## Fallback: Paper has 0 credits → Codex CLI

If Paper declines a `paper-gen://` call because credits are used up (or the user says credits are at 0), do not stop. Try the **Codex CLI** next. Its built-in image tool uses the newest OpenAI GPT Image model. It spends the user's Codex / ChatGPT plan quota, not Paper credits. Tested on 2026-10-01 with `codex-cli` 0.159.3.

1. Tell the user Paper is out of credits and that you will use Codex CLI instead.
2. Check the CLI: `codex --version` and `codex features list | grep image_generation` (expect `stable true`). If `codex` is missing, not signed in, or too old for its configured model ("requires a newer version of Codex"), report it and ask before you install or upgrade.
3. Generate from the scratchpad (or another temp folder), one image per prompt:

   ```bash
   codex exec --skip-git-repo-check -s workspace-write -o last.txt \
     "Use your built-in image generation tool to create: <prompt>. Then copy the generated file into the current directory as <name>.png. Reply with the original saved path and the copied path." \
     </dev/null
   ```

   - `</dev/null` stops `exec` from waiting on stdin.
   - The final reply (saved paths) lands in `last.txt`. Add `--json` for an event stream.
   - Codex saves originals under `~/.codex/generated_images/<thread-id>/`. Never leave a project asset only there.
   - For image-to-image (variants, background removal, consistent sets), attach the source: `codex exec -i source.png "…"`.
   - If the default model fails, pass a known model with `-m <model>`.
4. Transparency works the same way as in Paper: say "isolated object, transparent background, no shadow". The test output was a 1254×1254 **RGBA** PNG with corner alpha 0. Check with `file` and `magick … -format "%[fx:p{5,5}.a]" info:`.
5. Put the image back on the canvas with `<img src="paper-asset:///absolute/path/<name>.png" layer-name="…">` in `write_html`, and/or move it into the app's asset folder (convert to WebP as above).
6. In the report, say the image came from Codex CLI, not Paper, and give the local path.

Codex has no SVG model. For vectorize or SVG output with 0 Paper credits, tell the user and ask how to proceed.

## Example

```html
<img
  layer-name="Empty state – no chats"
  src="paper-gen://openai-gpt-image-2-5-big?prompt=Minimal%20editorial%20illustration%20of%20an%20empty%20desk%20with%20a%20single%20notebook%2C%20soft%20daylight%2C%20warm%20orange%20accent%2C%20white%20background%2C%20no%20text&aspect_ratio=3:2"
  style="width: 480px; border-radius: 14px"
/>
```

Prompt tips: name the style (editorial illustration, 3D clay, photo), light, palette taken from the file's tokens, background, and "no text" unless text is wanted.
