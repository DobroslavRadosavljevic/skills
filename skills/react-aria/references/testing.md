# Testing React Aria components

Docs page: `https://react-aria.adobe.com/testing` (`.md` suffix gives Markdown). Each pattern has its own page, such as `https://react-aria.adobe.com/Select/testing`.

Package versions: `@react-aria/test-utils` 1.0.0-rc.1 is a release candidate. Pin the exact version, because its API can still change.

The Vitest setup below is not in the docs. It was run against Vitest 5.1.0, jsdom 31, React 19.2, `@testing-library/react` 16.1, `@testing-library/dom` 10.4, `@testing-library/user-event` 14.5, and `react-aria-components` 1.22.1. Lines marked "Tested" passed in that run. Other testers were read from types and source, and not all were run.

## Contents

1. [Queries: roles and test ids](#queries-roles-and-test-ids)
2. [user-event](#user-event)
3. [Install](#install)
4. [Vitest setup](#vitest-setup)
5. [Jest setup](#jest-setup)
6. [Timers](#timers)
7. [Long press](#long-press)
8. [Move and drag events](#move-and-drag-events)
9. [User and createTester](#user-and-createtester)
10. [Tester reference](#tester-reference)
11. [Overlays, focus, and toasts](#overlays-focus-and-toasts)
11. [Browser mode and Playwright](#browser-mode-and-playwright)
12. [Docs and types disagreements](#docs-and-types-disagreements)

## Queries: roles and test ids

Query by role first. ARIA semantics change less often than the DOM.

| Component | Roles to query |
| --------- | -------------- |
| `Button`, `Select` trigger, `MenuTrigger` button | `button` |
| `ListBox`, `Select` popup | `listbox`, `option`, sections as `group` |
| `ComboBox` | `combobox`, then `listbox`, `option` |
| `Menu` | `menu`, `menuitem`, `menuitemradio`, `menuitemcheckbox`, sections as `group` |
| `Table` | `grid` or `treegrid`, `rowgroup`, `columnheader`, `row`, `rowheader`, `gridcell` |
| `GridList` | `grid`, `row`, `gridcell` |
| `Tree` | `treegrid`, `row`, `gridcell` |
| `Tabs` | `tablist`, `tab`, `tabpanel` |
| `RadioGroup` | `radiogroup`, `radio` |
| `CheckboxGroup` | `group`, `checkbox` |
| `Modal`, `Popover` with `Dialog` | `dialog` or `alertdialog` |
| `Slider` | `slider` on the hidden input |

```tsx
import {render, within} from '@testing-library/react';

let tree = render(<MyComponent />);
let submit = tree.getByRole('button', {name: 'Submit'});
let firstRowCheckbox = within(tree.getAllByRole('row')[1]).getByRole('checkbox');
```

Use a test id when roles are ambiguous, or when text changes by locale. React Aria Components pass all `data-*` attributes to the DOM node:

```tsx
import {render} from '@testing-library/react';
import {Input, Label, TextField} from 'react-aria-components/TextField';

function LoginForm() {
  return (
    <>
      <TextField data-testid="username">
        <Label>Username</Label>
        <Input />
      </TextField>
      <TextField data-testid="password">
        <Label>Password</Label>
        <Input type="password" />
      </TextField>
    </>
  );
}

let tree = render(<LoginForm />);
let username = tree.getByTestId('username');
```

`data-testid` lands on the wrapper of a compound component, not on the `Input`. Query the input with `getByLabelText`, or use `within(username).getByRole('textbox')`.

Popups render in a portal outside the render container. Query them with `screen`, not with `within(container)`.

## user-event

React Aria depends on the full browser event sequence: `mousemove`, `mouseover`, `mousedown`, `focus`, `mouseup`, `click`. A single `fireEvent.click` can skip press and focus behavior. Use `user-event`.

```tsx
// no-check: uses test runner globals.
import {render, screen} from '@testing-library/react';
import userEvent from '@testing-library/user-event';

it('logs in', async () => {
  let user = userEvent.setup();
  render(<LoginForm />);

  await user.click(screen.getByLabelText('Username'));
  await user.keyboard('devon');
  await user.tab();
  await user.keyboard('Pas$w0rd');
  await user.tab();
  await user.keyboard('[Enter]');
});
```

The docs snippet calls `userEvent.click(...)` without `await`. That is the v13 style. In v14 every call is async. Always `await`.

Touch: pass `pointerMap` from the test utils, then use `TouchA`:

```tsx
import userEvent from '@testing-library/user-event';
import {pointerMap} from '@react-aria/test-utils';

let user = userEvent.setup({delay: null, pointerMap});
await user.pointer({target: element, keys: '[TouchA]'});
```

`pointerMap` names: `MouseLeft`, `MouseRight`, `MouseMiddle`, `TouchA`, `TouchB`, `TouchC`.

## Install

```bash
bun add -d --exact @react-aria/test-utils@1.0.0-rc.1
bun add -d --exact @testing-library/dom@10.4.0 @testing-library/user-event@14.5.2 @testing-library/react@16.1.0 @testing-library/jest-dom
bun add -d --exact vitest jsdom
```

- Peer dependencies are `@testing-library/dom` `^10` and `@testing-library/user-event` `^14`.
- The docs require React 18 or newer for the utilities.

## Vitest setup

The docs show Jest. The APIs map directly:

| Jest | Vitest |
| ---- | ------ |
| `jest.useFakeTimers()` | `vi.useFakeTimers()` |
| `jest.advanceTimersByTime` | `vi.advanceTimersByTime` |
| `jest.runAllTimers()` | `vi.runAllTimers()` |
| `jest.spyOn` | `vi.spyOn` |

Two differences need setup. Both are tested failures:

1. **Globals.** `installPointerEvent` and `installMouseEvent` call global `beforeAll` and `afterAll`. With `globals: false`, the test file fails at load with `ReferenceError: beforeAll is not defined`. Set `globals: true`. React Testing Library also uses these globals to set up its act environment.
2. **Fake timers hang.** Testing Library advances fake timers through a global `jest` object. Under Vitest that object does not exist, so `await user.click()` and `waitFor` hang until the test times out. Pick one fix below.

```ts
// no-check: vitest is your own dependency.
// vitest.config.ts
import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts']
  }
});
```

```ts
// no-check: vitest and jest-dom/vitest are your own dependencies.
// test/setup.ts
import '@testing-library/jest-dom/vitest';
import {act, cleanup} from '@testing-library/react';
import {afterEach, vi} from 'vitest';

// Fix 1 for fake timers: give Testing Library the object it looks for.
(globalThis as any).jest = {advanceTimersByTime: (ms: number) => vi.advanceTimersByTime(ms)};

afterEach(() => {
  if (vi.isFakeTimers()) {
    act(() => {
      vi.runAllTimers();
    });
    vi.useRealTimers();
  }
  cleanup();
});
```

Fix 2 for fake timers, without the `jest` object: `vi.useFakeTimers({shouldAdvanceTime: true})`. Tested: both fixes pass the same suite. Fix 1 keeps time under your control. Fix 2 lets time run with the real clock.

Add `"types": ["vitest/globals", "@testing-library/jest-dom"]` to your test `tsconfig` when you use globals.

Complete test file. Tested:

```tsx
// no-check: uses test runner globals.
import {render, screen} from '@testing-library/react';
import {User, installPointerEvent} from '@react-aria/test-utils';
import {Button, Label, ListBox, ListBoxItem, Popover, Select, SelectValue} from 'react-aria-components/Select';

function PetSelect() {
  return (
    <Select data-testid="pet">
      <Label>Pet</Label>
      <Button><SelectValue /></Button>
      <Popover>
        <ListBox>
          <ListBoxItem>Cat</ListBoxItem>
          <ListBoxItem>Dog</ListBoxItem>
        </ListBox>
      </Popover>
    </Select>
  );
}

describe('PetSelect', () => {
  installPointerEvent();
  beforeEach(() => {
    vi.useFakeTimers();
  });

  let testUser = new User({interactionType: 'mouse', advanceTimer: ms => vi.advanceTimersByTime(ms)});

  it('selects with the mouse', async () => {
    render(<PetSelect />);
    let tester = testUser.createTester('Select', {root: screen.getByTestId('pet')});
    await tester.toggleOptionSelection({option: 'Cat'});
    expect(tester.getTrigger()).toHaveTextContent('Cat');
  });

  it('selects with the keyboard', async () => {
    render(<PetSelect />);
    let tester = testUser.createTester('Select', {
      root: screen.getByTestId('pet'),
      interactionType: 'keyboard'
    });
    await tester.toggleOptionSelection({option: 'Dog'});
    expect(tester.getTrigger()).toHaveTextContent('Dog');
  });
});
```

Use the arrow form for `advanceTimer`. It is safe whatever the timer API does with `this`.

Real timers need no `jest` object. Tested: `userEvent.setup()`, `findByRole`, and `waitFor` work with real timers and no other setup.

## Jest setup

```tsx
// no-check: uses test runner globals.
import {act, render, screen} from '@testing-library/react';
import {User} from '@react-aria/test-utils';

let testUser = new User({interactionType: 'mouse', advanceTimer: jest.advanceTimersByTime});

beforeAll(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  act(() => {
    jest.runAllTimers();
  });
});

it('toggles a row', async () => {
  render(<MyTable data-testid="test-table" />);
  let table = testUser.createTester('Table', {root: screen.getByTestId('test-table')});
  await table.toggleRowSelection({row: 2});
  expect(table.getSelectedRows()).toHaveLength(1);
});
```

## Timers

With fake timers, advance time after interactions, such as after selection, and after each test. If a query fails like this after an interaction, run the timers:

```text
TestingLibraryElementError: Unable to find an accessible element with the role "listbox"
```

```tsx
import {act} from '@testing-library/react';

act(() => {
  vi.runAllTimers(); // jest.runAllTimers() in Jest
});
```

With real timers, wait for a state instead:

```tsx
import {waitFor} from '@testing-library/react';

await waitFor(() => {
  expect(getByRole('dialog')).toBeInTheDocument();
});
```

With your own `user-event` instance and fake timers, pass `advanceTimers` or `delay: null`:

```tsx
import userEvent from '@testing-library/user-event';

let user = userEvent.setup({advanceTimers: ms => vi.advanceTimersByTime(ms)});
```

`User` already calls `userEvent.setup({delay: null, pointerMap})` for its testers.

`User.advanceTimer` defaults to a real `setTimeout` promise (source). Under fake timers that promise never resolves. Always pass `advanceTimer` when you use fake timers.

Dates: mock the zone with `setLocalTimeZone` from `@internationalized/date`, and restore it with `resetLocalTimeZone`.

## Long press

Needs a global `PointerEvent`. jsdom lacks a complete one, so call `installPointerEvent()` in the `describe` or at the top of the file.

```tsx
// no-check: uses test runner globals.
import {render, screen} from '@testing-library/react';
import {installPointerEvent, triggerLongPress} from '@react-aria/test-utils';
import {Button} from 'react-aria-components/Button';
import {Menu, MenuItem, MenuTrigger} from 'react-aria-components/Menu';
import {Popover} from 'react-aria-components/Popover';

installPointerEvent();

it('opens on long press', async () => {
  vi.useFakeTimers();
  render(
    <MenuTrigger trigger="longPress">
      <Button>Actions</Button>
      <Popover>
        <Menu>
          <MenuItem>One</MenuItem>
        </Menu>
      </Popover>
    </MenuTrigger>
  );
  await triggerLongPress({
    element: screen.getByRole('button'),
    advanceTimer: ms => vi.advanceTimersByTime(ms)
  });
  expect(screen.getByRole('menu')).toBeInTheDocument();
});
```

- Signature: `triggerLongPress({element, advanceTimer, pointerOpts?}): Promise<void>`. `pointerOpts.pointerType` defaults to `'mouse'`. The press lasts 500 ms.
- Tested with the default mouse pointer type. A direct call with `pointerType: 'touch'` on a `MenuTrigger` did not open the menu in jsdom. The reason was not found.
- Testers do this for you with `needsLongPress: true`.
- For `Table`, `GridList`, `ListBox`, and `Tree`, `needsLongPress` acts only when the interaction type is `touch` (source). `Menu.open` supports it with mouse and touch.
- Row long press also needs `checkboxSelection: false` when the row has a checkbox, because the tester presses the checkbox first. Tested on `Table` with `selectionBehavior="replace"`.

Components with long press configurations: `GridList`, `ListBox`, `Menu`, `Table`, `Tree`.

## Move and drag events

For `ColorArea`, `ColorSlider`, `ColorWheel`, and `Slider`. Mock `MouseEvent` with `installMouseEvent` so `pageX` and `pageY` work. Mock the track size so the math has real numbers. Tested on `Slider`:

```tsx
// no-check: uses test runner globals.
import {fireEvent, render, screen} from '@testing-library/react';
import {installMouseEvent} from '@react-aria/test-utils';
import {Slider, SliderThumb, SliderTrack} from 'react-aria-components/Slider';

installMouseEvent();

beforeAll(() => {
  vi.spyOn(window.HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(
    () => ({top: 0, left: 0, width: 100, height: 10}) as DOMRect
  );
});

it('moves the thumb', () => {
  let onChange = vi.fn();
  render(
    <Slider aria-label="Volume" defaultValue={0} onChange={onChange}>
      <SliderTrack><SliderThumb /></SliderTrack>
    </Slider>
  );
  let thumb = screen.getByRole('slider').parentElement!;
  fireEvent.mouseDown(thumb, {clientX: 0, pageX: 0});
  fireEvent.mouseMove(thumb, {pageX: 50});
  fireEvent.mouseUp(thumb, {pageX: 50});
  expect(onChange).toHaveBeenLastCalledWith(50);
});
```

The `slider` role is on the hidden input. Fire events on its parent, the thumb element.

## User and createTester

```tsx
import {User} from '@react-aria/test-utils';

let testUser = new User({interactionType: 'mouse', advanceTimer: ms => vi.advanceTimersByTime(ms)});
let table = testUser.createTester('Table', {root: element, interactionType: 'keyboard'});
table.setInteractionType('touch');
await table.toggleSelectAll({interactionType: 'mouse'});
```

| `UserOpts` | Type | Default | Purpose |
| ---------- | ---- | ------- | ------- |
| `interactionType` | `'mouse' \| 'touch' \| 'keyboard'` | `'mouse'` | How testers act. |
| `advanceTimer` | `(time: number) => unknown \| Promise<unknown>` | Real `setTimeout` promise | Advances timers. The types call it required for some patterns, such as table. |

Precedence: a method's `interactionType` option overrides the tester. The tester's option overrides `User`.

Exports: `User`, `triggerLongPress`, `installMouseEvent`, `installPointerEvent`, `pointerMap`, and types `CheckboxGroupTester`, `ComboBoxTester`, `DialogTester`, `GridListTester`, `ListBoxTester`, `MenuTester`, `RadioGroupTester`, `SelectTester`, `TableTester`, `TabsTester`, `TreeTester`, `UserOpts`.

`createTester(patternName, opts)` pattern names: `CheckboxGroup`, `ComboBox`, `Dialog`, `GridList`, `ListBox`, `Menu`, `RadioGroup`, `Select`, `Table`, `Tabs`, `Tree`. There is no tester for `Modal` or `Popover` by name. Use `Dialog`.

Common options on all testers: `root: HTMLElement` (required), `interactionType`, `advanceTimer`, and `direction?: 'ltr' | 'rtl'` (default `'ltr'`). Keyboard navigation in `GridList`, `RadioGroup`, `Table`, `Tabs`, and `Tree` reads `direction`. Pass `'rtl'` in RTL tests.

Every tester has `setInteractionType(type)`. All methods that act return a `Promise`. Always `await` them. Targets accept an index, text, or element unless noted.

`find*` methods take `{indexOrText: number | string}` and return an `HTMLElement`.

## Tester reference

Testers throw clear errors for a missing target, or a disabled option or row.

### CheckboxGroup

`root`: the group or a wrapper. Page: `https://react-aria.adobe.com/CheckboxGroup/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `toggleCheckbox(opts)` | `{checkbox: number \| string \| HTMLElement, interactionType?}` |
| `findCheckbox(opts)` | `{indexOrText}` |
| `getCheckboxGroup()` | `HTMLElement` |
| `getCheckboxes()` | `HTMLElement[]` |
| `getSelectedCheckboxes()` | `HTMLElement[]` |

```tsx
import {render} from '@testing-library/react';
import {CheckboxGroup} from 'react-aria-components/CheckboxGroup';

let {getByTestId} = render(<CheckboxGroup data-testid="group">{checkboxes}</CheckboxGroup>);
let tester = testUser.createTester('CheckboxGroup', {root: getByTestId('group')});
await tester.toggleCheckbox({checkbox: 0});
expect(tester.getCheckboxes()[0]).toBeChecked();
expect(tester.getSelectedCheckboxes()).toHaveLength(1);
```

### ComboBox

`root`: the combobox input or a wrapper. Extra option: `trigger?: HTMLElement`, the trigger button when it cannot be found inside `root`. Page: `https://react-aria.adobe.com/ComboBox/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `open(opts?)` | `{triggerBehavior?: 'focus' \| 'manual', interactionType?}`. Default `'manual'`. |
| `toggleOptionSelection(opts)` | `{option, closesOnSelect?, triggerBehavior?, interactionType?}`. Opens first if needed. `closesOnSelect` defaults to `true` for single selection, `false` for multiple. |
| `close()` | Closes the dropdown. |
| `findOption(opts)` | `{indexOrText}` |
| `getCombobox()`, `getTrigger()` | `HTMLElement` |
| `getListbox()` | `HTMLElement \| null` |
| `getSections()` | `HTMLElement[]` |
| `getOptions(opts?)` | `{element?}` limits to a section. |
| `getFocusedOption()` | `HTMLElement \| null` |

```tsx
import {render} from '@testing-library/react';
import {ComboBox} from 'react-aria-components/ComboBox';

let {getByTestId} = render(<ComboBox data-testid="box">{parts}</ComboBox>);
let tester = testUser.createTester('ComboBox', {root: getByTestId('box'), interactionType: 'keyboard'});
await tester.open();
expect(tester.getListbox()).toBeInTheDocument();
await tester.toggleOptionSelection({option: tester.getOptions()[0]});
expect((tester.getCombobox() as HTMLInputElement).value).toBe('One');
expect(tester.getListbox()).not.toBeInTheDocument();
```

### Dialog

For `Modal` and `Popover`. `root`: the trigger element, or a wrapper with one button. Extra option: `overlayType?: 'modal' | 'popover'`. Pages: `https://react-aria.adobe.com/Modal/testing`, `https://react-aria.adobe.com/Popover/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `open(opts?)` | `{interactionType?}` |
| `close()` | Presses Escape. Throws if the dialog stays in the document. |
| `getTrigger()` | `HTMLElement` |
| `getDialog()` | `HTMLElement \| null` |

```tsx
import {render} from '@testing-library/react';
import {Button} from 'react-aria-components/Button';
import {Dialog, DialogTrigger} from 'react-aria-components/Dialog';
import {Modal} from 'react-aria-components/Modal';

let {getByRole} = render(
  <DialogTrigger>
    <Button>Open</Button>
    <Modal>
      <Dialog role="alertdialog" aria-label="Confirm">Are you sure?</Dialog>
    </Modal>
  </DialogTrigger>
);
let tester = testUser.createTester('Dialog', {root: getByRole('button'), overlayType: 'modal'});
await tester.open();
let dialog = tester.getDialog();
expect(dialog).toBeVisible();
await tester.close();
expect(dialog).not.toBeInTheDocument();
```

For `overlayType: 'popover'`, wrap `Dialog` in `Popover` instead. The tester then finds the dialog through `aria-controls` on the trigger. For `'modal'` it needs focus inside the dialog after open (source). A dialog that does not take focus makes `open` throw.

### GridList

`root`: the grid or a wrapper. Extra option: `layout?: 'stack' | 'grid'`, default `'stack'`. Page: `https://react-aria.adobe.com/GridList/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `toggleRowSelection(opts)` | Grid row toggle options below. Adds or removes only that row. |
| `triggerRowAction(opts)` | `{row, needsDoubleClick?, interactionType?}` |
| `findRow(opts)` | `{indexOrText}` |
| `getGridlist()` | `HTMLElement` |
| `getRows()`, `getSelectedRows()` | `HTMLElement[]` |
| `getCells(opts?)` | `{element?}` limits to a row. |

Grid row toggle options, shared by `GridList`, `Table`, and `Tree`:

| Option | Type | Default | Purpose |
| ------ | ---- | ------- | ------- |
| `row` | `number \| string \| HTMLElement` | Required | Target. |
| `interactionType` | `'mouse' \| 'touch' \| 'keyboard'` | Tester value | Override. |
| `needsLongPress` | `boolean` | | Select by long press. Touch only. |
| `checkboxSelection` | `boolean` | `true` | Use the row checkbox. `false` presses the row. |
| `selectionBehavior` | `'toggle' \| 'replace'` | `'toggle'` | With `'replace'`, adds modifier keys, to build a multi-selection. Omit to press without modifiers. |

Modifier keys depend on the platform: Meta on Mac and Control elsewhere for press, Alt on Mac and Control elsewhere for keyboard selection.

```tsx
import {render, within} from '@testing-library/react';
import {GridList} from 'react-aria-components/GridList';

let {getByTestId} = render(<GridList data-testid="list" selectionMode="single" aria-label="Items">{rows}</GridList>);
let tester = testUser.createTester('GridList', {root: getByTestId('list'), interactionType: 'keyboard'});
let row = tester.getRows()[0];
await tester.toggleRowSelection({row: 0});
expect(within(row).getByRole('checkbox')).toBeChecked();
expect(tester.getSelectedRows()).toHaveLength(1);
```

### ListBox

`root`: the listbox or a wrapper. Extra option: `layout?: 'stack' | 'grid'`, default `'stack'`. Page: `https://react-aria.adobe.com/ListBox/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `toggleOptionSelection(opts)` | `{option, keyboardActivation?: 'Space' \| 'Enter', needsLongPress?, selectionBehavior?: 'toggle' \| 'replace', interactionType?}`. `keyboardActivation` defaults to `'Enter'`. |
| `triggerOptionAction(opts)` | `{option, needsDoubleClick?, selectionBehavior?, interactionType?}` |
| `findOption(opts)` | `{indexOrText}` |
| `getListbox()` | `HTMLElement` |
| `getOptions(opts?)` | `{element?}` limits to a section. |
| `getSelectedOptions()`, `getSections()` | `HTMLElement[]` |

```tsx
import {render} from '@testing-library/react';
import {ListBox} from 'react-aria-components/ListBox';

let {getByTestId} = render(<ListBox selectionMode="single" aria-label="Pets" data-testid="list">{options}</ListBox>);
let tester = testUser.createTester('ListBox', {root: getByTestId('list'), interactionType: 'keyboard'});
await tester.toggleOptionSelection({option: 4});
expect(tester.getOptions()[4]).toHaveAttribute('aria-selected', 'true');
```

### Menu

`root`: the trigger button or a wrapper. Extra options, for submenus: `isSubmenu?`, `rootMenu?`. Page: `https://react-aria.adobe.com/Menu/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `open(opts?)` | `{needsLongPress?, direction?: 'up' \| 'down', interactionType?}` |
| `toggleOptionSelection(opts)` | `{option, menuSelectionMode?: 'single' \| 'multiple', closesOnSelect?, keyboardActivation?: 'Space' \| 'Enter', needsLongPress?, direction?, interactionType?}`. Opens first if needed. Defaults: `'single'`, `true`, `'Enter'`. |
| `openSubmenu(opts)` | `{submenuTrigger: string \| HTMLElement, needsLongPress?, direction?, interactionType?}`. Returns `Promise<MenuTester>` for the submenu. |
| `close()` | Closes the menu. |
| `findOption(opts)` | `{indexOrText}` |
| `getTrigger()` | `HTMLElement` |
| `getMenu()` | `HTMLElement \| null` |
| `getSections()`, `getSubmenuTriggers()` | `HTMLElement[]` |
| `getOptions(opts?)` | `{element?}` limits to a section. |

```tsx
import {render} from '@testing-library/react';
import {Button} from 'react-aria-components/Button';
import {MenuTrigger} from 'react-aria-components/Menu';

let {getByTestId} = render(
  <MenuTrigger>
    <Button data-testid="trigger">Actions</Button>
    {popover}
  </MenuTrigger>
);
let menu = testUser.createTester('Menu', {root: getByTestId('trigger'), interactionType: 'keyboard'});
await menu.open();
expect(menu.getSubmenuTriggers()).toHaveLength(1);
let submenu = await menu.openSubmenu({submenuTrigger: 'Share'});
await submenu.toggleOptionSelection({option: submenu.getOptions()[0]});
expect(submenu.getMenu()).not.toBeInTheDocument();
expect(menu.getMenu()).not.toBeInTheDocument();
```

Put `data-testid` on the `Button`, not on `MenuTrigger`. `MenuTrigger` renders no DOM element of its own.

### RadioGroup

`root`: the radio group or a wrapper. Page: `https://react-aria.adobe.com/RadioGroup/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `triggerRadio(opts)` | `{radio, interactionType?}` |
| `findRadio(opts)` | `{indexOrText}` |
| `getRadioGroup()` | `HTMLElement` |
| `getRadios()` | `HTMLElement[]` |
| `getSelectedRadio()` | `HTMLElement \| null` |

```tsx
import {render} from '@testing-library/react';
import {RadioGroup} from 'react-aria-components/RadioGroup';

let {getByRole} = render(<RadioGroup aria-label="Size">{radios}</RadioGroup>);
let tester = testUser.createTester('RadioGroup', {root: getByRole('radiogroup')});
let all = tester.getRadios();
expect(tester.getSelectedRadio()).toBeFalsy();
await tester.triggerRadio({radio: all[0]});
expect(tester.getSelectedRadio()).toBe(all[0]);
```

### Select

`root`: the trigger button or a wrapper (the `Select` with a `data-testid`). With several buttons, it picks the one with `aria-haspopup`. Page: `https://react-aria.adobe.com/Select/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `open(opts?)` | `{interactionType?}` |
| `close()` | Closes the select. |
| `toggleOptionSelection(opts)` | `{option, closesOnSelect?, interactionType?}`. Opens first if needed. `closesOnSelect` defaults to `true`. |
| `findOption(opts)` | `{indexOrText}` |
| `getTrigger()` | `HTMLElement` |
| `getListbox()` | `HTMLElement \| null` |
| `getSections()` | `HTMLElement[]` |
| `getOptions(opts?)` | `{element?}` limits to a section. |

Complete example: [Vitest setup](#vitest-setup).

### Table

`root`: the `grid` or `treegrid`, or a wrapper. Pass `advanceTimer` for column menus and long press. Page: `https://react-aria.adobe.com/Table/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `toggleRowSelection(opts)` | Grid row toggle options, see [GridList](#gridlist). |
| `toggleSelectAll(opts?)` | `{interactionType?}`. Keyboard mode uses Select All with the platform modifier. |
| `toggleRowExpansion(opts)` | `{row, interactionType?}`. Presses the first button in the row. |
| `toggleSort(opts)` | `{column: number \| string \| HTMLElement, interactionType?}`. Handles a column with a menu too. |
| `triggerColumnHeaderAction(opts)` | `{column, action: number, interactionType?}`. `action` is a menu item index. |
| `triggerRowAction(opts)` | `{row, needsDoubleClick?, interactionType?}` |
| `findRow(opts)` | `{indexOrText}` |
| `findCell(opts)` | `{text: string}` |
| `getTable()` | `HTMLElement` |
| `getRowGroups()`, `getColumns()`, `getSelectedRows()`, `getFooterRows()`, `getRowHeaders()` | `HTMLElement[]` |
| `getRows(opts?)` | `{element?}` limits to a row group. |
| `getCells(opts?)` | `{element?}` limits to a row. |

Tested: a table with `Checkbox slot="selection"` cells works with `toggleRowSelection` and `toggleSelectAll`.

```tsx
import {render, within} from '@testing-library/react';
import {Checkbox} from 'react-aria-components/Checkbox';
import {Cell, Column, Row, Table, TableBody, TableHeader} from 'react-aria-components/Table';

let {getByTestId} = render(
  <Table aria-label="Files" data-testid="table" selectionMode="multiple">
    <TableHeader>
      <Column><Checkbox slot="selection" /></Column>
      <Column isRowHeader>Name</Column>
    </TableHeader>
    <TableBody>
      <Row><Cell><Checkbox slot="selection" /></Cell><Cell>A</Cell></Row>
      <Row><Cell><Checkbox slot="selection" /></Cell><Cell>B</Cell></Row>
    </TableBody>
  </Table>
);
let table = testUser.createTester('Table', {root: getByTestId('table')});
await table.toggleSelectAll();
expect(table.getSelectedRows()).toHaveLength(2);
await table.toggleRowSelection({row: 1});
expect(table.getSelectedRows()).toHaveLength(1);
expect(within(table.getRows()[1]).getByRole('checkbox')).not.toBeChecked();
await table.toggleSort({column: 'Name'});
```

The `toggleSort` line assumes a column with `allowsSorting`. `getRows()` returns body rows, without the header row.

### Tabs

`root`: the tablist or a wrapper. Page: `https://react-aria.adobe.com/Tabs/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `triggerTab(opts)` | `{tab, manualActivation?, interactionType?}`. Set `manualActivation` when tabs use `keyboardActivation="manual"`. |
| `findTab(opts)` | `{indexOrText}` |
| `getTablist()` | `HTMLElement` |
| `getTabs()`, `getTabpanels()` | `HTMLElement[]` |
| `getSelectedTab()`, `getActiveTabpanel()` | `HTMLElement \| null` |

Tested:

```tsx
import {render} from '@testing-library/react';
import {Tab, TabList, TabPanel, TabPanels, Tabs} from 'react-aria-components/Tabs';

let {getByTestId} = render(
  <Tabs data-testid="tabs">
    <TabList aria-label="Sections">
      <Tab id="a">A</Tab>
      <Tab id="b">B</Tab>
    </TabList>
    <TabPanels>
      <TabPanel id="a">First</TabPanel>
      <TabPanel id="b">Second</TabPanel>
    </TabPanels>
  </Tabs>
);
let tester = testUser.createTester('Tabs', {root: getByTestId('tabs'), interactionType: 'keyboard'});
await tester.triggerTab({tab: 1});
expect(tester.getSelectedTab()).toBe(tester.getTabs()[1]);
```

### Tree

`root`: the `treegrid` or a wrapper. Page: `https://react-aria.adobe.com/Tree/testing`.

| Method | Options or result |
| ------ | ----------------- |
| `toggleRowSelection(opts)` | Grid row toggle options, see [GridList](#gridlist). Adds or removes only that row. |
| `toggleRowExpansion(opts)` | `{row, interactionType?}`. Presses the first button in the row. |
| `triggerRowAction(opts)` | `{row, needsDoubleClick?, interactionType?}` |
| `findRow(opts)` | `{indexOrText}` |
| `getTree()` | `HTMLElement` |
| `getRows()`, `getSelectedRows()` | `HTMLElement[]` |
| `getCells(opts?)` | `{element?}` limits to a row. |

```tsx
import {render, within} from '@testing-library/react';
import {Tree} from 'react-aria-components/Tree';

let {getByTestId} = render(<Tree data-testid="tree" selectionMode="multiple" aria-label="Files">{items}</Tree>);
let tree = testUser.createTester('Tree', {root: getByTestId('tree'), interactionType: 'keyboard'});
await tree.toggleRowSelection({row: 0});
expect(within(tree.getRows()[0]).getByRole('checkbox')).toBeChecked();
await tree.toggleRowExpansion({row: 0});
expect(tree.getRows()[0]).toHaveAttribute('aria-expanded', 'true');
```

Put the chevron button first in the row, with `slot="chevron"`, because `toggleRowExpansion` presses the first button in the row. `Table` has the same rule for its expander.

## Overlays, focus, and toasts

Found by running a real screen with these tools at 1.22.1:

- Focus returns asynchronously. Right after a modal closes, focus can still be on `body`. Wait for it:

```tsx
import {waitFor} from '@testing-library/react';

await waitFor(() => expect(document.activeElement).toBe(trigger));
```

- A toast has the role `alertdialog` and its content has the role `alert`. Query with `findByRole('alert')`.
- A toast queue is created outside React, so it survives unmount and leaks between tests. Call `queue.clear()` in `afterEach`.
- Parts combine their own label with the field's label. A `DatePicker` button with `aria-label="Open calendar"` is named "Open calendar" plus the field label, so match with a regular expression: `getByRole('button', {name: /Open calendar/})`.
- Vitest 5 hides `console.log` from passing tests. Pass `--silent=false` when you debug.

## Browser mode and Playwright

The docs have no guidance for Vitest browser mode, Playwright, or Cypress. Role-based selectors work the same, because the ARIA roles above are in the real DOM.

```ts
await page.getByRole('button', {name: 'Pet'}).click();
await page.getByRole('option', {name: 'Cat'}).click();
```

- In a real browser, no mocks are needed for `PointerEvent`, `MouseEvent`, or track size.
- `data-testid` works the same.
- `@react-aria/test-utils` drives `@testing-library/user-event`, so it runs inside the page's JavaScript. It is not a Playwright API. Its `act` wrapper has a source comment about Vite browser tests and skips `act` outside an act environment. Browser-mode use of testers is not covered by the docs and was not tested here.

## Docs and types disagreements

| Topic | Docs | Types or tested behavior (follow this) |
| ----- | ---- | ------------------------------------- |
| `triggerLongPress` | Snippet calls `triggerLongPress(button)` | Takes `{element, advanceTimer, pointerOpts?}`. |
| `user-event` calls | Sync `userEvent.click(...)` | Version 14 needs `userEvent.setup()` and `await`. |
| Move example | Declares `sliderThumb`, then uses `thumb` | Use one name. |
| `advanceTimer` | Passes `jest.advanceTimersByTime` directly | Default without it uses real `setTimeout`. Hangs under fake timers. |
| Vitest | Not covered | Needs `globals: true`, and a timer fix. See [Vitest setup](#vitest-setup). |
| `Dialog` tester | Listed as `Modal` and `Popover` pages | Pattern name is `'Dialog'`. |
| Selection checkboxes | Examples assert a row checkbox | Exists only if you render `Checkbox slot="selection"`. |
