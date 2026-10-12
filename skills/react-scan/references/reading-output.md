# Reading React Scan Output

Contents:
- [Render Outlines and Labels](#render-outlines-and-labels)
- [Toolbar](#toolbar)
- [Inspector: Why Did This Render](#inspector-why-did-this-render)
- [Notifications: Slowdowns](#notifications-slowdowns)
- [FPS Meter](#fps-meter)
- [Console Log](#console-log)
- [Triage Table](#triage-table)
- [False Signals](#false-signals)

## Render Outlines and Labels

- Every composite component that renders gets a 1 px purple rectangle with a light fill around its DOM nodes. The rectangle fades over 45 frames (about 0.75 s). A new render resets the fade, so a component that renders all the time looks solid.
- **Color carries no meaning in 0.5.x.** There is one color. Guides that describe red, yellow, or grey outlines are about older versions.
- Only components with visible, non-zero-size DOM get an outline. Components that render no DOM (providers, wrappers that return children) and off-screen components are invisible, but they still count in `onRender` and in the notifications data.
- The label `Name ×N` sits above the box:
  - `×N` counts the 32 ms flush windows in which the component rendered while its outline was still visible. It is a lower bound, not an exact count.
  - Labels at the same position merge: `Row, Cell ×12` lists several names (up to 4 per count group, truncated to 40 chars), and counts of the same name add up across merged outlines. So `Row ×40` can mean 40 different rows that each rendered once.
- A React Compiler–memoized component shows `✨` before its name.

Use outlines to answer "what rendered on screen when I did X?". Use the inspector, notifications, or the probe to answer "how slow?" and "why?".

## Toolbar

The toolbar sits in the bottom-right by default. You can drag it, it snaps to corners, you can resize it, and you can collapse it into an edge tab by dragging it off-screen. Its position persists in localStorage. Controls, left to right:

1. **Inspect** (crosshair, `#react-scan-inspect-element`): off → inspecting (hover highlights) → focused (click locks a component).
2. **Notifications** (bell, `#react-scan-notifications`): opens the slowdown history. The red badge counts unseen high-severity events.
3. **Outline Re-renders** toggle: pauses outlines. This also pauses `onRender` while the inspector is off, and the state is saved to localStorage.
4. **FPS** meter.

Keyboard:
- **Esc**: leave focus, then leave inspect mode.
- **⌘C / Ctrl+C** on a focused component: copies an HTML preview of the element plus the component stack (via react-grab). It is skipped while an input is focused or text is selected.
- Component tree search: Enter / Shift+Enter (next/previous match), Cmd/Ctrl+Enter (select), arrow keys (navigate).

There is no global hotkey that toggles React Scan.

## Inspector: Why Did This Render

1. Click the crosshair, hover, then click the component. The panel shows its name and badges:
   - `memo`, `forwardRef`, `lazy`, `suspense`, `profiler`
   - `memo ✨` = compiled by the React Compiler
   - `×N` = re-renders since you selected it
   - self time in ms.
2. **Select first, then repeat the interaction.** Data collects from the moment of selection. Until then the panel says "No changes detected since selecting".
3. "What changed?" has three sections: **Changed Props**, **Changed State**, **Changed Context**. Each entry has a count badge and an expandable diff with paths (`- old` / `+ new`).

| Panel shows | Meaning | Usual fix |
| --- | --- | --- |
| ⚠ "Reference changed but objects are structurally the same" | A new object or array with the same content each render (inline `style={{}}`, `[]`, `.map()`/`.filter()` result, `{...spread}`) | Hoist the constant, `useMemo`, or the compiler |
| ƒ "Function reference changed" | An inline callback | `useCallback`, pass `id` + a stable handler, or the compiler |
| Prop with a real `-`/`+` diff | The data really changed | Expected. Check whether the parent should send less data |
| "1st hook called in X" (Changed State) | That hook (counted in call order, including hooks inside custom hooks) changed: `useState`, `useReducer`, or a store subscription through `useSyncExternalStore` | Move the state down, narrow the selector, or batch updates |
| Changed Context | A context value changed by identity | Memoize the provider value, split the context, or use a selector store |
| Nothing listed, but `×N` keeps growing | No change of its own: the **parent rendered** | `memo` the component, move state below its parent, or pass it as `children` |

Notes:
- Context attribution can over-report. The source says every context change is listed regardless of which render it happened in. Confirm with the probe's `context` counts or React DevTools.
- Hook names are not shown. Count hook calls in source order, or read the names in React DevTools (Components tab → hooks).
- The **components tree** next to the inspector is built from the DOM (#252). Components that render no DOM element are missing; wrap them in a `<div>` temporarily to inspect them. Its `×N` badge counts updates that changed the DOM, at most once per 16 ms, so it undercounts.
- Tree search accepts a name, `/regex/`, or `[memo,forwardRef]` type filters, and you can combine them (`button [for]`).

## Notifications: Slowdowns

React Scan records two kinds of events. You don't need the panel open while they are recorded, and it keeps up to 200.

- **Interactions**: pointer clicks and keyboard input. Start = `pointerup` or `keydown`. It follows a microtask → `requestAnimationFrame` → `setTimeout` chain and matches the browser's Event Timing entry, which gives INP-style latency. Clicks on the toolbar are ignored. Scroll, hover, and drag movement are **not** interactions here.
- **FPS drops**: a frame gap over 150 ms while the tab is visible and the pointer is not over the toolbar. A drop that overlaps an interaction is folded into the interaction.

Severity (interaction): under 200 ms good (green), under 500 ms needs improvement (orange), 500 ms or more poor (red). These are the INP thresholds.

Each event shows "Clicked <Component>" or "Typed in <Component>" with its total ms. Tabs:

### Overview: where the time went

| Bar | Computed as | High means |
| --- | --- | --- |
| **Renders** | Sum of the self time of components rendered in the window (dev builds only) | React render work. Use Ranked and fix the top components |
| **JavaScript / React Hooks** | JS time from start to end, minus render time | Event handlers, effects, hook overhead, non-React JS. With many renders: many components running hooks and effects. With few renders: a slow handler. Profile it |
| **Update DOM and Draw New Frame** | rAF start − JS end (style/layout) + commit/paint + time until the frame is shown | Large DOM changes, layout thrash, expensive CSS (`filter`, `backdrop-filter`, big shadows). Use the Performance panel |

On production React there is no render time. The labels become "Total Processing Time" and "React Renders, Hooks, Other JavaScript".

### Ranked: which components

- There is one bar per component name, with `×count` renders and summed self ms, sorted by time. Expand a bar to see which parents rendered it.
- The **Memoizable** badge means: not a mount, not compiled, and **zero** prop, state, and context changes across the grouped renders. In other words, "would not have rendered if wrapped in `memo` with stable props".
- Click a bar to see:
  - "Render time" and "Renders: Nx"
  - Changed Props / State (`index N`) / Context, each with `changed/total ×`
  - a tip: "Stop the following props, state and context from changing between renders, and wrap the component in React.memo if not already", or "No changes detected — This component would not have rendered if it was memoized".
- Hovering a bar highlights those components on the page.

### Prompts: Copy Prompt

There are three templates: **Fix**, **Explanation**, and **Data**. Each is plain text with:
- the timing breakdown
- up to 30 components with self time over 5 ms, with render counts and changed props, state, and context.

It is a good brief to paste into a chat. It holds the same data you can read above.

### Alerts

A speaker toggle plays a chime on high-severity events. The setting is saved in localStorage.

## FPS Meter

It counts `requestAnimationFrame` callbacks per second and samples every 200 ms. The number is red under 30, amber under 50, and purple otherwise. It measures the whole main thread, including React Scan's own work and background-tab throttling. Use it to spot jank during scroll or animation, not as a metric.

## Console Log

`scan({ log: true })` prints one `console.group` per rendered component: `Name (0.42ms)`, or `✨Name` when compiled. The group body is empty in 0.5.7. Logging adds a lot of overhead, so use it only for short captures.

## Triage Table

| What you see | Likely cause | Next step |
| --- | --- | --- |
| Whole page outlined on a small local action | State too high, or a context value that is new each render | Inspect the top component: Changed State or Context. Then move the state down or memoize the provider value |
| Many consumers outlined together, Changed Context | Context value identity, or a context that holds too much | Memoize the value, split the context, or use a selector store |
| A `memo` child still renders, ⚠ or ƒ in Changed Props | Unstable prop | Stabilize that prop (or rely on the compiler) |
| Child with high self ms, Memoizable, empty "what changed" | Parent cascade into an expensive child | `memo` it, or restructure (children as props, state below) |
| `mounts` grow on every update; input loses focus | Unstable `key`, or a component defined inside a component | Use a stable key from the data; hoist the component definition |
| Typing is orange or red, the whole form outlined | Controlled form state at the root | Field-level state, uncontrolled inputs, a form library, or a deferred preview |
| FPS drops during scroll, drag, or pointer move, solid outlines | High-frequency state updates | Refs and direct style writes, rAF throttle, CSS or motion values, virtualization |
| Two commits per interaction, `×2` | `setState` in an effect (derived state) | Compute during render |
| Outlines pulse with no interaction | Timer, polling, or a subscription at the root | Move it into the leaf that displays it |
| Renders a small share of the time; DOM/Draw dominates | Not a React render problem | Performance panel: layout, paint, DOM size |
| JS dominates with few renders | Slow event handler or effect | Performance panel flame chart; move work off the critical path |

Fixes with code: [fix-catalog.md](fix-catalog.md).

## False Signals

- **Render count is not slowness.** Fix slow interactions and dropped frames, not every outline.
- **Dev builds are slower than production**: extra checks, profiler timers, StrictMode double render. Compare before and after on the same build, and confirm absolute numbers on a production or profiling build.
- **StrictMode** calls component bodies twice in dev. Commits and React Scan counts do not double, but self time can.
- **Memoizable has false positives.** Changes from `useSyncExternalStore` stores, refs, `use()` of a new promise, or library internals may not show as a change (#378 also reports compiled components tagged Memoizable). Check before adding `memo`.
- **React Scan has overhead**: outline flushing every 32 ms, the FPS loop, the inspector, and above all `log`. For final numbers, close the inspector, turn off `log`, and compare against a run without React Scan or with `react-scan/lite`.
- **Persisted settings.** If nothing shows, check `localStorage["react-scan-options"]` for `enabled: false`.
