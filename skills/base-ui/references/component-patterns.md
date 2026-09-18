# Base UI Component Patterns

Anatomy and notes for `@base-ui/react@1.8.0`. Fetch the component `.md` page before relying on a prop that is not listed here.

## Table Of Contents

- Overlays
- Positioned popups
- Menus and navigation
- Selection and autocomplete
- Forms and controls
- Disclosure and layout
- Feedback
- Common gotchas

## Overlays

### Dialog

Use Dialog for modal content on top of the page. Use Drawer when gesture support or snap points matter.

```tsx
import { Dialog } from '@base-ui/react/dialog';

<Dialog.Root>
  <Dialog.Trigger />
  <Dialog.Portal>
    <Dialog.Backdrop />
    <Dialog.Viewport>
      <Dialog.Popup>
        <Dialog.Title />
        <Dialog.Description />
        <Dialog.Close />
      </Dialog.Popup>
    </Dialog.Viewport>
  </Dialog.Portal>
</Dialog.Root>
```

Control with `open` and `onOpenChange` when opening from outside the trigger, closing after async submit, or coordinating route state. `initialFocus` and `finalFocus` live on `Dialog.Popup`.

Detached triggers: `const handle = Dialog.createHandle()` (optionally with a payload type), then pass `handle` to `Dialog.Trigger` and `Dialog.Root`. Imperative `open()` / `openWithPayload()` are ignored unless a root using that handle is mounted; remounting does not replay a prior open.

From 1.8.0, outside-press ignores pointer downs that began before the dialog opened.

### Alert Dialog

Use Alert Dialog when the user must explicitly confirm or cancel before continuing. Anatomy matches Dialog (`Trigger`, `Portal`, `Backdrop`, `Viewport`, `Popup`, `Title`, `Description`, `Close`). When opening from a menu item, control the dialog state and set it from the menu item's handler.

### Drawer

Use Drawer for swipe-to-dismiss panels. Drawer is stable. It extends Dialog with gestures, snap points, and indent.

```tsx
import { Drawer } from '@base-ui/react/drawer';

<Drawer.Root swipeDirection="right">
  <Drawer.Trigger />
  <Drawer.Portal>
    <Drawer.Backdrop />
    <Drawer.Viewport>
      <Drawer.Popup>
        <Drawer.Content>
          <Drawer.Title />
          <Drawer.Description />
          <Drawer.Close />
        </Drawer.Content>
      </Drawer.Popup>
    </Drawer.Viewport>
  </Drawer.Portal>
</Drawer.Root>
```

Related parts (not extra packages): `Drawer.SwipeArea` for swipe-to-open, `Drawer.Provider` + `Drawer.Indent` + `Drawer.IndentBackground` for the indent effect, `Drawer.createHandle` for detached triggers.

For bottom sheets with form fields, wrap the portal tree in `Drawer.VirtualKeyboardProvider`. It sets `--drawer-keyboard-inset` only while the keyboard is aligned — always write `var(--drawer-keyboard-inset, 0px)`. Keep header/footer outside the scroll body.

Style swipe with `--drawer-swipe-progress`, `--drawer-swipe-movement-x` / `--drawer-swipe-movement-y`, and `--drawer-swipe-strength`. 1.8.0 ignores undirected swipes on snap points and respects canceled snap dismissal.

## Positioned Popups

Positioned components usually use `Portal -> Positioner -> Popup`, with optional `Arrow`.

### Popover

```tsx
import { Popover } from '@base-ui/react/popover';

<Popover.Root>
  <Popover.Trigger />
  <Popover.Portal>
    <Popover.Positioner sideOffset={8}>
      <Popover.Popup>
        <Popover.Arrow />
        <Popover.Title />
        <Popover.Description />
        <Popover.Close />
      </Popover.Popup>
    </Popover.Positioner>
  </Popover.Portal>
</Popover.Root>
```

`Popover.Root` supports `modal={false}`, `modal={true}`, and `modal="trap-focus"`. For focus-trapped modal popovers, render `Popover.Close` inside `Popover.Popup`; it can be visually hidden if needed so touch screen readers have an escape path. 1.8.0 mounts triggers faster and ignores outside presses that began before open.

