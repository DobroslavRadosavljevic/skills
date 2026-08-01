# Anti-Patterns

## 1. Page data hub

**Smell:** Route/page fetches everything, holds it in state or one big `useQuery`, drills props, any refetch re-renders the full tree.

**Fix:** Page passes ids and composes leaves. Each leaf `useQuery`s what it shows. Loader may prefetch the same keys.

```tsx
// Before
function OrderPage({ orderId }) {
  const { data } = useQuery(orderEverythingOptions(orderId))
  return (
    <Layout
      header={<Header order={data.order} />}
      lines={<Lines lines={data.lines} />}
      activity={<Activity items={data.activity} />}
    />
  )
}

// After
function OrderPage({ orderId }) {
  return (
    <Layout>
      <Header orderId={orderId} />
      <Lines orderId={orderId} />
      <Activity orderId={orderId} />
    </Layout>
  )
}
```

## 2. Prop drilling through mute intermediates

**Smell:** `UserAvatar` needs `user`, so `App → Shell → Main → Sidebar → Header → Avatar` all take `user`.

**Fix:** Avatar takes `userId` and queries (or reads a cached selector). Or render Avatar where the id is known via composition/`children` instead of through the chain.

## 3. Smart container / dumb leaf by dogma

**Smell:** Policy that leaves may only receive props and never fetch, forcing all IO upward.

**Fix:** Leaves may own hooks. “Presentational” is for design-system primitives, not feature leaves that display server data.

## 4. Broad high-churn Context

**Smell:** One `AppStateContext` with frequently changing fields; whole app re-renders.

**Fix:** Local state, leaf queries, or narrow store selectors. Split context by update rate (state vs dispatch) when Context is still right.

## 5. Mirror Query into React state

**Smell:** `const [order, setOrder] = useState(); useEffect(() => { setOrder(data) }, [data])` then pass `order` down.

**Fix:** Use `data` from `useQuery` directly in the owner. Do not duplicate cache into state.

## 6. Parent owns form state for deep forms

**Smell:** Page holds every field so it can “submit later,” while only the form cares.

**Fix:** Form subtree owns `useForm`. Page receives success via callback or navigation.

## 7. Memo spray instead of ownership fix

**Smell:** Wrap every child in `memo`, stabilize every callback, still drill changing object props from a busy parent.

**Fix:** Move state/query down so the parent does not churn. Then memoize only measured hotspots (or rely on React Compiler).

## 8. Store as fake server cache

**Smell:** Global store filled from ad-hoc fetches; components select full DTOs; manual sync bugs.

**Fix:** TanStack Query for server state. Store only for client UI concerns.

## 9. Loader returns props-shaped bags for the whole page

**Smell:** Loader fetches five entities, route component spreads them as props through the tree.

**Fix:** Loader `ensureQueryData` for critical keys; route passes params; leaves subscribe. Await only what must block paint or gate the route.

## 10. Callback and flag forests

**Smell:** `isSubmitting`, `isDirty`, `onChangeField`, `onCancel`, `onRetry` threaded through layout for a leaf that could own them.

**Fix:** Own flags next to the mutation/form. Expose a slot or a single outcome callback to the parent when the parent must navigate or close a shell.
