# WXT Project, Config, Entrypoints

## Table of contents

- Install and scripts
- Project layout
- Entrypoints and filenames
- wxt.config.ts
- Manifest generation and per-browser overrides
- The browser global and types
- Auto-imports and #imports
- Env vars, modes, runtime config
- Frontend frameworks and modules
- Assets, public, i18n
- Dev mode and browser startup
- TypeScript, Vite, hooks
- Upgrading WXT

## Install and scripts

```sh
bunx wxt@latest init my-ext          # prompts for template: vanilla, vue, react, svelte, solid
bunx wxt@latest init my-ext --template vanilla
cd my-ext && bun install
bun run dev                          # wxt: HMR dev build, opens Chrome via web-ext if installed
bun run build                        # wxt build -> .output/chrome-mv3
bun run zip                          # wxt zip   -> .output/<name>-<packageVersion>-chrome.zip
```

Scripts a WXT project should have in `package.json`:

```jsonc
{
  "scripts": {
    "dev": "wxt",
    "dev:firefox": "wxt -b firefox",
    "build": "wxt build",
    "build:firefox": "wxt build -b firefox",
    "zip": "wxt zip",
    "zip:firefox": "wxt zip -b firefox",
    "compile": "tsc --noEmit",
    "postinstall": "wxt prepare"
  }
}
```

0.21 made `vite` a required peer and `web-ext` and `typescript` optional peers: `wxt init` projects list them, but a hand-assembled project must `bun add -D wxt vite typescript web-ext`. Without `web-ext`, `wxt` dev builds but does not open a browser.

CLI flags documented by WXT: `-b <browser>` (`chrome` default, `firefox`, `edge`, `safari`, or a custom string), `--mv2` / `--mv3`, `--mode <name>`, `--host <ip>`, `--debug`. Commands: `wxt` (dev), `wxt build`, `wxt zip`, `wxt prepare`, `wxt clean`, `wxt init`, `wxt submit`, `wxt submit init`.

## Project layout

```
<rootDir>/
  .output/            build artifacts (gitignore)
  .wxt/               generated types and tsconfig (gitignore)
  assets/             processed by the bundler (import with ~/assets/x.png)
  components/ composables/ hooks/ utils/   auto-imported
  entrypoints/        every bundled entrypoint
  modules/            local WXT modules (loaded alphabetically)
  public/             copied as-is: icons, _locales, static files
  app.config.ts       runtime config (defineAppConfig)
  web-ext.config.ts   personal dev-browser options (gitignored)
  wxt.config.ts
  .env  .env.publish  .env.submit
```

`srcDir: 'src'` moves `assets/ components/ composables/ entrypoints/ hooks/ utils/ app.config.ts` under `src/`; `modules/`, `public/`, `.env*`, and configs stay at the root. Other dirs: `modulesDir`, `outDir` (default `.output`), `publicDir`, `entrypointsDir` (relative to `srcDir`). Aliases: `~` and `@` (srcDir), `~~` and `@@` (rootDir); add custom ones with the `alias` config option (not `tsconfig.json`), then `wxt prepare`.

## Entrypoints and filenames

An entrypoint is a file or a directory with `index.*` inside `entrypoints/`, zero or one level deep. The name decides the type.

| Entrypoint | Filename patterns | Manifest result |
| --- | --- | --- |
| Background | `background.ts`, `background/index.ts` | `background.service_worker` (MV3), `background.scripts` (MV2) |
| Content script | `content.ts`, `content/index.ts`, `{name}.content.ts`, `{name}.content/index.ts` | `content_scripts` (or runtime registration) |
| Popup | `popup.html`, `popup/index.html` | `action.default_popup` |
| Options | `options.html`, `options/index.html` | `options_ui` |
| Side panel | `sidepanel.html`, `{name}.sidepanel.html`, `sidepanel/index.html` | `side_panel` (Chrome), `sidebar_action` (Firefox) |
| Newtab / Bookmarks / History | `newtab.html`, `bookmarks.html`, `history.html` | `chrome_url_overrides` |
| Devtools | `devtools.html` | `devtools_page` |
| Sandbox | `sandbox.html`, `{name}.sandbox.html` | `sandbox` (Chromium only) |
| Unlisted page | `{name}.html`, `{name}/index.html` | none; at `/{name}.html` |
| Unlisted script | `{name}.ts`, `{name}/index.ts` | none; at `/{name}.js` |
| Unlisted CSS | `{name}.css` | none |

