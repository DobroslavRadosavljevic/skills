# Keyword research, briefs, and prioritization

Research date: 2026-08-17. Agent-operable without paid SEO suites. Label **FACT** vs **JUDGMENT**.

## Rules

1. Do not invent search volume, CPC, or keyword-difficulty numbers. Google does not publish KD.
2. Do not claim Search Console data unless the user pasted exports or screenshots. Ask; do not impersonate access.
3. One URL per intent cluster. Near-duplicates collapse to one canonical. Sources: [How Search works](https://developers.google.com/search/docs/fundamentals/how-search-works), [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).
4. Reject vanity keywords (prestige phrases with no buyer, no proof, or an unwinnable official SERP).
5. Do not ship an editorial calendar. Output a **next 5 pages** list.
6. People-first pages only. Source: [Creating helpful content](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## Workflow

### 0. Scope

Ask for: product one-liner, ICP, jobs-to-be-done, geos/languages, competitors, existing URL list, whether GSC exists. Read in-repo copy and positioning. Do not invent an ICP.

### 1. Seeds

Build 15–40 queries a person would type (not “topics”) from product, ICP, UI copy, support language, and competitor titles/H1s.

**FACT:** Google ranks by meaning/intent, not isolated keywords. [How ranking works](https://www.google.com/intl/en_us/search/howsearchworks/how-search-works/ranking-results/).

### 2. Expand (signed-out, target locale)

For each seed, record:

1. Autocomplete (seed, seed+space). Predictions are **not** a volume list. [Autocomplete help](https://support.google.com/websearch/answer/7368877).
2. People Also Ask / related searches — sibling phrasings. [Visual elements](https://developers.google.com/search/docs/appearance/visual-elements-gallery).
3. Top 5–8 titles/H1s and formats.
4. Competitor `/blog`, `/docs`, `/pricing`, `/compare`, `/alternatives`, `/integrations` inventory → one inferred query per URL.
5. Optional Google Trends for **relative** interest of already-found phrases.
6. If GSC exists: queries that already earn impressions (only first-party demand numbers allowed).

Stop when new strings are morphological variants.

### 3. Cluster by intent

Group queries one URL can fully satisfy. Split when the job or SERP format changes (`tool` vs `tool pricing` vs `tool login`).

**FACT:** Rater guidelines use Know / Know Simple / Do / Website / Visit-in-person. Ratings do not rank pages. [SQRG update](https://developers.google.com/search/blog/2023/11/search-quality-rater-guidelines-update).

Name clusters `{intent} — {primary query}`.

### 4. Map one URL

Per cluster: **upgrade** existing (preferred) | **new URL** | **no page**. Descriptive path. If two URLs compete, consolidate — do not add a third.

### 5. Reject vanity

Drop if: no ICP would say it; no first-hand proof; SERP is official properties you do not operate; only prestige impressions; “trending” with no job. Source: helpful-content tests.

## Modifiers (confirm on the live SERP)

| Pattern | Typical intent | Winning format | Action |
| --- | --- | --- | --- |
| `what is` | Know Simple | Definition | Glossary or section; no stub farm |
| `how to` | Do | Procedure + proof | Require a working procedure |
| `best` / `vs` / `compare` | Investigate | Criteria table | First-hand; no fake ranks |
| `alternative` | Switch | Honest compare | Hub + pairs; no smear |
| `pricing` / `cost` | Commercial | Real plans | Prefer the pricing URL |
| `buy` / `signup` | Transaction | Product | Do not intercept with a blog |
| `near me` / city | Local | Map pack | No fake city pages |
| `login` | Navigational | Official login | Never spoof |
| `template` / `checklist` | Do (artifact) | The artifact | Ship the file |
| `{error} fix` | Debug | Reproduced fix | Only if you reproduced it |
| `API` / docs | Implement | Docs | Prefer docs IA |
| version / “today” | Freshness | Changelog / dated recap | [Ranking systems](https://developers.google.com/search/docs/appearance/ranking-systems-guide) |

## SERP checklist

Target country, language, device. Your SERP ≠ the user’s. [Performance overview](https://support.google.com/webmasters/answer/7576553).

Record positions 1–10: domain, URL, format, proof, recency. Open top 3–5. Word count is **not** a Google target.

Note features with official names: text result, rich result, image/video, PAA, local pack, AI Overview / AI Mode, featured snippet. [AI features](https://developers.google.com/search/docs/appearance/ai-features).

**FACT:** An AI Overview is one SERP position; links inside share it. Impression requires the link in view. [Impressions](https://support.google.com/webmasters/answer/7042828).

Write 3–6 “winning requires” bullets. If winners are official docs / app stores / Wikipedia only, narrow the cluster or stop.

## Qualitative competitiveness

Score **Low / Medium / High / Blocked** from SERP evidence + 2 reasons. Never output “KD 67.”

Toward harder: official docs, governments, YMYL proof bar, local-pack-only, login SERP. Toward easier: thin lists, forums, a gap you can fill with first-hand proof.

## Content brief template

Mark unknowns `UNKNOWN — ask user`. Do not fabricate proof.

```markdown
# Brief: {working title}

## Searcher
- Role / ICP:
- Job (one sentence):
- Success when they leave:
- Anxiety / objection:

## Queries
- Primary:
- Secondaries (same cluster only):
- Explicit non-queries (other URLs):

## Intent
- Rater class: Know | Know Simple | Do | Website | Visit-in-person
- Dominant SERP format / locale / date:

## Outline
- H1 (descriptive)
- Answer-first block
- H2 sequence (job, not keyword list)
- Objections / edge cases
- Proof block
- CTA

## Unique angle / first-hand proof (required)
- What we know from doing the work:
- Artifacts (screenshots, numbers we own, method):
- What we will not copy from the top 10:

## CTA
- Primary verb + destination URL:
- Will not CTA:
- Voice (in-repo messaging if present; else plain/specific). Draft with [copywriting.md](copywriting.md).

## Schema
- Gallery types that match visible content only:
  https://developers.google.com/search/docs/appearance/structured-data/search-gallery

## Internal links
- In (existing URLs + job-language anchors):
- Out (docs, pricing, compare, signup):

## GEO / citeable facts (5–12)
Named definition, version/date/scope, first-party number + method, constraint, comparison criterion.
No unsourced “X% of marketers.”

## Non-goals
- Other clusters, word-count targets, date bumps without substance
```

## Competitive gaps (no invented traffic)

Compare observable assets: coverage, depth, stated freshness, SERP presence on **your** check, **your** GSC if provided.

Forbidden: “they get 40k/month,” fake DR/share-of-voice.

## Prioritization

**JUDGMENT method:** ICE (Impact × Confidence × Ease, 1–10). Impact = business, not head-term size. Ease: upgrade > new URL. YMYL review lowers Ease.

Hard filters: can fully meet the job; unique proof this cycle; will not cannibalize a money page.

```markdown
## Next 5 pages
1. {Upgrade|New} {path} — {primary query} — {intent} — ICE I/C/E — why now
## Explicitly not doing
- {cluster} — {vanity | blocked SERP | no proof | duplicate}
```

## When not to create a page

1. Would not publish if Google disappeared.
2. Only rewriting the top 10.
3. An existing URL should expand instead.
4. Navigational/official/local-pack SERP you cannot satisfy.
5. YMYL without expertise.
6. Scaled modifier pages (`best X in {city}` × N) without unique facts.
7. Fake “best” scores or fake dates.
8. Video-only or Maps-only SERP with a text-only plan.
9. Doorway / cannibal set.

Prefer merge, redirect, improve the canonical, or do nothing.

## Sources

- https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/appearance/ranking-systems-guide
- https://support.google.com/websearch/answer/7368877
- https://support.google.com/webmasters/answer/7042828
