# Routing, Links, Queues, Sitemaps, robots.txt

Verified against crawlee 3.18.2 source; v4 deltas marked.

## Router and labels

```ts
// routes.ts
import { createCheerioRouter, Dataset } from 'crawlee';

export const router = createCheerioRouter();

router.addDefaultHandler(async ({ enqueueLinks }) => {
    await enqueueLinks({ selector: 'a.category', label: 'CATEGORY' });
});

router.addHandler('CATEGORY', async ({ enqueueLinks }) => {
    await enqueueLinks({ selector: 'a.product', label: 'DETAIL' });
    await enqueueLinks({ selector: 'a.next', label: 'CATEGORY' }); // pagination
});

router.addHandler('DETAIL', async ({ request, $, pushData }) => {
    await pushData({ url: request.loadedUrl, title: $('h1').text().trim() });
});

// main.ts
const crawler = new CheerioCrawler({ requestHandler: router, maxRequestsPerCrawl: 50 });
await crawler.run(['https://example.com/']);
```

- Factories: `createCheerioRouter`, `createHttpRouter`, `createJSDOMRouter`, `createLinkeDOMRouter`, `createPlaywrightRouter`, `createPuppeteerRouter`, `createAdaptivePlaywrightRouter`, `createBasicRouter`; `Router.create()` is the generic form. Routers are plain request handlers.
- Unlabeled requests go to `addDefaultHandler`. An unknown label with no default throws `MissingRouteError` (non-retryable).
- `router.use(middleware)` runs before every handler (3.x).
- Typed labels (3.18+): `createCheerioRouter<CheerioCrawlingContext, { PRODUCT: { sku: string } }>()` types `request.userData` per label. Passing a Standard Schema (e.g. zod) per label, `createCheerioRouter({ PRODUCT: z.object({ sku: z.string() }) })`, also validates `userData` at runtime and when requests are added (`RequestValidationError`, non-retryable). The default route uses the `defaultRoute` key.
- Per-route timeout (v4): `router.addHandler(label, handler, { requestHandlerTimeoutSecs })`; `extendTimeout(secs)` in the context.
- Keep one file per route group once routes grow; share extraction functions, not contexts.

## enqueueLinks

```ts
await enqueueLinks({
    selector: 'a[href]',                  // default 'a'
    strategy: 'same-hostname',            // default; also 'same-domain' | 'same-origin' | 'all'
    globs: ['https://shop.example.com/products/**'],
    exclude: ['**/*.pdf', /logout|cart/i],
    label: 'DETAIL',
    userData: { source: 'list' },
    limit: 100,
    transformRequestFunction: (req) => (req.url.includes('/ad/') ? false : { ...req, userData: { ...req.userData, depth: 1 } }),
    onSkippedRequest: ({ url, reason }) => log.debug(`skip ${url}: ${reason}`),
});
```

- Strategies: `same-hostname` (exact host; default), `same-domain` (includes subdomains), `same-origin` (protocol + host + port), `all` (follows off-site links; pair with a cap). `EnqueueStrategy` enum is also exported.
- `globs` are case-insensitive; use `regexps` for case-sensitive or complex patterns. Objects `{ glob, label, userData, method }` set per-pattern request options and win over `label`/`transformRequestFunction`.
- If neither `globs` nor `regexps` is set, all links passing `strategy` are enqueued.
- `exclude` always wins. `pseudoUrls` is deprecated (removed in v4).
- `transformRequestFunction` returns the request, a modified request, or `false` to skip (v4: `'skip'` / `'unchanged'`, and it runs after filtering). Use it to set `uniqueKey`, `keepUrlFragment`, method, payload, headers.
- `baseUrl` resolves relative links for HTTP crawlers; browser crawlers resolve in-page. `skipNavigation: true` enqueues requests that will be handled without fetching.
- `limit` and the crawler `maxRequestsPerCrawl` both cap enqueues. `maxCrawlDepth` caps link depth. By default only the first batch (1000) is awaited; `waitForAllRequestsToBeAdded: true` waits for all.
- Sitemap-style `respectRobotsTxtFile` also filters here (see below). 3.17 fixed custom `userAgent` handling in `enqueueLinks`.
- `enqueueLinksByClickingElements` (browser crawlers) enqueues from click-triggered navigation.
- v4: `globs`/`regexps` merge into `include` (AND-ed with `strategy`); `requestQueue` option becomes `requestManager`; `context.addRequests()` accepts the same filters; `onSkippedRequest` gets `{ request, reason }`; `BasicCrawler.enqueueLinks()` is gone; `unprocessedRequests` removed from results.

