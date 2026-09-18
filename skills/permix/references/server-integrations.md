# Server Integrations

HTTP and RPC adapters: shared middleware patterns, Express/Hono/Elysia/Fastify/Node/server, NestJS, tRPC/oRPC, Drizzle helpers, Effect.

## Shared pattern

Most server adapters expose a factory `createPermix` from their subpath (not from `permix` core):

```ts
import { createPermix } from 'permix/express' // or hono, elysia, nest, …
```

Common surface (HTTP-style):

| API | Role |
|---|---|
| `setupMiddleware(rules \| async ctx => rules)` | Attach per-request rules |
| `checkMiddleware(path \| callback \| '~all'…)` | Deny (default 403) when check fails |
| `get(req\|c)` / `getOrThrow(...)` | Access `{ check, … }` for the request |
| `template(...)` | Reusable rule sets — **call** the result |
| `hook('check', …)` | Observe checks |
| `createPermix({ onForbidden })` | Custom denial (replaces v3 `forbiddenError` on RPC) |
| `.contextKey(key)` | Custom request/context key (defaults vary) |

Always `setupMiddleware` (or Nest `guard` / RPC `setupContext`) **before** `checkMiddleware` / `@Check` / `getOrThrow`, or expect **`PermixNotFoundError`**.

Default context keys: Express/Hono/Elysia/Fastify/Node/server/Nest → unique `Symbol('permix')`; tRPC/oRPC → `'permix'`; TanStack Start → `'__permix'`.

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
  permix.checkMiddleware(c => c('post.update')),
  handler,
)

app.delete('/posts/:id', permix.checkMiddleware('post.~all'), handler)
app.get('/posts', permix.checkMiddleware('post.~any'), handler)

app.get('/me/can', (req, res) => {
  const { check } = permix.getOrThrow(req)
  res.json({ create: check('post.create') })
})
```

Rules can also be a plain object: `setupMiddleware({ post: { create: true } })`. Default `onForbidden` sends `403` `{ error: 'Forbidden' }`.

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

const { check } = permix.getOrThrow(c)
```

Default `onForbidden`: `c.json({ error: 'Forbidden' }, 403)`.

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

Default `onForbidden` sets status `"Forbidden"` and returns `{ error: 'Forbidden' }`.

## Fastify — `permix/fastify`

Docs: https://permix.letstri.dev/docs/integrations/fastify

Peers: `fastify` + `fastify-plugin` `>=5`. `setupMiddleware` is a **plugin** — `register` it. `checkMiddleware` is a `preHandler`.

```ts
import Fastify from 'fastify'
import { createPermix } from 'permix/fastify'

const fastify = Fastify()
const permix = createPermix<{
  post: [{ name: 'create', type: Post }, { name: 'read', type: Post }]
}>()

await fastify.register(
  permix.setupMiddleware(({ request }) => ({
    post: { create: true, read: true },
  })),
)

fastify.post(
  '/posts',
  { preHandler: permix.checkMiddleware('post.create') },
  (request, reply) => reply.send({ success: true }),
)

fastify.get('/posts', (request, reply) => {
  const { check } = permix.getOrThrow(request)
  // ...
})
```

`onForbidden` receives `{ request, reply, path, data }`. Default: `reply.status(403).send({ error: 'Forbidden' })`.

## Node HTTP — `permix/node`

Docs: https://permix.letstri.dev/docs/integrations/node

For raw `node:http` servers. Handlers are `(req, res, next) => Promise<void>`. Call `await setupMiddleware(...)(req, res, next)` then `checkMiddleware`.

## Fetch middleware — `permix/server`

Docs: https://permix.letstri.dev/docs/integrations/server

Framework-agnostic Web Standard `Request`/`Response` (srvx-shaped `(req, next) => Response`). Prefer this for generic fetch handlers when Express/Hono/etc. are not in use. Default `onForbidden` returns `403` JSON.

## NestJS — `permix/nest` (new in 4.3.0)

Docs: https://permix.letstri.dev/docs/integrations/nest  
Example: https://github.com/letstri/permix/tree/main/examples/nest

Peers: `@nestjs/common` + `@nestjs/core` `>=10`, `reflect-metadata` `>=0.1.13` (optional until you import this subpath).

`guard()` **only attaches** the per-request instance. `@Check` **enforces** (and fails closed if setup never ran).

```ts
import { Module } from '@nestjs/common'
import { APP_GUARD } from '@nestjs/core'
import { createPermix } from 'permix/nest'

export const permix = createPermix<{
  post: [
    { name: 'create', type: Post },
    { name: 'read', type: Post },
    { name: 'update', type: Post },
  ]
}>()

@Module({
  providers: [
    {
      provide: APP_GUARD,
      useValue: permix.guard(({ req }) => ({
        post: { create: true, read: true, update: false },
      })),
    },
  ],
})
export class AppModule {}
```

