# Source Map

Snapshot date: 2026-10-09.

This file records the official sources and package evidence used to write the skill. Refresh them for latest-version questions, spec questions, auth work, or version mismatches.

## Research Snapshot

- Context7 libraries: `/modelcontextprotocol/typescript-sdk` (branch v1.x, v1.29.0 and node 2.0.0-alpha.2 indexed; stale for v2), `/websites/ts_sdk_modelcontextprotocol_io`, `/websites/modelcontextprotocol_io`. For v2 the primary evidence was the SDK repository `docs/` tree (cloned at `main`, last commit 2026-10-05) because Context7 mostly indexes v1.
- npm versions observed on 2026-10-09:
  - `@modelcontextprotocol/server` `latest`: `2.3.1` (2026-10-05)
  - `@modelcontextprotocol/client` `latest`: `2.3.1`
  - `@modelcontextprotocol/core`, `server-legacy`, `codemod`: `2.3.1` (fixed version group with server and client)
  - `@modelcontextprotocol/node` `2.1.1`, `express` `2.0.2`, `hono` `2.0.2`, `fastify` `2.0.1` (each also has an `alpha` tag; ignore it)
  - `@modelcontextprotocol/sdk` (v1) `latest`: `1.32.1` (2026-10-05)
  - `@modelcontextprotocol/inspector` `latest`: `2.10.1` (2026-10-08); `v1-latest` `1.0.2`; `next` `2.0.0-rc.3`
  - `mcp-handler` `latest`: `2.3.0` (2026-10-07); Vercel docs show `2.1.1`
  - `zod` `latest`: `4.6.5`; SDK requires `>= 4.2.0`
  - Engines: Node `>= 20` for all SDK packages; Inspector `>= 22.19.0`
- Spec: latest published revision `2026-07-28` (docs.json marks "Version 2026-07-28 (latest)"; a `draft` folder exists beyond it). Previous: 2025-11-25.
- Local verification (Bun 1.4.2, scratch project, nothing global): registered a tool with `outputSchema`, `annotations`, a no-argument tool, a resource template, a `completable` prompt, and an `inputRequired` tool; ran them through `createMcpHandler` plus a `StreamableHTTPClientTransport` with `fetch: handler.fetch`; ran `serveStdio` under Bun with `StdioClientTransport`; exercised `requireBearerAuth` as a web-standard gate (401 challenge); exercised Host/Origin validation on `Bun.serve` (403s); built a CLI with `bun build --target node --packages external` (shebang preserved); typechecked with `tsc --strict`.
- Items not verified at runtime: Cloudflare Workers deploy, Vercel deploy, Docker build, Fastify/Express adapters, Inspector CLI invocation. They follow the cited docs.
- Elysia is not covered by the SDK or spec docs. The skill only notes the generic web-standard `handler.fetch(request)` pattern.
- Not fetched: Anthropic's "Writing effective tools for agents" engineering article (the domain safety check was rate limited). The tool-design guidance rests on the spec tools page and Cloudflare's MCP overview plus working practice.

## Official SDK Documentation (v2)

