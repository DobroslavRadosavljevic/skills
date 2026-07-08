# Mutations And Cache Updates

## Mutation Basics

Use mutations for create, update, delete, and server side effects:

```tsx
import { useMutation } from '@tanstack/react-query'

const mutation = useMutation({
  mutationFn: (newTodo: NewTodo) => postTodo(newTodo),
})

mutation.mutate({ title: 'Do Laundry' })
```

Mutation state:

- `status: 'idle' | 'pending' | 'error' | 'success'`
- `isIdle`
- `isPending`
- `isError`
- `isSuccess`
- `isPaused`
- `variables`
- `submittedAt`
- `mutate`
- `mutateAsync`
- `reset`

Use `mutateAsync` when composing async control flow:

```tsx
try {
  const todo = await mutation.mutateAsync(input)
  toast.success(todo.title)
} catch (error) {
  reportError(error)
}
```

## Callback Order

`useMutation` supports:

- `onMutate`
- `onSuccess`
- `onError`
- `onSettled`

If a callback returns a promise, it is awaited before the next callback runs.

Per-call callbacks passed to `mutate(variables, callbacks)` run after the callbacks declared in `useMutation`, but they only fire if the component is still mounted. With consecutive mutations, per-call callbacks fire only for the latest call. Hook-level callbacks run for each mutation.

## Invalidation After Mutations

Use targeted invalidation after successful writes:

```tsx
const queryClient = useQueryClient()

const mutation = useMutation({
  mutationFn: addTodo,
  onSuccess: async () => {
    await queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

For multiple invalidations, return/await all promises so `isPending` remains true until cache work completes:

```tsx
onSuccess: async () => {
  await Promise.all([
    queryClient.invalidateQueries({ queryKey: ['todos'] }),
    queryClient.invalidateQueries({ queryKey: ['reminders'] }),
  ])
}
```

Invalidation:

- Marks matching queries stale, overriding `staleTime`.
- Refetches active matching queries in the background.
- Supports prefix matching by default.
- Supports `exact: true` and `predicate` filters.

## Direct Cache Updates

Use `setQueryData` when the mutation response contains the exact data needed for a cached query:

```tsx
const mutation = useMutation({
  mutationFn: editTodo,
  onSuccess: (data, variables) => {
    queryClient.setQueryData(['todo', { id: variables.id }], data)
  },
})
```

Always update cache immutably:

```tsx
queryClient.setQueryData(['posts', { id }], (oldData) =>
  oldData
    ? {
        ...oldData,
        title: 'my new post title',
      }
    : oldData,
)
```

Do not mutate `oldData` in place.

Use `setQueriesData` only when intentionally updating multiple matching cache entries.

## Optimistic Updates

TanStack Query supports two optimistic-update styles.

UI-level optimistic updates are simpler when only one surface needs the pending state:

```tsx
const addTodoMutation = useMutation({
  mutationFn: addTodo,
  onSettled: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
})

const { isPending, variables, isError, mutate } = addTodoMutation
```

Render `variables` while pending and optionally keep it visible with retry UI on error.

Cache-level optimistic updates are better when multiple surfaces need the optimistic data:

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo, context) => {
    await context.client.cancelQueries({ queryKey: ['todos'] })
    const previousTodos = context.client.getQueryData(['todos'])

    context.client.setQueryData(['todos'], (old) => [
      ...(old ?? []),
      newTodo,
    ])

    return { previousTodos }
  },
  onError: (_error, _variables, onMutateResult, context) => {
    context.client.setQueryData(['todos'], onMutateResult?.previousTodos)
  },
  onSettled: (_data, _error, _variables, _onMutateResult, context) => {
    context.client.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

Pattern:

1. Cancel matching outgoing queries so refetches do not overwrite the optimistic value.
2. Snapshot previous cache data.
3. Write optimistic cache data immutably.
4. Return rollback context.
5. Roll back on error.
6. Invalidate or reconcile on settled.

## Mutation Defaults And Offline Mutations

Use `mutationKey` and `queryClient.setMutationDefaults` for shared mutation behavior:

```tsx
queryClient.setMutationDefaults(['todos'], {
  mutationFn: ({ id, data }) => api.updateTodo(id, data),
})
```

This is required for persisted offline mutations to resume after reload because functions cannot be serialized. After hydration, call:

```tsx
queryClient.resumePausedMutations()
```

When using `PersistQueryClientProvider`, call it in `onSuccess` after restore.

## Mutation Scopes

Mutations run in parallel by default. Use a shared `scope.id` to serialize related mutations:

```tsx
const mutation = useMutation({
  mutationFn: addTodo,
  scope: {
    id: 'todo',
  },
})
```

Mutations with the same scope start paused when another mutation in that scope is in progress, then resume in order.

## Error Boundaries

Use `throwOnError` for mutation errors that should propagate to an error boundary:

```tsx
useMutation({
  mutationFn: saveTodo,
  throwOnError: true,
})
```

Keep recoverable form errors in mutation state; reserve thrown mutation errors for failure modes the surrounding boundary owns.
