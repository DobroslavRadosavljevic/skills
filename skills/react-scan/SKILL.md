---
name: react-scan
description: "Find, explain, and fix React re-render and interaction performance problems with React Scan (react-scan 0.5.7). Use for installing react-scan (CLI init, auto.global.js script tag, scan() module import, Next.js App/Pages Router, Vite, React Router/Remix, TanStack Start, Astro, Rsbuild, Storybook, browser extension), keeping it dev-only, reading render outlines and ×N labels, the toolbar inspector \"what changed\" panel, the notifications/slowdowns panel (INP-style timing split, Ranked view, Memoizable badge, Copy Prompt), the FPS meter, the onRender/onCommitFinish options, react-scan/lite, react-component-name plugins, @react-scan/vite-plugin-react-scan, and headless render counting with Playwright. Also use whenever a React app feels slow or janky, typing or clicking lags, components re-render too often, someone asks why a component rendered, or a memo/useMemo/useCallback/context/React Compiler fix needs to be measured before and after, even if React Scan is not named."
---

# React Scan

React Scan hooks into React through the DevTools global hook. It draws an outline on every component that renders, shows why a selected component rendered, and records slow interactions and dropped frames. It is a development tool. It needs no app code changes beyond loading it before React.

Version facts (npm `latest` = 0.5.7, peer `react`/`react-dom` 16.8–19). The upstream README now recommends React Doctor (`bunx react-doctor@latest`, static checks) next to React Scan. React Scan is still the tool for live, visual render debugging.

## Ground Truth for 0.5.7

Many blog posts, the npm README, and older docs describe features that 0.5.7 does not have. Trust this list over them:

