# Harnesses

Experimental. APIs can break in patches. Docs: https://ai-sdk.dev/docs/ai-sdk-harnesses/overview.md · https://ai-sdk.dev/docs/ai-sdk-harnesses/harness-agent.md

`HarnessAgent` wraps an **existing coding-agent runtime** (Claude Code, Codex, Pi, OpenCode, Deep Agents, Cline, Grok Build). The harness owns workspace tools, native session history, compaction, and permissions. The host does **not** replay full UI history into a language model.

Use when the product should *be* that runtime in a sandboxed workspace. Use `ToolLoopAgent` when you own the model + tools.

## Packages

```sh
bun add ai zod @ai-sdk/harness @ai-sdk/harness-claude-code @ai-sdk/sandbox-vercel
```

| Package | Role |
| --- | --- |
| `@ai-sdk/harness` | Contract + `HarnessAgent` (`@ai-sdk/harness/agent`) |
| `@ai-sdk/harness-claude-code` | Claude Code via `@anthropic-ai/claude-agent-sdk`; sandbox WebSocket bridge |
| `@ai-sdk/harness-codex` | Codex via `@openai/codex-sdk`; sandbox WebSocket bridge |
| `@ai-sdk/harness-pi` | Pi; **host** process, sandbox = remote FS/shell |
| `@ai-sdk/harness-opencode` | OpenCode |
| `@ai-sdk/harness-deepagents` | Deep Agents |
| `@ai-sdk/harness-cline` | Cline; host process |
| `@ai-sdk/harness-grok-build` | Grok Build via ACP |
| `@ai-sdk/sandbox-vercel` | Network sandbox (`@vercel/sandbox`). Auth `VERCEL_OIDC_TOKEN`. Failures: `HarnessSandboxAuthenticationError` |
| `@ai-sdk/sandbox-just-bash` | Local emulation; OK for **host-runtime** harnesses (Pi, Cline), not Claude Code/Codex |
| `@ai-sdk/workflow-harness` | Durable runners around HarnessAgent |
| `@ai-sdk/tui` | Wrap HarnessAgent to inject one session, then `runAgentTUI` |

Bridge harnesses (Claude Code, Codex, OpenCode, Deep Agents): `createVercelSandbox({ runtime: 'node24', ports: [4000] })`. Host harnesses: ports optional.

Peers: `zod ^3.25.76 || ^4.1.8`, `ws ^8.21.0` (harness).

## Session is mandatory

Construct the agent at module scope (config only). Live state is `HarnessAgentSession`. Always `createSession()`, then `destroy()` / `detach()` / `stop()`.

Passing `messages` uses only the **latest user message** as the turn input. Trailing tool-result / approval messages continue an unfinished turn. Persist `session.detach()` / `session.stop()` resume state — do **not** replay full UI history.

`generate()` / `stream()` return AI SDK result types, so `toUIMessageStream` + `useChat` work. File mutations and compaction show up as **dynamic** provider-executed tool parts (`fileChange`, `compaction`).

`stopWhen` is **opt-in** (no default). When it matches, the result slice ends but the harness turn may still be unfinished → `hasUnfinishedTurn()` + `suspendTurn()` + `continueStream()` / `continueGenerate()`.

Structured `output` is adapter-dependent. Schema-less `Output.json()` throws `HarnessCapabilityUnsupportedError`. Pi does not support structured output.

Do **not** call `createAgentUIStreamResponse` unless a wrapper injects `session`.

## Adapters (capabilities)

| Adapter | Runtime | Custom tools | Custom skills | Structured output | Built-in approval | Built-in filtering |
| --- | --- | --- | --- | --- | --- | --- |
| Claude Code | sandbox bridge | yes | yes | yes (Agent SDK `outputFormat`) | yes (`allow-reads` / `allow-edits`) | adapter-dependent |
| Codex | sandbox bridge | yes | yes (injected into user prompt; no skill dir) | yes (`outputSchema`) | **no** — force `permissionMode: 'allow-all'` | **no** for built-ins (throws) |
| Pi | host process | yes | yes | **no** | yes | host-runtime |
| Cline | host process | yes | yes | see adapter page | | |
| Deep Agents / OpenCode | sandbox bridge | yes | yes | | | via auto-rejection |
| Grok Build | sandbox via ACP | yes | yes | yes (ACP metadata) | | |

Common built-in names: `read`, `write`, `edit`, `bash`, `grep`, `glob`, `webSearch`. Claude Code has the full set. Codex exposes `bash` + `webSearch` (file mutations often as dynamic `fileChange`).

Coming soon in docs: Amp, Goose, Mastra.

## Skills (harness)

Pass `skills: [{ name, description, content, files? }]` on `HarnessAgent`. On-demand instruction bundles (https://agentskills.io/), not always-on `instructions`. Extra files use skill-relative POSIX paths.

## Tools and permissions

Three surfaces:

1. Runtime built-ins — provider-executed, `providerExecuted: true`
2. Host AI SDK `tools` — executed in the app process, submitted back
3. Adapter `mcpServers`

Filter with **either** `activeTools` **or** `inactiveTools`, never both. Host tools get `experimental_sandbox` (restricted session). Client tools omit `execute`; turn pauses until `continueStream({ toolResultContinuations })` or UI `addToolOutput`.

`permissionMode` for built-ins (`allow-all` default, `allow-edits`, `allow-reads`). `toolApproval` for host tools (`not-applicable` | `approved` | `user-approval` | `denied`).

## Sandbox lifecycle

- `sandboxConfig.workDir` — relative to sandbox default
- `onBootstrap` + `bootstrapHash` — expensive setup baked into reusable snapshots
- `onSession` — per-session files after workdir exists (including resumes)
- `prepareHarnessSandboxTemplate()` / `prepareSandboxForHarness()` for pre-warming
- Caller-supplied `sandboxSession` is **not** stopped/destroyed by the agent

## UI consumption

Client: `useChat` + `DefaultChatTransport`. Server: `convertToModelMessages` → `agent.stream({ session, messages })` → `createUIMessageStream` + `toUIMessageStream({ stream: result.stream, onError: getHarnessErrorMessage })`. Persist `session.detach()`. `getHarnessErrorMessage` keeps reviewed client-safe errors, masks unknowns. Infer UI tools from `agent.tools` (`InferUITools<typeof agent.tools>`).

## Workflow + harness

`@ai-sdk/workflow-harness`: `runHarnessAgentStep`, `runHarnessAgentTimeSlice` around `HarnessAgent` (not `WorkflowAgent`). Semantic steps: `stopWhen: isStepCount(1)`. Time slices: omit `stopWhen` (default budget 750s). Persist `resumeFrom` across **user turns**; Workflow already persists `continueFrom` within one run.

## Errors

- `HarnessCapabilityUnsupportedError` — e.g. Pi + `output`, schema-less `Output.json()`, filtering Codex built-ins
- `HarnessSandboxAuthenticationError` — Vercel sandbox credentials
