# Setup and packages

## Requirements

- Node **≥22** (prefer current LTS). v7 dropped Node 18/20.
- **ESM only.** `require('ai')` is gone.
- TypeScript with `strict` recommended. Peer **zod** `^3.25.76 || ^4.1.8` (Zod 4.1.8+ is faster under `nodenext`).
- Framework UI packages track `ai@7` as `@ai-sdk/react@4.x`, `@ai-sdk/vue@4.x`, `@ai-sdk/svelte@5.x` (Svelte 5), `@ai-sdk/angular@3.x`.

## Install

Install Core first. Add providers and UI packages only when the task needs them.

```sh
bun add ai zod
```

Then, as needed:

```sh
bun add @ai-sdk/react          # React / Next / TanStack Start / Expo
bun add @ai-sdk/openai         # dedicated OpenAI (optional if using Gateway strings)
bun add @ai-sdk/anthropic
bun add @ai-sdk/google
bun add @ai-sdk/mcp            # MCP client
bun add @ai-sdk/otel           # OpenTelemetry (v7: not bundled in ai)
bun add -d @ai-sdk/devtools    # local inspector only
```

Upgrade a v6 app:

```sh
bun add ai@latest @ai-sdk/react@latest @ai-sdk/openai@latest
bunx @ai-sdk/codemod v7
```

Do not mix `ai@7` with `@ai-sdk/openai@3` / `@ai-sdk/react@3`. Provider spec is **V4**.

## Surfaces

| Library | Purpose | Where it runs |
| --- | --- | --- |
| **AI SDK Core** (`ai`) | `generateText`, `streamText`, tools, agents, embeddings, image/speech/… | Any JS (Node, Deno, Bun, browser, edge) |
| **AI SDK UI** (`@ai-sdk/react` / vue / svelte) | `useChat`, `useCompletion`, `useObject` | React, Vue, Svelte |
| **AI SDK Harnesses** (`@ai-sdk/harness` + adapter) | `HarnessAgent` wrapping Claude Code / Codex / Pi / … | Node + sandbox |
| **AI SDK RSC** (`@ai-sdk/rsc`) | `streamUI` — **experimental, not for production** | RSC hosts (Next) |
| **Workflow** (`@ai-sdk/workflow`) | Durable `WorkflowAgent` | Vercel Workflow (`workflow@beta`) |

## Choosing a model

Three valid patterns. Match the repo.

### 1. Gateway string (default global provider)

```ts
import { generateText } from 'ai';

const { text } = await generateText({
  model: 'anthropic/claude-sonnet-4.5',
  prompt: 'What is love?',
});
```

Env: `AI_GATEWAY_API_KEY=...`. On Vercel deploys, OIDC can authenticate without a key. If `AI_GATEWAY_API_KEY` or an `apiKey` is set, it **wins over OIDC** even if invalid.

Explicit:

```ts
import { gateway } from 'ai';
model: gateway('anthropic/claude-sonnet-4.5');
```

Or `import { gateway } from '@ai-sdk/gateway'`. Custom instance:

```ts
import { createGateway } from 'ai';

const gateway = createGateway({
  apiKey: process.env.AI_GATEWAY_API_KEY ?? '',
  // baseURL default: https://ai-gateway.vercel.sh/v4/ai
});
```

`providerOptions` for Gateway calls key by **underlying provider** (`openai`, `anthropic`), not `gateway`. Optional `gateway: { order: [...] }` for routing.

Do **not** invent model IDs. When using Gateway, list models from https://ai-gateway.vercel.sh/v1/models or the Gateway dashboard. Prefer the IDs already in the project.

### 2. Dedicated provider package

```ts
import { anthropic } from '@ai-sdk/anthropic';

model: anthropic('claude-sonnet-4-5');
```

Use when the project already has provider keys, needs provider-only APIs (`openai.responses()`, `openai.speech()`, files, realtime), or must not depend on Gateway.

### 3. Custom / registry

