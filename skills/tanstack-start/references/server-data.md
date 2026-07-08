# Server Data, Boundaries, Middleware, And Auth

Use this reference for server functions, server routes, middleware, environment boundaries, import protection, and authentication.

## Decision Table

| Need | Prefer |
| --- | --- |
| App-internal RPC from loaders, components, hooks, or other server functions | Server function |
| Public or external HTTP endpoint, webhook, raw request/response, custom status/headers | Server route |
| Shared authenticated data access | Server function or server route plus middleware |
| Browser-only code | Client component, `createClientOnlyFn`, or `.client.*` module |
| Secret, database, filesystem, or private API access | Server function, server route, `createServerOnlyFn`, or `.server.*` module |
| Cross-cutting auth/logging/CSP/observability | Request middleware or server function middleware |

## Server Functions

Server functions are same-origin RPC endpoints for calling server-side logic from the app. They are callable from client code, route loaders, hooks, components, and other server functions.

Basic shape:

```tsx
import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'

export const getPost = createServerFn({ method: 'GET' })
  .validator(z.object({ id: z.string() }))
  .handler(async ({ data }) => {
    return db.posts.findById(data.id)
  })
```

Call with a single `data` payload:

```tsx
const post = await getPost({ data: { id: 'post-1' } })
```

Use `POST` for mutations:

```tsx
export const updatePost = createServerFn({ method: 'POST' })
  .validator(z.object({ id: z.string(), title: z.string().min(1) }))
  .handler(async ({ data }) => {
    return db.posts.update(data.id, { title: data.title })
  })
```

Call from a route loader:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => getPost({ data: { id: params.postId } }),
})
```

Call from a component with `useServerFn` when needed:

```tsx
import { useServerFn } from '@tanstack/react-start'

function RefreshButton() {
  const getPostOnClient = useServerFn(getPost)
  return <button onClick={() => getPostOnClient({ data: { id: 'post-1' } })} />
}
```

## Server Function Organization

Use the file naming conventions that import protection understands:

- `*.functions.ts`: exported server functions callable by the app.
- `*.server.ts`: server-only database, filesystem, secrets, SDK clients, or helpers.
- Plain `.ts`: shared types, schemas, constants, and client-safe helpers.
- `*.client.ts`: browser-only helpers.

Static imports of server functions are safe. Avoid dynamic imports of server functions unless current docs and tooling explicitly support the pattern.

## Server Function Security

Server functions are same-origin app RPC. They are still HTTP endpoints, so protect them:

- Validate every payload at runtime.
- Authorize every function that reads or writes private data.
- Use `GET` only for safe reads.
- Use `POST`, `PUT`, `PATCH`, or `DELETE` for mutations.
- Do not trust client-sent context without runtime validation and authorization.
- Keep private values out of return payloads and client-visible errors.

TanStack Start installs CSRF middleware automatically for server functions only when the app does not define `src/start.ts`. If the app has a custom `src/start.ts`, add CSRF middleware explicitly:

```tsx
import { createCsrfMiddleware, createStart } from '@tanstack/react-start'

const csrfMiddleware = createCsrfMiddleware({
  filter: (ctx) => ctx.handlerType === 'serverFn',
})

