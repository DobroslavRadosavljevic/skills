# Testing, Inspector, and Packaging

## Table of contents

- Test layers
- In-process client tests
- Testing auth, elicitation, and eras
- stdio tests
- MCP Inspector
- CI smoke test
- Packaging for bunx and npm
- Release hygiene

## Test layers

1. Unit-test pure domain logic outside MCP.
2. Integration-test the real server through a real `Client` in process (no mocks of the SDK).
3. Spawn the real stdio process once to prove stdout stays clean and the launch command works.
4. Smoke the built artifact with the Inspector CLI in CI.
5. Run an agent eval for tool-selection quality (see [tool-design.md](tool-design.md)).

## In-process client tests

`handler.fetch` passed as the transport's `fetch` serves each request in process, through the same `createMcpHandler` you deploy. No port, no socket.

```ts
// src/server.test.ts  (run with: bun test)
import { afterEach, beforeEach, expect, test } from 'bun:test';
import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';
import { createMcpHandler } from '@modelcontextprotocol/server';
import { createServer } from './server';

let handler: ReturnType<typeof createMcpHandler>;
let client: Client;

beforeEach(async () => {
  handler = createMcpHandler(createServer);
  const transport = new StreamableHTTPClientTransport(new URL('http://test.local/mcp'), {
    fetch: (url, init) => handler.fetch(new Request(url, init)),
  });
  client = new Client({ name: 'test-harness', version: '1.0.0' }, { versionNegotiation: { mode: 'auto' } });
  await client.connect(transport);
});

afterEach(async () => {
  await client.close(); // client first, then handler
  await handler.close(); // aborts in-flight exchanges
});

test('search returns structured output', async () => {
  const result = await client.callTool({ name: 'search_notes', arguments: { query: 'wel' } });
  expect(result.structuredContent).toEqual({ ids: ['welcome'] });
});

test('schema rejection is an isError result, not a throw', async () => {
  const result = await client.callTool({ name: 'search_notes', arguments: { query: '' } });
  expect(result.isError).toBe(true);
});
```