### Tooltip

```tsx
import { Tooltip } from '@base-ui/react/tooltip';

<Tooltip.Provider>
  <Tooltip.Root>
    <Tooltip.Trigger />
    <Tooltip.Portal>
      <Tooltip.Positioner>
        <Tooltip.Popup>
          <Tooltip.Arrow />
        </Tooltip.Popup>
      </Tooltip.Positioner>
    </Tooltip.Portal>
  </Tooltip.Root>
</Tooltip.Provider>
```

Use Tooltip for hints for sighted users, not required information. For a transient "Copied" message, use Toast (optionally anchored) so screen readers hear it. 1.8.0 respects a trigger delay even when the provider delay is `0`.

### Preview Card

Use Preview Card for hover/focus previews around links. Verify it does not hide essential content from keyboard and screen-reader users.

## Menus And Navigation

### Menu

```tsx
import { Menu } from '@base-ui/react/menu';

<Menu.Root>
  <Menu.Trigger />
  <Menu.Portal>
    <Menu.Backdrop />
    <Menu.Positioner>
      <Menu.Popup>
        <Menu.Arrow />
        <Menu.Item />
        <Menu.LinkItem />
        <Menu.Separator />
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger />
        </Menu.SubmenuRoot>
        <Menu.Group>
          <Menu.GroupLabel />
        </Menu.Group>
        <Menu.RadioGroup>
          <Menu.RadioItem>
            <Menu.RadioItemIndicator />
          </Menu.RadioItem>
        </Menu.RadioGroup>
        <Menu.CheckboxItem>
          <Menu.CheckboxItemIndicator />
        </Menu.CheckboxItem>
        <Menu.Viewport />
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
</Menu.Root>
```

Use `Menu.LinkItem` or `render={<a />}` only when the item is truly navigation. `Menu.Viewport` supports content transitions. Verify typeahead, arrow navigation, submenu hover delay, Escape propagation, and focus return.

### Context Menu

Context Menu appears at the pointer on right click or long press. Its anatomy is similar to Menu, but the trigger defines the region receiving context interaction.

### Menubar And Navigation Menu

Use Menubar for application command bars. Use Navigation Menu for website navigation with links and hover/focus panels.

Navigation Menu uses `Root`, `List`, `Item`, `Trigger`, `Content`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Viewport`, and `Link`. For framework routing, render `NavigationMenu.Link` through the framework link component while preserving Base UI props. `keepMounted` is supported on Navigation Menu content. 1.8.0 keeps focus on the trigger when opening and exposes `data-disabled` on `NavigationMenu.Trigger`.

### Tabs

```tsx
import { Tabs } from '@base-ui/react/tabs';

<Tabs.Root defaultValue="overview">
  <Tabs.List>
    <Tabs.Tab value="overview" />
    <Tabs.Indicator />
  </Tabs.List>
  <Tabs.Panel value="overview" />
</Tabs.Root>
```

`value` is required on `Tabs.Tab` and `Tabs.Panel`. For tabs as links, use `Tabs.Tab nativeButton={false} render={<Link href="/overview" />}`. Indicator positioning accounts for 3D transforms (1.8.0).

## Selection And Autocomplete

### Select

```tsx
import { Select } from '@base-ui/react/select';

<Select.Root items={items}>
  <Select.Label />
  <Select.Trigger>
    <Select.Value />
    <Select.Icon />
  </Select.Trigger>
  <Select.Portal>
    <Select.Positioner>
      <Select.Popup>
        <Select.ScrollUpArrow />
        <Select.List>
          <Select.Item value="value">
            <Select.ItemIndicator />
            <Select.ItemText />
          </Select.Item>
        </Select.List>
        <Select.ScrollDownArrow />
      </Select.Popup>
    </Select.Positioner>
  </Select.Portal>
</Select.Root>
```

Use `Select.Label` for accessible naming. 1.8.0 allows opening and browsing the popup while `readOnly`. Multiple selection highlights from the first selected item. Verify form serialization, disabled items, typeahead, and `finalFocus`.

### Combobox

Use Combobox when users type into an input and must pick from predefined items (filterable Select). Use Autocomplete for freeform search. Use Select when there is no input.

```tsx
import { Combobox } from '@base-ui/react/combobox';

