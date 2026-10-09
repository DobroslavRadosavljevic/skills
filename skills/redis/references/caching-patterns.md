# Caching, Sessions, Leaderboards

Examples use ioredis-style calls (`redis.set(key, value, "PX", ms, "NX")`). Translate option syntax per client ([clients.md](clients.md)).

## Cache-Aside

Read: `GET` -> hit returns. Miss: load from source of truth, `SET` with TTL. Write: update source first, then `DEL` the cache key (do not update the cache with the new value in a racy path).

Rules:

- Always TTL + jitter. Treat the cache as lossy. Fail open to the source when Redis errors or times out, and cap concurrency to the source so a Redis outage does not become a database outage.
- Cache negative results (not found) with a short TTL (5-60 s) to stop miss storms on bad ids.
- Serialize with a version tag (`{ v: 1, data }`) or put the version in the key (`cache:v3:product:42`). Reject unparseable values as a miss.
- Do not cache per-user data under shared keys. Include tenant/user id in the key.
- Delete after the database commit, not before. For read-after-write races (stale value written back by a slow reader after a delete), use short TTLs, versioned keys, or a delete-then-delay-delete ("double delete") on hot entities.
- Compress large values only above a size threshold. Prefer smaller projections over caching whole rows.

## Stampede Protection

A hot key expires, hundreds of requests miss at once, the database melts. Layer defenses:

1. **In-process single-flight**: one `Map<string, Promise<T>>` per process so concurrent misses share one load.
2. **Distributed lease**: `SET lease:{key} token NX PX 10000`. Only the winner loads. Losers wait briefly (poll with jitter) then re-read, or serve stale.
3. **TTL jitter** to avoid synchronized expiry.
4. **Probabilistic early refresh** (XFetch): refresh early with probability growing as expiry nears, `now - delta * beta * ln(rand()) >= expiry`, where `delta` is the last load time.
5. **Stale-while-revalidate** (below) so users never wait on the loader.

## Stale-While-Revalidate

Store a soft expiry inside the value and a longer hard TTL in Redis.

```ts
type Entry<T> = { v: T; freshUntil: number };
const inflight = new Map<string, Promise<unknown>>();

const RELEASE = `if redis.call('GET',KEYS[1])==ARGV[1] then return redis.call('DEL',KEYS[1]) else return 0 end`;

export async function swr<T>(
  key: string,
  opts: { freshMs: number; staleMs: number },
  load: () => Promise<T>,
): Promise<T> {
  const raw = await redis.get(key).catch(() => null);          // fail open on Redis errors
  if (raw) {
    const e = JSON.parse(raw) as Entry<T>;
    if (e.freshUntil > Date.now()) return e.v;
    void revalidate(key, opts, load).catch(() => {});          // serve stale, refresh in background
    return e.v;
  }
  return revalidate(key, opts, load);
}

function revalidate<T>(key: string, o: { freshMs: number; staleMs: number }, load: () => Promise<T>): Promise<T> {
  const running = inflight.get(key) as Promise<T> | undefined;
  if (running) return running;
  const p = (async () => {
    const lease = `lease:${key}`;
    const token = crypto.randomUUID();
    const won = await redis.set(lease, token, "PX", 10_000, "NX");
    if (!won) {                                                // another node is loading
      await sleep(50 + Math.random() * 100); // e.g. (ms) => new Promise((r) => setTimeout(r, ms))
      const again = await redis.get(key);
      if (again) return (JSON.parse(again) as Entry<T>).v;
    }
    try {
      const v = await load();
      const ttl = o.freshMs + o.staleMs + Math.floor(Math.random() * o.freshMs * 0.1);
      await redis.set(key, JSON.stringify({ v, freshUntil: Date.now() + o.freshMs } satisfies Entry<T>), "PX", ttl);
      return v;
    } finally {
      if (won) await redis.eval(RELEASE, 1, lease, token).catch(() => {});
    }
  })().finally(() => inflight.delete(key));
  inflight.set(key, p);
  return p;
}
```

Cap loader time below the lease TTL. If the loader can exceed it, renew the lease or accept duplicate loads.

## Invalidation

