# Source Map

Snapshot date: 2026-10-09.

This reference records the official documentation and package evidence used to create the skill. Refresh sources when the task asks for latest behavior, a WXT bump, store policy, or when `wxt` in the lockfile is not `0.21.x`.

## Research Snapshot

- Context7 libraries: `/websites/wxt_dev` (high reputation), `/wxt-dev/wxt`, `/llmstxt/wxt_dev_llms_txt`; Chrome: `/websites/developer_chrome_extensions`, `/websites/developer_chrome_extensions_reference_api`, `/googlechrome/chrome-extensions-samples`. Context7 can lag; WXT docs serve Markdown for every page (`https://wxt.dev/<path>.md`) and `https://wxt.dev/llms.txt` lists them.
- npm versions observed on 2026-10-09:
  - `wxt` `latest` `0.21.4` (published 2026-08-11); dist-tag `next` `0.20.0-beta2` (stale). Peers: `vite ^6.3.4 || ^7.0.0 || ^8.0.0-0` (required), optional `web-ext >=9.2.0`, `typescript >=5.4`, `eslint`. Engines: `node >=22`, `bun >=1.2.0`.
  - Related: `@wxt-dev/module-react` `1.2.2`, `@wxt-dev/module-vue` `1.0.3`, `@wxt-dev/module-svelte` `2.0.5`, `@wxt-dev/storage` `1.3.0`, `@wxt-dev/i18n` `0.2.8`, `@wxt-dev/auto-icons` `1.1.2`, `@wxt-dev/analytics` `0.5.7`, `@wxt-dev/webextension-polyfill` `1.0.0`, `publish-browser-extension` `6.2.0`.
  - Tooling: `vite` `8.3.4`, `web-ext` `10.7.0`, `@playwright/test` and `playwright` `1.64.0`, `@types/chrome` `0.3.4`, `bun` `1.4.2`, `@crxjs/vite-plugin` `3.0.0` (2026-09-24), `vite-plugin-web-extension` `4.5.1`, `plasmo` `0.90.5` (last release 2025-05-17), `@webext-core/messaging` `4.0.0`, `webextension-polyfill` `0.12.0`.
- WXT changelog highlights used: 0.20.0 (polyfill removed, `wxt/utils/storage`, `webExt`), 0.20.14 (tsdown build; `onBeforeMount` for iframe UI), 0.20.18 (MV3 dev with Firefox 147; `@wxt-dev/is-background`), 0.20.22 (Firefox data collection permissions), 0.21.1 (Node 22, peers, `url:` imports removed, zip template vars), 0.21.2 (`web-ext-run` removed), 0.21.3 (`publish-browser-extension` v6, Vite 8 in dev), 0.21.4.
- Chrome platform facts verified from official pages (last-updated dates in brackets): service worker lifecycle [2023-05-02 page, still current], Chrome 148 `browser` namespace and promise `onMessage` [2026-05-08], structured-clone messaging opt-in [2026-04-22], `onMessage` errors reject sender from Chrome 146, Chrome 150 alarm name limit and `persistAcrossSessions`, Chrome 153 `publicSuffix`, MV2 timeline (store removal 2026-08-31), storage quotas [2026-09-11], DNR limits, CSP defaults, Chrome Web Store API v2 [2026-10-08].

## WXT Documentation

- Site and llms index: https://wxt.dev/ , https://wxt.dev/llms.txt
- Installation: https://wxt.dev/guide/installation.md
- Project structure: https://wxt.dev/guide/essentials/project-structure.md
- Entrypoints: https://wxt.dev/guide/essentials/entrypoints.md
- Extension APIs (`browser`): https://wxt.dev/guide/essentials/extension-apis.md
- Content scripts (ctx, UI helpers, injectScript, SPA): https://wxt.dev/guide/essentials/content-scripts.md
- Scripting: https://wxt.dev/guide/essentials/scripting.md
- Storage: https://wxt.dev/storage.md
- Messaging: https://wxt.dev/guide/essentials/messaging.md
- I18n: https://wxt.dev/guide/essentials/i18n.md , https://wxt.dev/i18n.md
- Targeting browsers: https://wxt.dev/guide/essentials/target-different-browsers.md
- Manifest config: https://wxt.dev/guide/essentials/config/manifest.md
- Browser startup: https://wxt.dev/guide/essentials/config/browser-startup.md
- Auto-imports: https://wxt.dev/guide/essentials/config/auto-imports.md
- Environment variables: https://wxt.dev/guide/essentials/config/environment-variables.md
- Runtime config: https://wxt.dev/guide/essentials/config/runtime.md
- Vite: https://wxt.dev/guide/essentials/config/vite.md
- Build modes: https://wxt.dev/guide/essentials/config/build-mode.md
- TypeScript: https://wxt.dev/guide/essentials/config/typescript.md
- Hooks: https://wxt.dev/guide/essentials/config/hooks.md
- Entrypoint loaders: https://wxt.dev/guide/essentials/config/entrypoint-loaders.md
- Modules: https://wxt.dev/guide/essentials/wxt-modules.md
- Frontend frameworks: https://wxt.dev/guide/essentials/frontend-frameworks.md
- ES modules: https://wxt.dev/guide/essentials/es-modules.md
- Assets: https://wxt.dev/guide/essentials/assets.md
- Unit testing: https://wxt.dev/guide/essentials/unit-testing.md
- E2E testing: https://wxt.dev/guide/essentials/e2e-testing.md
- Publishing: https://wxt.dev/guide/essentials/publishing.md
- Testing updates: https://wxt.dev/guide/essentials/testing-updates.md
- Migrate to WXT: https://wxt.dev/guide/resources/migrate.md
- Upgrading WXT: https://wxt.dev/guide/resources/upgrading.md
- FAQ: https://wxt.dev/guide/resources/faq.md
- Compare (Plasmo, CRXJS): https://wxt.dev/guide/resources/compare.md
- API reference: https://wxt.dev/api/reference/wxt/interfaces/InlineConfig.md , `.../WebExtConfig.md`, `.../BaseContentScriptEntrypointOptions.md`, `.../utils/content-script-context/classes/ContentScriptContext.md`, `.../utils/content-script-ui/shadow-root/functions/createShadowRootUi.md`, `.../utils/content-script-ui/types/interfaces/ContentScriptAnchoredOptions.md`
- Source (verified `wxt:locationchange` implementation): https://github.com/wxt-dev/wxt/blob/main/packages/wxt/src/utils/internal/location-watcher.ts
- Changelog: https://github.com/wxt-dev/wxt/blob/main/packages/wxt/CHANGELOG.md
- Examples repo (Playwright, Vitest, React content script UI): https://github.com/wxt-dev/examples
- `publish-browser-extension` config reference: https://github.com/aklinker1/publish-browser-extension/blob/main/docs/config-reference.md

