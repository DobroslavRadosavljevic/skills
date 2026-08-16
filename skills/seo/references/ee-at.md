# E-E-A-T, YMYL, and what agents must not fabricate

Research date: 2026-08-17. E-E-A-T is a **quality framework**, not a score you can mark up. Pair this file with `on-page.md` for titles, snippets, and spam definitions.

## Official sources

- Creating helpful, reliable, people-first content (E-E-A-T + Who/How/Why): https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- SEO Starter Guide (helpful, reliable, people-first; myths including “Thinking E-E-A-T is a ranking factor”): https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- Search Essentials: https://developers.google.com/search/docs/essentials
- Spam policies: https://developers.google.com/search/docs/essentials/spam-policies
- Experience added to E-A-T (2022-12-15): https://developers.google.com/search/blog/2022/12/google-raters-guidelines-e-e-a-t
- Search Quality Rater Guidelines (General Guidelines, 2025-09-11): https://static.googleusercontent.com/media/guidelines.raterhub.com/en//searchqualityevaluatorguidelines.pdf
- Article + author markup: https://developers.google.com/search/docs/appearance/structured-data/article
- Profile page structured data: https://developers.google.com/search/docs/appearance/structured-data/profile-page
- Organization structured data: https://developers.google.com/search/docs/appearance/structured-data/search-gallery
- Generative AI on websites: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- Google Search and AI-generated content (2023-02): https://developers.google.com/search/blog/2023/02/google-search-and-ai-content
- Structured data quality / no impersonation: https://developers.google.com/search/docs/appearance/structured-data/sd-policies

**FACT:** Rater guidelines “don’t directly influence ranking.” They are how Google trains humans to evaluate whether ranking systems surface helpful results. Use them to self-assess. Helpful-content page + 2022 E-E-A-T blog.

**FACT:** “Thinking E-E-A-T is a ranking factor — No, it’s not.” Starter Guide myths table. Systems use **many factors** that identify content with good E-E-A-T. Trust is weighted more on YMYL topics. Helpful-content page.

---

## 1. The four letters

**FACT** (helpful-content + SQRG 3.4 + 2022 blog):

| Letter | Meaning | Question to answer on the page |
| --- | --- | --- |
| **Experience** | First-hand or life experience with the thing | Did the creator use the product, visit the place, do the procedure, live the situation? |
| **Expertise** | Knowledge or skill adequate to the topic | Would you take this advice from this person (electrician vs enthusiast on wiring)? |
| **Authoritativeness** | Go-to source for the topic (creator or site) | Is this the official or widely recognized source when one exists (passport.gov, the restaurant’s own hours)? |
| **Trust** | Accurate, honest, safe, reliable | Can a careful reader rely on this without being harmed or misled? |

**FACT:** Trust is the center. Experience, expertise, and authoritativeness **support** trust. Content need not demonstrate all three E-E-A aspects. A review can win on experience; a protocol can win on expertise. Untrustworthy pages have low E-E-A-T even if the creator is “expert” (a skilled scammer). SQRG 3.4.

**FACT:** Combinations overlap. First-hand work over time becomes expertise. Pick the mix that fits **page purpose + topic**. SQRG 3.4.

### What raters look at (copy this audit)

**FACT:** SQRG 3.4 — assess E-E-A-T from:

1. **What the site/creator says** — About, profile, credentials. Starting point only.
2. **What independent sources say** — News, reviews, references. If they conflict with self-claims, **trust independents**.
3. **What is visible on the page** — Main content, photos of the work, comments that confirm or deny skill.

Conflict of interest lowers trust: manufacturer “reviews,” paid influencer “reviews” without disclosure. First-hand owner reviews can be high trust. SQRG 3.4.

---

## 2. Demonstrate E-E-A-T on the page

Do not add an “E-E-A-T section” of adjectives. Show evidence.

### Who created it

**FACT:** Helpful-content “Who”: make authorship self-evident; bylines where readers expect them; bylines link to more information about the author and what they write.

**FACT:** SQRG 2.5.2–2.5.3: it should be clear **who is responsible for the website** and **who created the page’s main content**. About / Contact / customer service matter; they matter **more** for sites that handle money. Aliases are acceptable on forums/UGC.

**Procedure:**

1. Put a visible byline on articles, reviews, guides, docs-with-opinions.
2. Link the byline to a **real** profile URL (staff page, ProfilePage). List **all** authors shown on the page in markup; one author object per person; `Person` vs `Organization` correctly; `author.name` is only the name (title/honorific in their own properties). **FACT:** article author best practices.
3. On the profile: role, relevant credentials, years/scope of practice, `sameAs` to real profiles, what they have published. No keyword-stuffed bios.
4. Site-level: About (who owns/operates), Contact (method that fits the risk), customer-service and return/payment policies for commerce.
5. Organization markup only for facts you display (legal name, logo, address, identifiers).

