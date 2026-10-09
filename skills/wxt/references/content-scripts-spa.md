# Content Scripts and SPA Page Work

## Table of contents

- Content script fundamentals
- Registration modes and programmatic injection
- ISOLATED vs MAIN world and bridging
- Orphaned content scripts and ctx
- URL change detection on SPAs
- DOM observation patterns
- Injecting UI
- Selector resilience and data sources
- Per-site notes (time-sensitive)
- Etiquette and risk

## Content script fundamentals

In WXT a content script is `entrypoints/content.ts` or `entrypoints/{name}.content.ts` (or `{name}.content/index.ts` with companion files), exporting `defineContentScript`. Options: `matches`, `excludeMatches`, `includeGlobs`, `excludeGlobs`, `runAt`, `allFrames`, `matchAboutBlank`, `matchOriginAsFallback`, `world`, `cssInjectionMode`, `registration`, `include`/`exclude`, plus `main(ctx)`. Everything runtime-only goes inside `main`.

```ts
// entrypoints/x.content.ts
import './x.css';

export default defineContentScript({
  matches: ['https://x.com/*', 'https://twitter.com/*'],
  runAt: 'document_idle',
  main(ctx) { /* observers, UI, listeners */ },
});
```

- `runAt`: `document_idle` (default and preferred), `document_end` (DOM complete, before images/frames), `document_start` (before any page script; needed to patch page APIs in MAIN world).
- Top frame only by default. `allFrames: true` runs in every matching frame; filter with `window === window.top` yourself. Cross-origin iframes are separate instances.
- `matchOriginAsFallback` covers `about:`, `data:`, `blob:` frames by initiator origin (path must be `*`).
- Content scripts run once per document load. SPA route changes do not re-run them (see below).
- `import './style.css'` in the entrypoint puts the bundled CSS in the manifest `css` array. That CSS is page-global; use `cssInjectionMode: 'ui'` with a shadow-root UI to isolate it.
- Content scripts cannot use `tabs`, `downloads`, and most other APIs. They have `runtime`, `storage`, `i18n`, and `dom`. Ask the background for the rest.
- Content-script `fetch()` follows the page's CORS rules even with `host_permissions`. Cross-origin reads go through the background.
- WXT bundles each content script as one classic script. Static `import` of other chunks and ESM content scripts are not built in; import shared code normally and let WXT inline it.
- During `wxt dev`, content scripts are registered at runtime (not in the manifest) so they reload independently.

## Registration modes and programmatic injection

| Method | Use when | Notes |
| --- | --- | --- |
| `registration: 'manifest'` (default) | Fixed, known sites | Host access is shown at install. Static scripts run first. |
| `registration: 'runtime'` | Sites chosen at runtime, optional host permissions, or scripts you inject yourself | WXT does not add it to the manifest. Call `browser.scripting.executeScript({ target, files: ['content-scripts/name.js'] })` or `browser.scripting.registerContentScripts([...])`. The value returned from `main` is the `executeScript` result. Needs `scripting` plus host permission or `activeTab`. |
| `browser.scripting.executeScript({ func, args, world })` | Click-driven or one-shot reads (for example `world: 'MAIN'` to read a page global) | `func` is serialized: self-contained, args and return structured-cloneable. Returns `[{ frameId, result }]`. |

```ts
// background: register at runtime (persistAcrossSessions defaults to true)
await browser.scripting.registerContentScripts([{
  id: 'site-hook', matches: ['https://www.example.com/*'],
  js: ['hook.js'], runAt: 'document_start', world: 'MAIN',
}]);
```

- Built content-script files are named `content-scripts/<name>.js` (for example `files: ['content-scripts/example.js']`); confirm in `.output/chrome-mv3/`.
- Guard double injection: `if ((window as any).__myExt) return;` at the top of `main` before `executeScript` re-runs.
- `userScripts` is for user-script managers (needs "Allow User Scripts"); do not use it to run server-supplied logic.

## ISOLATED vs MAIN world and bridging

- ISOLATED (default): own JS globals, shared DOM, has `browser.*`. Cannot see page variables or page functions. The page CSP does not block the script itself.
- MAIN: shares JS globals with the page, no `browser.*`, page CSP applies, and the page can observe or tamper with it. Never put secrets or privileged logic here.

Use MAIN only to (a) read page-owned data, (b) wrap `fetch`, `XMLHttpRequest`, `history`, or `WebSocket` to observe the app's own traffic, (c) call page functions.

