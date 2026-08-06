# Formats, Namespaces & Types

## Feed formats

| Format | Versions | Parse | Generate | Package APIs |
|---|---|---|---|---|
| RSS | 0.9x, 2.0 | ✅ | ✅ | `parseRssFeed` / `generateRssFeed` / `detectRssFeed` |
| Atom | 0.3, 1.0 | ✅ | ✅ | `parseAtomFeed` / `generateAtomFeed` / `detectAtomFeed` |
| RDF | 0.9, 1.0 | ✅ | 📋 planned | `parseRdfFeed` / `detectRdfFeed` |
| JSON Feed | 1.0, 1.1 | ✅ | ✅ | `parseJsonFeed` / `generateJsonFeed` / `detectJsonFeed` |
| OPML | 1.0, 2.0 | ✅ | ✅ | `parseOpml` / `generateOpml` |

Universal: `parseFeed` → `{ format, feed }` typed as `AnyFeed`.

## TypeScript namespaces (v3)

Import from main package:

```ts
import type {
  RssFeed,
  AtomFeed,
  JsonFeed,
  RdfFeed,
  Opml,
  AnyFeed,
  ItunesNs,
  DcNs,
  MediaNs,
  PodcastNs,
} from "feedsmith";

type Feed = RssFeed.Feed<string>; // parsed dates as string
type FeedOut = RssFeed.Feed<Date>; // generate with Date
type StrictItem = RssFeed.Item<Date, true>; // TStrict = true
```

Generics:

- `TDate` — date field type (`string` parse default; `Date` common for generate).
- `TStrict` — when `true` / `{ strict: true }`, `Requirable<T>` fields become required.

## Atom constructs (v3)

Text fields are objects, not strings:

- Feed/entry: `title`, `subtitle`, `rights`, `summary` → `{ value, type?, … }`
- Entry `content` → `{ value?, type?, src?, … }`

Read `feed.title?.value`. Generate `title: { value: "…" }`.

## RSS persons (v3)

`managingEditor`, `webMaster`, item `authors` → `{ email?, name?, link? }` (`link` parse-only).

## Dublin Core / DC Terms (v3)

Singular fields removed — use plurals: `titles`, `creators`, `dates`, `subjects`, … (same idea for `dcterms`).

## Media / Podcast Index (v3)

- Media: `groups` (not deprecated `group`)
- Podcast: `locations`, `values`, `chat` (not `location` / `value` / `chats`)

## Supported namespaces (parse + generate unless noted)

| Prefix / ns | Typical hosts |
|---|---|
| `atom` | RSS, RDF |
| `dc`, `dcterms`, `sy`, `slash` | RSS, Atom, RDF |
| `content` | RSS, RDF |
| `itunes`, `googleplay`, `psc` | RSS, Atom |
| `podcast`, `spotify`, `acast`, `rawvoice`, `feedpress` | RSS |
| `media`, `georss` | RSS, Atom, RDF |
| `geo` | RSS, Atom |
| `arxiv`, `yt`, `app` | Atom |
| `opensearch`, `cc`, `creativeCommons`, `thr`, `wfw`, `admin`, `pingback`, `trackback` | see [docs table](https://v3.feedsmith.dev/) |
| `prism`, `source`, `blogChannel` | RSS |
| `rdf` | RDF |
| `xml` (`xml:lang`, `xml:base`, …) | RSS, Atom, RDF (v3) |

Access as `feed.itunes`, `item.podcast`, `feed.dc`, etc. Custom XML prefixes normalize to these keys.

## Design stance

Feedsmith **keeps format-native shape**. Do not merge `author` + `dc:creator` into one field in app code unless the product explicitly wants a lossy view — prefer reading both when present.
