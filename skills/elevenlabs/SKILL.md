---
name: elevenlabs
description: "Build, integrate, debug, review, or plan anything on ElevenLabs: text to speech (Eleven v4, v4 Turbo, v3, Multilingual v2, Flash v2.5), Text to Dialogue, audio tags, TTS/TTD WebSockets, speech to text (Scribe v2, Realtime, Medical), voices (Voice Library, cloning, Voice Design, remix), Eleven Music (composition plans, inpainting, stems, finetunes), sound effects, voice changer, voice isolator, forced alignment, dubbing, Studio podcasts, Image & Video (Flows), Speech Engine, ElevenAgents voice/chat agents (tools, MCP, knowledge base, workflows, Twilio/SIP/WhatsApp, widget, tests), @elevenlabs/elevenlabs-js, @elevenlabs/client, @elevenlabs/react, the elevenlabs CLI, hosted MCP, @ai-sdk/elevenlabs, webhooks, pricing, and data residency. Use whenever a task mentions ElevenLabs, xi-api-key, voice IDs, AI voiceover, narration, audiobooks, voice agents, transcription, dubbing, or AI music/SFX, even if ElevenLabs is only implied by existing code."
---

# ElevenLabs

Use this skill for every ElevenLabs product and API. Snapshot **2026-10-03**: `@elevenlabs/elevenlabs-js` 2.70, `@elevenlabs/client` 1.26, `@elevenlabs/react` 1.16, CLI 1.4, newest TTS model `eleven_v4` (2026-09-28).