WXT's recommended pattern is `injectScript`, which keeps a parent content script (with extension APIs) beside the MAIN-world code and works on MV2 and MV3, all browsers:

```ts
// entrypoints/main-hook.ts  (unlisted script, built to /main-hook.js)
export default defineUnlistedScript(() => {
  const script = document.currentScript;            // the <script> element WXT inserted
  const origFetch = window.fetch;
  window.fetch = async function (...args) {
    const res = await origFetch.apply(this, args);
    try {
      const url = String(args[0] instanceof Request ? args[0].url : args[0]);
      if (url.includes('/graphql')) {
        res.clone().json().then((json) =>
          script?.dispatchEvent(new CustomEvent('from-page', { detail: { url, json } }))).catch(() => {});
      }
    } catch {}
    return res;
  };
});

// entrypoints/site.content.ts
export default defineContentScript({
  matches: ['https://www.example.com/*'],
  runAt: 'document_start',                          // MV3: the injected script runs at the content script's run_at
  async main(ctx) {
    await injectScript('/main-hook.js', {
      keepInDom: true,
      modifyScript(el) {
        el.addEventListener('from-page', (e) => {
          if (e instanceof CustomEvent) void browser.runtime.sendMessage({ type: 'api-payload', ...e.detail });
        });
      },
    });
  },
});
```

```ts
// wxt.config.ts
manifest: { web_accessible_resources: [{ resources: ['main-hook.js'], matches: ['https://www.example.com/*'] }] }
```

- `injectScript` resolves once the browser evaluated the script; it returns `{ script }`, the element. Pass data in with `modifyScript(el) { el.dataset.x = '...' }` and read `document.currentScript?.dataset.x`. Bidirectional messages use `CustomEvent` on that element.
- On MV2 (Firefox default build) `injectScript` fetches the file text and inserts an inline script, asynchronously and not at `run_at`, and page CSP can block it.
- `world: 'MAIN'` directly on `defineContentScript` is simpler but has no extension API and no MV2. If you use it, bridge with `window.postMessage({ channel, ... }, window.origin)` and validate `e.source === window` plus the channel in the isolated listener. Treat every payload as untrusted and validate its shape with a schema validator.
- Keep wrappers transparent (`this`, arguments, return identity), wrap in `try/catch`, and never delay returning the original promise. Sites detect altered natives and some verify integrity.
- Prefer an on-demand `executeScript({ world: 'MAIN', func })` when data is only needed at click time, so nothing is patched.

## Orphaned content scripts and ctx

After an extension update, reload, or disable, injected scripts keep running but lose the runtime connection; `browser.runtime.sendMessage` throws `Extension context invalidated.` WXT's `ContentScriptContext` (the `ctx` argument) tracks this:

- `ctx.isValid` / `ctx.isInvalid`, `ctx.signal` (an `AbortSignal`), `ctx.onInvalidated(cb)`, `ctx.abort()`, `ctx.block()`.
- Safe wrappers that stop when invalidated: `ctx.addEventListener(target, type, handler)`, `ctx.setTimeout`, `ctx.setInterval`, `ctx.requestAnimationFrame`, `ctx.requestIdleCallback`.
- WXT also stops older copies of the same content script when a newer one starts, which covers dev reloads.

```ts
main(ctx) {
  const mo = new MutationObserver(() => schedule());
  mo.observe(root, { childList: true, subtree: true });
  ctx.onInvalidated(() => mo.disconnect());           // observers are not wrapped for you
  ctx.addEventListener(window, 'wxt:locationchange', onRoute);
  ctx.setInterval(poll, 1000);
}
```

- Wrap runtime calls: `try { await browser.runtime.sendMessage(...) } catch { /* context gone: show "refresh the page" */ }`.
- MutationObservers, IntersectionObservers, WebSocket/EventSource, and nodes you inserted (outside `createShadowRootUi`/`createIntegratedUi`, which remove their own UI on invalidation) need explicit cleanup in `ctx.onInvalidated`.
- Keep one `teardown()` for route changes and for invalidation.
- Plain idempotency still matters when the same script is injected twice (`registration: 'runtime'`): mark a root element and return early if it exists.

## URL change detection on SPAs

The page never reloads, so route logic must follow navigation signals, in order of preference:

