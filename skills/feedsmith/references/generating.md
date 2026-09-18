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

const json = generateJsonFeed({
  title: "My Blog",
  home_page_url: "https://example.com",
  items: [{ id: "1", title: "Hello" }],
});
// object, version set to JSON Feed 1.1 — JSON.stringify if you need a string

const opml = generateOpml({
  head: { title: "Subscriptions" },
  body: { outlines: [{ text: "Example", xmlUrl: "https://example.com/feed.xml" }] },
});
```

**No `generateRdfFeed`** (RDF generate planned). RDF namespace elements inside other formats still generate.

## Options

| Option | Applies to | Purpose |
|---|---|---|
| `strict: true` | RSS, Atom, JSON Feed, OPML | Compile-time required fields; dates must be `Date` |
| `stylesheets` | XML (RSS, Atom, OPML) | `xml-stylesheet` processing instructions |
| `extraOutlineAttributes` | OPML only | Extra outline attrs to emit (must be listed) |

JSON Feed has `strict` only (no stylesheets).

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

- Default (lenient): all fields optional; string dates allowed (`DateLike` = `Date | string`).
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

Fields: `type` + `href` required; optional `title`, `media`, `charset`, `alternate`. Type: `XmlStylesheet`.

### OPML extra attributes

```ts
generateOpml(data, {
  extraOutlineAttributes: ["customIcon", "updateInterval", "isPinned"],
});
```

Only names in that list are written onto `<outline>`. Values are strings.

## Atom xhtml

`type: "xhtml"` values are inner markup **without** the spec wrapper `<div>`. Generate emits a single `<div xmlns="http://www.w3.org/1999/xhtml">` wrapper. Ill-formed markup (`<br>`, bare `&`, `&nbsp;`) is emitted as escaped `type="html"` instead.

## RSS guid / persons

```ts
generateRssFeed({
  items: [
    {
      guid: { value: "https://example.com/hello", isPermaLink: true },
      authors: [{ email: "a@example.com", name: "Ada" }],
    },
  ],
});
```

Do not pass `guid` as a bare string. Person `link` is parse-only and is not written.

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
    categories: [{ text: "Technology" }],
  },
  items: [
    {
      title: "Ep 1",
      enclosures: [
        { url: "https://example.com/ep1.mp3", length: 12_345_678, type: "audio/mpeg" },
      ],
      itunes: { duration: 1815, episode: 1 }, // seconds, not "30:15"
    },
  ],
};

const xml = generateRssFeed(feed);
```
