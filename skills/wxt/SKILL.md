---
name: wxt
description: "Build, review, debug, test, migrate, or publish browser extensions with WXT (wxt 0.21.x, Manifest V3, Chrome first; Firefox, Edge, Safari builds). Use for wxt.config.ts, entrypoints/ (defineBackground, defineContentScript, defineUnlistedScript, popup, options, sidepanel, newtab, devtools, sandbox, unlisted pages), generated manifest and per-browser overrides, the browser global (wxt/browser, @wxt-dev/browser), storage.defineItem (@wxt-dev/storage, versioning, migrations), createShadowRootUi/createIntegratedUi/createIframeUi, ContentScriptContext (ctx.isValid, ctx.onInvalidated, ctx.addEventListener), wxt:locationchange for SPA navigation, injectScript for MAIN-world code, messaging (@webext-core/messaging), auto-imports/#imports, env vars and modes, @wxt-dev/module-react/vue/svelte/solid, @wxt-dev/i18n, web-ext dev browser startup (web-ext.config.ts), WxtVitest and fakeBrowser, Playwright E2E on .output/chrome-mv3, wxt build/zip/submit/prepare, Firefox sources zip and data_collection_permissions, Safari converter, and migrating plain MV3, Plasmo, CRXJS or vite-plugin-web-extension into WXT. Also covers MV3 platform rules inside WXT: service worker termination, permissions vs host_permissions vs optional, declarativeNetRequest, offscreen documents, alarms, side panel, CSP and the remote-code ban, SPA scraping on X, YouTube, TikTok, Twitch, Kick, Instagram, Facebook (MutationObserver, shadow DOM UI, selector resilience), cookies/identity auth, Chrome Web Store review and rejection reasons."
---

# WXT

Use this skill when work touches a WXT project (`wxt.config.ts`, `entrypoints/`, `.output/`), the extension it generates, or moving an extension into WXT.

Snapshot (2026-10-09): `wxt@0.21.4` (2026-08-11; pre-1.0, so `0.X` bumps are breaking), `@wxt-dev/module-react@1.2.2`, `@wxt-dev/storage@1.3.0`, `@wxt-dev/i18n@0.2.8`, `@types/chrome@0.3.4`, `vite@8.3.4`, `web-ext@10.7.0`, `@playwright/test@1.64.0`, `bun@1.4.2`. Requires Node >= 22 (or Bun >= 1.2), TypeScript >= 5.4, and Vite `^6.3.4 || ^7 || ^8` as a project peer. MV2 is gone from Chrome (disabled in 138, removed from the store 2026-08-31). Refresh from [source-map.md](references/source-map.md) when versions differ.

## Workflow

1. Inspect the WXT surface before editing:
   - `package.json`: `wxt` version, `vite`, `web-ext`, `typescript`, framework module, scripts (`dev`, `build`, `zip`, `postinstall: wxt prepare`).
   - `wxt.config.ts`: `srcDir`, `modules`, `manifest` (object or function), `webExt`, `zip`, `hooks`, `vite`, `imports`, `targetBrowsers`.
   - `entrypoints/`: which entrypoints exist and each one's options (`matches`, `world`, `runAt`, `registration`, `cssInjectionMode`, `include`/`exclude`).
   - `.output/<browser>-mv<N>/manifest.json` after a build: this is the real manifest; audit permissions there.
   - Target browsers and manifest versions (`wxt -b firefox` defaults to MV2; Chrome/Edge are MV3).
2. Refresh docs when the task depends on current WXT behavior, a version bump, or store policy. Start from [source-map.md](references/source-map.md); WXT serves Markdown for every page (append `.md`).
3. Route to the focused references:
   - Project layout, config, entrypoints, manifest generation, env, modules, auto-imports, TypeScript, dev mode: [project-config.md](references/project-config.md).
   - Manifest fields, permissions, host access, CSP, remote code, web-accessible resources: [manifest-permissions.md](references/manifest-permissions.md).
   - `defineBackground`, service worker lifecycle, messaging, storage, alarms, offscreen, side panel: [background-messaging-storage.md](references/background-messaging-storage.md).
   - `defineContentScript`, `ctx`, UI helpers, MAIN world, SPA scraping, per-site notes: [content-scripts-spa.md](references/content-scripts-spa.md).
   - Network, CORS, declarativeNetRequest, cookies, identity/OAuth, downloads, secrets: [network-auth-dnr.md](references/network-auth-dnr.md).
   - Vitest + `fakeBrowser`, Playwright E2E, debugging checklist: [testing-debugging.md](references/testing-debugging.md).
   - `wxt zip`, `wxt submit`, Chrome Web Store review and rejections, Firefox AMO, Edge: [publishing-review.md](references/publishing-review.md).
   - Browser differences and `-b`/`--mv3` builds, Safari: [cross-browser.md](references/cross-browser.md).
   - Moving a plain MV3, Plasmo, CRXJS, or vite-plugin-web-extension project into WXT: [migrate-to-wxt.md](references/migrate-to-wxt.md).