Confirm exact patterns on the Entrypoints page when adding rare types; the table reflects the documented layout.

Option declaration:

- JS/TS: options on the default export.
- HTML: `<meta name="manifest.<option>" content="...">` in `<head>`, for example `manifest.type` (`page_action` | `browser_action`), `manifest.default_icon`, `manifest.open_in_tab`, `manifest.open_at_install`, `manifest.browser_style`, `manifest.default_area`, `manifest.theme_icons`, `manifest.include`, `manifest.exclude`. The HTML `<title>` becomes the action/side-panel title.

```ts
// entrypoints/background.ts
export default defineBackground({
  type: 'module',          // optional: ESM service worker, enables code-splitting with pages (MV3 only)
  persistent: undefined,   // true/false/undefined (MV2 background page; ignored in MV3)
  include: undefined,      // ['chrome'] to build only for some browsers
  exclude: undefined,
  main() { /* sync; register all listeners here */ },
});

// entrypoints/youtube.content/index.ts
export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  excludeMatches: [], includeGlobs: [], excludeGlobs: [],
  allFrames: false, matchAboutBlank: false, matchOriginAsFallback: false,
  runAt: 'document_idle',                // 'document_start' | 'document_end' | 'document_idle'
  world: 'ISOLATED',                     // or 'MAIN'
  cssInjectionMode: 'manifest',          // 'manifest' | 'manual' | 'ui' (shadow root UIs)
  registration: 'manifest',              // or 'runtime' (register via scripting API; executeScript can return main()'s value)
  main(ctx) { /* may be async */ },
});

// entrypoints/injected.ts
export default defineUnlistedScript(() => { /* runs when the script loads */ });
```

Per-browser option values: `matches: { chrome: [...], firefox: [...] }`, `runAt: { chrome: 'document_start', firefox: 'document_end' }`. Options accepted this way are typed `PerBrowserOption`.

Background output is a single IIFE by default; `type: 'module'` emits ESM. Content scripts are always bundled as classic scripts (ESM content scripts are not built in). HTML entrypoints must use `<script type="module" src="./main.ts">`. Each HTML entrypoint (popup, options, side panel) creates its own app instance; put each in a directory and use hash routing for multi-page UIs.

Content scripts get CSS by importing it in the entrypoint (`import './style.css'`); WXT adds it to `css`. A CSS-only content script needs a `build:manifestGenerated` hook that pushes into `manifest.content_scripts`.

## wxt.config.ts

```ts
import { defineConfig } from 'wxt';

export default defineConfig({
  srcDir: 'src',
  modules: ['@wxt-dev/module-react', '@wxt-dev/auto-icons', '@wxt-dev/i18n/module'],
  manifest: ({ browser, manifestVersion, mode, command }) => ({
    name: mode === 'development' ? 'Example (dev)' : 'Example',
    default_locale: 'en',
    minimum_chrome_version: '116',
    permissions: ['storage', 'alarms'],
    host_permissions: ['https://www.example.com/*'],
    optional_host_permissions: ['https://*.example.org/*'],
    web_accessible_resources: [{ resources: ['injected.js'], matches: ['https://www.example.com/*'] }],
    browser_specific_settings: {
      gecko: { id: 'example@yourdomain.dev', data_collection_permissions: { required: ['none'] } },
    },
  }),
  targetBrowsers: ['chrome', 'firefox'],   // narrows import.meta.env.BROWSER type
  webExt: { startUrls: ['https://www.example.com/'] },
  zip: { exclude: ['**/*.map'], excludeSources: ['**/*.test.ts'], includeSources: [], downloadPackages: [] },
  hooks: {
    'build:manifestGenerated': (wxt, manifest) => { /* mutate the final manifest */ },
  },
  vite: () => ({ plugins: [] }),
  imports: { /* unimport options, or false */ },
  alias: {},
  watchOptions: { usePolling: false },
});
```

Other config keys: `browser`, `manifestVersion`, `mode`, `root`, `outDir`, `outDirTemplate`, `entrypointsDir`, `filterEntrypoints`, `analysis`, `dev`, `experimental`, `logger`, `suppressWarnings`, `configFile`, `debug`.

Use the function form of `manifest` when you need `import.meta.env.WXT_*` values (the `.env` files load after the config file is read) or per-browser values.

## Manifest generation and per-browser overrides

