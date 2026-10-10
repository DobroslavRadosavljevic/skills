---
name: codex-image-gen
description: Generate or edit raster images (illustrations, photos, icons, stickers, sprites, transparent cutouts, multi-image composites) through the OpenAI Codex CLI built-in image tool, billed to the user's ChatGPT login with no OPENAI_API_KEY. Always runs gpt-6-luna at low effort in a lean `codex exec` session and copies the PNG to a chosen path. Use when the user invokes $codex-image-gen, asks to make, draw, render, or edit an image "with Codex" or "via codex cli", wants an image asset without an API key, or wants cheaper Codex image generation.
---

# Codex Image Gen

Make images with `codex exec` and its built-in image tool. A small helper script runs the session, then copies the PNG out of `$CODEX_HOME/generated_images/<thread_id>/` to the path you ask for.

## Requirements

- `codex` CLI on `PATH`, logged in (`codex login status` prints "Logged in using ChatGPT" or an API key login).
- `bun` for the helper script.
- The `image_generation` feature is on: `codex features list | grep image_generation` shows `true`. It is stable and on by default.

If a requirement is missing, tell the user. Do not install or log in for them.

## Generate

```bash
bun scripts/codex-image.ts --out assets/hero.png --prompt "Wide 16:9 photo of a lighthouse at dawn, soft fog, no text"
```

Options:

| Flag | Default | Use |
| --- | --- | --- |
| `--out <file.png>` | required | Final path. With `--n 2+` the script writes `name-1.png`, `name-2.png`, … |
| `--prompt "<text>"` | stdin | The image prompt. Sent to the tool verbatim. |
| `--image <file>` | none | Repeat for each input image (edit target or reference), in order. |
| `--transparent` | off | Asks the tool for a real alpha channel. |
| `--n <1-8>` | `1` | Variants of the same prompt in one session. Cheaper than separate runs. |
| `--timeout <s>` | `300` | Kills the run after this many seconds. |
| `--full-config` | off | Loads `~/.codex/config.toml`, MCP servers, and rules. Costs far more tokens. |
| `--force` | off | Overwrite an existing `--out` file. |

The script prints JSON with `files`, `threadId`, `usage`, and `seconds`. Exit code 1 means no image; stderr has the reason.

## Rules

- **Put size and shape in the prompt.** The built-in tool has no size, quality, or format option. Its only inputs are `prompt`, `referenced_image_paths`, `transparent_background`, and `num_last_images_to_include`. Write "square", "wide 16:9", or "tall 9:16 portrait" in the prompt.
- **Always `gpt-6-luna` at `low` effort.** The script fixes it. There is no model option. A separate image model draws the picture, so a bigger text model costs more and gives the same images (tested: `gpt-6-astra` vs `gpt-6-luna`, same prompt, 3 images each). In the manual fallback, use the same model and effort.
- **Write the full prompt yourself.** The script tells the session to pass the prompt verbatim. Put subject, style, composition, lighting, exact text in quotes, and an avoid list in it. See [references/prompting.md](references/prompting.md).
- **One asset per prompt.** Use `--n` only for variants of one prompt. Run the script again for a different asset.
- **Edits:** pass the source with `--image`, say what to change and what to keep. For cutouts add `--transparent`.
- **Check the result.** Open each output image and check subject, text spelling, and framing. Change one thing in the prompt and run again if it is wrong.
- **Do not overwrite** project assets unless the user asked. Write a sibling such as `hero-v2.png`.
- Report the saved path(s), the final prompt, and the model used.

## Manual fallback

Without the script, run Codex directly. Send the prompt on stdin, because `-i` takes several values and swallows a prompt that follows it.

```bash
printf 'Call the image generation tool once with this prompt, then stop: <prompt>' | codex exec --json --ephemeral --skip-git-repo-check --ignore-user-config --ignore-rules --sandbox read-only -m gpt-6-luna -c model_reasoning_effort="low" - > events.jsonl
```

Read `thread_id` from the first JSON line, then copy `~/.codex/generated_images/<thread_id>/*.png` to the target path.

## Troubleshooting

Tested limits, token costs, model notes, and failure cases: [references/tested-behavior.md](references/tested-behavior.md).
