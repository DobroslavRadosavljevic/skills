# Rendering and JavaScript SEO

Research date: 2026-08-17.

**FACT.** Google: crawl raw HTML (links, robots, often titles) → later render with evergreen Chromium → index rendered HTML. Render can be delayed. Other crawlers (social, many AI bots) often **never** execute JS. Source: [JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics).

**JUDGMENT.** Treat first HTML as the contract for title, primary copy, canonical, robots, and main links. Rendering is a second chance, not the plan.

## Modes

| Mode | First HTML | Use for indexable URLs |
| --- | --- | --- |
| SSR | Full document | Default |
| SSG | Full document at build | Excellent if rebuilt on content change |
| ISR / stale-revalidate | Full document, maybe stale | OK if stale HTML is still correct |
| SPA / CSR | App shell | Google *can* render; delayed; others often cannot |
| Hydration | SSR + client | Good only if SSR already has content |
| Soft navigation | Client route change | Each URL must still SSR correctly on a **cold GET** |
| Prerender (same content) | Snapshot | OK if equivalent to users (not cloaking) |
| Dynamic rendering (UA sniff) | Bot-only HTML | **Not recommended.** Cloaking if content differs. [Dynamic rendering](https://developers.google.com/search/docs/crawling-indexing/javascript/dynamic-rendering) |
| Selective SSR | SSR public; CSR app | **JUDGMENT:** correct for dashboards vs marketing |

Do not implement `_escaped_fragment_` / `#!` (deprecated).

## First HTML contract

Cold GET of the public URL must include:

- `<title>`, meta description, canonical, robots
- H1 and main copy (or a complete meaningful extract)
- Primary `<a href>` links (nav + contextual)

**Do not** ship `<title>App</title>` and set the real title in `useEffect`. **Do not** leave primary copy behind an empty SSR shell + client fetch.

**Soft 404:** client “not found” with HTTP 200. Fix: server 404, redirect to a real 404 URL, or SSR `noindex`.

## JavaScript SEO

**FACT.** Discoverable links are `<a href="…">`. Google does not click buttons or “load more.” Discovery on raw **and** rendered HTML; raw is faster. Sources: JS SEO basics; [JS + links FAQ](https://developers.google.com/search/blog/2020/05/frequently-asked-questions-about).

**Do this**

1. Framework `<Link>` must render a real `href`.
2. No `#/route` as the document URL.
3. Lazy-load below-the-fold only after critical copy exists without user input.
4. Pair infinite scroll with paginated URLs + sitemap.
5. Do not Disallow JS/CSS required to render public pages.
6. Meaningful **server** status for missing/auth/moved URLs.
7. Put `noindex` in the HTTP response or SSR head — not only after hydration.
8. Crawl budget: facet explosions + soft 404s waste fetch+render. [Crawl budget](https://developers.google.com/crawling/docs/crawl-budget) — ignore on small stable sites.

## TanStack Start / React SSR

Docs: [Start SEO](https://tanstack.com/start/latest/docs/framework/react/guide/seo), [GEO](https://tanstack.com/start/latest/docs/framework/react/guide/geo).

**Do this**

1. Root document: `<head><HeadContent /></head>` so route `head` is in SSR HTML.
2. Per public route: `head` + `loader`; `head: ({ loaderData })` for title/description/OG/canonical.
3. Do not defer primary entity data to the client.
4. Server routes: `sitemap[.]xml.ts`, `robots[.]txt.ts` with correct `Content-Type`.
5. Use `<Link to>` so SSR emits `href`.
6. SPA-only marketing: call out as an SEO defect; prefer SSR/prerender for indexable routes.

```tsx
export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => ({ post: await fetchPost(params.postId) }),
  head: ({ loaderData }) => ({
    meta: [
      { title: loaderData.post.title },
      { name: 'description', content: loaderData.post.excerpt },
    ],
    links: [{ rel: 'canonical', href: `https://example.com/posts/${loaderData.post.slug}` }],
  }),
})
```

```ts
// src/routes/robots[.]txt.ts
export const Route = createFileRoute('/robots.txt')({
  server: {
    handlers: {
      GET: async () =>
        new Response(`User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml\n`, {
          headers: { 'Content-Type': 'text/plain; charset=utf-8' },
        }),
    },
  },
})
```

```ts
// src/routes/sitemap[.]xml.ts — only 200 + canonical + indexable
export const Route = createFileRoute('/sitemap.xml')({
  server: {
    handlers: {
      GET: async () => {
        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>https://example.com/</loc><lastmod>2026-08-17</lastmod></url>
</urlset>`
        return new Response(xml, {
          headers: { 'Content-Type': 'application/xml; charset=utf-8' },
        })
      },
    },
  },
})
```

JSON-LD: `head.scripts` with `type: 'application/ld+json'`. Escape `<`, `>`, `&` in the JSON string. See [structured-data.md](structured-data.md) and [geo.md](geo.md).

If the repo is not Start, apply the same contract through its head/sitemap APIs. Do not invent framework methods.

## Anti-patterns

- Client-only titles and canonicals
- `onclick` “links”; hash routers as pages
- UA-sniff different body for Googlebot
- 200 empty shells; homepage redirects for deleted URLs
- Blocking JS/CSS needed to render
- Assuming social/AI crawlers execute JS
