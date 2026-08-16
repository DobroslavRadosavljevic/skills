---
name: seo
description: "Complete SEO playbook for public web properties: crawl/index, metadata, rendering, on-page, copywriting, E-E-A-T, information architecture, internal linking, keyword research, content briefs, structured data, GEO/AEO, i18n, local, ecommerce, media/OG, white-hat off-page, and audits. Use when the user invokes $seo or asks for SEO, search rankings, titles/snippets, page copy, headlines, CTAs, sitemaps, robots, canonicals, internal links, keyword research, content briefs, rich results, AI Overviews, hreflang, local/GBP, product SEO, or search-preview debugging."
---

# SEO

Complete agent guidance for search, snippets, and AI citations. Classify **mode** and **surface** first. Load only the matching references. Do not treat dashboards like landing pages.

Refresh dated claims from [source-map.md](references/source-map.md) when behavior looks version-sensitive.

## Workflow

1. Ground in the project: public origin, trailing-slash and www policy, locales, existing `head` / sitemap / robots, indexable vs app routes.
2. Pick **mode** (default: implement). Pick **surface** and **index intent** from [surfaces.md](references/surfaces.md).
3. Load the files in the map below. Do not load the whole folder for a `noindex` settings page.
4. Decide index intent before writing a title. Then crawl/index → metadata → **copy** ([copywriting.md](references/copywriting.md)) → links → schema (only if eligible).
5. Emit the decision record (or brief / audit findings). Verify with [review.md](references/review.md).

Rules stay stack-agnostic. When the app is TanStack Start / React SSR, prefer route `head` + loaders + `HeadContent` and server routes for `sitemap.xml` / `robots.txt` — see [rendering.md](references/rendering.md). Otherwise use the project's existing head and sitemap APIs.

## Mode map

| Mode | User signal | Load |
| --- | --- | --- |
| **Implement** | add/fix a public page | surfaces + crawl-index + metadata + copywriting + on-page + (schema/links if needed) |
| **Brief** | outline / SEO brief | content-research + copywriting + on-page + internal-linking |
| **Research** | what should we rank for | content-research (+ review measurement if GSC exists) |
| **Audit** | review / why preview is wrong | review + surfaces + the failing layer |
| **IA / links** | structure, orphans, cannibalization | information-architecture + internal-linking |
| **Local** | NAP, maps, locations | local + structured-data |
| **i18n** | locales, hreflang | i18n + crawl-index |
| **GEO** | AI Overviews, citations, llms.txt | geo + copywriting + on-page + ee-at |
| **Ecommerce** | products, facets, variants | ecommerce + crawl-index + structured-data |
| **Off-page** | links, PR, mentions | off-page only (white-hat; no outreach mail) |

## Surface → extra files

| Surface | Default index | Also load |
| --- | --- | --- |
| Marketing (landing, pricing, compare, changelog) | Index | copywriting, on-page, metadata, media, structured-data |
| Content (blog, docs, guides, glossary) | Index | copywriting, on-page, ee-at, internal-linking, structured-data |
| SaaS app (auth, settings, billing, dashboards) | `noindex` | metadata, crawl-index |
| Marketplace (listings, products, profiles) | Index unique public entities | copywriting, ecommerce, crawl-index, structured-data |
| Local (locations, contact) | Index real places | local, structured-data, media |
| Legal | Index if they should be found | on-page (thin + honest) |

Rendering / CWV: [rendering.md](references/rendering.md), [performance.md](references/performance.md).  
Head tags: [metadata.md](references/metadata.md), [media.md](references/media.md).

## Hard rules

- One indexable URL → unique title, unique description, one primary H1, one primary intent.
- Copy is people-first and specific. Title, H1, deck, and CTA agree. No stuffing, throat-clearing, or invented proof. Follow in-repo voice docs when they exist.
- Canonical, `og:url`, and `og:image` are absolute HTTPS. One host, one slash policy, HTTPS only.
- `robots.txt` is not `noindex`. Sitemap lists only 200 + canonical + indexable URLs. Honest `lastmod`.
- If the URL must rank or preview, title, primary copy, and `<a href>` links exist in the **first HTML**.
- JSON-LD matches visible content. No fake FAQ, ratings, prices, or addresses.
- Faceted/sort/session URLs are not an indexable graph. Paginated pages self-canonicalize; crawlable `href`s.
- Keyword research informs URL and H1. Do not invent volume/KD. Do not ship doorway or scaled city pages.
- E-E-A-T is a quality framework, not a ranking-factor toggle. Do not fabricate authors, credentials, or stats.
- GEO does not replace SEO. `llms.txt` is unofficial and optional. Same page must help humans.
- Local: one NAP everywhere. Google Business Profile actions stay with the user.
- Off-page: earn, do not buy. Stop at an asset + target list. No PBNs, cloaking, or parasite SEO.
- Do not claim unpublished ranking factors. Core Web Vitals help; they do not guarantee rank.

## Decision record (implement / audit)

```markdown
## URL / route
## Surface + index intent
## Primary query + intent
## Title / H1 / description
## Voice / CTA / claims
## Canonical / robots / sitemap
## Internal links in / out
## Schema (type or none) + visible parity
## GEO note (citeable claim or n/a)
## Verification
```

## Content brief (research / brief)

Use the template in [content-research.md](references/content-research.md). Fill proof and non-goals. No word-count targets.

## References

| File | Use |
| --- | --- |
| [surfaces.md](references/surfaces.md) | Index defaults; must-include by page type |
| [crawl-index.md](references/crawl-index.md) | robots, canonical, sitemap, status, URL hygiene |
| [metadata.md](references/metadata.md) | Title, description, head, OG minimum |
| [rendering.md](references/rendering.md) | SSR/SPA, first HTML, Start examples |
| [performance.md](references/performance.md) | LCP, INP, CLS |
| [copywriting.md](references/copywriting.md) | Voice, answer-first copy, CTAs, page-type writing, anti-slop |
| [on-page.md](references/on-page.md) | Intent, headings, content types, snippets |
| [ee-at.md](references/ee-at.md) | Experience, expertise, trust, YMYL |
| [information-architecture.md](references/information-architecture.md) | Topology, nav, cannibalization, facets |
| [internal-linking.md](references/internal-linking.md) | Anchors, hubs, link-plan template |
| [content-research.md](references/content-research.md) | Keywords, SERP, briefs, next 5 pages |
| [structured-data.md](references/structured-data.md) | JSON-LD types, visible parity, validation |
| [geo.md](references/geo.md) | AI Overviews, citeable pages, llms.txt, bots |
| [i18n.md](references/i18n.md) | hreflang, locales |
| [local.md](references/local.md) | NAP, GBP vs code, LocalBusiness |
| [ecommerce.md](references/ecommerce.md) | Products, variants, facets |
| [media.md](references/media.md) | OG images, image/video SEO |
| [off-page.md](references/off-page.md) | White-hat links and PR |
| [review.md](references/review.md) | Audit, severity, GSC measurement |
| [source-map.md](references/source-map.md) | Official URLs to refresh |

## Isolation

This skill stands alone. Reference only the current repo, official docs, and this skill's `references/`.

## Out of scope

Paid ads, black-hat, PBNs, cloaking, automated outreach email, Search Console API productization, invented traffic/KD numbers, and visual design systems.
