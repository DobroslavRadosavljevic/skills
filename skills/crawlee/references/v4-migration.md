# Version Status and v3 to v4 Migration

## Status (2026-10-09)

| Tag | Version | Notes |
| --- | --- | --- |
| `latest` | `crawlee@3.18.2` (2026-09-29) | Stable. Node `>=16` declared (use 20+/22+), CJS+ESM-friendly, got-scraping default HTTP client. |
| `rc` | `crawlee@4.0.0-rc.1` (2026-10-06) | Release candidate: Node `>=22.13`, ESM only, impit default. Upgrade guide is at `crawlee.dev/js/docs/next/upgrading/upgrading-to-v4`. |
| `v4` | `4.0.0-beta.225` (moves daily) | Newer than rc.1; master docs describe features not in rc.1 (e.g. `sessionReuseStrategy`). |
| `next` | `3.18.2-beta.x` | v3 prereleases. |

Companions: `apify` 3.7.2 stable (4.0.0-beta.54 for Crawlee 4), `@crawlee/impit-client` and `@crawlee/*` must match `crawlee` exactly, `impit` 0.14.x, `playwright` 1.64.x, `puppeteer` 25.x (supported since 3.18), `camoufox-js` 0.12.x.

Recommendation: new production work on v3.18.2 unless a v4-only need exists (Bun, Node 22+ only fleet, transactional storage, per-domain throttling, impit default). A project already on 4.0.0-beta/rc should pin an exact version and re-read the upgrading guide on each bump; names changed between betas. Do not mix `@crawlee/*` majors.

## Migration order (v3 -> v4)

1. Pin Node >= 22.13 (24 if you want `await using`), TypeScript >= 5.8, `"type": "module"` or `require(esm)` support. Install `crawlee@rc` plus `@crawlee/impit-client` of the same version. Never use `--omit=optional`.
2. Upgrade `apify` to the matching 4.0 beta if you deploy Actors. Input handling moved to the SDK (`Actor.getInput()`), requiring `apify >= 4.0.0-beta.40` with rc.1.
3. Run a codemod-like pass for renames (table below), then fix type errors.
4. Re-test storage assumptions: purge scope, transactional writes, queue reuse between `run()` calls.
5. Re-test blocking: default HTTP client changed from got-scraping to impit; session options moved.
6. Capped smoke run, then a full run compared to v3 output counts and block rate.

## Rename and removal table

