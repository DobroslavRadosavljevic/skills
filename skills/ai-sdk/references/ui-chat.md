# AI SDK UI — chat, completion, object, transports

Guides: https://ai-sdk.dev/docs/ai-sdk-ui/overview.md · https://ai-sdk.dev/docs/ai-sdk-ui/chatbot.md · https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat.md

Canonical loop: client `useChat` + `DefaultChatTransport` → POST `UIMessage[]` → server `await convertToModelMessages` + `streamText` → `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`. Render **`message.parts`**.

`useChat` itself still uses **`onFinish`**. Stream-helper callbacks use **`onEnd`** (`onFinish` is a deprecated alias there).

## useChat (`@ai-sdk/react`)

```tsx
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status, stop, error } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
```

Default endpoint is `/api/chat` if `transport` is omitted. API shape changed in **5.0** (transport, no managed input). v7 keeps that shape.

### Options

| Option | Notes |
| --- | --- |
| `chat` | Existing `Chat` instance; **other params ignored** |
| `transport` | Default: `DefaultChatTransport` → `/api/chat` |
| `id` | Required for persistence/resume |
| `messages` | Initial history. **Not** `initialMessages` |
| `messageMetadataSchema` / `dataPartSchemas` | Validate metadata / `data-*` |
| `onToolCall` | Client tools. **Must** `addToolOutput`. Check `if (toolCall.dynamic)` first. **Do not await** `addToolOutput` inside this callback (deadlock) |
| `sendAutomaticallyWhen` | Resubmit when stream finishes or a tool result is added. Helpers: `lastAssistantMessageIsCompleteWithToolCalls`, `lastAssistantMessageIsCompleteWithApprovalResponses` |
| `onFinish` | `{ message, messages, isAbort, isDisconnect, isError, finishReason? }` |
| `onError` | Fetch/stream errors |
| `onData` | Every data part, **including transient**. Throw to abort |
| `throttle` | React only, ms. Default none |
| `resume` | Auto-reconnect on mount. Default `false` |

**Not on `useChat`:** `api`, `headers`, `body`, `credentials`, `input`, `handleSubmit`, `handleInputChange`, `isLoading`, `onResponse`, `maxSteps`. Those live on **transport** or were removed.

### DefaultChatTransport

```ts
new DefaultChatTransport({
  api, // default '/api/chat'
  credentials, // RequestCredentials or function
  headers, // object | Headers | () => ...
  body, // object | () => ...
  fetch, // Expo: expo/fetch
  prepareSendMessagesRequest,
  prepareReconnectToStreamRequest,
})
```

`headers`/`body`/`credentials` can be functions (refresh tokens). For React state that changes, use `useRef` or request-level `sendMessage` options.

`prepareSendMessagesRequest` receives `{ id, messages, requestMetadata, body, credentials, headers, api, trigger, messageId }`. Trigger strings vary in docs (`submit-message` vs `submit-user-message`) — match what you actually receive.

Default resume GET: `/api/chat/{chatId}/stream`.

### Return values

| Return | Notes |
| --- | --- |
| `messages` | `UIMessage[]` — `{ id, role, parts, metadata? }` |
| `status` | `'submitted' \| 'streaming' \| 'ready' \| 'error'` |
| `sendMessage` | `sendMessage({ text, files?, metadata?, messageId? })`. `messageId` replaces that message (edit). **No message** = resubmit current history (after tool outputs). 2nd arg: `{ headers, body, metadata }` wins over transport |
| `regenerate` | Last assistant message, or a specific id |
| `stop` | Abort **this** HTTP connection. On resumable streams this is a **disconnect**, not cancel |
| `resumeStream` | Reconnect after network drop |
| `addToolOutput` | `{ tool, toolCallId, output }` or `{ tool, toolCallId, state: 'output-error', errorText }` |
| `addToolApprovalResponse` | `{ id, approved, reason? }` — `id` = `part.approval.id` |
| `addToolResult` | **Deprecated** alias of `addToolOutput` |
| `setMessages` | Local only; no API call |
| `clearError` | |

