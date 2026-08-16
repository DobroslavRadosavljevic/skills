# On-page SEO, snippets, and content types

Research date: 2026-08-17. Prefer live Google Search Central over blogs. Label every claim **FACT** (Google-stated) or **JUDGMENT** (industry practice or agent inference). Do not invent ranking factors.

## Official sources (read these first)

- Search Essentials: https://developers.google.com/search/docs/essentials
- SEO Starter Guide: https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Creating helpful, reliable, people-first content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Title links: https://developers.google.com/search/docs/appearance/title-link
- Snippets / meta descriptions: https://developers.google.com/search/docs/appearance/snippet
- Featured snippets: https://developers.google.com/search/docs/appearance/featured-snippets
- How featured snippets work (Help): https://support.google.com/websearch/answer/9351707
- Sitelinks: https://developers.google.com/search/docs/appearance/sitelinks
- Canonicalization: https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- Localized versions / hreflang: https://developers.google.com/search/docs/specialty/international/localized-versions
- Image SEO: https://developers.google.com/search/docs/appearance/google-images
- Generative AI on your site: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- AI optimization guide: https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- March 2024 core update + new spam policies: https://developers.google.com/search/blog/2024/03/core-update-spam-policies
- Structured data gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Article structured data: https://developers.google.com/search/docs/appearance/structured-data/article
- Search docs changelog (feature deprecations): https://developers.google.com/search/docs/appearance/structured-data/faqpage (redirects to latest documentation updates)

## How to use this file

1. Diagnose **one primary intent** for the URL before writing copy.
2. Draft title, H1, first paragraph, and meta description to the same promise. Write the body with [copywriting.md](copywriting.md).
3. Structure body so a human can finish the job; snippets are a side effect.
4. Run the hard-rules checklist before publish.
5. Never pad to a word count. Google has no preferred length. **FACT:** https://developers.google.com/search/docs/fundamentals/creating-helpful-content

---

## 1. Search intent

**FACT:** Google does not publish a five-type intent taxonomy as a ranking API. Ranking systems aim to show helpful results for the query. **JUDGMENT:** Use the industry types below as a diagnostic, not as schema.

Assign **one primary intent per URL**. Mixed pages dilute the title, H1, CTA, and snippet. Secondary intents belong in sections or linked URLs.

| Type | User job | Typical SERP clues (**JUDGMENT**) | Page job |
| --- | --- | --- | --- |
| Informational | Learn, understand, diagnose | Featured snippet, People Also Ask, video, knowledge panel, “how/what/why” results | Answer completely; cite; date; next step |
| Navigational | Reach a known brand, tool, or login | Official site + sitelinks, brand knowledge panel, few competitors | Get them to the destination fast; unique title |
| Commercial investigation | Compare before buying | “Best/vs/review”, shopping units, listicles, video reviews | Criteria, evidence, first-hand use, honest limits |
| Transactional | Buy, sign up, start trial, download | Ads, product rich results, pricing, “buy/order” | One primary CTA; price/availability; frictionless |
| Local | Visit or contact a place | Map pack, local pack, GBP, hours, directions | NAP, hours, service area, map, actions |

### Diagnose from the live SERP

1. Search the target query in an incognito window, locale + language of the audience.
2. Record features: ads, map pack, shopping, featured snippet, PAA, videos, sitelinks, discussions, AI Overviews / AI Mode.
3. Open the top organic URLs. Note content type (guide, category, product, homepage, docs).
4. **Primary intent = the job the winning pages actually finish**, not the keyword modifier you hoped for.
5. If the SERP is mixed (guide + product), pick the job this URL can win. Do not force a blog onto a transactional SERP or a thin product onto an informational SERP.

**FACT:** Featured snippets appear when Google thinks a short extract answers the query; they also appear inside People Also Ask. https://support.google.com/websearch/answer/9351707  
**FACT:** Sitelinks appear when Google thinks shortcuts from the same domain save time; they are automated. https://developers.google.com/search/docs/appearance/sitelinks  
**JUDGMENT:** Map pack ≈ local. Shopping/product rich results ≈ transactional or commercial. Long-form + PAA ≈ informational. Brand query + sitelinks ≈ navigational.

