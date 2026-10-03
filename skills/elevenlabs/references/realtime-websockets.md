# Realtime TTS: WebSockets and latency

Snapshot 2026-10-03. Realtime speech-to-text lives in [speech-to-text.md](speech-to-text.md). Agent conversation sockets live in [agents-clients.md](agents-clients.md).

## Contents

- [Do you need a WebSocket?](#do-you-need-a-websocket)
- [Which socket](#which-socket)
- [TTS WebSocket (stream-input)](#tts-websocket-stream-input)
- [Multi-context TTS WebSocket](#multi-context-tts-websocket)
- [Text to Dialogue WebSocket (v4 / v3)](#text-to-dialogue-websocket-v4--v3)
- [Multi-context TTD WebSocket](#multi-context-ttd-websocket)
- [Browser auth with single-use tokens](#browser-auth-with-single-use-tokens)
- [Alignment casing and units](#alignment-casing-and-units)
- [Concurrency](#concurrency)
- [Latency checklist](#latency-checklist)

## Do you need a WebSocket?

HTTP streaming (`textToSpeech.stream`) already streams audio out. Use a WebSocket only when **text arrives incrementally** (LLM tokens) or you need several interleaved utterances on one connection. If the goal is a full voice agent (STT + LLM + TTS + turn-taking), use ElevenAgents or Speech Engine instead of building on raw sockets.

## Which socket

| | TTS WS | TTD WS |
| --- | --- | --- |
| URL | `/v1/text-to-speech/{voice_id}/stream-input` (+ `/multi-stream-input`) | `/v1/text-to-dialogue/stream-input` (+ `/multi-stream-input`) |
| Models | Flash, Turbo, Multilingual v2 — **not v3 / v4** | `eleven_v4`, `eleven_v4_turbo`, `eleven_v3`, `eleven_v3_conversational` |
| Voice | In URL | `voices: [...]` in first message; `voice_id` per input |
| Buffering | `chunk_length_schedule` or `auto_mode` | Fixed (~40 chars and 8 words) |
| Idle timeout | `inactivity_timeout` 20 s default, ≤180 s | Fixed 20 s; reset with `keep_alive` |
| SSML / phonemes | `enable_ssml_parsing=true` | No SSML (v4 inline IPA) |
| Concurrency | Counts only while generating | Whole connection = 1 dialogue session (separate pool) |
| JSON casing out | camelCase (`isFinal`, `charStartTimesMs`) | snake_case (`is_final`, `char_start_times_ms`) |

Host for all: `wss://api.elevenlabs.io` (or the data-residency host, `wss://api.eu.residency.elevenlabs.io` etc.).

## TTS WebSocket (stream-input)

`wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/stream-input`

Query: `model_id` (default `eleven_multilingual_v2`), `output_format`, `language_code`, `enable_logging`, `inactivity_timeout` (20, max 180), `sync_alignment` (false), `auto_mode` (false; set true unless you tune chunking), `apply_text_normalization`, `seed`, `enable_ssml_parsing` (false), `authorization`, `single_use_token`. Server-side auth: header `xi-api-key`.

Client messages:

1. Init — text must be a single space: `{ "text": " ", "voice_settings": {...}, "generation_config": { "chunk_length_schedule": [120,160,250,290] }, "pronunciation_dictionary_locators": [...] }`. Voice settings, generation config and dictionaries are accepted only here.
2. Text — end each chunk with a space: `{ "text": "Hello world. ", "try_trigger_generation": false, "flush": false }`. Send `flush: true` at the end of each turn to force out buffered text.
3. Keep-alive — `{ "text": " " }` before the idle timeout.
4. Close — `{ "text": "" }` (empty string closes and flushes).

Server messages: `{ audio: base64, alignment?, normalizedAlignment? }` …then `{ isFinal: true }`.

`chunk_length_schedule`: chars buffered before the 1st/2nd/3rd/4th+ generation, each 50–500. Smaller first values = faster first audio, worse prosody.

```ts
import WebSocket from "ws";

const url = new URL(`wss://api.elevenlabs.io/v1/text-to-speech/${voiceId}/stream-input`);
url.search = new URLSearchParams({ model_id: "eleven_flash_v2_5", output_format: "pcm_24000", auto_mode: "true" }).toString();
const ws = new WebSocket(url, { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } });

ws.on("open", async () => {
  ws.send(JSON.stringify({ text: " ", voice_settings: { stability: 0.5, similarity_boost: 0.8 } }));
  for await (const token of llmTokens) ws.send(JSON.stringify({ text: token }));
  ws.send(JSON.stringify({ text: " ", flush: true }));
  ws.send(JSON.stringify({ text: "" }));
});
ws.on("message", (raw) => {
  const msg = JSON.parse(raw.toString());
  if (msg.audio) player.write(Buffer.from(msg.audio, "base64"));
  if (msg.isFinal) player.end();
});
```

Python SDK wraps this as `client.text_to_speech.convert_realtime(voice_id=..., text=<iterator>, model_id=...)`. The JS SDK v2 has no TTS WebSocket wrapper (v3 alpha adds generated ones) — use `ws` directly.

## Multi-context TTS WebSocket

`wss://api.elevenlabs.io/v1/text-to-speech/{voice_id}/multi-stream-input` — several independent utterances (contexts) on one connection. Use for one end-user session where the agent may be interrupted; not for unrelated parallel users.

- ≤5 concurrent contexts per connection.
- Init context: `{ "text": " ", "context_id": "c1", "voice_settings"?, "generation_config"? }`
- Send: `{ "text": "...", "context_id": "c1" }`; flush: `{ "context_id": "c1", "flush": true }`
- Keep a context alive: `{ "context_id": "c1", "text": "" }` (here empty text does **not** close).
- Barge-in: `{ "context_id": "c1", "close_context": true }` then start `c2`.
- Close all: `{ "close_socket": true }`.
- Server: `{ audio, contextId, alignment? }`, `{ isFinal: true, contextId }`; `is_final_audio_for_turn` marks the last chunk of a flushed turn. Read `isFinal` (camelCase) — one docs sample reads `is_final`, which is wrong for this socket.
- Context timeout 20 s; reusing a closed `context_id` creates a new unrelated context.

## Text to Dialogue WebSocket (v4 / v3)

`wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input`

Query: `model_id` (must start with `eleven_v4` / `eleven_v3`; reference default `eleven_v3_conversational`; use `eleven_v4_turbo` for realtime), `output_format`, `language_code`, `sync_alignment`, `apply_text_normalization`, `seed`, `enable_logging`. Auth: `xi-api-key` header, `single_use_token` query, or `xi_api_key` / `single_use_token` in the first message. API key needs the Text to Speech permission.

- First message **must** register voices: `{ "voices": ["<voiceId>"], "voice_settings"?: { "stability": 0.5 }, "pronunciation_dictionary_locators"?: [...] }`. `eleven_v4_turbo` and `eleven_v3_conversational`: exactly **1** voice. `eleven_v4` and `eleven_v3`: up to **10**.
- Text: `{ "inputs": [{ "text": "...", "voice_id": "<voiceId>", "new_turn": false }] }`. Switching `voice_id` or `new_turn: true` closes the current prosody segment.
- Control: `{ "flush": true }`, `{ "keep_alive": true }` (fixed 20 s timeout), `{ "close_socket": true }` (flush → final → close).
- Server (snake_case): `{ audio, alignment?: { chars, char_start_times_ms, char_durations_ms } }`, `{ is_final_audio_for_turn: true }`, `{ is_final: true }`, errors `{ message, error, code, param? }` where `code` is the WebSocket close code that follows.

```ts
const ws = new WebSocket(
  "wss://api.elevenlabs.io/v1/text-to-dialogue/stream-input?model_id=eleven_v4_turbo&output_format=pcm_24000",
  { headers: { "xi-api-key": process.env.ELEVENLABS_API_KEY! } },
);
ws.on("open", () => {
  ws.send(JSON.stringify({ voices: [voiceId] }));
  ws.send(JSON.stringify({ inputs: [{ text: "[warmly] Thanks for calling. How can I help today? ", voice_id: voiceId }] }));
  ws.send(JSON.stringify({ flush: true }));
});
ws.on("message", (raw) => {
  const m = JSON.parse(raw.toString());
  if (m.error) return console.error(m);
  if (m.audio) player.write(Buffer.from(m.audio, "base64"));
});
```

Doc note: the API reference still says "v3 only"; the guides and launch notes use v4. Trust the model prefix rule above.

## Multi-context TTD WebSocket

`/v1/text-to-dialogue/multi-stream-input`. Every message carries `context_id` (except a lone `close_socket`); the first message per context includes `voices`. ≤5 contexts. Messages: `inputs`, `flush`, `close_context`, `keep_alive`, `close_socket`. Protocol errors (missing `context_id`, unregistered voice, >5 contexts, writing to a closing context) close the **whole** connection.

## Browser auth with single-use tokens

Never put the API key in the browser. Mint a token server-side:

```ts
const { token } = await elevenlabs.tokens.singleUse.create("tts_websocket"); // 15 min, one use
// client: wss://api.elevenlabs.io/v1/text-to-speech/{voiceId}/stream-input?model_id=...&single_use_token=${token}
```

Token types: `tts_websocket`, `realtime_scribe`, `batch_scribe`. Agents use signed URLs / conversation tokens instead ([agents-clients.md](agents-clients.md)).

## Alignment casing and units

| Source | Shape |
| --- | --- |
| HTTP with-timestamps | seconds, snake_case: `character_start_times_seconds`, `character_end_times_seconds` |
| TTS WebSocket | milliseconds, camelCase: `chars`, `charStartTimesMs`, `charDurationsMs`; per chunk (relative) |
| TTD WebSocket | milliseconds, snake_case: `chars`, `char_start_times_ms`, `char_durations_ms` |

## Concurrency

Plan limits (Free / Starter / Creator / Pro / Scale-Business): Multilingual v2 2/3/5/10/15, Flash 4/6/10/20/30, TTD WebSocket sessions 14/21/35/70/105; Enterprise elevated. Over the limit HTTP requests queue (~50 ms extra) and then fail with `too_many_concurrent_requests`. Rule of thumb: concurrency 5 ≈ 100 simultaneous listeners for broadcast TTS. Headers `current-concurrent-requests` / `maximum-concurrent-requests` show usage.

## Latency checklist

1. Model: `eleven_flash_v2_5` (~75 ms inference) or `eleven_v4_turbo` (~100 ms, more expressive). Avoid v4 / multilingual v2 for realtime.
2. Stream: HTTP streaming or WebSocket; start playback on the first chunk.
3. Format: `pcm_16000` / `pcm_24000` (no decode) or low-bitrate MP3; `ulaw_8000` for telephony.
4. Voice: premade / synthetic / instant clone are faster than professional clones; `use_pvc_as_ivc` helps.
5. Region: global routing picks the nearest of US / Netherlands / Singapore (`x-region` header). Keep servers near users. TTFB for Flash over WS ≈ 100–150 ms in NA/EU/SEA.
6. Reuse connections (HTTP keep-alive, one WebSocket per session). Pre-open the socket before the LLM starts.
7. TTS WS: `auto_mode=true`, flush at end of turn, small first `chunk_length_schedule` value if tuning manually.
8. Normalize numbers upstream for Flash so the model does not need to.
