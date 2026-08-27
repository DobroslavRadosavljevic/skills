# Migration (v4 → v7)

Do not collapse majors. Run codemods **per jump**. From v5, do **not** run `upgrade` (it includes v4); run `v6` then `v7`.

```sh
bunx @ai-sdk/codemod v5
bunx @ai-sdk/codemod v6
bunx @ai-sdk/codemod v7
bunx @ai-sdk/codemod v7/rename-system-to-instructions src/
```

Guides: https://ai-sdk.dev/docs/migration-guides.md · 5.0 / 6.0 / 7.0 pages under `/docs/migration-guides/`.

## Package majors

| AI SDK | `ai` | `@ai-sdk/provider` | `@ai-sdk/provider-utils` | typical `@ai-sdk/openai` / react | LM spec | Node |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | 4.x | 1.x | 2.x | 1.x | V1 | 18+ |
| 5 | 5.x | 2.x | 3.x | 2.x | V2 | 18+ |
| 6 | 6.x | 3.x | 4.x | 3.x | V3 | 18+ |
| 7 | 7.x | 4.x | 5.x | 4.x (`@ai-sdk/rsc@3.x`) | V4 | **≥22**, ESM-only |

npm dist-tags: `latest` = 7.x, `ai-v6`, `ai-v5`.

## Symbol table (requested names)

| Topic | v4 | **v5** | **v6** | **v7** |
| --- | --- | --- | --- | --- |
| `generateObject` / `streamObject` | Stable | Primary structured API | **Deprecated.** Prefer `Output.object`. Result `object` → `output` | Still present, still deprecated. **Not removed.** |
| `experimental_output` | Early experimental | On `generateText` | Renamed to `output` (alias) | **Removed.** Use `output` / `result.output` |
| `maxSteps` | Introduced (replaces roundtrips) | Core → `stopWhen: stepCountIs(n)`. UI `useChat({ maxSteps })` **removed** | ToolLoopAgent default 20 steps | Helper **`stepCountIs` → `isStepCount`** |
| `parameters` (tools) | Current | → **`inputSchema`**. Stream `args`/`result` → `input`/`output` | `toModelOutput({ output })` | — |
| `CoreMessage` | Current | → `ModelMessage`. `convertToCoreMessages` → `convertToModelMessages` | **Removed.** `convertToModelMessages` is **async** | — |
| `toDataStreamResponse` | Current | → `toUIMessageStreamResponse` | still that | **Deprecated on result.** Prefer `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })` |
| `Experimental_Agent` | n/a | Introduced. `system`, default 1 step, `.generate()`/`.stream()` | **`ToolLoopAgent`**. Default **20** steps | `instructions`; `onFinish` → `onEnd` |
| `useChat` `api` / `handleSubmit` / `isLoading` | Current | Transport rewrite. `sendMessage({ text })`. `status` enum. No managed input | Approval states added | Vue `Chat` class; React stays hooks |
| `agent.generateText` | n/a | Never existed — `.generate()` / `.stream()` | same | HTTP: `createAgentUIStreamResponse({ uiMessages })` |
| LanguageModel V* | V1 | **V2 required** | **V3** | **V4.** `MockLanguageModelV4` from `ai/test` |
| RSC | `render` gone; `streamUI` | Experimental | Experimental | Still experimental (`@ai-sdk/rsc@3`). Prefer UI |

## Other high-signal v5

- `maxTokens` → `maxOutputTokens`
- Input `providerMetadata` → `providerOptions` (output still `providerMetadata`)
- `experimental_toToolResultContent` → `toModelOutput`
- UIMessage `.content` → `.parts`; `data` role removed
- File parts `.data`/`.mimeType` → `.url`/`.mediaType` on UI; core user images → file parts
- `useAssistant` → `useChat`
- `append` → `sendMessage`; `reload` → `regenerate`
- Temperature no longer defaults to `0`

## Other high-signal v6

