# Chat, Reverse Lists, Infinite Loading, Restoration

## Contents

- Chat and log lists (end anchoring)
- Loading older history
- Jump to latest
- Streaming output
- Infinite scroll with useInfiniteQuery
- Resetting on query changes
- Older-version fallback

## Chat And Log Lists

Requires `@tanstack/virtual-core` 3.16.0 or newer. Use a normal scroller and normal item order. Do not use `flex-direction: column-reverse`, inverted transforms, or manual `scrollTop += delta`.

```tsx
const virtualizer = useVirtualizer({
  count: messages.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72,
  getItemKey: React.useCallback((index: number) => messages[index]!.id, [messages]),
  anchorTo: 'end',
  followOnAppend: true,
  scrollEndThreshold: 80,
  overscan: 6,
})

React.useLayoutEffect(() => {
  virtualizer.scrollToEnd()
}, [virtualizer])

<div ref={parentRef} style={{ height: 600, overflow: 'auto', overflowAnchor: 'none' }}>
  <div style={{ height: virtualizer.getTotalSize(), position: 'relative', width: '100%' }}>
    {virtualizer.getVirtualItems().map((item) => (
      <div
        key={item.key}
        ref={virtualizer.measureElement}
        data-index={item.index}
        style={{
          position: 'absolute',
          top: 0,
          width: '100%',
          transform: `translateY(${item.start}px)`,
        }}
      >
        <Message message={messages[item.index]!} />
      </div>
    ))}
  </div>
</div>
```

What the options do:

- `anchorTo: 'end'`: before the data changes, the virtualizer records the visible item and its offset. After a prepend it finds the same keyed item and corrects the scroll offset. It also keeps an end-pinned viewport pinned when the last item grows.
- `followOnAppend`: after items are appended, scroll to the end only if the viewport was within `scrollEndThreshold` of the end before the append. `true` equals `'auto'`; pass `'smooth'` or `'instant'` to choose a behavior. Users who scrolled up are never pulled down. It does not follow prepends.
- Following also works when older items are trimmed from the start in the same update (a capped log buffer) if keys persist, a non-empty suffix of the old list is retained in order, and appended items have new keys.
- `scrollEndThreshold` (default `1`) is the pinned tolerance for `isAtEnd()` and `followOnAppend`. Use 50 to 100 for touch devices and momentum scroll.
- Start at the latest message by calling `scrollToEnd()` once the scroller exists. For restored screens, combine `initialOffset` and `initialMeasurementsCache`.

Stable ids in `getItemKey` are mandatory. Index keys cannot tell a prepend from an append, because every existing item shifts index.

The scroller needs a fixed height and `overflow: auto`. Keep loading state outside the virtualizer; prepend or append data normally. A "typing" indicator can be a real last item or sit outside the scroller.

## Loading Older History

```tsx
const q = useInfiniteQuery({
  queryKey: ['thread', threadId],
  queryFn: ({ pageParam }) => fetchMessages(threadId, { before: pageParam }),
  initialPageParam: undefined as string | undefined,
  getNextPageParam: () => undefined,
  getPreviousPageParam: (firstPage) => firstPage.olderCursor ?? undefined,
})

const messages = React.useMemo(() => q.data?.pages.flatMap((p) => p.messages) ?? [], [q.data])
// ...virtualizer as above, using `messages`

const firstIndex = virtualizer.getVirtualItems()[0]?.index
React.useEffect(() => {
  if (firstIndex !== undefined && firstIndex <= 3 && q.hasPreviousPage && !q.isFetchingPreviousPage) {
    q.fetchPreviousPage()
  }
}, [firstIndex, q.hasPreviousPage, q.isFetchingPreviousPage, q.fetchPreviousPage])
```

- TanStack Query v5 prepends pages returned by `fetchPreviousPage` to `data.pages`, so flattening in page order gives oldest-first. Check that your backend returns each page in chronological order too.
- With plain state, `setMessages((cur) => [...older, ...cur])` is enough. The virtualizer handles the rest.
- Guard against repeat fetches with the fetching flag, as above. Do not fetch on every scroll event.
- Trigger a few items before the top (a threshold of 3 to 10), not only at index 0.
- Show a spinner row outside the virtualized range or as item 0 only if it has stable key (`'loader'`).

## Jump To Latest

```tsx
const showJump = !virtualizer.isAtEnd(120)

{showJump && (
  <button onClick={() => virtualizer.scrollToEnd({ behavior: 'smooth' })}>Jump to latest</button>
)}
```