- No `manifest.json` in source. `wxt build` writes `.output/<browser>-mv<N>/manifest.json` from `package.json` (`name`, `version`, `description`), `manifest` config, entrypoint options, modules, and hooks.
- Write MV3 shapes. For MV2 targets WXT renames (`action` to `browser_action`, flattens `web_accessible_resources`) and strips MV3-only keys.
- `version` and `version_name` come from `package.json`; `1.3.0-alpha2` yields `version: 1.3.0` and `version_name: 1.3.0-alpha2`. Missing version becomes `0.0.0`.
- Icons in `public/` named like `icon-16.png`, `icon@16.png`, `icons/16.png` (sizes 16, 24, 48, 96, 128) are auto-wired. Light/dark pairs (`icon-light-16.png`, `icon-dark-16.png`) become Firefox `theme_icons`. Or set `manifest.icons`. `@wxt-dev/auto-icons` generates sizes from one source image.
- `permissions` in dev mode additionally gets `tabs` and `scripting`; `sidePanel` is added when a side panel entrypoint exists. Always read the production manifest.
- Per-browser manifest differences: use the function form (`browser === 'firefox' ? {...} : {...}`), `include`/`exclude` on entrypoints, per-browser option values, or a `build:manifestGenerated` hook.
- Firefox needs `browser_specific_settings.gecko.id` (WXT warns when missing) and, for new extensions, `data_collection_permissions`.
- `key` (stable ID for unpacked loads and native messaging) goes under `manifest.key`.

## The browser global and types

```ts
import { browser, type Browser } from 'wxt/browser';  // optional with auto-imports
browser.runtime.onMessage.addListener((msg: unknown, sender: Browser.runtime.MessageSender) => {});
```

`browser` is `globalThis.browser` when it has `runtime.id`, else `globalThis.chrome`; promise APIs work in MV2 and MV3. Types derive from `@types/chrome`; Firefox-only APIs (`sidebarAction`) need augmentation via `@wxt-dev/browser` plus declaration merging. `webextension-polyfill` is no longer bundled (removed in 0.20.0); `@wxt-dev/webextension-polyfill` exists as an opt-in.

Do not touch `browser.*` or `chrome.*` outside `main`: the Node import step provides a fake `browser` (via `@webext-core/fake-browser`) and a `linkedom` DOM, which is not a real browser.

## Auto-imports and #imports

WXT uses `unimport`. Auto-imported by default: WXT's own APIs (`defineBackground`, `defineContentScript`, `defineUnlistedScript`, `createShadowRootUi`, `createIntegratedUi`, `createIframeUi`, `injectScript`, `storage`, `browser`, `MatchPattern`, `ContentScriptContext`, `defineAppConfig`, `getAppConfig`) and exports from `components/`, `composables/`, `hooks/`, `utils/`. List them in `.wxt/types/imports-module.d.ts`. ESLint users enable `imports: { eslintrc: { enabled: 9 } }` and use the generated `.wxt/eslint-auto-imports.mjs`. Disable with `imports: false` and import explicitly from `#imports`. In unit tests, mock the real module path (`wxt/utils/inject-script`), not `#imports`.

## Env vars, modes, runtime config

- `.env`, `.env.local`, `.env.[mode]`, `.env.[browser]`, `.env.[mode].[browser]` (+ `.local`). Only `WXT_*` and `VITE_*` reach code via `import.meta.env`. They are inlined: never secrets.
- Built-ins: `import.meta.env.MANIFEST_VERSION` (2 | 3), `BROWSER`, `CHROME`, `FIREFOX`, `SAFARI`, `EDGE`, `OPERA`, plus Vite's `MODE`, `PROD`, `DEV`.
- Modes: `wxt --mode staging`, `wxt build --mode testing`. Default `development` for dev, `production` otherwise. In the `manifest` function use the `mode` arg, since `import.meta.env.DEV` is not defined there.
- `app.config.ts` with `defineAppConfig({...})` + `getAppConfig()` is runtime config committed to the repo (no secrets). Extend `WxtAppConfig` by module augmentation for types.

## Frontend frameworks and modules

`@wxt-dev/module-react`, `module-vue`, `module-svelte`, `module-solid`: add to `modules` and they wire the Vite plugin and auto-imports. Any other framework: add its Vite plugin under `vite: () => ({ plugins: [...] })`. Install `@wxt-dev/auto-icons`, `@wxt-dev/analytics`, `@wxt-dev/i18n` as modules. Local modules live in `modules/*.ts` using `defineWxtModule` (can `addEntrypoint`, `addAlias`, `addViteConfig`, `addImportPreset`, `addPublicAssets`, `addWxtPlugin`). Hook order: npm modules in `modules` order, then `modules/` alphabetically (prefix numbers to reorder), then `wxt.config.ts` hooks; inspect with `wxt prepare --debug`.

