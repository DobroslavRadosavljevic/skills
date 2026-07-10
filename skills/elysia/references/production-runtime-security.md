# Production, Runtimes, and Security

Use this reference for adapters, deployment, security review, observability, performance, and production verification.

## Select the Runtime Shape First

### Bun server

Use `.listen(...)` for a long-running Bun process. Read ports from the environment when the platform assigns them. `serve` options expose Bun-specific hostname, port, TLS, idle timeout, maximum request body size, reuse-port, and WebSocket controls.

### Node.js

Install and configure the explicit adapter:

```ts
import { Elysia } from 'elysia'
import { node } from '@elysia/node'

new Elysia({ adapter: node() })
  .get('/', () => 'ok')
  .listen(3000)
```

Use strict TypeScript and the repository's Node build/run tooling. Do not use Bun-only `server` context or `Bun.*` APIs without a portability boundary.

### Deno and edge-style exports

Deno can serve `app.fetch` with `Deno.serve`. Vercel and Netlify integrations use exported Elysia instances rather than an always-listening process. Match the platform's documented export, path, runtime, environment, and timeout behavior.

### Cloudflare Worker

The official adapter is experimental. Current docs require `CloudflareAdapter`, `.compile()`, and a sufficiently recent compatibility date. Known limitations include filesystem/static plugin behavior, OpenAPI type generation, and pre-created/inline `Response` values. Verify the current adapter docs and deployed behavior before choosing it.

## Production Security Baseline

Framework validation is one layer, not the whole security model.

- Validate every untrusted request surface and declare response schemas where accidental exposure matters.
- Enforce authentication and authorization in executed code. OpenAPI `security` metadata is not enforcement.
- Configure `@elysia/cors` with explicit trusted origins, methods, headers, exposed headers, and credential behavior. Its defaults are permissive; do not ship `cors()` blindly for a credentialed API.
- Verify preflight and actual responses. CORS is a browser policy, not server-side authentication.
- Store JWT secrets/keys outside source control, select algorithms deliberately, verify before trusting claims, and validate expiration, issuer, audience, and key rotation requirements. Installing the JWT plugin does not protect routes automatically.
- Configure cookies with `httpOnly`, `secure`, appropriate `sameSite`, narrow path/domain, expiration, and signing where required.
- Set a realistic `serve.maxRequestBodySize`; the documented Bun default is 128 MB, which is larger than most JSON APIs need. Also set upload and WebSocket message limits.
- Keep production validation details disabled unless exposure is an explicit product decision.
- Sanitize only for a defined sink. Generic input escaping is not a substitute for parameterized SQL, output encoding, or content-security policy.
- Add rate limits, abuse controls, timeouts, and bounded concurrency at the appropriate application or infrastructure layer.
- Treat client IP headers as untrusted unless a known proxy overwrites them. `server.requestIP` is Bun-only and proxy-aware identity remains an application/deployment concern.
- Return stable safe error envelopes; log internal details without reflecting secrets or stack traces.
- Limit or protect OpenAPI UI and operational endpoints according to the intended exposure.

## Observability and Cleanup

- Register error and telemetry hooks before the routes/plugins they must observe and choose plugin scope deliberately.
- Use `onAfterResponse` for post-response logging and cleanup. It cannot change the response already sent.
- Use Elysia `trace` or `@elysia/opentelemetry` for lifecycle timing and distributed traces. `trace` is not available in dynamic `aot: false` mode according to current docs.
- Carry a request/correlation identifier through logs and traces.
- Redact authorization, cookies, tokens, personal data, and raw request bodies by default.
- Close database pools, queues, workers, and telemetry exporters on process shutdown using the repository/runtime's lifecycle facilities.

## Build and Deploy

For Bun, official docs recommend either a compiled binary or bundled JavaScript. Preserve function names needed by OpenTelemetry: broad `--minify` may damage instrumentation names, while syntax/whitespace minification avoids that specific problem.

Compiled binaries are target-specific. Verify OS, architecture, libc, and CPU compatibility. Build inside a compatible environment for the deployment target.

For multiple CPU cores, the official Bun guide uses cluster workers and `SO_REUSEPORT` on Linux. Do not add clustering automatically: account for memory multiplication, shared state, connection affinity, cron duplication, queues, and graceful shutdown first.

When bundling instrumented dependencies, some OpenTelemetry integrations rely on runtime monkey-patching and may need packages marked external and present in production `node_modules`.

## Performance Judgment

- Keep ahead-of-time/dynamic settings at defaults unless startup or runtime evidence justifies a change. Current configuration docs contain version-sensitive AOT/precompile behavior; refresh them before tuning.
- Inline static values can be optimized, but are not a cache.
- Measure parsing, validation, hooks, handlers, serialization, downstream I/O, and response mapping in the real application.
- Use load tests that resemble payload sizes, concurrency, keep-alive, TLS, database latency, and deployment topology.
- Treat framework benchmarks as directional marketing evidence, not capacity planning.

## Production Gate

- Exact package versions and adapter compatibility checked.
- Typecheck, tests, and production build pass.
- Process/export starts correctly with production environment variables.
- Health/readiness endpoints reflect real dependencies.
- Auth scope and hook order have regression tests.
- Validation, body/message limits, CORS, cookies, errors, and docs exposure reviewed.
- Logs/traces work and redact sensitive data.
- Graceful shutdown and in-flight request behavior verified.
- Real target smoke test covers HTTP plus any streaming/WebSocket path.
- Rollback artifact and deployment procedure are known.
