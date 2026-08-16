# Information Architecture

Procedural rules for site topology, URLs, navigation, discovery, inventory, cannibalization, placement, and programmatic IA. Pair with [internal-linking.md](internal-linking.md) for anchors, equity, and the link-plan template.

Label every recommendation **FACT** (stated by a cited primary source) or **JUDGMENT** (practice inference). Do not treat PageRank formulas, “3-click laws,” or folder depth as ranking algorithms.

Research date: 2026-08-17.

## How to use this file

1. Inventory URLs before changing nav or folders.
2. Decide topology (hubs, clusters) before designing menus.
3. Design URLs for humans and crawlability, not as a substitute for links.
4. Make every indexable URL reachable by crawlable `<a href>` from another indexable URL.
5. Treat XML sitemaps as a hint, not discovery.
6. Place new URLs into an existing hub; write a link plan before publish.

## IA is not navigation

**FACT.** IA is the identification of content/functionality plus the organization, structure, and nomenclature that relate them. Navigation is the UI that exposes paths (global, local, utility, breadcrumbs, facets, related, footer). Define IA before locking a nav pattern. Source: [NN/g — IA vs navigation](https://www.nngroup.com/articles/ia-vs-navigation/).

**FACT.** Google infers site structure from **linkages**, not from URL folder trees. More internal links to a page generally imply higher relative importance on that site. Source: [Help Google understand your ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**JUDGMENT.** Do not nest directories to “explain” the site to Google. Nest when the path helps humans, ops, or locale routing.

---

## 1. Site topology

### Choose a model

| Model | Use when | Do not use when |
| --- | --- | --- |
| **Hub-and-spoke / topic cluster** | One pillar page owns a topic; spokes cover subtopics; both directions link in context | You need isolated products with no shared language |
| **Hard silo** | Legal/brand walls require zero cross-links (rare) | You are isolating categories only to “protect” keyword equity |
| **Flat** | Small site, few templates, every URL 1–2 clicks from home | Hundreds of URLs with no grouping — nav becomes a dump |
| **Deep** | Large catalog or docs with real parent/child meaning | Depth exists only because CMS folders accumulated |

**JUDGMENT.** Prefer **topic clusters** over hard silos. Cross-link when the reader’s next question lives in another cluster. Hard silos (no cross-category links) starve discovery and create orphans.

**FACT.** Google discovers URLs from known pages’ links, from sitemaps, and from prior crawls. A hub that links to a new URL is an official discovery path. Source: [How Google Search works](https://developers.google.com/search/docs/fundamentals/how-search-works).

### Hub and spoke (do this)

1. Create one **hub** (pillar) per durable topic: unique job, unique title, unique primary query family.
2. List every spoke the hub must cover. Each spoke is a distinct intent, not a synonym page.
3. Link hub → every live spoke with descriptive anchors in the body or a curated list (not only a tag cloud).
4. Link each spoke → hub once in context (“part of {topic}”).
5. Link spoke → 2–5 sibling spokes when the next task is real. Skip forced meshes.
6. Promote the hub from home, primary nav, or a parent hub — not only from the sitemap.

### Orphan pages

An **orphan** is an indexable URL with **no inbound internal `<a href>`** from another crawlable, indexable page.

**FACT.** Every page you care about must have a link from at least one other page. Googlebot treats each URL independently; it finds new URLs by extracting links. Sources: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [SEO guide for developers](https://developers.google.com/search/docs/fundamentals/get-started-developers).

**FACT.** Googlebot generally does **not** submit site search boxes. Products only reachable via search are not discovered by crawl. Use category links, sitemaps, or a Merchant Center feed as backup — links first. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

Procedure:

1. Build the URL set (see §7).
2. Parse rendered HTML for `<a href>` (not `onclick`, not `routerLink` without `href`).
3. Normalize to canonical URLs (scheme, host, trailing slash, params).
4. Mark orphans: in sitemap or CMS, not in the internal-link graph.
5. Fix by adding contextual or hub links. Do not “fix” orphans with sitemap-only inclusion.

### Crawl depth (clicks from home)

**FACT.** Google can use how many links it must follow to reach a page, and how many links point to a page, as signals of relative importance. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**JUDGMENT.** Measure **shortest path in the internal-link graph from the homepage** (and from other high-inlink hubs). Target important money/hub URLs at depth 1–2. Allow docs/SKU leaves deeper if hubs and breadcrumbs connect them.

### The “3-click rule” is a heuristic, not a law

**FACT.** The 3-click rule is not supported by published usability data. Users do not abandon at click 4. Click count ignores wait time, errors, and scent. Forcing ≤3 clicks produces overly **broad** top nav that is harder to scan. Source: [NN/g — The 3-click rule is false](https://www.nngroup.com/articles/3-click-rule/).

**FACT.** Users follow **information scent** (label + surrounding context + prior knowledge), not click budgets. Source: [NN/g — Information scent](https://www.nngroup.com/articles/information-scent/).

**Do this instead of counting 3:**

1. Name nav items with the user’s words (strong scent). Avoid vague/branded labels.
2. Surface the highest-value tasks from home and hubs.
3. Provide wayfinding (breadcrumbs, local nav, hub landing pages) on multi-step paths.
4. Prefer mega-menus over hover-cascades when the tree is wide. Source: [NN/g 3-click](https://www.nngroup.com/articles/3-click-rule/).
5. Validate IA with card sorting (generate) then tree testing (evaluate). Source: [NN/g — Tree testing](https://www.nngroup.com/articles/tree-testing/).

---

## 2. URL architecture

### Requirements (crawlable URLs)

**FACT.** Follow IETF STD 66; percent-encode reserved and non-ASCII characters in `href`. Do not use fragments (`#`) to change content — Google generally does not treat fragments as distinct pages. Use `=` / `&` for parameters. Prefer hyphens over underscores. URLs are **case-sensitive**. Minimize parameters that do not change content. Sources: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

**FACT.** Complex parameter combinations create huge URL spaces; Googlebot may overcrawl or miss unique content. Additive filters, session IDs, sort params, and infinite calendars are named failure modes. Source: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

### Folders as meaning

**JUDGMENT.** Use a folder when it is a **stable noun** users and authors share: `/docs/`, `/blog/`, `/de/`, `/products/shoes/`.

**FACT.** Google generally does **not** derive site structure from URL paths; it uses links. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**When not to nest (SEO theater):**

- Do not add `/category/subcategory/sub-sub/` solely to stuff keywords into the path.
- Do not mirror a 6-level CMS tree in the public URL if the public IA is 2–3 levels.
- Do not create a new folder for every campaign (`/q3-promo/seo-tips/`) if the content belongs under an existing hub.
- Do not change folders later “for SEO” without 301s — you reset the URL identity.

Pick a **shallow public tree**. Keep deep taxonomy in nav, breadcrumbs, and internal links.

### Dates in blog URLs

| Pattern | Tradeoff |
| --- | --- |
| `/blog/how-to-x` | **JUDGMENT.** Default for evergreen. Easier to update in place. |
| `/blog/2026/08/how-to-x` | **JUDGMENT.** Useful for news/docs that are time-bound. Signals age in the URL; updates look stale; moving off the date requires redirects. |
| `/blog/2026/how-to-x` | Weaker than full dates; still dates the asset. |

**Do not** put dates in the path “so Google knows freshness.” Freshness is content and recrawl, not the folder. If you date URLs, commit to 301s when you rewrite history.

### Locale prefixes

**FACT.** Recommended patterns: ccTLD (`https://example.de`) or gTLD subdirectory (`https://example.com/de/`). Tell Google about variants with bidirectional `hreflang` (HTML, HTTP header, or sitemap — pick one). Google does **not** use the subdirectory name or `lang` attribute to detect language; it uses algorithms. Localized pages are duplicates only if **primary content** is untranslated. Sources: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure), [Localized versions](https://developers.google.com/search/docs/specialty/international/localized-versions).

**Do this:**

1. One host strategy per site (subdirectory vs subdomain vs ccTLD). Do not mix without a migration plan.
2. Prefix locale as the **first** path segment: `/{locale}/…`.
3. Reciprocal `hreflang` including self; add `x-default` for language selectors / unmatched locales.
4. Canonicalize each locale to **itself**, not to the default language.
5. Link language switchers with crawlable `href`s to the equivalent URL, not JS-only.

### Trailing slash

**FACT.** Google treats distinct URLs as distinct (case-sensitive HTTP). `/foo` and `/foo/` are different URLs if both 200. Source: [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure) (case); treat slash the same way — pick one identity.

**Do this:**

1. Choose directory-style (`/guide/`) or file-style (`/guide`) site-wide.
2. 301 the other to the chosen form.
3. Self-canonical and all internal links use the chosen form only.
4. Do not mix in sitemaps.

### Parameters you may keep in the public URL

Keep a parameter only if it **changes primary content** you want indexed (e.g. `?page=2` on a paginated series). Drop tracking, session, and sort params from canonicals. See §10.

---

## 3. Navigation

**FACT.** Menus and cross-page links affect how Google understands relationships and importance. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**FACT.** IA work includes inventory, audit, grouping, taxonomy, and metadata for related links — then nav components are chosen. Source: [NN/g — IA vs navigation](https://www.nngroup.com/articles/ia-vs-navigation/).

### Layers

| Layer | Job | SEO role |
| --- | --- | --- |
| **Primary / global** | Reach top tasks and hubs | High-inlink to few URLs. Keep short. |
| **Local / section** | Siblings and children in the current cluster | Discovers spokes without stuffing global nav |
| **Utility** | Login, account, language, help, cart | Often noindex or low value — do not let these dominate crawl |
| **Footer** | Legal, contact, secondary hubs, locale | Useful repeats; do not dump the sitemap |
| **Breadcrumbs** | Hierarchy trail | Hierarchical links + `BreadcrumbList` |
| **Contextual / related** | Next-task links in the body | Strongest relevance signal per URL |

### SEO vs UX

**JUDGMENT.** If a link helps a human finish a job, keep it. If it exists only to pass equity or stuff keywords, remove it.

**FACT.** Hidden links (off-screen, 0 opacity, 1px, white-on-white) are spam when the intent is manipulation. Accordion/tab content that users can reveal is allowed. Source: [Spam policies — hidden text and link abuse](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** Doorway-like sets of near-duplicate pages that only funnel users are spam. Source: [Spam policies — doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies).

### Noindex pages in nav

**FACT.** `noindex` blocks indexing. If Google cannot crawl the page (robots.txt), it may not see `noindex`. Source: [Robots meta tag](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag) (see also crawl-budget inventory notes).

**JUDGMENT.**

- **Do not** put `noindex` URLs in primary nav. They consume crawl and user attention without becoming results.
- Utility links (login, cart) may stay in utility chrome; prefer `robots.txt` or `noindex` on the **targets**, not a forest of nav entries.
- If a page is `noindex`, do not list it in the XML sitemap.

### Mega-menus

**FACT (UX).** Mega-menus show multiple IA levels at once and beat hover-cascades for wide trees. Source: [NN/g 3-click](https://www.nngroup.com/articles/3-click-rule/).

**Do this:**

1. Render menu links as real `<a href>` in the HTML Google can see after render (test URL Inspection).
2. Link to **hubs and key leaves**, not every SKU.
3. Cap unique URLs in global chrome. Hundreds of footer+mega links on every template is a crawl hog.

### Resource-hog crawl (nav and chrome)

**FACT.** Crawl budget = capacity limit × demand. Waste inventory (duplicates, infinite facets, soft 404s, session URLs) steals recrawl from URLs you care about. Hostnames have **separate** budgets. Most small sites should not obsess; large/fast-changing sites should. Sources: [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget), [Crawling infrastructure crawl budget](https://developers.google.com/crawling/docs/crawl-budget).

**FACT.** Google recommends consolidating duplicates, eliminating soft 404s, keeping sitemaps accurate, and blocking URLs you do not want crawled (facets, infinite calendars, carts, action pages) with robots.txt when they should stay out of Google long-term. Source: [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).

**Do this:**

1. Count distinct `href`s in header + footer + mega-menu on a typical template.
2. If chrome exposes thousands of parameterized or thin URLs, cut them.
3. Block filter/sort/session patterns in robots.txt; do not rely on nav nofollow alone. Source: [Faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation).
4. Reuse static asset URLs so Google can cache. Source: [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).
5. Watch Search Console: **Discovered – currently not indexed** and Crawl Stats. Source: [Crawl Stats](https://support.google.com/webmasters/answer/9679690).

---

## 4. Breadcrumbs (UI + BreadcrumbList)

**FACT.** A breadcrumb shows position in the hierarchy. Google may show `BreadcrumbList` in results. Recommend trails that represent a **typical user path**, not a mirror of the URL. The site hostname and the current page `ListItem` are optional. Last item may omit `item` (Google uses the page URL). Multiple trails are allowed when multiple paths exist. Sources: [Breadcrumb structured data](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb), [schema.org/BreadcrumbList](https://schema.org/BreadcrumbList).

**Do this:**

1. Show a visible trail: `Hub › Section › Page` (current page not a link, or linked to self consistently).
2. Each ancestor is a crawlable `<a href>` to the **canonical** hub/section URL.
3. Emit JSON-LD (or RDFa/microdata) `BreadcrumbList` whose `name`, `position`, and `item` **match the visible trail**.
4. Use absolute `https://` URLs in `item`.
5. Do not invent a richer trail in JSON-LD than the UI.
6. Do not mark up a fake trail that contradicts local nav.
7. Validate with [Rich Results Test](https://search.google.com/test/rich-results); pages must be crawlable (not robots-blocked, not `noindex` if you want the feature).

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Guides",
      "item": "https://example.com/guides"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Billing",
      "item": "https://example.com/guides/billing"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "Proration"
    }
  ]
}
```

---

## 5. XML sitemap vs HTML sitemap vs internal links

**FACT.** Discovery order in practice: **links on known pages**, then sitemaps, then recrawl of known URLs. Most pages listed in results were found automatically, not submitted. Source: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works).

**FACT.** If important pages are linked through navigation or in-page links, Google can usually discover them. A sitemap **helps** large, new, poorly linked, or media/news sites. A sitemap is a **suggestion**, not a crawl command. Do not include URLs you do not want in Search. Sources: [Sitemaps overview](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).

| Mechanism | Role | Include |
| --- | --- | --- |
| **Internal `<a href>`** | Primary discovery + relationship + importance | All indexable canonicals you care about |
| **XML sitemap** | Hint inventory + `lastmod` + hreflang/news/video extras | Canonical, 200, indexable URLs only |
| **HTML sitemap** | Human A–Z / section index | Optional. Link from footer. Do not replace hubs. |

**Do this:**

1. Never ship an indexable URL that exists only in XML.
2. Keep sitemap URLs = canonicals; same slash/host/scheme as internal links.
3. HTML sitemap: group by hub, cap page size, paginate if huge. It is a **utility**, not a ranking hack.
4. After publish: add links first, then sitemap row, then request indexing if needed.

---

## 6. Content inventory and interlink audit (agent procedure)

Follow NN/g’s IA sequence: inventory → audit → grouping → taxonomy → metadata for related links. Source: [IA vs navigation](https://www.nngroup.com/articles/ia-vs-navigation/).

### Step A — Map URLs

Collect from all of:

1. XML sitemap(s) and sitemap index.
2. CMS / route table / `llms.txt` / static export.
3. Server logs or Search Console **pages** (indexed + discovered).
4. A crawler that follows only crawlable `<a href>` (rendered DOM if JS-rendered).

Normalize each row:

```
url_raw
url_canonical          # after redirects + declared rel=canonical
http_status
indexable              # robots, meta, x-robots, canonical mismatch
template
hub                    # assigned cluster
primary_intent         # one sentence
title / h1
inlinks_internal
outlinks_internal
depth_from_home
in_xml_sitemap
orphan
competing_urls         # same intent (see §7)
```

### Step B — Find orphans

1. Graph: edge = crawlable internal `href` to an indexable 200 canonical.
2. Orphan = indexable URL with in-degree 0 (excluding self, sitemap, and Search Console-only).
3. Soft-orphan = only linked from footer/HTML sitemap, never from a hub or body.

Fix soft-orphans with hub or contextual links, not more footer spam.

### Step C — Find competing pages (cannibalization)

Group by **intent**, not by shared word:

1. Cluster titles/H1s/search queries (GSC queries → pages).
2. Flag 2+ indexable URLs that target the same job (“what is X”, “X pricing”, same product).
3. Distinguish **legitimate variants** (locale, pagination page 2, filtered **unique** category) from **duplicates**.

### Step D — Recommend links

For each important URL, propose:

- 1 hub parent (must exist).
- 3–7 inbound contextual links from existing relevant URLs (see [internal-linking.md](internal-linking.md)).
- 2–5 outbound contextual links to hubs/siblings/commercial or educational counterparts.
- Breadcrumb ancestors.

Reject recommendations that are exact-match spam, footer-only, or cross-link every page to every page.

### Step E — Deliverable

Output a table + a per-URL link plan (template in [internal-linking.md](internal-linking.md)). Do not change URLs until cannibalization and redirects are decided.

---

## 7. Cannibalization

### Detect

Signals (use several):

- Same primary query in GSC for two URLs, impressions split, ranks swap.
- Near-duplicate H1/title/body (canonicalization cluster).
- Two hubs for one product (“Guide to X” and “X 101”).
- Parameter and clean URL both 200 and indexable.

**FACT.** Google clusters similar pages and picks one canonical. `rel=canonical`, redirects, HTTPS, and sitemap inclusion are **hints**; Google may override. Duplicates are not automatically spam; they waste crawl and split metrics. Sources: [What is canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization), [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

### Decide the treatment

| Situation | Action |
| --- | --- |
| Same content, two URLs | **301** the extra URL to the keeper. Strongest signal. |
| Thin/outdated page, better page exists | Merge unique paragraphs into the keeper, then **301**. |
| Same intent, both have unique sections | **Rewrite** into one URL; 301 the other. |
| True duplicates you must keep (print, params, tracking) | `rel=canonical` to keeper; **link internally only to the keeper**. |
| Temporary duplicate (A/B, promo) | Temporary redirect (302/307) if the old URL should stay in results. |
| Page should not exist in Search | `noindex` or 404/410 — **not** as a canonicalization method. |
| Locales with translated body | Not duplicates. Use `hreflang` + self-canonical. |

**FACT.** Signal strength for preferring a canonical: **redirects > rel=canonical > sitemap inclusion**. Combine methods. Do not use robots.txt or the removals tool to canonicalize. Do not use `noindex` to pick a canonical among duplicates on your site. Link to the canonical. Self-canonical on the keeper. Sources: [Consolidate duplicate URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls), [Redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects).

**FACT.** Permanent `301`/`308` (and instant meta refresh) signal the **target** should be canonical. Temporary `302`/`307` (and delayed meta refresh) keep the **source** as the results URL more often. Prefer server-side redirects. Source: [Redirects](https://developers.google.com/search/docs/crawling-indexing/301-redirects).

**Rewrite** when neither URL is a clean keeper: pick the better path, merge, 301 the rest, update all internal `href`s in the same change.

---

## 8. New content placement

Before drafting, lock:

1. **Hub.** Which existing pillar owns this intent? If none, you are proposing a **new hub** (nav + homepage implications). Do not create a floating URL.
2. **URL.** Live under that hub’s public folder/locale. No extra nesting for keywords.
3. **Cannibal check.** Search the inventory for the same intent. Merge or differentiate.
4. **Inbound (3–7 pages must link to it).** Prefer: the hub, 2–4 closest spokes, 1 commercial or educational counterpart, optionally home/nav if it is a top task. See link plan in [internal-linking.md](internal-linking.md).
5. **Outbound (it must link out).** Hub, 2–4 next-step pages, one conversion URL **if** the page is educational and the product is the honest next step.
6. **Chrome.** Breadcrumb ancestors. Local nav entry if the section lists children.
7. **Sitemap.** Add after the URL returns 200 with self-canonical.

**FACT.** Linking a best seller from home or from articles helps Google understand importance relative to the rest of the site. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

Do not publish with sitemap-only discovery.

---

## 9. Programmatic / marketplace IA

### Facets and parameters

**FACT.** Faceted parameter URLs can explode into infinite spaces: overcrawl + slower discovery of useful URLs. If you do **not** need filters in Search, **prevent crawling** (robots.txt on filter params, or fragment-based filters which do not create new crawl URLs). `rel=canonical` to the unfiltered URL and `rel=nofollow` on filter links are **weaker** long-term than robots.txt / fragments. If you **do** need some facet URLs indexed, use `&` separators, stable path order, no duplicate filters, and **404** empty/nonsensical combinations (do not 302 them to a generic 404 page). Sources: [Faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation), [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

### noindex + follow vs canonical to clean URL

| Goal | Mechanism |
| --- | --- |
| Filter/sort URL must never appear in Search; products on it should still be found | Prefer **robots.txt** if you do not need Google to read the page. If the page must be crawled so links are seen: allow crawl + `noindex` (and still link products with normal `href`). |
| Filter URL is a duplicate of a clean listing | `rel=canonical` to the clean listing. Stronger than `noindex` for **dedup**. Google: do not use `noindex` to choose a canonical. Source: [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls). |
| Facet is a **real unique inventory** (e.g. `/shoes/red` with unique copy and demand) | Give it a **clean indexable URL**, unique intro, hub links, sitemap row. Do not canonicalize it away. |
| Session, `gclid`, sort=`price` | Canonical to clean URL **and** strip from internal links. Block sort/session in robots.txt if they proliferate. |

**FACT.** `rel=canonical` is a hint. Google may still pick another URL. Source: [Canonicalization](https://developers.google.com/search/docs/crawling-indexing/canonicalization).

**FACT.** Pagination pages are **not** duplicates of page 1. Unique URL per page; self-canonical each page; sequential `href` to next; consider linking back to page 1. Do not use `#page=2`. Block filter/sort variants of the list. Infinite scroll / “load more” without crawlable page URLs hides items. Sources: [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).

### Marketplace rules

1. Category → subcategory → **every** indexable product via links (paginate with real URLs).
2. Do not rely on on-site search for discovery.
3. One product = one canonical; variants (color/size) either unique content or canonical to the parent.
4. Merchant Center / sitemap **supplements** crawl; it does not replace category links. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).
5. Return 404 for empty facet combos. Source: [Faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation).

---

## 10. Hard rules

1. **Links discover; sitemaps hint.** Do not ship indexable orphans.
2. **Crawlable links only:** `<a href="https://…">` or root-relative URI. No JS-only navigation for anything you want crawled. Source: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).
3. **Link to indexable canonicals** (https, chosen host, chosen slash, no junk params). Source: [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).
4. **Google does not sell crawl or rank.** Source: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works).
5. **No doorway farms**, no hidden links, no keyword-stuffed anchors. Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies).
6. **Do not treat folder depth or 3 clicks as ranking law.** Sources: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure), [NN/g 3-click](https://www.nngroup.com/articles/3-click-rule/).
7. **IA before nav chrome.** Source: [NN/g IA vs navigation](https://www.nngroup.com/articles/ia-vs-navigation/).
8. **One intent → one indexable URL.** Merge extras with 301 or canonical, then fix links.
9. **Facets:** block or canonicalize; 404 empty sets; index only unique, demanded listings.
10. **Locales:** self-canonical + reciprocal hreflang; do not canonicalize `de` to `en`.
11. **Breadcrumb JSON-LD matches visible trail.** Source: [Breadcrumb SD](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).
12. **Crawl-budget work is for large or explosive URL spaces**, not 50-page brochure sites. Source: [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).
13. **New URL:** assign hub + 3–7 inbound links + outbound next steps **before** publish.

Link-plan template: [internal-linking.md](internal-linking.md).

---

## Sources

- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/crawling-indexing/url-structure
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget
- https://developers.google.com/crawling/docs/crawl-budget
- https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/301-redirects
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/fundamentals/how-search-works
- https://developers.google.com/search/docs/fundamentals/get-started-developers
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- https://developers.google.com/search/docs/specialty/international/localized-versions
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://support.google.com/webmasters/answer/9679690
- https://schema.org/BreadcrumbList
- https://www.nngroup.com/articles/ia-vs-navigation/
- https://www.nngroup.com/articles/3-click-rule/
- https://www.nngroup.com/articles/information-scent/
- https://www.nngroup.com/articles/tree-testing/
- https://www.nngroup.com/articles/ia-study-guide/
