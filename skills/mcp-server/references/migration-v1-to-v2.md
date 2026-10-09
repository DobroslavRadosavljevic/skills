# Migration: v1 `@modelcontextprotocol/sdk` to v2

Two separate upgrades exist. Do them in order, and keep them in separate commits.

1. **SDK surface upgrade** (v1 package to v2 packages). Mostly mechanical; run the codemod.
2. **Adopting protocol 2026-07-28** (stateless handler, `input_required`, no sessions). Architectural; not automated.

A v2 server can serve both eras from one factory, so step 2 does not have to break existing clients.

## Table of contents

- Before you start
- Step 1: run the codemod
- API mapping table
- Package and import changes
- Behavior changes that bite
- Step 2: adopt 2026-07-28
- Staged migration
- Verification

## Before you start

- Node >= 20, ESM. Zod must be >= 4.2 (Zod 3 is unsupported and fails at the first `tools/list`).
- `bun add @modelcontextprotocol/sdk` still resolves to v1 (1.32.1 is that package's `latest`). The v2 packages are `@modelcontextprotocol/server` and `@modelcontextprotocol/client`.
- v1 stays supported for bug and security fixes for at least six months after the 2026-07-27 v2 release. There is no need to rush a production migration, but v1 does not implement spec 2026-07-28.
- Commit a clean tree. The codemod rewrites `package.json`, imports, and call sites.

## Step 1: run the codemod

```sh
bunx @modelcontextprotocol/codemod@latest v1-to-v2 .   # run at the package root, not ./src
grep -rn '@mcp-codemod-error' .                        # sites it recognized but could not rewrite
bunx tsc --noEmit                                      # remaining errors map to the sections below
```

- The codemod updates the nearest `package.json` only. Monorepo members are listed in its summary; edit them yourself.
- It does not reformat; run your formatter on the changed files.
- It rewrites imports, symbol renames, `.tool()/.prompt()/.resource()` to `register*` (wrapping raw shapes with `z.object()`), `setRequestHandler(Schema, ...)` to method strings, and `extra.*` to `ctx.*`.
- It does not handle: header reads (`.get()`), `ctx.mcpReq.send()` schema args, OAuth error class consolidation, `SdkErrorCode` branch choice, namespace schema imports, files that receive the SDK by injection (no import), and behavioral adaptation.

## API mapping table

| v1 | v2 |
| --- | --- |
| `@modelcontextprotocol/sdk` | `@modelcontextprotocol/server` + `/client` (+ adapters) |
| `server.tool(name, desc, shape, cb)` | `server.registerTool(name, { description, inputSchema: z.object(shape) }, cb)` |
| `server.prompt(...)` / `server.resource(...)` | `registerPrompt` / `registerResource` (`metadata` argument required; `{}` if none) |
| raw shape `{ a: z.string() }` | schema object `z.object({ a: z.string() })` (raw shapes deprecated) |
| `completable(z.string().optional(), cb)` | `completable(z.string(), cb).optional()` |
| tool/prompt without schema: `(extra) =>` | `(ctx) =>` (single argument is the context) |
| `extra.signal` / `requestId` / `_meta` | `ctx.mcpReq.signal` / `.id` / `._meta` |
| `extra.sendNotification(...)` | `ctx.mcpReq.notify(...)` |
| `extra.authInfo` | `ctx.http?.authInfo` (undefined on stdio) |
| `extra.requestInfo.headers['x']` | `ctx.http?.req?.headers.get('x')` |
| `extra.sessionId` | `ctx.sessionId` |
| `McpError`, `ErrorCode` | `ProtocolError`, `ProtocolErrorCode` (`SdkError`/`SdkErrorCode` for local errors; `SdkHttpError` replaces `StreamableHTTPError`) |
| `setRequestHandler(CallToolRequestSchema, ...)` | `setRequestHandler('tools/call', ...)` |
| `new StdioServerTransport(); server.connect(t)` | `serveStdio(factory)` from `@modelcontextprotocol/server/stdio` (serves both eras) |
| per-request `StreamableHTTPServerTransport` + `connect()` | `createMcpHandler(factory)` |
| sessionful `StreamableHTTPServerTransport` | `NodeStreamableHTTPServerTransport` (`@modelcontextprotocol/node`) or `WebStandardStreamableHTTPServerTransport` (`@modelcontextprotocol/server`); or move to the stateless handler |
| `SSEServerTransport` | removed; frozen copy at `@modelcontextprotocol/server-legacy/sse`; migrate to Streamable HTTP |
| `WebSocketClientTransport` | removed (not a spec transport) |
| `StdioClientTransport` import | `@modelcontextprotocol/client/stdio` |
| `InMemoryTransport` | exported from `server` and `client`; use one package per linked pair |
| `mcpAuthRouter`, `ProxyOAuthServerProvider` | frozen at `@modelcontextprotocol/server-legacy/auth`; prefer a dedicated IdP |
| `requireBearerAuth`, `mcpAuthMetadataRouter` | `@modelcontextprotocol/express` (or `requireBearerAuth` from `server` for fetch hosts) |
| `hostHeaderValidation()` | `@modelcontextprotocol/express`; helpers `hostHeaderValidationResponse`, `localhostAllowedHostnames` in `server` |
| `server.elicitInput`, `server.createMessage` inside handlers | `ctx.mcpReq.elicitInput` / `requestSampling` (legacy-era only) or return `inputRequired(...)` |
| Zod `*Schema` constants from `sdk/types.js` | `@modelcontextprotocol/core` |
| `client.callTool(params, ResultSchema)` | `client.callTool(params)` (schema argument dropped for spec methods) |

Deep imports such as `@modelcontextprotocol/sdk/server/mcp.js` no longer resolve.

## Package and import changes

- `EventStore`, `StreamId`, `EventId` export from `@modelcontextprotocol/server` only.
- Client fetch middleware (`createMiddleware`, `applyMiddlewares`, `withLogging`, `withOAuth`, `FetchLike`) exports from `@modelcontextprotocol/client`.
- Pick the transport by runtime: Node `IncomingMessage`/`ServerResponse` means `@modelcontextprotocol/node`; web `Request`/`Response` means `@modelcontextprotocol/server`.
- Deprecated but functional in v2: `Server.createMessage`, `listRoots`, `sendLoggingMessage`; `ctx.mcpReq.log` and `requestSampling`; `registerClient` (DCR). Task wire vocabulary is deprecated; experimental task interception is removed.

## Behavior changes that bite

- `McpServer` serves one connection at a time. A shared server object plus new transports per request now fails (`ALREADY_CONNECTED`, 500). Build the server inside the factory.
- A declared `tools: {}` with zero tools answers `tools/list` with `[]` instead of `-32601`, and `listChanged: true` is advertised; re-baseline capability goldens.
- `createMcpExpressApp`/`Hono`/`Fastify` on localhost binds validate `Origin` by default. Browser clients on another origin need `allowedOrigins`. `Origin: null` is rejected with 403 and cannot be allowlisted.
- POST bodies must be `Content-Type: application/json` (parsed media type); otherwise 415.
- Zod: descriptions are lost on Zod 4.0 to 4.1; use >= 4.2.0. One Zod copy only.
- Error shapes changed in every era: handler exceptions in tools become `isError` results; resource-not-found uses `-32602`.
- Resource templates: the `ResourceTemplate` helper class keeps its name; the wire type is `ResourceTemplateType`.
- `registerResource` reserves a `cacheHint` metadata key.
- Client `StreamableHTTPClientTransport` appends to the `Accept` header instead of replacing it; transport-managed `Authorization` wins over static `requestInit` headers once a provider returns a token.

## Step 2: adopt 2026-07-28

1. Replace transport wiring with `serveStdio(factory)` / `createMcpHandler(factory)`. Default postures serve 2025 clients too.
2. Remove state held on the server instance or keyed by `Mcp-Session-Id`. Mint explicit handles returned in tool results and passed back as arguments; key stored state by verified user plus handle.
3. Replace push-style elicitation, sampling, and roots with `inputRequired(...)` and `acceptedContent(...)`; sign `requestState`.
4. Replace unsolicited `list_changed` and `resources/subscribe` with `handler.notify.*` (HTTP) or the instance's own `send*` calls (`serveStdio`), plus a shared `ServerEventBus` when multi-node.
5. Move logging to stderr or OpenTelemetry. Stop relying on `logging/setLevel` and `ping`.
6. Set `cacheHints` for stable lists.
7. Add `ctx.mcpReq.envelope` reads where you used `getClientCapabilities()` or `getClientVersion()` on modern connections.
8. Drop HTTP+SSE. Keep `server-legacy/sse` only until the last SSE-only client is gone.
9. Test both eras: a `mode: 'auto'` client and a default (legacy) client against the same factory; add `legacy: 'reject'` only when you decide to drop 2025 clients.
10. Hand-rolled clients must send `MCP-Protocol-Version`, `Mcp-Method`, and `Mcp-Name` headers on modern POSTs, and `Content-Type: application/json`.

Keep an existing sessionful HTTP deployment running by routing in front of a strict handler: `if (await isLegacyRequest(request)) return existingLegacyHandler(request); return createMcpHandler(factory, { legacy: 'reject' }).fetch(request);`.

## Staged migration

For large codebases the v1 and v2 packages have different names and can be installed together.

1. Add the v2 packages and `zod@^4.2` while keeping `@modelcontextprotocol/sdk`.
2. Rewrite sources directory by directory or package by package. Run the codemod with `--dry-run` or `--ignore` globs for staged passes: it updates the nearest manifest, including removing the v1 dependency, so revert that edit until the last stage.
3. Remove v1 only when nothing imports it (`grep -rn "@modelcontextprotocol/sdk" src package.json`).
4. Never pass SDK objects (clients, servers, errors, transports) between v1-imported and v2-imported code: `instanceof` and nominal types do not cross. Stage along process or transport boundaries; the two sides speak the 2025 `initialize` handshake and settle on the newest shared revision.
5. Library authors: swapping the peer dependency from `@modelcontextprotocol/sdk` to the v2 packages is a breaking change for consumers; ship it as a major version, and migrate ahead only if no SDK object crosses your public API.

## Verification

- `grep -rn '@mcp-codemod-error' .` is empty.
- Typecheck is clean with a single Zod 4.2+ copy.
- In-process client tests pass on a `versionNegotiation: { mode: 'auto' }` client (modern) and a default client (legacy).
- stdio smoke test shows no stdout pollution.
- No remaining imports from `@modelcontextprotocol/sdk` (`grep -rn "@modelcontextprotocol/sdk" src package.json`).
- If auth exists: 401, 403, audience mismatch, and PRM tests pass; `@modelcontextprotocol/express` >= 2.0.2 with server >= 2.3.0 so `expectedResource` is honored.
