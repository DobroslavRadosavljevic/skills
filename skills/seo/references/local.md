# Local SEO

Researched 2026-08-17 from Google Search Central, Google Business Profile Help, and Maps user-content policy. Prefer those URLs over citation-broker blogs.

**FACT** = stated in a cited official source. **JUDGMENT** = implementation choice or a rule derived by combining official purposes.

## Official sources

- Establish business details: https://developers.google.com/search/docs/appearance/establish-business-details
- Get on Google: https://developers.google.com/search/docs/fundamentals/get-on-google
- LocalBusiness structured data: https://developers.google.com/search/docs/appearance/structured-data/local-business
- Organization structured data (`sameAs`, contact): https://developers.google.com/search/docs/appearance/structured-data/organization
- Review snippets / self-serving reviews: https://developers.google.com/search/docs/appearance/structured-data/review-snippet
- Structured data policies: https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- Spam policies (doorways, cloaking, link spam, keyword stuffing): https://developers.google.com/search/docs/essentials/spam-policies
- Customer support methods: https://developers.google.com/search/blog/2021/07/customer-support
- Represent your business (name, address, service area, phone): https://support.google.com/business/answer/3038177
- Fake and misleading reviews (Maps UGC): https://support.google.com/contributionpolicy/answer/7400114
- Title links: https://developers.google.com/search/docs/appearance/title-link
- Meta descriptions: https://developers.google.com/search/docs/appearance/snippet

## Hard rules

1. Split work: **code** can ship location pages, NAP on the site, JSON-LD, maps, click-to-call, and sitemaps. **The user** must claim, verify, and maintain Google Business Profile (GBP). Agents cannot complete GBP verification in a repo. **FACT:** establish-business-details; get-on-google.
2. One real-world location → **one** GBP and **one** canonical location URL. Do not create duplicate profiles or doorway city pages. **FACT:** support.google.com/business/answer/3038177; spam-policies (Doorway abuse).
3. Show the same **name, address, and phone (NAP)** on the site, in JSON-LD, and in GBP. Represent the business as it is recognized in the real world. **FACT:** GBP representation guidelines.
4. Do not invent storefront addresses, virtual offices, or keyword-stuffed names. **FACT:** GBP guidelines (virtual offices ineligible; name must match real-world name).
5. Location pages need **unique, useful** content. Do not generate city pages that only swap a city name and funnel users to one form. **FACT:** doorway abuse examples include multiple pages targeted at regions or cities that funnel users to one page; keyword stuffing includes blocks of cities a page is trying to rank for.
6. LocalBusiness JSON-LD **requires** `name` and `address`. Use the most specific subtype. Markup must match visible page content. **FACT:** local-business; sd-policies.
7. Do **not** mark up self-serving reviews or star ratings for your own `LocalBusiness` / `Organization`. **FACT:** review-snippet; local-business (`review` / `aggregateRating` recommended only for sites that capture reviews about **other** businesses).
8. Never create, buy, incentivize, or fake reviews. **FACT:** Maps UGC policy; review-snippet (no fake or undisclosed incentivized reviews).
9. Do not buy directory links or run citation spam to manipulate rankings. **FACT:** link spam on spam-policies.
10. Phone numbers in markup and on the page must include **country code and area code**. Location `url` must be a working, fully-qualified link for **that** location. **FACT:** local-business.

---

## 1. Google Business Profile vs on-site

**FACT:** Claiming a Business Profile lets a verified owner edit address, contact info, business type, and photos so the business can appear in Maps and the knowledge panel. Source: establish-business-details.

**FACT:** Search Console verification is how you prove website ownership. Structured data on the site helps Google understand the page. Knowledge panel details can also come from public web data; verified representatives can suggest overrides. Source: establish-business-details.

### What the agent does in code

| Task | Do this |
| --- | --- |
| Location URLs | One indexable URL per physical location (or a clear service-area page if there is no storefront) |
| Visible NAP | Name, postal address, phone, hours on the location page and typically in the footer of that location’s templates |
| JSON-LD | `LocalBusiness` (or a more specific subtype) on the page that describes that location |
| Organization / logo | Home or About: Organization markup if the brand is not only a single shop. **FACT:** organization + local-business (local sites should follow LocalBusiness required fields **and** Organization recommendations) |
| Contact / support | Dedicated contact or support page, linked from nav or footer, listed in the sitemap. **FACT:** customer-support blog |
| Maps / call / directions | Embed or link Maps; `tel:` links; directions links (see §6) |
| Internal links | Store locator → location pages; breadcrumbs |
| Sitemap | Include every location URL |
| `sameAs` | Official profiles the business actually owns (see JSON-LD) |

