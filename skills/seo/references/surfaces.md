# Surfaces and index intent

Classify the URL before writing tags or copy. Default index rules below. Override only with a written reason.

Research date: 2026-08-17.

## Decide index intent

Ask, in order:

1. Should a stranger find this URL in Google for a non-branded query?
2. Is the content unique, public, and complete without login?
3. Is this the canonical URL for that job (not a filter, sort, session, or preview)?

If any answer is no → **`noindex`** (and omit from the sitemap). Allow crawl so the directive is seen unless the path is pure junk (`/cart`, `/search?q=`).

## Surface table

| Surface | Examples | Index | Must include (visible + first HTML) | Schema (only if true) | Do not |
| --- | --- | --- | --- | --- | --- |
| **Home** | `/` | Index | Unique title, promise, proof, primary CTA, links to hubs | `WebSite`, `Organization` | Keyword dump; multiple H1s |
| **Landing / campaign** | feature, use-case | Index if evergreen; `noindex` if paid-only vanity | One job, one CTA, unique copy | Rarely; `SoftwareApplication` / `Product` if it is the product | Duplicate the homepage |
| **Pricing** | `/pricing` | Index | Plans, prices or “contact”, caveats, CTA | `Product`/`Offer` if prices are real | Fake “from $0” |
| **Compare / alternatives** | `/vs`, `/compare` | Index | Named criteria, honest limits, first-hand use | None required | Smear pages; doorway “vs {brand}” farm |
| **Changelog** | `/changelog` | Index | Dated entries, versions | None or `Article` per entry if substantial | Empty “coming soon” |
| **Blog / guide** | `/blog/*`, `/guides/*` | Index | Author/date if claimed, answer-first, outline, next step | `Article` / `BlogPosting` / `TechArticle` | Thin AI rewrites; date bumps without substance |
| **Docs** | `/docs/*` | Index | Accurate procedure, version, related links | `TechArticle` if it fits | Orphan pages; two URLs for one procedure |
| **Glossary** | `/glossary/*` | Index if each term is a real explainer | Definition + context + links | None | One-sentence stubs × 500 |
| **FAQ** | `/faq` | Index if the Q&A is the page | Visible Q&A | `FAQPage` only if Q&A is visible. Google FAQ **rich results retired 2026-05** — markup is still for understanding, not a snippet feature | Hidden FAQ JSON-LD |
| **Category / hub** | topic index, docs section | Index | Intro that finishes a job + links to spokes | `ItemList` only if the list is the main content and honest | Empty hubs |
| **Product / SKU** | PDP | Index unique products | Unique description, price/availability, images | `Product` + `Offer` | Manufacturer boilerplate only; fake ratings |
| **Profile / listing** | UGC entity | Index if unique and substantial | Real identity/content threshold | `ProfilePage` / `Product` as applicable | Thin empty profiles |
| **Location** | `/locations/{city}` | Index real locations | Unique NAP + local proof | `LocalBusiness` | City doorways with swapped names |
| **Legal** | privacy, terms | Index if they should be found | Accurate legal text | None | Marketing titles |
| **Auth / app / settings / billing admin** | login, dashboard | **`noindex`** | Functional title; no marketing SERP promises | None | Indexing account chrome |
| **Cart / checkout / thank-you / preview / share-token** | `/cart`, `?token=` | **`noindex`** | — | None | Sitemap inclusion |
| **Site search / empty facet / sort** | `?q=`, `?color=` | **`noindex`** or disallow combinatorial | — | None | Indexable parameter explosion |
| **Pagination** | `?page=2` | Index if the page has unique listed items | Self-canonical; `href` to next/prev | None | Canonical all pages to page 1 |

## App vs marketing

Keep marketing templates and authenticated shells on **different** title/robots defaults.

- Public marketing/docs: `index, follow` (or omit robots meta).
- Authenticated app: `noindex, nofollow` on the document, omit from sitemap.
- Public share of an otherwise private object: `noindex` unless the user explicitly wants it found.

## Must-include by job (every indexable URL)

1. Unique `<title>` and meta description (see [metadata.md](metadata.md)).
2. One H1 that matches the title’s promise. Write body and CTA with [copywriting.md](copywriting.md).
3. Primary copy in first HTML (see [rendering.md](rendering.md)).
4. Self-canonical (or explicit alternate) + sitemap membership.
5. Contextual internal links in and out (see [internal-linking.md](internal-linking.md)).
6. Absolute OG tags if the URL will be shared ([media.md](media.md)).
7. Schema only when the type matches visible facts ([structured-data.md](structured-data.md)).

## Isolation

Do not apply this table to email, native apps, or PDFs except `X-Robots-Tag` / HTTP canonical on downloadable files.
