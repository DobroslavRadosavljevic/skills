# Setup

Contents:
- [Choose a Loading Method](#choose-a-loading-method)
- [CLI init](#cli-init)
- [Script Tag (CDN)](#script-tag-cdn)
- [Module Import](#module-import)
- [Framework Recipes](#framework-recipes)
- [Keep It Out of Production](#keep-it-out-of-production)
- [Configure at Runtime](#configure-at-runtime)
- [CSP, Offline, and Supply Chain](#csp-offline-and-supply-chain)
- [Official Vite Plugin](#official-vite-plugin)
- [Browser Extension](#browser-extension)
- [React Native](#react-native)

## Choose a Loading Method

React Scan must install `__REACT_DEVTOOLS_GLOBAL_HOOK__` before React DOM initializes. React reads the hook once, when the renderer loads. Pick the first method that fits:

| Method | Use when | Watch out for |
| --- | --- | --- |
| Dev-only `<script>` that serves `auto.global.js` from `node_modules` (the Vite recipe below) | Vite apps; you want no CDN and nothing in prod | Needs a tiny config plugin |
| Dev-only `<script>` from a pinned CDN URL | Next.js, React Router, Remix, TanStack Start, Astro, any server-rendered HTML | CSP `script-src`; network access |
| First import in the client entry, `scan()` | You need callbacks (`onRender`) in app code, or no network | Import order; bundles into prod unless gated; Preact `__H` errors in some SSR setups; webpack/Rspack break on 0.5.6+ |
| Browser extension | Quick look at an app you can't edit | Old store build, conflicts with React DevTools, no iframes, no options |
| Headless probe (`scripts/render-probe.mjs`) | Measurement, CI, agents | Needs Playwright; Chromium for CPU throttling |

The script tag is the most robust. It is pre-bundled (IIFE, es2019), so it avoids bundler problems: the JSON import break, Preact duplication, and the `react-server` shim.

## CLI init

```bash
bunx react-scan@latest init
```

Flags: `-y, --yes` (skip the "Apply these changes?" confirm), `-c, --cwd <dir>`, `--skip-install`. `init` is the only command.

What it does:
- It detects the framework from `package.json`, in this order: `next`, then `@tanstack/react-start` (detected but **not supported**; it exits 1), then `vite`, then `webpack` or `react-scripts`. Anything else exits 1.
- It detects the package manager from the lockfile and installs `react-scan` as a devDependency.
- It prints a diff before it writes.

| Project | Edit |
| --- | --- |
| Next.js App Router | Adds `{process.env.NODE_ENV === "development" && (<script src="https://unpkg.com/react-scan/dist/auto.global.js" crossOrigin="anonymous" />)}` after `<head>` in `app/layout.*` |
| Next.js Pages Router | The same block inside `<Head>` in `pages/_document.*` |
| Vite | An **ungated, unpinned** `<script src="https://unpkg.com/react-scan/dist/auto.global.js">` after `<head>` in `index.html`. It ships to production. Replace it with the Vite recipe below. |
| Webpack / CRA | The same ungated tag in `index.html`; or, with no HTML file, it prepends `if (process.env.NODE_ENV === "development") { import("react-scan"); }` to the entry. A dynamic import loads after React, so it may not attach. |

After `init`, pin the version in the URL, and gate the Vite and webpack tags.

Non-interactive runs: the final "Install React Doctor?" prompt is **not** skipped by `--yes`. With stdin closed it is skipped and the CLI exits 0 (verified):

```bash
bunx react-scan@latest init --yes --skip-install < /dev/null
```

Vite-based React Router v7 and Remix have no `index.html`, so they fail with "Could not find index.html". Set them up by hand.

## Script Tag (CDN)

Put it first in `<head>`. Make it synchronous: no `async`, no `defer`, no `type="module"`. Pin the version:

```html
<script src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js" crossorigin="anonymous"></script>
<!-- or: https://cdn.jsdelivr.net/npm/react-scan@0.5.7/dist/auto.global.js -->
```

In plain HTML, write an explicit `</script>`. A self-closing `<script />` breaks the page (#325). JSX is fine with `<script ... />`.

`auto.global.js` calls `scan()` with no options and sets `window.reactScan = scan`. It reads no data attributes and no global config object. To pass options, call `window.reactScan({...})` in a second inline script right after it, or later from the console.

## Module Import

```ts
// src/main.tsx: react-scan must be the FIRST import, before react / react-dom / the router
import { scan } from "react-scan";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

scan({ enabled: true });
```

Notes:
- A static import is bundled into production, and the `production` export condition does **not** remove it. Only `react-server` resolves to a no-op shim. Gate it (see [Keep It Out of Production](#keep-it-out-of-production)).
- In SSR frameworks, put `scan()` in a `useEffect` (after hydration). Keep the import at the top of the file that loads first.
- Import only one entry. `react-scan` and `react-scan/all-environments` each bundle their own internal state.

## Framework Recipes

### Vite (verified)

This plugin injects `auto.global.js` from `node_modules`. It runs only for `vite` dev (`apply: "serve"`) and uses the version in your lockfile. Nothing reaches `dist/`, and there is no CDN.

```ts
// vite.config.ts
import { createRequire } from "node:module";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";

const reactScanDev = (): Plugin => ({
  name: "react-scan-dev",
  apply: "serve",
  transformIndexHtml: () => [
    {
      tag: "script",
      // /@fs + absolute path works for hoisted monorepo installs too
      attrs: { src: `/@fs${createRequire(import.meta.url).resolve("react-scan/dist/auto.global.js")}` },
      injectTo: "head-prepend",
    },
  ],
});

export default defineConfig({ plugins: [reactScanDev(), react()] });
```

```bash
bun add -d react-scan@0.5.7
```

To pass options, add a second tag after it: `{ tag: "script", children: "window.reactScan({ showFPS: false })", injectTo: "head-prepend" }`. Tags are emitted in array order.

### Next.js App Router

```tsx
// app/layout.tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {process.env.NODE_ENV === "development" && (
          <script src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js" crossOrigin="anonymous" />
        )}
      </head>
      <body>{children}</body>
    </html>
  );
}
```

Alternatives:
- The README form: `next/script` with `strategy="beforeInteractive"`. The default `afterInteractive` is too late (#283).
- The module form: a `"use client"` component whose file imports `react-scan` before `react` and calls `scan()` in `useEffect`. The layout must import that component as its first import. It can throw Preact `Cannot read properties of undefined (reading '__H')` (#373). If it does, switch to the script tag. With 0.5.6+ under `next build --webpack` it fails to compile (#447).

The toolbar can sit on top of the Next.js dev indicator. Use `window.reactScan({ safeArea: { bottom: 96 } })`, or pass `safeArea` to `scan()`.

### Next.js Pages Router

Put the same dev-gated `<script>` inside `<Head>` in `pages/_document.tsx`. Module form: the first import in `pages/_app.tsx`, with `scan()` inside `useEffect`.

### React Router v7 (framework mode) and Remix

```tsx
// app/root.tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {import.meta.env.DEV && <script src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js" crossOrigin="anonymous" />}
        <meta charSet="utf-8" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

The upstream docs say the head-script form "only works for React 19": React 18 hydration does not accept extra head scripts. On React 18, use the module form instead: the first import in `app/root.tsx` with `scan()` in `useEffect`, or `app/entry.client.tsx` with `scan()` called before a synchronous `hydrateRoot`.

### TanStack Start

`init` does not support it, and the upstream guide is outdated (#426). Add a dev-only script through the root route `head()`:

```tsx
// src/routes/__root.tsx
export const Route = createRootRoute({
  head: () => ({
    scripts: import.meta.env.DEV
      ? [{ src: "https://unpkg.com/react-scan@0.5.7/dist/auto.global.js", crossOrigin: "anonymous" }]
      : [],
  }),
  component: RootComponent,
});
```

`<HeadContent />` must render inside `<head>`. Check that the script comes before the app's module scripts.

### Astro

```astro
---
// src/layouts/Layout.astro
---
<html lang="en">
  <head>
    {import.meta.env.DEV && <script is:inline src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js"></script>}
  </head>
  <body><slot /></body>
</html>
```

Use `is:inline` so Astro does not bundle or defer it. The module form (`<script>import { scan } from "react-scan"; scan();</script>`) can hit the Preact `__H` error (#373).

### Rsbuild

```ts
// rsbuild.config.ts
export default defineConfig({
  html: {
    tags:
      process.env.NODE_ENV === "development"
        ? [{ tag: "script", attrs: { src: "https://unpkg.com/react-scan@0.5.7/dist/auto.global.js" }, append: false }]
        : [],
  },
});
```

Avoid the module import with 0.5.6+ on Rspack (#467).

### Webpack, CRA, Parcel

Script tag: put the pinned tag first in `index.html`. Gate it with your HTML plugin's templating, or remove it before release.

Module form for webpack: a sync, dev-only side-effect module imported first. In production, webpack removes the dead `require`. This pattern is reasoned from ESM evaluation order and was not run here, so confirm with the probe's `attached`:

```js
// src/react-scan-dev.js
if (process.env.NODE_ENV === "development") {
  require("react-scan/dist/auto.global.js");
}
```

```js
// src/index.js
import "./react-scan-dev"; // first line
import React from "react";
```

### Storybook

Stories render inside an iframe, and React Scan skips iframes by default. In `.storybook/preview.ts`, as the first import:

```ts
import { scan } from "react-scan";
scan({ allowInIframe: true });
```

Or use `previewHead` in `.storybook/main.ts`:

```ts
previewHead: (head) => `
  <script src="https://unpkg.com/react-scan@0.5.7/dist/auto.global.js"></script>
  <script>window.reactScan({ allowInIframe: true });</script>
  ${head}`,
```

`auto.global.js` calls `scan()` with no options, and that returns early inside an iframe. The second call opts in. This was verified in a plain iframe, where the call attached even after React had loaded. It was not tested inside Storybook. #419 reports that inside Storybook's iframe the toolbar shows but no outlines appear unless `dangerouslyForceRunInProduction: true` is also passed. Add it, in Storybook only, if outlines are missing.

### Electron, multi-window, portals

React Scan draws only in the window it loaded in. Portals into `window.open` child windows are not covered (#327, #433). Components inside an open `<dialog>` (browser top layer) cannot be outlined (#225).

## Keep It Out of Production

Pick one:
- The Vite dev plugin above (`apply: "serve"`).
- A JSX condition that the bundler replaces at build time: `{process.env.NODE_ENV === "development" && <script .../>}` or `import.meta.env.DEV`.
- A dev-only side-effect module (webpack `require` pattern above).

Do not rely on `scan({ enabled: process.env.NODE_ENV === "development" })` with a static import. It disables scanning, but the library still ships and installs its hook (#224).

Do not rely on the built-in production check either. It returns early only when React has already registered a production renderer at the time `scan()` runs. When React Scan loads first, which is the required setup, it starts on production builds. This was verified with a Vite production build and the script loaded first.

To check a build: `grep -rl "react-scan\|auto.global\|reactScan" dist/ build/ .next/static 2>/dev/null` should print nothing.

To profile production on purpose:
- `import { scan } from "react-scan/all-environments"`. It skips both the production check and the iframe check.
- Or `scan({ dangerouslyForceRunInProduction: true })`.

Expect minified names and no render times. Alias `react-dom/client` → `react-dom/profiling` to get timings.

## Configure at Runtime

```ts
import { setOptions, getOptions } from "react-scan";
setOptions({ enabled: false });            // pause outlines (also stops onRender)
getOptions().value.enabled;                // getOptions() returns a signal; read .value
window.reactScan?.({ showFPS: false });    // CDN build
localStorage.removeItem("react-scan-options"); // drop stale persisted options, then reload
```

## CSP, Offline, and Supply Chain

- A CDN script needs `script-src https://unpkg.com` (or jsDelivr). Self-hosting from `node_modules` (Vite recipe, module import) avoids this.
- Outlines are drawn in a `blob:` Web Worker. Under `worker-src 'self'`, pass `useOffscreenCanvasWorker: false`; React Scan falls back to the main thread anyway (#372, fixed in 0.5.5).
- Each start sends a `fetch` to `https://www.react-grab.com/api/version?...` to check for updates, and logs "react-grab vX is outdated". You can't turn it off (#472). Under a strict `connect-src` it fails quietly. It is skipped when offline or when `window.__REACT_GRAB__` exists.
- `react-scan@0.5.7` depends on `react-doctor` and `react-grab` at `"latest"` (#468, #471). Commit the lockfile. Pin them with `overrides` / `resolutions` / `pnpm.overrides` if installs must be reproducible.
- `react-scan@1.2.0` on npm is a deprecated bad release. Never install `react-scan@1`.
- Testing over a LAN IP on plain http (not localhost) has broken secure-context APIs in some versions (#274). Use localhost or https.

## Official Vite Plugin

`@react-scan/vite-plugin-react-scan` 0.2.7 lists peers `vite ^2–^6`, so Vite 7 and 8 get peer warnings. It has options `enable` (default: `NODE_ENV === "development"`), `scanOptions` (JSON-serialized, so function options are dropped), `autoDisplayNames` (default `false`, adds a Babel pass), and `debug`. It adds `react-scan` to `optimizeDeps.exclude`. In a build with `enable: true`, it emits `assets/auto.global.js`, ignoring `base`. Prefer the 10-line inline plugin above unless the project already uses it.

## Browser Extension

- Chrome Web Store: "React Scan" (store build 1.0.9, old). Firefox and Brave: manual install from `packages/extension/build/*-extension-v1.1.4.zip` in the repo. The install guide link in the README is dead (#456).
- It forces `dangerouslyForceRunInProduction`, so it works on production sites. Each toggle reloads the page.
- It never runs in iframes or popups, and it accepts no options or callbacks.
- It often conflicts with the React DevTools extension: `__REACT_DEVTOOLS_GLOBAL_HOOK__.on is not a function`, or DevTools says "page doesn't appear to be using React" (#324, #404, #443). Disable one of them.

## React Native

`react-scan@native` (0.0.36-native, November 2024) comes from an unmerged PR and is unmaintained. For React Native, use the React Native DevTools Profiler ("Highlight updates"), or profile the react-native-web or Expo web build with normal React Scan.
