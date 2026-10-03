# Dubbing, Studio (long-form/podcasts), Productions (human services)

Snapshot 2026-10-03.

## Contents

- [Dubbing: which API](#dubbing-which-api)
- [Dubbing v2 project API](#dubbing-v2-project-api)
- [Editing, regeneration, bring-your-own transcript (Enterprise)](#editing-regeneration-bring-your-own-transcript-enterprise)
- [Legacy dubbing API](#legacy-dubbing-api)
- [Dubbing limits and billing](#dubbing-limits-and-billing)
- [Studio API (audiobooks, long-form, podcasts)](#studio-api-audiobooks-long-form-podcasts)
- [Create a podcast (GenFM)](#create-a-podcast-genfm)
- [Productions API (human-edited orders)](#productions-api-human-edited-orders)

## Dubbing: which API

| Need | Use |
| --- | --- |
| New integration, best quality, audio output | **Dubbing v2 project API** `client.dubbing.project.*` (`model_id: "dubbing_v2"`) |
| Dubbed **video** file, watermark discount, CSV manual mode | Legacy `client.dubbing.create` (`/v1/dubbing`) |
| Edit segments of a legacy dub | `client.dubbing.resource.*` — **deprecated**; Dubbing Studio is in maintenance mode |
| Human-verified dub | Productions orders (below) |
| Realtime/live dubbing | Not available |

## Dubbing v2 project API

Model: `dubbing_v2` (default) or `dubbing_v1`, fixed per project. Output: one lossless **FLAC** audio file per language via a signed URL (~1 h expiry). No video render — mux the audio back into your video (ffmpeg) for production. Up to 32 speakers; ~93 languages with BCP-47 dialects (`en-GB`, `es-MX`, `pt-BR`, `fr-CA`, `zh-TW`, …).

| REST | JS SDK |
| --- | --- |
| `POST /v1/dubbing/project` (multipart) | `client.dubbing.project.create({...})` |
| `GET /v1/dubbing/project` | `client.dubbing.project.list({ cursor, pageSize, status })` |
| `GET/DELETE /v1/dubbing/project/{project_id}` | `client.dubbing.project.get(id)` / `.delete(id)` |
| `POST /v1/dubbing/project/{id}/language` | `client.dubbing.project.language.create(id, { targetLanguage, voiceSettings?, translations? })` |
| `GET /v1/dubbing/project/{id}/language[/{language_id}]` | `client.dubbing.project.language.list(id)` / `.get(id, languageId)` |
| `DELETE …/language/{language_id}` | `client.dubbing.project.language.delete(id, languageId)` |
| `GET /v1/dubbing/project/{id}/transcript` | `client.dubbing.project.transcript.get(id)` |
| `GET …/language/{language_id}/transcript` | `client.dubbing.project.language.transcript.get(id, languageId)` |

Create fields: exactly one of `file` (≤3 GiB) / `sourceUrl`; `sourceLanguage` (omit = detect), `modelId`, `reference` (≤500 chars echo), `keyterms` (≤1000; biases transcription and translation), `webhookIds` (≤3), `targetLanguage` (shortcut that queues the first language), `transcript` (Enterprise BYOT).

Statuses: project `queued → preparing → ready | failed`; language `queued | processing | completed | stale | failed`. `outputs.losslessAudio` appears on `completed`. `warnings` like `voices_not_permitted` mean a replacement voice was used. `voiceSettings.cloningStrength` 0–10 (default 7): higher = closer to the original voice/accent, lower = more native delivery.

```ts
let project = await elevenlabs.dubbing.project.create({
  sourceUrl: "https://example.com/talk.mp4",
  sourceLanguage: "en",
  reference: "talk-2026-10",
  webhookIds: [process.env.EL_WEBHOOK_ID!],      // prefer webhooks over polling
});
while (project.status !== "ready") {
  if (project.status === "failed") throw new Error("source could not be prepared");
  await new Promise((r) => setTimeout(r, 5000));
  project = await elevenlabs.dubbing.project.get(project.projectId);
}
const langs = await Promise.all(["es", "de", "pt-BR"].map((targetLanguage) =>
  elevenlabs.dubbing.project.language.create(project.projectId, { targetLanguage })));
// poll language.get(...) until "completed", then download outputs.losslessAudio (FLAC) immediately
```

Webhook events: `dubbing_project_ready`, `dubbing_project_failed`, `dubbing_language_completed` (includes output URLs), `dubbing_language_failed`. Delivery is best-effort and may repeat — handle idempotently.

Retry rule: a failed **language** → add the language again on the same project (no new minimum charge). Create a new project only when the project itself failed.

## Editing, regeneration, bring-your-own transcript (Enterprise)

- Source transcript: `transcript.createSegment`, `.updateSegment`, `.updateSegments` (atomic, 1–500), `.deleteSegment`. Editing the source marks affected languages `stale`.
- Translations: `language.transcript.updateSegment(id, languageId, segmentId, { translation })` (`null` = re-translate), `.updateSegments`.
- `language.transcript.regenerate(id, languageId)` re-synthesizes only edited regions (409 if nothing changed or not settled).
- `revision` / `outputRevision`: `outputRevision < revision` ⇒ `stale` ⇒ regenerate.
- BYOT JSON: `{ "segments": [{ "external_id": "line_0", "speaker_id": "speaker_0", "start_s": 0, "end_s": 14.5, "text": "…", "translation": "optional" }] }`. Ordered by `start_s`, each 0.1–25 s, same-speaker segments must not overlap, ≤20,000 segments, ≤4 MiB, `sourceLanguage` required. Own translations: `language.create(id, { targetLanguage, translations: { line_0: "…" } })` covering every segment.

## Legacy dubbing API

`client.dubbing.create({ file | sourceUrl, sourceLang ("auto"), targetLang, name?, numSpeakers (0 = auto), watermark, startTime?, endTime?, highestResolution, dropBackgroundAudio, useProfanityFilter, dubbingStudio, disableVoiceCloning, mode: "automatic"|"manual", csvFile? })` → `{ dubbingId, expectedDurationSec }`.

- Poll `dubbing.get(dubbingId)` until `status === "dubbed"` (or `failed`).
- `dubbing.audio.get(dubbingId, languageCode)` → MP3/MP4 stream.
- `dubbing.transcripts.get(dubbingId, languageCode | "source", "srt" | "webvtt" | "json")` (the singular `dubbing.transcript.getTranscriptForDub` is deprecated).
- `dubbing.list({ cursor, pageSize, dubbingStatus, … })`, `dubbing.delete(id)`.
- Manual mode CSV columns: `speaker,start_time,end_time,transcription,translation`.

## Dubbing limits and billing

- Concurrency: 3 jobs on every self-serve plan, Enterprise 10 (separate pools per model). Over → `too_many_concurrent_requests`.
- Price: per source minute × target languages. API: Dubbing v1 $0.33/min with watermark, $0.50 without; Dubbing v2 $2.20/min. The v2 project API charges **one language at project creation** (prepaid first target).
- Deleting a running dub does not refund. Failed first language keeps its prepayment — retry on the same project.
- Download outputs right away; signed URLs expire.

## Studio API (audiobooks, long-form, podcasts)

ElevenCreative Studio (formerly "Projects"). The Studio API is **available on request** (contact sales) although endpoints are public in the spec/SDK. Base `/v1/studio/*` (old `/v1/projects` naming is gone).

| Task | JS SDK |
| --- | --- |
| Create project (from URL, document, or content JSON) | `client.studio.projects.create({ name, defaultModelId, fromUrl? | fromDocument? | fromContentJson?, qualityPreset?, autoConvert?, callbackUrl?, volumeNormalization?, pronunciationDictionaryLocators?, … })` |
| List / get / update / delete | `studio.projects.list()`, `.get(id)`, `.update(id, {...})`, `.delete(id)` |
| Replace content | `studio.projects.content.update(id, { fromUrl | fromDocument | fromContentJson, autoConvert })` |
| Convert (render) | `studio.projects.convert(id)`; chapters `studio.projects.chapters.convert(id, chapterId)` |
| Download | `studio.projects.snapshots.list(id)` → `.stream(id, snapshotId, { convertToMpeg: true })` or `.streamArchive(id, snapshotId)` (ZIP per chapter) |
| Chapters | `studio.projects.chapters.list/create/get/update/delete`, `chapters.snapshots.list/get/stream` |
| Pronunciation | `studio.projects.pronunciationDictionaries.create(id, { pronunciationDictionaryLocators, invalidateAffectedText: true })` |

Content JSON: `[{ "name": "Chapter 1", "blocks": [{ "sub_type": "p", "nodes": [{ "type": "tts_node", "voice_id": "VOICE_A", "text": "…" }] }] }]` (`sub_type`: `p`, `h1`, `h2`, `h3`). Multiple voices per paragraph = multi-cast audiobook.

Options: `qualityPreset` `standard|high|ultra|ultra_lossless`; `sourceType` `blank|book|article|genfm|video|screenplay`; metadata (`title`, `author`, `isbnNumber`, `genres`, `targetAudience`, `language`, `fiction`, `matureContent`); `volumeNormalization` (ACX loudness); `applyTextNormalization`; `createPublishingRead` (draft ElevenReader Publishing entry).

Callback payloads to `callbackUrl`: `project_conversion_status` / `chapter_conversion_status` with `conversion_status: "success" | "error"` and snapshot IDs.

Limits: 500 chapters/project, 400 paragraphs/chapter, 5,000 chars/paragraph. Default model Multilingual v2; v4 / v3 / Flash selectable. Sound effects are excluded when streaming a project via the API. Voiceover Studio was shut down on 2026-05-15.

## Create a podcast (GenFM)

`client.studio.createPodcast({ modelId, mode, source, durationScale?, language?, intro?, outro?, instructionsPrompt?, highlights?, qualityPreset?, callbackUrl? })` — paid plans. Auto-converts.

```ts
const { project } = await elevenlabs.studio.createPodcast({
  modelId: "eleven_multilingual_v2",
  mode: { type: "conversation", conversation: { hostVoiceId: "<host>", guestVoiceId: "<guest>" } },
  // or { type: "bulletin", bulletin: { hostVoiceId } } for a single narrator
  source: { type: "url", url: "https://en.wikipedia.org/wiki/Cognitive_science" }, // or { type: "text", text }
  durationScale: "short",                      // short <3 min, default 3–7, long >7
  callbackUrl: "https://example.com/hooks/studio",
});
// wait for callback (or poll studio.projects.get), then snapshots.list → snapshots.stream(..., { convertToMpeg: true })
```

## Productions API (human-edited orders)

Human transcripts, subtitles (incl. SDH) and dubs, quoted in USD. Only in the OpenAPI/SDK, not the docs nav. Use **sandbox orders** for tests (they auto-progress, no humans, no charge).

```ts
const { orderId } = await elevenlabs.productions.orders.create({ sandbox: true });
const { mediaId } = await elevenlabs.productions.orders.media.register(orderId, {
  declaredLanguage: "en", mediaUrl: "https://example.com/video.mp4",
  mediaUrlFilename: "video.mp4", mediaUrlContentType: "video/mp4",
});
await elevenlabs.productions.orders.items.upsert(orderId, {
  request: { item: { kind: "subtitles", mediaIds: [mediaId], sourceLanguage: "en", destinationLanguages: ["es", "de"], sdh: false } },
});
const order = await elevenlabs.productions.orders.get(orderId);   // wait for totalAmountUsd quote
await elevenlabs.productions.orders.submit(orderId);              // CHARGES the workspace (real orders)
const { deliverables } = await elevenlabs.productions.orders.deliverables.list(orderId); // signed URLs when done
```

- Item kinds: `dub` (`mediaId`, `sourceLanguage`, `destinationLanguages`, `includeCaptions`, `includeSourceCaptions`, `instructions?`), `subtitles` (`mediaIds`, `cueOptions`, `sdh`), `transcription` (`mediaIds`, `verbatim`).
- PATCH order and item upsert bodies are wrapped in `request: { … }`.
- Languages per kind: `productions.orders.languages.list("dub" | "subtitles" | "transcription")`.
- States: `open → submitted → paid → accepted → done` (or `rejected`, `cancelled`, `expired`). Confirm with the user before `submit` on non-sandbox orders.
