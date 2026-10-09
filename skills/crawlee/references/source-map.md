# Source Map

Snapshot date: 2026-10-09.

This reference records the official documentation and package evidence used to create the skill. Refresh sources for latest/current questions, v4 migration, Bun support, or version mismatches.

## Research Snapshot

- Context7 libraries: `/websites/crawlee_dev_js` (High reputation, JS docs), `/apify/crawlee`. Context7 mixes v3 pages; the v4 pages live under `crawlee.dev/js/docs/next/`.
- npm dist-tags observed on 2026-10-09:
  - `crawlee`: `latest` `3.18.2` (2026-09-29), `rc` `4.0.0-rc.1` (2026-10-06), `v4` `4.0.0-beta.225` (2026-10-09), `next` `3.18.2-beta.6`
  - `crawlee@4.0.0-rc.1`: `engines.node >=22.13.0`, `type: module`, peers `puppeteer *`, `playwright *`; deps include `@crawlee/impit-client`, `@crawlee/fs-storage` (no `@crawlee/memory-storage`, `@crawlee/jsdom`, `@crawlee/linkedom`)
  - `crawlee@3.18.2`: `engines.node >=16.0.0`, deps include `@crawlee/memory-storage`, `@crawlee/jsdom`, `@crawlee/linkedom`; peers `puppeteer *`, `playwright *`, `idcac-playwright *`
  - `@crawlee/impit-client@4.0.0-rc.1`: deps `impit ^0.14.2`, `tough-cookie ^6`
  - `@crawlee/jsdom` / `@crawlee/linkedom`: `latest` 3.18.2, `rc` 4.0.0-rc.0, `v4` beta.172 (separate cadence)
  - `@crawlee/fs-storage-native` 0.2.2; `@crawlee/otel` `rc` 4.0.0-rc.1; `@crawlee/got-scraping-client` `rc` 4.0.0-rc.1
  - `apify`: `latest` 3.7.2 (2026-05-11), `next-v4` 4.0.0-beta.54 (2026-10-09; node >=22.13, depends on `@crawlee/core 4.0.0-rc.1`)
  - `apify-cli` 1.10.0 (node >=20); `impit` 0.14.5; `playwright` 1.64.0; `puppeteer` 25.13.0; `camoufox-js` 0.12.1
- GitHub releases (apify/crawlee): v3.18.2 (2026-09-29), v3.18.0 (2026-08-04), v3.17.0 (2026-06-04), v4.0.0-rc.0 (2026-08-13), v4.0.0-rc.1 (2026-10-06).
- Release changes that shaped the guidance:
  - 3.17: dynamic memory snapshots, modular SystemStatus, sitemap discovery timeouts, `sitemapFilter` for `parseSitemap`, `shouldPropagateError` for the adaptive crawler, `ignoreProxyCertificate`, templates use `ImpitHttpClient` and install optional deps in Docker.
  - 3.18: type-safe router labels and Standard Schema `userData` validation, `cacheClients` for `ImpitHttpClient`, `puppeteer@25` support, sitemap URLs filtered by enqueue strategy, `sitemap_index` accepted, Cloudflare challenge markup update, `RequestList` init speedup.
  - 4.0.0-rc.1: `DomCrawler`, OpenTelemetry, `skipRequest`, `afterCommit`, `initialConcurrency`, robots 404 = allow all, queue not emptied between `run()` calls, jsdom/linkedom moved out of the monorepo.
