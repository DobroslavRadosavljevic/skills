# Internal Linking

Procedural rules for anchors, link placement, hubs, equity-as-intuition, robots attributes, pagination, commercial↔educational links, audits, and the reusable link plan. Pair with [information-architecture.md](information-architecture.md) for topology, URLs, nav, breadcrumbs, sitemaps, and cannibalization.

Label every recommendation **FACT** (cited primary source) or **JUDGMENT** (practice inference). Do not invent PageRank coefficients or claim a secret Google formula.

Research date: 2026-08-17.

## How to use this file

1. Only emit crawlable `<a href>` to **indexable canonical** URLs.
2. Write descriptive anchors in body copy first; treat nav/footer as chrome, not the strategy.
3. For every new URL, fill the **link plan** template before publish.
4. Almost never `nofollow` internal links.
5. After changes, re-crawl the graph: no new orphans, no new cannibal pairs.

---

## 1. Make the link crawlable

**FACT.** Google generally extracts links only from `<a href="…">` where `href` is a resolvable URI. Do not rely on `<a routerLink>` without `href`, `<span href>`, or `onclick` / `javascript:` navigators. Fragments that only change in-page state are not new URLs. Test JS-inserted anchors with URL Inspection (rendered HTML). Sources: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [URL structure](https://developers.google.com/search/docs/crawling-indexing/url-structure).

**FACT.** Image links use the `img` `alt` as anchor text. Empty `<a>` may fall back to `title`. Source: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

**Do this:**

```html
<a href="/guides/billing/proration">How proration works on invoices</a>
```

**Do not:**

```html
<a onclick="go('/guides/billing/proration')">click here</a>
<a href="javascript:void(0)">proration</a>
```

---

## 2. Descriptive anchors

**FACT.** Anchor text tells people and Google about the target. Good anchors are descriptive, reasonably concise, and relevant to **both** the source page and the target. Surrounding words matter. Do not chain many links with no prose between them. Do not cram every keyword (keyword stuffing is spam). Generic “click here” / “read more” / “learn more” is called out as bad. Sources: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Spam policies — keyword stuffing](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** Users choose links by **information scent** (label + context + prior knowledge). Vague labels waste clicks. Source: [NN/g — Information scent](https://www.nngroup.com/articles/information-scent/).

| Avoid | Prefer |
| --- | --- |
| click here, read more, learn more, this page, link | the noun/verb of the target’s job |
| `best cheap red running shoes sale` (stuffed) | `red running shoes` or `how we price rush shipping` |
| same exact-match phrase on 40 pages | natural variants that still name the topic |
| adjacent links: `A B C D` with no sentence | one link per clause, prose between |

**JUDGMENT.** Exact-match anchors are fine **once, in context**. Repeating the same commercial phrase sitewide is stuffing theater. Brand or URL-as-anchor is fine for home/legal.

**Check:** Would a screen-reader user know the destination from the link text alone? If not, rewrite.

---

## 3. Where the link lives (weight as intuition)

**FACT.** Google uses links to find pages and as a **relevancy** signal. Internal anchor quality helps people and Google understand the site. Every page you care about needs ≥1 inbound internal link. Source: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable).

**FACT.** Google analyzes relationships via menus and cross-page links. More internal links to a page generally raise its **relative importance on that site**. Link count-to-reach a page can also inform importance. This is not a published PageRank formula. Source: [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure).

**JUDGMENT.** Treat “equity” as: **relevant, trusted, crawlable links from stronger pages help discovery and topical association.** Do not allocate a numeric “PR juice” budget. Do not build footer farms to “pass equity.”

| Placement | Typical job | Equity intuition |
| --- | --- | --- |
| **Body / contextual** | Next step in the reader’s task | **Highest.** Unique, relevant, rare. Prioritize these. |
| **Hub lists** | Curated inventory of spokes | High for discovery. Keep editorial, not auto-dump of 500 tags. |
| **Local nav** | Siblings in the section | Medium. Repeated on the section template. |
| **Breadcrumbs** | Ancestors | Medium. Hierarchical, consistent. Must match UI. See [information-architecture.md](information-architecture.md). |
| **Related / “people also read”** | Lateral discovery | Medium if relevant; **zero** if random or recency-only. |
| **Primary nav** | Few top tasks | High **in-degree** to a tiny set. Do not stuff. |
| **Footer** | Legal, contact, secondary hubs | Low per URL; sitewide repetition. Do not use as the only inbound path. |
| **XML sitemap** | Hint | **Not a link.** Does not replace `href`. |

**FACT.** Hidden links aimed at engines are spam. User-toggled UI (tabs, accordions) is allowed. Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies).

**Do this:** Put the 3–7 launch links for a new URL in **body or hub lists** of related pages, not only in the footer.

---

## 4. Hub pages and spoke pages

