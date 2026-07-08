# Base UI Core Patterns

## Table Of Contents

- Installation and setup
- Styling hooks
- Composition and `render`
- State and event customization
- TypeScript wrappers
- Accessibility
- Forms
- Animation
- Utilities and providers
- Current-docs check

## Installation And Setup

Install the single tree-shakable package:

```bash
npm i @base-ui/react
pnpm add @base-ui/react
yarn add @base-ui/react
bun add @base-ui/react
```

Import from component subpaths:

```tsx
import { Dialog } from '@base-ui/react/dialog';
import { Field } from '@base-ui/react/field';
import { Select } from '@base-ui/react/select';
```

Base UI uses portals for popup components such as Dialog, Drawer, Popover, Menu, Select, Combobox, Tooltip, and Toast. Add an isolated application root so portaled UI layers above page content predictably:

```tsx
<body>
  <div className="root">{children}</div>
</body>
```

```css
.root {
  isolation: isolate;
}
```

For iOS 26+ Safari visual viewport behavior, add:

```css
body {
  position: relative;
}
```

Backdrops in docs use `position: absolute` under `@supports (-webkit-touch-callout: none)` so they cover the visual viewport after scroll.

## Styling Hooks

Base UI ships no CSS and works with Tailwind, CSS Modules, CSS-in-JS, plain CSS, and other styling systems.

Use:

- `className` strings.
- `className={(state) => ...}` functions.
- `style` objects.
- `style={(state) => ...}` functions.
- Data attributes such as `data-open`, `data-closed`, `data-checked`, `data-unchecked`, `data-popup-open`, `data-active`, `data-disabled`, `data-starting-style`, `data-ending-style`, `data-side`, and `data-align`.
- CSS variables such as `--transform-origin`, `--anchor-width`, `--anchor-height`, `--available-width`, `--available-height`, `--active-tab-left`, `--active-tab-width`, and component-specific toast/drawer/accordion variables.

Tailwind examples in the docs target Tailwind CSS v4. If the host project uses Tailwind v3, convert v4-only utilities such as arbitrary property shorthands or new variant syntax to v3-compatible classes or CSS.

## Composition And `render`

Use the `render` prop to compose Base UI parts with custom components:

```tsx
<Menu.Trigger render={<MyButton size="md" />}>Open menu</Menu.Trigger>
```

Custom components must forward `ref` and spread all received props onto the underlying DOM node:

```tsx
const MyButton = React.forwardRef<HTMLButtonElement, React.ComponentProps<'button'>>(
  function MyButton(props, ref) {
    return <button ref={ref} {...props} />;
  },
);
```

You may nest `render` props when a single visible element belongs to multiple behaviors, such as Tooltip + Dialog + Menu trigger composition.

Only change the default rendered element when semantics remain correct. Some parts need extra props when rendered as links or custom elements; for example, Tabs links use `nativeButton={false}` with `render={<Link ... />}`.

For performance-sensitive cases, `render` can be a function:

```tsx
<Switch.Thumb
  render={(props, state) => (
    <span {...props}>{state.checked ? <CheckedIcon /> : <UncheckedIcon />}</span>
  )}
/>
```

## State And Event Customization

Components are uncontrolled by default. Control them with external state only when the app needs to read or drive the state:

```tsx
const [open, setOpen] = React.useState(false);

<Dialog.Root open={open} onOpenChange={setOpen}>
  ...
</Dialog.Root>
```

Change handlers such as `onOpenChange`, `onValueChange`, and `onPressedChange` receive a second `eventDetails` argument:

```ts
interface BaseUIChangeEventDetails {
  reason: string;
  event: Event;
  cancel: () => void;
  allowPropagation: () => void;
  isCanceled: boolean;
  isPropagationAllowed: boolean;
}
```

Use `eventDetails.reason` for conditional side effects, `cancel()` to prevent the internal state update, and `allowPropagation()` when parent popups should also receive events such as Escape.

Use `event.preventBaseUIHandler()` in React synthetic event handlers only as an escape hatch to prevent Base UI's internal React handler. It does not call `preventDefault()` or `stopPropagation()`.

## TypeScript Wrappers

Base UI exports namespaced part types:

