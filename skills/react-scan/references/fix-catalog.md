# Cause → Fix Catalog

Match the signal from React Scan (inspector, Ranked view) or the probe (`components[]` fields), then apply the smallest fix. Check the React Compiler first ([section 14](#14-react-compiler)).

Contents:
1. [Unstable object, array, function, or JSX props](#1-unstable-props)
2. [Context value identity](#2-context-value-identity)
3. [Over-broad context](#3-over-broad-context)
4. [State lifted too high](#4-state-lifted-too-high)
5. [Parent cascade into an expensive child](#5-parent-cascade-into-an-expensive-child)
6. [Expensive work during render](#6-expensive-work-during-render)
7. [Long lists](#7-long-lists)
8. [Unstable keys and remounts](#8-unstable-keys-and-remounts)
9. [Controlled inputs on large forms](#9-large-controlled-forms)
10. [High-frequency updates](#10-high-frequency-updates)
11. [Store subscriptions without narrow selectors](#11-store-selectors)
12. [Effects that set derived state](#12-derived-state-in-effects)
13. [Timers and subscriptions at the root](#13-timers-at-the-root)
14. [React Compiler](#14-react-compiler)
15. [When not to memo](#15-when-not-to-memo)
16. [Not a render problem](#16-not-a-render-problem)

| # | Signal (UI) | Signal (probe) |
| --- | --- | --- |
| 1 | ⚠ "Reference changed but objects are structurally the same", ƒ "Function reference changed" | `props: { style: N, onSelect: N }` on a `memo` child |
| 2 | Changed Context on many consumers at once | `context: { AuthContext: N }` on many components |
| 3 | Consumers that don't use the changed field still render | `context` on components that read an unrelated slice |
| 4 | Big outline over a whole section for a small local action | `state` at a high component, `noOwnChange` under it |
| 5 | High self ms, Memoizable, empty "what changed" | high `selfMs` and `noOwnChange ≈ renders` |
| 6 | High self ms with few renders | `selfMs / renders` large |
| 7 | `Row ×N` labels; DOM/Draw time grows with item count | many renders of one row component; high mount cost |
| 8 | Input loses focus or state resets (random or changing keys); wrong row keeps the state (index keys) | random keys: `mounts` grow during updates. Index keys: no mounts; `props.<item>` churn plus `noOwnChange` on rows when the list filters or reorders |
| 9 | Typing is orange or red; whole form outlined | field components with `noOwnChange` or `props.value` on every keystroke |
| 10 | FPS drops during scroll, drag, or pointer moves | commits ≈ events fired |
| 11 | Changed State (hook index) on many components for unrelated store updates | `state` on components whose selected data did not change |
| 12 | `×2` per interaction | `commits` = 2 × interactions |
| 13 | Outlines pulse with no input | renders while idle |

## 1. Unstable Props

Props are compared by `Object.is`. `memo` skips a render only if every prop is identical.

```tsx
// Before: Chart is memo()'d but renders whenever Dashboard renders
function Dashboard({ data }: { data: Point[] }) {
  const [tab, setTab] = useState("a");
  return (
    <Chart
      points={data.filter((point) => point.visible)} // new array
      style={{ height: 300 }}                         // new object
      onSelect={(id) => trackSelect(id)}              // new function
      legend={<Legend />}                             // new element
    />
  );
}
```

```tsx
// After (no React Compiler)
const CHART_STYLE = { height: 300 };
const LEGEND = <Legend />;

function Dashboard({ data }: { data: Point[] }) {
  const [tab, setTab] = useState("a");
  const visiblePoints = useMemo(() => data.filter((point) => point.visible), [data]);
  const handleSelect = useCallback((id: string) => trackSelect(id), []);
  return <Chart points={visiblePoints} style={CHART_STYLE} onSelect={handleSelect} legend={LEGEND} />;
}
```

Stabilizing props helps only when the child is `memo`'d or the value is a dependency of an effect or memo. For rows, pass `onSelect` plus `id` instead of `() => onSelect(row.id)`.

## 2. Context Value Identity

```tsx
// Before: a new value object each render → every consumer renders
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  return <AuthContext value={{ user, setUser }}>{children}</AuthContext>;
}
```

```tsx
// After (React 19 <Context value>; use <AuthContext.Provider> on 18 and older)
function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const value = useMemo(() => ({ user, setUser }), [user]);
  return <AuthContext value={value}>{children}</AuthContext>;
}
```

The provider re-renders only when its own owner renders. `children` passed in stay identical, so only consumers re-render.

## 3. Over-broad Context

A consumer re-renders when the context value changes, even if it reads a field that did not change. The compiler does not fix this.

```tsx
// Split state from actions: dispatch never changes identity
const StateContext = createContext<State | null>(null);
const DispatchContext = createContext<React.Dispatch<Action> | null>(null);

function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  return (
    <DispatchContext value={dispatch}>
      <StateContext value={state}>{children}</StateContext>
    </DispatchContext>
  );
}
```

For data with many independent slices, use a store with selectors instead of context. Options: `useSyncExternalStore`, Zustand, Redux, TanStack Store, Jotai, or `use-context-selector`.

```ts
function useStoreSelector<T>(selector: (state: State) => T): T {
  return useSyncExternalStore(store.subscribe, () => selector(store.getState()));
}
// The selector must return a primitive or a stable reference; a new object every call loops or re-renders.
```

## 4. State Lifted Too High

```tsx
// Before: hover state in Page re-renders the whole page on every pointer move
function Page() {
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <>
      <Toolbar hovered={hovered} onHover={setHovered} />
      <ExpensiveGrid />
    </>
  );
}
```

```tsx
// After 1: the state lives in the component that uses it
function Page() {
  return (
    <>
      <Toolbar /> {/* owns `hovered` */}
      <ExpensiveGrid />
    </>
  );
}

// After 2: children as props; the stateful wrapper does not own the expensive subtree
function ScrollShadow({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  return (
    <div onScroll={(event) => setScrolled(event.currentTarget.scrollTop > 0)}>
      <Header shadow={scrolled} />
      {children /* created by Page, same element → React skips it */}
    </div>
  );
}
```

## 5. Parent Cascade into an Expensive Child

```tsx
// Before: each keystroke in the note field re-renders HeavyChart (its props didn't change)
function Report({ rows }: { rows: Row[] }) {
  const [note, setNote] = useState("");
  return (
    <>
      <input value={note} onChange={(event) => setNote(event.target.value)} />
      <HeavyChart rows={rows} />
    </>
  );
}
```

Two fixes:
- **A (structural, preferred):** move `note` and the input into their own `NoteField` component.
- **B:** `memo` the child. Its props are already stable.

```tsx
const HeavyChart = memo(function HeavyChart({ rows }: { rows: Row[] }) {
  /* ... */
});
```

To confirm: HeavyChart's renders for the interaction drop to `0`.

## 6. Expensive Work During Render

```tsx
// Before: sorts 50k rows on every render, including unrelated ones
const sorted = [...rows].sort(compareBy(sortKey));
// After
const sorted = useMemo(() => [...rows].sort(compareBy(sortKey)), [rows, sortKey]);
```

Measure first. Wrap the work in `console.time`. About 1 ms or more is worth memoizing. For truly heavy work, move it out of render: a precomputed selector, a Web Worker, server-side work, or pagination.

## 7. Long Lists

```tsx
import { useVirtualizer } from "@tanstack/react-virtual";

function VirtualList({ rows }: { rows: Row[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 36,
    overscan: 8,
  });
  return (
    <div ref={parentRef} style={{ height: 600, overflow: "auto" }}>
      <div style={{ height: virtualizer.getTotalSize(), position: "relative" }}>
        {virtualizer.getVirtualItems().map((item) => (
          <div
            key={item.key}
            style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start}px)` }}
          >
            <RowItem row={rows[item.index]} />
          </div>
        ))}
      </div>
    </div>
  );
}
```

- Also `memo` `RowItem`, with stable row objects and stable callbacks, so that selecting one row renders one row.
- For static content, CSS `content-visibility: auto` is a lighter option.
- Virtualization can break find-in-page, accessibility, and scroll restoration. Check them.

## 8. Unstable Keys and Remounts

```tsx
// Before
{items.map((item) => <Item key={Math.random()} item={item} />)} // remounts all, every render
{items.map((item, index) => <Item key={index} item={item} />)}  // wrong state on insert/reorder

// After
{items.map((item) => <Item key={item.id} item={item} />)}
```

A component defined inside another component also remounts on every render (a new type each time):

```tsx
function Parent() {
  const Child = () => <div />; // BAD: hoist to module scope
  return <Child />;
}
```

Signals:
- Random or changing keys, and components defined inside components: the probe's `mounts` grow during updates, input focus is lost, and local state resets.
- Index keys: no mounts. When a list filters or reorders, row slots receive different items, so you see `props.<item>` changes on rows (plus `noOwnChange` on rows whose item stayed). After switching to `key={item.id}`, mounts equal to the number of items that newly enter the list are expected and correct.

## 9. Large Controlled Forms

```tsx
// Before: one state object at the root → every keystroke renders all fields
const [values, setValues] = useState<Record<string, string>>({});
```

Fixes, in order of preference:
1. Uncontrolled inputs read on submit, with React 19 form actions or `FormData`:
   ```tsx
   <form action={async (formData) => save(Object.fromEntries(formData))}>
     {fields.map((field) => <input key={field.name} name={field.name} defaultValue={field.initial} />)}
   </form>
   ```
2. A form library with field-level subscriptions (TanStack Form `form.Field`, react-hook-form `register`), so that only the edited field renders.
3. Local state per `Field`, lifted on blur or submit.
4. If an expensive preview depends on the value, defer it ([10](#10-high-frequency-updates)).

## 10. High-Frequency Updates

Keep the input responsive and defer the heavy render:

```tsx
function Search() {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  return (
    <>
      <input value={query} onChange={(event) => setQuery(event.target.value)} />
      <Results query={deferredQuery} />
    </>
  );
}
const Results = memo(function Results({ query }: { query: string }) {
  /* ... */
}); // memo is REQUIRED here
```

- For non-input updates, use `startTransition(() => setFilter(next))`.
- Transitions keep the page responsive. Latency improves, but total render work stays the same, so expect Renders time to stay flat while INP drops.

Pointer, scroll, or animation values do not need React state:

```tsx
// Before: setState on every pointermove → 60–120 renders per second
// After: write the style directly; React does not render
const cursorRef = useRef<HTMLDivElement>(null);
<div
  onPointerMove={(event) => {
    cursorRef.current?.style.setProperty("transform", `translate(${event.clientX}px, ${event.clientY}px)`);
  }}
>
  <div ref={cursorRef} className="cursor" />
</div>;
```

Other options:
- throttle to `requestAnimationFrame`
- debounce updates that trigger network calls
- keep non-visual values in `useRef`
- animate with CSS `transform`/`opacity` or motion values.

## 11. Store Selectors

```tsx
// Redux, before: a new object each call → renders on every store update
const { user, cart } = useSelector((state: RootState) => ({ user: state.user, cart: state.cart }));
// After
const user = useSelector((state: RootState) => state.user);
const cart = useSelector((state: RootState) => state.cart);
// or useSelector(selectUserAndCart, shallowEqual), or a memoized createSelector

// Zustand, before: whole store, or a new object
const { bears, increase } = useBearStore();
// After
const bears = useBearStore((state) => state.bears);
const { bears, increase } = useBearStore(useShallow((state) => ({ bears: state.bears, increase: state.increase })));
```

Apply the same rule to TanStack Query: use `select` to derive a narrow, stable slice. Default structural sharing keeps unchanged data identical.

## 12. Derived State in Effects

```tsx
// Before: render → commit → effect → setState → a second render and commit
const [total, setTotal] = useState(0);
useEffect(() => setTotal(items.reduce((sum, item) => sum + item.price, 0)), [items]);

// After: compute during render (useMemo only if expensive)
const total = items.reduce((sum, item) => sum + item.price, 0);
```

Also:
- Reset state when a prop changes with a `key`, not an effect.
- Put event-specific logic in the handler.

The `react-hooks` lint rule `set-state-in-effect` flags this.

## 13. Timers at the Root

```tsx
// Before: a clock in App renders the entire app every second
// After: the timer lives in the leaf that displays it
function Clock() {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  return <time>{new Date(now).toLocaleTimeString()}</time>;
}
```

The same applies to polling, websocket messages, and `resize` listeners: subscribe where the data is used, select narrowly, and throttle.

## 14. React Compiler

- **Detect it:**
  - `babel-plugin-react-compiler` in the dependencies
  - `reactCompiler: true` in the Next config
  - a Vite or Babel compiler preset
  - `✨` before names in React Scan labels and logs, the `memo ✨` badge in the inspector, `compiled: true` in the probe.
- **It fixes, per compiled component:**
  - unstable inline objects, functions, and JSX ([1](#1-unstable-props))
  - context value objects ([2](#2-context-value-identity))
  - costly derived values ([6](#6-expensive-work-during-render)).
- **It does not fix:**
  - over-broad context ([3](#3-over-broad-context))
  - state placed too high when the subtree really reads it
  - store selectors that return new objects ([11](#11-store-selectors))
  - long lists, random keys, derived state in effects, high-frequency updates, slow handlers
  - components it bailed out on: rules-of-React violations, incompatible libraries, `"use no memo"`.
- **With the compiler on:**
  - Do not add manual `memo`/`useMemo`/`useCallback` to compiled components.
  - A component that should have `✨` but doesn't was skipped. Read the compiler lint output (`eslint-plugin-react-hooks`) and fix the violation.
  - If a compiled component still re-renders, the probe or inspector shows which prop, state, or context really changed. Fix that source, often an uncompiled parent or a library hook.
- **"Memoizable"** on a compiled component is a known false positive (#378). Trust the `✨` and the changed lists instead.

## 15. When Not to Memo

`memo` helps only when **both** hold:
- the component re-renders often with the same props
- its render is expensive.

Skip it for:
- cheap leaves
- components whose props change every time anyway
- components that receive fresh `children` or JSX props
- anything the compiler already handles.

Prefer structural fixes first: local state, children as props, pure rendering, no state-syncing effects.

Over-memoization risks:
- stale closures from `useCallback` with missing dependencies
- effects that stop re-running
- comparison cost on large props.

## 16. Not a Render Problem

**Update DOM and Draw** dominates:
- Reduce DOM size (virtualize, paginate).
- Avoid layout thrash: read layout, then write. Do not interleave.
- Animate `transform` and `opacity`, not layout properties.
- Cut expensive paint: big `box-shadow`, `filter`, `backdrop-filter`.

**JavaScript** dominates with few renders:
- Profile the handler in the Performance panel.
- Move heavy work off the critical path: after paint, `scheduler.yield()` where supported, or a Web Worker.
