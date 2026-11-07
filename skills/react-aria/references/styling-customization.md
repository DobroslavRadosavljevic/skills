# Styling and customization

## Contents

- [Class names](#class-names)
- [States as data attributes](#states-as-data-attributes)
- [Render props](#render-props)
- [Slots](#slots)
- [CSS variables](#css-variables)
- [Tailwind](#tailwind)
- [Animation](#animation)
- [The render prop for DOM elements](#the-render-prop-for-dom-elements)
- [Wrapping components: composeRenderProps](#wrapping-components-composerenderprops)
- [Contexts](#contexts)
- [Accessing parent state](#accessing-parent-state)
- [Mixing with hooks](#mixing-with-hooks)

Docs: https://react-aria.adobe.com/styling, https://react-aria.adobe.com/customization

## Class names

Components ship with no styles. Each has a default class, `react-aria-ComponentName`:

```css
.react-aria-Select { /* ... */ }
.react-aria-ListBoxItem { /* ... */ }
```

A custom `className` replaces the default class. It does not add to it. CSS that targets `.react-aria-Button` stops matching a button that has its own `className`. To keep the default, use the function form:

```tsx
import {Button} from 'react-aria-components/Button';

<Button className={({defaultClassName}) => `${defaultClassName} primary`}>Save</Button>;
```

Use native CSS nesting to scope shared parts, as the docs do:

```css
.react-aria-Select .react-aria-Button { width: 100%; }
```

## States as data attributes

Interaction states are data attributes. Use them in place of pseudo classes:

```css
.react-aria-ListBoxItem[data-selected] { background: black; color: white; }
.react-aria-ListBoxItem[data-focus-visible] { outline: 2px solid; }
```

Why not `:hover` and `:active`:

- `data-hovered` is not applied on touch, so there is no sticky hover after a tap.
- `data-pressed` works for mouse, touch, keyboard, and screen readers, and it is removed when the pointer drags off.
- `data-focus-visible` is not set for a click on an input or for programmatic focus.

Each component's docs list its attributes. Common ones: `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-focus-within`, `data-disabled`, `data-selected`, `data-invalid`, `data-required`, `data-readonly`, `data-open`, `data-expanded`, `data-entering`, `data-exiting`, `data-placement`, `data-orientation`, `data-empty`, `data-pending`, `data-dragging`, `data-drop-target`.

Pass your own `data-*` attributes as props. They reach the DOM node, which is useful for variants and test ids.

## Render props

`className`, `style`, and `children` accept functions that receive the state:

```tsx
import {ListBoxItem} from 'react-aria-components/ListBox';

<ListBoxItem className={({isSelected}) => (isSelected ? 'selected' : 'unselected')}>
  {({isSelected}) => (
    <>
      {isSelected && <span aria-hidden="true">✓</span>}
      <span>Item</span>
    </>
  )}
</ListBoxItem>;
```

The functions also receive defaults: `defaultClassName`, `defaultStyle`, and `defaultChildren`. Use these to extend rather than replace.

```tsx
import {SelectValue} from 'react-aria-components/Select';

<SelectValue>{({defaultChildren}) => <span className="value">{defaultChildren}</span>}</SelectValue>;
```

A `ListBoxItem` whose children are not plain text needs a `textValue` prop for typeahead and screen readers.

## Slots

Patterns that use the same component twice tell them apart with `slot`. Style with the attribute:

```tsx
import {Button, Group, Input, Label, NumberField} from 'react-aria-components/NumberField';

<NumberField>
  <Label>Width</Label>
  <Group>
    <Input />
    <Button slot="increment">+</Button>
    <Button slot="decrement">-</Button>
  </Group>
</NumberField>;
```

```css
.react-aria-NumberField [slot='increment'] { border-radius: 4px 4px 0 0; }
.react-aria-NumberField [slot='decrement'] { border-radius: 0 0 4px 4px; }
```

To opt a child out of a context, pass `slot={null}`. For example, a plain close button inside a `Dialog` or a button inside a field that must not get the field's behavior.

## CSS variables

Some components set variables. Examples: `--trigger-width` on `Popover`, slider and color thumb positions, and the Sheet and Tabs variables in their references. Use them directly:

```css
.react-aria-Popover { width: var(--trigger-width); }
```

## Tailwind

Without the plugin, use data modifiers and arbitrary values:

```tsx
import {ListBoxItem, Popover} from 'react-aria-components/Select';

<ListBoxItem className="data-[selected]:bg-blue-400 data-[disabled]:bg-gray-100">Item</ListBoxItem>;
<Popover className="w-(--trigger-width)" />;
```

With the plugin, states lose the `data-` prefix:

```bash
bun add -d tailwindcss-react-aria-components
```

```css
@import "tailwindcss";
@plugin "tailwindcss-react-aria-components";
/* With a prefix instead: */
/* @plugin "tailwindcss-react-aria-components" { prefix: rac }; */
```

Version 2 of the plugin is for Tailwind v4. Tailwind v3 uses version 1, set in `plugins` in `tailwind.config.js`.

| Attribute | Modifier | Attribute | Modifier |
| --- | --- | --- | --- |
| `data-hovered` | `hover:` | `data-open` | `open:` |
| `data-pressed` | `pressed:` | `data-expanded` | `expanded:` |
| `data-focused` | `focus:` | `data-entering` | `entering:` |
| `data-focus-visible` | `focus-visible:` | `data-exiting` | `exiting:` |
| `data-focus-within` | `focus-within:` | `data-indeterminate` | `indeterminate:` |
| `data-active` | `active:` | `data-placeholder` | `placeholder-shown:` |
| `data-selected` | `selected:` | `data-current` | `current:` |
| `data-selection-start` | `selection-start:` | `data-required` | `required:` |
| `data-selection-end` | `selection-end:` | `data-unavailable` | `unavailable:` |
| `data-disabled` | `disabled:` | `data-invalid` | `invalid:` |
| `data-readonly` | `read-only:` | `data-pending` | `pending:` |
| `data-dragging` | `dragging:` | `data-empty` | `empty:` |
| `data-drop-target` | `drop-target:` | `data-resizing` | `resizing:` |
| `data-allows-removing` | `allows-removing:` | `data-allows-sorting` | `allows-sorting:` |
| `data-allows-dragging` | `allows-dragging:` | `data-has-submenu` | `has-submenu:` |
| `data-has-child-items` | `has-child-items:` | `data-outside-month` | `outside-month:` |
| `data-outside-visible-range` | `outside-visible-range:` | | |

Non-boolean states follow `{name}-{value}`:

| Attribute | Modifiers |
| --- | --- |
| `data-placement` | `placement-left:`, `placement-right:`, `placement-top:`, `placement-bottom:` |
| `data-orientation` | `orientation-horizontal:`, `orientation-vertical:` |
| `data-type` | `type-literal:`, `type-year:`, `type-month:`, `type-day:` |
| `data-layout` | `layout-grid:`, `layout-stack:` |
| `data-selection-mode` | `selection-single:`, `selection-multiple:` |
| `data-resizable-direction` | `resizable-right:`, `resizable-left:`, `resizable-both:` |
| `data-sort-direction` | `sort-ascending:`, `sort-descending:` |

Unprefixed modifiers work for both React Aria states and native pseudo classes when the names match, such as `disabled:`.

For parents, use Tailwind `group`: `group-invalid:outline` on a child of a field with class `group`. Render-prop functions are useful when one state sets many classes.

Animation utilities: `tw-animate-css` for Tailwind v4 and `tailwindcss-animate` for v3.

```tsx
import {Popover} from 'react-aria-components/Popover';

<Popover className="data-[entering]:animate-in data-[entering]:fade-in data-[exiting]:animate-out data-[exiting]:fade-out" />;
```

## Animation

Overlays and some other components have `data-entering` and `data-exiting`.

- `data-entering` is the start state of the entry. For CSS transitions, it applies for one frame. Put the transition on the default state.
- `data-exiting` is the end state of the exit. React Aria waits for animations to finish, then removes the element. To use a different exit, put its transition inside `[data-exiting]`.

```css
.react-aria-Popover {
  transition: transform 300ms, opacity 300ms;

  &[data-entering] { opacity: 0; transform: scale(0.8); }

  &[data-exiting] {
    transition: opacity 150ms;
    opacity: 0;
  }
}
```

Keyframes also work with `[data-entering]` and `[data-exiting]`. They can not be interrupted, so an overlay opened and closed quickly can jump. Prefer transitions for overlays that open and close often.

Motion: wrap components with `motion.create`.

```tsx
import {DialogTrigger, Modal, ModalOverlay} from 'react-aria-components/Modal';
import {Button} from 'react-aria-components/Button';
import {motion} from 'motion/react';
import {useState} from 'react';

const MotionModal = motion.create(Modal);
const MotionModalOverlay = motion.create(ModalOverlay);

type AnimationState = 'unmounted' | 'hidden' | 'visible';

function Example() {
  let [animation, setAnimation] = useState<AnimationState>('unmounted');

  return (
    <DialogTrigger onOpenChange={isOpen => setAnimation(isOpen ? 'visible' : 'hidden')}>
      <Button>Open</Button>
      <MotionModalOverlay
        isExiting={animation === 'hidden'}
        onAnimationComplete={done => {
          setAnimation(a => (done === 'hidden' && a === 'hidden' ? 'unmounted' : a));
        }}
        variants={{hidden: {opacity: 0}, visible: {opacity: 1}}}
        initial="hidden"
        animate={animation}>
        <MotionModal variants={{hidden: {opacity: 0, y: 32}, visible: {opacity: 1, y: 0}}}>
          {/* Dialog */}
        </MotionModal>
      </MotionModalOverlay>
    </DialogTrigger>
  );
}
```

The `isExiting` prop keeps the overlay in the DOM until Motion finishes. Animate collection item removal with `AnimatePresence`. Render with `array.map`, and give each item both `key` and `id`:

```tsx
import {GridList, GridListItem} from 'react-aria-components/GridList';
import {AnimatePresence, motion} from 'motion/react';

const MotionItem = motion.create(GridListItem);

<GridList aria-label="Items">
  <AnimatePresence>
    {items.map(item => (
      <MotionItem key={item.id} id={item.id} layout exit={{opacity: 0}}>
        {item.name}
      </MotionItem>
    ))}
  </AnimatePresence>
</GridList>;
```

## The render prop for DOM elements

`render` on a component replaces its DOM element (since 1.15). It receives DOM props and state:

```tsx
import {Button} from 'react-aria-components/Button';
import {type HTMLMotionProps, motion} from 'motion/react';

<Button
  render={(domProps, {isPressed}) => (
    <motion.button {...(domProps as unknown as HTMLMotionProps<'button'>)} animate={{scale: isPressed ? 0.9 : 1}} />
  )}>
  Press me
</Button>;
```

The cast is for TypeScript only. Motion redefines events such as `onDrag` and `onAnimationStart`, so its prop type does not match the DOM props. The docs omit the cast.

Rules that keep behavior and accessibility intact:

- Render the expected element type. A `Button` must render a `<button>`, not an `<a>`. Development builds warn on a mismatch.
- Render one root DOM element. No fragments.
- Pass all provided props and the ref to the DOM element. Merge your own with `mergeProps` from `react-aria/mergeProps`.

## Wrapping components: composeRenderProps

A wrapper must accept both a value and a function from its caller. `composeRenderProps` does this:

```tsx
import {Button, type ButtonProps} from 'react-aria-components/Button';
import {composeRenderProps} from 'react-aria-components/composeRenderProps';

function MyButton(props: ButtonProps) {
  return (
    <Button
      {...props}
      className={composeRenderProps(
        props.className,
        (className, {isPressed}) => `my-button ${isPressed ? 'pressed' : ''} ${className ?? ''}`
      )}
    />
  );
}
```

With `tailwind-variants` or similar, call the same helper so a function `className` from a caller keeps working. Do not concatenate `props.className` as a string: it can be a function.

To support render props in your own component, use `useRenderProps`. See [hooks-components.md](hooks-components.md).

## Contexts

Parents send props to children through context. That is why a `Button` works inside `NumberField`, `Select`, and `DialogTrigger` with no special variant. Every component exports a context: `ButtonContext`, `InputContext`, `LabelContext`, `TextFieldContext`, and so on.

Send props to many descendants, including deeply nested ones. Local props win over context:

```tsx
import {TextFieldContext} from 'react-aria-components/TextField';

function FieldGroup({children, isDisabled}) {
  return <TextFieldContext.Provider value={{isDisabled}}>{children}</TextFieldContext.Provider>;
}
```

Send per-slot props with `slots`. `DEFAULT_SLOT` targets children that have no `slot` prop:

```tsx
import {ButtonContext} from 'react-aria-components/Button';
import {DEFAULT_SLOT} from 'react-aria-components/slots';

function Stepper({children, setValue}) {
  return (
    <ButtonContext.Provider
      value={{
        slots: {
          [DEFAULT_SLOT]: {className: 'default-button'},
          increment: {onPress: () => setValue(v => v + 1)},
          decrement: {onPress: () => setValue(v => v - 1)}
        }
      }}>
      {children}
    </ButtonContext.Provider>
  );
}
```

Avoid nested providers with `Provider`:

```tsx
import {Provider} from 'react-aria-components/slots';
import {ButtonContext} from 'react-aria-components/Button';
import {InputContext} from 'react-aria-components/Input';

<Provider
  values={[
    [ButtonContext, {isDisabled: true}],
    [InputContext, {placeholder: 'Search'}]
  ]}>
  {children}
</Provider>;
```

Make your own component a drop-in part. `useContextProps` merges local props and the ref with the context value, and handles `slot`:

```tsx
import {LabelContext, type LabelProps} from 'react-aria-components/Label';
import {useContextProps} from 'react-aria-components/slots';
import {forwardRef, type ForwardedRef} from 'react';

const MyLabel = forwardRef((props: LabelProps, ref: ForwardedRef<HTMLLabelElement>) => {
  let [mergedProps, mergedRef] = useContextProps(props, ref, LabelContext);
  return <label {...mergedProps} ref={mergedRef} />;
});
```

Read a context with no merging using `useSlottedContext(ButtonContext, 'increment')`.

## Accessing parent state

Tightly coupled parents expose state contexts for custom children. Examples: `CalendarStateContext`, `DatePickerStateContext`, `SelectStateContext`, `ComboBoxStateContext`, `ListStateContext`, `OverlayTriggerStateContext`, `RadioGroupStateContext`, `ToggleGroupStateContext`, `TableStateContext`, `TreeStateContext`.

```tsx
import {CalendarStateContext} from 'react-aria-components/Calendar';
import {useDateFormatter} from 'react-aria/useDateFormatter';
import {type CalendarDate, getLocalTimeZone} from '@internationalized/date';
import {useContext} from 'react';

function CalendarValue() {
  let state = useContext(CalendarStateContext)!;
  let {format} = useDateFormatter();
  // state.value is a list when selectionMode="multiple". This Calendar uses single selection.
  let value = state.value as CalendarDate | null;
  let date = value?.toDate(getLocalTimeZone());
  return `Selected date: ${date ? format(date) : 'None'}`;
}
```

Place the custom child inside the parent. A common use is a clear button: inside a `DatePicker`, read `DatePickerStateContext`, render `Button slot={null}`, and call `state.setValue(null)`. The `slot={null}` stops the button from taking the picker's open behavior.

## Mixing with hooks

Components and hooks mix in both directions: a hook-built child can consume a component's context, and a hook-built parent can provide contexts to stock children. See [hooks-components.md](hooks-components.md). Move down to hooks only when `render`, contexts, and state contexts are not enough.