```ts
@Controller('posts')
export class PostsController {
  @Post()
  @permix.Check('post.create')
  create() {
    return { success: true }
  }

  @Put(':id')
  @permix.Check(c => c('post.read') && c('post.update'))
  update() {}

  @Delete(':id')
  @permix.Check('post.~all')
  remove() {}
}
```

| Rule | Detail |
|---|---|
| Fail-closed | `@Check` with no `guard` on the request → `PermixNotFoundError` |
| Placement | Method or class decorator (`MethodDecorator & ClassDecorator`) |
| Per-route | `@UseGuards(permix.guard(rules))` **above** `@Check` so setup runs first |
| HTTP only | Express and Fastify Nest adapters. RPC / WebSockets / GraphQL skip setup; `@Check` there still throws `PermixNotFoundError` |
| `req` typing | Untyped inside the guard (`NestHttpRequest` is `any`). Annotate `@Req() req: Request` yourself |
| Auth order | Global guards run in registration order — register auth **before** Permix or `req.user` is empty |
| Entity checks | Load the resource in the handler, then `permix.getOrThrow(req).check('post.update', post)` |
| `onForbidden` | **Must throw.** Default: `ForbiddenException({ error: 'Forbidden' })`. Returning normally lets Nest raise another `ForbiddenException` |
| `onForbidden` args | `{ req, context, path, data }` (`path` is `null` for callback checks) |
| Templates | `return adminTemplate()` from the guard callback |

```ts
const permix = createPermix<Definition>({
  onForbidden: ({ path }) => {
    throw new ForbiddenException({
      error: `You don't have permission for ${path}`,
    })
  },
})
```

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
- Default denial: `TRPCError` `{ code: 'FORBIDDEN', message: 'You do not have permission to perform this action' }`.
- Customize with `createPermix({ onForbidden })` (v3 `forbiddenError` renamed).

## oRPC — `permix/orpc`

Docs: https://permix.letstri.dev/docs/integrations/orpc

Same v4 `setupContext` / `checkMiddleware` / `.contextKey()` / `onForbidden` patterns as tRPC. Default denial: `ORPCError('FORBIDDEN', { message: 'You do not have permission to perform this action' })`.

## Drizzle — `permix/drizzle`

Docs: https://permix.letstri.dev/docs/integrations/drizzle

| Import | Drizzle | Notes |
|---|---|---|
| `permix/drizzle` | **v1** / `>=1.0.0-rc` | `extractTablesFromSchema`; tables **and views** |
| `permix/drizzle/legacy` | **v0** `>=0.30 <1` | Tables only via `is(value, Table)` |

Same API: `createPermix(schema, { actions? })` returns a normal Permix instance plus:

- `permix.tables` — detected export names (not SQL table names)
- `permix.actions` — default `['create', 'read', 'update', 'delete']`
- Custom: `createPermix(schema, { actions: ['view', 'edit'] as const })`
- Invalid actions → `PermixInvalidActionsError`

Skip relations/helpers automatically — `import * as schema` is fine. Keys are **schema export names** (`users.read`, not `app_users.read`).

## Effect — `permix/effect`

Docs: https://permix.letstri.dev/docs/integrations/effect

| API | Role |
|---|---|
| `createPermix({ id? })` | Optional `id` isolates multiple instances |
| `Tag` | Effect `Context.Tag` |
| `layer(rules?)` | Static (or empty) `Layer` |
| `layerSetup(Effect<Rules>)` | Rules from other services; requirements flow through |
| `check` / `setup` / `dehydrate` / `hydrate` / `isReady` / `isReadyAsync` / `getRules` / `hook` | Return **`Effect`** |
| `template` | Same as core — call the result |

`check` is `Effect<boolean, PermixNotReadyError \| PermixRuleNotDefinedError, Permix<D>>`. Hydrate still does not mark ready — follow with `setup` for function rules.

## Concurrent request safety

| Bad | Good |
|---|---|
| One global core `permix` mutated with `setup` per request | `permix/express` (etc.) middleware / `permix/next` cache / Nest `guard` |
| Trusting client dehydrate for writes | `checkMiddleware` / `@Check` on mutating routes |
| TanStack Start `beforeLoad` only | Also `checkMiddleware` on server functions |

## Testing server adapters

1. Mount app with `setupMiddleware` / Nest `guard` returning known rules.
2. Hit allowed route → 200 (Nest create often 201).
3. Hit denied route → 403 (or custom `onForbidden` body / `ForbiddenException`).
4. Call `get` / `@Check` without setup → expect `PermixNotFoundError` / framework error path.

## Examples

GitHub: https://github.com/letstri/permix/tree/main/examples  
Useful: `express`, `express-trpc-react`, `role-based`, `rebac`, `feature-flags`, `next`, `tanstack-start`, **`nest`**.
