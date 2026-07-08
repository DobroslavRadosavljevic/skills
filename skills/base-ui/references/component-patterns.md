# Base UI Component Patterns

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

Control with `open` and `onOpenChange` when opening from outside the trigger, closing after async submit, or coordinating route state.

### Alert Dialog

Use Alert Dialog when the user must explicitly confirm or cancel before continuing.

```tsx
import { AlertDialog } from '@base-ui/react/alert-dialog';

<AlertDialog.Root>
  <AlertDialog.Trigger />
  <AlertDialog.Portal>
    <AlertDialog.Backdrop />
    <AlertDialog.Viewport>
      <AlertDialog.Popup>
        <AlertDialog.Title />
        <AlertDialog.Description />
        <AlertDialog.Close />
      </AlertDialog.Popup>
    </AlertDialog.Viewport>
  </AlertDialog.Portal>
</AlertDialog.Root>
```

When opening from a menu item, control the dialog state and set it from the menu item's handler.

### Drawer

Use Drawer for swipe-to-dismiss panels. The v1.6.0 docs call Drawer stable and include native swipe-performance fixes.

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

Style drawer movement with drawer CSS variables such as `--drawer-swipe-progress`, `--drawer-swipe-movement-x`, and `--drawer-swipe-strength` when using swipe gestures.

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

`Popover.Root` supports `modal={false}`, `modal={true}`, and `modal="trap-focus"`. For focus-trapped modal popovers, render `Popover.Close` inside `Popover.Popup`; it can be visually hidden if needed so touch screen readers have an escape path.

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

Use Tooltip for hints for sighted users, not required information. Keep keyboard focus and hover behavior intact.

### Preview Card

Use Preview Card for hover/focus previews around links. Verify it does not hide essential content from keyboard and screen-reader users.

## Menus And Navigation

### Menu

```tsx
import { Menu } from '@base-ui/react/menu';

<Menu.Root>
  <Menu.Trigger />
  <Menu.Portal>
    <Menu.Positioner>
      <Menu.Popup>
        <Menu.Arrow />
        <Menu.Item />
        <Menu.LinkItem />
        <Menu.Separator />
        <Menu.SubmenuRoot>
          <Menu.SubmenuTrigger />
          <Menu.Portal>
            <Menu.Positioner>
              <Menu.Popup />
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.SubmenuRoot>
        <Menu.Group>
          <Menu.GroupLabel />
        </Menu.Group>
        <Menu.RadioGroup />
        <Menu.CheckboxItem />
      </Menu.Popup>
    </Menu.Positioner>
  </Menu.Portal>
</Menu.Root>
```

Use `Menu.LinkItem` or `render={<a />}` only when the item is truly navigation. Verify typeahead, arrow navigation, submenu hover delay, Escape propagation, and focus return.

### Context Menu

Context Menu appears at the pointer on right click or long press. Its anatomy is similar to Menu, but the trigger defines the region receiving context interaction.

### Menubar And Navigation Menu

Use Menubar for application command bars. Use Navigation Menu for website navigation with links and hover/focus panels.

Navigation Menu uses `Root`, `List`, `Item`, `Trigger`, `Content`, `Portal`, `Positioner`, `Popup`, `Arrow`, `Viewport`, and `Link`. For framework routing, render `NavigationMenu.Link` through the framework link component while preserving Base UI props.

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

For tabs as links, use `Tabs.Tab nativeButton={false} render={<Link href="/overview" />}`. Verify panel focus, disabled tabs, missing active values, and `onValueChange` reasons when controlling state.

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

Use `Select.Label` for accessible naming. Verify form serialization, disabled items, typeahead, multiple mode, and `finalFocus` if relevant.

### Combobox

Use Combobox when users type into an input and select from predefined items.

