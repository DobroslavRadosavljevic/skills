# Content, frontmatter, and navigation

How files become routes, every frontmatter field, `meta.ts`, and the `navigation` config (sidebar, tabs, selectors, header).

## Contents

- [Files and routes](#files-and-routes)
- [.md vs .mdx](#md-vs-mdx)
- [Ordering, group folders, drafts](#ordering-group-folders-drafts)
- [Content types and feeds](#content-types-and-feeds)
- [Frontmatter reference](#frontmatter-reference)
- [Folder meta (meta.ts)](#folder-meta-metats)
- [Generated sidebar and ordering precedence](#generated-sidebar-and-ordering-precedence)
- [Display modes](#display-modes)
- [Directory listings](#directory-listings)
- [Hidden pages](#hidden-pages)
- [Tabs](#tabs)
- [Selectors](#selectors)
- [Featured links, header actions, CTA, repo link](#featured-links-header-actions-cta-repo-link)
- [Explicit sidebar](#explicit-sidebar)
- [Breadcrumbs, pagination, TOC, page actions](#breadcrumbs-pagination-toc-page-actions)
- [Diagnostics](#diagnostics)
- [Gotchas](#gotchas)

## Files and routes

Content lives under `content.root` (`docs/` by default).

| File | Route |
| --- | --- |
| `docs/index.mdx` | `/` |
| `docs/quickstart.mdx` | `/quickstart` |
| `docs/guides/index.mdx` | `/guides` |
| `docs/guides/theming.mdx` | `/guides/theming` |

- `#`, `?`, `%`, `:` are dropped from routes (`100%.mdx` → `/100`). Keep `#` and `?` out of file names entirely: Astro cannot load such a file, so Blume errors and skips it.
- Frontmatter `slug: guides/setup` replaces the whole route from the content root, not only the last segment. `.` or `..` segments are errors.
- `exclude` defaults skip `_*` and `.*` files. Put partials in `_snippets/`.

## .md vs .mdx

- `.md`: GFM, frontmatter, smart punctuation, super/subscript.
- `.mdx`: all of that plus components, directives (`:::note`), package-install blocks, and math.

In `.mdx`, `{` starts an expression and `<` starts JSX. Write `{/* comment */}` instead of HTML comments, self-close void tags (`<br />`), and escape literal braces (`\{`) or put them in inline code. Parse errors report `BLUME_MDX_SYNTAX` (line and column) from `blume dev`, `validate`, `doctor`, and `check`; `blume build` stops. Undefined names at render (`{user.name}`) report `BLUME_MDX_UNDEFINED_NAME`. Use [variables](authoring.md) for shared values.

## Ordering, group folders, drafts

- Numeric prefix plus `-`, `_`, or `.` orders a file or folder and is stripped from the URL: `01-introduction.mdx` → `/introduction`.
- Versions and dates are names, not prefixes: `1.2.0.mdx` → `/1.2.0`; `2024-01-05-launch.mdx`, `12-05-2022.mdx`, and `2024-01.mdx` keep their full names. Old prefix-stripped URLs redirect.
- A frontmatter `slug` and pages from content sources keep their given names.
- `(group)` folders group pages in the sidebar without a URL segment: `docs/(internal)/security.mdx` → `/security`. `(01-internal)` and `01-(internal)` both sort first.
- `draft: true` renders in `blume dev` and is skipped by `blume build`.

## Content types and feeds

Every page has a `type` (default `doc`, or `content.defaultType`). `blog` and `changelog` pages feed RSS at `/<type>/rss.xml` (types from `seo.rss.types`), and `changelog` pages also build the `/changelog` timeline. Feeds need `deployment.site`. Give entries a `date`.

```yaml
---
title: v1.2.0
type: changelog
date: 2026-06-20
changelog:
  version: 1.2.0
  category: Features
---
```

## Frontmatter reference

All fields are optional. Unknown keys fail the build (`BLUME_FRONTMATTER_INVALID`, file and line) unless declared via `frontmatter.extend` or `content.types` (see [config.md](config.md)). Quote values that contain `: `.

| Field | Type / default | Purpose |
| --- | --- | --- |
| `title` | string | Page heading, sidebar label, `<title>`. |
| `description` | string | Intro under the heading, meta description. |
| `type` | string, `"doc"` | `blog`/`changelog` drive feeds; custom types for `content.types`. |
| `date` | string / YAML date | Feed sort and `pubDate`. |
| `authors` | string, string[], or objects (`name`, `avatar`, `url`, …) | Blog/changelog authors. |
| `slug` | string | Full route override. |
| `draft` | boolean, `false` | Skip in production builds. |
| `deprecated` | boolean, `false` | Deprecated pill on the sidebar row. |
| `hidden` | boolean, `false` | Shorthand for `sidebar.hidden`. |
| `noindex` | boolean, `false` | Shorthand for `seo.noindex`. |
| `narration` | boolean, `true` | `false` removes the "Listen to this page" player. |
| `related` | `(string \| { Title: link })[] \| false` | Up to ten "Related pages" cards. Paths are validated. |
| `pagination` | boolean, `true` | `false` drops prev/next links on this page. |
| `icon` | string | Lucide icon for the sidebar row when `sidebar.icon` is unset. |
| `lastModified` | date | Pins "last updated"; beats git. |
| `mode` | `default \| wide \| center \| custom \| frame` | Layout around the content. |
| `api` | string | Hand-written endpoint: `POST /v1/users`. See [api-references.md](api-references.md). |
| `authMethod` | `bearer \| basic \| key \| none` | Auth for an `api` page. |
| `playground` | `interactive \| simple \| none`, `interactive` | Try it panel and samples on an `api` page. |
| `sidebar` | object | `label`, `order`, `icon`, `badge`, `hidden`, `display`. |
| `seo` | object | `title`, `description`, `image`, `canonical`, `noindex`, `x.creator`. |
| `search` | object | `exclude`, `tags`, `keywords`, `boost` (>1 ranks higher). |
| `ai` | object | `exclude: true` removes the page from `llms.txt`, `llms-full.txt`, and the skill page map (still in search, MCP, JSON API, sitemap). |
| `changelog` | object | `version`, `date`, `category`. |

Layout modes:

| `mode` | Sidebar | Title + TOC | Page-end links + footer | Width |
| --- | --- | --- | --- | --- |
| `default` | yes | yes | yes | prose measure |
| `wide` | yes | title only | yes | full column |
| `center` | no | title only | yes | wider, centered |
| `frame` | yes | no | no | full column |
| `custom` | no | no | no | full page (header only) |

`custom` and `frame` render no title or description: write your own heading. Values match Mintlify's (no `assistant` mode).

`seo.noindex` emits robots noindex, removes the page from the sitemap, and skips structured data. A `canonical` pointing elsewhere also drops it from the sitemap.

## Folder meta (meta.ts)

`guides/meta.ts` configures the Guides group:

```ts
import { defineMeta } from "blume";

export default defineMeta({
  title: "Guides",
  icon: "book-open",
  order: 2,
  collapsed: false,
  display: "group",
  directory: "card",
  pages: ["configuration", "theming", "deployment"],
});
```

| Field | Type | Notes |
| --- | --- | --- |
| `title` | string | Default: humanized folder name (API, CLI, SDK capitalized). |
| `icon` | string | Group icon. |
| `order` | number | Position among siblings. |
| `collapsed` | boolean | `group` display mode only. |
| `display` | `flat \| group \| page` | Overrides the global mode for this group. |
| `directory` | `card \| accordion \| none` | Listing under the index page. Inherited by nested folders. |
| `pages` | string[] | Child order by slug (prefix and parentheses stripped). |

- `pages` positions win over a child's `sidebar.order`. Unlisted children still appear, sorted by their own order, after listed ones. List every child to fix the full order.
- An unknown slug in `pages` warns `BLUME_META_UNKNOWN_PAGE` with a suggestion.
- Loose pages always list above groups at the sidebar top, in tab sections, and beside `flat` subgroups; `pages` cannot interleave them there.
- Computed meta: `defineMeta(async () => ({ title: "Guides", pages: await orderFromCms() }))`.
- Only folders covered by content globs are read. A group folder outside `include` warns `BLUME_META_OUTSIDE_INCLUDE`; add a glob that reaches it.
- Generated API reference groups: add `meta.ts` in the folder the tag publishes under (`api/pets/meta.ts` for a reference at `/api`). Set fields override generated values.
- i18n: `fr/guides/meta.ts` orders the French group. `meta.$.ts` applies to every locale; a locale `meta.ts` overrides it.

## Generated sidebar and ordering precedence

Folders become groups, files become pages. A folder with an `index` page links its group row to it.

Order, highest priority first:

1. Explicit `navigation.sidebar` (replaces the tree).
2. `pages` in `meta.ts`.
3. `sidebar.order` in frontmatter.
4. File system: `index` first, numeric prefixes, then alphabetical by label.

Ties warn `BLUME_DUPLICATE_SIDEBAR_ORDER`.

## Display modes

```ts
navigation: { sidebar: { display: "flat" } }, // "flat" | "group" | "page"
```

- `flat` (default): non-collapsible headers. Ungrouped pages list first.
- `group`: collapsible `<details>`. Collapsed by default, except the group with the current page or a lone top-level group.
- `page`: drill-in sub-panels with a back arrow. Good for deep sections.

In `group` and `page` modes, closed sections are fetched on first open from prerendered fragments under `/blume-nav/` (no server needed).

Per-group mode resolves: index-page `sidebar.display` → folder `meta.ts` `display` → `navigation.sidebar.display` → `flat`. `sidebar.display` anywhere else (non-index page, root index, explicit sidebar) warns `BLUME_SIDEBAR_DISPLAY_IGNORED`.

## Directory listings

`directory: "card"` (cards with icon and description) or `"accordion"` lists the group's pages below its own page (folder `index` or explicit group `root`). Set it on the root `meta.ts` to apply everywhere; override per folder.

## Hidden pages

`sidebar.hidden: true` (or `hidden: true`) removes a page from the sidebar, prev/next, sitemap, `llms.txt`, and search (unless `search.indexing.includeHiddenPages`). It stays reachable by URL.

Exception: hiding a folder `index` page, or the root `index`, removes only its row. The group row still links it, and it stays in sitemap, search, and `llms.txt`.

## Tabs

```ts
navigation: {
  tabs: [
    { label: "Guides", path: "/guides", href: "/guides/getting-started", icon: "book-open" },
    { label: "API", path: "/reference" },
    {
      label: "SDKs",
      path: "/sdks",
      items: [
        { label: "JavaScript", path: "/sdks/javascript", description: "Node and the browser" },
        { label: "Python", path: "/sdks/python", tag: "Beta" },
      ],
    },
  ],
},
```

- `path` is the section prefix and the default link. A folder with no `index` links to its first page. A custom page or the changelog index at `path` counts as the section page.
- `href` overrides the link target. `items` makes a dropdown (then `href` does not apply).
- Tabs scope the sidebar to their folder. Routes under no tab show only pages outside every tab folder.
- API references mount at their route but add no tab. Point a tab at the route to surface it and scope its operations sidebar.
- On i18n sites, tab and item `label` can be a locale map. Selector labels cannot.
- `icon`: built-in icon name, image path/URL, or inline SVG.

## Selectors

```ts
navigation: {
  selectors: [
    {
      kind: "version", // "dropdown" | "product" | "version" | "language" (a hint only)
      label: "Version",
      items: [{ label: "v2 (latest)", path: "/v2", icon: "rocket" }, { label: "v1", path: "/v1" }],
    },
  ],
},
```

With `versions` configured, Blume adds a version selector automatically. A custom `kind: "version"` selector replaces it. On narrow screens, selectors move into the mobile drawer.

## Featured links, header actions, CTA, repo link

```ts
navigation: {
  featured: [{ label: "Blog", href: "https://example.com/blog", icon: "newspaper" }],
  actions: [{ href: "/changelog", label: "Changelog" }],
  cta: { href: "https://example.com/signup", label: "Start free" },
  repo: true, // false hides the footer GitHub mark; an absolute URL repoints it
},
```

- `featured` pins links above every section on every route, not scoped by tab.
- Internal hrefs in `featured`, `actions`, and `cta` are validated at build and by `blume doctor`. Write pages served by another app on the same host as absolute URLs.
- `cta` is one filled button by design. `actions` hide below `sm`.

## Explicit sidebar

```ts
navigation: {
  sidebar: [
    "/",
    { label: "Guides", collapsed: false, root: "/guides", directory: "card", items: ["/configuration", "/configuration/theming"] },
    { label: "GitHub", href: "https://github.com/owner/repo" },
  ],
},
```

A bare array is shorthand for `sidebar.items`; the object form adds `display`. Items are routes, groups (`label` + `items`, optional `display`, `collapsed`, `root`, `directory`), or links (`label` + `href`). Unknown routes, unknown `root`s, and empty items warn and are dropped. This turns off file-system generation completely, so new pages do not appear until listed.

## Breadcrumbs, pagination, TOC, page actions

- Breadcrumbs and prev/next come from the sidebar tree. `pagination: false` per page.
- TOC lists H2–H3; change with `toc` in config.
- Page actions: Edit on GitHub (needs `github`), Scroll to top, Copy as Markdown, Open in chat, Export (with `export` on). Feedback rating sits at the page foot.

## Diagnostics

| Code | Cause | Fix |
| --- | --- | --- |
| `BLUME_MDX_SYNTAX` | MDX does not parse | Fix at the reported line; escape `{`, use `{/* */}`, self-close tags |
| `BLUME_MDX_UNDEFINED_NAME` | Expression names something undefined | Define a variable or escape the brace |
| `BLUME_FRONTMATTER_INVALID` | Bad YAML or unknown key | Quote values with `: `; declare custom keys |
| `BLUME_META_UNKNOWN_PAGE` | `meta.ts` `pages` names no child | Use the suggested slug |
| `BLUME_META_OUTSIDE_INCLUDE` | Group folder `meta.ts` outside `include` | Add an include glob |
| `BLUME_DUPLICATE_SIDEBAR_ORDER` | Two siblings share an order | Make orders unique |
| `BLUME_SIDEBAR_DISPLAY_IGNORED` | `sidebar.display` where no group applies | Move to the folder's index page or `meta.ts` |
| `BLUME_NAV_INDEX_TITLE_MISMATCH` | Hidden index page title differs from `meta.title` | Match titles, set `sidebar.label`, or unhide the row |

Warnings fail `blume validate --strict`.

## Gotchas

- `pages` in `meta.ts` uses slugs without numeric prefixes or parentheses.
- An explicit `navigation.sidebar` freezes the nav. Prefer `meta.ts` unless the user wants full manual control.
- Tabs need content structured as one folder per tab path.
- Hidden pages disappear from search, sitemap, and `llms.txt` too, except index and root pages.
- `meta.title` and the index page `title` are separate. Keep them in sync, especially across locales.
- Built-in components need no imports in `.mdx`. Adding imports for them is unnecessary.