<Combobox.Root items={items}>
  <Combobox.Label />
  <Combobox.InputGroup>
    <Combobox.Input />
    <Combobox.Trigger />
    <Combobox.Icon />
    <Combobox.Clear />
    <Combobox.Value />
    <Combobox.Chips>
      <Combobox.Chip>
        <Combobox.ChipRemove />
      </Combobox.Chip>
    </Combobox.Chips>
  </Combobox.InputGroup>
  <Combobox.Portal>
    <Combobox.Backdrop />
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.Arrow />
        <Combobox.Status />
        <Combobox.Empty />
        <Combobox.List>
          {(item) => (
            <Combobox.Item value={item}>
              <Combobox.ItemIndicator />
            </Combobox.Item>
          )}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
</Combobox.Root>
```

Also available: `Combobox.Row`, `Combobox.Group` / `Combobox.GroupLabel`, `Combobox.Separator`, `Combobox.Collection`, `Combobox.useFilter`, `Combobox.useFilteredItems`.

**`createItems` (1.8.0):** when the app stores IDs, not objects, derive value/label once:

```tsx
const items = Combobox.createItems(users, {
  getValue: (user) => user.id,
  getLabel: (user) => user.name,
});

<Combobox.Root items={items}>
  <Combobox.List>
    {(user) => (
      <Combobox.Item key={user.id} value={user.id}>
        {user.name}
      </Combobox.Item>
    )}
  </Combobox.List>
</Combobox.Root>
```

Create static collections at module scope. Memoize on dynamic data. List render still receives source items; `value` / `onValueChange` receive derived IDs. Pass **source items** (not derived IDs) to `filteredItems`. Items must not be nullish and must not use an `items` array property (that shape is a group). Wrapper types: see [core-patterns.md](core-patterns.md).

Rule of thumb: primitives for simple lists, object values when the selected record is app state, `createItems()` when selection is a stable ID. With object values and refetching rows, use `isItemEqualToValue` to compare IDs.

**`inline`:** render the list without Combobox's popup. Always pass `open` (typically `true`) so the list is considered visible. In a Combobox-inside-Dialog composition, bind Combobox `open`/`onOpenChange` to the dialog so filter, highlight, and input reset when the dialog closes.

**`multiple`:** render chips via `Combobox.Value` + `Combobox.Chips`. Supply `aria-label` / `aria-description` yourself. To keep the typed filter after a selection: when the input is outside the popup, `cancel()` an `item-press` close in `onOpenChange`; when the input is inside, `cancel()` `onInputValueChange` when `eventDetails.isItemPress`.

Labeling: if `Combobox.Input` is the form control, use `Field.Label` or a native label. `Combobox.Label` labels `Combobox.Trigger` for the input-inside-popup pattern.

1.8.0 also: `readOnly` still allows opening and browsing; `data-readonly` on `Trigger`; grid groups use `rowgroup`.

### Autocomplete

Use Autocomplete when input text and suggestions are tightly linked, including freeform (`mode="both"`) and structured item flows. There is **no** `Autocomplete.createItems`.

```tsx
import { Autocomplete } from '@base-ui/react/autocomplete';

<Autocomplete.Root items={items}>
  <Autocomplete.InputGroup>
    <Autocomplete.Input />
    <Autocomplete.Trigger />
    <Autocomplete.Icon />
    <Autocomplete.Clear />
    <Autocomplete.Value />
  </Autocomplete.InputGroup>
  <Autocomplete.Portal>
    <Autocomplete.Backdrop />
    <Autocomplete.Positioner>
      <Autocomplete.Popup>
        <Autocomplete.Arrow />
        <Autocomplete.Status />
        <Autocomplete.Empty />
        <Autocomplete.List>
          {(item) => <Autocomplete.Item value={item} />}
        </Autocomplete.List>
      </Autocomplete.Popup>
    </Autocomplete.Positioner>
  </Autocomplete.Portal>