## Chrome Platform Documentation

- What's new: https://developer.chrome.com/docs/extensions/whats-new
- Browser namespace: https://developer.chrome.com/docs/extensions/develop/concepts/browser-namespace
- Service worker lifecycle: https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle
- Messaging: https://developer.chrome.com/docs/extensions/develop/concepts/messaging
- Structured-clone messaging: https://developer.chrome.com/blog/structured-clone-messaging
- Content scripts: https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts
- Network requests: https://developer.chrome.com/docs/extensions/develop/concepts/network-requests
- Declare permissions: https://developer.chrome.com/docs/extensions/develop/concepts/declare-permissions
- Improve security / remote code: https://developer.chrome.com/docs/extensions/develop/migrate/improve-security
- MV2 timeline: https://developer.chrome.com/docs/extensions/develop/migrate/mv2-deprecation-timeline
- CSP manifest key: https://developer.chrome.com/docs/extensions/reference/manifest/content-security-policy
- Web-accessible resources: https://developer.chrome.com/docs/extensions/reference/manifest/web-accessible-resources
- APIs: `scripting`, `storage`, `declarativeNetRequest`, `sidePanel`, `offscreen`, `alarms`, `runtime` under https://developer.chrome.com/docs/extensions/reference/api/
- Native messaging: https://developer.chrome.com/docs/extensions/develop/concepts/native-messaging

## Store, Policy, and Other Browsers

- Chrome Web Store: publish https://developer.chrome.com/docs/webstore/publish , prepare https://developer.chrome.com/docs/webstore/prepare , review process https://developer.chrome.com/docs/webstore/review-process , troubleshooting violations https://developer.chrome.com/docs/webstore/troubleshooting , privacy fields https://developer.chrome.com/docs/webstore/cws-dashboard-privacy , API v2 https://developer.chrome.com/docs/webstore/using-api , quality guidelines FAQ https://developer.chrome.com/docs/webstore/program-policies/quality-guidelines-faq
- Firefox MV3 migration: https://extensionworkshop.com/documentation/develop/manifest-v3-migration-guide/
- Firefox data consent: https://extensionworkshop.com/documentation/develop/firefox-builtin-data-consent/
- MDN `background` manifest key (cross-browser service worker + scripts): https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/background
- Playwright Chrome extensions: https://playwright.dev/docs/chrome-extensions
- Edge publishing: https://learn.microsoft.com/microsoft-edge/extensions/publish/publish-extension
- Safari converter: https://developer.apple.com/documentation/safariservices/converting-a-web-extension-for-safari (page is JS-rendered; flags unverified, run `xcrun safari-web-extension-converter --help`)
- Bun bundler: https://bun.com/docs/bundler

## Refresh Triggers

Refresh when:

- The installed `wxt` is not `0.21.x` (pre-1.0, `0.X` bumps are breaking): read the Upgrading page and changelog first.
- Content script UI, `injectScript`, storage, i18n, or `webExt` behavior is in question: WXT docs and API reference change between minors.
- Chrome ships a new stable (the platform moves every four weeks): re-check What's new for deprecations.
- The task involves Chrome Web Store policy, rejections, API v2 auth, Firefox data collection permissions, or Safari packaging.
- Site-specific scraping guidance is needed: re-inspect the live site; per-site notes are time-sensitive.
- Observed runtime errors or the generated `.output` manifest disagree with this skill: trust the lockfile, the generated manifest, and current docs.
