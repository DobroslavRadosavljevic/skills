# State and Storage Hooks

## Boolean and cycle state

### `useDisclosure`

Primary boolean open/close pattern for modals, drawers, menus.

```tsx
import { useDisclosure } from '@mantine/hooks';

const [opened, { open, close, toggle, set }] = useDisclosure(false, {
  onOpen: () => {},
  onClose: () => {},
});
```

- `open` / `close` are no-ops when already in that state (callbacks fire only on actual transitions).
- `set(value)` is available in 9.x.
- Types: `UseDisclosureOptions`, `UseDisclosureHandlers`, `UseDisclosureReturnValue`.

### `useToggle`

Cycle through a list of values (default `[false, true]`):

```tsx
const [value, toggle] = useToggle(['light', 'dark']);
toggle(); // next value
toggle('dark'); // set specific value (or functional updater)
```

### `useCounter`

```tsx
const [count, { increment, decrement, set, reset }] = useCounter(0, {
  min: 0,
  max: 10,
});
```

## Collections

### `useListState`

Array state with rich handlers. Always parameterize empty initials: `useListState<Item>([])`.

Handlers include: `append`, `prepend`, `insert`, `remove`, `reorder`, `swap`, `setItem`, `setItemProp`, `apply`, `applyWhere`, `filter`, `setState`.

```tsx
import { useListState } from '@mantine/hooks';
import type { UseListStateHandlers } from '@mantine/hooks';

const [items, handlers] = useListState<{ id: string; label: string }>([]);
handlers.append({ id: '1', label: 'One' });
handlers.reorder({ from: 1, to: 0 });
```

### `useSetState`

Shallow-merge object updates (class-component `setState` style):

```tsx
const [state, setState] = useSetState({ name: '', age: 0 });
setState({ age: 1 });
setState((current) => ({ age: current.age + 1 }));
```

### `useMap` / `useSet`

Reactive `Map` / `Set` wrappers that trigger re-renders on mutation methods.

### `useQueue`

Cap visible `state` length; overflow goes to `queue`:

```tsx
const { state, queue, add, update, cleanQueue } = useQueue<string>({
  limit: 2,
  initialValues: ['a', 'b', 'c'],
});
```

### `usePagination`

Build custom pagination UIs (`active`, `range`, `next`, `previous`, `first`, `last`, `setPage`, siblings/boundaries options).

### `useSelection`

```tsx
const [selection, handlers] = useSelection({
  data: items,
  defaultSelection: [],
  resetSelectionOnDataChange: false,
});
handlers.select(item);
handlers.deselect(item);
handlers.toggle(item);
handlers.setSelection([]);
handlers.resetSelection();
handlers.isAllSelected();
handlers.isSomeSelected();
```

### `useStateHistory`

Value + undo/redo history (`UseStateHistoryValue` type in 9.x; formerly `StateHistory`).

## Controlled / uncontrolled bridges

### `useUncontrolled`

Implement dual controlled/uncontrolled props:

```tsx
const [value, setValue, isControlled] = useUncontrolled({
  value: props.value,
  defaultValue: props.defaultValue,
  finalValue: '',
  onChange: props.onChange,
});
```

### `useInputState`

Convenience for inputs — accepts event or raw value:

```tsx
const [value, setValue] = useInputState('');
// <input value={value} onChange={setValue} />
```

### `useValidatedState`

Keep last valid value alongside current editing value and a validity flag. Useful for constrained fields without a full form library.

### `useCollapse` state pairing

Pair `useDisclosure` with `useCollapse` / `useHorizontalCollapse` for height/width animation (see [advanced-interaction.md](advanced-interaction.md)).

## Storage

### `useLocalStorage` / `useSessionStorage`

```tsx
const [value, setValue, removeValue] = useLocalStorage({
  key: 'pref',
  defaultValue: 'a',
  // getInitialValueInEffect: true (default) — SSR-safe
  // sync: true (default) — cross-tab via storage events
  // serialize / deserialize — override JSON
});
```

Also exported: `readLocalStorageValue`, `readSessionStorageValue` for non-React reads.

Types: `UseStorageOptions`, `UseStorageReturnValue`.

## Hash and document chrome

- `useHash` — read/write `location.hash`
- `useDocumentTitle` — set `document.title`
- `useFavicon` — set favicon href
- `useDocumentVisibility` — `'visible' | 'hidden'`
