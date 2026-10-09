# Setup, Versions, and Protocol Eras

Snapshot: 2026-10-09.

## Table of contents

- Package map and versions
- Install
- Spec revision and eras
- Minimal servers
- Runtime requirements

## Package map and versions

The SDK is a monorepo. v2 is the stable line and implements spec **2026-07-28**. The v1 package `@modelcontextprotocol/sdk` (1.32.1) receives bug and security fixes only (at least six months after the v2 release on 2026-07-27).

| Package | Version | Use |
| --- | --- | --- |
| `@modelcontextprotocol/server` | 2.3.1 | Build servers: `McpServer`, `createMcpHandler`, auth gate, validators |
| `@modelcontextprotocol/client` | 2.3.1 | Clients and tests: `Client`, `StreamableHTTPClientTransport`, `InMemoryTransport` |
| `@modelcontextprotocol/node` | 2.1.1 | `toNodeHandler`, `NodeStreamableHTTPServerTransport`, localhost validators |
| `@modelcontextprotocol/express` | 2.0.2 | `createMcpExpressApp`, `requireBearerAuth`, `mcpAuthMetadataRouter` |
| `@modelcontextprotocol/hono` | 2.0.2 | `createMcpHonoApp` |
| `@modelcontextprotocol/fastify` | 2.0.1 | `createMcpFastifyApp` |
| `@modelcontextprotocol/core` | 2.3.1 | Raw Zod wire schemas only (gateways, proxies) |
| `@modelcontextprotocol/server-legacy` | 2.3.1 | Frozen v1 SSE transport and OAuth Authorization Server helpers (bridge only) |
| `@modelcontextprotocol/codemod` | 2.3.1 | `v1-to-v2` rewrite tool |
| `@modelcontextprotocol/inspector` | 2.10.1 | Inspector (web, CLI, TUI); needs Node >= 22.19 |

`server`, `client`, `core`, `server-legacy`, and `codemod` always release together at the same version. The adapters version independently. `@modelcontextprotocol/core-internal` is private: never import it.

Check current versions before pinning: `bun info @modelcontextprotocol/server version`.

## Install

```sh
bun add @modelcontextprotocol/server zod@^4.2
bun add -d @modelcontextprotocol/client typescript   # tests and clients
# optional HTTP adapters, install only what you use
bun add @modelcontextprotocol/express @modelcontextprotocol/node express
bun add @modelcontextprotocol/hono hono
bun add @modelcontextprotocol/fastify @modelcontextprotocol/node fastify
```

- `type: "module"` in `package.json`. The packages are ESM-first and also ship a CommonJS build.
- Zod must be **>= 4.2.0**. Import with `import * as z from 'zod/v4'`. Zod 3 is unsupported and fails quietly at the first `tools/list`. Zod 4.0 to 4.1 drops `.describe()` text from generated JSON Schema.
- Standard Schema libraries work as-is (ArkType) or through a wrapper (Valibot via `toStandardJsonSchema` from `@valibot/to-json-schema`). `fromJsonSchema<T>(doc)` wraps plain JSON Schema.
- One Zod copy only. A second copy causes `TS2589: Type instantiation is excessively deep`; fix with `bun pm ls zod` and an `overrides` entry.
- Subpath exports: `@modelcontextprotocol/server/stdio` (`serveStdio`, `StdioServerTransport`), `@modelcontextprotocol/client/stdio` (`StdioClientTransport`), `.../validators/ajv`, `.../validators/cf-worker`. Package roots are runtime-neutral (browsers, Workers).
- Deep v1 paths such as `@modelcontextprotocol/sdk/server/mcp.js` no longer exist.

## Spec revision and eras

Latest published revision: **2026-07-28**. Earlier: 2025-11-25, 2025-06-18, 2025-03-26, 2024-11-05. A `draft` also exists; do not target it.

The SDK groups revisions into two eras and serves both from one factory:

| | legacy era (2024-10-07 to 2025-11-25) | modern era (2026-07-28) |
| --- | --- | --- |
| Handshake | `initialize` / `initialized` | none; `server/discover`; `_meta` envelope on every request |
| Sessions | `Mcp-Session-Id` | none; use explicit handles in tool arguments |
| Server asks client | push `elicitation/create`, `sampling/createMessage`, `roots/list` | return `input_required` results; client retries |
| Change notices | unsolicited `list_changed` | `subscriptions/listen` stream |
| Stream resume | `Last-Event-ID` | removed; client re-issues the request |
| Logging level | `logging/setLevel` | per-request `logLevel` envelope key; absent means no logs |
| `ping` | yes | removed |
| Results | none required | `resultType`, `ttlMs`, `cacheScope` on cacheable lists |
| Tasks | in core (experimental) | official extension `io.modelcontextprotocol/tasks` |

Deprecated in 2026-07-28 (SEP-2577 and SEP-2596): Roots, Sampling, Logging, HTTP+SSE transport, Dynamic Client Registration (prefer Client ID Metadata Documents). Deprecated features stay for at least twelve months.

Server HTTP entry: `createMcpHandler`. Default `legacy: 'stateless'` serves 2025 clients per request; `legacy: 'reject'` makes the endpoint modern-only. stdio entry: `serveStdio` (default `legacy: 'serve'`). A hand-built `server.connect(new StdioServerTransport())` speaks the legacy era only.

Client side: `new Client(info, { versionNegotiation: { mode: 'auto' } })` probes with `server/discover` and falls back to `initialize`. Default is legacy `initialize` with no probe. `{ pin: '2026-07-28' }` never falls back. `client.getProtocolEra()` reports `modern` or `legacy`.

## Minimal servers

stdio:

```ts
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

function createServer(): McpServer {
  const server = new McpServer({ name: 'notes', version: '1.0.0' });
  server.registerTool(
    'add_note',
    { description: 'Save a note.', inputSchema: z.object({ text: z.string().min(1) }) },
    async ({ text }) => ({ content: [{ type: 'text', text: `Saved: ${text}` }] }),
  );
  return server;
}

void serveStdio(createServer);
console.error('notes MCP server running on stdio'); // stderr only
```

HTTP on a web-standard runtime (Bun, Workers, Deno):

```ts
import { createMcpHandler } from '@modelcontextprotocol/server';

const handler = createMcpHandler(createServer);
export default handler; // { fetch, close, notify, bus }
```

Run: `bun run src/index.ts` (stdio host command) or `bun run src/http.ts`.

## Runtime requirements

- Node >= 20 for all `@modelcontextprotocol/*` packages. Inspector needs Node >= 22.19.
- Bun runs the SDK (Bun 1.4.2 was used to smoke-test stdio, `createMcpHandler`, and in-process `Client` tests). Deno is also supported.
- Cloudflare Workers: no `nodejs_compat` flag is needed; the workerd build selects `@cfworker/json-schema` automatically.
