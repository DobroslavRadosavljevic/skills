# Parsing

## Universal

```ts
import { parseFeed } from "feedsmith";

const { format, feed } = parseFeed(content);
// format: "rss" | "atom" | "json" | "rdf"

if (format === "rss") {
  feed.link;
  feed.items?.[0]?.title;
}
```

Options (also on dedicated parsers):

| Option | Purpose |
|---|---|
| `maxItems` | Cap items; `0` = metadata only |
| `parseDateFn` | `(raw: string) => TDate` — replaces date strings; type `TDate` inferred |

```ts
const { feed } = parseFeed(xml, {
  maxItems: 20,
  parseDateFn: (raw) => new Date(raw),
});
// feed.pubDate typed as Date | undefined when using RSS + parseDateFn
```

`parseDateFn` errors **propagate**. Empty/whitespace dates skip the fn and omit the field.

## Dedicated (preferred when format known)

```ts
import {
  parseRssFeed,
  parseAtomFeed,
  parseRdfFeed,
  parseJsonFeed,
  parseOpml,
} from "feedsmith";

const rss = parseRssFeed(xml);
const atom = parseAtomFeed(xml);
const rdf = parseRdfFeed(xml);
const json = parseJsonFeed(jsonText);
const opml = parseOpml(opmlXml);

rss.dc?.creators; // v3 plural DC fields — see formats-namespaces
atom.title?.value;
opml.head?.title;
opml.body?.outlines?.[0]?.xmlUrl;
```

## Detect only

```ts
import {
  detectRssFeed,
  detectAtomFeed,
  detectRdfFeed,
  detectJsonFeed,
} from "feedsmith";

if (detectRssFeed(content)) {
  // heuristic only — still parse to validate
}
```

## Errors

```ts
import {
  parseFeed,
  DetectError,
  MalformedError,
  ParseError,
} from "feedsmith";

try {
  parseFeed(input);
} catch (error) {
  if (error instanceof DetectError) {
    // wrong / unrecognized format
  } else if (error instanceof MalformedError) {
    // invalid XML / underlying parse failure
  } else if (error instanceof ParseError) {
    // syntactically OK but invalid/empty feed result
  }
}
```

## Access patterns

- Namespaces attach as objects: `feed.itunes?.author`, `item.media`, `item.podcast`.
- Custom prefixes normalize to standard ones (e.g. alternate Dublin Core prefix → `dc`).
- Namespace URI variants (https, trailing slash, case, whitespace) are tolerated.
- Case-insensitive element/attribute names; legacy elements upgraded where documented.

## Return typing

`parseFeed` → `AnyFeed` discriminated union on `format`. Narrow before using format-specific fields.

Default date type parameter is `string`. With `parseDateFn`, dates match the fn return type.