### One URL, one primary intent

- Do not publish `/best-crm` and `/crm-pricing` as the same outline with swapped H1s.
- Do not stack “what is / how it works / pricing / compare / FAQ / blog signup” as equal H2s on one URL unless the SERP winners do that **and** the page still has one dominant job.
- If two intents both matter, split URLs and interlink.

---

## 2. Title tags (`<title>`)

**FACT:** The title link in Search is generated automatically from multiple sources: `<title>`, visible main title, headings, `og:title`, other prominent text, on-page anchors, inbound anchors, WebSite structured data. Google may rewrite. https://developers.google.com/search/docs/appearance/title-link

**FACT:** There is no documented character cap. The title link is truncated to fit device width. https://developers.google.com/search/docs/appearance/title-link

**JUDGMENT:** Desktop title links often display roughly 50–60 Latin characters / ~560–600 px. Do not treat 60 characters as a ranking rule. Write the distinctive clause first; brand last if space is tight.

### Write titles

1. Give every indexable URL a unique `<title>` that describes **this** page. Boilerplate across a site (“Cheap products for sale”) is a documented failure mode. **FACT:** title-link docs.
2. Put the primary topic in the first clause. Match the language and writing system of the main content. Hindi body + English/Latin title can trigger a rewrite. **FACT:** title-link docs.
3. Brand concisely. Homepage may carry a short value line. Interior pages: `Page topic | Brand` or `Brand: Page topic`. Domain-level site name may be omitted from the title link if it already appears in the result. **FACT:** title-link docs.
4. Do not keyword-stuff (`Foobar, foo bar, foobars`). **FACT:** title-link docs + spam policy keyword stuffing.
5. Make one **visually dominant** H1 that matches the title’s promise. Multiple equally large headings confuse title-link selection. **FACT:** title-link docs.
6. Keep titles current. Obsolete years in `<title>` vs visible H1 cause Google to prefer the visible date. **FACT:** title-link docs.
7. Do not put rapidly changing flight prices in `<title>`. **FACT:** title-link docs.
8. Do not block crawl if you care about on-page title sources; uncrawled pages may get titles from off-page anchors. **FACT:** title-link docs.

### Rewriting — expect it

Google rewrites when titles are half-empty, obsolete, inaccurate, micro-boilerplate, language-mismatched, or lack a clear main title. **FACT:** title-link docs.  
**JUDGMENT:** A rewrite that better matches the query is not a bug. Fix the page if the rewrite is vaguer or off-topic.

### Templates

```
Informational: {Outcome or question} | {Brand}
Commercial: {A vs B}: {decisive criterion} | {Brand}
Transactional: {Product} pricing and plans | {Brand}
Local: {Service} in {City} | {Business}
Navigational: {Product} login | {Brand}
Homepage: {Brand}: {one-line what you do}
```

Avoid: `{Keyword} | {Keyword} | {Keyword} | {Brand}`. Avoid clickbait that the body cannot keep. **FACT:** helpful-content asks whether the title exaggerates or shocks.

---

## 3. Meta descriptions

**FACT:** Snippets are created automatically, primarily from page content. Google **may** use the meta description when it describes the page better than an on-page extract. Different queries can get different snippets. https://developers.google.com/search/docs/appearance/snippet

**FACT:** No documented length limit; snippets truncate to device width. https://developers.google.com/search/docs/appearance/snippet

**FACT:** `nosnippet`, `max-snippet:[n]`, and `data-nosnippet` control snippet presence/length. https://developers.google.com/search/docs/appearance/snippet

**JUDGMENT:** Meta description is not a ranking factor. It is a CTR and snippet-influence control. Write it anyway for critical URLs.

### Write descriptions