### What the user must do in GBP

Tell the user. Do not pretend the deploy finishes local SEO.

| Task | Owner |
| --- | --- |
| Create / claim the profile | User |
| Verify ownership (postcard, phone, email, video, etc.) | User |
| Exact business name (no taglines, keywords, hours in the name) | User — agent may draft a compliant name |
| Categories (fewest that describe the core business) | User |
| Storefront address vs hidden service area | User |
| Hours, special hours, attributes, products, photos, posts | User |
| Website URL = the location page (or homepage for a single location) | User; agent supplies the URL |
| Respond to reviews and Q&A | User |
| Multi-location: one profile per location; departments as separate profiles when they qualify | User |

**FACT (GBP):** There should be only one profile per business. Represent the business as it is consistently shown on signage, stationery, and branding. Choose the fewest categories that describe the core business.

**FACT (customer-support blog):** Local businesses should create a GBP **and** consider LocalBusiness structured data.

---

## 2. NAP consistency; address; phone; service area vs storefront

**NAP** = name, address, phone. Official docs say “represent your business as it’s consistently represented in the real world” and give field-level rules. They do not use “NAP” as a product term. **JUDGMENT:** treat NAP as the implementation label for that consistency.

### Name

**FACT (GBP name rules).** Use the real-world name. Do **not** put in the name: marketing taglines, store codes, ™/®, full-caps words (unless the brand is actually styled that way, e.g. KFC), hours, phone, URL, gimmicky special characters, product/service stuffing, “near SOHO”-style location SEO, containment (“inside Best Buy”), or bilingual name repetition.

Ship the **same** string on the location `<h1>`, JSON-LD `name`, title (plus city if needed for disambiguation), and the name you instruct the user to enter in GBP.

### Address

**FACT (GBP):**

- Precise, accurate address and/or service area. No remote P.O. boxes as the location.
- Profile the actual real-world location. Suite / floor / building in the proper lines.
- Line 1 = physical street; Line 2 = mailbox or suite if required.
- Virtual offices (rented mail address, no operations) are **not** eligible.
- Co-working offices need clear signage, customer receiving during hours, and staffing by **your** staff during hours.
- No URLs or keywords in address lines.
- One page (profile) per location. Do not duplicate the same location across accounts.
- Storefronts that show an address should have **permanent fixed signage** of the business name there.
- If the street number is missing or unfound, the user pins the map in GBP.

**On-site:** print the address in the local format users in that country expect. In JSON-LD split `streetAddress`, `addressLocality`, `addressRegion`, `postalCode`, `addressCountry` (ISO 3166-1 alpha-2). **FACT:** local-business; organization (`addressCountry` is the two-letter code).

### Phone

**FACT (GBP):** Provide a number that connects to **that** location, or a site that represents that location. Prefer a **local** number over a central call center. No numbers or URLs that redirect to a different business or a social landing page. The number must be under the business’s direct control. No premium-rate numbers.

**FACT (local-business / organization):** Include country code and area code. Example style: `+12122459600`.

**On-site:** show the same E.164-style number users can tap (`tel:+12122459600`). Do not swap tracking numbers in JSON-LD that differ from the visible number. **FACT (sd-policies):** do not mark up information that is not visible to the user.

### Service-area vs storefront

**FACT (GBP):**

- Service-area businesses (travel to the customer) get **one** profile for the central office, with a designated service area. Hide the address when it is a residential / non-customer location (e.g. plumber working from home).
- Hybrid (customers visit **and** you travel): show the storefront **and** set a service area if the location is staffed and can receive customers during stated hours.
- Multiple service bases with separate staff and areas: one profile per base. Overall service area should not extend farther than about **two hours’ drive** from the base (larger areas only when appropriate).
- Age-restricted products/services (alcohol, cannabis, weapons) are **not** permitted as service-area-only profiles without a storefront.
- Google decides how the address displays from your data and other sources.

**On-site JUDGMENT:**

