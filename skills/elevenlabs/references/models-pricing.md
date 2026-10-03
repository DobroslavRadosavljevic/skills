# Products, models, choosing, prices

Snapshot 2026-10-03. Model IDs and prices change often: confirm with `client.models.list()`, `https://elevenlabs.io/docs/overview/models.md` and `https://elevenlabs.io/pricing/api`.

## Contents

- [Product map](#product-map)
- [Text to speech models](#text-to-speech-models)
- [Other models](#other-models)
- [Choosing a model](#choosing-a-model)
- [Endpoint defaults that bite](#endpoint-defaults-that-bite)
- [Deprecated and removed](#deprecated-and-removed)
- [API prices (USD)](#api-prices-usd)
- [Credits (web app)](#credits-web-app)

## Product map

| Product family | What it is | API surface |
| --- | --- | --- |
| **ElevenAPI** | All generation capabilities as REST/WebSocket + SDKs | TTS, TTD, STT, voices, music, SFX, voice changer, isolator, forced alignment, dubbing, image & video |
| **ElevenAgents** (formerly Conversational AI) | Hosted voice/chat agents: LLM, tools, KB, workflows, telephony, tests, analytics | `/v1/convai/*`, client SDKs, widget, CLI |
| **Speech Engine** | ElevenLabs STT + turn-taking + TTS around **your** LLM server | `/v1/speech-engine`, SDK `speechEngine.attach` |
| **ElevenCreative** | No-code web app: Playground, Studio, Audiobooks, Flows, Templates, Dubbing, Music, Image & Video, Avatars, Ads Engine, Voice Library | Studio, Dubbing, Music, Flows APIs (Avatars, Ads Engine: no API) |
| **Reception AI** | Ready-made AI phone receptionist for small businesses | App only (webhooks/Zapier/MCP integrations) |
| **Productions** | Human-edited transcripts, subtitles, dubs | `/v1/productions/*` |
| **ElevenReader / ElevenMusic** | Consumer apps (read-aloud, music) | None |
| **Private deployment** | Agents runtime, TTS, Scribe in your VPC / SageMaker / Vertex AI (Enterprise) | NDA docs |

## Text to speech models

| `model_id` | Use | Langs | Chars/request | Latency | Notes |
| --- | --- | --- | --- | --- | --- |
| `eleven_v4` | Highest quality content, audiobooks, characters, dialogue | 90+ | 10,000 | — | Audio tags, inline IPA, best cloning; stability + similarity only; no SSML. Released 2026-09-28. |
| `eleven_v4_turbo` | Realtime agents/interactive | 90+ | — | ~100 ms | Via TTD WebSocket (1 voice/connection). Speech Engine default. |
| `eleven_v3` | Previous expressive model | 70+ | 5,000 | — | Audio tags; no request stitching; TTD default. |
| `eleven_v3_conversational` | Previous realtime expressive | 70+ | — | ~280 ms | TTD WebSocket default. |
| `eleven_multilingual_v2` | Stable long-form, best number normalization | 29 | 10,000 | — | **Default model_id** on `/v1/text-to-speech`; SSML breaks; no `language_code`. |
| `eleven_flash_v2_5` | Lowest latency, multilingual | 32 | 40,000 | ~75 ms | Half price; weak number normalization. Agents/telephony workhorse. |
| `eleven_flash_v2` | Lowest latency, English | en | 30,000 | ~75 ms | Only model with SSML `<phoneme>`. |

## Other models

| Area | `model_id` |
| --- | --- |
| Speech to text | `scribe_v2`, `scribe_v2_medical` (batch), `scribe_v2_realtime` (~150 ms, WebSocket) |
| Voice changer | `eleven_multilingual_sts_v2` (recommended), `eleven_english_sts_v2` (endpoint default) |
| Voice design | `eleven_ttv_v3` (reference audio support), `eleven_multilingual_ttv_v2` (default) |
| Sound effects | `eleven_text_to_sound_v2` |
| Music | `music_v2_5` (best), `music_v2`, `music_v1` (endpoint default) |
| Dubbing | `dubbing_v2` (project API default), `dubbing_v1` |
| Image / video | Third-party: Gemini image (Nano Banana family), GPT Image, Seedream, Veo 3.1, Seedance, Creatify Aurora — see [image-video-flows.md](image-video-flows.md) |
| Agent LLMs | Many hosted LLMs (GPT, Claude, Gemini, GLM, Qwen, DeepSeek…) or custom — see [agents-platform.md](agents-platform.md) |

## Choosing a model

- Narration, audiobooks, ads, characters, podcasts → `eleven_v4` (Text to Dialogue for multiple speakers).
- Voice agents, IVR, games, live UX → `eleven_v4_turbo` (expressive, TTD WebSocket) or `eleven_flash_v2_5` (lowest latency/cost, mature on TTS WebSocket and agents).
- Long documents with numbers/dates where stability matters → `eleven_multilingual_v2` (or v4 with upstream normalization).
- English-only phoneme control via SSML → `eleven_flash_v2`.
- Transcription → `scribe_v2`; clinical → `scribe_v2_medical`; live captions/agents → `scribe_v2_realtime`.
- Speech-to-speech → `eleven_multilingual_sts_v2` even for English.
- Music → `music_v2_5` and v2 composition plans.

## Endpoint defaults that bite

Always pass `modelId`. Defaults when omitted: TTS `eleven_multilingual_v2`, TTD `eleven_v3`, TTD WebSocket `eleven_v3_conversational`, speech-to-speech `eleven_english_sts_v2`, music `music_v1`, music finetune create `music_v1`, voice design `eleven_multilingual_ttv_v2`.

## Deprecated and removed

- Removed 2026-07-09: `eleven_monolingual_v1`, `eleven_multilingual_v1`, `scribe_v1`.
- Deprecated: `eleven_turbo_v2_5` → `eleven_flash_v2_5`; `eleven_turbo_v2` → `eleven_flash_v2`; `music_v1` (still accepted).
- Third-party type unions (AI SDK provider, LiveKit plugin) may still list removed IDs and miss new ones.

## API prices (USD)

API usage is billed in US dollars, not credits (fetched 2026-10-03; promos end 2026-10-12).

| Product | Price |
| --- | --- |
| TTS `eleven_v4`, `eleven_v3`, `eleven_multilingual_v2` | $0.08 / 1K chars (v4 promo $0.022) |
| TTS `eleven_v4_turbo`, `eleven_v3_conversational`, Flash/Turbo | $0.04 / 1K chars (v4 Turbo promo $0.011) |
| Scribe v2 / v2 Medical | $0.22 / audio hour (+ entity detection $0.07/h, keyterms $0.05/h; redaction/edit/speaker-role surcharges) |
| Scribe v2 Realtime | $0.39 / hour |
| Speech Engine | $0.08 / min (burst $0.16) |
| Music | $0.15 / min; finetune $1.50 each |
| Sound effects, voice changer, voice isolator | $0.12 / min |
| Dubbing v1 | $0.33 / min (watermark), $0.50 / min |
| Dubbing v2 | $2.20 / min |
| ElevenAgents | per-minute call pricing + LLM cost pass-through; see [agents-platform.md](agents-platform.md#pricing-and-limits) |

Startup grants: 12 months free with Scale-level concurrency.

## Credits (web app)

Credits are the web-app currency (formerly "characters"): TTS 1 credit/char (v4/v3/v2), Flash 0.5–1; STT 330/min; Music 900/min; SFX ~200/generation; voice changer and isolator 1,000/min; dubbing 2,000–10,000/min depending on mode and watermark. Plans: Free 10k, Starter 30k, Creator 121k, Pro 600k, Scale 1.8M, Business 6M credits/month.