1. Unique per URL. Site-wide identical descriptions are unhelpful when many pages rank. Prioritize home + money pages if you cannot write all. **FACT:** snippet docs.
2. Pitch the page: what it is, who it is for, the distinctive fact (price, hours, method, scope).
3. Include a verb CTA when the intent is commercial or transactional (`Compare plans`, `See hours`, `Download the spec`).
4. Product/news pages may list facts (author, date, price, manufacturer) instead of a single sentence. **FACT:** snippet docs.
5. Programmatic descriptions are encouraged for large catalogs if they are human-readable and page-specific. Keyword strings are less likely to be used. **FACT:** snippet docs.
6. Do not stuff keywords. Do not write a description that the page does not support.

### Rewriting — expect it

Google often prefers an on-page sentence that matches the query. That is intended. Improve the **body** if snippets are bad.

### Template

```
{Who it's for}: {what they get}. {1 distinctive proof}. {CTA}.
```

Example pattern from Google: shop description with hours + location beats a keyword list. **FACT:** snippet docs.

---

## 4. Headings

**FACT:** Starter Guide: write naturally; break long content into sections; provide headings so people can navigate. https://developers.google.com/search/docs/fundamentals/seo-starter-guide

**FACT:** There is no magical heading count. Semantic heading order helps screen readers. Google Search rarely depends on HTML heading rank for ranking. Out-of-order headings are not a ranking penalty. https://developers.google.com/search/docs/fundamentals/seo-starter-guide (myths table)

**JUDGMENT:** Use one H1 that states the page’s job. Use H2/H3 as an outline a human can scan. Do not use heading tags for font size.

### Procedure

1. One H1, first prominent heading, aligned with `<title>`.
2. H2 = major steps or questions the searcher has. H3 = substeps.
3. Phrase H2s as the questions people (and AI systems) ask when that matches the outline (`How does X work?`, `What does it cost?`). Answer in the first 1–2 sentences under the heading.
4. Do not skip meaning: do not mark a sidebar promo as H2.
5. Do not create heading-only keyword stacks with no unique paragraph beneath.

**FACT:** Accordion/tab content that users can open is not hidden-text spam. https://developers.google.com/search/docs/essentials/spam-policies  
**JUDGMENT:** Put the answer in HTML text, not only in a closed widget, if you want snippet/PAA eligibility. Featured-snippet “read more” deep links prefer content immediately visible. **FACT:** snippet docs (read-more deep links).

---

## 5. Body content and spam definitions (2024–2026)

### People-first (helpful content)

**FACT:** After March 2024, helpfulness is evaluated by multiple core systems, not one isolated “helpful content” classifier. https://developers.google.com/search/blog/2024/03/core-update-spam-policies

Run the official self-test before publish. **FACT:** https://developers.google.com/search/docs/fundamentals/creating-helpful-content

People-first yes-signals: existing audience would use it if they arrived directly; first-hand depth; site has a focus; reader can finish the job; satisfying experience.

Search-engine-first warning signs: made mainly for rankings; many unrelated topics; extensive automation across topics; summarizing others with no value; chasing trends; reader must search again; writing to a word count; entering a niche only for traffic; fake answers (unconfirmed release dates); date-bumping without real change; adding/removing lots of pages only to look “fresh.”

**FACT:** SEO applied to people-first content is fine. SEO as a substitute for people-first content is not. Same URL.

### What the words mean (use Google’s definitions)

**Thin (agent term).** Google’s current spam page does not use “thin content” as a standalone policy name. **FACT:** Raters treat little/no main content, or main content with little effort, originality, or added value, as lowest quality (SQRG 4.6.1, 4.6.6). **JUDGMENT:** Call a page thin when it cannot finish the user’s job: stub, tag archive, doorway, affiliate page with no original evaluation, FAQ with one-line answers copied from the SERP.

**Scaled content abuse.** **FACT:** Many pages generated primarily to manipulate rankings, not help users — unoriginal, little value — **regardless of whether AI, humans, or both produced them**. Examples: gen-AI farms; scraped/synonymized/translated copies; stitched pages; multiple sites hiding scale; keyword-filled nonsense. Announced March 2024. https://developers.google.com/search/docs/essentials/spam-policies · https://developers.google.com/search/blog/2024/03/core-update-spam-policies

