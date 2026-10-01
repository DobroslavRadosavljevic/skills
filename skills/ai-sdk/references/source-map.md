# Source Map

Docs snapshot used to create this skill.

## Snapshot

- Captured: 2026-08-27; refreshed **2026-10-01**
- Target line: **AI SDK 7** (`latest` dist-tag)
- npm `ai@latest`: **7.0.126** (2026-09-30)
- Other observed dist-tags: `ai-v6` = `6.0.299`, `ai-v5` = `5.0.271`, `beta` = `7.0.0-beta.187`, `canary` = `7.0.0-canary.176` (stale prerelease tags)
- `@ai-sdk/react@latest`: **4.0.129** (provider/UI packages are one major behind `ai` from v5 onward)
- `@ai-sdk/openai@latest`: **4.0.83**; `@ai-sdk/anthropic` **4.0.71**; `@ai-sdk/google` **4.0.87**; `@ai-sdk/gateway` **4.0.102**
- `@ai-sdk/mcp` **2.0.65**, `@ai-sdk/otel` **1.0.126**, `@ai-sdk/devtools` **1.0.29**, `@ai-sdk/workflow` **2.0.57** (peer `workflow ^5.0.0-beta.42`; `workflow@5.0.0` stable 2026-09-30), `@ai-sdk/harness` **1.0.137**, `@ai-sdk/code-mode` **1.0.83**, `@ai-sdk/codemod` **4.0.3**
- Peer zod: `^3.25.76 || ^4.1.8`
- Engines: Node **≥22**, `"type": "module"`
- Official site: https://ai-sdk.dev/
- Official repo: https://github.com/vercel/ai
- Language Model spec: **V4** (`MockLanguageModelV4`, `LanguageModelV4Middleware`)
- `ai@7.0.0` shipped 2026-06-25

### Notable 7.0.x additions since 7.0.83 (patch releases, no breaking renames except experimental APIs)

- 7.0.91 `streamText({ streamRetries })` for mid-stream provider errors; `onError` can return `{ retry: true }`.
- 7.0.93 `Output.array({ minItems, maxItems })`.
- 7.0.94 experimental batches generalized: `experimental_startTextBatch` → `experimental_startBatch` (+ per-request models, tools, image requests, `experimental_cancelBatch`, `experimental_listBatches`).
- 7.0.88–7.0.108 enforced `toolChoice` (`ToolChoiceViolationError`).
- 7.0.98 `isToolOutputErrorUIPart` / `ToolOutputErrorUIPart`; runtime-context attribution for embed/rerank telemetry.
- 7.0.100 typed AI SDK errors from UI chat transports and completion helpers.
- 7.0.102 experimental OpenAI Live realtime (WebSocket + browser WebRTC).
- 7.0.103 `experimental_evaluate` (+ evaluation models, registries 7.0.104); code-mode tool discovery; `rawInput` on output-error parts deprecated.
- 7.0.104 `toolSearch()` + `deferLoading` tools.
- 7.0.119 response streams cancel on client disconnect.
- 7.0.123 `keepAliveMs` SSE keep-alive on UI stream responses.
- 7.0.124 telemetry for `generateSpeech` / `transcribe`.
- 7.0.125 `convertDataPart` on agent UI stream helpers.
- `@ai-sdk/harness` 1.0.126 sandbox API refactor (`createVercelNetworkSandboxSession` + `agent.getSandboxTemplate()`; `createVercelSandbox` deprecated).

Treat `beta` / `canary` as unavailable unless the project already depends on them. Keep `ai` and `@ai-sdk/*` on matching majors (`ai@7` + `@ai-sdk/react@4` + `@ai-sdk/openai@4` + `@ai-sdk/provider@4` + `@ai-sdk/provider-utils@5`).

If the installed project is still on `ai@5` or `ai@6`, do not apply v7-only names until packages are bumped. Use [migration.md](migration.md) and the matching major docs (`/v5/docs/...` or dist-tag).

## Refresh Procedure

1. Check registry metadata:

   ```sh
   bun info ai
   bun info @ai-sdk/react
   bun info @ai-sdk/openai
   ```

2. Compare `node_modules/ai/package.json` to `latest`. If a major behind, read the matching migration guide before writing new APIs.
3. Prefer **installed** docs when present: `node_modules/ai/docs/`, `node_modules/ai/src/`, `node_modules/@ai-sdk/<pkg>/docs/`. These match the installed major, not the live site.
4. Live docs: append `.md` to any https://ai-sdk.dev/docs/... URL. Index: https://ai-sdk.dev/sitemap.md. Agent index: https://ai-sdk.dev/llms.txt. Full dump: https://ai-sdk.dev/llms-full.txt.
5. Search endpoint: `https://ai-sdk.dev/api/search-docs?q=query` — use as a hint, then open the `.md` URL. It often ranks unrelated pages for “migration”. Prefer https://ai-sdk.dev/docs/migration-guides.md for majors.
6. Upstream `vercel/ai` ships a thin coding-agent entrypoint at `skills/use-ai-sdk/SKILL.md`. This catalog is the dense local reference; still verify version-sensitive APIs against installed source.
7. Never hardcode “the latest model”. Prefer project IDs, provider docs, or Gateway `https://ai-gateway.vercel.sh/v1/models` when the project uses Gateway.

