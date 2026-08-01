# Ownership

For each piece of state and each server interaction, pick **one owner**: the lowest component or route boundary that still meets loading, gating, and coordination needs.

## State

| Kind | Default owner | Lift when |
| --- | --- | --- |
| Ephemeral UI (open, hover, draft text used only locally) | The leaf that renders the control | Parent layout must change from it |
| Form field values | Form subtree | Parent must submit or gate on validity *and* cannot use form APIs/slots |
| Selection shared by siblings (e.g. list + detail chrome) | Nearest common parent or narrow store | — |
| Server entity data | Leaf `useQuery` (or equivalent) keyed by id | Exception list in `SKILL.md` |

Prefer **pushing state down** when only one subtree cares. Prefer **lifting** only when two consumers must stay in sync from one source of truth.

Derived values: compute during render from props/state. Do not mirror props into state + Effect.

## Data fetching

**Default:** the component that displays or mutates the data owns the subscription (`useQuery` / `useMutation` / framework equivalent).

**Prefetch ≠ ownership.** A route loader or parent may `prefetchQuery` / `ensureQueryData` to warm the cache. The leaf still calls `useQuery` with the same key and owns loading/error UI for its subtree.

**Pass ids down:**

```tsx
// Parent owns layout + identity only
function OrderPage({ orderId }: { orderId: string }) {
  return (
    <PageShell>
      <OrderHeader orderId={orderId} />
      <OrderLines orderId={orderId} />
      <OrderActions orderId={orderId} />
    </PageShell>
  )
}

function OrderLines({ orderId }: { orderId: string }) {
  const { data, isPending } = useQuery(orderLinesOptions(orderId))
  // ...
}
```

Do **not** fetch in `OrderPage` and drill `lines`, `isLoading`, and `refetch` through shells.

## Mutations

- Own the mutation next to the control that triggers it (button, form, row action).
- Invalidate or update shared query keys; do not lift mutation results into page state to “distribute” them.
- Route-level mutation ownership is fine when navigation, auth refresh, or loader guarantees depend on it—justify it.

## Effects

- Effects synchronize with external systems; they are not a data-bus between parent and child.
- Do not fetch in a parent Effect solely to pass results as props when a leaf query would isolate updates.
- User-caused work belongs in event handlers, Actions, or mutations—not in Effects that re-run on render churn.

## Context

Use Context for:

- Stable dependency injection (clients, theme tokens, i18n).
- True cross-tree coordination where prop threading would be worse **and** value churn is acceptable or split (e.g. state context vs dispatch context).

Avoid Context for high-frequency values consumed by large subtrees. Prefer local state, leaf queries, or a store with narrow selectors.

## Server Components / server functions

Valid ownership sites when the framework owns SSR:

- **RSC / server function:** own data that should never hit the client, or route-critical HTML.
- **Client leaf:** own interactive refetch, mutations, and client-only UI state.
- Do not prefetch on the server, render that result in a Server Component, *and* expect a client cache to keep the same node in sync—prefetch for hydration; subscribe on the client for anything that revalidates.

Pick the lowest boundary that matches the interactivity and caching model—not “always client” and not “always server.”

## Ownership questions

1. If this updates, which subtrees must re-render?
2. Is any intermediate component only forwarding props it does not use?
3. Would a shared cache key + leaf subscription remove the parent fetch?
4. Is this lift for coordination/gating/SEO, or for habit?
