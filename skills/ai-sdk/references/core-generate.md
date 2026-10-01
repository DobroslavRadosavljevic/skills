# Core: generateText and streamText

Imports from `'ai'` unless noted. Full call tables: https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-text.md and https://ai-sdk.dev/docs/reference/ai-sdk-core/stream-text.md.

## Shared call shape

```ts
import { generateText, streamText, isStepCount } from 'ai';

await generateText({
  model, // LanguageModel | gateway string 'provider/model'
  instructions?, // string | system ModelMessage | array. Was `system`.
  prompt?, // string | ModelMessage[]
  messages?, // ModelMessage[] — not together with prompt
  allowSystemInMessages?, // default false
  tools?,
  toolChoice?, // default 'auto'
  activeTools?,
  toolOrder?,
  toolApproval?,
  output?, // Output.* ; default Output.text()
  maxOutputTokens?,
  temperature?, // no SDK default (not 0) since v5
  topP?,
  topK?,
  presencePenalty?,
  frequencyPenalty?,
  stopSequences?,
  seed?,
  reasoning?, // 'provider-default' | 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
  maxRetries?, // default 2; 0 disables
  abortSignal?,
  timeout?, // number ms, or { totalMs, stepMs, firstChunkMs, chunkMs, toolMs, tools: { weatherMs: 3000 } }
  headers?,
  telemetry?,
  providerOptions?,
  stopWhen?, // default isStepCount(1)
  prepareStep?,
  runtimeContext?,
  toolsContext?,
  include?, // { requestBody, requestMessages, responseBody } default false
  repairToolCall?,
  // lifecycle: onStart, onStepStart, onLanguageModelCallStart/End,
  //            onToolExecutionStart/End, onStepEnd, onEnd
});
```

`streamText` adds `experimental_transform`, `onChunk`, `onError`, `onAbort`, `include.rawChunks`, and `streamRetries` (7.0.91+).

Do **not** mix `prompt` and `messages`. Convert UI chat with `await convertToModelMessages(uiMessages)`.

## generateText result (sync fields, not promises)

| Field | Meaning |
| --- | --- |
| `text` | Final-step text parts concatenated (`''` if none) |
| `content` | All steps |
| `output` | Getter; throws `NoOutputGeneratedError` if missing (destructure also throws) |
| `files` `sources` `toolCalls` `toolResults` | **All steps** |
| `staticToolCalls` / `dynamicToolCalls` | All steps |
| `finishReason` | `'stop' \| 'length' \| 'content-filter' \| 'tool-calls' \| 'error' \| 'other'` |
| `usage` | **Sum of all steps** (old `totalUsage` is deprecated) |
| `steps` / `finalStep` | `finalStep === steps.at(-1)` |
| `responseMessages` | Accumulated model messages to persist |
| `warnings` | All steps |
| `finalStep.performance` | `stepTimeMs`, `responseTimeMs`, `toolExecutionMs`, `effectiveOutputTokensPerSecond` |

Deprecated top-level: `reasoning`, `reasoningText`, `request`, `response`, `providerMetadata` → use `finalStep.*`.

## streamText result

Must **consume** the stream or it stalls.

```ts
const result = streamText({
  model,
  prompt: '...',
  onError({ error }) {
    console.error(error);
  },
});

for await (const textPart of result.textStream) process.stdout.write(textPart);
await result.consumeStream({ onError });
```

| Access | Notes |
| --- | --- |
| `textStream` | Text deltas only. **No error parts.** Always set `onError` or use `stream`. |
| `stream` | Full `TextStreamPart` stream. Replaces `fullStream`. |
| `fullStream` | **Deprecated** alias of `stream`. |
| `partialOutputStream` | Unvalidated partial `Output.object` |
| `elementStream` | `Output.array()` only — complete validated elements |
| Promises `text`, `output`, `usage`, `steps`, `finalStep`, `responseMessages`, … | Auto-consume |

### HTTP helpers (v7)

Result methods `toUIMessageStream`, `toUIMessageStreamResponse`, `toTextStreamResponse`, `pipe*ToResponse` are **deprecated**. Use:

```ts
import {
  streamText,
  toUIMessageStream,
  createUIMessageStreamResponse,
  toTextStream,
  createTextStreamResponse,
} from 'ai';

const result = streamText({ model, prompt, onError({ error }) { console.error(error); } });

return createUIMessageStreamResponse({
  stream: toUIMessageStream({ stream: result.stream, originalMessages }),
});
```

Text-only (`useObject` / `useCompletion` text protocol):

```ts
return createTextStreamResponse({
  stream: toTextStream({ stream: result.stream }),
});
```

Node `ServerResponse`: `pipeUIMessageStreamToResponse({ response, stream })`.

Behind reverse proxies that kill idle connections, pass `keepAliveMs` (7.0.123+) to `createUIMessageStreamResponse`, `pipeUIMessageStreamToResponse`, `createAgentUIStreamResponse`, or `pipeAgentUIStreamToResponse`: it sends an SSE comment immediately and after each idle interval. Response streams are cancelled when the client disconnects (7.0.119+).

