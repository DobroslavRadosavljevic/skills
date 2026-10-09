# Migrating to WXT

## Table of contents

- Strategy
- Plain MV3 (hand-written manifest, no bundler)
- Plasmo
- CRXJS
- vite-plugin-web-extension
- Post-migration verification
- Pitfalls

## Strategy

Generate a fresh vanilla WXT project and merge your extension into it one file at a time, instead of converting in place. The goal is the same extension with the same permissions, now built by WXT.

```sh
cd path/to/your/project
bunx wxt@latest init example-wxt --template vanilla    # reference project to copy structure from
```

Core steps (all sources):

1. `bun add -D wxt vite typescript web-ext` (`vite` required peer; `web-ext` optional for opening the dev browser). Node >= 22 or Bun >= 1.2.
2. `tsconfig.json`: `{ "extends": ".wxt/tsconfig.json" }`; run `bunx wxt prepare`.
3. Scripts: `dev`, `dev:firefox`, `build`, `build:firefox`, `zip`, `zip:firefox`, `postinstall: wxt prepare`.
4. Move entrypoints into `entrypoints/`; add default exports (`defineBackground`, `defineContentScript`, `defineUnlistedScript`).
5. Move assets to `assets/` (bundled) or `public/` (copied as-is: icons, `_locales`, DNR rule JSON, static pages).
6. Move `manifest.json` content into `wxt.config.ts` `manifest`, except entrypoint-specific options, which move into the entrypoint files.
7. Replace `chrome.*` with the `browser` global (auto-imported; `wxt/browser`).
8. Compare the old production manifest with `.output/chrome-mv3/manifest.json`. Permissions, host permissions, `matches`, `web_accessible_resources`, `minimum_chrome_version`, and `key` must match unless you intend to change them.
9. If the extension is live on the Chrome Web Store, run Google's Extension Update Testing tool on the new build to ensure no new permission warnings.

## Plain MV3 (hand-written manifest, no bundler)

Mapping:

| Plain project | WXT |
| --- | --- |
| `manifest.json` | `wxt.config.ts` `manifest` (plus entrypoint options) |
| `background.js` (`"type": "module"`) | `entrypoints/background.ts`: `defineBackground({ type: 'module', main() { ...all listeners... } })` |
| `content.js` + `content.css` + `content_scripts` entry | `entrypoints/{name}.content/index.ts` with `import './style.css'`; `matches`, `runAt`, `world`, `allFrames` become `defineContentScript` options |
| `world: "MAIN"` script at `document_start` | `defineContentScript({ world: 'MAIN', runAt: 'document_start', matches, main() {} })`, or `injectScript` with an unlisted script |
| `popup.html` + `popup.js` | `entrypoints/popup/index.html` (+ `main.ts`, `style.css`); `<title>` is the action title |
| `options.html` | `entrypoints/options/index.html` |
| `offscreen.html` + `offscreen.js` | `entrypoints/offscreen/index.html` + `main.ts` (unlisted page; keep `chrome.offscreen.createDocument({ url: 'offscreen.html' })`) |
| `sidepanel.html` | `entrypoints/sidepanel/index.html` |
| shared helper modules | `utils/` (auto-imported) or relative imports |
| `icons/*.png` | `public/icon-{16,32,48,128}.png` (auto-detected) or `manifest.icons` |
| `_locales/` | `public/_locales/` (or `@wxt-dev/i18n`) |
| `rules.json` for DNR | `public/rules/*.json` + `manifest.declarative_net_request` |
| `web_accessible_resources` | `manifest.web_accessible_resources` |
| `key` | `manifest.key` |
| native messaging host files | unchanged (outside the bundle) |
| hand-written `build.py`/zip script | `wxt build` / `wxt zip` |
| `node --test` tests | keep, or move to Vitest with `WxtVitest()` for `browser`/storage |

Procedure:

