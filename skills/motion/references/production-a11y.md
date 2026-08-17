# Production, Accessibility, Performance (Motion)

Use for LazyMotion, `MotionConfig`, reduced motion, performance, testing, decision guide, and AI traps. Pair with general [accessibility.md](accessibility.md) and [performance.md](performance.md).

## LazyMotion

Docs: [lazy-motion](https://motion.dev/docs/react-lazy-motion) · [reduce bundle](https://motion.dev/docs/react-reduce-bundle-size)

```tsx
import { LazyMotion, domAnimation, domMax } from "motion/react"
import * as m from "motion/react-m"

<LazyMotion features={domAnimation} strict>
  <m.div animate={{ opacity: 1 }} />
</LazyMotion>

// Async after hydration
const loadFeatures = () => import("./features").then((r) => r.default)
<LazyMotion features={loadFeatures}>{/* m.* */}</LazyMotion>
```

- Import **`m` from `motion/react-m`**, not full `motion`, or LazyMotion savings die (`strict` helps catch this).
- Need layout / drag / pan → `domMax`; otherwise `domAnimation`.

## MotionConfig

Docs: [motion-config](https://motion.dev/docs/react-motion-config)

```tsx
import { MotionConfig } from "motion/react"

<MotionConfig
  reducedMotion="user"
  transition={{ type: "spring", stiffness: 400, damping: 30 }}
  nonce={cspNonce}
  transformPagePoint={correctParentTransform(parentRef)}
>
  {children}
</MotionConfig>
```

Import `correctParentTransform` / `transformViewBoxPoint` from `motion/react` when remapping pointer space.

| Prop | Role |
|------|------|
| `transition` | Default transition for descendants |
| `reducedMotion` | `"user"` \| `"always"` \| `"never"` (**default `"never"`**) |
| `nonce` | CSP for injected styles |
| `transformPagePoint` | Remap pointer for drag/pan (scaled parents, SVG viewBox) |
| `isValidProp` | Motion 13: optional filter (e.g. `@emotion/is-prop-valid`) |
| `skipAnimations` | Skip playback (tests / tooling; `useAnimate` respects it) |

Prop filtering for CSS-in-JS: Motion 13 requires explicit `isValidProp` or `motion.create(StyledComponent)` — [packages-react.md](packages-react.md).

## Reduced motion (library)

Docs: [accessibility](https://motion.dev/docs/react-accessibility) · [useReducedMotion](https://motion.dev/docs/react-use-reduced-motion)

| `reducedMotion` | Behavior |
|-----------------|----------|
| `"never"` | Default — ignore OS |
| `"user"` | Respect OS; disables **transform + layout**; keeps opacity / color-like props |
| `"always"` | Force reduced (tests / site setting) |

```tsx
const reduce = useReducedMotion()
// Swap slide for fade; disable parallax / autoplay video
style={{ y: reduce ? 0 : y }}
```

**Always set root `reducedMotion="user"`** in product apps unless there is an explicit product override. Map substitutes to [accessibility.md](accessibility.md).

## Performance (Motion-specific)

Docs: [performance](https://motion.dev/docs/performance) · [frame](https://motion.dev/docs/frame)

- Prefer `opacity` / `transform` (and often `filter` / `clipPath`). Hardware-accelerated `backgroundColor` and SVG in supported browsers (12.43+).
- Independent transforms (`x`, `scale` as separate props) use CSS variables — for critical jank, a single `transform` string can be faster.
- Layout animations measure then transform — cheaper than animating width/height, still not free; use `layoutDependency`, avoid during horizontal resize storms; axis-lock with `layout="x"|"y"` when only one axis changes.
- Batch reads/writes with `frame` / `frame.postRender`.
- Prefer `filter: drop-shadow()` over animated `boxShadow` when paint-bound.
- Pause tab-hidden work: `usePageInView` + `useAnimationFrame`.

General compositor rules: [performance.md](performance.md).

## SSR / hydration

- `initial`/`animate` reflected in HTML; keep server/client values deterministic.
- LazyMotion async features after hydrate for TTI.
- `AnimatePresence initial={false}` for already-visible SSR content.
- SVG transform measurement may need DOM — avoid mismatches.

## Testing

```ts
import { frame } from "motion/react"

export function nextFrame() {
  return new Promise<void>((resolve) => frame.postRender(() => resolve()))
}

// Skip timing
<motion.div animate={{ opacity: 1 }} transition={{ duration: 0 }} />
// or transition={false}

// Deterministic a11y path
<MotionConfig reducedMotion="always">…</MotionConfig>
```

Await a frame before asserting styles when the library schedules microtasks.

## Decision guide

| Need | Choose |
|------|--------|
| Hover color / simple opacity | CSS transition |
| One-off keyframes, no React tree | CSS / WAAPI / `motion/mini` |
| Screenshot-style page morph, OK if non-interruptible | `animateView` or View Transitions |
| Enter/exit, variants, gestures in React | Motion `motion` / LazyMotion |
| Shared element / interruptible layout | Motion `layout` / `layoutId` |
| Drag / reorder / layout | `domMax` or full Motion |
| Tiny marketing page | Mini or LazyMotion `domAnimation` |
| No spatial meaning / ambient loop / blocks task | **Don’t animate** |

Apply the seven-question gate in `SKILL.md` and [foundations.md](foundations.md) first.

## AI authoring checklist

| Wrong / stale | Correct |
|---------------|---------|
| `from "framer-motion"` | `from "motion/react"` |
| `motion.custom()` | `motion.create(Component)` |
| `exitBeforeEnter` | `mode="wait"` |
| `AnimateSharedLayout` | `layoutId` + `LayoutGroup` |
| `positionTransition` / `layoutTransition` | `layout` |
| `MotionConfig features={…}` | `LazyMotion` + `m` |
| `useViewportScroll` | `useScroll` |
| `useCycle` | Remove / replace with state |
| Mini `{ x: 100 }` | Hybrid `motion` or CSS `transform` |
| `easing` / `finish()` / `timeline()` | `ease` / `complete()` / sequence `animate` |
| Assuming reduced motion by default | `MotionConfig reducedMotion="user"` |
| Wrapping `AnimatePresence` in `&&` | Condition **inside** presence |
| `key={index}` for reordering lists | Stable `id` |
| Full `motion` under LazyMotion | Use `m` + `strict` |
| `AnimateView` from `motion/react` in OSS | MIT `animateView` from `"motion"`; React `AnimateView` is Motion+ |
| `axis="y"` always on Reorder | Auto-detect; `"xy"` for grids (13.1) |
| Mini `{ path: arc() }` | Full `motion` / `useAnimate` |

## Product-practice mapping

| Design rule | Motion mapping |
|-------------|----------------|
| Interruptible | Prefer Motion layout over blocking View Transitions when re-entry matters |
| Transform/opacity first | Aligns with Motion performance guide |
| Reduced-motion mandatory | Root `reducedMotion="user"` + `useReducedMotion` swaps |
| Smallest tool | CSS → mini → LazyMotion → full |
| Don’t block work | Avoid long `mode="wait"` on primary tasks |
| Focus / semantics | Tap defaults + non-motion status; stable keys |
