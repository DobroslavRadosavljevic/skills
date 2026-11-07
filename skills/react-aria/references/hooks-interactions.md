# React Aria: interaction hooks and utilities

Low-level behavior hooks from `react-aria` 3.53.1. Each one returns DOM props that you spread on your own element. Import from the subpath: `react-aria/<name>`.

Contents:

- [Why these hooks exist](#why-these-hooks-exist)
- [Rules for combining hooks](#rules-for-combining-hooks)
- [Press: usePress, Pressable, useLongPress](#press)
- [Hover: useHover](#hover)
- [Focus: useFocus, useFocusWithin, useFocusVisible, useFocusRing, FocusRing, useFocusable, Focusable](#focus)
- [FocusScope and useFocusManager](#focusscope-and-usefocusmanager)
- [Keyboard: useKeyboard](#keyboard)
- [Move: useMove](#move)
- [useContextMenu](#usecontextmenu)
- [useLandmark](#uselandmark)
- [Labels: useField, useLabel](#labels)
- [Overlay primitives](#overlay-primitives)
- [Utilities](#utilities)
- [Export map](#export-map)

## Why these hooks exist

Native events and CSS pseudo-classes break across input types. These hooks fix each problem.

| Native tool | What goes wrong | Hook behavior |
| --- | --- | --- |
| `onClick`, `:active` | Touch fires emulated mouse events after `touchend`. `:active` stays on after you drag a finger off. No `pointerType`. A held Enter key repeats and can press the next focused item. | `usePress` gives one event model for mouse, touch, pen, keyboard, and screen reader. `isPressed` turns off when the pointer leaves. Key repeat is ignored. |
| `onPointerDown`/`onPointerUp` | No keyboard or screen reader. iOS can fire `pointerup` when the finger is off the target. | `usePress` does its own hit test, and adds `keyboard` and `virtual` pointer types. |
| Long press on a button | iOS starts text selection on nearby elements, even with `user-select: none` on the button. | `usePress` sets page-level `user-select: none` during touch and removes it after a short delay. |
| Scroll during a touch | A release after a scroll can activate the button. | `usePress` cancels the press on scroll. |
| `:hover` | Sticky on touch: on iOS one tap applies it until you tap elsewhere. | `useHover` starts only for `mouse` and `pen`. |
| `@media (hover: hover)` | Hybrid devices (touch laptops, iPad with a trackpad) change input at any time. `hover` never matches and `any-hover` always matches. | `useHover` checks each event, so hybrid devices work. |
| `onMouseEnter` | Fires as emulation after `touchend`, and leaves only on the next tap elsewhere. | `useHover` ignores emulated events (a short global window after touch `pointerup`). |
| `:focus` | Shows the ring after a mouse click too. | `useFocusRing` shows it for keyboard and screen reader modality only. |
| `:focus-visible` | The spec leaves the rule to each browser, so behavior varies. | `useFocusVisible` tracks the last modality globally. |
| Native `<button>` focus | Safari does not focus a button on mouse down or touch. Focus restore from overlays then fails. | `usePress` focuses the element on press. `useFocusable` always sets `tabIndex` so Safari can focus it. |

### Focus-visible rules worth knowing

- The last input modality is tracked globally with document-level pointer, keyboard, and focus listeners.
- Inside a text input, only Tab and Escape make focus visible. Typing after a mouse click keeps the mouse style. Pass `isTextInput: true` for a text-like element that is not a native text input.
- Modifier shortcuts (Ctrl, Cmd, Alt) do not change the modality.
- A focus event with no preceding input (iOS next/previous buttons, a screen reader) shows the ring.
- Programmatic `focus()` does not change the modality. A mouse click that opens a menu and moves focus shows no ring. To force the ring after moving focus (first invalid field), call `setInteractionModality('keyboard')`.

### What breaks when you mix them

- **`usePress` stops propagation.** Press handlers stop the underlying `pointerdown`, `mousedown`, `click`, and key events by default. A parent `onClick`, `onPointerDown`, or `onKeyDown` will not run. Call `e.continuePropagation()` in the press handler to let them through. Only a capture-phase listener on an ancestor still sees the event.
- **`onClick` next to `pressProps`.** A plain `onClick` on the same JSX element replaces or is replaced by `pressProps.onClick` depending on spread order. Use `mergeProps` or `usePress({onClick})`. `onClick` is supported as a compatibility alias only: `onPress` has the details.
- **Spreading two prop objects.** `<div {...pressProps} {...hoverProps}>` drops handlers when both define the same key. For example `pressProps` and `keyboardProps` both set `onKeyDown`. Always use `mergeProps`.
- **Reading `event.target` or `event.button`.** `PressEvent` is not a DOM event. Use `e.pointerType`, `e.target`, `e.x`, `e.y`, `e.key`, and the modifier flags.
- **`:hover` and `:active` CSS with these hooks.** You get the sticky behavior back. Style from `isHovered`, `isPressed`, or data attributes you set from them.
- **`:focus-visible` CSS next to `useFocusRing`.** The two can disagree, for example after a programmatic focus move. Pick one for each component.
- **`pointerType === 'mouse'` checks for "desktop".** Hybrid devices change type between events. Read it per event and do not store it.
- **Hover-only actions.** Hover does not exist on touch or keyboard. Give another path, such as a long press or a visible button.
- **Long press without a keyboard path.** `useLongPress` has no keyboard trigger. Add one yourself.
- **Blog post versus current source.** The 2020 blog post says `usePress` calls `preventDefault` on all mouse and touch events. The 3.53.1 pointer path does not do this on mouse down. It stops propagation, and fires `onPress` from the `click` that follows `pointerup` for better compatibility with third-party code. Do not rely on `defaultPrevented` from either.

Source: <https://react-aria.adobe.com/blog/building-a-button-part-1>, `part-2`, `part-3`.

## Rules for combining hooks

```tsx
import {mergeProps} from 'react-aria/mergeProps';
import {useFocusRing} from 'react-aria/useFocusRing';
import {useHover} from 'react-aria/useHover';
import {usePress} from 'react-aria/usePress';

function Tile({onPress, children}: {onPress: () => void; children: React.ReactNode}) {
  let {pressProps, isPressed} = usePress({onPress});
  let {hoverProps, isHovered} = useHover({});
  let {focusProps, isFocusVisible} = useFocusRing();
  return (
    <div
      {...mergeProps(pressProps, hoverProps, focusProps)}
      role="button"
      tabIndex={0}
      data-pressed={isPressed || undefined}
      data-hovered={isHovered || undefined}
      data-focus-visible={isFocusVisible || undefined}>
      {children}
    </div>
  );
}
```

- Set `role` and `tabIndex` yourself when you use interaction hooks on a non-native element. They add behavior only. `useButton` adds the role too, so prefer it for a real button.
- Interaction state does not set any data attributes. Add them yourself as shown. `data-pressed`, `data-hovered`, and `data-focus-visible` are the names React Aria Components use, so the same CSS works for both.

## Press

### usePress

Unified press across mouse, touch, pen, keyboard, and screen reader. Pick it for a custom pressable. Pick `useButton` for a real button. Doc: <https://react-aria.adobe.com/usePress>

```tsx
import {usePress} from 'react-aria/usePress';

function Example() {
  let {pressProps, isPressed} = usePress({
    onPress: e => console.log(e.pointerType, e.key, e.x, e.y)
  });
  return (
    <div {...pressProps} role="button" tabIndex={0} data-pressed={isPressed || undefined}>
      Press me
    </div>
  );
}
```

Options (`PressHookProps`):

| Prop | Type | Note |
| --- | --- | --- |
| `onPress` | `(e: PressEvent) => void` | Released over the target |
| `onPressStart` | `(e: PressEvent) => void` | Can fire again when the pointer returns to the target |
| `onPressEnd` | `(e: PressEvent) => void` | Released, or the pointer left the target |
| `onPressUp` | `(e: PressEvent) => void` | Released over the target, even if the press started elsewhere |
| `onPressChange` | `(isPressed: boolean) => void` | |
| `onClick` | `(e: MouseEvent) => void` | Alias for third-party code. Not recommended. |
| `isPressed` | `boolean` | Controlled press state, for example while a triggered overlay is open |
| `isDisabled` | `boolean` | |
| `preventFocusOnPress` | `boolean` | Do not focus on press |
| `shouldCancelOnPointerExit` | `boolean` | Cancel when the pointer leaves, with no restart on return |
| `allowTextSelectionOnPress` | `boolean` | Keep text selection on |
| `ref` | `RefObject<Element \| null>` | Optional target ref |

Returns `{pressProps, isPressed}`.

`PressEvent`: `type` (`'pressstart' | 'pressend' | 'pressup' | 'press'`), `pointerType` (`'mouse' | 'pen' | 'touch' | 'keyboard' | 'virtual'`), `target`, `shiftKey`, `ctrlKey`, `metaKey`, `altKey`, `x`, `y` (relative to target), `key` (for keyboard, to tell Space from Enter), `continuePropagation()`.

Gotchas:

- Links respond to Enter only, unless they have `role="button"`.
- `pressProps` marks the element and injects a `touch-action: pan-x pan-y pinch-zoom` rule in a CSS `@layer`. This removes the double-tap-zoom delay.
- A screen reader press arrives as a bare `click` with `pointerType: 'virtual'`. Do not depend on `onPressStart` for real work that must run for all users. Use `onPress`.

### Pressable

Applies press behavior to an existing child element with no wrapper. The child must accept and spread DOM props and a ref, and it must be focusable.

```tsx
import {Pressable} from 'react-aria/Pressable';

<Pressable onPress={() => console.log('pressed')}>
  <span role="button" tabIndex={0}>Press me</span>
</Pressable>;
```

`PressableProps` is `PressProps` plus a single `children` element. `react-aria-components/Pressable` also exports it.

### useLongPress

Press and hold. Doc: <https://react-aria.adobe.com/useLongPress>

```tsx
import {mergeProps} from 'react-aria/mergeProps';
import {useLongPress} from 'react-aria/useLongPress';
import {usePress} from 'react-aria/usePress';

function Example() {
  let {longPressProps} = useLongPress({
    accessibilityDescription: 'Long press to activate hyper speed',
    threshold: 500,
    onLongPress: e => console.log('long', e.pointerType)
  });
  let {pressProps} = usePress({onPress: () => console.log('short')});
  return <button {...mergeProps(pressProps, longPressProps)}>Go</button>;
}
```

Options: `onLongPressStart`, `onLongPress`, `onLongPressEnd` (`LongPressEvent`), `threshold` (ms, default 500), `isDisabled`, `pointerType` (`'mouse' | 'touch'`, both by default), `accessibilityDescription`.

- Moving off the target before the threshold cancels it.
- After it fires, other pointer interactions on the target are canceled, so the short press does not also run.
- It blocks text selection and the OS context menu during the hold.
- It has no keyboard path. Add one (a key, or a separate button).

## Hover

### useHover

Mouse and pen hover only. Never starts for touch. Doc: <https://react-aria.adobe.com/useHover>

```tsx
import {useHover} from 'react-aria/useHover';

function Example() {
  let {hoverProps, isHovered} = useHover({
    onHoverStart: e => console.log(e.pointerType),
    onHoverEnd: e => console.log(e.target)
  });
  return <div {...hoverProps} data-hovered={isHovered || undefined}>Hover me</div>;
}
```

Options: `onHoverStart`, `onHoverEnd` (`HoverEvent`), `onHoverChange(isHovering)`, `isDisabled`. Returns `{hoverProps, isHovered}`.

`HoverEvent`: `type` (`'hoverstart' | 'hoverend'`), `pointerType` (`'mouse' | 'pen'`), `target`.

## Focus

Pick by scope:

| Need | Use |
| --- | --- |
| Focus events on the element itself | `useFocus` |
| Focus events on the element or any descendant | `useFocusWithin` |
| Show a ring on one component | `useFocusRing` or `FocusRing` |
| Page-wide "is keyboard in use" | `useFocusVisible` |
| Make any element focusable, with `autoFocus` | `useFocusable` or `Focusable` |

### useFocus

Target only. Unlike React `onFocus`, it ignores events from children. Doc: <https://react-aria.adobe.com/useFocus>

```tsx
import {useFocus} from 'react-aria/useFocus';

function Example() {
  let {focusProps} = useFocus({
    onFocus: () => console.log('focus'),
    onBlur: () => console.log('blur'),
    onFocusChange: isFocused => console.log(isFocused)
  });
  return <input {...focusProps} aria-label="Name" />;
}
```

Options: `onFocus`, `onBlur`, `onFocusChange`, `isDisabled`. Returns `{focusProps}`.

### useFocusWithin

Target and descendants. The element itself does not need to be focusable. Doc: <https://react-aria.adobe.com/useFocusWithin>

```tsx
import {useFocusWithin} from 'react-aria/useFocusWithin';

function Example() {
  let {focusWithinProps} = useFocusWithin({
    onFocusWithin: () => console.log('entered'),
    onBlurWithin: () => console.log('left'),
    onFocusWithinChange: isWithin => console.log(isWithin)
  });
  return (
    <div {...focusWithinProps}>
      <input aria-label="First" />
      <input aria-label="Last" />
    </div>
  );
}
```

Moving focus between two descendants does not fire `onBlurWithin`.

### useFocusVisible

Global modality state. Doc: <https://react-aria.adobe.com/useFocusVisible>

```tsx
import {setInteractionModality, useFocusVisible} from 'react-aria/useFocusVisible';

function Example() {
  let {isFocusVisible} = useFocusVisible({isTextInput: true});
  return <div>Focus visible: {String(isFocusVisible)}</div>;
}

setInteractionModality('keyboard');
```

Options: `autoFocus`, `isTextInput`. Returns `{isFocusVisible}`. `Modality` is exported as a type. Its value is true whenever the last input was keyboard or screen reader, even when no element in this component has focus. For one component, use `useFocusRing`.

### useFocusRing

Doc: <https://react-aria.adobe.com/useFocusRing>

```tsx
import {useFocusRing} from 'react-aria/useFocusRing';

function Example() {
  let {isFocused, isFocusVisible, focusProps} = useFocusRing();
  return (
    <button
      {...focusProps}
      data-focused={isFocused || undefined}
      style={{outline: isFocusVisible ? '2px solid dodgerblue' : 'none', outlineOffset: 2}}>
      Save
    </button>
  );
}
```

Options: `within` (default `false`, ring when something inside has focus), `isTextInput`, `autoFocus`. Returns `{focusProps, isFocused, isFocusVisible}`.

### FocusRing

A class-name shortcut. The child must accept DOM props. Doc: <https://react-aria.adobe.com/FocusRing>

```tsx
import {FocusRing} from 'react-aria/FocusRing';

<FocusRing focusClass="is-focused" focusRingClass="focus-ring">
  <button>Test</button>
</FocusRing>;
```

Props: `focusClass`, `focusRingClass`, `within`, `isTextInput`, `autoFocus`, `children` (one element). The docs page imports from `@react-aria/focus`; use `react-aria/FocusRing`.

### useFocusable and Focusable

No doc page. `useFocusable` makes an element focusable and handles `autoFocus`, `excludeFromTabOrder`, and focus and key events.

```tsx
import {useRef} from 'react';
import {Focusable} from 'react-aria/Focusable';
import {useFocusable} from 'react-aria/useFocusable';

function Field(props: {autoFocus?: boolean; isDisabled?: boolean}) {
  let ref = useRef<HTMLDivElement>(null);
  let {focusableProps} = useFocusable(props, ref);
  return <div {...focusableProps} ref={ref} role="textbox" aria-label="Notes" />;
}

<Focusable>
  <span role="button" aria-label="Info">i</span>
</Focusable>;
```

Options (`FocusableOptions`): `autoFocus`, `isDisabled`, `excludeFromTabOrder`, `onFocus`, `onBlur`, `onFocusChange`, `onKeyDown`, `onKeyUp`, `id`.

- It sets `tabIndex={0}` by default, `-1` with `excludeFromTabOrder`, and leaves it unset when disabled.
- `Focusable` is the way to make a non-native trigger work inside `TooltipTrigger` and similar components. The child needs a role.

## FocusScope and useFocusManager

Contains, restores, and moves focus. Doc: <https://react-aria.adobe.com/FocusScope>

```tsx
import {FocusScope, useFocusManager} from 'react-aria/FocusScope';

function Trap({onClose}: {onClose: () => void}) {
  return (
    <FocusScope contain restoreFocus autoFocus>
      <input aria-label="First" />
      <button onClick={onClose}>Close</button>
    </FocusScope>
  );
}

function ToolbarButton({children}: {children: React.ReactNode}) {
  let focusManager = useFocusManager();
  return (
    <button
      onKeyDown={e => {
        if (e.key === 'ArrowRight') focusManager?.focusNext({wrap: true});
        if (e.key === 'ArrowLeft') focusManager?.focusPrevious({wrap: true});
      }}>
      {children}
    </button>
  );
}

function Toolbar({children}: {children: React.ReactNode}) {
  return (
    <div role="toolbar" aria-label="Edit">
      <FocusScope>{children}</FocusScope>
    </div>
  );
}
```

`FocusScope` props: `contain`, `restoreFocus`, `autoFocus`, `children`. It renders hidden sentinel `span`s in the DOM, so CSS selectors such as `:first-child` can be off.

`useFocusManager()` returns `FocusManager | undefined`, so use `?.`. It is `undefined` outside a scope. Methods take `{from, tabbable, wrap, accept}` and return the element or `null`: `focusNext`, `focusPrevious`, `focusFirst`, `focusLast`.

## Keyboard

### useKeyboard

Like DOM key events, with one difference: **propagation stops by default** when a handler is present. Call `e.continuePropagation()` for keys you do not handle. Doc: <https://react-aria.adobe.com/useKeyboard>

```tsx
import {useKeyboard} from 'react-aria/useKeyboard';

function Example() {
  let {keyboardProps} = useKeyboard({
    onKeyDown: e => {
      if (e.key !== 'Enter') e.continuePropagation();
    },
    shortcuts: {
      'Mod+s': () => console.log('save'),
      ArrowLeft: () => console.log('left'),
      ArrowRight: () => {
        console.log('right');
        return false;
      }
    }
  });
  return <input {...keyboardProps} aria-label="Name" />;
}
```

Options: `onKeyDown`, `onKeyUp`, `isDisabled`, `shortcuts`, `allowRepeats`, `allowComposing`. Returns `{keyboardProps}`.

Shortcuts:

- Keys combine modifiers and a key with `+`, in any order and any case for modifiers: `Mod`, `Shift`, `Alt`, `Ctrl`, `Control`, `Meta`. `Mod` is Command on macOS and Control elsewhere.
- The match is exact on modifiers. A shortcut handler runs after any `onKeyDown`.
- Handler return value: nothing (handled, stop propagation, prevent default), `true` (prevent default), `false` (allow the browser default and continue propagation), or `{shouldContinuePropagation, shouldPreventDefault}`.
- With no match, the event propagates to parents.
- `allowRepeats` and `allowComposing` default to `false` and affect shortcuts only. Repeated keys and IME composition keys do not trigger shortcuts unless you enable them.

`keyboardProps` needs a focusable element, or a parent of one, to receive events.

## Move

### useMove

Drag deltas from mouse and touch, plus arrow keys. Doc: <https://react-aria.adobe.com/useMove>

```tsx
import {useState} from 'react';
import {useMove} from 'react-aria/useMove';

const SIZE = 200;
const BALL = 30;
const clamp = (v: number) => Math.min(Math.max(v, 0), SIZE - BALL);

function Example() {
  let [pos, setPos] = useState({x: 0, y: 0});
  let {moveProps} = useMove({
    onMove(e) {
      setPos(({x, y}) => {
        // Keyboard moves start from the clamped value. Pointer moves may overshoot,
        // so the ball waits until the pointer comes back.
        if (e.pointerType === 'keyboard') {
          x = clamp(x);
          y = clamp(y);
        }
        return {x: x + e.deltaX, y: y + e.deltaY};
      });
    },
    onMoveEnd() {
      setPos(({x, y}) => ({x: clamp(x), y: clamp(y)}));
    }
  });
  return (
    <div style={{width: SIZE, height: SIZE, position: 'relative', touchAction: 'none'}}>
      <div
        {...moveProps}
        tabIndex={0}
        role="slider"
        aria-label="Position"
        aria-valuenow={clamp(pos.x)}
        style={{position: 'absolute', width: BALL, height: BALL, left: clamp(pos.x), top: clamp(pos.y)}} />
    </div>
  );
}
```

Events: `onMoveStart`, `onMove`, `onMoveEnd`. All have `pointerType` and modifier flags. `onMove` also has `deltaX`, `deltaY` since the last event (not an absolute position).

Gotchas: add `touch-action: none` on the area so touch drags do not scroll. Add `tabIndex` for arrow keys. Text selection is off during a drag.

## useContextMenu

One event for all context menu gestures. Doc: <https://react-aria.adobe.com/useContextMenu>

```tsx
import {useContextMenu} from 'react-aria/useContextMenu';

function Example() {
  let {contextMenuProps} = useContextMenu({
    onContextMenu: e => console.log(e.target, e.x, e.y)
  });
  return <div {...contextMenuProps} tabIndex={0}>Right click here</div>;
}
```

Handles right click, Control + click on macOS, long press on touch (including iOS, where `contextmenu` never fires), Shift + F10 on Windows and Linux, Control + Enter on macOS, and screen reader commands. It prevents the browser and OS menus.

`ContextMenuEvent`: `target`, `x`, `y` (relative to the target). Use `x` and `y` with `getTargetRect` on `useOverlayPosition` to place the menu at the point. Make the element focusable or the keyboard path has nothing to fire on.

## useLandmark

Registers an F6-navigable landmark. Doc: <https://react-aria.adobe.com/useLandmark>

```tsx
import {useRef} from 'react';
import {useLandmark} from 'react-aria/useLandmark';

function Navigation({children}: {children: React.ReactNode}) {
  let ref = useRef<HTMLElement | null>(null);
  let {landmarkProps} = useLandmark({role: 'navigation', 'aria-label': 'Main'}, ref);
  return <nav ref={ref} {...landmarkProps}>{children}</nav>;
}
```

- `role` is required: `'main' | 'region' | 'search' | 'navigation' | 'form' | 'banner' | 'contentinfo' | 'complementary'`.
- Keys: F6 next, Shift + F6 previous, Alt + F6 to `main`. Nested landmarks work. Focus returns to the last focused element in a landmark.
- Multiple landmarks with one role need unique `aria-label` or `aria-labelledby`.
- Toast regions use this hook.
- Optional `focus: (direction: 'forward' | 'backward') => void` overrides how focus enters.

## Labels

### useField

Associates a control with a label, description, and error message. Use it only for a custom control. `useTextField`, `useSelect`, `useComboBox`, and most others already do this. Doc: <https://react-aria.adobe.com/useField>

```tsx
import {useField} from 'react-aria/useField';

function ContactPicker(props: {label: string; description?: string; errorMessage?: string}) {
  let {labelProps, fieldProps, descriptionProps, errorMessageProps} = useField(props);
  return (
    <div>
      <label {...labelProps}>{props.label}</label>
      <select {...fieldProps}>
        <option>Email</option>
        <option>Phone</option>
      </select>
      {props.description && <div {...descriptionProps}>{props.description}</div>}
      {props.errorMessage && <div {...errorMessageProps}>{props.errorMessage}</div>}
    </div>
  );
}
```

Options: `label`, `labelElementType` (default `'label'`), `description`, `errorMessage`, `id`, `aria-label`, `aria-labelledby`, `aria-describedby`, `aria-details`, plus `isInvalid`, `validate`, `validationBehavior` (`'aria'` default or `'native'`).

Render the description or error element only when it has content. The hook links `aria-describedby` from the props you pass, so pass the same `description` and `errorMessage` you render.

### useLabel

`useField` without description and error. Doc: <https://react-aria.adobe.com/useLabel>

```tsx
import {useLabel} from 'react-aria/useLabel';

function FavoriteColor(props: {label: string}) {
  let {labelProps, fieldProps} = useLabel(props);
  return (
    <>
      <label {...labelProps}>{props.label}</label>
      <select {...fieldProps}>
        <option>Indigo</option>
      </select>
    </>
  );
}
```

For a non-native control, render a `span` and set `labelElementType: 'span'`. A `<label>` for a non-labelable element does nothing and clicks on it do not focus the control. It warns if neither `label` nor `aria-label` nor `aria-labelledby` exists.

## Overlay primitives

All these have no page of their own or only a partial one. Full overlay examples are in the component hooks reference (`usePopover`, `useModalOverlay`).

### useOverlayTrigger

Links a trigger and its overlay. State comes from `useOverlayTriggerState` in `react-stately/useOverlayTriggerState`.

```tsx
import {useRef} from 'react';
import {useButton} from 'react-aria/useButton';
import {useOverlayTrigger} from 'react-aria/useOverlayTrigger';
import {useOverlayTriggerState} from 'react-stately/useOverlayTriggerState';

function Trigger() {
  let state = useOverlayTriggerState({});
  let ref = useRef<HTMLButtonElement>(null);
  let {triggerProps, overlayProps} = useOverlayTrigger({type: 'dialog'}, state, ref);
  let {buttonProps} = useButton(triggerProps, ref);
  return (
    <>
      <button {...buttonProps} ref={ref}>Open</button>
      {state.isOpen && <div {...overlayProps}>Content</div>}
    </>
  );
}
```

`type`: `'dialog' | 'menu' | 'listbox' | 'tree' | 'grid'`. `triggerProps` are `AriaButtonProps`, so pass them to `useButton` and do not spread them on the DOM (`onPress` is not a DOM prop).

### useOverlay

Dismiss logic: outside interaction, Escape, optional blur. Only the top-most overlay closes. `usePopover` and `useModalOverlay` call it for you.

```tsx
import {useRef} from 'react';
import {useOverlay} from 'react-aria/useOverlay';

function Panel({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  let ref = useRef<HTMLDivElement>(null);
  let {overlayProps, underlayProps} = useOverlay(
    {isOpen, onClose, isDismissable: true, shouldCloseOnBlur: false},
    ref
  );
  return (
    <div {...underlayProps}>
      <div {...overlayProps} ref={ref}>Content</div>
    </div>
  );
}
```

Options: `isOpen`, `onClose`, `isDismissable` (default `false`), `shouldCloseOnBlur`, `isKeyboardDismissDisabled`, `shouldCloseOnInteractOutside(element)`.

### useOverlayPosition

Computes position and updates it on window resize. `usePopover` wraps it.

```tsx
import {useRef} from 'react';
import {useOverlayPosition} from 'react-aria/useOverlayPosition';

function Positioned({isOpen, onClose}: {isOpen: boolean; onClose: () => void}) {
  let targetRef = useRef<HTMLButtonElement>(null);
  let overlayRef = useRef<HTMLDivElement>(null);
  let {overlayProps, arrowProps, placement} = useOverlayPosition({
    targetRef,
    overlayRef,
    placement: 'bottom start',
    offset: 8,
    isOpen,
    onClose
  });
  return (
    <>
      <button ref={targetRef}>Anchor</button>
      <div {...overlayProps} ref={overlayRef} data-placement={placement}>
        <span {...arrowProps} />
        Content
      </div>
    </>
  );
}
```

Options: `targetRef`, `overlayRef` (required), `arrowRef`, `scrollRef`, `placement` (default `'bottom'`), `containerPadding` (12), `offset` (0), `crossOffset` (0), `shouldFlip` (true), `isOpen`, `arrowSize` (0), `boundaryElement` (`document.body`), `shouldUpdatePosition` (true), `onClose`, `maxHeight`, `arrowBoundaryOffset` (0), `getTargetRect(target)` (position at a point).

Returns `overlayProps`, `arrowProps`, `placement` (`PlacementAxis | null`), `triggerAnchorPoint` (`{x, y} | null`, for transform origin), `updatePosition()`.

### useDialog

Container and title roles. Moves focus into the dialog and enables containment when inside `Overlay`. Doc: <https://react-aria.adobe.com/Modal/useModalOverlay#usedialog>

```tsx
import {useRef} from 'react';
import {useDialog} from 'react-aria/useDialog';

function Dialog({title, children}: {title: string; children: React.ReactNode}) {
  let ref = useRef<HTMLDivElement>(null);
  let {dialogProps, titleProps} = useDialog({}, ref);
  return (
    <div {...dialogProps} ref={ref}>
      <h3 {...titleProps}>{title}</h3>
      {children}
    </div>
  );
}
```

Options: `role` (`'dialog'` default or `'alertdialog'`), `isEntering` (wait to move focus until the entry animation ends), labeling props. Returns `dialogProps`, `titleProps`, `contentProps` (for `aria-describedby` on an alert dialog).

With no visible title, pass `aria-label` or `aria-labelledby`.

### Overlay and DismissButton

`Overlay` portals children (default `document.body`) and adds a focus scope. `DismissButton` is a visually hidden close button for screen readers. Put one at the start and end of a popover.

```tsx
import {DismissButton, Overlay} from 'react-aria/Overlay';

<Overlay portalContainer={document.body}>
  <div>
    <DismissButton onDismiss={() => console.log('close')} />
    Content
    <DismissButton onDismiss={() => console.log('close')} />
  </div>
</Overlay>;
```

`Overlay` props: `portalContainer`, `children`, `disableFocusManagement`, `shouldContainFocus`, `isExiting`.

Focus containment must be turned on from a component **inside** `Overlay`. `useDialog` does it. If your overlay has no dialog, call `useModalOverlay` from inside `Overlay`, or set `shouldContainFocus`.

### useInteractOutside

Fires when the user presses outside a ref. No result object.

```tsx
import {useRef} from 'react';
import {useInteractOutside} from 'react-aria/useInteractOutside';

function Example({onClose}: {onClose: () => void}) {
  let ref = useRef<HTMLDivElement>(null);
  useInteractOutside({ref, onInteractOutside: () => onClose()});
  return <div ref={ref}>Panel</div>;
}
```

Options: `ref`, `onInteractOutside(e: PointerEvent)`, `onInteractOutsideStart(e: PointerEvent)`, `isDisabled`.

### usePreventScroll

Locks document scroll while mounted and stops a layout shift from the scrollbar going away.

```tsx
import {usePreventScroll} from 'react-aria/usePreventScroll';

function Locked({isOpen}: {isOpen: boolean}) {
  usePreventScroll({isDisabled: !isOpen});
  return null;
}
```

`useModalOverlay` already calls it. Use it alone only for a custom modal.

## Utilities

### mergeProps

Chains `on*` handlers in order, joins `className` (and `UNSAFE_className`), merges `id`s, and merges `ref`s. For every other key the last object wins. Doc: <https://react-aria.adobe.com/mergeProps>

```tsx
import {mergeProps} from 'react-aria/mergeProps';

let a = {className: 'foo', onKeyDown(e: React.KeyboardEvent) { console.log('a', e.key); }};
let b = {className: 'bar', onKeyDown(e: React.KeyboardEvent) { console.log('b', e.key); }};
let merged = mergeProps(a, b);
```

Gotchas: `style` is not merged (last wins). Merge it yourself. The docs page imports from `@react-aria/utils`; use `react-aria/mergeProps`.

### chain

Calls functions in order with the same arguments. Skips non-functions.

```tsx
import {chain} from 'react-aria/chain';

let onClose = chain(
  () => console.log('first'),
  undefined,
  () => console.log('second')
);
```

### mergeRefs

Merges callback and object refs into one.

```tsx
import {forwardRef, useRef} from 'react';
import {mergeRefs} from 'react-aria/mergeRefs';

const Box = forwardRef<HTMLDivElement>((props, forwarded) => {
  let local = useRef<HTMLDivElement>(null);
  return <div {...props} ref={mergeRefs(local, forwarded)} />;
});
```

It returns a new ref each render, so a callback ref re-runs every render. Wrap it in `useMemo` when that matters. To pass a forwarded ref to a hook, use `useObjectRef` instead.

### useObjectRef

Turns a callback or object ref into an object ref. Hooks need object refs. Doc: <https://react-aria.adobe.com/useObjectRef>

```tsx
import {forwardRef} from 'react';
import {useButton, type AriaButtonProps} from 'react-aria/useButton';
import {useObjectRef} from 'react-aria/useObjectRef';

const Button = forwardRef((props: AriaButtonProps, ref: React.ForwardedRef<HTMLButtonElement>) => {
  let objRef = useObjectRef(ref);
  let {buttonProps} = useButton(props, objRef);
  return <button {...buttonProps} ref={objRef}>{props.children}</button>;
});
```

### filterDOMProps

Keeps valid DOM props from a wider props object, so custom props do not reach the DOM. By default it keeps `id` and `data-*`.

```tsx
import {filterDOMProps} from 'react-aria/filterDOMProps';

function Box(props: {id?: string; 'aria-label'?: string; 'data-testid'?: string; variant?: string}) {
  let domProps = filterDOMProps(props, {labelable: true});
  return <div {...domProps} />;
}
```

Options: `labelable` (keep `aria-label` and friends), `isLink` (keep `href`, `target`, and other link attributes), `global` (global DOM attributes), `events` (DOM events), `propNames` (a `Set<string>` of extras).

### useId

Stable, SSR-safe id. Uses a given default if there is one. Doc: <https://react-aria.adobe.com/useId>

```tsx
import {useId} from 'react-aria/useId';

function Example(props: {id?: string}) {
  let elementId = useId();
  let componentId = useId(props.id);
  return <div id={componentId} aria-labelledby={elementId} />;
}
```

### useIsSSR

`true` during server render and hydration, `false` right after. Use it to delay browser-only output (media queries, feature checks) and avoid hydration mismatch. Doc: <https://react-aria.adobe.com/useIsSSR>

```tsx
import {useIsSSR} from 'react-aria/SSRProvider';

function Example() {
  let isSSR = useIsSSR();
  return <span>{isSSR ? 'Server' : 'Client'}</span>;
}
```

There is no `react-aria/useIsSSR` subpath: types export it from `react-aria/SSRProvider` and the root `react-aria`. The docs page imports from the root. `SSRProvider` is needed only for React 16 and 17.

## Export map

| Import path | Exports |
| --- | --- |
| `react-aria/usePress` | `usePress` |
| `react-aria/Pressable` | `Pressable` |
| `react-aria/useLongPress` | `useLongPress` |
| `react-aria/useHover` | `useHover` |
| `react-aria/useFocus` | `useFocus` |
| `react-aria/useFocusWithin` | `useFocusWithin` |
| `react-aria/useFocusVisible` | `useFocusVisible`, `setInteractionModality` |
| `react-aria/useFocusRing` | `useFocusRing` |
| `react-aria/FocusRing` | `FocusRing` |
| `react-aria/useFocusable` | `useFocusable` |
| `react-aria/Focusable` | `Focusable` |
| `react-aria/FocusScope` | `FocusScope`, `useFocusManager` |
| `react-aria/useKeyboard` | `useKeyboard` |
| `react-aria/useMove` | `useMove` |
| `react-aria/useContextMenu` | `useContextMenu` |
| `react-aria/useLandmark` | `useLandmark` |
| `react-aria/useField` | `useField` |
| `react-aria/useLabel` | `useLabel` |
| `react-aria/useOverlay` | `useOverlay` |
| `react-aria/useOverlayPosition` | `useOverlayPosition` |
| `react-aria/useOverlayTrigger` | `useOverlayTrigger` |
| `react-aria/useDialog` | `useDialog` |
| `react-aria/Overlay` | `Overlay`, `DismissButton` |
| `react-aria/useInteractOutside` | `useInteractOutside` |
| `react-aria/usePreventScroll` | `usePreventScroll` |
| `react-aria/mergeProps` | `mergeProps` |
| `react-aria/chain` | `chain` |
| `react-aria/mergeRefs` | `mergeRefs` |
| `react-aria/filterDOMProps` | `filterDOMProps` |
| `react-aria/useObjectRef` | `useObjectRef` |
| `react-aria/useId` | `useId` |
| `react-aria/SSRProvider` | `SSRProvider`, `useIsSSR` |
