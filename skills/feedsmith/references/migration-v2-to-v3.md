# Migration: v2 → v3

Canonical guide: https://v3.feedsmith.dev/migration/v2-to-v3

Until 3.x is `latest`, install with an explicit tag (`feedsmith@rc` / `@beta`), not bare `feedsmith`.

## Checklist

- [ ] Remove `{ lenient: true }` (lenient is the v3 default)
- [ ] Add `{ strict: true }` where you want v2-like required-field typing
- [ ] Drop `DeepPartial` imports
- [ ] Move types from `feedsmith/types` → `feedsmith`
- [ ] Rename format type namespaces: `Rss` → `RssFeed`, `Atom` → `AtomFeed`, `Json` → `JsonFeed`, `Rdf` → `RdfFeed`
- [ ] Atom: `title` / `subtitle` / `rights` / `summary` / `content` → `.value` objects
- [ ] RSS: `managingEditor` / `webMaster` / `authors` → `Person` objects
- [ ] Media: `group` → `groups`
- [ ] Podcast: `location` → `locations`, `value` → `values`, `chats` → `chat`
- [ ] DC / DC Terms: singular → plural arrays (`creator` → `creators`, …)
- [ ] Errors: handle `DetectError`, `MalformedError`, `ParseError`, `GenerateError`
- [ ] Optional: adopt `parseDateFn`, `AnyFeed`, `xml` namespace fields

## Behavior flip: strict vs lenient

| | v2 | v3 |
|---|---|---|
| Generate default | Strict (required fields) | **Lenient** (all optional) |
| Opt-in | `{ lenient: true }` | `{ strict: true }` |

## Types entry

```ts
// v2
import type { Rss } from "feedsmith/types";

// v3
import type { RssFeed } from "feedsmith";
type Feed = RssFeed.Feed<string>;
```

Some migration prose still shows short `Rss` / `Atom` names; **current v3 references use `RssFeed` / `AtomFeed` / `JsonFeed` / `RdfFeed`**. Prefer those.

## Atom text / content

```ts
// v2
feed.title; // string
generateAtomFeed({ title: "Blog" });

// v3
feed.title?.value;
generateAtomFeed({ title: { value: "Blog", type: "text" } });
entry.content?.value;
generateAtomFeed({
  entries: [{ content: { value: "<p>Hi</p>", type: "html" } }],
});
```

## RSS persons

```ts
// v2
feed.managingEditor; // string

// v3
feed.managingEditor?.email;
feed.managingEditor?.name;
generateRssFeed({
  managingEditor: { email: "ed@example.com", name: "Ed" },
});
```

## Namespace field renames

```ts
// Media
item.media?.groups;

// Podcast Index
item.podcast?.locations;
item.podcast?.values;
item.podcast?.chat;

// Dublin Core
feed.dc?.creators;
feed.dc?.dates;
```

## New in v3 (non-breaking additions)

- Dedicated parse/generate error classes
- Exported `AnyFeed`
- `parseDateFn` on parsers
- `xml` namespace attributes on feeds/items
- Namespace type exports (`ItunesNs`, `DcNs`, …)

## Verify after upgrade

1. Typecheck the app.
2. Re-run parse fixtures for Atom titles and RSS authors.
3. Generate a podcast RSS sample and open in a validator / feed reader.
4. Confirm install is **3.x** (`bun pm ls feedsmith`).
