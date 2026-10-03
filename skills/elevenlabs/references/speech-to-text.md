# Speech to Text (Scribe) and Forced Alignment

Snapshot 2026-10-03.

## Contents

- [Models](#models)
- [Batch transcription](#batch-transcription)
- [Batch request fields](#batch-request-fields)
- [Response shape](#response-shape)
- [Entity detection and redaction](#entity-detection-and-redaction)
- [Multichannel](#multichannel)
- [Async with webhooks](#async-with-webhooks)
- [Realtime WebSocket](#realtime-websocket)
- [Realtime from Node (server SDK)](#realtime-from-node-server-sdk)
- [Realtime in the browser](#realtime-in-the-browser)
- [Forced alignment](#forced-alignment)
- [Limits, pricing, concurrency](#limits-pricing-concurrency)
- [Gotchas](#gotchas)

## Models

| `model_id` | Mode | Notes |
| --- | --- | --- |
| `scribe_v2` | Batch | Default choice. 90+ languages, diarization ≤32 speakers, word/char timestamps, audio-event tags, keyterms ≤1000, entity detection, transcript editing. |
| `scribe_v2_medical` | Batch | Clinical tuning, same API and price as `scribe_v2`. HIPAA needs an Enterprise BAA. |
| `scribe_v2_realtime` | WebSocket | ~150 ms. The only realtime model. Keyterms ≤50 (≤20 chars each). |
| `scribe_v1` | — | **Removed 2026-07-09.** Replace with `scribe_v2`. Some third-party type unions still list it. |

## Batch transcription

`POST /v1/speech-to-text` (multipart) → `client.speechToText.convert(req)`. Python: `client.speech_to_text.convert(...)`.

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { createReadStream } from "node:fs";

const elevenlabs = new ElevenLabsClient();
const t = await elevenlabs.speechToText.convert({
  file: createReadStream("meeting.mp3"),   // or Blob/File/Buffer; or sourceUrl instead
  modelId: "scribe_v2",
  diarize: true,
  tagAudioEvents: true,
  languageCode: "eng",                     // omit to auto-detect
  keyterms: ["ElevenLabs", "Scribe"],
  additionalFormats: [{ format: "srt" }, { format: "txt" }],
});
console.log(t.text, t.words, t.additionalFormats);
```

Other endpoints: `client.speechToText.transcripts.get(transcriptionId)` (`GET /v1/speech-to-text/transcripts/{id}`), `.transcripts.delete(id)`.

Browser upload without the API key: mint `client.tokens.singleUse.create("batch_scribe")` server-side, then call `POST /v1/speech-to-text?token=<token>` from the browser.

## Batch request fields

Only `model_id` is required. Provide exactly one of `file` / `source_url`.

| Field (SDK camelCase) | Default | Notes |
| --- | --- | --- |
| `file` | — | ≥100 ms. API ref allows <5 GB; UI/FAQ say 3 GB — treat 3 GB as safe. |
| `sourceUrl` | — | Hosted file **or YouTube / TikTok / video-host URL**. Replaces deprecated `cloudStorageUrl`. |
| `languageCode` | auto | ISO 639-1 or 639-3. |
| `tagAudioEvents` | true | `(laughter)` etc. become words with `type: "audio_event"`. |
| `numSpeakers` | model max | 1–32. Not with multichannel. |
| `diarize` | **false** | Turn on for speaker labels. |
| `diarizationThreshold` | ~0.22 | 0.1–0.4; only with `diarize` and no `numSpeakers`. Higher → fewer speakers. |
| `detectSpeakerRoles` | false | Needs `diarize`; labels `agent` / `customer`. +10%. |
| `useSpeakerLibrary` | false | Match speakers against the workspace speaker library (needs `diarize`). |
| `timestampsGranularity` | `word` | `none` \| `word` \| `character`. |
| `additionalFormats` | — | ≤10 of `srt`, `txt`, `segmented_json`, `docx`, `pdf`, `html` with options (`maxCharactersPerLine`, `includeSpeakers`, `includeTimestamps`, `segmentOnSilenceLongerThanS`, `maxSegmentDurationS`, `maxSegmentChars`). Content returns base64 when binary (`isBase64Encoded`). |
| `fileFormat` | `other` | `pcm_s16le_16` (16-bit 16 kHz mono LE raw) for lower latency. |
| `keyterms` | — | ≤1000 terms, each <50 chars and ≤5 words, no `<>{}[]\`. +20%; >100 terms → 20 s minimum billing. |
| `noVerbatim` | false | Drop fillers, false starts, non-speech sounds. |
| `transcriptEdit` | — | Natural-language edit instruction ≤2,000 chars → `editedTranscript`. Experimental, +30%, min 10 s. Not with entities or multichannel. |
| `entityDetection` / `entityRedaction` / `entityRedactionMode` | — | See below. |
| `useMultiChannel` / `multichannelOutputStyle` | false / `separate` | See below. |
| `webhook` / `webhookId` / `webhookMetadata` | false | Async mode. Metadata ≤16 KB, depth ≤2. |
| `temperature` | model default | 0–2. |
| `seed` | — | 0–2147483647. |
| query `enableLogging` | true | `false` = zero retention (Enterprise). |

Run `python3 scripts/openapi_lookup.py /v1/speech-to-text --full` for the live list.

## Response shape

`SpeechToTextChunkResponseModel`: `languageCode`, `languageProbability`, `text`, `words[]`, `additionalFormats?`, `transcriptionId?`, `entities?`, `audioDurationSecs?`, `editedTranscript?`.

- Word: `{ text, type: "word" | "spacing" | "audio_event", logprob, start, end, speakerId ("speaker_0"… or "agent"/"customer"), characters?, channelIndex? }`.
- `editedTranscript`: `{ kind: "transcript", text, editedText }` or `{ kind: "error", errorType: "edit_failed", message }`. Read `editedText` first, fall back to `text` (docs examples disagree). Timestamps describe the original text.
- JS SDK overloads: `{ webhook: true }` → webhook ack `{ message, requestId, transcriptionId }`; `{ useMultiChannel: true }` → `{ transcripts[], transcriptionId, audioDurationSecs }` (mono audio still returns the single shape).
- Build captions from `words` (group by `speakerId`, split on gaps) or request `additionalFormats: [{ format: "srt" }]`.

## Entity detection and redaction

- `entityDetection`: `"all"`, a category (`pii`, `phi`, `pci`, `other`, `offensive_language`), specific types, or an array. Returns `entities[]` `{ text, entityType, startChar, endChar }` (offsets into `text`). +30%.
- `entityRedaction`: same format, must be a subset of detection. Replaces text in `text` and `words`; `entities` is then **not** returned. +30%.
- `entityRedactionMode`: `redacted` → `{REDACTED}`, `entity_type` → `{NAME}`, `enumerated_entity_type` (default) → `{NAME_0}`.
- Common types: `name`, `email_address`, `phone_number`, `credit_card`, `cvv`, `ssn`, `dob`, `location_address`, `bank_account`, `passport_number`, `condition`, `drug`, `organization`, plus offensive-language types. Full list on the entity-detection guide page.

```ts
const t = await elevenlabs.speechToText.convert({
  file, modelId: "scribe_v2",
  entityDetection: ["pii"], entityRedaction: ["pii"], entityRedactionMode: "enumerated_entity_type",
});
// "Hi {NAME_0}, your card ending in {CREDIT_CARD_0} was declined."
```

## Multichannel

`useMultiChannel: true` with `diarize: false` and no `numSpeakers`. ≤5 channels; channel N → `speaker_N`; each channel may be a different language; each channel bills full duration. `multichannelOutputStyle: "combined"` returns one time-sorted transcript with `channelIndex` per word (needs timestamps; not with webhooks or entities). Processing estimate ≈ `0.3·duration + 2 + 0.5·channels` seconds.

## Async with webhooks

1. Create a workspace webhook (dashboard Developers → Webhooks, event "Transcription completed", or `client.webhooks.create`).
2. `convert({ ..., webhook: true, webhookId?, webhookMetadata: { jobId } })` → immediate ack with `transcriptionId`.
3. Receive `{ type: "speech_to_text_transcription", data: { request_id, webhook_metadata, transcription } }`. Verify the signature on the **raw** body (see [platform-admin.md](platform-admin.md#webhooks)). Match on the `type` you receive; one docs sample checks a different string.
4. Fallback: poll `transcripts.get(transcriptionId)`.

## Realtime WebSocket

`wss://api.elevenlabs.io/v1/speech-to-text/realtime`. Auth: `xi-api-key` header (server) or `?token=<single-use realtime_scribe token>` (browser).

Query: `model_id=scribe_v2_realtime`, `audio_format` (`pcm_8000|16000|22050|24000|44100|48000`, `ulaw_8000`; default `pcm_16000`), `language_code`, `secondary_languages[]`, `commit_strategy` (`manual` default \| `vad`), `vad_threshold` (0.1–0.9, 0.4), `vad_silence_threshold_secs` (0.3–3.0, 1.5), `min_speech_duration_ms` / `min_silence_duration_ms` (50–2000, 100), `include_timestamps`, `include_language_detection`, `keyterms` (repeat param), `no_verbatim`, `entity_detection`, `transcript_edit`, `filter_background_audio` (not with timestamps), `keepalive_interval_ms` (500–10000), `enable_logging`.

Client → server (only message type):

```json
{ "message_type": "input_audio_chunk", "audio_base_64": "<b64 pcm>", "commit": false, "sample_rate": 16000, "previous_text": "first chunk only" }
```

Manual commit: send `audio_base_64: ""` with `commit: true`.

Server → client: `session_started`, `partial_transcript` `{ text }` (each replaces the last), `committed_transcript` `{ text }` (stable), `committed_transcript_with_timestamps` (with timestamps or language detection), `committed_transcript_entities`, `edited_transcript` (async, may arrive out of order — match by `text`), `warning`. Errors then close: `error`, `auth_error`, `quota_exceeded`, `commit_throttled`, `unaccepted_terms`, `rate_limited`, `queue_overflow`, `resource_exhausted`, `session_time_limit_exceeded`, `input_error`, `invalid_request`, `chunk_size_exceeded`, `insufficient_audio_activity`, `transcriber_error`. There is no `final_transcript` event (legacy SDK enum names only).

Behavior:

- Mono only; 16 kHz recommended; send 0.1–1 s chunks (1 s of `pcm_16000` = 32,000 bytes).
- Use VAD for microphones. Manual: commit every 20–30 s in silence; the model auto-commits after ~36 s. Rapid commits degrade quality and trigger `commit_throttled`.
- Server closes after **15 s with no client message**. Keep sending audio (silence frames are fine).
- `previous_text` only on the first chunk (<50 chars best) — useful after reconnect.

## Realtime from Node (server SDK)

```ts
import { ElevenLabsClient, RealtimeEvents, AudioFormat, CommitStrategy } from "@elevenlabs/elevenlabs-js";

const conn = await elevenlabs.speechToText.realtime.connect({
  modelId: "scribe_v2_realtime",
  audioFormat: AudioFormat.PCM_16000,
  sampleRate: 16000,
  commitStrategy: CommitStrategy.VAD,
  includeTimestamps: true,
  keyterms: ["ElevenLabs"],
});
conn.on(RealtimeEvents.SESSION_STARTED, () => startMic());
conn.on(RealtimeEvents.PARTIAL_TRANSCRIPT, (m) => render(m.text));
conn.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (m) => save(m.text));
conn.on(RealtimeEvents.ERROR, console.error);
conn.send({ audioBase64: chunk.toString("base64"), sampleRate: 16000 });
conn.commit();   // manual strategy only
conn.close();
```

- URL mode `connect({ modelId, url: "https://…/live.mp3" })` transcodes with **ffmpeg** (must be on PATH).
- Node only (uses `ws` + child processes). No `keepaliveIntervalMs` option — use a raw socket if you need it.
- Python: `client.speech_to_text.realtime.connect(...)` with `from elevenlabs.realtime import AudioFormat, CommitStrategy, RealtimeEvents`.

## Realtime in the browser

Server route mints a token: `const { token } = await elevenlabs.tokens.singleUse.create("realtime_scribe")` (15 min, single use).

Vanilla (`@elevenlabs/client`):

```ts
import { Scribe, RealtimeEvents, CommitStrategy } from "@elevenlabs/client";
const conn = Scribe.connect({
  token, modelId: "scribe_v2_realtime", commitStrategy: CommitStrategy.VAD,
  microphone: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
});
conn.on(RealtimeEvents.COMMITTED_TRANSCRIPT, (d) => console.log(d.text));
// conn.close() also stops the mic
```

React (`@elevenlabs/react`, re-exports the client):

```tsx
import { useScribe, CommitStrategy } from "@elevenlabs/react";

const scribe = useScribe({
  modelId: "scribe_v2_realtime",
  commitStrategy: CommitStrategy.VAD,
  onCommittedTranscript: (d) => console.log(d.text),
});
// await scribe.connect({ token, microphone: { echoCancellation: true } })
// state: scribe.status, isConnected, isTranscribing, partialTranscript, committedTranscripts, error
// methods: connect, disconnect, sendAudio(base64, { commit? }), commit, clearTranscripts, getConnection
```

Error callbacks exist per error type (`onAuthError`, `onQuotaExceededError`, `onCommitThrottledError`, `onRateLimitedError`, `onInsufficientAudioActivityError`, …).

## Forced alignment

`POST /v1/forced-alignment` → `client.forcedAlignment.create({ file, text })`. Aligns a known transcript to audio. `text` plain string ≤675,000 chars, no speaker labels. Response `{ characters: [{ text, start, end }], words: [{ text, start, end, loss }], loss }` in seconds. File limit: API says <1 GB, overview says 3 GB / 10 h. Priced like STT. 29 languages. Use for subtitles from an existing script, karaoke, or dubbing timing.

## Limits, pricing, concurrency

- Duration ≤10 h per file (multichannel docs conflict: 10 h vs 1 h). Files >8 min split internally with up to 4 parallel workers.
- Inputs: aac, aiff, ogg, mp3, opus, wav, webm, flac, m4a/mp4 audio; video mp4, avi, mkv, mov, wmv, flv, webm, mpeg, 3gpp.
- API price (USD, 2026-10-03): Scribe v2 / Medical $0.22 per audio hour; realtime $0.39/h. Surcharges: keyterms +20%, entity detection +30%, redaction +30%, transcript edit +30%, speaker roles +10%.
- Concurrency (batch / realtime): Free 8/6, Starter 12/9, Creator 20/15, Pro 40/30, Scale-Business 60/45.
- Accuracy tiers: ≤5% WER for major European languages, Japanese, Vietnamese; weaker for low-resource languages.

## Gotchas

1. `diarize` defaults to **false** — set it for speaker labels.
2. `file` + `sourceUrl` together → error. `cloudStorageUrl` is deprecated (removed in SDK v3).
3. `diarize` + `useMultiChannel` → error; `transcriptEdit` + entities/multichannel → error; `detectSpeakerRoles` needs `diarize`.
4. `entityRedaction` suppresses `entities` in the response.
5. Realtime: mono only, 15 s idle close, `previous_text` first chunk only.
6. Stale guides import the old `elevenlabs` npm package (snake_case args). Use `@elevenlabs/elevenlabs-js`.
7. AI SDK: `transcribe({ model: elevenlabs.transcription("scribe_v2") })` — see [ecosystem-tooling.md](ecosystem-tooling.md#vercel-ai-sdk-provider).