## Official Pages

### Start

- Introduction: https://ai-sdk.dev/docs/introduction.md
- Navigating the library: https://ai-sdk.dev/docs/getting-started/navigating-the-library.md
- Choosing a provider: https://ai-sdk.dev/docs/getting-started/choosing-a-provider.md
- Coding agents: https://ai-sdk.dev/docs/getting-started/coding-agents.md
- Frameworks: Next App Router, Pages Router, Svelte, Nuxt, Node.js, Expo, TanStack Start under `/docs/getting-started/`

### Core

- Overview: https://ai-sdk.dev/docs/ai-sdk-core/overview.md
- Generating text: https://ai-sdk.dev/docs/ai-sdk-core/generating-text.md
- Structured data: https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data.md
- Tools: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling.md
- MCP: https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools.md
- Runtime/tool context: https://ai-sdk.dev/docs/ai-sdk-core/runtime-and-tool-context.md
- Settings / reasoning / middleware / lifecycle / telemetry / testing / errors: `/docs/ai-sdk-core/`

### Agents / harnesses / UI

- Agents: https://ai-sdk.dev/docs/agents/overview.md
- ToolLoopAgent: https://ai-sdk.dev/docs/reference/ai-sdk-core/tool-loop-agent.md
- Harnesses: https://ai-sdk.dev/docs/ai-sdk-harnesses/overview.md
- UI: https://ai-sdk.dev/docs/ai-sdk-ui/overview.md
- useChat: https://ai-sdk.dev/docs/reference/ai-sdk-ui/use-chat.md
- Stream protocol: https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol.md

### Migration

- Index: https://ai-sdk.dev/docs/migration-guides.md
- 5.0: https://ai-sdk.dev/docs/migration-guides/migration-guide-5-0.md
- 6.0: https://ai-sdk.dev/docs/migration-guides/migration-guide-6-0.md
- 7.0: https://ai-sdk.dev/docs/migration-guides/migration-guide-7-0.md

## Doc contradictions (trust this order)

When pages disagree, prefer: **migration-guide-7-0.md** → dedicated reference page → topic guide → getting-started / cookbook.

Known mismatches (2026-08-27 snapshot, rechecked against bundled 7.0.126 docs on 2026-10-01):

- `onEnd.usage`: generate-text table says final-step; migration + lifecycle say **aggregated**. Use aggregated; last step is `finalStep.usage`.
- Stream part types: `text-delta` vs `type: 'text'`. Prefer `onChunk` / generating-text list (`text-delta`, `tool-input-*`).
- `ImagePart` `{ type: 'image' }` still in some refs → use `{ type: 'file', mediaType: 'image', data }`.
- `result.toUIMessageStreamResponse()` still in some getting-started pages → **deprecated**; use standalone helpers.
- Lifecycle labeled “experimental” on generating-text → **stable** on lifecycle-callbacks.md.
- `stepCountIs` in older snippets → **`isStepCount`** (alias still exported in 7.0.x).
- Vercel deployment guide (`06-advanced`) still shows `result.toUIMessageStreamResponse()` (Nuxt getting-started was fixed).
- WorkflowAgent docs install `workflow@beta`; `workflow@latest` is now 5.0.0 stable.
- RSC “migrate to UI” client samples still show v4 `handleSubmit` / `message.content`.
- Search API does not reliably find migration guides.

## Source Files Used

- https://ai-sdk.dev/llms.txt, https://ai-sdk.dev/sitemap.md, https://ai-sdk.dev/docs/introduction.md
- Core, agents, UI, harnesses, migration 7.0, provider, embeddings, image, speech, transcription, files, realtime, gateway pages listed above
- npm registry dist-tags for `ai`, `@ai-sdk/*` packages listed above
- Bundled docs and `dist/index.d.ts` of `ai@7.0.126`; `packages/ai/CHANGELOG.md` 7.0.84–7.0.126; `@ai-sdk/harness` / `@ai-sdk/mcp` changelogs
- GitHub vercel/ai `skills/use-ai-sdk/SKILL.md`, `packages/ai/CHANGELOG.md`, `@ai-sdk/codemod` tables
