# Tools, MCP, context, approvals

Guides: https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling.md · https://ai-sdk.dev/docs/foundations/tools.md · https://ai-sdk.dev/docs/ai-sdk-core/mcp-tools.md · https://ai-sdk.dev/docs/ai-sdk-core/runtime-and-tool-context.md

```ts
import { tool, dynamicTool, generateText, isStepCount } from 'ai';
import { z } from 'zod';
```

## tool() vs dynamicTool()

`tool()` is a type helper (no runtime). It types `execute` from `inputSchema` / `contextSchema`. `dynamicTool()` is the same family with `input`/`output` as `unknown` and `type: 'dynamic'`.

```ts
export const weatherTool = tool({
  description: 'Get the weather in a location',
  inputSchema: z.object({
    location: z.string().describe('The location to get the weather for'),
  }),
  contextSchema: z.object({
    weatherApiKey: z.string(),
    defaultUnit: z.enum(['celsius', 'fahrenheit']),
  }),
  strict: true,
  inputExamples: [{ input: { location: 'San Francisco' } }],
  execute: async ({ location }, { context, abortSignal, toolCallId, experimental_sandbox }) => {
    return fetchWeather({ location, apiKey: context.weatherApiKey, unit: context.defaultUnit });
  },
  toModelOutput: ({ output }) => ({ type: 'text', value: JSON.stringify(output) }),
  onInputStart: () => {},
  onInputDelta: ({ inputTextDelta }) => {},
  onInputAvailable: ({ input }) => {},
});
```

| Field | Notes |
| --- | --- |
| `description` | `string` **or** `({ context, experimental_sandbox }) => string`. Re-resolved **every step**. |
| `inputSchema` | Zod / JSON / Standard Schema. Sent to the model **and** used to validate calls. |
| `outputSchema` | Optional. MCP uses this with `structuredContent`. |
| `execute` | Optional. Omit to forward to the client / queue / stop the loop. May be `async *` for preliminary yields. |
| `toModelOutput` | What the **model** sees vs UI. Keep summaries small for subagents. |
| `needsApproval` | **Deprecated** for generate/stream/`ToolLoopAgent`. Still the API for **`WorkflowAgent`**. Use `toolApproval` instead. |
| `strict` | Provider-supported strict schema. Default off. |
| `contextSchema` | When set, matching `toolsContext[toolName]` is required. |
| `onInputStart` | Always before `onInputAvailable`, including `generateText`. |
| `onInputDelta` | Streaming only. |
| `inputExamples` | Anthropic native; others ignore. |

`execute` second arg (`ToolExecutionOptions`): `toolCallId`, `messages`, `abortSignal`, `experimental_sandbox`, `context` (that tool’s bag, **not** the full `toolsContext` map).

`dynamicTool()`: validate/cast `input` at runtime. In `useChat`, dynamic tools are **`dynamic-tool` parts**, not `tool-<name>`. Narrow with `toolCall.dynamic`.

Preliminary results: `async *execute` + `yield`. Each yield **replaces** previous output. Last value is final. UI: `state === 'output-available'` and `preliminary === true` while streaming.

Refine unowned schemas: `experimental_refineToolInput: { search: input => ({ ...input, category: input.category === '' ? null : input.category }) }`.

## Four tool kinds

| Kind | Schema | Execute | Typical |
| --- | --- | --- | --- |
| Function (`tool()`) | You | Your process | App tools |
| Dynamic (`dynamicTool()` / MCP `client.tools()`) | Runtime | Your process / MCP | MCP, user-defined |
| Provider-defined (e.g. `anthropic.tools.bash_20250124`) | Provider | You | Model-trained client tools |
| Provider-executed (e.g. `openai.tools.webSearch()`) | Provider | Provider | Hosted search / code |

MCP vs first-party: MCP is best for iteration and user-supplied tools. Production: prefer first-party `tool()` for types, latency, schema control, auth. OpenAI Responses also has `openai.tools.mcp` (no conversion).

## Multi-step

```ts
await generateText({
  model,
  tools: { weather: weatherTool },
  stopWhen: isStepCount(5),
  prompt: 'Weather in NYC?',
});
```

| Helper | Behavior |
| --- | --- |
| `isStepCount(n)` | Stop after `n` completed steps. Was `stepCountIs`. |
| `hasToolCall(...names)` | Stop if any named tool ran in the **latest** step. |
| `isLoopFinished()` | Always false — no cap. Cost risk. |
| Custom `({ steps }) => boolean` | e.g. `steps.some(s => s.text?.includes('ANSWER:'))` |

`toolChoice`: `'auto'` \| `'required'` \| `'none'` \| `{ type: 'tool', toolName }`.

Forced-tool + done tool (no `execute`): `toolChoice: 'required'` + a `done` tool without `execute` stops the loop. Final answer is in `result.staticToolCalls`.

`activeTools`: string keys; `undefined` = all. Limits what the model **sees**. `experimental_activeTools` **removed**. `toolOrder`: listed first, rest alphabetical (cache-friendly). Does not force calls.

```ts
import { experimental_filterActiveTools as filterActiveTools } from 'ai';
```

**Repair** (`repairToolCall`): intercept invalid calls. Return repaired `{ ...toolCall, input: JSON.stringify(...) }` or `null`. Skip `NoSuchToolError`.

Thrown `execute` errors become **`tool-error` parts** (loop can continue). Callback errors in `onToolExecution*` are swallowed.

`result.responseMessages` — append to conversation history. Stream: `await result.responseMessages`.

Manual loop: omit `execute`, inspect `finishReason === 'tool-calls'`, run tools, append `role: 'tool'`, repeat.

## Approvals

