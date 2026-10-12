# Troubleshooting

Issue numbers refer to `https://github.com/aidenybai/react-scan/issues/<n>`. Status is as of react-scan 0.5.7.

Contents:
- [Nothing Shows](#nothing-shows)
- [Build and Import Errors](#build-and-import-errors)
- [Runtime Errors](#runtime-errors)
- [Wrong or Missing Data](#wrong-or-missing-data)
- [Toolbar Problems](#toolbar-problems)
- [Environment Limits](#environment-limits)

## Nothing Shows

Check these in order:

1. **Persisted toggle.** `localStorage["react-scan-options"]` holds `{"enabled": false}` from an earlier toolbar click, and it overrides code. Run `localStorage.removeItem("react-scan-options")` and reload.
2. **Load order.** After 5 s the console shows `[React Scan] Failed to load. Must import React Scan before React runs.` Fixes:
   - Make the script the first tag in `<head>`, synchronous (no `async`, `defer`, or `type="module"`).
   - Make `import "react-scan"` the first import of the entry, above React, React DOM, and the router.
   - In Next.js, don't use `next/script` with the default `afterInteractive`. Use `beforeInteractive` or a plain `<script>`.
   - Hard-refresh after changes (#162).
3. **Iframe.** Storybook, embedded apps, and previews are iframes. Pass `allowInIframe: true` (see [setup.md](setup.md#storybook)).
4. **`scan({ enabled: false })`** without `showToolbar: true` means React Scan never starts. `useScan` ignores `enabled: false` (#460).
5. **Production check.** `scan()` called in `useEffect` on a production React build returns silently. Use a dev build, or `react-scan/all-environments`.
6. **Next.js dev seen as production** (before 0.5.5, #402, #413): the dev overlay registers a production React. Upgrade to 0.5.5 or later, or use `react-scan/all-environments` behind your own dev check.
7. **Plain `<script />` in HTML** (not JSX) swallows the rest of the page (#325). Write `</script>`.
8. **Insecure origin.** A LAN IP over http lacks secure-context APIs (#274). Use localhost or https.
9. **Preact app.** Not supported. React Scan instruments React renderers only (#162).
10. **Outlines exist but you can't see them.** Only on-screen components with DOM get outlines. Scroll the component into view, or use the probe.

Signs that React Scan attached: `window.__REACT_SCAN__` is defined, the console printed the `[·] React Scan` intro, and `#react-scan-root` exists.

## Build and Import Errors

| Error | Cause | Fix |
| --- | --- | --- |
| `Can't import the named export 'version' ... from default-exporting module (only default export is available)` (webpack, `next build --webpack`, Rspack/Rsbuild) | 0.5.6+ imports `react-grab/package.json` by name (#447, #467, open) | Use the script tag; or pin `react-scan@0.5.5`; or add a rule for react-scan with `parser: { exportsPresence: false }` (snippet below) |
| `Do not use scan directly in a Server Component module` / `"scan" is not exported by rsc-shim` | The import resolved to the `react-server` shim (#310, #350, #386, #125) | Call `scan()` only from a `"use client"` module, or use the script tag. Use `react-scan/all-environments` if you need it in prod |
| `ERR_REQUIRE_ESM` from `react-component-name` in ESM Next configs (#245); `ReactComponentName is not a function` on Rspack (#142) | unplugin loader interop | Use the bundler-specific ESM import and `.default` where needed, or skip the plugin and diagnose on dev builds |
| `Package subpath './auto' is not defined` / 404 for `dist/auto.mjs` | `react-scan/auto` is broken in 0.5.7 | Import `react-scan` and call `scan()`, or use `react-scan/dist/auto.global.js` |
| Vite: `/node_modules/.vite/deps/sw.js` / optimizer errors (#244) | The dep optimizer pre-bundles react-scan | `optimizeDeps: { exclude: ["react-scan"] }`, or use the dev script plugin from setup.md |
| Peer warnings from `@react-scan/vite-plugin-react-scan` on Vite 7/8 | Its peer range stops at Vite 6 | Use the inline dev plugin from setup.md |
| CI fails after a new `react-doctor` or `react-grab` release | 0.5.7 depends on both at `"latest"` (#468, #471) | Commit the lockfile; pin them with `overrides` / `resolutions` / `pnpm.overrides` |
| Host app CSS changes after install (Tailwind v4 source detection, #270) | Tailwind scans react-scan files | `@import "tailwindcss" source(".");` or add a `@source not` rule for node_modules |

Webpack workaround for #447:

```js
// webpack.config.js, or next.config.js → webpack(config) { config.module.rules.push(...) }
module.exports = {
  module: {
    rules: [{ test: /\.m?js$/, include: /node_modules[\\/]react-scan/, parser: { exportsPresence: false } }],
  },
};
```

## Runtime Errors

| Error | Cause | Fix |
| --- | --- | --- |
| `Cannot read properties of undefined (reading '__H')` / "React Scan ran into a problem" | Preact (React Scan's UI) gets duplicated or wrongly resolved by the app bundler, typically with the module import in Next.js App Router or Astro (#331, #373, #417) | Switch to the script tag |
| `__REACT_DEVTOOLS_GLOBAL_HOOK__.on is not a function`; `Cannot read properties of undefined (reading 'has')`; React DevTools says "page doesn't appear to be using React" | React Scan and the React DevTools extension race to install the hook, worst with the old store extension (#161, #324, #404, #443) | Disable the React Scan extension, or disable React DevTools while scanning |
| Content Security Policy blocks `unpkg.com` | `script-src` | Self-host (Vite dev plugin, module import) or allow the CDN |
| CSP blocks a `blob:` worker | `worker-src` (#372) | `useOffscreenCanvasWorker: false` (0.5.5+) |
| `[React Scan] react-grab vX is outdated` | The version ping on each start (#461, #472) | Harmless. To silence it, block `react-grab.com` or set `window.__REACT_GRAB__` |
| `[React Scan] Invalid options: - Unknown option "trackUnnecessaryRenders"` | Removed feature | Delete the option |
| App drops to about 1 FPS, "too much recursion" | Unpinned CDN served the broken 0.5.0 (#424) | Pin the version in the URL |
| `toSorted is not a function`, syntax errors on `?.` in old toolchains | Old browsers or Babel | 0.5.5+ targets es2019 and polyfills `toSorted` |

## Wrong or Missing Data

| Symptom | Explanation | What to do |
| --- | --- | --- |
| Component missing from the inspector tree | The tree is built from DOM nodes. Components that render no DOM are not listed (#252) | Wrap the output in a `<div>` temporarily, or use the probe |
| Names are `Anonymous`, `_`, `b` | A production build (minified), or anonymous arrow components | Use a dev build; add `displayName`s; the `react-component-name` plugin helps partly |
| Styled or forwardRef components unnamed (#355) | No `displayName` | Set `displayName` |
| "Memoizable" on a compiled (✨) component (#378) | Known false positive | Trust `✨` and the changed lists |
| `onRender` stopped firing | Outlines paused (toolbar toggle or `enabled: false`) while the inspector is off | Turn outlines back on; clear `react-scan-options` |
| `render.changes` always empty, `log` prints only names | Change tracking is off in 0.5.7 | Compute from `fiber.alternate` (probe) or use the inspector |
| First update shows as a mount | bippy phase quirk with React 19 | Use `fiber.alternate === null` |
| `lite` reports renders for memo components that bailed out | The lite tree includes bailed-out fibers with `actualDuration > 0` | Use the `didRender` filter in [api.md](api.md#react-scanlite) |
| Changed Context listed on renders that came from props | Context attribution over-reports (source comment) | Confirm with the probe's `context` field or React DevTools |
| Render times are 0 | Production React (no profiler timers) | Use a dev build, or alias `react-dom/profiling` |
| Counts differ from React DevTools | Labels merge and `×N` counts flush windows. DevTools counts commits per fiber | Use the probe or DevTools for exact counts |

## Toolbar Problems

| Symptom | Fix |
| --- | --- |
| Toolbar covers the Next.js dev indicator or app controls (#430) | `safeArea: 96` or `{ bottom: 96 }`; drag it to another corner |
| Toolbar vanished after dragging | It collapsed to an edge tab. Click the tab ("Expand toolbar"), or clear `react-scan-widget-collapsed-v1` |
| Toggle thumb or resize handles look broken in Chromium on 0.5.7 (#463) | A cosmetic Tailwind v4 shadow-DOM bug. Ignore it, or use 0.5.6 |
| Toolbar can't be dragged in Electron over `-webkit-app-region: drag` (#395) | Fixed in 0.3.x+; upgrade |
| Wrong position on RTL pages (#190, #358) | Fixed in 0.3.x+; upgrade |

## Environment Limits

- **Iframes**: off by default; opt in with `allowInIframe`. The extension never runs in iframes.
- **Multiple windows and portals into `window.open`**: not supported (#327, #433).
- **`<dialog>` top layer**: not outlined (#225).
- **React Native**: `react-scan@native` is unmaintained (see setup.md).
- **Non-React renderers** (Preact, Solid): not supported.
- **Canvas-heavy apps** (maps, three.js, Konva): outlines track DOM hosts only. R3F and Konva component renders show in `onRender`, but not as useful rectangles.
