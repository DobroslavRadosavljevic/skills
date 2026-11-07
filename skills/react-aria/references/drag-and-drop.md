# Drag and drop, DropZone, FileTrigger, and clipboard

Docs: `https://react-aria.adobe.com/dnd`, `/DropZone`, `/FileTrigger`, `/useDrag`, `/useDrop`, `/useDraggableCollection`, `/useDroppableCollection`, `/useClipboard`, `/blog/drag-and-drop`.

## Contents

1. [Which API to pick](#which-api-to-pick)
2. [Concepts](#concepts)
3. [useDragAndDrop options](#usedraganddrop-options)
4. [Enable it per collection component](#enable-it-per-collection-component)
5. [Drag source and drag data](#drag-source-and-drag-data)
6. [Drag preview](#drag-preview)
7. [Drop items: text, files, directories](#drop-items-text-files-directories)
8. [Drop positions and events](#drop-positions-and-events)
9. [Recipes](#recipes)
10. [Drop operations](#drop-operations)
11. [DropIndicator](#dropindicator)
12. [Styling states](#styling-states)
13. [Keyboard and screen reader](#keyboard-and-screen-reader)
14. [Virtualized collections and custom targets](#virtualized-collections-and-custom-targets)
15. [DropZone](#dropzone)
16. [FileTrigger](#filetrigger)
17. [useDrag](#usedrag)
18. [useDrop](#usedrop)
19. [useClipboard](#useclipboard)
20. [Low-level collection hooks](#low-level-collection-hooks)
21. [Common mistakes](#common-mistakes)

## Which API to pick

| Need | API |
| --- | --- |
| Reorder or move in ListBox, GridList, Tree, or Table; drag between them | `useDragAndDrop` |
| A box that accepts dropped or pasted files or text | `DropZone` (with `FileTrigger` for a browse button) |
| Open the file picker from a button | `FileTrigger` |
| One custom element as a drag source | `useDrag` |
| One custom element as a drop target | `useDrop` |
| Copy and paste rich data on a focusable element | `useClipboard` |
| A custom collection built with React Aria hooks | `useDraggableCollection`, `useDroppableCollection` |

Menu and TagGroup have no `dragAndDropHooks` prop.

Mouse and touch use the native HTML drag and drop API. So drags work between browser windows and with other apps, and users can drag in files from the device. Keyboard and screen reader drag is built by React Aria and works only inside the browser window. Add another way to do tasks that involve other apps, such as a file picker or copy and paste.

## Concepts

- **Drag source**: where the data comes from. Gives one or more drag items.
- **Drag item**: one object, in one or more data formats: `{[type: string]: string}`.
- **Drag preview**: the element under the pointer during a drag.
- **Drop target**: where the data goes.
- **Drop item**: what the target receives: `text`, `file`, or `directory`.
- **Drop operation**: `move`, `copy`, `link`, or `cancel`.

## useDragAndDrop options

```ts
import {
  useDragAndDrop,
  DropIndicator,
  isTextDropItem,
  isFileDropItem,
  isDirectoryDropItem,
  DIRECTORY_DRAG_TYPE
} from 'react-aria-components/useDragAndDrop';
```

Returns `{dragAndDropHooks}`. Pass it to the collection.

Drag side:

| Option | Type | Notes |
| --- | --- | --- |
| `getItems` | `(keys: Set<Key>, items: T[]) => DragItem[]` | With no `getItems`, the collection is not draggable. |
| `getAllowedDropOperations` | `() => DropOperation[]` | Default: all. |
| `renderDragPreview` | `(items: DragItem[]) => JSX.Element \| {element, x, y}` | Default: a copy of the dragged element. |
| `onDragStart`, `onDragMove` | event with `keys: Set<Key>` | |
| `onDragEnd` | event with `keys`, `dropOperation`, `isInternal` | Runs on a drop or a cancel. |

Drop side:

| Option | Type | Notes |
| --- | --- | --- |
| `acceptedDragTypes` | `'all' \| (string \| symbol)[]` | Default `'all'`. Dropped items are filtered to those with an accepted type. |
| `onRootDrop` | `{items, dropOperation}` | External drop on the whole collection. |
| `onItemDrop` | `{items, dropOperation, isInternal, target}` | Drop on an item. Internal or external. |
| `onInsert` | `{items, dropOperation, target}` | External drop between items. |
| `onReorder` | `{keys, dropOperation, target}` | Internal, between items, same level only. |
| `onMove` | `{keys, dropOperation, target}` | Internal, on or between items, any level. |
| `shouldAcceptItemDrop` | `(target: ItemDropTarget, types: DragTypes) => boolean` | Which items are valid "on" targets. |
| `getDropOperation` | `(target, types, allowedOperations) => DropOperation` | Feedback and rejection. |
| `onDrop` | `{items, dropOperation, target, x, y}` | Low level. When set, it overrides all handlers above. |
| `onDropEnter`, `onDropExit` | event with `target` | |
| `onDropActivate` | event with `target` | After a drag is held on a target for a time. Use it to open a folder. |
| `renderDropIndicator` | `(target: DropTarget) => JSX.Element` | Must render a `DropIndicator`. |
| `dropTargetDelegate` | `DropTargetDelegate` | Custom hit testing. |
| `isDisabled` | `boolean` | Turns all drag and drop events off. |

Types:

```ts
type DropOperation = 'copy' | 'link' | 'move' | 'cancel';
type DropPosition = 'on' | 'before' | 'after';
type DropTarget =
  | {type: 'root'}
  | {type: 'item', key: Key, dropPosition: DropPosition};
```

Which handlers you pass decides which drop positions exist. There is no separate position option.

## Enable it per collection component

The hook is the same for all four. Only the drag affordance differs.

| Component | Drag button | Notes |
| --- | --- | --- |
| `ListBox` | No `slot="drag"` | The option is the drag source. |
| `GridList` | `<Button slot="drag">` in the item | Render it when `allowsDragging` is true. |
| `Table` | `<Button slot="drag">` in a `Cell` | Needs a matching extra `Column`. |
| `Tree` | `<Button slot="drag">` in `TreeItemContent` | Sits with `slot="selection"` and `slot="chevron"`. |

ListBox:

```tsx
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';
import {useListData} from 'react-aria-components/useListData';
import {useDragAndDrop} from 'react-aria-components/useDragAndDrop';

function Reorderable() {
  let list = useListData({
    initialItems: [
      {id: 1, name: 'Adobe Photoshop'},
      {id: 2, name: 'Adobe XD'},
      {id: 3, name: 'Adobe Dreamweaver'}
    ]
  });

  let {dragAndDropHooks} = useDragAndDrop<{id: number, name: string}>({
    getItems: (keys, items) => items.map(item => ({'text/plain': item.name})),
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    }
  });

  return (
    <ListBox
      aria-label="Reorderable list"
      selectionMode="multiple"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}>
      {item => <ListBoxItem>{item.name}</ListBoxItem>}
    </ListBox>
  );
}
```

GridList:

```tsx
import {GridList, GridListItem, Button, Checkbox} from 'react-aria-components/GridList';
import {useListData} from 'react-aria-components/useListData';

let list = useListData({initialItems: [{id: 1, name: 'Forest'}]});

<GridList
  aria-label="Photos"
  selectionMode="multiple"
  items={list.items}
  dragAndDropHooks={dragAndDropHooks}>
  {item => (
    <GridListItem textValue={item.name}>
      {({allowsDragging, selectionMode, selectionBehavior}) => (
        <>
          {allowsDragging && <Button slot="drag" aria-label="Drag">≡</Button>}
          {selectionMode !== 'none' && selectionBehavior === 'toggle' && (
            <Checkbox slot="selection" />
          )}
          {item.name}
        </>
      )}
    </GridListItem>
  )}
</GridList>
```

Table. Add a header column for the drag cell. `useTableOptions()` returns `allowsDragging`, `selectionBehavior`, and `selectionMode` for shared Row and header wrappers.

```tsx
import {Table, TableHeader, TableBody, Column, Row, Cell, Button} from 'react-aria-components/Table';
import {useListData} from 'react-aria-components/useListData';

let list = useListData({initialItems: [{id: 1, name: 'Games', type: 'Folder'}]});

<Table aria-label="Files" selectionMode="multiple" dragAndDropHooks={dragAndDropHooks}>
  <TableHeader>
    <Column aria-label="Drag" />
    <Column isRowHeader>Name</Column>
    <Column>Type</Column>
  </TableHeader>
  <TableBody items={list.items}>
    {item => (
      <Row>
        <Cell><Button slot="drag" aria-label="Drag">≡</Button></Cell>
        <Cell>{item.name}</Cell>
        <Cell>{item.type}</Cell>
      </Row>
    )}
  </TableBody>
</Table>
```

Tree:

```tsx
import {Tree, TreeItem, TreeItemContent, Button, Checkbox} from 'react-aria-components/Tree';
import {Collection} from 'react-aria-components/Collection';
import {useTreeData} from 'react-aria-components/useTreeData';

let tree = useTreeData({
  initialItems: [{id: '1', title: 'Documents', children: [{id: '2', title: 'Report'}]}]
});

<Tree
  aria-label="Files"
  selectionMode="multiple"
  items={tree.items}
  dragAndDropHooks={dragAndDropHooks}>
  {function renderItem(node) {
    return (
      <TreeItem textValue={node.value.title}>
        <TreeItemContent>
          {({allowsDragging, selectionBehavior, selectionMode}) => (
            <>
              {allowsDragging && <Button slot="drag" aria-label="Drag">≡</Button>}
              {selectionBehavior === 'toggle' && selectionMode !== 'none' && (
                <Checkbox slot="selection" />
              )}
              <Button slot="chevron" aria-label="Toggle">›</Button>
              {node.value.title}
            </>
          )}
        </TreeItemContent>
        {node.children && <Collection items={node.children}>{renderItem}</Collection>}
      </TreeItem>
    );
  }}
</Tree>
```

Hierarchical Table: use `useTreeData` with nested `Row` and `Collection`, in the same way as Tree. Details of Table expandable rows: `https://react-aria.adobe.com/Table`.

## Drag source and drag data

Return one object per dragged item. Each key is a type: a standard MIME type for other apps, or a custom string for your app. Values are strings.

```tsx
let {dragAndDropHooks} = useDragAndDrop<Pokemon>({
  getItems(keys, items) {
    return items.map(item => ({
      'text/plain': `${item.name} – ${item.type}`,
      'text/html': `<strong>${item.name}</strong> – <em>${item.type}</em>`,
      'pokemon': JSON.stringify(item)
    }));
  }
});
```

- Your drop targets read the custom type. A rich text app reads the HTML. A text editor reads the plain text.
- Selection and drag work together: if the user selected several items, dragging one of them drags them all. `keys` and `items` hold them all.
- `items` holds the `value` of each item. Dynamic collections set `value` for you. With static JSX items, read data by `keys`, or set `value` on each item.
- With `useTreeData`, `items` holds nodes: read `item.value.title`.
- Escape any user text you put in `text/html`.

## Drag preview

Default: a copy of the dragged element. For a custom preview:

```tsx
let {dragAndDropHooks} = useDragAndDrop<Pokemon>({
  getItems: (keys, items) => items.map(item => ({'text/plain': item.name})),
  renderDragPreview(items) {
    return (
      <div className="drag-preview">
        {items[0]['text/plain']}
        <span className="badge">{items.length}</span>
      </div>
    );
  }
});
```

Return `{element, x, y}` to set the preview offset under the pointer. `items` holds the `DragItem` objects from `getItems`, not your data objects.

## Drop items: text, files, directories

```ts
interface TextDropItem {
  kind: 'text';
  types: Set<string>;
  getText(type: string): Promise<string>;
}

interface FileDropItem {
  kind: 'file';
  type: string; // usually a MIME type
  name: string;
  getFile(): Promise<File>;
  getText(): Promise<string>;
}

interface DirectoryDropItem {
  kind: 'directory';
  name: string;
  getEntries(): AsyncIterable<FileDropItem | DirectoryDropItem>;
}
```

Reading is async. Filter with the type guards before reading.

Text with a custom type:

```tsx
let {dragAndDropHooks} = useDragAndDrop<Pokemon>({
  acceptedDragTypes: ['pokemon'],
  async onRootDrop(e) {
    let items = await Promise.all(
      e.items
        .filter(isTextDropItem)
        .map(async item => JSON.parse(await item.getText('pokemon')))
    );
    setItems(items);
  }
});
```

Treat parsed data as untrusted. Any page or app can start a drag with any type name. Validate it with a schema when it matters.

Files:

```tsx
let {dragAndDropHooks} = useDragAndDrop({
  acceptedDragTypes: ['image/jpeg', 'image/png'],
  async onRootDrop(e) {
    let images = await Promise.all(
      e.items.filter(isFileDropItem).map(async item => ({
        id: crypto.randomUUID(),
        url: URL.createObjectURL(await item.getFile()),
        name: item.name
      }))
    );
    setItems(images);
  }
});
```

`URL.createObjectURL` holds memory until `URL.revokeObjectURL`. Revoke when the item goes away.

Directories. Pass `DIRECTORY_DRAG_TYPE` in `acceptedDragTypes` to accept only directories, and walk the entries with recursion.

```tsx
let {dragAndDropHooks} = useDragAndDrop({
  acceptedDragTypes: [DIRECTORY_DRAG_TYPE],
  async onRootDrop(e) {
    let readDir = async (dir: DirectoryDropItem): Promise<Entry[]> => {
      let entries: Entry[] = [];
      for await (let entry of dir.getEntries()) {
        entries.push({
          id: crypto.randomUUID(),
          name: entry.name,
          kind: entry.kind,
          children: entry.kind === 'directory' ? await readDir(entry) : []
        });
      }
      return entries;
    };

    let dir = e.items.find(isDirectoryDropItem);
    if (dir) {
      setEntries(await readDir(dir));
    }
  }
});
```

Types such as `DirectoryDropItem` export from `react-aria-components/useDragAndDrop`.

## Drop positions and events

| Position | Handler | Meaning |
| --- | --- | --- |
| Root | `onRootDrop` | The collection as a whole. Good for an empty list. |
| `on` | `onItemDrop` | One item, such as a folder. |
| `before`, `after` | `onInsert` | External data placed between items. |
| `before`, `after` | `onReorder` | Own items placed between items, same level. |
| `on`, `before`, `after` | `onMove` | Own items, any level. |

Item targets have `e.target.key` and `e.target.dropPosition`. Mix handlers freely to get many positions at once.

Limit "on" targets to folders:

```tsx
let {dragAndDropHooks} = useDragAndDrop<FileItem>({
  shouldAcceptItemDrop: target => list.getItem(target.key)?.type === 'folder',
  onItemDrop(e) {
    moveTo(e.target.key, e.items);
  }
});
```

## Recipes

### Insert external items between items

```tsx
let {dragAndDropHooks} = useDragAndDrop({
  acceptedDragTypes: ['pokemon'],
  async onInsert(e) {
    let items = await Promise.all(
      e.items
        .filter(isTextDropItem)
        .map(async item => ({
          ...JSON.parse(await item.getText('pokemon')),
          id: crypto.randomUUID()
        }))
    );
    if (e.target.dropPosition === 'before') {
      list.insertBefore(e.target.key, ...items);
    } else if (e.target.dropPosition === 'after') {
      list.insertAfter(e.target.key, ...items);
    }
  }
});
```

Give a copied item a new id. Ids must stay unique.

### Reorder with useListData

See the ListBox example in [Enable it per collection component](#enable-it-per-collection-component).

### Move in a tree with useTreeData

`onMove` handles all three positions. `on` makes the items children of the target.

```tsx
import {useTreeData} from 'react-aria-components/useTreeData';

let tree = useTreeData<FileItem>({initialItems});

let {dragAndDropHooks} = useDragAndDrop<(typeof tree.items)[number]>({
  getItems: (keys, items) => items.map(item => ({'text/plain': item.value.title})),
  onMove(e) {
    if (e.target.dropPosition === 'before') {
      tree.moveBefore(e.target.key, e.keys);
    } else if (e.target.dropPosition === 'after') {
      tree.moveAfter(e.target.key, e.keys);
    } else if (e.target.dropPosition === 'on') {
      let target = tree.getItem(e.target.key);
      if (target) {
        let index = target.children ? target.children.length : 0;
        [...e.keys].forEach((key, i) => tree.move(key, e.target.key, index + i));
      }
    }
  }
});
```

`onReorder` on a Tree keeps items at their level. Use `onMove` to change parents.

### Drag between two lists, and reorder inside each

Render this component twice with different `initialItems`.

```tsx
function DndList(props: {initialItems: Pokemon[], 'aria-label': string}) {
  let list = useListData({initialItems: props.initialItems});

  let readItems = (items: DropItem[]) => Promise.all(
    items
      .filter(isTextDropItem)
      .map(async item => JSON.parse(await item.getText('pokemon')) as Pokemon)
  );

  let {dragAndDropHooks} = useDragAndDrop<Pokemon>({
    getItems: (keys, items) => items.map(item => ({
      'pokemon': JSON.stringify(item),
      'text/plain': item.name
    })),
    acceptedDragTypes: ['pokemon'],
    // Always move, never copy.
    getDropOperation: () => 'move',
    // Between items, from the other list.
    async onInsert(e) {
      let items = await readItems(e.items);
      if (e.target.dropPosition === 'before') {
        list.insertBefore(e.target.key, ...items);
      } else if (e.target.dropPosition === 'after') {
        list.insertAfter(e.target.key, ...items);
      }
    },
    // The list is empty, or the drop landed outside any item.
    async onRootDrop(e) {
      list.append(...await readItems(e.items));
    },
    // Inside this list.
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    },
    // Remove from the source only when the drop went to another list.
    onDragEnd(e) {
      if (e.dropOperation === 'move' && !e.isInternal) {
        list.remove(...e.keys);
      }
    }
  });

  return (
    <ListBox
      aria-label={props['aria-label']}
      selectionMode="multiple"
      items={list.items}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={() => 'Drop items here'}>
      {item => <ListBoxItem>{item.name}</ListBoxItem>}
    </ListBox>
  );
}
```

Without the `!e.isInternal` check, a reorder removes the items.

### Kanban columns with one data list

Keep one `useListData`, and filter per column. Move the status in the drop handlers, then position the item. Drag the id, not the object, because the shared list owns the object.

```tsx
function Column({list, status}: {list: ListData<Ticket>, status: string}) {
  let items = list.items.filter(ticket => ticket.status === status);

  let {dragAndDropHooks} = useDragAndDrop<Ticket>({
    getItems: (keys, items) => items.map(item => ({
      'issue-id': item.id,
      'text/plain': item.title
    })),
    acceptedDragTypes: ['issue-id'],
    getDropOperation: () => 'move',
    async onInsert(e) {
      let ids = await Promise.all(
        e.items.filter(isTextDropItem).map(item => item.getText('issue-id'))
      );
      for (let id of ids) {
        list.update(id, {...list.getItem(id)!, status});
      }
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, ids);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, ids);
      }
    },
    async onRootDrop(e) {
      let ids = await Promise.all(
        e.items.filter(isTextDropItem).map(item => item.getText('issue-id'))
      );
      for (let id of ids) {
        list.update(id, {...list.getItem(id)!, status});
      }
    },
    onReorder(e) {
      if (e.target.dropPosition === 'before') {
        list.moveBefore(e.target.key, e.keys);
      } else if (e.target.dropPosition === 'after') {
        list.moveAfter(e.target.key, e.keys);
      }
    }
  });

  return (
    <GridList
      aria-label={status}
      items={items}
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={() => 'No tickets'}>
      {item => <GridListItem textValue={item.title}>{item.title}</GridListItem>}
    </GridList>
  );
}
```

`ListData` is a type export of `react-aria-components/useListData`.

## Drop operations

- `move`: data leaves the source and goes to the target.
- `copy`: data is copied to the target.
- `link`: the target gets a relationship to the source.
- `cancel`: nothing happens.

The OS shows the operation as a cursor. Users can switch it with a modifier key, such as Option or Alt for copy.

The two sides negotiate:

- **Source**: `getAllowedDropOperations` limits the operations. `() => ['copy']` shows a copy cursor, and a modifier that asks for another operation cancels the drop.
- **Target**: `getDropOperation(target, types, allowedOperations)` returns the operation for the current hover. Return `'cancel'` to reject. A return value not in `allowedOperations` also cancels.

Reject by type:

```tsx
let {dragAndDropHooks} = useDragAndDrop({
  getDropOperation: (target, types, allowedOperations) =>
    types.has('image/png') && allowedOperations.includes('copy') ? 'copy' : 'cancel',
  onRootDrop(e) {
    handleDrop(e.items);
  }
});
```

Each drop event has `dropOperation`, so the target can branch:

```tsx
let onItemDrop = async (e: DroppableCollectionOnItemDropEvent) => {
  let item = e.items.find(isTextDropItem);
  if (!item) {
    return;
  }
  let data = JSON.parse(await item.getText('my-app-file'));
  switch (e.dropOperation) {
    case 'move':
      fileService.move(data.filePath, e.target.key);
      break;
    case 'copy':
      fileService.copy(data.filePath, e.target.key);
      break;
    case 'link':
      fileService.link(data.filePath, e.target.key);
      break;
  }
};
```

The source reacts in `onDragEnd`: remove items when `e.dropOperation === 'move'`. `e.dropOperation` is `'cancel'` when the user cancels.

## DropIndicator

Renders between items for `before` and `after` targets. React Aria renders a default one. Without CSS it has no size, so you must style it.

```css
.react-aria-DropIndicator[data-drop-target] {
  outline: 1px solid var(--highlight);
}
```

For a custom look:

```tsx
import {useDragAndDrop, DropIndicator} from 'react-aria-components/useDragAndDrop';

let {dragAndDropHooks} = useDragAndDrop({
  onInsert: handleInsert,
  renderDropIndicator(target) {
    return (
      <DropIndicator
        target={target}
        className={({isDropTarget}) => isDropTarget ? 'line active' : 'line'} />
    );
  }
});
```

Props: `target: DropTarget`, `className`, `style`, `children`, `render`. Render prop: `isDropTarget` (`[data-drop-target]`). Default class: `react-aria-DropIndicator`.

- All indicators stay in the DOM during a drag. They sit between items, so they break adjacent-sibling selectors such as `.item + .item`. Account for `+ .react-aria-DropIndicator +`.
- To avoid layout shift, give the indicator zero height with an outline, or a negative margin.
- Grids often use `display: none` until `[data-drop-target]`, or `visibility: hidden` with a negative margin.
- In Table it renders as a `tr`. Use the same selector.

## Styling states

| Selector | On | Meaning |
| --- | --- | --- |
| `[data-drop-target]` | Collection root | A valid drag hovers the root target. |
| `[data-drop-target]` | Item, `Row`, `TreeItem` | A valid drag hovers this item ("on"). |
| `[data-drop-target]` | `DropIndicator` | This position is the active target. |
| `[data-dragging]` | Item | Item is being dragged. Dim it. |
| `[data-allows-dragging]` | Item, Tree root | Item can be dragged. Use for `cursor: grab`. |
| `[data-focus-visible]` | Item, root | Show a ring on the keyboard drop target. |

Render props: `isDropTarget` on the root and items. `isDragging` and `allowsDragging` on items.

`TableBody` also has `isDropTarget`, so style the empty body as well.

## Keyboard and screen reader

No extra code is needed. Announcements are built in and localized.

- **Enter** on a draggable element starts drag mode.
- **Tab** moves between valid drop targets only. All other elements are skipped.
- **Enter** drops. **Escape** cancels.
- Touch screen readers: double tap to start, swipe between targets, double tap to drop. All other elements are hidden from screen readers during drag mode.
- A collection counts as one drop target, so Tab goes past it. **ArrowUp** and **ArrowDown** choose the position inside it (root, on an item, or between items).
- Indicators have accessible labels, such as "Insert between item A and item B".

Design consequences:

- Items with selection or actions have conflicts on Enter. Add the explicit `slot="drag"` button in GridList, Table, and Tree. It is also more discoverable. Give the button an `aria-label`.
- A drag button that shows only on hover gives keyboard users no visible target. Show it on `[data-focus-visible]`, too.
- Drop targets must be focusable and have a role for keyboard drag. `DropZone` and collections do this for you. `useDrag` and `useDrop` elements need it from you.
- `onDropActivate` fires when a drag rests on a target. Use it to open a tree folder or switch a tab.

## Virtualized collections and custom targets

- Drag and drop works inside `Virtualizer`. The layout gives the hit testing, and its options include `dropIndicatorThickness`.
- With a stack or grid on ListBox or GridList, set `layout` and `orientation` on the collection. They affect keyboard navigation and drag and drop behavior.
- The collection keeps dragged items and the drop target mounted during a drag, so the drag survives scrolling (`persistedKeys` in the source).
- Custom hit testing: pass `dropTargetDelegate`, an object with `getDropTargetFromPoint(x, y, isValidDropTarget) => DropTarget | null`. By default a collection outside `Virtualizer` uses `ListDropTargetDelegate` from `react-aria/ListDropTargetDelegate`.

## DropZone

An area that accepts drops and pastes. It works with a keyboard because it has an internal hidden button. Pick it over `useDrop` for upload areas.

```tsx
import {DropZone, Text} from 'react-aria-components/DropZone';
import {FileTrigger} from 'react-aria-components/FileTrigger';
import {Button} from 'react-aria-components/Button';
import {useState} from 'react';

const ACCEPTED = ['text/plain', 'image/jpeg', 'image/png', 'image/gif'];

function Upload() {
  let [content, setContent] = useState<React.ReactNode>(null);

  let showFile = (file: File) => {
    setContent(<img src={URL.createObjectURL(file)} alt={file.name} />);
  };

  return (
    <DropZone
      getDropOperation={types => ACCEPTED.some(type => types.has(type)) ? 'copy' : 'cancel'}
      onDrop={async e => {
        let item = e.items.find(item =>
          (item.kind === 'text' && item.types.has('text/plain')) ||
          (item.kind === 'file' && item.type.startsWith('image/'))
        );
        if (item?.kind === 'text') {
          setContent(await item.getText('text/plain'));
        } else if (item?.kind === 'file') {
          showFile(await item.getFile());
        }
      }}>
      <Text slot="label">{content || 'Drop or paste text or images here'}</Text>
      <FileTrigger
        acceptedFileTypes={['image/jpeg', 'image/png', 'image/gif']}
        onSelect={files => {
          let file = files && [...files][0];
          if (file) {
            showFile(file);
          }
        }}>
        <Button>Browse</Button>
      </FileTrigger>
    </DropZone>
  );
}
```

Props:

- `onDrop(e)`, with `e.items`, `e.dropOperation`, `e.x`, `e.y`.
- `getDropOperation(types, allowedOperations)`.
- `onDropEnter`, `onDropMove`, `onDropExit`, `onDropActivate`.
- `isDisabled`, `onHoverStart`, `onHoverEnd`, `onHoverChange`.
- `aria-label`: has a localized default. `<Text slot="label">` labels the zone when present.
- `className`, `style`, `children` (with render props), `render`, `slot`.

Styling. Default class: `react-aria-DropZone`.

| Render prop | Selector |
| --- | --- |
| `isHovered` | `[data-hovered]` |
| `isFocused` | `[data-focused]` |
| `isFocusVisible` | `[data-focus-visible]` |
| `isDropTarget` | `[data-drop-target]` |
| `isDisabled` | `[data-disabled]` |

Gotchas:

- A paste also calls `onDrop`, with `dropOperation: 'copy'`. `getDropOperation` does not filter a paste, so check item kinds in `onDrop`.
- `getDropOperation` receives only types, not file contents. During a drag, `types.has('image/png')` is the check. Validate the real file in `onDrop`.
- `FileTrigger` inside a `DropZone` needs its own handler: `onSelect` is separate from `onDrop`.
- `acceptedFileTypes` and `getDropOperation` are UX hints, not security. Validate on the server.

## FileTrigger

Opens the OS file picker from any pressable component. Renders a hidden `<input type="file">`.

```tsx
import {FileTrigger} from 'react-aria-components/FileTrigger';
import {Button} from 'react-aria-components/Button';

<FileTrigger
  acceptedFileTypes={['image/png']}
  allowsMultiple
  onSelect={files => {
    let names = files ? Array.from(files).map(file => file.name) : [];
    setNames(names);
  }}>
  <Button>Select a file</Button>
</FileTrigger>
```

Props:

- `onSelect: (files: FileList | null) => void`.
- `acceptedFileTypes: readonly string[]`: MIME types.
- `allowsMultiple: boolean`.
- `acceptDirectory: boolean`: pick directories, not files.
- `defaultCamera: 'environment' | 'user'`: capture media on the spot.
- `children`: one pressable.

Custom trigger: any pressable React Aria component works (`Button`, `Link`). For another element, wrap it in `Pressable`. The child must have an interactive role or be a semantic control. A custom component must forward its `ref` and spread all props onto a DOM element.

```tsx
import {FileTrigger, Pressable} from 'react-aria-components/FileTrigger';

<FileTrigger onSelect={handleFiles}>
  <Pressable>
    <span role="button">Custom trigger</span>
  </Pressable>
</FileTrigger>
```

Global DOM props go to the `input`. `FileTrigger` has no visual state attributes; style the child.

## useDrag

Makes one element a drag source, with keyboard and screen reader support. Import from `react-aria/useDrag` (also `react-aria-components/useDrag`).

```tsx
import {useDrag} from 'react-aria/useDrag';

function Draggable() {
  let {dragProps, isDragging} = useDrag({
    getItems: () => [{
      'text/plain': 'hello world',
      'text/html': '<strong>hello world</strong>',
      'my-app-custom-type': JSON.stringify({message: 'hello world', style: 'bold'})
    }]
  });

  return (
    <div {...dragProps} role="button" tabIndex={0} className={isDragging ? 'dragging' : ''}>
      Drag me
    </div>
  );
}
```

The element must be focusable and have a role, or keyboard users can not start a drag.

Options: `getItems()` (required, returns `DragItem[]`; several objects drag together), `preview`, `getAllowedDropOperations`, `hasDragButton`, `isDisabled`, `onDragStart`, `onDragMove`, `onDragEnd`.

Returns: `dragProps`, `dragButtonProps`, `isDragging`. The docs table omits `isDragging`; it is in the types.

Custom preview. Link `DragPreview` by ref. Place it where it gets the context and inherited styles it needs.

```tsx
import {useDrag, DragPreview} from 'react-aria/useDrag';
import {useRef} from 'react';
import type {DragPreviewRenderer} from 'react-aria-components/useDragAndDrop';

function Draggable() {
  let preview = useRef<DragPreviewRenderer | null>(null);
  let {dragProps} = useDrag({
    preview,
    getItems: () => [{'text/plain': 'hello world'}]
  });

  return (
    <>
      <div {...dragProps} role="button" tabIndex={0}>Drag me</div>
      <DragPreview ref={preview}>
        {items => <div className="preview">{items[0]['text/plain']}</div>}
      </DragPreview>
    </>
  );
}
```

Drag button: for elements with conflicting keys (such as Enter) or that can not take focus. Keyboard handlers move from `dragProps` to `dragButtonProps`; pointer dragging stays in `dragProps`.

```tsx
import {useDrag} from 'react-aria/useDrag';
import {useButton} from 'react-aria/useButton';
import {useRef} from 'react';

function Card() {
  let {dragProps, dragButtonProps} = useDrag({
    hasDragButton: true,
    getItems: () => [{'text/plain': 'hello world'}]
  });
  let ref = useRef(null);
  let {buttonProps} = useButton({...dragButtonProps, elementType: 'div'}, ref);

  return (
    <div {...dragProps}>
      <span {...buttonProps} aria-label="Drag" ref={ref}>≡</span>
      <span>Some text</span>
      <button onClick={runAction}>Action</button>
    </div>
  );
}
```

The docs import `useButton` from `@react-aria/button`; use `react-aria/useButton`.

Operations: `onDragEnd(e)` with `e.dropOperation`; `getAllowedDropOperations: () => ['copy']` to forbid move.

## useDrop

Makes one element a drop target. Import from `react-aria/useDrop` (also `react-aria-components/useDrop`).

```tsx
import {useDrop, isTextDropItem} from 'react-aria/useDrop';
import {useRef, useState} from 'react';

function DropTarget() {
  let [dropped, setDropped] = useState<string | null>(null);
  let ref = useRef(null);
  let {dropProps, isDropTarget} = useDrop({
    ref,
    getDropOperation: types => types.has('text/plain') ? 'copy' : 'cancel',
    async onDrop(e) {
      let texts = await Promise.all(
        e.items
          .filter(isTextDropItem)
          .filter(item => item.types.has('text/plain'))
          .map(item => item.getText('text/plain'))
      );
      setDropped(texts.join('\n'));
    }
  });

  return (
    <div {...dropProps} role="button" tabIndex={0} ref={ref} className={isDropTarget ? 'target' : ''}>
      {dropped || 'Drop here'}
    </div>
  );
}
```

The element needs focus and a role, the same as `useDrag`.

Options:

- `ref` (required).
- `getDropOperation(types, allowedOperations)`: with no function, the first allowed operation applies and any type is accepted. If a target supports only some types, implement it and return `'cancel'` for others, so users see no false feedback.
- `getDropOperationForPoint(types, allowedOperations, x, y)`: operation per point in the target.
- `onDrop`, `onDropEnter`, `onDropMove`, `onDropExit`: events have `x` and `y` relative to the target, and `onDrop` adds `items` and `dropOperation`.
- `onDropActivate`: fires after a valid drag rests on the target. Use it to open what the target holds.
- `hasDropButton`: moves keyboard handlers to `dropButtonProps`.
- `isDisabled`.

Returns: `dropProps`, `isDropTarget`, `dropButtonProps`.

Reading a file and a directory:

```tsx
async function onDrop(e: DropEvent) {
  let file = e.items.filter(isFileDropItem).find(item => item.type === 'image/png');
  if (file) {
    setUrl(URL.createObjectURL(await file.getFile()));
  }

  let dir = e.items.find(isDirectoryDropItem);
  if (dir) {
    let names: string[] = [];
    for await (let entry of dir.getEntries()) {
      names.push(entry.name);
    }
    setNames(names);
  }
}
```

`DropEvent` and the item types export from `react-aria/useDrop`.

## useClipboard

Copy and paste for a focusable element: keyboard shortcuts plus browser menu commands, with the OS clipboard. It also works as a keyboard alternative to drag and drop, and can paste files from the OS.

```tsx
import {useClipboard, type TextDropItem} from 'react-aria/useClipboard';
import {useState} from 'react';

function Copyable() {
  let {clipboardProps} = useClipboard({
    getItems: () => [{
      'text/plain': 'hello world',
      'text/html': '<strong>hello world</strong>',
      'my-app-custom-type': JSON.stringify({message: 'hello world', style: 'bold'})
    }]
  });

  return (
    <div role="textbox" tabIndex={0} aria-label="Copyable text" {...clipboardProps}>
      hello world
    </div>
  );
}

function Pasteable() {
  let [pasted, setPasted] = useState<string | null>(null);
  let {clipboardProps} = useClipboard({
    async onPaste(items) {
      let texts = await Promise.all(
        items
          .filter((item): item is TextDropItem => item.kind === 'text' && item.types.has('text/plain'))
          .map(item => item.getText('text/plain'))
      );
      setPasted(texts.join('\n'));
    }
  });

  return (
    <div role="textbox" tabIndex={0} aria-label="Paste target" {...clipboardProps}>
      {pasted || 'Paste here'}
    </div>
  );
}
```

Options:

- `getItems(details: {action: 'cut' | 'copy'}) => DragItem[]`: several formats and several items work.
- `onCopy()`, `onCut()`: run when the user copies or cuts. Remove the source in `onCut`.
- `onPaste(items: DropItem[])`: same item kinds as drops (`text`, `file`, `directory`), with the same reading methods.
- `isDisabled`.

Returns: `clipboardProps`. The element must be focusable.

Prefer the custom type, then fall back to plain text:

```tsx
let {clipboardProps} = useClipboard({
  async onPaste(items) {
    let data = await Promise.all(
      items
        .filter((item): item is TextDropItem =>
          item.kind === 'text' &&
          (item.types.has('text/plain') || item.types.has('my-app-custom-type')))
        .map(async item => item.types.has('my-app-custom-type')
          ? JSON.parse(await item.getText('my-app-custom-type'))
          : {message: await item.getText('text/plain')})
    );
    setPasted(data);
  }
});
```

This hook handles clipboard events on the focused element. It has no method to copy from a button press.

## Low-level collection hooks

Use these only for a collection that you build from React Aria hooks (`useListBox`, `useGridList`, `useTable`). With `react-aria-components`, use `useDragAndDrop`.

Drag source:

```tsx
import {useListState} from 'react-stately/useListState';
import {useListBox, useOption} from 'react-aria/useListBox';
import {useDraggableCollectionState} from 'react-stately/useDraggableCollectionState';
import {useDraggableCollection, useDraggableItem} from 'react-aria/useDraggableCollection';
import {mergeProps} from 'react-aria/mergeProps';

// Selecting on press up prevents a conflict with starting a drag.
let {listBoxProps} = useListBox({...props, shouldSelectOnPressUp: true}, state, ref);

let dragState = useDraggableCollectionState({
  ...props,
  collection: state.collection,
  selectionManager: state.selectionManager,
  getItems: keys => [...keys].map(key => ({
    'text/plain': state.collection.getItem(key)?.textValue ?? ''
  }))
});
useDraggableCollection(props, dragState, ref);

// In each option:
let {optionProps} = useOption({key: item.key}, state, optionRef);
let {dragProps} = useDraggableItem({key: item.key}, dragState);
<li {...mergeProps(optionProps, dragProps)} ref={optionRef} />;
```

`useDraggableItem` options: `key`, `hasDragButton`, `hasAction`. Returns `dragProps`, `dragButtonProps`.

Drop target:

```tsx
import {useDroppableCollectionState} from 'react-stately/useDroppableCollectionState';
import {useDroppableCollection, useDroppableItem, useDropIndicator} from 'react-aria/useDroppableCollection';
import {ListKeyboardDelegate} from 'react-aria/ListKeyboardDelegate';
import {ListDropTargetDelegate} from 'react-aria/ListDropTargetDelegate';

let dropState = useDroppableCollectionState({
  ...props,
  collection: state.collection,
  selectionManager: state.selectionManager
});
let {collectionProps} = useDroppableCollection({
  ...props,
  keyboardDelegate: new ListKeyboardDelegate(state.collection, state.disabledKeys, ref),
  dropTargetDelegate: new ListDropTargetDelegate(state.collection, ref)
}, dropState, ref);

// Root: dropState.isDropTarget({type: 'root'})

// In each option:
let {dropProps, isDropTarget} = useDroppableItem(
  {target: {type: 'item', key: item.key, dropPosition: 'on'}},
  dropState,
  optionRef
);

// In a DropIndicator component, rendered before each item and after the last:
let {dropIndicatorProps, isHidden} = useDropIndicator({target}, dropState, indicatorRef);
```

Render a root indicator with `target={{type: 'root'}}`, a `before` indicator for each item, and an `after` indicator for the last item only. If `isHidden` is true, return `null`. Inside a listbox, the indicator element uses `role="option"` to keep the ARIA tree valid.

## Common mistakes

- No `getItems`, then wondering why items do not drag. It is what makes a collection draggable.
- Using `onReorder` to move items into a folder or a new tree level. Use `onMove`.
- Using `onInsert` for own items. It handles external drops. Own items go through `onReorder` or `onMove`.
- Setting `onDrop` next to `onInsert`, `onItemDrop`, or others. `onDrop` overrides them all.
- `onDragEnd` removing items on every `move`, which deletes them on a reorder. Check `!e.isInternal`.
- Forgetting `onRootDrop`, so an empty list accepts nothing.
- Copying items with the same id. Ids must stay unique, so generate new ones for a copy.
- Reading a `text` item without the type guard. `getText` needs a type on text items but not on file items, and directories have no `getText`.
- No CSS for `.react-aria-DropIndicator`. The insertion line is invisible.
- `.item + .item` CSS that breaks once indicators sit between items.
- `useDrag` or `useDrop` on an element with no `tabIndex` and `role`.
- `getDropOperation` returning an operation that the source forbids. The drop then cancels with no error.
- Trusting dropped or pasted data. Parse it safely, and validate its shape. Check type and size of files before upload, and again on the server.
- No alternative for tasks that involve other apps, because keyboard drag works only inside the page.
