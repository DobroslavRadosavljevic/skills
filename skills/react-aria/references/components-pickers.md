# Pickers: Select, ComboBox, Autocomplete, ListBox, Menu, TagGroup

Selection fundamentals (`selectedKeys`, `selectionBehavior`, actions) and Virtualizer details live in `collections-selection.md`. Drag and drop lives in `drag-and-drop.md`. This file keeps only the component-specific parts.

## Contents

- [Which one to pick](#which-one-to-pick)
- [Shared rules](#shared-rules)
- [Select](#select)
- [ComboBox](#combobox)
- [Autocomplete](#autocomplete)
- [ListBox](#listbox)
- [Menu](#menu)
- [TagGroup](#taggroup)
- [Common mistakes](#common-mistakes)

## Which one to pick

| Need | Use |
|------|-----|
| Pick a value from a short list, in a form, no typing | `Select` |
| Pick a value from a long list by typing, or accept free text | `ComboBox` |
| Search box that filters any collection (searchable menu, command palette, @mentions) | `Autocomplete` |
| Always-visible list of options, text and icons only | `ListBox` |
| Always-visible list with buttons, checkboxes, or inputs inside rows | `GridList` (see `components-data.md`) |
| List of actions in a popover, with submenus | `Menu` |
| Removable or filterable chips | `TagGroup` |

## Shared rules

- Import from subpaths. Each subpath re-exports the common parts. These names are **not** in the subpath and need their own import:
  - `Header`: in `react-aria-components/ListBox` and `/Menu`, but not `/Select` or `/ComboBox`. Use `react-aria-components/Header`.
  - `Group`: always `react-aria-components/Group`.
  - `Selection` type: in `/ListBox`, `/Menu`, `/TagGroup`.
  - `Keyboard`, `Separator`, `Pressable`: in `/Menu`.
- `useFilter` is exported from `/Autocomplete` and `/ComboBox`, and from `react-aria/useFilter`. It returns `{startsWith, endsWith, contains}`. It takes `Intl.CollatorOptions`. `{sensitivity: 'base'}` ignores case and diacritics, using the current locale.
- `useAsyncList` is at `react-aria-components/useAsyncList`. `useListData` is at `react-aria-components/useListData`.
- Interactive children (buttons, links, inputs) inside `ListBoxItem` or `MenuItem` are not allowed. They break keyboard and screen reader navigation. Use text and decorative graphics only.
- Set `textValue` on any item whose children are not a plain string. Typeahead, filtering, and the select value depend on it.
- Standalone `ListBox`, `TagGroup`, and `Menu` need a label: `aria-label`, `aria-labelledby`, or `<Label>` where the anatomy supports it. A section without a `<Header>` needs `aria-label`.
- Dynamic collections cache rendered items by item object identity. If a render function reads other state, pass that state in `dependencies`.
- Mix a dynamic list with static parts (a load-more sentinel) through `<Collection items={...}>`, not through `items` on the parent.
- Item render props and data attributes (all collection items): `isHovered` `[data-hovered]`, `isPressed` `[data-pressed]`, `isSelected` `[data-selected]`, `isFocused` `[data-focused]`, `isFocusVisible` `[data-focus-visible]`, `isDisabled` `[data-disabled]`, `selectionMode` `[data-selection-mode]`, `selectionBehavior`, `allowsDragging` `[data-allows-dragging]`, `isDragging` `[data-dragging]`, `isDropTarget` `[data-drop-target]`. Link items also carry `[data-href]` (the starter CSS targets it).
- Popovers: `--trigger-width` is the width of the trigger. Use it in CSS, for example `width: var(--trigger-width)`. Popover data attributes: `[data-trigger]`, `[data-placement]`, `[data-entering]`, `[data-exiting]`. Overlays render in a portal and everything else gets `aria-hidden` while open.

## Select

A button that opens a list of options, for picking from a short list. Pick `ComboBox` when users should type.

Doc: https://react-aria.adobe.com/Select

```tsx
import {Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem, Text, FieldError} from 'react-aria-components/Select';

<Select name="animal" isRequired placeholder="Pick an animal">
  <Label>Animal</Label>
  <Button>
    <SelectValue />
    <span aria-hidden>▼</span>
  </Button>
  <Text slot="description">Your favorite one.</Text>
  <FieldError />
  <Popover>
    <ListBox>
      <ListBoxItem id="cat">Cat</ListBoxItem>
      <ListBoxItem id="dog">Dog</ListBoxItem>
      <ListBoxItem id="panda" isDisabled>Panda</ListBoxItem>
    </ListBox>
  </Popover>
</Select>
```

Key props:

- Value: `value` / `defaultValue` (`Key | null`, or `Key[]` when multiple), `onChange(value)`. The value is the item `id`.
- Mode: `selectionMode: 'single' | 'multiple'` (default `'single'`). `shouldCloseOnSelect` defaults to `true` for single and `false` for multiple.
- Open state: `isOpen` / `defaultOpen`, `onOpenChange(isOpen)`. `allowsEmptyCollection` allows opening with no items.
- Items: `disabledKeys`. Put `items` on the `ListBox`.
- Forms: `name` (submits the item `id`), `form`, `autoComplete`, `isRequired`, `isDisabled`, `isInvalid`, `validate(value)`, `validationBehavior: 'native' | 'aria'` (default `'native'`). See `forms.md`.
- Text: `placeholder` (default is a localized "Select an item"), `aria-label` when there is no `<Label>`.
- Events: `onFocus`, `onBlur`, `onFocusChange`.

Deprecated, do not use in new code: `selectedKey`, `defaultSelectedKey`, `onSelectionChange` (replaced by `value`, `defaultValue`, `onChange`), and the `selectedItem` render prop on `SelectValue` (use `selectedItems`).

Styling:

- Classes: `react-aria-Select`, `react-aria-SelectValue`, plus `react-aria-Button`, `react-aria-Popover`, `react-aria-ListBox`, `react-aria-ListBoxItem`.
- `Select`: `[data-focused]`, `[data-focus-visible]`, `[data-disabled]`, `[data-open]`, `[data-invalid]`, `[data-required]`.
- `SelectValue`: `[data-placeholder]`.
- Give the popover `width: var(--trigger-width)` so it matches the button.

### Multiple selection

`value` and `onChange` take an array when `selectionMode="multiple"`. The type parameter follows the prop.

```tsx
import {useState} from 'react';
import {Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem, type Key} from 'react-aria-components/Select';

function Toppings() {
  let [value, setValue] = useState<Key[]>(['cheese']);
  return (
    <Select selectionMode="multiple" value={value} onChange={setValue}>
      <Label>Toppings</Label>
      <Button><SelectValue /></Button>
      <Popover>
        <ListBox>
          <ListBoxItem id="cheese">Cheese</ListBoxItem>
          <ListBoxItem id="ham">Ham</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}
```

The popover stays open after each pick by default in this mode.

### SelectValue render props

`SelectValue` renders the selected item's content by default. Pass a function to control it. Values: `isPlaceholder`, `selectedItems: (T | null)[]`, `selectedText: string`, `state: SelectState`. An entry in `selectedItems` can be `null`, so the docs filter those out before use.

### Sections and dynamic items

```tsx
import {Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem, ListBoxSection, Collection} from 'react-aria-components/Select';
import {Header} from 'react-aria-components/Header';

declare const groups: {name: string, children: {name: string}[]}[];

<Select>
  <Label>Food</Label>
  <Button><SelectValue /></Button>
  <Popover>
    <ListBox items={groups}>
      {group => (
        <ListBoxSection id={group.name}>
          <Header>{group.name}</Header>
          <Collection items={group.children}>
            {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
          </Collection>
        </ListBoxSection>
      )}
    </ListBox>
  </Popover>
</Select>
```

`Select` reuses `ListBox`, so links, text slots, sections, and async loading work the same way. See [ListBox](#listbox).

### Searchable select

Add `Autocomplete` as a wrapper inside the popover. `autoFocus` the search field.

```tsx
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem} from 'react-aria-components/Select';
import {SearchField, Input} from 'react-aria-components/SearchField';

declare const states: {name: string}[];

function StatePicker() {
  let {contains} = useFilter({sensitivity: 'base'});
  return (
    <Select>
      <Label>State</Label>
      <Button><SelectValue /></Button>
      <Popover style={{display: 'flex', flexDirection: 'column'}}>
        <Autocomplete filter={contains}>
          <SearchField aria-label="Search states" autoFocus>
            <Input placeholder="Search states" />
          </SearchField>
          <ListBox items={states} renderEmptyState={() => 'No results.'} style={{flex: 1}}>
            {state => <ListBoxItem>{state.name}</ListBoxItem>}
          </ListBox>
        </Autocomplete>
      </Popover>
    </Select>
  );
}
```

### Multi-select with removable tags

Render a `TagGroup` from the `SelectValue` render function. Remove through `state.setValue`. Pass `triggerRef` so the popover anchors to the whole field.

```tsx
import {useRef} from 'react';
import {Select, Label, Button, SelectValue, Popover, ListBox, ListBoxItem} from 'react-aria-components/Select';
import {TagGroup, TagList, Tag} from 'react-aria-components/TagGroup';
import {Group} from 'react-aria-components/Group';

declare const states: {id: string, name: string}[];

function StatesField() {
  let triggerRef = useRef<HTMLDivElement | null>(null);
  return (
    <Select selectionMode="multiple">
      <Label>States</Label>
      <Group aria-label="States" ref={triggerRef}>
        <SelectValue<{id: string, name: string}>>
          {({selectedItems, state}) => (
            <TagGroup
              aria-label="Selected states"
              onRemove={keys => {
                if (Array.isArray(state.value)) {
                  state.setValue(state.value.filter(k => !keys.has(k)));
                }
              }}>
              <TagList
                items={selectedItems.filter(item => item != null)}
                renderEmptyState={() => 'No selected items'}>
                {item => (
                  <Tag textValue={item.name}>
                    {item.name}
                    <Button slot="remove" aria-label="Remove">×</Button>
                  </Tag>
                )}
              </TagList>
            </TagGroup>
          )}
        </SelectValue>
        <Button aria-label="Add state">+</Button>
      </Group>
      <Popover triggerRef={triggerRef}>
        <ListBox items={states}>
          {item => <ListBoxItem>{item.name}</ListBoxItem>}
        </ListBox>
      </Popover>
    </Select>
  );
}
```

## ComboBox

A text input plus a list popover. Pick it when the list is long, when users type to filter, or when free text is valid.

Doc: https://react-aria.adobe.com/ComboBox

```tsx
import {ComboBox, Label, Input, Button, Popover, ListBox, ListBoxItem, Text, FieldError} from 'react-aria-components/ComboBox';
import {Group} from 'react-aria-components/Group';

<ComboBox name="animal" isRequired>
  <Label>Animal</Label>
  <Group>
    <Input placeholder="e.g. Cat" />
    <Button aria-label="Show options">▼</Button>
  </Group>
  <Text slot="description">Please select an animal.</Text>
  <FieldError />
  <Popover>
    <ListBox>
      <ListBoxItem id="cat">Cat</ListBoxItem>
      <ListBoxItem id="dog">Dog</ListBoxItem>
    </ListBox>
  </Popover>
</ComboBox>
```

Key props:

- Value: `value` / `defaultValue` (`Key | null`, or `Key[]` when multiple), `onChange(value)`. The value is the item `id`.
- Input: `inputValue` / `defaultInputValue`, `onInputChange(text)`.
- Items: `defaultItems` (ComboBox filters them for you), `items` (you control the list), `disabledKeys`. The item render function goes on the `ListBox`.
- Filter: `defaultFilter(textValue, inputValue)`. Default is built in.
- Popover: `menuTrigger: 'input' | 'focus' | 'manual'` (default `'input'`), `onOpenChange(isOpen, menuTrigger)`, `allowsEmptyCollection`, `shouldFocusWrap`.
- Free text: `allowsCustomValue`. `formValue: 'key' | 'text'` picks what the form submits (default `'key'`).
- Mode: `selectionMode: 'single' | 'multiple'`.
- Forms: `name`, `form`, `isRequired`, `isDisabled`, `isReadOnly`, `isInvalid`, `validate`, `validationBehavior`.

`menuTrigger` values:

- `input`: opens when the user edits the text.
- `focus`: opens when the input gets focus.
- `manual`: opens only from the button or the arrow keys.

Deprecated: `selectedKey`, `defaultSelectedKey`, `onSelectionChange`. Use `value`, `defaultValue`, `onChange`.

Styling:

- Classes: `react-aria-ComboBox`, `react-aria-ComboBoxValue`, `react-aria-Input`.
- `ComboBox`: `[data-open]`, `[data-disabled]`, `[data-invalid]`, `[data-required]`, `[data-readonly]`.
- `ComboBoxValue`: `[data-placeholder]`.

Behavior to design for:

- On blur, the input text reverts to the selected item unless `allowsCustomValue` is set.
- With both `value` and `inputValue` controlled, each interaction fires only one of `onChange` and `onInputChange`. You must update both yourself.
- React Aria clears the focused option on left and right arrow keys, because NVDA announces text edits only when no option has virtual focus.
- VoiceOver has weak `aria-activedescendant` support. React Aria adds its own live announcements on Apple devices for the focused item, the section, and the option count. Do not add a second announcer.

### Fully controlled

```tsx
import {useState} from 'react';
import {ComboBox, Label, Input, Button, Popover, ListBox, ListBoxItem, type Key} from 'react-aria-components/ComboBox';

declare const options: {id: number, name: string}[];

function Major() {
  let [field, setField] = useState<{value: Key | null, inputValue: string}>({value: null, inputValue: ''});
  let onChange = (id: Key | null) => setField({
    inputValue: id == null ? '' : options.find(o => o.id === id)?.name ?? '',
    value: id
  });
  let onInputChange = (text: string) => setField(prev => ({
    inputValue: text,
    value: text === '' ? null : prev.value
  }));

  return (
    <ComboBox defaultItems={options} value={field.value} inputValue={field.inputValue} onChange={onChange} onInputChange={onInputChange}>
      <Label>Major</Label>
      <div><Input /><Button aria-label="Show options">▼</Button></div>
      <Popover>
        <ListBox<{id: number, name: string}>>{item => <ListBoxItem>{item.name}</ListBoxItem>}</ListBox>
      </Popover>
    </ComboBox>
  );
}
```

### Filtering with useFilter

`defaultItems` uses the built-in filter. Use `defaultFilter` for another strategy. Filter items yourself and pass `items` when you need custom logic.

```tsx
import {ComboBox, useFilter} from 'react-aria-components/ComboBox';

function Example() {
  let {startsWith} = useFilter({sensitivity: 'base'});
  return <ComboBox defaultItems={options} defaultFilter={startsWith}>{/* parts */}</ComboBox>;
}
```

### Async ComboBox

Pass `items` so ComboBox does not filter on the client. Drive the input from `useAsyncList`, which aborts stale requests through `signal`.

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {ComboBox, Label, Input, Popover, ListBox, ListBoxItem, ListBoxLoadMoreItem, Collection} from 'react-aria-components/ComboBox';

function CharacterLookup() {
  let list = useAsyncList<{name: string}>({
    async load({signal, cursor, filterText}) {
      let res = await fetch(cursor || `/api/people?search=${encodeURIComponent(filterText ?? '')}`, {signal});
      let json = await res.json();
      return {items: json.results, cursor: json.next};
    }
  });

  return (
    <ComboBox inputValue={list.filterText} onInputChange={list.setFilterText} allowsEmptyCollection>
      <Label>Character</Label>
      <Input />
      <Popover>
        <ListBox renderEmptyState={() => list.isLoading ? 'Loading' : 'No results'}>
          <Collection items={list.items}>
            {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
          </Collection>
          <ListBoxLoadMoreItem onLoadMore={list.loadMore} isLoading={list.loadingState === 'loadingMore'} />
        </ListBox>
      </Popover>
    </ComboBox>
  );
}
```

Note: `useAsyncList.md` still shows a `loadingState` prop on ComboBox. `ComboBox` in `react-aria-components` has no such prop. Show loading through `renderEmptyState` and `ListBoxLoadMoreItem`.

### Item actions (create option)

`onAction` on a `ListBoxItem` runs an action instead of selecting. Use `allowsEmptyCollection` so the popover stays open while there are no matches.

```tsx
import {ComboBox, ListBoxItem} from 'react-aria-components/ComboBox';

{inputValue.length > 0 && (
  <ListBoxItem onAction={() => create(inputValue)}>{`Create "${inputValue}"`}</ListBoxItem>
)}
```

### Multiple selection with tags

`ComboBoxValue` is a separate part that shows the selected items, because the input holds the query. Its render props are `isPlaceholder`, `selectedItems`, `selectedText`, `state`. It takes a `placeholder` for the empty state.

```tsx
import {ComboBox, ComboBoxValue, Label, Input, Popover, ListBox, ListBoxItem, Button} from 'react-aria-components/ComboBox';
import {TagGroup, TagList, Tag} from 'react-aria-components/TagGroup';

declare const states: {id: string, name: string}[];

<ComboBox selectionMode="multiple">
  <Label>States</Label>
  <Input placeholder="Select a state" />
  <ComboBoxValue<{id: string, name: string}>>
    {({selectedItems, state}) => (
      <TagGroup
        aria-label="Selected states"
        onRemove={keys => {
          if (Array.isArray(state.value)) {
            state.setValue(state.value.filter(k => !keys.has(k)));
          }
        }}>
        <TagList items={selectedItems.filter(item => item != null)}>
          {item => <Tag textValue={item.name}>{item.name}<Button slot="remove" aria-label="Remove">×</Button></Tag>}
        </TagList>
      </TagGroup>
    )}
  </ComboBoxValue>
  <Popover>
    <ListBox items={states}>{item => <ListBoxItem>{item.name}</ListBoxItem>}</ListBox>
  </Popover>
</ComboBox>
```

### Mobile and portals

The blog post `blog/building-a-combobox` covers these facts, which still shape custom overlays:

- iOS Safari does not shrink the window for the on-screen keyboard. Size overlays from `window.visualViewport.height` and its `resize` event, not `window.innerHeight`.
- The listbox is portaled to the end of the document so it is never clipped by a parent's overflow. While open, everything except the input and the list is `aria-hidden`, so screen reader users do not wander away.
- The tray described there belongs to the React Spectrum component. `react-aria-components` gives you a `Popover`; a phone tray is yours to build.

## Autocomplete

A wrapper that links a text input to a collection and filters it. It renders no DOM. Use it for searchable menus, command palettes, filterable selects, and mentions. Pick `ComboBox` when you need a form field with one value.

Doc: https://react-aria.adobe.com/Autocomplete

```tsx
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {SearchField, Input, Label} from 'react-aria-components/SearchField';
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';

function Tags() {
  let {contains} = useFilter({sensitivity: 'base'});
  return (
    <Autocomplete filter={contains}>
      <SearchField>
        <Label>Tags</Label>
        <Input placeholder="Search tags" />
      </SearchField>
      <ListBox aria-label="Tags" selectionMode="multiple" renderEmptyState={() => 'No results.'} style={{height: 200}}>
        <ListBoxItem>News</ListBoxItem>
        <ListBoxItem>Travel</ListBoxItem>
      </ListBox>
    </Autocomplete>
  );
}
```

Props:

- Input: `inputValue` / `defaultInputValue`, `onInputChange(value)`.
- Filter: `filter(textValue, inputValue, node)`. Without it, the items are treated as controlled, which is what server search needs.
- Focus: `disableVirtualFocus` (default `false`) makes the collection directly tabbable. `disableAutoFocusFirst` (default `false`) stops focusing the first item after each filter. It applies only with virtual focus on.

Children: one `SearchField` or `TextField`, and one of `Menu`, `ListBox`, `TagGroup`, `GridList`, `Table`.

Virtual focus: `Menu` and `ListBox` support it. The arrow keys move through the list while DOM focus stays in the input. `TagGroup`, `GridList`, and `Table` are reached by Tab.

Filtering uses each item's text value, so set `textValue` on items with rich children. The docs' `Table` example sets `textValue` on each `Cell`.

### Menu in a popover

```tsx
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {MenuTrigger, Menu, MenuItem, Popover} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';
import {SearchField, Input} from 'react-aria-components/SearchField';

function AddTag() {
  let {contains} = useFilter({sensitivity: 'base'});
  return (
    <MenuTrigger>
      <Button>Add tag</Button>
      <Popover style={{display: 'flex', flexDirection: 'column'}}>
        <Autocomplete filter={contains}>
          <SearchField aria-label="Search tags" autoFocus>
            <Input placeholder="Search tags" />
          </SearchField>
          <Menu style={{flex: 1}} renderEmptyState={() => 'No results.'}>
            <MenuItem>News</MenuItem>
            <MenuItem>Travel</MenuItem>
          </Menu>
        </Autocomplete>
      </Popover>
    </MenuTrigger>
  );
}
```

### Other collections

`TagGroup`, `GridList`, and `Table` work the same way as children. A `GridList` item needs `textValue`. A `Table` goes in a `ResizableTableContainer` if you want resizing, with `renderEmptyState` on `TableBody`. See `components-data.md`.

### Server search

Leave out `filter` and pass the server's results as the items.

```tsx
import {Autocomplete} from 'react-aria-components/Autocomplete';
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {SearchField, Input, Label} from 'react-aria-components/SearchField';
import {ListBox, ListBoxItem} from 'react-aria-components/ListBox';

function Search() {
  let list = useAsyncList<{name: string}>({
    async load({signal, filterText}) {
      let res = await fetch(`/api/people?search=${encodeURIComponent(filterText ?? '')}`, {signal});
      return {items: (await res.json()).results};
    }
  });

  return (
    <Autocomplete inputValue={list.filterText} onInputChange={list.setFilterText}>
      <SearchField>
        <Label>People</Label>
        <Input />
      </SearchField>
      <ListBox items={list.items} selectionMode="multiple" renderEmptyState={() => 'No results found.'} style={{height: 300}}>
        {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
      </ListBox>
    </Autocomplete>
  );
}
```

### Command palette

`Autocomplete` plus `Menu` inside a modal dialog. The keyboard shortcut is your code.

```tsx
import {useEffect, useState} from 'react';
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {DialogTrigger, Dialog} from 'react-aria-components/Dialog';
import {Modal, ModalOverlay} from 'react-aria-components/Modal';
import {Button} from 'react-aria-components/Button';
import {Menu, MenuItem, Text} from 'react-aria-components/Menu';
import {SearchField, Input} from 'react-aria-components/SearchField';

function CommandPalette() {
  let [isOpen, setOpen] = useState(false);
  let {contains} = useFilter({sensitivity: 'base'});

  useEffect(() => {
    let isMac = /mac(os|intosh)/i.test(navigator.userAgent);
    let onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'j' && (isMac ? e.metaKey : e.ctrlKey)) {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  return (
    <DialogTrigger isOpen={isOpen} onOpenChange={setOpen}>
      <Button>Open commands</Button>
      <ModalOverlay isDismissable>
        <Modal>
          <Dialog aria-label="Commands" style={{display: 'flex', flexDirection: 'column', height: 356}}>
            <Autocomplete filter={contains}>
              <SearchField aria-label="Search commands" autoFocus>
                <Input placeholder="Search commands" />
              </SearchField>
              <Menu style={{flex: 1}} renderEmptyState={() => 'No results found.'} onAction={key => run(key)}>
                <MenuItem id="new-file" textValue="Create new file"><Text slot="label">Create new file</Text></MenuItem>
                <MenuItem id="assign" textValue="Assign to me"><Text slot="label">Assign to me</Text></MenuItem>
              </Menu>
            </Autocomplete>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  );
}
```

The docs' example does not close the modal when an item runs. Call `setOpen(false)` in `onAction` if your palette should close.

### Inline completions (@mentions)

Give `Autocomplete` only the substring after the `@`, and give the field the full text. Control the popover with `isOpen`.

```tsx
import {Autocomplete, useFilter} from 'react-aria-components/Autocomplete';
import {TextField, TextArea, Label} from 'react-aria-components/TextField';
import {Popover} from 'react-aria-components/Popover';
import {Menu, MenuItem} from 'react-aria-components/Menu';

declare const usernames: {id: string, name: string}[];

<Autocomplete inputValue={filterValue} filter={startsWith}>
  <TextField value={inputValue} onChange={onTextChange} onSelect={updateFilter} onBlur={updateFilter}>
    <Label>Comment</Label>
    <TextArea ref={inputRef} />
  </TextField>
  <Popover
    triggerRef={inputRef}
    isOpen={anchorIndex >= 0}
    isNonModal
    placement="bottom start"
    trigger="MenuTrigger"
    getTargetRect={target => caretRectFor(target, anchorIndex)}>
    <Menu items={usernames} renderEmptyState={() => 'No results found.'} onAction={insertCompletion}>
      {user => <MenuItem>{user.name}</MenuItem>}
    </Menu>
  </Popover>
</Autocomplete>
```

How the docs wire it:

- `updateFilter` reads `selectionStart` and `value` from the textarea, finds the last `@` before the caret, and stores `anchorIndex` and the text between. A space in that text cancels it. To close, reset only the anchor, so the menu does not flicker during its exit.
- `getTargetRect` positions the popover at the anchor character. The docs use the `textarea-caret` package to measure the caret, offset by the target's `getBoundingClientRect()`, and return a `DOMRect`.
- `insertCompletion` rebuilds the text inside `flushSync` from `react-dom`, then calls `setSelectionRange` on the textarea and `updateFilter`.

## ListBox

An always-visible list of options. Also the list inside `Select` and `ComboBox`. Pick `GridList` when rows need interactive children.

Doc: https://react-aria.adobe.com/ListBox

```tsx
import {ListBox, ListBoxItem, ListBoxSection, ListBoxLoadMoreItem, Text, Header, SelectionIndicator} from 'react-aria-components/ListBox';

<ListBox aria-label="Permissions" selectionMode="single">
  <ListBoxSection>
    <Header>Roles</Header>
    <ListBoxItem id="read" textValue="Read">
      <SelectionIndicator />
      <Text slot="label">Read</Text>
      <Text slot="description">Read only</Text>
    </ListBoxItem>
  </ListBoxSection>
  <ListBoxLoadMoreItem />
</ListBox>
```

Key props:

- Collection: `items`, `dependencies`, `disabledKeys`, `renderEmptyState(renderProps)`.
- Selection: `selectionMode: 'none' | 'single' | 'multiple'`, `selectedKeys` / `defaultSelectedKeys` (`'all' | Iterable<Key>`), `onSelectionChange(keys: Selection)`, `selectionBehavior: 'toggle' | 'replace'`, `disallowEmptySelection`, `shouldSelectOnPressUp`, `escapeKeyBehavior: 'clearSelection' | 'none'`.
- Actions: `onAction(key)` on the list, `onAction()` on an item.
- Layout: `layout: 'stack' | 'grid'` (default `'stack'`), `orientation: 'vertical' | 'horizontal'` (default `'vertical'`).
- Focus: `shouldFocusWrap`, `shouldFocusOnHover`.
- Drag and drop: `dragAndDropHooks`. See `drag-and-drop.md`.

`ListBoxItem`: `id`, `textValue`, `isDisabled`, `value`, `onAction`, press and hover events, link props (`href`, `target`, `rel`, `download`, `hrefLang`, `ping`, `referrerPolicy`, `routerOptions`), and `render`.

Styling:

- Classes: `react-aria-ListBox`, `react-aria-ListBoxItem`, `react-aria-ListBoxSection`, `react-aria-ListBoxLoadingIndicator`.
- `ListBox`: `[data-empty]`, `[data-focused]`, `[data-focus-visible]`, `[data-drop-target]`, `[data-layout="stack | grid"]`, `[data-orientation="vertical | horizontal"]`. Render values also include `state`.
- Items: see [Shared rules](#shared-rules).

### Layouts

`layout` and `orientation` change keyboard navigation and drag and drop. They do not lay out the DOM: write the flex or grid CSS yourself, keyed on `[data-layout]` and `[data-orientation]`.

```tsx
import {ListBox, ListBoxItem, Text} from 'react-aria-components/ListBox';

declare const planets: {id: number, title: string, description: string}[];

<ListBox aria-label="Planets" layout="grid" orientation="horizontal" items={planets} selectionMode="multiple">
  {item => (
    <ListBoxItem textValue={item.title}>
      <Text slot="label">{item.title}</Text>
      <Text slot="description">{item.description}</Text>
    </ListBoxItem>
  )}
</ListBox>
```

For virtualized lists, wrap in `Virtualizer` with `ListLayout` or `GridLayout`. See `collections-selection.md`.

### Async loading

Show a spinner with `renderEmptyState`, and add `ListBoxLoadMoreItem` at the end of the list or a section. The list must scroll, so give it a height.

```tsx
import {useAsyncList} from 'react-aria-components/useAsyncList';
import {ListBox, ListBoxItem, ListBoxLoadMoreItem, Collection} from 'react-aria-components/ListBox';

function Pokemon() {
  let list = useAsyncList<{name: string}>({
    async load({signal, cursor}) {
      let res = await fetch(cursor || 'https://pokeapi.co/api/v2/pokemon', {signal});
      let json = await res.json();
      return {items: json.results, cursor: json.next};
    }
  });

  return (
    <ListBox aria-label="Pick a Pokemon" selectionMode="single" style={{height: 200, overflow: 'auto'}} renderEmptyState={() => 'Loading'}>
      <Collection items={list.items}>
        {item => <ListBoxItem id={item.name}>{item.name}</ListBoxItem>}
      </Collection>
      <ListBoxLoadMoreItem onLoadMore={list.loadMore} isLoading={list.loadingState === 'loadingMore'}>
        Loading more
      </ListBoxLoadMoreItem>
    </ListBox>
  );
}
```

`ListBoxLoadMoreItem` props: `onLoadMore`, `isLoading`, `scrollOffset` (default `1`, a percentage of the visible height), `className`.

### Links

- `href` on `ListBoxItem` makes it a link, rendered as `<a>`.
- With `selectionMode`, link items are not selectable by default. They only navigate.
- With `selectionBehavior="replace"`, a click or Space selects, and a double click or Enter navigates.
- For a framework link component, use `render` and keep `href` on the item so React Aria knows it is a link.

```tsx
<ListBoxItem
  href="/settings"
  render={domProps => 'href' in domProps ? <RouterLink {...domProps} /> : <div {...domProps} />} />
```

## Menu

A list of actions or options in a popover. Pick `Select` for a form value and `ListBox` for an always-visible list.

Doc: https://react-aria.adobe.com/Menu

Pointer-friendly submenus: https://react-aria.adobe.com/blog/creating-a-pointer-friendly-submenu-experience

```tsx
import {MenuTrigger, Menu, MenuItem, MenuSection, SubmenuTrigger, MenuLoadMoreItem, Popover, Header, Text, Keyboard, Separator, SelectionIndicator} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';

<MenuTrigger>
  <Button>Actions</Button>
  <Popover>
    <Menu onAction={key => run(key)}>
      <MenuItem id="copy" textValue="Copy">
        <Text slot="label">Copy</Text>
        <Text slot="description">Copy the selected text</Text>
        <Keyboard>⌘C</Keyboard>
      </MenuItem>
      <Separator />
      <MenuSection>
        <Header>Share</Header>
        <MenuItem id="email">Email</MenuItem>
      </MenuSection>
      <SubmenuTrigger>
        <MenuItem>More</MenuItem>
        <Popover>
          <Menu>
            <MenuItem id="print">Print</MenuItem>
          </Menu>
        </Popover>
      </SubmenuTrigger>
    </Menu>
  </Popover>
</MenuTrigger>
```

`MenuTrigger` props: `trigger: 'press' | 'longPress' | 'contextMenu'` (default `'press'`), `isOpen` / `defaultOpen`, `onOpenChange`.

`Menu` props:

- Collection: `items`, `dependencies`, `disabledKeys`, `renderEmptyState()`, `aria-label`.
- Actions: `onAction(key, value)`, `onClose()`, `shouldCloseOnSelect`, `shouldFocusWrap`.
- Selection: `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `disallowEmptySelection`, `escapeKeyBehavior`.

`MenuItem` props: `id`, `textValue`, `isDisabled`, `onAction()`, `shouldCloseOnSelect`, `value`, link props, press and hover events.

`MenuSection` props: `items`, `dependencies`, `aria-label`, `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `disallowEmptySelection`, `shouldCloseOnSelect`.

`SubmenuTrigger` props: `delay` (default `200` ms on hover).

Styling:

- Classes: `react-aria-Menu`, `react-aria-MenuItem`, `react-aria-MenuSection`, `react-aria-MenuLoadingIndicator`.
- `Menu`: `[data-empty]`.
- `MenuItem`: the shared item attributes, plus `[data-has-submenu]` and `[data-open]`. Render values `hasSubmenu`, `isOpen`, `isSelected`, `selectionMode` drive the chevron and check marks.
- A submenu popover is marked `[data-trigger="SubmenuTrigger"]`, so it can have its own offset.

```tsx
import {MenuItem, Text} from 'react-aria-components/Menu';

<MenuItem textValue="Rulers">
  {({isSelected, hasSubmenu}) => (
    <>
      {isSelected && <span aria-hidden>✓</span>}
      <Text slot="label">Rulers</Text>
      {hasSubmenu && <span aria-hidden>›</span>}
    </>
  )}
</MenuItem>
```

### Selection

Set `selectionMode` on the `Menu`. With multiple selection, set `shouldCloseOnSelect={false}` if the menu should stay open.

Sections can each own a selection. Actions and selection can sit in one menu.

```tsx
import {Menu, MenuItem, MenuSection, Header, type Selection} from 'react-aria-components/Menu';
import {useState} from 'react';

function EditMenu() {
  let [style, setStyle] = useState<Selection>(new Set(['bold']));
  let [align, setAlign] = useState<Selection>(new Set(['left']));
  return (
    <Menu>
      <MenuSection>
        <Header>Clipboard</Header>
        <MenuItem>Cut</MenuItem>
      </MenuSection>
      <MenuSection selectionMode="multiple" selectedKeys={style} onSelectionChange={setStyle}>
        <Header>Text style</Header>
        <MenuItem id="bold">Bold</MenuItem>
        <MenuItem id="italic">Italic</MenuItem>
      </MenuSection>
      <MenuSection selectionMode="single" selectedKeys={align} onSelectionChange={setAlign}>
        <Header>Alignment</Header>
        <MenuItem id="left">Left</MenuItem>
        <MenuItem id="right">Right</MenuItem>
      </MenuSection>
    </Menu>
  );
}
```

### Triggers

`MenuTrigger` works with any pressable React Aria component (`Button`, `Link`). For a custom element, wrap it in `Pressable`. The child must have an interactive ARIA role or a semantic element, forward its `ref`, and spread all props to a DOM element.

```tsx
import {MenuTrigger, Pressable, Popover, Menu, MenuItem} from 'react-aria-components/Menu';

<MenuTrigger>
  <Pressable><span role="button">Custom trigger</span></Pressable>
  <Popover><Menu><MenuItem>Open</MenuItem></Menu></Popover>
</MenuTrigger>
```

Long press: for a button with a primary press action and a menu of secondary actions. Keyboard users open it with Alt + Down.

```tsx
import {MenuTrigger, Popover, Menu, MenuItem} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';

<MenuTrigger trigger="longPress">
  <Button onPress={crop}>Crop</Button>
  <Popover><Menu><MenuItem>Rotate</MenuItem></Menu></Popover>
</MenuTrigger>
```

Context menu: opens on right click, on long press with touch, and through OS and screen reader keyboard shortcuts. It is positioned at the click point.

```tsx
import {MenuTrigger, Popover, Menu, MenuItem} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';

<MenuTrigger trigger="contextMenu">
  <Button>Right click here</Button>
  <Popover><Menu><MenuItem>Get info</MenuItem></Menu></Popover>
</MenuTrigger>
```

### Submenus

- Nest `SubmenuTrigger` inside any `Menu`, to any depth. Its children are a `MenuItem` and a `Popover` holding a `Menu`.
- The docs' short examples hide the popover because the starter adds it. Real code needs it.
- Moving the pointer toward an open submenu does not close it. React Aria checks the pointer direction against the submenu's corners with a 15 degree tolerance, and needs two invalid moves in a row before closing. It also closes after a timeout with no movement. It is off for touch and pen. Do not build your own safe triangle.

### Async, links, empty state, separators

- Async: `renderEmptyState` for the first load, then `MenuLoadMoreItem` at the end with `<Collection items={list.items}>`. Props match `ListBoxLoadMoreItem`.
- Links: `href` on `MenuItem`, rendered as `<a>`. Use `render` for a router link, and keep `href`. The pattern is the same as in [ListBox](#links).
- Empty state: `renderEmptyState={() => 'No actions available.'}` with `{[]}` as children.
- Separators: `<Separator />` between items or sections.

## TagGroup

A focusable list of chips, with selection and removal. Use it for filters, keywords, and picked values.

Doc: https://react-aria.adobe.com/TagGroup

```tsx
import {TagGroup, TagList, Tag, Label, Text, Button, SelectionIndicator} from 'react-aria-components/TagGroup';
import {useListData} from 'react-aria-components/useListData';

function Categories() {
  let list = useListData({
    initialItems: [{id: 1, name: 'News'}, {id: 2, name: 'Travel'}]
  });

  return (
    <TagGroup onRemove={keys => list.remove(...keys)}>
      <Label>Categories</Label>
      <TagList items={list.items} renderEmptyState={() => 'No categories'}>
        {item => (
          <Tag textValue={item.name}>
            {({allowsRemoving}) => (
              <>
                <SelectionIndicator />
                {item.name}
                {allowsRemoving && <Button slot="remove" aria-label="Remove">×</Button>}
              </>
            )}
          </Tag>
        )}
      </TagList>
      <Text slot="description">Pick up to five.</Text>
      <Text slot="errorMessage" />
    </TagGroup>
  );
}
```

Props:

- `TagGroup`: `onRemove(keys: Set<Key>)`, `selectionMode`, `selectedKeys` / `defaultSelectedKeys`, `onSelectionChange`, `selectionBehavior`, `disallowEmptySelection`, `disabledKeys`, `shouldSelectOnPressUp`, `escapeKeyBehavior`, `onAction(key)`, `aria-label`.
- `TagList`: `items`, `dependencies`, `renderEmptyState`. `items` and the render function go here, not on `TagGroup`. The docs' `<TagGroup items>` comes from their starter wrapper.
- `Tag`: `id`, `textValue` (required when children are not a plain string), `isDisabled`, `onAction`, link props, press and hover events.

Styling:

- Classes: `react-aria-TagGroup`, `react-aria-TagList`, `react-aria-Tag`.
- `TagList`: `[data-empty]`, `[data-focused]`, `[data-focus-visible]`.
- `Tag`: shared item attributes, without the drag ones, plus `[data-allows-removing]`.
- `Button[slot="remove"]` and `Text[slot="errorMessage"]` are the style hooks for those parts.

Behavior:

- Removal needs both `onRemove` on the group and a `<Button slot="remove">` in each tag. The render prop `allowsRemoving` tells a tag whether the group allows removal, so render the button from it.
- Use `<Tag href>` for links. Tags can not be `<a>` elements because of an HTML spec limit, so React Aria handles the click with JavaScript and triggers native navigation. For a client-side router, use `onAction` to navigate instead of `href`.
- Actions: with `onAction` and no selection, a press runs the action.

## Common mistakes

- Using `label`, `description`, or `errorMessage` props on `Select`, `ComboBox`, or `TagGroup`, or `items` on `Select` or `TagGroup`. Those are docs starter props. Write `<Label>`, `<Text slot="description">`, `<FieldError>`, `<Text slot="errorMessage">`, and put `items` on `ListBox` or `TagList`.
- Leaving out `Popover` in `MenuTrigger` or `SubmenuTrigger`. The docs' starter adds it; the real anatomy needs it.
- Using `selectedKey` and `onSelectionChange` on `Select` or `ComboBox`. They are deprecated. Use `value` and `onChange`.
- Passing `defaultItems` with server results. `defaultItems` filters on the client. Use `items`.
- Forgetting `allowsEmptyCollection` on `ComboBox`, so `renderEmptyState` never shows because the popover closes.
- Putting a `Button` inside `ListBoxItem` or `MenuItem`. Use `GridList` for rows with controls.
- Giving a `ListBox` a `layout` and expecting a grid. Write the CSS.
- Rich `MenuItem` children without `textValue` inside `Autocomplete`. The filter then has no text to match.
