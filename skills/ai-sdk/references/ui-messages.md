# Messages and stream protocol

References: https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message.md · https://ai-sdk.dev/docs/reference/ai-sdk-core/model-message.md · https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol.md

## UIMessage vs ModelMessage

```ts
interface UIMessage<METADATA = unknown, DATA_PARTS = UIDataTypes, TOOLS = UITools> {
  id: string;
  role: 'system' | 'user' | 'assistant';
  metadata?: METADATA;
  parts: Array<UIMessagePart<DATA_PARTS, TOOLS>>;
}
```

**No `content` field.** Docs may still mention `content` as deprecated. Always iterate `message.parts`.

`UIMessage` = full app state (tools, data widgets, metadata). `ModelMessage` = model prompt. Convert with `await convertToModelMessages(messages)`. Passing `UIMessage[]` into `generateText`/`streamText` throws `InvalidPromptError`.

```ts
import { InferUITools, InferAgentUIMessage, UIMessage } from 'ai';

type MyUITools = InferUITools<typeof tools>;
type MyUIMessage = UIMessage<MyMetadata, MyDataParts, MyUITools>;

const { messages } = useChat<MyUIMessage>();
```

`InferAgentUIMessage<typeof agent>` for `ToolLoopAgent`. `onToolCall`: `if (toolCall.dynamic) return` before narrowing `toolName`.

Load: `validateUIMessages` / `safeValidateUIMessages`.

## UI part types

| `part.type` | Shape | Notes |
| --- | --- | --- |
| `text` | `{ text, state?: 'streaming' \| 'done' }` | Body |
| `reasoning` | `{ id?, text, state?, providerMetadata? }` | Only if `sendReasoning: true` |
| `reasoning-file` | `{ mediaType, url }` | Reasoning images |
| `file` | `{ mediaType, filename?, url }` | Attachments / generated images |
| `source-url` | `{ sourceId, url, title? }` | `sendSources: true`. Flat — not nested `{ type: 'source', value }` |
| `source-document` | `{ sourceId, mediaType, title, filename? }` | |
| `custom` | `{ kind: '{provider}.{type}', providerMetadata? }` | Provider-specific |
| `` `tool-${name}` `` | see states | Generative UI |
| `dynamic-tool` | `{ toolName, state, input, output? }` | MCP / runtime tools |
| `` `data-${name}` `` | `{ id?, data, transient? }` | Widgets. `transient: true` → **only `onData`**, not history. Same `id` = live update |
| `step-start` | `{}` | Multi-step boundaries |

### Tool part states

`input-streaming` → `input-available` → (`approval-requested` → `approval-responded`) → `output-available` | `output-error` | `output-denied`

Access `part.input` only in `input-available` or `output-available`. Access `part.output` only in `output-available`.

Helpers: `isToolUIPart(part)`, `getToolName(part)`. **`isToolOrDynamicToolUIPart` removed in v7.**

```tsx
{message.parts.map((part, i) => {
  switch (part.type) {
    case 'text':
      return <span key={`${message.id}-${i}`}>{part.text}</span>;
    case 'file':
      return part.mediaType.startsWith('image/') ? (
        <img key={i} src={part.url} alt={part.filename} />
      ) : null;
    case 'tool-weather':
      if (part.state === 'output-available') return <Weather key={i} {...part.output} />;
      if (part.state === 'input-available') return <div key={i}>Loading…</div>;
      return null;
    case 'step-start':
      return i > 0 ? <hr key={i} /> : null;
    default:
      return null;
  }
})}
```

## ModelMessage

Roles: `system | user | assistant | tool`.

User content: `string | Array<TextPart | FilePart>`. `{ type: 'image' }` is deprecated → `{ type: 'file', mediaType: 'image', data }`.

Assistant may include `ToolCallPart`: `{ type: 'tool-call', toolCallId, toolName, input }`.

Tool role: `ToolResultPart[]` with `output` variants `text | json | execution-denied | error-text | error-json | content`.

## Stream protocol

Two HTTP protocols:

### Text stream

Raw UTF-8 chunks. `useChat`: `TextStreamChatTransport`. `useCompletion`/`useObject`: `streamProtocol: 'text'`. Server: `createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) })`. **Text only.**

### UI message stream (default)

SSE. Custom backends **must** send header **`x-vercel-ai-ui-message-stream: v1`**. Constant: `UI_MESSAGE_STREAM_HEADERS`. Terminate with `data: [DONE]`.

Wire types (`data: {json}`): `start` `{ messageId }`, `text-start` / `text-delta` / `text-end` (same `id`), `reasoning-*`, `reasoning-file`, `source-url` / `source-document`, `file`, `custom`, `data-<name>`, `error` `{ errorText }`, `tool-input-start` / `tool-input-delta` / `tool-input-available`, `tool-approval-request` / `tool-approval-response`, `tool-output-available` / `tool-output-denied`, `start-step` / `finish-step` / `reset-step`, `finish`, `abort` `{ reason? }`.

**Legacy data stream** (`0:` prefixes, `toDataStreamResponse`): gone. If the client shows `0:...`, the server is on the old protocol.

`readUIMessageStream({ stream, message? })` folds chunks into successive `UIMessage` snapshots (TUI, custom clients).

## Message metadata vs data parts

- **Metadata:** message-level (tokens, model, timestamps) via `messageMetadata` on `toUIMessageStream`
- **Data parts:** in-message widgets (`data-weather`, artifacts, progress)

## pruneMessages

Prune **ModelMessage[]** (after convert) before `streamText`: strategies `'all' | 'before-last-message' | 'before-last-N-messages' | 'none'` for `reasoning`, `toolCalls`, `emptyMessages`, or per-tool arrays.
