# SEO audit procedure

Run this when asked to audit, review, or verify SEO. White-hat only. Do not propose link schemes.

Label evidence **FACT** (observed + cited policy) vs **JUDGMENT** (priority/recommendation).

## Inventory

Build a URL set from **code + live**, then fetch.

### From the codebase

1. List routes / file-based pages / sitemaps / redirects / `robots.txt` / middleware headers.
2. Note templates that emit `<title>`, meta description, canonical, robots, OG, JSON-LD, hreflang.
3. Flag client-only metadata (tags injected after hydration).
4. List noindex candidates: cart, checkout, account, site search, empty facets, thin UGC.

### From live

1. Fetch `https://{host}/robots.txt` and every sitemap it names (`Sitemap:` lines).
2. Fetch sitemap URL sets (and nested sitemap indexes).
3. Sample: home, 2–3 money pages, 1 category, 1 product, 1 article, 1 utility (login/cart), 1 parameterized URL, 1 pagination URL, 1 404.
4. Record HTTP status, final URL after redirects, `content-type`, `x-robots-tag`, `link` header canonical if present.

Cap: if the site is huge, audit **templates** (one URL per template) plus sitemap/robots, then list unsampled templates as residual risk.

## Inspect each URL (view-source first)

**FACT.** Social crawlers and many extractors read HTML, not a fully painted DOM. Google can use rendered HTML, but tags that exist only after user interaction are unreliable. Source: [Sharing for webmasters](https://developers.facebook.com/docs/sharing/webmasters/); [Lazy-loaded content](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading); [Video SEO](https://developers.google.com/search/docs/appearance/video).

For every sampled URL:

1. **GET the URL** as a crawler would (follow redirects; save status chain).
2. **View-source / raw HTML** — do not use only the hydrated DOM or a screenshot.
3. Optionally compare **rendered** HTML (browser or URL Inspection) when the page is JS-heavy.
4. Fill the per-URL sheet:

| Field | How to check | Pass rule |
| --- | --- | --- |
| Status | Final HTTP code | 200 for indexable; 301/302 documented; 404/410 for gone; no soft-404 |
| Redirect | Chain length and target | Single hop to HTTPS canonical; no user-agent cloaking |
| `title` | Raw `<title>` | One unique, descriptive title |
| Meta description | `<meta name="description">` | Unique; not keyword dump |
| Canonical | `<link rel="canonical">` and/or `Link` header | Absolute HTTPS; self or agreed parent; no tracking params |
| Robots | `<meta name="robots">` / `X-Robots-Tag` | Indexable pages: no accidental `noindex`; utilities: `noindex` |
| H1 | First `h1` in HTML | One clear H1 matching intent |
| Copy | First HTML body | Answer-first; title/H1/CTA agree; no stuffing or invented proof |
| OG | `og:title` `og:type` `og:image` `og:url` | Present in raw HTML; absolute image URL |
| Twitter | `twitter:card` | Present or OG fallback documented |
| Schema | JSON-LD / microdata / RDFa | Type matches page; visible facts only |
| Internal links | `<a href>` | Real anchors to children/parents; not JS-only |
| Images | `img[src]`, alt, lazy | In-body images in HTML; LCP not lazy |
| Sitemap membership | Sitemap loc set | Indexable URLs listed; noindex URLs absent |
| Indexability conflict | robots.txt vs noindex | If `noindex` is required, URL is **allowed** in robots.txt |

**FACT.** Robots meta / `X-Robots-Tag` are ignored if the URL is `Disallow`ed in robots.txt (Google never sees the tag). Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

**FACT.** Structured data must match visible content; fake reviews and hidden markup violate quality guidelines. Source: [Structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Do **not** treat the client-rendered tree as the source of truth for title/canonical/OG/JSON-LD unless the same strings exist in the first HTML response.

## Severity

Assign exactly one:

| Severity | Use when |
| --- | --- |
| **critical** | Indexable money template broken (4xx/5xx, `noindex` on should-index, canonical to wrong host, cloaking/spam-policy risk, Product/Offer price-availability lie, missing required OG on share URLs, sitemap/robots blocking the only discovery path) |
| **should-fix** | Unique-title/description gaps, weak canonical on filters, missing width/height on OG, schema incomplete but not false, pagination not crawlable, thin UGC still indexable, LCP image lazy-loaded |
| **nit** | Theme-color/favicon polish, twitter tags redundant with OG, alt wording, sitemap lastmod freshness, copy length |

Escalate to **critical** if a should-fix item is sitewide on the primary template.

Never mark a spam-policy violation as nit.

## Finding template

Copy once per issue. Do not batch unrelated URLs into one finding unless they share one template bug.

```markdown
### [SEVERITY] [short name]

- **FACT / JUDGMENT:**
- **URL(s):**
- **Template / code path:**
- **Observed (raw HTML or header):**
- **Expected:**
- **Policy / spec:** [URL]
- **User / crawler impact:**
- **Fix:** [concrete file or header change]
- **Verify:** [command or debugger]
```

Rules:

- Quote the actual tag or status line in **Observed**.
- Cite an official URL in **Policy / spec** when the issue is compliance (spam, structured data, robots, OG).
- If unsure, mark **JUDGMENT** and lower confidence — do not invent a Google “penalty.”

## Verification after fixes

1. Re-GET the same URLs. Confirm status, raw `<head>`, and JSON-LD.
2. Diff against the finding’s **Expected**.
3. Confirm sitemap/robots changes are live (`Sitemap:` still points at the new file).
4. Confirm noindex pages are crawlable (not disallowed) and still `noindex`.
5. Confirm indexable pages are 200, self-canonical, and listed in the sitemap when they should be.
6. If structured data changed: [Rich Results Test](https://search.google.com/test/rich-results) and/or Search Console URL Inspection (optional; requires property access).
7. If OG/image changed: new image URL + Sharing Debugger scrape (optional).
8. Do not claim “Google reindexed” unless Search Console shows it.

## Optional preview debuggers

Not required for a code audit. Use when the user cares about share cards or after OG changes.

| Tool | URL | Use |
| --- | --- | --- |
| Facebook Sharing Debugger | https://developers.facebook.com/tools/debug/ | Scrape `og:*`, show errors, refresh Facebook’s cache. Source: [Sharing for webmasters](https://developers.facebook.com/docs/sharing/webmasters/) |
| Rich Results Test | https://search.google.com/test/rich-results | Product, Review, VideoObject eligibility |
| Search Console URL Inspection | (property) | Rendered HTML, last crawl, mobile usability |

**FACT.** Facebook caches images by URL; debugger force-scrape updates metadata. Source: [Images in link shares](https://developers.facebook.com/docs/sharing/webmasters/images/).

**JUDGMENT.** X’s official card validator is gone; paste the URL in the X composer or rely on OG. Do not block a release on a third-party unofficial validator.

Skip login-gated debuggers if the user cannot authenticate. Report “not run” instead of guessing the card.

## Audit report skeleton

```markdown
# SEO audit — {host} — {date}

## Scope
- Code: {paths}
- Live URLs sampled: {n}
- Not sampled: {templates}

## Critical
- …

## Should-fix
- …

## Nits
- …

## Residual risk
- …

## Verification still needed
- [ ] Search Console
- [ ] Sharing Debugger
```

## Measurement (Search Console)

Do not invent GSC access, rows, or trends. If the user has no GSC, say `NO FIRST-PARTY SEARCH DATA` and use on-site analytics they provide plus qualitative SERP checks.

### Ask the user for

1. Performance (Search results) — Web — last 28 days and 3 or 16 months. Queries + Pages. Optional branded vs non-branded. https://support.google.com/webmasters/answer/7576553
2. Query × page for URLs under review.
3. Page indexing reasons; sitemaps report (discovered ≠ indexed).
4. URL Inspection for disputed URLs.
5. Experience: CWV field report, HTTPS. Do not invent lab scores.
6. Generative AI performance if shown. https://support.google.com/webmasters/answer/16984139
7. On-site conversions for the same URLs (GSC has no conversion column).

### Interpret

**FACT** ([impressions](https://support.google.com/webmasters/answer/7042828)):

| Metric | Meaning | Misread |
| --- | --- | --- |
| Impressions | Link was on the results page (or scrolled into view) | Not “demand you own” |
| Clicks | Click from Google to your URL | Not sessions or conversions |
| CTR | clicks ÷ impressions | Can be SERP features / intent mismatch, not “add keywords” |
| Average position | Mean topmost position **when impressed** | Not a stable rank KPI |

Chart totals ≠ table totals (property vs page aggregation). Anonymized queries sit in charts but vanish under filters. Performance usually rolls up to the canonical. AI Overview links share one position.

**FACT:** Do not expect 100% of URLs indexed. Wait weeks before judging SEO work. [Starter guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide). Good CWV does not guarantee rank.

**Vanity — do not optimize for:** invented KD, domain-authority scores, word count, index count, branded impressions as “SEO growth,” average position as the only KPI.

**Prefer:** non-branded clicks to money/docs URLs, one URL per cluster, conversions from those landings, indexed canonicals for the next-5 list.

### Per-URL GSC pass

1. Evidence present? If no, say so.
2. Expected vs surprise queries; branded vs not.
3. One query → many URLs (cannibalization).
4. High impressions, low CTR → title/snippet or wrong intent.
5. Clicks up, conversions flat → offer/content, not a ranking win.
6. Not indexed → inspect reason before rewriting copy.

## Sources

- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading
- https://developers.google.com/search/docs/appearance/video
- https://developers.facebook.com/docs/sharing/webmasters/
- https://developers.facebook.com/docs/sharing/webmasters/images/
- https://developers.facebook.com/tools/debug/
- https://search.google.com/test/rich-results
- https://ogp.me/