**Doorway abuse.** **FACT:** Pages/sites built to rank for similar queries and funnel users to a less useful intermediate or a single destination. Examples: many near-duplicate city/domain variants; pages that are closer to a SERP than a browseable site. https://developers.google.com/search/docs/essentials/spam-policies

**Expired domain abuse.** **FACT:** Buying a lapsed domain and repurposing it mainly to inherit ranking signals for low-value content (e.g. casino on a former school site). Using an old domain for a genuine new people-first site is allowed. March 2024. Same URLs as above.

**Site reputation abuse.** **FACT:** Third-party pages hosted mainly to borrow the host’s ranking signals, with little first-party oversight, often off-topic. Not all third-party or affiliate content. Policy announced March 2024, effective 2024-05-05; later enforcement updates continued. Examples: payday-loan advertorials on an education site; casino pages on a medical site; white-label coupons on a news site solely for rankings. Not abuse: wire/press services, news syndication, UGC forums, editorial columns, native ads meant for the publication’s readers, ordinary affiliate links, merchant-sourced coupons with real involvement. https://developers.google.com/search/docs/essentials/spam-policies

**Also enforce on-page:** keyword stuffing; hidden text/links (not legitimate accordions); cloaking; scraping without value; link spam; misleading functionality. **FACT:** spam policies. **FACT (2026):** spam policies also apply to attempts to manipulate generative AI responses in Search. Changelog May 2026 + spam-policies intro.

### AI / anti-slop

**FACT:** Automation and gen-AI are not spam by default. Using them to produce many pages without adding value **is** scaled content abuse. https://developers.google.com/search/docs/fundamentals/using-gen-ai-content · https://developers.google.com/search/blog/2023/02/google-search-and-ai-content

**FACT:** Do not create a page per query variation / “fan-out” mainly to manipulate rankings or AI features. https://developers.google.com/search/docs/fundamentals/ai-optimization-guide

**FACT:** Accuracy of titles, descriptions, structured data, and image alt still matters when generated. Disclose how automation was used when a reader would reasonably ask “how was this made?” Helpful-content “How” section.

**Anti-slop checklist (agent):**

- Delete any paragraph that only restates the H2.
- Delete synonym loops and fake certainty (“studies show” with no study).
- Require one first-hand artifact: screenshot, dataset, quote, measurement, or worked example.
- Do not invent authors, reviews, credentials, dates, prices, or citations.
- If the page equals a rewrite of the top 3 results, do not publish.

---

## 6. Snippets: featured, PAA, sitelinks

### Featured snippets

**FACT:** You cannot mark a page as a featured snippet. Systems choose extracts that answer the query. Clicking often deep-links to the extract. https://developers.google.com/search/docs/appearance/featured-snippets  
**FACT:** They appear at the top of results, in People Also Ask, and sometimes beside Knowledge Graph. https://support.google.com/websearch/answer/9351707  
**FACT:** Feature-specific policies apply (medical, deceptive, contradicting consensus on civic/historical/medical/scientific topics, etc.). Violations can remove the snippet, not necessarily the blue link.

**Help without spam (procedure):**

1. Put a 40–60 word direct answer immediately under a question-shaped H2.
2. Follow with a list, table, or steps if the query is procedural or comparative.
3. Keep the extract faithful; do not bait-and-switch below the fold.
4. Do not create doorway pages whose only job is to win a snippet.
5. Opt out with `nosnippet` (all snippets) or experimentally lower `max-snippet` (featured only, not guaranteed). **FACT:** featured-snippets docs.

### People Also Ask

**JUDGMENT:** Treat PAA as a question inventory, not a keyword list to turn into 20 thin URLs.

1. Cover the questions **this URL** should answer as H2/H3 + short answers.
2. Link out to a better URL when the question is a different intent.
3. Do not paste every PAA question as an H2 with a two-sentence paraphrase of Wikipedia.

