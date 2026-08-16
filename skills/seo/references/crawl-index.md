# Crawl, index, canonicals, sitemaps, robots

Research date: 2026-08-17. Label **FACT** (cited) vs **JUDGMENT**.

**FACT.** Search is crawl → index → rank. Crawled ≠ indexed ≠ ranking. Source: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works).

## Control layers

| Layer | Controls | Cannot do |
| --- | --- | --- |
| `robots.txt` | Crawl allow/deny; `Sitemap:` | `noindex`; secrecy; canonical |
| Meta robots / `X-Robots-Tag` | Indexing/snippets **if crawled** | Work on a disallowed URL |
| HTTP status | Fetch, redirects, gone | Fix a 200 soft 404 |
| Canonical | Hint the preferred duplicate | Guarantee Google’s choice |
| Auth | Real access control | — |

**FACT.** A `robots.txt`-blocked URL can still appear (URL + anchor) because Google may never see `noindex`. Source: [robots.txt intro](https://developers.google.com/search/docs/crawling-indexing/robots/intro).

**Do this:** decide per URL: crawlable? indexable? which canonical? Use robots.txt for crawl waste; `noindex` to stay out of results; allow crawl of `noindex` URLs.

## Crawlers

Verify Google by reverse/forward DNS or published IP lists — not User-Agent alone. Source: [Verify Google requests](https://developers.google.com/crawling/docs/crawlers-fetchers/verify-google-requests).

| Token | Job | robots.txt | Notes |
| --- | --- | --- | --- |
| `Googlebot` | Search crawl | Yes | Preferences affect Search products. [Common crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-common-crawlers) (doc updated 2026-07-14) |
| `Google-InspectionTool` | URL Inspection / Rich Results | Honors `Googlebot` + own token | **No ranking effect** |
| `Google-Extended` | Gemini / Vertex **training + grounding** | Token in robots.txt | **Does not** change Search inclusion |
| `AdsBot-Google` | Ads | Ignores `User-agent: *` — name it | [Special-case crawlers](https://developers.google.com/crawling/docs/crawlers-fetchers/google-special-case-crawlers) |
| `bingbot` | Bing | Yes | `Sitemap:` widely supported |
| `GPTBot` | OpenAI training | Honors | ≠ `OAI-SearchBot` (ChatGPT search) |
| `OAI-SearchBot` | OpenAI search | Honors | User-fetch `ChatGPT-User` may ignore robots |
| `ClaudeBot` | Anthropic training | Honors; documents `Crawl-delay` | ≠ `Claude-SearchBot` / `Claude-User` |
| `PerplexityBot` | Perplexity search surfacing | Honors | `Perplexity-User` generally ignores robots |

Sources: [OpenAI bots](https://developers.openai.com/api/docs/bots); [Anthropic crawlers](https://support.claude.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) (2026-04-07); [Perplexity crawlers](https://docs.perplexity.ai/docs/resources/perplexity-crawlers).

**Do this:** split Search vs training vs user-fetch. Blocking `GPTBot` / `Google-Extended` does not block Google Search. User-fetchers often ignore robots.txt — use auth if you must hide content.

## robots.txt

**FACT.** Hosted at `https://host/robots.txt`, UTF-8, `text/plain`. Per host+protocol+port. RFC 9309; [Google spec](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

Google fields: `user-agent`, `allow`, `disallow`, `sitemap`. **`crawl-delay` is not supported by Google.** Source: [Myths about crawling](https://developers.google.com/crawling/docs/myths-about-crawling).

```
User-agent: *
Disallow: /admin/
Allow: /admin/public/

Sitemap: https://example.com/sitemap.xml
```

- Most specific user-agent group wins. Longest matching path wins. Google: on Allow/Disallow conflict, **least restrictive (allow)**.
- `*` wildcard and `$` end-anchor supported by Google/Bing.
- Google reads first **500 KiB**.
- Staging: `Disallow: /` **and** auth. Separate host from production.
- **Cannot `noindex`.** If you Disallow a URL that has `noindex`, Google cannot see `noindex`.

Google status handling: 2xx parse; 4xx (except 429) = no robots.txt (open crawl); 5xx/429 = retry / last-good then eventually open. Source: same spec.

## Meta robots / X-Robots-Tag

**FACT.** In HTML `<head>` or `X-Robots-Tag` on any file. Must be crawlable. Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

| Rule | Google |
| --- | --- |
| `noindex` | Do not show in results |
| `nofollow` | Do not use this page’s links for discovery |
| `none` | `noindex, nofollow` |
| `nosnippet` | No text snippet; also blocks **AI Overviews / AI Mode** direct input |
| `max-snippet:` N | Cap snippet / AI input |
| `max-image-preview:` | `none` \| `standard` \| `large` |
| `noimageindex` | Do not index images on the page |
| `unavailable_after:` | Drop after datetime |
| `indexifembedded` | Only with `noindex` — index if iframed |
| `noarchive` | **Unused** by Google (cache link gone). Bing may still use it |

Non-HTML: `X-Robots-Tag: noindex`. Preview URLs: `noindex, nofollow`.

## Canonical

**FACT.** Signal strength: **redirects > `rel=canonical` > sitemap `loc`**. Google may ignore hints. Source: [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). RFC 6596.

**Do this**

1. Self-canonical the preferred URL in `<head>`: absolute HTTPS, no UTM, no hash.
2. HTTP `Link: <…>; rel="canonical"` for PDFs.
3. Sitemap lists only preferred URLs (weak).
4. 301/308 when retiring a URL.
5. HTTPS preferred when HTTP and HTTPS both exist.

**hreflang:** each locale self-lists + all alternates; reciprocal. Canonical of a locale is **that locale’s** URL. Pick one hreflang method (HTML **or** HTTP **or** sitemap). See [i18n.md](i18n.md).

**Mistakes:** canonical to redirect/404/`noindex`/disallowed; UTM self-canonical; sitemap ≠ HTML; paginated page 2+ canonical to page 1; fragment canonical; conflicting HTML vs JS vs header.

**JUDGMENT.** One host (www or apex), HTTPS, one trailing-slash policy; 301/308 the rest.

## Sitemaps

**FACT.** [sitemaps.org protocol](https://www.sitemaps.org/protocol.html). 50k URLs or 50 MB uncompressed per file; use a sitemap index. `changefreq` / `priority`: **Google ignores**. `lastmod` used **if consistently accurate**. Sources: [Build a sitemap](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap); [lastmod / ping, 2023-06](https://developers.google.com/search/blog/2023/06/sitemaps-lastmod-ping).

Include only URLs you want in results: **200**, indexable, preferred `loc`. Entity-escape `& < >`.

| Discovery | Status |
| --- | --- |
| `Sitemap:` in robots.txt | Works |
| Search Console / Sitemaps API | Works |
| `google.com/ping?sitemap=` | **Dead** (deprecated 2023-06) |
| Indexing API | **Jobs + livestream VideoObject/BroadcastEvent only** — [Indexing API](https://developers.google.com/search/apis/indexing-api/v3/using-api) |

Image extension: `image:loc` (caption/title/geo/license **deprecated**). hreflang in sitemap: `xhtml:link` on every variant including self.

## Status codes

Source: [HTTP status codes](https://developers.google.com/crawling/docs/troubleshooting/http-status-codes).

| Code | Effect |
| --- | --- |
| 200 | Eligible. Empty/error HTML → **soft 404** |
| 301 / 308 | Strong canonical to target |
| 302 / 303 / 307 | Follow; weak canonical |
| 3xx chain | ~10 hops then fail |
| 404 / 410 | Not indexed; treated similarly for removal |
| 401 / 403 | Not indexed; do not use as rate-limit |
| 429 / 5xx | Slow crawl; 503 OK only briefly |

**Do this:** permanent move → 301/308 one hop. Deleted → 404/410, not homepage redirect. SPA misses → **server 404**, not 200 + “not found” UI.

## URL hygiene

**FACT.** Case-sensitive. Fragments are not separate documents. Prefer hyphens; minimize parameters. Source: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

- One slash policy; lowercase if the server is case-insensitive; HTTPS + HSTS when stable.
- Strip UTM/session IDs from canonicals; cookies for sessions.
- Facets: index one default list; `noindex` or Disallow combinatorial URLs. [Pagination + filters](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).
- Pagination: unique URL per page; **self-canonical**; sequential `<a href>`. Do **not** canonical page 2+ to page 1. `rel=prev/next` unused by Google (**JUDGMENT** after 2019).
- Infinite scroll: Google does not click “load more”. Expose paginated `href`s.

## Hard rules

1. `robots.txt` ≠ `noindex`.
2. Secrets: authentication.
3. Sitemap ⊆ 200 + indexable + preferred.
4. No Indexing API / ping for ordinary pages.
5. Split AI training tokens from `Googlebot`.

## Sources

- https://developers.google.com/search/docs/fundamentals/how-search-works
- https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap
- https://www.sitemaps.org/protocol.html
- https://www.rfc-editor.org/rfc/rfc9309
