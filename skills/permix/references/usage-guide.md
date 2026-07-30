# Usage Guide

Day-to-day Permix v4 workflow. Prefer this for adoption; use sibling references for API depth.

## 1. Install

```sh
bun add permix
```

Requires **Node.js >= 22** (package `engines`). Core has **zero** runtime dependencies. Install framework peers only when importing their subpaths (React, Express, etc.).

Target **`permix@^4`** (stable snapshot **4.1.2**). Do not use stale npm `beta`/`rc` 2.x tags.

## 2. Define permissions

```ts
import { createPermix } from 'permix'

interface Post {
  id: string
  authorId: string
  published: boolean
}

export const permix = createPermix<{
  post: [
    'create',
    'read',
    { name: 'edit', type: Post },
    { name: 'delete', type: Post, required: true },
  ]
}>()
```

Patterns:

| Pattern | Example |
|---|---|
| String actions (no entity data) | `post: ['create', 'read']` |
| Typed entity per action | `{ name: 'edit', type: Post }` |
| Data required at check time | `{ name: 'delete', type: Post, required: true }` |
| Nested trees | `workspace: { billing: ['view'] }` → `check('workspace.billing.view')` |
| Flat (no entity group) | `createPermix<['read', 'write']>()` |

Always pass the generic to `createPermix` — even with initial rules — or you lose path validation.

## 3. Setup rules for the current actor

```ts
const user = await fetchUser()

permix.setup({
  post: {
    create: true,
    read: true,
    edit: post => (post ? post.authorId === user.id : user.role === 'admin'),
    delete: post => post.authorId === user.id || user.role === 'admin',
  },
})
```

- `setup` **replaces** all previous rules.
- Describe **every** action from the definition.
- Booleans = static allow/deny; functions = ReBAC / ownership (actor via closure).
- Without entity data, typed optional rules usually evaluate to **`false`** if they use `post?.…`.

Reusable factories:

```ts
import { createRules } from 'permix'
import type { Rules } from 'permix'

export function rulesFor(user: User): Rules<typeof permix.$inferDefinition> {
  return {
    post: {
      create: user.role !== 'guest',
      read: true,
      edit: post => post?.authorId === user.id,
      delete: user.role === 'admin',
    },
  }
}
```

Or `permix.template(...)` for static / param-based rule sets — see [core-api.md](core-api.md).

## 4. Check permissions

```ts
permix.check('post.create')
permix.check('post.edit', post)
permix.check('post.delete', post) // required data — TS enforces

permix.check(c => c('post.read') && c('post.edit', post))
permix.check('post.~all')
permix.check('post.~any')
permix.check('~all') // entire tree
```

Returns **`boolean`**. Invalid path → **`PermixRuleNotDefinedError`**. No rules yet → **`PermixNotReadyError`**.

Async setup:

```ts
await permix.isReadyAsync()
permix.check('post.create')
```

`checkAsync` does **not** exist in v4.

## 5. Shared types (server + client)

```ts
import type { Rules, ValidateDefinition } from 'permix'

export type PermissionsDefinition = ValidateDefinition<{
  post: ['create', 'read', { name: 'edit', type: Post }]
}>

export function getRules(role: 'admin' | 'user'): Rules<PermissionsDefinition> {
  // ...
}
```

- Server adapter: `createPermix` from `permix/express` (etc.) with the same definition.
- Client: `createPermix` from `permix` + UI adapter.
- Path union: `type Path = typeof permix.$inferPath`.

## 6. React (client UX)

```tsx
import { PermixProvider, usePermix, createComponents, PermixHydrate } from 'permix/react'
import { permix } from './permix'

export const { Check } = createComponents(permix)

function App({ state, children }) {
  return (
    <PermixProvider permix={permix}>
      <PermixHydrate state={state}>{children}</PermixHydrate>
    </PermixProvider>
  )
}

function EditButton({ post }) {
  const { check, isReady } = usePermix(permix)
  if (!isReady) return null
  if (!check('post.edit', post)) return null
  return <button>Edit</button>
}

<Check path="post.create" otherwise={<p>Denied</p>}>
  <CreateForm />
</Check>
```

