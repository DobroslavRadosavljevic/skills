# Overlays: Modal, Dialog, Popover, Tooltip, Sheet, PreviewTrigger, Toast, PortalProvider

Contents:

- [Which overlay](#which-overlay)
- [Shared overlay rules](#shared-overlay-rules)
- [DialogTrigger and Dialog](#dialogtrigger-and-dialog)
- [Modal and ModalOverlay](#modal-and-modaloverlay)
- [Popover and OverlayArrow](#popover-and-overlayarrow)
- [Tooltip and TooltipTrigger](#tooltip-and-tooltiptrigger)
- [PreviewTrigger](#previewtrigger)
- [Sheet](#sheet)
- [Toast](#toast)
- [UNSAFE_PortalProvider](#unsafe_portalprovider)
- [Docs and types differences](#docs-and-types-differences)

## Which overlay

| Need | Pick |
| ---- | ---- |
| Blocks the page, centered task or message | `Modal` + `Dialog` |
| Blocks the page, swipe gestures, snap points, drawer, stacked flows | `Sheet` |
| Anchored to a trigger, closes on outside press | `Popover` (+ `Dialog` when it holds interactive content) |
| Short text label on hover or keyboard focus, no touch | `Tooltip` |
| Rich hover card with interactive content, long press on touch | `PreviewTrigger` + `Popover` |
| Brief, temporary, non-blocking message | Toast (`UNSTABLE_` names) |

## Shared overlay rules

### Open state

`DialogTrigger`, `SheetTrigger`, `TooltipTrigger`, `PreviewTrigger`, `ModalOverlay`, `Modal`, `Popover`, `Tooltip`, and `SheetOverlay` all take the same trio:

- `isOpen?: boolean` (controlled)
- `defaultOpen?: boolean` (uncontrolled)
- `onOpenChange?: (isOpen: boolean) => void`

Put the trio on the trigger when you have one. With a trigger plus `isOpen` or `defaultOpen` on `ModalOverlay`, `Popover`, or `SheetOverlay`, the overlay's own state replaces the trigger state. A `ModalOverlay` that uses the trigger state warns when it gets `onOpenChange` and tells you to move it to the trigger.

### Overlay with no trigger

Render the overlay alone with `isOpen` and `onOpenChange`. This is how you open an overlay from a menu item, a keyboard shortcut, or a server event.

- `Modal` or `ModalOverlay`: no ref needed.
- `SheetOverlay`: no ref needed. `Sheet` itself does not take the trio.
- `Popover` and `Tooltip`: also pass `triggerRef`, the anchor element.

A `Dialog` with no trigger has no label fallback. It needs `<Heading slot="title">` or `aria-label`.

### Custom triggers

`DialogTrigger`, `SheetTrigger`, `MenuTrigger`-style triggers take any pressable React Aria component (`Button`, `Link`). `TooltipTrigger` and `PreviewTrigger` take any focusable one.

Wrap anything else:

- `Pressable` (`react-aria/Pressable`, also exported by `react-aria-components/Modal` and `/Popover`) for press triggers.
- `Focusable` (`react-aria/Focusable`, also exported by `react-aria-components/Tooltip`) for hover and focus triggers.

```tsx
import {DialogTrigger, Pressable, Modal, Dialog, Heading} from 'react-aria-components/Modal';
import {TooltipTrigger, Tooltip, Focusable} from 'react-aria-components/Tooltip';

<DialogTrigger>
  <Pressable>
    <span role="button">Custom trigger</span>
  </Pressable>
  <Modal>
    <Dialog>
      <Heading slot="title">Dialog</Heading>
    </Dialog>
  </Modal>
</DialogTrigger>;

<TooltipTrigger>
  <Focusable>
    <span role="button">Custom trigger</span>
  </Focusable>
  <Tooltip>Tooltip</Tooltip>
</TooltipTrigger>;
```

Rules:

- The child must have an interactive ARIA role or be a semantic element. The screen reader announces the trigger through it.
- A custom component child must forward `ref` and spread all props to a DOM element.
- A `DialogTrigger` or `MenuTrigger` with a `Pressable` also works inside `TooltipTrigger`. A `Pressable` is already focusable, so do not add `Focusable`.

### Entry and exit animation

Every overlay part gets `data-entering` and `data-exiting`, plus `isEntering` and `isExiting` render props.

- `data-entering` is the start state. With CSS transitions it lasts one frame. Put the `transition` in the default state.
- `data-exiting` is the end state. The element stays mounted until its animations finish. Put a different exit `transition` in this state when you want a different exit.
- Keyframes use the same attributes but do not interrupt: a quick open then close can jump.

```css
.react-aria-Popover {
  transition: transform 200ms, opacity 200ms;

  &[data-entering],
  &[data-exiting] {
    opacity: 0;
    transform: var(--origin);
  }

  &[data-placement='top'] { --origin: translateY(8px); }
  &[data-placement='bottom'] { --origin: translateY(-8px); }
  &[data-placement='left'] { --origin: translateX(8px); }
  &[data-placement='right'] { --origin: translateX(-8px); }
}
```

JavaScript animation with Motion: wrap with `motion.create`, and hold the overlay open with `isExiting`. Keep `animate` state in your own hook.

```tsx
import {useState} from 'react';
import {motion} from 'motion/react';
import {DialogTrigger, Modal, ModalOverlay, Button} from 'react-aria-components/Modal';

const MotionModal = motion.create(Modal);
const MotionModalOverlay = motion.create(ModalOverlay);
type AnimationState = 'unmounted' | 'hidden' | 'visible';

function Example() {
  let [animation, setAnimation] = useState<AnimationState>('unmounted');
  return (
    <DialogTrigger onOpenChange={isOpen => setAnimation(isOpen ? 'visible' : 'hidden')}>
      <Button>Open dialog</Button>
      <MotionModalOverlay
        isExiting={animation === 'hidden'}
        onAnimationComplete={done =>
          setAnimation(a => (done === 'hidden' && a === 'hidden' ? 'unmounted' : a))
        }
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

`ModalOverlay` and `Modal` also take `onEnter` and `onExit`: `(element: HTMLElement) => void | Promise<void>`. Return a promise to hold the state until the animation ends. `Popover` and `Tooltip` take `isEntering` and `isExiting` but not `onEnter` and `onExit`.

### CSS variables

The component sets these at runtime as inline styles on the overlay element. They do not appear in the types.

| Variable | Set on | Value | Use |
| -------- | ------ | ----- | --- |
| `--trigger-width` | `Popover` | trigger width in px, tracked with a resize observer | `width: var(--trigger-width)` for Select and ComboBox style menus |
| `--trigger-anchor-point` | `Popover`, `Tooltip` | `"<x>px <y>px"`, the trigger origin in overlay coordinates | `transform-origin: var(--trigger-anchor-point)` |
| `--visual-viewport-width` | `ModalOverlay` | visual viewport width in px | centering when the on-screen keyboard is open |
| `--visual-viewport-height` | `ModalOverlay` | visual viewport height in px | `max-height`, sticky `top` |
| `--page-width` | `ModalOverlay` | full page width in px | backdrop `width` |
| `--page-height` | `ModalOverlay` | full page height in px | backdrop `height` |
| `--sheet-scroll-padding-x` | `SheetOverlay` | `calc(100vw - var(--visual-viewport-width))` | end padding for horizontal sheets |
| `--sheet-scroll-padding-y` | `SheetOverlay` | `calc(100dvh - var(--visual-viewport-height))` | bottom padding of sheet content, so the keyboard does not cover it |

Passing your own `--trigger-width` in a `Popover` `style` overrides the measured value.

### Portals

`ModalOverlay`, `Popover`, `Tooltip`, and `ToastRegion` portal to `document.body`. Set another container with `UNSAFE_PortalProvider`. `UNSTABLE_portalContainer` still exists on `Modal`, `Popover`, and `Tooltip` but the types mark it deprecated: do not use it.

### Overlays are client only

Every overlay export starts with `import 'client-only'`. In a server component tree, wrap them in a client component. `ModalOverlay` renders nothing during SSR, even with `defaultOpen`.

## DialogTrigger and Dialog

`DialogTrigger` links a pressable trigger to the overlay inside it. `Dialog` is the labeled focus container (`role="dialog"`). Use both inside `Modal` or `Popover`.

```tsx
import {DialogTrigger, Dialog, Heading, Button, Modal} from 'react-aria-components/Modal';
import {Text} from 'react-aria-components/Text';

<DialogTrigger>
  <Button>Sign up</Button>
  <Modal>
    <Dialog>
      {({close}) => (
        <>
          <Heading slot="title">Subscribe</Heading>
          <Text slot="description">We send one email each month.</Text>
          <Button slot="close">Cancel</Button>
          <Button onPress={() => { save(); close(); }}>Subscribe</Button>
        </>
      )}
    </Dialog>
  </Modal>
</DialogTrigger>;
```

`Dialog` props:

- `role?: 'dialog' | 'alertdialog'` (default `'dialog'`). Use `alertdialog` for confirmations that interrupt. `<Text slot="description">` wires to `aria-describedby` for it.
- `aria-label`, `aria-labelledby`
- `isEntering?: boolean`: hold focus until the entry animation ends.
- `children: ReactNode | (({close}) => ReactNode)`
- `className` is a plain string (default `react-aria-Dialog`). `Dialog` has no render props for styling and no `data-*` state attributes.
- `render?` replaces the `section` element.

Slots inside `Dialog`:

- `<Heading slot="title">`: labels the dialog, rendered as `h2` by default (`level` overrides).
- `<Text slot="description">`
- `<Button slot="close">`: closes through the trigger state.

Non-obvious behavior:

- Label priority: the `aria-label` or `aria-labelledby` prop, then `Heading slot="title"`, then the trigger as fallback. With no trigger and no label, the dev build warns.
- The `close` function and `Button slot="close"` close the state from the nearest `DialogTrigger`. In a Dialog opened by `isOpen` with no trigger, `Modal` and `SheetOverlay` give the state through context, so they still work. For a standalone `Popover`, close it from your own state.
- `DialogTrigger` uses menu trigger state, so a `Menu` inside the dialog keeps working submenus.
- `DialogTrigger` renders nothing when used inside a collection (for example inside `Tabs`). It renders only in the real tree.
- Focus: on open, focus moves to the dialog unless a child has `autoFocus`. Focus stays contained inside `Modal`, and inside a `Popover` that holds a `Dialog`. On close, focus returns to the trigger.

`OverlayTriggerStateContext` (`react-aria-components/Dialog`) gives the `OverlayTriggerState` (`isOpen`, `setOpen`, `open`, `close`, `toggle`) to custom children.

Docs: `https://react-aria.adobe.com/Modal`, `https://react-aria.adobe.com/Popover`

## Modal and ModalOverlay

Blocks all outside interaction. Use `Modal` alone for the default backdrop. Add `ModalOverlay` to style or animate the backdrop as its own element.

```tsx
import {useState} from 'react';
import {DialogTrigger, Dialog, Heading, Button, Modal, ModalOverlay} from 'react-aria-components/Modal';
import {Menu, MenuItem, MenuTrigger} from 'react-aria-components/Menu';
import {Popover} from 'react-aria-components/Popover';

// Full anatomy, with a separate backdrop.
<DialogTrigger>
  <Button>Open</Button>
  <ModalOverlay isDismissable>
    <Modal>
      <Dialog>
        <Heading slot="title">Notice</Heading>
        <Button slot="close">Close</Button>
      </Dialog>
    </Modal>
  </ModalOverlay>
</DialogTrigger>;

// No trigger: open from a menu item, mounted outside the menu.
function Example() {
  let [isOpen, setOpen] = useState(false);
  return (
    <>
      <MenuTrigger>
        <Button>Menu</Button>
        <Popover>
          <Menu>
            <MenuItem onAction={() => setOpen(true)}>Open dialog</MenuItem>
          </Menu>
        </Popover>
      </MenuTrigger>
      <Modal isDismissable isOpen={isOpen} onOpenChange={setOpen}>
        <Dialog>
          <Heading slot="title">Notice</Heading>
        </Dialog>
      </Modal>
    </>
  );
}
```

Mount the modal outside the menu: a Modal inside a closing Menu unmounts with it.

Props on `ModalOverlay` (or on `Modal` when it stands alone):

- Open state: `isOpen`, `defaultOpen`, `onOpenChange`
- Dismissal: `isDismissable?: boolean` (default `false`; outside press closes), `isKeyboardDismissDisabled?: boolean` (default `false`; Escape closes), `shouldCloseOnInteractOutside?: (element: Element) => boolean`
- Animation: `isEntering`, `isExiting`, `onEnter`, `onExit`
- `children`, `className`, `style` accept functions of the render props

When `Modal` is inside `ModalOverlay`, place those props on the overlay. On the inner `Modal` they warn and do nothing.

Styling:

- Classes: `react-aria-ModalOverlay`, `react-aria-Modal`, `react-aria-Dialog`
- Data attributes on both: `data-entering`, `data-exiting`
- Render props on both: `isEntering`, `isExiting`, `state`

Typical layout. The overlay covers the whole page and the modal stays centered in the visual viewport, which handles the on-screen keyboard:

```css
.react-aria-ModalOverlay {
  position: absolute;
  top: 0;
  left: 0;
  width: var(--page-width);
  height: var(--page-height);
  background: rgb(0 0 0 / 0.5);
  overflow: clip;
  z-index: 100;
}

.react-aria-Modal {
  position: sticky;
  top: calc(var(--visual-viewport-height) / 2);
  max-height: calc(var(--visual-viewport-height) * 0.9);
  margin-left: 50vw;
  translate: -50% -50%;
  width: max-content;
  max-width: min(500px, 90vw);
}
```

Gotchas:

- `isDismissable` also renders a hidden dismiss button for screen readers. Without it, the dialog must have its own close button.
- Keep `isKeyboardDismissDisabled` for flows that truly must not cancel, and give another keyboard exit.
- `shouldCloseOnInteractOutside` filters elements that should not close it, such as a toast or a global widget.

Docs: `https://react-aria.adobe.com/Modal`

## Popover and OverlayArrow

Anchored to a trigger and repositions itself. Closes on outside press and Escape. It is the shared overlay for `Select`, `ComboBox`, `Menu`, and `DatePicker`.

```tsx
import {DialogTrigger, Dialog, OverlayArrow, Popover} from 'react-aria-components/Popover';
import {Heading} from 'react-aria-components/Heading';
import {Button} from 'react-aria-components/Button';

<DialogTrigger>
  <Button>Settings</Button>
  <Popover placement="bottom start" offset={8}>
    <OverlayArrow>
      <svg width={12} height={12} viewBox="0 0 12 12">
        <path d="M0 0 L6 6 L12 0" />
      </svg>
    </OverlayArrow>
    <Dialog>
      <Heading slot="title">Settings</Heading>
    </Dialog>
  </Popover>
</DialogTrigger>;
```

Use `Dialog` inside the popover when it holds interactive content. Plain text content may render directly in `Popover`. A bare popover also takes `aria-label` or `aria-labelledby`.

Custom anchor: position against another element with `triggerRef`, and skip `DialogTrigger`.

```tsx
import {useRef, useState} from 'react';
import {Popover} from 'react-aria-components/Popover';
import {Button} from 'react-aria-components/Button';

function Example() {
  let [isOpen, setOpen] = useState(false);
  let anchor = useRef<HTMLSpanElement>(null);
  return (
    <div>
      <Button onPress={() => setOpen(true)}>Trigger</Button>
      <span ref={anchor}>Popover opens next to me</span>
      <Popover triggerRef={anchor} isOpen={isOpen} onOpenChange={setOpen}>
        Over here
      </Popover>
    </div>
  );
}
```

Props, by purpose:

- Open state: `isOpen`, `defaultOpen`, `onOpenChange`
- Anchor: `triggerRef?: RefObject<Element | null>`, `getTargetRect?: ((target: Element) => DOMRect | undefined) | null` (position at a point: cursor, text selection, context menu)
- Placement: `placement?: Placement` (default `'bottom'`), `offset?: number` (default `8`), `crossOffset?: number` (default `0`), `containerPadding?: number` (default `12`), `shouldFlip?: boolean` (default `true`), `shouldUpdatePosition?: boolean` (default `true`), `boundaryElement?: Element` (default `document.body`), `maxHeight?: number`, `scrollRef?: RefObject<Element | null>`, `arrowRef`, `arrowBoundaryOffset?: number` (default `0`)
- Dismissal: `isKeyboardDismissDisabled?: boolean`, `shouldCloseOnInteractOutside?: (element: Element) => boolean`, `isNonModal?: boolean`
- Animation: `isEntering`, `isExiting`, `shouldSkipAnimation?: boolean`
- Styling hook: `trigger?: string` (sets `data-trigger`)
- Focus events: `onFocusWithin`, `onBlurWithin`, `onFocusWithinChange`

`Placement` values: `'bottom' | 'bottom left' | 'bottom right' | 'bottom start' | 'bottom end' | 'top' | 'top left' | 'top right' | 'top start' | 'top end' | 'left' | 'left top' | 'left bottom' | 'start' | 'start top' | 'start bottom' | 'right' | 'right top' | 'right bottom' | 'end' | 'end top' | 'end bottom'`. Prefer `start` and `end` so RTL mirrors.

Styling:

- Classes: `react-aria-Popover`, `react-aria-OverlayArrow`
- Popover data: `data-trigger` (`"DialogTrigger"`, `"MenuTrigger"`, `"SubmenuTrigger"`, `"ComboBox"` and more), `data-placement="left | right | top | bottom"`, `data-entering`, `data-exiting`
- Arrow data: `data-placement`
- Render props: `trigger`, `placement`, `isEntering`, `isExiting`. `OverlayArrow` render prop: `placement`.
- CSS variables: `--trigger-width`, `--trigger-anchor-point`

Arrow: the SVG points down by default (placement top). Rotate it per `data-placement`, and add margin when an arrow exists:

```css
.react-aria-OverlayArrow svg { display: block; }
.react-aria-Popover[data-placement='bottom'] .react-aria-OverlayArrow svg { transform: rotate(180deg); }
.react-aria-Popover[data-placement='right'] .react-aria-OverlayArrow svg { transform: rotate(90deg); }
.react-aria-Popover[data-placement='left'] .react-aria-OverlayArrow svg { transform: rotate(-90deg); }
.react-aria-Popover[data-placement='bottom']:has(.react-aria-OverlayArrow) { margin-top: 6px; }
```

Gotchas:

- `data-placement` shows the side after a flip. Style from it, not from your `placement` prop.
- `isNonModal` lets assistive technology reach outside content. Use it only for combobox-style cases that handle this on purpose.
- Size with `--trigger-width` plus `min-width`, not with `getBoundingClientRect` in your code.

Docs: `https://react-aria.adobe.com/Popover`

## Tooltip and TooltipTrigger

A text label on hover or keyboard focus. Not shown on touch. Do not put interactive content in it. Do not use it as the only source of important information: use `PreviewTrigger` or `Popover` for that.

```tsx
import {TooltipTrigger, Tooltip, OverlayArrow} from 'react-aria-components/Tooltip';
import {Button} from 'react-aria-components/Button';

<TooltipTrigger delay={700} closeDelay={200}>
  <Button aria-label="Edit">
    <EditIcon />
  </Button>
  <Tooltip placement="top" offset={8}>
    <OverlayArrow>
      <svg width={8} height={8} viewBox="0 0 8 8">
        <path d="M0 0 L4 4 L8 0" />
      </svg>
    </OverlayArrow>
    Edit
  </Tooltip>
</TooltipTrigger>;
```

`TooltipTrigger` props (from the types):

- `isOpen`, `defaultOpen`, `onOpenChange`
- `isDisabled?: boolean`: disables the tooltip, not the trigger
- `delay?: number` (default `1500`), `closeDelay?: number` (default `500`)
- `trigger?: 'hover' | 'focus'`. Default opens on both; `'focus'` opens only on focus.
- `shouldCloseOnPress?: boolean` (default `true`)

`Tooltip` props:

- `placement?: Placement` (default `'top'`), `offset` (default `0`), `crossOffset`, `containerPadding` (default `12`), `shouldFlip`, `arrowBoundaryOffset`
- `triggerRef` for a tooltip with no `TooltipTrigger`; pair it with `isOpen`
- `isEntering`, `isExiting`

Behavior:

- Warmup: hover waits for `delay`. Focus shows at once. Once one tooltip is open, others open at once. After the cooldown, the wait returns.
- Only one tooltip opens at a time.
- A global warmup sets `state.shouldSkipAnimation` while moving quickly between tooltips.
- An icon-only trigger still needs `aria-label`. The tooltip does not label it.

Styling:

- Classes: `react-aria-Tooltip`, `react-aria-OverlayArrow`
- Data: `data-placement`, `data-entering`, `data-exiting`
- Render props: `placement`, `isEntering`, `isExiting`, `state`
- CSS variable: `--trigger-anchor-point`

Docs: `https://react-aria.adobe.com/Tooltip`

## PreviewTrigger

A non-modal `Popover` on hover, focus, or long press. It is a tooltip that may hold interactive content: link previews, profile cards.

```tsx
import {PreviewTrigger} from 'react-aria-components/PreviewTrigger';
import {Popover} from 'react-aria-components/Popover';
import {Link} from 'react-aria-components/Link';
import {Button} from 'react-aria-components/Button';

<PreviewTrigger delay={600} closeDelay={200}>
  <Link href="/u/maya">@maya</Link>
  <Popover style={{width: 280}}>
    <img alt="" src={avatar} />
    <Button>Follow</Button>
  </Popover>
</PreviewTrigger>;
```

Props: `isOpen`, `defaultOpen`, `onOpenChange`, `isDisabled`, `delay?: number` (default `600`), `closeDelay?: number` (default `200`). Use `Focusable` around a custom trigger element with an ARIA role.

Behavior:

- Same warmup and cooldown as tooltips, with `shouldSkipAnimation` when swapping quickly.
- Touch opens it with a long press.
- Tab moves focus from the trigger into the preview. Escape closes and returns focus to the trigger.
- Style through the `Popover`. The docs put content directly in it, with no `Dialog`. Focus is not contained even if a `Dialog` is inside.

Docs: `https://react-aria.adobe.com/PreviewTrigger`

## Sheet

A swipeable overlay from a viewport edge: mobile bottom sheet, navigation drawer, top banner. Built with native CSS scroll snap and view timelines on top of `Modal`, so gestures run off the main thread with native momentum and no touch handlers. Use it over `Modal` when you need swiping, snap points, or stacking.

```tsx
import {SheetTrigger, SheetOverlay, SheetBackdrop, Sheet, SheetContent} from 'react-aria-components/Sheet';
import {Heading} from 'react-aria-components/Heading';
import {Text} from 'react-aria-components/Text';
import {Button} from 'react-aria-components/Button';

<SheetTrigger>
  <Button>Open cart</Button>
  <SheetOverlay position="bottom" snapPoints={[280]}>
    <SheetBackdrop swipeAnimation="sheet-backdrop" swipeAnimationRange={{start: 0}} />
    <Sheet overscrollPadding stackAnimation="sheet-scale-back">
      <div className="sheet-handle" />
      <SheetContent>
        <Heading slot="title">Your order</Heading>
        <Text slot="description">Delivery in 25 minutes.</Text>
        <Button slot="close">Place order</Button>
      </SheetContent>
    </Sheet>
  </SheetOverlay>
</SheetTrigger>;
```

`SheetContent` is a `Dialog`: same slots, `role`, `aria-label`, and `children` function. It is the view timeline subject that drives all animation.

### Props

`SheetTrigger`: `isOpen`, `defaultOpen`, `onOpenChange`, `children`.

`SheetOverlay`:

- Open state: `isOpen`, `defaultOpen`, `onOpenChange`. With these and no trigger, swipe to close still works.
- `position?: 'bottom' | 'top' | 'left' | 'right' | 'start' | 'end' | 'center'` (default `'bottom'`). `start` and `end` mirror in RTL. `left` and `right` are physical.
- `swipeDirection?: 'bottom' | 'top' | 'vertical' | 'left' | 'right' | 'start' | 'end' | 'horizontal'`. Defaults to `position`, and to `'vertical'` for `center`.
- `snapPoints?: Array<number | string>`
- `preventDismissal?: boolean` (default `false`)
- `shouldCloseOnInteractOutside?: (element: Element) => boolean`

Not accepted, by type: `isDismissable`, `isKeyboardDismissDisabled`, `onEnter`, `onExit`, `isEntering`, `isExiting`. Use `preventDismissal`.

`Sheet`:

- `swipeAnimation?: string` (a `@keyframes` name)
- `swipeAnimationRange?: {start?: number; end?: number}` (snap point indices)
- `stackAnimation?: string` (a `@keyframes` name)
- `overscrollPadding?: boolean`

Not accepted on `Sheet`, by type: the open trio. It belongs on the trigger or `SheetOverlay`.

`SheetBackdrop`: `swipeAnimation`, `swipeAnimationRange`, `className`, `style`, `children`.

### Positions and gestures

- Navigation drawer: `position="start"`. Mobile sheet: `bottom`. Banner: `top`. `center` swipes vertically.
- Swipe away closes, Escape closes, and outside press closes. All three are off with `preventDismissal`.
- `swipeDirection="vertical"` or `"horizontal"` dismisses in both directions on that axis.

### Snap points (detents)

- `snapPoints` lists the visible amount at each stop. Numbers are pixels. Strings are CSS lengths. Percentages are relative to the sheet size.
- The sheet opens at the first snap point. It drags up to full height, or swipes down to dismiss.
- Full height is always the last stop, so the docs show one value: `snapPoints={[280]}`. `swipeAnimationRange` indexes this array.
- `data-expanded` is present when the sheet rests fully open.

Content scroll: at a partial detent, keep inner content from scrolling so a swipe on it moves the sheet. Enable scroll only when expanded. At the top of the scrolled content, chaining then lets the user swipe down to dismiss.

```css
.react-aria-SheetContent {
  box-sizing: border-box;
  height: 100%;
  overflow: hidden;
  overscroll-behavior: auto;
  scrollbar-gutter: stable;
  padding-bottom: calc(32px + var(--sheet-scroll-padding-y));
}

.react-aria-SheetOverlay[data-expanded] .react-aria-SheetContent {
  overflow: auto;
}
```

### Non-dismissible sheets

`preventDismissal` blocks swipe away, Escape, and outside press. The user still swipes between snap points, and scroll bounce stays. Add a `Button slot="close"` and hide your handle: the sheet needs its own way out. To close, use that button or your state.

### Gesture-synced animation

`swipeAnimation` runs a keyframe animation in sync with the swipe, including entry and exit. Use it on `Sheet` and `SheetBackdrop`. `swipeAnimationRange` limits it to a span of snap point indices, so a backdrop can stay hidden until the sheet passes the last snap point:

```tsx
<SheetBackdrop
  swipeAnimation="sheet-backdrop"
  swipeAnimationRange={snapPoints ? {start: snapPoints.length - 1} : undefined}
/>;
```

```css
@keyframes sheet-backdrop {
  from { opacity: 0; }
  to { opacity: 1; }
}

.react-aria-SheetBackdrop[data-stack-index='0'] {
  background: rgb(0 0 0 / 0.4);
}
```

Without view timeline support (the source comment names Firefox), `swipeAnimation` applies only for entry and exit, not during the swipe.

### Stacking

Nest a `SheetTrigger` inside `SheetContent` to drill deeper. `stackAnimation` runs on a sheet once for each sheet in front of it, tied to those sheets' timelines with `animation-composition: accumulate`, so depth adds up.

```css
.react-aria-Sheet {
  transform: perspective(1000px);
  will-change: transform;
  z-index: 1;

  &[data-position='bottom'],
  &[data-position='center'] {
    transform-origin: center -150px;
  }

  &[data-has-descendants] .sheet-handle {
    opacity: 0;
  }
}

@keyframes sheet-scale-back {
  to { transform: translateZ(-120px); }
}
```

Only the bottom sheet should dim the page: scope the backdrop color to `[data-stack-index='0']`.

### Handle

No handle part exists. Render your own `div` inside `Sheet`, outside `SheetContent`, positioned from `data-swipe-direction`. Hide it with `preventDismissal` or `data-has-descendants`.

### Overscroll padding and the keyboard

- `overscrollPadding` adds padding so the sheet looks like it continues past the edge during rubber band.
- The on-screen keyboard covers the sheet on iOS. Add `var(--sheet-scroll-padding-y)` to the bottom padding of `SheetContent` so the user can reach the last controls. A tapped input scrolls into view without scrolling the page.

### Styling

- Classes: `react-aria-SheetOverlay`, `react-aria-SheetBackdrop`, `react-aria-Sheet`, `react-aria-SheetContent`
- Data on overlay, backdrop, and sheet: `data-position="bottom | top | left | right | center"` (`start` and `end` resolved), `data-swipe-direction="bottom | top | vertical | left | right | horizontal"`, `data-stack-index="0 | 1 | ..."`, `data-has-descendants`, `data-expanded`, `data-entering`, `data-exiting`
- Render props: the same values as `position`, `swipeDirection`, `stackIndex`, `hasDescendants`, `isExpanded`, `isEntering`, `isExiting`, `state`
- `SheetContent` takes a plain `className` string. To style it from state, use the attributes on `SheetOverlay` (`[data-expanded] .react-aria-SheetContent`, or Tailwind `group-data-[expanded]/sheet:overflow-auto`).

Size on `.react-aria-Sheet`:

```css
.react-aria-Sheet {
  height: auto;
  max-height: calc(100% - 32px);
  width: calc(100% - 12px);
  max-width: 800px;
  margin: 8px;
  overflow: clip;

  &[data-position='left'],
  &[data-position='right'] {
    width: 340px;
    height: calc(100% - 12px);
    max-height: unset;
  }
}
```

Gotchas:

- Do not add touch or scroll handlers to move the sheet. The scroll container is the gesture.
- `SheetOverlay` renders the scroll container and sets its own inline position, size, and `overflow`. Size and style `Sheet` and `SheetContent` instead.
- Do not wrap `Sheet` or `SheetBackdrop` in a separate `ModalOverlay`. `SheetOverlay` is one.
- Focus moves into the sheet and outside content turns inert only after entry, because those steps scroll and interrupt the iOS entry animation.

Docs: `https://react-aria.adobe.com/Sheet`, how it works: `https://react-aria.adobe.com/blog/sheet`

## Toast

A brief non-blocking message in a landmark region. The queue lives outside React, so any code can add a toast.

All names carry `UNSTABLE_` in this version. `ToastQueue` comes from the same subpath. Alias them at import.

```tsx
import {flushSync} from 'react-dom';
import type {CSSProperties} from 'react';
import {
  UNSTABLE_ToastRegion as ToastRegion,
  UNSTABLE_Toast as Toast,
  UNSTABLE_ToastQueue as ToastQueue,
  UNSTABLE_ToastContent as ToastContent,
  Text,
  Button
} from 'react-aria-components/Toast';

interface MyToast {
  title: string;
  description?: string;
}

export const queue = new ToastQueue<MyToast>({
  maxVisibleToasts: 5,
  wrapUpdate(fn) {
    if ('startViewTransition' in document) {
      document.startViewTransition(() => flushSync(fn));
    } else {
      fn();
    }
  }
});

// Render once, at the root of the app.
export function MyToastRegion() {
  return (
    <ToastRegion queue={queue}>
      {({toast}) => (
        <Toast toast={toast} style={{viewTransitionName: toast.key} as CSSProperties}>
          <ToastContent>
            <Text slot="title">{toast.content.title}</Text>
            {toast.content.description && <Text slot="description">{toast.content.description}</Text>}
          </ToastContent>
          <Button slot="close" aria-label="Close">x</Button>
        </Toast>
      )}
    </ToastRegion>
  );
}

// Anywhere.
let key = queue.add({title: 'File saved'}, {timeout: 5000, onClose: () => console.log('closed')});
queue.close(key);
```

`UNSTABLE_ToastQueue<T>`:

- `new ToastQueue<T>({maxVisibleToasts?: number, wrapUpdate?: (fn: () => void, action: 'add' | 'remove' | 'clear') => void})`
- `add(content: T, options?: {timeout?: number; onClose?: () => void}): string` returns the key
- `close(key: string)`, `clear()`, `pauseAll()`, `resumeAll()`, `subscribe(fn)`, `visibleToasts`

Parts:

- `UNSTABLE_ToastRegion`: required `queue`, plus `children` as a render function of `{toast}` or nodes with a `ToastList`. Default class `react-aria-ToastRegion`. Portals when visible, and renders nothing when empty. Data: `data-hovered`, `data-focused`, `data-focus-visible`. Render props: `visibleToasts`, `isHovered`, `isFocused`, `isFocusVisible`.
- `UNSTABLE_ToastList`: an `ol` for when the region holds other content (a clear all button, a header). Children are a render function of `{toast}`. Default class `react-aria-ToastList`.
- `UNSTABLE_Toast`: required `toast`. Default class `react-aria-Toast`. Data: `data-focused`, `data-focus-visible`. Render props: `toast`, `isFocused`, `isFocusVisible`.
- `UNSTABLE_ToastContent`: wraps the slots. Class `react-aria-ToastContent`. Holds `Text slot="title"` (required) and `Text slot="description"`.
- `UNSTABLE_ToastStateContext`: state for custom children such as a clear all button.

Behavior:

- `timeout` in ms. The minimum for accessibility is 5000. Omit it for a toast that must wait for the user.
- Timers pause on hover or focus in the region.
- Auto-dismiss only non-critical content that the user can find elsewhere.
- F6 and Shift+F6 reach the region as a landmark from anywhere.
- Closing a toast moves focus to the next one. Closing the last restores focus to where it was.
- Put `Button slot="close"` beside `ToastContent`, not inside. Then the screen reader reads content first. Always include it.
- `Button slot="close"` closes the toast from context. Its `aria-label` is yours to set.

Animation uses view transitions. Toasts have no `data-entering` or `data-exiting`:

```css
.react-aria-Toast {
  view-transition-class: toast;
}

::view-transition-new(.toast):only-child {
  animation: slide-in 400ms;
}

::view-transition-old(.toast):only-child {
  animation: slide-out 400ms;
  animation-fill-mode: forwards;
}

@keyframes slide-in {
  from { translate: 100% 0; opacity: 0; }
}

@keyframes slide-out {
  to { translate: 100% 0; opacity: 0; visibility: hidden; }
}
```

Region layout: `position: fixed`, a corner offset, `z-index`, and `display: flex; flex-direction: column-reverse` so new toasts stack upward.

Hooks instead of components: `useToastState`, `useToastQueue` (`react-stately/useToastState`), and `useToast`, `useToastRegion` (`react-aria/useToast`).

Docs: `https://react-aria.adobe.com/Toast`

## UNSAFE_PortalProvider

Sets the portal container for all overlays below it: `Modal`, `Popover`, `Tooltip`, Toast. Use it to group overlays in one root container or to control order inside `body`. It is `UNSAFE` because some containers break styling or accessibility: stay at the app root, outside overflow and stacking contexts.

```tsx
import {useRef} from 'react';
import {createPortal} from 'react-dom';
import {UNSAFE_PortalProvider, useUNSAFE_PortalContext} from 'react-aria/PortalProvider';

function App() {
  let container = useRef<HTMLDivElement>(null);
  return (
    <>
      <UNSAFE_PortalProvider getContainer={() => container.current}>
        <MyToastRegion />
        <Page />
      </UNSAFE_PortalProvider>
      <div ref={container} />
    </>
  );
}

// A custom overlay that follows the same container.
function MyOverlay({children}) {
  let {getContainer} = useUNSAFE_PortalContext();
  return createPortal(children, getContainer?.() ?? document.body);
}
```

Props: `getContainer?: (() => HTMLElement | null) | null` (pass `null` to clear the value from a parent provider), `children: ReactNode`.

Gotcha: a `getContainer` that returns `null` means Toast renders nothing. Ensure the container is mounted first.

Docs: `https://react-aria.adobe.com/PortalProvider`

## Docs and types differences

- `PortalProvider` docs import from `@react-aria/overlays`. In this version, use `react-aria/PortalProvider`.
- `FocusScope`-style package names in docs (`@react-aria/*`) are old. Every import in this file is the current subpath.
- The docs table for `TooltipTrigger` is empty. Its props here come from `react-stately/useTooltipTriggerState` types.
- Toast: only `UNSTABLE_` names are exported. `ToastQueue` is `UNSTABLE_ToastQueue` from `react-aria-components/Toast`, and the unprefixed class is in `react-stately/useToastState`.
- Starter `Sheet` wraps `SheetOverlay`, `SheetBackdrop`, `Sheet`, and `SheetContent` into one component. The npm `Sheet` is only the panel: write all parts yourself.
