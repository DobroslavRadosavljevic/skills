# Storage, Purge Behavior, Configuration

v3 (3.18.2) unless marked v4.

## Where data lives

- Local default: `./storage` (override with `CRAWLEE_STORAGE_DIR`): `datasets/<id>/`, `key_value_stores/<id>/`, `request_queues/<id>/`. Default ids are `default` (`CRAWLEE_DEFAULT_DATASET_ID`, `CRAWLEE_DEFAULT_KEY_VALUE_STORE_ID`, `CRAWLEE_DEFAULT_REQUEST_QUEUE_ID`).
- v3 storage client is `@crawlee/memory-storage` (in-memory with disk persistence). v4 replaces it with `StorageBackend`s: `FileSystemStorageBackend` (`@crawlee/fs-storage`, optional native `@crawlee/fs-storage-native`; persists by default, `localDataDirectory`) and `MemoryStorageBackend` (never writes to disk). Select with the crawler `storageBackend` option or `serviceLocator.setStorageBackend()`. `@crawlee/memory-storage` is removed in v4.
- On Apify, calling `Actor.init()` swaps storages for the platform API (see runtimes-deploy.md). Code using `Dataset`/`KeyValueStore`/`RequestQueue` stays the same.
- Add `storage/` to `.gitignore`, `.dockerignore`.

## Purge behavior (the most common surprise)

- Default storages (default dataset, default key-value store, default request queue) are purged the first time they are opened or used in a process, or at `crawler.run()` if nothing opened them earlier. A second run therefore starts from nothing.
- `await purgeDefaultStorages()` purges earlier (once per process; safe to call repeatedly). v3 keeps the `INPUT` record; v4 purges it too (input moved to `Actor.getInput()`).
- Keep data across runs: `CRAWLEE_PURGE_ON_START=false` (also stops the queue from being emptied, so a crashed run resumes), or write to named storages: `Dataset.open('products')`, `KeyValueStore.open('state')`, `RequestQueue.open('crawl-1')`. v4: named storages are never purged; the default one and `alias`-opened ones are run-scoped and purged.
- Append across runs with named datasets or `CRAWLEE_PURGE_ON_START=false`. Dedupe across runs yourself (keep a `Set` or hash in a named key-value store, or use stable `uniqueKey`s).
- `crawler.run(urls, { purgeRequestQueue: false })` (v3 only) keeps a non-empty queue for that run.
- v4: repeated `run()` calls no longer empty the queue; only the first crawler uses the default queue, later ones get `__default_N__`.
- `drop()` deletes a named storage. v4 adds `purge()` on `Dataset`/`KeyValueStore`/`RequestQueue` (not on the Apify platform; throws inside handlers).

## Dataset (append-only table)

```ts
import { Dataset } from 'crawlee';
await Dataset.pushData({ url, title });           // object or array; also context pushData / crawler.pushData
const ds = await Dataset.open('products');         // named, kept across runs
const { items, total } = await ds.getData({ offset: 0, limit: 1000, desc: false, fields: ['url'] });
await ds.forEach(async (item, index) => {});        // v3 iterators: forEach/map/reduce
await crawler.exportData('./out/products.csv', 'csv'); // or 'json'
```

- Items are plain JSON. Keep schemas stable; validate with zod before `pushData` to catch selector drift early.
- Never mutate or delete items; write a corrected item instead. For per-key upserts use a named key-value store or a real database from `requestHandler` (idempotent writes, since retries re-run the handler).
- Large exports: page with `getData({ offset, limit })`/iterators; do not load all items.
- v4: `Dataset.listItems()` -> `getData()`/`values()`; `getInfo()` is the metadata call (`storageObject` removed).
- Transactional writes (v4): storage writes inside a handler apply only if the handler succeeds, so a failed-then-retried request does not duplicate items. `useState()` is not transactional. Opt out with `transactionalStorage: false`; use `afterStorageCommit()` for side effects that must follow a commit.

## KeyValueStore (named blobs/records)

```ts
import { KeyValueStore } from 'crawlee';
const kvs = await KeyValueStore.open('state');
await kvs.setValue('last-run', { at: Date.now() });
const value = await kvs.getValue('last-run');
await kvs.setValue('screenshot', buffer, { contentType: 'image/png' });
await kvs.setValue('last-run', null);               // delete
```

- Crawler state helper: `const state = await useState({ pages: 0 })` (context/`crawler.useState`) persists with the run's state interval.
- `saveSnapshot()` (browser crawlers; `playwrightUtils.saveSnapshot`) stores screenshot + HTML for debugging a failed route. Call it in `failedRequestHandler`.
- Crawlee writes internal keys (statistics, session pool state, request list state); v3 uses `SDK_` prefixes (`SDK_CRAWLER_STATISTICS_N`, `SDK_SESSION_POOL_STATE`); v4 renames to `CRAWLEE_`.

## Configuration and env vars

Precedence (docs for v3/v4): constructor options > environment variables > `crawlee.json` (project root). In v4 the `Configuration` object is immutable (assignment throws); crawlers take `configuration`, `storageBackend`, `eventManager` options instead of a second `Configuration` argument.

| Variable | Effect |
| --- | --- |
| `CRAWLEE_STORAGE_DIR` | Local storage root (default `./storage`). |
| `CRAWLEE_PURGE_ON_START` | `false` keeps default storages between runs. |
| `CRAWLEE_MEMORY_MBYTES` | Memory budget for autoscaling (default: 1/4 of system memory). |
| `CRAWLEE_AVAILABLE_MEMORY_RATIO` | Fraction of system memory used when `CRAWLEE_MEMORY_MBYTES` is unset (default `0.25`). |
| `CRAWLEE_SYSTEM_INFO_V2` | v3 experiment for more accurate CPU/memory metrics (container aware). |
| `CRAWLEE_CONTAINERIZED` | Force container-aware CPU/memory limits (auto-detected via `/.dockerenv`, cgroup, `KUBERNETES_SERVICE_HOST`). |
| `CRAWLEE_HEADLESS` | `1` launches browsers headless (default headful unless `headless` is set). |
| `CRAWLEE_LOG_LEVEL` | `DEBUG`/`INFO`/`WARNING`/`ERROR`/`OFF`. |
| `CRAWLEE_VERBOSE_LOG` | `true` prints full errors even for retried requests. |
| `CRAWLEE_DEFAULT_*_ID` | Rename the default dataset, key-value store, or queue. |
| `CRAWLEE_INTERNAL_TIMEOUT` | v4: override the internal per-request timeout. |

`crawlee.json` example: `{ "persistStateIntervalMillis": 10000, "logLevel": "DEBUG" }`. Default `persistStateIntervalMillis` is 60 s: statistics, session pool, and request lists are saved on that interval and on `persistState` events, so a hard kill can lose up to a minute of state.

Logging: `import { log } from 'crawlee'; log.setLevel(LogLevel.DEBUG)`. v4 takes a `logger` option (`CrawleeLogger`; wrap `@apify/log` with `ApifyLogAdapter`). Use the context `log` inside handlers (it carries the request prefix).

## Run statistics and status

`crawler.run()` resolves with `FinalStatistics` (`requestsFinished`, `requestsFailed`, `requestsRetries`, durations). v4 renames to `requestsSucceeded*` and `crawler.stats` to `crawler.statistics`. Treat `requestsFailed > 0` or a falling item count as a failed run; do not trust exit code 0 alone. `statusMessageCallback`/`statusMessageLoggingInterval` customize the periodic status line (shown in the Apify console).
