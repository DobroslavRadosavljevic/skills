# Observers, Media, and Timing

## Media and preference queries

```tsx
import {
  useMediaQuery,
  useColorScheme,
  useReducedMotion,
} from '@mantine/hooks';

const matches = useMediaQuery('(min-width: 48em)', false, {
  getInitialValueInEffect: true,
});

const scheme = useColorScheme('light'); // 'light' | 'dark'
const reduceMotion = useReducedMotion();
```

- Without APIs (SSR), hooks return the provided initial value / `false`.
- 9.x removed ancient Safari `matchMedia` fallbacks.

## Size and visibility observers

```tsx
const [ref, rect] = useResizeObserver();
const { ref, width, height } = useElementSize(); // convenience wrapper
const { ref, entry } = useIntersection(options?);
const { ref, inViewport } = useInViewport();
const { ref } = useMutationObserver(callback, options);
useMutationObserverTarget(target, callback, options); // observe external node
```

- First render / SSR: resize rect fields are `0`.
- Prefer returned **callback refs** (9.x) so dynamic mount/unmount works.

`useViewportSize()` tracks window inner width/height.

## Debounce

| Hook | Use when |
| --- | --- |
| `useDebouncedValue(value, wait, { leading? })` | Controlled input; keep live `value`, debounce derived work |
| `useDebouncedState(defaultValue, wait, { leading? })` | Debounced setter; no immediate value mirror |
| `useDebouncedCallback(fn, wait \| options)` | Debounce arbitrary calls; `flush` / `cancel` / `isPending` |

```tsx
const [value, setValue] = useState('');
const [debounced, cancel, { flush }] = useDebouncedValue(value, 300);

const search = useDebouncedCallback(
  (query: string) => {
    void fetchResults(query);
  },
  { delay: 300, flushOnUnmount: false, maxWait: 1000 }
);
```

Pending debounced value updates cancel on unmount. Prefer `flush` when the last value must commit before navigation.

## Throttle

Mirror of debounce:

- `useThrottledValue`
- `useThrottledState`
- `useThrottledCallback`

Use throttle for high-frequency pointer/scroll handlers that should run periodically; use debounce for “wait until quiet” search/save.

## Timers

```tsx
const { start, clear } = useTimeout(() => {}, 1000);
const interval = useInterval(() => {}, 1000, { autoInvoke?: boolean });
interval.start();
interval.stop();
interval.toggle();
```

## Lifecycle helpers

| Hook | Role |
| --- | --- |
| `useIsomorphicEffect` | `useLayoutEffect` in browser, `useEffect` on server |
| `useDidUpdate` | `useEffect` skipping first mount |
| `useShallowEffect` | Effect with shallow-compared deps |
| `useIsFirstRender` | Boolean for first render |
| `useMounted` | Whether component has mounted |
| `usePrevious(value)` | Previous render value |
| `useForceUpdate()` | Force re-render |
| `useId(staticId?)` | SSR-safe id (React `useId` oriented) |
| `useLogger(name, deps)` | Dev logging on dep changes |

## Fetch

```tsx
const { data, loading, error, refetch, abort } = useFetch<User[]>('/api/users', {
  autoInvoke: true,
  // plus standard RequestInit fields
});
```

Thin wrapper only. For shared cache, retries, and dedupe, use the project's server-state library — still keep this skill scoped to documenting `useFetch` accurately when it appears.
