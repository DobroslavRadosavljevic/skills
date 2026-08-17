# MotionValues, Hooks, Scroll, Layout

Use for MotionValues, imperative `animate` / `useAnimate`, scroll linking, layout/`layoutId`, Reorder, and related hooks. View Transitions: [view-animations.md](view-animations.md).

## MotionValues

Docs: [motion value](https://motion.dev/docs/react-motion-value) · [useTransform](https://motion.dev/docs/react-use-transform) · [useSpring](https://motion.dev/docs/react-use-spring) · [useVelocity](https://motion.dev/docs/react-use-velocity) · [useMotionTemplate](https://motion.dev/docs/react-use-motion-template) · [useMotionValueEvent](https://motion.dev/docs/react-use-motion-value-event)

Composable values that update the DOM **without React re-renders**.

```tsx
import { motion, useMotionValue, useTransform, useSpring } from "motion/react"

const x = useMotionValue(0)
const opacity = useTransform(x, [-200, 0, 200], [0, 1, 0])
const springX = useSpring(x, { stiffness: 300 })

return <motion.div drag="x" style={{ x: springX, opacity }} />
```

| API | Role |
|-----|------|
| `useMotionValue(v)` | Create; `.get()`, `.set()`, `.jump()`, `.getVelocity()`, `.stop()`, `.on()`, `.isAnimating()` |
| `useMotionValueEvent(mv, event, cb)` | Lifecycle-safe `change` / `animationStart` / `animationCancel` / `animationComplete` |
| `useTransform` | Function form `() => x.get() + y.get()` **or** range map `useTransform(x, in, out, { clamp, ease, mixer })` |
| `useSpring(source, opts?)` | Spring MV; track another MV; `skipInitialAnimation: true` with scroll |
| `useFollowValue` / `followValue` | Follow a source MV with **any** transition (not spring-only); 12.28+ |
| `useVelocity(mv)` | Velocity MV (units/sec) |
| `useMotionTemplate` | Tagged template combining MVs into a string MV |

`set()` batches DOM updates and does **not** re-render. Prefer MotionValues for scroll/drag/pointer; use React state only when UI structure must change.

## Imperative animation

Docs: [useAnimate](https://motion.dev/docs/react-use-animate) · [animate](https://motion.dev/docs/animate) (shared engine; use React hooks in this skill)

```tsx
import { useAnimate, stagger } from "motion/react"
// Tiny WAAPI-only: import { useAnimate } from "motion/react-mini"

const [scope, animate] = useAnimate()
// ref={scope}; selectors scoped to subtree
animate("li", { opacity: 1 }, { delay: stagger(0.05) })
```

**Controls** (return of `animate`): `time`, `speed`, `pause`/`play`, `complete()`, `cancel()`, `stop()`, awaitable/`then`. Note: `stop()` commits styles and cannot restart; `cancel()` reverts. Promise is one-shot per finish.

Sequences (full / hybrid `useAnimate` only — not mini):

```js
animate([
  ["ul", { opacity: 1 }, { duration: 0.4 }],
  ["li", { x: [-20, 0] }, { at: "<", delay: stagger(0.05) }],
])
```

There is no separate `timeline()` export in Motion 12 — use sequence `animate`. Prefer React `useAnimate` over importing vanilla `"motion"` in this skill’s projects.

## Scroll

Docs: [scroll animations](https://motion.dev/docs/react-scroll-animations) · [useScroll](https://motion.dev/docs/react-use-scroll) · [scroll()](https://motion.dev/docs/scroll)

| Kind | API |
|------|-----|
| Triggered | `whileInView` / `useInView` |
| Linked | `useScroll` |

```tsx
const { scrollYProgress } = useScroll({
  target: ref,
  offset: ["start end", "end end"],
  container, // optional scroll parent
  trackContentSize: true, // follow content size changes (12.29+)
})
const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30, skipInitialAnimation: true })
```

Returns `scrollX`/`scrollY` and `*Progress` (0–1). Prefer linking to `opacity` / `transform` / `filter` / `clipPath` for GPU path. Target measurement uses layout box (**ignores CSS transforms**). `start`/`end` offsets and element tracking can hardware-accelerate. `ViewTimeline` is supported for `scroll` / `useScroll` (12.35+). `target` / `container` refs hydrate from anywhere in the tree.

## Layout animations

Docs: [layout](https://motion.dev/docs/react-layout-animations) · [LayoutGroup](https://motion.dev/docs/react-layout-group)

```tsx
<motion.div layout />
<motion.div layoutId="tab-underline" />
<LayoutGroup id={namespace}>{/* sync + namespace layoutIds */}</LayoutGroup>
```

- FLIP-style: measure layout change → animate with **transform**.
- Drive layout via `style` / `className`, **not** `animate` / `whileHover` size props, when using `layout`.
- `layout="position"` — position only (images / aspect-ratio changers).
- `layout="x"` / `layout="y"` — axis-locked layout (12.36+).
- Shared `layoutId`: morph from previous; both present → crossfade. Destination element's transition wins. Pair with `AnimatePresence` for return morph.
- Curve travel: `transition={{ layout: { path: arc() } }}`.
- `layoutDependency`, `layoutScroll` (overflow scroll), `layoutRoot` (`position: fixed` ancestors), `layoutAnchor` (custom anchor for relative projection boxes).
- Children distort under scale → give children `layout`; put `borderRadius` / `boxShadow` in `style` for correction.
- Unsupported: `display: inline`, SVG layout animation.

List exit + reflow:

```tsx
<LayoutGroup>
  <AnimatePresence mode="popLayout">
    {items.map((item) => (
      <motion.li key={item.id} layout exit={{ opacity: 0 }} />
    ))}
  </AnimatePresence>
</LayoutGroup>
```

## Reorder

Docs: [reorder](https://motion.dev/docs/react-reorder)

```tsx
import { Reorder } from "motion/react"

<Reorder.Group values={items} onReorder={setItems}>
  {items.map((item) => (
    <Reorder.Item key={item.id} value={item}>{item.label}</Reorder.Item>
  ))}
</Reorder.Group>
```

Axis is **auto-detected** (13.1): row → `"x"`, column → `"y"`, grid/wrap → `"xy"`. Override with `axis="x" | "y" | "xy"`. RTL supported. Layout built-in. Drag handle via `useDragControls` + `dragListener={false}`. Works with `AnimatePresence`. Prefer `position: relative|absolute` so drag `z-index` works. Scrollable parents auto-scroll near edges.

## Other hooks

| Hook | Notes |
|------|--------|
| `useInView(ref, { root, margin, once, amount, initial })` | Boolean intersection |
| `useDragControls()` | `start(event)`, `stop()`, `cancel()` |
| `useAnimationFrame(cb?)` | Pass `undefined` to pause |
| `useReducedMotion()` | Live OS preference boolean |
| `usePageInView()` | Tab visibility; SSR often `true` until measured |
| `useTime()` | Time MV for continuous transforms |

**Removed / undocumented:** `useCycle` (docs 404). Do not teach `PresenceContext` as public API — use presence hooks.

## Performance notes

- MotionValues avoid re-renders; `useMotionValueEvent` only when React state is required (e.g. scroll direction label).
- `useInView({ once: true })` / `viewport={{ once: true }}` to stop observing.
- Pause loops with `usePageInView` + conditional `useAnimationFrame`.
- Scrollbar appearing can spuriously trigger layout anims → `scrollbar-gutter: stable`.