- By default the owner re-renders on every scroll update, so reading `isAtEnd()` in render stays current. With `directDomUpdates`, renders happen only on range changes, so mirror it into state from `onChange`:

```tsx
onChange: (instance) => setPinned(instance.isAtEnd())
```

- `getDistanceFromEnd()` gives the pixel distance, useful for an unread-count badge.
- Call `virtualizer.cancelScroll()` when the user touches or wheels during a smooth jump (core 3.18+).

## Streaming Output

- Growth of the last item is handled: if the viewport is pinned before the measured size changes, the virtualizer adjusts by the delta and keeps the bottom stuck.
- Core 3.17.6 stopped viewport-spanning items from dragging `scrollTop` while they grow; 3.17.9 recovers the pin when the browser clamps the compensation write (for example with `paddingEnd`). Prefer 3.18.x for streaming UIs.
- Keep the streaming message's React key stable from first token to completion, and keep its `id` constant. Changing the id swaps the cached size.
- Render markdown progressively inside the measured wrapper. Do not set a height on the wrapper.
- Auto-follow stops once the user scrolls away. Re-pin when they press jump or reach the end threshold again.

## Infinite Scroll With useInfiniteQuery

Top-to-bottom feed (v5 API, matches the official example):

```tsx
const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } = useInfiniteQuery({
  queryKey: ['rows', filters],
  queryFn: ({ pageParam }) => fetchRows({ ...filters, cursor: pageParam }),
  initialPageParam: 0,
  getNextPageParam: (last) => last.nextCursor,
})

const rows = React.useMemo(() => data?.pages.flatMap((p) => p.rows) ?? [], [data])

const virtualizer = useVirtualizer({
  count: hasNextPage ? rows.length + 1 : rows.length, // +1 loader row
  getScrollElement: () => parentRef.current,
  estimateSize: () => 72,
  getItemKey: React.useCallback(
    (index: number) => (index < rows.length ? rows[index]!.id : 'loader'),
    [rows],
  ),
  overscan: 5,
})

const lastIndex = virtualizer.getVirtualItems().at(-1)?.index

React.useEffect(() => {
  if (lastIndex === undefined) return
  if (lastIndex >= rows.length - 1 && hasNextPage && !isFetchingNextPage) {
    fetchNextPage()
  }
}, [lastIndex, rows.length, hasNextPage, isFetchingNextPage, fetchNextPage])
```

Render the loader row for `item.index > rows.length - 1`, and show "end of list" text only when `hasNextPage` is false.

Notes:

- Depend on primitives (`lastIndex`, `rows.length`) rather than the `getVirtualItems()` array.
- Trigger early for smoother scrolling: `lastIndex >= rows.length - 1 - PREFETCH` with `PREFETCH` of 5 to 15.
- Page size should exceed the visible count plus overscan, or the trigger fires repeatedly while a page loads. The fetching guard prevents duplicate requests.
- The official Table infinite example uses an `onScroll` handler on the scroller that calls `fetchNextPage` when `scrollHeight - scrollTop - clientHeight < 500`. This works with any virtualizer and avoids effect dependencies, but ties the trigger to pixels instead of item counts. Also call it once after mount in case the first page does not fill the viewport.
- Total size grows as pages arrive. Dynamic rows with a good `estimateSize` keep the scrollbar stable. With a known server total, set `count` to the server total and render skeleton rows for unloaded indexes (`rows[index] === undefined`). Fetch the page that contains the visible index. This allows scrollbar jumps to arbitrary positions.
- Do not replace the whole `data` array identity on every background refetch if rows did not change; structural sharing in TanStack Query already keeps unchanged pages stable.

## Resetting On Query Changes

When the filter, sort, or search changes the query key:

- Include the inputs in `queryKey` so Query resets the pages.
- Scroll to the top: `virtualizer.scrollToOffset(0)` in an effect keyed on the inputs (not on `data`).
- If the list should keep its position per filter, key the whole list component by the filter so each owns its virtualizer; combine with `takeSnapshot()` for restoration.
- If items reorder under a stable `getItemKey`, cached sizes follow the rows. If the same keys now mean different content (for example paged by offset), call `virtualizer.measure()`.

## Older-Version Fallback

On `@tanstack/virtual-core` before 3.16, `anchorTo` and `scrollToEnd` do not exist. Upgrade if you can. If not, manual prepend compensation (adjust `scrollTop` by the added height after render) is fragile. Do not copy it into code that can use 3.16 or newer.
