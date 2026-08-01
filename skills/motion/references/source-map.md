# Motion Source Map

Snapshot: **2026-08-01** · Target line: **`motion@12.43.0`** (re-exports / depends on `framer-motion@12.43.0`). Prefer [motion.dev React docs](https://motion.dev/docs/react) and Context7 `/websites/motion_dev`.

**Skill scope:** React / React-based frameworks only. Vue, vanilla-only Motion, and React Native are out of scope.

## Package matrix (React)

| Entry | Role |
|-------|------|
| `motion/react` | Full React API (`motion`, hooks, `AnimatePresence`, …) — **default** |
| `motion/react-client` | RSC / Next App Router client entry (smaller client JS) |
| `motion/react-m` | Slim `m` components for `LazyMotion` |
| `motion/react-mini` | Mini React `useAnimate` (~2.3kb) — no independent `x`/`y` |
| `motion/debug` | Debug utilities |
| `framer-motion` | Legacy package name; still published; **do not use for new imports** |
| `motion-plus` / `@motionplus/*` | **Paid** Motion+ (private registry) |

Root `"motion"` / `"motion/mini"` exist for non-React use — **do not use** in this skill’s projects; prefer React entries or CSS/WAAPI.

**Peers:** React / React DOM `^18 \|\| ^19`. Docs: React ≥ 18.2.

**Not used here:** `motion-v` (Vue), vanilla CDN Motion, `motion/react-native` (does not exist).

## Install

```bash
bun add motion
# Migrate
bun remove framer-motion && bun add motion
```

## Import map (`framer-motion` → `motion`)

| Before | After |
|--------|--------|
| `framer-motion` | `motion/react` |
| `framer-motion/client` | `motion/react-client` |
| `framer-motion/m` | `motion/react-m` |
| `framer-motion/mini` | `motion/react-mini` |
| `framer-motion/debug` | `motion/debug` |

## Context7 / docs hubs

| Resource | ID / URL |
|----------|----------|
| Context7 | `/websites/motion_dev` |
| React docs | https://motion.dev/docs/react |
| Installation / Next | https://motion.dev/docs/react-installation |
| Upgrade (React) | https://motion.dev/docs/react-upgrade-guide |
| Examples | https://motion.dev/examples |
| npm | https://www.npmjs.com/package/motion |

## Doc URL index (skill routing)

| Topic | URL |
|-------|-----|
| Motion component | https://motion.dev/docs/react-motion-component |
| Animation / variants | https://motion.dev/docs/react-animation |
| Transitions | https://motion.dev/docs/react-transitions |
| Gestures | https://motion.dev/docs/react-gestures |
| Drag | https://motion.dev/docs/react-drag |
| AnimatePresence | https://motion.dev/docs/react-animate-presence |
| SVG | https://motion.dev/docs/react-svg-animation |
| MotionValues | https://motion.dev/docs/react-motion-value |
| useScroll | https://motion.dev/docs/react-use-scroll |
| Layout | https://motion.dev/docs/react-layout-animations |
| LayoutGroup | https://motion.dev/docs/react-layout-group |
| Reorder | https://motion.dev/docs/react-reorder |
| LazyMotion | https://motion.dev/docs/react-lazy-motion |
| Reduce bundle | https://motion.dev/docs/react-reduce-bundle-size |
| MotionConfig | https://motion.dev/docs/react-motion-config |
| Accessibility | https://motion.dev/docs/react-accessibility |
| Performance | https://motion.dev/docs/performance |
| useAnimate | https://motion.dev/docs/react-use-animate |
| CSS springs | https://motion.dev/docs/css |
| stagger | https://motion.dev/docs/stagger |
| Motion+ | https://motion.dev/docs/motion-plus-installation |
