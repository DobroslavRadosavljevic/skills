# Testing and Debugging WXT Extensions

## Table of contents

- Test pyramid for extensions
- Unit tests: WxtVitest and fakeBrowser
- Testing content script logic
- Playwright E2E against the built extension
- Serving fixtures to real content scripts
- Debugging checklist
- Common errors

## Test pyramid for extensions

- Pure logic (parsers, selector extractors, URL/route matchers, storage migrations, message handlers): Vitest with `WxtVitest()`, no browser.
- Real behavior (content script injection, popup/options/side panel, service worker events, messaging between contexts): Playwright with the built extension loaded in Chromium.
- Live third-party sites (X, YouTube, ...): manual smoke checks. Automated tests against them are flaky and can trip bot detection; use saved HTML fixtures and request interception instead.

## Unit tests: WxtVitest and fakeBrowser

```sh
bun add -D vitest
```

```ts
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import { WxtVitest } from 'wxt/testing/vitest-plugin';

export default defineConfig({ plugins: [WxtVitest()] });
```

`WxtVitest()` polyfills `browser` with an in-memory `@webext-core/fake-browser`, merges the Vite config and plugins from `wxt.config.ts`, applies auto-imports, defines `import.meta.env.BROWSER` / `MANIFEST_VERSION`, and resolves `~`/`@` aliases. Run `bunx wxt prepare` first so `.wxt/` exists.

```ts
import { beforeEach, expect, it } from 'vitest';
import { fakeBrowser } from 'wxt/testing/fake-browser';
import { settings } from '~/utils/storage';

beforeEach(() => fakeBrowser.reset());           // reset in-memory storage, tabs, listeners

it('migrates v1 settings', async () => {
  await fakeBrowser.storage.local.set({ 'settings': { on: true } });
  expect(await settings.getValue()).toEqual({ enabled: true });
});
```

- Storage works without mocks (`storage.defineItem` runs on the fake `browser.storage`).
- To mock a WXT utility, mock its real module path, not `#imports`: `vi.mock('wxt/utils/inject-script', ...)`. Look up real paths in `.wxt/types/imports-module.d.ts`.
- `fakeBrowser` implements common APIs (storage, tabs, runtime messaging, alarms, ...). For anything it lacks (`offscreen`, `sidePanel`, `declarativeNetRequest`, `scripting`), inject the dependency or stub with `vi.fn()` on `fakeBrowser`.
- Other test runners need manual setup (disable auto-imports, aliases, a fake `browser`); prefer Vitest.

## Testing content script logic

Keep logic outside `main` in plain modules so it is testable without a page:

- `extractPost(article: Element): Post | null` takes an element and returns data. Test with fixtures in `tests/fixtures/*.html` loaded into `happy-dom`/`jsdom` (`environment` in the Vitest config or a per-file docblock).
- For `ContentScriptContext`-dependent code, build a real one: `new ContentScriptContext('test')` (import from `wxt/utils/content-script-context`) and call `ctx.notifyInvalidated()` to assert cleanup.
- Selector regressions: one test per fixture asserting each fallback strategy; add a new fixture whenever the live site changes.
- Route logic: unit-test `matchRoute(url)` with `MatchPattern` against sample URLs.

## Playwright E2E against the built extension

WXT calls Playwright the recommended E2E option. Chrome and Edge removed the flags needed to side-load extensions, so use Playwright's bundled Chromium (`channel: 'chromium'`), which also runs extensions headless. Load `.output/chrome-mv3` (build first: `bun run build`).

```ts
// e2e/fixtures.ts
import { test as base, chromium, type BrowserContext } from '@playwright/test';
import path from 'node:path';

const extensionPath = path.resolve(import.meta.dirname, '../.output/chrome-mv3');

export const test = base.extend<{ context: BrowserContext; extensionId: string }>({
  context: async ({}, use) => {
    const context = await chromium.launchPersistentContext('', {
      channel: 'chromium',
      args: [`--disable-extensions-except=${extensionPath}`, `--load-extension=${extensionPath}`],
    });
    await use(context);
    await context.close();
  },
  extensionId: async ({ context }, use) => {
    let [worker] = context.serviceWorkers();
    worker ??= await context.waitForEvent('serviceworker');
    await use(worker.url().split('/')[2]);
  },
});
export const expect = test.expect;
```

