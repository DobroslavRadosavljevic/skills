# Blume discoverability: `seo` and `agents` config

Scope: everything under the `seo` and `agents` keys of `blume.config.ts` (blume 2.2.2), plus per-page `seo` / `ai` frontmatter and the URLs the build emits for search engines, social platforms, and AI agents.

## Contents

1. [Overview and defaults](#overview-and-defaults)
2. [Endpoint matrix](#endpoint-matrix)
3. [Metadata and per-page overrides](#metadata-and-per-page-overrides)
4. [Open Graph images](#open-graph-images)
5. [Structured data (JSON-LD)](#structured-data-json-ld)
6. [RSS feeds](#rss-feeds)
7. [Sitemap, robots, Content-Signal](#sitemap-robots-content-signal)
8. [llms.txt and llms-full.txt](#llmstxt-and-llms-fulltxt)
9. [Markdown for agents](#markdown-for-agents)
10. [JSON docs API and /openapi.json](#json-docs-api-and-openapijson)
11. [MCP server](#mcp-server)
12. [Agent discovery](#agent-discovery)
13. [Skills (site skill, published skills, Blume's own)](#skills)
14. [Config cheat sheet](#config-cheat-sheet)
15. [Gotchas](#gotchas)

## Overview and defaults

Almost everything is on by default. Two config keys:

- `seo`: what search engines and social platforms see.
- `agents`: what agents see.

```ts
// blume.config.ts
seo: {
  og: { enabled: true },
  rss: { enabled: true, types: ["blog", "changelog"] },
  sitemap: true,
  robots: true,
  structuredData: true,
  x: { handle: "@acme" },
},
agents: {
  llmsTxt: true,
  mcp: { enabled: false },
},
```

- Set `deployment.site` (absolute site URL). Feeds, OG images, canonicals, sitemap, JSON-LD, and every agent manifest need it for absolute URLs. OG images, sitemap, RSS, and the AI catalog stay off until it is set.
- RSS also accepts a site URL auto-detected from a host Blume detects (Vercel, Netlify, Cloudflare). OG images are on once `deployment.site` is "set or auto-detected".
- Any generated file yields to a file you ship in `public/`: `robots.txt`, `sitemap.xml`, `llms.txt`, `llms-full.txt`, `openapi.json`, `agent-readability.json`, `skill.md`, and files under `public/.well-known/` (`api-catalog`, `ai-catalog.json`, `ard.json`, `agent-skills/index.json`). Blume never overwrites a file in `public/`.
- Audit: `bunx blume audit` crawls the built site (titles, descriptions, canonicals, OG/X cards, hreflang, sitemap, `robots.txt`, structured data). Add `--url <origin>` to also check response headers, configured redirects, and DNS-based agent discovery.
- The in-page assistant is not part of this layer. It is configured under `ai` (see the assistant config docs).

## Endpoint matrix

| URL | Config flag | Default | Needs `deployment.site` | Needs server output |
| --- | --- | --- | --- | --- |
| `<head>` metadata, canonical, X cards | `seo.*` | on | canonical/`og:url` only | no |
| `/og/<slug>.png` (`/og/index.png` for `/`) | `seo.og.enabled` | on with a site URL | yes | no (prerendered static even in server mode) |
| JSON-LD in every page `<head>` | `seo.structuredData` | on | WebSite node + absolute URLs; `organization`/`software` blocks need it | no |
| `/<type>/rss.xml` | `seo.rss.enabled`, `seo.rss.types` | on | yes (no feeds without it; dev uses local URL) | no |
| `/sitemap.xml` | `seo.sitemap` | on | yes | no |
| `/robots.txt` | `seo.robots` | on | `Sitemap:` line only when sitemap available | no |
| `Content-Signal` line in `robots.txt` | `agents.contentSignals` | on, all `yes` | no | no |
| `/llms.txt`, `/llms-full.txt` | `agents.llmsTxt` | on | recommended (absolute links) | no |
| `/<route>.md`, `/<route>.mdx`, `/index.md`, `/404.md` | none documented | on | no | no |
| `Accept: text/markdown` negotiation | none documented | dev + Vercel/Cloudflare server builds | no | yes for Vercel/Cloudflare wiring |
| `/api/docs/pages.json`, `/api/docs/pages/{route}.json`, `/api/docs/navigation.json` | `agents.api` | on | no | no (prerendered) |
| `/api/docs/search?q=` | `agents.api` | on | no | yes (server output only) |
| `/openapi.json` | `agents.api` | on | no | no |
| `/mcp` (Streamable HTTP; configurable `route`) | `agents.mcp.enabled` | off | "Connect to MCP" menu needs it | yes (static build fails fast) |
| `/.well-known/mcp.json`, `/.well-known/mcp/server-card.json` | `agents.mcp.enabled` | off | no | yes |
| `/agent-readability.json` | `agents.agentReadability` | on | absolute URLs when set, root-relative otherwise | no |
| `Link` response header on homepage | none documented | on | no | no (static: `_headers`; Vercel: routing rules) |
| `<link>` discovery tags in every page head | none documented | on | no | no |
| `/.well-known/api-catalog` | none (derived) | on if anything to list | no | no |
| `/.well-known/ai-catalog.json`, `/.well-known/ard.json` | `agents.catalog` | on | yes (nothing emitted without it) | no |
| WebMCP tools registered in each page | `agents.webmcp` | on | no | no |
| `/skill.md` (generated site skill) | `agents.skillMd` | on | yes (build skips it without) | no |
| `/.well-known/agent-skills/index.json`, per-skill `SKILL.md` or `.tar.gz` | `agents.skills` | off (opt-in) | not stated | no |
| `/.well-known/http-message-signatures-directory` | `agents.webBotAuth.keys` | off (opt-in) | not stated | no |

## Metadata and per-page overrides

Every page renders these tags with no config:

| Tag | Source |
| --- | --- |
| `<title>` | page title + site `title` |
| `<meta name="description">`, `og:description` | page `description`, else site `description` |
| `og:title`, `og:site_name` | page title, site `title` |
| `<link rel="canonical">`, `og:url` | absolute page URL (needs `deployment.site`) |
| `og:type` | `article` for blog and changelog; `website` elsewhere |
| `article:published_time`, `article:modified_time` | page `date`, last-modified timestamp (article pages) |
| `og:image` | the OG image (see below) |
| `twitter:card`, `twitter:title`, `twitter:description`, `twitter:image` | `summary_large_image` when an image exists; `summary` otherwise |

A generated card also emits `og:image:width`, `og:image:height`, `og:image:type`, `og:image:alt`. A custom `seo.image` emits none of these.

### X attribution

```ts
seo: { x: { handle: "@acme", creator: "@jane" } }  // @ optional
```

`handle` becomes `twitter:site`; `creator` becomes `twitter:creator`.

### Custom tags: `seo.metatags`

```ts
seo: {
  metatags: {
    "google-site-verification": "abc123",
    "msvalidate.01": "def456",
    "theme-color": "#0b5fff",
    "apple-itunes-app": "app-id=123456789",
  },
}
```

- Key = tag name, value = content. Applies to every page, custom pages and API references included.
- Open Graph families (`og:`, `fb:`, `article:`, and similar) render with `property`; everything else with `name`.
- Tags Blume writes itself cannot be set here. The build names the setting that controls each (`og:image` -> `seo.og` or page `seo.image`; `robots` -> page `seo.noindex`).

### Per-page frontmatter

```yaml
---
title: Pricing
description: Plans and pricing for every team size.
seo:
  title: Plans and pricing
  canonical: https://acme.com/pricing
  noindex: false
---
```

| Key | Type | Effect |
| --- | --- | --- |
| `seo.title` | string | Replaces page title in `<title>`, `og:title`, `twitter:title`. Site title is still appended ("Plans and pricing - Acme Docs"). |
| `seo.description` | string | Overrides meta + `og:description`. Also wins for OG subtitle and `llms.txt` summary. |
| `seo.image` | string | Custom social image: file in `public/` or external URL. |
| `seo.canonical` | string | Overrides canonical URL. |
| `seo.noindex` | boolean | Emits robots `noindex`; skips structured data; drops page from sitemap and `llms` files. |
| `seo.x.creator` | string | Page-level `twitter:creator` (guest posts). |

## Open Graph images

1200x630 PNG per page, rendered at build time by Takumi (no headless browser). On once `deployment.site` is set or auto-detected; off otherwise.

```ts
seo: { og: { enabled: true } }   // false opts out even with a site set
```

- URL: `/og/<slug>.png` mirrors the route (`/` -> `/og/index.png`, `/quickstart` -> `/og/quickstart.png`, `/guides/deploy` -> `/og/guides/deploy.png`). Prerendered as static files even in server mode.
- Default card: page title = headline; page description (same text as `og:description`, so `seo.description` wins) = subtitle; theme accent = mark; site title initial shown when no logo.
- `seo.image` (frontmatter) overrides the card per page and works even when `og` is off.
- Custom `.astro` pages: pass the `ogImage` prop to `PageLayout` (this is how to give the home page its own share image). `seo.image` only covers Markdown/MDX.

### Branding

```ts
seo: {
  og: {
    logo: "/logo/og.svg",          // local SVG in public/ or project root
    palette: {
      accent: "#ff5410",
      background: "#1d1d1d",
      foreground: "#fff6f2",
      muted: "#a6a19f",
      border: "#323232",
    },
  },
}
```

- Omit any palette value to keep its default.
- Palette values accept any CSS color (hex, `oklch(...)`, `rgb(...)`). `accent` also accepts a named preset (`blue`, `teal`, ...), matching `theme.accent`.
- A color the renderer cannot parse fails the build. A value that is not a CSS color also warns `BLUME_THEME_COLOR_INVALID` with the line that sets it.

### Card layers

Layers: brand mark (top-left), subtitle, footer (repo slug from `github` + site URL host plus `deployment.base`). Override with a string, hide with `false`:

```ts
seo: {
  og: {
    site: "docs.acme.com",   // footer URL text, or false to hide
    description: false,      // hide subtitle on every card; a string replaces the site fallback
    logo: false,             // no brand mark, not even the initial tile
  },
}
```

### Fonts

- Default: Takumi's built-in font (basic Latin) plus a per-script Google Noto fallback stack (`Noto Sans` for Cyrillic/Greek/Vietnamese/accented Latin, then `Noto Sans JP`, `Noto Sans Arabic`, `Noto Sans Devanagari`, ...). Fallback is per glyph. Google is fetched only when the text has a glyph the built-in font cannot draw, so Latin-only sites build offline.
- Locales move their family to the front (`zh` -> Simplified forms; `zh-Hant`/`zh-TW` -> Traditional). Default Han forms are Japanese.
- If `theme.fonts` is set, cards use the display font for the headline and the body font for description/footer. Non-Google providers are skipped; local font files work.
- `og.fonts` overrides theme-derived fonts and replaces the script fallbacks. List every family the cards need:

```ts
seo: {
  og: {
    fonts: [
      "Noto Sans JP",
      { name: "Inter", weight: [400, 700] },
      { name: "Berkeley Mono", src: "./fonts/BerkeleyMono-Regular.woff2" },
    ],
  },
}
```

Entry forms: Google family name; object with `weight` (number, list, or range like `"100..900"`) and `style` (`"normal"`, `"italic"`, or both); local file via `src` (resolved from project root) with optional `weight`/`style`.

- `og.fonts: []` opts out entirely: built-in font only, even when `theme.fonts` is set or a title needs a script fallback.
- Google fonts and emoji (Twemoji glyphs fetched from a CDN, once per build) need network access at build time.

### Custom page titles

Custom `.astro` pages have no frontmatter. Title = humanized last URL segment (`/getting-started` -> "Getting Started", `/cli` -> "Cli"). Name them with `og.titles` (route keys; `"/"` is the home, otherwise the site title):

```ts
seo: { og: { titles: { "/cli": "CLI" } } }
```

`og.titles` applies only to custom pages. Retitle content pages in frontmatter.

### Card cache

Cached in `node_modules/.cache/blume/og`, keyed by title, description, brand text, logo, palette, footer text, fonts (local font file by contents), and Blume version. Only changed cards re-render. Unused cards are removed after each build. Vercel and Netlify keep `node_modules` between builds; Cloudflare does not.

## Structured data (JSON-LD)

```ts
seo: { structuredData: true }   // default
```

Per page:

- WebSite node (site identity).
- Page node: `WebPage` on homepage (also each locale home and the `basePath` root); `BlogPosting` for blog posts; `TechArticle` for changelog and docs.
- `BreadcrumbList` on articles (from the nav trail).

Rules:

- URLs are absolute with `deployment.site`; route-relative without. Without a site, the WebSite node is omitted.
- `seo.noindex` pages are skipped.
- With `lastModified` on, `dateModified` is emitted and the visible "Last updated" is marked up as `<time datetime>`.

### Site identity blocks (both need `deployment.site`)

```ts
seo: {
  organization: {
    name: "Acme",                       // defaults to site title
    email: "hello@acme.com",
    telephone: "+1 555 0100",
    address: { addressLocality: "Sydney", addressCountry: "AU" },
    logo: "/logo.svg",                  // root-relative is absolutized
    sameAs: ["https://github.com/acme", "https://x.com/acme"],
  },
  software: {
    license: "MIT",
    operatingSystem: "Node.js 22+",
    price: 0,                           // emitted as an Offer; 0 = free
    sameAs: ["https://www.npmjs.com/package/acme"],
  },
}
```

- `organization`: adds an Organization node to every page (WebSite and page nodes cite it as `publisher`). Email/telephone become a `ContactPoint` (`contactType` defaults to `"customer support"`); address becomes a `PostalAddress`. `name` and `url` default to the site's.
- `software`: adds a SoftwareApplication node to the homepage. Name/description default to the site's; `applicationCategory` defaults to `"DeveloperApplication"`; `Offer` only when `price` is set. `software: true` takes all defaults.

### Custom `.astro` pages

`PageLayout` emits the same graph. Pass `lastModified` for a `dateModified`. Pass `structuredDataEnabled={config.structuredData}` to follow the config, or `structuredDataEnabled={false}` to disable on that page.

## RSS feeds

One feed per content type in `seo.rss.types` that has pages, at `/<type>/rss.xml`. Dated blog and changelog entries feed it.

```ts
seo: { rss: { enabled: true, types: ["blog", "changelog"], limit: 50 } }
```

| Option | Default | Meaning |
| --- | --- | --- |
| `enabled` | `true` | Generate feeds. |
| `types` | `["blog", "changelog"]` | Content types that each get a feed. |
| `limit` | `50` | Max items per feed, newest first. |

- Needs an absolute site URL (`deployment.site` or host auto-detect on Vercel/Netlify/Cloudflare). Without one, a build emits no feeds. `blume dev` uses the local server URL.
- `<link rel="alternate">` tags are injected automatically and feeds are listed in `agent-readability.json`.

## Sitemap, robots, Content-Signal

### Sitemap

```ts
seo: { sitemap: true }   // default; needs absolute deployment.site
```

Lists every indexable page. Excludes: drafts, hidden pages, `noindex` pages, pages whose `seo.canonical` names another URL, and (versioned sites) archived pages whose canonical points at the live equivalent. Ship `public/sitemap.xml` to take over.

### Robots

```ts
seo: { robots: true }   // default
```

```txt
User-agent: *
Content-Signal: search=yes, ai-input=yes, ai-train=yes
Allow: /

Sitemap: https://docs.example.com/sitemap.xml
```

Allows all crawlers, declares content signals, adds `Sitemap:` when a sitemap exists. Ship `public/robots.txt` to take over.

### Content signals (`agents.contentSignals`)

On by default, all `yes`. `boolean | object`.

| Setting | Meaning |
| --- | --- |
| omitted / `true` | all signals `yes` |
| `false` | drop the `Content-Signal` line |
| `{ search?, aiInput?, aiTrain? }` | per-signal booleans; unset ones stay `yes` |

| Key | Header token | Meaning |
| --- | --- | --- |
| `search` | `search` | search indexing |
| `aiInput` | `ai-input` | grounding / RAG at answer time |
| `aiTrain` | `ai-train` | model training |

```ts
agents: { contentSignals: { aiTrain: false } }   // -> ai-train=no
agents: { contentSignals: false }                // no line
```

Signals are a preference, not access control. The same policy is mirrored as `contentUsage` in `agent-readability.json`.

## llms.txt and llms-full.txt

On by default. `agents.llmsTxt: false` disables both.

- `/llms.txt`: site title + description, then a linked list of every page with its summary (`seo.description` if set, else `description`), grouped into sections mirroring the sidebar (folders/groups become headings).
- `/llms-full.txt`: every page's full Markdown body with its source URL.
- Excluded: drafts, pages hidden from sidebar (`sidebar.hidden` or top-level `hidden`), `noindex` pages. Exception: generated API reference pages follow `openapi` below, not `noindex`.
- Set `deployment.site` for absolute links.

### Object form

```ts
agents: {
  llmsTxt: {
    enabled: true,      // default
    openapi: false,     // exclude generated API reference pages from both files
    details:
      "Reach for Acme when a project needs hosted feature flags. Install the CLI with `bun add -g acme`.",
  },
}
```

- `details`: Markdown placed right after title and summary, before page sections (llmstxt.org free-form block). Say when to use the product and how to install/call it. No headings (reserved for the link sections); use paragraphs or lists.
- Set `openapi: false` when the API reference documents a placeholder or example spec.

### Generated closing sections (no config)

- **Agent skills**: the site's own skill and each skill from `agents.skills`, with descriptions.
- **Agent resources**: links to `llms-full.txt`, per-page Markdown mirror, MCP server and discovery document, skills index, API catalog, AI catalog, `agent-readability.json`, sitemap, each only if it exists.

### Excluding a page

```yaml
---
title: Internal notes
ai:
  exclude: true
---
```

Page still renders, stays in search and sitemap. Only the `llms` files and the page map of the site skill skip it.

### Bring your own

Put `llms.txt` and/or `llms-full.txt` in `public/`. Overriding one still generates the other.

## Markdown for agents

Served for every page, dev and production, no config.

| URL | Returns |
| --- | --- |
| `/quickstart` | rendered page |
| `/quickstart.md` | plain Markdown, components converted |
| `/quickstart.mdx` | MDX source, components as written |

Nested routes work (`/content/syntax.md`). Home is `/index.md`.

### `.md` downleveling

| Component | Becomes |
| --- | --- |
| `<TypeTable>` | Markdown table |
| `<Callout>` | labeled blockquote |
| `<Steps>` | ordered list |
| `<Tabs>` | bold-labeled sections |
| `<Card>` / `<CardGroup>` | title as link over body / the cards it holds |
| `<Accordion>` | bold questions over answers |
| `<FileTree>` | its list |
| `<CodeGroup>` | titled code blocks |
| `<YouTube>` | a link |
| Columns, Frame, Expandable, Badge, Tooltip, and other built-ins | readable content |
| `<Operation>` | endpoint in spec notation (`GET /pets/{id}`, `SEND user/signup`, `query pets`) + deprecation marker; for OpenAPI also request body properties/example and responses |
| `<ApiTagOperations>` | linked list of endpoints with summaries |
| `<ApiOverview>` | API version and base URLs |
| `<Changelog />` | release list (year headings, linked row per release) |

Left as written: `<AutoTypeTable>`, a `<Diff>` reading sides from files (`src`, or `before`/`after`), a `<GithubInfo>` without `owner`/`repo`, custom components, props computed by a function call or from an import, and anything inside code (fenced or inline).

Rules for props: read as literal data (strings, numbers, booleans, arrays, objects, template strings) plus references to the page's `frontmatter` (`title={frontmatter.status}` resolves). Never executed. Expressions in page text (`Owned by {frontmatter.owner}`) stay as written; use a content variable for values agents must read (variables are replaced on every surface).

The same conversion feeds `llms-full.txt` and MCP `get_page`.

### `.mdx` variant

Components stay as written. Also: includes are spliced in; `<Visibility>` resolves for agents (`for="web"` removed, `for="agents"` kept); relative images and links to files beside the page point to served URLs; relative page links and root-relative links to a content file (`/guides/setup.md`) point at the routes they mean; root-relative links (`/guides/install`) gain `deployment.base` and `basePath` and move into the page's locale on translated pages; root-relative images and links to `public/` files (`/spec.pdf`) gain `deployment.base` only.

### Content negotiation

Request a page URL with `Accept: text/markdown` and get the Markdown at the same address, with `Vary: Accept`.

- Dev server: works out of the box.
- Vercel or Cloudflare server build: wired automatically (routing rules on Vercel, a generated Worker on Cloudflare).
- Other static targets: no request-time hook; agents fetch the `.md` URL. `agent-readability.json` advertises `contentNegotiation` only where honored.
- Homepage always negotiates, even a custom landing page; its Markdown falls back to the `llms.txt` index.
- Responses carry `x-markdown-tokens` (estimated tokens, ~4 chars/token) on dev server, server-rendered responses, and the negotiated homepage on Vercel/Cloudflare.
- Match rule: `text/markdown` or `text/x-markdown` (any case) with q > 0 and q >= `text/html`'s q. `text/markdown, text/html` -> Markdown; `text/html, text/markdown;q=0.9` -> HTML. Vercel cannot compare two q-values below 1 (`text/markdown;q=0.9, text/html;q=0.8` -> HTML on Vercel, Markdown on dev and Cloudflare). Send `text/markdown` without a q-value to get Markdown everywhere.
- 404: default 404 page has a Markdown twin `/404.md` (not-found message + links to top-level sections, sitemap, `llms.txt`). On Vercel/Cloudflare server builds, a Markdown-preferring request to a nonexistent URL gets that body with a real `404` status; on Vercel the same applies to any `.md` URL with no page. A custom 404 (`pages/404.astro` or content page at `/404`) replaces the default and its `/404.md` twin.

### Custom serializers: `agents.markdownComponents`

Map of JSX name -> serializer `({ props, children, frontmatter }) => string | null` (typed `ComponentMarkdown`). `props` are literal data with `frontmatter` references resolved; `children` are already Markdown; return `null` to leave the JSX as-is. A same-name entry replaces a built-in (restyle `<Callout>`, or return `null` to opt out).

```ts
import { defineConfig } from "blume";
import type { ComponentMarkdown } from "blume";

const chart: ComponentMarkdown = ({ props }) =>
  `![${props.title}](/charts/${props.slug}.png)`;

export default defineConfig({
  agents: { markdownComponents: { Chart: chart } },
});
```

- Helpers for container components: `childComponents("Name")` (direct children by tag, like built-in `<Steps>` collecting `<Step>`) and `childBlocks()` (every direct child in order, each downleveled to a Markdown block).
- Put serializers in `blume.config.ts`, not `components.tsx` (config is executed at build; components file is only statically analyzed). Keep the components themselves registered in `components.tsx`.

### Copy as Markdown

Page action under the table of contents on every page. Copies the same source as the `.md` URL. Falls back to the legacy copy command if the Clipboard API is unavailable; shows **Copy failed** (`actions.copyFailed`) if nothing lands on the clipboard. No config.

### Open in chat

Opens the page in an AI assistant (v0, ChatGPT, Claude, T3 Chat, Scira, Cursor) with a prompt pointing at the page's `.md` URL. Works once deployed.

```ts
ai: { openInChat: ["claude", "chatgpt", "cursor"] }   // false hides; array = providers in order
```

Provider keys: `"v0"`, `"chatgpt"`, `"claude"`, `"t3"`, `"scira"`, `"cursor"`. The prompt is the UI dictionary entry `actions.openInChatPrompt`; override via `i18n.ui`, keeping the `{url}` placeholder. For an inline copyable prompt in content, use the Prompt component.

## JSON docs API and /openapi.json

Read-only REST twin of the MCP tools, over the same page snapshot. On by default.

| Endpoint | Returns |
| --- | --- |
| `/api/docs/pages.json` | Every page: route, title, description, content type, locale, facets, URLs of rendered/Markdown/JSON forms. i18n fallback copies of untranslated pages omitted. On server output a missing page's JSON answers `404` with `PAGE_NOT_FOUND`. |
| `/api/docs/pages/{route}.json` | One page: index entry + agent Markdown (same body as `get_page`). `{route}` has no leading slash; `index` for home. |
| `/api/docs/navigation.json` | Navigation tree (header tabs + sidebar hierarchy). |
| `/api/docs/search?q=` | Full-text search; same `limit`, `contentTypes`, `locale`, `version`, `filters[key]` scoping as `search_docs`. Server output only. |
| `/openapi.json` | OpenAPI 3.1 description of the whole machine-readable surface. |

- Hidden pages are absent from the index and get no per-page document (but `get_page` and the `.md` mirror still serve them; hidden is not private). Pages with `seo.noindex`, `ai.exclude`, or `search.exclude` are listed normally.
- A page document's `markdown` keeps its frontmatter block at the top.
- Page index, per-page documents, navigation are prerendered (static hosts serve them). Search is a live endpoint and exists only under server output.

### Errors

RFC 9457 `application/problem+json` with stable `code`, `detail`, `resolution`, plus `instance`, `links`, `status`, `title`, `type: "about:blank"`. Triggers: missing page, blank search query, or (server output) any `/api/...` URL no endpoint answers (`API_ROUTE_NOT_FOUND`).

```json
{
  "code": "API_ROUTE_NOT_FOUND",
  "detail": "No API route exists at /api/nope.",
  "instance": "/api/nope",
  "links": [
    { "href": "https://docs.example.com/openapi.json", "label": "OpenAPI description" },
    { "href": "https://docs.example.com/api/docs/pages.json", "label": "Page index" }
  ],
  "resolution": "Discover the available operations through the OpenAPI description at https://docs.example.com/openapi.json, or list every page at https://docs.example.com/api/docs/pages.json.",
  "status": 404,
  "title": "API route not found",
  "type": "about:blank"
}
```

### `/openapi.json`

- Generated per build from config; describes only what the deployed site serves: JSON endpoints (unique `operationId`, typed params, response schemas), text surfaces (`.md` mirrors, `llms.txt`, `llms-full.txt`, `agent-readability.json`), and the MCP endpoint when enabled.
- Linked from the API catalog, readability manifest, homepage `Link` header (`rel="service-desc"`), and `llms.txt`.
- Your own documented API reference is rendered into pages, never served at `/openapi.json`; the catalog lists both.
- A `public/openapi.json` you ship takes over that route (JSON endpoints stay) and warns `BLUME_PUBLIC_OPENAPI_JSON`, because the catalog still lists `/openapi.json` as the docs API's description. Put your own spec elsewhere (e.g. `public/specs/openapi.json`).
- The `/api/...` catch-all steps aside when a docs section is served from `/api` (`content/api/overview.md`) or a custom page owns a rest route under `/api/`.

### Turn off

```ts
agents: { api: false }
```

## MCP server

Hosts a Model Context Protocol server (Streamable HTTP) so agents (Claude Code, Cursor, VS Code, claude.ai connectors) search and read docs. Opt-in.

```ts
agents: { mcp: { enabled: true, route: "/mcp" } }
```

| Option | Default | Meaning |
| --- | --- | --- |
| `enabled` | `false` | Generate and host the server. |
| `route` | `/mcp` | Path of the endpoint. |
| `name` | site title | Server name shown to clients. |
| `instructions` | none | System hint passed to connecting agents. |
| `clients` | `true` | Clients the **Connect to MCP** menu installs into. |

If a content or custom page already owns the route, the server is not generated: the build warns, and `llms.txt` and the other discovery documents leave it out.

### Server output is required

The MCP endpoint is live, so a static build cannot host it. A static build with `agents.mcp.enabled` fails fast with a message to set a host adapter. Use an adapter from `blume/deploy` (`node`, `vercel`, `netlify`, `cloudflare`):

```ts
import { defineConfig } from "blume";
import { node } from "blume/deploy"; // or vercel, netlify, cloudflare

export default defineConfig({
  deployment: node({ site: "https://docs.example.com" }),
  agents: { mcp: { enabled: true } },
});
```

Connect from Claude Code:

```bash
claude mcp add --transport http my-docs https://docs.example.com/mcp
```

### Tools and resources

- Tools (read-only): `search_docs`, `get_page`, `list_pages`, `get_navigation`.
- Resources: every page. `resources/list` returns pages at served URLs with `text/markdown` type (i18n fallback copies omitted, as in `list_pages`). `resources/read` returns the page's agent Markdown (same as `get_page`).
- Discovery documents: `/.well-known/mcp.json` and `/.well-known/mcp/server-card.json`. The server card follows the SEP-2127 Server Card extension schema (reverse-DNS `name`, `remotes` transport endpoints) with initialize-shaped compat fields (`serverInfo`, `capabilities`, `transports`).
- `search_docs` runs its own full-text index. Works regardless of the `search` provider, even with `search: false`.
- Hidden pages are out of `list_pages` and `resources/list`, and out of `search_docs` unless `search.indexing.includeHiddenPages` is on. `get_page` and `resources/read` still return a hidden page by route.
- Request body limit is 64 KB (`413` above). Unknown tool or non-object `arguments` -> JSON-RPC Invalid params `-32602`.

### Filters

`search_docs` and `list_pages` accept:

- `contentTypes`: array of frontmatter `type`s (`["rfc"]`, `["blog", "changelog"]`).
- `filters`: object matched against facets declared in `content.types.<type>.facets` (custom frontmatter keys).

```json
{
  "query": "OpenAPI request schemas",
  "contentTypes": ["rfc"],
  "filters": { "domain": "architecture", "status": "enforced" }
}
```

- Every `filters` entry must match.
- Matching is exact and case-sensitive against the string shown by `list_pages` (`"enforced"` does not match `Enforced`).
- Facet values are strings: numbers/booleans match their string form (`{"priority": 1}` finds `priority: 1`). Values of other shapes (lists) are ignored, not filtered on.

### Connect to MCP menu (`agents.mcp.clients`)

The page action copies the server URL, then lists install options. Shown once `deployment.site` is set.

| `clients` value | Result |
| --- | --- |
| `true` (default) | all built-in clients |
| `false` | only **Copy server URL** |
| list | named clients in order, rule between commands and links |

| Key | Menu row |
| --- | --- |
| `claude-code` | copies `claude mcp add` command |
| `codex` | copies `codex mcp add` command |
| `cursor` | opens Cursor's MCP install link |
| `vscode` | opens VS Code's MCP install link |

Custom client: `{ label, command, icon? }`.

- `{name}` in `command` = server name as an id (`name` or site title, lowercased, each run of chars other than `a-z`/`0-9` turned into a hyphen, ends trimmed; `docs` if empty). `{url}` = server URL.
- `label` may be a locale-code map on multilingual sites.
- `icon` = built-in icon name, image path/URL, or inline SVG; default `terminal`.

```ts
agents: {
  mcp: {
    enabled: true,
    clients: [
      "claude-code",
      "codex",
      { label: "Copy Copilot CLI command", command: "copilot mcp add --transport http {name} {url}" },
      "cursor",
      "vscode",
    ],
  },
}
```

## Agent discovery

All on by default and derived from what is enabled.

### agent-readability.json

```ts
agents: { agentReadability: true }   // false to skip
```

Manifest at `/agent-readability.json` listing only what is enabled: Markdown mirror pattern, JSON API + OpenAPI, `llms.txt`/`llms-full.txt`, MCP server + discovery document, assistant endpoint, sitemap, RSS feeds; plus site name, description, repository, `contentUsage` (mirrors content signals). URLs are absolute with `deployment.site`, root-relative otherwise.

```json
{
  "artifacts": {
    "markdown": { "contentNegotiation": "text/markdown", "pattern": "https://docs.example.com/{route}.md" },
    "api": {
      "openapi": "https://docs.example.com/openapi.json",
      "pages": "https://docs.example.com/api/docs/pages.json",
      "search": "https://docs.example.com/api/docs/search"
    },
    "llmsFullTxt": "https://docs.example.com/llms-full.txt",
    "llmsTxt": "https://docs.example.com/llms.txt",
    "mcp": {
      "discovery": "https://docs.example.com/.well-known/mcp.json",
      "url": "https://docs.example.com/mcp"
    }
  },
  "description": "Docs for the Acme API.",
  "generator": "blume@2.0.0",
  "name": "Acme Docs",
  "site": "https://docs.example.com",
  "contentUsage": { "search": true, "ai-input": true, "ai-train": true },
  "repository": "https://github.com/acme/docs"
}
```

`contentNegotiation` appears only when the deployment honors `Accept: text/markdown`. Ship `public/agent-readability.json` to take over.

### Link header and head links

Homepage `Link` response header (RFC 8288), each entry only when its feature is on:

```http
Link: </.well-known/api-catalog>; rel="api-catalog"; type="application/linkset+json; profile=\"https://www.rfc-editor.org/info/rfc9727\"",
  </.well-known/ai-catalog.json>; rel="ai-catalog"; type="application/ai-catalog+json",
  </openapi.json>; rel="service-desc"; type="application/json",
  </agent-readability.json>; rel="describedby"; type="application/json",
  </llms.txt>; rel="describedby"; type="text/plain",
  </index.md>; rel="alternate"; type="text/markdown"
```

- `alternate` = homepage Markdown mirror (the page itself, or the `llms.txt` fallback for a landing page).
- Delivered via `_headers` on static builds (Netlify, Cloudflare), routing rules on Vercel server builds, and the dev server. The dev server lists only `service-desc` and `alternate` (catalogs, manifest, `llms.txt` are written by `blume build`). Check with `curl -I localhost:4321`.
- Every rendered page also carries `<link>` tags in `<head>`, so deep-page entry and hosts without custom headers (GitHub Pages, S3) still work:

```html
<link rel="describedby" href="/agent-readability.json" type="application/json" />
<link rel="describedby" href="/llms.txt" type="text/plain" />
<link rel="ai-catalog" href="/.well-known/ai-catalog.json" type="application/ai-catalog+json" />
<link rel="ard" href="/.well-known/ard.json" type="application/json" />
<link rel="alternate" href="/docs/example.md" type="text/markdown" />
```

The `alternate` link points at that page's own `.md` mirror.

### API catalog

`/.well-known/api-catalog`: RFC 9727 linkset, media type `application/linkset+json` with `profile="https://www.rfc-editor.org/info/rfc9727"`. Nothing to configure. Entries:

- each OpenAPI/AsyncAPI/GraphQL reference: anchored at its docs route, `service-doc` -> docs, `service-desc` -> spec when at a fetchable URL;
- the site JSON API: `service-desc` -> `/openapi.json`;
- the MCP server: `service-desc` -> its discovery document.

No catalog when there are no API references, no MCP server, and the JSON API is off. `public/.well-known/api-catalog` wins.

### AI catalog / ARD

`/.well-known/ai-catalog.json` (AI Catalog document; the manifest ARD consumers resolve) and the same document at `/.well-known/ard.json` (ARD's current path; `ai-catalog.json` is its predecessor). Both are advertised (`ai-catalog` and `ard` rels in every page head) and listed in `llms.txt` and `agent-readability.json`. The catalog and its `.well-known` neighbors (API catalog, MCP discovery files) are served with `Access-Control-Allow-Origin: *`.

- Entries: MCP server, each published skill, JSON API, each rendered API reference, `llms.txt`.
- Entry fields: `identifier` (`urn:air:<host>:<namespace>:<name>`), `displayName`, `description`, `type` (media type), `url`, `representativeQueries`; MCP entries add `capabilities`. Top-level: `specVersion: "1.0"`, `host` (`displayName`, `identifier: did:web:<host>`, `documentationUrl`), `entries`.
- Example entry types: `application/mcp-server-card+json`, `application/agent-skills+md`, `application/vnd.oai.openapi+json`, `text/plain`.
- Needs `deployment.site` (nothing emitted without it). `agents.catalog: false` turns it off.
- Custom queries are keyed by the identifier tail `<namespace>:<name>`; a list replaces the generated queries for that entry, unnamed entries keep theirs:

```ts
agents: {
  catalog: {
    queries: {
      "mcp:acme": ["how do I install Acme", "search the Acme docs"],
      "skill:acme": ["set up an Acme project", "write an Acme plugin"],
    },
  },
}
```

`public/.well-known/ai-catalog.json` (or `ard.json`) wins.

### WebMCP

Every page registers `search_docs`, `get_page`, `list_pages` on the browser model context (`navigator.modelContext` or `document.modelContext`, via `provideContext` or per-tool `registerTool`). Tiny script, lazy search, silent no-op without the API.

```ts
agents: { webmcp: false }   // opt out
```

### DNS-AID

Cannot be built; add a record in your DNS zone:

```txt
_index._agents.docs.example.com. 3600 IN HTTPS 1 docs.example.com. alpn=h2
```

Use `HTTPS` if the provider has it (Vercel DNS does, but no plain `SVCB`); otherwise a ServiceMode `SVCB` with `alpn` and `port`. DNSSEC is recommended (Cloudflare one-click; Vercel DNS unsupported). `bunx blume audit --url <origin>` queries the entrypoint over DNS-over-HTTPS (needs `deployment.site`) and prints the record to publish plus DNSSEC status. Set `BLUME_DOH_URL` to use your own resolver if public ones (Google, Cloudflare) are blocked.

### Web Bot Auth

For your organization's own agents to identify themselves (not for agents reading your docs). Publish public keys:

```ts
agents: {
  webBotAuth: {
    keys: [{ kty: "OKP", crv: "Ed25519", x: "JrQLj5P_89iXES9-vFgrIy29c…" }],
  },
}
```

- Served as a JWKS at `/.well-known/http-message-signatures-directory` with its registered media type.
- Public keys only: a JWK with private material (`d`, `p`, `q`, ...) fails validation.
- Keys can come from an env var; validated the same way:

```ts
const webBotAuthKey = process.env.WEB_BOT_AUTH_PUBLIC_JWK;
export default defineConfig({
  agents: { webBotAuth: { keys: webBotAuthKey ? [JSON.parse(webBotAuthKey)] : [] } },
});
```

- Skip it if your org runs no agents. Environments without keys publish no directory.

## Skills

### Site skill: `/skill.md`

Every build writes an agent skill (`SKILL.md`) for your docs at `/skill.md`, listed in the skills index. Generated without a model call.

- Content: title, description, when to use; how to read pages as Markdown; `llms.txt`, `llms-full.txt`, MCP server, JSON API, changelog (when served); API references; a docs map in sidebar order linking each page's Markdown with its one-line description.
- Name = site `title` slugified (`Acme Docs` -> `acme-docs`).
- Covers the current version in the default language. Leaves out API operation pages and changelog entries; skips what `llms.txt` skips (drafts, hidden, `noindex`, `ai.exclude`); lists up to 200 pages, then points at `llms.txt`.
- Needs `deployment.site` (links are absolute); a build without one skips it.
- `agents.skillMd: false` turns it off.
- Precedence: a skill of the same name in `agents.skills` replaces the generated one in the index (and at `/skill.md` when it is a lone `SKILL.md`). A `public/skill.md` wins over both.

Write a better one with your coding agent:

```bash
bunx blume skill --claude   # or --codex
```

This opens Claude Code or Codex on the bundled `blume-write-skill`, which writes a `SKILL.md` under your `agents.skills` folder (`./skills` if unset, adding it to config), named after your site. Review and commit it. Rerun after big docs changes. Without a flag, it prints where the skill goes and how to point another agent at it.

### Published skills: `agents.skills`

```ts
agents: { skills: "./skills" }   // path from project root
```

Each subdirectory with a `SKILL.md` is published per the Agent Skills Discovery RFC:

- Lone `SKILL.md` -> copied verbatim to `/.well-known/agent-skills/<name>/SKILL.md` (`type: "skill-md"`).
- Skill with `scripts/`, `references/`, or `assets/` -> bundled into a deterministic `.tar.gz` (`type: "archive"`), script execute bits preserved.
- Index at `/.well-known/agent-skills/index.json`: v0.2.0 `$schema`; per skill `name`, `type`, `description` (from `SKILL.md` frontmatter), artifact URL, SHA-256 digest.
- Skills with a missing or spec-invalid `name`/`description` are skipped with a build warning.
- A `public/.well-known/agent-skills/index.json` you ship takes over the whole surface.
- Published skills and the site skill are listed in `llms.txt`, and in the AI catalog as `urn:air:<host>:skill:<name>` entries.

### Blume's own skills (shipped in the repo `skills/` folder and bundled in the package under `skills/`)

| Skill | Purpose | Install / run |
| --- | --- | --- |
| `blume` | Core: scaffold, write, configure a site; points at the docs bundled in the package (`docs/` inside `blume`) | `bunx skills add haydenbleasel/blume` |
| `blume-migrate` | Migrate from Mintlify, Docusaurus, GitBook, MkDocs, ReadMe, others; redirect per moved URL; report of dropped items | `bunx blume migrate` (detects framework, opens Codex or Claude Code) or `bunx skills add haydenbleasel/blume --skill blume-migrate` |
| `blume-update-docs` | Scheduled drift audit: recent PRs/changelogs/config schemas/CLI help vs docs; fixes stale pages only (feature-flagged work ignored); verifies with `blume build` and `blume validate`; opens or updates a `blume/*` PR; clean no-op if nothing drifted | `bunx skills add haydenbleasel/blume --skill blume-update-docs` |
| `blume-write-skill` | Writes the site's own `SKILL.md` | `bunx blume skill --claude` / `--codex` or `bunx skills add haydenbleasel/blume --skill blume-write-skill` |

Blume does not host the `blume-update-docs` automation; wire it into a scheduled task (Claude Code, Codex/Cursor automation, or cron) with permission to read repo history and open PRs. Example weekly prompt:

```text
Use the blume-update-docs skill. Review the PRs merged within the last 7 days and compare them to the docs content. Ignore work behind feature flags. If docs need updates, make them, verify the docs build, and open a blume/* PR. If not, report what you checked and do not open a PR.
```

## Config cheat sheet

```ts
import { defineConfig } from "blume";
import { node } from "blume/deploy"; // or vercel, netlify, cloudflare

export default defineConfig({
  deployment: node({ site: "https://docs.example.com" }),
  seo: {
    x: { handle: "@acme", creator: "@jane" },
    metatags: { "theme-color": "#0b5fff" },
    og: {
      enabled: true,
      logo: "/logo/og.svg",            // or false
      palette: { accent: "#ff5410", background: "#1d1d1d", foreground: "#fff6f2", muted: "#a6a19f", border: "#323232" },
      site: "docs.acme.com",           // or false
      description: false,              // or string
      fonts: ["Noto Sans JP"],         // [] = built-in only
      titles: { "/cli": "CLI" },
    },
    structuredData: true,
    organization: { name: "Acme", email: "hello@acme.com" },
    software: true,
    rss: { enabled: true, types: ["blog", "changelog"], limit: 50 },
    sitemap: true,
    robots: true,
  },
  agents: {
    llmsTxt: { enabled: true, openapi: false, details: "…" },
    contentSignals: { aiTrain: false },   // or false
    markdownComponents: {},
    api: true,                             // false: no JSON API / openapi.json
    mcp: { enabled: true, route: "/mcp", name: "Acme", instructions: "…", clients: true },
    agentReadability: true,
    catalog: true,                         // or { queries: {...} } / false
    webmcp: true,
    skillMd: true,
    skills: "./skills",
    webBotAuth: { keys: [] },
  },
  ai: { openInChat: ["claude", "chatgpt"] },   // false hides
});
```

Per-page frontmatter: `seo.title`, `seo.description`, `seo.image`, `seo.canonical`, `seo.noindex`, `seo.x.creator`, `ai.exclude`.

## Gotchas

- No `deployment.site` means: no OG images, no sitemap, no RSS (build), no AI catalog/ARD, no `/skill.md`, no WebSite JSON-LD node, no `organization`/`software` blocks, route-relative JSON-LD URLs, and no Connect to MCP menu. Set it first.
- MCP needs server output. A static build with `agents.mcp.enabled` fails; pick an adapter from `blume/deploy`. `/api/docs/search` also needs server output; the rest of the JSON API is prerendered.
- `seo.noindex` removes the page from the sitemap and structured data and `llms` files; `ai.exclude` removes it only from `llms` files and the site-skill page map. Hidden pages are not private: `.md`, `get_page`, `resources/read` still serve them.
- A file in `public/` always wins over its generated twin. Shipping `public/openapi.json` also triggers `BLUME_PUBLIC_OPENAPI_JSON` because the catalog still advertises `/openapi.json` as the docs API's description; use another path for your own spec.
- An unparseable palette color fails the build; a non-CSS color also warns `BLUME_THEME_COLOR_INVALID`.
- Google fonts and Twemoji emoji in OG cards need build-time network access. Latin-only titles with no `theme.fonts` build offline.
- `og.fonts` replaces the whole font list and the script fallbacks; `og.fonts: []` disables all of it (tofu risk for non-Latin titles).
- `og.titles` affects custom `.astro` pages only. Content pages use frontmatter titles.
- `seo.image` frontmatter covers Markdown/MDX; custom `.astro` pages use the `ogImage` prop on `PageLayout`.
- `seo.metatags` cannot override tags Blume writes (title, description, canonical, `og:*` set by Blume, `twitter:*`, `robots`).
- `Accept: text/markdown` negotiation only works on dev and Vercel/Cloudflare server builds. Elsewhere use the `.md` URL.
- Vercel cannot compare two q-values below 1; send `text/markdown` with no q-value.
- `.md` conversion never executes props; computed or imported values stay as written. Put agent-critical values in text or content variables.
- Custom Markdown serializers belong in `blume.config.ts`, not `components.tsx`.
- Content signals are advisory. `contentSignals: false` removes the line; unset signals default to `yes`.
- If a content or custom page owns `/mcp`, the MCP server is silently not generated (the build warns) and discovery docs omit it. Change `route`.
- The `/api/…` JSON-API catch-all yields to a docs section under `/api` or a custom page owning a rest route there.
- MCP/JSON filters: facet matching is exact and case-sensitive; list values are ignored.
- MCP request bodies over 64 KB return `413`.
- Web Bot Auth config rejects JWKs with private fields; do not paste private keys.
- Published skills missing a valid `name`/`description` are skipped with a warning, not published.
- DNS-AID cannot be generated by the build; add the `HTTPS`/`SVCB` record at your DNS provider.
- The dev server's `Link` header is partial; run `bunx blume build` and check the output for the full set.