### Sitelinks

**FACT:** Automated from site structure. Improve them with informative compact titles/headings, logical IA, concise relevant internal anchors, and no repetitive content. Remove a sitelink by `noindex` or removing the page. https://developers.google.com/search/docs/appearance/sitelinks

**JUDGMENT:** Homepage, pricing, docs, login, and contact are common sitelink targets. Give each a unique title.

### Read-more deep links

**FACT:** Visible (not tab-hidden) content; do not reset scroll on load; do not strip hash fragments. https://developers.google.com/search/docs/appearance/snippet

---

## 7. Keywords in slugs, first paragraph, alt, anchors

### URL slugs

**FACT:** Descriptive URLs can appear as breadcrumbs and help people. Keywords in the path have **hardly any ranking effect** beyond breadcrumbs. TLD matters mainly for country targeting, and even then is usually low impact. https://developers.google.com/search/docs/fundamentals/seo-starter-guide

**Do:** `/docs/webhooks`, `/pricing`, `/compare/a-vs-b`. **Don’t:** `/2/6772756…`, `/best-best-cheap-crm-software-2026-2026`.

Group stable vs volatile paths in directories so crawl frequency can differ. **FACT:** starter guide.

### First paragraph

**JUDGMENT:** State the page’s promise and primary entity in the first 1–2 sentences. Use the words people search, including novice and expert variants, naturally. **FACT:** Google’s language systems can match related terms; you do not need every synonym. Starter guide + helpful content.

### Image alt

**FACT:** Alt describes the image for people and helps Google understand it (with computer vision + page context). Keyword-stuffed alt is a negative UX and may look like spam. Descriptive filenames help slightly. Use real `<img src>` (not CSS background) for indexable images. https://developers.google.com/search/docs/appearance/google-images

```
Bad: alt=""
Bad: alt="crm software crm tool best crm crm"
Better: alt="Pipeline board with three deal stages"
```

Decorative images: empty alt. Linked images: alt is the anchor.

### Anchors

**FACT:** Anchor text tells people and Google what the target is. Write specific, natural anchors. Links help discovery; most new URLs are found via links. Untrusted outbound: `nofollow` / `sponsored` / `ugc` as appropriate. UGC comments: add `nofollow` (or equivalent) by default. Paid links must be qualified. https://developers.google.com/search/docs/fundamentals/seo-starter-guide · spam policies (link spam)

**Do:** `See webhook retry rules`. **Don’t:** `click here`, or `best pizza san diego` in a comment signature.

Internal: link to the **canonical** URL, not parameter copies. **FACT:** canonical docs.

---

## 8. Duplicate, near-duplicate, syndication, canonical

**FACT:** Duplicate content is **not** a spam-policy violation by itself. It wastes crawl and can confuse users. Google will pick a canonical if you do not. Copying others’ content is a different issue (scraping / scaled abuse). https://developers.google.com/search/docs/fundamentals/seo-starter-guide

**FACT:** Signal strength for your preference: redirects > `rel=canonical` (HTML or HTTP header) > sitemap inclusion. Combine methods. Self-canonical on the preferred URL. Absolute HTTPS URLs. Do not mix conflicting canonicals. Do not use robots.txt or URL Removal for canonicalization. Prefer linking to the canonical internally. https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls

**FACT:** Google prefers HTTPS over HTTP unless the HTTPS page is broken or canonicalizes to HTTP.

### Reprints and syndication

**FACT (SQRG 4.6.6–4.6.7):** Licensed/syndicated content (e.g. AP, Reuters) is not treated as scraped “copied” content. Embedding or reprinting **without** added value is lowest quality for the reprinting page.

**Procedure:**

