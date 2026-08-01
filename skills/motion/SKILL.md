---
name: motion
description: "Build, review, debug, migrate, or plan UI animation with Motion for React (motion/react) and product motion design. Use for React/Next/Vite apps: motion.div, AnimatePresence, variants, gestures, drag, layout/layoutId, LazyMotion, useScroll, useAnimate, MotionValues, reducedMotion, framer-motion→motion migration, CSS/WAAPI/View Transitions alternatives, microinteractions, page transitions, accessibility, and performance-safe animation. Do not use for Vue, vanilla-only Motion, React Native, or non-interactive film/video unless adapting it to product UI."
---

# Motion

Use this skill for **[Motion for React](https://motion.dev/docs/react)** (`motion` / formerly Framer Motion) and for **product motion design** (purpose, tokens, a11y, performance). Prefer current [motion.dev React docs](https://motion.dev/docs/react) over memory — pin narrative to **`motion@12.x`**.

**Scope:** React and React-based frameworks only (Next.js, Vite+React, Remix, etc.). Do not implement Motion for Vue, vanilla-only pages, or React Native.

Motion is not required for every hover. Keep general design gates; implement with Motion when the project already uses it or needs enter/exit, layout, gestures, or scroll-linked motion beyond CSS.

## Core Rule (always)

Before proposing or coding animation, answer:

1. What changed in the interface?
2. Why did it change?
3. Where did the changed thing come from, and where is it going?
4. What should the user notice next?
5. Can the user keep working without waiting for decoration?
6. What is the reduced-motion equivalent?
7. Will this animate on the compositor, or does it trigger layout or paint?

If it fails, remove it or simplify. Then choose the smallest tool: CSS → `motion/react-mini` / LazyMotion → full `motion/react`.

## Workflow

1. Confirm React surface: `motion/react` or `motion/react-client` (Next App Router). Prefer `bun add motion`. Do not generate `framer-motion`, `motion-v`, or vanilla CDN Motion for new code.
2. Refresh versions, entry points, and doc URLs from [source-map.md](references/source-map.md).
3. Apply product motion judgment from [foundations.md](references/foundations.md) (purpose, tokens, duration/easing).
4. For declarative APIs (`motion.*`, variants, transitions, gestures, `AnimatePresence`, SVG), use [setup-react-core.md](references/setup-react-core.md).
5. For MotionValues, `useAnimate`, scroll, layout/`layoutId`, Reorder, and related hooks, use [values-scroll-layout.md](references/values-scroll-layout.md).
6. For Next/RSC, Mini, LazyMotion sizing, migration, and Motion+, use [packages-react.md](references/packages-react.md).
7. For LazyMotion recipes, `MotionConfig`, reduced motion, performance, testing, and AI traps, use [production-a11y.md](references/production-a11y.md).
8. For CSS / WAAPI / FLIP / View Transitions / scroll-driven CSS (when not using Motion), use [web-implementation.md](references/web-implementation.md).
9. For UI pattern recipes, use [component-recipes.md](references/component-recipes.md).
10. For audits, handoff, and QA, use [deliverables-qa.md](references/deliverables-qa.md). Also load [accessibility.md](references/accessibility.md) and [performance.md](references/performance.md) when those are the focus.

## Implementation Judgment

- **Canonical import:** `import { motion, AnimatePresence } from "motion/react"`. Next App Router: `import * as motion from "motion/react-client"` or `"use client"`.
- Root **`<MotionConfig reducedMotion="user">`** — library default is `"never"` (OS preference ignored until you opt in).
- Prefer **transform / opacity**; use `layout` / `layoutId` for size/position morphs (not `animate` width/height).
- **`AnimatePresence` outside** the conditional; stable **`key`s**; `mode="wait"` is single-child only.
- Prefer **`delayChildren: stagger(...)`** over legacy `staggerChildren` for new code.
- Custom components: **`motion.create(Component)`** once (never inside render); forward refs.
- High-frequency scroll/drag: **MotionValues** + `style`, not `useState` every frame.
- Bundle: **`LazyMotion` + `m` from `motion/react-m`**; `domAnimation` vs `domMax` (layout/drag).
- Mini (`motion/react-mini`) cannot use independent transforms like `x` / `y` — use full `useAnimate` or CSS `transform`.
- Motion+ / `motion-plus` is **paid** — do not assume it in OSS projects.

## Verification

- Imports from `motion/react` (or `motion/react-client` / `react-m` / `react-mini`), not `framer-motion` / `motion-v`.
- Reduced-motion path exercised (`MotionConfig` and/or `useReducedMotion`).
- Exit animations: presence wrapping + keys; interrupt/`transition` sensible for task speed.
- Layout: non-static parent for `popLayout`; `layoutScroll` / `layoutRoot` when needed.
- Tests: `transition={{ duration: 0 }}` or `false`; await `frame.postRender` before style asserts when needed.
- Bundle check if adding full `motion` vs LazyMotion/mini.
