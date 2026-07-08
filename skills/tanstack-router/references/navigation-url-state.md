# Navigation And URL State

Use this reference for typed navigation, links, path params, search params, search middlewares, route masks, history, and render optimization.

## Navigation Rule

Do not interpolate params, query strings, or hashes into `to`.

Use the structured options:

```tsx
<Link
  to="/posts/$postId"
  params={{ postId: '123' }}
  search={{ tab: 'comments' }}
  hash="top"
>
  Post
</Link>
```

The shared navigation APIs use the same concepts:

- `from`: origin route path or route id.
- `to`: target route path or relative route path.
- `params`: path params object or updater.
- `search`: search params object or updater.
- `hash`: hash string or updater.
- `state`: history state object or updater.
- `mask`: optional route mask object.

When `from` is omitted, type-safe autocomplete is strongest for absolute paths from `/`.

## Links And Imperative Navigation

Prefer `<Link>` for user navigation because it renders an anchor with a real `href`.

Use `useNavigate()` for imperative client-side navigation:

```tsx
import { useNavigate } from '@tanstack/react-router'

function SaveButton() {
  const navigate = useNavigate({ from: '/posts/$postId' })

  return (
    <button
      onClick={() =>
        navigate({
          to: '/posts/$postId/edit',
          params: { postId: '123' },
        })
      }
    />
  )
}
```

Use `router.navigate()` when operating outside React components and you have the router instance.

Use `<Navigate>` when rendering should immediately trigger a client navigation.

None of these replace server redirects. For pre-render route redirects, throw `redirect()` from `beforeLoad` or use server-side redirect mechanisms in SSR/server runtimes.

## Reusable Link Options

Use `linkOptions()` to type-check reusable navigation options before spreading them:

```tsx
import { Link, linkOptions, redirect, useNavigate } from '@tanstack/react-router'

const dashboardLink = linkOptions({
  to: '/dashboard',
  search: { search: '' },
})

export const Route = createFileRoute('/dashboard')({
  validateSearch: (input) => ({ search: String(input.search ?? '') }),
  beforeLoad: () => {
    if (shouldRedirect()) throw redirect(dashboardLink)
  },
})

function DashboardLink() {
  const navigate = useNavigate()
  return (
    <>
      <button onClick={() => navigate(dashboardLink)}>Go</button>
      <Link {...dashboardLink}>Dashboard</Link>
    </>
  )
}
```

`linkOptions()` also accepts arrays for nav menus.

## Path Params

Path params match a single segment and are declared with `$`:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: ({ params }) => fetchPost(params.postId),
  component: PostRoute,
})

function PostRoute() {
  const { postId } = Route.useParams()
  return <div>{postId}</div>
}
```

Path params are available in:

- `beforeLoad`.
- `loader`.
- Route components via `Route.useParams()`.
- Other components with `getRouteApi('/route').useParams()` or `useParams({ from })`.

Use `params.parse` and `params.stringify` for typed params, with `params.priority` only to order competing parsed dynamic candidates:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  params: {
    priority: 10,
    parse: ({ postId }) => {
      if (!/^\d+$/.test(postId)) return false
      return { postId: Number(postId) }
    },
    stringify: ({ postId }) => ({ postId: String(postId) }),
  },
})
```

Static routes still beat dynamic routes regardless of `params.priority`.

Prefix/suffix params use `{}` in file names, for example `post-{$postId}.tsx` or `{$fileName}[.]txt.tsx`.

## Search Params

TanStack Router treats search params as typed URL state:

- JSON-first parsing and serialization.
- Runtime validation through `validateSearch`.
- Inheritance from parent routes.
- Access in hooks, loaders, and route options.
- Updates through `<Link search>`, `navigate({ search })`, and `router.navigate({ search })`.
- Search middlewares for retention and stripping defaults.

Always validate search params before consuming them:

```tsx
import { z } from 'zod'

const productSearchSchema = z.object({
  page: z.number().catch(1),
  filter: z.string().catch(''),
  sort: z.enum(['newest', 'oldest', 'price']).catch('newest'),
})

export const Route = createFileRoute('/shop/products')({
  validateSearch: productSearchSchema,
})
```

With Zod v4, current docs say the schema can be used directly. With Zod v3, use `@tanstack/zod-adapter` and `fallback()` when defaults/catches need correct input/output inference.

Valibot, ArkType, and Effect Schema can work directly when they implement Standard Schema.

## Reading Search

In a route component:

```tsx
const { page, filter, sort } = Route.useSearch()
```

Outside the route file:

```tsx
import { getRouteApi, useSearch } from '@tanstack/react-router'

const productsRoute = getRouteApi('/shop/products')
const search = productsRoute.useSearch()

const looseSearch = useSearch({ strict: false })
```

Prefer `getRouteApi()` in code-split components or shared components to avoid importing the route object and creating circular dependencies.

## Writing Search

Update current route search with `from`:

```tsx
<Link
  from={Route.fullPath}
  search={(prev) => ({ ...prev, page: prev.page + 1 })}
>
  Next
</Link>
```

Use `to="."` for generic components that update the current route:

```tsx
<Link to="." search={(prev) => ({ ...prev, page: Number(prev.page ?? 1) + 1 })}>
  Next
</Link>
```

Use `useNavigate({ from })` for imperative updates:

```tsx
const navigate = useNavigate({ from: Route.fullPath })

navigate({
  search: (prev) => ({ ...prev, page: prev.page + 1 }),
})
```

## Search Params In Loaders

Search params are not passed directly to loaders. Use `loaderDeps` to declare only the search values used by the loader:

```tsx
export const Route = createFileRoute('/posts')({
  validateSearch: z.object({
    page: z.number().int().nonnegative().catch(0),
    view: z.string().catch('list'),
  }),
  loaderDeps: ({ search }) => ({
    page: search.page,
  }),
  loader: ({ deps }) => fetchPosts({ page: deps.page }),
})
```

Do not return the entire `search` object from `loaderDeps` unless the loader truly uses every field. That causes avoidable cache invalidation and reloads.

## Search Middlewares

Use search middlewares to transform search params when links are built and after navigation validation.

Retain specific params:

```tsx
import { retainSearchParams } from '@tanstack/react-router'

export const Route = createRootRoute({
  validateSearch: rootSearchSchema,
  search: {
    middlewares: [retainSearchParams(['rootValue'])],
  },
})
```

Strip defaults:

```tsx
import { stripSearchParams } from '@tanstack/react-router'

const defaults = { view: 'list' }

export const Route = createFileRoute('/search')({
  validateSearch: searchSchema,
  search: {
    middlewares: [stripSearchParams(defaults)],
  },
})
```

Middlewares can be chained. Put global URL-state rules near the root route and local rules near route subtrees.

## History Types

Router defaults to browser history. Use custom history when needed:

```tsx
import { createHashHistory, createMemoryHistory, createRouter } from '@tanstack/react-router'

const hashHistory = createHashHistory()
const memoryHistory = createMemoryHistory({
  initialEntries: ['/'],
})

const router = createRouter({
  routeTree,
  history: memoryHistory,
})
```

Use hash history when the host cannot rewrite all paths to `index.html`. Use memory history for tests, non-browser environments, and SSR internals.

## Render Optimization

Use selectors to avoid re-rendering on unrelated router state:

```tsx
const foo = Route.useSearch({
  select: (search) => search.foo,
})
```

Structural sharing preserves JSON-compatible references. Enable globally:

```tsx
const router = createRouter({
  routeTree,
  defaultStructuralSharing: true,
})
```

Or per hook:

```tsx
const result = Route.useSearch({
  select: (search) => ({ foo: search.foo }),
  structuralSharing: true,
})
```

Structural sharing only works with JSON-compatible data.
