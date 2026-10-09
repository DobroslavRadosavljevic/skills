# Server API: McpServer, Tools, Resources, Prompts

Based on `@modelcontextprotocol/server@2.3.1`. All snippets assume:

```ts
import { McpServer, ResourceTemplate, completable } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';
```

## Table of contents

- Server and factory
- Tools
- Structured output and content types
- Errors
- Annotations
- Resources and templates
- Prompts
- Completions
- Context (`ctx`), progress, cancellation
- Notifications and registration handles
- Caching hints
- Logging (deprecated)
- Roots (deprecated)

## Server and factory

```ts
function createServer(): McpServer {
  const server = new McpServer(
    { name: 'catalog', version: '1.0.0' },
    {
      instructions: 'Search products first, then fetch details by id.', // optional server-level guidance for the model
      maxToolInputElements: 10_000, // optional cap on array elements + object members per call
    },
  );
  // register tools, resources, prompts here
  return server;
}
```

- Options also include `capabilities`, `enforceStrictCapabilities`, `jsonSchemaValidator`, `requestState: { verify }`, `cacheHints`, `inputRequired: { legacyShim }`.
- `McpServer` advertises `listChanged` for tools, prompts, and resources as you register. `mcpServer.server` exposes the low-level `Server` (custom handlers, deprecated roots/sampling methods).
- The factory is the unit of isolation: HTTP builds one per request, stdio one per connection. Keep per-caller state in `authInfo`, not module globals.
- The server serves one connection at a time. Sharing one instance across requests fails (`ALREADY_CONNECTED` or HTTP 500).

## Tools

```ts
server.registerTool(
  'search_products',
  {
    title: 'Search products',
    description: 'Find products by name substring. Returns ids and prices; use get_product for details.',
    inputSchema: z.object({
      query: z.string().min(1).describe('Substring to match against product names'),
      limit: z.number().int().min(1).max(50).default(10).describe('Max results'),
    }),
    outputSchema: z.object({ items: z.array(z.object({ id: z.string(), name: z.string(), price: z.number() })) }),
    annotations: { readOnlyHint: true, openWorldHint: false },
  },
  async ({ query, limit }, ctx) => {
    const items = await findProducts(query, limit, { signal: ctx.mcpReq.signal });
    return {
      content: [{ type: 'text', text: JSON.stringify({ items }) }],
      structuredContent: { items },
    };
  },
);
```

- The one schema produces the advertised JSON Schema, runtime validation, and handler types. `.describe()` text is the only per-argument documentation the model sees.
- Invalid arguments never reach the handler. The call returns `{ isError: true, content: [{ type: 'text', text: 'Input validation error: ...' }] }`, so the model can retry.
- No arguments: omit `inputSchema`; the handler signature becomes `async ctx => ...`. If you want `(args, ctx)`, pass `inputSchema: z.object({})`.
- Tool names: 1 to 128 chars, letters, digits, `_`, `-`, `.`; unique per server; case-sensitive. Prefer `snake_case` verbs with a domain noun (`search_products`).
- Deterministic order: the spec says servers SHOULD return `tools/list` in a stable order. Register in a fixed order.
- Raw shapes (`inputSchema: { name: z.string() }`) still work through deprecated overloads. Do not write new code that way.
- Other schema sources: ArkType `type({...})` directly; Valibot via `toStandardJsonSchema(v.object(...))`; plain JSON Schema via `fromJsonSchema<T>({...})` (JSON Schema 2020-12 keywords allowed).
- `x-mcp-header` on a primitive input property mirrors the value into an `Mcp-Param-*` HTTP header for routing. Never mark secrets or PII with it.

## Structured output and content types

- `outputSchema` plus `structuredContent`: validated before the result leaves the server. Always also return the serialized JSON in a `text` block for clients that ignore structured data. Spec 2026-07-28 allows `structuredContent` to be any JSON value, not just an object; the SDK examples use objects.
- Content blocks: `text`, `image` and `audio` (base64 `data` plus `mimeType`), `resource_link` (URI without bytes), embedded `resource`. Prefer `resource_link` for large payloads; the client reads the resource on demand.
- Keep text compact. Large dumps burn the model's context and invite truncation.

