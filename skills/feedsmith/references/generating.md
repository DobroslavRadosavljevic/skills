# Generating

## APIs

```ts
import {
  generateRssFeed,
  generateAtomFeed,
  generateJsonFeed,
  generateOpml,
  GenerateError,
} from "feedsmith";

const rss = generateRssFeed({
  title: "My Blog",
  link: "https://example.com",
  description: "A simple blog",
  items: [
    {
      title: "Hello",
      link: "https://example.com/hello",
      description: "First post",
      pubDate: new Date(), // or string in lenient mode
    },
  ],
});

const atom = generateAtomFeed({
  title: { value: "My Blog" },
  entries: [{ title: { value: "Hello" }, content: { value: "<p>Hi</p>", type: "html" } }],
});

const json = generateJsonFeed({ /* JsonFeed shape */ });
const opml = generateOpml({ /* Opml shape */ });
```

**No `generateRdfFeed` yet** (RDF generate planned).

## Options

| Option | Applies to | Purpose |
|---|---|---|
| `strict: true` | RSS, Atom, JSON Feed, OPML | Compile-time required fields; dates must be `Date` |
| `stylesheets` | XML (RSS, Atom, OPML) | `xml-stylesheet` processing instructions |

### Strict mode

```ts
generateRssFeed(
  {
    title: "My Feed",
    link: "https://example.com",
    description: "Complete",
    pubDate: new Date(),
    items: [],
  },
  { strict: true },
);
```

- Default (lenient): all fields optional; string dates allowed.
- Strict: TypeScript enforces `Requirable<>` fields; **runtime still does not** fully validate like a schema lib — compile-time guard.
- Use strict when **you author** feeds; stay lenient when transforming messy external data.

### Stylesheets

```ts
generateRssFeed(data, {
  stylesheets: [
    { type: "text/xsl", href: "/styles/feed.xsl", title: "Pretty Feed" },
    { type: "text/css", href: "/styles/feed.css", media: "screen" },
  ],
});
```

Fields: `type` + `href` required; optional `title`, `media`, `charset`, `alternate`.

## Errors

```ts
try {
  generateRssFeed({});
} catch (error) {
  if (error instanceof GenerateError) {
    // invalid input for generator
  }
}
```

## Podcast-shaped RSS sketch

```ts
import { type RssFeed, generateRssFeed } from "feedsmith";

const feed: RssFeed.Feed<Date> = {
  title: "Show",
  link: "https://example.com",
  description: "Episodes",
  itunes: {
    author: "Host",
    image: "https://example.com/art.jpg",
    explicit: false,
  },
  items: [
    {
      title: "Ep 1",
      enclosures: [
        { url: "https://example.com/ep1.mp3", length: 12_345_678, type: "audio/mpeg" },
      ],
      itunes: { duration: "30:15", episode: 1 },
    },
  ],
};

const xml = generateRssFeed(feed);
```
