# Sessions, Proxies, Blocking, Errors, Scaling, Politeness

v3 (3.18.2) unless marked v4 (rc.1 / beta). Defaults were read from source on 2026-10-09.

## Anti-blocking checklist

Work top to bottom; stop when requests succeed reliably.

1. Look for an API, JSON endpoint, feed, or sitemap first. Cheapest and least likely to block.
2. Identify the block: status (401/403/429/503), body markers (captcha, "access denied", challenge script), redirects to `/blocked`, empty-but-200 pages. Log `response.statusCode` and a body snippet on failures.
3. Keep the session pool on (default). Keep `persistCookiesPerSession` / `saveResponseCookies` on. Cookies, IP, and fingerprint must rotate together.
4. Add a `proxyConfiguration`. Datacenter first; residential or ISP only for targets that need them. Use `tieredProxyUrls` to escalate automatically.
5. Fix TLS/HTTP identity for HTTP crawlers: switch to `ImpitHttpClient` (`browser: 'chrome'`/`'firefox'`). Do not override `User-Agent` with a mismatching value.
6. Fix the browser identity for browser crawlers: keep Crawlee fingerprints on; constrain `fingerprintGeneratorOptions` (`browsers`, `operatingSystems`, `devices`, `locales`) to match the proxy geography and language. Mismatched locale/timezone vs proxy IP is a tell.
7. Slow down: lower `maxConcurrency`, set `maxRequestsPerMinute`, add `sameDomainDelaySecs`. Most blocks are rate-based. Honor `Retry-After`.
8. Reduce footprint: block images/fonts/media in browsers, skip redundant page loads, cache or dedupe URLs, avoid crawling faceted/search permutations.
9. Behave coherently: realistic navigation order (listing -> detail), `Referer` set by the crawler, no burst of identical parallel requests, stable session per user flow (`use-until-failure`-style reuse for logged-in flows).
10. Escalate rendering only when needed: `AdaptivePlaywrightCrawler` or `PlaywrightCrawler`; for Cloudflare-class walls use Camoufox with fingerprints disabled and a `handleCloudflareChallenge` post-navigation hook, plus good proxies. Expect partial success.
11. Detect blocks in code and retire sessions on proof (`session.retire()`), not on every error.
12. Monitor block rate (retries, `failedRequestHandler` count, items per request). Alert when it rises; sites change defenses.
13. If a site explicitly denies automated access (ToS, robots, auth wall), stop and ask for permission or an official feed. Do not build CAPTCHA solving, credential stuffing, or account farming into a crawler.

## SessionPool and Session

A `Session` bundles a cookie jar, a proxy (by session id), and (v4) a fingerprint hint. The pool hands out sessions; the crawler marks them good after a successful handler.

- Defaults: `maxPoolSize` 1000; `sessionOptions.maxErrorScore` 3, `maxUsageCount` 50, `maxAgeSecs` 3000, `errorScoreDecrement` 0.5; `blockedStatusCodes` `[401, 403, 429]`.
- `session.markGood()` (automatic), `session.markBad()` (+1 error score: timeouts, 5xx, flaky), `session.retire()` (immediately and permanently unusable: proven block).
- Configure on the crawler (v3): `useSessionPool: true`, `sessionPoolOptions: { maxPoolSize: 50, sessionOptions: { maxUsageCount: 100 } }`, `persistCookiesPerSession: true`. Use a smaller pool with expensive residential IPs; a pool larger than your proxy count reuses IPs unevenly.
- Session state persists in the key-value store (v3 key `SDK_SESSION_POOL_STATE`; v4 `CRAWLEE_SESSION_POOL_STATE`). A purge at start clears it.
- Cookies: `session.getCookieString(url)`, `session.setCookies(...)`, `session.cookieJar` (tough-cookie). v4 adds `session.setCookie(str, url)`; removes `getCookies/setCookies/setCookiesFromResponse`; an explicit `Cookie` request header beats the jar.
- Pin work to one identity (login flows): pass a single-session pool (`maxPoolSize: 1`, with a high `maxUsageCount`/`maxAgeSecs`) or, in v4 pre-release docs, `sessionReuseStrategy: 'use-until-failure'` (post-rc.1; verify in installed types). Never share logged-in sessions across unrelated crawls.
- v4: `new SessionPool({...})` is passed as the `sessionPool` crawler option; `useSessionPool`, `sessionPoolOptions`, `maxSessionRotations` are removed; `blockedStatusCodes` becomes a crawler option; `usableSessionsCount()` is async.

## ProxyConfiguration

```ts
import { ProxyConfiguration } from 'crawlee';

const proxyConfiguration = new ProxyConfiguration({
    proxyUrls: ['http://user:pass@dc1.example:8000', 'http://user:pass@dc2.example:8000'],
});
// Escalating tiers: null = no proxy, then cheap, then residential. Moves up on blocks, retests lower tiers.
const tiered = new ProxyConfiguration({ tieredProxyUrls: [[null], ['http://dc...'], ['http://resi...']] });
```

- `proxyUrls` rotate round-robin (a `null` entry means no proxy). `newUrlFunction(sessionId, { request })` is the custom hook in v3; `request` may be undefined. v4: `newUrlFunction()` takes no arguments and runs once per new session (route specific requests by pinning sessions).
- `tieredProxyUrls` only works when the configuration is attached to a crawler.
- Crawlers call `newUrl(session.id)`, so one session keeps one proxy. Read `proxyInfo` (`url`, `hostname`, `port`, `sessionId`, `proxyTier`) in the handler to verify.
- Browser crawlers route through a local `proxy-chain` forwarder; authenticated proxies work without extra flags. Set `ignoreProxyCertificate` only for known MITM proxies (3.17+).
- Apify Proxy: `const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['RESIDENTIAL'], countryCode: 'US' })` (SDK method; needs Apify Proxy access on the platform or locally).
- Match proxy country to site locale and browser `locales`. Test one request through the proxy (`https://httpbin.org/ip`-style echo) before a crawl.

