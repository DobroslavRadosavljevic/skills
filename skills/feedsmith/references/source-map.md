# Source Map

Research snapshot: **2026-09-18**.

## Versions / dist-tags

| Tag | Version (npm) | Notes |
|---|---|---|
| `latest` | **3.0.0** | Stable 3.x — this skill’s target (published 2026-09-18) |
| `rc` | **3.0.0-rc.3** | Historical prerelease; do not prefer over `latest` |
| `beta` | **3.0.0-beta.5** | Older than rc |
| `next` | **3.0.0-next.6** | Older prerelease line |
| (untagged) | **2.9.6** | Last 2.x; contrast only |

Install:

```sh
bun add feedsmith
```

`latest` is 3.0.0. Do **not** install `feedsmith@rc` / `@beta` / `@next` unless the user explicitly wants a prerelease.

Package exports: main `feedsmith` only — **`feedsmith/types` removed**. Dual ESM/CJS. Docs claim Node.js 14+ and modern browsers.

```sh
bun info feedsmith
npm view feedsmith version dist-tags
```

## Canonical docs

v3 is now the main site. Canonical URLs are `https://feedsmith.dev/…` (canonical link + sitemap). `https://v3.feedsmith.dev/` still serves the same 3.0 site and canonicalizes to `feedsmith.dev`.

1. https://feedsmith.dev/
2. https://feedsmith.dev/quick-start
3. https://feedsmith.dev/parsing/
4. https://feedsmith.dev/parsing/dates
5. https://feedsmith.dev/parsing/detecting
6. https://feedsmith.dev/parsing/errors
7. https://feedsmith.dev/parsing/namespaces
8. https://feedsmith.dev/generating/
9. https://feedsmith.dev/generating/strict-mode
10. https://feedsmith.dev/generating/styling
11. https://feedsmith.dev/generating/errors
12. https://feedsmith.dev/generating/examples
13. https://feedsmith.dev/reference/typescript
14. https://feedsmith.dev/migration/v2-to-v3
15. https://github.com/macieklamberski/feedsmith
16. 2.x contrast only: https://v2.feedsmith.dev/

Context7 library id: `/macieklamberski/feedsmith` (lags: still shows `feedsmith@beta` and v2 `{ lenient: true }` generate). Prefer the site + GitHub `v3.0.0` tag.

## Refresh

```sh
bun info feedsmith
npm view feedsmith version dist-tags
```

## Stale-doc traps

- Installing `feedsmith@rc` / `@beta` / `@next` now that `latest` is 3.0.0.
- Treating https://feedsmith.dev/ as 2.x — 2.x moved to https://v2.feedsmith.dev/.
- Treating https://v3.feedsmith.dev/ as a separate prerelease site — it mirrors 3.0 and canonicalizes to feedsmith.dev.
- Quick Start / parsing overview still showing `rssFeed.dc?.creator` (singular). Types are plural: `dc?.creators`.
- TypeScript “complete example” using `itunes.category: [{ name }]` and string `duration`. Types: `itunes.categories: [{ text }]`, `duration?: number` (seconds).
- Generating examples passing RSS `guid` as a string. Type is `{ value, isPermaLink? }`.
- Context7 / blogs showing v2 `lenient: true`, flat Atom `title: string`, string RSS persons, `feedsmith/types`.
- Treating detect helpers as validation — only heuristics; parse to confirm.
- Assuming RDF generation exists (planned; parse only). `src/feeds/rdf/` has parse + detect, no generate.
- Expecting dates as `Date` after parse without `parseDateFn`.
- Treating `generateJsonFeed` as returning an XML/JSON **string** — it returns a JSON Feed **object**.
- Migration snippets that still show `Rss` / `Atom` namespaces vs current `RssFeed` / `AtomFeed` — deprecated aliases exist until 4.x; prefer the new names.
