# Providers, middleware, telemetry, testing, errors

## Gateway vs dedicated vs registry

See [setup-packages.md](setup-packages.md) for install and auth. This page covers middleware, telemetry, testing, errors, and Gateway extras.

Default global provider is **Vercel AI Gateway**. String models use `provider/model`. `createGateway` options: `baseURL` (default `https://ai-gateway.vercel.sh/v4/ai`), `apiKey` (env `AI_GATEWAY_API_KEY`; also Vercel PAT / app tokens), `teamIdOrSlug` (multi-team tokens), `headers`, `fetch`, `metadataCacheRefreshMillis` (default 5 min).

Auth precedence: explicit `apiKey` > `AI_GATEWAY_API_KEY` > OIDC. Invalid keys still win over OIDC.

BYOK: attach provider credentials in the Vercel team Gateway settings. No code change. Azure custom deployment names use Gateway model mappings.

Gateway helpers `getCredits`, `getSpendReport`, `getGenerationInfo` need an AI Gateway API key or OIDC — not a Vercel access token.

Gateway also resolves string IDs for experimental evaluation models (`experimental_evaluate`) when no evaluation-capable default provider is configured, and its `has` provider option filters routing by capability (`reasoning`, `tool-use`, structured output, quantization).

### Experimental batches

Experimental; API may change in patch releases. `experimental_startTextBatch` was removed in 7.0.94 and replaced by a provider-generic set: `experimental_startBatch`, `experimental_getBatchStatus`, `experimental_getBatchResults` (async iterable), `experimental_cancelBatch`, `experimental_listBatches` (cursor-paginated). Providers: Anthropic, OpenAI (Responses API), Google (text + image), xAI (text + image), AI Gateway (global default). Cancel/list throw `UnsupportedFunctionalityError` where unsupported.

```ts
import { anthropic } from '@ai-sdk/anthropic';
import {
  experimental_startBatch as startBatch,
  experimental_getBatchResults as getBatchResults,
} from 'ai';

const batch = await startBatch({
  provider: anthropic, // omit for global provider / Gateway
  requests: [
    { id: 'france', type: 'text', model: 'claude-haiku-4-5', prompt: 'Capital of France?' },
  ],
  // webhookUrl: 'https://example.com/api/batch-webhook', // provider-specific; others warn
});
// persist `batch` (serializable reference); poll getBatchStatus until status !== 'pending'

for await (const item of getBatchResults({ provider: anthropic, batch })) {
  if (item.type === 'text' && item.status === 'succeeded') console.log(item.id, item.text);
}
```

- Each request needs a unique `id`, `type: 'text' | 'image'`, and a per-request `model`. Results arrive out of order — join on `id`.
- Text requests accept the usual generation settings and per-request `tools` / `toolChoice`. Client tools are **definition-only** (no `execute`, no follow-up step); pass the same `tools` to `getBatchResults` to validate calls. Provider-executed tools can run where the provider supports them.
- Image requests take `generateImage` settings (`prompt`, `n`, `size`, `aspectRatio`, `seed`).
- Status: `pending` | `completed` | `failed`, plus `requestCounts`, `createdAt`, `expiresAt`, `rawStatus`.

## wrapLanguageModel and built-in middleware

```ts
import {
  wrapLanguageModel,
  extractReasoningMiddleware,
  extractJsonMiddleware,
  simulateStreamingMiddleware,
  defaultInstructionsMiddleware,
  defaultSettingsMiddleware,
  addToolInputExamplesMiddleware,
} from 'ai';
import type { LanguageModelV4Middleware } from 'ai';
```

```ts
wrapLanguageModel({
  model,
  middleware: LanguageModelV4Middleware | LanguageModelV4Middleware[],
});
// array applied as first(second(model))
```

Still labeled experimental on the V4 middleware reference. URL slug may still be `language-model-v2-middleware`. Hooks: `transformParams`, `wrapGenerate`, `wrapStream`, `overrideProvider`, `overrideModelId`, `overrideSupportedUrls`.

