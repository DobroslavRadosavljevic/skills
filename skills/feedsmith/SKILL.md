---
name: feedsmith
description: "Build, review, debug, configure, migrate, or plan Feedsmith v3+ TypeScript/JavaScript feed parsing and generation. Use for feedsmith, parseFeed, parseRssFeed, parseAtomFeed, parseRdfFeed, parseJsonFeed, parseOpml, generateRssFeed, generateAtomFeed, generateJsonFeed, generateOpml, detectRssFeed, RssFeed, AtomFeed, JsonFeed, namespaces (itunes, podcast, media, dc), parseDateFn, maxItems, extraOutlineAttributes, strict mode, DetectError, MalformedError, ParseError, GenerateError, OPML, and v2→v3 migration."
---

# Feedsmith

Use this skill for **Feedsmith v3+** (`feedsmith`): parse and generate RSS, Atom, RDF, JSON Feed, and OPML with structure-preserving, typed APIs. Docs: [feedsmith.dev](https://feedsmith.dev/). Snapshot **3.0.0** (2026-09-18).

## Workflow

1. Inspect the local surface:
   - Installed `feedsmith` version (`bun pm ls feedsmith` / `bun info feedsmith`). This skill targets **3.x**; `latest` is **3.0.0**.
   - Parse vs generate vs OPML vs detect-only usage.
   - Dates: raw strings vs `parseDateFn` / `Date` on generate.
   - v2 leftovers: `feedsmith/types`, `{ lenient: true }`, flat Atom strings, string RSS persons, singular `dc.*` fields, `Rss`/`Atom`/`Json`/`Rdf` type namespaces.
2. Prefer dedicated parsers when format is known; use `parseFeed` only for unknown/mixed sources.
3. Refresh docs when tags drift. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Parse/detect/dates/errors: [parsing.md](references/parsing.md)
   - Generate, strict mode, stylesheets, OPML extras: [generating.md](references/generating.md)
   - Formats, namespaces, types: [formats-namespaces.md](references/formats-namespaces.md)
   - v2→v3 breaking changes: [migration-v2-to-v3.md](references/migration-v2-to-v3.md)
5. Prefer **`bun` / `bunx`** in command examples.

## Core Judgment

- **Preserve structure** — do not invent a “universal flattened feed” layer; read format-specific fields and namespaces (`feed.itunes`, `item.dc`, …).
- **Dates are strings by default** on parse. Use `parseDateFn` to convert; errors from that fn are not swallowed.
- **Generate is lenient by default** (all fields optional). Use `{ strict: true }` for compile-time spec-required fields + `Date` dates.
- **Atom text/content** are objects: `title?.value`, `content?.value` (not bare strings).
- **RSS persons** are objects: `{ email?, name?, link? }` — not `"a@b (Name)"` strings. `link` is parse-only.
- **Types** from main entry: `RssFeed`, `AtomFeed`, `JsonFeed`, `RdfFeed`, `Opml`, `AnyFeed`. No `feedsmith/types`.
- **RDF generate** is not available (`generateRdfFeed` is planned). JSON Feed / RSS / Atom / OPML generate yes. `generateJsonFeed` returns an **object**, not a string.
- Catch `DetectError` | `MalformedError` | `ParseError` | `GenerateError` — not only generic `Error`.
- Known format → dedicated parser (faster, more reliable than detect heuristics).

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls feedsmith` / `bun info feedsmith` — confirm **3.x**.
- Round-trip: parse fixture → assert key fields → generate → re-parse smoke.
- Typecheck Atom `.value` / RSS `Person` / `dc.creators` (plural) / `itunes.duration` as `number` after upgrades.
- Strict generate: missing required fields should fail at compile time with `{ strict: true }`.
- Error-path tests for bad XML / wrong format using dedicated error classes.

Report which checks ran, which did not, and version/tag assumptions that remain.
