# Loaders, Context, Errors, And Data

Use this reference for route lifecycle, loaders, SWR caching, Query integration, router context, `beforeLoad`, auth, redirects, not-found handling, pending components, preloading, deferred data, and error boundaries.

## Route Loading Lifecycle

On URL/history updates, Router executes:

1. Route matching top-down:
   - `route.params.parse`.
   - `route.validateSearch`.
2. Route pre-loading serial:
   - `route.beforeLoad`.
   - `route.onError`.
   - Route or parent `errorComponent` if needed.
3. Route loading parallel:
   - `route.component.preload`.
   - `route.loader`.
   - Optional `pendingComponent`.
   - `route.component`.
   - `route.onError` and error boundaries if needed.

Parent `beforeLoad` runs before child `beforeLoad`. If a parent throws, children do not load.

## Loaders

Use loaders to fetch route data early and in parallel:

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
})
```

Object form allows loader-specific behavior:

```tsx
export const Route = createFileRoute('/posts')({
  loader: {
    handler: () => fetchPosts(),
    staleReloadMode: 'blocking',
  },
})
```

Loader arguments include:

- `abortController`.
- `cause`: `enter`, `preload`, or `stay`.
- `context`.
- `deps` from `loaderDeps`.
- `location`.
- `params`.
- `parentMatchPromise`.
- `preload`.
- `route`.

Read loader data with:

```tsx
const posts = Route.useLoaderData()
```

Use `getRouteApi('/posts').useLoaderData()` from shared or code-split components.

## Router Cache

Router includes a built-in SWR cache for loader data.

Key points:

- Loader cache keys include the parsed pathname plus `loaderDeps`.
- `staleTime` defaults to `0`, so data is immediately stale and can reload in the background.
- Preloaded data is fresh for 30 seconds by default.
- `gcTime` defaults to 30 minutes.
- `staleReloadMode` defaults to `background`.
- `router.invalidate()` marks cached route data stale and forces active routes to reload.

Use `staleTime` for static or expensive data:

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  staleTime: 10_000,
})
```

Disable automatic stale reloads:

```tsx
export const Route = createFileRoute('/posts')({
  loader: () => fetchPosts(),
  staleTime: Infinity,
})
```

Opt out of cache after unload and only reload on entry/deps:

```tsx
export const Route = createFileRoute('/posts')({
  loaderDeps: ({ search }) => ({ page: search.page }),
  loader: ({ deps }) => fetchPosts(deps),
  gcTime: 0,
  shouldReload: false,
})
```

Use the `abortController.signal` in fetches to cancel stale or irrelevant work:

```tsx
export const Route = createFileRoute('/posts')({
  loader: ({ abortController }) =>
    fetchPosts({ signal: abortController.signal }),
})
```

## Router Context

Router context is for dependency injection into route options. Type it at the root:

```tsx
import { createRootRouteWithContext } from '@tanstack/react-router'

interface RouterContext {
  queryClient: QueryClient
  auth: AuthState
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
})
```

Pass initial context to the router or `RouterProvider`:

```tsx
export const router = createRouter({
  routeTree,
  context: {
    queryClient,
    auth: undefined!,
  },
})
```

When a React hook provides context state, call the hook in React land and pass the value into `RouterProvider`:

```tsx
function InnerApp() {
  const auth = useAuth()
  return <RouterProvider router={router} context={{ auth }} />
}
```

Do not call React hooks inside `beforeLoad` or `loader`.

Invalidate router context after auth or dependency changes:

```tsx
const router = useRouter()
await login()
await router.invalidate()
```

Routes can add context in `beforeLoad`; child routes inherit it.

## beforeLoad, Auth, And Redirects

Use `beforeLoad` for auth UX gates, redirects, dependency checks, and context enrichment:

```tsx
import { createFileRoute, isRedirect, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async ({ context, location }) => {
    try {
      if (!context.auth.isAuthenticated) {
        throw redirect({
          to: '/login',
          search: { redirect: location.href },
        })
      }
      return { user: context.auth.user }
    } catch (error) {
      if (isRedirect(error)) throw error
      throw redirect({
        to: '/login',
        search: { redirect: location.href },
      })
    }
  },
})
```

Route guards are not private-data authorization boundaries. Any server function, server route, or API endpoint that returns private data must authorize the request independently.

After login, use the stored redirect target carefully. For raw redirect URLs, `router.history.push(search.redirect)` can restore the exact URL.

## TanStack Query Integration

Router can own simple route data with its built-in cache. Use TanStack Query when the app needs a richer external cache, shared data across routes, mutations, persistence, or Query's invalidation model.

When Query owns freshness, set Router preload stale time to `0` so every preload/load/reload reaches the loader and Query can dedupe:

```tsx
const router = createRouter({
  routeTree,
  defaultPreloadStaleTime: 0,
})
```