| Middleware | Role |
| --- | --- |
| `extractReasoningMiddleware({ tagName, separator?, startWithReasoning? })` | Pull `<tag>…</tag>` into reasoning |
| `extractJsonMiddleware({ transform? })` | Strip ` ```json ` fences for `Output.object()` |
| `simulateStreamingMiddleware()` | Fake stream from non-streaming models |
| `defaultSettingsMiddleware({ settings })` | Defaults; call-site wins; merges `providerOptions` |
| `defaultInstructionsMiddleware({ instructions })` | Only if **no** system message in the normalized prompt |
| `addToolInputExamplesMiddleware({ prefix?, format?, remove? })` | Append `tool.inputExamples` to description. Default `remove: true` |

`defaultInstructionsMiddleware` treats any system message as call-level instructions. Combined with `allowSystemInMessages`, untrusted system messages **suppress defaults**.

Also: `wrapImageModel`, `wrapEmbeddingModel` / `defaultEmbeddingSettingsMiddleware`.

## Telemetry

v7: OpenTelemetry is **not** in `ai`.

```ts
import { registerTelemetry } from 'ai';
import { OpenTelemetry, LegacyOpenTelemetry } from '@ai-sdk/otel';
import { DevToolsTelemetry } from '@ai-sdk/devtools';