`toUIMessageStream` options: `originalMessages`, `generateMessageId`, `onEnd` (`onFinish` deprecated alias), `messageMetadata`, `sendReasoning` (default **false**), `sendSources` (false), `sendFinish`/`sendStart` (true), `onError` default `"An error occurred."`, `consumeSseStream`.

### Stream parts (`result.stream` / `onChunk`)

Canonical delta types from generating-text: `start`, `start-step`, `text-start`, `text-delta`, `text-end`, `reasoning-start`, `reasoning-delta`, `reasoning-end`, `file`, `source`, `tool-call`, `tool-input-start`, `tool-input-delta`, `tool-input-end`, `tool-result`, `tool-error`, `tool-output-denied`, `tool-approval-request`, `tool-approval-response`, `finish-step`, `finish`, `abort`, `error`, `raw`.

Some pages still say `type: 'text'` / `tool-call-delta`. Inspect `part.type` at runtime; prefer `text-delta` + `chunk.text` in `onChunk`.

Network failures **throw**. Well-formed provider errors appear as `error` parts (`StreamProviderError`). Abort: `type: 'abort'` + `onAbort({ steps, callId, reason })` (call ID and abort reason since 7.0.92). **`onEnd` is not called on abort.**

### Stream retries (7.0.91+)

`maxRetries` only covers failures while **starting** a model call. To retry well-formed provider error events that arrive **after** streaming began, set `streamRetries`:

```ts
const result = streamText({
  model,
  prompt,
  streamRetries: 2, // automatic retries of the failed step
  onError: ({ error }) => (isTransient(error) ? { retry: true } : undefined),
});
```

- Omit `streamRetries` to disable all stream recovery (default behavior). `streamRetries: 0` allows only one callback-directed retry via `onError` returning `{ retry: true }`.
- Only the failed step reruns; earlier steps and tool results are not replayed. Tool calls/approvals from the failed attempt are discarded.
- Text/reasoning already streamed from the failed attempt cannot be retracted — consumers may see repeated partial output. Final results and response messages contain only the successful attempt.

### Smooth streaming

```ts
import { smoothStream, streamText } from 'ai';

streamText({
  model,
  prompt,
  experimental_transform: smoothStream({
    delayInMs: 20, // default 10
    chunking: 'line', // default 'word'; also RegExp | Intl.Segmenter
  }),
});
```

Word chunking is poor for CJK/Thai/Vietnamese — use `Intl.Segmenter`. Docs sometimes call the option `transform`; the parameter is still `experimental_transform`.

## Prompts

Three inputs:

1. `prompt: string`
2. `prompt: ModelMessage[]` or `messages: ModelMessage[]`
3. `instructions` — system behavior, **not** a message in the array

v7 **rejects** `role: 'system'` in `prompt`/`messages` by default. Use `instructions`, or `allowSystemInMessages: true` for trusted persisted histories (prompt-injection risk). `system` is a deprecated alias of `instructions`; if both set, **`instructions` wins**.

```ts
await generateText({
  model,
  instructions: 'You are a professional writer.',
  prompt: `Summarize: ${article}`,
});
```

Cache breakpoint via message-shaped instructions:

```ts
instructions: {
  role: 'system',
  content: 'Cached system message',
  providerOptions: { anthropic: { cacheControl: { type: 'ephemeral' } } },
}
```

### ModelMessage roles

| Role | Content |
| --- | --- |
| `system` | string (blocked unless `allowSystemInMessages`) |
| `user` | string **or** `Array<TextPart \| FilePart>` |
| `assistant` | string **or** text/file/reasoning/tool-call parts |
| `tool` | `ToolResultPart[]` |

User image / PDF / audio — **file parts**, not `{ type: 'image' }`:

```ts
{
  role: 'user',
  content: [
    { type: 'text', text: 'Describe the image.' },
    {
      type: 'file',
      mediaType: 'image/png', // or 'image', 'application/pdf', 'audio/mpeg'
      data: fs.readFileSync('./cat.png'), // string | Uint8Array | ArrayBuffer | Buffer | URL | https string
      filename: 'cat.png',
    },
  ],
}
```

Tool result `output` is structured (`{ type: 'json', value }`, `{ type: 'text', value }`, `{ type: 'content', value: [...] }`). Deprecated tool-result `type: 'media'` → `'file-data'`.

`experimental_download`: custom URL fetch. Default downloads when the model does not accept URLs. Return `null` to pass the URL through.

## Settings

Prefer **either** `temperature` **or** `topP`. Unsupported settings land in `warnings[]`. For tools/structured output, docs often use `temperature: 0`. OpenAI strict schemas: Zod **`.nullable()` not `.optional()`**.

`timeout`:

```ts
timeout: 5000
timeout: {
  totalMs, stepMs,
  firstChunkMs, // streamText: time to first content chunk
  chunkMs,      // stall between chunks
  toolMs,       // default tool execute timeout → tool-error
  tools: { weatherMs: 3000 },
}
```

`timeout` + `abortSignal`: abort on either.

### stopWhen

