# Example recipes

Digest of the docs' example apps (`https://react-aria.adobe.com/examples`). Keeps how selection, layout, drag and drop, and motion connect. Drops styling.

Source coverage varies:

| Example | Page | Source on the doc page | In this file |
| ------- | ---- | ---------------------- | ------------ |
| Kanban board | `examples/kanban` | Full | Key code from the source |
| iOS list | `examples/ios-list` | Full | Key code from the source |
| Emoji picker | `examples/emoji-picker` | Full | Key code from the source |
| Ripple button | `examples/ripple-button` | Full | Key code from the source |
| Swipeable tabs | `examples/swipeable-tabs` | Usage only | Usage, plus a marked sketch |
| Filterable CRUD table | `examples/crud` | Component list only | Composition, plus a marked sketch |
| Photo library | `examples/photos` | Component list only | Composition, plus a marked sketch |

A "sketch" is built from documented APIs. It is not the example's code.

Contents:

- [Kanban board](#kanban-board)
- [iOS list view](#ios-list-view)
- [Emoji picker](#emoji-picker)
- [Ripple button](#ripple-button)
- [Swipeable tabs](#swipeable-tabs)
- [Filterable CRUD table](#filterable-crud-table)
- [Photo library](#photo-library)

## Kanban board

Shows accessible drag and drop between lists, with reorder inside a list. Mouse, touch, keyboard, and screen readers all work with no extra code.

Parts: `GridList`, `GridListItem`, `Button slot="drag"`, `Text slot="description"`, `useDragAndDrop`, `DropIndicator`, `isTextDropItem`, `useListData`.

Model: one `useListData` holds every ticket. Each column is a `GridList` over a filtered view, with its own `useDragAndDrop`. Moving a card does not remove it from one list and add it to another: it updates `status` in the shared list, then positions it.

```tsx
import {GridList, GridListItem, Button, Text} from 'react-aria-components/GridList';
import {useDragAndDrop, DropIndicator, isTextDropItem} from 'react-aria-components/useDragAndDrop';
import {useListData, type ListData} from 'react-aria-components/useListData';

type Ticket = {id: string; title: string; description: string; status: string};

function Board({tickets}: {tickets: Ticket[]}) {
  let list = useListData({initialItems: tickets});
  return ['Open', 'In Progress', 'Closed'].map(status => (
    <Column key={status} status={status} list={list} />
  ));
}

function Column({list, status}: {list: ListData<Ticket>; status: string}) {
  let items = list.items.filter(t => t.status === status);

  let {dragAndDropHooks} = useDragAndDrop({
    // A custom format for this app, plain text for everything else.
    getItems(keys, items: Ticket[]) {
      return items.map(item => ({'issue-id': item.id, 'text/plain': item.title}));
    },
    acceptedDragTypes: ['issue-id'],
    // Always move, never copy.
    getDropOperation: () => 'move',

    renderDropIndicator(target) {
      return <DropIndicator target={target} />;
    },

    // Drop between items, from another list.
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

    // Drop on an empty column.
    async onRootDrop(e) {
      let ids = await Promise.all(
        e.items.filter(isTextDropItem).map(item => item.getText('issue-id'))
      );
      for (let id of ids) {
        list.update(id, {...list.getItem(id)!, status});
      }
    },

    // Reorder within this list.
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
      selectionMode="multiple"
      dragAndDropHooks={dragAndDropHooks}
      renderEmptyState={() => 'No tasks.'}>
      {item => (
        <GridListItem value={item} textValue={item.title}>
          <span>{item.title}</span>
          <Text slot="description">{item.description}</Text>
          <Button slot="drag">≡</Button>
        </GridListItem>
      )}
    </GridList>
  );
}
```

Insights:

- Three handlers cover three drop cases: `onInsert` (between items, from elsewhere), `onRootDrop` (empty list), `onReorder` (same list). Leave one out, and that drop case stops working.
- `getItems` receives `(keys, items)`. The `items` values come from `value={item}` on `GridListItem`.
- `DropIndicator` is always rendered, so hide it unless active: use `invisible drop-target:visible` in Tailwind, or `[data-drop-target]` in CSS.
- A negative margin and zero height on the indicator keep cards from shifting when it shows.
- `Button slot="drag"` is what keyboard and screen reader users act on. The example uses `sr-only` until the row has focus, which keeps the UI clean without removing the control.
- `selectionMode="multiple"` lets users drag several cards. `ids` in `onInsert` holds all of them.
- Style with: `data-dragging` on the item (`dragging:opacity-50`), `data-drop-target` on the list (`drop-target:bg-blue-200`), `data-selected` on the item.
- `renderEmptyState` shows a message in the empty list. `onRootDrop` makes that list a drop target.
- Pair with scroll snap (`snap-x snap-mandatory` on the board, `snap-center` on each column) for phones.

## iOS list view

Shows swipe to reveal and delete, an edit mode with multiple selection, and layout animation on removal.

Parts: `GridList`, `GridListItem`, `Button`, and from Motion: `motion.create`, `AnimatePresence`, `useMotionValue`, `useMotionTemplate`, `useMotionValueEvent`, `useIsPresent`, `animate`.

Selection is wired so edit mode swaps press behavior:

```tsx
import {useState} from 'react';
import {GridList, GridListItem, Button, type Selection, type SelectionMode} from 'react-aria-components/GridList';
import {motion, AnimatePresence} from 'motion/react';

const MotionItem = motion.create(GridListItem);

function Inbox({initial}) {
  let [items, setItems] = useState(initial);
  let [selectedKeys, setSelectedKeys] = useState<Selection>(new Set());
  let [selectionMode, setSelectionMode] = useState<SelectionMode>('none');

  let onDelete = () => {
    setItems(items.filter(i => selectedKeys !== 'all' && !selectedKeys.has(i.id)));
    setSelectedKeys(new Set());
    setSelectionMode('none');
  };

  return (
    <>
      <Button
        isDisabled={selectedKeys !== 'all' && selectedKeys.size === 0}
        onPress={onDelete}>
        Delete
      </Button>
      <Button
        onPress={() => {
          setSelectionMode(m => (m === 'none' ? 'multiple' : 'none'));
          setSelectedKeys(new Set());
        }}>
        {selectionMode === 'none' ? 'Edit' : 'Cancel'}
      </Button>
      <GridList
        aria-label="Inbox"
        onAction={selectionMode === 'none' ? () => {} : undefined}
        selectionMode={selectionMode}
        selectedKeys={selectedKeys}
        onSelectionChange={setSelectedKeys}>
        <AnimatePresence>
          {items.map(item => (
            <ListItem
              key={item.id}
              id={item.id}
              textValue={item.subject}
              onRemove={() => setItems(items.filter(i => i !== item))}>
              {item.subject}
            </ListItem>
          ))}
        </AnimatePresence>
      </GridList>
    </>
  );
}
```

The row. The outer `MotionItem` handles layout and exit. An inner `motion.div` handles the drag.

```tsx
import {useRef, useState} from 'react';
import {GridListItem, Button} from 'react-aria-components/GridList';
import {motion, animate, useIsPresent, useMotionTemplate, useMotionValue, useMotionValueEvent, type MotionStyle} from 'motion/react';

const MotionItem = motion.create(GridListItem);
const inertia = {type: 'inertia' as const, bounceStiffness: 300, bounceDamping: 40, timeConstant: 300};

function ListItem({id, children, textValue, onRemove}) {
  let ref = useRef<HTMLDivElement>(null);
  let x = useMotionValue(0);
  let xPx = useMotionTemplate`${x}px`;
  let isPresent = useIsPresent();

  let [align, setAlign] = useState('end');
  useMotionValueEvent(x, 'change', v => {
    let width = ref.current?.offsetWidth ?? 0;
    setAlign(v < -width * 0.8 ? 'start' : 'end');
  });

  return (
    <MotionItem
      id={id}
      textValue={textValue}
      layout
      transition={{duration: 0.25}}
      exit={{opacity: 0}}
      style={{position: isPresent ? 'relative' : 'absolute'}}>
      {/* @ts-ignore Motion's types do not cover function children. */}
      {({selectionMode, isSelected}) => (
        <motion.div
          ref={ref}
          style={{x, '--x': xPx} as MotionStyle}
          drag={selectionMode === 'none' ? 'x' : undefined}
          dragConstraints={{right: 0}}
          onDragStart={() => {
            // Cancel the React Aria press when a drag starts.
            document.dispatchEvent(new PointerEvent('pointercancel'));
          }}
          onDragEnd={(e, {offset}) => {
            let target = offset.x > -20 ? 0 : -100;
            let width = ref.current?.offsetWidth ?? 0;
            if (x.get() < -width * 0.8) {
              target = -width;
              onRemove();
            }
            animate(x, target, {...inertia, min: target, max: target});
          }}>
          <motion.div layout layoutDependency={selectionMode}>{children}</motion.div>
          {selectionMode === 'none' && (
            <Button
              style={{width: 'max(100px, calc(-1 * var(--x)))', justifyContent: align}}
              onPress={onRemove}
              onFocus={() => x.set(-100)}
              onBlur={() => x.set(0)}>
              Delete
            </Button>
          )}
        </motion.div>
      )}
    </MotionItem>
  );
}
```

Insights:

- `onAction` with an empty function in normal mode makes rows act like buttons (press state, no selection). Removing it in edit mode means a press toggles selection. Selection mode drives the whole interaction.
- `selectedKeys` is `Selection`, which may be `'all'`. Check it before `.has` or `.size`.
- Use `items.map` with `key` and `id`, not the `items` prop with a render function. `AnimatePresence` needs real children. Add `textValue` too, since the content is not plain text.
- `useIsPresent` plus `position: absolute` takes a leaving row out of flow, so the rows below animate up through `layout`.
- `pointercancel` on drag start stops a press from firing after the swipe, and the row does not stay pressed. This is the bridge between two gesture systems.
- `drag` turns off in edit mode, and the delete button is unmounted.
- Keyboard: GridList arrow keys reach the delete button in a row. `onFocus` slides the row to show it, and `onBlur` hides it. Without this, keyboard focus lands on a button off screen.
- `useMotionTemplate` publishes `x` as the `--x` variable. The button width then follows the drag in CSS, with no React render per frame. `useMotionValueEvent` sets state only when the 80% threshold changes the alignment.
- `layoutDependency` limits layout measuring to when `selectionMode` changes.

## Emoji picker

Shows a searchable, virtualized grid inside a `Select`, with arrow key navigation while typing.

Parts: `Select`, `SelectValue`, `Button`, `Popover`, `Autocomplete`, `useFilter`, `SearchField`, `Virtualizer`, `GridLayout`, `Size`, `ListBox`, `ListBoxItem`.

```tsx
import {Select, SelectValue, Button, Popover, ListBox, ListBoxItem} from 'react-aria-components/Select';
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {SearchField, Input} from 'react-aria-components/SearchField';
import {Virtualizer, GridLayout, Size} from 'react-aria-components/Virtualizer';

type Emoji = {unicode: string; label: string; tags?: string[]};

function EmojiPicker({emojis}: {emojis: Emoji[]}) {
  let {contains} = useFilter({sensitivity: 'base'});
  return (
    <Select aria-label="Emoji" defaultValue="🥳">
      <Button><SelectValue /></Button>
      <Popover placement="bottom">
        <Autocomplete filter={contains}>
          <SearchField aria-label="Search" autoFocus>
            <Input placeholder="Search emoji" />
          </SearchField>
          <Virtualizer
            layout={GridLayout}
            layoutOptions={{
              minItemSize: new Size(32, 32),
              maxItemSize: new Size(32, 32),
              minSpace: new Size(4, 4),
              preserveAspectRatio: true
            }}>
            <ListBox aria-label="Emoji list" items={emojis} layout="grid">
              {item => (
                <ListBoxItem
                  id={String(item.unicode)}
                  value={item}
                  textValue={item.label + (Array.isArray(item.tags) ? item.tags.join(' ') : '')}>
                  {item.unicode}
                </ListBoxItem>
              )}
            </ListBox>
          </Virtualizer>
        </Autocomplete>
      </Popover>
    </Select>
  );
}
```

Insights:

- `Autocomplete` connects any text field to any collection. Focus stays in the input, and arrow keys move a virtual focus in the list. `filter` runs against each item's `textValue`.
- Put search terms in `textValue` (label plus tags). The visible content is only an emoji. `textValue` is also the screen reader label.
- `layout="grid"` on `ListBox` makes all four arrows work in two dimensions. `GridLayout` handles the geometry.
- `Virtualizer` wraps `ListBox`, so the scroll container is the list. Give the list a fixed height in CSS. Fixed `Size` values make the layout cheap.
- `id` is the `Select` value: `defaultValue="🥳"` matches `String(item.unicode)`.
- `sensitivity: 'base'` ignores case and diacritics in the current locale.

## Ripple button

Shows how to use press coordinates for an effect that works for mouse, touch, and keyboard.

Parts: `Button` only.

```tsx
import {useState} from 'react';
import {Button, type ButtonProps} from 'react-aria-components/Button';

function RippleButton({children, ...props}: ButtonProps & {children: React.ReactNode}) {
  let [coords, setCoords] = useState<{x: number; y: number} | null>(null);
  return (
    <Button
      {...props}
      className="relative overflow-hidden"
      onPress={e => setCoords({x: e.x, y: e.y})}>
      {coords && (
        <div
          key={`${coords.x},${coords.y}`}
          className="absolute h-8 w-8 rounded-full bg-white/60"
          style={{
            animation: 'ripple 600ms linear forwards',
            left: coords.x - 15,
            top: coords.y - 15
          }}
          onAnimationEnd={() => setCoords(null)}
        />
      )}
      <span>{children}</span>
    </Button>
  );
}
```

```css
@keyframes ripple {
  from { transform: scale(0); opacity: 1; }
  to { transform: scale(6); opacity: 0; }
}
```

The `@keyframes` values are this file's own: the doc page imports its `ripple.css` without showing it.

Insights:

- `PressEvent` has `x` and `y` relative to the target, so no `getBoundingClientRect` call. A keyboard press reports the center of the target, so it ripples too.
- `key` from the coordinates remounts the ripple, which restarts the animation on a new press mid-effect.
- `onAnimationEnd` removes the node, so no timers run.
- `overflow-hidden` with `relative` on the button clips the circle. Add a Tailwind `pressed:` style for instant feedback, and `[-webkit-tap-highlight-color:transparent]` for iOS.

## Swipeable tabs

Shows native swipe between panels with CSS only: scroll snap for the gesture, a scroll-driven animation for the indicator, and anchor positioning to follow tabs.

Parts: `Tabs`, `TabList`, `Tab`, `TabPanel` with `shouldForceMount`. The example's own `TabSelectionIndicator` and `TabPanelCarousel` are local files, and their source is not on the doc page.

Usage from the page:

```tsx
// no-check: TabSelectionIndicator and TabPanelCarousel are the example's local components.
<Tabs>
  <TabList aria-label="Tabs">
    <Tab id="home">Home</Tab>
    <Tab id="files">Files</Tab>
  </TabList>
  <TabSelectionIndicator />
  <TabPanelCarousel>
    <TabPanel id="home" shouldForceMount>Home</TabPanel>
    <TabPanel id="files" shouldForceMount>Files</TabPanel>
  </TabPanelCarousel>
</Tabs>;
```

Sketch of the carousel. `shouldForceMount` keeps all panels in the DOM so the scroller can show them. Inactive ones stay inert. `TabListStateContext` links scroll and selection both ways:

```tsx
import {useContext, useEffect, useRef, type ReactNode} from 'react';
import {TabListStateContext} from 'react-aria-components/Tabs';

function TabPanelCarousel({children}: {children: ReactNode}) {
  let state = useContext(TabListStateContext);
  let ref = useRef<HTMLDivElement>(null);
  let keys = state ? [...state.collection.getKeys()] : [];

  // Selection to scroll: a tab press or arrow key moves the panel.
  useEffect(() => {
    let index = keys.indexOf(state?.selectedKey);
    ref.current?.children[index]?.scrollIntoView({behavior: 'smooth', block: 'nearest', inline: 'start'});
  }, [state?.selectedKey]);

  // Scroll to selection: a swipe selects the tab when it settles.
  let onScrollEnd = () => {
    let el = ref.current;
    if (!el) return;
    let key = keys[Math.round(Math.abs(el.scrollLeft) / el.clientWidth)];
    if (key != null) state?.setSelectedKey(key);
  };

  return <div ref={ref} className="carousel" onScrollEnd={onScrollEnd}>{children}</div>;
}
```

```css
.carousel {
  display: grid;
  grid-auto-flow: column;
  grid-auto-columns: 100%;
  overflow-x: auto;
  scroll-snap-type: x mandatory;
  scrollbar-width: none;
  scroll-timeline: --carousel inline;
}

.carousel .react-aria-TabPanel {
  scroll-snap-align: start;
  scroll-snap-stop: always;
}

/* The indicator reads a timeline from a sibling, so hoist its name. */
.react-aria-Tabs {
  timeline-scope: --carousel;
}

.react-aria-Tab:nth-child(1) { anchor-name: --tab-1; }
.react-aria-Tab:nth-child(2) { anchor-name: --tab-2; }

.tab-indicator {
  position: absolute;
  top: anchor(--tab-1 bottom);
  left: anchor(--tab-1 left);
  width: anchor-size(--tab-1 width);
  height: 2px;
  animation: indicator linear both;
  animation-timeline: --carousel;
}

@keyframes indicator {
  to {
    left: anchor(--tab-2 left);
    width: anchor-size(--tab-2 width);
  }
}
```

Insights:

- The indicator is tied to scroll position, not to `selectedKey`, so it tracks the finger with no JavaScript and off the main thread.
- This replaces `SelectionIndicator`, which moves only when selection changes.
- Use one keyframe stop per tab beyond two.
- Check browser support for scroll timelines and anchor positioning for your audience, and give `.tab-indicator` a static fallback.

## Filterable CRUD table

A plant tracker with create, read, update, delete, search, filters, column resizing, and form validation. The doc page shows the running app and this component list: `Button`, `Checkbox`, `ComboBox`, `DatePicker`, `DropZone`, `Form`, `GridList`, `Menu`, `Modal`, `Popover`, `SearchField`, `Select`, `Table`, `TagGroup`, `TextField`, `ToggleButton`, `Tooltip`.

Sketch of the wiring. State lives in one place, the visible rows derive from it, and each row action opens one shared modal.

```tsx
import {useMemo, useState} from 'react';
import {useFilter} from 'react-aria-components/Autocomplete';
import {ResizableTableContainer, Table, TableHeader, TableBody, Column, ColumnResizer, Row, Cell, type SortDescriptor} from 'react-aria-components/Table';
import {SearchField, Input} from 'react-aria-components/SearchField';
import {Modal, Dialog, Heading, Button} from 'react-aria-components/Modal';
import {Form} from 'react-aria-components/Form';
import {TextField} from 'react-aria-components/TextField';
import {Label} from 'react-aria-components/Label';
import {FieldError} from 'react-aria-components/FieldError';
import {Menu, MenuItem, MenuTrigger} from 'react-aria-components/Menu';
import {Popover} from 'react-aria-components/Popover';

type Plant = {id: number; name: string; light: string};

function Plants({initial}: {initial: Plant[]}) {
  let [plants, setPlants] = useState(initial);
  let [search, setSearch] = useState('');
  let [sort, setSort] = useState<SortDescriptor>({column: 'name', direction: 'ascending'});
  let [editing, setEditing] = useState<Plant | null>(null);
  let {contains} = useFilter({sensitivity: 'base'});

  let rows = useMemo(() => {
    let filtered = plants.filter(p => contains(p.name, search));
    let sorted = [...filtered].sort((a, b) => a[sort.column].localeCompare(b[sort.column]));
    return sort.direction === 'descending' ? sorted.reverse() : sorted;
  }, [plants, search, sort, contains]);

  return (
    <>
      <SearchField aria-label="Search" value={search} onChange={setSearch}>
        <Input />
      </SearchField>
      <ResizableTableContainer>
        <Table aria-label="Plants" selectionMode="multiple" sortDescriptor={sort} onSortChange={setSort}>
          <TableHeader>
            <Column id="name" isRowHeader allowsSorting defaultWidth={240}>
              Name
              <ColumnResizer />
            </Column>
            <Column id="light" allowsSorting>Light</Column>
            <Column aria-label="Actions" width={48} />
          </TableHeader>
          <TableBody items={rows} renderEmptyState={() => 'No plants.'}>
            {plant => (
              <Row>
                <Cell>{plant.name}</Cell>
                <Cell>{plant.light}</Cell>
                <Cell>
                  <MenuTrigger>
                    <Button aria-label="Actions">⋯</Button>
                    <Popover>
                      <Menu>
                        <MenuItem onAction={() => setEditing(plant)}>Edit</MenuItem>
                        <MenuItem onAction={() => setPlants(ps => ps.filter(p => p !== plant))}>Delete</MenuItem>
                      </Menu>
                    </Popover>
                  </MenuTrigger>
                </Cell>
              </Row>
            )}
          </TableBody>
        </Table>
      </ResizableTableContainer>
      <Modal isDismissable isOpen={editing != null} onOpenChange={open => !open && setEditing(null)}>
        <Dialog>
          {({close}) => (
            <Form
              onSubmit={e => {
                e.preventDefault();
                let name = String(new FormData(e.currentTarget).get('name'));
                setPlants(ps => ps.map(p => (p === editing ? {...p, name} : p)));
                close();
              }}>
              <Heading slot="title">Edit plant</Heading>
              <TextField name="name" isRequired defaultValue={editing?.name} autoFocus>
                <Label>Name</Label>
                <Input />
                <FieldError />
              </TextField>
              <Button type="submit">Save</Button>
            </Form>
          )}
        </Dialog>
      </Modal>
    </>
  );
}
```

Insights for this kind of app:

- Mount the `Modal` beside the table, not in a `Menu`. It would unmount with the closed menu.
- Native `Form` validation with `isRequired` and `FieldError` covers the basic rules. The form does not submit until it passes.
- `sortDescriptor` only reports the user's intent: you sort the rows.
- `useFilter` compares in the current locale, unlike `includes`.
- Tags (`TagGroup`), `Select`, and `DatePicker` feed the same derive step as `search`.
- For the image field, `DropZone` holds a `FileTrigger`.

## Photo library

A photo browser with virtualized scrolling, view transitions, an adjustable waterfall layout, a folder tree, search, multi-selection, and accessible drag and drop. The doc page shows the running app and this component list: `Autocomplete`, `Button`, `GridList`, `SearchField`, `Slider`, `Tree`, `Virtualizer`, and the `dnd` guide.

Sketch of the wiring. A `Slider` value feeds `layoutOptions`, `Autocomplete` filters the grid, and the grid drags into `Tree` folders.

```tsx
import {useState} from 'react';
import {Virtualizer, WaterfallLayout, Size} from 'react-aria-components/Virtualizer';
import {GridList, GridListItem} from 'react-aria-components/GridList';
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {SearchField, Input} from 'react-aria-components/SearchField';
import {Slider, SliderTrack, SliderThumb} from 'react-aria-components/Slider';
import {Tree, TreeItem, TreeItemContent} from 'react-aria-components/Tree';
import {useDragAndDrop, isTextDropItem} from 'react-aria-components/useDragAndDrop';

type Photo = {id: string; title: string; url: string; aspectRatio: number};
type Folder = {id: string; name: string};
type LibraryProps = {
  photos: Photo[];
  folders: Folder[];
  moveToFolder: (folder: unknown, ids: string[]) => void;
};

function Library({photos, folders, moveToFolder}: LibraryProps) {
  let [size, setSize] = useState(240);
  let {contains} = useFilter({sensitivity: 'base'});

  let {dragAndDropHooks: gridDnd} = useDragAndDrop({
    getItems: keys => [...keys].map(key => ({'photo-id': String(key), 'text/plain': String(key)}))
  });

  let {dragAndDropHooks: treeDnd} = useDragAndDrop({
    acceptedDragTypes: ['photo-id'],
    getDropOperation: () => 'move',
    async onItemDrop(e) {
      let ids = await Promise.all(e.items.filter(isTextDropItem).map(i => i.getText('photo-id')));
      moveToFolder(e.target.key, ids);
    }
  });

  return (
    <>
      <Tree aria-label="Folders" items={folders} dragAndDropHooks={treeDnd}>
        {folder => (
          <TreeItem textValue={folder.name}>
            <TreeItemContent>{folder.name}</TreeItemContent>
          </TreeItem>
        )}
      </Tree>
      <Slider aria-label="Photo size" minValue={120} maxValue={480} value={size} onChange={v => setSize(v as number)}>
        <SliderTrack>
          <SliderThumb />
        </SliderTrack>
      </Slider>
      <Autocomplete filter={contains}>
        <SearchField aria-label="Search photos">
          <Input />
        </SearchField>
        <Virtualizer
          layout={WaterfallLayout}
          layoutOptions={{minItemSize: new Size(size, 0), minSpace: new Size(8, 8)}}>
          <GridList
            aria-label="Photos"
            layout="grid"
            selectionMode="multiple"
            items={photos}
            dragAndDropHooks={gridDnd}>
            {photo => (
              <GridListItem textValue={photo.title}>
                <img src={photo.url} alt="" style={{aspectRatio: photo.aspectRatio}} />
              </GridListItem>
            )}
          </GridList>
        </Virtualizer>
      </Autocomplete>
    </>
  );
}
```

View transitions for a size or filter change. Same pattern as the Toast queue:

```tsx
import {flushSync} from 'react-dom';

function withTransition(update: () => void) {
  if ('startViewTransition' in document) {
    document.startViewTransition(() => flushSync(update));
  } else {
    update();
  }
}
```

Insights for this kind of app:

- Reserve image height with `aspect-ratio`. `WaterfallLayout` measures variable heights, and a known ratio prevents jumps as images load.
- `layout="grid"` gives `GridList` two-dimensional arrow keys.
- Drag and drop across components needs only a shared custom type: `getItems` on the source and `acceptedDragTypes` on the target.
- `onItemDrop` drops on items. Use `onMove` to reorder or move folders within the tree.
- The example combines virtualization and drag and drop on the same `GridList`.
