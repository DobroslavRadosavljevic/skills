# SEO copywriting

Write public-page copy that a searcher can use, a human will trust, and a snippet or assistant can quote. Pair with [on-page.md](on-page.md) for titles/headings/intent and [ee-at.md](ee-at.md) for proof. This file is **how to write**. Those files are **what Search expects**.

Research date: 2026-08-17. Label **FACT** vs **JUDGMENT**.

**FACT:** People-first content is what ranking systems aim to reward. Search-engine-first copy (stuffing, scaled rewrites, shocking titles the body cannot keep) is a warning sign. Source: [Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

**FACT:** Place words people would search in prominent locations: title, main heading, alt, link text. Do not stuff. Source: [Search Essentials](https://developers.google.com/search/docs/essentials), [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

**FACT:** There is no ranking word-count target. Source: helpful-content + starter-guide myths.

## Ground in this product

Before drafting:

1. Read in-repo voice or messaging docs if they exist (`COPYWRITING.md`, brand notes, homepage, pricing). Follow them. Do not invent a brand book.
2. Extract customer words from UI, support, sales copy, and ICP notes. Prefer those over category jargon.
3. List claims that must stay true (price, “#1”, “unlimited”, medical/financial). Unsupportable claims do not ship.
4. If voice is undocumented, write **plain, specific, second person** and label assumptions.

Do not overwrite a documented voice to “sound more SEO.”

## Job of the copy

Every indexable URL does **one** searcher job and **one** business job.

| Intent | Searcher job | Copy job | Primary CTA |
| --- | --- | --- | --- |
| Informational | Finish understanding | Answer first, then depth, then next step | Learn more / related hub / product only if earned |
| Commercial | Choose | Criteria, comparison, honest limits | Compare / see pricing / start trial |
| Transactional | Act | Remove friction; price and next step visible | Buy / start / book |
| Local | Visit or call | NAP, hours, area, what happens next | Call / directions / book |
| Navigational | Arrive | Name the destination; get them there | Log in / open app |
| Docs | Do the task | Accurate steps; version; failure cases | Next procedure |

If the SERP is informational and the only CTA is “Buy now” in the first screen, the copy is misaligned. **JUDGMENT.**

## Voice and tone

**JUDGMENT** defaults when the repo is silent:

- **You** for the reader, **we** for the company. Name the product; do not hide behind “the platform.”
- Concrete nouns and verbs. Cut intensifiers (`very`, `robust`, `seamless`, `cutting-edge`, `leverage`, `unlock`, `supercharge`).
- One idea per sentence. Short paragraphs (1–3 sentences) on marketing pages. Docs may be denser.
- Active voice. Name the actor.
- Formality matches the audience: billing/YMYL calmer than a changelog; docs precise, not cute.

### We sound like

- Specific: “Export CSV of the last 90 days of invoices.”
- Honest: “No native Salesforce sync. Use the REST API.”
- Useful: the next sentence teaches or decides something.

### We do not sound like

- Keyword soup: “Best invoice software invoice tool invoices online.”
- Unowned superlatives: “The world’s #1 AI-powered synergy platform.”
- Fake intimacy: “Hey friend!! Let’s dive in 🚀.”
- Corporate fog: “Empowering teams to unlock value at scale.”

If the brand *is* playful, keep playfulness in asides — not in the H1, price, or legal claim.

## Searcher language

1. Open the live SERP and the brief’s primary query. Use the **searcher’s noun** in the H1 and first sentence if it is accurate.
2. Add the expert term once, defined, if practitioners search both (`webhook` and `HTTP callback`).
3. Do not force an exact-match phrase that the product does not use. Accuracy beats a synonym Google can already match. **FACT:** language systems match related phrasing — [ranking systems](https://developers.google.com/search/docs/appearance/ranking-systems-guide).
4. Nav labels and breadcrumbs use the same words as titles when they point at the same job (`Pricing`, not `Plans & packaging` on one URL and `Pricing` on another).

## Promise stack (every indexable page)

Write these **before** the body. They must agree.

| Layer | Rule |
| --- | --- |
| `<title>` | Unique; distinctive clause first; no clickbait the body cannot keep. Details: [on-page.md](on-page.md), [metadata.md](metadata.md) |
| H1 | One. Same promise as the title. Not a keyword list |
| Deck / first 40 words | Who it is for + outcome + scope. Include the primary entity name |
| Meta description | Pitch + one proof + CTA. Unique. Expect Google to rewrite from the body |
| OG title/description | Same promise; may be slightly shorter; no “HOME” leftovers |
| Primary CTA | One verb + destination. Visible without hunting |
| Proof | Near the claim it supports (logo, number + method, screenshot, quote with name) |

**Do not** write a clever H1 and a stuffed title that say different things.

## Answer first

**JUDGMENT** (also GEO-useful; see [geo.md](geo.md)):

1. First paragraph answers the query in plain language.
2. Then mechanism, proof, caveats, and CTA.
3. Put the definition or decision in a sentence a third party could quote without the rest of the page.
4. Date and version when the fact can rot (“As of August 2026, …”).

```
Weak: “In today’s fast-paced world, invoicing is more important than ever.”
Strong: “Acme Invoice sends payment links and records payouts. It does not replace your accountant.”
```

## Specificity and proof

Replace adjectives with facts.

| Weak | Strong |
| --- | --- |
| Fast | “Typical export under 10 seconds for 10k rows” |
| Affordable | “$29/mo, up to 3 seats” |
| Trusted | “Used by 1,200 bookkeepers (count: billing DB, 2026-07)” |
| Easy | The actual steps, numbered |
| Secure | Named controls (SSO, SOC 2) you actually have |

**Do not** invent statistics, customer counts, awards, or “studies show.” If the number is unknown, omit it or ask. Same rule as [ee-at.md](ee-at.md).

Testimonials: real name, role, and a specific outcome. No “John D., CEO” fiction. Review stars only if they are real and allowed — [structured-data.md](structured-data.md).

## One primary CTA

**JUDGMENT:**

- One filled primary action per view (`Start free trial`, `See pricing`, `Read webhook retries`).
- CTA verb matches intent. Informational pages may CTA to a hub or the next guide, not checkout.
- Button text is the outcome, not `Submit` / `Click here` / `Learn more` with no object.
- Secondary CTA is text or outline, not a second filled button.
- Do not hide price if the query is `pricing` / `cost`.

## Page-type copy

### Home

- H1 = what it is + for whom (not a slogan that needs a decoder).
- Subhead = the mechanism or the constraint you remove.
- Proof band before feature grid.
- Feature blurbs: outcome first, then how. Three to six, not twelve equals.
- Final CTA repeats the same verb as the hero.

### Landing / use-case

- One audience, one job. Do not recopy the homepage.
- Open with their situation. Name the alternative they already use.
- Objection section (security, migration, limits) in their words.

### Pricing

- Lead with who each plan is for, not adjective names only (`Starter` needs a sentence).
- Show price, what’s included, what is not. “Contact us” is fine if that is true — do not invent a “from $0.”
- Footnotes for overage, annual vs monthly, seats.

### Compare / alternatives

- Named criteria row by row. Include where you lose.
- No insult copy. State facts (`No desktop app. Browser only.`).
- Pairwise pages need unique intros; do not swap one noun in a template.

### Blog / guide

- Title is the outcome or question, not a teaser.
- First screen: answer + who this is for + what you will not cover.
- H2s follow the job sequence. Answer in the first 1–2 sentences under each H2.
- Close with the next internal URL, not a generic newsletter beg unless that is the product.

### Docs

- Imperative steps. Prerequisites first. Show the failure (`If you see 401…`).
- Do not market in the procedure. Link to pricing/compare for commercial intent.
- Version the API or UI the steps assume.

### Product / marketplace PDP

- Unique first 100 words. Do not paste the manufacturer sheet as the only copy.
- Specs in a scanable list. Availability and price in the same language as the `Offer` markup.
- Variant copy: say what changes (color, size), do not duplicate the whole essay.

### Location

- Unique paragraph about **this** place or service area. Hours, parking, what to bring.
- No “best plumber in {city} {city} {city}.” See [local.md](local.md).

### Legal

- Accurate and dull on purpose. Do not SEO-spice privacy policies.

### App chrome (`noindex`)

- Functional labels. Do not write marketing H1s on settings.

## Headings as copy

- H1 = page job. H2 = reader questions or steps. H3 = substeps.
- Prefer `How retries work` over `Retry functionality overview`.
- Do not use heading tags for visual size.
- Do not stack eight keyword H2s with two-sentence stubs.

## Lists, tables, and scannability

- Use a table when the searcher is comparing (plans, vs, limits).
- Use numbered steps when the searcher must do something in order.
- Use bullets for parallel facts, not for fake “paragraphs.”
- Lead bullets with the distinguishing word (`SSO`, not `Ability to configure…`).

## Internal-link copy

Anchors are copy. They tell people and Google the target’s job.

- `Webhook retry rules` — good.
- `click here`, `this article`, `read more` — bad.
- Exact-match spam in every paragraph — bad.
- Same destination can use slightly different anchors; do not rotate synonyms as a trick.

See [internal-linking.md](internal-linking.md).

## AI-assisted drafts

**FACT:** Automation / generative AI used mainly to manipulate rankings is scaled content abuse. AI that adds structure to original work can be fine if the page is people-first. Sources: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies), [Using gen AI content](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).

**Do this**

1. Draft from first-hand notes, product behavior, and the brief — not from the top 10 alone.
2. Cut throat-clearing (`In this article we will explore…`, `In today’s digital landscape…`).
3. Cut synonym loops and fake transitions (`Moreover`, `Additionally`, `It’s important to note`).
4. Replace generic examples with this product’s UI, limits, and names.
5. Fact-check every number, name, and “always/never.”
6. Read aloud. If a sentence could sit on any competitor’s site, rewrite or delete.

**Do not** publish a page whose only originality is synonymizing a ranking article.

## Claims and compliance

- Superlatives need a defined set and date (`Fastest checkout in our last 50 mystery shops, Mar 2026`) or they come out.
- YMYL (health, money, safety, civic): calmer voice, sources, no DIY medical/financial instructions you cannot stand behind. [ee-at.md](ee-at.md).
- Prices, availability, hours: must match visible UI and structured data.
- “Free” / “unlimited” / “no credit card” must be true for the path the CTA opens.
- Outbound claims about competitors: verifiable and current; date the check.

## i18n copy

- Translate the **job**, not word-for-word English SEO. Each locale gets its own title, H1, description, and CTA idiom.
- Do not leave English titles on translated bodies (rewrite risk). [on-page.md](on-page.md), [i18n.md](i18n.md).
- Units, currency, and date formats match the locale.

## Microcopy that leaks into Search

Nav, footer, 404, empty states, and button labels get used as title-link or sitelink hints.

- Unique, compact labels (`Pricing`, `Docs`, `Login`).
- 404: say the resource is gone; offer hubs; do not keyword-essay a 404.
- Form errors: what failed + what to do. Not SEO real estate.

## Ship checklist

- [ ] Matches documented voice (or labeled default)
- [ ] One intent; title, H1, deck, and CTA agree
- [ ] Searcher noun appears naturally in H1 + first paragraph
- [ ] Answer-first; no throat-clearing
- [ ] Claims supportable; no invented stats
- [ ] One primary CTA; verb matches intent
- [ ] Unique title and meta description
- [ ] Internal anchors describe destinations
- [ ] Could not be pasted onto a competitor site unchanged
- [ ] Locale-complete if this URL is translated

## Sources

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/essentials
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
