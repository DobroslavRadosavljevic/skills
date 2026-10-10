# Tested behavior

Tested on 2026-10-10 with `codex-cli 0.159.3`, ChatGPT login, macOS. Check `codex --version` and run one image again if the CLI is much newer.

## How it works

- `codex exec` gives the model a built-in tool (seen as `image_gen__imagegen`). The model writes the tool call; a separate image model draws the picture.
- Codex saves every output to `$CODEX_HOME/generated_images/<thread_id>/exec-<uuid>.png`, also with `--ephemeral`. `CODEX_HOME` defaults to `~/.codex`.
- The `--json` event stream does not show the image tool call. Read `thread_id` from the `thread.started` event and look in the folder.
- With a ChatGPT login, use counts against the ChatGPT plan limits. No `OPENAI_API_KEY` is needed.

## Tool inputs

| Input | Type | Notes |
| --- | --- | --- |
| `prompt` | string, required | An empty prompt fails with HTTP 400. The model then retries by itself. |
| `referenced_image_paths` | string[] | Paths to input images. The model types these by hand, so long paths get typos. The script stages inputs as `input-1.png`, `input-2.png`. |
| `transparent_background` | boolean | Works. Output has an alpha channel. |
| `num_last_images_to_include` | integer | Reuses images from earlier in the same session. Not useful in one-shot runs. |

No size, quality, format, or count input. Output is PNG.

## Observed outputs

| Prompt shape | Size |
| --- | --- |
| square | 1254×1254 |
| wide 16:9 | 1672×941 |
| two-image composite, transparent | 1374×(about 1150) |

Text in images ("BREW" on a sticker) rendered correctly. Each image took about 20–45 seconds end to end.

## Cost: the text model and the config

The text model only drives the session. Image quality looked the same with every model tested.

| Setup | Input tokens per run |
| --- | --- |
| Default `codex exec` with the full user config (MCP, plugins, skills), model also copies the file | ~177,000 |
| `--ignore-user-config --ignore-rules`, model also copies the file | ~112,000 |
| Lean flags, "only call the tool" prompt, 1 image (`gpt-5.6-luna`) | ~37,000 |
| Lean flags, "only call the tool" prompt, 1 image (`gpt-6-luna`) | ~46,000 |
| Lean flags, 2 variants in one session | ~63,000 |

Same prompt, same day, 1 image each: `gpt-5.6-luna` used 36,839 input tokens (8,679 uncached), `gpt-6-luna` used 41,881 (10,649 uncached). Both took 20 seconds. The script still uses `gpt-6-luna` by choice: it is the current-generation small model.

Same prompt, 3 images each: `gpt-6-astra` used ~99,000 input tokens in 84 seconds, `gpt-6-luna` ~69,000 in 75 seconds. The images were the same size, style, and text quality. Differences between images from one model were larger than differences between models.

Most input tokens are cached. Cheapest working models found in `codex debug models`: `gpt-6-luna` ("Fast and affordable model for easier tasks") and the older `gpt-5.6-luna`. Both called the tool correctly at `low` effort. List the current models with:

```bash
codex debug models | jq -r '.models[] | select(.visibility=="list") | "\(.slug)\t\(.description)"'
```

## Failure cases

| Symptom | Cause | Fix |
| --- | --- | --- |
| `No prompt provided via stdin` | `-i <file> "<prompt>"`: `-i` is variadic and took the prompt as a file | Put the prompt on stdin with `-`, or before `-i` |
| `unable to read referenced image at …` | The model mistyped a long path | Use short relative input names (the script does this) |
| Run ends, no file in the target folder | The model said it could not save the PNG | Copy from `generated_images/<thread_id>/` yourself; never trust the model to copy |
| `Invalid 'prompt': empty string` in stderr | The model sent an empty prompt once | Usually self-heals; the script fails only if no image exists |
| `Reading additional input from stdin...` hang | stdin left open | Redirect stdin (`</dev/null`) or pipe the prompt |
