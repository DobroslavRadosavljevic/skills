# Motion for React — Core APIs

Use for `motion.*`, animation props, variants, transitions, gestures, `AnimatePresence`, and SVG. Imports: `motion/react` (or `motion/react-client`).

Docs: [react-animation](https://motion.dev/docs/react-animation) · [motion component](https://motion.dev/docs/react-motion-component) · [transitions](https://motion.dev/docs/react-transitions) · [gestures](https://motion.dev/docs/react-gestures) · [AnimatePresence](https://motion.dev/docs/react-animate-presence) · [SVG](https://motion.dev/docs/react-svg-animation)

## Motion components

```tsx
import { motion } from "motion/react"
// Next App Router:
import * as motion from "motion/react-client"

<motion.div />
<motion.button />
<motion.circle />
```

Custom components — **`motion.create` once**, outside render:

```tsx
const MotionCard = motion.create(Card)
// forward motion props into the wrapped component when needed:
motion.create(Component, { forwardMotionProps: true })
```

Requirements: forward `ref` to a DOM node (React 19: `props.ref`). Wrong ref type throws (12.43+). Never call `motion.create()` inside render.

Deprecated: `motion.custom()`. Prefer `motion.create` over bare `motion(Component)` in new code.

**Motion 13 + CSS-in-JS:** Emotion/Styled Components no longer get automatic prop filtering. Prefer `motion.create(StyledDiv)` (styling library owns forwarding) or inject `isValidProp` — [packages-react.md](packages-react.md).

## Animation props

| Prop | Role |
|------|------|
| `initial` | Enter-from target, variant label(s), or `false` (skip enter; SSR shows `animate`) |
| `animate` | Target on mount and when values change |
| `exit` | Exit target — needs `AnimatePresence` ancestor |
| `transition` | Default transition for this node |
| `variants` | Named states |
| `custom` | Data for dynamic variant functions |
| `style` | CSS + MotionValues + independent transforms (`x`, `rotate`, …) |

Independent transforms: `x`, `y`, `z`, `scale`, `scaleX/Y`, `rotate`, `rotateX/Y/Z`, `skewX/Y`, `transformPerspective`, `originX/Y/Z`.

Defaults: physical props → spring; visual (`opacity`, color) → tween.

Keyframes: `animate={{ x: [0, 100, 0] }}`; `null` = current value; `times` on transition for pacing.

Curved motion (`arc` from `motion/react` or `"motion"`):

```tsx
import { arc, motion } from "motion/react"

<motion.div
  animate={{ x: 200, y: 100 }}
  transition={{ duration: 1, path: arc({ strength: 0.5, peak: 0.5, rotate: true }) }}
/>
```

Options: `strength` (default 0.5), `peak` (0.5), `direction` (`"cw"` | `"ccw"` | auto), `rotate` (`boolean` | 0–1). Memoize `arc()` when using automatic direction so interruptions stay stable. Use `transition.layout.path` for layout/`layoutId`. **Not** supported by mini `animate()`.

Animatable colors include `oklch`, `oklab`, `lab`, `lch`, `color`, `color-mix`, `light-dark`. `backgroundColor` and SVG can use hardware acceleration in supported browsers (12.43+).

## Variants and orchestration

```tsx
import { motion, stagger } from "motion/react"

const list = {
  visible: {
    opacity: 1,
    transition: { when: "beforeChildren", delayChildren: stagger(0.08) },
  },
  hidden: { opacity: 0, transition: { when: "afterChildren" } },
}
const item = {
  visible: { opacity: 1, x: 0 },
  hidden: { opacity: 0, x: -12 },
}

<motion.ul variants={list} initial="hidden" animate="visible">
  {rows.map((row) => (
    <motion.li key={row.id} variants={item} />
  ))}
</motion.ul>
```

- Variants **propagate** to children with matching labels.
- Prefer **`delayChildren: stagger(interval, { from, startDelay, ease })`**.
- Legacy `staggerChildren` / `staggerDirection` still appear in examples — prefer `stagger()` for new code.
- Dynamic: `visible: (i) => ({ … })` + `custom={i}`.
- `inherit={false}` blocks parent variant inheritance.

## Transitions

`type`: `"tween"` | `"spring"` | `"inertia"` (default depends on property).

| Type | Key options |
|------|-------------|
| tween | `duration` (default ~0.3), `ease`, `times` |
| spring (physics) | `stiffness`, `damping`, `mass`, `velocity`, `restSpeed`, `restDelta` |
| spring (duration) | `duration` + `bounce` (0–1), or `visualDuration` |
| inertia | `power`, `timeConstant`, `modifyTarget`, `min`/`max` — used by `dragTransition` |

Also: `delay`, `repeat` / `Infinity`, `repeatType`: `"loop" | "reverse" | "mirror"`, `repeatDelay`, `when`, `delayChildren`, `path`. Sequences support `repeatType` / `repeatDelay` (12.39+).

Per-value / inherit:

```tsx
transition={{
  default: { type: "spring" },
  opacity: { ease: "linear" },
}}
```

Eases: named (`easeInOut`, `circOut`, `backOut`, `anticipate`, …) or cubic-bezier arrays.

## Gestures

| Prop | Gesture |
|------|---------|
| `whileHover` / `onHoverStart` / `onHoverEnd` | Hover |
| `whileTap` / `onTap*` | Press; keyboard Enter; sets `tabIndex={0}` |
| `whileFocus` | Focus-visible-like |
| `whileDrag` | While dragging |
| `whileInView` + `viewport` | Scroll-triggered |
| `onPan` / `onPanStart` / `onPanEnd` | Pan (no `whilePan`) |

Targets may be objects **or** variant labels.

### Drag

```tsx
<motion.div
  drag // true | "x" | "y"
  dragConstraints={{ left: 0, right: 300 }} // or ref
  dragElastic={0.2}
  dragMomentum
  dragTransition={{ bounceStiffness: 600, bounceDamping: 10 }}
  dragControls={controls}
  dragListener={false} // with useDragControls
  whileDrag={{ scale: 1.02 }}
/>
```

Event `info`: `point`, `delta`, `offset`, `velocity`. Nested `<img>`: `draggable={false}`. Scaled/SVG parents: `MotionConfig transformPagePoint={correctParentTransform(ref)}` or `transformViewBoxPoint(svgRef)`.

`dragSnapToOrigin` may be `true` or `"x"` / `"y"` (per-axis). `dragDirectionLock` + `onDirectionLock`. Child `stopPropagation` no longer breaks drag end (12.41+).

## AnimatePresence

```tsx
import { AnimatePresence, motion } from "motion/react"

<AnimatePresence mode="sync" initial={false}>
  {open && (
    <motion.div key="panel" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
  )}
</AnimatePresence>
```

| Prop | Notes |
|------|--------|
| `mode` | `"sync"` (default), `"wait"` (one child; enter waits for exit), `"popLayout"` (exit absolute → siblings reflow; pairs with `layout`) |
| `initial={false}` | Skip enter on first mount / SSR children |
| `custom` | Exit direction data via `usePresenceData` |
| `propagate` | Nested presence exits when parent exits |
| `onExitComplete` | All exits finished |

Hooks: `useIsPresent()`, `usePresence()` → `[isPresent, safeToRemove]`, `usePresenceData()`.

**Rules:** Presence wraps the **conditional**, not the other way around. Stable keys (not array index for reordering lists). Custom children under `popLayout` must forward refs; parent `position` not `static`.

`exitBeforeEnter` → use `mode="wait"`. There is **no** documented `presenceAware` prop — use `propagate` / presence hooks.

## SVG

Animate attributes and styles. Line draw: `pathLength` / `pathSpacing` / `pathOffset` (0–1). Morph `d` only when path structures are similar.

- Transform origin defaults to element center; restore SVG default with `transformBox: "view-box"`.
- Need SVG attributes not CSS transforms: `attrX` / `attrY` / `attrScale`.
- Gestures on filter primitives: put gesture on parent + variants.

## Quick recipes

```tsx
// Hover / press
<motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} />

// List + layout exit
<AnimatePresence mode="popLayout">
  {items.map((item) => (
    <motion.li key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
  ))}
</AnimatePresence>
```