```ts
// e2e/popup.spec.ts
import { test, expect } from './fixtures';

test('popup renders', async ({ page, extensionId }) => {
  await page.goto(`chrome-extension://${extensionId}/popup.html`);
  await expect(page.getByRole('heading')).toBeVisible();
});
```

Notes:

- Extensions load only in a persistent context (`launchPersistentContext`). Use an empty `userDataDir` (`''`) for a temporary profile.
- Run `bunx playwright install chromium` after upgrading Playwright (current `@playwright/test@1.64.0`).
- MV3 service worker idle suspension: Playwright keeps the same `Worker` handle across restarts; calls issued during the restart wait, and calls already in flight throw "Service worker restarted".
- Reach the service worker for assertions: `await worker.evaluate(() => browser.storage.local.get())` (use `chrome` if `browser` is not defined in your target Chrome).
- Side panel and offscreen pages can be opened as tabs by URL (`chrome-extension://<id>/sidepanel.html`) for UI tests, though the real side panel chrome is not automatable.
- Test the production build (`wxt build`), not `wxt dev` output. For Firefox, Playwright cannot load WebExtensions into its Firefox build; use `bunx web-ext run` / `web-ext lint` and manual checks.
- A test that needs the dev-only `tabs`/`scripting` permissions will pass in dev and fail in production; keep E2E on the production build.

## Serving fixtures to real content scripts

Match patterns are enforced, so make the fixture appear at the real origin with request interception instead of editing manifests:

```ts
test('injects the download button', async ({ context, page }) => {
  await context.route('https://x.com/**', (route) =>
    route.fulfill({ contentType: 'text/html', body: fs.readFileSync('tests/fixtures/x-timeline.html', 'utf8') }));
  await page.goto('https://x.com/home');
  await expect(page.locator('my-ext-download')).toHaveCount(3);   // shadow host created by createShadowRootUi({ name })
});
```

- `createShadowRootUi({ name: 'my-ext-download' })` creates a custom-element host named from `name` (kebab-case, so it needs a dash); Playwright pierces open shadow roots in locators.
- Fixture HTML should include the stable anchors the extension relies on (`data-testid`, roles), not scripts that call out to the network.
- To simulate SPA navigation, run `history.pushState` in `page.evaluate` and assert UI teardown and remount.
- Stub extension network calls by routing the API host (`context.route('https://api.fxtwitter.com/**', ...)` style) so tests are deterministic.

## Debugging checklist

1. `chrome://extensions` (Developer mode): errors button, "service worker" link (opens the worker DevTools), "Inspect views", and Reload. Errors from the manifest appear on the card.
2. Content script logs appear in the page's console; pick the extension's context in the console's JavaScript context dropdown to run code in the isolated world.
3. Popup: right-click the action, Inspect popup. Options and side panel: right-click, Inspect.
4. Service worker not waking: `chrome://serviceworker-internals` shows state and lets you stop/start it to test restarts.
5. `wxt prepare --debug` prints how entrypoints are loaded (preprocessed code). Use it when the build fails importing an entrypoint.
6. Dev mode: `await browser.scripting.getRegisteredContentScripts()` in the worker console lists the dynamically registered scripts. If a script does not inject, check `matches`, `world`, the tab URL, and whether the tab was open before the extension reloaded (reload the tab).
7. Check `.output/<browser>-mv<N>/manifest.json` for the final permissions, matches, and file paths; compare with the entrypoint config.
8. Network issues: the service worker DevTools Network tab for background requests; DNR rules via `declarativeNetRequestFeedback` in an unpacked build (`getMatchedRules`).
9. Packed behavior: zip the build, unzip to a temp dir, load it; or `Pack extension` and drag the CRX in. Unpacked and packed can differ (Yellow Magnesium).
10. Update behavior: simulate a version change with Google's Extension Update Testing tool; check `onInstalled` `reason === 'update'`.

## Common errors

| Symptom | Cause and fix |
| --- | --- |
| `Could not establish connection. Receiving end does not exist.` | No listener: tab loaded before install/reload, restricted page, wrong frame, or worker not yet running. Catch it; reload the tab; check `matches`. |
| `Extension context invalidated.` | Orphaned content script after update/reload. Use `ctx` helpers; refresh the tab. |
| `Cannot read properties of undefined (reading 'addListener')` | API needs a permission (`alarms`, `contextMenus`, `sidePanel`) or does not exist in that browser/context. Add it to `manifest.permissions` and use `?.`. |
| Build fails importing an entrypoint | Runtime code outside `main` (DOM or `browser.*` at module top level). Move it inside `main`. |
| Types missing for auto-imports | Run `bunx wxt prepare`; add `postinstall`. |
| Message handler never replies | Handler is `async` and returns `undefined` for unrelated messages, or forgot `return true` on pre-148 Chrome. Return `undefined` synchronously for messages you do not own. |
| UI styles broken on one site | Page CSS leaking (use shadow root), `rem` scale (convert to px), or component library putting styles/portals outside the shadow root. |
| Works in dev, fails in production | Dev adds `tabs`/`scripting` permissions and registers content scripts dynamically; verify the production manifest. |
| `wxt dev` opens no browser | `web-ext` not installed (optional peer since 0.21) or `webExt.disabled`. |
