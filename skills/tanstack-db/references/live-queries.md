# Live Queries

## Performance Model

Live queries compile to an incremental dataflow pipeline (differential dataflow, `@tanstack/db-ivm`). A change to one row updates only the affected output rows, so updates stay around sub-millisecond even on large sorted sets (docs cite about 0.7 ms for one row in a sorted 100,000-row collection). Consequences:

- Queries run over rows already in memory. Eager collections hold everything; on-demand collections hold what queries requested.
- Describe the query with builder expressions so DB can optimize, index, and push predicates down. JS `.filter()` on results or `.fn.*` callbacks re-run opaque code and skip optimization.
- Builder methods describe a pipeline, not call-order steps. Exception: repeated `orderBy` calls add tie-breakers in call order.
- A live query result is itself a collection (`toArray`, `get(key)`, `has`, `subscribeChanges`) and can be a source for another query.
- Many small queries filtered by `eq(field, literal)` on one eager source share an equality partition, so per-row list items can each own a cheap query.
- Until a live query has a subscriber or preload, it reads only rows its sources already hold and starts no network work.

## Query Builder

```ts
import { and, eq, gt, like, count, sum, createLiveQueryCollection, queryOnce } from '@tanstack/db'

const q1 = createLiveQueryCollection((q) =>
  q.from({ todo: todoCollection })
    .where(({ todo }) => and(eq(todo.completed, false), gt(todo.priority, 2)))
    .orderBy(({ todo }) => todo.createdAt, 'desc')
    .limit(20)
    .select(({ todo }) => ({ id: todo.id, text: todo.text })),
)
```

- `from({ alias: collectionOrSubquery })`: single source, object syntax. `unionAll({ a, b })` or `unionAll(queryA, queryB)` combines independent sources; order with `coalesce()` for the object form.
- `where(cb)`: repeated calls AND together. Callback returns an expression, never a JS boolean.
- `select(cb)`: projection, renaming, computed fields, spreads (`...todo`). Without `select`, rows keep their full shape (joins are namespaced by alias).
- `orderBy(cb, 'asc' | 'desc' | options)`; `limit(n)`; `offset(n)`. `limit`/`offset` require `orderBy`. Order by select output with `$selected.field`. Without `orderBy` the iteration order is unspecified, and ordering does not propagate from a source through a derived query.
- `distinct()` requires `select`. `findOne()` returns `T | undefined`. `having()` requires `groupBy`.
- Null handling follows SQL three-valued logic: `eq(x, null)` matches nothing; use `isNull`/`isUndefined`. `NaN` follows PostgreSQL ordering.

Operators and functions (all from `@tanstack/db` or the framework package):

- Compare: `eq`, `gt`, `gte`, `lt`, `lte`, `inArray`, `like`, `ilike`, `isNull`, `isUndefined`
- Logic: `and`, `or`, `not`
- String: `upper`, `lower`, `length`, `concat`
- Math: `add`, `subtract`, `multiply`, `divide`
- Utility: `coalesce`, `caseWhen`
- Aggregates: `count`, `sum`, `avg`, `min`, `max`
- Includes: `toArray`, `materialize`

Use `coalesce(a, b)` instead of `a || b`, and `caseWhen(cond, a, b)` instead of ternaries inside standard `select`. Literals like `Date.now()` are captured when the query is built.

## Joins

```ts
q.from({ todo: todoCollection })
  .innerJoin({ list: listCollection }, ({ todo, list }) => eq(list.id, todo.listId))
  .where(({ list }) => eq(list.active, true))
```

- Types: `left` (default), `right`, `inner`, `full`; also `leftJoin`, `rightJoin`, `innerJoin`, `fullJoin`. Result optionality follows the join type.
- Conditions must be `eq(...)` or `and(eq(...), ...)` (compound joins). `or`, `gt`, `like` throw `JoinConditionMustBeEqualityError`. Field-to-literal filters belong in `.where()`.
- Null on either side never matches.
- For on-demand sources, the first equality drives candidate loading; put the most selective plain-field equality first and avoid computed joined-side operands.
- Anti-join pattern: `leftJoin` then `where(isUndefined(joined))`.

## Subqueries And Includes

```ts
q.from({ p: projectCollection }).select(({ p }) => ({
  id: p.id,
  name: p.name,
  issues: q.from({ i: issueCollection })
    .where(({ i }) => eq(i.projectId, p.id))      // correlation condition (required eq)
    .orderBy(({ i }) => i.createdAt, 'desc').limit(5) // per parent
    .select(({ i }) => ({ id: i.id, title: i.title })),
}))
```

