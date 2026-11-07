# Collections, selection, data hooks, and virtualization

Docs: `https://react-aria.adobe.com/collections`, `/selection`, `/useListData`, `/useAsyncList`, `/useTreeData`, `/Virtualizer`.

## Contents

1. [Collection model](#collection-model)
2. [Static collections](#static-collections)
3. [Dynamic collections](#dynamic-collections)
4. [Ids and React keys](#ids-and-react-keys)
5. [The dependencies prop](#the-dependencies-prop)
6. [Collection: combine sources](#collection-combine-sources)
7. [Sections](#sections)
8. [Async loading and load-more items](#async-loading-and-load-more-items)
9. [Selection](#selection)
10. [Selection type and "all"](#selection-type-and-all)
11. [Selection behavior: toggle and replace](#selection-behavior-toggle-and-replace)
12. [Item actions](#item-actions)
13. [Links](#links)
14. [Disabled items](#disabled-items)
15. [SelectionIndicator](#selectionindicator)
16. [SharedElementTransition](#sharedelementtransition)
17. [useListData](#uselistdata)
18. [useAsyncList](#useasynclist)
19. [useTreeData](#usetreedata)
20. [Virtualizer](#virtualizer)
21. [Common mistakes](#common-mistakes)

## Collection model

These components share one API for items: ListBox, GridList, Menu, Table, Tree, TagGroup, Tabs, Select and ComboBox (through ListBox), and others.

- Children describe items. React Aria reads them and builds a collection. It uses the collection for keyboard navigation, selection, typeahead, and virtualization.
- Pick a static collection for items that the code hard-codes. Pick a dynamic collection for data.
- Each subpath exports its own parts. Import from the component subpath: `react-aria-components/ListBox`, `react-aria-components/GridList`, and so on. `Collection` comes from `react-aria-components/Collection`.

## Static collections

Write items as JSX. Use this for menus and other fixed items.

```tsx
import {MenuTrigger, Menu, MenuItem} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';
import {Popover} from 'react-aria-components/Popover';

<MenuTrigger>
  <Button>Menu</Button>
  <Popover>
    <Menu>
      <MenuItem id="open">Open</MenuItem>
      <MenuItem id="edit">Edit</MenuItem>
      <MenuItem id="delete">Delete</MenuItem>
    </Menu>
  </Popover>
</MenuTrigger>
```

Add `id` when the code needs to refer to the item (selection, actions, `disabledKeys`). Add `textValue` when the children are not plain text, because typeahead and accessibility need a string.

## Dynamic collections

Pass the array to `items` and a render function as `children`. This is like `array.map`, but React Aria caches each rendered item by the identity of its object. Unchanged objects do not render again.

```tsx
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';
import {useState} from 'react';

function Animals() {
  let [animals, setAnimals] = useState([
    {id: 1, name: 'Aardvark'},
    {id: 2, name: 'Kangaroo'}
  ]);

  return (
    <ListBox aria-label="Animals" items={animals}>
      {item => <ListBoxItem>{item.name}</ListBoxItem>}
    </ListBox>
  );
}
```

Other components put `items` on a different part:

| Component | Part that takes `items` |
| --- | --- |
| ListBox, GridList, Menu, Tree, TagList | The root list (`ListBox`, `GridList`, `Menu`, `Tree`, `TagList`) |
| Table | `TableHeader` (`columns`), `TableBody` (`items`), `Row` (`columns`) |
| Tabs | `TabList` and `TabPanels` |
| Any section or nested level | `Collection` inside the section or item |

## Ids and React keys

- Every item needs a unique id. It drives selection and item tracking.
- By default React Aria reads `key`, then `id`, on each object in `items`. An `id` prop on the item wins over both.
- React Aria sets the React `key` from `id`. With `array.map` you must set both `key` and `id`.
- Ids must be unique across the whole collection, across all sections. React keys only need uniqueness among siblings. Ids do not.

```tsx
let animals = [{name: 'Aardvark'}, {name: 'Kangaroo'}];

<ListBox aria-label="Animals" items={animals}>
  {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
</ListBox>
```

The `Key` type is `string | number`. Export: `import type {Key} from 'react-aria-components/Collection'`.

## The dependencies prop

Because rendered items are cached by object identity, an item render function that reads outside state does not update when that state changes. Pass that state in `dependencies`. It works like the `useMemo` dependency list.

```tsx
<ListBox
  aria-label="Pokemon"
  items={items}
  selectionMode="multiple"
  dependencies={[layout]}>
  {item => (
    <ListBoxItem style={{flexDirection: layout === 'horizontal' ? 'row' : 'column'}}>
      {item.name}
    </ListBoxItem>
  )}
</ListBox>
```

- A dependency change invalidates the whole list. To update one item, replace that item object in the data instead.
- `dependencies` exists on any part that takes `items`: `ListBox`, `GridList`, `Menu`, `Tree`, `Collection`, `TableHeader`, `TableBody`, `Row`.
- Symptom of a missing dependency: stale data in rows after a state change, with no error.

## Collection: combine sources

Use `<Collection>` to mix static and dynamic items, or to render several data sources in one list. It takes `items`, `children`, `dependencies`, `idScope`, and `addIdAndValue`.

```tsx
import {ListBox, ListBoxItem, ListBoxSection, Header} from 'react-aria-components/ListBox';
import {Collection} from 'react-aria-components/Collection';

let animals = [{species: 'Aardvark'}, {species: 'Kangaroo'}];
let people = [{name: 'David'}, {name: 'Jane'}];

<ListBox aria-label="Grouped items">
  <ListBoxSection id="animals">
    <Header>Animals</Header>
    <Collection items={animals}>
      {item => <ListBoxItem id={item.species}>{item.species}</ListBoxItem>}
    </Collection>
  </ListBoxSection>
  <ListBoxSection id="people">
    <Header>People</Header>
    <Collection items={people}>
      {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
    </Collection>
  </ListBoxSection>
</ListBox>
```

`idScope` prefixes ids that come from the data (`scope:id`), which helps when one data set appears twice in a collection. The docs do not cover `idScope` and `addIdAndValue`; this comes from the source.

`Collection` is also how trees recurse:

```tsx
import {Tree, TreeItem, TreeItemContent} from 'react-aria-components/Tree';
import {Collection} from 'react-aria-components/Collection';

interface FileNode {
  id: string,
  name: string,
  children: FileNode[]
}

let files: FileNode[] = [];

<Tree aria-label="Files" items={files}>
  {function renderItem(item) {
    return (
      <TreeItem textValue={item.name}>
        <TreeItemContent>{item.name}</TreeItemContent>
        <Collection items={item.children}>{renderItem}</Collection>
      </TreeItem>
    );
  }}
</Tree>
```

Use a named function expression so the render function can call itself.

## Sections

Wrap items in a section element. Put a `<Header>` inside for a visible title. A section with no `Header` needs `aria-label`.

| Component | Section | Header |
| --- | --- | --- |
| ListBox (also Select, ComboBox) | `ListBoxSection` | `Header` |
| Menu | `MenuSection` | `Header` |
| GridList (alpha in the docs) | `GridListSection` | `GridListHeader` |
| Tree | `TreeSection` | `TreeHeader` |

```tsx
import {ListBox, ListBoxItem, ListBoxSection, Header} from 'react-aria-components/ListBox';

<ListBox aria-label="Text style" selectionMode="multiple">
  <ListBoxSection id="styles">
    <Header>Styles</Header>
    <ListBoxItem id="bold">Bold</ListBoxItem>
    <ListBoxItem id="underline">Underline</ListBoxItem>
  </ListBoxSection>
</ListBox>
```

Dynamic sections: render a section from `items`, then a nested `Collection` for its items.

```tsx
let groups = [{name: 'Fruit', children: [{id: 1, name: 'Apple'}]}];

<ListBox aria-label="Groups" items={groups}>
  {group => (
    <ListBoxSection id={group.name}>
      <Header>{group.name}</Header>
      <Collection items={group.children}>
        {item => <ListBoxItem id={item.id}>{item.name}</ListBoxItem>}
      </Collection>
    </ListBoxSection>
  )}
</ListBox>
```

## Async loading and load-more items

Any fetch library works. `useAsyncList` is the built-in option. Infinite scroll uses a load-more item at the end of a list or section.

| Component | Load-more part |
| --- | --- |
| ListBox | `ListBoxLoadMoreItem` |
| GridList | `GridListLoadMoreItem` |
| Menu | `MenuLoadMoreItem` |
| Table | `TableLoadMoreItem` |
| Tree | `TreeLoadMoreItem` |

Props:

- `onLoadMore: () => any`: called when the user scrolls near the end.
- `isLoading: boolean`: shows `children` (the spinner) while true.
- `scrollOffset: number` (default `1`): trigger distance as a multiple of the scroll area height.
- `children`: the loading indicator.
- `direction: 'start' | 'end'` (`TableLoadMoreItem` only; default `'end'`): use `'start'` for reversed layouts.

```tsx
import {ListBox, ListBoxItem, ListBoxLoadMoreItem} from 'react-aria-components/ListBox';
import {Collection} from 'react-aria-components/Collection';
import {ProgressBar} from 'react-aria-components/ProgressBar';
import {useAsyncList} from 'react-aria-components/useAsyncList';

function Pokemon() {
  let list = useAsyncList<{name: string}>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', {signal});
      let json = await res.json();
      return {items: json.results, cursor: json.next};
    }
  });

  return (
    <ListBox
      aria-label="Pick a Pokemon"
      selectionMode="single"
      style={{height: 300, overflow: 'auto'}}
      renderEmptyState={() => <ProgressBar isIndeterminate aria-label="Loading" />}>
      <Collection items={list.items}>
        {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
      </Collection>
      <ListBoxLoadMoreItem
        onLoadMore={list.loadMore}
        isLoading={list.loadingState === 'loadingMore'}>
        <ProgressBar isIndeterminate aria-label="Loading more" />
      </ListBoxLoadMoreItem>
    </ListBox>
  );
}
```

Rules:

- Do not pass `items` on the root when a load-more item is present. Use `Collection` inside, then the load-more item as a sibling. In a Table, both go inside `TableBody`.
- Use `renderEmptyState` for the first load, and for a real empty result.
- The list needs a scroll area (a height and overflow). The sentinel fires based on scroll position.
- Several load-more items can exist at once, for example one per section or per tree level.

```tsx
import {Table, TableHeader, TableBody, Column, Row, Cell, TableLoadMoreItem} from 'react-aria-components/Table';
import {Collection} from 'react-aria-components/Collection';
import {useAsyncList} from 'react-aria-components/useAsyncList';

let list = useAsyncList<{name: string}>({load: loadPage});

<Table aria-label="Characters">
  <TableHeader>
    <Column isRowHeader>Name</Column>
  </TableHeader>
  <TableBody renderEmptyState={() => 'Loading'}>
    <Collection items={list.items}>
      {item => (
        <Row id={item.name}>
          <Cell>{item.name}</Cell>
        </Row>
      )}
    </Collection>
    <TableLoadMoreItem
      onLoadMore={list.loadMore}
      isLoading={list.loadingState === 'loadingMore'} />
  </TableBody>
</Table>
```

## Selection

Props on ListBox, GridList, Table, Tree, TagGroup (`TagGroup` root), and Menu:

| Prop | Type | Notes |
| --- | --- | --- |
| `selectionMode` | `'none' \| 'single' \| 'multiple'` | Selection is off until you set it. |
| `selectedKeys` | `'all' \| Iterable<Key>` | Controlled. Any iterable works, such as an array. |
| `defaultSelectedKeys` | `'all' \| Iterable<Key>` | Uncontrolled. |
| `onSelectionChange` | `(keys: Selection) => void` | Always gets a `Set` or `'all'`, even when you passed an array. |
| `disallowEmptySelection` | `boolean` | User can not clear the last selected item. |
| `selectionBehavior` | `'toggle' \| 'replace'` | Default `'toggle'`. Not on Menu. |
| `disabledKeys` | `Iterable<Key>` | See [Disabled items](#disabled-items). |
| `disabledBehavior` | `'all' \| 'selection'` | Default `'all'`. On GridList, Table, Tree. |
| `escapeKeyBehavior` | `'clearSelection' \| 'none'` | Default `'clearSelection'`. Change it only when the UI handles Escape in another way. |
| `shouldSelectOnPressUp` | `boolean` | Select on release instead of on press. |
| `onAction` | `(key: Key) => void` | Item action for the whole collection. On Table the name is `onRowAction`. |

```tsx
import {ListBox, ListBoxItem, type Selection} from 'react-aria-components/ListBox';
import {useState} from 'react';

function Sandwich() {
  let [selectedKeys, setSelectedKeys] = useState<Selection>(new Set(['cheese']));

  return (
    <ListBox
      aria-label="Sandwich contents"
      selectionMode="multiple"
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}>
      <ListBoxItem id="lettuce">Lettuce</ListBoxItem>
      <ListBoxItem id="cheese">Cheese</ListBoxItem>
    </ListBox>
  );
}
```

Single selection in a multi-capable component: `selectionMode="single"` keeps the plural props. The value is still a `Set` with at most one id.

Single-only components such as Tabs use singular props: `selectedKey`, `defaultSelectedKey`, `onSelectionChange(key)`.

```tsx
import {Tabs, TabList, Tab, TabPanels, TabPanel, type Key} from 'react-aria-components/Tabs';
import {useState} from 'react';

function Example() {
  let [selectedKey, setSelectedKey] = useState<Key>('home');

  return (
    <Tabs selectedKey={selectedKey} onSelectionChange={setSelectedKey}>
      <TabList aria-label="Sections">
        <Tab id="home">Home</Tab>
        <Tab id="files">Files</Tab>
      </TabList>
      <TabPanels>
        <TabPanel id="home">Home</TabPanel>
        <TabPanel id="files">Files</TabPanel>
      </TabPanels>
    </Tabs>
  );
}
```

Select does not use these props on its root. It uses `value`, `defaultValue`, and a `selectionMode` of `'single'` or `'multiple'`.

Selection checkboxes: in GridList, Table, and Tree, render `<Checkbox slot="selection" />` inside the item or cell. A Table gets a select-all box when the same slot is in a `Column`.

Style with `[data-selected]` and `[data-selection-mode="single | multiple"]` on items. Item render props also give `isSelected`, `selectionMode`, and `selectionBehavior`.

## Selection type and "all"

```ts
type Selection = 'all' | Set<Key>;
```

Select all comes from a Table header checkbox or Cmd/Ctrl+A. Then `onSelectionChange` receives the string `'all'`, not a set of ids. This means every item in the collection, including items not yet loaded.

Handle both cases everywhere. A `.size`, `.has`, or spread on `'all'` is a bug.

```tsx
import {Table, TableHeader, TableBody, Column, Row, Cell, Checkbox, Button, type Selection} from 'react-aria-components/Table';
import {useState} from 'react';

function Files({rows}: {rows: {name: string, type: string}[]}) {
  let [selected, setSelected] = useState<Selection>(new Set());
  let hasSelection = selected === 'all' || selected.size > 0;

  function deleteSelected() {
    if (selected === 'all') {
      // Run the action on the whole data set on the server, with the current filter.
    } else {
      // Run the action on [...selected].
    }
  }

  return (
    <>
      <Table
        aria-label="Files"
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={setSelected}>
        <TableHeader>
          <Column><Checkbox slot="selection" /></Column>
          <Column isRowHeader>Name</Column>
          <Column>Type</Column>
        </TableHeader>
        <TableBody items={rows}>
          {item => (
            <Row id={item.name}>
              <Cell><Checkbox slot="selection" /></Cell>
              <Cell>{item.name}</Cell>
              <Cell>{item.type}</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
      {hasSelection && <Button onPress={deleteSelected}>Delete selected</Button>}
    </>
  );
}
```

With paginated data, `'all'` must apply to the server-side set. Do not map it to the loaded keys.

`useTreeData` has no `'all'`: its `setSelectedKeys` takes a `Set`. See [useTreeData](#usetreedata).

## Selection behavior: toggle and replace

`selectionBehavior="toggle"` (default) acts like a checkbox group:

- Click, tap, Space, or Enter toggles the focused item.
- Arrow keys move focus only.
- Pairs with a checkbox in each row.

`selectionBehavior="replace"` acts like a native file list:

- A mouse click replaces the selection with that item.
- Arrow keys move focus and selection together.
- Ctrl, Cmd, and Shift extend the selection.
- Touch always acts as toggle, because modifier keys are absent.
- Use it when rows have no checkboxes.

Move focus without moving selection: hold Ctrl (Windows) or Option (macOS) with the arrow keys. The same modifier with Space toggles the focused item, so non-adjacent items can be selected.

## Item actions

GridList, Tree, ListBox, TagGroup, and Menu support `onAction`. Use it on an item (`() => void`) or on the collection (`(key) => void`). The collection form suits dynamic items.

```tsx
import {GridList, GridListItem} from 'react-aria-components/GridList';

let images = [{id: 'sun', title: 'Rays of sun'}];

<GridList
  aria-label="Files"
  selectionMode="multiple"
  items={images}
  onAction={id => openImage(id)}>
  {image => (
    <GridListItem id={image.id} textValue={image.title}>
      {image.title}
    </GridListItem>
  )}
</GridList>
```

What triggers the action depends on the behavior:

| Behavior | Input | Result |
| --- | --- | --- |
| `toggle`, nothing selected | Click, tap, Enter | Action |
| `toggle`, nothing selected | Checkbox, Space | Select |
| `toggle`, at least one selected | Click, tap | Toggle selection |
| `replace` | Mouse click | Select |
| `replace` | Double click | Action |
| `replace` | Tap | Action |
| `replace` | Long press | Enter selection mode (temporary `toggle`). Clearing all items exits it. |

Keyboard behavior does not change with touch selection mode. Table uses `onRowAction` at the root, and `Row` has `onAction`.

## Links

Items with `href` become links: `ListBoxItem`, `GridListItem`, `MenuItem`, `Row`, `TreeItem`, `Tag`. They also take `target`, `rel`, `download`, and `routerOptions`. Items with `href` get `[data-href]`.

A link acts as the item action, so the table in [Item actions](#item-actions) applies: with `toggle` and an empty selection a press follows the link; with `replace` a mouse double click follows it. The source (`useSelectableItem`) confirms this; the selection guide does not spell it out. A Table `Row` with `href` can not render as `<a>`, because of an HTML limitation. React Aria handles the click in JavaScript and starts a native navigation. With a client-side router, use `onAction` on the row, not `href`.

Plain `href` navigates with the browser. For a client-side router, see the client side routing section at `https://react-aria.adobe.com/Link`.

## Disabled items

- `isDisabled` on the item, or `disabledKeys` on the collection for dynamic data.
- By default a disabled item can not get focus, selection, or actions.
- `disabledBehavior="selection"` disables selection only. The item stays focusable and its action still runs.
- Style with `[data-disabled]`, or read `isDisabled` in render props. With `disabledBehavior="selection"`, `isDisabled` stays false when actions still work, because it means "both selection and actions are off".

```tsx
let items = [{id: 1, name: 'Charizard'}, {id: 3, name: 'Venusaur'}];

<ListBox aria-label="Pokemon" disabledKeys={[3]} selectionMode="multiple" items={items}>
  {item => <ListBoxItem>{item.name}</ListBoxItem>}
</ListBox>
```

## SelectionIndicator

An element that animates between items as the selection moves. Render one inside each item. Exported from `react-aria-components/SelectionIndicator` and from these subpaths: ListBox, GridList, Menu, Table, Tree, TagGroup, Tabs, RadioGroup, ToggleButtonGroup.

```tsx
import {ListBox, ListBoxItem, SelectionIndicator} from 'react-aria-components/ListBox';

<ListBox aria-label="Sections" selectionMode="single">
  <ListBoxItem id="home" className="item">
    <SelectionIndicator />
    Home
  </ListBoxItem>
  <ListBoxItem id="docs" className="item">
    <SelectionIndicator />
    Docs
  </ListBoxItem>
</ListBox>
```

```css
.item {
  position: relative;
}

.react-aria-SelectionIndicator {
  position: absolute;
  inset: 0;
  z-index: -1;
  background: var(--highlight);
  /* Only properties listed here animate. Include translate to animate position. */
  transition-property: translate, width, height;
  transition-duration: 200ms;

  &[data-entering],
  &[data-exiting] {
    opacity: 0;
  }
}
```

- Default class: `react-aria-SelectionIndicator`.
- States: `[data-entering]`, `[data-exiting]`. Render props: `isEntering`, `isExiting`. Use them for the transition when nothing is selected.
- Prop `isSelected` is set by the parent. Set it only outside a supported parent.
- When an item uses a render function as children, put the indicator inside that function.

## SharedElementTransition

The docs have no page for this. These facts come from the types only.

`react-aria-components/SharedElementTransition` exports `SharedElementTransition` (a scope) and `SharedElement` (an element that animates between old and new position when it moves to another parent).

```tsx
import {SharedElementTransition, SharedElement} from 'react-aria-components/SharedElementTransition';

<SharedElementTransition>
  {tabs.map(tab => (
    <div key={tab.id}>
      {tab.title}
      <SharedElement name="underline" isVisible={tab.id === current} />
    </div>
  ))}
</SharedElementTransition>
```

Props: `name: string`, `isVisible?: boolean`, plus `className`, `style`, `children` with render props `isEntering` and `isExiting` (`[data-entering]`, `[data-exiting]`). `SelectionIndicator` is the documented way to get this effect inside collections, so prefer it there.

## useListData

Immutable list state with update helpers and selection state. Removing an item also removes it from the selection. Pick it for client-side lists that the user can edit, and for drag and drop.

```tsx
import {useListData} from 'react-aria-components/useListData';
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';

function Animals() {
  let list = useListData({
    initialItems: [{name: 'Aardvark'}, {name: 'Kangaroo'}, {name: 'Snake'}],
    initialSelectedKeys: ['Kangaroo'],
    getKey: item => item.name
  });

  return (
    <ListBox
      aria-label="Animals"
      selectionMode="multiple"
      items={list.items}
      selectedKeys={list.selectedKeys}
      onSelectionChange={list.setSelectedKeys}>
      {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
    </ListBox>
  );
}
```

The import also works from `react-stately/useListData`.

Options: `initialItems`, `initialSelectedKeys` (`'all' | Iterable<Key>`), `initialFilterText`, `getKey` (default: `item.id ?? item.key`), `filter(item, filterText) => boolean`.

Returned state: `items` (filtered when `filter` is set), `selectedKeys` (`Selection`), `filterText`.

Methods:

| Purpose | Methods |
| --- | --- |
| Selection | `setSelectedKeys(keys)`, `addKeysToSelection(keys)`, `removeKeysFromSelection(keys)` |
| Filter | `setFilterText(text)` |
| Read | `getItem(key)` |
| Insert | `insert(index, ...values)`, `insertBefore(key, ...values)`, `insertAfter(key, ...values)`, `append(...values)`, `prepend(...values)` |
| Remove | `remove(...keys)`, `removeSelectedItems()` |
| Move | `move(key, toIndex)`, `moveBefore(key, keys)`, `moveAfter(key, keys)` |
| Update | `update(key, newValue \| (prev => next))` |

`moveBefore`, `moveAfter`, `getItem`, and the filter API exist in the types; the docs page does not list them all.

## useAsyncList

Extends `useListData` with loading and error state, abortable requests, pagination, sorting, and filtering. It has every `useListData` update method. Pick it for server data when no other fetch library owns that data.

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';

let list = useAsyncList<{name: string}>({
  async load({signal, cursor, filterText, sortDescriptor}) {
    let res = await fetch(cursor || `/api/people?search=${filterText}`, {signal});
    let json = await res.json();
    return {items: json.results, cursor: json.next};
  }
});
```

Options: `load` (required), `sort`, `getKey`, `initialSelectedKeys`, `initialSortDescriptor`, `initialFilterText`.

`load` receives `{items, selectedKeys, sortDescriptor, signal, cursor, filterText, loadingState}` and returns `{items, selectedKeys?, sortDescriptor?, cursor?, filterText?}`.

Returned, in addition to `ListData`:

- `isLoading: boolean`, `error?: Error`, `sortDescriptor`.
- `loadingState`: `'loading' | 'sorting' | 'loadingMore' | 'error' | 'idle' | 'filtering'`.
- `reload()`, `loadMore()`, `sort(descriptor)`.

`loadMore` does nothing while a load runs or when `cursor` is null. So return `cursor: undefined` on the last page, and pass `list.loadMore` directly.

Always pass `signal` to `fetch`. React Aria aborts the old request when a new one starts. Encode user input in URLs.

Pagination: return `cursor`. It comes back to `load` on the next `loadMore`.

Client-side sort: pass `sort`.

```tsx
import {useCollator} from 'react-aria/useCollator';

let collator = useCollator();
let list = useAsyncList<Row>({
  async load({signal}) {
    let res = await fetch('/api/rows', {signal});
    return {items: await res.json()};
  },
  sort({items, sortDescriptor}) {
    return {
      items: [...items].sort((a, b) => {
        let cmp = collator.compare(a[sortDescriptor.column], b[sortDescriptor.column]);
        return sortDescriptor.direction === 'descending' ? -cmp : cmp;
      })
    };
  }
});

<Table aria-label="Rows" sortDescriptor={list.sortDescriptor} onSortChange={list.sort}>
  {/* header and body */}
</Table>
```

Server-side sort: omit `sort`, and read `sortDescriptor` in `load`.

Server-side filter: read `filterText` in `load`, and call `setFilterText`, which reloads.

```tsx
import {ComboBox, Input, Popover, ListBox, ListBoxItem, Label} from 'react-aria-components/ComboBox';
import {useAsyncList} from 'react-aria-components/useAsyncList';

let list = useAsyncList<{name: string}>({load: loadCharacters});

<ComboBox items={list.items} inputValue={list.filterText} onInputChange={list.setFilterText}>
  <Label>Character</Label>
  <Input />
  <Popover>
    <ListBox>{(item: {name: string}) => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}</ListBox>
  </Popover>
</ComboBox>
```

Preselect: `initialSelectedKeys` when ids are known first, or return `selectedKeys` from `load` when they depend on the data.

Docs note: the `useAsyncList` page shows older `Picker` and `Item` examples with an `isLoading` prop. Those are not `react-aria-components` APIs. For loaders in real components, use `renderEmptyState` and load-more items.

## useTreeData

Immutable tree state with helpers and selection. Pick it for `Tree`, nested `Table` rows, sectioned lists, and tree drag and drop.

```tsx
import {useTreeData} from 'react-aria-components/useTreeData';
import {Tree, TreeItem, TreeItemContent} from 'react-aria-components/Tree';
import {Collection} from 'react-aria-components/Collection';

interface FileItem {
  id: string,
  title: string,
  children?: FileItem[]
}

function Files({initialItems}: {initialItems: FileItem[]}) {
  let tree = useTreeData<FileItem>({
    initialItems,
    getKey: item => item.id,
    getChildren: item => item.children || []
  });

  return (
    <Tree
      aria-label="Files"
      selectionMode="multiple"
      items={tree.items}
      selectedKeys={tree.selectedKeys}
      onSelectionChange={keys => {
        if (keys !== 'all') {
          tree.setSelectedKeys(keys);
        }
      }}>
      {function renderItem(node) {
        return (
          <TreeItem textValue={node.value.title}>
            <TreeItemContent>{node.value.title}</TreeItemContent>
            {node.children && (
              <Collection items={node.children}>{renderItem}</Collection>
            )}
          </TreeItem>
        );
      }}
    </Tree>
  );
}
```

Options: `initialItems`, `initialSelectedKeys` (`Iterable<Key>`), `getKey` (default: `item.id ?? item.key`), `getChildren` (default: `item.children`).

Nodes: `{key, parentKey, value, children}`. Read your data from `node.value`. `children` can be `null`. React Aria reads `node.key` as the id.

Methods. Pass `null` as `parentKey` for the root.

| Purpose | Methods |
| --- | --- |
| Selection | `setSelectedKeys(keys: Set<Key>)` |
| Read | `getItem(key)` returns a node |
| Insert | `insert(parentKey, index, ...values)`, `insertBefore(key, ...values)`, `insertAfter(key, ...values)`, `append(parentKey, ...values)`, `prepend(parentKey, ...values)` |
| Remove | `remove(...keys)`, `removeSelectedItems()` |
| Move | `move(key, toParentKey, index)`, `moveBefore(key, keys)`, `moveAfter(key, keys)` |
| Update | `update(key, newValue)`; a value only, no function form |

Docs and types differ: the types have no `'all'` in `selectedKeys`, so guard for `'all'` as the example does. The docs removal examples call `list.remove`; on this hook it is `tree.remove`.

## Virtualizer

Renders only the visible items of a large collection and reuses them during scroll. Wrap ListBox, GridList, Table, or Tree. Pick it for hundreds of items or more.

```tsx
import {Virtualizer, ListLayout} from 'react-aria-components/Virtualizer';
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';

let items = Array.from({length: 5000}, (_, id) => ({id, name: `Item ${id}`}));

<Virtualizer layout={ListLayout} layoutOptions={{rowSize: 32, padding: 4, gap: 4}}>
  <ListBox
    aria-label="Items"
    selectionMode="multiple"
    items={items}
    style={{display: 'block', padding: 0, height: 400, overflow: 'auto'}}>
    {item => <ListBoxItem style={{height: '100%'}}>{item.name}</ListBoxItem>}
  </ListBox>
</Virtualizer>
```

Virtualizer props:

- `layout`: a layout class or instance.
- `layoutOptions`: options for that layout.
- `shouldObserveItemSize`: re-measure items with a `ResizeObserver` when they change size, for example on expand. This has a performance cost, so enable it only when needed.
- `children`: one collection component.

Layout rules:

- The layout positions all items. CSS flexbox and grid do not apply to them.
- For its own scroll area, give the collection a height (or a width when horizontal) and overflow. With no scroll area of its own, it scrolls with the page (window scrolling, added in v1.17). Set `display: block` on the root to drop flex or grid styles, and remove its padding; use the `padding` option instead.
- Layouts import from `react-aria-components/Virtualizer`, along with `Size`, `Rect`, `Point`, `LayoutInfo`, and `Layout` for custom layouts.
- Variable sizes need an estimate so the scrollbar size is right.

### ListLayout

Items in a stack along one axis. Works with ListBox, GridList, Tree, Menu.

| Option | Default | Meaning |
| --- | --- | --- |
| `orientation` | `'vertical'` | Stack axis. Set the same `orientation` on the collection so keyboard navigation matches. |
| `rowSize` | 48 | Fixed row size in px on the axis. |
| `estimatedRowSize` | none | Estimate for variable rows. |
| `headingSize` | 48 | Fixed section header size. |
| `estimatedHeadingSize` | none | Estimate for variable headers. |
| `loaderSize` | 48 | Size of a load-more item. |
| `gap` | 0 | Gap between items. |
| `padding` | 0 | Padding around the list. |
| `dropIndicatorThickness` | 2 | Drop indicator thickness. |
| `anchorTo` | none | `'end'` pins the viewport to the end unless the user scrolls up, for chat-like lists. |
| `scrollEndThreshold` | 0 | Max px from the end that still counts as "near the end" for `anchorTo`. |

`rowHeight`, `estimatedRowHeight`, `headingHeight`, `estimatedHeadingHeight`, and `loaderHeight` are deprecated on `ListLayout`. The docs dynamic-size example still uses `estimatedRowHeight`. Use `estimatedRowSize`.

### GridLayout

Equal-size cells. The cell size falls between a minimum and a maximum, based on the container width. Set `layout="grid"` on the ListBox or GridList so keyboard navigation is right.

```tsx
import {Virtualizer, GridLayout, Size} from 'react-aria-components/Virtualizer';
import {GridList, GridListItem} from 'react-aria-components/GridList';

let albums = [{id: 1, title: 'Euphoric Echoes'}];

<Virtualizer
  layout={GridLayout}
  layoutOptions={{minItemSize: new Size(160, 200), minSpace: new Size(8, 8), maxColumns: 6}}>
  <GridList
    layout="grid"
    aria-label="Albums"
    items={albums}
    style={{display: 'block', padding: 0, height: 400, overflow: 'auto'}}>
    {album => <GridListItem textValue={album.title}>{album.title}</GridListItem>}
  </GridList>
</Virtualizer>
```

Options (`GridLayoutOptions` in the types): `minItemSize` (default 200 x 200), `maxItemSize` (Infinity), `preserveAspectRatio` (false; when true all rows are equal in height), `minSpace` (18 x 18), `maxHorizontalSpace` (Infinity), `maxColumns` (Infinity), `dropIndicatorThickness` (2), `loaderHeight` (48), `direction` (`'ltr' | 'rtl'`; set `'rtl'` so `before` and `after` drop targets are correct in RTL grids).

The docs table lists `cardOrientation`, `itemPadding`, and `margin`, with other defaults. Those are not in the installed types. Follow the types.

### WaterfallLayout

Variable-height items in columns, for image galleries. Column width falls between the minimum and maximum. Set `layout="grid"` on the collection. Give images an `aspect-ratio` so size is known before they load.

```tsx
import {Virtualizer, WaterfallLayout, Size} from 'react-aria-components/Virtualizer';
import {GridList, GridListItem} from 'react-aria-components/GridList';

let images = [{id: 1, title: 'Forest', src: '/forest.jpg', aspectRatio: 0.66}];

<Virtualizer layout={WaterfallLayout} layoutOptions={{minItemSize: new Size(150, 150), minSpace: new Size(8, 8)}}>
  <GridList
    layout="grid"
    aria-label="Photos"
    items={images}
    style={{display: 'block', padding: 0, height: 400, overflow: 'auto'}}>
    {image => (
      <GridListItem textValue={image.title}>
        <img src={image.src} alt="" style={{aspectRatio: image.aspectRatio}} />
      </GridListItem>
    )}
  </GridList>
</Virtualizer>
```

Options (`WaterfallLayoutOptions` in the types): `minItemSize`, `maxItemSize`, `minSpace`, `maxHorizontalSpace`, `maxColumns`, `dropIndicatorThickness`, `loaderHeight`. Same defaults as `GridLayout`. The docs give 240 x 136 for `minItemSize`; the types say 200 x 200.

### TableLayout

Rows and columns, with virtualization on both axes. For `Table` only.

```tsx
import {Virtualizer, TableLayout} from 'react-aria-components/Virtualizer';
import {Table, TableHeader, TableBody, Column, Row, Cell} from 'react-aria-components/Table';

let rows = Array.from({length: 1000}, (_, id) => ({id, name: `Row ${id}`, type: 'File'}));

<Virtualizer layout={TableLayout} layoutOptions={{rowHeight: 32, headingHeight: 32}}>
  <Table
    aria-label="Rows"
    selectionMode="multiple"
    style={{height: 300, width: '100%', overflow: 'auto', scrollPaddingTop: 32}}>
    <TableHeader>
      <Column isRowHeader>Name</Column>
      <Column>Type</Column>
    </TableHeader>
    <TableBody items={rows}>
      {item => (
        <Row>
          <Cell>{item.name}</Cell>
          <Cell>{item.type}</Cell>
        </Row>
      )}
    </TableBody>
  </Table>
</Virtualizer>
```

Options (`TableLayoutProps`): `rowHeight` (48), `estimatedRowHeight`, `headingHeight` (48), `estimatedHeadingHeight`, `loaderHeight` (48), `gap`, `padding`, `dropIndicatorThickness`, `columnWidths`. Unlike `ListLayout`, these `*Height` names are current here.

Use `scroll-padding-top` equal to the header height so keyboard focus does not hide rows under the sticky header.

### Dynamic item sizes

```tsx
let items = [{id: 1, name: 'Item 1'}];

<Virtualizer
  layout={ListLayout}
  layoutOptions={{estimatedRowSize: 25, gap: 4}}
  shouldObserveItemSize>
  <GridList
    aria-label="Expandable rows"
    items={items}
    style={{display: 'block', height: 400, overflow: 'auto'}}>
    {item => <GridListItem textValue={item.name}><ExpandableRow item={item} /></GridListItem>}
  </GridList>
</Virtualizer>
```

## Common mistakes

- Treating `onSelectionChange` as a `Set` without the `'all'` check.
- `selectedKeys` with no `selectionMode`. Nothing selects, because the mode defaults to `'none'`.
- Reading outside state in an `items` render function with no `dependencies`.
- Duplicate ids across sections.
- Mutating an item object. Replace it, or the cache keeps the old render.
- Passing `items` on the root and also a load-more item as a child. Use `Collection`.
- Missing `aria-label` on a collection with no visible label.
- Missing `textValue` on items whose children are not plain text.
- Flex or grid CSS on a virtualized root. The layout positions the items, so that CSS does nothing or breaks the list.
- `layout="grid"` missing with `GridLayout` or `WaterfallLayout`. Arrow keys then move as in a stack.
- `orientation="horizontal"` set on `ListLayout` but not on the collection.
- Using deprecated `ListLayout` height options in new code.
- Calling `useListData` or `useAsyncList` for data that another cache owns. Render that data with `items` and keep one source of truth.
