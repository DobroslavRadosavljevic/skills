# Agents

Agents are LLMs that use tools in a loop. Guides: https://ai-sdk.dev/docs/agents/overview.md · https://ai-sdk.dev/docs/agents/building-agents.md

| | **ToolLoopAgent** | **WorkflowAgent** | **HarnessAgent** |
| --- | --- | --- | --- |
| Package | `ai` | `@ai-sdk/workflow` (+ `workflow@beta`) | `@ai-sdk/harness` + adapter + sandbox |
| Runtime | In-process | Workflow DevKit (`'use workflow'` / `'use step'`) | Prebuilt harness (Claude Code, Codex, Pi, …) |
| Crash | Lost | Checkpointed | Resume via opaque `resumeFrom` |
| Methods | `generate()` + `stream()` | **`stream()` only** | `generate()` / `stream()` **need a session** |
| Approval | `toolApproval` | `needsApproval` on `tool()` | Harness `permissionMode` + host `toolApproval` |
| Default stop | `isStepCount(20)` | No max until tools stop — set `stopWhen` | Opt-in `stopWhen` (no default) |
| Model | LanguageModel / gateway string | Same | **Not** a model; a harness adapter |

Prefer `ToolLoopAgent` for most app agents. Use core `generateText`/`streamText` when the control flow must be explicit (sequential / routing / parallel / evaluator-optimizer — https://ai-sdk.dev/docs/agents/workflows.md). Use `WorkflowAgent` when the run must survive process death. Use `HarnessAgent` when the product *is* Claude Code / Codex / Pi in a workspace.

Do not hand-roll a tool loop when `ToolLoopAgent` fits.

## ToolLoopAgent

```ts
import { ToolLoopAgent, InferAgentUIMessage, isStepCount, createAgentUIStreamResponse } from 'ai';

const agent = new ToolLoopAgent({
  model: 'anthropic/claude-sonnet-4.5',
  instructions: 'You are a helpful assistant.',
  tools: { weather: weatherTool },
  stopWhen: isStepCount(20),
  toolApproval: { runCommand: 'user-approval' },
});

const result = await agent.generate({ prompt: 'Weather in SF?' });
const stream = agent.stream({ prompt: 'Tell a story.' });
```

Implements `Agent` (`version: 'agent-v1'`). Prompt **or** messages, not both. `allowSystemInMessages` default rejects `role: "system"` in messages.

### Constructor (dense)

**Required:** `model`.

**Loop / tools:** `instructions`, `tools`, `toolChoice`, `stopWhen` (default `isStepCount(20)`), `activeTools`, `toolOrder`, `toolApproval`, `experimental_toolCallers` (code mode), `output` (`Output.object({ schema })` etc.), `prepareStep`, `repairToolCall`, `experimental_refineToolInput`, `include`.

**Context:** `runtimeContext`, `toolsContext` (required if any `contextSchema`).

**Call options:** `callOptionsSchema`, `prepareCall`.

**Sampling / HTTP:** `maxOutputTokens`, `temperature`, `topP`, `topK`, penalties, `stopSequences`, `seed`, `maxRetries` (default 2), `providerOptions`, `headers`, `experimental_download`.

**Lifecycle:** `onStart`, `onStepStart`, `onToolExecutionStart`, `onToolExecutionEnd`, `onStepEnd` (`onStepFinish` deprecated), `onEnd` (`onFinish` deprecated). Constructor + call both fire (constructor first).

**Identity:** `id`.

v5 `Experimental_Agent` defaulted to `isStepCount(1)`. v6+ `ToolLoopAgent` defaults to **20**.

There is **no** `agent.generateText` / `agent.streamText` (removed in v6). HTTP helper is `createAgentUIStreamResponse`, not `agent.respond()` from older docs.

### Call options (`prepareCall`)

```ts
const agent = new ToolLoopAgent({
  model,
  callOptionsSchema: z.object({
    userId: z.string(),
    accountType: z.enum(['free', 'pro', 'enterprise']),
  }),
  prepareCall: ({ options, ...settings }) => ({
    ...settings,
    instructions: `${settings.instructions}\nAccount: ${options.accountType}`,
  }),
});

await agent.generate({ prompt: '...', options: { userId: 'u1', accountType: 'pro' } });
```

`prepareCall` may be async (RAG). Can change `model`, `tools`, `activeTools`, `providerOptions`, `toolApproval`. With a schema, `options` is **required** at the type level.

`generate()` / `stream()` also accept `abortSignal`, `timeout`, `experimental_sandbox`, and the same lifecycle callbacks. `stream()` also `experimental_transform`.

### UI HTTP

Param is **`uiMessages`**, not `messages`.

```ts
export async function POST(request: Request) {
  const { messages, userId, accountType } = await request.json();
  return createAgentUIStreamResponse({
    agent,
    uiMessages: messages,
    options: { userId, accountType },
  });
}
```

Also: `createAgentUIStream` (async iterable), `pipeAgentUIStreamToResponse` (Node `ServerResponse`). Validates against agent `tools`, converts to model messages, calls `agent.stream()`.

Do **not** use `createAgentUIStreamResponse` with a raw `HarnessAgent` unless a wrapper injects `session`.

### Types

```ts
export type MyAgentUIMessage = InferAgentUIMessage<typeof agent>;
// optional metadata: InferAgentUIMessage<typeof agent, ExampleMetadata>
```

Use with `useChat<MyAgentUIMessage>()`. Tool UI parts: `tool-<toolName>`.

## Subagents

Parent tool `execute` calls another `ToolLoopAgent`. Isolated context. **No `toolApproval` in subagents.** Pass `abortSignal`. On cancel: `convertToModelMessages(messages, { ignoreIncompleteToolCalls: true })`.

Streaming nested UI: `async function*` + `yield` complete `UIMessage`s via `readUIMessageStream({ stream: toUIMessageStream({ stream: result.stream }) })`. `toModelOutput` must return **only the summary** so the parent model does not ingest exploration tokens.

UI: `part.state === 'output-available' && part.preliminary === true` while nested output streams; render `part.output.parts`.

## Memory

Three approaches (https://ai-sdk.dev/docs/agents/memory.md):

1. Provider-defined — e.g. `anthropic.tools.memory_20250818({ execute })` (Claude-only).
2. Memory products — Letta, Mem0, Supermemory, … Check peer `ai` major; some still cite v6.
3. Custom tool — inject core memory in `prepareCall` every turn; compact in `prepareStep`.

Cookbook compaction: https://ai-sdk.dev/cookbook/guides/agent-context-compaction.md

## WorkflowAgent

Durable ToolLoopAgent analogue. Serializable context only (no live clients/fns). `stream()` writes `ModelCallStreamPart` to `getWritable()`. Types: `InferWorkflowAgentUIMessage`, `InferWorkflowAgentTools`.

Client reconnect: `WorkflowChatTransport` from `@ai-sdk/workflow`. POST must send `x-workflow-run-id`; GET `{api}/{runId}/stream?startIndex=`.

Replaces older `DurableAgent`. `maxSteps` → `stopWhen: isStepCount(n)`. `experimental_output` → `output`. `experimental_context` → `runtimeContext`+`toolsContext`. `experimental_toolApprovalSecret` **unsupported**. Persist `UIMessage[]`; inbound `convertToModelMessages`.

Docs mix `onStart` vs `experimental_onStart` — confirm against `@ai-sdk/workflow` types.

## Terminal UI

```ts
import { runAgentTUI } from '@ai-sdk/tui';

await runAgentTUI({
  title: 'Weather Agent',
  agent, // XOR transport
  sandbox,
  tools: 'auto-collapsed', // full | collapsed | auto-collapsed | hidden
  reasoning: 'collapsed',
});
```

Compatible agent type: `Agent<undefined, any, any, never>` — **no `callOptionsSchema`, no structured `output`**. Approvals: `y`/`n`. Or `transport: new DefaultChatTransport({ api })`.