- Facts read directly from source (3.x branch vs `master`/`v4.0.0-rc.1` tag): option names and defaults for `BasicCrawlerOptions`, `HttpCrawlerOptions`, `BrowserCrawlerOptions`, `EnqueueLinksOptions`, `SessionPoolOptions`, `Session`, `ProxyConfigurationOptions`, `AdaptivePlaywrightCrawlerOptions`, `Router`, `ImpitHttpClient`, `blocked.ts` selectors, error classes. `concurrencySystem` and `ThrottlingRequestManager` are present in the rc.1 tag; `sessionReuseStrategy` is not.
- Open doubts to re-verify when relevant:
  - The v4 docs page `guides/http-clients` still says `GotScrapingHttpClient` is default while the upgrading guide says `ImpitHttpClient` is default; the skill follows the upgrading guide. Check the installed `@crawlee/http` source.
  - v3 container memory detection depends on the `systemInfoV2` experiment (docs); confirm the logged memory limit in your container.
  - Bun support is anecdotal (maintainer comments in issue #2046, Bun regression in impit #363). Always smoke test.
  - Docs and `master` run ahead of `rc.1`; any v4 API not listed in the upgrading guide may be newer than the installed version.

## Refresh Procedure

1. Check tags: `bun info crawlee dist-tags` (or `curl -s https://registry.npmjs.org/crawlee | jq '.["dist-tags"]'`). Check `bun info apify dist-tags`.
2. Release notes: `gh release list -R apify/crawlee -L 15` and `gh release view <tag> -R apify/crawlee`.
3. Resolve Context7 `/websites/crawlee_dev_js` for v3 questions; fetch `crawlee.dev/js/docs/next/...` for v4.
4. For option names and defaults, read the installed `.d.ts` or the source tag (`packages/basic-crawler/src/internals/basic-crawler.ts`, `packages/core/src/enqueue_links/enqueue_links.ts`, `packages/core/src/session_pool/`).
5. Prefer official docs, upgrade guide, and source over blog summaries. If docs and installed types disagree, trust the installed types and report the mismatch.

## Official Pages

### Core guides

- Docs home: https://crawlee.dev/js/docs/quick-start
- Introduction (crawling, adding URLs, refactoring/router, saving data, deployment): https://crawlee.dev/js/docs/introduction
- Adding URLs / enqueueLinks: https://crawlee.dev/js/docs/introduction/adding-urls
- Refactoring (router): https://crawlee.dev/js/docs/introduction/refactoring
- JavaScript rendering: https://crawlee.dev/js/docs/guides/javascript-rendering
- Request storage: https://crawlee.dev/js/docs/guides/request-storage
- Request loaders (v4/next): https://crawlee.dev/js/docs/next/guides/request-loaders
- Result storage: https://crawlee.dev/js/docs/guides/result-storage
- Configuration: https://crawlee.dev/js/docs/guides/configuration
- Scaling crawlers: https://crawlee.dev/js/docs/guides/scaling-crawlers
- Session management: https://crawlee.dev/js/docs/guides/session-management
- Proxy management: https://crawlee.dev/js/docs/guides/proxy-management
- Avoid getting blocked: https://crawlee.dev/js/docs/guides/avoid-blocking
- HTTP clients: https://crawlee.dev/js/docs/guides/http-clients
- Docker images: https://crawlee.dev/js/docs/guides/docker-images
- TypeScript projects: https://crawlee.dev/js/docs/guides/typescript-project
- Apify platform deployment: https://crawlee.dev/js/docs/deployment/apify-platform
- Examples (sitemap, relative links, skip navigation, forms, file download): https://crawlee.dev/js/docs/examples
- Upgrading to v3: https://crawlee.dev/js/docs/upgrading/upgrading-to-v3
- Upgrading to v4 (next): https://crawlee.dev/js/docs/next/upgrading/upgrading-to-v4

### API reference

- API home: https://crawlee.dev/js/api/core
- `BasicCrawlerOptions`: https://crawlee.dev/js/api/basic-crawler/interface/BasicCrawlerOptions
- `CheerioCrawlerOptions`: https://crawlee.dev/js/api/cheerio-crawler/interface/CheerioCrawlerOptions
- `EnqueueLinksOptions`: https://crawlee.dev/js/api/core/interface/EnqueueLinksOptions
- `SessionPool` / `Session`: https://crawlee.dev/js/api/core/class/SessionPool
- `ProxyConfiguration`: https://crawlee.dev/js/api/core/class/ProxyConfiguration
- `ImpitHttpClient`: https://crawlee.dev/js/api/impit-client/class/ImpitHttpClient
- `AdaptivePlaywrightCrawler`: https://crawlee.dev/js/api/playwright-crawler/class/AdaptivePlaywrightCrawler

### Source and ecosystem

- Repository: https://github.com/apify/crawlee (3.x branch for v3; `master` for v4)
- Releases: https://github.com/apify/crawlee/releases
- Bun runtime issue: https://github.com/apify/crawlee/issues/2046
- Impit (HTTP client): https://github.com/apify/impit
- Apify SDK for JS: https://docs.apify.com/sdk/js/
- Apify CLI: https://docs.apify.com/cli/
- Apify Academy anti-scraping course: https://docs.apify.com/academy/anti-scraping
- Fingerprint suite: https://github.com/apify/fingerprint-suite
- Camoufox JS wrapper: https://github.com/apify/camoufox-js
- npm: https://www.npmjs.com/package/crawlee
