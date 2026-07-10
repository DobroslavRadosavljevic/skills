# Testing, Clients, OpenAPI, and Realtime

Use this reference for direct request tests, Eden clients, generated API documentation, WebSocket, streams, and SSE.

## Direct Request Tests

Elysia accepts Web Standard `Request` objects through `app.handle` and returns `Response` objects. This exercises routing and lifecycle without opening a port.

```ts
import { describe, expect, it } from 'bun:test'
import { Elysia, t } from 'elysia'

const app = new Elysia().post('/users', ({ body }) => body, {
  body: t.Object({ name: t.String({ minLength: 1 }) })
})

describe('POST /users', () => {
  it('validates and returns a user', async () => {
    const response = await app.handle(new Request('http://localhost/users', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ name: 'Elysia' })
    }))

    expect(response.status).toBe(200)
    expect(await response.json()).toEqual({ name: 'Elysia' })
  })
})
```

The URL must be absolute (`http://localhost/path`), not only `/path`.

Test response status, body, content type, headers, cookies, and side effects. Add negative tests for validation, authorization, not found, thrown errors, and plugin scope. Use a real listening server when behavior depends on sockets, runtime server APIs, proxy/IP resolution, streaming timing, TLS, or deployment adapters.

Wait for `await app.modules` before testing lazy or deferred plugins.

## Eden Treaty

Eden provides end-to-end types from an exported server type without code generation. For new work, use Treaty 2's `treaty`, not legacy `edenTreaty`.

```ts
// server.ts
export const app = new Elysia().get('/health', () => ({ ok: true }))
export type App = typeof app

// client.ts
import { treaty } from '@elysia/eden'
import type { App } from './server'

const api = treaty<App>('https://api.example.com')
const { data, error, status } = await api.health.get()
```

- Handle `error` before using `data` as non-null. HTTP statuses 300 and above populate `error` rather than `data`.
- Passing an Elysia instance to `treaty(app)` uses `app.handle` directly and is useful for contract tests.
- Use a URL client for a network boundary; do not mistake in-process Treaty tests for proof of CORS, proxies, cookies, TLS, or platform behavior.
- Eden interprets streams and SSE as async generators.
- If a very large root app causes slow client inference, export a relevant sub-app type instead of the whole server type.

## OpenAPI

`@elysia/openapi` exposes Scalar UI at `/openapi` by default and generates contracts from runtime schemas. Route `detail`, tags, reference models, and per-status responses improve the output.

```ts
import { openapi } from '@elysia/openapi'

const app = new Elysia()
  .use(openapi())
  .get('/health', () => ({ ok: true }), {
    response: t.Object({ ok: t.Boolean() }),
    detail: { summary: 'Health check', tags: ['system'] }
  })
```

Important boundaries:

- OpenAPI security schemes and route `security` fields document requirements; they do not execute authentication.
- `withHeader` documents response headers but does not set or validate them.
- Type-based generation with `fromTypes` supplements runtime schemas; runtime schemas take precedence.
- Export the root app for type generation. In production bundles/binaries, pre-generate a `.d.ts` and point `fromTypes` at it.
- In monorepos, set `projectRoot` and the intended `tsconfigPath` explicitly.
- Standard Schema libraries may require an explicit JSON Schema mapper.
- Hide operational/private routes deliberately or disable the interactive UI in production according to the product's exposure policy.

Verify the emitted document, not just the UI. Check paths, methods, required fields, coercion-sensitive types, status maps, model references, headers, tags, and security metadata.

## WebSocket

Elysia WebSocket routes use `.ws(path, options)` and can validate message, query, params, headers, cookies, and responses.

```ts
new Elysia().ws('/rooms/:roomId', {
  params: t.Object({ roomId: t.String() }),
  body: t.Object({ type: t.Literal('message'), text: t.String() }),
  message(ws, message) {
    ws.send({ roomId: ws.data.params.roomId, ...message })
  }
})
```

Incoming stringified JSON is parsed for schema validation by default. Configure and test:

- Authentication in `beforeHandle` before upgrade.
- `transformMessage` only when messages need preprocessing before validation.
- `maxPayloadLength`, `idleTimeout`, compression, `backpressureLimit`, and whether to close on backpressure.
- Invalid messages, reconnect behavior, close codes, drain/backpressure handling, and resource cleanup.

WebSocket configuration follows Bun's server APIs, so verify adapter/platform support rather than assuming parity everywhere.

## Streams and SSE

- Treat stream/SSE clients as async consumers with cancellation and reconnect behavior.
- Set headers before the first yielded chunk.
- Test early errors and client disconnect cleanup.
- Check proxy and serverless buffering/time limits with a deployed smoke test.
