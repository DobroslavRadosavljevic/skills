# API Reference (react-scan 0.5.7, source-verified)

Contents:
- [Export Paths](#export-paths)
- [Options](#options)
- [Functions](#functions)
- [Callback Payload](#callback-payload)
- [Globals, DOM, and Storage](#globals-dom-and-storage)
- [react-scan/lite](#react-scanlite)
- [react-component-name Plugins](#react-component-name-plugins)
- [CLI](#cli)
- [Changes Since 0.4](#changes-since-04)

## Export Paths

| Import | What it is |
| --- | --- |
| `react-scan` | Full tool: installs the hook on import (side effect), toolbar UI, outlines. Under the `react-server` condition it resolves to a no-op shim (`rsc-shim`), so a Server Component import cannot crash. The `production` condition does **not** shim it. |
| `react-scan/all-environments` | Exports only `scan`. Sets `runInAllEnvironments`, which skips the production check **and** the iframe check. |
| `react-scan/install-hook` | Installs `__REACT_DEVTOOLS_GLOBAL_HOOK__` without the UI (`export { getRDTHook as init }` from bippy). Also ships as IIFE `dist/install-hook.global.js`. Use it to install the hook early and load the UI later. |
| `react-scan/lite` | Headless profiling event stream with no UI or Preact. See below. |
| `react-scan/dist/auto.global.js` | IIFE build. Calls `scan()` and sets `window.reactScan = scan`. The package `browser` field points here, so `unpkg.com/react-scan` serves it. |
| `react-scan/react-component-name/{vite,webpack,esbuild,rspack,rollup,rolldown,astro}` | Babel unplugin that adds `displayName`s. |
| `react-scan/auto` | Broken in 0.5.7: the dev condition points to unpublished files. Do not use it. |
| `react-scan/react-component-name/loader` | Declared in `exports` but not published in 0.5.7. |

Side effects of importing any non-lite entry:
- installs the DevTools hook (bippy)
- polyfills `Array.prototype.toSorted`.

Every dist file starts with `'use client'`. Each entry bundles its own copy of the internal state, so never import both `react-scan` and `react-scan/all-environments`.

## Options

```ts
interface Options {
  enabled?: boolean;                         // default true
  dangerouslyForceRunInProduction?: boolean; // default false
  log?: boolean;                             // default false
  showToolbar?: boolean;                     // default true
  animationSpeed?: "slow" | "fast" | "off";  // default "fast"
  showFPS?: boolean;                         // default true
  showNotificationCount?: boolean;           // default true
  allowInIframe?: boolean;                   // default false
  safeArea?: number | { top?: number; right?: number; bottom?: number; left?: number }; // default 24
  useOffscreenCanvasWorker?: boolean;        // default true
  onCommitStart?: () => void;
  onRender?: (fiber: Fiber, renders: Array<Render>) => void;
  onCommitFinish?: () => void;
  trackUnnecessaryRenders?: boolean;         // DEAD: rejected as "Unknown option"
  _debug?: "verbose" | false;                // rejected by scan/setOptions (see below)
}
```

| Option | Real behavior |
| --- | --- |
| `enabled` | `scan({ enabled: false })` does not start at all, unless `showToolbar: true` is also passed: then the toolbar shows with outlines paused. At runtime, `setOptions({ enabled })` pauses or resumes. The toolbar toggle saves `enabled` to localStorage, and **the saved value beats the value in code**. |
| `dangerouslyForceRunInProduction` | Skips only the production check, not the iframe check. The check itself only fires when React registered a production renderer before `scan()` ran. |
| `log` | `console.group` per rendered component: `Name (1.23ms)`, prefixed `✨` when compiled by the React Compiler. The group body is empty (no change data). Expensive; never measure with it on. |
| `showToolbar` | Mounts or removes the toolbar (a Preact app in the open shadow root `#react-scan-root`). |
| `animationSpeed` | Only affects the inspector hover highlight. Render outlines always fade over 45 frames. |
| `showFPS`, `showNotificationCount` | Show the FPS meter and the red badge on the bell. |
| `allowInIframe` | `scan()` returns early when `window.self !== window.top` unless this is set. |
| `safeArea` | Toolbar inset from the viewport edges (for the Next.js dev indicator and similar overlays). |
| `useOffscreenCanvasWorker` | Draws outlines in a `blob:` worker. Set `false` under a strict `worker-src` CSP. It falls back to the main thread on error anyway. |
| `onCommitStart` / `onCommitFinish` | Called once per root commit, around the fiber walk. |
| `onRender` | Called once per **rendered composite** fiber (accurate: memo bailouts are excluded). **Not called while outlines are paused and the inspector is off.** Fibers whose props object is in `ignoredProps` are skipped. |
| `_debug: "verbose"` | Logs internal errors. To set it: `ReactScanInternals.options.value = { ...ReactScanInternals.options.value, _debug: "verbose" }`. |

Unknown or invalid options print one `console.warn("[React Scan] Invalid options: ...")` and are dropped.

## Functions

```ts
scan(options?: Options): void            // setOptions → iframe check → enabled check → start()
setOptions(options: Partial<Options>): Options | undefined // validate, merge, persist to localStorage
getOptions(): Signal<Options>            // @preact/signals signal: read .value
start(): void                            // production check → version ping → merge localStorage → instrument
getIsProduction(): boolean | null        // null = no renderer registered yet
useScan(options?: Options): void         // NOT a hook: setOptions + start, no iframe/enabled checks (#460)
ignoreScan(node: ReactNode): void        // adds an object to ignoredProps (matched by props identity)
ignoredProps: WeakSet<object>
onRender(type, cb): void                 // NO-OP in 0.5.7: the callback is never called
getReport(type?): ...                    // NO-OP in 0.5.7: always an empty Map / null
Store, ReactScanInternals                // internal state; see Globals
```

`ignoreScan` matches by the **props object identity** of the fiber (`memoizedProps`), not by component. Passing a JSX element does nothing. In practice, call `ignoreScan(props)` inside the component body (the props identity changes on each parent render). It hides only that fiber, not its subtree.

The production check runs once, in `start()`. React Scan starts when no renderer is registered yet (`null`). In practice it is blocked only when `scan()` runs after a production React has loaded, for example inside `useEffect` in a production build. There is no console message when it refuses.

`start()` logs `[React Scan] Failed to load. Must import React Scan before React runs.` after 5 s if instrumentation never became active.

## Callback Payload

```ts
// not exported; shape from core/instrumentation.ts
interface Render {
  phase: 1 | 2 | 4;            // Mount | Update | Unmount. UNRELIABLE: see below
  componentName: string | null;
  time: number | null;         // self time ms (fiber actualDuration minus children); 0 on production React
  count: number;               // always 1
  forget: boolean;             // React Compiler memo cache present
  changes: Array<Change>;      // always [] (change tracking is off)
  unnecessary: boolean | null; // always null
  didCommit: boolean;
  fps: number;
}
```

Verified behavior with React 19:
- The first update after the initial mount arrives as `phase: 1`.
- Unmounts (`phase: 4`) do not arrive.
- Real remounts (key change) arrive as `phase: 1`.
- **Use `fiber.alternate === null` to detect a mount.**

Compute causes from the fiber (the bundled probe does this):
- props: compare `fiber.memoizedProps` with `fiber.alternate.memoizedProps` key by key with `Object.is`
- state: walk the `fiber.memoizedState` hook list in parallel with the alternate's, and report the indexes where `hook.queue` exists and `memoizedState` changed
- context: walk `fiber.dependencies.firstContext` in parallel with the alternate's, and compare `memoizedValue`
- none of the three → the parent rendered (cascade).

`Fiber`, `Render`, and `Change` are not exported. Type `fiber` as `any`, or import `Fiber` from `bippy`.

## Globals, DOM, and Storage

| Name | Meaning |
| --- | --- |
| `window.reactScan` | `scan`, set by `auto.global.js`. |
| `globalThis.__REACT_SCAN__ = { ReactScanInternals }` | Set when React attaches. Use it as the "attached" signal. Not set under the browser extension. |
| `ReactScanInternals.options` | The options signal. Writing `.value` takes effect immediately; `onRender` is read on every render. Tests can wrap it. |
| `ReactScanInternals.instrumentation.isPaused` | Signal; `true` when outlines are toggled off. |
| `Store.inspectState` | Signal: `uninitialized` / `inspect-off` / `inspecting` / `focused` (with `fiber`, `focusedDomElement`). |
| `globalThis.__REACT_SCAN_STOP__` | Set before load to keep React Scan from starting. |
| `window.hideIntro` | Truthy suppresses the console intro. |
| `window.__REACT_SCAN_EXTENSION__` | Set by the browser extension. |
| `#react-scan-root` | Toolbar host (open shadow root). Locators pierce it. |
| `[data-react-scan]` | Outline canvas host (`pointer-events: none`). |
| Stable selectors | `#react-scan-inspect-element`, `#react-scan-notifications`, `.react-scan-toggle input[type="checkbox"]`, `.react-scan-inspector`. |

localStorage keys:
- `react-scan-options`: merged **over** code options at start
- `react-scan-widget-settings-v2`, `react-scan-widget-collapsed-v1`, `react-scan-widget-last-view-v1`: toolbar position, size, and last view
- `react-scan-notifications-audio`.

Clear them with `Object.keys(localStorage).filter((key) => key.startsWith("react-scan")).forEach((key) => localStorage.removeItem(key))`.

## react-scan/lite

A headless event stream for agents, test harnesses, and custom collectors. It has no toolbar and no Preact. It must load before `react-dom`, just like the full build.

```ts
import { instrument } from "react-scan/lite";

const handle = instrument({
  onEvent: (event) => { /* LiteEvent */ },
  recordChangeDescriptions: true, // props / hooks / context / parent per fiber
  includeFiberIdentity: true,     // stable fiberId
  includeProfilingHooks: false,   // true hijacks React DevTools' Timeline channel until stop()
  // endpoint: "https://collector.local/ingest", sessionId: "run-42", // POST each event (keepalive)
  // includeFiberSource: true,    // { fileName, lineNumber, columnNumber } + ownerName
  // includeFiberTree: true (default), maxFibersPerCommit: 5000, minFiberActualDurationMs: 0,
  // includeLaneLabels: true (default), location: "ReactScanLite"
});
handle.subscribe((event) => {}); handle.isActive(); handle.stop(); // window.__REACT_SCAN_LITE__ is the singleton
```

Event kinds:
- hook events: `renderer-injected`, `profiling-hooks-status`, `commit`, `post-commit`, `fiber-unmount`
- profiling-hook events (dev/profiling builds of React 16.5–19.1): `render-start`/`render-stop`, `commit-start`/`commit-stop`, `component-render-start`/`component-render-stop`, layout/passive effect start/stop, `state-update`, `component-suspended`, `component-errored`
- `profiling-hooks-status.reason` `no-inject-method` means React 19.2+ or a non-profiling build.

`commit` events carry `tree: LiteFiberSummary[]` with:
- `name`, `depth`, `tag`, `actualDuration`, `actualStartTime`, `selfBaseDuration`, `treeBaseDuration`
- `changeDescription: { isFirstMount, props: string[] | null, state, context, hooks: number[], parent }`

**Caveat (verified):** the tree is the **whole** fiber tree, and memo components that bailed out still have `actualDuration > 0`. A memo component with `parent: true` and no prop, hook, or context change **did not render**. Filter it:

```ts
const MEMO_TAGS = new Set([14, 15]);
const didRender = (fiber: LiteFiberSummary) => {
  const description = fiber.changeDescription;
  if (!description) return false; // host or other non-composite fiber
  if (description.isFirstMount) return true;
  const ownChange = (description.props?.length ?? 0) > 0 || description.hooks.length > 0 || description.context || description.state;
  if (ownChange) return true;
  return description.parent && !MEMO_TAGS.has(fiber.tag); // a non-memo child of a rendering parent re-rendered
};
```

`hooks` indexes are approximate: they also flag `useMemo`/`useCallback`/effect slots. For exact "which components rendered" data, prefer `scan({ onRender })`, or the bundled probe, which uses React Scan's accurate render detection.

## react-component-name Plugins

They preserve component names in minified builds by inserting `Name.displayName = "Name"` after component definitions:
- PascalCase function declarations and arrow/function expressions
- React classes
- `memo`/`forwardRef`/`createClass` calls
- `withX(...)` HOCs
- styled-components and @emotion/styled.

```ts
// vite.config.ts
import reactComponentName from "react-scan/react-component-name/vite";
export default defineConfig({ plugins: [react(), reactComponentName()] });
```

Options:

```ts
{
  include?: FilterPattern; // default "**/*.{mtsx,mjsx,tsx,jsx}"
  exclude?: FilterPattern; // default node_modules, Next _app/_document, api/**
  flags?: { noTryCatchDisplayNames?: boolean; noStyledComponents?: boolean; ignoreComponentSubstrings?: string[] };
}
```

- `enforce` and `flags.noCreateContext` are ignored.
- `unplugin` is an optional dependency; install it if the import fails.
- Verified with Vite 8: plain function components got real names in production, but `const X = memo(function X() {})` still showed as `Anonymous`.
- The goal is readable production profiles. For diagnosis, use a dev build.

## CLI

```text
react-scan init [-y|--yes] [-c|--cwd <dir>] [--skip-install]
react-scan -V | --version
```

See [setup.md](setup.md#cli-init) for what `init` edits.

## Changes Since 0.4

- **0.5.0**: removed the monitoring module (`react-scan/monitoring*`, `<Monitoring>`) and the Playwright CLI (`npx react-scan <url>`); added `init`. It caused an infinite-mount regression (#424), fixed in 0.5.1.
- **0.5.4**: added `react-scan/lite`.
- **0.5.5**:
  - fixed Next.js dev being detected as production (#402)
  - added `safeArea` and `useOffscreenCanvasWorker`
  - es2019 bundle target
  - copy-element shortcut (⌘C/Ctrl+C) via react-grab, plus a version ping.
- **0.5.6**: named JSON import that breaks webpack/Rspack (#447, #467).
- **0.5.7**:
  - `react-doctor@latest` dependency
  - Tailwind v4 toolbar styles that render wrong in Chromium shadow DOM (#463: toggle thumbs, resize handles)
  - GitHub Releases stop at v0.4.3, so read `packages/scan/CHANGELOG.md` and the PRs.
- The npm README still documents removed features: the URL CLI, `onPaintStart`/`onPaintFinish`, and `trackUnnecessaryRenders`.