## Errors

- Recoverable tool failure: return `{ content: [{ type: 'text', text: 'No note "x". Known ids: a, b' }], isError: true }` or throw `new Error(msg)`. The message is the model's only recovery input; name the fix. Both paths yield the same wire shape.
- A tool handler cannot raise a protocol error: any throw, including `ProtocolError`, becomes `isError`. The one exception is `UrlElicitationRequiredError` (code `-32042`).
- Resource, prompt, and completion callbacks have no `isError`. Throw `ProtocolError(ProtocolErrorCode.InvalidParams, msg)`, or `new ResourceNotFoundError(uri.href)` (code `-32602`). Other exceptions become `-32603`.
- Codes: `-32700` parse, `-32600` invalid request, `-32601` method not found, `-32602` invalid params, `-32603` internal, `-32021` missing client capability, `-32022` unsupported protocol version, `-32042` URL elicitation required. `-32020` to `-32099` is reserved for the spec.
- Never leak stack traces, SQL, tokens, or internal URLs in error text. Map upstream errors to short, actionable messages.

## Annotations

`annotations: { title?, readOnlyHint?, destructiveHint?, idempotentHint?, openWorldHint? }`. Defaults: `readOnlyHint=false`, `destructiveHint=true` (meaningful when not read-only), `idempotentHint=false`, `openWorldHint=true`.

- Set them truthfully so hosts can auto-approve read-only tools and confirm destructive ones.
- They are hints only. The SDK does not enforce them, and clients must treat them as untrusted unless the server is trusted. Enforce real permissions in code.

## Resources and templates

```ts
server.registerResource(
  'app-config', 'config://app',
  { title: 'App config', description: 'Current configuration', mimeType: 'application/json' },
  async uri => ({ contents: [{ uri: uri.href, text: JSON.stringify(config) }] }),
);

server.registerResource(
  'product',
  new ResourceTemplate('catalog://products/{id}', {
    list: undefined, // required key; undefined when instances are unbounded
    complete: { id: async value => (await listIds()).filter(x => x.startsWith(value)) },
  }),
  { description: 'One product', mimeType: 'application/json' },
  async (uri, { id }) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: await getProductJson(String(id)) }] }),
);
```

- `registerResource(name, uriOrTemplate, metadata, readCallback)`; `metadata` is required (`{}` if empty).
- Each content item echoes `uri` and carries `text` or base64 `blob`. A `list` callback on the template makes instances appear in `resources/list`.
- Template variables are client-controlled. For file-backed resources, `realpath` the joined path and reject anything outside the root before reading.
- Missing resource: throw `ResourceNotFoundError`.
- Per-resource `scopeChallenge: requireScopes('notes:read')` triggers HTTP 403 `insufficient_scope` step-up (see [auth-security.md](auth-security.md)).
- Per-resource subscriptions: a legacy-era client sends `resources/subscribe`; you track URIs per connection and call `server.server.sendResourceUpdated({ uri })`. On modern connections clients name URIs in `subscriptions/listen`; behind `createMcpHandler` publish with `handler.notify.resourceUpdated(uri)` and advertise `resources: { subscribe: true }`. Multi-node deployments need a shared `ServerEventBus`.

## Prompts

```ts
server.registerPrompt(
  'review_code',
  {
    title: 'Code review',
    description: 'Review code for correctness and style.',
    argsSchema: z.object({
      language: completable(z.string(), v => ['typescript', 'python', 'rust'].filter(l => l.startsWith(v))),
      code: z.string().describe('The code to review'),
    }),
  },
  ({ language, code }) => ({
    messages: [{ role: 'user' as const, content: { type: 'text' as const, text: `Review this ${language} code:\n\n${code}` } }],
  }),
);
```

- Prompts are user-controlled templates (slash commands, menus), not model-controlled tools. Invalid arguments reject with `-32602`.
- Messages take `role` `user` or `assistant`, one content block each (`text`, `image`, `audio`, `resource_link`, embedded `resource`).

