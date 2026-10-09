---
name: mcp-server
description: "Build, review, debug, test, secure, migrate, package, or deploy Model Context Protocol (MCP) servers in TypeScript with the official SDK v2 (@modelcontextprotocol/server 2.3.x, @modelcontextprotocol/client, adapters node/express/hono/fastify) against MCP spec 2026-07-28. Use for McpServer, registerTool, registerResource, registerPrompt, ResourceTemplate, completable, inputSchema/outputSchema (Zod 4, Standard Schema, ArkType, Valibot, fromJsonSchema), structuredContent, isError, tool annotations (readOnlyHint, destructiveHint), createMcpHandler, serveStdio, Streamable HTTP, stateless mode, SSE deprecation, ctx.mcpReq (signal, notify, progress), input_required / inputRequired / acceptedContent / requestState (elicitation, sampling, roots), deprecated logging, requireBearerAuth, OAuth 2.1 resource server, protected resource metadata, scopeChallenge, Client ID Metadata Documents, DNS rebinding Host/Origin checks, prompt-injection-aware tool design, tool-design checklist, MCP Inspector, in-process Client tests, bunx/bun publish packaging, Bun, Hono, Express, Cloudflare Workers, Vercel mcp-handler, containers, and v1 @modelcontextprotocol/sdk to v2 migration with the codemod."
---

# MCP Server (TypeScript)

Use this skill when work touches an MCP server written in TypeScript: tools, resources, prompts, transports, auth, tests, packaging, deployment, or an upgrade from the v1 SDK.

Snapshot (2026-10-09): `@modelcontextprotocol/server@2.3.1` and `@modelcontextprotocol/client@2.3.1` (v2 is the stable line). Latest spec revision: **2026-07-28**. `@modelcontextprotocol/sdk@1.32.1` is the v1 line, still the npm `latest` of that package name: do not install it for new work. Refresh from [source-map.md](references/source-map.md) when the installed version differs.

## Workflow

1. Inspect the project first:
   - Which package: `@modelcontextprotocol/sdk` (v1) or `@modelcontextprotocol/server` (v2). Check the lockfile, Node/Bun version (Node >= 20), `zod` range (v2 needs Zod >= 4.2; Zod 3 fails at the first `tools/list`).
   - Transport in use (stdio, Streamable HTTP, legacy SSE), host framework (Hono, Express, Fastify, `node:http`, Bun, Workers), and whether clients still speak a 2025-era revision.
   - Existing auth, tool count, and tests.
2. Route to the focused reference:
   - Packages, versions, spec eras, install: [setup-versions.md](references/setup-versions.md)
   - `McpServer`, tools, resources, prompts, schemas, errors, completion, progress, cancellation: [server-api.md](references/server-api.md)
   - Asking the user or client for input mid-call (`input_required`, elicitation, sampling, roots, `requestState`): [input-required.md](references/input-required.md)
   - stdio, Streamable HTTP, stateless vs sessions, legacy clients, Bun/Hono/Express/Fastify, Workers, Vercel, containers: [transports-deploy.md](references/transports-deploy.md)
   - OAuth resource server, token validation, scopes, Host/Origin checks, threat model: [auth-security.md](references/auth-security.md)
   - Tool design for LLMs and the checklist: [tool-design.md](references/tool-design.md)
   - Tests, MCP Inspector, publishing for `bunx`/npm: [testing-packaging.md](references/testing-packaging.md)
   - v1 to v2 migration: [migration-v1-to-v2.md](references/migration-v1-to-v2.md)
3. Verify API names against the installed package types or the v2 docs before writing code. This SDK renamed most v1 APIs.

## Core Judgment