1. Prefer 301 to one URL when the duplicate should die.
2. If both must exist (print, filtered, UTM, AMP, locale — see §10): point `rel=canonical` at the preferred URL **in the same language** when using hreflang.
3. Syndicated reprint: canonical to the **original** publisher unless you are the origin and partners agree to canonicalize to you.
4. Add original value on your URL (commentary, data, update) or do not expect it to outrank the origin.
5. Do not scrape, synonymize, or lightly rewrite third-party articles.

---

## 9. Multilingual on-page

**FACT:** Tell Google about language/region variants with hreflang (HTML, HTTP header, or sitemap — pick one). Google detects language algorithmically; it does **not** use `hreflang` or HTML `lang` to detect language. Localized versions are duplicates **only if the main content is untranslated**. https://developers.google.com/search/docs/specialty/international/localized-versions

**FACT:** Titles must use the same language and writing system as the primary content. **FACT:** title-link docs.

### Procedure

1. Translate **title, H1, description, body, image alt, slugs (or localized paths), structured data strings** — not only nav chrome.
2. Each language URL lists itself + all alternates; use absolute URLs; bidirectional links; `x-default` for language selectors / unmatched.
3. Canonical in the **same language** as the page (or best substitute).
4. Do not auto-redirect by IP in a way that blocks Google from seeing other locales (crawler location is generally US). **FACT:** starter guide (geo-differing content).
5. Machine-translated bodies with no review, published at scale, can be scaled content abuse if they add no value. **FACT:** spam policy examples include translating as an obfuscation technique.

---

## 10. Content types playbook

**FACT:** Word count is not a ranking target. https://developers.google.com/search/docs/fundamentals/creating-helpful-content  
**JUDGMENT:** Length columns below are “enough to finish the job,” not quotas. Schema = eligibility only; Google does not guarantee rich results. Gallery: https://developers.google.com/search/docs/appearance/structured-data/search-gallery

**FACT (2026-05/06):** FAQ rich results were deprecated (stopped showing 2026-05-07; docs removed 2026-06-15). Do not implement FAQPage markup for Google rich results. Visible FAQ copy is still useful for people and PAA. Changelog: Search Central documentation updates.

| Type | Required on-page | Word-count myth | Primary CTA | Schema eligibility | Internal-link role |
| --- | --- | --- | --- | --- | --- |
| Homepage | Unique title (not “Home”); one H1; what you do; who for; proof; paths to core jobs; contact/about | Not a 3,000-word essay | Start / sign in / get demo | Organization; WebSite; SearchAction if you have sitelinks search; LocalBusiness if that is the entity | Hub: sitelink targets, category/product/docs |
| Landing (campaign) | One offer; match ad/query; no nav sprawl; proof; legal if claims | Not a blog | The campaign action | Usually none; Product/Offer if it is the product | Spoke: to pricing, docs, proof; `noindex` if pure ad-duplicate |
| Pricing | Plans, what’s included, limits, billed period, who each plan is for, exceptions | Not a novel | Choose plan / talk to sales | Product/Offer if accurate and visible; SoftwareApplication if it fits | Money page: from compare, landing, nav |
| Comparison | Named alternatives; criteria table; who should pick what; first-hand use; disclose affiliation | Not “2,500 words to rank” | Pick a winner + pricing | None required; Product if reviewing products; Review snippet only if you meet review policies | Cluster: to each product + methodology |
| Integration | What connects; setup steps; scopes/permissions; limits; example payload | Not a homepage clone | Connect / view docs | SoftwareApplication / tech article optional | Spoke from integrations index + docs |
| Changelog | Dated entries; breaking vs compatible; migrate links | Short is correct | Upgrade / read migrate | None typical | From docs version pages; do not date-bump empty |
| Blog / guide | Promise in H1; original analysis; sources; author; dates; updated when facts change | No 2,000-word rule | Next job (tool, doc, product) only if earned | Article/BlogPosting; author + dates | Cluster to pillar + related docs |
| Docs | Task-first H1; steps; copy-paste examples; version; prev/next | As short as accurate | Complete the task | TechArticle optional; HowTo only if it matches feature rules | Backbone of product understanding |
| Glossary | One term per URL; precise definition first; examples; links to docs | One screen can win | Related term / doc | DefinedTerm optional | Leaf; link from docs on first use |
| FAQ | Real questions; unique answers; not a keyword dump | Short answers OK if complete | Contact / doc deep link | **Not** FAQPage for Google (deprecated 2026) | Support hub; do not doorway each question |
| Category | Scope; sort/filter; unique intro that is not stuffed; child links | Intro ≠ 800 words of fluff | Browse / filter | ItemList/CollectionPage optional; Breadcrumb | Hub to products |
| Product | Title, image, price, availability, specs, returns, unique description | Specs beat essays | Add to cart / buy | Product / merchant listing; Review only if genuine | From category + compare |
| Profile (author/org) | Who, credentials, sameAs, what they publish, contact if appropriate | Bio ≠ keyword page | Follow / see articles | ProfilePage; Person or Organization | Trust node for bylines |
| Location | Unique local proof (not city-name swap); NAP; hours; services; map; directions | Doorway if templated | Call / directions / book | LocalBusiness + geo | From location index; never 50 city doorways |
| Legal | Accurate policy; last updated; jurisdiction; contact | Length = completeness | Accept / contact | None | Footer; not a ranking play |

