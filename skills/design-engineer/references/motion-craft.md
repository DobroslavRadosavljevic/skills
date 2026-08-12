# Motion Craft

Motion is a clarifying layer, not decoration. If it does not help comprehension,
feedback, continuity, or deliberate brand expression, remove it.

## Core questions (must pass)

Before adding or keeping animation:

1. What changed in the interface?
2. Why did it change?
3. Where did the thing come from, and where is it going?
4. What should the user notice next?
5. Can the user keep working without waiting for decoration?
6. What is the reduced-motion equivalent?
7. Will this animate on the compositor (`transform` / `opacity`), or trigger layout/paint?

Fail → simplify or delete.

## When motion earns its place

- **Feedback** — press, toggle, success, failure
- **Orientation** — enter/exit, parent/child, navigation direction
- **Continuity** — shared element, reorder, filter, expand/collapse identity
- **Attention** — one important change without extra copy
- **Affordance** — draggable, dismissible, expandable hints
- **Progress** — system working; how far
- **Brand** — rare expressive moments (empty, success, marketing), never blocking tasks

## When to refuse motion

- Default hover “because it feels dead”
- Large layout thrash on every keystroke
- Autoplaying loops near task UI
- Staggered cascades that delay content readiness
- Parallax / blur extravaganzas that hurt clarity or performance
- Motion that cannot be interrupted by user input

## Implementation preference

1. CSS transitions / animations
2. Web Animations API
3. JS libraries (only when enter/exit, layout, gesture, or scroll linkage needs them)

Never `transition: all`. List properties explicitly (usually `opacity`, `transform`).

## Timing and easing (practical defaults)

Use product motion tokens when they exist. Otherwise start here:

| Kind | Duration | Easing intent |
| --- | --- | --- |
| Control feedback (hover/press) | 100–160ms | snappy, low travel |
| Small reveal (tooltip, menu) | 150–220ms | enter decelerate |
| Overlay (dialog, drawer) | 200–300ms | enter decelerate / exit accelerate |
| Page / large layout | 250–400ms | proportional to distance/size |
| Expressive / marketing | variable | still interruptible; offer reduced |

Larger travel / larger elements → slightly longer duration. Feedback stays short.

Easing fits the subject:

- **Enter** — accelerate quickly, ease out to rest
- **Exit** — ease in, get out of the way
- **Move** — smooth settle; avoid linear except progress bars

## Reduced motion

- Honor `prefers-reduced-motion: reduce`
- Provide an equivalent instantaneous or crossfade-only state change
- Do not convey meaning only through motion (also use text/icon/state)

## Performance rules

- Prefer compositor props: `transform`, `opacity`
- Avoid animating `width`, `height`, `top`, `left`, `margin` when possible
- Use layout animation tools carefully when size/position must morph
- Spoilers: infinite blur, heavy box-shadow animation, large filter animations
- Keep motion off the critical path of text entry and dragging precision

## Interruptibility

- User input cancels or completes animation sensibly
- Avoid `mode=wait` style bottlenecks unless sequence is required for comprehension
- Loading indicators: show-delay ~150–300ms and minimum visible ~300–500ms to
  prevent flicker on fast responses

## Motion QA

- [ ] Passes the seven core questions
- [ ] Reduced-motion path verified
- [ ] No layout thrash on frequent events
- [ ] Origin/transform-origin feel physical
- [ ] Does not block task completion
- [ ] Matches product motion language (not a one-off bounce)