- Install `@modelcontextprotocol/server` (plus `zod@^4.2`), not `@modelcontextprotocol/sdk`. Add exactly the adapter you need: `@modelcontextprotocol/node`, `express`, `hono`, or `fastify`. Import stdio pieces from the `./stdio` subpath.
- Write one **server factory** (`() => McpServer`) and hand it to `serveStdio(factory)` or `createMcpHandler(factory)`. The HTTP factory runs once per request. Never share one `McpServer` across requests or sessions: the second connection fails with `ALREADY_CONNECTED`. Create pools and caches at module scope; keep the factory cheap.
- Use `registerTool(name, { description, inputSchema, outputSchema?, annotations? }, handler)`. `inputSchema` is a schema object (`z.object(...)`), not a raw shape. A tool with no `inputSchema` gets `ctx` as its only handler argument.
- Report tool failures the model can fix as `{ content: [...], isError: true }` or by throwing. Reserve `ProtocolError` for resource, prompt, and completion callbacks. Put the recovery hint in the error text.
- Return `structuredContent` that matches `outputSchema` and also a JSON `text` block. The SDK validates output and skips validation on `isError` results.
- `2026-07-28` is stateless: no `initialize`, no `Mcp-Session-Id`, no resumable SSE. Store cross-call state behind server-minted handles passed as tool arguments, bound to the verified user. `createMcpHandler` also serves 2025-era clients per request by default (`legacy: 'stateless'`).
- Server-to-client requests changed. `ctx.mcpReq.elicitInput` and `requestSampling` throw on 2026-07-28 connections. Return `inputRequired(...)` and read `acceptedContent(ctx.mcpReq.inputResponses, ...)` instead; the SDK shim serves older clients. Roots, sampling, and MCP logging are deprecated (SEP-2577). Prefer tool arguments, direct LLM calls, and stderr or OpenTelemetry.
- On stdio, stdout is the protocol channel. Log with `console.error` only.
- HTTP safety is not automatic. `createMcpHandler` checks no token, `Host`, or `Origin`. Use the framework app factories (`createMcpExpressApp`, `createMcpHonoApp`, `createMcpFastifyApp`) or `hostHeaderValidationResponse` / `originValidationResponse`, and verify bearer tokens in front. Bind `127.0.0.1` for local servers.
- Authorization is optional, applies to HTTP only, and the server is a resource server: validate audience and expiry (`expectedResource`), publish RFC 9728 metadata, challenge with `WWW-Authenticate`, never pass client tokens to downstream APIs. Do not run your own authorization server; use an identity provider. stdio servers read credentials from the environment.
- Tool output is untrusted input to the model. Keep tools few, narrowly scoped, and honest in annotations (annotations are hints and clients must treat them as untrusted). Never put secrets in tool results, descriptions, or form elicitation.
- Treat all arguments, `inputResponses`, `requestState`, and resource URI variables as attacker-controlled. Resolve file paths with `realpath`, resolve URLs from fixed lists (SSRF), and cap sizes (`maxToolInputElements`, transport body limit).
- SSE-only transport is deprecated. New servers use Streamable HTTP; the frozen `@modelcontextprotocol/server-legacy/sse` exists only as a bridge.
- Commands use `bun`/`bunx`. The SDK runs on Bun, Node, and Deno; Workers works without `nodejs_compat`.

## Verification

- Typecheck. Zod duplicates cause `TS2589`; keep one Zod 4 copy.
- Call every tool through a real `Client` in process: `StreamableHTTPClientTransport` with `fetch: (u, i) => handler.fetch(new Request(u, i))`, `versionNegotiation: { mode: 'auto' }`. Assert `structuredContent`, `isError` paths, and schema rejections.
- Cover stdio by spawning the real process with `StdioClientTransport`; assert stdout stays clean.
- Smoke with the Inspector CLI (`bunx @modelcontextprotocol/inspector --cli ... --method tools/list --format json`), pinning the Inspector version in CI.
- Test auth: no token gives 401 with `WWW-Authenticate`, wrong audience gives 401, missing scope gives 403, valid token reaches `ctx.http.authInfo`.
- Run the tool-design checklist in [tool-design.md](references/tool-design.md) before shipping.

Report which checks ran, which did not, and any assumptions about spec era, clients, or hosting.
