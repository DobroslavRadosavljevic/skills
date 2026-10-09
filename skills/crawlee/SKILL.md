---
name: crawlee
description: "Build, review, debug, scale, migrate, or deploy Crawlee web scrapers and crawlers for Node.js/TypeScript with current docs. Use for crawlee 3.18.x (stable; 4.0 is rc) CheerioCrawler, HttpCrawler, JSDOMCrawler, LinkeDOMCrawler, PlaywrightCrawler, PuppeteerCrawler, AdaptivePlaywrightCrawler, BasicCrawler, FileDownload, createCheerioRouter/createPlaywrightRouter labels and addHandler/addDefaultHandler, enqueueLinks (strategy same-hostname/same-domain/same-origin/all, globs, regexps, exclude, transformRequestFunction), RequestQueue, RequestList, Sitemap/SitemapRequestLoader, respectRobotsTxtFile, Dataset, KeyValueStore, pushData, purge on start, CRAWLEE_STORAGE_DIR, SessionPool, Session markBad/retire, blockedStatusCodes, retryOnBlocked, ProxyConfiguration tieredProxyUrls, fingerprints, Camoufox, ImpitHttpClient/GotScrapingHttpClient browser impersonation, AutoscaledPool, maxConcurrency, maxRequestsPerMinute, sameDomainDelaySecs, maxRequestRetries, failedRequestHandler, CRAWLEE_MEMORY_MBYTES, Bun vs Node, Docker apify/actor-node-playwright images, Apify Actor SDK (Actor.init, apify push), and v3-to-v4 migration (requestManager, ServiceLocator, StorageBackend, ESM, Node 22.13+)."
---

# Crawlee

Use this skill when work touches Crawlee crawlers: choosing a crawler, routing and link discovery, storage, anti-blocking, scaling, runtime/Docker/Apify deployment, or v3 to v4 migration.

Snapshot (2026-10-09): `crawlee@3.18.2` is `latest` (stable). `crawlee@4.0.0-rc.1` is the `rc` tag; the `v4` tag moves daily (`4.0.0-beta.225`). Check [source-map.md](references/source-map.md) and the installed version before answering. Examples below use v3 names; v4 differences are in [v4-migration.md](references/v4-migration.md).

## Workflow

1. Inspect first: `crawlee` major/minor, sub-packages (`@crawlee/impit-client`, `@crawlee/jsdom`), `playwright`/`puppeteer` versions, Node/Bun, ESM vs CJS, existing router/routes, storage dir, proxy provider, Docker base image, Apify usage.
2. Pick the cheapest crawler that returns the data (table below; details in [crawler-choice.md](references/crawler-choice.md)). Prove the data is absent from raw HTML before reaching for a browser. Also check for a JSON/XHR endpoint or sitemap.
3. Route work to the focused references:
   - Crawler choice, HTTP clients, impit impersonation, parsers: [crawler-choice.md](references/crawler-choice.md).
   - Router, labels, `enqueueLinks`, queues, lists, sitemaps, robots.txt: [routing-requests.md](references/routing-requests.md).
   - Dataset, KeyValueStore, purge behavior, config/env vars, storage backends: [storage-config.md](references/storage-config.md).
   - Sessions, proxies, fingerprints, blocking, retries, autoscaling, politeness, anti-blocking checklist: [anti-blocking-scaling.md](references/anti-blocking-scaling.md).
   - Node vs Bun, Docker, Apify Actor SDK: [runtimes-deploy.md](references/runtimes-deploy.md).
   - Version status and v3 to v4 upgrade: [v4-migration.md](references/v4-migration.md).
4. Keep the project's existing crawler, router file layout, and deployment topology unless asked to migrate.
5. Run a small capped crawl (`maxRequestsPerCrawl: 10`) before any large run. Read the statistics log, not only the output.

## Pick the crawler

