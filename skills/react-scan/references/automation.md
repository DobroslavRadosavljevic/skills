# Measuring and Automating

Contents:
- [Bundled Probe Script](#bundled-probe-script)
- [In-Page Probes](#in-page-probes)
- [Browser-Tool Agents (No Playwright)](#browser-tool-agents-no-playwright)
- [In-App Dev Probe](#in-app-dev-probe)
- [Playwright Render Budget Test](#playwright-render-budget-test)
- [When the App Already Loads React Scan](#when-the-app-already-loads-react-scan)
- [Inspector from Automation](#inspector-from-automation)
- [Confirm with React Tools](#confirm-with-react-tools)
- [Before/After Protocol](#beforeafter-protocol)

## Bundled Probe Script

`scripts/render-probe.mjs` loads a URL in Chromium with React Scan injected before any app script (`addInitScript`), runs an optional steps module, and prints JSON. Verified with react-scan 0.5.7, React 19.3, and Playwright 1.64 on Vite dev and production builds.

Requirements:
- Node 18+.
- `playwright` (or `@playwright/test`) and `react-scan` resolvable from the current directory, or `--react-scan <path to auto.global.js>`.
- Chromium installed (`bunx playwright install chromium`).
- Ask before you install anything into the user's project.

```bash
node <skill-dir>/scripts/render-probe.mjs <url> [--steps steps.mjs] [--runs 5] [--cpu 4] [--idle 1000] [--top 25] [--no-inject] [--headed] [--react-scan path]
node <skill-dir>/scripts/render-probe.mjs --compare before.json after.json   # Markdown table
```

| Flag | Effect |
| --- | --- |
| `--steps <file>` | ESM steps module that drives the interaction (contract below). Without it, the probe records load plus `--idle` ms |
| `--runs <n>` | Repeats the scenario in fresh browser contexts and reports medians. Use 3–5 |
| `--cpu <rate>` | Chromium CPU throttle (4 ≈ mid-range phone). Use the same value before and after |
| `--no-inject` | The app already loads React Scan: wrap its `ReactScanInternals.options` instead of injecting a second copy. Injecting anyway was harmless in testing (counts were exact), but this keeps one copy |
| `--idle <ms>` | Wait after the steps before reading (default 1000). Raise it when deferred or transition renders land late |
| `--compare a b` | Prints worst latency, render ms in the worst interaction, commits, total renders, and per-component renders / mounts / selfMs before → after |

Steps module contract:

```js
// perf/typing.mjs
export default async ({ page, reset }) => {
  await page.getByRole("link", { name: "Products" }).click();
  await page.waitForLoadState("networkidle");
  const search = page.getByRole("textbox", { name: "Search products" }); // "searchbox" only matches type="search"
  await search.fill("x"); // warm-up: lazy chunks, JIT
  await search.fill("");
  await page.waitForTimeout(300);
  await reset(); // drop load and warm-up renders; measure only what follows
  await search.pressSequentially("shoe", { delay: 100 });
};
```

Output fields (top-level numbers are medians across `--runs`):

| Field | Meaning |
| --- | --- |
| `attached` | `window.__REACT_SCAN__` appeared in every run, so React Scan hooked React. `false` means nothing below is valid |
| `worstInteractionMs` | Median of each run's slowest Event Timing interaction (INP-style, 8 ms granularity) |
| `commits`, `totalRenders` | React commits and composite renders after the last `reset()`. Memo bailouts are not counted |
| `perRun[]` | Per-run worst ms, commits, and renders. Check them for noise |
| `worstInteraction` | The slowest interaction of the median run. See below |
| `components[]` | Sorted by median `selfMs`, then by `renders`. See below |
| `interactions[]` | Every interaction of the median run, with the same fields as `worstInteraction` |
| `consoleErrors` | Page errors and `console.error` output |
| `reactScanMessages` | `[React Scan]` messages. The react-grab "outdated" warning is harmless |

Interaction fields:
- `types`: Event Timing entries grouped by `interactionId`, such as `keydown`/`keypress`/`keyup` or `pointerdown`/`pointerup`/`click`.
- `durationMs`: the longest entry, i.e. the INP-style latency.
- `maxProcessingMs`: the longest handler time of any entry.
- `maxInputDelayMs`: the longest time before a handler started. A high value usually means earlier work, such as a deferred render, was still running.
- `renders`, `rendersMs`: React renders and their self time inside the interaction window.
- `renderShare`: `rendersMs / durationMs`.
- `topComponents`: the five most expensive components inside the window.

**Read `renderShare`, not Event Timing's processing and presentation split.** React's `onChange` runs in the `input` event and `onClick` in `click`. The entry that starts first (keydown, pointerdown) can show `processingMs: 0` with the whole cost in "presentation", even when React rendering caused all of it.

Each entry in `components[]`, keyed by display name:
- `renders`, `mounts` (`fiber.alternate === null`), `selfMs` (0 on production builds): medians.
- `compiled`: React Compiler memo cache present.
- `props`: changed prop name → count.
- `state`: changed hook index → count, or `class-state`. Only hooks with an update queue are counted: `useState`, `useReducer`, `useSyncExternalStore`, `useActionState`.
- `context`: context `displayName` → count.
- `noOwnChange`: renders with no prop, queued-state, or context change. Usually a parent cascade, but also `useDeferredValue`/transition re-renders, `forceUpdate`, or ref-driven renders.

The cause maps come from the median run.

Give contexts a `displayName` (`ThemeContext.displayName = "ThemeContext"`) to get readable keys. Otherwise they show as `Context`.

Practical notes:
- Warm up once before `reset()`.
- Use precise locators. Role locators pierce React Scan's shadow root, so a bare `getByRole("button")` also matches toolbar buttons.
- Production URLs work (React Scan starts when loaded first), but names are minified and `selfMs` is 0.
- `selfMs` comes from React's dev profiler timers, so dev overhead and StrictMode's double render are included. Use it to compare, not as an absolute number.
- After adding `useDeferredValue` or transitions, commits can go up and vary between runs. Background renders are not blocking. Judge by `worstInteractionMs` and `rendersMs`.
- With index keys, filtering shows as `props.<item>` churn on rows, not as mounts. After switching to stable keys, mounts equal to the number of items that entered the view are expected.

### Worked Example (Measured)

A shop page has:
- a search input in `Shop` (state at the top)
- `SalesSummary` (expensive, props constant)
- 300 `ProductRow`s with `key={index}`, each reading one `CartContext` value `{ items, add }` that is rebuilt every render.

Typing "hats", 4× throttle, median of 3–5 runs:

| Probe signal (before) | Cause | Fix |
| --- | --- | --- |
| `worstInteraction`: `durationMs 224`, `maxProcessingMs 187`, `renderShare 0.89`, top: SalesSummary, ProductRow, Shop | The time is React rendering | Continue with React fixes |
| `SalesSummary`: `renders 4`, `noOwnChange 4`, `selfMs 174` | Parent cascade into an expensive child | `memo(SalesSummary)` |
| `ProductRow`: `renders 1200`, `props.product 597`, `noOwnChange 603`, `mounts 0` | Index keys plus cascade into every row | `key={product.id}`, `memo(ProductRow)` |
| `Shop`: `state {"0": 4}`, `selfMs 64` | Filtering and reconciling 300 rows synchronously with each keystroke | Move the list into `memo(ProductList)` and pass it `useDeferredValue(query)` |
| Click "Add": `ProductRow` `renders 900`, `context {"Context": 900}` | Context value identity, and a context that holds too much: rows need only `add` | Split into items and actions contexts; stable `add` via `useCallback` |

Result:
- Typing: 224 → 72 ms. SalesSummary renders 4 → 0. ProductRow renders 1200 → 320, and those 320 are mounts of rows entering the list, which is correct.
- Add: 112 → 16 ms. ProductRow renders 900 → 0.
- Visible rows, text, and cart count unchanged.

## In-Page Probes

`scripts/commit-probe.js`, `scripts/layout-probe.js`, and `scripts/frame-probe.js` are plain browser scripts with no imports. Each one is one function call that puts an object on `window` (`__commitProbe`, `__layoutProbe`, `__frameProbe`) with `start(options)` (not on the frame probe), `reset()`, `stop()`, and `report()`. `report()` returns plain data, so an "evaluate JavaScript" tool can return it directly. A second paste stops the first copy. Verified with React 19.3 and react-scan 0.5.7 (commit probe) and headless Chromium (layout and frame probes).

### Load a probe

| Situation | How |
| --- | --- |
| Devtools console, or a browser tool that evaluates text | Paste the whole file. The last value is the start message |
| Playwright | `await page.evaluate(readFileSync("<skill-dir>/scripts/layout-probe.js", "utf8"))` after the page loads. `page.addInitScript({ path })` also works for the layout and frame probes |
| The file is too long to paste, and the dev server can serve it | Copy it into a folder the dev server serves, then `await import("/path/to/commit-probe.js?t=" + Date.now())`. An import from the same origin passes a CSP with `script-src 'self'` |

Do not load a probe with `eval(await (await fetch(url)).text())` on a page with a script CSP: the page blocks `eval` unless the policy has `'unsafe-eval'`.

A full page load removes the probes. Client-side navigation keeps them.

### Commit probe

It wraps `__REACT_DEVTOOLS_GLOBAL_HOOK__.onCommitFiberRoot`, so it needs a hook that was on the page before React started: React Scan, bippy, or the React DevTools extension. Without a hook it returns a message and does nothing.

| Option | Default | Effect |
| --- | --- | --- |
| `watch` | `[]` | Display names to track. Empty tracks every named component |
| `ignore` | `[]` | Display names to skip in watch-all mode (head tags, icons, library wrappers) |
| `pathDepth` | `10` | Named or keyed ancestors shown in each path. The probe compares whole paths, so this changes only the report text |
| `fullWalk` | `false` | Visit every fiber on each commit. The default follows `subtreeFlags` and visits only subtrees with a mount or a removal |

| Report field | Meaning |
| --- | --- |
| `commits`, `mounts`, `deletions` | Totals since `start()` or `reset()` |
| `remounted[]` | Paths that mounted more than once, with the count. `alsoRemoved: true` means the same path was also removed: a real remove-and-mount cycle. Only the first tracked component of a removed subtree gets it; the components inside it show `false` |
| `lastMounts[]` | The newest mounts: time `t`, component, path |
| `lastDeletions[]` | The newest removed subtrees: the first tracked component inside, the removed top node, the path, and `parentChildrenAfter` |
| `error` | An error inside the probe. The app is not affected |

Notes:
- A path is built from display names, keys, and sibling indexes, innermost first: `Row[42] < List < Page`. Long keys keep both ends.
- Components mounted before `start()` are the baseline and do not count.
- Start with a short `watch` list on a large page. Watch-all mode records at most 500 mounts in `lastMounts`, but counts all of them.
- A list that adds 20 rows shows 20 mounts and no `remounted` entry. That is correct. A row path in `remounted` while the row stayed on screen is the bug.
- Two siblings with the same name and the same key text share a path and can show as `remounted`. Put that name in `ignore`.
- StrictMode's second effect pass makes no new fiber, so it adds nothing. A hot reload does remount the edited module: reload the page after an edit, then measure.
- The React Compiler memoizes values. It does not change keys or element types, so it does not cause or hide remounts.

### Layout probe

It samples the scroll container once per frame, in a task after the frame (after the paint), and watches elements with a `ResizeObserver` and the browser's Layout Shift entries.

| Option | Default | Effect |
| --- | --- | --- |
| `scroller` | page scroller | CSS selector of the scroll container |
| `observe` | children and grandchildren of the scroller | CSS selector of the elements to watch for shrinking. Elements added later are watched too |
| `shrinkPx` | `20` | Height loss in one step that counts as a shrink |
| `dropPx` | `30` | Scroll height loss in one frame that counts as a jump |
| `jumpPx` | `150` | Scroll position change in one frame that counts as a jump |

| Report field | Meaning |
| --- | --- |
| `frames` | Samples taken. `0` means the tab is hidden or in the background: bring it to the front |
| `jumps[]` | Frames with a height drop or a position jump: `dHeight`, `dTop`, and `msSinceInput` (under about 100 means the person scrolled; `null` means no input yet) |
| `shrinks[]` | Elements that lost height: `from`, `to`, and a short description (tag, id, test id, role, first classes) |
| `shifts[]`, `shiftTotal` | Layout Shift entries with no recent input and the elements that moved (Chromium) |

Notes:
- A list that hides and shows again reports one large negative `dHeight` and then the same value positive. That pair is the visible flicker.
- A virtual list changes its scroll height as rows are measured. Raise `dropPx`, or judge by `shrinks` and `shifts`.
- Give `observe` a selector for the real content blocks (message rows, cards) when the default two levels are not deep enough.

### Frame probe

It records Event Timing entries (16 ms or more) grouped by interaction, and Long Animation Frames (50 ms or more) with their scripts. Browsers without Long Animation Frames get Long Tasks, which carry no script names.

| Report field | Meaning |
| --- | --- |
| `supported` | Which of the three sources this browser has |
| `worstInteractionMs` | The slowest interaction since `reset()` |
| `interactions[]` | `types`, `durationMs`, `inputDelayMs`, `processingMs`, and the target element, slowest first |
| `longFrames[]` | `durationMs`, `blockingMs`, `renderMs` (style, layout, and paint part), and up to five `scripts` with `ms`, `layoutMs` (forced layout), `invoker`, function, and file |
| `blockingMs` | The sum of blocking time of all long frames |

Notes:
- Call `__frameProbe.reset()` after warm-up, the same as `reset()` in a steps module.
- The frame probe says where the time went by script. It does not say which component rendered: use the render probe or the `onRender` snippet below for that.
- In a dev build, the function names are readable. In a production build they are minified, but the file name still points at the chunk.
- The numbers come from one run in a normal tab. For medians, CPU throttle, and a before/after table, use `scripts/render-probe.mjs`.

## Browser-Tool Agents (No Playwright)

If you drive a browser through a generic tool (navigate, click, evaluate JS), React Scan must already be on the page: use the dev-only setup from [setup.md](setup.md). Then evaluate this in the page after load, run the interaction, and read the result:

```js
// paste into the page (devtools console or an "evaluate JavaScript" tool)
(() => {
  const stats = {};
  window.__renderStats = stats;
  window.reactScan?.({
    onRender: (fiber, renders) => {
      for (const render of renders) {
        const name = render.componentName ?? "Anonymous";
        const entry = (stats[name] ??= { renders: 0, mounts: 0, selfMs: 0, props: {} });
        entry.renders += 1;
        entry.selfMs += render.time ?? 0;
        if (!fiber.alternate) { entry.mounts += 1; continue; }
        const previous = fiber.alternate.memoizedProps ?? {};
        const next = fiber.memoizedProps ?? {};
        for (const key of new Set([...Object.keys(previous), ...Object.keys(next)])) {
          if (!Object.is(previous[key], next[key])) entry.props[key] = (entry.props[key] ?? 0) + 1;
        }
      }
    },
  });
  return "probe installed";
})();
// ...perform the interaction, then:
// JSON.stringify(Object.entries(window.__renderStats).sort((a, b) => b[1].selfMs - a[1].selfMs).slice(0, 20))
```

- With the module import (no `window.reactScan`), use `__REACT_SCAN__.ReactScanInternals` ([below](#when-the-app-already-loads-react-scan)).
- Outlines must be on: the toolbar toggle pauses `onRender`.
- A screenshot of the notifications panel (Overview + Ranked) is a quick way to report the time split.

## In-App Dev Probe

Use it when you want the counters inside the app (for example to expose them to an existing E2E suite). Import it as the **first** line of the client entry, dev only:

```ts
// src/dev/render-probe.ts
import { scan } from "react-scan";

interface RenderStat {
  renders: number;
  mounts: number;
  selfMs: number;
}

declare global {
  interface Window {
    __renderStats?: Record<string, RenderStat>;
    __commitCount?: number;
  }
}

window.__renderStats = {};
window.__commitCount = 0;

scan({
  enabled: true, // outlines must stay on: paused outlines also pause onRender
  onCommitFinish: () => {
    window.__commitCount = (window.__commitCount ?? 0) + 1;
  },
  onRender: (fiber, renders) => {
    for (const render of renders) {
      const stats = (window.__renderStats ??= {});
      const stat = (stats[render.componentName ?? "Anonymous"] ??= { renders: 0, mounts: 0, selfMs: 0 });
      stat.renders += 1;
      stat.selfMs += render.time ?? 0;
      if (!fiber.alternate) stat.mounts += 1; // render.phase is unreliable for the first update
    }
  },
});
```

To filter one component, compare `fiber.type` (unwrap memo with `fiber.type?.type ?? fiber.type`) or `render.componentName`. Do not use the exported `onRender(Component, cb)`; it is a no-op in 0.5.7.

## Playwright Render Budget Test

Add this only when the repo already has Playwright. Prefer count budgets for hard gates (deterministic), and keep millisecond budgets loose (CI machines are noisy).

```ts
// e2e/perf/search-render-budget.spec.ts
import { createRequire } from "node:module";
import { expect, test, type Page } from "@playwright/test";

const require = createRequire(import.meta.url);
const REACT_SCAN = require.resolve("react-scan/dist/auto.global.js");

const installProbe = async (page: Page) => {
  await page.addInitScript({ path: REACT_SCAN }); // must run before the app's scripts
  await page.addInitScript(() => {
    const w = window as any;
    w.__stats = {};
    w.__commits = 0;
    w.__latency = [];
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as any[]) if (entry.interactionId) w.__latency.push(entry.duration);
    }).observe({ type: "event", durationThreshold: 16, buffered: true } as PerformanceObserverInit);
    w.reactScan({
      onCommitFinish: () => (w.__commits += 1),
      onRender: (fiber: any, renders: any[]) => {
        for (const render of renders) {
          const stat = (w.__stats[render.componentName ?? "Anonymous"] ??= { renders: 0, mounts: 0 });
          stat.renders += 1;
          if (!fiber.alternate) stat.mounts += 1;
        }
      },
    });
  });
};

const resetProbe = (page: Page) =>
  page.evaluate(() => Object.assign(window as any, { __stats: {}, __commits: 0, __latency: [] }));
const readProbe = (page: Page) =>
  page.evaluate(() => {
    const w = window as any;
    return { stats: w.__stats, commits: w.__commits, worst: Math.max(0, ...w.__latency) };
  });

test("typing in product search does not re-render the chart", async ({ page }) => {
  await installProbe(page);
  await page.goto("/products");
  await page.waitForFunction(() => Boolean((window as any).__REACT_SCAN__));
  const search = page.getByRole("textbox", { name: "Search products" });
  await search.fill("s"); // warm-up
  await resetProbe(page);

  await search.pressSequentially("hoe", { delay: 50 });
  await expect(page.getByRole("row")).toHaveCount(5); // behavior first

  const { stats, commits, worst } = await readProbe(page);
  expect(stats.SalesChart?.renders ?? 0).toBe(0); // must not render at all
  expect(stats.ProductRow?.mounts ?? 0).toBe(0); // no remounts while typing
  expect(commits).toBeLessThanOrEqual(6);
  expect(worst).toBeLessThan(200); // loose latency guard
});
```

Notes:
- `addInitScript` also runs in iframes, but React Scan skips iframes unless `allowInIframe: true`.
- Each test gets a fresh context, so a stale `react-scan-options` in localStorage cannot disable the probe. If you reuse a `storageState`, clear keys that start with `react-scan`.
- CPU throttling (Chromium only): `const cdp = await page.context().newCDPSession(page); await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });`.
- Chrome trace for the Performance panel: `await browser.startTracing(page, { path: "trace.json" })` … `await browser.stopTracing()`.

## When the App Already Loads React Scan

With the bundled probe, pass `--no-inject`. In your own tests, do not inject a second copy: wrap the existing options signal after React attaches. This is the pattern React Scan's own E2E tests use. It relies on internal API that works in 0.5.7:

```ts
await page.waitForFunction(() => Boolean((window as any).__REACT_SCAN__?.ReactScanInternals));
await page.evaluate(() => {
  const internals = (window as any).__REACT_SCAN__.ReactScanInternals;
  const previous = internals.options.value;
  (window as any).__renderCount = 0;
  internals.options.value = {
    ...previous,
    onRender: (...args: unknown[]) => {
      (window as any).__renderCount += 1;
      previous.onRender?.(...args);
    },
  };
});
```

## Inspector from Automation

Use the UI path. Locators pierce the open shadow root:

```ts
await page.locator("#react-scan-inspect-element").click(); // enter inspect mode
await page.mouse.move(0, 0);
const box = await page.getByTestId("sales-chart").boundingBox();
await page.mouse.move(box!.x + 10, box!.y + 10);
await page.mouse.click(box!.x + 10, box!.y + 10); // focus the component
// repeat the interaction, then read the panel text
const whyText = await page.locator(".react-scan-inspector").innerText();
```

The notification store is not exposed on `window`. To read slowdown data, screenshot the panel, or use Event Timing as above.

## Confirm with React Tools

**React DevTools Profiler:**
1. Settings → Profiler → turn on "Record why each component rendered while profiling".
2. Record the interaction.
3. Read the flame or ranked chart and "Why did this render?". It names hooks and says "The parent component rendered".
4. Components → settings → "Highlight updates when components render" is the built-in equivalent of outlines.

**`<Profiler>` API**, for numbers in code or tests:

```tsx
import { Profiler, type ProfilerOnRenderCallback } from "react";

const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration) => {
  ((window as any).__profiler ??= []).push({ id, phase, actualDuration, baseDuration });
};

<Profiler id="ProductTable" onRender={onRender}>
  <ProductTable />
</Profiler>;
```

`actualDuration` is the time spent rendering the subtree in this commit. `baseDuration` is the estimated cost without memoization. When memoization works, `actualDuration` drops well below `baseDuration`.

**Chrome Performance panel with React Performance Tracks** (React 19.2+, on by default in dev):
- The Scheduler track shows lanes: Blocking, Transition, Suspense, Idle. It also shows "Cascading update" markers that point at the `setState` that caused another render pass.
- The Components track is a flame chart of render and effect time.
- For production-like numbers, alias `react-dom/client` → `react-dom/profiling`.

**Field data:** `web-vitals` `onINP` with attribution. Lab numbers from Playwright are a proxy. Throttle the CPU and repeat runs.

## Before/After Protocol

1. Keep the conditions the same: route, data, build mode, StrictMode, CPU throttle, viewport, warm-up. Take the median of 3–5 runs (`--runs 5`). `--compare before.json after.json` prints most of the table below.
2. Record this table in the PR or the report:

   | Metric | Source | Before | After |
   | --- | --- | --- | --- |
   | Worst interaction latency (ms) | probe `worstInteractionMs` / notifications total | | |
   | Render ms and share in the worst interaction | probe `worstInteraction.rendersMs` / `renderShare` | | |
   | Time split (Renders / JS / DOM+Draw) | notifications Overview | | |
   | Commits per interaction | probe `commits` | | |
   | Target component renders / mounts | probe `components[]` | | |
   | Target component self ms | probe `selfMs` | | |
   | Subtree `actualDuration` vs `baseDuration` | `<Profiler>` (optional) | | |

3. Assert that behavior did not change: visible text, row counts, focus, input values. Bad memoization shows up as stale UI.
4. Cross-check one non-trivial fix in the React DevTools Profiler or a trace.
5. Look for regressions:
   - stale closures
   - effects that stopped running
   - transitions with no pending indicator
   - virtualization that broke find-in-page or accessibility.
