# GEO / AEO, AI search, and machine-readable extras

Researched 2026-08-17. Separate **Google Search AI features** (official) from **third-party assistants** (vendor robots + unofficial conventions).

Label claims:

- **FACT** — stated by a cited official or primary vendor source.
- **JUDGMENT** — operational inference. Do not present as Google or OpenAI policy.

## Hard rules

1. For Google AI Overviews / AI Mode: do foundational SEO. Do not ship “GEO hacks” Google documents as unnecessary.
2. Structured data is not required for Google generative AI. If you emit it, it must match visible text.
3. `llms.txt` / `llms-full.txt` are unofficial. Optional. Never a substitute for HTML.
4. Training crawlers ≠ search crawlers. Do not block `Googlebot` when you meant `Google-Extended` or `GPTBot`.
5. FAQ JSON-LD only if the Q&A is visible. Google FAQ rich results are gone (2026-05-07).
6. Do not invent citation-lift from schema. That is not an official Google claim.
7. Citeable pages: clear entities, answer-first, dates, authors, unique data — as **content** quality, not as a secret schema type.

## FACT vs JUDGMENT: the GEO/AEO label

**FACT.** Google uses “generative AI features on Google Search” (AI Overviews, AI Mode). Industry terms AEO/GEO appear in Google docs only to **debunk hacks**. Source: [Optimizing for generative AI features](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

**FACT.** TanStack Start defines GEO as structuring content so AI systems can understand, cite, and recommend it, vs SEO ranking in SERPs. Source: [TanStack Start GEO](https://tanstack.com/start/latest/docs/framework/react/guide/geo).

**JUDGMENT.** Use “GEO” as a product nickname for (a) Google’s official AI-feature guidance plus (b) optional assistant-oriented files and robots. Do not promise rankings or citations from JSON-LD, `llms.txt`, or chunking.

## What is evidenced vs speculative

### Evidenced (cite these)

**FACT.** AI Overviews and AI Mode show supporting links. Eligibility for a supporting link: page is indexed and eligible for a snippet under Search technical requirements. **No extra technical requirements.** Source: [AI features and your website](https://developers.google.com/search/docs/appearance/ai-features).

**FACT.** Both features may use **query fan-out** (multiple related searches) and may use different models; link sets differ. AI Overviews appear only when Google judges them additive; they often do not trigger. Source: same page.

**FACT.** Google’s generative features use the Search index with techniques including **RAG/grounding** (retrieve ranked pages, then generate with links) and query fan-out. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

**FACT.** Same SEO fundamentals apply: crawlable robots.txt/CDN, internal links, page experience, **important content in text**, images/video when useful, structured data matching visible text, current Merchant Center / Business Profile. Source: [AI features](https://developers.google.com/search/docs/appearance/ai-features).

**FACT.** Spam policies apply to generative AI responses in Google Search. Scaled pages written mainly to manipulate AI answers violate policy. Sources: [Spam policies](https://developers.google.com/search/docs/essentials/spam-policies); [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); changelog 2026-05-15.

**FACT.** Google says you can **ignore** for Google Search: `llms.txt` and other special AI files/markup; “chunking” for AI; rewriting only for AI/long-tail variants; inauthentic mention campaigns; overfocusing on structured data as an AI requirement. Structured data is still useful for **rich results**, not required for generative AI. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

**FACT.** `llms.txt` is not needed for Google Search and does not help or hurt visibility/rankings there. Fine to keep for other systems. Source: [Updates 2026-06-15](https://developers.google.com/search/updates).

**FACT.** Control Google **Search** (including AI features) with `Googlebot` robots.txt plus snippet controls (`nosnippet`, `data-nosnippet`, `max-snippet`, `noindex`). `Google-Extended` is a **separate** product token for Gemini Apps / Vertex Gemini training and some grounding — **not** a ranking signal and **not** Search inclusion. Sources: [AI features](https://developers.google.com/search/docs/appearance/ai-features); [Google common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers).

**FACT.** Search Console includes AI feature traffic in Web performance; Google also documents a Generative AI performance report. Sources: [AI features](https://developers.google.com/search/docs/appearance/ai-features); [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

**FACT.** Preferred sources can apply to AI Overviews and AI Mode (rollout noted 2026-05-27). Source: [Updates](https://developers.google.com/search/updates).

### Speculative (do not assert as policy)

**JUDGMENT.** Whether FAQPage/HowTo JSON-LD increases assistant citations is **not** documented by Google. Treat as unproven.

**JUDGMENT.** TanStack’s claim that FAQ schema is “particularly effective for GEO” is framework advice, not a Google guarantee. Source to qualify: [TanStack GEO](https://tanstack.com/start/latest/docs/framework/react/guide/geo).

**JUDGMENT.** Third-party studies on schema vs AI Overview citations are not official. Do not optimize to a study.

**JUDGMENT.** Browser agents (DOM, a11y tree, screenshots) are emerging; Google points to an agent-friendly guide and protocols such as UCP. Useful if you have spare time — not a Search ranking lever. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

## Write citeable content

Do this for humans first. It also helps extraction.

1. **Answer first.** Lead with the definition, number, or decision. Then constraints and sources.
2. **Name entities.** Use the same official product, person, and org names as in Organization/Person markup (`sameAs` to Wikipedia, Wikidata, GitHub, docs).
3. **Show authorship.** Visible byline, bio link, `author` meta, Article `author` + ProfilePage. Source: [Article](https://developers.google.com/search/docs/appearance/structured-data/article); TanStack GEO “authoritative attribution.”
4. **Date the work.** Visible published/updated dates; ISO-8601 in JSON-LD. Stale time-sensitive markup is ineligible for rich results. Source: [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).
5. **Publish unique data.** First-hand measurements, methods, limitations — Google’s “non-commodity” test. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
6. **Use headings for humans.** Semantic `h1`→`h2`→`h3`. Google says not to obsess over perfect HTML; still use headings people can scan. Source: same guide.
7. **Keep facts in HTML text**, not only canvas/images/JS. Source: [AI features](https://developers.google.com/search/docs/appearance/ai-features).
8. **FAQ only if visible.** Real questions on a FAQ/help page. No hidden FAQ JSON-LD. Google FAQ rich results are retired. Source: [Updates](https://developers.google.com/search/updates); [sd-policies](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Do not:

- Spin a page per fan-out query. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).
- Buy fake “mentions.” Source: same.
- Add schema Google listed as unnecessary for generative AI and then claim “AEO complete.”

## `llms.txt` and `llms-full.txt`

**FACT.** [llmstxt.org](https://llmstxt.org/) is a **community proposal** (v2), not a Google, IETF, or WHATWG standard. Format: H1 name (required), optional blockquote summary, notes, H2 sections of markdown links. Optional “Optional” section for skippable links. May live at `/llms.txt` or a subpath (`/docs/llms.txt` covers that path). Complements robots.txt and sitemaps; does not replace them.

**FACT.** Proposal also suggests markdown twins (`page.md` or `page.html.md`) and `rel="alternate" type="text/markdown"` / `rel="describedby"`. Source: [llmstxt.org](https://llmstxt.org/).

**FACT.** Google Search does not use `llms.txt` as a special ranking or AI-feature file. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide); [Updates 2026-06-15](https://developers.google.com/search/updates).

**`llms-full.txt`.** **JUDGMENT.** Unofficial companion used by some docs hosts for a large concatenated dump. Not specified as required on llmstxt.org v2. If you add it, treat it as optional, keep it accurate, and still ship HTML.

**Never:**

- Replace public HTML docs with only `llms.txt`.
- List URLs that 404 or contradict the site.
- Claim Google rewards the file.

**If you add `/llms.txt`:** keep it short, link to canonical HTML (or `.md` twins), use accurate one-line descriptions, re-test by asking an assistant with only that file as a map. Source: [llmstxt.org](https://llmstxt.org/) “test your file.”

## Robots: training vs live retrieval vs Googlebot

Decide per product. Defaults below are **documentation of tokens**, not a recommendation to block.

| Token | Role | Blocking it | Do not confuse with |
| --- | --- | --- | --- |
| `Googlebot` | Google Search (Discover, Images, News, Search AI features). Source: [common crawlers](https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers) | Removes/limits Search, including AI Overviews/AI Mode eligibility | `Google-Extended` |
| `Google-Extended` | Control token (no unique UA). Gemini Apps / Vertex Gemini **training** and some **grounding**. Not a Search ranking signal. Source: same | Does **not** remove you from Google Search | `Googlebot` |
| `Google-InspectionTool` | Rich Results Test, URL Inspection | Breaks those tools only | Search ranking |
| `GPTBot` | OpenAI **foundation-model training** crawl. Source: [OpenAI crawlers](https://platform.openai.com/docs/gptbot) | Signals “do not use for training” | ChatGPT search |
| `OAI-SearchBot` | ChatGPT **search** indexing. Source: same | Site not shown in ChatGPT search answers (may still appear as nav links) | `GPTBot` |
| `ChatGPT-User` | User-initiated fetch; robots.txt **may not apply**. Not a Search opt-out. Source: same | Use `OAI-SearchBot` for search opt-out | Training crawl |
| `ClaudeBot` | Anthropic **training**. Source: [Anthropic crawler help](https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler) | Future materials excluded from training datasets | Claude search |
| `Claude-SearchBot` | Anthropic search indexing. Source: same | May reduce search visibility in Claude | `ClaudeBot` |
| `Claude-User` | User-initiated retrieval. Source: same | May reduce on-demand fetch | Training |
| `PerplexityBot` | Perplexity **search** (not foundation-model training). Source: [Perplexity crawlers](https://docs.perplexity.ai/guides/bots) | May drop search surfacing | `Perplexity-User` |
| `Perplexity-User` | User-initiated; **generally ignores robots.txt**. Source: same | Not a training switch | `PerplexityBot` |

Example — allow Google Search, opt out of Gemini training/grounding control, opt out of OpenAI training, allow OpenAI search:

```txt
User-agent: Googlebot
Allow: /

User-agent: Google-Extended
Disallow: /

User-agent: GPTBot
Disallow: /

User-agent: OAI-SearchBot
Allow: /
```

**FACT.** OpenAI: each setting is independent; search robots.txt changes can take ~24 hours. Source: [OpenAI crawlers](https://platform.openai.com/docs/gptbot).

**JUDGMENT.** Do not `Disallow: /` on `User-agent: *` to “stop AI.” That also hits Googlebot unless you add an explicit Googlebot allow — easy to ship a Search outage.

## Machine-readable extras (assistants and developers)

These help **retrieval and integration**. They are not Google AI-feature requirements.

| Artifact | When it helps | Rule |
| --- | --- | --- |
| HTML + SSR | Default. Google and most bots need text. | Do not hide the answer in client-only fetches. TanStack: SSR on by default. Source: [TanStack SEO](https://tanstack.com/start/latest/docs/framework/react/guide/seo) |
| RSS / Atom | Blogs, changelogs, release notes | Stable IDs, absolute links, dates. Complements, does not replace, HTML. |
| OpenAPI / public API docs | Products with a public HTTP API | Publish HTML reference **and** a machine spec. Link both from `llms.txt` if you have one. |
| Markdown twins | Docs sites, coding agents | Optional per llmstxt.org. Keep in sync with HTML. |
| JSON/JSON-LD endpoints | Catalogs, product lists | TanStack shows an ItemList API. **JUDGMENT.** Useful for integrators; not a Google rich-result page unless the HTML page also qualifies. |
| Sitemap | Discovery | Google and others. Not an `llms.txt` substitute. Source: [llmstxt.org](https://llmstxt.org/) |

**JUDGMENT.** Prefer one canonical HTML URL per concept. Point feeds, OpenAPI, and `llms.txt` at that URL.

## TanStack Start

Sources: [GEO guide](https://tanstack.com/start/latest/docs/framework/react/guide/geo), [SEO guide](https://tanstack.com/start/latest/docs/framework/react/guide/seo).

**FACT.** Start supports SSR, `head` meta/scripts, JSON-LD via `scripts`, server routes for feeds/APIs/`llms.txt`.

### JSON-LD in `head.scripts`

Load entities in `loader`. Build JSON-LD in `head` from `loaderData`. Set `type: 'application/ld+json'`.

Escape **after** `JSON.stringify`. `JSON.stringify` does not escape `<`, `>`, or `&`. A `</script>` (or `<!--`) inside a string closes the HTML parser.

```tsx
function jsonLd(data: unknown): string {
  return JSON.stringify(data)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
}

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    const post = await fetchPost(params.postId)
    return { post }
  },
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: 'author', content: loaderData.post.author.name },
    ],
    scripts: [
      {
        type: 'application/ld+json',
        children: jsonLd({
          '@context': 'https://schema.org',
          '@type': 'Article',
          headline: loaderData.post.title,
          description: loaderData.post.excerpt,
          image: loaderData.post.coverImage,
          author: {
            '@type': 'Person',
            name: loaderData.post.author.name,
            url: loaderData.post.author.url,
          },
          datePublished: loaderData.post.publishedAt,
          dateModified: loaderData.post.updatedAt,
        }),
      },
    ],
  }),
  component: PostPage,
})
```

Root `WebSite` + nested `publisher` Organization: follow the GEO guide’s `__root.tsx` example; give the org a stable `@id`.

Product: only emit `aggregateRating` when reviews are on the page (parity). TanStack’s sample gates on `product.rating` — still verify visible stars/counts.

FAQ: only on a real FAQ route; map visible `faqs` 1:1. Do not add FAQPage for Google SERP dropdowns (retired).

### Optional `llms.txt` route

TanStack pattern: `src/routes/llms[.]txt.ts` server `GET`, `Content-Type: text/plain`. Source: [GEO guide](https://tanstack.com/start/latest/docs/framework/react/guide/geo).

Keep the body a short map of links. Do not dump the marketing site.

### Machine-readable server route

GEO guide’s `/api/products` ItemList is fine for assistants/integrators. The HTML product page still needs its own Product JSON-LD for Google product features.

## Monitoring

**FACT.** Google: Search Console Web + Generative AI performance report. Source: [AI optimization guide](https://developers.google.com/search/docs/fundamentals/ai-optimization-guide).

**JUDGMENT.** For other engines, spot-check answers and citations. TanStack lists Rich Results Test and [Schema.org Validator](https://validator.schema.org/). Those prove markup, not citations. Source: [TanStack GEO](https://tanstack.com/start/latest/docs/framework/react/guide/geo).

## Procedure

1. Make the page indexable (SSR/prerender, text, internal links, sitemap).
2. Write non-commodity, dated, authored HTML. Answer the query in the first screen.
3. Add JSON-LD only for true, visible, gallery-eligible types ([structured-data.md](./structured-data.md)).
4. Decide robots **per token** (Search vs training vs user-fetch).
5. Optionally add `llms.txt` and feeds/OpenAPI for docs/API products.
6. Validate structured data. Measure Google AI features in Search Console — not via schema myths.

## Sources

- https://developers.google.com/search/docs/appearance/ai-features
- https://developers.google.com/search/docs/fundamentals/ai-optimization-guide
- https://developers.google.com/search/docs/crawling-indexing/google-common-crawlers
- https://developers.google.com/search/docs/essentials/spam-policies
- https://developers.google.com/search/updates
- https://developers.google.com/search/blog/2025/05/succeeding-in-ai-search
- https://tanstack.com/start/latest/docs/framework/react/guide/geo
- https://tanstack.com/start/latest/docs/framework/react/guide/seo
- https://llmstxt.org/
- https://platform.openai.com/docs/gptbot
- https://support.anthropic.com/en/articles/8896518-does-anthropic-crawl-data-from-the-web-and-how-can-site-owners-block-the-crawler
- https://docs.perplexity.ai/guides/bots
