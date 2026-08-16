# Page experience and Core Web Vitals

Research date: 2026-08-17. Do not invent unpublished ranking factors.

## What Search uses

**FACT.** Current Core Web Vitals: **LCP**, **INP**, **CLS**. **INP replaced FID on 2024-03-12.** Sources: [CWV in Search](https://developers.google.com/search/docs/appearance/core-web-vitals); [INP announcement](https://developers.google.com/search/blog/2023/05/introducing-inp).

| Metric | Good | Measures |
| --- | --- | --- |
| LCP | ≤ 2.5 s | Largest contentful paint |
| INP | < 200 ms | Interaction to next paint |
| CLS | < 0.1 | Layout shift |

Field data: CrUX / Search Console (75th percentile). Lab-only scores are not what Search uses.

**FACT** ([Page experience](https://developers.google.com/search/docs/appearance/page-experience)):

- No single “page experience score.”
- CWV are used by ranking systems.
- Green CWV does **not** guarantee rankings.
- HTTPS, mobile usability, intrusive interstitials, excessive ads are quality/eligibility hygiene; relevance still wins many queries.
- Evaluation is mostly page-level.

## Practical work

### LCP

- LCP node (hero image or H1 text) in first HTML.
- Preload the LCP image; `fetchpriority="high"`; real `img`, not a late CSS background.
- Correct dimensions; modern formats; CDN.
- Do not client-mount the LCP node after paint.

### INP

- Break long tasks; shrink hydration.
- Defer chat/ads/analytics until idle or interaction.
- Heavy client routers hurt INP; that is UX, not a secret “JS SEO rank lever.”

### CLS

- `width`/`height` or `aspect-ratio` on images, embeds, ads.
- Font fallback metrics; preload 1–2 files; avoid injecting banners above existing content.

### Images, fonts, third parties

- Discover images via HTML `img` + descriptive `alt`. Image sitemaps only for JS-only galleries. See [media.md](media.md).
- **JUDGMENT:** default-deny marketing pixels on indexable templates.

## Hygiene (do anyway)

HTTPS, mobile layout, no interstitial blocking main content, distinguishable main content, compressed assets. [Intrusive interstitials](https://developers.google.com/search/docs/appearance/avoid-intrusive-interstitials).

## Indexing shortcuts (not CWV)

| Mechanism | 2026 status |
| --- | --- |
| Sitemap ping REST | Gone |
| Indexing API | Jobs + livestream only |
| Search Console “Request indexing” | Manual cap; not a strategy |
| Honest `lastmod` + internal links | Scalable path |

## Sources

- https://developers.google.com/search/docs/appearance/core-web-vitals
- https://developers.google.com/search/docs/appearance/page-experience
- https://web.dev/articles/inp
