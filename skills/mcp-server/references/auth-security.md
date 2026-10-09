# Authorization and Security

Spec basis: MCP 2026-07-28 Authorization and Security Best Practices; SDK `@modelcontextprotocol/server@2.3.1`.

## Table of contents

- When authorization applies
- Resource server checklist
- Express wiring
- Web-standard wiring
- Writing the token verifier
- Protected resource metadata and challenges
- Scopes and step-up
- Client registration (CIMD, DCR)
- Host, Origin, and network exposure
- Threat model and mitigations
- Secrets and logging

## When authorization applies

- Optional. If used over HTTP, follow the spec. For stdio, do not run OAuth; read credentials from the environment.
- The MCP server is an **OAuth 2.1 resource server**. It validates access tokens; it never issues them. The authorization server (AS) is a separate component, preferably a dedicated identity provider. The SDK's AS helpers (`mcpAuthRouter`, `ProxyOAuthServerProvider`) are frozen in `@modelcontextprotocol/server-legacy/auth`; do not build new servers on them.
- Required of every protected server: implement RFC 9728 Protected Resource Metadata (PRM) with at least one `authorization_servers` entry, challenge with `WWW-Authenticate`, validate tokens for your audience, accept tokens only in the `Authorization: Bearer` header (never the query string) on every request.

## Resource server checklist

1. Verify signature, issuer, expiry, and **audience** (the token was issued for this MCP server; RFC 8707 `resource`). Reject anything else with 401.
2. Always populate `AuthInfo.expiresAt` from `exp`; the gate answers 401 for tokens without it.
3. Set `expectedResource` to the canonical URL your AS puts in tokens for this server, and fill `AuthInfo.resource` from `aud`. Without `expectedResource`, `resource` is not compared with anything.
4. Never forward the inbound token to an upstream API (token passthrough). Obtain a separate upstream token for the user, and store it server-side.
5. Publish PRM and point the 401 challenge at it.
6. Check scopes per operation with `scopeChallenge`; return 403 `insufficient_scope` with the full needed scope set in one challenge.
7. Derive the user id from the verified token (`sub`), never from tool arguments or client-claimed identity.
8. Rate limit tool calls, validate all inputs, sanitize outputs (spec: servers MUST).

## Express wiring

```ts
import { createMcpExpressApp, getOAuthProtectedResourceMetadataUrl, mcpAuthMetadataRouter, requireBearerAuth } from '@modelcontextprotocol/express';
import type { OAuthTokenVerifier } from '@modelcontextprotocol/express';
import { toNodeHandler } from '@modelcontextprotocol/node';
import { createMcpHandler } from '@modelcontextprotocol/server';

const mcpServerUrl = new URL('https://api.example.com/mcp');
const verifier: OAuthTokenVerifier = { verifyAccessToken };

const auth = requireBearerAuth({
  verifier,
  requiredScopes: ['mcp'],
  resourceMetadataUrl: getOAuthProtectedResourceMetadataUrl(mcpServerUrl),
  expectedResource: mcpServerUrl,
});

const app = createMcpExpressApp({ host: '0.0.0.0', allowedHosts: ['api.example.com'] });
app.use(mcpAuthMetadataRouter({ oauthMetadata, resourceServerUrl: mcpServerUrl })); // PRM + AS metadata mirror
const node = toNodeHandler(createMcpHandler(buildServer));
app.all('/mcp', auth, (req, res) => void node(req, res, req.body));
```

- Use `@modelcontextprotocol/express` >= 2.0.2 with `@modelcontextprotocol/server` >= 2.3.0. Version 2.0.1 silently ignores `expectedResource`.
- The router serves `/.well-known/oauth-protected-resource/mcp` (path-aware RFC 9728 URL, the same string the challenge carries) and a mirror of `/.well-known/oauth-authorization-server`. `oauthMetadata` is your AS's RFC 8414 document.
- Missing, malformed, or expired token: 401 `invalid_token`. Valid token missing a required scope: 403 `insufficient_scope`. Both carry `WWW-Authenticate: Bearer ...` with `resource_metadata`.