Canonical for generate/stream/`ToolLoopAgent`: **`toolApproval`**. `needsApproval` on `tool()` is deprecated there; **keep `needsApproval` on `WorkflowAgent`**. Does not apply to provider-executed tools. Subagent tools **cannot** use approval.

| Status | Effect |
| --- | --- |
| `'not-applicable'` / `undefined` | Execute, no approval metadata |
| `'approved'` | Automatic request+response (`isAutomatic: true`), then execute |
| `'denied'` | Automatic request+response, denied output |
| `'user-approval'` | Pause: `tool-approval-request`, wait for `tool-approval-response` |

```ts
toolApproval: {
  runCommand: 'user-approval',
  processPayment: async ({ amount }) => (amount > 1000 ? 'user-approval' : undefined),
}
```

Generic function: `{ toolCall, tools, toolsContext, messages, runtimeContext }`. Force-approve dynamic tools via `toolCall.dynamic`.

Manual continuation: push `result.responseMessages`, then `{ role: 'tool', content: approvals }` where each item is `{ type: 'tool-approval-response', approvalId, approved, reason? }`.

`useChat`: `part.state === 'approval-requested'` → `addToolApprovalResponse({ id: part.approval.id, approved })`. Auto-continue: `sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`. Skip UI when `part.approval.isAutomatic`.

Signing: `experimental_toolApprovalSecret` HMAC-binds name + call id + args. Fail-closed. Shared secret across serverless instances. **Not** on `WorkflowAgent`.

Deny instruction: *When a tool execution is not approved, do not retry it.*

OPA: `@ai-sdk/policy-opa` `opaPolicy({ client, path })`. Unmatched → `not-applicable`. Backend error → denied. `wrapMcpTools` for discovered MCP.

## runtimeContext vs toolsContext

| Concept | Where | For |
| --- | --- | --- |
| `runtimeContext` | generate/stream/agent; `prepareStep`, lifecycle | Shared loop state (tenant, flags). **Not** auto-injected into the prompt |
| `toolsContext` | map keyed by tool name | Per-tool bags |
| tool `context` | that tool’s entry, validated by `contextSchema` | API keys, clients — `execute` / description / approval |
| `telemetry.includeRuntimeContext` | per-call allowlist | Shallow `true` keys only. **Omitted = send nothing.** Not a security boundary |

If **any** tool has `contextSchema`, `toolsContext` is required for those tools. A tool never sees the full map. Treat tool context as immutable in `execute`; update via `prepareStep`.

v7: `experimental_context` → split `runtimeContext` + `toolsContext`. Tool callbacks: `experimental_context` → `context`.

Do **not** put secrets in the prompt.

## experimental_sandbox

Contract only. Passing a sandbox does **not** sandbox the tool process. Only `experimental_sandbox.run(...)` runs in the sandbox.

```ts
import type { Experimental_SandboxSession } from 'ai';
// { description, run({ command, workingDirectory?, env?, abortSignal? }) => { exitCode, stdout, stderr } }
```

Available in description fns and `execute` options. **Description is not auto-prompted** — put it in instructions/description. Local `child_process.exec` is not a security boundary.

## MCP

```ts
import { createMCPClient } from '@ai-sdk/mcp';
import { Experimental_StdioMCPTransport } from '@ai-sdk/mcp/mcp-stdio';
```

**Not** exported from `ai`. Close: `onEnd` on `streamText`, or `try/finally`.

| Transport | Config | Use |
| --- | --- | --- |
| HTTP | `{ type: 'http', url, headers?, authProvider?, redirect? }` | Production. `redirect` default **`'error'`** (SSRF; was `'follow'`) |
| SSE | `{ type: 'sse', url, ... }` | Legacy HTTP |
| stdio | `Experimental_StdioMCPTransport({ command, args? })` | **Local only** |

`tools()`:

- Discovery: `await mcpClient.tools()` — inferred schemas, no compile-time types.
- Typed: `tools({ schemas: { 'get-data': { inputSchema, outputSchema? } } })`.
- Zero-arg: `z.object({})`.

`maxRetries` on the client retries **transient** HTTP `tools/call` only — not JSON-RPC app errors.

Elicitation: `capabilities: { elicitation: {} }` + `mcpClient.onElicitationRequest(...)`.

Rug pull: `fingerprintTools` / `detectToolDrift` from `'ai'`.

### MCP Apps

Tools can point at `ui://` HTML (`text/html;profile=mcp-app`) in a sandboxed iframe.

```ts
import { mcpAppClientCapabilities, splitMCPAppTools, readMCPAppResource } from '@ai-sdk/mcp';
import { experimental_MCPAppRenderer as MCPAppRenderer } from '@ai-sdk/react';
```

Pass **only** `modelVisible` tools to the model. Never give app-only tools to the model. Renderer is experimental. React only.

## Code mode

Package `@ai-sdk/code-mode`. Experimental. Node ≥22. Not browser/edge. Model writes JS that calls tools inside QuickJS.

```ts
import { DIRECT_TOOL_CALL, experimental_codeModeTool as codeModeTool } from '@ai-sdk/code-mode';

experimental_toolCallers: {
  getInventory: ['code_mode'],
  getDemand: ['code_mode', DIRECT_TOOL_CALL],
}
```

Approvals are **not** integrated for nested code-mode calls — those tools cannot pause for HITL. Keep approval tools directly model-callable.

## Types

```ts
import { TypedToolCall, TypedToolResult, InferUITools, type ToolSet } from 'ai';

const myToolSet = { firstTool, secondTool } satisfies ToolSet;
type MyToolCall = TypedToolCall<typeof myToolSet>;
type MyUITools = InferUITools<typeof myToolSet>;
```
