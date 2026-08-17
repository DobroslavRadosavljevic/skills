# View animations (`animateView`)

Use for screenshot-style morphs built on the browser **View Transition API**. Docs: [animateView](https://motion.dev/docs/animate-view). React component [AnimateView](https://motion.dev/docs/react-animate-view) is **Motion+**.

## When to use which

| Need | API |
|------|-----|
| Interruptible layout / shared element in React tree | `layout` / `layoutId` + `AnimatePresence` |
| Enter/exit of React children without VT | `AnimatePresence` |
| Cross-DOM snapshot morph, springs on VT, shared names auto-assigned | **`animateView` from `"motion"`** (MIT, 12.41+) |
| Declarative React wrapper + `startTransition` | Motion+ **`AnimateView`** — do not use in OSS unless the project already pays |

VT snapshots are less interruptible than Motion layout. Prefer layout when the user can reverse mid-flight.

## Core API (MIT)

```ts
import { animateView, spring, stagger } from "motion"

const animation = await animateView(update, { type: spring, duration: 0.8, bounce: 0.2 })
  .add(".card") // selector or Element; assigns/cleans view-transition-name
  .layout({ duration: 0.5 }) // size/position transition override
  .new({ opacity: 1 })
  .old({ opacity: 0 })
  .enter({ opacity: [0, 1] }, { delay: stagger(0.05) })
  .exit({ opacity: 0 })
  .class("card") // view-transition-class for CSS hooks
  .crop(false) // default: crop mismatched aspect ratios
  .group(false) // default: keep DOM hierarchy grouping (Safari support still rolling out)

await animation.finished
// controls: pause/play like animate(), except no then/cancel
```

- Pass a sync or async **`update`** that mutates the DOM (in React: wrap state in `flushSync` / a committed DOM write so VT sees the new tree).
- Default: **no** animation until you add `.new()` / `.add()` / enter-exit.
- `.add(fromEl, toEl)` shares a name for morphing two different elements.
- `.enter()` / `.exit()` apply when there is **no matching** old/new layer. Exit values seed matching enter keyframes by default.
- Limited to **CSS-animatable** values on VT pseudos. Custom properties via `CSS.registerProperty` + `.class()`.
- Not a substitute for `prefers-reduced-motion`: skip or fade if the user prefers reduced motion (same as raw VT).

## React (without Motion+)

```tsx
import { animateView } from "motion"
import { flushSync } from "react-dom"

function toggle() {
  void animateView(() => {
    flushSync(() => setOpen((v) => !v))
  })
    .add(".panel")
    .new({ opacity: 1 })
}
```

Do not import `AnimateView` from `motion/react` — it is not the MIT React API.

## Motion+ `AnimateView`

If the project already has Motion+: wrap the entering node, change state with React `startTransition`, set `enter` / `exit` / `transition`. Paid surface — skip unless present.

## vs native VT / CSS

Raw `document.startViewTransition` + CSS: [web-implementation.md](web-implementation.md). Use `animateView` when you want Motion springs, interruption/queueing, and automatic `view-transition-name` lifecycle.
