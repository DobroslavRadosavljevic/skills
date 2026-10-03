# Image & Video generation, Flows templates, Assets

Snapshot 2026-10-03. Async generation API under `/v1/flows/*`. Requires **Pro plan or higher** (`402 paid_plan_required`) and an API key with Image & Video / Flows permission. Avatars and Ads Engine have **no API** (web app only).

## Contents

- [Endpoints](#endpoints)
- [Models](#models)
- [Media references and chaining](#media-references-and-chaining)
- [Lifecycle and polling](#lifecycle-and-polling)
- [Webhooks](#webhooks)
- [Templates](#templates)
- [Assets](#assets)
- [Gotchas](#gotchas)

## Endpoints

| REST | JS SDK |
| --- | --- |
| `POST/GET /v1/flows/image`, `GET /v1/flows/image/{generation_id}` | `client.flows.image.create / list / get` |
| `POST/GET /v1/flows/video`, `GET /v1/flows/video/{id}` | `client.flows.video.create / list / get` |
| `POST/GET /v1/flows/text-to-speech`, `GET …/{id}` | `client.flows.textToSpeech.create / list / get` |
| `GET /v1/flows/templates[/{template_id}]` | `client.flows.templates.list / get` |
| `POST/GET /v1/flows/templates/{template_id}/runs[/{run_id}]` | `client.flows.templates.runs.create / list / get` |
| `POST/GET/DELETE /v1/assets[/{asset_id}]` | `client.assets.create / list / get / delete` |

Each `model_id` has its own request schema (discriminated union); unknown fields are rejected. Inspect live: `python3 scripts/openapi_lookup.py /v1/flows/video --full`.

## Models

Image (`client.flows.image.create`):

| `modelId` | Notes |
| --- | --- |
| `gemini-3-pro-image` (Nano Banana Pro) | ≤10 refs, aspect `auto`…`21:9` (default 16:9), resolution 1K/2K/4K |
| `gemini-3.1-flash-image` (Nano Banana 2) | ≤14 refs, extreme aspects, 512–4K |
| `gemini-3.1-flash-lite-image`, `gemini-2.5-flash-image` | cheaper/faster |
| `gpt-image-2` | ≤10 refs + mask, 15 aspects, 1K/2K/4K, quality ≤high |
| `gpt-image-2.5-flare`, `gpt-image-2.5-sunburst` | quality `low…max` |
| `gpt-image-1`, `gpt-image-1.5` | ≤5 refs + mask |
| `bytedance-seedream-5-lite`, `bytedance-seedream-5-pro` | 2K/3K, seed; ByteDance needs access approval |

Video (`client.flows.video.create`):

| `modelId` | Notes |
| --- | --- |
| `veo-3.1-generate-001`, `veo-3.1-fast-generate-001` | `prompt`, `negativePrompt`, `seed`, `durationSecs` 4/6/8, `aspectRatio` 16:9/9:16, `resolution` 720p/1080p/4K, `generateAudio` (true), `startFrame`, `endFrame`, `images` ≤3 (`subject`/`style`) |
| `bytedance-seedance-v2` (`-fast`, `-mini`), `bytedance-seedance-v2.5` | multi-reference images/videos/audio, 4–15 s (v2.5 up to 30 s) |
| `creatify-aurora` | lip-sync talking head: `image` + `audio` required |

Flows TTS (async, mp3 only): `eleven_flash_v2_5`, `eleven_multilingual_v2`, `eleven_v3` with `text`, `voice`, `voiceSettings`, `languageCode`, `pronunciationDictionaryLocators`. Prefer `/v1/text-to-speech` for synchronous audio.

Many other models (Kling, Runway, FLUX, LTX, Wan, HeyGen, Topaz upscale…) are app-only. Several models are geo-restricted (not in the US). Model lists change monthly — check the spec before hard-coding.

## Media references and chaining

References take one of:

- `{ type: "generation", generationId }` — may point to a **still-pending** generation; the server chains them. Upstream failure cascades as `dependency_failed` (refunded).
- `{ type: "asset", assetId }` — stored asset.
- `{ type: "inline_base64", contentBase64, mimeType }` — ≤25 MB decoded, ephemeral.

```ts
const still = await elevenlabs.flows.image.create({
  modelId: "gemini-3-pro-image", prompt: "A lighthouse on a cliff at dawn, cinematic", aspectRatio: "16:9", resolution: "2K",
});
const clip = await elevenlabs.flows.video.create({
  modelId: "veo-3.1-fast-generate-001",
  prompt: "Fog rolls in and the beam sweeps across the water",
  startFrame: { type: "generation", generationId: still.id },   // no need to wait for the image
  durationSecs: 8, generateAudio: true,
  webhook: { type: "all" },
});
```

## Lifecycle and polling

`create` → `{ id, status: "pending" }`. `get(id)` → `pending | generating` → `completed { contentUrl, contentMimeType }` or `failed { failureReason, errorMessage }`. Failure reasons: `timeout`, `model_error`, `moderated`, `invalid_parameters`, `dependency_failed`, `charging_failed`, `internal_error`. Failed generations are not charged. `contentUrl` is signed for ~1 h — store the generation/asset ID or download the file.

Poll images every ≥2 s and video every ≥10 s with backoff and a ceiling. `list({ pageSize (≤100), status, modelId, cursor })` returns API-created generations only.

## Webhooks

Preferred over polling. Create a workspace webhook subscribed to `flows` (dashboard or `client.webhooks.create`), then pass `webhook: { type: "all" }` or `{ type: "ids", ids: [...] }` on create. Payload `{ type: "flows_generation", event_timestamp, data: <terminal GET response> }`; template runs send `flows_template_run`. Verify signatures on the raw body ([platform-admin.md](platform-admin.md#webhooks)). Errors: `no_webhooks_configured`, `invalid_webhook_id`, `webhook_disabled`.

## Templates

Templates are published Flows (node graphs) with typed input/output ports.

```ts
const { templates } = await elevenlabs.flows.templates.list({ search: "product ad" });
const run = await elevenlabs.flows.templates.runs.create(templateId, {
  inputs: { prompt_port: "Sneaker launch, neon city", image_port: { type: "asset", assetId } },
  versionId: "latest",
  webhook: { type: "all" },
});
// runs.get(templateId, run.id) → status pending|generating|completed|failed; outputs keyed by port id
```

Inputs: primitives, arrays (≤64), or references (`generation`, `asset`, `voice`, `inline_base64`). Object ports are not bindable yet.

## Assets

`client.assets.create({ file })` stores reusable media; `get(id)` returns a signed `contentUrl` (~1 h). Storage: Pro 11 GB, Scale 33 GB, Business 111 GB, Enterprise 333 GB (`asset_storage_limit_exceeded`).

## Gotchas

1. Pro+ only; ByteDance models return `model_access_denied` until the workspace is approved.
2. Signed URLs expire in ~1 h.
3. Retired: Sora 2 / Sora 2 Pro (2026-09-24); Seedance 1.5 Pro retires 2026-11-11.
4. The Flows help page says the API is "planned" — outdated; the API exists.