```ts
import { createProviderRegistry, customProvider } from 'ai';
import { openai } from '@ai-sdk/openai';
import { anthropic } from '@ai-sdk/anthropic';

export const registry = createProviderRegistry({
  openai,
  anthropic: customProvider({
    languageModels: { fast: anthropic('claude-haiku-4-5') },
    fallbackProvider: anthropic,
  }),
});

registry.languageModel('openai:gpt-5.1');
```

Override the global string provider:

```ts
globalThis.AI_SDK_DEFAULT_PROVIDER = openai;
// then model: 'gpt-5.1' (no prefix)
```

`experimental_customProvider` was **removed** in v7. Use `customProvider`.

## Package map (7.x)

| Package | Role |
| --- | --- |
| `ai` | Core + agents + gateway helper |
| `@ai-sdk/provider` | LanguageModelV4 types |
| `@ai-sdk/provider-utils` | Shared provider utils |
| `@ai-sdk/gateway` | Gateway provider (also re-exported from `ai`) |
| `@ai-sdk/react` / `vue` / `svelte` / `angular` | UI |
| `@ai-sdk/openai` `anthropic` `google` `google-vertex` `amazon-bedrock` `azure` `xai` `groq` `mistral` `cohere` `deepseek` `fireworks` `togetherai` `perplexity` `huggingface` … | First-party model providers |
| `@ai-sdk/mcp` | `createMCPClient` |
| `@ai-sdk/otel` | `OpenTelemetry` / `LegacyOpenTelemetry` |
| `@ai-sdk/devtools` | Local DevTools telemetry |
| `@ai-sdk/codemod` | `bunx @ai-sdk/codemod v7` |
| `@ai-sdk/valibot` | `valibotSchema` (not exported from `ai`) |
| `@ai-sdk/code-mode` | Experimental QuickJS tool caller |
| `@ai-sdk/policy-opa` | OPA `toolApproval` |
| `@ai-sdk/harness` + `@ai-sdk/harness-*` | HarnessAgent adapters |
| `@ai-sdk/sandbox-vercel` / `@ai-sdk/sandbox-just-bash` | Sandboxes |
| `@ai-sdk/workflow` / `@ai-sdk/workflow-harness` | Durable agents |
| `@ai-sdk/tui` | `runAgentTUI` |
| `@ai-sdk/rsc` | Experimental RSC |

Speech/transcription/image specialists also exist (`@ai-sdk/elevenlabs`, `@ai-sdk/assemblyai`, `@ai-sdk/fal`, `@ai-sdk/luma`, …). See https://ai-sdk.dev/providers/ai-sdk-providers.md.

## Docs lookup while coding

1. `node_modules/ai/docs/` and `node_modules/ai/src/` (version-matched).
2. https://ai-sdk.dev/docs/... with `.md`.
3. https://ai-sdk.dev/api/search-docs?q=... then fetch the returned `.md`.
4. If neither docs nor source support the API, say so. Do not guess v4/v5 names.

## Framework first files

| Stack | Server | Client |
| --- | --- | --- |
| Next App Router | `app/api/chat/route.ts` `POST` | `'use client'` + `useChat` from `@ai-sdk/react` |
| TanStack Start | `createFileRoute('/api/chat')` `server.handlers.POST` | `@ai-sdk/react` |
| SvelteKit | `src/routes/api/chat/+server.ts` | `new Chat({})` from `@ai-sdk/svelte` |
| Nuxt | `server/api/chat.ts` | `new Chat({})` from `@ai-sdk/vue` |
| Expo 52+ | `app/api/chat+api.ts` + octet-stream headers | `DefaultChatTransport({ fetch: expoFetch, api })` |
| Node HTTP | `pipeUIMessageStreamToResponse` | no UI package |

Canonical server return for chat UIs: see [ui-chat.md](ui-chat.md).

## Env

| Var | Use |
| --- | --- |
| `AI_GATEWAY_API_KEY` | Gateway (default string models) |
| `OPENAI_API_KEY` / `ANTHROPIC_API_KEY` / … | Dedicated provider packages |
| `AI_SDK_LOG_WARNINGS=false` | Silence SDK warnings (v6+) |
| `AI_SDK_TELEMETRY_TRACING_CHANNEL` | Node tracing channel `ai:telemetry` |