</Autocomplete.Root>
```

Also: `Autocomplete.Row`, `Group` / `GroupLabel`, `Separator`, `Collection`, `useFilter`, `useFilteredItems`. Use `itemToStringValue` when item values are objects. Verify grid-mode arrow keys. 1.8.0: `readOnly` can still open and browse; grid groups use `rowgroup`. Filtering respects `locale` (1.7.0).

## Forms And Controls

### Field, Fieldset, And Form

```tsx
import { Field } from '@base-ui/react/field';

<Field.Root name="serverName">
  <Field.Label>Server name</Field.Label>
  <Field.Control required minLength={3} />
  <Field.Description>Must be 3 or more characters long</Field.Description>
  <Field.Error />
  <Field.Validity />
</Field.Root>
```

`Field.Item` wraps each checkbox/radio option inside a `Fieldset`. 1.8.0: Field syncs controlled value changes into field state, validates once on Enter inside a Form, and keeps custom validity ownership correct. See [core-patterns.md](core-patterns.md) for validation modes and RHF/Zod wiring.

### Checkbox

```tsx
import { Checkbox } from '@base-ui/react/checkbox';

<label>
  <Checkbox.Root defaultChecked>
    <Checkbox.Indicator />
  </Checkbox.Root>
  Enable notifications
</label>
```

An enclosing native `label` or `Field.Label` is the simplest labeling pattern. Checkbox roots render a `span` with a hidden input, not a button. If a sibling `label htmlFor` is required, follow current checkbox docs for `nativeButton` + `render={<button />}`.

### Checkbox Group

Use `CheckboxGroup` for shared value state across multiple checkboxes. Provide a group label with `Fieldset.Legend` or `aria-labelledby`. Wrap each option in `Field.Item`.

### Radio

Use `RadioGroup` with `Radio.Root value="..."` and `Radio.Indicator`. Label each radio with native label or `Field.Label`; group with `Fieldset.Legend` when in a form.

### Switch

Use `Switch.Root` and `Switch.Thumb`. Implicit labeling with `Field.Label` is common:

```tsx
<Field.Root>
  <Field.Label>
    <Switch.Root />
    Developer mode
  </Field.Label>
  <Field.Description>Enables extra tools.</Field.Description>
</Field.Root>
```

### Slider

```tsx
import { Slider } from '@base-ui/react/slider';

<Slider.Root defaultValue={25}>
  <Slider.Label>Volume</Slider.Label>
  <Slider.Control>
    <Slider.Track>
      <Slider.Indicator />
      <Slider.Thumb aria-label="Volume" />
    </Slider.Track>
  </Slider.Control>
</Slider.Root>
```

For multiple thumbs, set `index` and `aria-label` per thumb. Optional `Slider.Value` for the formatted readout. `thumbAlignment="edge"` is available for range thumbs.

### Number Field

Use `NumberField.Root`, `NumberField.Group`, `NumberField.Input`, `NumberField.Increment`, `NumberField.Decrement`, and optionally `NumberField.ScrubArea` / `NumberField.ScrubAreaCursor`. Check current docs for `locale`, `format`, `snapOnStep`, `allowOutOfRange`, and `allowWheelScrub`. 1.8.0 stops press-and-hold when disabled, ignores horizontal-wheel scrub, and preserves selection on focus.

### OTP Field

Stable. Import `{ OTPField } from '@base-ui/react/otp-field'`.

```tsx
import { OTPField } from '@base-ui/react/otp-field';

<OTPField.Root length={6} id="verification-code">
  <OTPField.Input />
  <OTPField.Input aria-label="Character 2 of 6" />
  {/* remaining slots */}
  <OTPField.Separator />
</OTPField.Root>
```

`length` is required. First input uses the field `id`; later slots need `aria-label`. Use `normalizeValue` (idempotent) after `validationType` filtering — not the old `sanitizeValue` name. `validationType` defaults to `'numeric'`. `autoSubmit` submits the owning form when complete; 1.7.0 keeps focus on an invalid field when `autoSubmit` is blocked.

## Disclosure And Layout

### Accordion

```tsx
import { Accordion } from '@base-ui/react/accordion';

<Accordion.Root>
  <Accordion.Item>
    <Accordion.Header>
      <Accordion.Trigger />
    </Accordion.Header>
    <Accordion.Panel />
  </Accordion.Item>