- Repository: https://github.com/modelcontextprotocol/typescript-sdk (README, `VERSIONING.md`, per-package `CHANGELOG.md`)
- Docs site: https://ts.sdk.modelcontextprotocol.io/v2/ and API reference https://ts.sdk.modelcontextprotocol.io/v2/api/
- Packages and subpath exports: `docs/get-started/packages.md`
- First server: `docs/get-started/first-server.md`; real host registration: `docs/get-started/real-host.md`
- Protocol versions and eras: `docs/protocol-versions.md`
- Tools: `docs/servers/tools.md`; resources: `docs/servers/resources.md`; prompts: `docs/servers/prompts.md`; completion: `docs/servers/completion.md`
- Errors: `docs/servers/errors.md`; notifications: `docs/servers/notifications.md`
- Progress, logging, cancellation: `docs/servers/logging-progress-cancellation.md`
- `input_required`: `docs/servers/input-required.md`; elicitation: `docs/servers/elicitation.md`; sampling (deprecated): `docs/servers/sampling.md`; roots (deprecated): `docs/clients/roots.md`
- Serving: `docs/serving/http.md`, `stdio.md`, `web-standard.md`, `express.md`, `hono.md`, `fastify.md`, `sessions-state-scaling.md`, `legacy-clients.md`
- Authorization: `docs/serving/authorization.md`; client auth: `docs/clients/oauth.md`, `docs/clients/machine-auth.md`
- Schema libraries and validators: `docs/advanced/schema-libraries.md`
- Caching hints: `docs/clients/caching.md`
- Testing: `docs/testing.md`; troubleshooting: `docs/troubleshooting.md`
- Migration: `docs/migration/index.md`, `upgrade-to-v2.md` (v1 to v2), `support-2026-07-28.md` (adopting the new revision)
- Server package changelog (ALREADY_CONNECTED, `expectedResource`, `maxToolInputElements`, `preloadSchemas`): `packages/server/CHANGELOG.md`

## Official Specification (2026-07-28)

- Spec home and changelog: https://modelcontextprotocol.io/specification/2026-07-28 (source: https://github.com/modelcontextprotocol/modelcontextprotocol, `docs/specification/2026-07-28/`)
- Key changes: `changelog.mdx` (stateless protocol, `server/discover`, MRTR, `subscriptions/listen`, removed `ping` and `logging/setLevel`, cache fields, deprecations)
- Versioning and compatibility: `basic/versioning.mdx`
- Transports: `basic/transports/streamable-http.mdx`, `stdio.mdx`
- Multi round-trip requests: `basic/patterns/mrtr.mdx`
- Tools (names, annotations, structured content, security): `server/tools.mdx`
- Pagination: `server/utilities/pagination.mdx`; caching: `server/utilities/caching.mdx`
- Elicitation (form and URL mode security): `client/elicitation.mdx`
- Authorization: `basic/authorization/index.mdx`, `authorization-server-discovery.mdx`, `client-registration.mdx` (Client ID Metadata Documents), `security-considerations.mdx`
- Security best practices: `docs/2026-07-28/tutorials/security/security_best_practices.mdx` (confused deputy, token passthrough, SSRF, state handle hijacking, local server compromise, scope minimization, CIMD trust)
- Deprecated features registry: `deprecated.mdx`

## Tooling and Deployment Docs

- MCP Inspector: https://github.com/modelcontextprotocol/inspector (`README.md`, `docs/cli-smoke-testing.md`, `clients/cli/README.md`)
- Bunx shebang and `--bun`: https://bun.com/docs/pm/bunx
- `bun publish`, `bun pm pack --dry-run`, `bun info`: `bun publish --help`, `bun pm --help` (Bun 1.4.2)
- Vercel: https://vercel.com/docs/mcp/deploy-mcp-servers-to-vercel (last updated 2026-09-18); `mcp-handler` repository https://github.com/vercel/mcp-handler
- Cloudflare: https://developers.cloudflare.com/agents/model-context-protocol/ and https://developers.cloudflare.com/agents/model-context-protocol/guides/remote-mcp-server/
- SDK Workers integration test (runs without `nodejs_compat`): `test/integration/test/server/cloudflareWorkers.test.ts` in the SDK repository

## Refresh Checklist

- `bun info @modelcontextprotocol/server version` and the same for `client`, `node`, `express`, `hono`, `fastify`, `inspector`, `mcp-handler`.
- Re-read `changelog.mdx` of the newest spec folder; if a revision newer than 2026-07-28 exists, check what the SDK `docs/protocol-versions.md` says about it.
- Re-check the SDK `docs/migration/` pages and `packages/server/CHANGELOG.md` for new breaking notes.
- Re-check Elysia coverage in the SDK docs before claiming framework support.
