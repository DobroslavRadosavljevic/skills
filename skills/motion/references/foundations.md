# Motion Foundations and Tokens

Use for motion purpose, decision workflow, human-centered principles, duration tokens, easing tokens, delay, and stagger.

## Contents

- Core rule
- When to use motion
- Motion decision workflow
  - 1. Classify the interaction
  - 2. Define the motion contract
  - 3. Prefer system or product tokens
  - 4. Implement the smallest reliable animation
  - 5. Audit before finalizing
- Human-centered principles
  - Motion should preserve cause and effect
  - Motion should maintain spatial continuity
  - Motion should guide attention, not compete for it
  - Motion should feel responsive
  - Motion should be interruptible
  - Motion should be consistent but not robotic
  - Motion should degrade safely
- Motion system foundation
  - Suggested duration tokens
  - Dynamic duration rule
  - Suggested easing tokens
  - Delay and stagger


This skill helps an agent design, critique, specify, and implement motion for digital products. Treat motion as a product behavior, not decoration. Every animation must improve comprehension, feedback, perceived responsiveness, orientation, hierarchy, or brand expression without harming speed, comfort, accessibility, or task completion.

## Core rule

Before proposing or coding any animation, answer these questions:

1. What changed in the interface?
2. Why did it change?
3. Where did the changed thing come from, and where is it going?
4. What should the user notice next?
5. Can the user keep working without waiting for decoration?
6. What is the reduced-motion equivalent?
7. Will this animate on the compositor, or does it trigger layout/paint?

If an animation cannot pass this test, remove it or replace it with a simpler state change.

## When to use motion

Use motion only when it performs one or more of these functions:

- Feedback: acknowledge a tap, click, drag, validation, save, submit, add-to-cart, delete, or failed action.
- Orientation: show navigation direction, parent/child hierarchy, object origin, object destination, or screen relationship.
- Continuity: preserve object identity across state changes, especially with shared elements, card expansion, reordering, filtering, or list updates.
- Attention guidance: direct focus to one important change without adding extra copy or visual clutter.
- Affordance: hint that an object is draggable, expandable, dismissible, swipeable, reorderable, or interactive.
- Status and progress: show that the system is working, how far it has progressed, or whether an action is pending.
- Error prevention and recovery: make validation, undo, destructive action confirmation, and recovery states clear.
- Brand/personality: add character in low-frequency, non-blocking moments such as onboarding, empty states, success moments, or product storytelling.
- Data comprehension: help users track changes between related data states without breaking object constancy.

Do not add motion merely because the interface feels static. Use visual design, layout, typography, copy, and information architecture first; use motion when time-based behavior communicates something those static tools cannot.

## Motion decision workflow

For every motion request, follow this sequence.

### 1. Classify the interaction

Choose the primary class:

- Immediate feedback: hover, press, active, focus, toggle, checkbox, radio, switch.
- Component reveal: dropdown, tooltip, popover, accordion, tabs, inline expansion.
- Overlay transition: modal, drawer, bottom sheet, command menu, dialog.
- Navigation transition: route change, drill-in, back, wizard step, shared-element transition.
- List/data transition: add, remove, reorder, filter, sort, chart update.
- Loading/waiting: skeleton, spinner, progress bar, optimistic UI, queued state.
- Expressive moment: success, empty state, celebration, onboarding, hero, illustration.
- Continuous/ambient motion: carousel, background video, parallax, loop, ticker, live feed.

### 2. Define the motion contract

Write or infer these fields:

```text
trigger: user action, system event, route change, data update, scroll position, time
purpose: feedback | orientation | continuity | attention | affordance | progress | brand
property: transform | opacity | color | clip | height | path | canvas | video | etc.
start_state: visual state before change
end_state: visual state after change
duration: token or ms
easing: token or curve
stagger: none or token
interruptibility: can cancel/reverse/restart? how?
reduced_motion: remove | shorten | fade | color shift | instant | user-controlled
performance_risk: compositor-only | layout | paint | GPU/memory | main-thread JS
a11y_risk: vestibular | flashing | distraction | focus loss | screen-reader ambiguity
```

### 3. Prefer system or product tokens

Use existing product, platform, or design-system motion tokens when present. Do not invent a separate motion language if the product already has one.

If no tokens exist, propose a small, named motion system before creating one-off values.

### 4. Implement the smallest reliable animation

Prefer the simplest implementation that satisfies the motion contract:

- CSS transitions for simple state-to-state changes.
- CSS keyframes for declarative entrance/exit, loops, skeleton shimmer, and reusable effects.
- Web Animations API when JavaScript must play, cancel, reverse, sequence, or respond to runtime data.
- View Transitions API for DOM-state or page/view transitions when browser support and progressive enhancement are acceptable.
- Platform-native animation APIs in native apps.
- Framer Motion, GSAP, React Spring, Reanimated, Lottie, Rive, Canvas, SVG, or WebGL only when already used or clearly justified.

### 5. Audit before finalizing

Check purpose, timing, easing, reduced motion, focus behavior, keyboard behavior, screen-reader semantics, performance, interruptibility, and whether the animation remains pleasant after the 20th repetition.

## Human-centered principles

### Motion should preserve cause and effect

The animation should make the user feel, â€śI did that.â€ť For example, a card expands from its card position, a menu opens from its trigger, an item added to cart travels toward or resolves near the cart area, and a deleted row collapses from its own location.

Avoid effects that disconnect cause from result: unrelated slides, arbitrary zooms, page-wide wipes, decorative bounces after every click, or transitions that imply the wrong hierarchy.