export const startInstance = createStart(() => ({
  requestMiddleware: [csrfMiddleware],
}))
```

Configure an explicit public origin when deployment origin rewriting requires it:

```tsx
createCsrfMiddleware({
  origin: 'https://app.example.com',
  filter: (ctx) => ctx.handlerType === 'serverFn',
})
```

Only disable CSRF warnings when another verified layer enforces same-origin protection.

## Server Routes

Server routes are HTTP endpoints colocated in `src/routes` and defined with the same `createFileRoute` call as app routes. Use them for raw HTTP, webhooks, external APIs, form posts, and public endpoints.

```ts
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/api/hello')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        return Response.json({ message: 'Hello', url: request.url })
      },
      POST: async ({ request }) => {
        const body = await request.json()
        return Response.json({ received: body })
      },
    },
  },
})
```

Server route handler context includes:

- `request`: standard Web `Request`.
- `params`: typed route params such as `{ id: string }`.
- `context`: values passed by middleware.

Dynamic and splat params follow Router file conventions:

```ts
export const Route = createFileRoute('/users/$id/files/$')({
  server: {
    handlers: {
      GET: async ({ params }) => {
        return Response.json({ userId: params.id, file: params._splat })
      },
    },
  },
})
```

For status and headers, return a standard `Response`:

```ts
return Response.json(
  { error: 'Not found' },
  {
    status: 404,
    headers: {
      'Cache-Control': 'no-store',
    },
  },
)
```

Server routes can coexist with a page component in the same file:

```tsx
export const Route = createFileRoute('/contact')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const form = await request.formData()
        return Response.json({ ok: true, email: form.get('email') })
      },
    },
  },
  component: ContactRoute,
})
```

Each route path can only have one handler file for a given resolved path. Avoid duplicate files such as `routes/users.ts`, `routes/users.index.ts`, and `routes/users/index.ts` for the same endpoint.

## Middleware

Use `createMiddleware` from `@tanstack/react-start`.

Request middleware applies to server routes, SSR, and server functions:

```tsx
import { createMiddleware } from '@tanstack/react-start'

export const requestLogger = createMiddleware().server(async ({ next }) => {
  const result = await next()
  return result
})
```

Server function middleware uses `type: 'function'` and can add `.client()`, `.validator()`, and `.server()` stages:

```tsx
import { createMiddleware } from '@tanstack/react-start'
import { z } from 'zod'

export const workspaceMiddleware = createMiddleware({ type: 'function' })
  .validator(z.object({ workspaceId: z.string().uuid() }))
  .server(async ({ data, next }) => {
    const member = await db.memberships.findByWorkspace(data.workspaceId)
    if (!member) throw new Error('Unauthorized')
    return next({ context: { workspaceId: data.workspaceId } })
  })
```

Attach middleware to server functions:

```tsx
export const getWorkspace = createServerFn({ method: 'GET' })
  .middleware([workspaceMiddleware])
  .handler(async ({ context }) => {
    return db.workspaces.findById(context.workspaceId)
  })
```

Attach middleware to all server route handlers:

```tsx
export const Route = createFileRoute('/api/private')({
  server: {
    middleware: [authRequestMiddleware],
    handlers: {
      GET: async ({ context }) => Response.json({ user: context.user }),
    },
  },
})
```

Attach middleware to a specific server route method:

```tsx
export const Route = createFileRoute('/api/private')({
  server: {
    handlers: ({ createHandlers }) =>
      createHandlers({
        POST: {
          middleware: [authRequestMiddleware],
          handler: async ({ request }) => Response.json(await request.json()),
        },
      }),
  },
})
```

Middleware must call `next()` to continue the chain unless it is intentionally short-circuiting.

## Global Middleware

`src/start.ts` is not included by default. Create it when the app needs global middleware or Start-level options:

```tsx
import { createMiddleware, createStart } from '@tanstack/react-start'

const globalLogger = createMiddleware().server(async ({ next }) => {
  return next()
})

