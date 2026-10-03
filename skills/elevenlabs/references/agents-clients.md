# ElevenAgents clients: web, React, React Native, widget, raw protocol, native SDKs

Snapshot 2026-10-03: `@elevenlabs/client` 1.26.0, `@elevenlabs/react` 1.16.0, `@elevenlabs/react-native` 1.2.28, widget 0.18.3. All three client packages had a **breaking 1.0 on 2026-03-27** — pre-1.0 snippets (class `Conversation`, `useConversation` without a provider, `ElevenLabsProvider`) are wrong now. Agent configuration lives in [agents-platform.md](agents-platform.md).

## Contents

- [Choose a client](#choose-a-client)
- [Server: mint credentials](#server-mint-credentials)
- [Transport rules](#transport-rules)
- [Vanilla `@elevenlabs/client`](#vanilla-elevenlabsclient)
- [React `@elevenlabs/react`](#react-elevenlabsreact)
- [Client tools](#client-tools)
- [React Native / Expo](#react-native--expo)
- [Embeddable widget](#embeddable-widget)
- [Raw conversation WebSocket protocol](#raw-conversation-websocket-protocol)
- [Python, Swift, Kotlin, Flutter](#python-swift-kotlin-flutter)
- [ElevenLabs UI components](#elevenlabs-ui-components)
- [Gotchas](#gotchas)

## Choose a client

| Situation | Use |
| --- | --- |
| Drop-in website chat/voice bubble, no code | `<elevenlabs-convai>` widget |
| React / Next.js app | `@elevenlabs/react` (`ConversationProvider` + hooks) |
| Other web frameworks | `@elevenlabs/client` |
| iOS/Android with Expo or bare RN | `@elevenlabs/react-native` (WebRTC only) |
| Native iOS / Android / Flutter | `elevenlabs-swift-sdk`, `io.elevenlabs:elevenlabs-android`, `elevenlabs_agents` |
| Server, desktop, telephony bridge, custom audio | Raw WebSocket or Python `Conversation` |
| Phone calls | Telephony integrations ([agents-platform.md](agents-platform.md#telephony-and-channels)) — no client code |

## Server: mint credentials

Never ship the API key. Authenticate your own user first, then mint a short-lived credential.

| Credential | REST | JS SDK | Transport |
| --- | --- | --- | --- |
| Conversation token | `GET /v1/convai/conversation/token?agent_id=` → `{ token, conversation_id }` | `client.conversationalAi.conversations.getWebrtcToken({ agentId, participantName?, branchId?, versionId?, environment? })` | WebRTC |
| Signed URL | `GET /v1/convai/conversation/get-signed-url?agent_id=` → `{ signed_url }` | `client.conversationalAi.conversations.getSignedUrl({ agentId, includeConversationId?, branchId?, versionId?, environment? })` | WebSocket |

- Signed URL: valid 15 min **to start**; live sessions survive expiry; `includeConversationId: true` makes it single-use. `/get_signed_url` (underscore) is a deprecated alias.
- Both accept Speech Engine IDs (`seng_…`), `branch_id`, `version_id`, `environment`.
- Agent security: `platform_settings.auth.enable_auth: true` requires a credential; otherwise use an `allowlist` of ≤10 exact hostnames (e.g. `localhost:3000`). The public widget needs auth disabled — protect it with the allowlist.

```ts
// app/api/conversation-token/route.ts (Next.js App Router)
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";

export const dynamic = "force-dynamic";
const elevenlabs = new ElevenLabsClient();

export async function GET() {
  // check your session here first
  const { token } = await elevenlabs.conversationalAi.conversations.getWebrtcToken({
    agentId: process.env.ELEVENLABS_AGENT_ID!,
  });
  return Response.json({ token }, { headers: { "Cache-Control": "no-store" } });
}
```

## Transport rules

Inference order: explicit `connectionType` → `conversationToken` ⇒ WebRTC → `signedUrl` ⇒ WebSocket → `textOnly ? websocket : webrtc`. Public `agentId` + voice ⇒ the SDK fetches a token itself.

| | WebRTC (LiveKit) | WebSocket |
| --- | --- | --- |
| Default for | voice | text-only |
| Audio | fixed PCM 48 kHz, echo cancellation, NAT traversal | worklets + resampling; honors `format`, `sampleRate`, `inputChunkDurationMs` |
| `onAudio` | no agent audio (alignment still arrives) | base64 chunks |
| Hosts | `wss://livekit.rtc.elevenlabs.io` (+ `.eu.residency`, `.in.residency`) | `wss://api.elevenlabs.io` (+ residency hosts) |
| Hostile networks | `webRtc: { iceTransportPolicy: "relay" }` | — |

Data residency in vanilla JS: set `origin` (e.g. `wss://api.eu.residency.elevenlabs.io`) **and** `livekitUrl` (`wss://livekit.rtc.eu.residency.elevenlabs.io`). React has `serverLocation: "us" | "global" | "eu-residency" | "in-residency"`.

## Vanilla `@elevenlabs/client`

`Conversation` is a namespace `{ startSession }` (not a class). `startSession` resolves to `VoiceConversation | TextConversation` (`textOnly: true` narrows it). No `instanceof`; narrow with `"changeInputDevice" in session`.

```ts
import { Conversation } from "@elevenlabs/client";

await navigator.mediaDevices.getUserMedia({ audio: true }); // from a user gesture, HTTPS only
const { token } = await fetch("/api/conversation-token").then((r) => r.json());

const conversation = await Conversation.startSession({
  conversationToken: token,
  userId: user.id,
  dynamicVariables: { user_name: "Ana" },                    // must cover every {{var}} the agent uses
  overrides: { agent: { firstMessage: "Hi Ana!" } },          // only if enabled in agent Security tab
  clientTools: { openPage: ({ path }: { path: string }) => { router.push(path); return "ok"; } },
  onConnect: ({ conversationId }) => {},
  onDisconnect: (d) => {},                                    // d.reason: "user" | "agent" | "error"
  onError: (message, context) => {},                          // string, not Error
  onMessage: ({ role, message, event_id }) => {},             // final user_transcript / agent_response only
  onAgentChatResponsePart: ({ type, text, response_id }) => {}, // streaming text; enable event in agent
  onModeChange: ({ mode }) => {},                             // "speaking" | "listening"
  onStatusChange: ({ status }) => {},
});

conversation.sendContextualUpdate("User opened /pricing", { contextId: "page" }); // no turn; same id replaces
conversation.sendUserMessage("I want to upgrade");                               // triggers a turn
await conversation.endSession();
```

Session options: `agentId` | `signedUrl` | `conversationToken`, `connectionType`, `textOnly`, `userId`, `dynamicVariables`, `overrides` `{ agent: { prompt: { prompt, llm }, firstMessage, language }, tts: { voiceId, speed, stability, similarityBoost }, asr: { keywords }, conversation: { textOnly } }`, `customLlmExtraBody`, `environment`, `toolMockConfig`, `origin`, `livekitUrl`, `authorization`, `webRtc`, `useWakeLock` (default on), `connectionDelay`, `inputDeviceId`, `outputDeviceId`, `preferHeadphonesForIosDevices`, `format`, `sampleRate`, `inputChunkDurationMs` (25), `workletPaths`, `libsampleratePath`, `onConversationCreated`, `onMCPToolApprovalRequest`, experimental `orchestrator` (self-hosted runtime).

Callbacks (beyond the above): `onAudio`, `onVadScore`, `onCanSendFeedbackChange`, `onUnhandledClientToolCall`, `onInterruption`, `onAgentResponseCorrection`, `onAgentToolRequest`, `onAgentToolResponse`, `onMCPToolCall`, `onMCPConnectionStatus`, `onConversationMetadata`, `onAsrInitiationMetadata`, `onAudioAlignment`, `onContextUsage`, `onGuardrailTriggered`, `onAgentTyping`, `onExternalAgentConnected/Disconnected` (human handoff), `onRichContent` and `onAgentReasoningResponsePart` (experimental), `onPing`, `onDebug`, `onIncomingEvent`, `onOutgoingEvent`.

Methods: `endSession`, `getId`, `isOpen`, `setVolume({ volume })`, `setMicMuted(bool)`, `getInputVolume` / `getOutputVolume`, `getInputByteFrequencyData` / `getOutputByteFrequencyData` (visualizers), `sendFeedback(like | null, eventId?)`, `sendContextualUpdate`, `sendUserMessage`, `sendUserActivity` (pauses agent ~2 s, throttled 1/s), `sendMultimodalMessage({ text?, fileIds? })`, `uploadFile(blob) → { fileId }`, `sendMCPToolApprovalResult(id, approved)`, `changeInputDevice` / `changeOutputDevice` (voice only; format/sampleRate throw under WebRTC). Also exported: `postOverallFeedback(conversationId, like | { rating, comment })`, `SessionConnectionError`.

Text-only chat: `startSession({ signedUrl, textOnly: true })` (or allow the `conversation.textOnly` override and enable text-only on the agent to avoid audio pricing). No mic, no AudioContext.

## React `@elevenlabs/react`

Every hook needs a `<ConversationProvider>` ancestor. One session per provider; unmount ends it. `startSession()` is **sync and returns void** — errors arrive via `onError` and `status === "error"` (which can also appear while still connected, e.g. a client tool threw).

```tsx
"use client";
import {
  ConversationProvider, useConversationControls, useConversationStatus,
  useConversationMode, useConversationClientTool,
} from "@elevenlabs/react";

export function SupportAgent() {
  return (
    <ConversationProvider serverLocation="us" onError={(m) => console.error(m)}>
      <CallButton />
    </ConversationProvider>
  );
}

function CallButton() {
  const { startSession, endSession } = useConversationControls();
  const { status, message } = useConversationStatus();
  const { isSpeaking } = useConversationMode();
  useConversationClientTool("showToast", ({ text }: { text: string }) => { toast(text); return "shown"; });

  async function start() {
    await navigator.mediaDevices.getUserMedia({ audio: true });
    const { token } = await fetch("/api/conversation-token").then((r) => r.json());
    startSession({ conversationToken: token }); // no await / try-catch
  }
  return status === "connected"
    ? <button onClick={endSession}>End ({isSpeaking ? "speaking" : "listening"})</button>
    : <button onClick={start} disabled={status === "connecting"}>Talk {message}</button>;
}
```

Hooks: `useConversationControls` (stable refs: `startSession`, `endSession`, `sendUserMessage`, `sendMultimodalMessage`, `uploadFile`, `sendContextualUpdate`, `sendUserActivity`, `sendMCPToolApprovalResult`, `setVolume`, device changes, frequency data, volumes, `getId`), `useConversationStatus` (`status`: `disconnected|connecting|connected|error`, `message` = status/error text), `useConversationMode` (`mode`, `isSpeaking`, `isListening`), `useConversationInput` (mute), `useConversationFeedback` (`canSendFeedback`, `sendFeedback`), `useConversationClientTool(name, handler)`, `useRawConversation`, and the all-in-one `useConversation(options)`. `useScribe` (realtime STT) is also exported — see [speech-to-text.md](speech-to-text.md#realtime-in-the-browser).

Provider props = session options + callbacks (defaults for every `startSession`) + controlled mic `isMuted` / `onMutedChange`. Callbacks on the provider are ref-stable; callbacks passed to `startSession` are per session. MCP approval in React: handle `onMCPToolCall` and call `sendMCPToolApprovalResult`.

Migrating from 0.x: wrap in a provider, drop `await`/`try` around `startSession`, `DeviceFormatConfig` → `FormatConfig`, `DeviceInputConfig` → `InputDeviceConfig`, replace `conversation.input.analyser` / `output.gain` with `getInputByteFrequencyData` / `setVolume`.

## Client tools

1. Create the tool in the agent (type `client`, exact name, parameters, **blocking / wait for response** if the agent needs the result).
2. Register a handler with the same name (`clientTools` option, `useConversationClientTool`, or widget `elevenlabs-convai:call` event).
3. Return a string/number/object (stringified). `undefined` → "Client tool execution successful.". A throw sends `is_error: true`.
4. Unknown tool → automatic error result unless `onUnhandledClientToolCall` is set (then you must answer).

## React Native / Expo

```bash
bunx expo install @elevenlabs/react-native @livekit/react-native @livekit/react-native-webrtc @config-plugins/react-native-webrtc @livekit/react-native-expo-plugin livekit-client
```

- `app.json` plugins `@livekit/react-native-expo-plugin`, `@config-plugins/react-native-webrtc`; iOS `NSMicrophoneUsageDescription`; Android `RECORD_AUDIO`, `MODIFY_AUDIO_SETTINGS`.
- **Expo dev build only** (`bunx expo prebuild --clean && bunx expo run:ios --device`); Expo Go does not work.
- WebRTC only: use `agentId` (public) or `conversationToken`. `signedUrl` / `connectionType: "websocket"` throw.
- Exports `ConversationProvider` and the hooks; `useConversationClientTool` is not re-exported in 1.2.28 — pass `clientTools` to the provider or import the hook from `@elevenlabs/react`.

## Embeddable widget

```html
<elevenlabs-convai agent-id="agent_..."></elevenlabs-convai>
<script src="https://unpkg.com/@elevenlabs/convai-widget-embed" async type="text/javascript"></script>
```

Bundler: `import { registerWidget } from "@elevenlabs/convai-widget-core"; registerWidget();`.

Key attributes: `agent-id`, `signed-url`, `server-location`, `environment`, `user-id`, `use-rtc` (widget defaults to WebSocket), `variant` (`tiny|compact|full`), `placement`, `default-expanded`, `always-expanded`, `dismissible`, `avatar-image-url`, `avatar-orb-color-1/2`, `mic-muting`, `transcript`, `text-input`, `collect-feedback`, `strip-audio-tags`, `language`, `text-contents` (JSON labels), `dynamic-variables` (JSON), `override-config` (JSON), `override-prompt|llm|first-message|language|voice-id|speed|stability|similarity-boost|text-only`, `markdown-link-allowed-hosts`, `worklet-path-*` (strict CSP), `allow-events`.

DOM events: listen for `elevenlabs-convai:call` and set `event.detail.config.clientTools = { redirect: ({ url }) => … }`. With `allow-events="true"` you can dispatch `elevenlabs-agent:user-message`, `elevenlabs-agent:contextual-update` (`{ detail: { message } }`), `elevenlabs-agent:user-activity`, and `elevenlabs-agent:expand` (`{ detail: { action: "expand"|"collapse"|"toggle" } }`). Dashboard styling lives in `platform_settings.widget`.

## Raw conversation WebSocket protocol

`wss://api.elevenlabs.io/v1/convai/conversation?agent_id=<id>` (signed URL adds `conversation_signature`). Optional `environment`.

1. Send `conversation_initiation_client_data` first (even empty).
2. Read `conversation_initiation_metadata` → `conversation_id`, `agent_output_audio_format`, `user_input_audio_format`.
3. Stream mic as `{ "user_audio_chunk": "<base64 PCM16 mono>" }` (no `type` field) at `user_input_audio_format` (usually `pcm_16000`; `ulaw_8000` for telephony).
4. Play `audio.audio_event.audio_base_64`. On `interruption`, drop queued audio with `event_id ≤ interruption_event.event_id`.
5. Answer every `ping` with `{ "type": "pong", "event_id": <ping_event.event_id> }`.

```jsonc
{ "type": "conversation_initiation_client_data",
  "conversation_config_override": {
    "agent": { "prompt": { "prompt": "…", "llm": "…" }, "first_message": "…", "language": "en" },
    "tts": { "voice_id": "…", "speed": 1.0, "stability": 0.5, "similarity_boost": 0.8 },
    "asr": { "keywords": ["Acme"] },
    "conversation": { "text_only": false } },
  "dynamic_variables": { "user_name": "Ana" }, "user_id": "u_1",
  "custom_llm_extra_body": {}, "branch_id": "…", "environment": "production" }
{ "type": "user_message", "text": "…" }
{ "type": "contextual_update", "text": "…", "context_id": "page" }
{ "type": "user_activity" }
{ "type": "feedback", "event_id": 42, "score": "like" }
{ "type": "client_tool_result", "tool_call_id": "…", "result": "…", "is_error": false }
{ "type": "mcp_tool_approval_result", "tool_call_id": "…", "is_approved": true }
{ "type": "multimodal_message", "text": { "type": "user_message", "text": "…" }, "files": [{ "type": "file_input", "file_id": "…" }] }
```

Server events (`type` → payload key): `conversation_initiation_metadata`, `asr_initiation_metadata`, `audio` (`audio_event`, optional alignment), `user_transcript`, `tentative_user_transcript`, `agent_response` (+attachments), `agent_response_correction`, `agent_chat_response_part` (`start|delta|stop`), `agent_response_complete`, `agent_response_metadata` (custom LLM), `interruption`, `client_tool_call`, `agent_tool_request`, `agent_tool_response`, `agent_tool_response_full_payload`, `mcp_tool_call` (states incl. `awaiting_approval`), `mcp_connection_status`, `vad_score`, `ping`, `context_usage`, `rich_content`, `agent_typing`, `external_agent_connected/disconnected`, `queue_status` (`waiting|admitted|timed_out`), `guardrail_triggered`, `agent_reasoning_response_part`, error (`error` in SDK/AsyncAPI, `client_error` in docs — handle both).

Default-enabled events: `audio`, `interruption`, `agent_response`, `user_transcript`, `tentative_user_transcript`, `conversation_initiation_metadata`, `ping`. **All others must be enabled** in `conversation_config.conversation.client_events` or they never arrive.

Close codes: 1000 normal (end call, max duration), 1002, 1008 auth/validation/contract, 1011 internal, 4300 queue timeout.

WebRTC uses the same JSON events over the LiveKit data channel; audio flows as LiveKit tracks.

## Python, Swift, Kotlin, Flutter

Python (`elevenlabs`, WebSocket, server/desktop):

```python
from elevenlabs.client import ElevenLabs
from elevenlabs.conversational_ai.conversation import Conversation, ConversationInitiationData, ClientTools
from elevenlabs.conversational_ai.default_audio_interface import DefaultAudioInterface  # pip install "elevenlabs[pyaudio]"

tools = ClientTools(); tools.register("get_time", lambda params: "12:00")
conv = Conversation(ElevenLabs(), agent_id, requires_auth=True, audio_interface=DefaultAudioInterface(),
    config=ConversationInitiationData(dynamic_variables={"user_name": "Ana"}), client_tools=tools,
    callback_agent_response=print, callback_user_transcript=print)
conv.start_session(); conversation_id = conv.wait_for_session_end()
```

Custom audio: implement `AudioInterface` (`start`, `stop`, `output`, `interrupt`). `AsyncConversation` exists. There is no `url=` parameter (docs bug) — use `requires_auth=True`.

- Swift: `.package(url: "https://github.com/elevenlabs/elevenlabs-swift-sdk.git", from: "3.4.0")`; `ElevenLabs.startConversation(agentId:|conversationToken:, config:)`; published `$state`, `$messages`, `$agentState`, `$pendingToolCalls`.
- Android: `io.elevenlabs:elevenlabs-android:0.12.2`; `ConversationClient.startSession(ConversationConfig(...), context)`; ProGuard `-keep class io.elevenlabs.** { *; }`.
- Flutter: `elevenlabs_agents` 0.6.x.

## ElevenLabs UI components

shadcn registry at `ui.elevenlabs.io`: `bunx shadcn@latest add https://ui.elevenlabs.io/r/<name>.json` (or `bunx @elevenlabs/cli components add <name>`). Components: `orb`, `waveform`, `live-waveform`, `bar-visualizer`, `audio-player`, `scrub-bar`, `conversation`, `conversation-bar`, `message`, `response`, `shimmering-text`, `matrix`, `voice-picker`, `voice-button`, `mic-selector`, `speech-input`, `transcript-viewer`. Blocks: `voice-chat-01..03`, `speaker-01`, `transcriber-01`, `realtime-transcriber-01`, `music-player-01/02`, `voice-form-01`, `voice-nav-01`. `conversation-bar` needs a `ConversationProvider`.

## Gotchas

1. Mic needs HTTPS (or localhost) and a user gesture; iOS Safari also needs the gesture for audio playback.
2. Token ⇒ WebRTC, signed URL ⇒ WebSocket. RN and native SDKs need tokens.
3. Overrides (`firstMessage`, `language`, `voiceId`, `prompt`, `textOnly`…) are rejected unless enabled in the agent's Security settings.
4. Missing dynamic variables → `missing_dynamic_variable` error at start.
5. Optional events (`agent_chat_response_part` for voice, tool responses, `vad_score`, MCP, `context_usage`…) need enabling in `client_events`.
6. React: `useConversation().message` is status/error text, not the last chat message. Docs chat-mode sample shows a wrong `onMessage` payload; the real one is `{ message, role, source, event_id }`.
7. Strict CSP: self-host worklets (`node_modules/@elevenlabs/client/worklets/*.js`) via `workletPaths`; allow `connect-src` for `wss://api.elevenlabs.io`, `wss://livekit.rtc.elevenlabs.io`, `https://api.elevenlabs.io` and regional hosts.
8. Do not install the stale `@next` dist-tag (`1.0.0-rc.1`).
