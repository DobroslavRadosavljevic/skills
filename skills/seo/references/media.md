# Media and social previews

Cover Open Graph, X/Twitter cards, icons, image SEO, video, and OG image generation. Social crawlers read **raw HTML**; do not rely on client-only hydration for these tags.

Label **FACT** vs **JUDGMENT**.

## Open Graph (required)

**FACT.** Four required properties on every graph object: `og:title`, `og:type`, `og:image`, `og:url`. Place RDFa `<meta property content>` in `<head>`. Source: [ogp.me](https://ogp.me/).

**FACT.** Facebook webmaster tags: `og:url` is the **undecorated canonical** (no session, user IDs, counters). Mobile URLs should point `og:url` at the desktop/canonical so shares aggregate. `og:title` is the article title **without** site-name branding. `og:description` is usually 2–4 sentences. Default `og:type` is `website`. One type per URL. Optional: `og:locale` (default `en_US`), `fb:app_id` for Insights. Server must support gzip/deflate for the Facebook crawler. Source: [Sharing for webmasters](https://developers.facebook.com/docs/sharing/webmasters/).

**FACT.** Image structured properties: `og:image:url`, `og:image:secure_url`, `og:image:type`, `og:image:width`, `og:image:height`, `og:image:alt`. If `og:image` is set, specify `og:image:alt`. First image tag wins on conflicts. Put structured props **immediately after** their root `og:image`. Source: [ogp.me](https://ogp.me/).

**FACT.** Facebook image rules (updated 2026-06-30): min **200×200**; file **≤ 8 MB**; **≥ 1200×630** recommended; **≥ 600×315** for large Feed images; keep ~**1.91:1** to avoid crop; crawler accepts gzip/deflate only. Specify width/height so the first share can render without a second fetch. Cache key is the **image URL** — change the URL to refresh. Do not delete old images still referenced by old shares. Source: [Images in link shares](https://developers.facebook.com/docs/sharing/webmasters/images/).

**FACT.** Google may use `og:image` (or schema `primaryImageOfPage` / main entity `image`) when choosing Search/Discover thumbnails. Prefer a relevant, non-logo, non-text-heavy, non-extreme-aspect, high-resolution image. Source: [Google Images](https://developers.google.com/search/docs/appearance/google-images).

### Agent checklist (every important URL)

1. Emit all four required OG tags in **server-rendered** HTML.
2. `og:url` = site canonical (absolute `https://`).
3. `og:image` = absolute `https://` URL (relative paths fail silently on social crawlers). **JUDGMENT** from platform behavior + Facebook requiring a full image URL.
4. Set `og:image:width`, `og:image:height`, `og:image:alt`, `og:image:type`.
5. Unique image per important URL (product, article, category). Do not reuse one company billboard on every path.
6. Recommended file: **1200×630**, JPEG or PNG, ≤ 8 MB (stay well under).
7. Optional but emit: `og:description`, `og:site_name`, `og:locale`.

```html
<meta property="og:title" content="Unique page title without brand suffix" />
<meta property="og:type" content="website" />
<meta property="og:url" content="https://example.com/products/anvil" />
<meta property="og:image" content="https://example.com/og/anvil-1200x630.jpg" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta property="og:image:alt" content="Steel anvil on a workbench" />
<meta property="og:description" content="Two to four sentences of the actual offer." />
<meta property="og:site_name" content="Example" />
```

Use `og:type` `article` for dated editorial; `product` only if you implement the matching OG product object consistently. **JUDGMENT:** `website` is safe for app shells and generic landing pages.

## Twitter / X cards

**FACT (historical official docs).** Cards use `name="twitter:*"` (not `property`). Types include `summary`, `summary_large_image`, `player`, `app`. X falls back to Open Graph when twitter tags are absent. Official Card Validator was retired; live `developer.x.com` / `developer.twitter.com` card pages were **not fetchable** on 2026-08-17.

**FACT (Google).** Twitter Cards are OG-compatible extras; `twitter:card` declares the card. Source: [web.dev social discovery](https://web.dev/articles/social-discovery) (older Google+ bits are obsolete; OG + twitter:card remain).

**JUDGMENT (implement this):**

```html
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:site" content="@brand" />
```

Rely on `og:title`, `og:description`, `og:image` unless you need an X-specific crop. If you set `twitter:image`, use an absolute HTTPS URL. Add `twitter:image:alt` when you set a twitter image.

Do not invent current X pixel/byte limits as FACT. Prefer the Facebook-recommended 1200×630 asset so one file serves OG + X.

Player cards: only when you have a crawlable HTTPS player and the product needs in-stream play. Otherwise skip.

## Favicon, Apple touch, theme-color (secondary)

**FACT — favicon in Google Search.** One favicon per **hostname**. Home page `<link rel="icon" href="...">`. Also recognized: `shortcut icon`, `apple-touch-icon`, `apple-touch-icon-precomposed`. `href` may be relative or absolute, including CDN. Googlebot must crawl the home page; Googlebot-Image must crawl the icon. Square, **≥ 8×8**, **recommend > 48×48**. Stable URL. Inappropriate icons are replaced. Source: [Favicon in Search](https://developers.google.com/search/docs/appearance/favicon-in-search).

**FACT — Apple Web Clip.** PNG `apple-touch-icon.png` in the site root, or `<link rel="apple-touch-icon" href="...">`, optional `sizes`. Source: [Apple: Configuring web applications](https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html).

**FACT — theme-color.** HTML defines `<meta name="theme-color" content="...">` for UI chrome (browser, installed web app). Source: [HTML Standard — document metadata](https://html.spec.whatwg.org/multipage/semantics.html) (`theme-color` meta).

**JUDGMENT.** Emit on the root layout:

```html
<link rel="icon" href="/favicon.ico" sizes="48x48" />
<link rel="icon" type="image/png" href="/icon-192.png" sizes="192x192" />
<link rel="apple-touch-icon" href="/apple-touch-icon.png" />
<meta name="theme-color" content="#0a0a0a" />
```

Do not block `/favicon.ico` or icon PNG in robots.txt.

## Image SEO

**FACT.** Google finds images in `img[src]` (including inside `<picture>`). It does **not** index CSS background images. Always provide `src` fallback with `srcset` / `<picture>`. Supported: BMP, GIF, JPEG, PNG, WebP, SVG, AVIF. Filename extension should match type. Image sitemaps: up to 1000 `<image:image>` per `<url>`; required `<image:loc>`; CDN hosts OK if verified in Search Console; do not robots.txt-block those images. Deprecated: caption/geo/title/license sitemap image tags. Source: [Google Images](https://developers.google.com/search/docs/appearance/google-images); [Image sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps).

**FACT.** Lazy-load so content loads when it would be visible; do **not** lazy-load LCP / above-the-fold images. Google does not scroll/click to reveal content. Confirm images appear in **rendered** `src` via URL Inspection. Source: [Fix lazy-loaded content](https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading); [Browser-level lazy loading](https://web.dev/articles/browser-level-image-lazy-loading).

**FACT.** `max-image-preview:large` allows larger image previews in Search/Discover. Source: [Robots meta](https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag).

Procedure:

1. Descriptive file names (`red-anvil-side.jpg`), not `IMG_0123.jpg`.
2. Accurate `alt` (content of the image, not keyword lists).
3. Width/height attributes (or CSS aspect-ratio) to reserve space.
4. `srcset` + `sizes` + `src` fallback; `<picture>` for format switching with `<img src>` last.
5. `loading="lazy"` **below** the fold only; LCP image `fetchpriority="high"` and eager.
6. List important in-body images in the sitemap image extension.
7. Keep images crawlable (not auth-walled, not `noimageindex` unless intentional).
8. Prefer a `primaryImageOfPage` or main-entity `image` that matches `og:image` when they describe the same page.

## Video

**FACT — discovery.** Use `<video>`, `<embed>`, or common player elements. Do not load the video only after swipe/click/type. Do not use fragment IDs to load the file. If JS-injected, it must appear in rendered HTML. Source: [Video SEO](https://developers.google.com/search/docs/appearance/video).

**FACT — index eligibility for video features.** The **watch page** must be indexed and performing; video embedded on that page; valid **stable** thumbnail URL; supported file type (3GP, MP4, WebM, … — not data URLs). Unstable CDN query strings break indexing. Source: same.

**FACT — watch page vs embed-only.** Video features (Video mode, key moments, LIVE badge, etc.) need a page whose **main purpose** is watching **one** video (landing page, episode player, news watch page). Complementary embeds (product 360, blog with a clip, category grids) are **not** watch pages. Third-party embeds (YouTube, Vimeo) may be indexed on both your page and the host if both meet criteria. Still add structured data / video sitemap on your page. Source: [Video SEO](https://developers.google.com/search/docs/appearance/video).

**FACT — VideoObject.** Influence name, description, thumbnail, upload date, duration. Required/typical: `name`, `description`, `thumbnailUrl`, `uploadDate`; recommended `duration` (ISO 8601, e.g. `PT1M54S`), `contentUrl` and/or `embedUrl`. Source: [VideoObject](https://developers.google.com/search/docs/appearance/structured-data/video).

**FACT.** Google also accepts video sitemaps and OGP video tags as discovery hints. Source: [Video SEO](https://developers.google.com/search/docs/appearance/video); [ogp.me](https://ogp.me/) (`og:video` + width/height/type).

Procedure:

1. If video is a search destination: create a unique watch URL, unique title/description, indexable HTML player.
2. If video only supports a product/article: embed it; do not expect Video-mode features; still use accessible `<video>` or a host embed.
3. Emit `VideoObject` with stable `thumbnailUrl` and `duration`.
4. Do not `noindex` the watch page if you want video features.
5. For Facebook in-feed play: HTTPS `og:video` + `og:video:secure_url`, `video/mp4`, width/height, plus `og:image` poster. Source: [Sharing for webmasters — video](https://developers.facebook.com/docs/sharing/webmasters/).

## OG image generation

Specify **requirements**, not a library.

| Requirement | Value |
| --- | --- |
| Output size | 1200×630 px (1.91:1) |
| Safe zone | Keep text/logo inside ~1080×570; edges crop on some surfaces |
| Format | JPEG (photos) or PNG (flat UI); sRGB |
| Weight | Well under 8 MB (Facebook max); prefer < 500 KB |
| URL | Absolute HTTPS; **new path or cache-buster** when art changes |
| Text | Short title; high contrast; not a paragraph; not a tiny logo on empty canvas |
| Uniqueness | Hash input = canonical URL + title + (product image or article hero) |
| Runtime | Generate at build or on first share; store immutably; do not regenerate a new URL every request |
| HTML | Tags in initial HTML; generator failure must fall back to a static default **per type** (article vs product), not one global collage |
| Accessibility | `og:image:alt` describes the picture |
| Privacy | Do not render PII, unpublished prices, or draft titles |

**JUDGMENT.** SVG-in-HTML → rasterize to PNG/JPEG. Do not point `og:image` at an HTML route and hope crawlers screenshot it.

## Optional preview debuggers

Use after tags exist in view-source. See [review.md](review.md).

- Facebook Sharing Debugger: https://developers.facebook.com/tools/debug/
- Facebook docs: https://developers.facebook.com/docs/sharing/webmasters/

## Sources

- https://ogp.me/
- https://developers.facebook.com/docs/sharing/webmasters/
- https://developers.facebook.com/docs/sharing/webmasters/images/
- https://developers.facebook.com/tools/debug/
- https://web.dev/articles/social-discovery
- https://developers.google.com/search/docs/appearance/google-images
- https://developers.google.com/search/docs/crawling-indexing/sitemaps/image-sitemaps
- https://developers.google.com/search/docs/crawling-indexing/javascript/lazy-loading
- https://developers.google.com/search/docs/crawling-indexing/robots-meta-tag
- https://developers.google.com/search/docs/appearance/video
- https://developers.google.com/search/docs/appearance/structured-data/video
- https://developers.google.com/search/docs/appearance/favicon-in-search
- https://web.dev/articles/browser-level-image-lazy-loading
- https://developer.apple.com/library/archive/documentation/AppleApplications/Reference/SafariWebContent/ConfiguringWebApplications/ConfiguringWebApplications.html
- https://html.spec.whatwg.org/multipage/semantics.html
