# Speech Engine (ElevenLabs voice layer for your own LLM/agent)

Snapshot 2026-10-03. Launched 2026-05-25. $0.08/min (burst $0.16/min).

## Contents

- [When to use](#when-to-use)
- [How it works](#how-it-works)
- [Create the engine](#create-the-engine)
- [Serve the brain (Node)](#serve-the-brain-node)
- [Serve the brain (Python)](#serve-the-brain-python)
- [Connect users](#connect-users)
- [Wire protocol (if not using the SDK)](#wire-protocol-if-not-using-the-sdk)
- [Gotchas](#gotchas)

## When to use

| You have | Use |
| --- | --- |
| No agent yet; want hosted LLM, tools, KB, telephony, analytics | ElevenAgents ([agents-platform.md](agents-platform.md)) |
| Your own agent/LLM stack (LangGraph, AI SDK, custom RAG) and want ElevenLabs STT + turn-taking + TTS | **Speech Engine** |
| Only need TTS or STT pieces | TTS WebSocket / Scribe realtime |
| An existing LiveKit or Pipecat pipeline | Speech Engine integration guides, or their ElevenLabs plugins |

ElevenAgents can also call your LLM via "custom LLM" (OpenAI-compatible endpoint). Speech Engine differs: ElevenLabs connects to **your WebSocket server** and sends transcripts; you stream text back.

## How it works

1. Create a Speech Engine resource (`seng_…`) with your `wsUrl`, ASR, TTS and turn settings.
2. Run a WebSocket server ("brain") at that URL. ElevenLabs connects per conversation.
3. Users connect from browser/mobile/phone with a conversation token or signed URL, exactly like an agent.
4. On each user turn you receive the transcript history; stream your LLM response back. Barge-in aborts your `AbortSignal`.

## Create the engine

`client.speechEngine.create/list/get/update/delete/duplicate` (`/v1/speech-engine`).

```ts
const engine = await elevenlabs.speechEngine.create({
  name: "Support brain",
  speechEngine: { wsUrl: "wss://brain.example.com/ws", requestHeaders: { "x-shared-secret": process.env.BRAIN_SECRET! } },
  asr: { provider: "scribe_realtime", userInputAudioFormat: "pcm_16000", keywords: ["Acme"] },
  tts: { modelId: "eleven_v4_turbo", voiceId: "JBFqnCBsd6RMkjVDRZzb", expressiveMode: true },
  turn: { turnEagerness: "normal", turnTimeout: 7 },
  conversation: { maxDurationSeconds: 600 },
  language: "en",
});
```

Key settings: `tts.modelId` (`eleven_v4_turbo` default; also flash/turbo/multilingual/v3 conversational/v4), `tts.suggestedAudioTags` (≤20), `tts.agentOutputAudioFormat`, `turn.turnModel` (`turn_v2|turn_v3`), `turn.speculativeTurn`, `vad.backgroundVoiceDetection`, `privacy` (record, retention, zero retention), `callLimits` (`agentConcurrencyLimit`, `dailyLimit`, `burstingEnabled`), `cascadeTimeoutSeconds` (2–15, default 4), `overrides.firstMessage`.

## Serve the brain (Node)

Node only (uses `ws`).

```ts
import http from "node:http";
import OpenAI from "openai";
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

const elevenlabs = new ElevenLabsClient();
const openai = new OpenAI();
const server = http.createServer();

await elevenlabs.speechEngine.attach("seng_123", server, "/ws", {
  async onTranscript(transcript, signal, session) {
    // transcript: { role: "user" | "agent", content: string }[]
    const stream = await openai.responses.create(
      { model: "gpt-5.5", input: transcript.map((m) => ({ role: m.role === "agent" ? "assistant" : "user", content: m.content })), stream: true },
      { signal },                                   // aborted on barge-in
    );
    session.sendResponse(stream);                   // accepts string, AsyncIterable, OpenAI/Anthropic/Gemini streams
  },
  onInit(conversationId, session) {},
  onClose(session) {}, onDisconnect(session) {}, onError(err, session) {},
});
server.listen(3001);
```

Alternatives: `const engine = await elevenlabs.speechEngine.get(id); engine.attach(server, path, callbacks)`; standalone `new SpeechEngine.Server({ port: 3001, engineId, apiKey, onTranscript }).start()`. The SDK verifies the `X-Elevenlabs-Speech-Engine-Authorization` JWT on every connection; `disableAuth: true` only behind an IP allowlist. `sendResponse` works only inside `onTranscript`. SDK v3 (alpha) changes `attach` to a single options object `{ server, path, ...callbacks }`.

## Serve the brain (Python)

```python
from elevenlabs import AsyncElevenLabs
client = AsyncElevenLabs()
engine = await client.speech_engine.get("seng_123")

async def on_transcript(transcript, signal, session):
    session.send_response(my_llm_stream(transcript))   # str or async generator

await engine.serve(port=3001, path="/ws", on_transcript=on_transcript)
# FastAPI/Starlette: session = engine.create_session(websocket); await session.run()
```

Pipecat can be the brain: run a pipeline inside `on_transcript` and pass an async generator to `send_response`.

## Connect users

- Browser/mobile: server mints `client.conversationalAi.conversations.getWebrtcToken({ agentId: "seng_123" })` → client `startSession({ conversationToken })` with `@elevenlabs/react` / `@elevenlabs/client` ([agents-clients.md](agents-clients.md)).
- Non-browser (LiveKit worker, custom bridge): `getSignedUrl({ agentId: "seng_123" })` → conversation WebSocket protocol (send `conversation_initiation_client_data`, `user_audio_chunk`; handle `audio`, `interruption`, `ping`). Use ASR `pcm_16000`, TTS `pcm_24000`.
- First message: enable `overrides.firstMessage` on the engine, then pass `overrides: { agent: { firstMessage } }` from the client (does not call `onTranscript`).

## Wire protocol (if not using the SDK)

ElevenLabs is the WebSocket **client**. Incoming: `init { conversation_id }`, `user_transcript { user_transcript[], event_id }`, `ping`, `close`, `error`. Outgoing: `agent_response { content, event_id, is_final }` — stream chunks with `is_final: false`, end with empty content + `is_final: true`; responses with a stale `event_id` are discarded; answer `ping` with `pong`. Auth header JWT: HS256 signed with SHA-256(API key), `iss` `https://api.elevenlabs.io/convai/speech-engine`, `sub` `convai_speech_engine_upstream`. Static egress IPs exist for allowlisting.

## Gotchas

1. Your server must be publicly reachable over `wss://`.
2. Always pass the `AbortSignal` into your LLM call; otherwise interrupted turns keep billing tokens.
3. Keep responses short and spoken-style; stream early.
4. Normalize numbers in the LLM prompt when using Flash TTS models.
