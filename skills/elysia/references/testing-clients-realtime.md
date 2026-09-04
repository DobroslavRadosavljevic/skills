# Testing, Clients, OpenAPI, and Realtime

Use this reference for Eden endpoint tests, generated API documentation, WebSocket, streams, and SSE.

## Endpoint tests: Eden Treaty only

Official contract: [Eden Treaty unit tests](https://elysiajs.com/eden/treaty/unit-test) and [unit test](https://elysiajs.com/patterns/unit-test). Pass the Elysia instance to `treaty` from `@elysia/eden`. Treaty infers the app type, calls through `handle` internally, and needs no `listen()`.

Use Treaty 2 `treaty`, not legacy `edenTreaty`.

```ts
import { describe, expect, it } from 'vitest' // or bun:test if that is the repo runner
import { Elysia, t } from 'elysia'
import { treaty } from '@elysia/eden'

const app = new Elysia().post('/users', ({ body }) => body, {
  body: t.Object({ name: t.String({ minLength: 1 }) })
})

const api = treaty(app)

describe('POST /users', () => {
  it('validates and returns a user', async () => {
    const { data, error, status } = await api.users.post({ name: 'Elysia' })

    expect(error).toBeNull()
    expect(status).toBe(200)
    expect(data).toEqual({ name: 'Elysia' })
  })
})
```

Rules:

- Mount the same exported `const` plugin (or composed app) the production tree uses. `treaty(app)` — type inference is automatic when the instance is passed.
- For a URL client (`treaty<App>('http://…')`) export `type App = typeof app`. Use a URL only when you need a real network boundary.
- Handle `error` before treating `data` as present. Statuses 300+ populate `error`, not `data`.
- Path params are function calls in the chain: `api.users({ id: '42' }).get()`.
- Test validation, authorization, not found, thrown errors, plugin scope, headers, and cookies via Treaty (`status`, `error`, `headers`, `response`).
- `await app.modules` before Treaty calls when lazy/deferred plugins register after startup.
- In-process `treaty(app)` does **not** prove CORS, proxies, TLS, cookie jar behavior across origins, or adapter listen quirks. Use a listening URL client or a deploy smoke test for those.
- If a huge root app slows inference, Treaty a relevant sub-app instance, not a hand-built `Request`.

### Banned

```ts
// ❌ Don't
export const handle = (path: string) =>
  app.handle(new Request(`http://localhost${path}`))

await app.handle(new Request('http://localhost/users', { method: 'POST', … }))
await plugin.handle(new Request('http://localhost/…'))
```

Do not wrap `handle`/`Request` in test helpers. Do not use `edenFetch` as the default for route tests — `treaty` is the typed surface.

## Eden as an HTTP client

```ts
import { treaty } from '@elysia/eden'
import type { App } from './server'

const api = treaty<App>('https://api.example.com')
const { data, error, status } = await api.health.get()
```

Eden interprets streams and SSE as async generators.

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

Prefer Eden Treaty WebSocket clients when the app type is available. WebSocket configuration follows Bun's server APIs, so verify adapter/platform support rather than assuming parity everywhere.

## Streams and SSE

- Treat stream/SSE clients as async consumers with cancellation and reconnect behavior.
- Set headers before the first yielded chunk.
- Test early errors and client disconnect cleanup.
- Check proxy and serverless buffering/time limits with a deployed smoke test.