**JUDGMENT:** A first-name-only “Dr. Sarah” with a stock photo and no verifiable org is a trust defect, not a decoration issue.

### First-hand experience

**FACT:** 2022 blog: experience includes actual product use, visiting a place, communicating what a person experienced. Helpful-content people-first question: demonstrate first-hand expertise (used the product/service or visited the place).

**Show, do not claim:**

- Photos/video **you** took of the UI, the location, the lab, the install.
- Measurements: time to complete, error rates, bills, versions tested.
- Limits: what failed, what you did not test, which SKU/version.
- Product-review “How”: how many items, test method, results. Helpful-content “How” + Google’s high-quality product review guidance (linked from that page).

### Expertise

- State the domain of competence and its limits (“civil litigator, not tax advice”).
- Cite primary sources (statute, paper, vendor docs, dataset) next to claims.
- For specialist topics, name the reviewer if the writer is not the expert (and make that visible).
- Fix easily verified factual errors. **FACT:** helpful-content expertise questions.

### Authoritativeness

- Prefer being the **official** page for your own product, hours, pricing, API.
- Earn mentions by being citable; do not buy deceptive advertorials (link spam / site reputation abuse).
- Quote independent recognition only if real and in context.

### Trust (the non-negotiable)

**FACT:** SQRG examples of trust needs: stores → secure payment + real customer service; reviews → honest and for the buyer; YMYL info → accurate to prevent harm.

On-page trust controls:

- HTTPS, working contact, honest pricing, clear ads vs content.
- Sources next to medical/legal/financial claims.
- No impersonation, fake reviews, or markup that is not visible. **FACT:** structured data policies.
- Disclose automation when a reader would ask how the page was made. **FACT:** helpful-content “How” + gen-AI guidance.
- Disclose sponsorship, affiliate, and employment relationships.

---

## 3. YMYL — extra care

**FACT:** YMYL = topics that could significantly impact health, financial stability, safety, or the welfare/well-being of society. Systems give **more weight** to strong E-E-A-T here. Helpful-content page + SQRG 2.3.

**FACT:** YMYL is a **spectrum** (clear / maybe / not). Imagining a virus download on a pencil page does not make pencils YMYL. The **topic** must be able to cause that class of harm. SQRG 2.3.

| Type (SQRG) | Examples of clear YMYL | Usually not |
| --- | --- | --- |
| Health or safety | Heart-attack symptoms; medications in pregnancy; wiring a panel | Hobby craft with no safety claim |
| Financial security | How to invest; tax-form instructions; banking | “I like this budgeting app’s UI” |
| Government, civics, society | Who can vote; how to register; election procedures | Personal “why I vote” story |
| Other | Topics that can hurt people or society’s welfare | Shopping for ordinary pencils |

**FACT:** SQRG 3.4.1 — on YMYL, **advice/information** often requires expertise; **lived experience** can still be high E-E-A-T if trustworthy, safe, and **consistent with well-established expert consensus**.

| Topic | Experience is enough | Leave to experts |
| --- | --- | --- |
| Pregnancy sleep | Pillow setups from people who lived it | Which sleep drugs are safe |
| Liver cancer | Coping stories in a respectful forum | Treatment options and survival stats |
| Taxes | Comic about frustration | How to fill the forms |
| Retirement | Reviews of a tool the author used | How much to invest and in what |
| Voting | Why I vote locally | Eligibility and how to register |

### Agent procedure on YMYL

1. Classify: clear / maybe / not. If unclear, treat as clear.
2. Identify the responsible legal person or licensed professional. If none exists, do not publish advice.
3. Separate “what happened to me” from “what you should do.”
4. Align medical/civic/scientific claims with current consensus; link primary sources.
5. Featured snippets on public-interest topics must not contradict consensus. **FACT:** https://support.google.com/websearch/answer/9351707
6. Missing About/Contact on YMYL or money-handling sites is a lowest-quality pattern. **FACT:** SQRG 4.5.1.

---

## 4. Who / How / Why (run on every URL)

**FACT:** https://developers.google.com/search/docs/fundamentals/creating-helpful-content

### Who

- Is the author obvious?
- Does a byline exist where expected?
- Does it lead to real background?

Add accurate authorship. Do not invent it (see §6).

### How

- How was this produced? Tests, reporting, tooling, AI assistance.
- If automation substantially generated the page: is that self-evident? Why was it useful?
- Disclose when a reasonable reader would ask “How was this created?”

### Why

- **Correct why:** help people who arrive directly.
- **Wrong why:** attract search visits / manipulate rankings or generative AI responses.
- Wrong why + scaled gen-AI = spam policy violation. **FACT:** helpful-content + spam policies (2026 clarification that spam policies apply to generative AI responses in Search).