- A subquery built from `q` can feed `from` or `join`; identical subqueries dedupe into one pipeline.
- Includes nest a child query in `select`. Child results are live child collections by default; wrap with `toArray(...)` for plain arrays (parent re-emits on child change) or `materialize(...)` (array, or single object/`undefined` when the child ends in `.findOne()`). Both are valid only as top-level `select` values. Includes nest arbitrarily and support per-parent aggregates.
- In React, pass a child collection to a subcomponent and call `useLiveQuery(child)` there; reading `project.issues` without subscribing will not re-render.
- Do not return includes or expression helpers from `.fn.select()`.

## Grouping

```ts
q.from({ order: orderCollection })
  .groupBy(({ order }) => order.customerId)        // or [a, b] for multi-column
  .select(({ order }) => ({ customerId: order.customerId, total: sum(order.amount), n: count(order.id) }))
  .having(({ $selected }) => gt($selected.total, 1000))
```

Selected fields must be aggregates or grouped columns. `fn.select()` cannot combine with `groupBy`. Aggregates without `groupBy` form one implicit group. Single-column groups are keyed by the value; multi-column by a JSON string.

## One-Shot, Effects, Virtual Props

- `queryOnce(q => ...)`: create, preload, read, clean up. Use for scripts, exports, tests, and building AI context. `findOne()` resolves `undefined` when empty.
- `createEffect({ query, onEnter, onUpdate, onExit, onBatch, onError, onSourceError, skipInitial })` reacts to result-set deltas without materializing rows; call `await effect.dispose()`. React: `useLiveQueryEffect(config, deps?)`. A source error disposes the effect.
- Every result row carries read-only virtual props: `$hasPendingWrites` (local optimistic write pending; not server acknowledgement), `$origin` (`local` or `remote` attribution), `$key`, `$collectionId`. Use them in `where`/`select`/`orderBy`. Do not persist them. `$synced` is deprecated; use `!row.$hasPendingWrites`.

## React Hooks

```tsx
const { data, status, isLoading, isReady, isError, isEnabled, collection } = useLiveQuery({
  query: (q) => q.from({ todo: todoCollection }).where(({ todo }) => eq(todo.userId, userId)),
})
```

- Identity is derived from the structured query IR, so captured values like `userId` are reactive without a dependency array.
- Add `queryKey` for opaque logic: `.fn.where/select/having`, captured functions, class instances, or a very hot render path. Use primitive tokens in the key, for example `[todoCollection.id, 'search', search]`. Before 1.0 an unhashable query warns and keeps mount-stable identity; in 1.0 it throws.
- Dependency arrays (`useLiveQuery(fn, [deps])`) still work but warn and are removed in 1.0. Migrate to `{ query }`.
- If the same collection `id` is reused with a different source object while the hook is mounted, DB throws. Give replacements distinct ids.
- Disable a query by returning `undefined`/`null` from `query`: `status` is `'disabled'`, `isEnabled` false, `data` undefined. Prefer rendering a child component only when inputs exist.
- `useLiveSuspenseQuery`: suspends on first load, `data` is always defined, never re-suspends for live updates, re-suspends when identity changes. Pair with an Error Boundary. With a router loader that preloads, plain `useLiveQuery` is usually simpler.
- `useLiveInfiniteQuery(q => ..., { pageSize })` widens an ordered live query (`data`, `pages`, `fetchNextPage`, `hasNextPage`). It is not Query's `useInfiniteQuery`; `getNextPageParam` is rejected. For server paging use an on-demand Query Collection.
- `useLiveQuery(existingLiveQueryCollection)` subscribes to a pre-built collection. `isPersistedReady`/`persistedStatus` report SQLite restore state.
- Do not filter `data` in render when a `where` can express it.

Other frameworks: `useLiveQuery` in Vue/Solid/Svelte, `injectLiveQuery` in Angular. Vue, Solid, and Angular keep the older dependency/reactivity model; client-provider SSR is covered for React and Svelte.

## Ordered Windows And Errors

- Ordered limited queries expose `utils.setWindow({ offset, limit })`, which rejects with the subset error when an on-demand page fails. `utils.lastSubsetError` keeps the last failure while the previous snapshot stays readable.
- Per-subscription failures arrive via `subscription.on('loadSubset:error', ...)`.
- Cleaning up a source while a live query depends on it leaves the live query in a terminal error; clean up the live query first, then the source, then `await liveQuery.preload()`.
- Common builder errors: `InvalidWhereExpressionError` (used `===`), `LimitOffsetRequireOrderByError`, `DistinctRequiresSelectError`, `HavingRequiresGroupByError`, `JoinConditionMustBeEqualityError`. Full list in the docs `errors.md`.
