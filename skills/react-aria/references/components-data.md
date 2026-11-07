# Data collections: Table, GridList, Tree, NavigationTree

Selection fundamentals (`selectedKeys`, `selectionBehavior`, actions) and Virtualizer details live in `collections-selection.md`. Drag and drop lives in `drag-and-drop.md`. This file keeps only the component-specific parts.

## Contents

- [Which one to pick](#which-one-to-pick)
- [Shared rules](#shared-rules)
- [Table](#table)
- [GridList](#gridlist)
- [Tree](#tree)
- [NavigationTree](#navigationtree)
- [Common mistakes](#common-mistakes)

## Which one to pick

| Need | Use |
|------|-----|
| Rows and columns, sorting, resizing, optional nested rows | `Table` |
| Flat list or card grid with interactive children in each item | `GridList` |
| Always-visible options with text only | `ListBox` (see `components-pickers.md`) |
| Nested hierarchy with selection, actions, or drag and drop (file tree) | `Tree` |
| Sidebar of nested links with a current page | `NavigationTree` |

## Shared rules

- The docs' short examples use starter wrappers. Those add props and parts the real components do not have:
  - `Column allowsResizing`, automatic checkbox and drag columns, automatic chevrons.
  - `TreeItem title`, automatic `TreeItemContent`.
  - `NavigationTree renderLink`, `NavigationTreeItemLink`.
  - The real components need you to render those parts. The sections below show how.
- Label every collection with `aria-label` or `aria-labelledby`. A section without a header needs `aria-label`.
- Mix dynamic rows with a load-more sentinel through `<Collection items={...}>`, not through `items` on the parent.
- Dynamic rendering is cached by item object identity. Pass outside state the render function reads in `dependencies` (for example `dependencies={[visibleColumns]}`).
- Item render props and data attributes (rows and items): `isHovered` `[data-hovered]`, `isPressed` `[data-pressed]`, `isSelected` `[data-selected]`, `isFocused` `[data-focused]`, `isFocusVisible` `[data-focus-visible]`, `isDisabled` `[data-disabled]`, `selectionMode` `[data-selection-mode]`, `selectionBehavior`, `allowsDragging` `[data-allows-dragging]`, `isDragging` `[data-dragging]`, `isDropTarget` `[data-drop-target]`. Link items also carry `[data-href]`.
- Slots: `<Checkbox slot="selection" />` selects the item, `<Button slot="drag" />` is the drag handle, `<Button slot="chevron" />` expands the item. `SelectionIndicator` can replace the checkbox. `Button` and `Checkbox` are exported by each component's subpath.
- Links: `href` on `Row`, `GridListItem`, or `TreeItem`. Because of an HTML spec limit, these can not be `<a>` elements. React Aria handles the click with JavaScript and triggers native navigation. For a client-side router, use `onAction` to navigate instead of `href`. Link behavior varies with `selectionBehavior`; see `collections-selection.md`.
- `keyboardNavigationBehavior: 'arrow' | 'tab'` (default `'arrow'`) exists on `Table`, `GridList`, and `Tree`. `arrow` moves focus into cells or rows with arrow keys. `tab` makes Tab move in and out. Use `tab` when children are text fields, so arrows and typing do not trigger grid navigation or selection.
- Async pattern: `useAsyncList` from `react-aria-components/useAsyncList`, `renderEmptyState` for the first load, and a `*LoadMoreItem` at the end. Its props: `onLoadMore`, `isLoading`, `scrollOffset` (default `1`, a percentage of the visible height). The parent must scroll, so give it a height and overflow.

## Table

Rows and columns with full keyboard navigation, row selection, sorting, resizing, and nested rows.

Doc: https://react-aria.adobe.com/Table

```tsx
import {ResizableTableContainer, Table, TableHeader, Column, ColumnResizer, TableBody, Row, Cell, TableFooter, TableLoadMoreItem, Checkbox, Button, SelectionIndicator} from 'react-aria-components/Table';

<ResizableTableContainer>
  <Table aria-label="Files" selectionMode="multiple" treeColumn="name">
    <TableHeader>
      <Column width={20} minWidth={20} />
      <Column width={32} minWidth={32} focusMode="child" allowsArrowNavigation>
        <Checkbox slot="selection" />
      </Column>
      <Column id="name" isRowHeader>Name<ColumnResizer /></Column>
      <Column id="size">Size</Column>
    </TableHeader>
    <TableBody>
      <Row id="docs">
        <Cell><Button slot="drag" aria-label="Drag">≡</Button></Cell>
        <Cell focusMode="child" allowsArrowNavigation><Checkbox slot="selection" /></Cell>
        <Cell><Button slot="chevron" aria-label="Expand">›</Button>Documents</Cell>
        <Cell>—</Cell>
        <Row id="report">
          <Cell><Button slot="drag" aria-label="Drag">≡</Button></Cell>
          <Cell focusMode="child" allowsArrowNavigation><SelectionIndicator /></Cell>
          <Cell>Report</Cell>
          <Cell>20 KB</Cell>
        </Row>
      </Row>
      <TableLoadMoreItem />
    </TableBody>
    <TableFooter>
      <Row>
        <Cell colSpan={3}>Total</Cell>
        <Cell>20 KB</Cell>
      </Row>
    </TableFooter>
  </Table>
</ResizableTableContainer>
```

Key props:

- `Table`:
  - Selection: `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `selectionBehavior`, `disallowEmptySelection`, `disabledKeys`, `disabledBehavior: 'all' | 'selection'` (default `'all'`), `shouldSelectOnPressUp`, `escapeKeyBehavior`.
  - Actions: `onRowAction(key)`.
  - Sorting: `sortDescriptor`, `onSortChange(descriptor)`.
  - Nesting: `treeColumn`, `expandedKeys` / `defaultExpandedKeys`, `onExpandedChange(keys)`.
  - Other: `keyboardNavigationBehavior`, `dragAndDropHooks`, `aria-label`.
- `TableHeader`: `columns`, `dependencies`, hover events.
- `Column`: `id`, `isRowHeader`, `allowsSorting`, `textValue`, `width`, `defaultWidth`, `minWidth`, `maxWidth`, `focusMode: 'child' | 'cell'`, `allowsArrowNavigation`.
- `TableBody`: `items`, `dependencies`, `renderEmptyState(renderProps)`.
- `Row`: `id`, `columns`, `dependencies`, `textValue`, `isDisabled`, `disabledBehavior`, `hasChildItems`, `onAction`, `value`, link props, press and hover events.
- `Cell`: `id`, `textValue`, `colSpan`, `focusMode`, `allowsArrowNavigation`.
- `TableFooter`: `items`, `dependencies`.
- `TableLoadMoreItem`: `onLoadMore`, `isLoading`, `scrollOffset`, `direction: 'end' | 'start'` (default `'end'`; `start` loads older content when scrolling up).

Styling:

| Part | Class | Data attributes | Other render values |
|------|-------|-----------------|---------------------|
| `Table` | `react-aria-Table` | `data-focused`, `data-focus-visible`, `data-drop-target` | `state` |
| `TableHeader` | `react-aria-TableHeader` | `data-hovered` | |
| `Column` | `react-aria-Column` | `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-allows-sorting`, `data-sort-direction`, `data-resizing` | `sort(direction)`, `startResize()` |
| `ColumnResizer` | `react-aria-ColumnResizer` | `data-hovered`, `data-focused`, `data-focus-visible`, `data-resizing`, `data-resizable-direction="right \| left \| both"` | |
| `TableBody` | `react-aria-TableBody` | `data-empty`, `data-drop-target` | |
| `Row` | `react-aria-Row` | shared item attributes, `data-focus-visible-within`, `data-expanded`, `data-has-child-items`, `data-level` | `id`, `state` |
| `Cell` | `react-aria-Cell` | `data-pressed`, `data-focused`, `data-focus-visible`, `data-hovered`, `data-selected`, `data-disabled`, `data-focus-visible-within-row`, `data-tree-column`, `data-expanded`, `data-has-child-items`, `data-level` | `id`, `columnIndex` |
| `TableFooter` | `react-aria-TableFooter` | | |
| `ResizableTableContainer` | `react-aria-ResizableTableContainer` | | |
| `TableLoadMoreItem` | `react-aria-TableLoadingIndicator` | | |

CSS variable: `--table-row-level` (1-based) on nested rows. Indent the tree column with it:

```css
.react-aria-Cell[data-tree-column] {
  padding-inline-start: calc((var(--table-row-level) - 1) * 16px);
}
```

### Reusable selection and drag columns

`Table` does not add checkbox or drag columns. Add them in wrappers with `useTableOptions()`, which returns `selectionMode`, `selectionBehavior` (`null` when selection is off), `disallowEmptySelection`, and `allowsDragging`.

```tsx
import {Collection, Column, TableHeader, Row, Cell, Checkbox, Button, useTableOptions, type TableHeaderProps, type RowProps} from 'react-aria-components/Table';

function MyTableHeader<T extends object>({columns, children, ...props}: TableHeaderProps<T>) {
  let {selectionBehavior, selectionMode, allowsDragging} = useTableOptions();
  return (
    <TableHeader {...props}>
      {allowsDragging && <Column width={20} minWidth={20} />}
      {selectionBehavior === 'toggle' && (
        <Column width={32} minWidth={32} focusMode="child" allowsArrowNavigation>
          {selectionMode === 'multiple' && <Checkbox slot="selection" />}
        </Column>
      )}
      <Collection items={columns}>{children}</Collection>
    </TableHeader>
  );
}

function MyRow<T extends object>({id, columns, children, ...props}: RowProps<T>) {
  let {selectionBehavior, allowsDragging} = useTableOptions();
  return (
    <Row id={id} {...props}>
      {allowsDragging && <Cell><Button slot="drag" aria-label="Drag">≡</Button></Cell>}
      {selectionBehavior === 'toggle' && (
        <Cell focusMode="child" allowsArrowNavigation><Checkbox slot="selection" /></Cell>
      )}
      <Collection items={columns}>{children}</Collection>
    </Row>
  );
}
```

- Each `Row` needs one `Cell` for each `Column`, so add the extra cell and the extra column together.
- `selectionBehavior="replace"` has no checkboxes: click replaces the selection.
- Mark one data column with `isRowHeader`. Screen readers announce it during row navigation.

### Dynamic rows and columns

```tsx
import {Table, TableHeader, Column, TableBody, Row, Cell} from 'react-aria-components/Table';

declare const visibleColumns: {id: string, name: string, isRowHeader?: boolean}[];
declare const rows: {id: number, [key: string]: any}[];

<Table aria-label="Invoices">
  <TableHeader columns={visibleColumns}>
    {column => <Column isRowHeader={column.isRowHeader}>{column.name}</Column>}
  </TableHeader>
  <TableBody items={rows} dependencies={[visibleColumns]}>
    {item => (
      <Row columns={visibleColumns}>
        {column => <Cell>{item[column.id]}</Cell>}
      </Row>
    )}
  </TableBody>
</Table>
```

Without `dependencies={[visibleColumns]}`, cached rows keep the old columns.

### Sorting

Table does not sort data. Set `allowsSorting` on columns, sort the rows in `onSortChange`, and pass `sortDescriptor` back. `SortDescriptor` is `{column: Key, direction: 'ascending' | 'descending'}`. Render the indicator from the `sortDirection` render prop.

```tsx
import {useState} from 'react';
import {Table, TableHeader, Column, TableBody, Row, Cell, type SortDescriptor} from 'react-aria-components/Table';

declare const rows: {id: number, name: string, level: number}[];

function SortableTable() {
  let [sort, setSort] = useState<SortDescriptor>({column: 'name', direction: 'ascending'});
  let sorted = [...rows].sort((a, b) => {
    let column = sort.column as 'name' | 'level';
    let cmp = a[column] < b[column] ? -1 : 1;
    return sort.direction === 'descending' ? -cmp : cmp;
  });

  return (
    <Table aria-label="Pokemon" sortDescriptor={sort} onSortChange={setSort}>
      <TableHeader>
        <Column id="name" isRowHeader allowsSorting>
          {({allowsSorting, sortDirection}) => (
            <>
              Name
              {allowsSorting && <span aria-hidden>{sortDirection === 'ascending' ? '▲' : '▼'}</span>}
            </>
          )}
        </Column>
        <Column id="level" allowsSorting>Level</Column>
      </TableHeader>
      <TableBody items={sorted}>
        {item => (
          <Row>
            <Cell>{item.name}</Cell>
            <Cell>{item.level}</Cell>
          </Row>
        )}
      </TableBody>
    </Table>
  );
}
```

With `useAsyncList`, pass `sort` to its options and use `list.sortDescriptor` and `list.sort`.

### Column resizing

Wrap the table in `ResizableTableContainer` and render `<ColumnResizer />` inside each resizable column. There is no `allowsResizing` prop on the real `Column`.

- `width`, `defaultWidth`, `minWidth`, `maxWidth` apply only inside `ResizableTableContainer`.
- `width` and `defaultWidth` take pixels, percentages, or `fr`. `minWidth` and `maxWidth` take static sizes. The default width is `1fr`.
- The container needs CSS `overflow: auto` and `position: relative`. The docs' starter sets them.
- `ColumnResizer` takes `aria-label` for a custom label. The column's `startResize()` render prop starts a resize from your own UI, such as a column menu.
- Container events receive `Map<Key, ColumnSize>` with the widths of all columns: `onResizeStart`, `onResize` (on each move), `onResizeEnd`.

```tsx
import {useState} from 'react';
import {ResizableTableContainer, Table, TableHeader, Column, ColumnResizer, TableBody, Row, Cell, type Key} from 'react-aria-components/Table';
import type {ColumnSize} from 'react-stately/useTableState';

declare const columns: {id: string, name: string}[];
declare const rows: {id: number, file: string, size: string}[];

function PersistedWidths() {
  let [widths, setWidths] = useState(new Map<Key, ColumnSize>([['file', '1fr'], ['size', 80]]));

  return (
    <ResizableTableContainer onResize={setWidths} onResizeEnd={saved => localStorage.setItem('widths', JSON.stringify([...saved]))}>
      <Table aria-label="Files">
        <TableHeader columns={columns} dependencies={[widths]}>
          {column => (
            <Column isRowHeader={column.id === 'file'} width={widths.get(column.id)}>
              {column.name}
              <ColumnResizer />
            </Column>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {item => (
            <Row>
              <Cell>{item.file}</Cell>
              <Cell>{item.size}</Cell>
            </Row>
          )}
        </TableBody>
      </Table>
    </ResizableTableContainer>
  );
}
```

`dependencies={[widths]}` is needed because the column render function reads the widths. The docs read and write `localStorage` through `useSyncExternalStore` so the server render stays stable. Do that in SSR apps.

### Sticky header

There is no prop. Make the scroll parent `overflow: auto` with a height, and stick the header. It needs a solid background, or rows show through.

```tsx
import {Table, TableHeader, Column, TableBody} from 'react-aria-components/Table';

<div style={{height: 300, overflow: 'auto'}}>
  <Table aria-label="Characters" style={{tableLayout: 'fixed', width: '100%'}}>
    <TableHeader style={{position: 'sticky', top: 0, zIndex: 1, background: 'white'}}>
      <Column isRowHeader>Name</Column>
    </TableHeader>
    <TableBody>{[]}</TableBody>
  </Table>
</div>
```

Or in CSS: `.react-aria-TableHeader {position: sticky; top: 0; z-index: 10}`, with `white-space: nowrap; overflow: hidden; text-overflow: ellipsis` on cells.

### Nested rows

Set `treeColumn` to a column `id`. Nest `Row` inside `Row` recursively with `Collection`. Put a `<Button slot="chevron">` in that column's cells. `Row.hasChildItems` marks a row as expandable before its children have loaded.

```tsx
import {useState} from 'react';
import {Table, TableHeader, Column, TableBody, Row, Cell, Button, Collection, type Key} from 'react-aria-components/Table';

declare const rows: {id: string, title: string, type: string, children: any[]}[];

function FileTable() {
  let [expandedKeys, setExpandedKeys] = useState(new Set<Key>(['1']));
  return (
    <Table aria-label="Files" treeColumn="name" expandedKeys={expandedKeys} onExpandedChange={setExpandedKeys}>
      <TableHeader>
        <Column id="name" isRowHeader>Name</Column>
        <Column id="type">Type</Column>
      </TableHeader>
      <TableBody items={rows}>
        {function renderItem(item) {
          return (
            <Row id={item.id}>
              <Cell>
                {({hasChildItems, isTreeColumn}) => (
                  <>
                    {isTreeColumn && hasChildItems && <Button slot="chevron" aria-label="Expand">›</Button>}
                    {item.title}
                  </>
                )}
              </Cell>
              <Cell>{item.type}</Cell>
              <Collection items={item.children}>{renderItem}</Collection>
            </Row>
          );
        }}
      </TableBody>
    </Table>
  );
}
```

### Nested columns

The `Table` docs and the `react-aria-components` types have no grouped column headers. `childColumns` exists only in the lower-level `react-stately` column type. `Column` has no such prop. Use nested rows, or a custom header, instead.

### Empty state and async loading

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {Table, TableHeader, Column, TableBody, Row, Cell, TableLoadMoreItem, Collection} from 'react-aria-components/Table';

function AsyncTable() {
  let list = useAsyncList<{name: string, height: number}>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || '/api/people', {signal});
      let json = await res.json();
      return {items: json.results, cursor: json.next};
    }
  });

  return (
    <div style={{height: 150, overflow: 'auto'}}>
      <Table aria-label="Characters" style={{tableLayout: 'fixed', width: '100%'}}>
        <TableHeader style={{position: 'sticky', top: 0, zIndex: 1, background: 'white'}}>
          <Column id="name" isRowHeader>Name</Column>
          <Column id="height">Height</Column>
        </TableHeader>
        <TableBody renderEmptyState={() => list.isLoading ? 'Loading' : 'No results found.'}>
          <Collection items={list.items}>
            {item => (
              <Row id={item.name}>
                <Cell>{item.name}</Cell>
                <Cell>{item.height}</Cell>
              </Row>
            )}
          </Collection>
          <TableLoadMoreItem onLoadMore={list.loadMore} isLoading={list.loadingState === 'loadingMore'}>
            Loading more
          </TableLoadMoreItem>
        </TableBody>
      </Table>
    </div>
  );
}
```

Static empty table: `<TableBody renderEmptyState={() => 'No results found.'}>{[]}</TableBody>`. Style with `.react-aria-TableBody[data-empty]`.

### Virtualized tables

Wrap in `Virtualizer` with `TableLayout` from `react-aria-components/Virtualizer`. The virtualized table scrolls itself and renders positioned rows, so give `Table` a height and `overflow: auto`. Rows and headers take size from the layout, so set `width` and `height` to inherit. `scrollPaddingTop` keeps keyboard focus clear of the header.

```tsx
import {Virtualizer, TableLayout} from 'react-aria-components/Virtualizer';
import {Table, TableHeader, Column, TableBody, Row, Cell} from 'react-aria-components/Table';

declare const rows: {id: number, foo: string, bar: string}[];

<Virtualizer layout={TableLayout} layoutOptions={{rowHeight: 32, headingHeight: 32, padding: 4, gap: 4}}>
  <Table aria-label="Virtualized table" selectionMode="multiple" style={{width: '100%', height: 300, overflow: 'auto', scrollPaddingTop: 38}}>
    <TableHeader style={{width: '100%', height: '100%'}}>
      <Column isRowHeader>Foo</Column>
      <Column>Bar</Column>
    </TableHeader>
    <TableBody items={rows}>
      {item => (
        <Row style={{width: 'inherit', height: 'inherit'}}>
          <Cell>{item.foo}</Cell>
          <Cell>{item.bar}</Cell>
        </Row>
      )}
    </TableBody>
  </Table>
</Virtualizer>
```

`TableLayout` options:

- `rowHeight` (default `48`). For variable heights, set `estimatedRowHeight`, which sizes the scrollbar.
- `headingHeight` (default `48`), `estimatedHeadingHeight`.
- `loaderHeight` (default `48`), for load-more rows.
- `padding` (default `0`), `gap` (default `0`), `dropIndicatorThickness` (default `2`).

More in `collections-selection.md`.

### Selection, row actions, and links

- `onRowAction(key)` on the table or `onAction()` on a `Row`. In `toggle` behavior with nothing selected, a click or Enter runs the action. In `replace` behavior, a double click runs it.
- `isDisabled` on a `Row`, or `disabledKeys` on the table. `disabledBehavior="selection"` keeps actions working on disabled rows.
- `<Row href="..." target="_blank">`. See the link rules in [Shared rules](#shared-rules).

### Keyboard navigation with inputs

```tsx
import {Table, TableHeader, Column, TableBody, Row, Cell} from 'react-aria-components/Table';
import {TextField, Input} from 'react-aria-components/TextField';

<Table aria-label="Shared files" keyboardNavigationBehavior="tab" selectionMode="multiple">
  <TableHeader>
    <Column isRowHeader>Name</Column>
    <Column>Notes</Column>
  </TableHeader>
  <TableBody>
    <Row id="report">
      <Cell>Report</Cell>
      <Cell><TextField aria-label="Report notes"><Input placeholder="Enter notes" /></TextField></Cell>
    </Row>
  </TableBody>
</Table>
```

`allowsArrowNavigation` on a `Column` or `Cell` keeps arrow keys working while focus is on a child, even in `tab` mode. The selection cell uses it. `focusMode` picks whether the cell or its first focusable child gets focus. It defaults to `'child'` in arrow mode and `'cell'` in tab mode.

### Drag handle and drag and drop

Pass `dragAndDropHooks` to `Table`, then render `<Button slot="drag">` in a cell, with a matching empty `Column`. `useTableOptions().allowsDragging` tells a wrapper when to add them. Tree tables use `useTreeData` and `onMove`. See `drag-and-drop.md`.

`Table` can also be filtered with `Autocomplete`. See `components-pickers.md`.

## GridList

A list or grid of items that may contain interactive children, with keyboard navigation, selection, and actions. Pick it over `ListBox` when items hold buttons, links, or fields. Pick it over `Table` when there are no columns.

Doc: https://react-aria.adobe.com/GridList

```tsx
import {GridList, GridListItem, GridListLoadMoreItem, Checkbox, Button, Text} from 'react-aria-components/GridList';

declare const images: {id: number, title: string, user: string, src: string}[];

<GridList aria-label="Nature photos" layout="grid" selectionMode="multiple" items={images}>
  {image => (
    <GridListItem textValue={image.title}>
      {({selectionMode, selectionBehavior, allowsDragging}) => (
        <>
          {allowsDragging && <Button slot="drag" aria-label="Drag">≡</Button>}
          {selectionMode === 'multiple' && selectionBehavior === 'toggle' && <Checkbox slot="selection" />}
          <img src={image.src} alt="" />
          <Text>{image.title}</Text>
          <Text slot="description">By {image.user}</Text>
        </>
      )}
    </GridListItem>
  )}
</GridList>
```

Key props:

- `GridList`:
  - Collection: `items`, `dependencies`, `disabledKeys`, `disabledBehavior`, `renderEmptyState(renderProps)`.
  - Selection: `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `selectionBehavior`, `disallowEmptySelection`, `shouldSelectOnPressUp`, `escapeKeyBehavior`.
  - Actions: `onAction(key)`.
  - Layout: `layout: 'stack' | 'grid'` (default `'stack'`), `orientation: 'vertical' | 'horizontal'` (default `'vertical'`).
  - Keyboard: `keyboardNavigationBehavior`, `disallowTypeAhead` (default `false`).
  - Other: `dragAndDropHooks`.
- `GridListItem`: `id`, `textValue` (needed for rich children), `isDisabled`, `onAction`, `value`, `focusMode: 'row' | 'child'` (default `'row'`), `allowsArrowNavigation`, link props, press and hover events.
- `GridListSection`: `items`, `dependencies`, `aria-label`, `value`. `GridListHeader` labels it and takes HTML attributes.
- `GridListLoadMoreItem`: `onLoadMore`, `isLoading`, `scrollOffset`.

Styling:

- Classes: `react-aria-GridList`, `react-aria-GridListItem`, `react-aria-GridListSection`, `react-aria-GridListLoadingIndicator`.
- `GridList`: `[data-empty]`, `[data-focused]`, `[data-focus-visible]`, `[data-drop-target]`, `[data-layout="stack | grid"]`, `[data-orientation="vertical | horizontal"]`. Render values also include `state`.
- `GridListItem`: shared item attributes, `[data-focus-visible-within]`. Render values also include `id` and `state`.
- `Text[slot="description"]`, `Button[slot="drag"]`, `Checkbox[slot="selection"]` are style hooks.

### Layouts

`layout` and `orientation` change keyboard navigation and drag and drop. You write the CSS, keyed on `[data-layout]` and `[data-orientation]`. The docs' starter defaults to `layout="grid"`; the real default is `stack`.

For virtualized grids, use `Virtualizer` with `ListLayout`, `GridLayout`, or `WaterfallLayout`. See `collections-selection.md`.

### Async loading

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {GridList, GridListItem, GridListLoadMoreItem, Collection, Text} from 'react-aria-components/GridList';

type Photo = {id: string, description: string, urls: {regular: string}};

function Photos() {
  let list = useAsyncList<Photo, number | null>({
    async load({signal, cursor, items}) {
      let page = cursor || 1;
      let res = await fetch(`/api/photos?page=${page}`, {signal});
      let next: Photo[] = await res.json();
      // APIs may repeat items across pages, and duplicate ids break a collection.
      let seen = new Set(items.map(i => i.id));
      next = next.filter(i => !seen.has(i.id));
      return {items: next, cursor: next.length ? page + 1 : null};
    }
  });

  return (
    <GridList aria-label="Photos" layout="grid" style={{height: 400, overflow: 'auto'}} renderEmptyState={() => 'Loading'}>
      <Collection items={list.items}>
        {item => (
          <GridListItem textValue={item.description}>
            <img src={item.urls.regular} alt="" />
            <Text>{item.description}</Text>
          </GridListItem>
        )}
      </Collection>
      <GridListLoadMoreItem onLoadMore={list.loadMore} isLoading={list.loadingState === 'loadingMore'}>
        Loading more
      </GridListLoadMoreItem>
    </GridList>
  );
}
```

### Sections (alpha)

```tsx
import {GridList, GridListItem, GridListHeader, GridListSection} from 'react-aria-components/GridList';

<GridList layout="grid" aria-label="Photos">
  <GridListSection>
    <GridListHeader>Fruit</GridListHeader>
    <GridListItem textValue="Apple">Apple</GridListItem>
  </GridListSection>
</GridList>
```

### Keyboard navigation with inputs

Set `keyboardNavigationBehavior="tab"` on the list. Tab then moves in and out of an item, and `TextField` keeps its keys.

```tsx
import {GridList, GridListItem, Text} from 'react-aria-components/GridList';
import {TextField, Input} from 'react-aria-components/TextField';

<GridList aria-label="Shared files" keyboardNavigationBehavior="tab" selectionMode="multiple">
  <GridListItem id="sunset" textValue="Sunset">
    <TextField aria-label="Title" defaultValue="Sunset"><Input /></TextField>
    <Text slot="description">PNG</Text>
  </GridListItem>
</GridList>
```

### Other features

- Empty state: `renderEmptyState={() => 'No results found.'}` with `{[]}` as children.
- Links: `<GridListItem href={...} target="_blank" textValue={...}>`. See [Shared rules](#shared-rules).
- Filtering: wrap in `Autocomplete`. See `components-pickers.md`.
- Drag and drop: `dragAndDropHooks` and `<Button slot="drag">`. See `drag-and-drop.md`.

## Tree

Nested hierarchical rows with keyboard navigation, selection, and expansion. Pick `NavigationTree` for site navigation.

Doc: https://react-aria.adobe.com/Tree

```tsx
import {Tree, TreeItem, TreeItemContent, TreeSection, TreeHeader, TreeLoadMoreItem, Button, Checkbox} from 'react-aria-components/Tree';

<Tree aria-label="Files" selectionMode="multiple" defaultExpandedKeys={['docs']}>
  <TreeSection>
    <TreeHeader>Personal</TreeHeader>
    <TreeItem id="docs" textValue="Documents">
      <TreeItemContent>
        {({selectionMode, selectionBehavior, allowsDragging}) => (
          <>
            {allowsDragging && <Button slot="drag" aria-label="Drag">≡</Button>}
            {selectionBehavior === 'toggle' && selectionMode !== 'none' && <Checkbox slot="selection" />}
            <Button slot="chevron" aria-label="Expand">›</Button>
            Documents
          </>
        )}
      </TreeItemContent>
      <TreeItem id="report" textValue="Report">
        <TreeItemContent>Report</TreeItemContent>
      </TreeItem>
    </TreeItem>
  </TreeSection>
  <TreeLoadMoreItem />
</Tree>
```

Key props:

- `Tree`:
  - Collection: `items`, `dependencies`, `disabledKeys`, `disabledBehavior`, `renderEmptyState(renderProps)`.
  - Expansion: `expandedKeys` / `defaultExpandedKeys` (`Iterable<Key>`), `onExpandedChange(keys: Set<Key>)`.
  - Selection: `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `selectionBehavior`, `disallowEmptySelection`, `shouldSelectOnPressUp`, `escapeKeyBehavior`.
  - Actions: `onAction(key)`.
  - Other: `keyboardNavigationBehavior`, `dragAndDropHooks`.
- `TreeItem`: `id`, `textValue` (required), `hasChildItems`, `isDisabled`, `onAction`, `value`, `focusMode: 'child' | 'row'` (default `'row'`), `allowsArrowNavigation`, `aria-label`, link props, press and hover events.
- `TreeItemContent`: only `children`, as nodes or a render function.
- `TreeSection`: `items`, `dependencies`, `aria-label`, `value`, `className`. `TreeHeader` takes DOM attributes.
- `TreeLoadMoreItem`: `onLoadMore`, `isLoading`, `scrollOffset`.

Styling:

- Classes: `react-aria-Tree`, `react-aria-TreeItem`, `react-aria-TreeLoader`.
- `Tree`: `[data-empty]`, `[data-focused]`, `[data-focus-visible]`, `[data-selection-mode]`, `[data-allows-dragging]`, `[data-drop-target]`.
- `TreeItem`: shared item attributes, `[data-expanded]`, `[data-has-child-items]`, `[data-level]`, `[data-focus-visible-within]`. Render values also include `state` and `id`.
- `TreeLoadMoreItem`: `[data-level]`.
- CSS variable `--tree-item-level` (1-based) drives indentation.

```css
.react-aria-TreeItem {
  padding-inline-start: calc((var(--tree-item-level) - 1) * 16px);

  .react-aria-Button[slot='chevron'] {
    visibility: hidden;
  }
  &[data-has-child-items] .react-aria-Button[slot='chevron'] {
    visibility: visible;
  }
  &[data-expanded] .react-aria-Button[slot='chevron'] svg {
    rotate: 90deg;
  }
}
```

A `TreeItem` has two kinds of children: one `TreeItemContent` for its row, and nested `TreeItem`s. Render a `Button slot="chevron"` as the visible expand control. The docs keep it in every row and hide it on leaf rows with the CSS above, so rows stay aligned.

### Dynamic nested data

Name the render function so it can recurse through `Collection`.

```tsx
import {Tree, TreeItem, TreeItemContent, Button} from 'react-aria-components/Tree';
import {Collection} from 'react-aria-components/Collection';

type Node = {id: number, title: string, children: Node[]};
declare const items: Node[];

<Tree aria-label="Files" defaultExpandedKeys={[1]} items={items} selectionMode="multiple">
  {function renderItem(item: Node) {
    return (
      <TreeItem textValue={item.title}>
        <TreeItemContent>
          <Button slot="chevron" aria-label="Expand">›</Button>
          {item.title}
        </TreeItemContent>
        <Collection items={item.children}>{renderItem}</Collection>
      </TreeItem>
    );
  }}
</Tree>
```

Use `useTreeData` from `react-aria-components/useTreeData` when items change. Its nodes are `{key, value, children}`. See `drag-and-drop.md`.

### Load more in nested items

Put one `TreeLoadMoreItem` at the end of each `TreeItem` that pages its children. Each list has its own `useAsyncList`. The tree must have a height.

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {Tree, TreeItem, TreeItemContent, TreeLoadMoreItem} from 'react-aria-components/Tree';
import {Collection} from 'react-aria-components/Collection';

function AsyncTree() {
  let pokemon = useAsyncList<{name: string}>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', {signal});
      let json = await res.json();
      return {items: json.results, cursor: json.next};
    }
  });

  return (
    <Tree aria-label="Async tree" style={{height: 300, overflow: 'auto'}} renderEmptyState={() => 'Loading'}>
      <TreeItem id="pokemon" textValue="Pokemon" hasChildItems>
        <TreeItemContent>Pokemon</TreeItemContent>
        <Collection items={pokemon.items}>
          {item => (
            <TreeItem id={item.name} textValue={item.name}>
              <TreeItemContent>{item.name}</TreeItemContent>
            </TreeItem>
          )}
        </Collection>
        <TreeLoadMoreItem onLoadMore={pokemon.loadMore} isLoading={pokemon.loadingState === 'loadingMore'}>
          Loading more
        </TreeLoadMoreItem>
      </TreeItem>
    </Tree>
  );
}
```

`hasChildItems` shows the row as expandable before the children load.

### Other features

- Selection and actions: `selectedKeys`, `onSelectionChange`, `onAction`. `isDisabled` on a `TreeItem`.
- Links: `<TreeItem href=... target="_blank">`. See [Shared rules](#shared-rules).
- Empty state: `renderEmptyState={() => 'No results found.'}` with `{[]}` as children.
- Sections (alpha): `TreeSection` and `TreeHeader`.
- Inputs in rows: `keyboardNavigationBehavior="tab"`, with a `TextField` inside `TreeItemContent`.
- Drag and drop: `dragAndDropHooks`, `onMove`, and `useTreeData`. See `drag-and-drop.md`.

## NavigationTree

A tree of links for a sidebar, with a current route and no selection. Pick `Tree` when users select items.

Doc: https://react-aria.adobe.com/NavigationTree

```tsx
import {NavigationTree, NavigationTreeItem, NavigationTreeItemContent, NavigationTreeSection, NavigationTreeHeader, Link, Button} from 'react-aria-components/NavigationTree';

<nav aria-label="Main">
  <NavigationTree aria-label="Files" selectedRoute="/photos" defaultExpandedKeys={['files']}>
    <NavigationTreeSection>
      <NavigationTreeHeader>Workspace</NavigationTreeHeader>
      <NavigationTreeItem id="files" href="/files" textValue="Files">
        <NavigationTreeItemContent>
          {({hasChildItems}) => (
            <>
              <Link>Files</Link>
              <Button slot="chevron" aria-label="Expand" isDisabled={!hasChildItems} style={{visibility: hasChildItems ? undefined : 'hidden'}}>›</Button>
            </>
          )}
        </NavigationTreeItemContent>
        <NavigationTreeItem id="photos" href="/photos" textValue="Photos">
          <NavigationTreeItemContent>
            <Link>Photos</Link>
          </NavigationTreeItemContent>
        </NavigationTreeItem>
      </NavigationTreeItem>
    </NavigationTreeSection>
  </NavigationTree>
</nav>
```

Props:

- `NavigationTree`: `selectedRoute` (`string | null`, matched against each item's `href`), `items`, `dependencies`, `disabledKeys`, `expandedKeys` / `defaultExpandedKeys`, `onExpandedChange`, `aria-label`.
- `NavigationTreeItem`: `id`, `href`, `textValue` (required), `hasChildItems`, `isDisabled`, `focusMode`, `aria-label`, other link props, press and hover events.
- `NavigationTreeItemContent`: `children`, as nodes or a render function.
- `NavigationTreeSection`: `items`, `dependencies`, `aria-label`, `className`. `NavigationTreeHeader`: `className`.

The types omit from `NavigationTree`: all selection props, `disabledBehavior`, `keyboardNavigationBehavior`, `escapeKeyBehavior`, `shouldSelectOnPressUp`, `dragAndDropHooks`, `renderEmptyState`, `onAction`.

Styling:

- Classes: `react-aria-NavigationTree`, `react-aria-NavigationTreeItem`. The starter CSS also targets `.react-aria-NavigationTreeSection`, `.react-aria-NavigationTreeHeader`, and `.react-aria-Link`.
- `NavigationTree`: `[data-empty]`, `[data-focused]`, `[data-focus-visible]`.
- `NavigationTreeItem`: the `TreeItem` attributes plus `[data-current]` (its `href` matches `selectedRoute`) and `[data-current-ancestor]` (an ancestor of the current item, expanded or not). `[data-href]` marks items with a link.
- CSS variable `--tree-item-level` (1-based) drives indentation.

Behavior:

- The current item gets `aria-current="page"`.
- As main page navigation, put it in a `<nav aria-label="...">` landmark. The docs' short examples skip this wrapper.
- An item may leave out `href` and act as a pure folder. Style that row with `:not([data-href])`.
- Extra controls fit in a row. The docs' example puts a "More options" `Button` beside the `Link`.
- Use `[data-current-ancestor]:not([data-expanded])` to mark a collapsed parent of the current page.

### Client-side routers

Use the `render` prop on `Link` for your router's link component. This gives prefetching and avoids full page reloads. Get the current route from your framework and pass it as `selectedRoute`. The `Link` gets its `href` from the `NavigationTreeItem`.

The docs write `render={props => <RouterLink {...props} to={props.href} />}`. That does not typecheck: the render props are a union of `<span>` and `<a>` props, so narrow with `'href' in props`.

```tsx
import {NavigationTree, NavigationTreeItem, NavigationTreeItemContent, Link} from 'react-aria-components/NavigationTree';
import {Link as RouterLink, useLocation} from 'react-router';

function Sidebar() {
  let {pathname} = useLocation();
  return (
    <NavigationTree aria-label="Mail" selectedRoute={pathname}>
      <NavigationTreeItem href="/inbox" textValue="Inbox">
        <NavigationTreeItemContent>
          <Link render={props => 'href' in props ? <RouterLink {...props} to={props.href} /> : <span {...props} />}>Inbox</Link>
        </NavigationTreeItemContent>
      </NavigationTreeItem>
    </NavigationTree>
  );
}
```

In Next.js, use `usePathname()` from `next/navigation` for `selectedRoute`, and render `NextLink` the same way.

### Dynamic items

```tsx
import {NavigationTree, NavigationTreeItem, NavigationTreeItemContent, Link} from 'react-aria-components/NavigationTree';

declare const items: {id: string, url: string, label: string}[];

<NavigationTree aria-label="Sections" items={items} selectedRoute="/reports">
  {item => (
    <NavigationTreeItem href={item.url} textValue={item.label}>
      <NavigationTreeItemContent>
        <Link>{item.label}</Link>
      </NavigationTreeItemContent>
    </NavigationTreeItem>
  )}
</NavigationTree>
```

## Common mistakes

- Copying `allowsResizing` from the docs' examples. Render `<ColumnResizer />` inside the `Column`.
- Expecting `selectionMode` to add checkboxes. Render `<Checkbox slot="selection" />` yourself. A `Table` also needs the extra `Column`.
- Copying `<TreeItem title="...">`. Use `textValue` and `TreeItemContent`.
- Leaving out `<Button slot="chevron">` in a `Tree` or a `treeColumn` cell.
- Using `NavigationTreeItemLink` or `renderLink`. They do not exist in the package. Use `Link` with `render`.
- Using `width` on a `Column` outside `ResizableTableContainer`. It has no effect there.
- Expecting `allowsSorting` to sort. You sort the rows in `onSortChange`.
- Leaving `dependencies` out when columns or widths change.
- Adding a `*LoadMoreItem` to a collection with no scroll height, so it can not page on scroll.
- Using `href` on rows with a client-side router. Use `onAction` so it does not reload the page. `NavigationTree` uses `Link render` instead.