export const startInstance = createStart(() => ({
  requestMiddleware: [globalLogger],
}))
```

Global request middleware runs before every Start-handled request, including server routes, SSR, and server functions. Global function middleware runs before every server function:

```tsx
export const startInstance = createStart(() => ({
  functionMiddleware: [workspaceMiddleware],
}))
```

## Environment Variables

Read server env vars from `process.env` inside per-request server callbacks:

- Server function `.handler()`.
- Middleware `.server()`.
- Server route handlers.
- Other per-request server-only callbacks.

On Cloudflare Workers and similar edge SSR runtimes, module-level `process.env.X` may run before env exists and return `undefined`. Module-scope reads can also risk bundling secrets into client output.

Client code can only read build-tool public variables:

- Vite: `import.meta.env.VITE_*`.
- Rsbuild: `import.meta.env.PUBLIC_*` by default.

Keep secrets unprefixed and server-only:

```ts
export const getPrivateData = createServerFn().handler(async () => {
  const token = process.env.PRIVATE_API_TOKEN
  return fetchPrivateData(token)
})
```

Use `src/env.d.ts` or equivalent declarations to type `ImportMetaEnv` and `NodeJS.ProcessEnv`. Runtime-validate env with Zod or a repo-standard validator, but for edge runtimes expose a `getServerEnv()` function and call it per request instead of parsing at module load.

## Import Protection

Import protection is experimental and enabled by default. It helps prevent environment leaks by checking imports in Start's source directory:

- Client builds deny `**/*.server.*`.
- Client builds deny `@tanstack/react-start/server`.
- Server builds deny `**/*.client.*`.
- Dev default is mock and warn.
- Build default is error.
- Type-only imports are ignored.

Use explicit side-effect markers when file names are not enough:

```ts
import '@tanstack/react-start/server-only'
```

```ts
import '@tanstack/react-start/client-only'
```

If needed, configure stricter import protection in the Start plugin:

```ts
tanstackStart({
  importProtection: {
    behavior: 'error',
    client: {
      specifiers: ['@prisma/client', 'bcrypt'],
      files: ['**/db/**'],
    },
  },
})
```

## Environment Functions

Use environment functions to control where code executes:

```tsx
import {
  createClientOnlyFn,
  createIsomorphicFn,
  createServerOnlyFn,
} from '@tanstack/react-start'

const getSecret = createServerOnlyFn(() => process.env.API_SECRET)

const savePreference = createClientOnlyFn((value: string) => {
  localStorage.setItem('preference', value)
})

const logger = createIsomorphicFn()
  .server((message: string) => console.log(`[SERVER] ${message}`))
  .client((message: string) => console.log(`[CLIENT] ${message}`))
```

These helpers complement, but do not replace, server functions or server routes.

## Authentication

Enforce auth at the data/API boundary:

- Every server function or server route that reads/writes private data must authenticate and authorize the request.
- Route guards and `beforeLoad` are for route UX, redirects, and preventing unnecessary requests; they are not the data security boundary.
- Prefer managed auth providers when appropriate. When rolling your own, centralize session lookup in middleware.

Cookie guidance from current server-primitives docs:

- Prefer an opaque session ID stored in a database for easy revocation.
- Use `HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/`, bounded `Max-Age`, and the `__Host-` prefix when possible.
- Rotate sessions on login and revoke on logout.
- Do not disclose whether an email exists in password reset or login flows.
- Rate-limit credential endpoints.

Example server function auth middleware:

```ts
import { createMiddleware } from '@tanstack/react-start'

export const authMiddleware = createMiddleware({ type: 'function' }).server(
  async ({ next }) => {
    const token = readSessionTokenFromCookie()
    const session = token ? await db.sessions.findValid(token) : null
    if (!session) throw new Error('Unauthorized')
    return next({ context: { session } })
  },
)
```

Use that middleware on protected functions:

```ts
export const getMyOrders = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    return db.orders.findMany({ userId: context.session.userId })
  })
```

For OAuth, use state and PKCE; verify callback state, exchange the code with the verifier, then issue a session cookie.

## Common Failure Checks

- Secret appears in client bundle: move code into a server function, server route, `createServerOnlyFn`, `.server.*` file, or server-only marker.
- Loader uses database or secret directly: loaders are isomorphic; wrap server-only work.
- `src/start.ts` added and server function CSRF protection vanished: add `createCsrfMiddleware()`.
- Tenant ID sent from client context controls a query: validate shape and authorize the session against that tenant.
- Public API implemented as server function: use server route.
- Internal app RPC implemented as server route with hand-rolled serialization: use server function.