registerTelemetry(new OpenTelemetry());
registerTelemetry(DevToolsTelemetry());
```

Once registered, **all calls emit** unless `telemetry: { isEnabled: false }`. Coverage includes `embed` / `embedMany` / `rerank` runtime-context attribution (7.0.98), `experimental_evaluate` (7.0.111), and `generateSpeech` / `transcribe` with provider usage (7.0.124). Tracing-channel context respects the same `include*Context` allowlists (7.0.114).

```ts
telemetry: {
  isEnabled?,          // default true if an integration is registered
  recordInputs?,       // default true
  recordOutputs?,      // default true
  functionId?,
  includeRuntimeContext?: { [key]: true }, // omit = exclude ALL runtimeContext
  includeToolsContext?: { [tool]: { [key]: true } },
  integrations?: Telemetry | Telemetry[],
}
```

`experimental_telemetry` is a deprecated alias. `tracer` on that object **removed** — pass tracer to `new OpenTelemetry({ tracer })`. Prefer GenAI semconv `OpenTelemetry` over `LegacyOpenTelemetry`.

Node tracing channel: `AI_SDK_TELEMETRY_TRACING_CHANNEL` (`ai:telemetry`).

### DevTools (local only)

```sh
bunx @ai-sdk/devtools@latest
# UI http://localhost:4983
```

Stores `.devtools/generations.json` (auto-gitignore). Requires `include: { requestBody: true, responseBody: true }` for raw bodies (`streamText` / `ToolLoopAgent.stream`: request body only). Do not enable in production.

## Testing

```ts
import { generateText, streamText, Output, simulateReadableStream } from 'ai';
import { MockLanguageModelV4, MockEmbeddingModelV4, mockId, mockValues } from 'ai/test';
```

**Not** `MockLanguageModelV3` / V2.

```ts
new MockLanguageModelV4({
  doGenerate: async () => ({
    content: [{ type: 'text', text: 'Hello, world!' }],
    finishReason: { unified: 'stop', raw: undefined },
    usage: {
      inputTokens: { total: 10, noCache: 10, cacheRead: undefined, cacheWrite: undefined },
      outputTokens: { total: 20, text: 20, reasoning: undefined },
    },
    warnings: [],
  }),
});
```

`doStream` chunks: `text-start` → `text-delta` → `text-end` → `finish`. For `Output.object()`, mock **JSON text** in `content` / deltas.

```ts
simulateReadableStream({
  chunks: ['Hello', ' ', 'World'],
  initialDelayInMs: 100, // null = no delay
  chunkDelayInMs: 50,
});
```

## Error catalog

Index: https://ai-sdk.dev/docs/reference/ai-sdk-errors.md. Check with `FooError.isInstance(error)`. v4 removed `isAPICallError`-style aliases. Tool execution failures are **`tool-error` parts**, not a thrown `ToolExecutionError` class.

| Error | When |
| --- | --- |
| `APICallError` / `AI_APICallError` | Provider HTTP failure (`url`, `statusCode`, `isRetryable`, `responseBody`) |
| `RetryError` | Retry wrapper exhausted |
| `EmptyResponseBodyError` | Empty HTTP body |
| `InvalidResponseDataError` | Provider JSON/shape unusable |
| `DownloadError` | Failed download of a remote file the SDK fetches |
| `LoadAPIKeyError` / `LoadSettingError` | Missing key / config |
| `InvalidArgumentError` | Bad call args; v7 also `callOptionsSchema` failures |
| `InvalidPromptError` | Illegal prompt — passing `UIMessage[]` without `await convertToModelMessages()`; v7 system-in-messages unless `allowSystemInMessages` |
| `InvalidMessageRoleError` / `InvalidDataContentError` | Role / file part |
| `MessageConversionError` | UI ↔ model conversion |
| `JSONParseError` / `TypeValidationError` | Parse / schema |
| `InvalidToolInputError` / `NoSuchToolError` | Tool args / unknown tool |
| `InvalidToolApprovalError` / `InvalidToolApprovalSignatureError` / `ToolCallNotFoundForApprovalError` | Approval payload |
| `ToolCallRepairError` | `repairToolCall` failed |
| `NoObjectGeneratedError` | Structured object missing/unparsable |
| `NoOutputGeneratedError` | `result.output` getter when final step didn't produce output |
| `NoContentGeneratedError` | No content |
| `NoImageGeneratedError` / `NoSpeechGeneratedError` / `NoTranscriptGeneratedError` / `NoTranslationGeneratedError` / `NoVideoGeneratedError` | Matching generate* empty |
| `NoSuchModelError` / `NoSuchProviderError` / `NoSuchProviderReferenceError` | Registry/gateway lookup |
| `TooManyEmbeddingValuesForCallError` | `embedMany` over limit |
| `UIMessageStreamError` | UI stream protocol/parse |
| `UnsupportedFunctionalityError` | Feature not supported |
| `StreamProviderError` | Mid-stream provider error (v7.0.80+); retry with `streamRetries` (7.0.91+) |
| `ToolChoiceViolationError` | Response ignored an enforced `toolChoice` (`'required'` / specific tool) |
| `Experimental_EvaluationUnsupportedQuestionTypeError` | `experimental_evaluate` question type unsupported by the evaluation model |
| `UnsupportedModelVersionError` | Provider spec too old vs `ai` major — bump `@ai-sdk/*` |

streamText: errors in **`stream` as `error` parts**; `textStream` hides them. Always set `onError`. Abort does not call `onEnd`.

## Advanced ops

- **Stop streams:** `abortSignal` / `result.consumeStream` / client `stop()`. Resumable chat: `stop()` is disconnect — see [ui-chat.md](ui-chat.md).
- **Backpressure:** consume `streamText` promptly. Unconsumed streams stall.
- **Caching:** language-model middleware wrapping (cookbook caching-middleware); provider prompt cache via `providerOptions` (Anthropic `cacheControl`).
- **Rate limiting:** application-level (not built into Core). Cookbook uses KV/edge config.
- **Secure URL fetching:** `experimental_download` to control which URLs the SDK fetches. Gateway/MCP HTTP `redirect: 'error'` by default (SSRF).
- **`providerOptions`:** keyed by provider id on the call, message, or part. Gateway strings still use `openai` / `anthropic` keys.

## First-party provider index

Language: xAI, OpenAI, Azure, Anthropic, Anthropic-on-AWS, Amazon Bedrock, Groq, Google, Google Vertex, Mistral, Together, Cohere, Fireworks, DeepSeek, Moonshot, Alibaba, MiniMax, Cerebras, Hugging Face, Baseten, DeepInfra, Perplexity, Open Responses, GMI Cloud, QuiverAI.

Image / video specialists: Fal, Black Forest Labs, Replicate, Prodia, Luma, ByteDance, Kling.

Audio: AssemblyAI, Deepgram, Gladia, Rev.ai, ElevenLabs, Cartesia, Fish Audio, LMNT, Hume.

Embeddings extra: Voyage AI.

OpenAI-compatible community providers: https://ai-sdk.dev/providers/openai-compatible-providers.md.

Capability checkmarks on the providers table are stripped in Markdown conversion — open the HTML page or provider page. Do not assume image-input/tool-streaming from this skill's table.
