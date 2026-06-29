# Motion Component Recipes

Use for concrete animation recipes for common UI components and product states.

## Contents

- Component recipes
  - Button press
  - Toggle / switch
  - Checkbox / radio
  - Dropdown / menu / popover
  - Tooltip
  - Accordion / disclosure
  - Modal / dialog
  - Drawer / side panel / bottom sheet
  - Toast / snackbar
  - Page / route transition
  - List add/remove/reorder
  - Loading and progress
  - Success and celebration
  - Error and validation
  - Carousels and auto-advancing content
  - Data visualization motion

## Component recipes

### Button press

Purpose: immediate feedback and direct manipulation.

Spec:

```text
duration: 50-100 ms
properties: transform scale, background/color, shadow, opacity
easing: ease-out for press-in; ease-out or standard for release
reduced motion: color/shadow change only, no scale if scale feels uncomfortable
```

Pattern:

```css
.button {
  transition:
    transform var(--motion-duration-fast) var(--motion-ease-enter),
    background-color var(--motion-duration-fast) linear;
}

.button:active {
  transform: scale(0.98);
}

@media (prefers-reduced-motion: reduce) {
  .button { transition: background-color 80ms linear; }
  .button:active { transform: none; }
}
```

Do not make the button bounce after activation. Do not delay actual action until the animation finishes.

### Toggle / switch

Purpose: binary state change.

Spec:

```text
duration: 120-180 ms
properties: thumb transform, track color
motion direction: left/right or start/end according to locale/layout
easing: ease-out/standard
reduced motion: instant thumb or short color change
```

Update state semantics immediately. The visual transition should confirm state, not be the state itself.

### Checkbox / radio

Use a short checkmark draw, scale, or opacity transition. Keep it under 150 ms. Ensure the selected state is visible without animation.

### Dropdown / menu / popover

Purpose: reveal hidden choices from a trigger.

Spec:

```text
duration: 100-180 ms
origin: trigger edge
properties: opacity + translateY/scaleY transform
reduced motion: opacity only or instant
```

Do not move the menu from an unrelated direction. Ensure focus moves correctly and keyboard navigation does not wait for animation.

### Tooltip

Tooltips should be subtle and quick. Use opacity and a tiny transform, or no motion. Never hide essential information in a tooltip that is inaccessible by keyboard or touch.

### Accordion / disclosure

Purpose: reveal inline content while preserving context.

Options:

- Prefer opacity + transform for inner content when layout change can be instant.
- If height must animate, measure height once and animate with overflow hidden; test for layout cost.
- Consider CSS grid `grid-template-rows` patterns only after checking browser and content behavior.

Spec:

```text
duration: 160-250 ms depending on content height
properties: height/grid rows if necessary, plus opacity/transform for content
easing: standard or ease-out
reduced motion: instant height + short opacity/highlight
```

Do not hide focus inside a closing accordion. Manage focus when content is removed.

### Modal / dialog

Purpose: interrupt with a focused task while preserving background context.

Spec:

```text
overlay fade: 100-180 ms
panel entrance: 180-260 ms
exit: 120-200 ms
properties: opacity + translate/scale transform
origin: center for modal, edge for sheet/drawer
reduced motion: overlay/panel opacity only or instant
```

Requirements:

- Focus trap.
- Return focus to trigger on close.
- Escape/back close behavior where appropriate.
- No excessive bounce.
- User can close before entrance animation completes.

### Drawer / side panel / bottom sheet

Purpose: show adjacent context or secondary task.

Spec:

```text
duration: 200-320 ms
origin: actual physical edge
properties: transform translateX/Y + overlay opacity
easing: ease-out enter, ease-in exit
reduced motion: fade or instant panel, no large slide if user prefers less motion
```

For gestures, panel should follow the pointer/finger with no artificial easing while dragging. Apply spring/easing only after release.

### Toast / snackbar

Purpose: nonmodal status feedback.

Spec:

```text
duration: 160-240 ms
origin: nearest edge or stack position
properties: opacity + small translate
reduced motion: opacity only
```

Rules:

- Do not animate toasts over critical controls.
- Pause auto-dismiss on hover/focus.
- Provide action controls when relevant, such as Undo.
- Use ARIA live regions where appropriate.

### Page / route transition

Purpose: preserve orientation during navigation.

Spec:

```text
duration: 250-400 ms
properties: shared element transform/opacity; page opacity; limited container motion
forward/back direction: consistent with navigation model
reduced motion: instant or short fade
```

Use shared-element transitions for cards-to-detail, image galleries, product pages, and drill-in flows. Avoid heavy page-wide motion in productivity apps where navigation is frequent.

### List add/remove/reorder

Purpose: object constancy and change tracking.

Patterns:

- Add: new item fades/slides from insertion point, existing items shift visibly if needed.
- Remove: removed item fades/collapses, then siblings move to fill the gap.
- Reorder: dragged item follows pointer; siblings animate out of the way; final settle is short.
- Filter/sort: if many items move, use crossfade/highlight or FLIP, not chaotic simultaneous movement.

Reduced motion: instant layout with a highlight/fade on changed rows.

### Loading and progress

Choose by expected wait:

- Under 1 second: usually show no spinner. A pressed/loading button state may be enough.
- 1-2 seconds: show a lightweight loading state or skeleton if the wait is perceptible.
- 2-10 seconds: use indeterminate progress with explanatory text when duration is unknown.
- 10+ seconds: use determinate progress, step count, percentage, ETA if credible, cancellation, and status text.

Prefer skeletons for content layout loading because they communicate structure. Prefer determinate progress when real progress is measurable. Avoid indefinite spinners for long or unreliable network operations.

Do not fake progress in a way that destroys trust, such as racing to 95% and stalling without explanation.

### Success and celebration

Use celebration sparingly and only after meaningful user achievement. Keep it optional, non-blocking, and short. A success check, subtle burst, or short illustration is usually enough.

Do not celebrate routine destructive actions, error recovery, or frequent workflow steps.

### Error and validation

Use motion to draw attention gently, not to punish.

Good patterns:

- Short highlight fade around invalid field.
- Error text fades in below the field.
- Small horizontal nudge only for low-frequency form submit failures, not on every keystroke.

Avoid strong shakes, flashing red, or movement that makes text hard to read. Errors must be visible and understandable without animation.

### Carousels and auto-advancing content

Avoid auto-advancing carousels by default. If required:

- Provide pause/stop controls.
- Pause on hover, focus, and interaction.
- Do not auto-advance when reduced motion is requested.
- Keep keyboard focus stable.
- Do not move content while the user is reading it.

### Data visualization motion

Use animation to preserve object constancy and explain change.

Good uses:

- Bars grow or shrink from a meaningful baseline.
- Points move from old to new positions during filter changes.
- Exiting data fades after users see what changed.
- New series highlights briefly.
- Complex transitions are staged: axes, marks, labels, annotations.

Avoid:

- Decorative chart entrances that delay reading.
- Animating axes or scales in a way that misleads magnitude comparisons.
- Staggering data purely for drama.
- Making users wait through every chart transition repeatedly.
- Using motion as the only indicator of a data change.

