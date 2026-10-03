# Music, Sound Effects, Voice Changer, Voice Isolator, Audio Native, History

Snapshot 2026-10-03.

## Contents

- [Music (Eleven Music)](#music-eleven-music)
- [Composition plans](#composition-plans)
- [Inpainting, extend, loops, references](#inpainting-extend-loops-references)
- [Upload, stems, video-to-music, finetunes](#upload-stems-video-to-music-finetunes)
- [Music prompting](#music-prompting)
- [Sound effects](#sound-effects)
- [Voice changer (speech to speech)](#voice-changer-speech-to-speech)
- [Voice isolator (audio isolation)](#voice-isolator-audio-isolation)
- [Audio Native (embedded article player)](#audio-native-embedded-article-player)
- [History API](#history-api)

## Music (Eleven Music)

Models: `music_v2_5` (best), `music_v2`, `music_v1`. **API default is still `music_v1`** — pass `modelId: "music_v2_5"`. Length 3 s–10 min (`music_length_ms` 3,000–600,000). Paid plans only. Concurrency 2 (Starter–Pro), 5 (Scale/Business). $0.15/min API. Output cleared for nearly all commercial use.

| REST | JS SDK | Returns |
| --- | --- | --- |
| `POST /v1/music` | `client.music.compose(req)` | audio stream; `song-id` header |
| `POST /v1/music/stream` | `client.music.stream(req)` | chunked audio |
| `POST /v1/music/detailed` | `client.music.composeDetailed(req)` | `{ json: { compositionPlan, songMetadata, wordsTimestamps?, waveformVisual? }, audio: Buffer, filename, songId? }` |
| `POST /v1/music/detailed/stream` | `client.music.composeDetailedStream(req)` | SSE: plan, metadata, base64 `audio_chunk`s |
| `POST /v1/music/plan` | `client.music.compositionPlan.create({ prompt, musicLengthMs?, modelId?, sourceCompositionPlan? })` | plan (free to iterate on) |
| `POST /v1/music/upload` | `client.music.upload({ file, extractCompositionPlan?: "music_v2_5", withTimestamps?, withWaveformVisual? })` | `{ songId, compositionPlan? }` (boolean `extractCompositionPlan` is deprecated; pass the model id) |
| `POST /v1/music/stem-separation` | `client.music.separateStems({ file, stemVariationId? })` | ZIP |
| `POST /v1/music/video-to-music` | `client.music.videoToMusic({ videos, description?, tags?, modelId? })` | audio |
| `/v1/music/finetunes[/{id}]` | `client.music.finetunes.list/create/get/update/delete` | finetune |

Compose body: `prompt` (≤4,100 chars) **xor** `compositionPlan`; `musicLengthMs` (prompt only); `modelId`; `generationMode` `track|loop|ambience|video_to_music` (prompt only); `lyricsText` (≤4,000); `forceInstrumental` (prompt only); `seed` (not with prompt); `finetuneId` + `finetuneStrength` (0–2, default 1); `usePhoneticNames`; `respectSectionsDurations` (v1 plans); `storeForInpainting` (needed to reuse the song); `signWithC2pa` (mp3). Detailed adds `withTimestamps`, `withWaveformVisual`. `outputFormat` query: `auto` (default; v2 → `mp3_48000_192`), `mp3_48000_128|192|240|320`, `mp3_44100_*`, `pcm_*`, `opus_48000_*`, `ulaw_8000`, `alaw_8000`.

```ts
const audio = await elevenlabs.music.compose({
  prompt: "Warm lo-fi hip hop, 80 BPM, dusty vinyl drums, Rhodes chords in D minor, instrumental",
  musicLengthMs: 60_000,
  modelId: "music_v2_5",
  forceInstrumental: true,
});
```

Copyright guard: prompts naming artists/bands or copyrighted lyrics fail with `detail.status === "bad_prompt"` and a `detail.data.prompt_suggestion`; plans fail with `bad_composition_plan` + `composition_plan_suggestion`. Retry with the suggestion.

## Composition plans

Generate a plan from a prompt (free), edit it, then compose. **Plan format must match the model**: v1 plans with v2 models (or the reverse) error.

v2 / v2.5 `CompositionPlan` = `{ chunks: [...] }` (≤30 chunks, total 3 s–10 min):

- Generation chunk: `{ text, durationMs (3,000–120,000), positiveStyles (≤50, English, ~6–7 in the first chunk), negativeStyles, contextAdherence: "low"|"medium"|"high" (default high), conditioningRef?: { songId, range: { startMs, endMs } } (≤30 s), conditionStrength?: "low"|"medium"|"high"|"xhigh" }`.
- `text` syntax: `[Verse 1]` section name, lyric lines (≤30 lines × 200 chars), `{guitar solo}` inline directions, `(ooh)` vocal sounds.
- Audio reference chunk: `{ songId, range: { startMs, endMs } }` — inserts stored audio unchanged (≥50 ms).

v1 `MusicPrompt` = `{ positiveGlobalStyles, negativeGlobalStyles, sections: [{ sectionName, positiveLocalStyles, negativeLocalStyles, durationMs, lines }] }`.

```ts
const plan = await elevenlabs.music.compositionPlan.create({
  prompt: "An upbeat pop song about summer adventures", musicLengthMs: 60_000, modelId: "music_v2_5",
});
plan.chunks[0].text = "[Verse 1]\nSalt in the air, we drive till the sun goes down";
const song = await elevenlabs.music.compose({ compositionPlan: plan, modelId: "music_v2_5" });
```

## Inpainting, extend, loops, references

1. Store a song: `composeDetailed({ …, storeForInpainting: true })` → `songId` (also the `song-id` header), or `music.upload({ file })` (billed like a generation, copyright-checked).
2. Compose a plan mixing reference chunks and generation chunks:

```ts
await elevenlabs.music.compose({
  modelId: "music_v2_5",
  compositionPlan: { chunks: [
    { songId, range: { startMs: 0, endMs: 50_000 } },                       // keep the original
    { text: "[Outro]\nThe future has arrived", durationMs: 10_000,
      positiveStyles: ["epic finale"], negativeStyles: [], contextAdherence: "high" },
  ] },
});
```

Patterns: replace a section (ref → new chunk → ref), extend (ref + new chunk), seamless loop (two identical refs with a `[Glue]` chunk between), "similar song" (first chunk with `conditioningRef`).

## Upload, stems, video-to-music, finetunes

- Stems: `separateStems({ file, stemVariationId: "six_stems_v1" | "two_stems_v1" })` → ZIP. High latency. Use instead of Voice Isolator for music vocals.
- Video-to-music: ≤10 videos, ≤200 MB combined, ≤600 s; `description` ≤1,000 chars; ≤10 `tags`.
- Finetunes (custom style): `finetunes.create({ name (5–200), primaryGenre, files (≤50 tracks, 10–600 s, ≤30 MB each, ≤250 min total), tags?, visibility: "private"|"workspace", modelId })` → poll `status` (`pending|in_progress|completed|failed|blocked`, `trainingProgress`). ~5–10 min. Copyright-screened; rejected uploads are not refunded. $1.50 each. Create's `modelId` defaults to deprecated `music_v1` — set it. Use with `compose({ finetuneId, finetuneStrength })`.

## Music prompting

- Cover genre, mood, instrumentation, tempo (BPM), key, era, vocal type and delivery.
- Use production vocabulary: "sidechained", "close-mic'd", "tape saturation", "plate reverb", "bone-dry".
- Narrate arrangement: "start with solo piano, bring in drums at 0:20, big chorus at 0:45".
- Loops: state bars, BPM, key and exclusions ("no melody — just drums"), `generationMode: "loop"`.
- Instrumental: `forceInstrumental: true` and say "instrumental only".
- Timing cues work: "lyrics begin at 15 seconds".
- Never name real artists or paste copyrighted lyrics.

## Sound effects

`POST /v1/sound-generation` → `client.textToSoundEffects.convert(req)`.

Body: `text`* (prompt), `durationSeconds` (0.5–30; omit = auto), `promptInfluence` (0–1, default 0.3; higher = more literal), `loop` (seamless loop), `modelId` (`eleven_text_to_sound_v2`). `outputFormat` query like TTS. $0.12/min API.

```ts
const sfx = await elevenlabs.textToSoundEffects.convert({
  text: "Heavy wooden door creaks open, then slams shut in a stone hallway",
  durationSeconds: 4, promptInfluence: 0.5,
});
```

Prompt tips: one clear event ("glass shattering on concrete"), sequences ("footsteps on gravel, then a metal door opens"), musical loops ("90s hip-hop drum loop, 90 BPM"), sound-design terms (impact, whoosh, riser, braam, drone, ambience, one-shot, stem). SFX output is **not** in History — persist it.

## Voice changer (speech to speech)

`POST /v1/speech-to-speech/{voice_id}` → `client.speechToSpeech.convert(voiceId, req)`; `/stream` → `.stream(voiceId, req)`.

Multipart: `audio`* (≤5 min per request), `modelId` (default `eleven_english_sts_v2` — use `eleven_multilingual_sts_v2`), `voiceSettings` (**JSON string**), `seed`, `removeBackgroundNoise`, `fileFormat` (`pcm_s16le_16` for lower latency). Keeps the performance (timing, emotion), swaps the voice. $0.12/min.

```ts
const out = await elevenlabs.speechToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  audio: createReadStream("take.wav"),
  modelId: "eleven_multilingual_sts_v2",
  outputFormat: "mp3_44100_128",
  voiceSettings: JSON.stringify({ stability: 0.5, similarity_boost: 0.8 }),
});
```

## Voice isolator (audio isolation)

`POST /v1/audio-isolation` → `client.audioIsolation.convert({ audio })`; `/stream` → `.stream({ audio })`; history `audioIsolation.list()` / `.delete(id)`. Removes background noise/music from speech. Inputs: common audio and video formats, ≤500 MB / 1 h. `fileFormat: "pcm_s16le_16"` for raw PCM. $0.12/min. Not for music vocal extraction (use stem separation). If `convert` is missing from your SDK typings, call the REST endpoint (it is absent from `reference.md` but present in source).

## Audio Native (embedded article player)

Voice a web page with a hosted player (Creator+). Dashboard configures colors, voice, and a URL allowlist.

- `client.audioNative.create({ name, title?, author?, voiceId?, modelId?, file?, autoConvert?, textColor?, backgroundColor?, applyTextNormalization? })` → `{ projectId, converting, htmlSnippet }`.
- `client.audioNative.updateContentFromUrl({ url })` re-extracts and republishes the page for that URL; `update(projectId, { file, autoConvert, autoPublish })`; `getSettings(projectId)`.
- Embed: `<div id="elevenlabs-audionative-widget" data-height="90" data-width="100%" data-publicuserid="…" data-playerurl="https://elevenlabs.io/player/index.html" data-projectid="…"></div>` + `<script src="https://elevenlabs.io/player/audioNativeHelper.js" type="text/javascript"></script>`. In React, append the script in `useEffect` from a client component.

## History API

TTS, voice changer, Studio and agent generations are stored unless `enable_logging=false`. **Music and SFX are not stored** — save outputs yourself.

- `client.history.list({ pageSize (≤1000), startAfterHistoryItemId, voiceId, modelId, dateBeforeUnix, dateAfterUnix, sortDirection, search, source })` → paginate with `lastHistoryItemId` + `hasMore`.
- `history.get(id)`, `history.getAudio(id)` (stream), `history.download({ historyItemIds, outputFormat? })` (file or ZIP), `history.delete(id)`.
- Items carry `requestId`, `voiceId`, `modelId`, `text`, `settings`, `source` (`TTS|STS|Projects|AN|Dubbing|ConvAI|Flows|…`), `dialogue[]` for TTD, `characterCountChangeFrom/To`.