- Assert on `structuredContent` for happy paths. Handler failures and schema rejections resolve as results with `isError: true`; nothing to `catch`. Resource, prompt, and completion failures reject with `ProtocolError`.
- Also assert `tools/list` (names, descriptions, annotations, schemas), `readResource`, `getPrompt`, and `complete` (`ref/prompt`, `ref/resource`). Snapshot the tool list so accidental renames fail review.
- `client.getProtocolEra()` should be `modern` with `mode: 'auto'`. Add a second test with the default client (legacy `initialize`) if you still serve 2025 clients.
- `InMemoryTransport.createLinkedPair()` (from `@modelcontextprotocol/client` or `server`; use one package per pair) connects only 2025-era instances. For 2026-07-28 coverage use `handler.fetch`.
- Use `bun test` (Bun's runner) or the repository's runner; the assertions are runner-agnostic.

## Testing auth, elicitation, and eras

- Auth: wrap the handler like production and inject `authInfo` for the authenticated cases: `fetch: (u, i) => handler.fetch(new Request(u, i), { authInfo })`. For the HTTP gate itself, call your exported `{ fetch }` with raw `Request`s: no token gives 401 with `WWW-Authenticate` and `resource_metadata`; wrong audience gives 401; missing scope gives 403 `insufficient_scope`; valid token reaches `ctx.http.authInfo`. Test `GET /.well-known/oauth-protected-resource/mcp`.
- Elicitation: create the client with `capabilities: { elicitation: { form: {} } }` and `client.setRequestHandler('elicitation/create', async () => ({ action: 'accept', content: { confirm: true } }))`. Test accept, decline (`{ action: 'decline' }`), and cancel branches, and that no side effect happens without `confirm: true`. With `input_required`, one `callTool` performs both rounds.
- Cancellation and progress: `client.callTool(params, { signal, onprogress })`; abort and assert the handler stopped.
- Host/Origin checks: send requests with a foreign `Host` or `Origin` header and expect 403 (verified with `hostHeaderValidationResponse` / `originValidationResponse` on Bun 1.4.2).
- Era matrix: if `legacy: 'reject'`, assert a legacy `initialize` POST returns 400 with `-32022`.

## stdio tests

No in-process shortcut exists. Spawn the real command:

```ts
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
const client = new Client({ name: 'test-harness', version: '1.0.0' });
await client.connect(new StdioClientTransport({ command: 'bun', args: ['src/stdio.ts'] }));
// ...callTool assertions...
await client.close(); // shuts the child down
```

If `connect()` fails with a JSON parse error, something wrote to stdout. A spawn-per-test CLI should keep the default (legacy) handshake or use a pin; `mode: 'auto'` spawns an extra probe process on stdio.

## MCP Inspector

`@modelcontextprotocol/inspector` 2.10.1 (Node >= 22.19) has web, CLI, TUI, and an experimental `mcpdo` connection CLI.

```sh
bunx @modelcontextprotocol/inspector                      # web UI
bunx @modelcontextprotocol/inspector bun run src/stdio.ts # web UI launching a stdio server
bunx @modelcontextprotocol/inspector --cli bun run src/stdio.ts --method tools/list
bunx @modelcontextprotocol/inspector --cli --transport http --server-url http://127.0.0.1:3000/mcp --method tools/list
bunx @modelcontextprotocol/inspector --cli bun run src/stdio.ts --method tools/call --tool-name search_notes --tool-arg query=wel
```

- Web UI: pick **Streamable HTTP**, enter the URL, paste the proxy session token printed in the terminal, then Connect. Use the Tools, Resources, Prompts tabs (the Prompts tab exercises completions).
- Under `--cli` everything before `--` is the target command and everything after is Inspector options. Add `--header "Authorization: Bearer ..."` for protected servers. Bound the connect with `--connect-timeout <ms>`.
- The Inspector stores OAuth tokens and `env:` values in the OS keychain when available; on headless machines it may fall back to a file, so use throwaway credentials.
- Inspector v2 changed flags and exit codes from v1; read its v1-to-v2 migration guide before reusing old scripts. `bunx` honors the package's Node shebang, so Node >= 22.19 must be installed; `bunx --bun` forces Bun.

## CI smoke test

Pin the Inspector version in CI (`@modelcontextprotocol/inspector@2.10.1`; `@2` is not a pin) and parse JSON, never text:

```sh
bun run build
bunx @modelcontextprotocol/inspector@2.10.1 --cli node dist/cli.js --method tools/list --format json \
  | jq -e '.result.tools | map(.name) | index("search_notes")' > /dev/null
```

- stdout is the result, stderr is diagnostics; do not merge them before `jq`.
- `--method initialize` is a cheap connect-only liveness probe.
- Also grep the stdout of your stdio process for non-JSON lines, and scan results for secret patterns.

## Packaging for bunx and npm

A stdio server is a CLI. Ship built JavaScript so it runs under Node or Bun, with a Node shebang:

```ts
#!/usr/bin/env node
// src/cli.ts
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import { createServer } from './server';
void serveStdio(createServer);
console.error('my-mcp-server running on stdio');
```

```json
{
  "name": "my-mcp-server",
  "version": "1.0.0",
  "type": "module",
  "bin": { "my-mcp-server": "dist/cli.js" },
  "files": ["dist", "README.md", "LICENSE"],
  "engines": { "node": ">=20" },
  "scripts": {
    "build": "bun build src/cli.ts --target node --format esm --outdir dist --packages external",
    "typecheck": "tsc --noEmit",
    "test": "bun test",
    "prepublishOnly": "bun run typecheck && bun run test && bun run build"
  },
  "dependencies": { "@modelcontextprotocol/server": "^2.3.1", "zod": "^4.2.0" }
}
```

- `--packages external` keeps dependencies as normal `dependencies` that the installer resolves (Bun 1.4.2 preserved the shebang in a test build). Alternatively bundle everything with a bundler such as tsdown and publish no runtime deps.
- A Node shebang makes `bunx my-mcp-server` run under Node (Bun respects shebangs). Users with only Bun can run `bunx --bun my-mcp-server`. A `#!/usr/bin/env bun` shebang works only where Bun is installed.
- Verify what ships: `bun pm pack --dry-run`, then test the tarball in a clean directory: `bunx ./my-mcp-server-1.0.0.tgz` or register it in a host.
- Publish: `bun publish --dry-run`, then `bun publish --access public` (scoped packages). Use `--tag next` for pre-releases.
- Document host registration for users. Claude Code: `claude mcp add my-server -- bunx my-mcp-server`. JSON hosts: `{ "command": "bunx", "args": ["my-mcp-server"] }`, with `env` entries for credentials the user supplies.
- Never print to stdout at import time. Read configuration from `process.env`; fail fast to stderr with a clear message when required variables are missing.
- Take `name` and `version` for `new McpServer({ name, version })` from `package.json` so the identity advertised in `serverInfo` matches the release.

For HTTP-only servers, publish a container image or deploy directly instead (see [transports-deploy.md](transports-deploy.md)). A package can ship both: `serveStdio` for the bin, an exported `createServer` and `createMcpHandler` entry for embedding.

## Release hygiene

- Treat tool names, argument names, and output shapes as public API. Add arguments as optional; deprecate in descriptions before removing; bump the major version for breaking changes.
- Lockfile committed; pin direct SDK dependencies to a caret range on 2.x and review changelogs for `@modelcontextprotocol/server` (breaking changes land with a major version per the SDK's semver policy).
- Run `bun audit` and the full test plus smoke pipeline before every publish.
- Document the minimum protocol era you support, the auth model, and required scopes in the README.
