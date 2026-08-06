# Source Map

Research snapshot: **2026-08-06**.

## Versions / dist-tags

| Tag | Version (npm) | Notes |
|---|---|---|
| `latest` | **2.9.6** | Stable 2.x — **not** this skill’s target |
| `rc` | **3.0.0-rc.3** | Prefer for v3 work right now |
| `beta` | **3.0.0-beta.5** | Older than rc |
| `next` | **3.0.0-next.6** | Older prerelease line |

Install v3 explicitly until `latest` points at 3.x:

```sh
bun add feedsmith@rc
# or: bun add feedsmith@beta
```

GitHub may say `@beta` / `@next`; always re-check:

```sh
npm view feedsmith version dist-tags
```

Package exports (v3): main `feedsmith` only — **`feedsmith/types` removed**.

## Canonical docs

1. https://v3.feedsmith.dev/
2. https://v3.feedsmith.dev/quick-start
3. https://v3.feedsmith.dev/parsing/
4. https://v3.feedsmith.dev/generating/
5. https://v3.feedsmith.dev/reference/typescript
6. https://v3.feedsmith.dev/migration/v2-to-v3
7. https://github.com/macieklamberski/feedsmith
8. Stable 2.x docs (contrast only): https://feedsmith.dev/

Context7 library id: `/macieklamberski/feedsmith` (may lag prerelease — prefer v3 site).

## Refresh

```sh
bun info feedsmith
npm view feedsmith@rc version
npm view feedsmith dist-tags
```

## Stale-doc traps

- Installing bare `feedsmith` → **2.9.x** while writing v3 APIs.
- Imports from `feedsmith/types` or type aliases that flatten `RssFeed` → wrong shape.
- Context7 / blogs showing v2 `lenient: true`, flat Atom `title: string`, string RSS persons.
- Treating detect helpers as validation — only heuristics; parse to confirm.
- Assuming RDF generation exists (planned; parse only).
- Expecting dates as `Date` after parse without `parseDateFn`.
- Migration snippets that still show `Rss` / `Atom` namespaces vs current `RssFeed` / `AtomFeed` — prefer [TypeScript](https://v3.feedsmith.dev/reference/typescript) + per-format reference pages.
