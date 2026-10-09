# blume.config.ts

Core `blume.config.ts` options and where each feature block is documented. Every field is optional and schema-validated.

## Contents

- [Shape](#shape)
- [Top-level key map](#top-level-key-map)
- [Site: title, logo, favicon, banner, footer](#site-title-logo-favicon-banner-footer)
- [Content block](#content-block)
- [Images](#images)
- [Frontmatter extension and content types](#frontmatter-extension-and-content-types)
- [GitHub](#github)
- [Last modified and date format](#last-modified-and-date-format)
- [SEO and agents defaults](#seo-and-agents-defaults)
- [TOC and page feedback](#toc-and-page-feedback)
- [Precedence](#precedence)
- [Adapter subpaths](#adapter-subpaths)
- [Gotchas](#gotchas)

## Shape

```ts blume.config.ts
import { defineConfig } from "blume";
import { orama } from "blume/search";

export default defineConfig({
  title: "My Docs",
  description: "Documentation for my project.",
  logo: "/logo.svg",
  content: { root: "docs" },
  theme: { accent: "teal", radius: "md", mode: "system" },
  search: orama(),
  markdown: {
    imageZoom: true,
    externalLinks: false,
    code: { icons: true, wrap: false, theme: { light: "github-light", dark: "github-dark" } },
  },
  agents: { llmsTxt: true, catalog: true, skillMd: true, mcp: { enabled: false, route: "/mcp" } },
  seo: {
    og: { enabled: true },
    rss: { enabled: true, types: ["blog", "changelog"] },
    sitemap: true,
    robots: true,
    structuredData: true,
  },
  deployment: { site: "https://docs.example.com" },
});
```

The file is real TypeScript. Compute values, import helpers, read `process.env`. Wrap it in `defineConfig` for types. `meta.ts` files use `defineMeta`; `components.ts` uses `defineComponents`. Schemas for tooling live in `blume/schema`.

## Top-level key map

| Key | Configures | Reference |
| --- | --- | --- |
| `title`, `description`, `logo`, `banner`, `footer` | Site identity and chrome | this file |
| `content` | Root, include/exclude globs, `sources`, `pages`, `defaultType`, `types` | this file, [sources-i18n-versioning.md](sources-i18n-versioning.md) |
| `image` | Remote image optimization allowlist | this file |
| `frontmatter.extend` | Extra site-wide frontmatter keys (Standard Schema) | this file |
| `github` | Repo for edit links, footer mark, agent manifest | this file |
| `lastModified`, `dateFormat` | "Last updated" stamp and date shape | this file |
| `toc`, `feedback` | On-page outline, "Was this page helpful?" | this file |
| `navigation` | Sidebar, tabs, selectors, featured links, header actions, `repo` | [content-navigation.md](content-navigation.md) |
| `markdown` | Code blocks, heading anchors, image zoom, external links | [authoring.md](authoring.md) |
| `variables` | Values for `{{name}}` | [authoring.md](authoring.md) |
| `examples`, `react` | `<Component path>` previews, React Compiler for islands | [authoring.md](authoring.md) |
| `theme` | Accent, radius, fonts, mode | [theming-search.md](theming-search.md) |
| `search` | Adapter from `blume/search` | [theming-search.md](theming-search.md) |
| `export` | PDF / EPUB downloads | [theming-search.md](theming-search.md) |
| `integrations` | Astro integrations appended after Blume's | [theming-search.md](theming-search.md) |
| `ai` | In-page assistant (`ai.assistant`); Open in chat (`ai.openInChat`) | [assistant-analytics.md](assistant-analytics.md), [discoverability.md](discoverability.md) |
| `rateLimit` | Assistant, playground proxy, server search limits | [assistant-analytics.md](assistant-analytics.md) |
| `narration` | "Listen to this page" | [assistant-analytics.md](assistant-analytics.md) |
| `analytics`, `consent` | Adapter lists from `blume/analytics`, `blume/consent` | [assistant-analytics.md](assistant-analytics.md) |
| `seo`, `agents` | Metadata, OG, RSS, sitemap, robots, JSON-LD; llms.txt, Markdown mirrors, JSON API, MCP, manifests | [discoverability.md](discoverability.md) |
| `reference`, `api` | OpenAPI/AsyncAPI/GraphQL/Scalar adapters; hand-written endpoint pages | [api-references.md](api-references.md) |
| `deployment`, `redirects`, `basePath`, `poweredBy` | Host adapter or `{ site, base }`; exact-path redirects | [deploy-upgrade-migrate.md](deploy-upgrade-migrate.md) |
| `i18n`, `versions` | Locales and translated UI; frozen doc versions | [sources-i18n-versioning.md](sources-i18n-versioning.md) |
| `changelog` | Title/description of the generated `/changelog` index | [sources-i18n-versioning.md](sources-i18n-versioning.md) |

## Site: title, logo, favicon, banner, footer

| Option | Default | Notes |
| --- | --- | --- |
| `title` | `"Documentation"` | Header, page titles, OG cards. |
| `description` | — | Default meta description. |
| `logo` | — | `"/logo.svg"` or `{ image, text, href }`. |
| `banner` | — | String, or `{ content, link: { text, href }, dismissible, id }`. |
| `footer` | — | `{ copyright, links, socials }`. |

Logo:

- An SVG path is inlined, so a `currentColor` logo follows light/dark. It can sit at the project root or in `public/`.
- `image` takes a path or `{ light, dark, alt }`. Raster images must live in `public/`.
- Omit `text` to use `title`. `text: ""` shows the mark alone. `text` without `image` gives a text-only logo.
- `href` defaults to `/`. On multi-locale sites it moves into the reader's locale when that locale serves the route.

Favicon: there is no option. Blume detects `icon.*` or `favicon.*` (`.svg` > `.png` > `.ico`; `public/` beats root). Add a `-dark` sibling (`icon-dark.png`) for dark mode. Apple touch icon: `apple-icon.(png|jpg|jpeg)` or `apple-touch-icon.png`. Put it in `public/`, because iOS ignores the inlined data URI used for root-level icons.

Banner: with `dismissible: true`, dismissal is keyed on the content text. Set a stable `id` to keep it dismissed after edits. On i18n sites, `content` and `link.text` take a locale map.

Footer:

```ts
footer: {
  copyright: `© ${new Date().getFullYear()} Acme, Inc.`,
  links: [{ label: "Pricing", href: "https://acme.dev/pricing" }, { label: "Changelog", href: "/changelog" }],
  socials: { x: "https://x.com/acme", discord: "https://discord.gg/acme" },
},
```

- `copyright` is plain text. Write `©`, not `&copy;`.
- `socials` platforms: `bluesky`, `discord`, `facebook`, `github`, `hacker-news`, `instagram`, `linkedin`, `medium`, `podcast`, `reddit`, `slack`, `telegram`, `threads`, `website`, `x`, `youtube`.
- The `github` repo link comes first among icons. A `socials.github` replaces it. Hide it with `navigation.repo: false`.
- No copyright, links, socials, or repo means no footer. Replace it with the `Footer` layout slot.

## Content block

| Option | Default | Notes |
| --- | --- | --- |
| `root` | `"docs"` | Shorthand for one `filesystem()` source. Not allowed beside `sources`. |
| `include` | `["**/*.{md,mdx}"]` | Shorthand, like `root`. |
| `exclude` | `["**/_*", "**/.*"]` | Adds to defaults. `"!**/_*"` re-publishes underscore files. |
| `sources` | one `filesystem()` | Adapters from `blume/sources`. Replaces the shorthand. |
| `pages` | `"pages"` | Folder for custom `.astro` pages. |
| `defaultType` | `"doc"` | `type` used when frontmatter omits it. |
| `types` | `{}` | Per-type frontmatter keys and `facets`. |

Static assets live in `public/` (`public/logo.png` → `/logo.png`). Relative images (`./diagram.png`) live beside content and are optimized at build.

## Images

Relative local images are compressed, converted to WebP, and get `width`/`height`. Remote images are untouched unless you allow their hosts:

```ts
image: {
  domains: ["cdn.example.com"],
  remotePatterns: [{ protocol: "https", hostname: "**.example.com" }],
},
```

`*.` matches one level, `**.` any depth.

## Frontmatter extension and content types

Unknown frontmatter keys fail the build. Declare extra keys with any Standard Schema library (Zod, Valibot, ArkType):

```ts
import { defineConfig } from "blume";
import { z } from "zod";

export default defineConfig({
  frontmatter: {
    extend: { owner: z.string(), reviewedAt: z.coerce.date().optional() },
  },
  content: {
    types: {
      rfc: {
        facets: ["domain", "status"],
        frontmatter: { domain: z.string(), status: z.enum(["draft", "review", "enforced"]) },
      },
    },
  },
});
```

- Every declared key is checked on every page, so a non-optional schema makes the key required site-wide.
- A key belongs to one declaration: site-wide or one type, not both. Built-in keys cannot be redeclared.
- Per-type keys also apply to pages without `type` when the type is `content.defaultType`.
- `facets` must name declared custom keys. Facet values ride on search documents (`blume-search.json`, the MCP index), and the MCP tools accept a `filters` input on them. Only string-like values facet.
- `--no-strict` drops failing pages instead of failing the build.

## GitHub

```ts
github: { owner: "acme", repo: "docs", branch: "main", dir: "apps/docs" },
```

| Option | Default | Notes |
| --- | --- | --- |
| `owner`, `repo` | — | Required for the feature to turn on. |
| `branch` | `"main"` | Edit-link branch. |
| `dir` | — | Repo root → project root (monorepos). |
| `host` | `"https://github.com"` | GitHub Enterprise origin. |
| `api` | derived from `host` | REST base for `<GithubInfo>`. `*.ghe.com` → `api.` subdomain; others → `/api/v3`. |

`github` drives "Edit on GitHub", the footer mark, and the agent manifest's repository. For a private docs repo, leave `github` unset and point `navigation.repo` at a public URL. Files that git ignores get no edit link. `GITHUB_TOKEN` is withheld over plain HTTP.

## Last modified and date format

`lastModified`: `false` (default), `"git"`, or `"frontmatter"`. Frontmatter `lastModified: 2026-06-20` always wins.

- `"git"` reads the last commit per file and follows renames that keep the content.
- Shallow CI clones drop dates and warn `BLUME_SHALLOW_GIT_HISTORY`. Fix: `VERCEL_DEEP_CLONE=true` on Vercel, `fetch-depth: 0` with `actions/checkout`.
- The date is also emitted as schema.org `dateModified`.

`dateFormat` passes through to `Intl.DateTimeFormat` and is shared with the changelog timeline. Default `{ dateStyle: "long" }`. `timeZone` defaults to `UTC`. `dateStyle` cannot combine with component fields (`year`, `month`, `day`, …).

## SEO and agents defaults

| Option | Default | Notes |
| --- | --- | --- |
| `seo.og.enabled` | auto | On when a site URL is set. |
| `seo.rss.enabled` | `true` | Needs `deployment.site`. |
| `seo.rss.types` | `["blog", "changelog"]` | One feed per type at `/<type>/rss.xml`. |
| `seo.rss.limit` | `50` | Items per feed. |
| `seo.sitemap` | `true` | Needs `deployment.site`. |
| `seo.robots` | `true` | `robots.txt` with a Sitemap link. |
| `seo.structuredData` | `true` | JSON-LD per page. |
| `agents.llmsTxt` | `true` | `llms.txt`, `llms-full.txt`. |
| `agents.catalog`, `agents.skillMd` | `true` | Need `deployment.site`. |
| `agents.mcp.enabled` | `false` | Needs server output. Route `/mcp`. |

Reader-facing model features (assistant, Open in chat) live under `ai`. Full detail: [discoverability.md](discoverability.md).

## TOC and page feedback

- `toc: false` hides the outline. `toc: { minHeadingLevel: 2, maxHeadingLevel: 4 }` changes the range (default H2–H3).
- `feedback` defaults to `true`. It sends a `feedback` analytics event (`helpful`, `path`, `title`) through every analytics adapter with an event API, plus a `blume:track` window event. Without analytics, answers go nowhere.
- `feedback: { comments: true }` adds a text box and sends `feedback_comment` (up to 1,000 chars). Providers truncate: GA 100 chars, Mixpanel 255 bytes, Vercel 255 chars. Fathom, Clarity, and Hotjar get no properties.
- With cookie consent on, the rating shows only to readers who allowed analytics.

## Precedence

Lowest to highest: Blume defaults → `blume.config.ts` → folder `meta.ts` → page frontmatter.

## Adapter subpaths

Blume 2 configures pluggable features with adapter calls imported from subpaths:

Exported names in 2.2.2 (verified against the package source):

| Import | Exports |
| --- | --- |
| `blume/search` | `orama`, `oramaCloud`, `pagefind`, `flexsearch`, `algolia`, `typesense`, `mixedbread` |
| `blume/deploy` | `vercel`, `netlify`, `cloudflare`, `node` |
| `blume/sources` | `filesystem`, `obsidian`, `mdxRemote`, `githubReleases`, `sanity`, `notion`, `contentful`, `payload`, `strapi`, `custom` |
| `blume/reference` | `openapi`, `asyncapi`, `graphql`, `scalar` |
| `blume/analytics` | `adobe`, `amplitude`, `clarity`, `clearbit`, `clics`, `cloudflare`, `databuddy`, `fathom`, `googleAnalytics`, `googleTagManager`, `heap`, `hightouch`, `hotjar`, `logrocket`, `mixpanel`, `oneDollarStats`, `pirsch`, `plausible`, `posthog`, `script`, `segment`, `vercel` |
| `blume/consent` | `native` (Blume's banner), `osano`, `ethyca` |
| `blume/ai` | `gateway`, `openai`, `anthropic`, `gemini`, `grok`, `openrouter`, `llmgateway`, `inkeep`, `openaiCompatible` |
| `blume/ratelimit` | `memory`, `upstash`, `cloudflare`, `unkey` |
| `blume/captcha` | `turnstile`, `hcaptcha` |
| `blume/og`, `blume/components`, `blume/hooks`, `blume/runtime`, `blume/markdown`, `blume/astro` | OG templates, components and hooks for custom pages and islands |

Several subpaths export a `cloudflare` or `vercel` adapter. Alias one on import when a config uses two (`import { cloudflare as cloudflareRateLimit } from "blume/ratelimit"`). Read the topic reference for options. Optional providers are optional peer dependencies (for example `algoliasearch`, `@ai-sdk/openai`, `@astrojs/cloudflare`, `@notionhq/client`, `@sanity/client`, `@asyncapi/converter`). Install the one you use.

## Gotchas

- Do not use the Blume 1 shapes: `ai.ask`, `ai.llmsTxt`, `analytics: { posthog: … }`, `deployment.adapter`, top-level `openapi`/`asyncapi`/`graphql`, `markdown.codeBlocks`, `theme.layout`, `lastModified: true`. Each fails validation with a hint. See [deploy-upgrade-migrate.md](deploy-upgrade-migrate.md).
- `root`/`include`/`exclude` are shorthand for one filesystem source. Do not set them beside `sources`.
- Features that need `deployment.site`: sitemap, RSS, OG (auto), AI catalog, `/skill.md`. Set it, or rely on host detection on Vercel, Netlify, and Cloudflare Pages.
- Features that need server output (a host adapter): MCP server, the assistant, server-side search, the playground proxy. A static build that uses one fails and names the fix.
- A frontmatter typo fails the build. That is intended. Fix the key or declare it.
