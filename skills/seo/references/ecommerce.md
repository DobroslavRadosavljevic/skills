# Ecommerce and marketplace SEO

Apply on product, category, filter, search, seller/profile, review, cart, checkout, and account surfaces. Pair with merchant listings only when the page is a buyable offer.

Label claims **FACT** (cited official) vs **JUDGMENT** (agent procedure).

## Product pages

### Unique descriptions

**FACT.** Thin affiliation is affiliate pages that copy merchant descriptions/reviews with no original value, or cookie-cutter networks of the same content. Good affiliate/merchant pages add price context, original reviews, testing, navigation, or comparisons. Source: [Spam policies — Thin affiliation](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** Merchant Center requires a description that matches the landing page; no promo gimmicks, competitor dumps, or keyword stuffing. Source: [Product data specification](https://support.google.com/merchants/answer/7052112).

**JUDGMENT.** Write one unique, user-visible description per indexable product URL. Do not clone manufacturer boilerplate across SKUs that differ only by color. Shared spec tables are fine; the prose and title must distinguish the offer.

### Variants (color / size)

**FACT.** Product rich results support a page focused on a **single product** (including multiple variants of that product). Category “shoes in our shop” is not a specific product. Variants may each have a distinct URL. Prefer markup on product pages, not category lists. Source: [Merchant listing structured data](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).

**FACT.** Merchant listings require a nested `Offer` (merchant is the seller). `availability` is a single `ItemAvailability` value (`InStock`, `OutOfStock`, `PreOrder`, `BackOrder`, `Discontinued`, `SoldOut`, …). `offers.url` may be the preferred URL with the current variant selected; do not provide multiple URLs. Source: same page.

**FACT.** Feeds: variants share `item_group_id`; landing pages must show the **same** variant the listing advertised (color/size names must match). Source: [Product data specification](https://support.google.com/merchants/answer/7052112); [Optimize product data](https://support.google.com/merchants/answer/7380908).

**JUDGMENT — canonical strategy (pick one and apply consistently):**

1. **One URL per purchasable variant** when each variant has unique photos, inventory, or search demand. Self-canonical. `Product` + `Offer` for that SKU. Cross-link siblings. Shared `item_group_id` / `ProductGroup` in feeds and markup when you implement official variant types.
2. **One parent URL + query or path for options** when variants are interchangeable and thin. Canonical to the parent **or** to the selected variant URL if that URL is the shareable permalink. Do not emit a separate indexable URL per sort of combination that does not change the product.
3. Never canonicalize a buyable in-stock variant to an unrelated category. Never let session IDs or `utm_*` become canonicals.

If official variant markup docs 404 in the environment, implement `Product` + `Offer` on the URL the shopper buys from and keep feed `item_group_id` aligned. Do not invent undocumented types.

### Out of stock

**FACT.** Set `Offer.availability` to the real state (`OutOfStock` / `SoldOut` / `Discontinued` / `BackOrder` / `PreOrder`). Merchant Center: if out of stock, **price must still be visible**; availability on the page, checkout, and structured data must match the feed. Source: [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing); [Product data specification](https://support.google.com/merchants/answer/7052112); [High-quality data](https://support.google.com/merchants/answer/188489).

**JUDGMENT.** Keep the product URL live (200) while it may return. Show substitutes and restock policy. Use `410`/`404` only when the product is permanently gone and you will not sell it again. Do not `noindex` a temporarily OOS hero SKU solely because inventory is zero.

### Price and availability in Product + Offer

**FACT.** Put `Product` structured data in the **initial HTML** when optimizing for shopping results. Merchant listings: price > 0; active price on `offers.price` or `priceSpecification` (if both, Google uses `offers.price`). One availability value. Image URLs crawlable/indexable; prefer multiple high-res images (min ~50K pixels, 16:9 / 4:3 / 1:1). Source: [Merchant listing](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing).

**FACT.** Product snippets may use `Offer` or `AggregateOffer` and can include reviews/ratings. Markup must match visible content. Do not mark up fake reviews. Source: [Product snippet](https://developers.google.com/search/docs/appearance/structured-data/product-snippet); [Structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Relevant ecommerce types also include `BreadcrumbList`, `Organization`, `LocalBusiness`, `Review`, `VideoObject`. Source: [Ecommerce structured data](https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce).

Emit JSON-LD (preferred) on the product URL:

- `Product.name`, `description`, `image`, identifiers (`sku` / `gtin` / `mpn` when real)
- `brand`
- `offers`: `@type Offer`, `price`, `priceCurrency`, `availability`, `url`
- `aggregateRating` / `review` **only** if real, user-visible, policy-compliant (see Reviews)

## Category vs filters vs search results

**FACT.** Google infers importance from **links**, not URL folders. Link home → categories → subcategories → **every product you want indexed**. Googlebot generally does **not** submit site-search boxes. If products are only reachable via search, add `<a href>` paths, a sitemap, or a Merchant Center feed. Use real `<a>` tags, not JS-only click handlers. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**FACT.** Pagination: unique URL per page (`?page=n`); each page self-canonical (do not canonicalize page 2+ to page 1); no `#` for page numbers; sequential `<a>` next/prev; consider linking members back to page 1. “Load more” / infinite scroll: Google does not click buttons; expose crawlable URLs. Source: [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading); [Lazy-loaded content](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading).

**FACT.** Avoid indexing filter or alternate sort URLs (`?order=price`). Use `noindex` or robots.txt `Disallow` for those patterns. Source: [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).

**FACT.** Complex additive filters explode URL space and waste crawl. Source: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

| Surface | Index? | Procedure |
| --- | --- | --- |
| Category / collection with unique intro + browseable products | Yes | Unique title/H1/copy; breadcrumbs; paginated crawlable links; sitemap |
| Filter combo that is a real search demand (e.g. “red running shoes”) **and** unique content | Maybe | Treat as a curated landing page, not a raw facet dump. See faceted cookbook. |
| Arbitrary facet combinations, sorts, stock toggles | No | robots.txt and/or `noindex` + canonical to clean category |
| On-site **search results** (`?q=`) | No | `noindex` (and usually `nofollow` on the search URL itself). Do not sitemap. |
| Empty result sets | No | HTTP `404` on that URL if it is a filter combo with no items. Source: [Faceted navigation](https://developers.google.com/crawling/docs/faceted-navigation) |

**JUDGMENT.** Doorway-like city/keyword category clones violate [doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies). One useful hierarchy beats hundreds of near-duplicate landers.

## Thin UGC and marketplace entities

**FACT.** Scaled scraped/spun pages, doorway pages, and site reputation abuse are spam. UGC-first sites (forums, comments) are called out as **not** automatically reputation abuse. Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

**JUDGMENT — quality threshold (apply `noindex` until the entity is useful):**

| Entity | Index only if |
| --- | --- |
| Seller / shop profile | Unique about text, policies, and a real catalog — not a default username + zero listings |
| Buyer / user profile | Public, substantial, non-PII-leaking activity the site intends to rank |
| Listing with only a title and a stock photo | Never — require description + images + price |
| Tag / brand / attribute archive with no unique copy | `noindex` or 404 |

Do not block these URLs in robots.txt if you rely on `noindex` (rules are only seen when crawled). Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

## Reviews and AggregateRating

**FACT.** Review snippets need valid `Review` / `AggregateRating`. Aggregate reviews **must** supply the average rating. Markup must be visible, original, not misleading, not fake. Reviews/ratings not by actual users may cause manual action. Source: [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet); [Structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Editorial product reviews should show expertise, first-hand evidence, measurements, pros/cons, and qualify affiliate links (`rel="sponsored"`). Source: [Write high quality reviews](https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews); [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).

**Never:**

- Emit `AggregateRating` without real, countable, user-visible reviews
- Invent `ratingValue` / `reviewCount`
- Mark up reviews copied from other sites as first-party
- Mark up self-promotional “reviews” the merchant wrote about itself as customer ratings
- Incentivize star ratings as a ranking tactic

**JUDGMENT.** Nest ratings on the `Product` the shopper sees. Hide stars in JSON-LD only = policy violation (markup must match on-page content).

## Faceted navigation cookbook

Official: [Managing faceted navigation URLs](https://developers.google.com/crawling/docs/faceted-navigation); [Crawling December summary](https://developers.google.com/search/blog/2024/12/crawling-december-faceted-nav); [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

### Decide first

1. **Most facets: do not index.** Save crawl for product + clean category URLs.
2. **Rare curated facets: index** only if the URL is stable, unique, and linked from navigation (not only from a widget).

### If you do **not** need facets in Search

Pick the strongest control (in order):

1. **robots.txt `Disallow`** on filter parameter prefixes. Allow the unfiltered listing. Example pattern from Google: disallow `/*?*color=` while allowing a dedicated unfiltered list.
2. **URL fragments** for filters (`#color=red`) so crawl is unaffected. **FACT:** Google generally does not treat fragments as distinct pages. Do **not** use fragments if you need the filtered view indexed.
3. Weaker: `rel="canonical"` from filtered URL → unfiltered list (slow to reduce crawl).
4. Weaker: `rel="nofollow"` on **every** internal (and known external) link to that filtered URL.

### If you **do** need some facet URLs crawled

**FACT.**

- Use `=` and `&` for parameters. Avoid `:`, `[ ]` as separators.
- Keep path-encoded filter **order stable**; forbid duplicate filters.
- Empty / nonsense / duplicate-filter / bogus page numbers → **HTTP 404 on that URL**, not a redirect to a generic 404 page.
- Crawling facets always costs compute and can delay discovery of new products.

**JUDGMENT.**

- One parameter order in code (sort keys alphabetically).
- Indexable facet pages get unique titles and a short unique intro; still `noindex` sorts (`price_asc`) and pagination-of-filters unless necessary.
- Session IDs, `utm_*`, and action parameters (`?add-to-cart=`) never indexable.

### Action parameters

**JUDGMENT** aligned with [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure): cart-add, wishlist, print, share counters must not create new indexable URLs. Use POST or fragments; `noindex` if GET is required.

## Cart, checkout, account

**FACT.** `noindex` means do not show the page in results. `none` = `noindex, nofollow`. Rules are ignored if the URL is disallowed in robots.txt. Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

**JUDGMENT.** These URLs are not search destinations. Emit robots meta (or `X-Robots-Tag`) `noindex, follow` or `noindex, nofollow` on:

- `/cart`, mini-cart, drawers that have a URL
- checkout steps, payment, order-review
- login, register, password reset, magic-link
- account, orders, addresses, payment methods, wishlists (private)
- thank-you / receipt pages (PII)

Do **not** list them in sitemaps. Do **not** robots.txt-block them if you need `noindex` honored. Prefer `X-Robots-Tag` if the response is not HTML.

## Merchant listings / Google Shopping vs organic

**FACT.** Two complementary channels:

| Channel | What it is | Requirement |
| --- | --- | --- |
| Organic web results / product snippets | Normal Search + optional `Product` rich results | Crawlable HTML; structured data helps, not required to appear as a blue link |
| Merchant listing experiences | Shopping knowledge panel, popular products, richer product UI, Images annotations | Buyable on **your** site; `Product`+`Offer`; Google may verify data |
| Google Shopping **tab** | Shopping vertical | **Merchant Center participation required** |

Sources: [Share product data](https://developers.google.com/search/docs/specialty/ecommerce/share-your-product-data-with-google); [Merchant listings](https://developers.google.com/search/docs/appearance/structured-data/merchant-listing); [Merchant listings announcement](https://developers.google.com/search/blog/2022/09/merchant-listings).

**FACT.** Structured data improves understanding (price, discount, shipping) and can help Merchant Center **verify** the site against the feed. Feeds/API give control over completeness and freshness (hourly/immediate stock). Automated feeds from crawl exist for smaller/slower catalogs. Enable automatic item updates when site and feed can drift. Source: [Share product data](https://developers.google.com/search/docs/specialty/ecommerce/share-your-product-data-with-google); [High-quality data](https://support.google.com/merchants/answer/188489).

**Do not** invent Merchant Center API tutorials here. Official entry points only:

- Sign-up / product spec: [Merchant Center product data](https://support.google.com/merchants/answer/7052112)
- Search Central ecommerce hub: [Ecommerce best practices](https://developers.google.com/search/docs/specialty/ecommerce)
- Search Console: Merchant listings report vs Product snippets report

**JUDGMENT.** Implement on-page `Product`+`Offer` first (helps organic + verification). Add Merchant Center when the business wants Shopping tab / free listings at scale. Keep price/availability identical across HTML, JSON-LD, and feed.

## Sources

- https://developers.google.com/search/docs/specialty/ecommerce
- https://developers.google.com/search/docs/specialty/ecommerce/include-structured-data-relevant-to-ecommerce
- https://developers.google.com/search/docs/specialty/ecommerce/share-your-product-data-with-google
- https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- https://developers.google.com/search/docs/specialty/ecommerce/write-high-quality-reviews
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://developers.google.com/search/docs/appearance/structured-data/product-snippet
- https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/crawling/docs/faceted-navigation
- https://developers.google.com/search/docs/crawling-indexing/url-structure
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/essentials/spam-policies
- https://support.google.com/merchants/answer/7052112
- https://support.google.com/merchants/answer/188489
- https://support.google.com/merchants/answer/7380908
