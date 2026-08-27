# Source Map

Docs snapshot used to create this skill.

## Snapshot

- Captured: 2026-08-27
- Target line: **AI SDK 7** (`latest` dist-tag)
- npm `ai@latest`: **7.0.83**
- Other observed dist-tags: `ai-v6` = `6.0.270`, `ai-v5` = `5.0.249`, `beta` = `7.0.0-beta.187`, `canary` = `7.0.0-canary.176`
- `@ai-sdk/react@latest`: **4.0.86** (provider/UI packages are one major behind `ai` from v5 onward)
- `@ai-sdk/openai@latest`: **4.0.50**
- Peer zod: `^3.25.76 || ^4.1.8`
- Engines: Node **≥22**, `"type": "module"`
- Official site: https://ai-sdk.dev/
- Official repo: https://github.com/vercel/ai
- Language Model spec: **V4** (`MockLanguageModelV4`, `LanguageModelV4Middleware`)
- `ai@7.0.0` shipped 2026-06-25

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

Known mismatches in the 2026-08-27 snapshot:

- `onEnd.usage`: generate-text table says final-step; migration + lifecycle say **aggregated**. Use aggregated; last step is `finalStep.usage`.
- Stream part types: `text-delta` vs `type: 'text'`. Prefer `onChunk` / generating-text list (`text-delta`, `tool-input-*`).
- `ImagePart` `{ type: 'image' }` still in some refs → use `{ type: 'file', mediaType: 'image', data }`.
- `result.toUIMessageStreamResponse()` still in some getting-started pages → **deprecated**; use standalone helpers.
- `registerTelemetry` vs `registerTelemetryIntegration` → **`registerTelemetry`**.
- Lifecycle labeled “experimental” on generating-text → **stable** on lifecycle-callbacks.md.
- `stepCountIs` in older snippets → **`isStepCount`**.
- Nuxt getting-started still shows `result.toUIMessageStreamResponse()`.
- RSC “migrate to UI” client samples still show v4 `handleSubmit` / `message.content`.
- Search API does not reliably find migration guides.

## Source Files Used

- https://ai-sdk.dev/llms.txt, https://ai-sdk.dev/sitemap.md, https://ai-sdk.dev/docs/introduction.md
- Core, agents, UI, harnesses, migration 7.0, provider, embeddings, image, speech, transcription, files, realtime, gateway pages listed above
- npm registry dist-tags for `ai`, `@ai-sdk/react`, `@ai-sdk/openai`
- GitHub vercel/ai `skills/use-ai-sdk/SKILL.md`, `packages/ai/CHANGELOG.md`, `@ai-sdk/codemod` tables
