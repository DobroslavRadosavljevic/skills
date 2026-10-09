# Asking the User or Client Mid-Call: input_required, Elicitation, Sampling, Roots

Spec 2026-07-28 replaced server-initiated requests with **Multi Round-Trip Requests (MRTR)**. A handler that needs more input returns an `input_required` result; the client answers and retries the same call with `inputResponses`; the handler runs again. The server holds nothing between rounds.

## Table of contents

- Decide first
- The write-once handler
- Request kinds
- Carrying state with requestState
- Legacy-era behavior and the shim
- Form elicitation rules
- URL mode
- Sampling and roots (deprecated)

## Decide first

1. Can the information be a normal tool argument? Prefer that. It works with every client and costs no extra round trip.
2. Need user confirmation or a small form? Use `inputRequired.elicit`.
3. Need a browser flow (sign-in, payment, API key)? Use `inputRequired.elicitUrl`. Never collect secrets in a form.
4. Need a model completion? Call your own LLM provider from the server instead of sampling (deprecated).
5. Need file boundaries? Take paths as arguments or server config instead of roots (deprecated).

## The write-once handler

```ts
import { acceptedContent, inputRequired } from '@modelcontextprotocol/server';
import type { CallToolResult, InputRequiredResult } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

const confirmation = z.object({ confirm: z.boolean().meta({ title: 'Confirm deployment' }) });

server.registerTool(
  'deploy',
  {
    description: 'Deploy to an environment after the operator confirms.',
    inputSchema: z.object({ env: z.enum(['staging', 'production']) }),
    annotations: { destructiveHint: true, idempotentHint: false },
  },
  async ({ env }, ctx): Promise<CallToolResult | InputRequiredResult> => {
    const answer = acceptedContent(ctx.mcpReq.inputResponses, 'confirm', confirmation); // validated, or undefined
    if (answer?.confirm !== true) {
      return inputRequired({
        inputRequests: { confirm: inputRequired.elicit({ message: `Deploy to ${env}?`, requestedSchema: confirmation }) },
      });
    }
    return { content: [{ type: 'text', text: `Deployed to ${env}` }] };
  },
);
```

- Re-derive your position on every entry: read each answer, then request only what is still missing. `inputRequests` is a map, so one round can carry several requests.
- `inputResponses` holds only the latest round's answers and comes from the client. It is untrusted. Always read through `acceptedContent(responses, key, schema)`, which returns `undefined` for missing, declined, or cancelled answers.
- To tell a refusal from a first entry, use `inputResponse(responses, key)`; it returns a discriminated view (`missing`, `elicit`, `sampling`, `roots`). Return a clear message on `decline`/`cancel` instead of re-asking forever.
- Re-asking is only safe for idempotent work. Do side effects only after the confirmed round.
- `inputRequired(spec)` needs `inputRequests` or `requestState`, else it throws `TypeError`. Each embedded request is checked against client capabilities; a missing capability fails with `-32021` (HTTP 400).
- The JSON-RPC `id` differs between the initial request and the retry.

## Request kinds

`inputRequired.elicit({ message, requestedSchema })` (form), `inputRequired.elicitUrl({ message, url })`, `inputRequired.createMessage({ messages, maxTokens })` (sampling, deprecated), `inputRequired.listRoots()` (deprecated).

`requestedSchema` is converted to MCP's restricted elicitation schema: a flat object of primitives. Supported: strings (including `email`, `uri`, `date`, `date-time` formats), numbers with inclusive bounds (`.min`/`.max`; not `.positive()` or `.gt()`), booleans, `z.enum` or `z.literal([...])`, multi-select enum arrays, `.optional()`, defaults. Nested objects and unions of literals do not convert.

## Carrying state with requestState

For sequential rounds, return an opaque `requestState` string with the requests. The client echoes it back unchanged; read it with `ctx.mcpReq.requestState<State>()`.

`requestState` round-trips through the client, so it is attacker-controlled. Sign it:

