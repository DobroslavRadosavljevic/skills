# TanStack Patterns

Stack assumption: TanStack Query + Router (and often Start), Form, and optionally Store. Apply React ownership defaults on top of these APIs.

## Query

**Leaf owns the subscription.** Parents may prefetch; they should not become the sole reader that then props-drills results.

```tsx
// Route / loader: warm cache only
loader: async ({ context: { queryClient }, params }) => {
  await queryClient.ensureQueryData(orderOptions(params.orderId))
}

// Leaf: owns observe + UI states
function OrderStatus({ orderId }: { orderId: string }) {
  const { data, isPending, isError } = useQuery(orderOptions(orderId))
  // ...
}
```

Rules:

- Share **`queryOptions` / query keys** between loaders and components—never fork keys.
- Pass **`id` / params** into leaves; do not lift `data` into React state “to pass down.”
- Colocate `useMutation` with the control; on success `invalidateQueries` (or set query data) for the keys leaves already observe.
- Mix critical `await prefetchQuery` (block route) with non-blocking `prefetchQuery` for below-the-fold leaves.
- To prefetch from a parent without subscribing to updates, use prefetch helpers or `notifyOnChangeProps: []`—still let the child `useQuery`.

Anti-pattern: page `useQuery` → pass `data` through five layout components → leaf renders. Prefer page passes `id`; each leaf queries (cache dedupes).

## Router / Start

- **Path and search params** are shared identity. Components that need them read params where used (or take `id` as a prop from the route component)—do not copy params into ambient React state.
- **Loaders / server functions:** route-critical, SEO, parallel bootstrap, and gates. Justify each awaited fetch.
- **`beforeLoad`:** auth and context setup, not a dumping ground for every entity the page might show.
- After navigation, leaves own interactive refetch; do not mirror loader data into a giant page `useState`.

```tsx
// Route component: compose + pass identity
function OrderRoute() {
  const { orderId } = useParams({ from: '/orders/$orderId' })
  return (
    <>
      <OrderHeader orderId={orderId} />
      <OrderLines orderId={orderId} />
    </>
  )
}
```

## Form

- Put `useForm` (or form API) in the **form subtree**, not the page shell.
- Page/route gets outcomes via composition: `onSuccess` callback, navigate, or query invalidation—not every field as props.
- Field components bind via form APIs / contexts designed for fields; do not drill `value` + `onChange` through unrelated layout.

```tsx
function CreateOrderPage() {
  return (
    <PageShell title="New order">
      <CreateOrderForm
        onSuccess={(orderId) => {
          void navigate({ to: '/orders/$orderId', params: { orderId } })
        }}
      />
    </PageShell>
  )
}

function CreateOrderForm({ onSuccess }: { onSuccess: (id: string) => void }) {
  const form = useForm(/* ... */)
  // fields + submit live here
}
```

## Store

Use TanStack Store (or similar) for **client** cross-tree state that is not server state.

- Prefer **narrow selectors** so subscribers re-render only on the slice they need.
- Do not put server entities in a store when Query already owns them.
- Do not invent a global store to avoid passing a single `id` prop.

```tsx
// Good: leaf selects a boolean/flag
const isPanelOpen = useStore(uiStore, (s) => s.orderPanelOpen)

// Bad: store holds full order DTO duplicated from Query
```

## Choosing the tool

| Need | Prefer |
| --- | --- |
| Server/async data, cache, refetch | Query in the leaf (+ loader prefetch) |
| URL identity, gates, SSR bootstrap | Router / Start loader or server function |
| Interactive field state, validation | Form in the form subtree |
| Cross-route ephemeral client UI state | Store with narrow selectors |
| Local widget state | `useState` / `useReducer` in the leaf |

When unsure: **Query for server truth, Form for fields, local state for widgets, Store only for shared client UI—and always the lowest subscriber.**
