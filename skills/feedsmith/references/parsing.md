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
| `maxItems` | Cap items/entries/outlines; `0` = metadata only |
| `parseDateFn` | `(raw: string) => TDate` — replaces date strings; type `TDate` inferred |

```ts
const { feed } = parseFeed(xml, {
  maxItems: 20,
  parseDateFn: (raw) => new Date(raw),
});
// feed.pubDate typed as Date | undefined when using RSS + parseDateFn
```

`parseDateFn` errors **propagate**. Empty/whitespace dates skip the fn and omit the field.

The universal parser uses detect helpers first. Known format → dedicated parser.

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

rss.dc?.creators;
atom.title?.value;
opml.head?.title;
opml.body?.outlines?.[0]?.xmlUrl;
```

`parseJsonFeed` accepts a JSON string or an already-parsed object.

## OPML extras

```ts
const opml = parseOpml(opmlXml, {
  maxItems: 50,
  extraOutlineAttributes: ["customIcon", "updateInterval"],
});
```

`extraOutlineAttributes` is case-insensitive. Only listed custom attrs are typed onto outlines.

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

No `detectOpml`. Detect looks at signatures (root tag / version / elements); not a validator.

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

All three extend `Error`. `parseJsonFeed` currently throws `DetectError` (not `MalformedError`) for bad JSON.

## Access patterns

- Namespaces attach as objects: `feed.itunes?.author`, `item.media`, `item.podcast`.
- Custom prefixes normalize to standard ones (e.g. alternate Dublin Core prefix → `dc`).
- Namespace URI variants (https, trailing slash, case, whitespace) are tolerated.
- Case-insensitive element/attribute names; legacy elements upgraded where documented.
- Dublin Core is plural: `feed.dc?.creators`, `item.dc?.dates` — not `creator` / `date`.
- iTunes duration parses `HH:MM:SS` / `MM:SS` / numeric strings into **seconds** (`number`).

## Return typing

`parseFeed` → `AnyFeed` discriminated union on `format`. Narrow before using format-specific fields.

Default date type parameter is `string`. With `parseDateFn`, dates match the fn return type.
