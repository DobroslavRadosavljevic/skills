# Metadata and document head

What must appear in the first HTML `<head>` (or HTTP headers) for each URL. Pair with [on-page.md](on-page.md) for copy quality and [media.md](media.md) for images/video.

Research date: 2026-08-17.

**FACT:** Google may rewrite titles and snippets. Write them anyway; they are strong hints and the default when not rewritten. Sources: [Title links](https://developers.google.com/search/docs/appearance/title-link), [Snippets](https://developers.google.com/search/docs/appearance/snippet).

**FACT:** Meta keywords are unused by Google Search. Source: [SEO Starter Guide](https://developers.google.com/search/docs/fundamentals/seo-starter-guide).

## Per-URL head checklist

| Element | Indexable public URL | `noindex` utility |
| --- | --- | --- |
| `charset` + viewport | Once in root | Same |
| `<title>` | Unique, descriptive, primary intent | Short functional name |
| `meta name="description"` | Unique; completes the title; CTA or outcome | Optional |
| `link rel="canonical"` | Absolute HTTPS preferred URL | Self or omit; never point utilities at a money URL as a trick |
| `meta name="robots"` / `X-Robots-Tag` | Omit or `index, follow` | `noindex` (add `nofollow` for cart/search/preview) |
| `og:title` `og:description` `og:url` `og:type` `og:image` | Required if shared | Optional |
| `twitter:card` | `summary_large_image` when an image exists | Optional; OG fallback |
| hreflang cluster | All locales + self + `x-default` if i18n | Do not hreflang `noindex` URLs |
| JSON-LD | Only eligible types; visible parity | None |

Put robots/canonical in **raw HTML or HTTP**. Late client injection races the first crawl wave. See [crawl-index.md](crawl-index.md) and [rendering.md](rendering.md).

## Title

**Do this**

- One `<title>` per document. Match the primary H1’s promise; they need not be identical.
- Lead with the unique topic; brand at the end if space remains (`Page topic · Brand`).
- Write for the query’s job, not a keyword list.
- **JUDGMENT:** Aim ~50–60 characters / ~500–600 px; Google truncates by pixels and device. Do not pad.

**Do not**

- Duplicate titles across templates (`Home`, `Page`, product name only on every SKU).
- Stuff (`Best cheap best … 2026 2026`).
- Use the same title as 40 other landing pages with one noun swapped.

**FACT:** Google may compose title links from `<title>`, H1, visible text, or on-page anchors. Source: [Title links](https://developers.google.com/search/docs/appearance/title-link).

## Meta description

**FACT:** Not a ranking factor. Used when it describes the page better than an extract. Source: [Snippets](https://developers.google.com/search/docs/appearance/snippet).

**Do this**

- One or two sentences: who it is for, what they get, differentiator, optional CTA.
- Unique per URL. **JUDGMENT:** ~140–160 characters as a write target; truncation varies.
- Match visible facts (price, version, city).

**Do not** quote-stuff keywords or duplicate the title verbatim with no extra information.

## Canonical and robots (head view)

- Canonical: absolute `https://` URL, no tracking params, no hash. Self-canonical the preferred URL.
- Do not combine `hreflang` onto the canonical `link` (ignored for canonicalization).
- `noindex` pages must remain **allowed** in `robots.txt` or Google never sees the tag.
- `nosnippet` / `max-snippet` also constrain Google AI Overviews / AI Mode direct input. Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).
- Google unused: `noarchive` (cache link gone). Bing may still treat `noarchive`/`nocache` differently.

## Open Graph (minimum)

Absolute URLs. Unique image on important money/content URLs.

```html
<meta property="og:title" content="…" />
<meta property="og:description" content="…" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/pricing" />
<meta property="og:image" content="https://example.com/og/pricing.png" />
<meta property="og:locale" content="en_US" />
<meta name="twitter:card" content="summary_large_image" />
```

`og:type`: `website` (default), `article` for dated posts. Image rules: [media.md](media.md).

## Root vs route

- Root document: charset, viewport, default title, `HeadContent` (or equivalent), sitewide OG site name if used.
- Child route: override title, description, canonical, robots, OG, JSON-LD from **loader data** so first HTML matches the entity.
- Do not leave the root title (`App`, `TanStack Start Starter`) on public leaves.

## TanStack Start sketch

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => ({ post: await fetchPost(params.postId) }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: 'description', content: loaderData.post.excerpt },
      { property: 'og:title', content: loaderData.post.title },
      { property: 'og:description', content: loaderData.post.excerpt },
      { property: 'og:image', content: loaderData.post.coverImage },
      { property: 'og:type', content: 'article' },
      { property: 'og:url', content: `https://example.com/posts/${loaderData.post.slug}` },
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    links: [{ rel: 'canonical', href: `https://example.com/posts/${loaderData.post.slug}` }],
  }),
})
```

Prefer `bun` / `bunx` if adding preview-image tooling. Specify image **requirements** in [media.md](media.md); do not require a particular generator.

## Sources

- https://developers.google.com/search/docs/appearance/title-link
- https://developers.google.com/search/docs/appearance/snippet
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls
- https://ogp.me/
- https://tanstack.com/start/latest/docs/framework/react/guide/seo
