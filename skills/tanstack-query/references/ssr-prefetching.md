# SSR, Hydration, And Prefetching

## Prefetching APIs

Use prefetching when data will likely be needed soon:

```tsx
await queryClient.prefetchQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
})
```

Facts:

- `prefetchQuery` and `prefetchInfiniteQuery` use the query client's default `staleTime` unless overridden.
- Prefetch functions return `Promise<void>` and do not return data.
- Prefetch functions do not throw errors by default.
- Use `fetchQuery` or `fetchInfiniteQuery` when the caller needs returned data or errors.
- Use `ensureQueryData` when cached data should be returned if available regardless of prefetch `staleTime`.
- Prefetched queries with no observers are garbage collected after `gcTime`.

Prefetch multiple infinite pages:

```tsx
await queryClient.prefetchInfiniteQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  pages: 3,
})
```

## Component And Event Prefetching

Use event handlers for likely navigation or details panels:

```tsx
const prefetch = () => {
  queryClient.prefetchQuery({
    queryKey: ['details', id],
    queryFn: () => getDetails(id),
    staleTime: 60_000,
  })
}

return <button onMouseEnter={prefetch} onFocus={prefetch}>Open</button>
```

To prefetch during component render without subscribing to changes, use a query and ignore the result with `notifyOnChangeProps: []`, or use the dedicated prefetch hooks when Suspense is involved.

Use:

- `usePrefetchQuery`
- `usePrefetchInfiniteQuery`

when prefetching before a Suspense boundary.

## Router Integration

Router loaders, route preloads, and hover/focus navigation callbacks are natural places to prefetch. Keep route prefetching scoped to data that improves navigation and avoids request waterfalls.

Common choices:

- Use route loaders or server functions to prefetch bootstrap data needed before rendering route chrome.
- Use component-local `useQuery` for heavy route body data when it can load independently.
- Use router preload hooks to call `queryClient.prefetchQuery`.
- Use `queryClient.ensureQueryData` when the loader should synchronously return cached-or-fetched data.
- Keep query keys shared between loaders and components through `queryOptions`.

## SSR Hydration Basics

Full hydration flow:

1. Create a request-scoped `QueryClient` in the framework loader or server preloading phase.
2. `await queryClient.prefetchQuery(...)` for critical queries.
3. Return `dehydrate(queryClient)` to the render tree.
4. Wrap the client-rendered tree with `<HydrationBoundary state={dehydratedState}>`.
5. Use the same query keys and query functions in `useQuery`.

Example:

```tsx
import {
  dehydrate,
  HydrationBoundary,
  QueryClient,
  useQuery,
} from '@tanstack/react-query'

export async function loadPostsRoute() {
  const queryClient = new QueryClient()

  await queryClient.prefetchQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return {
    dehydratedState: dehydrate(queryClient),
  }
}

function PostsRoute({ dehydratedState }: { dehydratedState: unknown }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <Posts />
    </HydrationBoundary>
  )
}

function Posts() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: getPosts,
  })

  return <PostList posts={data} />
}
```

For SSR, set a default `staleTime` above zero to avoid immediate client refetch after hydration:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
})
```

## Query Client Scoping

Never do this for SSR:

```tsx
const queryClient = new QueryClient()
```

at a module root that runs on the server. It can share cached data between users and requests.

Preferred patterns:

- In framework loader/preload functions, create a fresh `QueryClient` per request.
- In client providers, create a stable browser `QueryClient` once per app lifecycle.
- In Server Components, either create a new `QueryClient` per prefetching Server Component or use a request-scoped cached factory when duplicated serialization is acceptable.

Next.js app-router style client provider:

```tsx
'use client'

import {
  environmentManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000,
      },
    },
  })
}

let browserQueryClient: QueryClient | undefined

function getQueryClient() {
  if (environmentManager.isServer()) return makeQueryClient()
  if (!browserQueryClient) browserQueryClient = makeQueryClient()
  return browserQueryClient
}

export function Providers({ children }: { children: React.ReactNode }) {
  const queryClient = getQueryClient()
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  )
}
```

Avoid `useState` for client creation if there is no Suspense boundary below the provider and code can suspend during initial render; React can discard the client during initial suspension.

## Initial Data

`initialData` is quick but has tradeoffs:

- It must be passed to every query that needs it.
- It does not preserve actual server fetch time unless `initialDataUpdatedAt` is supplied.
- It does not overwrite fresher cache data.
- It can become brittle when components move.

Prefer full prefetch/dehydrate/hydrate for robust SSR.

## Suspense

Use dedicated suspense hooks:

- `useSuspenseQuery`
- `useSuspenseInfiniteQuery`
- `useSuspenseQueries`

With Suspense:

- `data` is defined at type level.
- Loading UI belongs in `<Suspense fallback>`.
- Errors belong in error boundaries.
- `enabled` is not available for `useSuspenseQuery`.
- `placeholderData` is not available for suspense hooks.
- Use `startTransition` when query-key changes should not replace current UI with fallback.

Error boundaries should reset query errors with `QueryErrorResetBoundary` or `useQueryErrorResetBoundary`.

## Server Components And Streaming

For Server Components, treat Server Components as another loader/preloading phase. Prefetch data server-side, dehydrate, then hydrate in a Client Component boundary.

Important caveats:

- Server Components can nest, so multiple `HydrationBoundary` components are valid.
- Awaiting one Server Component prefetch before rendering another can create server waterfalls.
- Framework parallel routes or loaders can flatten those waterfalls.
- The docs warn against using Next.js Server Actions to fetch data in a client `queryFn`; use API routes or an RPC layer for client-side query fetching. Server Actions remain appropriate for mutations.
- The experimental package `@tanstack/react-query-next-experimental` supports streamed hydration for Suspense on the server. Treat it as experimental and verify current docs before adopting.

## Hydration Migration Notes

v5 uses:

```tsx
import { HydrationBoundary } from '@tanstack/react-query'
```

not the old `Hydrate` component. `HydrationBoundary` hydrates queries. To hydrate mutations, use the low-level `hydrate` API or persistence plugin.
