# Server Integrations

HTTP and RPC adapters: shared middleware patterns, Express/Hono/Elysia/Fastify/Node/server, tRPC/oRPC, Drizzle helpers.

## Shared pattern

Most server adapters expose a factory `createPermix` from their subpath (not from `permix` core):

```ts
import { createPermix } from 'permix/express' // or hono, elysia, …
```

Common surface:

| API | Role |
|---|---|
| `setupMiddleware(rules \| async ctx => rules)` | Attach per-request rules |
| `checkMiddleware(path \| callback \| '~all'…)` | Deny (default 403) when check fails |
| `get(req\|c)` / `getOrThrow(...)` | Access `{ check, … }` for the request |
| `template(...)` | Reusable rule sets |
| `hook('check', …)` | Observe checks |
| `createPermix({ onForbidden })` | Custom denial (replaces v3 `forbiddenError` on RPC) |

Always `setupMiddleware` (or equivalent context setup) **before** `checkMiddleware` / `getOrThrow`, or expect **`PermixNotFoundError`**.

## Express — `permix/express`

Docs: https://permix.letstri.dev/docs/integrations/express

```ts
import express from 'express'
import { createPermix } from 'permix/express'

const permix = createPermix<{
  post: ['create', { name: 'update', type: Post }, 'delete']
}>()

const app = express()

app.use(
  permix.setupMiddleware(({ req }) => ({
    post: {
      create: !!req.user,
      update: post => post?.authorId === req.user?.id,
      delete: req.user?.role === 'admin',
    },
  })),
)

app.post('/posts', permix.checkMiddleware('post.create'), (req, res) => {
  res.json({ ok: true })
})

app.put(
  '/posts/:id',
  permix.checkMiddleware(c => c('post.update') /* entity often checked in handler */),
  handler,
)

app.delete('/posts/:id', permix.checkMiddleware('post.~all'), handler)

app.get('/posts', permix.checkMiddleware('post.~any'), handler)

// Inside a handler
app.get('/me/can', (req, res) => {
  const { check } = permix.get(req)
  res.json({ create: check('post.create') })
})
```

Rules can also be a plain object: `setupMiddleware({ post: { create: true } })`.

## Hono — `permix/hono`

Docs: https://permix.letstri.dev/docs/integrations/hono

```ts
import { Hono } from 'hono'
import { createPermix } from 'permix/hono'

const permix = createPermix<{ post: ['create', 'read', 'update', 'delete'] }>()
const app = new Hono()

app.use(
  permix.setupMiddleware(({ c }) => {
    const user = c.get('user')
    const isAdmin = user?.role === 'admin'
    return {
      post: {
        create: true,
        read: true,
        update: isAdmin,
        delete: isAdmin,
      },
    }
  }),
)

app.post('/posts', permix.checkMiddleware('post.create'), c => c.json({ ok: true }))

// In a handler
const { check } = permix.getOrThrow(c)
```

## Elysia — `permix/elysia`

Docs: https://permix.letstri.dev/docs/integrations/elysia

```ts
import { Elysia } from 'elysia'
import { createPermix } from 'permix/elysia'

const permix = createPermix<{ post: ['create', 'update', 'delete'] }>()

const app = new Elysia()
  .onBeforeHandle(
    permix.setupMiddleware(({ context }) => ({
      post: {
        create: true,
        update: !!context.headers.authorization,
        delete: !!context.headers.authorization,
      },
    })),
  )
  .post('/posts', handler, {
    beforeHandle: permix.checkMiddleware('post.create'),
  })
```

## Fastify — `permix/fastify`

Docs: https://permix.letstri.dev/docs/integrations/fastify  
Peer: `fastify` + `fastify-plugin`. Same `setupMiddleware` / `checkMiddleware` idea — confirm registration helper against current docs.

## Node HTTP — `permix/node`

Docs: https://permix.letstri.dev/docs/integrations/node  
For raw `node:http` servers without a framework.

## Fetch middleware — `permix/server`

Docs: https://permix.letstri.dev/docs/integrations/server  
Framework-agnostic Web Standard `Request`/`Response` (srvx-shaped). Prefer this for generic fetch handlers when Express/Hono/etc. are not in use.

## tRPC — `permix/trpc`

Docs: https://permix.letstri.dev/docs/integrations/trpc

v4 uses **`setupContext`** (not a setup that returns only `{ check, dehydrate }`):

```ts
import { createPermix } from 'permix/trpc'

const permix = createPermix<{
  post: ['create', 'read', 'update', 'delete']
}>().contextKey('permissions') // optional; default key `permix`

protectedProcedure.use(({ ctx, next }) =>
  next({
    ctx: permix.setupContext({
      post: {
        create: true,
        read: true,
        update: false,
        delete: false,
      },
    }),
  }),
)

createPost.use(permix.checkMiddleware('post.create'))
updatePost.use(permix.checkMiddleware(c => c('post.read') && c('post.update')))
adminAction.use(permix.checkMiddleware('post.~all'))
```

- Context value is a **full** Permix instance.
- Denial customization: `createPermix({ onForbidden })` (v3 `forbiddenError` renamed).

## oRPC — `permix/orpc`

Docs: https://permix.letstri.dev/docs/integrations/orpc  
Same v4 context/`onForbidden` patterns as tRPC — mirror docs when wiring.

## Drizzle — `permix/drizzle`

Docs: https://permix.letstri.dev/docs/integrations/drizzle

- `permix/drizzle` — Drizzle **v1** / RC-compatible peer range
- `permix/drizzle/legacy` — Drizzle **v0** (`>=0.30 <1`)

Use to auto-generate a Permix definition and CRUD-oriented rules from a schema. Prefer the non-legacy entry when on Drizzle 1.x / RC.

## Effect — `permix/effect`

Docs: https://permix.letstri.dev/docs/integrations/effect  
Provides Effect `Layer` / `Context` wiring. Peer `effect` is optional and version-constrained — match the app’s Effect major.

## Nest.js

**Not supported** — no export, no docs page. Use Express/Fastify adapters underneath Nest, or call core `createPermix` in guards manually.

## Concurrent request safety

| Bad | Good |
|---|---|
| One global core `permix` mutated with `setup` per request | `permix/express` (etc.) middleware / `permix/next` cache scoping |
| Trusting client dehydrate for writes | `checkMiddleware` on mutating routes |

## Testing server adapters

1. Mount app with `setupMiddleware` returning known rules.
2. Hit allowed route → 200.
3. Hit denied route → 403 (or custom `onForbidden` body).
4. Call `get` without setup → expect `PermixNotFoundError` / framework error path.

## Examples

GitHub: https://github.com/letstri/permix/tree/main/examples  
Useful: `express`, `express-trpc-react`, `role-based`, `rebac`, `feature-flags`, `next`, `tanstack-start`.
