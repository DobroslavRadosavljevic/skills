# Source map

Snapshot date: 2026-10-01 (Google changelog entries checked through 2026-09-24). Refresh when the user asks for latest behavior, when a rich-result type looks retired, or when crawler tokens change.

Prefer official docs over blogs. Do not treat forum posts or memory as authoritative.

## Changes since the 2026-08-17 snapshot

Sources: [Search docs updates](https://developers.google.com/search/updates), [Crawling changelog](https://developers.google.com/crawling/docs/changelog).

- 2026-09-24 — VideoObject: `creator` (and `author`) documented; `interactionStatistic` lists the supported interaction types. See structured-data.md.
- 2026-09-18 — Aggregator units and supplier units now support local business queries.
- 2026-09-17 — `Mediapartners-Google` preferences affect several ad products (AdSense, Ad Manager, …), not only AdSense. See crawl-index.md.
- 2026-09-16 — New guide: Search profile badge on your site ([Search profiles](https://developers.google.com/search/docs/appearance/search-profiles)).
- 2026-09-08 — New page: regional differences in Search experience (aggregator units, supplier units, carousels; eligibility by country) ([Aggregator features](https://developers.google.com/search/docs/appearance/aggregator-features)).
- 2026-08-28 — Site reputation abuse: enforcement approach adjusted within the EEA ([blog](https://developers.google.com/search/blog/2026/08/update-site-reputation-policy)). See off-page.md.
- 2026-08-28 — Favicon doc lists supported file formats inline (formats unchanged).
- 2026-08-20 — Preferred sources: custom interactive button that guides users to set the site as a preferred source. See geo.md.
- 2026-09 blog — Search Console adds web multimodal Search performance reporting ([blog](https://developers.google.com/search/blog/2026/09/web-multimodal-in-sc)); read the post before describing the report.

## Google Search Central — foundations

- Search Essentials: https://developers.google.com/search/docs/essentials
- Spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- How Search works: https://developers.google.com/search/docs/fundamentals/how-search-works
- Helpful, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Generative AI on your site: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- Ranking systems: https://developers.google.com/search/docs/appearance/ranking-systems-guide
- March 2024 core + spam policies: https://developers.google.com/search/blog/2024/03/core-update-spam-policies

## Crawl / index

- robots.txt spec: https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- Robots meta / X-Robots-Tag: https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- Canonicals: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Sitemaps: https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- Sitemap protocol: https://www.sitemaps.org/protocol.html
- lastmod / ping retirement: https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping
- Indexing API (limited): https://developers.google.com/search/apis/indexing-api/v3/using-api
- URL structure: https://developers.google.com/search/docs/crawling-indexing/url-structure
- HTTP status: https://developers.google.com/crawling/docs/troubleshooting/http-status-codes
- Crawl budget: https://developers.google.com/crawling/docs/crawl-budget
- JS SEO: https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics
- Dynamic rendering: https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering
- Crawlable links: https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- Google crawlers: https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers
- RFC 9309: https://www.rfc-editor.org/rfc/rfc9309

## Appearance

- Title links: https://developers.google.com/search/docs/appearance/title-link
- Snippets: https://developers.google.com/search/docs/appearance/snippet
- Featured snippets: https://developers.google.com/search/docs/appearance/featured-snippets
- Sitelinks: https://developers.google.com/search/docs/appearance/sitelinks
- Visual elements: https://developers.google.com/search/docs/appearance/visual-elements-gallery
- AI features: https://developers.google.com/search/docs/appearance/ai-features
- Structured data gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Images: https://developers.google.com/search/docs/appearance/google-images
- Video: https://developers.google.com/search/docs/appearance/video
- CWV: https://developers.google.com/search/docs/appearance/core-web-vitals
- Page experience: https://developers.google.com/search/docs/appearance/page-experience
- Rich Results Test: https://search.google.com/test/rich-results
- Schema.org: https://schema.org/

## International / local / ecommerce

- Localized versions / hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions
- Multi-regional sites: https://developers.google.com/search/docs/specialty/international/managing-multi-regional-sites
- LocalBusiness: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Establish business details: https://developers.google.com/search/docs/appearance/establish-business-details
- GBP representation: https://support.google.com/business/answer/3038177
- Pagination / filters: https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- Ecommerce site structure: https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure

## Search Console

- Performance: https://support.google.com/webmasters/answer/7576553
- Impressions / position: https://support.google.com/webmasters/answer/7042828
- Page indexing: https://support.google.com/webmasters/answer/7440203
- Sitemaps report: https://support.google.com/webmasters/answer/183669
- Generative AI performance: https://support.google.com/webmasters/answer/16984139

## Other crawlers / previews

- OpenAI bots: https://developers.openai.com/api/docs/bots
- Anthropic crawlers: https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- Perplexity crawlers: https://docs.perplexity.ai/docs/resources/perplexity-crawlers
- Open Graph: https://ogp.me/
- Facebook sharing: https://developers.facebook.com/docs/sharing/webmasters/
- llms.txt (unofficial): https://llmstxt.org/

## TanStack Start (examples only)

- SEO: https://tanstack.com/start/latest/docs/framework/react/guide/seo
- GEO: https://tanstack.com/start/latest/docs/framework/react/guide/geo
- Context7 library when refreshing examples: `/websites/tanstack_start_framework_react`

## Quality raters (not a ranking API)

- SQRG overview PDF: https://services.google.com/fh/files/misc/hsw-sqrg.pdf
- Guidelines update: https://developers.google.com/search/blog/2023/11/search-quality-rater-guidelines-update