1. Create entrypoints. Wrap listener registration in `defineBackground(() => { ... })`; if the original registers listeners at module top level, move them into `main` and keep them synchronous. Tests or helpers that import the old top-level file need the logic extracted into modules.
2. Content scripts written as IIFEs (`(() => { ... })()`) become the body of `main(ctx)`. Replace global guards (`if (document.getElementById('x')) return;`) with `ctx`-aware cleanup, or keep them for idempotency.
3. Replace raw timers/listeners with `ctx.setTimeout`, `ctx.setInterval`, `ctx.addEventListener`; replace hand-rolled shadow-root host code with `createShadowRootUi` (set `cssInjectionMode: 'ui'`, import the CSS in the entrypoint).
4. Replace hand-written SPA URL polling or history patching with `wxt:locationchange`.
5. Replace `chrome.storage.*` wrappers with `storage.defineItem` where it simplifies, keeping the same storage keys. Existing users have data at the old keys, so define items with the same key names (`local:settings` maps to storage key `settings`) and add `version`/`migrations` only when changing shape.
6. Move static `host_permissions`/`permissions` to the config exactly as before. Note WXT adds `tabs` and `scripting` in dev builds only.
7. Keep inline-free HTML: WXT bundles `<script type="module" src="./main.ts">`; remove inline scripts.
8. Replace `importScripts(...)`/vendored libraries with npm installs and ES imports (no CDN or `url:` imports).
9. Delete the old build/zip scripts; use `bun run zip`. Update README install steps (`.output/chrome-mv3` instead of the old folder).
10. Move tests; keep fixture-based extractor tests unchanged and add `WxtVitest()` only for tests that touch `browser`.

## Plasmo

1. Install `wxt`; move entrypoints into `entrypoints/`.
2. JS entrypoints: merge Plasmo's named config exports into WXT's default export (`export const config` becomes `defineContentScript({ matches, ... })`).
3. HTML entrypoints cannot be `.tsx`/`.vue` files: create `index.html` and a `main.tsx` that mounts the app (see the React, Vue, Svelte templates).
4. Public `assets/*` go to `public/`.
5. Content Script UI (CSUI) becomes `createShadowRootUi` / `createIntegratedUi`.
6. Plasmo import resolutions become Vite aliases (`alias` in `wxt.config.ts`).
7. Importing remote code via URL is unsupported; npm-install or vendor the library.
8. Replace Plasmo tags (`--tag`) with WXT modes (`--mode`).
9. Compare manifests.

## CRXJS

CRXJS builds from the manifest; WXT builds from files in `entrypoints/`.

1. Move entrypoints into `entrypoints/` in WXT style (default exports).
2. Move entrypoint options out of the manifest into the entrypoint files (content script `matches`, `run_at`).
3. Move remaining manifest content into `wxt.config.ts`.
4. Consider disabling auto-imports at first (`imports: false`), then enable later.
5. Add WXT scripts including `postinstall: wxt prepare`.
6. Delete `vite.config.ts`; move plugins into `wxt.config.ts` `vite`; install the framework module (`@wxt-dev/module-react`, etc.).
7. Extend `.wxt/tsconfig.json`; add custom path aliases via the `alias` config option.
8. Compare manifests. Note CRXJS loads content scripts through an ESM loader; WXT bundles classic scripts and supports `runAt`.

## vite-plugin-web-extension

1. Install `wxt`; refactor entrypoints with default exports.
2. Update scripts; add `postinstall: wxt prepare`.
3. Move `manifest.json` into `wxt.config.ts`; move custom Vite settings into the `vite` option.
4. Compare manifests.

## Post-migration verification

- `bunx wxt prepare`, typecheck, `bun run build`; diff old vs new `manifest.json` (permissions, matches, WAR, version).
- Load `.output/chrome-mv3`; exercise every feature; check the service worker restarts cleanly; check content scripts on the target sites with and without a prior page load.
- `bun run zip`, unzip and load the zip.
- `bunx wxt submit --dry-run` before the first automated release.
- If upgrading users keep data: install the old version, create data, install the new build over it (same `key`/ID), and confirm migrations.

## Pitfalls

- Runtime code outside `main` fails the build or runs at build time in Node.
- Entry files placed directly in `entrypoints/` are treated as entrypoints; use directories for multi-file entrypoints.
- Dev builds differ from production (extra `tabs`/`scripting` permissions, runtime-registered content scripts); finish by testing the production build.
- WXT output paths differ: content scripts become `content-scripts/<name>.js`, unlisted scripts `/<name>.js`, pages `/<name>.html`. Update any hard-coded `web_accessible_resources` or `scripting.executeScript({ files })` paths.
- Extension ID changes if `key` is dropped; carry it over as `manifest.key` for unpacked parity, and native messaging hosts depend on the ID.
- Pre-1.0 WXT: pin the version, read the Upgrading page on each `0.X` bump.
