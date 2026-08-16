# Structured data and rich results

Researched 2026-08-17. Prefer Google Search Central over Schema.org for Google behavior. Eligibility never guarantees a rich result.

Label claims:

- **FACT** — stated by a cited official source.
- **JUDGMENT** — operational inference for agents. Do not present as Google policy.

## Hard rules

1. Prefer JSON-LD. Do not invent reviews, ratings, FAQ answers, prices, or events that are not on the page.
2. Markup must match visible content. Hidden or contradictory JSON-LD is a policy violation, not a “technical extra.”
3. Use Google’s required/recommended properties for rich-result eligibility. Schema.org optional fields do not create Google features.
4. Do not mark up a type unless that type is the page’s main (or clearly nested) content.
5. Validate with Rich Results Test for Google features and Schema Markup Validator for vocabulary/syntax. Neither proves ranking or AI citation.
6. Eligibility ≠ display. Google does not guarantee rich results.
7. Do not teach or depend on a TypeScript schema library. Emit valid JSON-LD objects.

## Formats: JSON-LD vs Microdata vs RDFa

**FACT.** Google accepts JSON-LD, Microdata, and RDFa. JSON-LD is recommended. All three are equally fine if valid and implemented per the feature guide. Google can read JSON-LD injected by JavaScript. Source: [Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

**FACT.** JSON-LD lives in a `<script type="application/ld+json">` in `head` or `body` and is not interleaved with visible text. Microdata and RDFa use HTML attributes on visible nodes. Source: same page.

**JUDGMENT.** Always emit JSON-LD unless the project already maintains correct Microdata/RDFa on the same nodes. Do not duplicate the same facts in two formats on one page.

### Visible-content parity

**FACT.** Do not mark up content that is not visible to readers. If JSON-LD describes a performer, the HTML body must describe that same performer. Do not mark up irrelevant or misleading content (fake reviews, content unrelated to the page focus). Do not use structured data to deceive, impersonate, or misrepresent ownership. Source: [General structured data guidelines](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Put markup on the page it describes (unless a feature guide says otherwise). On duplicates, put the same structured data on all copies, not only the canonical. Source: same page.

**FACT.** For AI features, structured data must match visible text. Source: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).

**JUDGMENT.** If a field is not on the page (or behind a control the user can open, such as an accordion), omit it. Do not “complete” Schema.org from CRM data the visitor cannot see.

## Eligibility vs typing

**FACT.** Google documents which properties are required, recommended, or unused for Search. Rely on Search Central, not Schema.org, for Google behavior. Schema.org has many extra attributes Google does not require; they may help other consumers. Source: [Introduction to structured data](https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data).

**FACT.** Missing required properties → not eligible for that rich result. More complete recommended properties can improve quality; incomplete or fake recommended fields are worse than omitting them. Source: same page; [sd-policies completeness](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Use the most specific applicable Schema.org type. Source: [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Google-supported features are listed in the gallery. Types not in the gallery are not Google rich-result features. Source: [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery).

**JUDGMENT.** Treat Schema.org as the vocabulary. Treat Search Central as the eligibility contract. Extra Schema.org fields are allowed when they are true and visible; they do not unlock undocumented Google UI.

## JSON-LD graph: `@context`, `@graph`, `@id`, URLs

**FACT.** Google understands multiple items on a page, nested or as separate objects (including a JSON array of items). Include the main type that matches the page’s main focus. If you mark reviews, mark all reviews visible on the page. Source: [sd-policies — multiple items](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Google examples use `"@context": "https://schema.org"` (or `https://schema.org/`). Image and item URLs in markup must be crawlable and indexable. Source: intro + sd-policies image rules.

**FACT.** Google’s ProfilePage example uses `@id` to link a `Person` to authored `Article` objects. Breadcrumb `item` may be a URL or a Thing identified by `@id` / `itemid`. Sources: [Profile page](https://developers.google.com/search/docs/appearance/structured-data/profile-page); [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

**JUDGMENT.** Prefer one JSON-LD blob per page with `@graph` (or a top-level array) over many unrelated scripts. Give stable `@id` values as **absolute HTTPS URLs** (page URL, `#organization`, author profile URL). Reuse the same `@id` when the same entity appears twice. Never use relative IDs without a resolvable base.

```json
{
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://example.com/#organization",
      "name": "Example",
      "url": "https://example.com/"
    },
    {
      "@type": "WebPage",
      "@id": "https://example.com/docs/geo",
      "url": "https://example.com/docs/geo",
      "name": "GEO guide",
      "isPartOf": { "@id": "https://example.com/#website" },
      "publisher": { "@id": "https://example.com/#organization" }
    }
  ]
}
```

## Validation

| Tool | What it proves | What it does not prove |
| --- | --- | --- |
| [Rich Results Test](https://search.google.com/test/rich-results) | Detected Google-supported types; required/recommended issues for those types; often a preview. Uses [Google-InspectionTool](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers), not ranking. | Ranking, AI Overview citation, Schema.org-only types, quality/spam compliance. |
| [Schema Markup Validator](https://validator.schema.org/) | Parseability and Schema.org typing/property shape. | Google rich-result eligibility or Search appearance. |
| Search Console URL Inspection + rich-result reports | What Googlebot fetched; indexed structured-data errors after deploy. | Instant display. Recrawl can take days to months. |

**FACT.** Technical guidelines are mostly testable in Rich Results Test and URL Inspection. Quality guidelines are not. A manual action on structured data removes rich-result eligibility; it does not by itself remove the page from web search. Source: [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

**FACT.** Rich Results Test: “Test your publicly accessible page to see which rich results can be generated by the structured data it contains.” Source: [Rich Results Test](https://search.google.com/test/rich-results).

**JUDGMENT.** Ship only after Rich Results Test shows the intended Google types with no critical errors **and** a human check that every field is visible. Do not “fix” Schema Markup Validator warnings by adding invisible properties.

## Spam and quality policies

**FACT.** Structured data must not violate [Content policies for Google Search](https://developers.google.com/search/docs/essentials/spam-policies) (including spam policies). Spam includes techniques that deceive users or manipulate Search **or generative AI responses** in Google Search. Source: [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies); [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies); changelog 2026-05-15.

Do this:

1. Follow feature-specific content policies (JobPosting, Event, Product, Review, etc.).
2. Keep time-sensitive fields current. Google will not show rich results for stale time-sensitive content.
3. Provide original content you or your users generated.
4. Keep robots.txt / `noindex` from blocking pages you want crawled for markup. Source: [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Do not:

- Fake reviews, fake ratings, fake FAQ, fake events, fake jobs, fake prices.
- Mark a livestream as a local Event, or woodworking steps as a Recipe. Source: sd-policies relevance examples.
- Self-serve star ratings for your own LocalBusiness/Organization (including embedded third-party widgets). Source: [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).
- Aggregate reviews copied from other sites. Source: same.
- Undisclosed incentivized reviews. Source: review snippet + changelog 2026-07-24.
- Keyword-stuffed JobPosting titles (`*** HIRING NOW!! ***`). Source: [Job posting](https://developers.google.com/search/docs/appearance/structured-data/job-posting).

**FACT.** Scaled content abuse includes creating many pages primarily to manipulate rankings or generative AI responses. Source: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies); [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Retired Google rich results (markup may remain valid)

Schema.org types stay valid. Google **display** ended. Confirm dates on [Search documentation updates](https://developers.google.com/search/updates).

| Feature | Google rich-result status (as of 2026-08-17) | Source |
| --- | --- | --- |
| HowTo | Documentation removed. Not shown on desktop or mobile (removed 2023). | [Updates](https://developers.google.com/search/updates) |
| FAQ / FAQPage | Rich result gone starting 2026-05-07. FAQ docs removed 2026-06-15. GSC/RRT/API support staged through mid/late 2026. | [Updates](https://developers.google.com/search/updates) |
| Sitelinks search box (`WebSite` + `SearchAction`) | Feature gone; documentation removed. | [Updates](https://developers.google.com/search/updates) |
| Course Info, Claim Review, Estimated Salary, Learning Video, Special Announcement, Vehicle Listing | Phased out of Search (2025). Book Actions **kept**. | [Updates](https://developers.google.com/search/updates) |
| Practice Problem | Reporting/RRT support removed starting 2026-01. | [Updates](https://developers.google.com/search/updates) |
| Dataset | Used by **Dataset Search**, not classic Google Search rich results. | [Updates](https://developers.google.com/search/updates); [Dataset](https://developers.google.com/search/docs/appearance/structured-data/dataset) |

**JUDGMENT.** Keep FAQPage / HowTo / WebSite+SearchAction only when they honestly describe visible content for other consumers. Do not add them to chase a Google SERP feature that no longer exists.

## Common types

For each type: **when**, **Google required (visible)**, **notes**. “Visible” means the same facts appear in the HTML the user can read.

### Organization

**When.** Home or About — not every page. Use the most specific subtype (`OnlineStore`, `LocalBusiness`, …). Source: [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization).

**Google required.** None. Recommended when they apply and are visible: `name`, `url`, `logo`, `sameAs`, `description`, `email`, `telephone`, `address`, legal IDs (`vatID`, `iso6523Code`, …), merchant return/shipping when you are a merchant.

**Visible fields.** Legal/trade name, logo, contact, address, social profile URLs you actually publish.

**JUDGMENT.** One `@id` for the org. Point `publisher` / `brand` at it from articles and products.

### WebSite + SearchAction

**When.** Historically sitelinks search box. **FACT.** That Google feature is discontinued; docs removed. Source: [Updates](https://developers.google.com/search/updates).

**JUDGMENT.** Optional `WebSite` (`name`, `url`, `publisher`) for entity clarity. Do not add `SearchAction` expecting a Google search box. If you keep `SearchAction`, the `target` URL must be a working on-site search the user can use.

### WebPage

**When.** Page-level container (`WebPage`, `ItemPage`, `FAQPage`, `ProfilePage`, `CollectionPage`). Not a gallery rich-result type.

**Google required.** None for a generic WebPage.

**Visible fields.** `name`/`headline` = visible title; `url` = canonical; `datePublished`/`dateModified` if shown.

**JUDGMENT.** Use WebPage in `@graph` to attach breadcrumbs, primary image, and `isPartOf` WebSite. Do not emit empty WebPage nodes.

### BreadcrumbList

**When.** Visible breadcrumb trail that reflects a typical user path, not necessarily the URL. Do not require a crumb for the hostname or the current page. Source: [Breadcrumb](https://developers.google.com/search/docs/appearance/structured-data/breadcrumb).

**Google required.** `BreadcrumbList.itemListElement` (≥2 `ListItem`s). Each item: `position`, `name`; `item` URL except last item (optional; Google uses the page URL).

**Visible fields.** Same labels and destinations as the on-page trail.

### Article / NewsArticle / BlogPosting / TechArticle

**When.** News, blog, sports, or long-form article. Google documents `Article`, `NewsArticle`, `BlogPosting`. Source: [Article](https://developers.google.com/search/docs/appearance/structured-data/article).

**Google required.** None. Recommended: `headline`, `image`, `datePublished`, `dateModified`, `author` (`Person` or `Organization` with `name` + `url`/`sameAs`).

**Visible fields.** Title, byline(s), dates, hero image. List every visible author separately — do not join names in one `author.name`. Source: article author best practices.

**TechArticle.** Schema.org subtype. **JUDGMENT.** For Google, emit `Article` or `TechArticle` **and** the Article recommended fields. Do not expect a separate TechArticle rich result.

### FAQPage

**When.** The page’s primary content is a visible Q&A list. Not a footer of invented FAQs.

**Google rich result.** **FACT.** No longer shown as of 2026-05-07. Docs removed 2026-06-15. Source: [Updates](https://developers.google.com/search/updates).

**If you still emit it.** Every `Question.name` and `Answer.text` must be readable on the page (accordion OK). No fake Q&A.

### HowTo

**When.** Step-by-step instructions that are the page.

**Google rich result.** **FACT.** Deprecated; documentation removed; not shown on any device. Source: [Updates](https://developers.google.com/search/updates).

**JUDGMENT.** Prefer visible numbered steps in HTML. Emit HowTo only if you need the vocabulary for other agents and steps are fully visible. Recipe instructions still use `HowToStep` inside `Recipe` (live feature).

### Product / Offer / AggregateOffer

**When.** A page about **one** product (or variants of that product), not a category. Source: [Product intro](https://developers.google.com/search/docs/appearance/structured-data/product); [Product snippets](https://developers.google.com/search/docs/appearance/structured-data/product-snippet).

**Google required (snippets).** `name` plus one of `review` | `aggregateRating` | `offers`.

**Offer required.** `price` or `priceSpecification.price`. Recommend `priceCurrency`, `availability`.

**AggregateOffer required.** `lowPrice`, `priceCurrency`. Recommend `highPrice`, `offerCount`. Do not use AggregateOffer for variants.

**Merchant listings.** Stricter (currency, shipping, returns). Prefer initial HTML, not JS-only price markup. Source: product-snippet technical guidelines.

**Visible fields.** Name, price, currency, availability, brand, images, ratings that users can see.

**JUDGMENT.** Distinct URL per currency. Do not attach `aggregateRating` unless real user ratings are on the page.

### Review / AggregateRating (strict)

**When.** Nested on an eligible type, or a review page about a **specific** item (not a category). Eligible item types include Book, Course, Event, Game, HowTo, LocalBusiness, Movie, Organization, Product, Recipe, SoftwareApplication, and others listed in the doc. Source: [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

**Review required.** `author`, `reviewRating.ratingValue`, `itemReviewed` (omit if nested) + reviewed item `name`.

**AggregateRating required.** `ratingValue`; `ratingCount` or `reviewCount`; `itemReviewed` (omit if nested) + name.

**Visible fields.** Review text and/or stars, author name, counts. Immediately obvious that the page has reviews.

**Do not.** Self-serving LocalBusiness/Organization stars; editor-compiled local ratings; cross-site aggregates; fake or undisclosed paid reviews. Source: same page.

### SoftwareApplication

**When.** A page about one app. Co-type `VideoGame` with `MobileApplication` or `WebApplication` — VideoGame alone is not eligible. Source: [Software app](https://developers.google.com/search/docs/appearance/structured-data/software-app).

**Google required.** `name`, `offers.price` (use `0` if free), and `aggregateRating` or `review`.

**Visible fields.** App name, price/free, OS, category, ratings users can see.

### ProfilePage

**When.** Page **primarily** about one person or org affiliated with the site (forum profile, author page, About Me, employee). Not a store homepage or a third-party review directory. Source: [Profile page](https://developers.google.com/search/docs/appearance/structured-data/profile-page).

**Google required.** `mainEntity` (`Person` or `Organization`) with `name` (or `alternateName` if that is the only public ID).

**Visible fields.** Display name, handle, bio, avatar (no placeholder image in `image`), follower/post counts only for **this** site.

### ItemList (carousel)

**When.** Google carousel **only** with Recipe, Course list, Restaurant, or Movie. Restaurant carousel is limited-access. Source: [Search gallery](https://developers.google.com/search/docs/appearance/structured-data/search-gallery); [Course](https://developers.google.com/search/docs/appearance/structured-data/course).

**Google required (list).** `itemListElement`, `ListItem.position`, `ListItem.url` (unique canonical per item). Course lists need **at least three** courses. Course item: `name`, `description` (display limit 60 characters).

**Do not.** Generic “related posts” ItemList expecting a Google carousel.

### Event

**When.** A real event people can attend (physical or online) at a stated time. Source: [Event](https://developers.google.com/search/docs/appearance/structured-data/event).

**Google required.** `name`, `startDate` (ISO-8601, include time), `location` (`Place` + `location.address`; online events use the virtual-event pattern in the same guide).

**Visible fields.** Title (not the venue name, not a promo), date/time, venue or streaming URL, status if cancelled (keep original `startDate`/`location`, set `eventStatus`).

### Recipe

**When.** A page whose main content is a cookable recipe. Source: [Recipe](https://developers.google.com/search/docs/appearance/structured-data/recipe).

**Google required.** `name`, `image` (prefer 1x1, 4x3, 16x9).

**Recommended (and must be visible if present).** `recipeIngredient`, `recipeInstructions` (`HowToStep`), times, yield, nutrition, author, ratings.

### VideoObject

**When.** A page that hosts or embeds a video you control. Source: [Video](https://developers.google.com/search/docs/appearance/structured-data/video) (gallery: Video).

**Google required (standard).** `name`, `description`, `thumbnailUrl`, `uploadDate`.

**Visible fields.** Same title/description/date; working `contentUrl` or `embedUrl`. Thumbnails crawlable.

### ImageObject / image metadata

**When.** You need creator, credit, or license in Google Images. Source: [Image metadata](https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata) (gallery: Image metadata).

**Typical fields.** `contentUrl`/`url`, `creator`, `creditText`, `copyrightNotice`, `license`, `acquireLicensePage` — all matching visible IPTC/page credits.

**Also.** `Organization.logo` and `Article.image` follow crawlable-image rules (logo ≥ 112×112). Source: [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization).

### LocalBusiness + subtypes

**When.** A location users can visit. Use the most specific type (`Restaurant`, `Store`, …). Keep Business Profile in sync. Sources: [Local business](https://developers.google.com/search/docs/appearance/structured-data/local-business); [Organization](https://developers.google.com/search/docs/appearance/structured-data/organization).

**Google required.** `name`, `address` (`PostalAddress` with country-appropriate parts).

**Recommended if visible.** `image`, `telephone`, `url`, `geo`, `openingHoursSpecification`, `priceRange`, `servesCuisine` (restaurants), department nodes.

**Do not.** Self-serving `aggregateRating` on your own business site. Source: [Review snippet](https://developers.google.com/search/docs/appearance/structured-data/review-snippet).

### JobPosting

**When.** A real, currently open job. Follow job content policies. Source: [Job posting](https://developers.google.com/search/docs/appearance/structured-data/job-posting).

**Google required.** `title` (job title only), `description` (full HTML job text, not equal to title), `datePosted`, `hiringOrganization`, `jobLocation` (with `addressCountry`) **or** remote via `jobLocationType` + `applicantLocationRequirements`.

**Visible fields.** Same title, employer, location/remote, dates, salary if marked (`baseSalary`). Remove or set `validThrough` when the job closes.

### Course

**When.** A list of educational courses from one provider (rich result is a **course list**, ≥3 courses). Source: [Course](https://developers.google.com/search/docs/appearance/structured-data/course).

**Google required.** Per course: `name`, `description`. List: ItemList fields above. Recommend `provider`.

**Do not.** Prices or slogans in `name` (“Learn ukulele — only $30!”).

### Dataset

**When.** A landing page for a downloadable or cited dataset. **FACT.** Improves [Dataset Search](https://datasetsearch.research.google.com/), not classic Search rich results. Sources: [Dataset](https://developers.google.com/search/docs/appearance/structured-data/dataset); [Updates](https://developers.google.com/search/updates).

**Google required.** `name`, `description` (see that page for length/uniqueness). Recommend `url`, `creator`, `license`, `distribution`, `identifier` (DOI).

**Visible fields.** Same title, description, license, download links. Mark the canonical landing page; use `sameAs` on copies.

### Speakable (BETA)

**When.** English news for U.S. Google Home / Assistant topical news — short TTS-friendly sentences. Source: [Speakable (BETA)](https://developers.google.com/search/docs/appearance/structured-data/speakable).

**Status.** **FACT.** Still documented as BETA; U.S. English / Google Home. Not a general Search rich result.

**Required.** On `Article` or `WebPage`: `SpeakableSpecification` with **either** `cssSelector` **or** `xPath` (not both). Select headline/summary only (~20–30 seconds). Do not mark datelines, captions, or the full article.

**JUDGMENT.** Skip unless you are a news publisher targeting Assistant news. Do not add Speakable for “GEO.”

## Implementation checklist

1. Pick the **one** main type from the gallery (plus BreadcrumbList / Organization as satellites).
2. Copy required + applicable recommended properties from the **current** feature URL, not from memory.
3. Diff JSON-LD against visible HTML. Delete extras.
4. Use absolute HTTPS URLs. Make images fetchable without login.
5. Escape JSON-LD for HTML `<script>` (see geo.md TanStack section): no raw `</script>`, prefer `\u003c` `\u003e` `\u0026`.
6. Run Rich Results Test (URL + snippet). Fix critical errors.
7. After deploy, confirm in Search Console rich-result reports.

## Sources

- https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/essentials/spam-policies
- https://search.google.com/test/rich-results
- https://validator.schema.org/
- https://developers.google.com/search/updates
- Feature guides linked in each type section
- https://schema.org/ (vocabulary only)