## Web-standard wiring

For Bun, Workers, Deno, and Hono the gate is `requireBearerAuth` from `@modelcontextprotocol/server`:

```ts
import { createMcpHandler, oauthMetadataResponse, requireBearerAuth } from '@modelcontextprotocol/server';

const gate = requireBearerAuth({ verifier, requiredScopes: ['mcp'], expectedResource: mcpServerUrl });
const handler = createMcpHandler(buildServer);

export default {
  async fetch(request: Request): Promise<Response> {
    const meta = oauthMetadataResponse(request, { oauthMetadata, resourceServerUrl: mcpServerUrl }); // PRM; undefined to fall through
    if (meta) return meta;
    const auth = await gate(request);
    if (auth instanceof Response) return auth;               // ready-made 401/403 with WWW-Authenticate
    return handler.fetch(request, { authInfo: auth });       // handlers read ctx.http.authInfo
  },
};
```

Smoke-tested on Bun 1.4.2: a request without a token returns `401` with `Bearer error="invalid_token", error_description="Missing Authorization header", scope="mcp"`. The handler never reads auth from headers on its own: forwarding `authInfo` is your job, and an ungated handler is open to everyone.

Read the caller in handlers with `ctx.http?.authInfo` (undefined on stdio). The per-request factory receives the same value as `authInfo`.

## Writing the token verifier

```ts
import type { AuthInfo } from '@modelcontextprotocol/server';
import { OAuthError, OAuthErrorCode } from '@modelcontextprotocol/server';

async function verifyAccessToken(token: string): Promise<AuthInfo> {
  const payload = await verifyJwt(token); // your JWKS or introspection (RFC 7662) logic, e.g. jose jwtVerify against the AS JWKS with issuer + audience set
  const audience = [payload.aud ?? []].flat().find(a => URL.canParse(a) && new URL(a).origin === mcpServerUrl.origin);
  return { token, clientId: payload.sub, scopes: payload.scopes, expiresAt: payload.exp, resource: audience ? new URL(audience) : undefined };
}
// To reject: throw new OAuthError(OAuthErrorCode.InvalidToken, 'reason'). Any other exception becomes 500 server_error.
```

- Accept short-lived tokens only; cache JWKS with a bounded TTL; fail closed when the AS is unreachable.
- Hierarchical scopes: servers MUST account for broader scopes implying narrower ones when deciding sufficiency.

## Protected resource metadata and challenges

- PRM must list `authorization_servers`. Clients try the `resource_metadata` URL from `WWW-Authenticate` first, then path-aware well-known (`/.well-known/oauth-protected-resource/<path>`), then root.
- Include `scope` in the challenge so clients request least privilege. Keep `scopes_supported` minimal (discovery and read). Do not advertise `offline_access`.
- 401: authorization required or token invalid. 403: valid token, insufficient scope. 400: malformed request.

## Scopes and step-up

```ts
import { requireScopes } from '@modelcontextprotocol/server';

server.registerTool('purge_notes', { description: 'Delete all notes.', annotations: { destructiveHint: true }, scopeChallenge: requireScopes('notes:write') }, handler);
server.registerResource('private-notes', 'notes://private', { scopeChallenge: requireScopes('notes:read') }, readCb);
```

- `scopeChallenge` runs before invocation and before SSE starts; it can also be a callback `({ request, authInfo }) => undefined | { scopes, errorDescription }` for argument-dependent scopes. Return the exact complete scope set in one challenge. A throw fails closed.
- The callback sees raw JSON-parsed wire values before schema validation or transforms. Validate or canonicalize any value whose meaning your schema changes.
- Start tokens with a small baseline scope; elevate only when a privileged operation is first attempted. Log elevation events with correlation ids.

## Client registration (CIMD, DCR)