Pass the **same** instance to provider, hook, and `createComponents`. Gate on `isReady` before `check` when rules may not exist yet.

Vue / Solid / Svelte follow the same `Provider` + `usePermix` + `Check` shape — see [frameworks-ssr.md](frameworks-ssr.md).

## 7. SSR hydration

```ts
// Server
serverPermix.setup(getRules(user))
const state = serverPermix.dehydrate() // functions → false when called without data

// Client
clientPermix.hydrate(state)
// isReady() === false; boolean checks work
clientPermix.setup(getRules(user)) // restore functions + ready
```

Never treat dehydrated JSON as the security boundary.

## 8. Server enforcement (Express example)

```ts
import { createPermix } from 'permix/express'

const permix = createPermix<{
  post: ['create', { name: 'update', type: Post }]
}>()

app.use(
  permix.setupMiddleware(({ req }) => ({
    post: {
      create: !!req.user,
      update: post => post?.authorId === req.user?.id,
    },
  })),
)

app.post('/posts', permix.checkMiddleware('post.create'), handler)
app.put(
  '/posts/:id',
  permix.checkMiddleware(c => c('post.update', /* load entity in handler or middleware */)),
  handler,
)
```

Same pair — `setupMiddleware` + `checkMiddleware` — on Hono, Elysia, Fastify, Node, and `permix/server`. Default denial is typically **403**; customize with `createPermix({ onForbidden })`.

Next.js App Router: `createPermix` from `permix/next` (per-request via `cache()`). TanStack Start: `permix/tanstack-start`. Details: [frameworks-ssr.md](frameworks-ssr.md), [server-integrations.md](server-integrations.md).

## 9. Progressive adoption

1. **Shared definition + server `setup`/`check`** in one API layer.
2. **Middleware** on mutating routes.
3. **Client UI** with `Check` / `usePermix` for hide/disable.
4. **SSR dehydrate/hydrate** if first paint needs permissions.
5. Optional: Drizzle CRUD helpers (`permix/drizzle`), Effect layer (`permix/effect`).

## 10. Testing

```ts
import { createPermix, PermixNotReadyError } from 'permix'

const permix = createPermix<{ post: ['create', { name: 'edit', type: Post }] }>()

expect(() => permix.check('post.create')).toThrow(PermixNotReadyError)

permix.setup({
  post: {
    create: true,
    edit: p => p?.authorId === '1',
  },
})

expect(permix.check('post.create')).toBe(true)
expect(permix.check('post.edit', { authorId: '1' })).toBe(true)
expect(permix.check('post.edit')).toBe(false)
```

For HTTP adapters, assert status 200 vs 403 with the framework’s request helpers.

## 11. Troubleshooting

| Symptom | Fix |
|---|---|
| `PermixNotReadyError` | Call `setup` (or pass initial rules); after hydrate, call `setup` again |
| Functions always deny after SSR | Re-`setup` on client — dehydrate collapses functions to `false` |
| `PermixRuleNotDefinedError` | Path missing from `setup` rules / typo vs definition |
| TS wants data on `check` | Action has `required: true` |
| Concurrent requests share permissions | Use `permix/next` / middleware adapters — not a global mutable core instance |
| Still using `check('post', 'edit')` | Migrate to v4 — [migration-v4.md](migration-v4.md) |

## 12. What not to do

- Do not enforce security only in the browser.
- Do not skip client `setup` after `hydrate` when you use function rules.
- Do not call `checkAsync` (removed).
- Do not use a single core singleton for concurrent server requests.
- Do not leave v3 definition / two-arg `check` / Better Auth plugin APIs in a v4 app.
