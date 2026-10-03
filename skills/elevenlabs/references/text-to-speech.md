# Text to Speech and Text to Dialogue (HTTP)

Snapshot 2026-10-03. For WebSocket input streaming see [realtime-websockets.md](realtime-websockets.md). For the model table see [models-pricing.md](models-pricing.md).

## Contents

- [Pick the endpoint](#pick-the-endpoint)
- [TTS endpoints](#tts-endpoints)
- [Request fields](#request-fields)
- [Output formats](#output-formats)
- [Timestamps](#timestamps)
- [Long text and request stitching](#long-text-and-request-stitching)
- [Text to Dialogue (multi-speaker)](#text-to-dialogue-multi-speaker)
- [Prompting by model](#prompting-by-model)
- [Pronunciation](#pronunciation)
- [Text normalization](#text-normalization)
- [Saving, serving, caching](#saving-serving-caching)
- [Gotchas](#gotchas)

## Pick the endpoint

| Need | Use |
| --- | --- |
| Full text known, file/bytes out | `textToSpeech.convert` |
| Full text known, play while generating | `textToSpeech.stream` (chunked HTTP; no WebSocket needed) |
| Captions / karaoke / lip-sync timing | `convertWithTimestamps` / `streamWithTimestamps` |
| Several speakers in one clip, or Eleven v4 / v3 dialogue | `textToDialogue.*` |
| Text arrives token by token (LLM output) | TTS WebSocket or TTD WebSocket — [realtime-websockets.md](realtime-websockets.md) |
| Async job with webhook + asset storage | Flows TTS (`client.flows.textToSpeech.create`) — [image-video-flows.md](image-video-flows.md) |

**Eleven v4 routing (docs conflict).** The quickstart and streaming guides call `textToSpeech.convert/stream` with `modelId: "eleven_v4"`. The models page and the 2026-09-28 launch changelog say v4 is served through the Text to Dialogue API and v4 Turbo through the Text to Dialogue WebSocket. Neither v4 nor v3 works on the TTS `stream-input` WebSocket. Rule: single voice + full text → try `textToSpeech.convert` with `eleven_v4`; if it returns 422/unsupported, call `textToDialogue.convert` with one input. Realtime v4 → TTD WebSocket with `eleven_v4_turbo`.

## TTS endpoints

| REST | JS SDK | Returns |
| --- | --- | --- |
| `POST /v1/text-to-speech/{voice_id}` | `client.textToSpeech.convert(voiceId, req)` | `ReadableStream<Uint8Array>` audio |
| `POST /v1/text-to-speech/{voice_id}/stream` | `client.textToSpeech.stream(voiceId, req)` | `ReadableStream<Uint8Array>` (chunks as generated) |
| `POST /v1/text-to-speech/{voice_id}/with-timestamps` | `client.textToSpeech.convertWithTimestamps(voiceId, req)` | `{ audioBase64, alignment, normalizedAlignment }` |
| `POST /v1/text-to-speech/{voice_id}/stream/with-timestamps` | `client.textToSpeech.streamWithTimestamps(voiceId, req)` | async iterable of the same JSON chunks |

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import { Readable } from "node:stream";
import { createWriteStream } from "node:fs";

const elevenlabs = new ElevenLabsClient(); // reads ELEVENLABS_API_KEY

const audio = await elevenlabs.textToSpeech.convert("JBFqnCBsd6RMkjVDRZzb", {
  text: "The first move is what sets everything in motion.",
  modelId: "eleven_v4",            // always set; default is still eleven_multilingual_v2
  outputFormat: "mp3_44100_128",
  voiceSettings: { stability: 0.5, similarityBoost: 0.75 },
});
Readable.fromWeb(audio as any).pipe(createWriteStream("out.mp3"));
// Buffer instead: Buffer.from(await new Response(audio).arrayBuffer())
```

Python: `client.text_to_speech.convert(voice_id=..., text=..., model_id="eleven_v4", output_format="mp3_44100_128")` returns `Iterator[bytes]`; `from elevenlabs import save, play`.

## Request fields

Query: `output_format` (default `mp3_44100_128`), `enable_logging` (default true; `false` = zero-retention, Enterprise only, disables history and stitching), `optimize_streaming_latency` 0–4 (**deprecated**, ignore).

Body (JSON; SDK uses camelCase):

| Field | Default | Notes |
| --- | --- | --- |
| `text`* | — | Per-request char limit depends on model (v4 10k, v3 5k, multilingual v2 10k, flash v2.5 40k). |
| `model_id` | `eleven_multilingual_v2` | Always pass explicitly. |
| `language_code` | — | ISO 639-1. Enforces language + normalization. Ignored when unsupported; not supported by multilingual v2. |
| `voice_settings` | stored voice settings | `stability` 0–1 (0.5), `similarity_boost` 0–1 (0.75), `style` (0; >0 adds latency), `use_speaker_boost` (true), `speed` (1.0; useful range 0.7–1.2). **v4 honors only stability + similarity** (no style, no speed). |
| `pronunciation_dictionary_locators` | — | ≤3 `{ pronunciation_dictionary_id, version_id? }`, applied in order. |
| `seed` | — | 0–4294967295, best-effort determinism. |
| `previous_text` / `next_text` | — | Context for continuity when splitting text. |
| `previous_request_ids` / `next_request_ids` | — | ≤3 each; override the text variants. See stitching. |
| `use_pvc_as_ivc` | false | Use the instant-clone variant of a professional clone (more expressive, lower latency). |
| `apply_text_normalization` | `auto` | `auto` \| `on` \| `off`. Flash v2.5 `on` is Enterprise-only. |
| `apply_language_text_normalization` | false | Japanese only; heavy latency. |

Inspect any field live: `python3 scripts/openapi_lookup.py textToSpeech.convert --full`.

Response headers worth reading (via `.withRawResponse()`): `request-id` (stitching), `character-cost`, `x-region`, `current-concurrent-requests`, `maximum-concurrent-requests`.

## Output formats

Enum: `mp3_22050_32`, `mp3_24000_48`, `mp3_44100_32|64|96|128|192`, `opus_48000_32|64|96|128|192`, `pcm_8000|16000|22050|24000|32000|44100|48000`, `wav_8000…48000`, `ulaw_8000`, `alaw_8000`.

- `mp3_44100_192` needs Creator+. `pcm_44100` / `wav_44100` need Pro+.
- PCM is signed 16-bit little-endian mono. Use it for Web Audio / WebRTC / custom players.
- `ulaw_8000` for Twilio Media Streams (send base64 as a Twilio `media` event).
- Lower sample rates reduce bandwidth and slightly reduce latency.

## Timestamps

`alignment` and `normalized_alignment` (HTTP) = `{ characters: string[], character_start_times_seconds: number[], character_end_times_seconds: number[] }`. SDK exposes camelCase (`characterStartTimesSeconds`). `normalized_alignment` maps to the normalized text actually spoken (numbers expanded). Group characters into words yourself for word-level captions. WebSocket alignment uses different units and casing — see [realtime-websockets.md](realtime-websockets.md#alignment-casing-and-units).

```ts
const res = await elevenlabs.textToSpeech.convertWithTimestamps(voiceId, { text, modelId: "eleven_multilingual_v2" });
const mp3 = Buffer.from(res.audioBase64, "base64");
const { characters, characterStartTimesSeconds } = res.alignment!;
```

## Long text and request stitching

Split long text at paragraph boundaries. Pass the previous request IDs so prosody carries across chunks.

```ts
const requestIds: string[] = [];
for (const paragraph of paragraphs) {
  const { data, rawResponse } = await elevenlabs.textToSpeech
    .convert(voiceId, { text: paragraph, modelId: "eleven_multilingual_v2", previousRequestIds: requestIds.slice(-3) })
    .withRawResponse();
  const chunks: Buffer[] = [];
  for await (const c of data) chunks.push(Buffer.from(c)); // read fully before the ID is usable
  requestIds.push(rawResponse.headers.get("request-id")!);
}
```

Rules: same model across chunks; IDs ≤2 h old; stream bodies must be fully consumed before the ID works; **not available for `eleven_v3`**; not available with zero retention. When IDs are unavailable use `previousText` / `nextText`.

## Text to Dialogue (multi-speaker)

| REST | JS SDK |
| --- | --- |
| `POST /v1/text-to-dialogue` | `client.textToDialogue.convert(req)` |
| `POST /v1/text-to-dialogue/stream` | `client.textToDialogue.stream(req)` |
| `POST /v1/text-to-dialogue/with-timestamps` | `client.textToDialogue.convertWithTimestamps(req)` |
| `POST /v1/text-to-dialogue/stream/with-timestamps` | `client.textToDialogue.streamWithTimestamps(req)` |

Body: `inputs`* `[{ text, voice_id }]` (≤10 unique voices; **keep total text ≤2,000 chars** — longer may 422 or end early when streaming), `model_id` (default `eleven_v3`; use `eleven_v4`), `language_code`, `settings` `{ stability, similarity }`, `previous_text` / `future_text` (≤100 chars each), `previous_request_ids` / `next_request_ids` (≤3), `pronunciation_dictionary_locators` (≤3), `seed`, `apply_text_normalization`, `use_pvc_as_ivc`. Models: Eleven v4 and v3 only. With-timestamps adds `voice_segments[]` `{ voice_id, start_time_seconds, end_time_seconds, character_start_index, character_end_index, dialogue_input_index }`.

```ts
const audio = await elevenlabs.textToDialogue.convert({
  modelId: "eleven_v4",
  inputs: [
    { text: "[cheerfully] Hello, how are you?", voiceId: "9BWtsMINqrJLrRacOk9x" },
    { text: "[stuttering] I'm... I'm doing well, thank you.", voiceId: "IKne3meq5aSn9XLyUdCD" },
  ],
});
```

For long scripts, batch turns into ≤2,000-char requests and chain with `previousRequestIds`.

## Prompting by model

**Eleven v4 / v3 (audio tags).** Free-form natural-language tags in square brackets, not an enum:

- Voice/emotion: `[laughs]`, `[laughs harder]`, `[whispers]`, `[sighs]`, `[exhales]`, `[sarcastic]`, `[curious]`, `[excited]`, `[crying]`, `[mischievously]`.
- Sound: `[applause]`, `[gunshot]`, `[explosion]`, `[swallows]`, `[gulps]`.
- Accent / singing: `[strong French accent]`, `[sings]`.
- Direction: `[Quiet, measured narration]`, `[Building tension, measured pace]`.
- Ellipses add pauses and weight; CAPS add emphasis. Match tags to the voice's character — a calm narrator voice will not shout convincingly.
- v4 can read a tag as a sound-effect request; write voice-quality tags explicitly (`[low, gravelly voice]`).
- v4/v3 do **not** support SSML. No `<break>`; use `[pause]`, ellipses, punctuation, line breaks.
- v4 accent behavior: same language as the clone → accent kept; different language → native-sounding target language. Force an accent with a tag.
- v4 is still under continuous training. Re-test prompts periodically.
- v3 has lower stability range sensitivity: lower stability = more expressive and less consistent.

**Multilingual v2 / Flash (SSML + narrative).**

- Pauses: `<break time="1.5s" />` up to 3 s. Too many breaks cause speed-ups and artifacts.
- Emotion via narrative cues ("she said excitedly"); cues are spoken, trim them in post if needed.
- Pace via `voiceSettings.speed` (0.7–1.2).

Determinism: generations vary. Use `seed` and identical settings for repeatability.

## Pronunciation

| Model | Inline phonemes | Dictionary phoneme rules | Dictionary alias rules |
| --- | --- | --- | --- |
| `eleven_v4` | IPA in slashes: `"/ˌsænfrənˈsɪskoʊ/"` (quote it, include stress marks) | yes | yes |
| `eleven_v3` | no | yes | yes |
| `eleven_flash_v2` | SSML `<phoneme alphabet="cmu-arpabet" ph="M AE1 D IH0 S AH0 N">Madison</phoneme>` or `alphabet="ipa"` | yes | yes |
| others | no | no (ignored) | yes |

Pronunciation dictionaries (PLS XML or rules). PLS matching is case-sensitive; rules take `caseSensitive` / `wordBoundaries`. First match wins, ≤3 dictionaries per request.

```xml
<lexicon version="1.0" xmlns="http://www.w3.org/2005/01/pronunciation-lexicon" alphabet="ipa" xml:lang="en-US">
  <lexeme><grapheme>tomato</grapheme><phoneme>/tə'meɪtoʊ/</phoneme></lexeme>
  <lexeme><grapheme>UN</grapheme><alias>United Nations</alias></lexeme>
</lexicon>
```

```ts
const dict = await elevenlabs.pronunciationDictionaries.createFromFile({ file: createReadStream("lexicon.pls"), name: "brand" });
// or createFromRules({ name: "brand", rules: [
//   { type: "alias", stringToReplace: "UN", alias: "United Nations", caseSensitive: true, wordBoundaries: true },
//   { type: "phoneme", stringToReplace: "tomato", phoneme: "/tə'meɪtoʊ/", alphabet: "ipa" }] })
await elevenlabs.textToSpeech.convert(voiceId, {
  text, modelId: "eleven_v4",
  pronunciationDictionaryLocators: [{ pronunciationDictionaryId: dict.id, versionId: dict.versionId }],
});
```

Other methods: `pronunciationDictionaries.list/get/update/download`, `pronunciationDictionaries.rules.add/remove/set`. Each rule change creates a new `version_id`. On the TTS WebSocket, dictionaries go in the first message only and phoneme rules need `enable_ssml_parsing=true`.

## Text normalization

- Multilingual v2 normalizes numbers, dates, currency well.
- Flash v2.5 does **not** normalize by default ("$1,000,000" may be read badly). Normalize upstream: instruct the LLM to write numbers, currencies, phone digits, ordinals, abbreviations and URLs as spoken words ("eleven labs dot io"), or preprocess with a number-to-words library.
- Agents platform has its own `text_normalisation_type` setting.

## Saving, serving, caching

- Node file: `Readable.fromWeb(audio).pipe(createWriteStream(path))`.
- HTTP route: return `new Response(audio, { headers: { "Content-Type": "audio/mpeg" } })` (the SDK stream is a web stream).
- Cache by hash of `{ text, voiceId, modelId, settings }` in object storage; on miss, `stream()` + `tee()` one branch to the client and one to storage.
- `play()` (needs `ffplay`) and `stream()` (needs `mpv`) helpers are Node-only and for local testing.
- Music and sound-effect output is **not** in History; TTS output is (unless `enable_logging=false`) — `client.history.list/get/getAudio/download`.

## Gotchas

1. Default model is `eleven_multilingual_v2` — set `modelId` every time.
2. `voiceSettings` overrides stored settings only for that request. Read stored defaults with `client.voices.settings.get(voiceId)`.
3. v4: stability + similarity only; no SSML; IPA inline in slashes.
4. TTD total input >2,000 chars → 422 or truncated stream.
5. `optimize_streaming_latency` is deprecated. Use Flash/Turbo models, PCM output, and streaming instead.
6. Stale doc samples import the old unscoped `elevenlabs` npm package with snake_case args. Use `@elevenlabs/elevenlabs-js` and camelCase.