1. **`wxt:locationchange`** (built in): WXT starts a watcher when you register a listener through `ctx.addEventListener`, using the Navigation API where available and 1 s `location.href` polling otherwise, and dispatches the event on `window` with `newUrl` and `oldUrl` as `URL` objects: `ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl, oldUrl }) => ...)`. Match with `MatchPattern` (auto-imported, from `wxt/utils/match-patterns`): `new MatchPattern('*://*.youtube.com/watch*').includes(newUrl)`. Declare `matches` broadly (`*://*.youtube.com/*`) so the script is present before the user reaches the page you care about.
2. The Navigation API directly (`navigation.addEventListener('navigate' | 'navigatesuccess', ...)`) when you need more than a URL change; verify support outside Chromium.
3. `browser.webNavigation.onHistoryStateUpdated` / `onCommitted` in the background (`webNavigation` permission, URL filter), then `browser.tabs.sendMessage`. Reliable, but adds a permission.
4. Site events as a speed-up, never the only signal: YouTube dispatches `yt-navigate-start`, `yt-navigate-finish`, and `yt-page-data-updated` on `document`. Undocumented.
5. Last resort: low-frequency `location.href` polling with `ctx.setInterval`.

```ts
const watchPattern = new MatchPattern('*://*.youtube.com/watch*');

export default defineContentScript({
  matches: ['*://*.youtube.com/*'],
  cssInjectionMode: 'ui',
  main(ctx) {
    let ui: Awaited<ReturnType<typeof mountWatchUi>> | undefined;
    const onRoute = async (url: string) => {
      ui?.remove(); ui = undefined;                       // teardown the previous route
      if (watchPattern.includes(url)) ui = await mountWatchUi(ctx);
    };
    void onRoute(location.href);                          // first load
    ctx.addEventListener(window, 'wxt:locationchange', ({ newUrl }) => void onRoute(newUrl.href));
  },
});
```

Plain-code version of the same idea:

```ts
let lastKey = '';
function onRouteMaybeChanged() {
  const key = location.pathname + location.search;
  if (key === lastKey) return;
  lastKey = key;
  teardownPage();            // remove UI/observers owned by the previous route
  const route = matchRoute(location.pathname); // /watch, /shorts/:id, /@user/status/:id, ...
  if (route) mountForRoute(route);
}
```

Route changes often fire before the new view is in the DOM. After the signal, wait for the anchor element (below) instead of reading immediately.

## DOM observation patterns

- Scope narrowly. Observe the feed/container, not `document.body` with `subtree: true, attributes: true`. If the container is replaced on navigation, observe a stable parent and re-resolve the child, or re-attach on route change.
- Use `childList: true, subtree: true` and ignore your own nodes (skip mutations whose added nodes carry your marker class) or you will loop.
- Debounce with `requestAnimationFrame` (batch to once per frame) or a short `setTimeout`; never run a full-document `querySelectorAll` per mutation record.
- Idempotent per element: mark processed nodes with `data-myext="1"` or a `WeakSet`; re-scan is then cheap and safe. Virtualised lists (X timeline, Instagram feed, TikTok feed) recycle nodes, so the same element can hold a different item later; store the item id on the marker and compare, do not assume "seen once".
- `waitForElement(selector, { root, timeout })`: resolve from an existing match, else observe until found, reject after a timeout (5 to 15 s), and `disconnect` in all paths.
- Use `IntersectionObserver` to act only on visible items (lazy mount per card), `ResizeObserver` to reposition overlays.
- Clean up on route change and when the extension context dies.
- Never block the main thread: yield (`await scheduler.yield?.()` or `requestIdleCallback`) in long scans.

```ts
// utils/wait-for.ts (auto-imported); pass ctx.signal so it stops when the content script is invalidated
export function waitFor<T extends Element>(sel: string, opts: { root?: ParentNode; timeoutMs?: number; signal?: AbortSignal } = {}): Promise<T> {
  const { root = document, timeoutMs = 10_000, signal } = opts;
  const hit = root.querySelector<T>(sel);
  if (hit) return Promise.resolve(hit);
  return new Promise((resolve, reject) => {
    const done = () => { mo.disconnect(); clearTimeout(t); signal?.removeEventListener('abort', onAbort); };
    const onAbort = () => { done(); reject(new Error('aborted')); };
    const mo = new MutationObserver(() => {
      const el = root.querySelector<T>(sel);
      if (el) { done(); resolve(el); }
    });
    const t = setTimeout(() => { done(); reject(new Error(`Timed out: ${sel}`)); }, timeoutMs);
    signal?.addEventListener('abort', onAbort, { once: true });
    mo.observe(root === document ? document.documentElement : (root as Element), { childList: true, subtree: true });
  });
}
```

## Injecting UI

WXT ships three helpers; pick by isolation need:

