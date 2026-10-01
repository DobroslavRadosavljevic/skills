# Cache, Storage, Database

## Cache (`nitro/cache`)

Powered by ocache 0.3 on the **`cache` storage mount**. Defaults changed in `3.0.260903-beta`; see [migration.md](migration.md).

- Production default: **memory** (lost on restart / per-isolate).
- Development: filesystem under `.nitro/cache`.

**Always mount durable `storage.cache`** (Redis, Cloudflare KV, `fs`, etc.) when cached data must survive deploys or scale out.

```ts
import { defineCachedHandler } from "nitro/cache";

export default defineCachedHandler(
  async () => {
    const res = await fetch("https://api.github.com/repos/nitrojs/nitro");
    const { stargazers_count } = await res.json();
    return { stars: stargazers_count };
  },
  { maxAge: 60 * 60 },
);
```

### Handler behavior

- Only **GET** and **HEAD** are cached, under separate entries; other methods and `Range` requests hit the handler.
- Concurrent same-key requests share one invocation, bounded by `maxResolveTime` (default 30 s; `event.req.signal` carries the deadline).
- The handler sees only what the key covers:
  - **Request headers** are stripped unless listed in `varies`. The request origin (scheme, host, port) is already in the key; add `x-forwarded-host` only if the handler reads it.
  - **Query params** are stripped unless listed in `allowQuery` (`true` = full query string).
  - **Cookies** are stripped unless listed in `allowCookies`; `set-cookie` is dropped from cached responses.
  - **`authorization`** is stripped unless `allowAuthorization: true`. For per-user responses use `shouldBypassCache`.
- Auto headers: weak `ETag`, `Cache-Control` (from `maxAge` / `swr` / `staleMaxAge`; disable with `sendCacheControl: false`), `Vary`, and `x-cache: HIT | STALE | REVALIDATED | MISS` (`cacheStatusHeader`). `Last-Modified` is **not** generated; set it in the handler.
- Conditional `If-None-Match` / `If-Modified-Since` → **304**.
- Only `200`, `203`, `301`, `308` are stored; `no-store` / `private` / `no-cache` / `Vary: *` responses are not.
- Default **`swr: false`** (wait for fresh data when expired). Set `swr: true` to serve stale while revalidating; add `staleMaxAge` to bound stale entries (without it, entries get no storage TTL).
- Default `maxAge` is **1 second** if omitted — set it explicitly. `maxAge: 0` disables caching.

### Cached functions

JSON-serializable return values only.

```ts
import { defineCachedFunction } from "nitro/cache";
import { defineHandler, type H3Event } from "nitro";

const cachedGHStars = defineCachedFunction(
  async (event: H3Event, repo: string) => {
    const data = await fetch(`https://api.github.com/repos/${repo}`).then((r) =>
      r.json(),
    );
    return data.stargazers_count;
  },
  {
    maxAge: 60 * 60,
    name: "ghStars",
    getKey: (_event, repo) => repo,
  },
);

export default defineHandler(async (event) => {
  const { repo } = event.context.params;
  const stars = await cachedGHStars(event, repo).catch(() => 0);
  return { repo, stars };
});
```

On **edge workers**, pass `event` as the **first** argument so Nitro can `waitUntil` the cache write.

### Shared options

`base` (mount, default `cache`; an array = multi-tier), `name` (always set for factory/loop-created functions), `group` (`nitro/handlers` vs `nitro/functions`), `getKey`, `integrity`, `maxAge`, `staleMaxAge`, `swr`, `getMaxAge` (per-entry lifetime), `maxResolveTime`, `storage`, `waitUntil`, `shouldInvalidateCache`, `shouldBypassCache`, `onError`.

Handler-only: `headersOnly` (304 helpers without storing body), `varies`, `allowQuery`, `allowCookies`, `allowAuthorization`, `sendCacheControl`, `cacheStatusHeader`, `stream`, `maxBodySize` (no default limit; set it for proxied upstreams), `shouldCache`.

Function-only: `transform`, `serialize`, `validate`.

### Route rules

```ts
storage: {
  redis: { driver: "redis", url: "redis://localhost:6379" },
  cache: { driver: "redis", url: "redis://localhost:6379" },
},
routeRules: {
  "/blog/**": { cache: { maxAge: 3600, base: "redis" } },
  "/api/**": { swr: 3600 }, // = cache: { swr: true, maxAge: 3600 }
  "/api/realtime/**": { cache: false },
}
```

`devStorage.cache` overrides cache in development.

## KV storage (`nitro/storage`)

unstorage. Default root = **memory** (not durable).

```ts
import { useStorage } from "nitro/storage";

await useStorage().setItem("test:foo", { hello: "world" });
const value = await useStorage().getItem("test:foo");
const test = useStorage("test");
await test.setItem("foo", { hello: "world" });
```

Methods: `getItem` / `getItems` / `getItemRaw`, `setItem` / `setItems` / `setItemRaw`, `hasItem`, `removeItem`, `getKeys`, `clear`, `getMeta` / `setMeta` / `removeMeta`, `mount` / `unmount`, `watch` / `unwatch`. Aliases: `get`, `set`, `has`, `del`, `remove`, `keys`.

```ts
export default defineConfig({
  storage: {
    redis: { driver: "redis" /* driver options */ },
  },
  devStorage: {
    db: { driver: "fs", base: "./.data/db" },
  },
});
```

`devStorage` overlays `storage` in development (and prerender). Use `fs`/`memory` locally when prod Redis/KV is unavailable.

Built-in: server assets under `assets` (`useStorage("assets:server")` or `useStorage("assets/server")` — match the project’s unstorage mount). Custom `serverAssets[].baseName` → `assets:<baseName>`.

Runtime mount from a plugin (credentials from env) when config cannot know the driver at build time — treat as a workaround.

Driver catalog: [unstorage.unjs.io](https://unstorage.unjs.io/).

## Database (experimental)

Enable `experimental.database`. Layer is [db0](https://db0.unjs.io/) 0.4: Nitro passes the client library to configured connectors and prompts to install a missing one. Default SQLite → `.data/db.sqlite` (dev / Node-compatible prod).

```ts
import { useDatabase } from "nitro/database";

const db = useDatabase();
const usersDb = useDatabase("users");
await db.sql`SELECT * FROM users WHERE id = ${userId}`;
await db.exec("CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY)");
const stmt = db.prepare("SELECT * FROM users WHERE id = ?");
await stmt.bind("1001").all();
```

When the flag is on, `useDatabase` may be auto-imported. Instances are lazy-cached by connection name.

```ts
database: {
  default: { connector: "sqlite", options: { name: "db" } },
  users: {
    connector: "postgresql",
    options: { url: process.env.DATABASE_URL },
  },
},
devDatabase: {
  default: { connector: "sqlite", options: { name: "dev-db" } },
}
```

Connector names live under `connector`; host/url live under **`options`**, not the top-level connection object.

Connectors include: `sqlite` / `node-sqlite`, `better-sqlite3`, `sqlite3`, `bun` / `bun-sqlite`, `libsql` variants (including `libsql-core`), `postgresql`, `neon`, `mysql2`, `pglite`, `planetscale`, `prisma`, `cloudflare-d1`, Hyperdrive MySQL/Postgres. db0 0.4 also adds Kysely integration and connector `capabilities` metadata.

Do not assume SQLite on Cloudflare/Vercel without the matching connector and bindings.