Routers in popup/options must use hash mode (`createHashRouter`, etc.) because the page path is a fixed static HTML file.

## Assets, public, i18n

- `assets/` is bundled (import `~/assets/x.png`); `public/` is copied unchanged and referenced with `/x.png`. Fonts or images referenced from a content-script CSS that the page loads must also be exposed via `web_accessible_resources`.
- i18n options: the vanilla `browser.i18n` with `public/_locales/<lang>/messages.json` and `__MSG_name__` in manifest `name`/`description`, or `@wxt-dev/i18n`: add the `@wxt-dev/i18n/module` module, put YAML/JSON under `<srcDir>/locales/<lang>.yml`, then `import { i18n } from '#i18n'; i18n.t('key')` (typed keys, plurals, works in manifest and CSS). Language follows the browser language; it cannot be switched in-extension without a third-party library.

## Dev mode and browser startup

- `wxt` runs the dev server, rebuilds on change, and (with `web-ext` installed) opens the browser with the extension. Content scripts are registered dynamically during dev (not in the manifest) so single scripts reload; inspect them with `await chrome.scripting.getRegisteredContentScripts()` in the service worker console.
- Configure in `web-ext.config.ts` (gitignored per-developer), `wxt.config.ts` `webExt`, or `$HOME/web-ext.config.ts`:

```ts
import { defineWebExtConfig } from 'wxt';
export default defineWebExtConfig({
  binaries: { chrome: '/path/to/chrome-beta', firefox: 'firefoxdeveloperedition' },
  chromiumArgs: ['--user-data-dir=./.wxt/chrome-data'],  // persistent profile (stay logged in)
  startUrls: ['https://www.youtube.com/'],
  // disabled: true,                                     // do not open a browser
});
```

- Persistent profiles work for Chromium only. Some Chrome features (for example the Prompt API) need `chromiumArgs: ['--disable-features=DisableLoadExtensionCommandLineSwitch']` or loading the build into a normal profile with `disabled: true`.
- Docker or devcontainers: `wxt --host 0.0.0.0`, disable the browser, and enable `watchOptions.usePolling` if file events are missed.
- Reload behavior: UI entrypoints get HMR; background changes reload the extension; content scripts reload individually. Reload the target tab after changes that affect injection timing.

## TypeScript, Vite, hooks

- `tsconfig.json`: `{ "extends": ".wxt/tsconfig.json" }` (generated by `wxt prepare`; 0.21 tightened it: `verbatimModuleSyntax`, `noUncheckedIndexedAccess`, `moduleResolution: Bundler`). Adjust through the `prepare:tsconfig` hook (for example push `WebWorker` into `lib`), not by guessing.
- `vite: (configEnv) => ({...})` takes any Vite config or plugins. Plugins that act only on `vite build` need a `configEnv.mode === 'production'` guard because dev uses a dev server plus builds.
- Do not set Vite build options casually; WXT's defaults produce store-accepted output.

## Upgrading WXT

Pre-1.0: every `0.X` bump can break. Procedure: `bun add -D wxt@latest` (skip scripts if needed), read the matching section of the Upgrading page, run `bunx wxt prepare`, then test dev and production. Recent breaks:

- 0.20.0: `webextension-polyfill` removed; `wxt/storage` moved to `wxt/utils/storage`; `runner` renamed `webExt`; `transformManifest` and `jiti` loader removed; `publicDir`/`modulesDir` relative to project root; shadow-root UIs reset inherited styles.
- 0.21.0/0.21.1: Node >= 22; Vite `^6.3.4 || ^7 || ^8`; `vite` required peer, `web-ext` and `typescript` optional peers; `url:` imports removed; `globalName` default `false`; `useAppConfig` renamed `getAppConfig`; zip template variables changed (`{{version}}` is `manifest.version`; use `{{versionName}}` for the old behavior; new `{{packageVersion}}` and `{{modeSuffix}}`; default zip name uses `packageVersion`); dev and non-production builds go to separate output dirs, so re-install the unpacked dev build.
- 0.21.2: `web-ext-run` removed. 0.21.3: `publish-browser-extension` v6 support; dev uses Vite 8. 0.21.4: warnings log once; `@wxt-dev/browser` range loosened.
