# Web Motion Implementation

Use for CSS transitions, CSS keyframes, reduced-motion CSS, WAAPI, FLIP, View Transitions, and scroll-driven animation.

## Contents

- Implementation mechanics for web
  - CSS transitions
  - CSS keyframes
  - Reduced motion in CSS
  - JavaScript and Web Animations API
  - FLIP for layout changes
  - View Transitions API
  - Scroll-driven animation

## Implementation mechanics for web

### CSS transitions

Use CSS transitions for hover, active, focus supplements, simple show/hide, component state changes, and theme/color changes.

Good pattern:

```css
.card {
  transition:
    transform var(--motion-duration-short) var(--motion-ease-enter),
    opacity var(--motion-duration-short) var(--motion-ease-enter),
    box-shadow var(--motion-duration-short) var(--motion-ease-enter);
}

.card[data-interactive="true"]:hover {
  transform: translateY(-2px);
}

.card:active {
  transform: translateY(0) scale(0.99);
}
```

Avoid:

```css
/* Avoid transition: all; it can accidentally animate layout, color, shadows, filters, or unrelated changes. */
.bad {
  transition: all 300ms ease;
}
```

Prefer explicit property lists.

### CSS keyframes

Use keyframes when the animation has more than two states, repeats intentionally, or needs a named reusable pattern.

```css
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast[data-state="open"] {
  animation: toast-in var(--motion-duration-base) var(--motion-ease-enter) both;
}
```

Rules:

- Always specify duration.
- Avoid infinite animation unless it communicates live status or is user-controlled/pausable.
- Use `animation-fill-mode: both` or `forwards` only when you need the animated state retained.
- Do not use keyframes to fake layout work when a state-driven transition would be cleaner.

### Reduced motion in CSS

Respect the userâ€™s system preference.

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    scroll-behavior: auto !important;
  }

  .motion-heavy,
  .parallax,
  .auto-carousel,
  .ambient-loop {
    animation: none !important;
    transition: none !important;
    transform: none !important;
  }

  .dialog,
  .popover,
  .toast {
    transition:
      opacity var(--motion-duration-fast) linear !important;
    transform: none !important;
  }
}
```

Prefer replacing motion with opacity, color, highlight, outline, or instant state changes. Do not remove functional feedback entirely.

### JavaScript and Web Animations API

Use Web Animations API when you need imperative control: cancel, reverse, finish, sequence, dynamically computed keyframes, or promises.

```js
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function animateIn(el) {
  if (reduceMotion) {
    el.style.opacity = '1';
    return null;
  }

  return el.animate(
    [
      { opacity: 0, transform: 'translateY(8px)' },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    {
      duration: 180,
      easing: 'cubic-bezier(0, 0, 0.2, 1)',
      fill: 'both',
    }
  );
}
```

When using JavaScript animation:

- Use `requestAnimationFrame()` for per-frame updates, not `setInterval()`.
- Batch reads before writes to avoid layout thrash.
- Cancel animations on unmount, route change, preference change, or state reversal.
- Do not block the main thread before initial visual feedback.
- Listen for reduced-motion preference changes when long-lived pages or SPAs are involved.

### FLIP for layout changes

When an element changes layout position or size, use FLIP when possible:

1. First: measure the old rectangle.
2. Last: apply the final layout and measure the new rectangle.
3. Invert: apply a transform that visually puts the element back at the old rectangle.
4. Play: animate transform back to identity.

Use FLIP for reordering lists, shared cards, grid changes, filter/sort transitions, and expanding items. This avoids animating layout properties directly.

### View Transitions API

Use for route/page/view transitions when:

- The browser supports it or progressive enhancement is acceptable.
- The transition clarifies continuity between two DOM states.
- Shared elements have clear identity.
- The reduced-motion version skips the transition or uses a short fade.

Pattern:

```js
function updateView(updateDOM) {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !document.startViewTransition) {
    updateDOM();
    return;
  }

  document.startViewTransition(() => updateDOM());
}
```

CSS example:

```css
.product-card {
  view-transition-name: product-card;
}

::view-transition-group(product-card) {
  animation-duration: var(--motion-duration-slow);
  animation-timing-function: var(--motion-ease-emphasized);
}

@media (prefers-reduced-motion: reduce) {
  ::view-transition-group(*) {
    animation-duration: 1ms;
  }
}
```

Avoid view transitions that animate the entire page by default without purpose. Name only the important shared elements when possible.

### Scroll-driven animation

Use scroll-driven animation only when scroll progress is the userâ€™s direct control or the animation explains scroll position. Good uses include reading progress, section reveals that do not block reading, sticky narrative transitions, and data-storytelling where scroll controls time.

Avoid:

- Parallax backgrounds that move independently of the content without adding meaning.
- Large multi-axis motion during normal reading.
- Scroll-jacking.
- Animations that hide content until the user scrolls â€ścorrectly.â€ť
- Motion that breaks browser find, keyboard navigation, or screen-reader order.

If using CSS `animation-timeline`, declare it after the `animation` shorthand.

```css
.progress-bar {
  transform-origin: left;
  animation: grow linear both;
  animation-timeline: scroll(root block);
}

@keyframes grow {
  from { transform: scaleX(0); }
  to { transform: scaleX(1); }
}
```

Always provide reduced-motion and unsupported-browser fallbacks.

