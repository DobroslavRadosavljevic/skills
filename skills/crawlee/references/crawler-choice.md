# Crawler Choice, HTTP Clients, Impersonation

Facts verified against crawlee 3.18.2 source and the v4 docs on 2026-10-09. v4 deltas are marked.

## Decision table

| Need | Crawler | Why / watch out |
| --- | --- | --- |
| Static or server-rendered HTML | `CheerioCrawler` | Fastest, cheapest. Gives `$` (cheerio), `body`, `json`. No JS. |
| JSON API, XML, RSS, text, raw bytes | `HttpCrawler` | No parsing. Use `body`, `json`, `contentType`. Add `additionalMimeTypes` for odd content types. |
| Need `window`, `document`, light DOM APIs | `JSDOMCrawler` | jsdom. `runScripts: true` runs page scripts (slow, partial browser). v4: package moved to its own release line. |
| Same, lighter | `LinkeDOMCrawler` | linkedom `document`. Faster, less complete. |
| JS-rendered content, clicks, login, scroll, screenshots | `PlaywrightCrawler` | Default browser choice. Locators auto-wait. Chromium/Firefox/WebKit. |
| Existing Puppeteer code, Chrome-only | `PuppeteerCrawler` | No auto-wait; call `page.waitForSelector`. Chrome/Chromium only. |
| Unknown or mixed rendering across many sites | `AdaptivePlaywrightCrawler` | Tries HTTP, samples browser runs, learns per route. Experimental in v3. Handler must be side-effect free. |
| Custom transport, non-page jobs, your own fetch | `BasicCrawler` | You fetch and parse yourself. Still gets queue, retries, sessions, autoscaling. |
| Binary downloads / streams | `FileDownload` | Streams response; v4 extends `BasicCrawler`. |
| Cloudflare-class bot walls | `PlaywrightCrawler` + Camoufox | Disable built-in fingerprints when using Camoufox. Needs good proxies. May still fail. |

Escalation order: raw JSON/XHR endpoint -> `CheerioCrawler` -> `CheerioCrawler` + impit -> `AdaptivePlaywrightCrawler` -> `PlaywrightCrawler` -> Camoufox + residential proxies. Each step costs roughly an order of magnitude more CPU, RAM, and money.

Check before choosing a browser: view-source for the data, DevTools Network for the XHR/GraphQL call, `<script type="application/ld+json">`, `__NEXT_DATA__`/`window.__INITIAL_STATE__` blobs. Those are readable with Cheerio.

## Common context (all crawlers)

