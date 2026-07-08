# Setup And Core API

## Installation

React Query v5:

```sh
npm i @tanstack/react-query
```

React Query supports React 18 or newer and modern browsers. The docs recommend installing the ESLint plugin too:

```sh
npm i -D @tanstack/eslint-plugin-query
```

## Provider Setup

Client-only React setup:

```tsx
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
    </QueryClientProvider>
  )
}
```

Use `defaultOptions` to set project-level behavior:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 3,
    },
  },
})
```

For SSR, do not create a server query client at module scope. See [ssr-prefetching.md](ssr-prefetching.md).

## Important Defaults

Default behavior can surprise people:

- Queries are stale by default (`staleTime: 0`).
- Stale queries refetch when a new observer mounts, the window regains focus, or the network reconnects.
- Inactive queries remain cached and are garbage-collected after 5 minutes by default.
- Failed queries retry 3 times with exponential backoff on the client.
- Server-side retries default to 0.
- Results use structural sharing for JSON-compatible data.

Use `staleTime` first when a query refetches too often. Use:

- `staleTime: number` for freshness windows.
- `staleTime: Infinity` for data that should not refetch unless invalidated manually.
- `staleTime: 'static'` for data that should not refetch even when invalidated.
- `gcTime` for how long inactive cache data stays in memory.

## Query Basics

Use object syntax in v5:

```tsx
import { useQuery } from '@tanstack/react-query'

function Todos() {
  const { isPending, isError, data, error, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodoList,
  })

  if (isPending) return <span>Loading...</span>
  if (isError) return <span>Error: {error.message}</span>

  return (
    <>
      <TodoList todos={data} />
      {isFetching ? <span>Refreshing...</span> : null}
    </>
  )
}
```

Query state:

- `status: 'pending' | 'error' | 'success'` describes data availability.
- `fetchStatus: 'fetching' | 'paused' | 'idle'` describes whether the query function is running.
- `isPending` means no successful data yet.
- `isFetching` includes initial fetches and background refetches.
- `isLoading` is `isPending && isFetching`.
- `isInitialLoading` is deprecated.

The `queryFn` must return a promise that resolves data or throws. It must not resolve `undefined`.

## Query Keys

Query keys are arrays at the top level:

```tsx
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
useQuery({ queryKey: ['todo', todoId], queryFn: fetchTodo })
useQuery({ queryKey: ['todos', { status, page }], queryFn: fetchTodos })
```

Rules:

- Keys must uniquely describe the data.
- Keys must be serializable.
- Object key order is hashed deterministically.
- Array item order matters.
- Include every changing variable used by `queryFn`.

Good pattern:

```tsx
function Todo({ todoId }: { todoId: string }) {
  return useQuery({
    queryKey: ['todo', todoId],
    queryFn: () => fetchTodoById(todoId),
  })
}
```

Avoid:

```tsx
useQuery({
  queryKey: ['todo'],
  queryFn: () => fetchTodoById(todoId),
})
```

## Query Options Helpers

Use `queryOptions` for reusable, typed queries:

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query'

function groupOptions(id: number) {
  return queryOptions({
    queryKey: ['groups', id],
    queryFn: () => fetchGroups(id),
    staleTime: 5 * 1000,
  })
}

useQuery(groupOptions(1))
queryClient.prefetchQuery(groupOptions(1))
queryClient.setQueryData(groupOptions(1).queryKey, newGroups)
```

Use `infiniteQueryOptions` for reusable infinite queries.

## TypeScript

Current docs state that TanStack Query follows the DefinitelyTyped support window and supports TypeScript versions released within the last two years. In this snapshot, that means TypeScript 5.4 or newer.

Guidance:

- Let inference work by typing the `queryFn` return value.
- Avoid passing generics to `useQuery` unless necessary; generics can break inference for other fields.
- The default error type is `Error`.
- Narrow custom errors at the call site, for example with `axios.isAxiosError(error)`.
- Use module augmentation of `Register` for global error, meta, query key, and mutation key types.

Example:

```tsx
const fetchGroups = (): Promise<Group[]> =>
  axios.get('/groups').then((response) => response.data)

const { data } = useQuery({
  queryKey: ['groups'],
  queryFn: fetchGroups,
})
```

Register structured keys:

```ts
import '@tanstack/react-query'

type AppQueryKey = ['dashboard' | 'marketing', ...ReadonlyArray<unknown>]

declare module '@tanstack/react-query' {
  interface Register {
    queryKey: AppQueryKey
    mutationKey: AppQueryKey
  }
}
```

## Devtools

Install:

```sh
npm i @tanstack/react-query-devtools
```

Use high in the app tree:

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Routes />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
```

Devtools are included only in development builds by default. Since v5, they can observe mutations as well as queries.
