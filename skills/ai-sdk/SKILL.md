---
name: ai-sdk
description: "Build, review, debug, migrate, or plan Vercel AI SDK 7 TypeScript (package ai, currently 7.0.x). Use for generateText, streamText, Output.object/array/choice/json, tool, dynamicTool, ToolLoopAgent, HarnessAgent, WorkflowAgent, useChat, useCompletion, useObject, DefaultChatTransport, convertToModelMessages, UIMessage, ModelMessage, MCP, embeddings, rerank, generateImage, generateSpeech, transcribe, generateVideo, AI Gateway, wrapLanguageModel, telemetry, DevTools, and v5/v6/v7 migrations including maxSteps, generateObject, CoreMessage, toDataStreamResponse, system, and stepCountIs."
---

# AI SDK

Use this skill for Vercel AI SDK **7.x** (`ai@latest`, currently **7.0.83**). Dist-tags `ai-v6` and `ai-v5` pin previous majors. Node **≥22**. ESM only. Peer **zod** `^3.25.76 || ^4.1.8`.

Do not trust training data or older snippets for this SDK. APIs rename across majors. Verify against the installed `ai` version, bundled `node_modules/ai/docs/` / `node_modules/ai/src/` when present, or current [ai-sdk.dev](https://ai-sdk.dev/) Markdown pages (append `.md`). Snapshot and lookup: [source-map.md](references/source-map.md).

Python `ai` on PyPI is a separate product. This skill is TypeScript npm `ai`.

## Workflow

1. Inspect the local surface:
   - Exact versions / dist-tags for `ai`, `@ai-sdk/react` (or vue/svelte/angular), provider packages, `@ai-sdk/mcp`, `@ai-sdk/gateway`, `@ai-sdk/otel`, `@ai-sdk/devtools`, harness/workflow packages.
   - Runtime: Node version, ESM vs leftover CJS, framework (Next App Router, TanStack Start, Nuxt, SvelteKit, Expo, Node HTTP, none).
   - Existing call sites: `generateText` / `streamText` / `ToolLoopAgent` / `useChat` / RSC / gateway strings vs dedicated providers.
2. Refresh docs when the installed major differs from this snapshot, or the task touches agents, UI streams, MCP, harnesses, or a migration. Start from [source-map.md](references/source-map.md).
3. Route by concern (load only what the task needs):
   - Install, packages, Node/ESM, choosing a provider: [setup-packages.md](references/setup-packages.md)
   - `generateText` / `streamText`, prompts, settings, reasoning, lifecycle: [core-generate.md](references/core-generate.md)
   - `Output.*`, schemas: [structured-output.md](references/structured-output.md)
   - `tool` / `dynamicTool`, `stopWhen`, MCP, approvals, context: [tools.md](references/tools.md)
   - `ToolLoopAgent`, memory, subagents, WorkflowAgent, TUI: [agents.md](references/agents.md)
   - `HarnessAgent`, adapters, sandbox, harness skills: [harnesses.md](references/harnesses.md)
   - `useChat` / `useCompletion` / `useObject`, transports, frameworks: [ui-chat.md](references/ui-chat.md)
   - `UIMessage` / `ModelMessage`, parts, stream protocol: [ui-messages.md](references/ui-messages.md)
   - Embed, rerank, image, speech, transcription, video, files, realtime: [multimodal.md](references/multimodal.md)
   - Gateway, registry, middleware, telemetry, testing, errors: [providers-middleware.md](references/providers-middleware.md)
   - v4→v7 rename table and codemods: [migration.md](references/migration.md)
   - Copy-paste wrong→right API pairs: [common-errors.md](references/common-errors.md)
4. Match the project's provider choice (gateway string vs `@ai-sdk/<provider>`). Do not force AI Gateway when the repo already uses dedicated providers.
5. Typecheck after changes. Grep [common-errors.md](references/common-errors.md) for the failing symbol before inventing APIs.

## Core Judgment

- **Default loop is one step.** `generateText` / `streamText` use `stopWhen: isStepCount(1)` unless raised. `ToolLoopAgent` defaults to `isStepCount(20)`.
- **Tools + structured output need extra steps.** Generating `Output.object()` counts as a step. Raise `stopWhen`.
- **Prompts:** top-level `instructions` (not `system`). Do not put `role: 'system'` in `messages` unless `allowSystemInMessages: true` (trusted histories only).
- **Do not mix `prompt` and `messages`.** Convert UI history with `await convertToModelMessages(messages)` before `streamText`.
- **Chat HTTP (v7):** `createUIMessageStreamResponse({ stream: toUIMessageStream({ stream: result.stream }) })`. Do not use `toDataStreamResponse`. `result.toUIMessageStreamResponse()` is deprecated.
- **Consume `streamText`.** Unconsumed streams stall. `textStream` hides errors — set `onError` or iterate `result.stream`. Abort skips `onEnd`; use `onAbort`.
- **Render `message.parts`.** Never `message.content`. Tool parts are `tool-<name>` (or `dynamic-tool`), states `input-streaming` → `output-available` (plus approval states).
- **`useChat`:** `transport: new DefaultChatTransport({ api })`, `sendMessage({ text })`, `status === 'submitted' | 'streaming' | 'ready' | 'error'`. Own the input with `useState`.
- **Agents:** `ToolLoopAgent` for in-process ReAct. `WorkflowAgent` (`@ai-sdk/workflow`) for durable Workflow DevKit runs. `HarnessAgent` (`@ai-sdk/harness`) for Claude Code / Codex / Pi-style runtimes. Do not hand-roll a tool loop when `ToolLoopAgent` fits.
- **MCP** lives in `@ai-sdk/mcp`, not `ai`. Close the client. HTTP `redirect` defaults to `'error'` (SSRF).
- **RSC (`@ai-sdk/rsc`) is experimental.** Prefer AI SDK UI for production.
- **Model IDs go stale.** Do not invent “latest” IDs from memory. Prefer the project's existing IDs, provider docs, or Gateway model list. Gateway strings are `provider/model`.
- **Telemetry is opt-out** once `registerTelemetry(...)` is called. OTel is `@ai-sdk/otel`, not built into `ai`.
- **Do not over-specify.** Only set options that differ from defaults. Confirm defaults in docs/source rather than guessing.

## Quick routing

| Need | Use |
| --- | --- |
| One-shot text | `generateText` |
| Streaming text / chat backend | `streamText` |
| JSON / objects | `generateText`/`streamText` + `Output.object` (not `generateObject`) |
| Tool loop in-process | `ToolLoopAgent` or `stopWhen` on generate/stream |
| Durable HITL / crash-safe | `WorkflowAgent` |
| Claude Code / Codex / Pi | `HarnessAgent` |
| Chat UI | `useChat` + `DefaultChatTransport` |
| Completion / object UI | `useCompletion` / `useObject` |
| RAG vectors | `embed` / `embedMany` + `cosineSimilarity` / `rerank` |
| Dedicated image model | `generateImage` |
| Images from a language model | `generateText` → `result.files` |
| MCP tools | `createMCPClient` from `@ai-sdk/mcp` |

## Verification

Prefer repository-owned commands. For meaningful AI SDK work, cover the relevant subset:

- Typecheck `generateText`/`streamText` options, `Output` types, tool `input`/`output`, `UIMessage` generics, `InferAgentUIMessage`.
- Confirm `stopWhen` allows tool steps plus structured output if both are used.
- Chat: send a message, stream tokens, tool part states, stop/abort, error status.
- Persistence/resume paths if those files were touched.
- After migrations: grep [common-errors.md](references/common-errors.md) symbols (`maxSteps`, `generateObject`, `system:`, `handleSubmit`, `toDataStreamResponse`, `stepCountIs`, `CoreMessage`).

Report which checks ran and which `ai` major was assumed.