| Situation | Use |
| --- | --- |
| Data is in server-rendered HTML | `CheerioCrawler` |
| JSON/XML/RSS/API or any non-HTML body | `HttpCrawler` (`body`, `json`) |
| Need `window`/DOM APIs without a browser | `JSDOMCrawler` / `LinkeDOMCrawler` (`runScripts` is opt-in, slow) |
| JS-rendered, clicks, login, screenshots | `PlaywrightCrawler` (default browser choice) |
| Existing Puppeteer code, Chrome-only CDP | `PuppeteerCrawler` |
| Mixed or unknown rendering, many sites | `AdaptivePlaywrightCrawler` (experimental in v3) |
| Custom transport or non-page work | `BasicCrawler` |
| Strong bot wall (Cloudflare etc.) | `PlaywrightCrawler` + Camoufox + residential proxy, or a managed unblocker |

## Core Judgment

- Crawlee is request-queue driven: `crawler.run(urls)` seeds the queue, handlers call `enqueueLinks`/`addRequests`, and the run ends when the queue is empty. Use `maxRequestsPerCrawl` as a safety cap while developing; it is also the cheapest guard against infinite crawls.
- Use `requestHandler` (not `handlePageFunction`/`handleRequestFunction`) and `failedRequestHandler`. Throw errors to retry; the default is `maxRequestRetries: 3`. Do not swallow errors in `try/catch` without rethrowing, or failures count as success.
- Use one router per crawler (`createCheerioRouter()` etc.) with `label`s. Keep `userData` small and typed; use `request.label`.
- `enqueueLinks` defaults to `strategy: 'same-hostname'`. State the strategy and globs on purpose. Use `exclude` for logout/cart/pdf links and `transformRequestFunction` to skip or rewrite requests.
- Data goes through `pushData` (Dataset, append-only). Run state goes in `KeyValueStore`/`useState`. Default storages are purged on every start; set `CRAWLEE_PURGE_ON_START=false` or use named storages to resume or append.
- Leave concurrency to autoscaling. Set `maxConcurrency` and `maxRequestsPerMinute` for politeness, not `minConcurrency`. Memory defaults to a quarter of system RAM (`CRAWLEE_MEMORY_MBYTES`).
- Blocking is solved at the identity level: IP (proxy) + cookies + TLS/HTTP fingerprint + browser fingerprint must rotate together. Keep `useSessionPool` and `persistCookiesPerSession` on (v3) and pass `proxyConfiguration`. Retire sessions on proof of a block; use `markBad` for flaky errors. Treat 429 as a rate limit: slow down, do not just rotate.
- For HTTP crawlers, TLS fingerprint matters. v3 defaults to `got-scraping`; install `@crawlee/impit-client` and pass `httpClient: new ImpitHttpClient({ browser: 'chrome' })` when blocked on plain requests. v4 makes impit the default.
- Browser fingerprints are on by default for Playwright/Puppeteer; do not disable them casually. Never copy-paste stealth plugins on top without testing.
- Prefer APIs, sitemaps, and `RequestList` over crawling a whole site. Respect robots.txt (`respectRobotsTxtFile: true`), ToS, and site rate limits; scrape only data you may use. Do not bypass authentication or paywalls.
- Do not pin both majors in one repo. v4 is ESM-only, Node 22.13+, and renames many options; migrate deliberately with the guide.
- Bun: v3 is not officially supported (got-scraping and browser-pool break). v4 plus `impit` is reported to work; keep browser crawlers on Node unless a smoke test passes. See [runtimes-deploy.md](references/runtimes-deploy.md).
- Docker: do not install with `--omit=optional` (drops impit native binaries). Match the Playwright/Puppeteer version to the base image tag.

## Verification

Prefer the repo's commands. For meaningful Crawlee work, cover the relevant subset:

- Typecheck handlers, router labels, and `userData` types; run lint.
- Capped smoke run (`maxRequestsPerCrawl: 10`); assert dataset item count and shape, and that `failedRequestHandler` was not hit.
- Selector/parse checks against a saved fixture HTML per route, not only live pages.
- Confirm `enqueueLinks` filters with `onSkippedRequest` logging on the first run.
- Re-run to confirm purge/resume behavior is the one you intended.
- Blocking: inspect statuses and `session`/`proxyInfo` in a small run; confirm 403/429 paths retry on a fresh session.
- Memory/concurrency: watch the periodic stats log and autoscale messages under realistic load.
- Docker: build and run the image once with the same env as production (`CRAWLEE_*`, proxy vars, headless).
- Report which checks ran, which did not, and any version, runtime, or legal assumptions that remain.
