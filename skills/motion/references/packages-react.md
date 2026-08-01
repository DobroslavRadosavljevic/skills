# React Packages, Frameworks, Migration

Use for React entry points, Next/Vite/RSC, Mini React, LazyMotion sizing, CSS springs in RSC, `framer-motion` → `motion` migration, and Motion+.

**Scope:** React and React-based frameworks only (Next.js, Vite+React, Remix, etc.). Do **not** implement Motion for Vue, vanilla-only pages, or React Native.

## Install and entries

```bash
bun add motion
# Migrate
bun remove framer-motion && bun add motion
```

| Entry | Role |
|-------|------|
| `motion/react` | Full React API — default |
| `motion/react-client` | Next App Router / RSC-friendly client surface |
| `motion/react-m` | Slim `m` for `LazyMotion` |
| `motion/react-mini` | Mini `useAnimate` (~2.3kb WAAPI) — no independent `x`/`y` |
| `motion/debug` | Debug utilities |

Import map and full matrix: [source-map.md](source-map.md).

## Next.js / RSC

```tsx
// A — client boundary
"use client"
import { motion } from "motion/react"

// B — App Router preferred smaller client surface
import * as motion from "motion/react-client"
```

- Vite + React: no special Motion config.
- Keep `initial`/`animate` aligned for SSR HTML; use `AnimatePresence initial={false}` to skip enter on hydrated children.
- Root app shell: `<MotionConfig reducedMotion="user">`.

## CSS springs in RSC (optional)

Docs: [CSS](https://motion.dev/docs/css)

```js
import { spring } from "motion"
// Generate timing functions in RSC without shipping client Motion for that path
const easing = spring(0.5, 0.2).toString()
```

Prefer CSS transitions for simple cases — see [web-implementation.md](web-implementation.md).

## LazyMotion / size

| Path | Approx |
|------|--------|
| Full `motion` from `motion/react` | ~34kb |
| `m` + LazyMotion shell | ~4.6kb |
| + `domAnimation` | +~15kb (animate, variants, exit, hover/tap/focus) |
| + `domMax` | +~25kb (adds pan/drag/layout) |
| `motion/react-mini` `useAnimate` | ~2.3kb |

Recipes: [production-a11y.md](production-a11y.md).

**Mini caveat:** `motion/react-mini` cannot use independent transforms like `x` / `y` — use full `useAnimate` from `motion/react` or a CSS `transform` string.

## Migration checklist

1. `bun remove framer-motion && bun add motion`
2. Rewrite imports per [source-map.md](source-map.md).
3. React 12 rename: no major React API break beyond package path.
4. Scan for: `exitBeforeEnter`, `AnimateSharedLayout`, `positionTransition`/`layoutTransition`, `motion.custom`, `useViewportScroll`, `useCycle`.
5. Add root `MotionConfig reducedMotion="user"` if missing.

## Motion+ (paid)

Docs: [Motion+](https://motion.dev/plus) · [install](https://motion.dev/docs/motion-plus-installation)

Private registry `@motionplus/*` / `motion-plus`. Premium components — **do not** assume in OSS apps. Core path: MIT `motion` + `motion/react*`.

## Out of scope

| Surface | Guidance |
|---------|----------|
| Vue (`motion-v`) | Not used — do not add or document as a project option |
| Vanilla `motion` / CDN-only | Not used — prefer React APIs or CSS/WAAPI |
| React Native | No official Motion package — use RN stack / other libs |

## Decision: which React entry?

| Need | Choose |
|------|--------|
| Declarative UI | `motion/react` or LazyMotion + `m` |
| Next App Router | `motion/react-client` |
| Tiny imperative in a component | `motion/react-mini` `useAnimate` (if props fit) |
| Springs / `x` / layout / drag | Full `motion/react` or LazyMotion `domMax` |
| Simple hover color | CSS — [web-implementation.md](web-implementation.md) |