- Storefront: full street address, map, directions, parking, hours.
- Service-area only: city/region served, response area, **do not** publish a fake shopfront. You may still use a service-area landing page with unique copy. If you omit a public street address, do not invent one in JSON-LD.

---

## 3. Location pages (no doorway city pages)

**FACT (spam-policies, Doorway abuse):** Pages created to rank for specific similar queries that send users to a less useful intermediate page. Examples include multiple domains or pages targeted at regions or cities that funnel users to one page; generated pages that only exist to push people into the “real” site; substantially similar pages that look more like search results than a browsable hierarchy.

**FACT (2015 doorway clarification, still consistent with the policy page):** Ask whether the page is an integral part of the user experience or exists to funnel search traffic; whether it duplicates aggregations already on the site; whether it is an “island” only linked for search engines. Source: https://developers.google.com/search/blog/2015/03/an-update-on-doorway-pages

**FACT (keyword stuffing):** Blocks of cities and regions a page is trying to rank for are an example of stuffing.

**Ship a location page only when it is a real destination.** Include, as applicable:

- Unique intro: this location’s services, neighborhood, access, team, or inventory — not a template with `{{city}}` swapped.
- NAP, hours, departments, parking, transit, accessibility.
- Location-specific photos (crawlable).
- Actions: call, directions, book, menu.
- Internal links to related services **and** the store locator. Do not orphan the page.

**Do not**

- Mass-create `/plumber-austin`, `/plumber-dallas`, … that share one body and one phone.
- List 50 cities in the footer as the main “content.”
- `noindex` the useful location page while indexing thin city copies.
- Point many city URLs at one canonical homepage to “rank everywhere.”

**Titles:** unique per location. Include business name and locality. Match the page language. **FACT:** title-link (no boilerplate titles).

**Descriptions:** unique; hours and locality are useful. **FACT:** snippet examples include opening hours and location.

---

## 4. LocalBusiness JSON-LD

**FACT:** Place markup on the page that contains the business information (any page is allowed; a location page is the usual fit). Use JSON-LD unless the project already uses Microdata/RDFa. Source: local-business; intro structured data.

**FACT:** Use the most specific subtype (`Restaurant`, `Store`, `Dentist`, …). Multiple types: `"@type": ["Electrician", "Plumber"]` — `additionalType` is not supported.

**FACT:** Required for Local Business rich-result eligibility: `name`, `address` (`PostalAddress` with as many fields as possible).

**FACT:** Recommended (Google-supported): `geo` (lat/long **≥ 5 decimal places**), `openingHoursSpecification`, `telephone`, `url` (working URL of **this** location), `priceRange` (< 100 characters), `department`, `menu` (food), `servesCuisine` (restaurants), `image` (especially restaurant carousel). `review` / `aggregateRating` only if the **site reviews other businesses**.

**FACT:** Opening hours — English schema.org day names (`Monday` or full URL). Times `hh:mm` or `hh:mm:ss`. 24 hours: `opens` `00:00`, `closes` `23:59`. Closed all day: both `00:00`. Past midnight: one spec (e.g. Saturday `18:00`–`03:00`). Seasonal: `validFrom` / `validThrough` (`YYYY-MM-DD`). Omit those two for year-round hours.

**FACT:** Departments — nest `department` with its own hours/phone when they differ. Name format `{store name} {department name}` unless the department is its own brand (`Best Buy` / `Geek Squad`).

**FACT (organization):** `sameAs` = URLs on other sites with more information (social or review **profiles**). Multiple allowed. For a local site, follow LocalBusiness required/recommended fields **plus** Organization recommendations. Put Organization-level admin data on Home/About, not necessarily on every location.

**Do not** put `review` / `aggregateRating` on your own restaurant page to display stars. **FACT:** if the reviewed entity controls the reviews (including an embedded GBP or Facebook widget), `LocalBusiness` / `Organization` pages are ineligible for the star review feature. Source: review-snippet.

**Validate** with the Rich Results Test. Confirm the page is not `noindex`, not blocked by robots.txt, and not login-gated. Source: local-business.