- Spec priority for clients: pre-registered credentials, then **Client ID Metadata Documents (CIMD)** when the AS advertises `client_id_metadata_document_supported`, then Dynamic Client Registration (DCR, RFC 7591) as fallback, then ask the user.
- CIMD: the client's `client_id` is an HTTPS URL (with a path) hosting JSON with `client_id` (equal to the URL), `client_name`, `redirect_uris`. The **authorization server** fetches and validates it. As a resource server you do not implement CIMD; choose an AS that supports it. DCR is deprecated in 2026-07-28 (retained for compatibility).
- If you operate an AS anyway: fetch CIMD documents with SSRF protections (no private or metadata IPs, redirect limits, size and time caps), validate exact `redirect_uris`, and apply a trust policy. Do not trust localhost-only redirects blindly; show the redirect hostname on the consent page.
- MCP proxy servers using one static upstream client id MUST do per-client consent before forwarding to the third party (confused deputy), with exact redirect matching, single-use short-lived `state`, `__Host-` cookies, and CSRF and clickjacking protection.
- The AS should include the RFC 9207 `iss` parameter in authorization responses; clients validate it (mix-up defense).

## Host, Origin, and network exposure

- `createMcpHandler` checks nothing. Validate the `Host` header on every HTTP request (blocks DNS rebinding on localhost binds) and the `Origin` header when present (spec: MUST respond 403 to an invalid Origin). Use `createMcpExpressApp`/`createMcpHonoApp`/`createMcpFastifyApp` or `hostHeaderValidationResponse` + `originValidationResponse`.
- Bind local HTTP servers to `127.0.0.1`. Local servers on a port still need an auth token or a Unix domain socket, because other local processes can reach them.
- Public servers: HTTPS only, explicit `allowedHosts`, auth required, rate limits at the edge.

## Threat model and mitigations

| Threat | Mitigation |
| --- | --- |
| Prompt injection through tool results, resource text, or fetched pages | Treat all returned text as untrusted data. Fence and label third-party content ("untrusted content from <source>"); never embed instructions in outputs; do not auto-chain destructive tools on fetched content; return minimal fields. |
| Tool poisoning via descriptions | Keep descriptions static and reviewed; never build descriptions from user or remote data; pin dependencies. |
| Confused deputy / token passthrough | Audience-bound tokens, separate upstream tokens, per-client consent in proxies. |
| Excessive agency | Few narrow tools; read-only by default; separate read and write scopes; `destructiveHint` plus a real confirmation (`inputRequired.elicit`) for irreversible actions; dry-run options. |
| Injection in arguments (SQL, shell, path) | Parameterized queries, no `shell: true`, allowlisted enums and ids, `realpath` plus root-prefix checks for paths, reject `..`. |
| SSRF from URL-taking tools | Resolve identifiers to URLs from a fixed list; if arbitrary URLs are required, allowlist hosts, block private, link-local, and metadata ranges, cap redirects, size, and time. |
| Resource exhaustion | `maxToolInputElements`, `maxRequestBodySize`, per-tool timeouts using `ctx.mcpReq.signal`, output caps and pagination, per-user rate limits. |
| State handle hijacking | Random unguessable handles, expiry, state keyed by verified user plus handle. |
| `requestState` tampering | `createRequestStateCodec`; mint only proven state; same key across nodes. |
| Data exfiltration through outputs | Return only what the task needs; redact secrets and unrelated PII; row-level access checks per user. |
| Local server compromise | Run with least privilege, sandbox, avoid `sudo`; print the exact launch command in docs; use stdio or authenticated sockets. |
| Malicious dependency | Pin exact versions, lockfile, `bun audit` in CI, minimal deps. |

## Secrets and logging

- Never place secrets (API keys, tokens, passwords, connection strings) in tool outputs, descriptions, resource text, error messages, or `requestState`. Redact before returning upstream errors.
- Log to stderr (stdio) or your log pipeline: tool name, caller id, duration, outcome; not full arguments if they may contain PII.
- Tool arguments may be shown to users by clients; do not require users to paste secrets as arguments. Load secrets from the environment or secret store on the server.
- Do not mark sensitive parameters with `x-mcp-header`: header values are visible to intermediaries.