## Requests, uniqueness, and the queue

- Dedupe key is `uniqueKey` (normalized URL by default). Same URL with different method/payload needs `useExtendedUniqueKey: true` or a custom `uniqueKey`. `keepUrlFragment: true` for fragment-routed SPAs.
- `crawler.run([...])` and `addRequests()` accept strings or request objects (`{ url, label, userData, method, payload, headers, uniqueKey, noRetry }`). `forefront: true` puts requests at the front (depth-first-ish); default is FIFO (breadth-first).
- `request.noRetry = true` or throwing `NonRetryableError` skips retries. `CriticalError` (a `NonRetryableError`) is rethrown and aborts the run. `RetryRequestError` retries even after `maxRequestRetries` is spent, so use it only with your own bound. Plain `Error` follows `maxRequestRetries` (default 3; per-request `maxRetries` overrides). `SessionError` rotates the session and is bounded by `maxSessionRotations` (default 10, v3).
- `RequestQueue` (dynamic, persisted, deduped): default for crawlers. `RequestList` (static, immutable, can hold millions): `await RequestList.open('name', sources)`; pass as `requestList` (v3) or via `toTandem()` (v4). Both together: `requestList` + `requestQueue` (v3 auto-combines them).
- v3: queue state persists to `{storage}/request_queues/default`. Default queue is purged at start unless `CRAWLEE_PURGE_ON_START=false`; `crawler.run(urls, { purgeRequestQueue: false })` keeps a non-empty queue for one run (removed in v4).
- Resume a crashed run: set `CRAWLEE_PURGE_ON_START=false` and rerun with the same storage; handled requests stay handled. On Apify, storages persist per run/named store.
- Named queues: `await RequestQueue.open('my-queue')` survive purges (v4: named storages are never purged; run-scoped use `alias`). Share one queue across crawlers/processes only with request locking (on by default in v3.x).
- `keepAlive: true` keeps `run()` open for requests added later (`crawler.stop()` to finish). Use it for a long-lived server-driven crawler, not batch jobs.

## Sitemaps

v3, simplest (load everything up front):

```ts
import { CheerioCrawler, Sitemap } from 'crawlee';
const { urls } = await Sitemap.load('https://example.com/sitemap.xml');
await crawler.addRequests(urls);
await crawler.run();
```

- `Sitemap.load` follows sitemap indexes and handles .xml, .txt, gzip. `sitemap_index` URLs work as input since 3.18. Network timeouts were added to sitemap discovery in 3.17.
- Large sitemaps: stream them. v4 `SitemapRequestLoader` loads in the background with glob/regexp filters; combine with a queue via `.toTandem()` so retries and dedupe still work.
- Discover from robots: `const robots = await RobotsTxtFile.find(url); robots.getSitemaps(); robots.isAllowed(url, ua)` (exported from `@crawlee/utils`; v4 changelog lists the rename `RobotsFile` -> `RobotsTxtFile`, so check the installed export). `parseUrlsFromSitemaps()` returns URLs directly.
- 3.18 filters sitemap-derived URLs by the enqueue strategy; confirm with `onSkippedRequest` if a sitemap lists other hosts.
- Sitemaps list canonical pages, often lastmod; use lastmod for incremental crawls and store the last seen date in a named KeyValueStore.

## robots.txt

- `respectRobotsTxtFile: true` (or `{ userAgent: 'MyBot' }`) on the crawler fetches robots.txt per host, skips disallowed requests, and blocks disallowed URLs in `enqueueLinks`. Skips are reported via `onSkippedRequest` (reasons seen in v3: `'robotsTxt'`, `'filters'`, `'enqueueLimit'`, redirect-to-filtered-URL; v4 adds `'manual'`).
- The default matches the `*` user-agent. Set your own `userAgent` to match your identified bot name when you publish one.
- It does not apply a crawl delay by itself in v3. Combine with `sameDomainDelaySecs`/`maxRequestsPerMinute`. v4 (`ThrottlingRequestManager`) honors `Crawl-delay` when `respectRobotsTxtFile` is on and follows RFC 9309 (4xx = allow all, 5xx = disallow all).
- robots.txt is a courtesy and a legal signal, not an access-control system. Do not use it as a way to find hidden paths.
