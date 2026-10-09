# Cross-Browser Builds with WXT

## Table of contents

- Targets and defaults
- Per-browser code and manifest values
- Chrome vs Firefox vs Safari differences that bite
- Firefox specifics
- Edge and other Chromium browsers
- Safari

## Targets and defaults

```sh
bun run dev                      # wxt            -> chrome (MV3)
bunx wxt -b firefox              # dev build opens Firefox (MV2 by default)
bunx wxt build -b edge           # .output/edge-mv3
bunx wxt build -b firefox --mv3  # Firefox MV3 (event page background)
bunx wxt build -b safari         # .output/safari-mv2 by default
```

- `-b` defaults to `chrome`. Any string is accepted (`-b custom`) and opens Chrome in dev.
- Default manifest version: MV3 for Chrome, Edge, and other Chromium targets; MV2 for Firefox and Safari. Force with `--mv2` / `--mv3`.
- Output dirs are `.output/<browser>-mv<N>`. Use the built-in env flags to branch: `import.meta.env.BROWSER`, `CHROME`, `FIREFOX`, `SAFARI`, `EDGE`, `OPERA`, `MANIFEST_VERSION`. Set `targetBrowsers: ['chrome', 'firefox']` to type `BROWSER` precisely.
- Only claim MV3 for Firefox/Safari after testing; their MV3 differs from Chrome's.

## Per-browser code and manifest values

```ts
// wxt.config.ts: function form for browser-specific manifest values
manifest: ({ browser, manifestVersion }) => ({
  permissions: ['storage', ...(browser === 'chrome' ? ['sidePanel', 'offscreen'] : [])],
  ...(browser === 'firefox' && {
    browser_specific_settings: { gecko: { id: 'ext@yourdomain.dev', strict_min_version: '140.0', data_collection_permissions: { required: ['none'] } } },
  }),
}),
```

- Entrypoints: `include: ['chrome']`, `exclude: ['firefox']` on `defineBackground` / `defineContentScript` / `defineUnlistedScript`; `<meta name="manifest.include" content="['chrome']">` in HTML entrypoints; or `filterEntrypoints` in config.
- Per-browser option values: `matches: { chrome: [...], firefox: [...] }`, `runAt: { chrome: 'document_start', firefox: 'document_end' }`, `world: { firefox: 'MAIN' }`.
- Runtime branches: `if (import.meta.env.FIREFOX) { ... }` is tree-shaken per build.
- Feature detection for optional APIs: `browser.sidePanel?.open(...)`, `browser.offscreen?.createDocument(...)`, `(browser.action ?? browser.browser_action)`.
- Firefox-only types: install `@wxt-dev/browser` and augment `Browser` (for example `sidebarAction`).

## Chrome vs Firefox vs Safari differences that bite

| Area | Chrome / Edge | Firefox | Safari |
| --- | --- | --- | --- |
| Background | Service worker only (no DOM) | Event page (`background.scripts`, non-persistent in MV3; DOM available) | Event page by default; service worker if requested |
| Offscreen document | `offscreen` API | Not needed: the background page has a DOM; no `offscreen` API | Not available |
| Side UI | `sidePanel` | `sidebar_action` (WXT maps the `sidepanel` entrypoint) | Verify |
| MV3 host permissions | Granted at install | Shown and granted at install from Firefox 127; users can revoke, so check and request | Verify |
| Content script `fetch` cross-origin | Page's CORS | Not allowed under MV3; message the background | Same restriction as page |
| `world: 'MAIN'` content scripts | Chrome 111+ | Supported in recent Firefox; verify target `strict_min_version` | Verify |
| `identity.getAuthToken` | Yes | No (use `launchWebAuthFlow`) | No |
| `declarativeNetRequest` | Yes | Yes; blocking `webRequest` also still works | Yes (limits differ) |
| `userScripts` | Chrome-specific toggle ("Allow User Scripts") | Only for user-script managers; incompatible API with MV2 | Verify |
| `storage.session` | Yes | Yes | Verify |
| Data consent | `privacy` tab | `data_collection_permissions` manifest key (new extensions since 2025-11-03) | App Store privacy labels |
| Promise `onMessage` return | Chrome 148+ (earlier: `return true`) | Native | Native |
| Sandbox pages | Yes | No | No |

Write against `browser` with promises, guard APIs with `?.`, and run `web-ext lint` on the Firefox build.

## Firefox specifics

- Add `browser_specific_settings.gecko.id` (WXT warns if missing); required for `storage.sync` and AMO.
- Add `data_collection_permissions` for new submissions (see [publishing-review.md](publishing-review.md)).
- Event pages: register listeners synchronously at top level of `main`, persist state to storage, use `alarms` instead of timers, create menus in `onInstalled`, and use `contextMenus.onClicked` rather than the `onclick` parameter.
- Backgrounds with both `service_worker` and `scripts` are handled by WXT per target; do not hand-merge unless writing a plain manifest.
- Dev: `bunx wxt -b firefox` needs `web-ext` and Firefox; persistent dev profiles are Chromium-only; configure `webExt.binaries.firefox`.
- Submission needs the sources zip (`bun run zip:firefox`); keep the build reproducible.

## Edge and other Chromium browsers

- The Chrome zip installs in Edge. Build `-b edge` only if you use Edge-only manifest or entrypoint differences.
- Opera is supported by `publish-browser-extension`; treat it like Chrome with its own store account and listing.
- Brave, Arc, Vivaldi: load the Chrome build unpacked; no store step.

## Safari

- `wxt build -b safari` produces a web extension folder (MV2 by default). Convert it into an Xcode project: `xcrun safari-web-extension-converter .output/safari-mv2` (pass the output directory, not the source). The wrapper macOS/iOS app is required; WXT does not create or sign it, and `wxt submit` does not publish to Safari.
- Distribution needs the Apple Developer Program and App Store review. Test permission changes manually (no update-testing tool).
- WXT excludes `options_ui.open_in_tab` for Safari. Expect gaps in API support (verify each API against Apple's Safari web extension docs); keep Safari-specific workarounds behind `import.meta.env.SAFARI`.
- Safari uses event-page background by default and honors `preferred_environment` in `background` for the service-worker context if you need it.
