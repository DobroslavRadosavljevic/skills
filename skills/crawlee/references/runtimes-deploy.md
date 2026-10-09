# Runtimes, Docker, Apify Platform

## Node vs Bun

- Crawlee 3.18.x declares `node >= 16`, but `impit` needs Node >= 20 and the Apify images ship Node 22/24/26. Use a current LTS (22 or 24). Crawlee 4 requires Node >= 22.13, native ESM, TypeScript >= 5.8.
- `await using` / `Symbol.asyncDispose` on crawlers needs Node 24; on Node 22 call `destroy()` / `teardown()` / `stop()` yourself (v4).
- Bun is not an officially supported runtime in v3. Known history: `got-scraping` (default v3 HTTP client) breaks under Bun (`oven-sh/bun#18964`); `browser-pool`'s proxy forwarder hit missing `http.Server#unref`; Playwright launched through Crawlee raised a protocol error on older Bun; `impit` `response.text()` returned corrupted bytes on Bun 1.3.2+ (apify/impit#363, closed as a Bun regression).
- Maintainer status (apify/crawlee#2046, closed 2026-06): with v4 (no `got-scraping`, impit default) most crawlers ran on Bun 1.3.10 and Deno 2.8. Treat that as "works in the maintainers' tests", not a support guarantee.
- Practical rule: HTTP crawlers (`CheerioCrawler`, `HttpCrawler`) on Bun only with crawlee v4 + impit and a smoke test that decodes real HTML; keep `PlaywrightCrawler`/`PuppeteerCrawler`, large production crawls, and Apify Actors on Node. Verify with a capped run on the exact Bun version.
- Smoke test for Bun: run a 10-request crawl, assert non-empty text, correct non-ASCII characters, cookies round-trip, a proxy request succeeds, and the process exits cleanly (no 30 s hang; `ImpitHttpClient` once hung Deno on exit, fixed).
- Bun install notes: `bun add crawlee` (+ `@crawlee/impit-client`, `playwright`). Optional native packages (impit, fs-storage-native) install by default; do not pass `--omit optional`. Puppeteer's Chrome download is a postinstall script, so add `puppeteer` to `trustedDependencies` or run `bunx puppeteer browsers install chrome`. Playwright browsers are separate: `bunx playwright install chromium`.
- Run with `bun run src/main.ts`; use `"type": "module"` and ESM imports. Under Node use `tsx`/compiled output.

## Local project setup

```sh
bunx crawlee create my-crawler        # templates: cheerio, playwright, puppeteer, HTTP, TypeScript variants
cd my-crawler
bun install
bunx playwright install chromium      # only for Playwright templates
bun run start
```

Project layout that scales: `src/main.ts` (crawler + `run`), `src/routes.ts` (router), `src/schemas.ts` (zod item schemas), `src/proxies.ts`, `fixtures/` (saved HTML for selector tests), `storage/` (git-ignored).

## Docker

Apify base images bundle Node, browsers, Xvfb, and matching library versions:

| Image | For |
| --- | --- |
| `apify/actor-node` | Cheerio/HTTP crawlers only (small, Alpine) |
| `apify/actor-node-playwright-chrome` | Playwright + Chromium (also Cheerio) |
| `apify/actor-node-playwright-firefox` / `-webkit` | Playwright with that engine |
| `apify/actor-node-playwright` | All Playwright browsers (large; dev/testing) |
| `apify/actor-node-puppeteer-chrome` | Puppeteer + Chrome |
| `apify/actor-node-playwright-camoufox` | Camoufox with `camoufox-js` and `impit` |

- Tag format `<node>` or `<node>-<library-version>` (e.g. `24-1.60.0`); Node 22, 24, 26 are listed. Pin both. Make the `playwright`/`puppeteer` version in `package.json` equal to the image tag (or `"*"` to reuse the bundled one). `-slim` variants omit preinstalled `apify`/`crawlee`.
- Install with the optional dependencies. Older templates used `npm install --omit=dev --omit=optional`; with impit/fs-storage-native that drops native binaries (3.17 templates fixed this). Use `--omit=dev` only.
- Layer cache: copy `package.json` (+ lockfile) first, install, then copy sources. Multi-stage: build TypeScript in a builder stage, copy `dist` and install prod deps in the final stage.
- Browser images need Xvfb for headful runs: `CMD ["./start_xvfb_and_run_cmd.sh", "node", "dist/main.js"]` in the Apify images; headless needs only `headless: true`/`CRAWLEE_HEADLESS=1`.
- Containers: set `CRAWLEE_MEMORY_MBYTES` (and heap `NODE_OPTIONS=--max-old-space-size`) to the container limit; give browsers `--shm-size=1g` or `--disable-dev-shm-usage`; run as non-root; mount `storage/` as a volume if you want resumable runs and set `CRAWLEE_PURGE_ON_START=false`.
- Plain Bun image sketch (not the Apify image): `FROM oven/bun`, `bun install --production --frozen-lockfile`, `bunx playwright install --with-deps chromium`, `CMD ["bun", "run", "src/main.ts"]`. Test it; see the Bun notes above.
- Non-Apify hosts (Fly, Railway, ECS, Kubernetes CronJob): the same image runs; point `CRAWLEE_STORAGE_DIR` at a persistent volume or export results to your own database/object store at the end of the run. Serverless (Lambda/Cloud Functions) works for Cheerio crawlers; browsers need special builds (see the AWS/GCP deployment guides).

## Apify platform (Actor SDK)

`apify` 3.7.2 is the stable SDK for Crawlee 3 (4.0.0-beta pairs with Crawlee 4 rc, Node >= 22.13). The CLI is `apify-cli` (`bunx apify-cli ...`, needs Node >= 20).

```ts
import { Actor } from 'apify';
import { CheerioCrawler } from 'crawlee';

await Actor.init();                                   // swaps storages to the platform; configures env
const input = (await Actor.getInput<{ startUrls: { url: string }[]; maxItems?: number }>()) ?? { startUrls: [] };
const proxyConfiguration = await Actor.createProxyConfiguration({ groups: ['RESIDENTIAL'] });

const crawler = new CheerioCrawler({
    proxyConfiguration,
    maxRequestsPerCrawl: input.maxItems,
    requestHandler: router,                           // pushData goes to the run's default dataset
});
await crawler.run(input.startUrls.map((s) => s.url));
await Actor.exit();                                   // or: await Actor.main(async () => { ... })
```

- Layout: `.actor/actor.json` (name, version, build tag), `.actor/input_schema.json` (UI + validation of input), `Dockerfile`; dataset/output views are declared in `actor.json`. `Actor.main(fn)` wraps `init`/`exit` with error handling.
- Local: `apify run` (uses `./storage`), `apify login`, `apify push` (uploads and builds on the platform). On the platform `Actor.init()` reads `APIFY_*`/`ACTOR_*` env, so Crawlee uses platform dataset, key-value store, and request queue; check `Actor.isAtHome()` for platform-only branches.
- Input is read through `Actor.getInput()` (v4 removed `KeyValueStore.getInput()` and `INPUT` handling from Crawlee). Use `Actor.pushData` / `crawler` `pushData`, `Actor.setValue`, `Actor.openRequestQueue()`.
- Memory and time: set run memory (1-4 GB for browser Actors) and timeout in the run options; Crawlee autoscaling uses the Actor memory. Use `Actor.setStatusMessage()` or crawler `statusMessageCallback` for progress.
- Resilience: Actors can migrate between servers; state in the default stores persists across migrations. Persist custom state with `useState()` or a key-value store, and listen for the `persistState` / `migrating` events (`Actor.on('migrating', ...)`) if holding in-memory state.
- Do not hardcode secrets: use Actor environment variables and input secrets (`isSecret` fields in the input schema).
- Pricing and platform limits change; check Apify docs before promising costs or max item sizes.
