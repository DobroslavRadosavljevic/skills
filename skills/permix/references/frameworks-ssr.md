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

After SSR hydrate, still call `permix.setup(...)` on the client.

## Vue / Solid / Svelte

| Adapter | Import | Docs |
|---|---|---|
| Vue 3 | `permix/vue` | https://permix.letstri.dev/docs/integrations/vue |
| Solid | `permix/solid` | https://permix.letstri.dev/docs/integrations/solid |
| Svelte 5 | `permix/svelte` | https://permix.letstri.dev/docs/integrations/svelte |

Same conceptual surface: provider, `usePermix` (or Solid accessor `isReady()`), `createComponents` → `Check`.

- Vue: `#otherwise` slot
- Svelte: `otherwise` snippet
- Solid: reactive `isReady`

Examples: `examples/vue`, `solid`, `svelte` in the GitHub repo.

## Next.js App Router — `permix/next`

Docs: https://permix.letstri.dev/docs/integrations/next

Uses React `cache()` for **per-request** isolation. Do **not** stash `permix.get()` in module scope for reuse across requests.

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
| `template(...)` | Reusable rule sets |

```tsx
// app/layout.tsx
import { permix } from '@/lib/permix'
import { getSession } from '@/lib/auth'

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
      <body>{children}</body>
    </html>
  )
}
```

**Client:** separate `createPermix` from `permix` + `PermixProvider` / `PermixHydrate` from `permix/react`. Share `ValidateDefinition` / `Rules` types between server and client modules.

## TanStack Start — `permix/tanstack-start`

Docs: https://permix.letstri.dev/docs/integrations/tanstack-start

Pattern: `setupMiddleware` on the server, then `getOrThrow(context)` inside `createServerFn` / loaders. Client providers mirror React (`PermixProvider` + `PermixHydrate`).

Keep one shared `PermissionsDefinition` type; server uses `permix/tanstack-start`, browser uses `permix` + `permix/react`.

## Hydration checklist (any SSR framework)

1. Server `setup` with full rules (functions OK).
2. `dehydrate()` → send JSON to client (functions become booleans, often `false`).
3. Client `hydrate(state)` — booleans checkable; **`isReady()` still false**.
4. Client `setup(same actor rules)` — restores functions + ready.
5. UI: prefer gating on `isReady` for function-based paths; don’t trust client as security.

## Effect — `permix/effect`

Layer/Context integration for Effect apps. Docs: https://permix.letstri.dev/docs/integrations/effect  
Confirm Effect peer version against `package.json` peers when wiring.

## What is not provided

- **No Nest.js** adapter in exports or docs.
- UI checks are **not** authorization — always pair with server checks.