```tsx
import { Tooltip } from '@base-ui/react/tooltip';

function MyTooltip(props: Tooltip.Root.Props) {
  return <Tooltip.Root {...props} />;
}
```

Use `Component.Part.Props` for wrappers and `Component.Part.State` for render functions. Event types also live under namespaces, for example `Combobox.Root.ChangeEventDetails` and `Combobox.Root.ChangeEventReason`.

For custom primitives that expose Base UI-style `render`, use `useRender.ComponentProps` and `useRender.ElementProps` from `@base-ui/react/use-render`.

## Accessibility

Base UI handles many ARIA attributes, roles, pointer interactions, keyboard interactions, and focus management, but the application still owns:

- Visible labels and accessible names.
- Focus-visible styling.
- Color contrast.
- Correct semantic overrides when using `render`.
- Screen reader and keyboard testing.

Many components support arrow keys, alphanumeric keys, Home, End, Enter, and Escape. Always test the exact component path you build.

For popups and dialogs, verify `initialFocus`, `finalFocus`, focus trapping, focus return, Escape handling, outside interaction, and close button availability.

## Forms

Base UI form controls extend native constraint validation and integrate with React Hook Form and TanStack Form.

Use `Field.Root` to group labels, descriptions, controls, errors, and validity:

```tsx
import { Field } from '@base-ui/react/field';
import { Form } from '@base-ui/react/form';

<Form>
  <Field.Root name="email">
    <Field.Label>Email</Field.Label>
    <Field.Control required type="email" />
    <Field.Description>Use your work email.</Field.Description>
    <Field.Error />
  </Field.Root>
</Form>
```

Use `Form`'s `onFormSubmit` when you need submitted values as a JavaScript object. It calls `preventDefault` on the native submit event.

For Zod, the docs map `z.flattenError(result.error).fieldErrors` to field names.

For React Hook Form, use `Controller`, pass `name`, `ref`, `value`, `onBlur`, and `onChange` into the Base UI control, and mirror external state into `Field.Root` via `invalid`, `touched`, and `dirty`.

Accessible labeling:

- `Input`, `NumberField`, `OTPField`, `Autocomplete`, outside-popup `Combobox`, `Checkbox`, `Radio`, and `Switch`: use `Field.Label` or native `label`.
- Trigger-based `Combobox` with input inside popup: use `Combobox.Label`.
- `Select`: use `Select.Label`.
- `Slider`: use `Slider.Label`; for multi-thumb sliders, also add `aria-label` to each `Slider.Thumb`.
- If no visible label exists, add `aria-label` to the control.

## Animation

Prefer CSS transitions targeting:

- `[data-starting-style]` for the starting style when opening.
- `[data-ending-style]` for the ending style when closing.

Transitions are preferred over keyframe animations because they can reverse smoothly when interrupted.

For JavaScript animation libraries such as Motion on popup components:

1. Control the component with `open`.
2. Add `keepMounted` to the part that normally unmounts.
3. Compose the animated element through `render`.
4. Include opacity in the animation, even if near `1`, so Base UI can detect completion through `element.getAnimations()`.

## Utilities And Providers

Use `DirectionProvider` for RTL behavior, but still set HTML/CSS direction yourself:

```tsx
<div dir="rtl">
  <DirectionProvider direction="rtl">{children}</DirectionProvider>
</div>
```

Use `CSPProvider` when a strict Content Security Policy blocks inline style or script tags rendered by Base UI:

```tsx
<CSPProvider nonce={nonce}>{children}</CSPProvider>
```

`disableStyleElements` removes inline style elements, but then the app must provide equivalent external CSS such as `.base-ui-disable-scrollbar`.

Use `mergeProps` when composing internal props with user props. It concatenates `className`, merges `style`, runs event handlers right-to-left, keeps the rightmost `ref`, and lets rightmost ordinary props win.

Use `useRender` to build custom components that support Base UI's `render` prop behavior.

## Current-Docs Check

When exact API details matter, use current docs before answering or changing code:

1. Resolve Context7 library `Base UI`; prefer `/mui/base-ui`.
2. Query docs for the exact component or concept.
3. If Context7 is insufficient, fetch the component's Markdown page from `https://base-ui.com/llms.txt`.
4. Cross-check project package version if the repo is pinned below latest.