---

## 5. Self-assessment questions (official)

Copy from helpful-content. Fail any cluster → revise or kill the URL.

**Quality:** original reporting/research/analysis? substantial/complete? beyond the obvious? extra value vs sources? descriptive non-shocking title? bookmark/share worthy? magazine/encyclopedia quality? better than current results? not sloppy? not mass-produced across a network with no care?

**Expertise:** sourcing and author/site background? would research show the site is trusted on this topic? expert or demonstrable enthusiast? no easily checked factual errors?

**People-first:** real audience? first-hand depth? site has a purpose? reader can finish the job? satisfying experience?

**Search-engine-first (stop if yes):** made for rankings? many unrelated topics? extensive automation? only summarizing others? trend-chasing? reader must search again? writing to a word count? niche with no expertise? fake answers? date theater? churn for “freshness”?

---

## 6. What agents must NOT fabricate

These are hard stops. Fabrication is a trust failure and can be spam (misleading functionality, scaled content, fake structured data).

### Identity and credentials

- Do not invent authors, editors, reviewers, “medical reviewers,” or job titles.
- Do not assign real people’s names to text they did not write or review.
- Do not invent licenses, degrees, employers, or “as seen in” logos.
- Do not use stock photos as if they were the author or the product test.

### Evidence

- Do not invent statistics, quotes, citations, case studies, or customer names.
- Do not cite papers, laws, or docs you did not open. If the source is missing, omit the claim.
- Do not fake screenshots, lab results, or “we tested 47 tools” counts.

### Commerce and reviews

- Do not invent star ratings, review counts, prices, or stock status.
- Do not mark up Review/AggregateRating you do not display from real users. **FACT:** structured data policies (no fake reviews; markup must match visible content).
- Do not write first-hand voice (“I used this for 90 days”) unless the human named on the page actually did.

### Dates and freshness

- Do not set `datePublished` / `dateModified` or visible dates that do not match reality. **FACT:** helpful-content forbids fake freshness; article docs require accurate ISO dates.

### Medical, legal, financial, civic

- Do not give personalized diagnosis, dosing, legal conclusions, or investment directives.
- Do not contradict well-established consensus to chase snippets.
- Use scoped language: “This is general information, not advice for your situation,” only when the page is actually general — not as a fig leaf for reckless claims.

### AI output

- Do not publish model text that you cannot verify.
- Do not hide substantial AI generation on YMYL or review pages.
- Do not generate author bios, About pages, or testimonials.
- Do not mass-produce location/service pages from a city list (doorway + scaled abuse).

### If facts are missing

1. Ask the user for the real author, proof, and sources.
2. Write fewer claims.
3. Label unknowns as unknown.
4. Prefer no page over a confident false page.

---

## 7. On-page implementation checklist

Use on every indexable URL that can affect someone’s money, health, safety, or civic action; use a lighter version elsewhere.

**Visible**

- [ ] Responsible organization named and linked (About)
- [ ] Contact path that fits the risk (form is enough for a hobby blog; not for a store)
- [ ] Author or org byline when the genre expects it
- [ ] First-hand evidence or a clear “we did not test this” limit
- [ ] Sources for non-obvious claims
- [ ] Honest dates
- [ ] Ads/affiliates labeled
- [ ] AI/process disclosure if a reader would wonder

**Technical (must match the visible page)**

- [ ] `Person`/`Organization`/`ProfilePage`/`Article` authors consistent with bylines
- [ ] `sameAs` / `url` are real, crawlable profiles
- [ ] No review/price markup without on-page reviews/prices
- [ ] Legal pages linked from footer; policies dated

**Do not**

- [ ] Add “Our team of world-class experts” with no names
- [ ] Clone author boxes onto every AI draft
- [ ] Host off-topic third-party money pages to borrow authority (site reputation abuse)

---

## 8. Relationship to rankings (keep this straight)

| Claim | Label | Source |
| --- | --- | --- |
| E-E-A-T is a single ranking factor you can optimize with a plugin | False | Starter Guide myth table |
| Systems use many signals that identify helpful, reliable, people-first content with strong E-E-A-T | **FACT** | Helpful-content |
| Trust matters more on YMYL | **FACT** | Helpful-content + SQRG |
| Rater scores change your rankings directly | False | Helpful-content + 2022 blog |
| Fake authors/reviews/dates help “E-E-A-T” | False; they destroy trust and can violate spam/structured-data policies | This file §6 |
| Demonstrating who/how/why on the page is aligned with what systems reward | **FACT** | Helpful-content |

**JUDGMENT:** The agent’s job is to make responsibility, evidence, and limits **inspectable**. That is the entire implementation of E-E-A-T.