| Helper | Isolated styles | Isolated events | HMR | Notes |
| --- | :-: | :-: | :-: | --- |
| `createIntegratedUi(ctx, opts)` | no | no | no | Lives in the page's cascade; use for tiny native-looking additions. |
| `createShadowRootUi(ctx, opts)` (async) | yes | opt-in (`isolateEvents`) | no | Default choice. Needs `cssInjectionMode: 'ui'` and the CSS imported in the entrypoint. |
| `createIframeUi(ctx, opts)` | yes | yes | yes | Hosts an extension page (`page: '/panel.html'`); add the page to `web_accessible_resources`. No access to the page's context. |

All return `{ mount, remove, autoMount, mounted, ... }` and accept `position` (`inline` | `overlay` | `modal`, with `alignment` for overlay and `zIndex`), `anchor` (CSS selector, XPath, element, or a function returning one), `append` (`last` default, `first`, `replace`, `before`, `after`, or `(anchor, ui) => void`), `onMount(container, ...)`, `onRemove(mounted)`. Shadow root options also include `name`, `css`, `mode`, `inheritStyles`, `isolateEvents`; its `onMount` receives `(container, shadow, shadowHost)`. `ui.autoMount({ once, onStop })` returns `stopAutoMount` (stops watching but keeps the UI).

```ts
import './style.css';

export default defineContentScript({
  matches: ['https://x.com/*'],
  cssInjectionMode: 'ui',
  async main(ctx) {
    const ui = await createShadowRootUi(ctx, {
      name: 'my-ext-download',
      position: 'inline',
      anchor: 'article[data-testid="tweet"] [role="group"]',   // watched element
      append: 'last',
      isolateEvents: true,                                       // stop clicks/keys leaking to the site
      onMount(container) {
        const btn = document.createElement('button');
        btn.type = 'button'; btn.textContent = 'Save'; btn.setAttribute('aria-label', 'Save post media');
        container.append(btn);
        return btn;
      },
      onRemove(btn) { btn?.remove(); },
    });
    ui.autoMount();     // mount/unmount as anchors appear and disappear; ui.remove() also stops autoMount
  },
});
```

Notes:

- `autoMount()` observes the `anchor`; for a feed with one UI per item, create a UI per item element (pass the element as `anchor`) and track them in a `WeakMap`, since a single selector anchor mounts once.
- Framework apps: create the root in `onMount` and unmount in `onRemove` (React: append a wrapper `div` inside `container`, since `container` is a body). Component libraries that inject `<style>` into `document.head` or portal dialogs to `document.body` break inside shadow roots: give them the shadow's `head`/`body` (`shadow.querySelector('head')`) as their style/portal container (WXT FAQ has Ant Design, Mantine, Vue Teleport and React portal fixes).
- `rem` is relative to the host page's `<html>` font size. If the UI scales wrongly on some sites, convert rem to px at build time with `postcss-rem-to-responsive-pixel` (`rootValue: 16`, `propList: ['*']`, `transformUnit: 'px'`) in `postcss.config.mjs`.
- Plain DOM alternative without WXT helpers: `host.attachShadow({ mode: 'open' })`, a `<style>` inside the shadow root, one host element with a stable id.
- Closed shadow roots on the page: `browser.dom.openOrClosedShadowRoot(element)` (content scripts only) returns the root even when closed.
- Match the host's look when injecting into a native toolbar (copy computed color/size from a sibling icon with `getComputedStyle`), and use `aria-label`, `title`, `role`, `type="button"` and keyboard focus styles.
- Inject next to a stable anchor and keep one instance per item; re-attach if the framework removes your node (a MutationObserver on the anchor's parent, or WXT `autoMount`).
- Trusted Types: some sites (YouTube, Google properties) enforce `require-trusted-types-for 'script'` in the page world. Build nodes with `createElement`, `textContent`, `setAttribute`, `DOMParser`, and `Element.replaceChildren`; avoid assigning `innerHTML` with dynamic strings. This also avoids XSS from scraped text.
- Never put extension API keys or tokens in the injected DOM; the page can read it.

## Selector resilience and data sources

Order of preference for getting data:

1. The site's own embedded JSON (hydration blobs in `<script>` tags, global player objects) or its API responses seen via a MAIN-world fetch hook. Structured data survives redesigns better than markup. Validate with a schema and tolerate missing fields.
2. Stable attributes: `data-testid`, `role`, `aria-label`, `aria-labelledby`, `itemprop`, `name`, `<time datetime>`, canonical links, `og:` meta tags.
3. URL structure (`/status/:id`, `/watch?v=`, `/reel/:id`, `/shorts/:id`, `/video/:id`) to derive ids instead of scraping them.
4. Structural selectors (`article > div > div`) as a last resort.
5. Generated or hashed class names (`css-1dbjc4n`, `x1lliihq`) almost never. They change with deploys.

Practices:

- Centralise selectors in one module with named strategies and fallbacks, tried in order; log which strategy matched (to the console in dev only).
- Text matching breaks on locale. Prefer attributes and structure; if text is unavoidable, match multiple locales or use `aria-label` plus `data-testid`.
- Make each feature fail closed and quiet: if the anchor is not found, skip injection; surface one clear status ("Could not find media on this page"), not an exception loop.
- Keep selector fixtures: save representative HTML (a tweet card, a watch page header) under `tests/fixtures/` and unit-test extractors against them with Vitest + jsdom/happy-dom. Re-capture fixtures when the site changes.
- Add a manual smoke checklist per site for logged-out and logged-in states, desktop widths, and dark mode, since live-site automated tests are flaky and may trigger bot detection.
- Avoid reading more than the feature needs. Do not send page content, URLs, or identifiers to third parties without disclosure and need (see publishing privacy rules).

## Per-site notes (time-sensitive; verify against the live site before relying)

These are patterns observed in practice, not contracts.

| Site | Typical anchors and quirks |
| --- | --- |
| X / Twitter | Domains `x.com` and `twitter.com`. Timeline items are `article[data-testid="tweet"]`; action row is a `[role="group"]` containing `[data-testid="reply"]`; media in `[data-testid="tweetPhoto"]`, `video`, `[data-testid="videoPlayer"]`; ids from `time` inside `a[href*="/status/"]`. Virtualised timeline recycles nodes. Video sources are `blob:` MSE streams, so resolve media from the post id via an API or the site's GraphQL responses, not from `video.src`. Classes are hashed. |
| YouTube | Polymer SPA with `yt-navigate-*` events and `ytd-*` custom elements. First-load data sits in `ytInitialData` / `ytInitialPlayerResponse` globals (MAIN world only) and can be stale after SPA navigation; later data arrives via `/youtubei/v1/*` responses. Enforces Trusted Types. Shorts (`/shorts/:id`) and watch pages use different layouts. Feed cards come in older renderer elements and newer `yt-lockup-view-model` elements, so cover both. Ads and live/premiere states change the player DOM. |
| TikTok | Feed of full-screen items; the "visible video" is the one in the viewport (IntersectionObserver). Hydration JSON in a `script#__UNIVERSAL_DATA_FOR_REHYDRATION__` tag for first load; later items arrive via API calls. Playback URLs are signed and expire. Shadow-root host UI avoids their aggressive CSS. |
| Twitch | Clip pages `/clip/:slug`, channel `/videos`, VOD `/videos/:id`. The web app reads data from Twitch's GraphQL endpoint; observe those responses (MAIN-world hook) rather than replaying calls with the site's client id. Player overlays re-render often; anchor to the player container and re-attach. |
| Kick | Channel, clip, and VOD pages inside a single-page app. Check the page's own network calls for the clip/VOD source (often HLS playlists). Cloudflare-style bot protection can reject requests made outside the page's browser context, so test from a loaded extension and degrade with a clear message. |
| Instagram | Feed, Reels, Stories, and post dialogs (`role="dialog"`) share a React shell; posts live at `/p/:code`, `/reel/:code`, `/stories/:user/:id`. Media URLs come from internal GraphQL/REST responses; `<video>` often has a `blob:` source. Strong bot detection: do not hammer requests. |
| Facebook | Relay-based, highly obfuscated class names; stable hooks are `role="article"`, `role="navigation"`, `aria-label`, `href` patterns (`/reel/`, `/watch/?v=`, `/photo/`). Data is in `<script type="application/json" data-sjs>` blobs and GraphQL responses; hook `fetch`/XHR in MAIN at `document_start`. Layout differs per logged-in experiment. |

For any of these: identify the site's own API response or embedded JSON first; scrape markup only for placement (where to put a button).

## Etiquette and risk

- Respect each site's terms and rate limits. Do not automate engagement actions (likes, follows, posting), mass-scrape, or evade bot checks.
- Do not exfiltrate cookies, tokens, or private content. Keep processing local where possible and disclose data flows in the privacy fields.
- Downloading media you do not own, or bypassing login/paywalls, is a store-policy and legal risk (Prohibited products). See [publishing-review.md](publishing-review.md).