**YMYL types** (pricing claims, medical, legal, financial, civic): extra sourcing and identifiable responsible party. See `ee-at.md`.

---

## 11. Freshness

**FACT:** Helpful-content forbids changing dates to look fresh when content has not substantially changed, and forbids mass add/delete to look fresh. Starter guide: update or delete stale pages.

**FACT:** Article `datePublished` / `dateModified` are ISO 8601, recommended with timezone; they must match visible reality. https://developers.google.com/search/docs/appearance/structured-data/article

### Procedure

1. Show a visible published date when the page is time-sensitive.
2. Set `dateModified` only when the **substance** changed (facts, steps, prices, verdict). Typo fixes do not earn a new date.
3. **Update in place** when the entity is the same (same product version line, same concept, evergreen guide). Keep the URL; add a changelog note.
4. **New URL** when the topic is a new entity (2027 tax year rules that replace 2026; a new product generation; a breaking API v2). Redirect the old URL if it should not rank.
5. Recurring annual pages: update both visible H1 and `<title>` or expect a rewrite. **FACT:** title-link obsolete-title example.
6. Do not schedule empty “refreshes.”

---

## 12. Hard rules

1. One primary intent, one H1, one primary CTA per URL.
2. Unique `<title>` and meta description for every indexable URL.
3. Title, H1, first paragraph, and body promise the same thing.
4. Language of title/H1/description/body/alt match.
5. No keyword stuffing in title, body, alt, or anchors.
6. No doorway city/page templates; no expired-domain content swaps; no third-party off-topic parasitizing.
7. No scaled AI/human farms. No word-count padding.
8. No fake dates, authors, reviews, stats, or citations.
9. Canonical + internal links agree. Syndicated reprints point at origin unless you are origin.
10. Visible, honest dates. No freshness theater.
11. Do not implement deprecated FAQ rich-result markup for Google (as of 2026-05).
12. Do not create one URL per PAA/AI fan-out question.

### Pre-publish checklist

- [ ] SERP features recorded; intent named
- [ ] Title ≤ display reality (distinctive clause first)
- [ ] Meta is a pitch, not a keyword list
- [ ] Outline is H2/H3 questions/steps with answers under each
- [ ] First-hand or first-party value present
- [ ] Images have descriptive alt; slugs readable
- [ ] Schema matches visible content only
- [ ] Author/org/contact adequate for the risk level
- [ ] Canonical, hreflang, dates consistent

### Title / H1 / description mini-templates

```
<title>{Primary topic in user words} | {Brand}</title>
<h1>{Same promise, slightly more human}</h1>
<meta name="description" content="{Audience}: {outcome}. {proof}. {CTA}.">
```

Mismatch example to reject: title “Best CRM for nonprofits”, H1 “Welcome to our blog”, description “We write about software.”