## Blocked-request detection

- Status based: `blockedStatusCodes` (default `[401, 403, 429]`) retires the session and retries on a fresh one (a rotation, not counted as a retry in v3, counted in v4).
- Content based: `retryOnBlocked: true` adds a post-navigation check that throws `SessionError` (rotate session, retry) when the page contains known block markers: the Cloudflare Turnstile iframe, Google's rate-limit "sorry" page, or an Incapsula resource iframe, or the status is blocked. In browser crawlers a Cloudflare 403 first waits 5 s for the challenge to resolve. With the option on, the session pool's own status list defaults to empty (the check falls back to `[401, 403, 429]`); setting `blockedStatusCodes` as well logs a warning. It covers only those vendors, so keep custom checks for others.
- Proxy transport errors (`ECONNRESET`, `ERR_PROXY_CONNECTION_FAILED`, `ERR_TUNNEL_CONNECTION_FAILED`, `Proxy responded with`) are converted to `SessionError` automatically, so a dead proxy rotates the session.
- Custom: inspect inside the handler and rotate explicitly:

```ts
import { SessionError } from 'crawlee';
async requestHandler({ $, session, request }) {
    if ($('form#captcha').length || /access denied/i.test($('title').text())) {
        session?.retire();
        throw new SessionError(`Blocked: ${request.url}`); // retry on a new identity
    }
}
```

- Never treat a 200 with an empty result as success without a check; selectors that suddenly return nothing usually mean a block or a layout change. Assert required fields and throw.
- 429 is a rate limit: lower concurrency and delay. v4 `ThrottlingRequestManager` handles it per domain (honors `Retry-After`, exponential backoff, no session burn, `PersistentRateLimitError` after `maxDomainStallSecs`).

## Errors, retries, timeouts

- `errorHandler(ctx, error)` runs before each retry (adjust the request, e.g. headers). `failedRequestHandler(ctx, error)` runs once retries are exhausted (persist the failure: `pushData({ url, error })` to a dead-letter dataset, `saveSnapshot()`).
- `maxRequestRetries` default 3 (per request `maxRetries` overrides). `maxSessionRotations` default 10 (v3). `NonRetryableError`/`request.noRetry` stop retries. `RetryRequestError` retries regardless of the count. HTTP status >= 500 throws in HTTP crawlers; tune with `ignoreHttpErrorStatusCodes`/`additionalHttpErrorStatusCodes`.
- Timeouts: `requestHandlerTimeoutSecs` (default 60; raise for slow handlers), `navigationTimeoutSecs` (HTTP 30, browser 60 in v4 docs). v4 times navigation and handler separately; hooks are inside the navigation budget.
- Make handlers idempotent: retries re-run them. Do not append to external lists before the work is complete. In v4, storage writes are transactional.
- Do not catch and ignore errors in the handler unless you also record the failure.

## Autoscaling and concurrency

- `AutoscaledPool` starts at 1 and scales toward `maxConcurrency` (default 200, effectively a ceiling) based on memory, event loop lag, CPU, and storage rate-limit signals. Leave `minConcurrency` at default; high values crash browser crawlers.
- Politeness caps: `maxConcurrency` (try 5-10 for browsers, 10-50 for HTTP to one host), `maxRequestsPerMinute` (evenly paced), `sameDomainDelaySecs` (v3; default 0).
- Memory: default budget is 1/4 of system RAM. Set `CRAWLEE_MEMORY_MBYTES` in containers (v3 container detection relies on the `systemInfoV2` experiment; verify the "System info" log line shows the container limit, not host memory). For Node heap pressure set `NODE_OPTIONS=--max-old-space-size=<MB>` below the container limit.
- Watch the periodic stats and autoscale log lines for overload warnings. Fix the cause (fewer browsers, lighter parsing) before raising limits.
- Browser sizing: budget roughly 200-500 MB per concurrent page plus the browser baseline; start low and watch.
- v4: `initialConcurrency`, `taskLoopOptions` (was `autoscaledPoolOptions`), and (post-rc.0) an injectable `concurrencySystem` with `loadSignals` and a shared budget across crawlers. The `minConcurrency`/`maxConcurrency`/`maxRequestsPerMinute` shortcuts cannot be combined with an injected system.
- Parallel scraping across processes: shard by queue (named queues) or by input list; each process needs its own `CRAWLEE_STORAGE_DIR` or a shared Apify queue.

## Politeness

- Send a truthful, identifiable `User-Agent` with a contact when running a polite, non-impersonating crawler; do not combine with spoofing.
- Respect robots.txt (`respectRobotsTxtFile`), `Crawl-delay` (via `sameDomainDelaySecs`/v4 throttling), and ToS. Prefer off-peak hours and conditional requests (`If-None-Match`, `If-Modified-Since`) for recrawls.
- Cap total work: `maxRequestsPerCrawl`, `maxCrawlDepth`. Log skipped requests with `onSkippedRequest`.
- Collect only needed fields; mind privacy law (GDPR/CCPA) for personal data and database/copyright terms. This skill is not legal advice.
