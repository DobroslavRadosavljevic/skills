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

JSON generate returns a **plain object** (version `https://jsonfeed.org/version/1.1`). RSS/Atom/OPML generate return XML strings.

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
  DateLike,
  XmlStylesheet,
  ItunesNs,
  DcNs,
  MediaNs,
  PodcastNs,
  XmlNs,
} from "feedsmith";

type Feed = RssFeed.Feed<string>; // parsed dates as string
type FeedOut = RssFeed.Feed<Date>; // generate with Date
type StrictItem = RssFeed.Item<Date, true>; // TStrict = true
```

Generics:

- `TDate` — date field type (`string` parse default; `Date` common for generate).
- `TStrict` — when `true` / `{ strict: true }`, `Requirable<T>` fields become required.

Deprecated aliases `Rss`, `Atom`, `Json`, `Rdf` still export until 4.x. Prefer `RssFeed` / `AtomFeed` / `JsonFeed` / `RdfFeed`. `Opml` is the OPML namespace (`Opml.Document`, not a removed `Opml<TDate>` alias).

## Atom constructs (v3)

Text fields are objects, not strings:

- Feed/entry: `title`, `subtitle`, `rights`, `summary` → `{ value, type?, xml? }`
- Entry `content` → `{ value?, type?, src?, xml? }`

Read `feed.title?.value`. Generate `title: { value: "…" }`.

`type="xhtml"` parsed value is inner HTML: wrapper `<div>` stripped, `xhtml:` prefixes dropped, entities kept escaped (`&lt;` stays `&lt;`). Wrapper `xml:lang` / `xml:base` fold into the construct’s `xml` object.

## RSS persons (v3)

`managingEditor`, `webMaster`, item `authors` → `{ email?, name?, link? }` (`link` parse-only).

Item `guid` → `{ value, isPermaLink? }`. Item `source` requires `title` + `url` in strict mode.

## iTunes

- Feed: `categories?: Array<{ text, categories? }>` (not `category` / `name`).
- Item `duration?: number` (seconds). Parser accepts `HH:MM:SS` / `MM:SS` / numeric; generator writes a number.
- `owner` is deprecated on the feed type but still present.

## Dublin Core / DC Terms (v3)

Singular fields removed — use plurals: `titles`, `creators`, `dates`, `subjects`, … Same idea for `dcterms`. `coverage` / `rights` / `created` / `modified` kept their names but are **arrays**.

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
| `opensearch`, `cc`, `creativeCommons`, `thr`, `wfw`, `admin`, `pingback`, `trackback` | see [docs table](https://feedsmith.dev/) |
| `prism`, `source`, `blogChannel` | RSS |
| `rdf` | RDF |
| `xml` (`xml:lang`, `xml:base`, `xml:space`, `xml:id`) | RSS, Atom, RDF |

Access as `feed.itunes`, `item.podcast`, `feed.dc`, `feed.xml`, etc. Custom XML prefixes normalize to these keys.

The homepage namespace table omits `xml`; the [XML reference](https://feedsmith.dev/reference/namespaces/xml) and GitHub README include it. README also lists XML as parse + generate.

## Design stance

Feedsmith **keeps format-native shape**. Do not merge `author` + `dc:creator` into one field in app code unless the product explicitly wants a lossy view — prefer reading both when present (`item.authors` and `item.dc?.creators`).