ElevenLabs ships weekly. Do not trust memory or old snippets: model IDs, defaults, client SDK APIs (breaking 1.0 in 2026-03), and voice IDs changed in 2026. Verify unclear details against live sources: any docs page as Markdown (append `.md`), `https://elevenlabs.io/docs/llms.txt`, the OpenAPI spec via [scripts/openapi_lookup.py](scripts/openapi_lookup.py), or the installed package types. Lookup paths: [ecosystem-tooling.md](references/ecosystem-tooling.md#reading-the-docs-as-an-agent).

## Workflow

1. Inspect the project before writing code:
   - Installed packages and versions (`@elevenlabs/elevenlabs-js`, `@elevenlabs/client`, `@elevenlabs/react`, `@elevenlabs/react-native`, `elevenlabs` PyPI, `@ai-sdk/elevenlabs`, LiveKit/Pipecat plugins). Flag the deprecated unscoped npm `elevenlabs`.
   - Runtime (Node, Bun, edge, browser, React Native) and where the API key lives. Browser code must never hold `xi-api-key`.
   - Existing model IDs, voice IDs, regions (`environment` / `baseUrl`), webhooks.
2. Identify the product with the routing table below and open only the matching references.
3. Confirm uncertain fields with `python3 scripts/openapi_lookup.py <path|sdkMethod|words> --full` (live spec, cached 24 h) or the `.md` docs page. The full operation list with JS SDK names is in [api-endpoints.md](references/api-endpoints.md).
4. Implement with the official SDK. Fall back to REST/WebSocket only when the SDK lacks the method, the runtime cannot run it, or the user asks.
5. Verify (see Verification). Report the model IDs, voices, and package versions assumed.

When the user only wants an asset (an MP3, a transcript, a song) and has a key available, generate it directly with a short script or the `elevenlabs` CLI instead of building an app. Confirm before actions that spend significant credits (long dubs, many music tracks, PVC training, Productions orders, batch calls) or that place phone calls or send messages.

## Routing

| Task | Reference |
| --- | --- |
| Which product/model, prices, defaults, deprecations | [models-pricing.md](references/models-pricing.md) |
| SDK setup, auth, keys, single-use tokens, errors, 429s, webhooks + signatures, residency, workspace admin, billing | [platform-admin.md](references/platform-admin.md) |
| Text to Speech HTTP, Text to Dialogue, audio tags, SSML, pronunciation dictionaries, stitching, timestamps | [text-to-speech.md](references/text-to-speech.md) |
| Streaming LLM text into speech, TTS/TTD WebSockets, multi-context, latency tuning | [realtime-websockets.md](references/realtime-websockets.md) |
| Transcription batch/realtime, diarization, keyterms, PII redaction, `useScribe`, forced alignment | [speech-to-text.md](references/speech-to-text.md) |
| Voice search, Voice Library, IVC, PVC, Voice Design, remix, settings, default-voice expiry | [voices.md](references/voices.md) |
| Music, composition plans, inpainting, stems, finetunes, SFX, voice changer, isolator, Audio Native, History | [music-sfx-audio-tools.md](references/music-sfx-audio-tools.md) |
| Dubbing (v2 projects, legacy), Studio projects, GenFM podcasts, Productions orders | [dubbing-studio-productions.md](references/dubbing-studio-productions.md) |
| Image & video generation, Flows templates, assets | [image-video-flows.md](references/image-video-flows.md) |
| Voice/chat agents: config, LLMs, prompts, tools, MCP, KB/RAG, workflows, telephony, tests, analytics, CLI agents-as-code | [agents-platform.md](references/agents-platform.md) |
| Agent front ends: web, React, React Native, widget, raw WebSocket protocol, native SDKs, signed URLs/tokens | [agents-clients.md](references/agents-clients.md) |
| Bring your own LLM with ElevenLabs voice (Speech Engine) | [speech-engine.md](references/speech-engine.md) |
| CLI, hosted MCP, docs MCP, AI SDK provider, LiveKit, Pipecat, integrations, recent changelog | [ecosystem-tooling.md](references/ecosystem-tooling.md) |
| Every REST operation with JS SDK method name | [api-endpoints.md](references/api-endpoints.md) |

## Core judgment

- **Package:** `@elevenlabs/elevenlabs-js` on servers; `@elevenlabs/client` / `@elevenlabs/react` / `@elevenlabs/react-native` in apps; never the unscoped `elevenlabs` npm package. Python: `elevenlabs`. Prefer `bun add` in this environment.
- **Always pass `modelId`.** Endpoint defaults are old models (TTS `eleven_multilingual_v2`, music `music_v1`, voice changer `eleven_english_sts_v2`).
- **Model choice:** quality content → `eleven_v4`; realtime → `eleven_v4_turbo` (TTD WebSocket) or `eleven_flash_v2_5` (TTS WebSocket, lowest latency); STT → `scribe_v2` / `scribe_v2_realtime`; music → `music_v2_5`. `scribe_v1` and v1 TTS models are removed.
- **Eleven v4 routing:** docs show both `textToSpeech.convert` and Text to Dialogue for v4. v3/v4 never work on the TTS `stream-input` WebSocket; use the Text to Dialogue WebSocket.
- **v4/v3 prompting:** audio tags in `[brackets]`, no SSML; v4 inline IPA `"/…/"`; only stability + similarity apply. SSML `<break>` is for v2/Flash.
- **Keys stay server-side.** Browsers get single-use tokens (`realtime_scribe`, `batch_scribe`, `tts_websocket`), agent conversation tokens (WebRTC) or signed URLs (WebSocket), or a backend proxy.
- **Voices:** resolve with `voices.search` (v2). Default/premade voices expire 2026-12-31; never hard-code them in production. Clone only with consent; PVC is own-voice only.
- **Streaming:** HTTP streaming is enough when the text is known. Use WebSockets only for incremental text. For full voice agents use ElevenAgents or Speech Engine instead of wiring STT+LLM+TTS sockets by hand.
- **Agents SDK 1.x:** React needs `ConversationProvider`; `startSession` in React returns void (errors via `onError`); token ⇒ WebRTC, signed URL ⇒ WebSocket; overrides must be enabled in the agent's Security settings; optional client events must be enabled in `client_events`.
- **Async jobs:** dubbing, Flows, STT webhooks, Studio, Productions are asynchronous. Prefer workspace webhooks (verify `ElevenLabs-Signature` on the raw body, handle duplicates) over tight polling. Download signed output URLs promptly (~1 h expiry). Music and SFX are not stored in History — persist them.
- **Concurrency:** plan-based per model family; read `maximum-concurrent-requests` and throttle client-side. SDK retries 408/429/5xx twice by default.
- **Regions:** residency workspaces need their own key and `ElevenLabsEnvironment.ProductionEu|ProductionIndia|ProductionSingapore` (and matching `origin`/`livekitUrl` for agents).
- **Doc conflicts exist** (limits, sample code). When docs disagree, trust the OpenAPI spec and SDK source, then state the uncertainty.

## Quick recipes

```ts
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
const elevenlabs = new ElevenLabsClient(); // ELEVENLABS_API_KEY

// Speech file
const audio = await elevenlabs.textToSpeech.convert(voiceId, { text, modelId: "eleven_v4", outputFormat: "mp3_44100_128" });

// Multi-speaker dialogue
const dialogue = await elevenlabs.textToDialogue.convert({ modelId: "eleven_v4", inputs: [{ text: "[excited] We did it!", voiceId: a }, { text: "[laughs] Finally.", voiceId: b }] });

// Transcript with speakers
const t = await elevenlabs.speechToText.convert({ file, modelId: "scribe_v2", diarize: true });

// Sound effect / music
const sfx = await elevenlabs.textToSoundEffects.convert({ text: "Thunder rolling over a valley", durationSeconds: 6 });
const song = await elevenlabs.music.compose({ prompt: "Uplifting indie pop, 120 BPM, female vocals", musicLengthMs: 45_000, modelId: "music_v2_5" });

// Agent session credential for a browser (WebRTC)
const { token } = await elevenlabs.conversationalAi.conversations.getWebrtcToken({ agentId });
```

## Verification

- Typecheck against the installed SDK; grep `node_modules/@elevenlabs/elevenlabs-js` types when a method or field is unclear.
- Run one real call with a short input when a key is available (cheap: Flash TTS, 5 s SFX, short STT). Check the response headers `request-id`, `character-cost`, `x-region`.
- Audio: confirm format/sample rate matches the player (PCM vs MP3, `ulaw_8000` for telephony) and the file plays.
- Agents: start a session, confirm `onConnect`, a user turn, an agent reply, a client tool round-trip, and `endSession`; check the conversation in the dashboard or `conversationalAi.conversations.get`.
- Webhooks: verify a signed sample payload against the raw body; confirm idempotency.
- Security: grep the client bundle and repo for `xi-api-key` / `ELEVENLABS_API_KEY` leaks.

Report which checks ran, which were skipped (no key, no device), and every model/voice ID used.
