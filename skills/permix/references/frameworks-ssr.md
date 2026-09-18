# Frameworks and SSR

UI adapters (`permix/react` etc.), Next.js / TanStack Start request scoping, and hydration patterns.

## React — `permix/react`

Docs: https://permix.letstri.dev/docs/integrations/react

| Export | Role |
|---|---|
| `PermixProvider` | Context; prop `permix` |
| `usePermix(permix)` | `{ check, isReady }` |
| `createComponents(permix)` | `{ Check }` |
| `PermixHydrate` | Apply `DehydratedState` on the client |

```tsx
import { createPermix } from 'permix'
import {
  PermixProvider,
  usePermix,
  createComponents,
  PermixHydrate,
} from 'permix/react'
import type { DehydratedState } from 'permix'

export const permix = createPermix<{
  post: ['create', { name: 'edit', type: Post }]
}>()

export const { Check } = createComponents(permix)

export function Providers({
  state,
  children,
}: {
  state?: DehydratedState<any>
  children: React.ReactNode
}) {
  return (
    <PermixProvider permix={permix}>
      {state ? <PermixHydrate state={state}>{children}</PermixHydrate> : children}
    </PermixProvider>
  )
}

function Toolbar({ post }: { post: Post }) {
  const { check, isReady } = usePermix(permix)
  if (!isReady) return <div>Loading permissions…</div>
  return check('post.edit', post) ? <button>Edit</button> : null
}

<Check path="post.create" otherwise={<p>Denied</p>} reverse={false}>
  <CreateForm />
</Check>
```

`Check` props: `path`, optional `data`, `otherwise`, `reverse`.

**Rules:** pass the **same** core instance to provider, hook, and components. Gate on `isReady` when no hydrate/setup yet — `check` throws `PermixNotReadyError` otherwise.

After SSR hydrate, still call `permix.setup(...)` on the client (typically `useEffect` / session restore). `PermixHydrate` re-applies when `state` changes; re-run client `setup` after each re-hydration if you need function rules.

## Vue / Solid / Svelte

| Adapter | Import | Docs |
|---|---|---|
| Vue 3 | `permix/vue` | https://permix.letstri.dev/docs/integrations/vue |
| Solid | `permix/solid` | https://permix.letstri.dev/docs/integrations/solid |
| Svelte 5 | `permix/svelte` | https://permix.letstri.dev/docs/integrations/svelte |

Same conceptual surface: provider, `usePermix`, `createComponents` → `Check`.

- Vue: `#otherwise` slot; `isReady` is a `ComputedRef` (destructure in script is fine).
- Solid: `isReady()` accessor.
- Svelte: `otherwise` snippet; **`isReady` is a getter — do not destructure**. Svelte 5 required. Also exports `providePermix` (used inside `PermixProvider`).

From 4.2.0, Solid/Svelte/Vue subscribe to `setup`/`ready` **during render**, so dehydrated booleans show on first paint. Svelte `PermixHydrate` re-hydrates when `state` changes (React/Vue already did).

Examples: `examples/vue`, `solid`, `svelte` in the GitHub repo.

## Next.js App Router — `permix/next`

Docs: https://permix.letstri.dev/docs/integrations/next

Uses React `cache()` for **per-request** isolation. App Router only. Do **not** stash `permix.get()` in module scope for reuse across requests.

```ts
// lib/permix.ts (server)
import { createPermix } from 'permix/next'

export const permix = createPermix<{
  post: ['create', { name: 'edit', type: Post }]
}>()
```

| Method | Purpose |
|---|---|
| `setup(rules)` | Per-request rules (e.g. root layout after session) |
| `check(...)` | RSC, route handlers, server actions |
| `get()` | Underlying request-scoped `Permix` |
| `getRules()` | Current rules or `null` |
| `dehydrate()` | JSON for client |
| `template(...)` | Reusable rule sets — call the result: `adminTemplate()` |

```tsx
// app/layout.tsx
import { permix } from '@/lib/permix'
import { getSession } from '@/lib/auth'
import { Providers } from './providers'

export default async function RootLayout({ children }) {
  const session = await getSession()
  permix.setup({
    post: {
      create: !!session,
      edit: post => post?.authorId === session?.userId,
    },
  })
  return (
    <html>
      <body>
        <Providers state={permix.dehydrate()}>{children}</Providers>
      </body>
    </html>
  )
}
```

**Client:** separate `createPermix` from `permix` + `PermixProvider` / `PermixHydrate` from `permix/react` (often in a `'use client'` providers module). Share `ValidateDefinition` / `Rules` types between server and client modules.

## TanStack Start — `permix/tanstack-start`

Docs: https://permix.letstri.dev/docs/integrations/tanstack-start

Two instances, two contexts:

| | Server request context | Router context |
|---|---|---|
| Created by | `setupMiddleware()` / `createSetupHandler()` | `createPermix` from `permix` inside `getRouter()` |
| Read with | `permix.get(context)` / `getOrThrow(context)` | `context.permix` |
| Available in | server functions, server routes | `beforeLoad`, `loader`, components |
| Rules | full, including functions | hydrated booleans until client `setup()` |
| Trustworthy | yes — enforcement | no — UX only |

Default context key: `'__permix'`. Override with `.contextKey('permissions')`.

### Setup

```ts
// src/start.ts — isomorphic rules, no server-only imports
import { createStart } from '@tanstack/react-start'
import { permix } from './lib/permix'

export const startInstance = createStart(() => ({
  requestMiddleware: [
    permix.setupMiddleware(async ({ request }) => {
      const session = await getSession(request)
      return { /* Rules */ }
    }),
  ],
}))
```

`setupMiddleware()` calls `createMiddleware().server(...)` **inside the package**, so TanStack Start cannot prune the callback’s imports from the client graph. If the callback pulls auth/DB/`node:` modules, they leak (`Buffer is not defined`, externalized `events`, drivers in the browser bundle).

**4.2.0+:** write the `.server()` boundary yourself:

```ts
import { createMiddleware, createStart } from '@tanstack/react-start'
import { auth } from './lib/auth' // server-only
import { permix } from './lib/permix'

const permixMiddleware = createMiddleware().server(
  permix.createSetupHandler(async ({ request }) => {
    const session = await auth.api.getSession({ headers: request.headers })
    return { /* Rules */ }
  }),
)

export const startInstance = createStart(() => ({
  requestMiddleware: [permixMiddleware],
}))
```

`createSetupHandler` accepts the same `Rules` object or `({ request }) => rules` as `setupMiddleware`. `checkMiddleware` is unaffected.

### Enforce on the server

```ts
export const createPost = createServerFn({ method: 'POST' })
  .middleware([permix.checkMiddleware('post.create')])
  .handler(async () => { /* ... */ })

// Inside a handler:
permix.getOrThrow(context).check('post.read', post)
```

Default denial throws **`PermixForbiddenError`**. Customize with `createPermix({ onForbidden })` (throw `redirect()`, `Response`, etc.).

`get(context)` is nullable; `getOrThrow` throws `PermixNotFoundError`. `dehydrate(context)` / `getRules(context)` take the **server** context.

### Router context + hydration

`beforeLoad` / `loader` see router context, not server request context. Create a core instance in `getRouter()` (once per SSR request / once per browser tab):

```tsx
import { createPermix } from 'permix'

export function getRouter() {
  const permix = createPermix<PermissionsDefinition>()
  return createTanStackRouter({ routeTree, context: { permix } })
}
```

Dehydrate **inside a server function**, hydrate in root `beforeLoad`, pass the same instance to `PermixProvider`:

```ts
export const getPermixState = createServerFn().handler(({ context }) =>
  permix.dehydrate(context),
)
```

```tsx
beforeLoad: async ({ context }) => {
  const state = await getPermixState()
  context.permix.hydrate(state)
  return { state }
}
```

Then `context.permix.check('post.create')` in child `beforeLoad` is a **UX guard**. Mirror it with `checkMiddleware` / `getOrThrow(context).check()` on server functions.

Hydrated rules are booleans — entity-data rules collapse. Re-`setup` on the client for functions + `isReady`.

Client: read `permix` from `useRouteContext({ from: '__root__' })` and pass it to `usePermix` from `permix/react`.

## Hydration checklist (any SSR framework)

1. Server `setup` with full rules (functions OK).
2. `dehydrate()` → send JSON to client (functions become booleans, often `false`).
3. Client `hydrate(state)` — booleans checkable; **`isReady()` still false**.
4. Client `setup(same actor rules)` — restores functions + ready.
5. UI: prefer gating on `isReady` for function-based paths; don’t trust client as security.
6. After navigation that delivers a new dehydrated `state`, hydrate again and re-`setup` functions.

## Effect — `permix/effect`

Layer/Context integration. Docs: https://permix.letstri.dev/docs/integrations/effect

- `createPermix({ id? })` — optional `id` isolates multiple instances on the same Effect context.
- `layer(rules?)` / `layerSetup(Effect<Rules>)` — provide the service.
- `check` / `setup` / `dehydrate` / `hydrate` / `isReady` / `getRules` / `hook` return **`Effect`** (not plain values).
- Full instance (not check-only). Peer `effect` `>=3`, optional.

See [server-integrations.md](server-integrations.md) for a compact API table.

## What is not provided

- UI checks are **not** authorization — always pair with server checks.
- NestJS lives under `permix/nest` (HTTP only) — not a UI adapter; see [server-integrations.md](server-integrations.md).