```ts
import { createRequestStateCodec, McpServer } from '@modelcontextprotocol/server';

const stateCodec = createRequestStateCodec<{ step: string }>({
  key: crypto.getRandomValues(new Uint8Array(32)), // >= 32 bytes; load from a secret and share across instances in a fleet
  ttlSeconds: 600,
});
const server = new McpServer(info, { requestState: { verify: stateCodec.verify } });
// when asking: inputRequired({ inputRequests, requestState: await stateCodec.mint({ step: 'confirmed' }) })
```

- The codec is HMAC-SHA256: signed, not encrypted. Keep secrets out of it.
- Mint only what earlier rounds already proved. State minted as `confirmed` before the confirmation arrives grants that step to anyone who echoes it.
- Tampered or expired state fails with `-32602 Invalid or expired requestState` before your handler runs.
- The key must be the same on every node, or retries that hit another instance fail. A random key generated at boot (as in the snippet) only suits a single process.

## Legacy-era behavior and the shim

On connections that predate 2026-07-28 the SDK's legacy shim (on by default) fulfils an `input_required` return by pushing real `elicitation/create`, `sampling/createMessage`, and `roots/list` requests, then re-enters the handler with the collected responses. One handler therefore serves both eras. Set `inputRequired: { legacyShim: false }` in server options to fail loudly instead.

The older push APIs, `ctx.mcpReq.elicitInput(...)` and `ctx.mcpReq.requestSampling(...)`, still exist but **throw on modern requests**. Use them only in servers that deliberately serve legacy clients alone (for example, a hand-wired stdio server).

## Form elicitation rules

- The result `action` is `accept`, `decline`, or `cancel`; content exists only on accept. Handle each branch with distinct text.
- Accepted content is schema-valid and still untrusted. A confirm boolean must be `true`; do not infer consent from `accept` alone.
- Never ask for passwords, API keys, tokens, or payment details in a form (spec: MUST NOT). Answers travel through the client and land in the model's context. Use URL mode or an out-of-band flow.
- The client must have declared `elicitation` (per mode: `form`, `url`) or the call fails before reaching the wire.
- A client may auto-apply `default` values (SDK flag `applyDefaults`), so treat defaults as suggestions.
- Bind elicitation state to the authenticated user derived from the verified token, never to client-claimed identity.

## URL mode

Use `inputRequired.elicitUrl({ message, url })` to send the user to a browser flow. What the page collects stays in the browser and must never transit the MCP client. Spec rules for servers:

- Do not put sensitive user data in the URL. Do not hand out a pre-authenticated URL.
- Use HTTPS outside development. Do not make URLs clickable in form-mode fields.
- Verify that the user who opens the URL is the user who started the elicitation (bind a short-lived random `state` to the authenticated user and check it on callback). Do not trust client-provided identity.
- URL mode is separate from MCP authorization: it cannot authorize the user to your own server, and you must not reuse the client's token for the third-party service (token passthrough).
- You store and manage any third-party tokens obtained this way; scope them to the user derived from the verified token.
- In 2026-07-28 there is no `elicitationId` and no `notifications/elicitation/complete`. The client learns the outcome by retrying the original call; if you need correlation, encode your own id in signed `requestState`. The completion notification exists only on 2025-11-25 connections.
- `UrlElicitationRequiredError` (`-32042`) is the one protocol error a tool handler may propagate, when the tool cannot proceed until the user visits a URL.

## Sampling and roots (deprecated)

Sampling and roots are deprecated (SEP-2577) and stay functional for at least twelve months. Do not add them to new servers.

- Sampling migration: import your LLM provider SDK in the server and call it from the handler with your own key. For legacy-only use: `ctx.mcpReq.requestSampling({ messages, maxTokens })`; set `enforceStrictCapabilities: true` to fail before the wire when the client lacks `sampling`.
- Roots migration: pass directories or files via tool parameters, resource URIs, or server config. Roots are advisory and never enforced by the SDK.
- `includeContext` values `thisServer` and `allServers` are deprecated; omit the field or use `none`.