### Minimal storefront example

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Restaurant",
  "name": "Dave's Steak House",
  "image": [
    "https://example.com/photos/1x1/photo.jpg",
    "https://example.com/photos/4x3/photo.jpg",
    "https://example.com/photos/16x9/photo.jpg"
  ],
  "address": {
    "@type": "PostalAddress",
    "streetAddress": "148 W 51st St",
    "addressLocality": "New York",
    "addressRegion": "NY",
    "postalCode": "10019",
    "addressCountry": "US"
  },
  "geo": {
    "@type": "GeoCoordinates",
    "latitude": 40.761293,
    "longitude": -73.982294
  },
  "url": "https://www.example.com/restaurant-locations/manhattan",
  "telephone": "+12122459600",
  "priceRange": "$$$",
  "servesCuisine": "American",
  "menu": "https://www.example.com/menu",
  "openingHoursSpecification": [
    {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": ["Monday", "Tuesday"],
      "opens": "11:30",
      "closes": "22:00"
    }
  ]
}
</script>
```

Adapted from the official example on local-business. **Do not** copy the official sample’s `review` object onto a first-party restaurant site.

### `sameAs`

```json
"sameAs": [
  "https://www.facebook.com/example",
  "https://www.instagram.com/example"
]
```

**JUDGMENT:** Only profiles the business controls. Do not add Wikipedia or random directories you do not own unless the page is truly about this organization.

---

## 5. Local pack / Maps; reviews; citations

### Local results and Maps

**FACT:** Search or Maps may show a knowledge panel for a matching business, or a carousel of businesses for a category query (e.g. restaurants). LocalBusiness markup can supply hours, departments, and (when eligible) reviews. Bookings/orders in Search use the Maps Booking API, not DIY JSON-LD. Source: local-business.

**FACT:** GBP is how you manage appearance on Maps and Search for a local business. Source: establish-business-details; get-on-google.

Industry name **“local pack”** is not a Search Central product title. **JUDGMENT:** treat it as the Maps/local-results block. You do not “enable the pack” in code. You make the business eligible with a verified GBP, accurate NAP, a real location or service area, and a crawlable site.

### Reviews

**FACT (Maps UGC):** Reviews must reflect a genuine, unbiased experience. Forbidden: fake engagement; paid or in-kind reviews; multi-account posting; emulator / device-tampering; incentives for reviews or for removing negatives; posting on competitors to undermine them; selectively soliciting only positives; pressuring reviews on premises or dictating review text.

**FACT (Maps UGC):** Merchants **may** ask for genuine reviews **without** incentives and without steering rating or wording.

**FACT (review-snippet):** No fake reviews; no undisclosed incentivized reviews; for local businesses, ratings must come **directly from users** — do not have editors create or compile them; do not aggregate ratings from other websites.

**Agent rules**

- Do not generate review text, star markup for the owner’s own business, or “seed” reviews.
- Do not build “review exchange” or paid-review flows.
- You may add a link: “Review us on Google” that opens the official GBP review URL the user provides.
- You may display first-party testimonials as **visible quotes** without `AggregateRating` on your own `LocalBusiness`.

### Citations (directories)

Google Search Central does not publish a “build 50 citations” playbook.

**FACT:** Local inbound links and Business Profile signals can help Google infer audience on multi-regional sites. Source: managing-multi-regional-sites.

**FACT:** Buying/selling links, automated link creation, and scaled comment/directory spam are link spam. Source: spam-policies.

**Do this**

1. Keep NAP identical on the official site and on directories the business **already** uses (chamber, Apple Maps, Bing Places, industry regulators).
2. Create or claim listings only where the business truly operates and the directory is a normal customer channel.
3. Do not buy citation packages, PBNs, or embedded-map link schemes.
4. Do not stuff city-landing backlinks.

**JUDGMENT:** A few accurate official listings beat hundreds of scraped, conflicting ones.

---

## 6. Embedded maps, click-to-call, directions

These help users and give Google extractable contact/location facts. They do not replace GBP.

**FACT:** List all support methods (email, chat, social, telephone) on a findable contact page; link it from the home footer or menu; include it in the sitemap. A phone with recorded routing still helps Google show an official number. Source: customer-support blog.

**FACT:** `telephone` is the primary customer number; `url` must work. Source: local-business.

**Do this**

1. **Click-to-call:** visible number + `href="tel:+1…"` (same digits as GBP and JSON-LD). Sufficient tap target.
2. **Directions:** link to Google Maps directions for the **exact** coordinates or place. Example pattern: a Maps search or directions URL for the official address. Do not deep-link a different pin than JSON-LD `geo`.
3. **Embed:** official Maps embed (iframe) or equivalent on the location page. Give the iframe an accessible name (`title="Map of {name}, {city}"`). Do not block `google.com/maps` in robots.txt in a way that breaks the embed; the **location page** must stay crawlable.
4. Put hours and the address in **HTML**, not only inside the iframe. Google and users must read them without the widget. **FACT:** structured data must reflect user-visible content (sd-policies).
5. On mobile, keep call and directions in the first screen of a location page. **JUDGMENT:** UX, not a ranking switch.

---

## 7. Multi-location architecture

**FACT (GBP):** One profile per location. Departments and individual practitioners may have separate profiles when they qualify (see the same guidelines article). Do not create more than one page/profile for the same location.

**FACT (local-business):** Define **each** location as its own `LocalBusiness`. `url` is the fully-qualified URL of **that** location.

**FACT (organization):** You may supply multiple `address` objects on Organization for multi-city brands, but a local business site should still follow per-location LocalBusiness markup.

**Recommended site shape (JUDGMENT, aligned with “url of the specific business location”):**

```
/locations                  → locator (search, map, list)
/locations/city-neighborhood → one location
/locations/city-neighborhood/pharmacy → department page if it has its own hours/phone/URL
```

**Do this**

1. Store locator is a directory, not a doorway: it lists real locations with unique links.
2. Each location: unique URL, unique title/description, unique JSON-LD (`url` = self), unique visible NAP/hours.
3. Canonical: self. Do not canonicalize all shops to headquarters.
4. Internal links: header “Locations”, breadcrumbs, related nearby stores if useful.
5. Homepage Organization (brand) + location pages LocalBusiness (each shop). Do not dump every shop’s full graph on every page.
6. GBP website field = that location’s URL when the profile is for that shop; headquarters homepage only for a single-location brand.
7. Departments with distinct hours/phone: nest `department` in JSON-LD **and** tell the user to follow GBP department rules (separate profile when required).
8. International multi-location: combine this file with locale URLs and hreflang on **equivalent** pages (e.g. `/en-gb/locations/soho` ↔ `/fr-fr/locations/soho` only if they are the same place’s translations — not two different shops).

**Restaurant host carousel** is limited-access. Do not implement Carousel markup unless the user is in that program. **FACT:** local-business.

---

## Agent procedure

1. Ask: storefront, service-area, hybrid, or multi-location? How many real addresses?
2. For each real location, add or audit one URL, visible NAP, hours, actions, and JSON-LD.
3. Kill thin city doorways and duplicate NAP variants.
4. Give the user a GBP checklist (claim, verify, name, category, address vs service area, website URL, photos, review policy).
5. Add contact page + `tel:` + directions + embed.
6. Validate JSON-LD (Rich Results Test). Submit location URLs in the sitemap.
7. Stop. Do not fake reviews, citations, or coordinates.

## Checklists

### Split of responsibility

- [ ] Location pages, NAP, JSON-LD, maps, `tel:`, sitemap shipped in code
- [ ] User told to claim/verify GBP and match NAP
- [ ] Website field in GBP equals the location URL you shipped

### On-site location page

- [ ] Unique URL and unique copy (not `{{city}}` only)
- [ ] Visible name, address (or honest service area), phone, hours
- [ ] `tel:` and directions
- [ ] Map embed with accessible name; address also in HTML
- [ ] Unique title and meta description
- [ ] In sitemap and store locator
- [ ] No city-list keyword stuffing

### JSON-LD

- [ ] Most specific `@type`
- [ ] Required `name` + `address`
- [ ] `geo` ≥ 5 decimals when you have a real pin
- [ ] `openingHoursSpecification` matches visible hours
- [ ] `telephone` with country code; `url` is this page
- [ ] `department` only when hours/phone/name differ
- [ ] `sameAs` only owned profiles
- [ ] No self-serving `review` / `aggregateRating`
- [ ] Markup matches visible content
- [ ] Rich Results Test clean of critical errors

### Compliance

- [ ] No fake, paid, or gated-positive-only reviews
- [ ] No citation or link spam
- [ ] No virtual-office or keyword-stuffed GBP name (instruct user)
- [ ] One profile and one URL per real location