- `textEmbeddingModel` → `embeddingModel`
- `ToolCallOptions` → `ToolExecutionOptions`
- `cachedInputTokens` / `reasoningTokens` deprecated on usage
- Finish reason `unknown` → `other`
- Per-tool `strict: true`
- `name` on `tool()` illegal for function tools
- `AI_SDK_LOG_WARNINGS=false`

## v7 breaking (not just aliases)

- Node ≥22, ESM-only
- `system` → `instructions` (alias kept). **System messages in `messages`/`prompt` rejected by default**
- `prepareStep` `instructions` **and** `messages` overrides **carry forward** (v6 was current-step-only)
- `onFinish` → `onEnd`; `onStepFinish` → `onStepEnd`; experimental lifecycle names stabilized
- `experimental_telemetry` → `telemetry`. OTel moved to `@ai-sdk/otel`; `registerTelemetry(...)`. Opt-out once registered
- `fullStream` → `stream`
- `experimental_include` → `include`. Request/response bodies **excluded by default**
- `usage` is now **all steps**; old final-step usage is `finalStep.usage`. Same accumulation for `content` / `toolCalls` / `files` / `warnings`
- `step.response.messages` is per-step; full history is `result.responseMessages`
- `experimental_context` → `runtimeContext` + `toolsContext` + tool `contextSchema`
- `needsApproval` → `toolApproval` (WorkflowAgent keeps `needsApproval`)
- Removed: `experimental_customProvider`, `experimental_generateImage`, `experimental_prepareStep`, `experimental_activeTools`, `experimental_output`
- `experimental_transcribe` → `transcribe`; `experimental_generateSpeech` → `generateSpeech` (aliases kept)
- `CallSettings` → `LanguageModelCallOptions` & `RequestOptions`
- MCP HTTP `redirect` default `'follow'` → **`'error'`**
- Image message parts → `file` with `mediaType: 'image'`
- Tool result `media` → `file-data`
- `createAgentUIStreamResponse` takes **`uiMessages`**, not `messages`

## v7 codemod names

`remove-experimental-custom-provider`, `remove-experimental-generate-image`, `replace-experimental-output-with-output`, `remove-experimental-prepare-step`, `replace-cached-input-tokens`, `replace-reasoning-tokens`, `remove-experimental-active-tools`, `remove-tool-call-options-type`, `remove-is-tool-or-dynamic-tool-uipart`, `remove-media-content-part-type`, `rename-experimental-transcribe`, `rename-experimental-generate-speech`, `rename-call-settings-type`, `rename-step-count-is`, `rename-system-to-instructions`, `rename-experimental-on-start-to-on-start`, `rename-on-finish-to-on-end`, `rename-on-step-finish-to-on-step-end`, `rename-experimental-telemetry-to-telemetry`, `rename-full-stream-to-stream`, `move-include-raw-chunks-to-include`, `rename-experimental-on-tool-call-start-to-on-tool-execution-start`, `rename-experimental-context-to-context`, `replace-image-message-part-with-file`, plus several `rename-experimental-*` variants listed in migration-guide-7-0.

Codemods miss some UI (`isLoading` → `status`) and telemetry field moves — hand-edit using [common-errors.md](common-errors.md).

v5 also shipped a migration MCP server (`ai-sdk-5-migration-mcp-server`). Upstream extra skill: `migrate-ai-sdk-v6-to-v7`.

## Hallucination scan after a bump

Grep for: `maxSteps`, `maxTokens`, `generateObject`, `streamObject`, `parameters:`, `CoreMessage`, `convertToCoreMessages`, `toDataStreamResponse`, `useChat({ api`, `handleSubmit`, `isLoading`, `initialMessages`, `message.content`, `tool-invocation`, `Experimental_Agent`, `agent.generateText`, `stepCountIs`, `system:`, `experimental_output`, `experimental_context`, `needsApproval`, `fullStream`, `onFinish`, `onStepFinish`, `MockLanguageModelV2`, `MockLanguageModelV3`, `from 'ai/react'`.