4. Implement in the project's existing style. Prefer the smallest permission set that works, and rebuild to confirm the generated manifest.
5. Verify in a loaded build, not only unit tests (see Verification).

## Core Judgment

- WXT generates `manifest.json`. Never hand-edit `.output/`; set options in entrypoint files, `wxt.config.ts` `manifest`, or `hooks['build:manifestGenerated']`. Write the manifest in MV3 shape; WXT converts for MV2 targets.
- JS/TS entrypoints are imported in Node at build time to read their options. All runtime code (DOM, `browser.*`, listeners) must live inside `main`. `defineBackground`'s `main` cannot be async.
- Each content script, background, and unlisted script is one entrypoint file or `name/index.ts` directory, zero or one level deep: `youtube.content/index.ts`, not `youtube/content/index.ts`. Never drop companion files directly into `entrypoints/`.
- Import with auto-imports or `#imports`; use `browser` (from `wxt/browser`), not raw `chrome`. Feature-detect optional APIs with `?.`; types assume everything exists.
- Run `bunx wxt prepare` after dependency or entrypoint changes (the `postinstall` script does it) so `.wxt/` types and auto-import declarations are current.
- The service worker is ephemeral: 30 s idle, 5 min per task, 30 s per `fetch` response. Register listeners synchronously inside `defineBackground`'s `main`, keep state in `storage` (`session:` for in-memory data), and use `browser.alarms`, not `setTimeout`, for waits.
- Store extension state with `storage.defineItem('local:...', { fallback, version, migrations })`. Keys need an area prefix (`local:`, `session:`, `sync:`, `managed:`), and the `storage` permission is not added for you.
- Content script UIs: prefer `createShadowRootUi` (set `cssInjectionMode: 'ui'`, import the CSS in the entrypoint) with `autoMount()` and a stable `anchor` for SPAs. Use `ctx.addEventListener` / `ctx.setTimeout` / `ctx.onInvalidated` so orphaned scripts stop after an update.
- SPA routing: content scripts run on full loads only. Listen to `wxt:locationchange` via `ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => ...)` and match with `MatchPattern`.
- MAIN world: prefer `injectScript('/name.js')` with a `defineUnlistedScript` plus `web_accessible_resources`, so the parent content script keeps extension API access and can talk to the page script. `world: 'MAIN'` on a content script has no `browser.*` and no MV2.
- Never execute remote code (`eval`, CDN scripts, `new Function`). WXT 0.21 removed `url:` imports for this reason; vendor or npm-install libraries instead. Remote data is allowed, remote logic is Blue Argon.
- Permissions: least privilege, specific hosts, `optional_host_permissions` plus `permissions.request()` for non-core hosts. WXT adds `tabs` and `scripting` only in dev; production lists what you declare. Every permission needs a store justification.
- During `wxt dev`, content scripts are registered dynamically (not in the manifest) and the dev build lives in a mode-specific output dir. Test the production build before release.
- Build per target: `wxt build`, `wxt build -b firefox [--mv3]`, `wxt build -b edge`, `wxt build -b safari`. Edge can reuse the Chrome zip. Firefox needs the sources zip from `wxt zip -b firefox`.
- Media download extensions for paywalled or copyrighted content are a known store rejection class (Blue Zinc, Blue Copper, Blue Lithium, Blue Magnesium). Flag it early; personal tools ship as unpacked or unlisted builds.
- Secrets never ship. `WXT_*` / `VITE_*` env values are inlined into the bundle and readable. Proxy paid API calls through your own backend.
- Use `bun` / `bunx` in commands (`bunx wxt@latest init`, `bun run dev`, `bunx wxt prepare`).

## Verification

Prefer the repository's scripts. For meaningful WXT work, cover the relevant subset:

- `bunx wxt prepare` and a typecheck (`bunx tsc --noEmit`) succeed.
- `bun run build` produces `.output/chrome-mv3`; read its `manifest.json` for permissions, `content_scripts`, `web_accessible_resources`, `minimum_chrome_version`.
- Load `.output/chrome-mv3` unpacked (or run Playwright against it): content script injects, popup/options/side panel render, service worker events fire, no console errors.
- Service worker restart: stop the worker (`chrome://serviceworker-internals`) or wait 30 s, then trigger the feature; state must survive.
- SPA navigation: change routes without reloading; injected UI appears once, updates, and cleans up; no duplicated observers.
- Unit tests with `WxtVitest()` + `fakeBrowser` for pure logic, storage items, parsers, and selector extractors against saved HTML fixtures.
- `bun run zip` output is unzipped and loaded to catch path/case mistakes; for Firefox, rebuild from the sources zip and compare with `wxt build -b firefox`.
- Permission audit (every entry used, each justified), version bumped, no remote code or obfuscation, privacy tab and policy match behavior.
- `bunx wxt submit --dry-run ...` before a real release.

Report which checks ran, which did not, the minimum browser versions assumed, and any selector or site-behavior assumptions that remain.
