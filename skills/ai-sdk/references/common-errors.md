# Common errors (wrong → right for AI SDK 7)

Grep this file for the failing symbol before searching source. Examples use gateway strings; dedicated providers are also valid. `isStepCount` is the v7 name (`stepCountIs` is v5/v6).

## `maxTokens` → `maxOutputTokens`

```ts
// Wrong
await generateText({ model, maxTokens: 512, prompt });

// Right
await generateText({ model, maxOutputTokens: 512, prompt });
```

## `maxSteps` / `stepCountIs` → `stopWhen: isStepCount(n)`

```ts
// Wrong
await generateText({ model, tools, maxSteps: 5, prompt });
await generateText({ model, tools, stopWhen: stepCountIs(5), prompt });

// Right
import { generateText, isStepCount } from 'ai';
await generateText({ model, tools, stopWhen: isStepCount(5), prompt });
```

`useChat({ maxSteps })` is gone. Loop on the server with `stopWhen`. Client auto-continue: `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls`.

## `parameters` → `inputSchema`

```ts
// Wrong
tool({ description, parameters: z.object({ location: z.string() }), execute });

// Right
tool({ description, inputSchema: z.object({ location: z.string() }), execute });
```

## `generateObject` / `streamObject` → `Output.*`

```ts
// Wrong
import { generateObject } from 'ai';
const { object } = await generateObject({ model, schema, prompt });

// Right
import { generateText, Output } from 'ai';
const { output } = await generateText({
  model,
  output: Output.object({ schema }),
  prompt,
});
```

`Output.array({ element })`, `Output.choice({ options })`, `Output.json()`. Do not hand-parse JSON from `result.text`.

## `experimental_output` → `output`

Removed in v7. `result.experimental_output` is gone. Use `output` / `result.output`.

## `system` → `instructions`

```ts
// Wrong
await generateText({ model, system: 'Be concise.', prompt });
await generateText({
  model,
  messages: [{ role: 'system', content: 'Be concise.' }, { role: 'user', content: prompt }],
});

// Right
await generateText({ model, instructions: 'Be concise.', prompt });
// Trusted persisted histories only:
await generateText({ model, allowSystemInMessages: true, messages });
```

## `CoreMessage` → `ModelMessage`

```ts
import type { ModelMessage } from 'ai';
const modelMessages = await convertToModelMessages(uiMessages);
```

`convertToCoreMessages` is gone. Always **`await`** `convertToModelMessages`.

## `{ type: 'image' }` → `{ type: 'file', mediaType: 'image', data }`

## `toDataStreamResponse` / result `toUIMessageStreamResponse` → standalone helpers

```ts
// Wrong (v4)
return result.toDataStreamResponse();
// Wrong for new v7 code (deprecated)
return result.toUIMessageStreamResponse();

// Right
import { createUIMessageStreamResponse, toUIMessageStream } from 'ai';
return createUIMessageStreamResponse({
  stream: toUIMessageStream({ stream: result.stream, originalMessages: messages }),
});
```

Text-only: `createTextStreamResponse({ stream: toTextStream({ stream: result.stream }) })`.

## `fullStream` → `stream`

```ts
for await (const part of result.stream) { /* part.type */ }
```

## `onFinish` / `onStepFinish` (Core) → `onEnd` / `onStepEnd`

`useChat` still uses `onFinish`. `toUIMessageStream` / `createUIMessageStream` / `streamText` use `onEnd`.

## `useChat` managed input / `api` / `isLoading`

```tsx
// Wrong
const { input, handleInputChange, handleSubmit, isLoading } = useChat({ api: '/api/chat' });

// Right
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';
const [input, setInput] = useState('');
const { sendMessage, status, stop } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
sendMessage({ text: input });
status === 'submitted' || status === 'streaming';
```

Also gone on the hook: `onResponse`, `body`, `headers`, `credentials` (move to transport or `sendMessage` 2nd arg), `initialMessages` → `messages`, `append` → `sendMessage`, `reload` → `regenerate`.

## `message.content` / `tool-invocation`

```tsx
// Wrong
message.content;
part.type === 'tool-invocation';
part.toolInvocation.args;
part.toolInvocation.result;
part.toolInvocation.state === 'call'; // or 'result' / 'partial-call'

// Right
message.parts.map(part => {
  if (part.type === 'text') return part.text;
  if (part.type === 'tool-getWeather' && part.state === 'output-available') {
    return part.output;
  }
});
```

States: `input-streaming` | `input-available` | `approval-requested` | `approval-responded` | `output-available` | `output-error` | `output-denied`. Dynamic: `part.type === 'dynamic-tool'`.

## `addToolResult` → `addToolOutput`

```ts
addToolOutput({ tool: 'askForConfirmation', toolCallId: part.toolCallId, output: 'Yes' });
```

## `createAgentUIStreamResponse({ messages })` → `uiMessages`

```ts
return createAgentUIStreamResponse({ agent, uiMessages: messages });
```

## `Experimental_Agent` / `Agent.generateText`

```ts
import { ToolLoopAgent } from 'ai';
const agent = new ToolLoopAgent({ model, instructions, tools, stopWhen: isStepCount(20) });
await agent.generate({ prompt });
agent.stream({ prompt });
```

## `needsApproval` on tools (in-memory agents)

```ts
// Wrong for generateText / streamText / ToolLoopAgent
tool({ needsApproval: true, ... });

// Right
toolApproval: { runCommand: 'user-approval' }
```

`WorkflowAgent` still uses `needsApproval` on `tool()`.

## `experimental_context` → `runtimeContext` + `toolsContext`

Tool `execute` options: `context` (that tool’s `contextSchema`), not `experimental_context`.

## `writer.write` vs `stream.write`

In `createUIMessageStream`, use `writer.write()` / `writer.merge()`, not `stream.write()`.

## `MockLanguageModelV2` / `V3` → `V4`

```ts
import { MockLanguageModelV4 } from 'ai/test';
```

## `from 'ai/react'` → `@ai-sdk/react`

## `valibotSchema` from `'ai'` → `@ai-sdk/valibot`

## `registerTelemetry` vs OTel in `ai`

```ts
import { registerTelemetry } from 'ai';
import { OpenTelemetry } from '@ai-sdk/otel';
registerTelemetry(new OpenTelemetry());
```

Do not pass `tracer` on `telemetry` options.

## Passing `UIMessage[]` to `streamText`

Always `messages: await convertToModelMessages(messages)`. Direct UI messages throw `InvalidPromptError`.

## Tools + `Output` with default `stopWhen`

Raise `stopWhen: isStepCount(n)` — structured output is an extra step.

## `textStream` “swallows” errors

Set `onError` or iterate `result.stream`. Consume the stream or it stalls.

## `result.output` throws

Getter. Catch `NoOutputGeneratedError` when the last finish reason is `tool-calls`.

## `reasoning` + `providerOptions` effort

Not merged. ProviderOptions effort/budget wins and `reasoning` is ignored. Read `finalStep.reasoning`.

## Zod `.optional()` on OpenAI strict tool fields

Use `.nullable()`.

## CJS / old Node

v7 is ESM-only and Node ≥22.