**JUDGMENT.** A **hub** (pillar) is the best single URL for a topic family. A **spoke** is a narrower intent that the hub should introduce.

### Hub obligations

1. Unique intent (not a clone of a spoke).
2. Crawlable list or narrative links to **every live spoke**.
3. Updated when a spoke ships or dies (remove 404s).
4. Inbound from home, primary/local nav, or a parent hub.
5. Outbound to the commercial URL if the hub is educational and the product is the real next step (once, honest).

### Spoke obligations

1. One contextual link to the hub.
2. 2–5 sibling links when the next question is real.
3. No requirement to link every other spoke (that is a doorway-shaped mesh).

**FACT.** Creating many similar pages that are closer to search results than a browseable hierarchy, or that only funnel users, is **doorway abuse**. Source: [Spam policies — doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies).

**FACT.** Google’s own discovery example: a hub (e.g. category) linking a new post. Source: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works).

---

## 5. Equity / PageRank-as-intuition

State only what is documented:

**FACT.**

- Links are used for discovery and relevancy. [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
- On-site, more links to a URL and fewer hops from important pages can imply relative importance. [Ecommerce site structure](https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure)
- Canonicalization **consolidates signals** (including links to duplicates) onto the canonical. [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- Qualified outbound links (`nofollow` / `sponsored` / `ugc`) exist so paid or untrusted links do not pass ranking credit. [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links), [Spam policies — link spam](https://developers.google.com/search/docs/essentials/spam-policies)
- Google does not accept payment to crawl more or rank higher. [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works)

**Do not claim:** damping factors, “10% leak,” toolbar PageRank, or that footer links pass 0.00x.

**JUDGMENT — operate like this:**

1. Concentrate in-degree on hubs and money pages that deserve it.
2. Give every indexable URL **some** in-degree from a relevant neighbor.
3. Prefer fewer, relevant contextual links over sitewide blocks of 100 “related” URLs.
4. After a 301, update internal `href`s to the target so you are not depending on redirect equity forever.
5. Do not sell or trade internal links; do not build pages **for** linking. That is link spam when the purpose is manipulation. [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)

---

## 6. Link to indexable canonical URLs only

**FACT.** Linking consistently to the URL you want canonical helps Google honor that preference. Do not specify conflicting canonicals (sitemap vs `rel=canonical`). Self-canonical on the keeper. Sources: [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls).

**Before inserting an `href`:**

1. Resolve redirects; use the **final** URL.
2. Match scheme (`https`), host (`www` or apex), trailing slash policy, and case.
3. Strip tracking, session, and sort params.
4. Confirm the target is `200`, not `noindex`, not robots-blocked if you want it indexed, and self-canonical (or canonical to itself).
5. Do not link to `/page?utm=…`, print views, or the non-canonical locale duplicate.

**FACT.** If you `noindex` a URL, it should not be in the sitemap; it is a poor primary nav target. See [information-architecture.md](information-architecture.md).

---

## 7. Internal `nofollow`: almost never

**FACT.** `rel="nofollow"` (and `sponsored`, `ugc`) tells Google not to treat the link as an endorsement / ranking credit. Use `nofollow` when you **do not trust** the target; use `sponsored`/`nofollow` when paid; use `ugc`/`nofollow` on user-inserted links. Do **not** nofollow every external link. Source: [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Qualify outbound links](https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links).

**FACT.** `nofollow` on **all** anchors to a faceted URL is a weak, incomplete way to manage facet crawl. robots.txt or fragments are preferred. Source: [Faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation).

**FACT.** Crawl-budget guidance: reduce crawling of carts, infinite-scroll duplicates, and action pages (sign up / buy now) when they should not consume inventory — typically **robots.txt** for long-term exclusion, not a sprinkle of nofollow. Source: [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).

**JUDGMENT — internal nofollow is allowed only when:**

| Target | Prefer | Internal nofollow? |
| --- | --- | --- |
| Login, account, checkout, cart | `robots.txt` or `noindex` on those URLs | Optional on the `href` if you still show the link and want a belt-and-suspenders hint. Not a substitute for robots/noindex. |
| Faceted/sort/session URLs you will not index | robots.txt or canonical to clean URL | Only if every in-link is nofollowed **and** you still need the `href` for users. Prefer not generating the crawlable URL. |
| Paginated series you want indexed | normal follow | **No.** |
| Ordinary articles, products, hubs | follow | **Never nofollow.** |
| Internal search result URLs | robots.txt | Yes if they leak into templates. |

**Do not** nofollow internal links “to sculpt PageRank.” That model is obsolete practice and fights discovery.

Page-level `nofollow` in robots meta applies to **all** links on that page — do not use it on a hub.

---

## 8. Pagination, related posts, “people also read”

### Pagination

**FACT.**

- Use sequential crawlable `<a href>` to the next page (and preferably previous).
- Unique URL per page (`?page=n` or `/page/n/`). Self-canonical **each** page — do **not** canonicalize page 2+ to page 1.
- Do not use `#page=2` (fragments ignored).
- Link collection members back to page 1 to hint the start of the series.
- Block filter/sort variants of the same list (`noindex` or robots.txt).
- “Load more” / infinite scroll that only runs on click/scroll is **not** crawled as extra URLs unless you also expose `href` pages (or sitemap/feed).

Source: [Pagination and incremental loading](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading).

**JUDGMENT.** Rel=prev/next is not a current Google-supported pairing mechanism; sequential `href`s are the requirement. Do not cite prev/next as a ranking feature.

### Related posts / “people also read”

**JUDGMENT.**

1. Rank candidates by **task overlap** (same hub, next step), not by publish date alone.
2. Cap 3–5 links. Each needs a descriptive title-as-anchor.
3. Exclude: the current URL, `noindex`, non-canonical, thin, and cannibal twins.
4. If the algorithm cannot beat a human list, use a hand-curated hub list.
5. Do not inject related blocks that are keyword-stuffed or identical on every template (link-spam-shaped). [Spam policies — link spam](https://developers.google.com/search/docs/essentials/spam-policies) (low-value pages created to manipulate linking).

---

## 9. Cross-link commercial ↔ educational (no doorways)

**Allowed pattern (JUDGMENT, aligned with doorway/spam FACTS):**

- Educational spoke → **one** honest product/pricing/signup link when the reader’s next job is to buy. Anchor names the product or action, not a stuffed query.
- Product page → **one or few** guides that reduce purchase risk (setup, limits, comparison you actually support).
- Hub can list both “learn” and “use” children if labels are clear.

**Forbidden (FACT — doorway / scaled / stuffed):**

- Dozens of near-duplicate “{city} {service}” or “{keyword} guide” pages that only exist to funnel to one checkout. [Doorway abuse](https://developers.google.com/search/docs/essentials/spam-policies)
- Guides that are search-result-shaped with no unique hierarchy or usefulness.
- Hidden or 1-character commercial links. [Hidden link abuse](https://developers.google.com/search/docs/essentials/spam-policies)

**Check:** If you deleted the educational page, would a user lose information? If no, it is a doorway. If yes, keep it and link both ways once.

---

## 10. Breadcrumbs as links

Implement UI + `BreadcrumbList` per [information-architecture.md](information-architecture.md).

**Link rules:**

1. Ancestor crumbs are normal follow links to canonical hubs.
2. Markup `item` URLs = visible `href`s.
3. Do not breadcrumb to `noindex` or parameterized duplicates.

---

## 11. Sitemaps vs links (discovery)

**FACT.** Internal links are the primary way Google finds URLs. Sitemaps help large, new, or weakly linked sites and are **suggestions**. Include only URLs you want crawled/indexed. Sources: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works), [Sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview), [Crawl budget](https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget).

HTML sitemaps: optional human index. Never the only inbound path for a money URL.

---

## 12. Interlink audit procedure (agent)

Run after or with the inventory in [information-architecture.md](information-architecture.md).

### 1. Build the graph

1. Fetch rendered HTML (or static HTML if no JS nav).
2. Extract `<a href>`, resolve relative to page URL, drop `mailto:`, `tel:`, `#` only.
3. Map each target through redirect chain → declared canonical.
4. Keep edges to same registrable domain (and locale prefix if you analyze one locale).

### 2. Orphans and sinks

- **Orphan:** indexable canonical, in-degree 0.
- **Sitemap-only:** in XML, in-degree 0.
- **Chrome-only:** in-degree >0 but every source is header/footer/HTML sitemap.
- **Dead outlinks:** `href` to 4xx/5xx or redirect loops.

Fix orphans with hub + contextual links. Fix dead links or 301 them.

### 3. Cannibal pairs

If two indexable URLs share intent (GSC query overlap, near-duplicate H1):

1. Pick keeper (better content, already stronger inlinks, cleaner URL).
2. 301 or merge (see IA file).
3. Rewrite every internal `href` to the keeper in the same release.
4. Remove the loser from nav and sitemap.

### 4. Recommend new links

For each keeper URL `T`:

1. Candidates = indexable URLs whose body already mentions `T`’s topic, or same hub, or GSC queries in the same family.
2. Score: relevance > existing in-degree gap > crawl depth from home.
3. Propose 3–7 **new** contextual placements with suggested anchors (not exact-match clones).
4. Propose 2–5 outbound targets from `T`.
5. Reject if the source cannot add a truthful sentence.

### 5. Output

Per URL: current inlinks, proposed inlinks (source, anchor, placement), proposed outlinks, leftover risks (orphan, noindex-in-nav, facet leak).

---

## 13. New URL: inbound and outbound quotas

**JUDGMENT (operational, not a Google quota):**

| Direction | Count | Sources / targets |
| --- | --- | --- |
| Inbound at launch | **3–7** | Hub + closest spokes + 1 counterpart (edu↔commercial) + optional home/nav if top task |
| Outbound at launch | **2–5** plus hub | Next-step siblings, hub, one conversion or one explainer |
| Sitewide chrome | **0–1** new global nav slot | Only if it is a durable top task |

Do not wait for “the sitemap to pick it up.”

---

## 14. Hard rules

1. **`<a href>` or it does not exist** for discovery. [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable)
2. **Descriptive anchors.** No “click here.” No stuffed exact-match spam. [Link best practices](https://developers.google.com/search/docs/crawling-indexing/links-crawlable), [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
3. **Contextual body/hub links first.** Footer/nav are not a strategy.
4. **Canonical indexable targets only.** [Consolidate duplicates](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
5. **No internal nofollow sculpting.** Exceptions: login/cart/facets — prefer robots/`noindex`/canonical. [Faceted navigation](https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation)
6. **Paginate with real URLs and next `href`s.** Never canonical-all-to-page-1. [Pagination](https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading)
7. **No doorway meshes** or hidden links. [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies)
8. **Hubs list spokes; spokes link back.** Cross-link when the next task is real.
9. **3–7 inbound links at publish.** Sitemap is optional backup, not the launch plan.
10. **Update `href`s when you 301.** Do not leave the graph pointing at ghosts.
11. **Related modules must be relevant** or they are noise (and crawl waste on large sites).
12. **Do not claim a PageRank algorithm.** Use importance-via-links as documented intuition only.

---

## 15. Link plan template (new URL)

Copy and fill. Every field required before publish.

```markdown
# Link plan

## Target
- Canonical URL:
- Title / H1:
- Intent (one sentence):
- Hub URL:
- Locale:
- Indexable? (200, self-canonical, not noindex, in sitemap after launch): yes/no

## Cannibal check
- Existing URLs with same intent:
- Decision: new | merge+301 | differentiate
- Redirects to add:

## Placement in IA
- Folder / parent:
- Breadcrumb trail (visible = JSON-LD):
- Nav changes (primary / local / footer / none):
- Facet/params: none | blocked | canonicalized to:

## Inbound (3–7 must-link pages)
| # | Source canonical URL | Placement (body / hub list / local nav / breadcrumb) | Proposed anchor | Sentence to add | Owner/status |
| --- | --- | --- | --- | --- | --- |
| 1 | | | | | |
| 2 | | | | | |
| 3 | | | | | |
| 4 | | | | | |
| 5 | | | | | |
| 6 | | | | | |
| 7 | | | | | |

## Outbound from the new URL
| # | Destination canonical URL | Anchor | Why the reader needs it |
| --- | --- | --- | --- |
| 1 | (hub) | | |
| 2 | | | |
| 3 | | | |
| 4 | | | |
| 5 | | | |

## Commercial ↔ educational
- Counterpart URL (or n/a):
- Direction and single honest CTA/anchor:

## Related / pagination
- Related algorithm or curated list:
- Pagination URLs (if any) and next/prev hrefs:

## Do not
- [ ] Footer-only inbound
- [ ] Sitemap-only discovery
- [ ] Link to non-canonical / utm / noindex
- [ ] Exact-match anchor spam
- [ ] Internal nofollow
- [ ] Doorway / city-page funnel

## Ship checklist
- [ ] All inbound hrefs live on production HTML
- [ ] Target returns 200 + self-canonical
- [ ] XML sitemap row added
- [ ] Breadcrumb UI + BreadcrumbList match
- [ ] Old URLs 301 if this replaces them
- [ ] Recrawl graph: target in-degree ≥ 3 from indexable pages
```

---

## Sources

- https://developers.google.com/search/docs/crawling-indexing/links-crawlable
- https://developers.google.com/search/docs/crawling-indexing/qualify-outbound-links
- https://developers.google.com/search/docs/crawling-indexing/url-structure
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/overview
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://developers.google.com/search/docs/crawling-indexing/canonicalization
- https://developers.google.com/search/docs/crawling-indexing/301-redirects
- https://developers.google.com/search/docs/crawling-indexing/crawling-managing-faceted-navigation
- https://developers.google.com/search/docs/crawling-indexing/large-site-managing-crawl-budget
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/appearance/structured-data/breadcrumb
- https://developers.google.com/search/docs/fundamentals/how-search-works
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/specialty/ecommerce/help-google-understand-your-ecommerce-site-structure
- https://developers.google.com/search/docs/specialty/ecommerce/pagination-and-incremental-page-loading
- https://www.nngroup.com/articles/information-scent/
- https://www.nngroup.com/articles/ia-vs-navigation/
- https://www.nngroup.com/articles/3-click-rule/
