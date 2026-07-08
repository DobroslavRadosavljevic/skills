# Query Patterns

## Dependent Queries

Use `enabled` when one query needs data from another:

```tsx
const { data: user } = useQuery({
  queryKey: ['user', email],
  queryFn: getUserByEmail,
})

const userId = user?.id

const projectsQuery = useQuery({
  queryKey: ['projects', userId],
  queryFn: getProjectsByUser,
  enabled: !!userId,
})
```

Before `enabled` becomes true, a query without cached data starts with:

```txt
status: 'pending'
fetchStatus: 'idle'
```

Dependent queries are request waterfalls. If possible, flatten backend APIs so data can load in parallel.

## Parallel Queries

Static parallel queries need no special API:

```tsx
const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
const teamsQuery = useQuery({ queryKey: ['teams'], queryFn: fetchTeams })
const projectsQuery = useQuery({
  queryKey: ['projects'],
  queryFn: fetchProjects,
})
```

For dynamic query counts, use `useQueries`:

```tsx
const userQueries = useQueries({
  queries: users.map((user) => ({
    queryKey: ['user', user.id],
    queryFn: () => fetchUserById(user.id),
  })),
})
```

`useQueries` returns an array. With TypeScript, inline `select` inside `useQueries` can lose inference; annotate the `select` parameter or use `queryOptions`.

With Suspense, colocated `useSuspenseQuery` calls in one component fetch serially. Use `useSuspenseQueries` or separate boundaries to preserve parallelism.

## Disabled And Lazy Queries

Use `enabled` for declarative lazy queries:

```tsx
const { data, isLoading } = useQuery({
  queryKey: ['todos', filter],
  queryFn: () => fetchTodos(filter),
  enabled: !!filter,
})
```

When `enabled: false`:

- Cached data initializes as success.
- No cached data initializes as `pending` with `fetchStatus: 'idle'`.
- The query does not fetch on mount.
- It does not background refetch.
- It ignores invalidation/refetch requests that would normally refetch it.
- Returned `refetch` can manually trigger it.

For TypeScript, `skipToken` is a type-safe alternative:

```tsx
import { skipToken, useQuery } from '@tanstack/react-query'

const { data } = useQuery({
  queryKey: ['todos', filter],
  queryFn: filter ? () => fetchTodos(filter) : skipToken,
})
```

`refetch` does not work with `skipToken`; use `enabled: false` if manual `refetch()` is required.

## Pagination

Include page or cursor state in the query key:

```tsx
const result = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page),
})
```

Use `placeholderData: keepPreviousData` to avoid success/pending UI jumps between pages:

```tsx
import { keepPreviousData, useQuery } from '@tanstack/react-query'

const query = useQuery({
  queryKey: ['projects', page],
  queryFn: () => fetchProjects(page),
  placeholderData: keepPreviousData,
})
```

Use `isPlaceholderData` to disable next-page navigation until the new page is known.

## Infinite Queries

Use `useInfiniteQuery` for load-more and infinite-scroll data:

```tsx
const projectsQuery = useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
})
```

Key facts:

- `initialPageParam` is required in v5.
- `data.pages` holds fetched page data.
- `data.pageParams` holds page params.
- `fetchNextPage` loads more pages.
- `hasNextPage` is true when `getNextPageParam` returns a non-null, non-undefined value.
- `isFetchingNextPage` distinguishes load-more fetches from background refreshes.
- Infinite query refetches run sequentially from the first page to avoid stale cursor problems.
- Use `maxPages` to limit memory usage and refetch cost.

Avoid triggering `fetchNextPage` while `isFetching` unless concurrent fetching is intentional. `fetchNextPage({ cancelRefetch: false })` allows simultaneous fetches, but the default avoids overwrites.

Keep manual cache edits in the infinite query shape:

```tsx
queryClient.setQueryData(['projects'], (data) => ({
  pages: data.pages.slice(0, 1),
  pageParams: data.pageParams.slice(0, 1),
}))
```

## Query Cancellation

Each query function receives an `AbortSignal`:

```tsx
const query = useQuery({
  queryKey: ['todos'],
  queryFn: async ({ signal }) => {
    const response = await fetch('/todos', { signal })
    return response.json()
  },
})
```

Default behavior:

- Unmounted or unused queries are not cancelled by default.
- If the query function consumes the signal and aborts, query state reverts to the previous state.
- Use `queryClient.cancelQueries({ queryKey })` for manual cancellation.

Cancellation does not work with Suspense hooks: `useSuspenseQuery`, `useSuspenseQueries`, and `useSuspenseInfiniteQuery`.

## Network Modes

`networkMode` can be set per query/mutation or in defaults:

- `'online'`: default. Queries and mutations pause when offline.
- `'always'`: ignore online/offline status. Useful for local async sources.
- `'offlineFirst'`: run once, then pause retries. Useful for service worker or HTTP-cache-first behavior.

Remember that a query can be `status: 'pending'` and `fetchStatus: 'paused'`. Do not use pending alone for offline loading UI.

## Render Optimizations

TanStack Query optimizes renders through:

- Structural sharing for JSON-compatible data.
- Tracked properties through a Proxy.
- `select` for component-specific subscriptions.

Avoid object rest destructuring from query results because it disables tracked-property optimization. Prefer named destructuring:

```tsx
const { data, isFetching } = useQuery(options)
```

Use `select` for narrow derived data:

```tsx
const todoCountQuery = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.length,
})
```

Memoize or extract expensive `select` functions. `select` runs when data changes or when the `select` function reference changes. Do not throw errors from `select`; throw from the query function or validate outside the query.

## Background Indicators

Use `isPending` for no-data-yet loading UI. Use `isFetching` or `useIsFetching` for background refresh indicators.

Use `useIsMutating` or `useMutationState` for global mutation indicators or pending optimistic UI outside the mutating component.