`sendMessage` files: `FileList` or `FileUIPart[]`. Auto-converted: **`image/*` and `text/*` only**.

### Status UI

Disable input when `status !== 'ready'`. Show Stop when `submitted || streaming`. Spinner on `submitted`. `useCompletion` / `useObject` still use **`isLoading`**.

```tsx
<input disabled={status !== 'ready'} />
{(status === 'submitted' || status === 'streaming') && (
  <button type="button" onClick={() => stop()}>Stop</button>
)}
```

## Server chat handler

```ts
import {
  convertToModelMessages,
  createUIMessageStreamResponse,
  streamText,
  toUIMessageStream,
  isStepCount,
  type UIMessage,
} from 'ai';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: 'anthropic/claude-sonnet-4.5',
    instructions: 'You are a helpful assistant.',
    messages: await convertToModelMessages(messages),
    stopWhen: isStepCount(5),
    onError({ error }) {
      console.error(error);
    },
  });

  return createUIMessageStreamResponse({
    stream: toUIMessageStream({
      stream: result.stream,
      originalMessages: messages,
    }),
  });
}
```

`convertToModelMessages` returns **`Promise<ModelMessage[]>`** — always `await`. Options: `tools` (for `toModelOutput`), `convertDataPart` (map user `data-*` to text/file; omitted parts dropped). Approval states map to `tool-approval-request` / `tool-approval-response`; denied → synthetic `tool-result` `{ type: 'execution-denied' }`.

**Do not** use `result.toUIMessageStreamResponse()` in new code (deprecated in 7). Nuxt getting-started still shows it — treat as stale.

Next App Router: `export const maxDuration = 30` as needed.

### Custom UI stream (data parts, persistence)

```ts
const stream = createUIMessageStream({
  originalMessages: messages,
  execute: ({ writer }) => {
    writer.write({ type: 'data-status', id: statusId, data: { status: 'started' } });
    writer.merge(toUIMessageStream({ stream: result.stream }));
  },
  onError: error => `Custom error: ${error.message}`,
  onEnd: ({ messages }) => {
    saveChat({ chatId, messages });
  },
});
return createUIMessageStreamResponse({ stream });
```

**`writer.write(...)` — not `stream.write()`.** Writer also has `writer.merge(ReadableStream)`.

Manual text must use start/delta/end with a stable `id`:

```ts
writer.write({ type: 'text-start', id: 'greeting-text' });
writer.write({ type: 'text-delta', id: 'greeting-text', delta: 'Hello' });
writer.write({ type: 'text-end', id: 'greeting-text' });
```

Data part type **must** be `` `data-${name}` ``. `{ type: 'data' }` in old snippets is stale.

Save **UIMessage[]** in `toUIMessageStream` / `createUIMessageStream` **`onEnd`**, not `streamText.onEnd`. Pass `originalMessages` so `onEnd.messages` is full UI history. Disconnect-safe: `result.consumeStream()` (no await) so the LLM run finishes if the client drops.

For persistence, **generate assistant ids on the server** (`generateMessageId` or manual `{ type: 'start', messageId }` + `sendStart: false`).

Send only the last message:

```ts
prepareSendMessagesRequest({ messages, id }) {
  return { body: { message: messages[messages.length - 1], id } };
}
```

Validate on load: `validateUIMessages({ messages, tools, metadataSchema, dataPartsSchema })`. Soft path: `safeValidateUIMessages`.

Resume streams: `resumable-stream` + Redis + DB `activeStreamId`. Client `resume: true`. POST `createUIMessageStreamResponse({ stream, consumeSseStream })`. GET 204 if none. `DirectChatTransport.reconnectToStream()` always returns `null`. `stop()` / tab close = disconnect; generation continues unless a dedicated cancel endpoint clears `activeStreamId`.

## Transports