Default **`isStepCount(1)`** — no tool loop. Helpers from `'ai'`: `isStepCount`, `hasToolCall`, `isLoopFinished`. Array = OR. **`stepCountIs` was renamed to `isStepCount` in v7.**

Loop also stops when finish reason is not `tool-calls`, an invoked tool has no `execute`, or a tool needs manual approval.

### prepareStep

Runs before each LLM call. Return a partial override:

```ts
prepareStep: ({
  stepNumber, steps, model, instructions, initialInstructions,
  messages, runtimeContext, toolsContext,
}) => ({
  model?, maxOutputTokens?, temperature?, toolChoice?, activeTools?, toolOrder?,
  instructions?, messages?, runtimeContext?, toolsContext?,
  experimental_sandbox?, providerOptions?,
})
```

v7: `instructions` and `messages` returned from `prepareStep` **carry forward** until overridden (v6 was one-shot). Restore:

```ts
prepareStep: ({ stepNumber, initialInstructions }) => ({
  instructions: stepNumber === 0 ? 'special' : initialInstructions,
})
```

Compaction: `pruneMessages({ messages, reasoning: 'all', toolCalls: 'before-last-3-messages', emptyMessages: 'remove' })`.

`experimental_sandbox` override is **this step only**.

## Reasoning

```ts
reasoning?: 'provider-default' | 'none' | 'minimal' | 'low' | 'medium' | 'high' | 'xhigh'
```

Omitted = provider default. Providers that don't support it warn and ignore.

**Never merged with `providerOptions`.** If `providerOptions` contains effort/budget (`openai.reasoningEffort`, `anthropic.thinking`, `google.thinkingConfig.thinkingBudget`), those **win** and `reasoning` is ignored. Non-effort extras (`reasoningSummary`, `includeThoughts`) may sit beside `reasoning`.

Read `result.finalStep.reasoning` / `finalStep.reasoningText`. Top-level aliases are deprecated.

Tag extraction for models that wrap thinking in XML:

```ts
import { wrapLanguageModel, extractReasoningMiddleware } from 'ai';

wrapLanguageModel({
  model,
  middleware: extractReasoningMiddleware({ tagName: 'think' }),
});
```

## Lifecycle (stable names)

Order: `onStart` → `onStepStart` → `onLanguageModelCallStart` → `onLanguageModelCallEnd` → (`onToolExecutionStart` → `onToolExecutionEnd`)* → `onStepEnd` → (repeat) → `onEnd`.

`streamText` extra: `onChunk`, `onError`, `onAbort`. Abort skips `onEnd`.

| Old | v7 |
| --- | --- |
| `onFinish` / `experimental_onFinish` | `onEnd` |
| `onStepFinish` / `experimental_onStepFinish` | `onStepEnd` |
| `experimental_onStart` | `onStart` |
| `experimental_onToolCallStart/Finish` | `onToolExecutionStart/End` |

Deprecated aliases still fall back if the new name is omitted. Errors **inside callbacks are swallowed**. Keep them fast.

`onEnd.usage` is **all steps** (migration + lifecycle). Last step: `event.finalStep.usage`.

## Defaults that bite

| Option | Default |
| --- | --- |
| `stopWhen` | `isStepCount(1)` |
| `maxRetries` | `2` |
| `toolChoice` | `'auto'` |
| `allowSystemInMessages` | `false` |
| `include.*` | `false` |
| `temperature` | **unset** (provider default; not 0) |
| UI `sendReasoning` / `sendSources` | `false` |

## Evaluation (experimental, 7.0.103+)

`experimental_evaluate` answers named `choice` / `score` / `boolean` questions about one shared `state` (string, JSON object, or array) with an evaluation model. Use it for triage, grading, and guardrail checks instead of hand-rolled `Output.choice` prompts when an evaluation model is available. API may change in patch releases.

```ts
import { experimental_evaluate } from 'ai';
import { openai } from '@ai-sdk/openai';

const { answers } = await experimental_evaluate({
  model: openai.evaluationModel(MODEL_ID), // or registry.evaluationModel('alias:id') or a Gateway string
  state: { message },
  questions: {
    department: {
      type: 'choice',
      instructions: 'Which team should handle this?',
      criteria: { billing: 'Payments and refunds', support: 'Other requests' },
    },
    severity: { type: 'score', instructions: 'How severe?', criteria: ['Cosmetic', 'Workaround exists', 'Blocking'] },
    requestsRefund: { type: 'boolean', instructions: 'Is the customer asking for money back?' },
  },
});
answers.department.choice; // 'billing' | 'support'
```

- Providers expose `evaluationModel(...)` (TypeSafe AI native Jev; OpenAI, Anthropic, Google via structured-output adapters that request `reasoning: 'none'` by default — override via `providerOptions`). Boolean answers carry an uncalibrated probability.
- `customProvider({ evaluationModels })` + `createProviderRegistry` give aliases; string IDs resolve through Gateway unless an evaluation-capable default provider is configured.
- Callbacks: `experimental_onEvaluateStart` / `End`, `experimental_onEvaluationModelCallStart` / `End`. Unsupported question types throw `Experimental_EvaluationUnsupportedQuestionTypeError`.
