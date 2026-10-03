# Ecosystem: packages, CLI, MCP, docs access, AI SDK, LiveKit, Pipecat, integrations

Snapshot 2026-10-03.

## Contents

- [Official packages](#official-packages)
- [ElevenLabs CLI](#elevenlabs-cli)
- [MCP servers](#mcp-servers)
- [Reading the docs as an agent](#reading-the-docs-as-an-agent)
- [Vercel AI SDK provider](#vercel-ai-sdk-provider)
- [LiveKit and Pipecat](#livekit-and-pipecat)
- [Other integrations](#other-integrations)
- [Recent changes worth knowing (Apr–Oct 2026)](#recent-changes-worth-knowing-aproct-2026)

## Official packages

| Package | Version | Purpose |
| --- | --- | --- |
| `@elevenlabs/elevenlabs-js` | 2.70.0 (`alpha` 3.0.0-alpha.1) | Server REST SDK, realtime STT (Node), Speech Engine server, webhooks helper |
| `elevenlabs` (PyPI) | 2.70.0 | Python SDK (`ElevenLabs`, `AsyncElevenLabs`, agents `Conversation`, Speech Engine) |
| `@elevenlabs/client` | 1.26.0 | Browser/RN agent conversations, `Scribe` realtime STT |
| `@elevenlabs/react` | 1.16.0 | `ConversationProvider`, conversation hooks, `useScribe` |
| `@elevenlabs/react-native` | 1.2.28 | RN/Expo agents (WebRTC) |
| `@elevenlabs/types` | 0.24.0 | Generated protocol types (AsyncAPI) |
| `@elevenlabs/convai-widget-embed` / `-core` | 0.18.3 | `<elevenlabs-convai>` web component |
| `@elevenlabs/cli` | 1.4.0 | `elevenlabs` CLI (Rust binary) |
| `@elevenlabs/n8n-nodes-elevenlabs` | 0.2.x | n8n node |
| Swift `elevenlabs-swift-sdk` | 3.4.0 | iOS/macOS agents |
| Maven `io.elevenlabs:elevenlabs-android` | 0.12.x | Android agents |
| pub `elevenlabs_agents` | 0.6.x | Flutter agents |

Deprecated: npm `elevenlabs` (unscoped, 1.59), `@elevenlabs/agents-cli`, `@elevenlabs/convai-cli`, PyPI `elevenlabs-mcp` (archived 2026-08-22). Pin minor versions of `@elevenlabs/elevenlabs-js`: weekly Fern-generated releases sometimes remove or rename generated types.

## ElevenLabs CLI

Rust binary `elevenlabs` (v1 GA 2026-08-24). Install: `brew install elevenlabs/tap/elevenlabs`, `bun add -g @elevenlabs/cli` (or `bunx @elevenlabs/cli <cmd>`), Scoop, or the curl installer.

- Auth: `elevenlabs auth login` (browser OAuth, OS keyring), `auth status`, `auth logout`; CI uses `ELEVENLABS_API_KEY` (env or `.env`) or `--xi-api-key`.
- Every REST operation is a command: `elevenlabs <resource> <method> [--flags | --json '{...}']`, e.g. `elevenlabs text-to-speech convert --voice-id JBFqnCBsd6RMkjVDRZzb --model-id eleven_v4 --text "Hi" --output hi.mp3`.
- Global flags: `--dry-run` (print HTTP request), `--format json|table|yaml|csv`, `--output`, `--page-all`, `--base-url`, `--intent "<one sentence>"`.
- `elevenlabs residency eu-residency|in-residency|sg-residency|us|global`.
- `elevenlabs say "text"` quick playback.
- Agents as code — see [agents-platform.md](agents-platform.md#agents-as-code-cli).
- `elevenlabs components add <name>` installs ElevenLabs UI components (shadcn).

Use the CLI for quick one-off operations from a terminal (generate a file, list voices, inspect an agent) and for agent config in CI.

## MCP servers

| Server | URL | Auth | Use |
| --- | --- | --- | --- |
| Hosted ElevenLabs MCP | `https://api.elevenlabs.io/v1/mcp` (EU `https://api.eu.residency.elevenlabs.io/v1/mcp`, India `…in.residency…`, Singapore `…sg.residency…`) | OAuth (CIMD; no API key) | Create/update/list/compare/duplicate/delete agents, read conversations and transcripts, cost estimates, widget config, KB size, generate TTS (short-lived link) |
| Docs search | `https://elevenlabs.io/docs/_mcp/server` | none | One tool `searchDocs({ query, topK })`. llms.txt advertises `https://elevenlabs.io/_mcp/server` which 404s; the backend was flaky in testing |
| Local `elevenlabs-mcp` (`uvx elevenlabs-mcp`) | stdio | `ELEVENLABS_API_KEY` | **Deprecated/archived**; do not set up new installs |

Agents can also **consume** your MCP servers as tools — that is a separate feature ([agents-platform.md](agents-platform.md)).

## Reading the docs as an agent

- Append `.md` to any docs URL: `https://elevenlabs.io/docs/eleven-api/quickstart.md`.
- Index: `https://elevenlabs.io/docs/llms.txt`; per-section indexes: `<section-url>/llms.txt` (e.g. `https://elevenlabs.io/docs/eleven-agents/llms.txt`); full dump `llms-full.txt`.
- API reference pages (`/docs/api-reference/<group>/<op>.md`) include params and SDK snippets in many languages; WebSocket pages embed AsyncAPI YAML.
- Changelog: `https://elevenlabs.io/docs/changelog.md` (latest), entries at `/docs/changelog/YYYY/M/D.md`.
- OpenAPI: `https://api.elevenlabs.io/openapi.json` (the `/docs/openapi.json` link returns 401). Use `scripts/openapi_lookup.py`.
- SDK method reference: `https://raw.githubusercontent.com/elevenlabs/elevenlabs-js/main/reference.md` (omits a few hand-written methods like `audioIsolation.convert`; check `src/api/resources/<ns>/client/Client.ts`).

## Vercel AI SDK provider

`@ai-sdk/elevenlabs` 3.0.x for AI SDK 7 (Node ≥22). Speech and transcription only (no agents). Not maintained by ElevenLabs.

```ts
import { elevenlabs } from "@ai-sdk/elevenlabs";
import { generateSpeech, transcribe } from "ai";

const { audio } = await generateSpeech({
  model: elevenlabs.speech("eleven_multilingual_v2"),
  text: "Hello from the AI SDK",
  voice: "JBFqnCBsd6RMkjVDRZzb",
  providerOptions: { elevenlabs: { voiceSettings: { stability: 0.5, similarityBoost: 0.75 }, seed: 42 } },
});

const transcript = await transcribe({
  model: elevenlabs.transcription("scribe_v2"),
  audio: await readFile("call.mp3"),
  providerOptions: { elevenlabs: { diarize: true, tagAudioEvents: true, timestampsGranularity: "word" } },
});
```

- AI SDK 7 names are `generateSpeech` / `transcribe`; `experimental_*` are deprecated aliases (ElevenLabs' own page still shows `experimental_transcribe`). Streaming STT: `experimental_streamTranscribe` with `scribe_v2_realtime`.
- No `baseURL` setting (no data residency) — override `fetch` if you must. Set `diarize` explicitly. The model-ID unions are stale (list removed v1 models, miss v4); v4 needs Text to Dialogue, which this provider does not call.
- Older majors: `@ai-sdk/elevenlabs@ai-v6` / `@ai-v5`.

## LiveKit and Pipecat

- LiveKit Agents: Python `livekit-plugins-elevenlabs` (`from livekit.plugins import elevenlabs` → `elevenlabs.TTS(...)`, `elevenlabs.STT(...)`), Node `@livekit/agents-plugin-elevenlabs`. **Env var `ELEVEN_API_KEY`** (not `ELEVENLABS_API_KEY`). v3/v4 TTS models route through Text to Dialogue.
- Pipecat (`pipecat-ai`): `ElevenLabsTTSService` (WebSocket, default `eleven_flash_v2_5`), `ElevenLabsHttpTTSService`, `ElevenLabsSTTService` (`scribe_v2`), `ElevenLabsRealtimeSTTService` (`scribe_v2_realtime`), plus a dialogue TTS service.
- Both can sit in front of Speech Engine instead (ElevenLabs owns turn-taking) — see [speech-engine.md](speech-engine.md).

## Other integrations

- Telephony: native Twilio, SIP trunk, Exotel, Vonage, Telnyx, Plivo, Bandwidth, Sinch, Amazon Connect, Genesys, Five9, Microsoft Teams, WhatsApp (agents).
- Agent tool integrations: Cal.com, Calendly, Google Calendar/Drive, HubSpot, Salesforce, Zendesk, Freshdesk, Intercom, ServiceNow, Jira, Slack, Telegram, Exa, Perplexity, Tavily, Parallel, Cursor.
- No-code: Framer, Webflow, WordPress, Wix, Squarespace, Ghost (widget and Audio Native); n8n node; Zapier via Reception AI.
- Community SDKs: .NET `ElevenLabs-DotNet`, Unity `com.rest.elevenlabs`; third-party wrappers in Mastra, TanStack AI, Cloudflare voice, Remotion.

## Recent changes worth knowing (Apr–Oct 2026)

- 2026-09-28: Eleven v4 / v4 Turbo; STT transcript editing; Flows template API; agent LLMs `gpt-6-*`, `claude-opus-5`, `claude-opus-5-5`, `glm-52`, `deepseek-v41-flash`.
- 2026-09-14: Music v2.5; call queueing + hold audio. 2026-09-11: Scribe v2 Medical.
- 2026-08-24: CLI v1 (Rust); Procedures GA. 2026-08-22: local MCP archived → hosted MCP.
- 2026-08-17: Flows image/video/TTS + assets APIs; background sound defaults changed (volume 0.6 → 0.15).
- 2026-08-10: Dubbing v2 project API.
- 2026-07-20: Music finetunes API; `enable_phoneme_tags` default true; backup-LLM cascade timeout 8 s → 4 s.
- 2026-07-09: v1 TTS models and `scribe_v1` removed.
- 2026-07-06: simulate-conversation endpoints deprecated (use tests); `disable_interruptions` → `interruption_mode`.
- 2026-06-15: Music v2 chunk plans. 2026-06-08: agent ASR default `scribe_realtime`.
- 2026-05-25: Speech Engine. 2026-05-13: `text-to-voice/create-previews` deprecated → `design`.
- 2026-04-01: client/react/react-native 1.0 (breaking); STT `source_url` (YouTube/TikTok).