```tsx
import { Combobox } from '@base-ui/react/combobox';

<Combobox.Root items={items}>
  <Combobox.Label />
  <Combobox.InputGroup>
    <Combobox.Input />
    <Combobox.Clear />
    <Combobox.Trigger />
  </Combobox.InputGroup>
  <Combobox.Portal>
    <Combobox.Positioner>
      <Combobox.Popup>
        <Combobox.Empty />
        <Combobox.List>
          {(item) => <Combobox.Item value={item} />}
        </Combobox.List>
      </Combobox.Popup>
    </Combobox.Positioner>
  </Combobox.Portal>
</Combobox.Root>
```

The v1.6.0 docs mention an `open` requirement for the `inline` prop. Fetch exact docs before using `inline`.

### Autocomplete

Use Autocomplete when input text and suggestions are tightly linked, including freeform and structured item flows.

```tsx
import { Autocomplete } from '@base-ui/react/autocomplete';

<Autocomplete.Root items={items}>
  <Autocomplete.InputGroup>
    <Autocomplete.Input />
    <Autocomplete.Trigger />
    <Autocomplete.Clear />
    <Autocomplete.Value />
  </Autocomplete.InputGroup>
  <Autocomplete.Portal>
    <Autocomplete.Positioner>
      <Autocomplete.Popup>
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

Use `itemToStringValue` when item values are objects. Verify grid mode arrow-key behavior when using rich rows.

## Forms And Controls

### Field, Fieldset, And Form

Use Field for labels, descriptions, validation, and external form-library state. Use Fieldset for grouped controls and legends.

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

`Field.Root` props include `name`, `dirty`, `touched`, `disabled`, `invalid`, `validate`, and `actionsRef`. `name` on `Field.Root` takes precedence over `Field.Control` for submission.

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

An enclosing native `label` is the simplest labeling pattern. With sibling `label htmlFor`, prefer `nativeButton render={<button />}` on `Checkbox.Root`.

### Checkbox Group

Use `CheckboxGroup` for shared value state across multiple checkboxes. Provide a group label with `aria-labelledby`, `Fieldset.Legend`, or equivalent accessible markup.

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

For multiple thumbs, set `index` and `aria-label` per thumb.

### Number Field

Use `NumberField.Root`, `NumberField.Group`, `NumberField.Input`, `NumberField.Increment`, and `NumberField.Decrement`. Check current docs for locale, formatting, snapping, and precision behavior.

### OTP Field

For current package versions, import `{ OTPField }` from `@base-ui/react/otp-field`. Verify exact anatomy from current docs before implementing because v1.6.0 included an import rename.

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

Accordion panel height can be animated with `--accordion-panel-height` and `data-starting-style`/`data-ending-style`.

### Collapsible

Use Collapsible for a single disclosure panel controlled by a button. Use Accordion for a set of related panels.

### Scroll Area

Scroll Area supplies a native scroll container with custom scrollbars. Under strict CSP, check whether scrollbar-hiding inline style elements require `CSPProvider` or external CSS.

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
            <Toast.Close />
          </Toast.Content>
        </Toast.Root>
      ))}
    </Toast.Viewport>
  </Toast.Portal>
</Toast.Provider>
```

Use `Toast.useToastManager()` to add and read toasts. Style with toast CSS variables such as `--toast-index`, `--toast-height`, `--toast-offset-y`, and swipe movement variables.

### Progress And Meter

Use Progress for task completion status. Use Meter for bounded scalar measurements. Provide labels or values that make the state understandable without relying on color alone.

## Common Gotchas

- Missing labels are still your bug; Base UI does not invent product copy.
- Missing `ref` forwarding or prop spreading in a custom `render` component breaks accessibility and behavior.
- Portal z-index fights usually mean the app root is not isolated.
- Tailwind v4 examples copied into Tailwind v3 projects may silently fail.
- Popup animations can unmount too early if `keepMounted`, controlled `open`, or detectable opacity animation is missing.
- Rendering a button-like part as a link, or a link-like part as a button, can break keyboard and assistive tech semantics.
- Event cancellation can keep an uncontrolled component open or unchanged; use it intentionally and test reason strings.
- Pinned repos may lag current docs. Compare `package.json` and lockfile version before using newly documented props.
