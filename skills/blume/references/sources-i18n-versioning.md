# Blume: content sources, i18n, versioning, changelog, blog, custom pages

Covers `content.sources` adapters (`blume/sources`), the `i18n` block, the `versions` block, changelog and blog content types, and custom `.astro` pages (blume 2.2.2).

## Contents

1. [Content sources](#content-sources)
2. [Adapter reference](#adapter-reference)
3. [Internationalization](#internationalization)
4. [Versioning](#versioning)
5. [Changelog](#changelog)
6. [Blog](#blog)
7. [Custom pages](#custom-pages)
8. [Gotchas](#gotchas)

---

## Content sources

Blume reads `.md`/`.mdx` files by default. Sources let you pull pages from a remote repo, a CMS, or any backend, and mix several into one site. Sources are read at build time. The site stays static-first.

### Default (no config)

Blume scans the content root (`docs`) as one filesystem source. `content.root`, `content.include`, and `content.exclude` are shorthand for that single source.

```ts
// blume.config.ts
import { defineConfig } from "blume";

export default defineConfig({
  content: { root: "docs" },
});
```

### Composing sources

Each entry in `content.sources` is an adapter factory imported from `blume/sources`. It returns a plain descriptor.

```ts
// blume.config.ts
import { defineConfig } from "blume";
import { filesystem, mdxRemote } from "blume/sources";

export default defineConfig({
  content: {
    sources: [
      filesystem({ root: "docs" }), // local docs at the site root
      mdxRemote({
        prefix: "sdk", // mounted under /sdk
        github: { owner: "acme", repo: "sdk", ref: "main", path: "docs" },
      }),
    ],
  },
});
```

Rules:

- `sources` replaces the implicit default. Add a `filesystem()` entry for local docs.
- Move `root`, `include`, `exclude` into `filesystem()`.
- The shorthand and `sources` cannot be combined. Blume reports which field to move.
- A single `filesystem()` source roots the generated docs collection at its own directory.
- Several filesystem sources must share one root. Partition it with `include` globs. A second source rooted elsewhere gives `BLUME_ENTRY_ID_MISMATCH` (its pages would 404).
- Options are validated at config load: a missing required option, an unknown key, or a leftover 1.x `{ type: "…" }` object fails with a message naming the fix.

### Adapters at a glance

| Adapter | Reads | Runtime dependency | Env var |
| --- | --- | --- | --- |
| `filesystem()` | Local `.md`/`.mdx` | none | none |
| `obsidian()` | An Obsidian vault, in place | none | none |
| `mdxRemote()` | `.md`/`.mdx` from a GitHub repo or raw URL | none | `GITHUB_TOKEN` (private repos) |
| `githubReleases()` | A repo's releases as changelog entries | none | `GITHUB_TOKEN` (private repos) |
| `sanity()` | A GROQ query over a Sanity dataset | `@sanity/client` (optional peer) | `SANITY_TOKEN` (private datasets) |
| `notion()` | A Notion database | `@notionhq/client` v5+ (optional peer) | `NOTION_TOKEN` |
| `contentful()` | One Contentful content type | none | `CONTENTFUL_ACCESS_TOKEN` (`CONTENTFUL_PREVIEW_TOKEN` for `--preview`) |
| `payload()` | A Payload collection | none | `PAYLOAD_API_KEY` |
| `strapi()` | A Strapi content type | none | `STRAPI_API_TOKEN` |
| `custom()` | Any `ContentSource` you implement | none | none |

Install peers only for the adapters you use:

```sh
bun add @sanity/client      # sanity()
bun add @notionhq/client    # notion()
```

### Shared options (every adapter that takes an options object)

| Option | Effect |
| --- | --- |
| `prefix` | Namespaces routes under `/<prefix>/…`. Also the source's name in diagnostics and its cache directory. Two sources resolving to the same route fail with `BLUME_DUPLICATE_ROUTE`. Give each a distinct `prefix`. |
| `pollInterval` | Seconds. In dev, a remote source re-fetches on that interval and reloads only if content changed. Unset = fetch once and freeze for the session. Local sources (`filesystem()`, `obsidian()`) watch the filesystem and ignore it. |

### Secrets and SDK checks

- A descriptor declares its SDK and env vars. The generated project declares the package.
- `blume dev`, `blume build`, and `blume doctor` warn when a declared variable is unset. The warning prints before any fetch. `blume doctor` also lists configured sources.
- `notion()` and `contentful()` stop before their first request with `BLUME_MISSING_SECRET` when the token is unset.
- A source whose SDK is not installed stops with `BLUME_SOURCE_SDK_MISSING`.
- Either error serves the cached snapshot instead, when one exists.

### Caching and offline builds

- Each remote source keeps a snapshot in `.blume/cache/<source>/`. Never commit it.
- If a fetch fails, Blume serves the last-known-good snapshot with a warning. The build does not fail.
- Preview and published content get separate snapshots. So does each set of source options. Editing `query` or `fields` fetches afresh.
- `custom()` is the exception: its snapshot is kept per preview mode only. After editing its options run `blume sync`.
- In dev, a remote source is served from its snapshot when one exists. Restarting does not refetch.

### Preview and sync

```sh
bunx blume dev --preview      # author workflow: see drafts live
bunx blume build --preview    # full preview build
bunx blume sync               # refetch every remote source now (running dev server hot-reloads)
bunx blume sync --force       # drop snapshots first
```

`--preview` per CMS:

| Source | Behavior |
| --- | --- |
| Sanity | `previewDrafts` perspective (renamed `drafts` in `@sanity/client` 8; old name still works; client 6 accepts only the old one) |
| Contentful | Preview API with `CONTENTFUL_PREVIEW_TOKEN` |
| Payload | Requests drafts, stages with `draft: true` |
| Strapi | Requests drafts (`status=draft` on Strapi 5, `publicationState=preview` on Strapi 4) |
| Notion | Always reads every page. Pages whose `Status` is not published are staged as drafts. `blume dev` shows them with or without the flag. `blume build --preview` renders them. |

Production builds without `--preview` exclude drafts.

### Rendering and escaping

- Sources normalize their native shape (Portable Text, Notion blocks, remote HTML) to Markdown/MDX. All Blume components and markdown features apply.
- Built-in adapters escape rich text: `{`, `<b>`, a paragraph starting with `import`, or `&copy;` render as typed.
- Links keep only `http(s)`, `mailto:`, `tel:`, and relative targets. Other schemes (`javascript:`, `data:`) render as the link text.
- SVG images a source downloads are served sandboxed.
- `githubReleases()` notes and `mdxRemote()` files are treated as your own content. Raw HTML renders as written. Point them only at trusted repos.

---

## Adapter reference

### `filesystem()`

Options used in docs: `root`, `include`, `exclude`. Locale folders and version snapshots are read from it (see i18n and versioning).

```ts
filesystem({ root: "docs", exclude: ["vault/**"] })
```

### `obsidian()`

Reads a vault in place. No export step. Blume lowers Obsidian dialect to Markdown on load.

```ts
import { filesystem, obsidian } from "blume/sources";

content: {
  sources: [
    filesystem({ root: "docs" }),
    obsidian({
      prefix: "notes",
      vault: "vault",
      // Vault folder names to skip at any depth, on top of dot-folders
      exclude: ["Templates", "Daily"],
    }),
  ],
}
```

| Feature | Behavior |
| --- | --- |
| `[[Wikilinks]]` | Become route links, addressed by note name across the whole vault. |
| Supported forms | `[[Note\|label]]`, `[[Note#Install]]`, `[[folder/Note]]`, `[[folder/Note.md]]`, partial paths (`[[guides/Note]]`), `[[Note\|label]]` in table cells, `[[#Install]]` (same note). |
| `slug` in frontmatter | The link points at the route that slug publishes. |
| Name collisions | Exact full vault path wins. Then first in vault order (folders before notes, case-insensitive). Warns only when a link resolves through a collision. |
| Block refs `[[Note#^id]]` | Link to the note, no anchor. |
| Heading anchors | Resolved against the target's real headings. Missing heading: keeps page link, drops anchor, warns. |
| `index` note | Link lands on the folder route, not `/index`. Its title uses Blume's usual derivation (first heading, then humanized segment). |
| Unresolved wikilink | Plain text plus a build warning. Build does not fail. |
| Title | A note with no frontmatter `title` is titled by filename. |
| Comments | Single-line `%%comments%%` stripped. Wikilinks inside HTML comments left alone. |
| Code | Fenced, indented, inline code pass through verbatim. |
| Frontmatter | Keeps keys the page schema accepts plus keys in `frontmatter.extend` (or a content type's `frontmatter`). Everything else is dropped: Dataview fields, Templater dates, `publish`, `tags`, `aliases`, `cssclasses`. Alias link targets are not supported. |
| Images | Relative Markdown images beside a note (`![chart](./chart.png)`) are served from the vault. |
| Git dates | If the vault is inside the git repo, "Last updated" dates work. |
| Edit links | Resolve through `github.dir`. A vault outside the repo gets no link. |
| Skipped | Dot-folders (`.obsidian`, `.trash`), `node_modules`, `dist`, `.git`, etc. The dev watcher ignores `.obsidian` and `.trash`. |
| Bad paths | A note with `#` or `?` in its path is left out with an error. Rename it. |
| Symlinks | Followed. |
| Locales and versions | `fr/Note.md` publishes under `/fr/` (with i18n). `v1.0/Note.md` under `/v1.0/` (with versions). |

A vault inside the filesystem source root must be excluded from it: `filesystem({ root: "docs", exclude: ["vault/**"] })`. `blume version <id>` then leaves it out of the snapshot.

Not lowered yet: callouts (`> [!note]`) render as plain blockquotes. Embeds (`![[image.png]]`) pass through untouched. Multi-line `%%comments%%` stay in place. No backlink graph.

### `mdxRemote()`

Fetches raw `.md`/`.mdx` over HTTP. Two ways to enumerate files.

```ts
import { filesystem, mdxRemote } from "blume/sources";

// 1. A GitHub repo subtree
mdxRemote({
  prefix: "sdk",
  github: { owner: "acme", repo: "sdk", ref: "main", path: "docs" },
});

// 2. Explicit files against a raw base URL
mdxRemote({
  prefix: "sdk",
  url: "https://raw.githubusercontent.com/acme/sdk/main/docs",
  files: ["intro.mdx", "guide.mdx"],
});
```

| Option | Notes |
| --- | --- |
| `github` | `{ owner, repo, ref, path }`. Lists the repo tree at `ref`, keeps files under `path`. |
| `url` + `files` | Raw base URL plus an explicit file list. |
| `include` | Default `["**/*.{md,mdx}"]`. Matched against paths under `path`. A leading `!` excludes (`["**/*.mdx", "!drafts/**"]`). |
| `prefix`, `pollInterval` | Shared options. |

Behavior:

- Nothing under `path` at that ref: reads no pages, warns `BLUME_SOURCE_PATH_MISSING`.
- GitHub listing cap (100,000 entries or 7 MB for the whole repo, regardless of `path`): warns `BLUME_SOURCE_TRUNCATED`. Use `url` + `files` instead.
- Relative links between remote files (`[Errors](./02-errors.mdx)`) resolve to the published page. Ordering prefix is dropped from the route. `blume validate` checks them.
- `GITHUB_TOKEN` for private repos. Never inlined into config or output. Only sent to `api.github.com` and `raw.githubusercontent.com`, never to a custom `url` base.
- With `github`, `BLUME_MISSING_SECRET` warns when the token is unset (listing goes through the API: 60 unauthenticated requests/hour). A raw `url` source does not warn up front. A skipped file (401, 403, 404) with the token unset gets a warning saying so.
- A leading `# Heading` is dropped when it matches front matter `title`, or when no `title` is set (its text becomes the title). A different first heading stays.
- Bodies are staged in a hidden directory and rendered through Astro. All Blume components work.

### `githubReleases()`

Each release becomes a `type: changelog` entry.

```ts
import { filesystem, githubReleases } from "blume/sources";

githubReleases({
  prefix: "changelog",
  owner: "acme",
  repo: "sdk",
  // prereleases: false,  // include prereleases (default off)
  // drafts: false,       // include drafts (needs a write token)
  // limit: 100,          // cap releases, newest-first
  // baseUrl: "https://github.acme.com/api/v3", // GitHub Enterprise Server
});
```

| Option | Notes |
| --- | --- |
| `owner`, `repo` | Required. |
| `prereleases` | Include prereleases. Default off. |
| `drafts` | Include drafts. Needs a write token. A draft publishes like any release, so use only in builds readers do not see. |
| `limit` | Cap releases, newest-first. |
| `baseUrl` | GitHub Enterprise Server REST API (`https://<host>/api/v3`). `GITHUB_TOKEN` is sent there, so it must be a token for that server. |
| `prefix` | Use `"changelog"` so pages nest at `/changelog/v1-2-0`. |

Mapping:

- Name (or tag) becomes the title.
- Published date drives timeline order.
- Tag becomes `changelog.version`.
- Category tag: `Prerelease`, `Draft`, or `Release`.
- A summary of the notes becomes the meta description (and the RSS item description).
- Notes render as the body. A non-web/mail/phone/relative link keeps only its label. A link to your own `deployment.site` is rewritten root-relative.
- The `/changelog` index title and description come from the top-level `changelog` config, not the source.
- A fetch failure with no cache degrades to an empty changelog with a warning. Set `GITHUB_TOKEN` in CI and deploy environments.
- Release pages exist in one language only. They are never copied to other locales and show no language switcher.

### `sanity()`

Runs a GROQ query. Fields map to frontmatter. Portable Text maps to Markdown. A Markdown string field passes through.

```ts
import { filesystem, sanity } from "blume/sources";

sanity({
  prefix: "guides",
  projectId: "abc123",
  dataset: "production",
  query: `*[_type == "guide"]`,
  // Field paths default to title / slug.current / body / _updatedAt
  fields: { slug: "slug.current", body: "content" },
});
```

- Needs `@sanity/client` (optional peer).
- `SANITY_TOKEN` for private datasets. A public dataset works without it.
- A private dataset queried without a token returns no documents, not an error. When the query finds nothing and the token is unset, Blume adds a `BLUME_MISSING_SECRET` warning.
- Custom Portable Text block types map to components through the engine `serializers` option. Available only when you construct `sanitySource` directly and pass it to `custom()`. Setting `serializers` writes pages as MDX.

### `notion()`

Rows become pages, properties become frontmatter, blocks become MDX (callouts, toggles, columns, code blocks map to Blume components).

```ts
import { filesystem, notion } from "blume/sources";

notion({
  prefix: "handbook",
  database: "8f2c1e0a4b7d4f3c9e6a5d2b1c0f9e8d", // the id in the database URL
  // Property names default to the title-typed prop / Description / Slug / Order / Status
  publishedValue: "Done", // default "Published"
});
```

| Option | Notes |
| --- | --- |
| `database` | Notion database id. |
| `publishedValue` | Default `"Published"`. Pages whose `Status` (status or select) holds any other value import with `draft: true`. |
| `properties` | Rename property mappings. `properties.status` names a differently named status property. To import every page regardless of status, point it at a property the database lacks. |
| `mdx` | Default off. When `true`, text of paragraphs, headings, list items, quotes, and callouts is read as MDX. |
| `concurrency` | Request pool size. Default 3 (matches Notion's per-integration rate limit). |

Behavior:

- Needs `@notionhq/client` v5 or later (optional peer). Reads the database through its first data source.
- `NOTION_TOKEN`: share the database with your integration.
- Page with no Status value is published. A database without the property publishes every page.
- Notion's default status options are Not started, In progress, Done. There is no `Published`, so set `publishedValue: "Done"` or nothing publishes.
- Signed image and video URLs expire. The adapter downloads them at build time into site assets and rewrites references. Only files reported as image/video (or with an image/video extension in the URL when unreported) are saved. Others keep their URL with a warning.
- Video blocks become `<YouTube>` for YouTube links, `<video>` otherwise, with the caption as a `<Frame>` caption. A Vimeo or Loom page URL warns and the player cannot play it.
- By default text typed in Notion is escaped. With `mdx: true` it is held to MDX rules: a stray `{` or `<` fails the page and a paragraph starting with `import` is an import. Code blocks, toggle titles, captions, and properties stay plain text.
- `mdx: true` runs code at build time. Anyone who can edit the database can read build env vars including `NOTION_TOKEN`. Enable only for trusted editors.

### `contentful()`

Reads one content type through the Delivery API. Rich text lowers to Markdown. No install needed.

```ts
import { contentful, filesystem } from "blume/sources";

contentful({
  prefix: "guides",
  space: "abc123",
  contentType: "guide",
  // environment: "master", locale: "en-US"
  // Field ids default to title / description / slug / body; date to sys.updatedAt.
  // order has no default.
  fields: { body: "content", order: "position" },
  params: { "fields.section": "sdk" }, // extra Delivery API query params
  // EU data residency:
  // host: "cdn.eu.contentful.com",
  // previewHost: "preview.eu.contentful.com",
});
```

| Option | Notes |
| --- | --- |
| `space`, `contentType` | Required. |
| `environment`, `locale` | Optional. Examples: `"master"`, `"en-US"`. |
| `fields` | Field ids. Defaults `title`, `description`, `slug`, `body`. Date defaults to `sys.updatedAt`. `order` has no default (number field sets sidebar order). |
| `params` | Extra Delivery API query parameters. |
| `host`, `previewHost` | EU residency: `cdn.eu.contentful.com`, `preview.eu.contentful.com`. |

- `CONTENTFUL_ACCESS_TOKEN` for delivery. `--preview` uses the Preview API with `CONTENTFUL_PREVIEW_TOKEN`. The Preview API rejects delivery tokens, so `--preview` without a preview token fails clearly. It does not fall back.
- Without the delivery token: `BLUME_MISSING_SECRET` before the first request (unless cached).
- Rich text: headings, marks, links, lists, quotes, tables to Markdown. Embedded image asset becomes an image. Other embedded files become links. A Markdown long-text body passes through.
- Assets are referenced from Contentful's CDN, not downloaded.
- A link to another entry of the same `contentType` points at its page (slug under `prefix`). A link to an entry not turned into a page keeps only its text.
- Unpublished, archived, or deleted assets/entries are left out by the API. The page renders without them and warns `BLUME_SOURCE_UNRESOLVED_LINK`.
- Embedded entries map to components through `serializers` (keyed by content type id) only via `contentfulSource` + `custom()`. `serializers` writes pages as MDX. An embedded entry without a serializer is noted in a comment.

### `payload()`

Reads `/api/<collection>`. Lexical body lowers to Markdown (paragraphs, headings, bullet/numbered/check lists, quotes, links, uploads, horizontal rules). No install needed.

```ts
import { filesystem, payload } from "blume/sources";

payload({
  prefix: "handbook",
  url: "https://cms.example.com",
  collection: "docs",
  // Field paths default to title / description / slug / content / updatedAt.
  // order (no default) sets the sidebar order.
  fields: { body: "richText" },
  params: { sort: "title" }, // where[...], sort
});
```

| Option | Notes |
| --- | --- |
| `url`, `collection` | Required. |
| `fields` | Defaults `title`, `description`, `slug`, `content`, `updatedAt`. `order` has no default. |
| `params` | Extra query params: `where[...]`, `sort`. |
| `authCollection` | Set when the API key belongs to another auth-enabled collection. |

- `PAYLOAD_API_KEY` is sent as `users API-Key <key>`.
- Only published documents import. `--preview` requests drafts and stages them with `draft: true`.
- Fetched with `depth: 1` so uploads carry URLs. A relative upload path (`/media/x.png`) resolves against `url`.
- Uploads are referenced, not downloaded. To download and optimize at build, authorize the host in `image.domains`.
- `block`/`inlineBlock` nodes map to components via `serializers` (keyed by `blockType`) only through `payloadSource` + `custom()`. `serializers` writes pages as MDX. A Markdown text field stays Markdown.
- A node with no Markdown equivalent, or a block without a serializer, is left out as a comment. Warns `BLUME_SOURCE_UNSUPPORTED_NODE` naming node and page.

### `strapi()`

Reads `/api/<pluralApiId>`. Blocks body lowers to Markdown (paragraphs, headings, lists, quotes, code blocks, images, links). Works on Strapi 4 and 5 (the v4 `attributes` envelope is flattened). No install needed.

```ts
import { filesystem, strapi } from "blume/sources";

strapi({
  prefix: "guides",
  url: "https://cms.example.com",
  contentType: "guides",
  // locale: "en"
  // Field paths default to title / description / slug / content / updatedAt.
  // order (no default) sets the sidebar order.
  fields: { body: "body" },
  params: { "filters[section][$eq]": "sdk" }, // filters[...], sort
});
```

| Option | Notes |
| --- | --- |
| `url`, `contentType` | Required. `contentType` is the plural API id. |
| `locale` | Optional. |
| `fields` | Defaults `title`, `description`, `slug`, `content`, `updatedAt`. `order` has no default. |
| `params` | Extra query params: `filters[...]`, `sort`. |
| `populate` | Defaults to `populate=*`. Set to narrow it. |

- `STRAPI_API_TOKEN` is sent as a bearer token.
- Relative upload paths (`/uploads/x.png`) in a Blocks field resolve against `url`. In a Markdown field they stay relative to your docs site and break. Use absolute image URLs in Markdown fields.
- Only published entries import. `--preview` requests drafts and stages never-published documents with `draft: true`. A published document previews its latest draft.

### `custom()`

Takes a `ContentSource` instance (not an options object). Use it for backends not built in, or to pass a built-in engine with `serializers`.

```ts
import { custom, filesystem } from "blume/sources";
import { escapeMarkdownText } from "blume/sources/lower.ts";
import { sanitySource } from "blume/sources/sanity.ts";

content: {
  sources: [
    filesystem({ root: "docs" }),
    custom(
      sanitySource({
        name: "guides",
        prefix: "guides",
        projectId: "abc123",
        dataset: "production",
        query: `*[_type == "guide"]`,
        serializers: {
          callout: (block) =>
            `<Callout>${escapeMarkdownText(String(block.text ?? ""))}</Callout>`,
        },
      })
    ),
  ],
}
```

Contract:

- Engine factories and imports: `sanitySource` (`blume/sources/sanity.ts`), `notionSource`, `contentfulSource`, `payloadSource` (engines), `escapeMarkdownText` (`blume/sources/lower.ts`).
- A serializer's return value is written into the page as MDX as-is. Escape CMS text with `escapeMarkdownText`. Otherwise a `{` runs as an expression and fails the build, and `<b>` renders as HTML.
- Engine-built sources are rebuilt on the running command's context: they read drafts under `--preview` and keep their snapshot in `.blume/cache`. Your own source can do the same by implementing `withContext(ctx)` and returning itself rebuilt on that context.
- `custom()` snapshots are keyed per preview mode only, not per options. After editing query, fields, or serializers, `blume dev` still serves the old snapshot. Run `blume sync`.
- No shared `prefix` / `pollInterval` option. The source sets its own `prefix` property. Re-fetching is whatever its `watch` method implements.
- It declares no runtime dependency or secret. `blume dev`/`blume build` do not warn about unset variables it reads. Engines that require a token (`notionSource`, `contentfulSource`) still stop with `BLUME_MISSING_SECRET`.
- A source reading local files should set `sourcePath` on each entry (names the file in diagnostics, resolves relative images) and `contentRoot` on the source (bounds the git `log` that dates pages). Without `contentRoot` pages get no git-derived "Last updated" date.

---

## Internationalization

Opt-in. Without an `i18n` block the site stays single-language. Composes with versioning: a snapshot keeps its translations, and fallback works within each version.

### Enable

```ts
// blume.config.ts
i18n: {
  defaultLocale: "en",
  locales: [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
    { code: "ar", label: "العربية", dir: "rtl" },
  ],
}
```

| Locale field | Notes |
| --- | --- |
| `code` | Used in URLs. |
| `label` | Shown in the language switcher. |
| `dir` | Optional. `"ltr"` (default) or `"rtl"`. |
| `style` | Optional freeform guidance for `blume translate` (register, dialect, terminology), e.g. `"Brazilian Portuguese, informal você"`. |

### `i18n` options

| Option | Default | Notes |
| --- | --- | --- |
| `defaultLocale` | required | Lives at the content root. |
| `locales` | required | Array of locale objects. |
| `parser` | `dir` | `"dot"` for filename suffixes. |
| `hideDefaultLocalePrefix` | `true` | `false` prefixes every locale, including the default (`/en/…`). |
| `fallbackLocale` | `defaultLocale` | `null` = 404 for untranslated pages. |
| `routeByBrowserLanguage` | off | Redirects home-page visitors by browser language. |
| `ui` | none | Per-locale overrides of UI strings. |

### Content layout (default `dir` parser)

The default locale lives at the content root. Every other locale is a top-level folder named by its `code`, mirroring the default structure.

```txt
docs/
  index.mdx               ->  /
  guides/quickstart.mdx   ->  /guides/quickstart
  fr/
    index.mdx             ->  /fr
    guides/quickstart.mdx ->  /fr/guides/quickstart
  ar/
    index.mdx             ->  /ar
```

- Do not make a folder for the default locale. `docs/en/` with an `en` default is ordinary content at `/en/…` (and `/fr/en/…` as a French fallback). Blume warns.
- Translate only what you want. The rest falls back.

### Filename suffixes (`parser: "dot"`)

```txt
docs/
  guides/quickstart.mdx     ->  /guides/quickstart      (default)
  guides/quickstart.fr.mdx  ->  /fr/guides/quickstart   (French)
```

Good for sparse translations. Under `dot`, a folder's `meta.ts` applies to every locale.

### Shared files (`$` marker)

```txt
docs/changelog.$.mdx   ->  /changelog and /fr/changelog (same content)
docs/guides/meta.$.ts   (folder meta applied to every locale)
```

A locale-specific `meta.ts` overrides the shared `meta.$.ts` for that language.

### Per-locale navigation

- Each locale gets its own sidebar built from that locale's files. Structure, order, and labels can diverge.
- Under the `dir` parser, put `meta.ts` under e.g. `fr/guides/` to order the French group independently.
- Until a locale has a `meta.ts` (or a shared `meta.$.ts`), its group mirrors the fallback locale's `meta.ts` and the `sidebar.display` set by its index page.
- Header tabs, header links, and footer are configured, not derived. Localize labels in `blume.config.ts` with a per-locale map. A plain string still works. Missing locales fall back to the default locale's entry.
- Per-locale maps are accepted for: tab and dropdown labels, featured links, header actions and the call to action, footer links, the banner text and link text, and custom clients in the Connect to MCP menu.

```ts
navigation: {
  cta: {
    href: "https://acme.dev/signup",
    label: { en: "Start free", fr: "Essai gratuit" },
  },
},
footer: {
  links: [
    { label: { en: "Pricing", fr: "Tarifs" }, href: "https://acme.dev/pricing" },
  ],
},
```

- Tab paths, header and footer links, and the header logo link move into the reader's locale when that locale serves the route.
- A route only the default locale serves (a custom page, the generated changelog index) keeps its own path.

### Fallbacks

An untranslated page renders the fallback locale's content at the localized URL. The link works and the page is pre-rendered.

- Fallback pages set canonical to the page they copy.
- They are excluded from the search index, `llms.txt`, and the MCP and JSON API page lists.
- They are not advertised as translations in `hreflang`.
- They still appear in that locale's sidebar.
- `fallbackLocale: null` gives 404 instead.
- `githubReleases()` pages are the exception: never copied to other locales, no switcher.

### Links across locales

- Write internal links as in the default locale (`[Setup](/guides/setup)`, `<Card href="/guides/setup">`) in every language.
- Under a locale prefix, Blume moves each root-relative page link into that locale (`/fr/guides/setup`) if the route is served there (translation or fallback).
- A link with no per-locale variant keeps its authored target (custom page, generated route, missing translation with fallbacks off).
- A link already carrying a locale prefix (`/de/guides/setup`) is left alone.
- Anchors travel with the link, so heading ids must match across languages. Pin translated headings with the `[#custom-id]` marker. `blume translate` does this automatically with a trailing `[#id]`. Otherwise `#ordering` will not match the French auto id `#ordre`, and `blume validate` reports it.

### Translating with an agent

```sh
bunx blume translate --codex
bunx blume translate --check   # CI: fails when a source page has drifted ahead of its translations
```

- Finds pages missing or outdated per locale. Translates with a local agent CLI (Codex or Claude Code).
- Blume validates structure (frontmatter, code fences, links) and writes files itself. The agent only translates text.
- Ledger `blume.translations.json` (commit it) tracks the source revision per translation. Reruns touch only what changed.
- Hand-written translations are adopted as-is and never overwritten.
- It never retranslates frozen version snapshots.

### Language switcher

Automatic when i18n is on, generated from `locales`. Per page it links the translation in each language. Missing translations link the fallback page and are marked not translated. With `fallbackLocale: null` the language is left out. Nothing to configure. `githubReleases()` pages render without a switcher.

### Browser language routing

```ts
i18n: {
  defaultLocale: "en",
  locales: [
    { code: "en", label: "English" },
    { code: "fr", label: "Français" },
  ],
  routeByBrowserLanguage: true,
}
```

- Only the default-locale home page routes, for visitors arriving from outside the site.
- Tries each browser-preferred language in order: exact code, then base language (`fr-CA` finds `fr`). If the default comes first, the visitor stays.
- Once a reader uses the switcher, Blume remembers the choice and stops routing.
- Runs in the browser before paint. Works on any host, static included.
- Off by default because crawlers read one language. Keep the `hreflang` alternates Blume emits.

### Translated UI strings

- Built-in packs cover 30+ languages (Arabic, Bengali, Bulgarian, Catalan, Chinese Simplified and Traditional, Croatian, Czech, Danish, Dutch, Finnish, French, German, Greek, Hebrew, Hindi, Hungarian, Indonesian, Italian, Japanese, Korean, Norwegian, Persian, Polish, Portuguese and Brazilian Portuguese, Romanian, Russian, Serbian, Slovak, Spanish, Swedish, Thai, Turkish, Ukrainian, Vietnamese). You translate only content.
- Missing strings fall back to the default locale, then English.
- Override or add a language with `i18n.ui`, keyed by locale:

```ts
i18n: {
  ui: {
    fr: {
      search: { button: "Rechercher", placeholder: "Rechercher…" },
      page: { previous: "Précédent", next: "Suivant" },
    },
  },
}
```

Other documented UI keys: `changelog.title` and `changelog.description` (changelog index text), `notFound` with `title`, `description`, `home` (404 page wording).

### SEO

- `<html lang>` and `dir` come from the active locale.
- `hreflang` alternates cover every real translation plus `x-default` (default locale).
- Canonical URLs are locale-correct. JSON-LD carries `inLanguage`.
- Set `deployment.site` so these are absolute URLs.

### Search

- Scoped to the active language, with an "All languages" toggle.
- Orama (default) and FlexSearch filter in the browser. Pagefind keeps an index per language. Algolia, Orama Cloud, and Typesense carry a `locale` field per record.
- Mixedbread cannot scope by language: every search spans all locales, no toggle.

### Right-to-left

`dir: "rtl"` mirrors the whole UI (sidebar, header, TOC, pagination, search, menus) and sets `<html dir>`. Code blocks stay LTR. Fallback content keeps the direction of its actual language.

---

## Versioning

Opt-in. The latest docs live at the content root with clean URLs. Each past version is a frozen snapshot in its own folder. Without a `versions` block nothing changes.

### Config

```ts
// blume.config.ts
versions: {
  current: { label: "v2.0", badge: "Latest" },
  archived: [
    { id: "v1.0" },
    { id: "v0.9", label: "0.9 (legacy)" },
  ],
}
```

| Field | Notes |
| --- | --- |
| `current.label` | Label for the unprefixed tree in the switcher. |
| `current.badge` | Optional badge text. |
| `archived[].id` | Directory name and URL segment. Must start with a letter (`v1.0`, not `1.0`) so it cannot collide with numeric ordering prefixes. Must not equal a configured locale code (config is rejected). |
| `archived[].label` | Optional switcher label. Defaults to `id`. |
| `archived[].banner` | Custom notice text, or `false` to disable it. |
| `archived[].canonical` | `"self"` makes every page of that version authoritative. |
| `archived[].noindex` | `true` deindexes the whole version. |

List archived versions newest first. That order is the switcher order.

### Cut a version

```sh
bunx blume version v1.0   # freeze current docs
bunx blume version        # list configured versions
```

`blume version <id>`:

- Copies the content tree into `docs/v1.0/` (existing snapshots excluded).
- Rewrites root-absolute links inside the copy (`/guides/x` becomes `/v1.0/guides/x`). Fenced and inline code are untouched.
- Registers the id in `blume.config.ts`. The first cut adds the `versions` block and labels the live docs "Latest". If the config shape is unsupported, it warns and prints the entry to paste.
- Links to pages not in the copied tree (generated API references, remote sources like a changelog) keep pointing at live pages.
- Review and commit the new directory. Restart `blume dev` to pick it up.

```txt
docs/
  index.mdx               ->  /              (latest)
  guides/quickstart.mdx   ->  /guides/quickstart
  v1.0/
    index.mdx             ->  /v1.0          (frozen)
    guides/quickstart.mdx ->  /v1.0/guides/quickstart
```

Archived means frozen:

- Edit the live tree, never a snapshot.
- Snapshots keep their own folder meta and translations. `blume translate` never retranslates them.
- A configured explicit sidebar applies only to the current docs. A snapshot's sidebar always comes from its own files.

### Switcher and notice

- A version dropdown appears in the header automatically.
- Switching lands on the same page in the target version when it exists, else that version's root. `switcher.redirect: "root"` always lands on the root.
- Declaring your own `kind: "version"` selector in `navigation.selectors` replaces the automatic one.
- Every archived page shows a non-dismissible notice with a "Go to latest" link to the live equivalent.

```ts
versions: {
  current: { label: "v2.0" },
  archived: [
    { id: "v1.0", banner: "These docs cover the 1.x SDK." },
    { id: "v0.9", banner: false },
  ],
}
```

### SEO

Default: archived pages are indexable and declare the latest equivalent as canonical. Version-only pages (gone from latest) get a self-canonical.

```ts
versions: {
  current: { label: "v2.0" },
  archived: [
    { id: "v1.0" },                    // canonical -> latest (default)
    { id: "v0.9", canonical: "self" }, // every page authoritative
    { id: "v0.8", noindex: true },     // deindexed entirely
  ],
}
```

- Sitemap: archived pages whose canonical points at a live equivalent are left out. `noindex` versions are left out wholesale. Version-only pages stay.
- A page's own `seo.canonical` frontmatter always wins.

### Search

- Results scope to the viewed version, with an "All versions" toggle (remembered per reader). Cross-version hits name their version on the row.
- Orama (default), FlexSearch, Algolia, and Typesense honor scoping. Hosted records carry a `version` facet, with current docs uploaded as `"current"`.
- Pagefind, Orama Cloud, and Mixedbread do not scope by version. Results span all versions, no toggle.

### Agents

- MCP `search_docs` and `list_pages` default to the current docs and accept `version`: an archived id (`"v1.0"`) or `"all"`. `get_navigation` returns an archived tree on request.
- `llms.txt` lists archived versions after current, labeled with `label` or `id` plus `(archived)` (e.g. `v1.0 (archived)`).
- `llms-full.txt` is current-only.
- The assistant grounds answers in the viewed version (current unless on an archived page).
- `.md` mirrors exist for every version's pages.

### With i18n

On disk the version folder is outermost. In URLs the locale is outermost.

```txt
docs/
  guides/x.mdx            ->  /guides/x
  fr/guides/x.mdx         ->  /fr/guides/x
  v1.0/
    guides/x.mdx          ->  /v1.0/guides/x
    fr/guides/x.mdx       ->  /fr/v1.0/guides/x
```

Fallback works within each version. `hreflang` alternates group per version.

### What stays unversioned

Blog, changelog, OpenAPI-generated API references, and custom pages are always current. Header tabs are defined against current docs, so in an archived tree the sidebar renders unscoped by tabs. Each snapshot is a full copy (content, search entries, navigation data), so large sites grow per version.

---

## Changelog

A changelog entry is a normal `.md`/`.mdx` page with `type: changelog`. By convention under `changelog/`, but the type, not the folder, matters. Blume generates an index at `/changelog` and an RSS feed at `/changelog/rss.xml`.

```mdx
---
title: v1.2.0
type: changelog
date: 2026-06-20
changelog:
  version: 1.2.0
  category: Features
---

A big batch of components landed this release.

- New `Accordion`, `Expandable`, and `Tooltip` components
```

- Always set `date` (unquoted YAML dates are fine). It sorts the index and feed newest-first.

### The `changelog` frontmatter object (all optional)

| Key | Type | Notes |
| --- | --- | --- |
| `changelog.version` | string | Release version. Falls back to a `v`-prefixed label when there is no title. |
| `changelog.category` | string | Tag beside the entry, e.g. Release, Features, Fixes. |
| `changelog.date` | string | Publish date. May live here or top level. Both feed the index and RSS. |

### Generated index page

Appears once at least one `type: changelog` entry exists and nothing else occupies `/changelog`.

- Full-width, no sidebar or TOC. One row per release, newest-first, grouped by year.
- Row label is the entry title, or `v{version}` with no title. Links to the entry page (full notes there).
- `category` renders as a tag. Date follows `dateFormat`, minus the year the group shows.
- Drafts and `sidebar.hidden` entries are skipped.
- Heading defaults to "Changelog" (English). Customize with top-level `changelog` config. It also sets the page `<title>`, meta description, OG card, and `/changelog.md` mirror.

```ts
// blume.config.ts
changelog: {
  title: "Release notes",
  description: "Every Acme SDK release, newest first.",
},
```

- Each value accepts a locale-code map. The index renders in the default locale. Unset values keep built-in text, which `i18n.ui` keys `changelog.title` and `changelog.description` override.

### Writing your own index

Place `<Changelog />` where the list belongs. A content page at `/changelog` takes over the route and the generated page steps aside.

```mdx
---
title: Changelog
description: Every Acme SDK release, newest first.
mode: center
---

Every release, newest first. Subscribe to the [RSS feed](/changelog/rss.xml).

<Changelog />
```

- Put it at `changelog/index.mdx`, beside entries, so the sidebar Changelog group links to it. A `changelog.mdx` next to the folder adds a second sidebar item.
- `mode: center` gives it the generated layout (no sidebar/TOC, wider centered column).
- The list is always the default locale's entries. Dates read in the page's language.
- It downlevels to Markdown on agent surfaces (`/changelog.md`, llms-full.txt, MCP `get_page`, search).

### Replacing the page entirely

Add `pages/changelog.astro`. It takes over and Blume stops generating the index. `<Update>` is not an MDX component. Import it in the `.astro` page:

```astro
---
import Update from "blume/components/content/Update.astro";
---
```

Silent failure: entries from non-filesystem sources (such as GitHub Releases) render through a parallel `staged` collection. A page reading only `getCollection("docs")` lists none of them, with no warning. Prefer `<Changelog />` in a content page unless you need different markup.

### From GitHub Releases

Use `githubReleases()` (see Adapter reference). Each release becomes a changelog entry with the same timeline and feed.

```ts
import { filesystem, githubReleases } from "blume/sources";

content: {
  sources: [
    filesystem({ root: "content" }),
    githubReleases({ prefix: "changelog", owner: "acme", repo: "sdk" }),
  ],
}
```

Each release page gets a unique meta description summarized from its notes (markdown stripped, section headings and changeset commit-hash prefixes dropped, trimmed to the search-snippet length `blume audit` checks).

### Keep entries out of the docs sidebar

Entries are ordinary pages, so a `changelog/` folder (or a `githubReleases()` source with `prefix: "changelog"`) becomes a growing Changelog sidebar group, and prev/next links run through it.

Fix: link the changelog with a header tab, not a header action.

```ts
navigation: {
  tabs: [
    { label: "Docs", path: "/" },
    { label: "Changelog", path: "/changelog" },
  ],
}
```

- The `/changelog` tab opens the index (no `href` needed) and owns the `changelog/` section. Other pages stop listing releases and their prev/next stay among docs. An entry's own page shows the release list as its sidebar.
- Index, RSS, `llms.txt`, sitemap, and search still list every entry.
- Tab `path` must match the folder or `prefix` the entries live under.
- The `Docs` tab at `/` is optional (gives a tab to return to).
- `sidebar.hidden` on entries is NOT the fix: it unlists them everywhere, index and feed included.

### RSS feed

- `/changelog/rss.xml`, newest-first by `date`. Needs absolute `deployment.site`. Blume injects `<link rel="alternate">` on every page.
- On by default. Tune under `seo.rss`:

```ts
seo: {
  rss: {
    enabled: true,
    types: ["blog", "changelog"],
    limit: 50,
  },
}
```

- Remove `"changelog"` from `rss.types` to skip the feed but keep the timeline.

### Structured data

With structured data on, each entry emits schema.org `TechArticle` with description and publish date.

---

## Blog

A blog is content with `type: blog`. Blume gives it an RSS feed and richer article metadata. There is no generated index page. You compose the landing page.

```mdx
---
title: Introducing Blume
type: blog
date: 2026-06-22
description: Why we built a markdown-first docs framework.
---

Body text.
```

- By convention under `blog/`. The type matters, not the folder.
- Set `date` (feed sort and `pubDate`) and `description` (feed summary and SEO).

### Feed and structured data

- RSS at `/blog/rss.xml`, newest-first by `date`. Needs absolute `deployment.site`. On by default via `seo.rss` (same config as above). Remove `"blog"` from `rss.types` to skip.
- With structured data on, each post emits schema.org `BlogPosting`.

### Index option 1: content page

```mdx
---
title: Blog
description: News and writing from the team.
---

<CardGroup cols={2}>
  <Card title="Introducing Blume" href="/blog/introducing-blume">
    Why we built a markdown-first docs framework.
  </Card>
</CardGroup>
```

### Index option 2: automatic `pages/blog/index.astro`

```astro
---
import { getCollection } from "astro:content";
import data from "blume:data";
import { getBlumeCollection } from "blume/runtime";

// A custom page renders at its own path only, so list the default locale's
// posts. getBlumeCollection leaves out drafts, hidden pages, and the copies
// i18n serves for untranslated pages, so each post is listed once.
const routes = getBlumeCollection(data, {
  locale: data.config.i18n?.defaultLocale,
});
const routeByEntry = new Map(routes.map((route) => [route.entryId, route.path]));

const posts = (await getCollection("docs"))
  .filter((entry) => entry.data.type === "blog" && routeByEntry.has(entry.id))
  .map((entry) => ({
    date: entry.data.date,
    description: entry.data.description,
    href: routeByEntry.get(entry.id),
    title: entry.data.title,
  }))
  .toSorted((a, b) => Number(new Date(b.date)) - Number(new Date(a.date)));
---

<ul>
  {posts.map((post) => (
    <li>
      <a href={post.href}>{post.title}</a>
      <p>{post.description}</p>
    </li>
  ))}
</ul>
```

Wrap it in `PageLayout` or `RootLayout` for site chrome (see Custom pages).

---

## Custom pages

Mount fully custom `.astro` routes alongside docs. Create a `pages/` folder at the project root. The folder name is configurable via `content.pages` (default `"pages"`).

```astro
---
// pages/pricing.astro
import data from "blume:data";
---

<h1>Pricing for {data.config.title}</h1>
```

- `blume dev` picks it up immediately. `blume build` prerenders to static HTML.
- Pages keep their on-disk location. Relative imports, component imports, and `getStaticPaths` work as in plain Astro. Files are mounted in place, not copied.

### Routes

| File | Route |
| --- | --- |
| `pages/pricing.astro` | `/pricing` |
| `pages/blog/index.astro` | `/blog` |
| `pages/blog/[slug].astro` | `/blog/:slug` |
| `pages/changelog.astro` | `/changelog` |

- A custom page wins over a generated route at the same path. `pages/changelog.astro` replaces the generated changelog.
- Dynamic `[param]` routes: Blume cannot enumerate paths. They are left out of the sitemap, get no generated OG card, and are unknown to `blume validate` (a link to one is reported broken).
- Workaround: pass `ogImage` to `PageLayout`, or use one static file per path (`pages/compare/mintlify.astro` instead of `pages/compare/[tool].astro`) to get all three.

### Imports available

| Import | Use |
| --- | --- |
| `import data from "blume:data"` | Resolved config, navigation, routes, feeds. Typed automatically in a Blume project. |
| `import type { BlumeData, BlumeRoute } from "blume"` | Explicit types. |
| `import { getBlumeCollection } from "blume/runtime"` | Select content routes. |
| `import BlumePage from "blume/components/BlumePage.astro"` | Render a content entry body with built-in MDX components. |
| `import PageLayout from "blume/components/layout/PageLayout.astro"` | Full-width shell, no sidebar. |
| `import RootLayout from "blume/components/layout/RootLayout.astro"` | Full docs chrome (3-column grid). |
| `import Update from "blume/components/content/Update.astro"` | Inline release-note block (not an MDX component). |
| `import { getCollection } from "astro:content"` | The `docs` collection (holds frontmatter such as `type`, `date`). |

### `blume:data` shape

| Key | Type | Content |
| --- | --- | --- |
| `config` | `BlumeDataConfig` | title, description, logo, favicon, appleIcon, banner, theme, site, repoUrl, github (owner, repo, host, REST api base; null when unset), search, i18n, mcp, assistant, og, analytics, feedback, structuredData, toc, codeThemes, codeWrap, imageZoom. |
| `navigation` | `Navigation` | Sidebar, tabs, selectors (default locale). |
| `navigationByLocale` | `Record<string, Navigation>` | Per-locale trees. Empty unless i18n is configured. |
| `routes` | `BlumeRoute[]` | `{ id, path, title, locale, indexable, hidden, draft, fallback, editUrl, lastModified, alternates, collection, entryId }`. |
| `feeds` | `BlumeFeed[]` | `{ href, title }`. |
| `fontCssVars` | `FontHead[]` | `{ cssVariable, preloadWeights, preloadSubsets? }` for Astro's `<Font>`. |
| `ui` | `UIStrings` | Default-locale UI strings. |
| `uiByLocale` | `Record<string, UIStrings>` | Empty unless i18n is configured. |

`routes` has no frontmatter (`type`, `date`). To filter by type, pair it with `getCollection("docs")` keyed on `entryId` (see the blog example).

### Runtime helpers

`getBlumeCollection(data, query?)`: selects content routes filtered by collection, locale, or path prefix. Drafts, hidden pages, and i18n fallback copies are excluded. Sorted by path.

```astro
---
import data from "blume:data";
import { getBlumeCollection } from "blume/runtime";

const posts = getBlumeCollection(data, { prefix: "/blog" });
---

<ul>
  {posts.map((post) => <li><a href={post.path}>{post.title}</a></li>)}
</ul>
```

`<BlumePage id={entryId} />`: renders a content entry body inside a custom page, with Blume MDX components wired in.

```astro
---
import BlumePage from "blume/components/BlumePage.astro";
import data from "blume:data";
import { getBlumeCollection } from "blume/runtime";

const [intro] = getBlumeCollection(data, { prefix: "/docs" });
---

{intro && <BlumePage id={intro.entryId} />}
```

Pass `components` to add overrides or islands (not imported by default). Pass `collection` to read from a collection other than `"docs"`.

### PageLayout

Provides the document shell, header, theme, and fonts, then one full-width default `<slot />` (no sidebar, prose, or TOC). Optional named slot `footer` renders after `<main>`.

```astro
---
import PageLayout from "blume/components/layout/PageLayout.astro";
import data from "blume:data";
import Footer from "./_home/Footer.astro";

const { config } = data;
---

<PageLayout
  site={{ title: config.title, description: config.description }}
  logo={config.logo}
  banner={config.banner}
  analytics={config.analytics}
  navigation={data.navigation}
  favicon={config.favicon}
  fontCssVars={data.fontCssVars}
  themeMode={config.theme.mode}
  searchEnabled={config.search.enabled}
  siteUrl={config.site}
  ogEnabled={config.og.enabled}
  page={{ title: "Acme — the fastest docs", description: config.description }}
>
  <section class="mx-auto max-w-5xl px-6 py-24">
    <h1>Build docs that fly</h1>
  </section>
  <Footer slot="footer" />
</PageLayout>
```

`PageLayout` props mentioned in the docs:

| Prop | Effect |
| --- | --- |
| `site` | `{ title, description }`. |
| `logo`, `banner`, `analytics`, `favicon`, `fontCssVars` | Pass straight from `config` / `data`. |
| `navigation` | `data.navigation`. |
| `themeMode` | `config.theme.mode`. |
| `searchEnabled` | `config.search.enabled`. |
| `page` | `{ title, description?, route? }`. `page.title` is used verbatim as the document title (no `- siteTitle` suffix). |
| `siteUrl` + `ogEnabled` | Derives `canonical` and a generated `og:image`. |
| `ogImage` | Root-relative path (a file in `public/`, resolved against `deployment.site`) or an external URL. Overrides the generated card for that page only. |
| `ogImageAlt`, `ogImageSize` | Pass with your own `ogImage`, e.g. `{ width: 1200, height: 630 }`. |
| `canonical` | Explicit override. |
| `assistantEnabled` | `false` leaves the assistant trigger off this page. |
| `localeSwitch` | Array of `{ code, label, dir, href, current, untranslated }`, one per locale. Header shows no language switcher without it. |
| `discovery` | `null` drops the agent-discovery head links (`describedby`, `ai-catalog`, `ard`) for this page. |
| `transparentHeader` | Header starts see-through with white chrome, frosted once scrolled. Pull the hero up by the header height (`-mt-16`) and pad its top. |
| `lastModified` | Date string or `Date`. Emits `dateModified` in JSON-LD. Pass it so other visible dates are not taken as the page date. |
| `structuredDataEnabled` | `config.structuredData` to follow config, or `false` to disable for this page. |
| `noindex` | `true` (used in the 404 example). |

Behavior notes:

- Header chrome (search, theme toggle, assistant trigger when configured) comes along with no per-page wiring.
- Agent-discovery head links come along via resolved config. The homepage also advertises `/index.md` as a `text/markdown` alternate. Other custom pages have no mirror, so none is advertised.
- Blume renders an OG card for every static custom page (home included) at `/og/<route>.png` (`/og/index.png` for `/`). Home card headline is the site title, subtitle the site description. Deeper pages are titled from the last path segment. Dynamic `[param]` pages get none.
- JSON-LD graph is emitted, with a `WebPage` node on the home page.

### RootLayout

Use for full docs chrome (sidebar, TOC). Its props are part of the generated runtime and can change between releases. For a fully owned layout use `blume eject` (turns `.blume/` into a standard Astro project).

```astro
---
import RootLayout from "blume/components/layout/RootLayout.astro";
import data from "blume:data";
---

<RootLayout
  site={{ title: data.config.title, description: data.config.description }}
  logo={data.config.logo}
  banner={data.config.banner}
  navigation={data.navigation}
  page={{ title: "Pricing", route: "/pricing" }}
  headings={[]}
  themeMode={data.config.theme.mode}
  searchEnabled={data.config.search.enabled}
  indexable={true}
>
  <h1>Pricing</h1>
</RootLayout>
```

### 404 page

- Default: centered "404" in site chrome, plus a "Where to look next" list linking every top-level section and `sitemap.xml` and `llms.txt` when they exist.
- `blume build` writes `404.html`. Twins: `/404.md` and `/404.json` (RFC 9457 problem details), absolute URLs once `deployment.site` is set, plus `openapi.json` when the JSON API is on.
- On Vercel or Cloudflare server builds, a missing page requested with `Accept: text/markdown` gets the Markdown body with status 404. `Accept: application/json` gets the problem document. On Vercel the same holds for a `.md`/`.json` URL no file backs.
- Replace with `pages/404.astro`. Your page wins and the default and its twins are dropped.

```astro
---
import PageLayout from "blume/components/layout/PageLayout.astro";
import data from "blume:data";
---

<PageLayout
  site={{ title: data.config.title, description: data.config.description }}
  logo={data.config.logo}
  navigation={data.navigation}
  themeMode={data.config.theme.mode}
  searchEnabled={data.config.search.enabled}
  page={{ title: "Page not found", route: "/404" }}
  noindex={true}
>
  <section class="mx-auto max-w-2xl px-6 py-24 text-center">
    <h1>This page took a wrong turn</h1>
    <a href="/">Back to home</a>
  </section>
</PageLayout>
```

- To keep the design but change wording (including other languages), override the `notFound` UI strings (`title`, `description`, `home`) via `i18n.ui`.

### Interactive pages

Custom pages are ordinary Astro. Use React (or other framework) islands with a hydration directive. React switches on automatically when the project contains a `.tsx` or `.jsx` file.

---

## Gotchas

Sources
- `content.sources` replaces the implicit default. Forget `filesystem()` and local docs vanish.
- Do not mix `content.root`/`include`/`exclude` with `sources`. Move them into `filesystem()`.
- Give every source a distinct `prefix`, or hit `BLUME_DUPLICATE_ROUTE`.
- Multiple `filesystem()` sources must share one root. Partition with `include`, or hit `BLUME_ENTRY_ID_MISMATCH`.
- A leftover 1.x `{ type: "…" }` source object fails config validation.
- `sanity` and `notion` need their optional peer installed (`bun add @sanity/client`, `bun add @notionhq/client`), else `BLUME_SOURCE_SDK_MISSING`. `@notionhq/client` must be v5+.
- Notion's default Status options have no `Published`. Set `publishedValue: "Done"` or nothing publishes.
- `notion({ mdx: true })` executes editor-authored code at build. Trusted editors only.
- Contentful `--preview` needs `CONTENTFUL_PREVIEW_TOKEN`. It does not fall back to the delivery token.
- A private Sanity dataset with no token returns zero documents silently (only the `BLUME_MISSING_SECRET` warning).
- Strapi Markdown fields need absolute image URLs.
- `mdxRemote({ github })` unauthenticated is limited to 60 API requests/hour. Set `GITHUB_TOKEN`. Huge repos hit `BLUME_SOURCE_TRUNCATED`: switch to `url` + `files`.
- `custom()` snapshots ignore option changes. Run `bunx blume sync` after edits. It also gives no unset-env warnings.
- Serializer output is raw MDX. Always wrap CMS text in `escapeMarkdownText`.
- Dev is cache-first. Restarting does not refetch. Use `blume sync`, `blume sync --force`, or `pollInterval`.
- `.blume/cache/` is regenerated. Never commit it.
- `githubReleases()` with no cache and no token yields an empty changelog plus a warning, not a build failure. Set `GITHUB_TOKEN` in CI.
- An Obsidian vault inside the filesystem root must be excluded from it, or notes publish twice.

i18n
- Do not create a folder for the default locale (`docs/en/`). It publishes at `/en/…` as ordinary content.
- Heading ids must match across locales for anchors to work. Pin with `[#custom-id]`.
- Fallback pages are canonicalized to the original and excluded from search, `llms.txt`, MCP, and `hreflang`.
- Custom pages and the generated changelog index are default-locale only. Pass `localeSwitch` to `PageLayout` if you want a switcher.
- `routeByBrowserLanguage` only routes the default-locale home page, and only for outside arrivals.
- Set `deployment.site` for absolute `hreflang`, canonical, and RSS URLs.
- A version `id` colliding with a locale `code` rejects the config.
- Mixedbread search cannot scope by language or version.

Versioning
- Version ids must start with a letter (`v1.0`).
- Edit the live tree, never a snapshot. Snapshots are not retranslated.
- Restart `blume dev` after `blume version <id>`.
- Blog, changelog, OpenAPI references, and custom pages are never versioned. Each snapshot is a full copy.
- Pagefind, Orama Cloud, and Mixedbread ignore version scoping.

Changelog and blog
- Only `type: changelog` / `type: blog` matter, not folder names. Always set `date`.
- A `changelog.mdx` beside a `changelog/` folder creates a second sidebar item. Use `changelog/index.mdx`.
- To hide releases from the docs sidebar use a `/changelog` header tab. `sidebar.hidden` unlists entries from the index and feed too.
- Custom changelog pages that read `getCollection("docs")` alone miss non-filesystem (staged) entries silently.
- Blog has no generated index. Build `blog/index.mdx` or `pages/blog/index.astro`.
- RSS needs `deployment.site` and the type listed in `seo.rss.types`.

Custom pages
- A custom page overrides a generated route at the same path (`changelog`, `404`).
- Dynamic `[param]` pages have no sitemap entry, no OG card, and `blume validate` flags links to them as broken.
- `RootLayout` props can change between releases. Prefer `PageLayout`, or `blume eject`.
- `page.title` in `PageLayout` has no site-title suffix.
- `routes` from `blume:data` lacks frontmatter. Pair with `getCollection("docs")` by `entryId`. Under i18n key the map on the default locale only (`getBlumeCollection(data, { locale: data.config.i18n?.defaultLocale })`).