| Strategy | Use when | Cost |
| --- | --- | --- |
| TTL only | Staleness tolerable | Simplest |
| Delete on write | Single writer path, strong-ish freshness | Must hit every writer, including jobs and admin scripts |
| Versioned keys (`cache:{ns_ver}:...`) | Bulk invalidation of a class | Extra `GET` for the version (cache it locally for ms) |
| Tag sets (`SADD tag:product:42 key1 key2`, then `UNLINK` members) | Invalidate groups | Tag set is itself a key to bound and expire |
| Pub/sub broadcast | Local in-process caches across nodes | At-most-once; pair with short local TTL |
| Client-side caching (server tracking) | Hot read-mostly keys | See below |
| Keyspace notifications | Reacting to expiry/changes | Off by default (`notify-keyspace-events`), at-most-once, extra CPU. Not a reliable job trigger |

Never invalidate with `KEYS pattern` + `DEL`. Use versioned keys, tag sets, or `SCAN` + `UNLINK` in a background job with `COUNT` and sleeps.

## Client-Side Caching

Server-assisted: the client caches reads locally and Redis sends invalidation messages for tracked keys (`CLIENT TRACKING`). Supported in node-redis >= 5.1 (`clientSideCache` with `RESP: 3`) and Valkey GLIDE (`ClientSideCache.create`). Not provided by ioredis or Bun.redis (the server supports tracking, the client does not implement a cache).

- Best for read-mostly keys read far more often than written. Bound it: `maxEntries`/size, `ttl`, eviction policy.
- Any dropped connection flushes the local cache. Expect a cold spike after reconnects.
- Use a separate non-caching connection for counters, leaderboards, and other write-heavy keys, because invalidation traffic costs more than it saves.
- Non-deterministic commands (`HRANDFIELD`, `HSCAN`, `ZRANDMEMBER`), search (`FT.*`), TimeSeries, and probabilistic types are not cached.
- Server memory: tracking table grows with distinct tracked keys per client (`tracking-table-max-keys`).

## Sessions

- Opaque random session id (>= 128 bits, `crypto.randomUUID()` or `crypto.getRandomValues`), cookie `HttpOnly; Secure; SameSite`. Never reuse user ids as session ids.
- Store as a hash or single JSON string: `session:{id}` with `EX` = idle timeout. Slide with `GETEX session:{id} EX 1800` or `EXPIRE` on read. Enforce an absolute max lifetime inside the value.
- Per-user index for revocation: `SADD user:{uid}:sessions {id}` (set expiry on the set, and prune dead ids on logout). Logout-everywhere = `SMEMBERS` + `UNLINK`.
- Rotate the session id on privilege change (login, MFA). Keep only what is needed; do not store large objects or secrets in the session.
- Durability: sessions on a cache-only instance are lost on restart or eviction. Use AOF `everysec` + replica and a `volatile-*`/`noeviction` policy if logout-on-failure is unacceptable, or accept it deliberately.
- An auth library may already ship a Redis session or secondary-storage adapter. Reuse it instead of hand-rolling.

## Leaderboards

```ts
await redis.zadd("lb:global", "GT", score, userId);          // only raise scores; use zincrby for deltas
const top = await redis.zrange("lb:global", 0, 9, "REV", "WITHSCORES");
const rank = await redis.zrevrank("lb:global", userId);      // 0-based; null when absent
const around = rank === null ? [] : await redis.zrange("lb:global", Math.max(rank - 5, 0), rank + 5, "REV", "WITHSCORES");
```

- Scores are doubles: integer-exact to 2^53. Encode tie-breaks into the score (`score * 1e6 + (1e6 - secondsSinceEpochOffset)`) or sort ties in the app.
- Period boards: `lb:{yyyy-ww}` with expiry a bit past the period; roll up with `ZUNIONSTORE`/`ZUNION` (aggregate `SUM`, `MAX`, `MIN`; `COUNT` on Redis 8.8+).
- Bound size: `ZREMRANGEBYRANK lb 0 -(N+1)` keeps top N. Huge boards become big keys; shard by region/season.
- Rank reads are O(log N). Page with `ZRANGE ... REV` offset/limit or score cursors rather than deep offsets.
- Friends-only boards: `ZINTERSTORE` against a user-scoped set into a short-TTL temp key, or compute in app from `ZMSCORE`.