</Accordion.Root>
```

Keyboard navigation follows APG. Animate panel height with `--accordion-panel-height` and `data-starting-style`/`data-ending-style`. `multiple` defaults to `false`.

### Collapsible

Use Collapsible for a single disclosure panel controlled by a button. Use Accordion for a set of related panels.

### Scroll Area

Scroll Area supplies a native scroll container with custom scrollbars. 1.7.0: `ScrollArea.Thumb` provides WebKit overscroll feedback. 1.8.0: scrollbars do not steal focus and are hidden from the accessibility tree. Under strict CSP, check whether scrollbar-hiding inline style elements require `CSPProvider` or external CSS.

## Feedback

### Toast

```tsx
import { Toast } from '@base-ui/react/toast';

<Toast.Provider>
  <Toast.Portal>
    <Toast.Viewport>
      {toasts.map((toast) => (
        <Toast.Root key={toast.id} toast={toast}>
          <Toast.Content>
            <Toast.Title />
            <Toast.Description />
            <Toast.Action />
            <Toast.Close />
          </Toast.Content>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  </Toast.Portal>
</Toast.Provider>
```

Use `Toast.useToastManager()` inside a provider for `toasts`, `add`, `update`, `close`, and `promise`. `Toast.createToastManager()` is the same manager outside React (no reactive `toasts` array); pass it into `Toast.Provider`.

`add` with an existing `id` upserts in place and increments `toast.updateKey` (replay attention styles without remounting). Object `update` replaces listed fields, including `data` as a whole. From 1.8.0, pass a function to merge:

```tsx
toastManager.update(toastId, (prevToast) => ({
  data: prevToast.data && { ...prevToast.data, progress: 100 },
}));
```

`data` is `undefined` until set. Anchored toasts use `Toast.Positioner` / `Toast.Arrow` and `positionerProps` on add options. Style with `--toast-index`, `--toast-height`, `--toast-offset-y`, and swipe movement variables.

### Avatar

```tsx
import { Avatar } from '@base-ui/react/avatar';

<Avatar.Root>
  <Avatar.Fallback>LT</Avatar.Fallback>
  <Avatar.Image src="" />
</Avatar.Root>
```

Default: preload `src`, then mount the image. That breaks `loading="lazy"` and optimizers that rewrite the URL. Pass `keepMounted` so the `<img>` (or `render={<Image ... />}`) is in the DOM immediately:

```tsx
<Avatar.Image keepMounted render={<Image src="/avatar.png" width={32} height={32} alt="" />} />
```

With `keepMounted`, stack Image after Fallback in the same positioned box. Hide loading/error with `visibility` (not `display: none`) via `data-loading` / `data-error` so lazy loading still intersects the viewport. `delay={0}` shows Fallback immediately (1.7.0).

### Progress And Meter

Use Progress for task completion status. Use Meter for bounded scalar measurements. Provide labels or values that make the state understandable without relying on color alone.

## Common Gotchas

- Missing labels are still your bug; Base UI does not invent product copy. Chip/OTP slot descriptions are also app-owned.
- Missing `ref` forwarding or prop spreading in a custom `render` component breaks accessibility and behavior.
- Portal z-index fights usually mean the app root is not isolated.
- Tailwind v4 examples copied into Tailwind v3 projects may silently fail.
- Popup animations can unmount too early if `keepMounted`, controlled `open`, or detectable opacity animation is missing.
- Rendering a button-like part as a link, or a link-like part as a button, can break keyboard and assistive tech semantics.
- Event cancellation can keep an uncontrolled component open or unchanged; use it intentionally and test reason strings.
- Combobox `createItems` is not Autocomplete. Passing a collection into a wrapper typed as `Combobox.Root.Props<Value, Multiple>` (two generics) fails on `defaultValue`.
- `inline` Combobox without a controlled `open` is not considered visible.
- `Avatar.Image` without `keepMounted` will not lazy-load or compose with `next/image`.
- Toast object `update` replaces `data`; use the function form to merge.
- Async Field `validate` does not block `onSubmit`. Neutral `valid: null` is expected while it runs.
- Pinned repos may lag current docs. Compare `package.json` and lockfile version before using 1.7/1.8 APIs.
