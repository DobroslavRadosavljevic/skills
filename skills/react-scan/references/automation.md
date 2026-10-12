# Measuring and Automating

Contents:
- [Bundled Probe Script](#bundled-probe-script)
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