Use loaders to ensure critical data is in the cache before render:

```tsx
import { queryOptions, useSuspenseQuery } from '@tanstack/react-query'

const postsQuery = queryOptions({
  queryKey: ['posts'],
  queryFn: fetchPosts,
})

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => context.queryClient.ensureQueryData(postsQuery),
  component: PostsRoute,
})

function PostsRoute() {
  const { data } = useSuspenseQuery(postsQuery)
  return <PostList posts={data} />
}
```

For SSR Query integration, install `@tanstack/react-router-ssr-query` and set up `setupRouterSsrQueryIntegration` with a fresh `QueryClient` per request:

```tsx
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

export function getRouter() {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient },
    defaultPreload: 'intent',
  })

  setupRouterSsrQueryIntegration({ router, queryClient })

  return router
}
```

Use `useSuspenseQuery` for SSR/streamed data. `useQuery` does not execute on the server and fetches after hydration.

## Preloading

Preloading strategies:

- `intent`: hover/touch intent on links.
- `viewport`: Intersection Observer when links enter the viewport.
- `render`: when links render.

Set default intent preloading:

```tsx
const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})
```

Defaults:

- Intent delay: 50ms.
- Unused preloaded data is removed after 30 seconds by default.
- Preloaded loader data is considered fresh for 30 seconds by default.

Override per link:

```tsx
<Link to="/posts/$postId" params={{ postId }} preload="intent" preloadDelay={100}>
  Post
</Link>
```

Manual preload:

```tsx
await router.preloadRoute({
  to: '/posts/$postId',
  params: { postId: '123' },
})
```

Preload only chunks:

```tsx
await router.loadRouteChunk(router.routesByPath['/posts'])
```

## Pending, Deferred, And Streaming Data

Pending defaults:

- Pending component appears after 1 second by default.
- Once shown, it remains for at least 500ms by default to avoid flash.
- Configure with `pendingMs`, `pendingMinMs`, `defaultPendingMs`, and `defaultPendingMinMs`.

For slow non-critical data, return an unresolved promise and render it with `Await`:

```tsx
import { Await } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async () => {
    const slowData = fetchSlowData()
    const fastData = await fetchFastData()
    return { fastData, slowData }
  },
  component: PostRoute,
})

function PostRoute() {
  const { fastData, slowData } = Route.useLoaderData()
  return (
    <Await promise={slowData} fallback={<div>Loading...</div>}>
      {(data) => <SlowPanel data={data} />}
    </Await>
  )
}
```

With TanStack Query, start slow work in the loader without awaiting it, then read with Query hooks inside Suspense:

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ context }) => {
    context.queryClient.prefetchQuery(slowDataOptions())
    await context.queryClient.ensureQueryData(fastDataOptions())
  },
})
```

React 19 can use `use()` instead of `Await` where the app and docs support that pattern.

## Error Boundaries

Use route `onError` for load errors and logging:

```tsx
export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
  onError: ({ error }) => {
    console.error(error)
  },
})
```

Use `errorComponent` for user-facing errors:

```tsx
export const Route = createFileRoute('/posts')({
  loader: fetchPosts,
  errorComponent: ({ error }) => {
    return <ErrorComponent error={error} />
  },
})
```

For load errors, retry with `router.invalidate()` rather than only boundary `reset()`:

```tsx
function RouteError({ error }: { error: Error }) {
  const router = useRouter()
  return (
    <button onClick={() => router.invalidate()}>
      Retry {error.message}
    </button>
  )
}
```

With TanStack Query suspense, reset the Query error boundary in the route error component and invalidate the router on retry.

## Not Found

`NotFoundRoute` is deprecated. Use `notFound()` and `notFoundComponent`.

Automatic not-found covers non-matching paths and partial matches with extra path segments. Manual not-found covers missing resources:

```tsx
import { notFound } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await getPost(params.postId)
    if (!post) throw notFound()
    return { post }
  },
  notFoundComponent: () => {
    const { postId } = Route.useParams()
    return <p>Post {postId} not found</p>
  },
})
```

Throw not-found from loaders instead of components when possible so loader data types stay precise and the UI avoids flicker.

Router option:

```tsx
const router = createRouter({
  routeTree,
  notFoundMode: 'fuzzy',
  defaultNotFoundComponent: () => <p>Not found</p>,
})
```

`notFoundMode: 'fuzzy'` is the default and uses the nearest suitable route boundary. `notFoundMode: 'root'` sends all not-found errors to the root boundary.

For targeted boundaries:

```tsx
throw notFound({ routeId: '/_authenticated' })
```

Inside `notFoundComponent`, `Route.useLoaderData()` may be undefined depending on where the error occurred. Prefer params, search, context, or `notFound({ data })` for incomplete data.