| v3 | v4 |
| --- | --- |
| `handlePageFunction`, `handleRequestFunction` | `requestHandler` |
| `handleRequestTimeoutSecs` | `requestHandlerTimeoutSecs` |
| `handleFailedRequestFunction` | `failedRequestHandler` |
| `persistCookiesPerSession` | `saveResponseCookies` |
| `ignoreSslErrors` | `ignoreTlsErrors` (default `true`) |
| `config` / `Configuration.getGlobalConfig()` / second ctor arg | `configuration` option / `getGlobalConfiguration()`; `Configuration` immutable; services via `serviceLocator` |
| `StorageClient`, `MemoryStorage`, `@crawlee/memory-storage` | `StorageBackend`, `MemoryStorageBackend`, `FileSystemStorageBackend` (`@crawlee/fs-storage`) |
| `RequestQueueV1/V2`, `RequestProvider` | `RequestQueue` |
| `IRequestList`, `requestList`/`requestQueue` options | `IRequestLoader`, `requestManager` (loader + queue via `.toTandem()`) |
| `SitemapRequestList` | `SitemapRequestLoader` |
| `RobotsFile` | `RobotsTxtFile` |
| `markRequestHandled()` | `markRequestAsHandled()` |
| `globs`, `regexps`, `pseudoUrls` | `include` (AND with `strategy`); `pseudoUrls` removed |
| `processedRequests` | `addedRequests` |
| `autoscaledPoolOptions` | `taskLoopOptions` (or `concurrencySystem`) |
| `crawler.stats`, `requestsFinished*` | `crawler.statistics`, `requestsSucceeded*` |
| `useSessionPool`, `sessionPoolOptions`, `maxSessionRotations` | `sessionPool: new SessionPool({...})`, `blockedStatusCodes` crawler option; `SessionError` counts toward `maxRequestRetries` |
| `Session.retireOnBlockedStatusCodes`, `getCookies/setCookies/setCookiesFromResponse` | `blockedStatusCodes`, `session.cookieJar`, `setCookie`, `getCookieString` |
| `browserPoolOptions` | `browserPool` option with `playwrightBrowserPool()` / `puppeteerBrowserPool()` |
| `gotOptions` / `gotoOptions` hook arg | context `{ gotoOptions }` |
| `gotScraping` from `@crawlee/utils` | `GotScrapingHttpClient` (`@crawlee/got-scraping-client`) |
| `handleCloudflareChallenge(page, url, opts, session)` | `handleCloudflareChallengeHook()`; drops `session` param |
| `KeyValueStore.getInput()` | `Actor.getInput()` |
| `Dataset.listItems()` | `getData()` / `values()` |
| `purgeRequestQueue` run option | removed (queue is not emptied between `run()` calls) |
| `enqueueLinks({ requestQueue, robotsTxtFile, respectRobotsTxtFile })` | `requestManager`; per-call robots options removed (crawler level only) |
| `SDK_*` internal KVS keys | `CRAWLEE_*` keys |
| `utils` bag, `closeCookieModals`, `idcac-playwright`, `PseudoUrl`, `@apify/pseudo_url` | direct imports / removed |
| `Response` from got | native `Response` from `HttpClient`, `sendRequest` |

## Behavior changes that bite

- Timeouts: handler (60 s) and navigation (HTTP 30 s, browser 60 s) are separate budgets; the internal timeout is 2x the handler timeout, min 5 min (`CRAWLEE_INTERNAL_TIMEOUT`).
- Storage: purge scope is run-scoped (default + `alias`); named storages never purge. Default-store purge now includes `INPUT`. Writes inside a handler commit only if the handler succeeds (`transactionalStorage`).
- Only the first crawler in a process uses the default queue; later crawlers get `__default_N__`. `crawler.running` is read-only; `teardown()` is per-run; `destroy()` releases the browser pool.
- robots.txt follows RFC 9309 (4xx = allow all, 5xx = disallow all). `sameDomainDelaySecs` uses `ThrottlingRequestManager`.
- HTTP client: default is `ImpitHttpClient` (warns and falls back to `fetch` if native binaries are missing). `sendRequest` returns a native `Response`. Cookie headers are assembled by the client; an explicit `Cookie` header wins over the jar.
- `AdaptivePlaywrightCrawler` and `FileDownload` now extend `BasicCrawler`; `FileDownload` takes `BasicCrawlerOptions`.
- Crawler-only code moved from `@crawlee/core` to `@crawlee/basic` (rc.1); `@crawlee/jsdom`/`@crawlee/linkedom` moved to a separate repo and release cadence (rc.1). A pluggable `DomCrawler` and OpenTelemetry (`@crawlee/otel`) were added in rc.1.
- New helpers: `extendContext`/`ContextPipeline`, `extendTimeout()`, `skipRequest()`, `extractLinks()`, `afterStorageCommit()`, `withDirectStorageAccess()`, `initialConcurrency`, `RequestQueue.open({ alias })`.

## Staying on v3 safely

- Pin `crawlee`, all `@crawlee/*`, and `apify` to exact versions. Do not use `crawlee@next`/`@v4` in production.
- v3 deprecations to fix now (they disappear in v4): `handle*` names, `pseudoUrls`, `useSessionPool`/`sessionPoolOptions`, `persistCookiesPerSession`, `ignoreSslErrors`, `requestList`+`requestQueue` pairs, context `error` property, `markRequestHandled`.
- Move to `ImpitHttpClient` early (`@crawlee/impit-client`): it is the v4 default and removes got-scraping.
