# Transports, Sessions, Frameworks, and Deployment

## Table of contents

- Choose a transport
- stdio
- Streamable HTTP with createMcpHandler
- Mounting: Bun and web-standard runtimes, node:http, Express, Hono, Fastify
- Stateless mode, sessions, and state
- Legacy clients and SSE
- Cloudflare Workers
- Vercel
- Containers and reverse proxies
- Host config for clients

## Choose a transport

| Need | Transport |
| --- | --- |
| Local tool launched by a host (Claude Code, VS Code, Cursor) | stdio via `serveStdio` |
| Remote or multi-client endpoint | Streamable HTTP via `createMcpHandler` |
| Existing sessionful 2025 deployment | keep it behind `isLegacyRequest` routing; plan migration |
| HTTP+SSE (`GET /sse` + `POST /messages`) | deprecated since 2025-03-26; only `@modelcontextprotocol/server-legacy/sse` as a bridge |

WebSocket is not a spec transport; v2 removed `WebSocketClientTransport`.

## stdio

```ts
import { serveStdio } from '@modelcontextprotocol/server/stdio';
const handle = serveStdio(createServer);        // legacy: 'serve' by default; { legacy: 'reject' } refuses 2025 openings
process.on('SIGINT', () => void handle.close());
```

- stdout is JSON-RPC only. One `console.log` (yours or a dependency's) breaks the host with `SyntaxError: Unexpected token ... is not valid JSON`. Use `console.error`.
- Closing stdin tears the connection down. If you hold a timer or pool, release it in `server.server.onclose` so the process exits.
- Credentials come from the environment (spec: stdio servers should not follow the OAuth flow). Never echo env values in tool output.
- Hosts launch the exact command you register. For a published package, `bunx <pkg>` or `npx -y <pkg>`; see [testing-packaging.md](testing-packaging.md). Register with e.g. `claude mcp add notes -- bun run src/index.ts`, or `.vscode/mcp.json` / `.cursor/mcp.json` entries with `command` and `args`.

## Streamable HTTP with createMcpHandler

```ts
import { createMcpHandler } from '@modelcontextprotocol/server';
const handler = createMcpHandler(({ era, authInfo, requestInfo }) => buildServer(authInfo), {
  // legacy: 'stateless' (default) | 'reject'
  // responseMode: 'json' | 'sse'   (default: JSON, upgrades to SSE when a handler emits notifications)
  // keepAliveMs: 15_000            (SSE comment heartbeat; 0 disables)
  // bus: sharedServerEventBus      (multi-node subscriptions)
  // maxRequestBodySize: 4 * 1024 * 1024  (default 4 MiB)
  // onerror: err => console.error(err)   (factory and serving failures)
});
await handler.close(); // shutdown: aborts in-flight exchanges
```

- Returns `{ fetch, close, notify, bus }`. `fetch` is a web-standard `(Request, { authInfo?, parsedBody? }) => Promise<Response>`.
- One endpoint path (commonly `/mcp`) handles POST. Under 2026-07-28 there is no standalone GET stream and no DELETE.
- Required request headers on modern POSTs: `MCP-Protocol-Version`, `Mcp-Method`, `Mcp-Name` (for name/uri methods); mismatch with the body returns 400 `-32020`. SDK clients send them. Hand-rolled clients must too. Clients send `Accept: application/json, text/event-stream`.
- The body limit is the `maxRequestBodySize` option (4 MiB default); `McpServer({ maxToolInputElements })` caps array and object element counts. Set `onerror` so factory failures are logged.
- The handler validates **no** token, `Host`, or `Origin`. Put those in front (below and in [auth-security.md](auth-security.md)).
- Per-request factory argument: `{ era, authInfo, requestInfo }`. Register a different tool set per caller there.
- Notify subscribers: `handler.notify.toolsChanged() | promptsChanged() | resourcesChanged() | resourceUpdated(uri)`. Multi-process: implement the two-method `ServerEventBus` (`publish`, `subscribe`) over Redis or similar and pass the same bus to every node; the default bus is in-process.

## Mounting

Bun, Deno, Workers (web-standard `{ fetch }`):

```ts
import { createMcpHandler, hostHeaderValidationResponse, originValidationResponse } from '@modelcontextprotocol/server';

const handler = createMcpHandler(createServer);
export default {
  port: 3000,
  async fetch(request: Request): Promise<Response> {
    const rejected =
      hostHeaderValidationResponse(request, ['mcp.example.com']) ?? originValidationResponse(request, ['https://app.example.com']);
    if (rejected) return rejected;
    // const auth = await gate(request); if (auth instanceof Response) return auth;   // see auth-security.md
    return handler.fetch(request /*, { authInfo: auth } */);
  },
};
```

- `bun run src/http.ts` serves a default export with `fetch`. (Smoke-tested on Bun 1.4.2; explicit `Bun.serve({ hostname: '127.0.0.1', fetch })` also works.) For a localhost-only process use `localhostAllowedHostnames()` and `localhostAllowedOrigins()`. Requests without an `Origin` header always pass; both helpers take hostnames, not ports.
- Elysia and other frameworks are not covered by the SDK docs. Any framework that exposes the raw web `Request` can forward it to `handler.fetch(request)`; add the Host/Origin/token checks yourself and test with an in-process client before relying on it.

`node:http`:

```ts
import { createServer } from 'node:http';
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from '@modelcontextprotocol/node';
const node = toNodeHandler(handler);
const validateHost = localhostHostValidation();
const validateOrigin = localhostOriginValidation();
createServer((req, res) => {
  if (!validateHost(req, res) || !validateOrigin(req, res)) return;
  void node(req, res);
}).listen(3000, '127.0.0.1');
```

Express (`bun add @modelcontextprotocol/express @modelcontextprotocol/node express`):

```ts
import { createMcpExpressApp } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
const app = createMcpExpressApp();            // express.json() + localhost Host/Origin validation
const node = toNodeHandler(handler);
app.all('/mcp', (req, res) => void node(req, res, req.body)); // pass req.body: the stream is already parsed
app.listen(3000);
// Public bind: createMcpExpressApp({ host: '0.0.0.0', allowedHosts: ['api.example.com'] })
```

Hono (`createMcpHonoApp`); keep the `c: Context` annotation so `c.get('parsedBody')` typechecks:

```ts
import { createMcpHonoApp } from '@modelcontextprotocol/hono';
import type { Context } from 'hono';
const app = createMcpHonoApp();
app.all('/mcp', (c: Context) => handler.fetch(c.req.raw, { parsedBody: c.get('parsedBody') }));
export default app; // Bun, Deno, Workers; on Node use @hono/node-server
```

Fastify (`createMcpFastifyApp`): `app.all('/mcp', (request, reply) => node(request.raw, reply.raw, request.body))`.

All three app factories arm Host and Origin validation on localhost binds. Binding to `0.0.0.0` drops that default, so pass `allowedHosts` (and `allowedOrigins`, which replaces the default list; start from `localhostAllowedOrigins()` to keep it). Browser-extension clients send their extension id as `Origin`; add it, or a lowercase scheme entry such as `moz-extension://*`. `http://*` and `https://*` are not honoured.

## Stateless mode, sessions, and state

- `createMcpHandler` is stateless: nothing lives between requests, so any load balancer works with no affinity.
- 2026-07-28 has no protocol sessions. When tools need state across calls (cart, workflow, draft), mint an explicit handle and return it in a tool result; the model passes it back as an argument. Use unguessable random ids, expire them, and **key stored state by the verified user and handle together** (for example `<userId>:<handle>`, user id from the token). Possession of a handle is never authentication.
- Subscriptions are the one cross-node concern: share a `ServerEventBus`.
- Sessionful 2025-era serving is hand-wired: `new NodeStreamableHTTPServerTransport({ sessionIdGenerator: () => randomUUID(), eventStore? })`, one transport per session in a map keyed by `Mcp-Session-Id`, one `McpServer` per transport, idle-timeout and max-session caps, `404` for unknown ids, `400` for missing ids. Only keep this for clients you cannot move; resumability needs a shared `EventStore`.
- Stateless mode in the old API (`sessionIdGenerator: undefined`) needs a **fresh server and transport per request**. Reusing either fails (`ALREADY_CONNECTED`, HTTP 500).

## Legacy clients and SSE

- Default `legacy: 'stateless'` serves 2025 clients per request, but legacy `GET` (standalone SSE) and `DELETE` answer 405.
- Keep an existing sessionful deployment: `createMcpHandler(factory, { legacy: 'reject' })` behind `if (await isLegacyRequest(request)) return legacyHandler(request); return modern.fetch(request);`. Behind an Express body parser build the request with `toWebRequest(req, req.body)` from `@modelcontextprotocol/node`.
- The v2 server never serves HTTP+SSE. A frozen v1 copy ships as `@modelcontextprotocol/server-legacy/sse` (deprecated, planned removal in v3). The client keeps `SSEClientTransport` to reach old servers.
- Clients that use `Last-Event-ID` resume only on 2025-era sessionful servers; modern clients re-issue broken requests.

## Cloudflare Workers

- `export default handler` (or the guarded `{ fetch }` above) is the whole mount. No Node adapter, no `nodejs_compat` flag required; the workerd build uses `@cfworker/json-schema` and calls `preloadSchemas()` automatically.
- `wrangler dev src/worker.ts` serves on `http://127.0.0.1:8787`. Deploy with `bunx wrangler deploy`.
- Workers are per-request isolates, which matches the per-request factory. Put secrets in Wrangler secrets, not source.
- Cloudflare's own docs describe a separate `createMcpHandler` (stateless) in its `agents` package plus a deprecated stateful `McpAgent`. The SDK-handler route above is the one the SDK documents; read Cloudflare's remote-MCP guide before choosing its higher-level package, and pin versions.
- For OAuth on Workers, Cloudflare documents Cloudflare Access and third-party providers with its OAuth provider library. Whichever you pick, the MCP server still validates audience-bound tokens (see [auth-security.md](auth-security.md)).

## Vercel

Vercel documents `mcp-handler` for Next.js App Router. `mcp-handler@2.x` wraps the v2 SDK:

```sh
bun add mcp-handler @modelcontextprotocol/server@2 zod@4
```

```ts
// app/api/mcp/route.ts
import { createMcpHandler } from 'mcp-handler';
import * as z from 'zod';

const handler = createMcpHandler(server => {
  server.registerTool('roll_dice', { description: 'Roll an N-sided die', inputSchema: z.object({ sides: z.number().int().min(2) }) },
    async ({ sides }) => ({ content: [{ type: 'text', text: String(1 + Math.floor(Math.random() * sides)) }] }));
});
export { handler as GET, handler as POST };
```

- Auth helpers: `withMcpAuth(handler, verifyToken, { required: true, requiredScopes, resourceMetadataPath })`, `protectedResourceHandler({ authServerUrls, resourceUrl })` for the `.well-known/oauth-protected-resource` route, and `metadataCorsOptionsRequestHandler()`. The package does not issue tokens. In `verifyToken` check issuer, audience, expiry, and scopes; the doc's demo env-var token is for local testing only.
- Clients connect to `/api/mcp` over Streamable HTTP. mcp-handler 2.x removed legacy SSE and Redis config. Vercel documents Fluid compute for idle-heavy MCP traffic, and Deployment Protection for previews.
- npm `latest` for `mcp-handler` was 2.3.0 on 2026-10-09 (Vercel docs pin 2.1.1). Check the release you install.
- Without Next.js, a plain Vercel Function can export the web-standard handler; verify against the Vercel docs for your runtime.

## Containers and reverse proxies

- Node >= 20 base image, or an official Bun image. Install production deps only, run as a non-root user, one process per container.
- Bind `0.0.0.0` inside the container, so you must set `allowedHosts` to the public hostnames and terminate TLS at the proxy. Without that, Host/Origin validation is off or rejects your own traffic.
- Expose a health route outside `/mcp` (do not invent an MCP method); handle `SIGTERM` by calling `await handler.close()` then exiting.
- Disable response buffering for the MCP path in the proxy (NGINX `proxy_buffering off`), keep read timeouts above the longest tool call, and keep the 15 s SSE heartbeat (`keepAliveMs`) so idle streams survive intermediaries. `SSE stream disconnected: TypeError: terminated` means a proxy or client idle timeout closed the stream.
- Scale horizontally with no affinity. Share a `ServerEventBus` and the `requestState` codec key across replicas.
- Secrets come from the platform secret store, never baked into the image or tool output.

Example (Bun):

```dockerfile
FROM oven/bun:1
WORKDIR /app
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile --production
COPY src ./src
USER bun
EXPOSE 3000
CMD ["bun", "run", "src/http.ts"]
```

## Host config for clients

Remote server in a host config (Cursor shape): `{ "mcpServers": { "notes": { "url": "https://mcp.example.com/mcp" } } }`. Local stdio: `{ "command": "bunx", "args": ["my-mcp-server"] }` (use `npx` with `-y` if the host lacks Bun). Clients should show the exact launch command before running it, so keep yours plain and documented.