- **Outlines have one color** (purple). Color does not mean count or slowness. There are no grey "unnecessary render" outlines. `trackUnnecessaryRenders` is rejected as `Unknown option`.
- **`×N` on a label is approximate.** Overlapping labels merge, so `Row ×40` can be 40 rows that each rendered once.
- **Only on-screen components get outlines.** Off-screen renders still reach `onRender`.
- **Dead exports:** `onRender(Component, cb)` never fires, `getReport()` is always empty, `useScan` is not a hook (it is `setOptions` + `start`), and `render.changes` in callbacks is always `[]`. Use the `scan({ onRender })` option and compute causes from the fiber yourself (the bundled probe does this).
- **The production guard does not protect you when React Scan loads first.** Verified: a script loaded before a production React build starts and shows the toolbar. Gate it yourself.
- **Options in `localStorage["react-scan-options"]` override code options.** A toolbar toggle saved earlier as `enabled: false` silently stops outlines and `onRender`.
- **The CLI has only `init`.** `npx react-scan <url>` (Playwright mode) and the monitoring API were removed in 0.5.0.
- **0.5.6+ breaks webpack/Rspack builds** of the module import (named JSON import from `react-grab/package.json`, issues #447/#467). Use the script tag, pin 0.5.5, or relax `exportsPresence` (see [troubleshooting.md](references/troubleshooting.md)).

## Workflow

1. **Pick the mode.**
   - *Visual*: a person or a browser tool looks at outlines, the inspector, and the notifications panel.
   - *Headless*: run [`scripts/render-probe.mjs`](scripts/render-probe.mjs) for JSON with render counts, causes, and interaction latency. Use it when you can't watch the screen, and to prove a fix.
   Use both when you can: visual mode to explore, the probe to measure.
2. **Install dev-only, before React, pinned.** Follow [setup.md](references/setup.md) for the framework. Check the project first: an existing `react-scan` import, the React version, the bundler (a module import on webpack/Rspack needs the 0.5.6+ workaround), a CSP that blocks unpkg, and whether the React Compiler is on (`babel-plugin-react-compiler`, `reactCompiler: true`, or `✨` badges).
3. **Name one slow interaction.** Example: "type `shoe` in the product search", "open the filters drawer", "scroll the table". If the user only says "the app is slow", click through the app with the notifications panel open and start with the worst red or orange entry.
4. **Measure a baseline.** Use a dev build and a 4× CPU throttle to imitate a mid-range phone. Take the median of 3–5 runs (`--runs 5`). Record:
   - interaction latency: the total ms in the notifications entry, or `worstInteractionMs` from the probe
   - commits, and renders and self ms per component
   - the time split. Visual mode: the notifications Overview bars (Renders / JavaScript-React Hooks / Update DOM and Draw). Headless mode: `worstInteraction.rendersMs` and `renderShare` (render time inside the interaction) against `durationMs`.
   Save the probe JSON as `before.json`.
5. **Check that React rendering is the bottleneck.**
   - If `renderShare` (or the Renders bar) is small and the time sits in DOM/Draw or plain JavaScript, React Scan cannot fix it. Go to the browser Performance panel.
   - Do not read Event Timing's presentation part as "not React". React work in an `input` or `click` handler can land outside the first entry's processing window. Trust `rendersMs` and `maxProcessingMs`.
   - Skip interactions that are fast (under ~50 ms at 4× throttle) and render little.
   - Do look at about 100 ms at 4× throttle when hundreds of renders sit behind one click. That is usually an easy win.
6. **Find the expensive components and why they rendered.** Use the Ranked view, the probe's `components` (sorted by self ms) and `worstInteraction.topComponents`, and the inspector on one instance. Map each top component to one cause:
   - `mounts` growing for items that stayed in the list → remounts: a random or changing key, or a component defined inside a component
   - `props.<name>` → an unstable prop (inline object, array, function, or JSX). On list rows, `props.item` churn plus `noOwnChange` can also mean `key={index}`: slots get different items, so this shows as prop changes, not mounts.
   - `state.<index>` → that component's own state hook changed
   - `context.<Name>` → a context value changed (often a new value object every render)
   - `noOwnChange` → no prop, queued-state, or context change. Usually a parent cascade. It can also be a `useDeferredValue` or transition re-render, `forceUpdate`, or a ref-driven render.
   Details: [reading-output.md](references/reading-output.md).
7. **Fix the root cause, smallest change first.** Order: move state down or pass children → stabilize the one changing prop or context value → `memo` the expensive child → defer the work (`useDeferredValue`, `startTransition`) → virtualize. With the React Compiler on, do not add manual `memo`, `useMemo`, or `useCallback`. Find why the compiler bailed out, or fix the changing source. Catalog with before/after code: [fix-catalog.md](references/fix-catalog.md).
8. **Re-measure the same scenario** with the same build, throttle, data, and run count. Save `after.json`. `node <skill-dir>/scripts/render-probe.mjs --compare before.json after.json` prints the table. Require all of:
   - lower interaction latency, or fewer renders of the target component (`0` for a component that should not render)
   - no remounts of items that stayed. Mounts equal to the number of items that really entered the view are expected, for example after switching `key={index}` to `key={item.id}`.
   - the same visible behavior.
   Commits can go up and vary between runs after `useDeferredValue` or transitions add background renders. Judge by latency and render ms.
   For non-trivial fixes, cross-check in the React DevTools Profiler or a `<Profiler>`. Turn the check into a Playwright budget if the repo already uses Playwright ([automation.md](references/automation.md)).
9. **Report a before/after table:** latency, commits, the target component's renders and self ms, and the cause fixed. Remove or keep the React Scan setup as the user wants. If it stays, it must be dev-only and pinned.

## Headless Probe

Run it from the app's project root, so `playwright` and `react-scan` resolve from that project's `node_modules`:

```bash
node <skill-dir>/scripts/render-probe.mjs http://localhost:5173/products --steps ./perf/typing.mjs --cpu 4 --runs 5 > perf/before.json
# fix, then:
node <skill-dir>/scripts/render-probe.mjs http://localhost:5173/products --steps ./perf/typing.mjs --cpu 4 --runs 5 > perf/after.json
node <skill-dir>/scripts/render-probe.mjs --compare perf/before.json perf/after.json
```

```js
// perf/typing.mjs: drive one interaction; reset after warm-up so mount noise is dropped
export default async ({ page, reset }) => {
  const search = page.getByRole("textbox", { name: "Search products" }); // "searchbox" only for type="search"
  await search.fill("x"); // warm-up
  await search.fill("");
  await page.waitForTimeout(300);
  await reset();
  await search.pressSequentially("shoe", { delay: 100 });
};
```

The output JSON has:
- `attached`: `false` means React Scan did not hook React. See [troubleshooting.md](references/troubleshooting.md).
- medians: `worstInteractionMs`, `commits`, `totalRenders`
- `worstInteraction`, with `durationMs`, `maxProcessingMs`, `maxInputDelayMs`, `rendersMs`, `renderShare`, and `topComponents`
- `components[]`, with `renders`, `mounts`, `selfMs`, `compiled` (React Compiler), `noOwnChange`, and `props`/`state`/`context` cause counts.

If the app already loads React Scan, add `--no-inject`. Field reference and a worked example: [automation.md](references/automation.md).

Write precise locators. Playwright role locators pierce React Scan's open shadow root, so `getByRole("button")` also matches toolbar buttons.

## Reading the UI, Fast

- **Outlines and labels**: what rendered on screen, about how often. Not how slow, not why.
- **Inspector** (crosshair button, then click a component): select it first, then repeat the interaction. "What changed?" lists Changed Props, State, and Context.
  - ⚠ "Reference changed but objects are structurally the same" → an unstable object or array.
  - "Function reference changed" → an inline callback.
  - An empty list while the component keeps rendering → a parent cascade.
  - State shows as "Nth hook called in X". Map N by counting hook calls in source order.
- **Notifications (bell)**: each slow click or keypress, or an FPS drop over 150 ms. Severity: under 200 ms good, 200–500 ms needs improvement, 500 ms or more poor. Tabs:
  - **Overview**: the time split.
  - **Ranked**: components by self time. **Memoizable** means "re-rendered with no prop, state, or context change". It is a hint, not proof. It has false positives with external stores and the compiler (#378).
  - **Prompts**: "Copy Prompt" gives an LLM-ready summary of the same data.
- **FPS meter**: whole-page frame rate. Treat it as an alarm, not as a metric.

## Rules

- Load React Scan before React, React DOM, and the router: the first `<head>` script with no `async`/`defer`, or the first import of the client entry. A late load sometimes attaches anyway (seen with React 19 dev), but do not rely on that.
- Keep it out of production on purpose: a dev-only script tag, `import.meta.env.DEV`, or `process.env.NODE_ENV === "development"` in a way the bundler removes. Use `react-scan/all-environments` or `dangerouslyForceRunInProduction` only when the user asks to profile a production build.
- Pin the CDN version (`https://unpkg.com/react-scan@0.5.7/dist/auto.global.js`). Unpinned URLs auto-upgrade. 0.5.0 once dropped apps to about 1 FPS (#424).
- Diagnose on dev builds. Production builds have no render times and have minified names. The `react-component-name` plugins only partly restore names (memo-wrapped functions can stay `Anonymous`).
- Measure with `log: false` and the inspector closed. Logging every render is expensive and skews timings.
- Never claim a fix from render counts alone. Show latency or self time, and show that behavior did not change.
- StrictMode doubles dev render work, not commits. Compare before and after under the same StrictMode setting.

## References

- [setup.md](references/setup.md): CLI `init`, script tag vs module import, per-framework recipes (Next.js App/Pages, Vite, React Router v7, Remix, TanStack Start, Astro, Rsbuild, Parcel, CRA, Storybook), dev-only gating, CSP, the Vite plugin, the browser extension, React Native status.
- [api.md](references/api.md): every export path, all `Options` with real behavior, functions, `window.reactScan`, globals, localStorage keys, `react-scan/lite`, `react-component-name`, CLI flags.
- [reading-output.md](references/reading-output.md): outlines, labels, the toolbar, inspector, notifications timing math, Ranked/Memoizable, Prompts, FPS, and a triage table.
- [fix-catalog.md](references/fix-catalog.md): cause → signal → fix, with before/after code for 13 causes, React Compiler interplay, and when not to memo.
- [automation.md](references/automation.md): the probe script in depth, in-app probes, a Playwright budget test, `react-scan/lite`, `<Profiler>`, CPU throttling, the before/after protocol.
- [troubleshooting.md](references/troubleshooting.md): symptoms → causes → fixes with issue numbers (nothing shows, build errors, DevTools conflicts, CSP, iframes, Preact `__H`, names).

## Verification

- `attached: true` from the probe, or the toolbar is visible and outlines flash when you click.
- The baseline and after numbers come from the same interaction, build, throttle, and StrictMode setting.
- The target component's render count or self time went down, and latency did not get worse.
- The functional result is unchanged: same text, rows, focus, and input values.
- React Scan is not in the production bundle unless the user asked for it. Check `dist/` for `react-scan` or `auto.global`.