### Motion should maintain spatial continuity

Navigation and structural movement need a stable spatial model:

- Forward/drill-in movement should feel different from back/up movement.
- Parent surfaces should not appear to come from a child area.
- A modal should appear above the current context, not as a new page unless it behaves as one.
- Drawers and sheets should enter from their physical edge.
- A reordered list item should visibly move from old position to new position.

When the UI has no meaningful spatial model, prefer a fade, crossfade, highlight, or instant change instead of inventing fake geography.

### Motion should guide attention, not compete for it

Motion is visually dominant. If many things move at once, users may look at the wrong thing or miss the actual change.

Good attention choreography:

- One primary moving focal point at a time.
- Secondary elements either remain still or move with shorter distance, lower contrast, or later timing.
- Stagger only related siblings, not unrelated regions.
- Do not animate persistent chrome every time content changes.
- Do not animate peripheral loops while the user is reading or filling a form.

### Motion should feel responsive

User-initiated feedback must begin immediately. Never delay press, hover, focus, drag, or keyboard feedback for decorative staging.

Useful thresholds:

- Under 100 ms: feels immediate/direct.
- 100-200 ms: good for press/hover/toggle polish and small reveals.
- 200-400 ms: good for component entrances, exits, overlays, and screen changes.
- Above 400 ms: reserve for large, infrequent, expressive transitions; avoid in productivity flows.

The user should be able to act as soon as the interface is logically ready, even if a nonessential animation is still settling.

### Motion should be interruptible

Users change their mind, double-click, navigate back, resize windows, switch tabs, and use assistive tech. Animations should reverse, cancel, or settle cleanly.

Prefer state-driven animation over fire-and-forget animation. Avoid queues that force users to watch old animations before seeing the current state.

### Motion should be consistent but not robotic

Consistency comes from shared tokens, patterns, origins, and easing. Variety comes from scale, distance, purpose, and context.

Do not reuse the same transition everywhere if it implies the wrong relationship. A dropdown, a modal, a list reorder, and a route transition can share a duration family while using different origins and choreography.

### Motion should degrade safely

The interface must still be understandable when animations are reduced, disabled, skipped, throttled, interrupted, or unsupported.

## Motion system foundation

Use a compact system of duration, easing, delay, distance, and pattern tokens.

### Suggested duration tokens

Adapt these to the productâ€™s pace. Use shorter values for dense productivity software and slightly longer values for expressive consumer experiences.

```css
:root {
  --motion-duration-instant: 50ms;
  --motion-duration-fast: 100ms;
  --motion-duration-short: 150ms;
  --motion-duration-base: 200ms;
  --motion-duration-moderate: 250ms;
  --motion-duration-slow: 320ms;
  --motion-duration-slower: 400ms;
  --motion-duration-expressive: 520ms;
}
```

Recommended use:

- 50-100 ms: hover, press, focus ring supplement, small color/opacity changes.
- 100-150 ms: toggle, checkbox, radio, icon morph, small tooltip/popover entrance.
- 150-250 ms: dropdown, accordion, toast, small panel, inline row addition/removal.
- 200-320 ms: modal, drawer, bottom sheet, card expansion, medium shared element.
- 250-400 ms: route transition, large panel transition, complex list/data update.
- 400-700 ms: rare expressive or storytelling moments only.

### Dynamic duration rule

Duration should scale with perceived travel distance and surface size, but not linearly forever. Larger movement needs more time to be legible; too much time makes the product feel sluggish.

Use this mental model:

```text
duration = clamp(min, base + distance_factor + complexity_factor, max)
```

Example defaults:

```text
small component: 120-180 ms
medium surface: 180-280 ms
large screen transition: 260-400 ms
expressive moment: 400-700 ms
```

### Suggested easing tokens

Use named curves instead of raw values in component code.

```css
:root {
  --motion-ease-linear: linear;
  --motion-ease-enter: cubic-bezier(0, 0, 0.2, 1);        /* fast start, soft landing */
  --motion-ease-exit: cubic-bezier(0.4, 0, 1, 1);         /* accelerates away */
  --motion-ease-standard: cubic-bezier(0.4, 0, 0.2, 1);   /* balanced movement */
  --motion-ease-emphasized: cubic-bezier(0.2, 0, 0, 1);   /* stronger landing */
}
```

Use easing by intent:

- Entrance/reveal: ease-out or enter curve. Starts quickly, settles softly, feels responsive.
- Exit/dismissal: ease-in or exit curve. Leaves quickly and gets out of the way.
- Movement between two visible states: standard/ease-in-out. Both origin and destination matter.
- Opacity-only fades: standard, ease-out, or linear depending on context.
- Repeating loaders: linear for rotation/progress loops; avoid acceleration changes that imply real progress when none exists.
- Springs: use only when physicality matters; keep damping high enough that content does not bounce distractingly.

Avoid these easing mistakes:

- Linear movement for objects that should feel physical.
- Slow ease-in on user-triggered entrances, because it feels unresponsive.
- Large overshoot for dense UI or critical workflows.
- Different curves for similar components with the same intent.

### Delay and stagger

Delays are dangerous because they can make the UI feel slow. Use them only to clarify sequence.

Suggested stagger values:

```css
:root {
  --motion-stagger-tight: 20ms;
  --motion-stagger: 40ms;
  --motion-stagger-loose: 60ms;
}
```

Rules:

- Never delay direct feedback.
- Stagger related siblings only.
- Cap total stagger time; a list should not take 800 ms to finish because it has many items.
- Prefer grouping over long cascades.
- For accessibility, reduced motion should remove most staggers.