`request`, `session`, `proxyInfo`, `log`, `enqueueLinks`, `addRequests`, `pushData`, `useState`, `getKeyValueStore`, `sendRequest` (uses the crawler's HTTP client), `crawler`. Browser crawlers add `page`, `browserController`, `response`, `waitForSelector`, `parseWithCheerio(selector?, timeoutMs?)`, `infiniteScroll`, `blockRequests` (Chromium only), `saveSnapshot`, `enqueueLinksByClickingElements`, `handleCloudflareChallenge` (v3; `closeCookieModals` is removed in v4). HTTP crawlers add `body`, `json`, `contentType`, `response`.

Hooks: `preNavigationHooks` / `postNavigationHooks` (set cookies, block resources, check for walls; v3 second arg is `gotOptions`/`gotoOptions`, v4 uses `{ gotoOptions }` on the context). Navigation limit: `navigationTimeoutSecs`. Handler limit: `requestHandlerTimeoutSecs` (default 60).

## HttpCrawler / CheerioCrawler options worth knowing (v3)

- `httpClient`: `GotScrapingHttpClient` (v3 default) or `ImpitHttpClient` (separate package). Custom clients implement `BaseHttpClient`.
- `additionalMimeTypes`, `suggestResponseEncoding`, `forceResponseEncoding` for non-UTF-8 pages.
- `ignoreHttpErrorStatusCodes`, `additionalHttpErrorStatusCodes`: by default status >= 500 throws (retry). Add 404 handling here instead of inside the handler.
- `ignoreSslErrors` (v4: `ignoreTlsErrors`, default `true`).
- `persistCookiesPerSession` (v4: `saveResponseCookies`), `proxyConfiguration`, `useSessionPool`, `blockedStatusCodes`.
- `JSDOMCrawler`: `runScripts`, `hideInternalConsole`; context has `window` and `waitForSelector`.

## Impit and impersonation

`@crawlee/impit-client` wraps the `impit` library (browser-like TLS ClientHello and HTTP/2 fingerprints, no browser). Needed when plain Node HTTP gets 403/challenge on the TLS layer but the page is still static.

```ts
import { CheerioCrawler } from 'crawlee';
import { ImpitHttpClient } from '@crawlee/impit-client';

const crawler = new CheerioCrawler({
    httpClient: new ImpitHttpClient({ browser: 'chrome' }), // or 'firefox'
    // ...
});
```

- Install: `bun add @crawlee/impit-client` (same version as `crawlee`). Native binary arrives via optional deps: never install with `--omit=optional`. Alpine/musl and arm64 need the matching `impit-*` optional package.
- Options are `ImpitOptions` minus `proxyUrl` (Crawlee supplies the session proxy) plus `maxRedirects` (default 10), `followRedirects` (default true), `cacheClients` (default true; reuse clients per option set, disable only if you need fresh connections).
- Versioned fingerprints (e.g. a pinned `chrome` version) and HTTP/3 depend on the installed `impit`; HTTP/3 and proxies do not combine. Read the `impit` docs for the current list.
- Impersonation covers TLS and headers only. It does not run JS, so JS challenges still need a browser.
- v4: `ImpitHttpClient` is the default client; a `fetch` fallback warns if the native binary is missing. The session's `fingerprint` hint (`browser`, `platform`, `device`) selects the impit profile, so it rotates with the session. `GotScrapingHttpClient` moved to `@crawlee/got-scraping-client`.
- Do not hand-set `User-Agent` on top of impersonation unless it matches the profile; mismatched UA vs TLS is a common tell.

## Browser crawlers

```ts
import { PlaywrightCrawler } from 'crawlee';

const crawler = new PlaywrightCrawler({
    headless: true,
    launchContext: { launchOptions: { args: ['--disable-dev-shm-usage'] } },
    maxConcurrency: 5,
    requestHandlerTimeoutSecs: 90,
    async requestHandler({ page, request, enqueueLinks, pushData }) {
        await page.waitForSelector('.item');
        await pushData({ url: request.loadedUrl, title: await page.title() });
        await enqueueLinks({ selector: 'a.next' });
    },
});
```

- Install the browser separately: `bunx playwright install chromium --with-deps` (CI/Docker). The pinned `playwright` version must match the browser build.
- Fingerprints are on by default (`browserPoolOptions.useFingerprints`, `fingerprintOptions.fingerprintGeneratorOptions` for `browsers`, `devices`, `operatingSystems`, `locales`). v4 replaces `browserPoolOptions` with `playwrightBrowserPool()` / `puppeteerBrowserPool()` factories.
- `browserPoolOptions.retireBrowserAfterPageCount` and `launchContext.useIncognitoPages` trade isolation for speed; `launchContext.useChrome` (Puppeteer) picks installed Chrome. With per-session proxies, `useIncognitoPages: true` lets one browser serve several proxies in isolated contexts; without it, expect one browser process per proxy (more RAM).
- Speed up: block images/fonts/media with `blockRequests` or a route in `preNavigationHooks`; reuse sessions; avoid `networkidle` waits.
- Headless is off by default unless `headless: true` or `CRAWLEE_HEADLESS=1`. Containers need headless or Xvfb.
- Camoufox (`camoufox-js`) is a stealth Firefox: set `browserPoolOptions: { useFingerprints: false }`, `launchContext: { launcher: firefox, launchOptions: await launchOptions({ headless: true }) }`, and add `handleCloudflareChallenge` in `postNavigationHooks` (v4: `handleCloudflareChallengeHook()`). It may not pass every challenge.

## AdaptivePlaywrightCrawler

- Options: `renderingTypeDetectionRatio` (default 0.1), `resultChecker(result)` (false -> retry in browser), `resultComparator(a, b)`, `renderingTypePredictor`, `shouldPropagateError` (3.17+), plus all Playwright crawler options.
- Handler context: `querySelector(sel, timeoutMs)`, `waitForSelector`, `parseWithCheerio`, `page` (throws in HTTP mode, which triggers a browser retry), `enqueueLinks`, `pushData`.
- The handler may run twice for the same request (HTTP then browser, plus detection runs). Write results only via context helpers; no external side effects in the handler. v3 enforces this with `preventDirectStorageAccess` (default true); v4 uses per-attempt transactional buffering.
- Use `resultChecker` to reject empty/partial HTTP results so JS-only fields trigger a browser run.
