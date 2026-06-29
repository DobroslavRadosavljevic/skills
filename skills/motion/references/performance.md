# Motion Performance Rules

Use for compositor-only rules, layout-thrash prevention, will-change, responsiveness, and testing under real conditions.

## Performance rules

### Prefer compositor-only properties

Best properties:

```text
transform
opacity
```

Use transforms for movement, scaling, rotation, and resize illusions. Use opacity for fade. These are usually the safest path to smooth animation.

Risky properties:

```text
width, height, top, right, bottom, left,
margin, padding, border-width,
font-size, line-height,
box-shadow, filter, backdrop-filter,
clip-path, SVG path morphing,
large blurs, large fixed backgrounds
```

These can trigger layout, paint, GPU pressure, or main-thread work. Use them only when necessary and test on low-end devices.

### Avoid layout thrash

Do not alternate DOM reads and writes in loops.

Bad pattern:

```js
items.forEach((item) => {
  const rect = item.getBoundingClientRect();
  item.style.transform = `translateY(${rect.height}px)`;
});
```

Better pattern:

```js
const rects = items.map((item) => item.getBoundingClientRect());
items.forEach((item, index) => {
  item.style.transform = `translateY(${rects[index].height}px)`;
});
```

### Use `will-change` sparingly

`will-change` can help with specific compositor issues, but overusing it wastes memory and can degrade performance.

Use it shortly before an animation and remove it after.

```js
el.style.willChange = 'transform, opacity';
const animation = el.animate(keyframes, options);
animation.finished.finally(() => {
  el.style.willChange = '';
});
```

### Protect responsiveness

Do not block the next paint after a user interaction. Provide immediate visual feedback before long work starts. Split expensive work, schedule noncritical work later, and avoid animation code that competes with input handling.

Check:

- Animation starts promptly after input.
- No long tasks during transition.
- No unnecessary React re-renders during every frame.
- No expensive shadows/filters on large moving surfaces.
- No scroll-linked JavaScript that runs on every pixel without throttling or browser-native timelines.

### Test under real conditions

Test at least:

- Low-end mobile device or emulation.
- 4x or 6x CPU throttling.
- Reduced motion on.
- Keyboard-only navigation.
- Screen reader basics for status/focus changes.
- Dark mode and high-contrast modes if relevant.
- 60 Hz and high-refresh-rate displays if the product depends on smoothness.