## Completions

- Prompt arguments: wrap the field with `completable(schema, (value, context) => string[] | Promise<string[]>)`. For optional args use `completable(z.string(), cb).optional()`, not `completable(z.string().optional(), cb)`.
- Resource template variables: `complete: { var: (value, context) => string[] }` on the `ResourceTemplate`.
- `context.arguments` carries already-filled arguments; return `[]` when missing, never throw. The SDK caps `values` at 100 and fills `total` and `hasMore`. The first completable registration advertises the `completions` capability.

## Context (`ctx`), progress, cancellation

Handler context (second argument; first for no-schema tools):

- `ctx.mcpReq.signal` (`AbortSignal`, aborts on cancel or disconnect), `ctx.mcpReq._meta`, `ctx.mcpReq.id`, `ctx.mcpReq.method`, `ctx.mcpReq.notify(notification)`, `ctx.mcpReq.envelope` (modern per-request client identity), `ctx.mcpReq.inputResponses`, `ctx.mcpReq.requestState()`.
- `ctx.http?.authInfo` (verified token info; `undefined` on stdio), `ctx.http?.req` (original `Request`), `ctx.sessionId` (legacy era only).

Progress (client sends `progressToken` in `_meta`; `progress` must increase):

```ts
const token = ctx.mcpReq._meta?.progressToken;
if (token !== undefined) {
  await ctx.mcpReq.notify({ method: 'notifications/progress', params: { progressToken: token, progress: i + 1, total: n, message: `Processed ${i + 1}/${n}` } });
}
```

Cancellation: check `ctx.mcpReq.signal.aborted` in loops and pass `signal: ctx.mcpReq.signal` to `fetch` and other I/O. On modern HTTP, cancelling closes the request's SSE stream; on stdio and legacy it is `notifications/cancelled`. The SDK discards whatever a cancelled handler returns.

`createMcpHandler({ responseMode: 'json' })` never streams, which drops progress notifications; the default upgrades to SSE only when the handler emits notifications.

## Notifications and registration handles

- `server.sendToolListChanged()`, `sendPromptListChanged()`, `sendResourceListChanged()` for changes the SDK cannot see.
- `registerTool/Resource/Prompt` return handles with `update()`, `enable()`, `disable()`, `remove()`; each mutation sends the matching `list_changed`. Handles matter for long-lived instances (stdio, legacy sessions). Behind `createMcpHandler` the instance lives for one request, so vary the tool set per caller inside the factory instead, using `authInfo`.
- Modern change notices flow only on `subscriptions/listen`: behind `createMcpHandler` use `handler.notify.toolsChanged()` and friends; `serveStdio` routes the instance's own `send*` calls.
- Under 2026-07-28 `tools/list` MUST NOT vary per connection or as a side effect of other requests. It MAY vary by the authorization on the request (for example, only tools the caller's scopes allow). Keep it stable and cache-friendly.

## Caching hints

2026-07-28 requires `ttlMs` and `cacheScope` on `tools/list`, `prompts/list`, `resources/list`, `resources/templates/list`, and `resources/read`. The SDK defaults to `ttlMs: 0`, `cacheScope: 'private'`. Opt in:

```ts
new McpServer(info, { cacheHints: { 'tools/list': { ttlMs: 60_000, cacheScope: 'public' } } });
```

Use `'public'` only when the result is identical for every caller. Per-resource `cacheHint` goes in `registerResource` metadata. Clients cap `ttlMs` at 24 hours.

## Logging (deprecated)

MCP logging is deprecated as of 2026-07-28. Prefer `console.error` on stdio and OpenTelemetry on HTTP. If a legacy client needs it: `new McpServer(info, { capabilities: { logging: {} } })` and `await ctx.mcpReq.log('info', data)`. On modern requests the level comes from the per-request `logLevel` key; absent means no log messages.

## Roots (deprecated)

Roots (`roots/list`) are deprecated with no replacement. Pass paths as tool arguments, expose owned locations as resources, or configure fixed directories on the server. Roots are advisory and never enforce access.