| Transport | When |
| --- | --- |
| `DefaultChatTransport` | HTTP chat (default). UI message SSE |
| `TextStreamChatTransport` | Plain text backends. No tools/usage/finishReason |
| `DirectChatTransport` | In-process `ToolLoopAgent`. No HTTP; no reconnect. **Do not put secrets in a browser bundle** |
| `WorkflowChatTransport` (`@ai-sdk/workflow`) | Workflow timeouts; auto GET reconnect |
| Custom `ChatTransport` | WebSockets, etc. Implement `sendMessages` + `reconnectToStream` |

```tsx
useChat({ transport: new DirectChatTransport({ agent, sendReasoning: true }) });
```

## useCompletion / useObject / realtime

**`useCompletion`** still has the legacy shape: managed `input`, `handleSubmit`, `handleInputChange`, **`isLoading`**, `api`/`headers`/`body` on the hook. `streamProtocol`: `'text' | 'data'` (default `data`). Only **text** is exposed as `completion`. `onResponse` removed (v5).

**`useObject`:** `{ api, schema }`. Server: `streamText` + `Output.object` + **text** stream (`createTextStreamResponse` + `toTextStream`). Handle partial `object?.field`. React, Svelte (`StructuredObject`), Vue. No MCP Apps column.

**`experimental_useRealtime`:** browser WebSocket. Mint token on the server (`experimental_realtime.getToken()` / `gateway.experimental_realtime.getToken()`). Messages as `UIMessage[]`. Audio + text + `onToolCall` / `addToolOutput`.

## Framework notes

| Package | Surface vs React |
| --- | --- |
| `@ai-sdk/react` | `useChat`, `useCompletion`, `useObject`, MCP Apps renderer, `experimental_useRealtime`, `throttle` |
| `@ai-sdk/vue` | Reference still documents `useChat`; Nuxt guide uses **`Chat` class**. No MCP Apps |
| `@ai-sdk/svelte` | **`Chat` / `Completion` / `StructuredObject` classes**, not hooks. Svelte 5. No MCP Apps |
| `@ai-sdk/angular` | Classes only |
| `@ai-sdk/solid` | Deprecated |

Svelte/Angular: `new Chat({})` with the same `sendMessage` / `messages` / `parts` model.

Expo: `Content-Type: application/octet-stream` + `Content-Encoding: none`, and **expo fetch** plus a device-aware API URL helper.

TanStack Start file route:

```ts
export const Route = createFileRoute('/api/chat')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const { messages } = await request.json();
        const result = streamText({ /* ... */ });
        return createUIMessageStreamResponse({
          stream: toUIMessageStream({ stream: result.stream }),
        });
      },
    },
  },
});
```

## Generative UI

Not RSC. Server tools return **JSON**; the **client** maps `tool-${name}` + `part.output` to components.

1. Server `execute` — streams as `output-available`
2. Client auto — no `execute`; `onToolCall` + `addToolOutput`
3. Client interactive — buttons; `addToolOutput` on click

```ts
sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
async onToolCall({ toolCall }) {
  if (toolCall.dynamic) return;
  if (toolCall.toolName === 'getLocation') {
    addToolOutput({ tool: 'getLocation', toolCallId: toolCall.toolCallId, output: 'NYC' });
  }
},
```

Always handle approval states even if the tool never asks. Dynamic tools: `part.type === 'dynamic-tool'`. MCP Apps: `experimental_MCPAppRenderer` from `@ai-sdk/react`.

## RSC — do not use in production

`@ai-sdk/rsc` is experimental. Cannot abort server actions; `createStreamableUI` remounts on `.done()` (flicker) and can be quadratic; Next/React-only; weaker attachments/`stopWhen`/telemetry vs UI.

Migrate: `streamUI` in a server action → `streamText` in a **route handler**; `generate:` JSX → `execute:` JSON + client render; `useActions` → `useChat`. Ignore RSC migrate-guide client snippets that still show `handleSubmit` / `message.content` / `toolInvocations`.
