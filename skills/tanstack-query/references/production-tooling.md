# Production Tooling

## Persistence

Use persistence when cache state should survive reloads or app restarts.

Packages:

```sh
bun add @tanstack/react-query-persist-client @tanstack/query-async-storage-persister
```

The older `@tanstack/query-sync-storage-persister` docs mark the sync persister as deprecated and recommend the async storage persister instead.

Use `PersistQueryClientProvider` instead of calling `persistQueryClient` outside React lifecycle:

```tsx
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24,
    },
  },
})

const persister = createAsyncStoragePersister({
  storage: window.localStorage,
})

function App() {
  return (
    <PersistQueryClientProvider
      client={queryClient}
      persistOptions={{ persister }}
      onSuccess={() => queryClient.resumePausedMutations()}
    >
      <Routes />
    </PersistQueryClientProvider>
  )
}
```

Persistence details:

- Default persisted cache `maxAge` is 24 hours.
- Set query `gcTime` to the same value or higher than persistence `maxAge`, or persisted data can be garbage-collected earlier than expected.
- Use `buster` to invalidate old persisted cache after app/data changes.
- Persistence stores dehydrated state, not functions.
- Persisted offline mutations need default mutation functions registered with `queryClient.setMutationDefaults`.

## Broadcast Sync

`broadcastQueryClient` syncs query client state across same-origin tabs/windows:

```tsx
import { broadcastQueryClient } from '@tanstack/query-broadcast-client-experimental'

broadcastQueryClient({
  queryClient,
  broadcastChannel: 'my-app',
})
```

Package:

```sh
bun add @tanstack/query-broadcast-client-experimental
```

It is experimental. Lock to a patch version before relying on it in production.

## Devtools

Package:

```sh
bun add @tanstack/react-query-devtools
```

Floating mode:

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

Devtools are excluded from production bundles by default. For gated production debugging, lazy-load the production entry:

```tsx
const ReactQueryDevtoolsProduction = React.lazy(() =>
  import('@tanstack/react-query-devtools/production').then((module) => ({
    default: module.ReactQueryDevtools,
  })),
)
```

Use the `styleNonce` option when Content Security Policy requires a nonce for injected styles.

## ESLint Plugin

Package:

```sh
bun add -d @tanstack/eslint-plugin-query
```

Flat config:

```js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  ...pluginQuery.configs['flat/recommended'],
]
```

Stricter flat config:

```js
export default [
  ...pluginQuery.configs['flat/recommended-strict'],
]
```

Rules:

- `@tanstack/query/exhaustive-deps`
- `@tanstack/query/no-rest-destructuring`
- `@tanstack/query/stable-query-client`
- `@tanstack/query/no-unstable-deps`
- `@tanstack/query/infinite-query-property-order`
- `@tanstack/query/no-void-query-fn`
- `@tanstack/query/mutation-property-order`
- `@tanstack/query/prefer-query-options`

These rules catch common correctness bugs: missing key dependencies, unstable clients, rest destructuring that disables tracked-property optimization, and void-returning query functions.

## Testing

Create a fresh provider wrapper per test or clear the client before each test:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    )
  }
}

const { result } = renderHook(() => useCustomHook(), {
  wrapper: createWrapper(),
})

await waitFor(() => expect(result.current.isSuccess).toBe(true))
```

Testing guidance:

- React 18 and newer expose `renderHook` from `@testing-library/react`.
- Turn retries off for error tests to avoid timeouts.
- Use a fresh `QueryClient` per test when tests run in parallel.
- If using Jest with custom `gcTime`, set `gcTime: Infinity` to avoid lingering timers.
- For network behavior, use the repo's existing mock layer such as MSW, nock, fetch mocks, or test server.
- For infinite queries, assert `data.pages` and trigger `fetchNextPage()`.

## v5 Migration Checklist

Watch for these v4-to-v5 changes:

- Hooks and client methods use a single object signature.
- Query callbacks `onSuccess`, `onError`, and `onSettled` were removed from queries. Mutation callbacks remain.
- `query.remove()` was removed; use `queryClient.removeQueries({ queryKey })`.
- `cacheTime` was renamed to `gcTime`.
- `useErrorBoundary` was renamed to `throwOnError`.
- `status: 'loading'` became `status: 'pending'`.
- `isLoading` became `isPending`; new query `isLoading` is `isPending && isFetching`.
- `isInitialLoading` is deprecated.
- `keepPreviousData` option and `isPreviousData` flag were replaced by `placeholderData` and `isPlaceholderData`; use exported `keepPreviousData` as an identity helper.
- `Hydrate` was renamed to `HydrationBoundary`.
- `useHydrate` was removed.
- Infinite queries require `initialPageParam`.
- Infinite query manual mode was removed.
- `getNextPageParam` and `getPreviousPageParam` can return `null` or `undefined` to indicate no page.
- Query defaults now merge all matching registrations; register defaults from most generic to least generic.
- React 18 or newer is required.
- Private class fields are truly private at runtime.

The official codemod can help with object syntax, but it is best effort. Review output carefully and run formatting/linting afterward.

## Review Checklist

When reviewing TanStack Query code, check:

- One stable `QueryClient` per browser app lifecycle and request-scoped clients on the server.
- Query keys include every variable used by `queryFn`.
- Query functions return typed data and never `undefined`.
- `staleTime` and `gcTime` match product freshness and memory expectations.
- Disabled queries are intentional and not replacing declarative dependencies.
- Mutations invalidate or update every affected cache surface.
- `setQueryData` updates are immutable.
- Optimistic updates have rollback or UI retry behavior.
- Infinite query data keeps `pages` and `pageParams` shapes intact.
- SSR hydration uses matching keys and avoids cross-request leakage.
- Tests isolate cache state and disable retries where appropriate.
