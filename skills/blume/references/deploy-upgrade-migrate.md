# Blume: Deploy, Upgrade 1 to 2, Migrate, FAQ

Covers `blume` 2.x deployment (static and server), the Blume 1 to 2 config upgrade, `blume migrate` from other doc frameworks, and FAQ facts. Use it to do these tasks without re-reading upstream docs.

## Contents

1. [Deployment](#1-deployment)
   - [Static output](#11-static-output-default)
   - [Site URL](#12-site-url)
   - [Subpath deploys: deployment.base](#13-subpath-deploys-deploymentbase)
   - [Mount under a path: basePath](#14-mount-under-a-path-basepath)
   - [Server output and host adapters](#15-server-output-and-host-adapters)
   - [Adapter details](#16-adapter-details)
   - [Preview locally](#17-preview-locally)
   - [Redirects](#18-redirects)
   - [Content types (_headers)](#19-content-types-_headers)
   - [Powered-by header](#110-powered-by-header)
   - [Private docs](#111-private-docs)
   - [Environment variables](#112-environment-variables)
   - [Build cache and CI](#113-build-cache-and-ci)
   - [Monorepos](#114-monorepos)
2. [Upgrading Blume 1 to 2](#2-upgrading-blume-1-to-2)
3. [Migrating from other frameworks](#3-migrating-from-other-frameworks)
4. [FAQ facts](#4-faq-facts)
5. [Gotchas](#5-gotchas)

---

## 1. Deployment

### 1.1 Static output (default)

`blume build` compiles docs to plain HTML, CSS, and a local search index in `dist/`. No server runs.

| Setting          | Value          |
| ---------------- | -------------- |
| Build command    | `blume build`  |
| Output directory | `dist`         |
| Node version     | 22.19 or newer |

- Works on Vercel, Netlify, Cloudflare Pages, GitHub Pages, any bucket or CDN.
- `blume` must be a dependency so the host can run the build.

A static build includes:

- every docs and custom page as static HTML
- a local search index (Orama default, Pagefind opt-in)
- `sitemap.xml` when the site URL is known
- `robots.txt` (points to the sitemap when the site URL is known)
- `llms.txt` and `llms-full.txt`
- redirect pages
- prerendered Open Graph images when `seo.og.enabled` is on

Host-specific static notes:

- **Amazon S3 behind CloudFront** (private bucket, origin access control) needs two extras:
  - A CloudFront Function on viewer requests mapping each page URL to its `index.html`: `/quickstart` to `/quickstart/index.html`, and `/` (or any path ending in `/`) to its `index.html`. Leave a path whose last segment has a dot (`/quickstart.md`, `/_astro/app.js`) unchanged. Keep the function off `/.well-known/*` (`api-catalog` has no extension). Without it S3 answers `/quickstart` with `403` or `404`.
  - Uploads with explicit types: `text/markdown; charset=utf-8` for `.md` and `.mdx`, `text/plain; charset=utf-8` for `.txt`, `application/linkset+json; profile="https://www.rfc-editor.org/info/rfc9727"` for `.well-known/api-catalog`. `dist/_headers` lists every rule the build needs.
- **Cloudflare Workers serving a static build** (static assets): set `"html_handling": "drop-trailing-slash"` under `assets` in the Wrangler config. Blume writes `<route>/index.html` and links without a trailing slash. Cloudflare's default `auto-trailing-slash` answers `/quickstart` with a `307` to `/quickstart/`. A `cloudflare()` server build routes every page through its Worker and serves `/quickstart` under either setting. The setting only matters there when the build warns `Could not wire Accept: text/markdown negotiation` and the static layer serves the pages itself.

### 1.2 Site URL

Sitemaps, canonical tags, RSS, and Open Graph images need an absolute origin.

| Host                | Auto-detected?                                                               |
| ------------------- | ---------------------------------------------------------------------------- |
| Vercel              | Yes. Prefers the stable production domain over preview URLs.                 |
| Netlify             | Yes. Prefers the stable production domain over preview URLs.                 |
| Cloudflare Pages    | Only `CF_PAGES_URL` (changes every deploy). Set `site`.                      |
| Cloudflare Workers  | No. Set `site`.                                                              |
| GitHub Pages, S3, custom CDN, `node()` server | No. Set `site`.                            |

Set `site` (absolute `http://` or `https://` URL) to override detection or to supply one:

```ts
// blume.config.ts (static form)
deployment: {
  site: "https://docs.example.com",
}
```

- During `blume dev`, `site` falls back to the local dev server (for example `http://localhost:4321`). Builds never use this fallback.
- An unset `site` on an undetected host silently drops sitemap, OG images, RSS, and absolute canonicals.

### 1.3 Subpath deploys: `deployment.base`

Serve the whole app from a host subdirectory (`example.com/docs`, common for GitHub Pages project sites):

```ts
deployment: {
  base: "/docs",
}
```

- The whole site, root included, moves under the base. Internal links, assets, and root-relative `href`/`src` in raw HTML (`<a href="/guide">`, `<img src="/logo.png">`) are rewritten.
- `base` and `site` are also options of every host adapter: `vercel({ base: "/docs" })`.
- `@astrojs/vercel` ignores the base. A `vercel()` server build therefore moves static files to `.vercel/output/static/docs/` and puts routes and redirects in `.vercel/output/config.json` under `/docs` itself.
- Every page keeps its own path under the base, even in a content folder named like the base. With `base: "/docs"`, `docs/setup.md` is served at `/docs/docs/setup`. A root-relative link you write that already starts with the base is taken to include it and left as written. Link with `./docs/setup` or `/docs/docs/setup`.

Per-deploy base from an env var (for example PR previews):

```ts
deployment: {
  base: process.env.DOCS_BASE,
}
```

```bash
DOCS_BASE=/pr-1234 bunx blume build
```

With `DOCS_BASE` unset, the site builds at root.

### 1.4 Mount under a path: `basePath`

Top-level `basePath` mounts every generated route under a segment while the sidebar stays untouched (no wrapper group). Like Docusaurus `routeBasePath` or Fumadocs `baseUrl`.

```ts
basePath: "/docs",
```

- Write links as if mounted at root (`/getting-started`). Blume rewrites them, plus redirects, sitemap, canonicals, OG images, `llms.txt`, and the search index.
- Public assets (`public/`) stay at the site root, or under `deployment.base` when set.

Three distinct concepts:

| Setting             | Meaning                                                                   |
| ------------------- | ------------------------------------------------------------------------- |
| `basePath`          | Mounts every route under a segment. No sidebar group.                     |
| per-source `prefix` | Namespaces one content source. Adds a sidebar group.                      |
| `deployment.base`   | Host subdirectory the whole app is served from.                           |

With `deployment.base` and `basePath` both set, a page lands at `{deployment.base}/{basePath}/page`.

### 1.5 Server output and host adapters

Switch to server output for request-time features: the assistant endpoint and the MCP server. Name a host: `deployment` takes an adapter imported from `blume/deploy`.

```ts
import { defineConfig } from "blume";
import { vercel } from "blume/deploy";

export default defineConfig({
  deployment: vercel(),
});
```

| Adapter        | Package               | Use for                                   | Install                               |
| -------------- | --------------------- | ----------------------------------------- | ------------------------------------- |
| `vercel()`     | `@astrojs/vercel`     | Vercel (most polished path)               | Ships with Blume                      |
| `node()`       | `@astrojs/node`       | Self-hosted Node servers, containers      | Ships with Blume                      |
| `netlify()`    | `@astrojs/netlify`    | Netlify Functions                         | `bun add -d @astrojs/netlify`         |
| `cloudflare()` | `@astrojs/cloudflare` | Cloudflare Workers                        | `bun add -d @astrojs/cloudflare`      |

Shared options for every adapter: `site`, `base`, `output`. Anything else is forwarded verbatim to the underlying `@astrojs/*` adapter:

```ts
deployment: vercel({
  site: "https://docs.example.com",
  isr: { expiration: 60 }, // passed straight to @astrojs/vercel
}),
```

Rules:

- Naming an adapter switches the build to server output. Pass `output: "static"` to keep a static build on that host (keeps its site detection and platform files): `netlify({ output: "static" })`.
- A missing `netlify`/`cloudflare` package: `blume build` stops with the install command for your package manager, `blume dev` warns, `blume doctor` reports it.
- pnpm: approve build scripts under `allowBuilds` in `pnpm-workspace.yaml`, beside the `esbuild` entry `blume init` writes: `sharp` for Netlify, `workerd` for Cloudflare. pnpm 11+ stops with `ERR_PNPM_IGNORED_BUILDS` until approved; pnpm 10 skips the scripts with a warning. `allowBuilds` needs pnpm 10.26+.
- A server build includes everything a static build does, plus any Astro endpoints or middleware you add.
- `vercel` and `cloudflare` are also names of two analytics adapters (`blume/analytics`). Alias one import: `import { cloudflare as cloudflareDeploy } from "blume/deploy"`.
- Server features have their own config (assistant needs a model API key). See env vars below.

### 1.6 Adapter details

**node()**

- Standalone server: `node dist/server/entry.mjs`.
- Listens on `localhost:4321` unless the `HOST` and `PORT` env vars are set at start: `HOST=0.0.0.0 PORT=8080 node dist/server/entry.mjs`.
- `host` and `port` passed to `node()` have no effect (`@astrojs/node` replaces them with Astro's server settings).
- Behind a reverse proxy, set `allowedDomains` so the rate limit counts each reader apart.
- The server resolves packages through links into the project's `node_modules`. Deploy the project with installed dependencies, not `dist/` alone.
- When the site publishes discovery files, serves images a content source downloaded, or configures redirects, Blume puts a wrapper in front of Astro's entry (moved to `astro-entry.mjs` beside it). It sends `.well-known` discovery files with their media types and CORS headers, sandboxes downloaded SVGs, and answers redirects with their configured status.

**vercel()**

- A server build checks the function bundle for packages it imports but did not copy (would crash on Vercel). A missing import of your own is a warning. A missing Blume dependency stops the build.
- The build removes `.vercel/output/config.json`, so `vercel deploy --prebuilt` cannot ship the output without the routes Blume adds.
- Static build on Vercel: redirects and headers go in `dist/vercel.json`, which a Git-connected project never reads (see Redirects).

**netlify()**

- Server build writes `_headers` rules into the `headers` of its Frameworks API config (`.netlify/v1/config.json`).
- No local preview server.

**cloudflare()**

- Server build runs on Cloudflare Workers only. `@astrojs/cloudflare` dropped Cloudflare Pages in version 13. A static build does not load the package, so its `dist/` still deploys to Pages.
- Deploy with `bunx wrangler deploy` from the project root after `blume build`. Blume writes the redirected Wrangler config to `.wrangler/deploy/` and adds `.wrangler/` to `.gitignore`.
- The Worker is named after: `package.json` `name`, else the site hostname, else the folder, unless your own `wrangler.jsonc` at the project root sets `name`.

**`Accept: text/markdown` negotiation (Vercel and Cloudflare server builds)**

- An agent requesting any content page with `Accept: text/markdown` gets the raw-Markdown mirror at the same URL.
- Vercel: Blume splices header-conditional rewrites into the routing config.
- Cloudflare: Blume generates a small Worker in front of the Astro one and points `assets.run_worker_first` at every path except fingerprinted build assets and raw `.md`, `.txt`, `.json`, `.well-known` files. That Worker also answers prerendered per-page JSON (`/api/docs/pages/{route}.json`) from the asset binding.

### 1.7 Preview locally

```bash
bunx blume build
bunx blume preview
```

- `blume preview` serves static builds and `node()` and `cloudflare()` server builds.
- `vercel()` and `netlify()` server builds have no local preview: it stops with an error. Use `blume dev`, `vercel deploy`, or `netlify deploy`.
- On a static build, preview also applies redirects (patterns included, with configured status) and static-host trailing-slash behavior:
  - `/guide/` redirects to `/guide` (query kept).
  - A folder of HTML in `public/` (`public/demo/index.html`) is served at `/demo/`, and `/demo` redirects there.
- `blume dev` handles trailing slashes the same way.

### 1.8 Redirects

```ts
redirects: [{ from: "/old", to: "/new", status: 301 }],
```

- `status`: `301`, `302`, `307`, or `308`. Default `301`.
- Write `from` and `to` as if mounted at root, starting with `/`. `to` may also be a full `https://` URL. `base` and `basePath` are applied to both sides. A `to` naming a file in `public/` (`/files/guide.pdf`) gains `base` but not `basePath`. A base already written into `to` is preserved, not doubled.
- Server builds, `blume dev`, and `blume preview` answer redirects at request time.
- Static builds emit redirect pages AND the host files:

| Deployment                   | Redirect files written                                          |
| ---------------------------- | --------------------------------------------------------------- |
| `netlify()`, `cloudflare()`  | `_redirects`                                                    |
| `vercel()`                   | `vercel.json`                                                   |
| No host named                | `_redirects`, `vercel.json`, and `blume-redirects.json` (structured manifest for nginx/Apache rules or an edge worker) |

- A `_redirects` or `vercel.json` shipped in `public/` is left untouched.
- A page redirect also moves its raw Markdown: `/old.md` and `/old.mdx` redirect to `/new.md` and `/new.mdx` with the same status. Not done for `.html` source URLs, nor when the Markdown URL already serves a copy (`/index.md` is the home page's).
- A redirect from a page's own `index.html` URL (`/guide/index.html` to `/guide`) gets no redirect page in a static build. Only hosts reading the redirect files honor it.
- Blume adds one redirect itself: a date-named page published earlier under a shorter URL (`changelog/12-05-2022.mdx` at `/changelog/05-2022`) redirects from the short URL. Not added where a page lives at the old URL or a configured redirect starts there.

Host caveats:

- **Netlify** serves an existing file ahead of a redirect rule unless the rule is forced. `netlify()` writes forced rules (`/old /new 301!`). Cloudflare rejects `!`, so the file for a no-host build leaves it off, and on Netlify that build answers with the redirect page. Use `netlify({ output: "static" })` for the real HTTP redirect.
- **Vercel** reads `vercel.json` from the project root directory, never the output directory. The copy in `dist/` applies only when you deploy that folder (`vercel deploy dist`). A Git-connected project never reads it: it serves redirect pages and none of the content-type headers. Copy `redirects` and `headers` from `dist/vercel.json` into the root `vercel.json`, or use `vercel()` server build.

#### Pattern redirects

```ts
redirects: [
  { from: "/beta/:slug*", to: "/v2/:slug*" },
  { from: "/blog/:slug", to: "/articles/:slug" },
  { from: "/articles/concepts-*", to: "/concepts" },
  { from: "/old/article-*", to: "/new/article-*" },
],
```

| Syntax in `from`          | Meaning                                                                          |
| ------------------------- | -------------------------------------------------------------------------------- |
| `:name`                   | One whole segment. `/blog/:slug` covers `/blog/hello`, not `/blog/a/b`.          |
| `:name*` as last segment  | Rest of path, any number of segments. `/beta/:slug*` also covers `/beta` itself. |
| last segment `*`          | Same as `:name*`.                                                                |
| `*` at end of a segment   | Rest of path from there. `/articles/concepts-*` covers `/articles/concepts-overview`. |

- `to` reads a capture by name as a whole segment (`/:slug*`, `/:slug`), or `*` for what `*` in `from` matched (`:splat` also works). A `to` with no capture sends every covered path to one page.
- An exact redirect wins over a pattern covering the same path. Patterns are tried in list order.
- Each host gets patterns in its own syntax: splats in `_redirects`, `path-to-regexp` sources in `vercel.json`, routing config for `vercel()`/`netlify()` server builds. `node()` and `cloudflare()` servers match themselves, as do `blume dev` and `blume preview`.
- Static builds write NO redirect page for a pattern. A host reading none of the files (GitHub Pages) applies only exact redirects. `blume-redirects.json` lists patterns as written.
- `blume validate` warns `BLUME_BROKEN_REDIRECT` at a `to` that leads nowhere. An exact `to` must be a page, a `public/` or generated file, or another redirect's `from`. For a pattern, something must be served under the literal part of `to` before its first capture (`/v2/` in `/v2/:slug*`).
- `blume audit` follows every redirect through the built site (`blume audit --only redirects`).
- A pattern that also matches a page stops the build with `BLUME_REDIRECT_MATCHES_PAGE` (names the page). Narrow the pattern.
- An exact redirect from a page's own URL takes the URL over (the page never publishes). Same code, but a warning there: delete the page or drop the redirect. Same for a redirect from a page's Markdown copy (`/guide.md`, `/index.md`).

### 1.9 Content types (`_headers`)

A build emits `_headers` where the host reads one. It pins `charset=utf-8` onto raw AI endpoints: `/<route>.md`, `/<route>.mdx`, and `.txt` files (`llms.txt`, `llms-full.txt`). Without it many static hosts send no charset and browsers fall back to Windows-1252 (mojibake for non-ASCII docs).

| Host / build                      | Where the rules go                                             |
| --------------------------------- | -------------------------------------------------------------- |
| Netlify static, Cloudflare (Pages and Workers static assets, static and server), no-host static | `_headers` |
| Netlify server build              | `headers` of `.netlify/v1/config.json`                         |
| Static Vercel build               | `dist/vercel.json` (not read by Git-connected projects)        |
| Vercel server build               | Routing config                                                 |
| Node                              | Not written (server ignores the file)                          |

A `_headers` shipped in `public/` is left untouched.

### 1.10 Powered-by header

Blume sends `X-Powered-By: Blume`. Turn it off:

```ts
poweredBy: false,
```

- `blume dev` sends it on every response.
- Server builds: `node()` server and `cloudflare()` Worker set it; `vercel()` carries it in routing config; `netlify()` in header rules of its Frameworks API config plus middleware for on-demand pages.
- Static builds list it in `_headers` and `dist/vercel.json`. It does not reach a Git-connected Vercel project or a host that sends no custom headers (GitHub Pages).
- Ejected app: the switch is the `poweredBy` option of `blumeIntegration()` in `astro.config.mjs`. The server-entry wrapper and routing configs are `blume build` steps and are absent there.

### 1.11 Private docs

Blume has no sign-in. Anything in `dist/` is public to anyone who reaches the host. Use host access protection:

| Host         | Mechanism                                                                                 |
| ------------ | ----------------------------------------------------------------------------------------- |
| Vercel       | Deployment Protection, scope **All Deployments** (covers production). Vercel Authentication (team members) or Password Protection (paid). |
| Netlify      | Password protection on all deploys (shared password; team login on Enterprise).           |
| Cloudflare   | Cloudflare Access on the Worker (Workers & Pages, your Worker, Access).                   |
| GitHub Pages | Private publish from an organization on GitHub Enterprise Cloud.                          |
| Own server   | Authentication in front of `dist/` (nginx `auth_basic`, identity-aware proxy).            |

- Works the same for server builds. Covers the whole site; publish public pages as a separate site.
- Everything in `dist/` sits behind it: pages, search index, `.md` copies, `llms.txt`, OG images.
- Leaks: a hosted search provider (Algolia, Orama Cloud, Typesense, Mixedbread) keeps its own copy. Built-in Orama, FlexSearch, Pagefind indexes stay private.
- Outside services cannot read protected pages: Open in chat (ChatGPT/Claude), Slack/X link previews, agents reading `llms.txt` or MCP. Set `ai.openInChat: false` to hide chat actions.

### 1.12 Environment variables

Blume warns at `blume dev`/`build` when a needed secret is missing.

| Feature                                   | Variable                                                                                  |
| ----------------------------------------- | ----------------------------------------------------------------------------------------- |
| Assistant (AI Gateway)                    | `AI_GATEWAY_API_KEY` (or Vercel OIDC)                                                     |
| Assistant (other adapters)                | adapter default: `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`, `GEMINI_API_KEY`, `XAI_API_KEY`, `OPENROUTER_API_KEY`, `LLMGATEWAY_API_KEY`, `INKEEP_API_KEY`; or the `apiKeyEnv` you passed |
| Assistant bot protection                  | `TURNSTILE_SECRET_KEY` (`turnstile()`), `HCAPTCHA_SECRET_KEY` (`hcaptcha()`)              |
| Rate limiting `upstash()`                 | `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`                                      |
| Rate limiting `unkey()`                   | `UNKEY_ROOT_KEY`, or the `rootKeyEnv` you passed                                          |
| Mixedbread search                         | `MIXEDBREAD_API_KEY`                                                                      |
| Narration (generated voices)              | `AI_GATEWAY_API_KEY` (or Vercel OIDC) for `gateway()`; `OPENAI_API_KEY` for `openai()` (none with a `baseUrl`, unless you name one); or the `apiKeyEnv` passed to either |
| Content sources                           | `NOTION_TOKEN` (`notion()`), `SANITY_TOKEN` (`sanity()`), `CONTENTFUL_ACCESS_TOKEN` (`contentful()`; plus `CONTENTFUL_PREVIEW_TOKEN` for `--preview`, fails without it), `PAYLOAD_API_KEY` (`payload()`), `STRAPI_API_TOKEN` (`strapi()`), `GITHUB_TOKEN` (`githubReleases()`, and `mdxRemote()` with `github`) |
| Search index sync (build-time)            | `ALGOLIA_ADMIN_API_KEY`, `ORAMA_PRIVATE_API_KEY`, `TYPESENSE_ADMIN_API_KEY`               |

- Local: `.env.local`. Production: the host's environment.
- Content sources read tokens at fetch time (during `blume dev` and `blume build`). Narration reads its key during `blume build`. Set these where the site builds.
- Search-sync secrets are checked by the sync step: unset means the build warns and skips the sync; set and a failed sync fails the build.
- The GitHub info card also sends `GITHUB_TOKEN` when set, to lift GitHub's API rate limit.
- Other env vars: `DOCS_BASE` (your own, see 1.3), `HOST` and `PORT` (node server), `CF_PAGES_URL` (read by Blume on Cloudflare Pages).

### 1.13 Build cache and CI

Two caches:

- Astro/Vite caches: `.blume/.cache/` (content store, image transforms).
- Rendered OG cards: `node_modules/.cache/blume/og` (rebuild renders only changed title, description, or branding).

| Platform                | OG card cache across deploys                                                          |
| ----------------------- | ------------------------------------------------------------------------------------- |
| Vercel                  | Kept (restores `node_modules/**`; 1 GB, one month, per branch; new branch starts from production cache) |
| Netlify                 | Kept (restores `node_modules`)                                                        |
| Cloudflare Workers Builds | Not kept (only package-manager caches and `node_modules/.astro`)                    |
| GitHub Actions / own runners | Not kept unless you cache it                                                     |

GitHub Actions cache:

```yaml
- uses: actions/cache@v6
  with:
    path: node_modules/.cache/blume/og
    key: blume-og-${{ runner.os }}-${{ hashFiles('**/bun.lock', '**/package-lock.json', '**/pnpm-lock.yaml') }}
    restore-keys: blume-og-${{ runner.os }}-
```

- Cards are keyed by content, so an imprecise key is safe.
- `npm ci` deletes `node_modules` and discards the cache on every platform. Use `npm install`, `bun install`, or `pnpm install`.
- Every build prints a summary: output mode, adapter, resolved site URL, search provider, redirect count, sitemap and `llms.txt` status, enabled server features. Check it to confirm what shipped.

### 1.14 Monorepos

- Deploy the docs workspace as its own project. Set the host root directory to it (Vercel **Root Directory**, Netlify **Base directory**) with the settings from 1.1.
- Vercel: leave **Include source files outside of the Root Directory in the Build Step** on (default) when docs read files outside their workspace: component examples, a workspace package they import, an `@source` path in `theme.css`, or a spec elsewhere in the repo. With it off, the build cannot reach them.
- Vercel monorepo with `deployment: vercel()`: set no `outputDirectory` (the build writes `.vercel/output`). With a static build: `outputDirectory: "dist"`.

---

## 2. Upgrading Blume 1 to 2

Blume 2 changes configuration, not content. Pages need no edits (one frontmatter field changes behavior). Named strings and keyed blocks become **adapters** imported from `blume/*` subpaths and called. Ask AI is renamed the assistant. A site with none of these settings only needs the version bump.

### 2.1 `blume upgrade` workflow

Run from the project (the folder with `blume.config.ts`). Use `bunx blume@latest`, not `blume`: the command ships in Blume 2, so a project still on 1 does not have it.

```bash
bunx blume@latest upgrade
```

What it does:

1. Bumps `blume` in `package.json` to 2.
2. Installs with the project's package manager.
3. Checks `blume.config.ts` and `components.ts` against Blume 2.
4. Lists every remaining change with file, line, and replacement, including `package.json` scripts that still pass removed `blume build` flags.
5. Exits non-zero until none are left.

Flags:

| Flag                  | Effect                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------- |
| `--codex` / `--claude`| Opens Codex or Claude Code interactively with the findings and the upgrade guide. The agent applies each change and runs `blume doctor` and `blume build` until both pass. Each edit goes through the agent's permission flow. |
| `--no-install`        | Bump `package.json` without installing.                                                      |

- Run from a folder with neither a config nor a `blume` dependency: it stops with an error.
- pnpm 12: add `--allow-build=esbuild` after `pnpm dlx` (pnpm 12 will not run esbuild's install script unapproved).

Verify:

```bash
bunx blume upgrade   # repeat until nothing left
bunx blume doctor
bunx blume build
```

`blume upgrade` and `blume doctor` name each old config key found (`ai.ask`, `i18n.ui` keys) with its replacement.

### 2.2 Config change table (before and after)

| Area | Blume 1 | Blume 2 |
| --- | --- | --- |
| Search provider | `search: { provider: "algolia", algolia: { appId, indexName, searchApiKey } }` | `import { algolia } from "blume/search"` then `search: algolia({ appId, indexName, apiKey })` |
| Search, other providers | `provider: "oramaCloud"` / `"typesense"` / `"mixedbread"` with credential blocks | `oramaCloud()`, `typesense()`, `mixedbread()` from `blume/search` |
| Search, Pagefind | `provider: "pagefind"` | `search: pagefind()` |
| Search, off | `provider: "none"` | `search: false` |
| Search extras | `search: { provider, popular, indexing }` | Wrap: `search: { provider: algolia({ … }), popular: […] }` |
| Deployment adapter | `deployment: { adapter: "vercel", output: "server", site }` | `import { vercel } from "blume/deploy"` then `deployment: vercel({ site })` |
| Static deployment | `deployment: { site, base }` | Unchanged (still the static form) |
| Build flags | `blume build --adapter / --output / --base` | Removed. Build fails naming the replacing `deployment` setting. |
| Content sources | `{ type: "filesystem", root }` | `import { filesystem } from "blume/sources"`, `filesystem({ root })` |
| Content sources, GitHub releases | `{ type: "github-releases", owner, repo, prefix }` | `githubReleases({ owner, repo, prefix })` |
| Content sources, others | `{ type: "mdx-remote" / "sanity" / "notion" / "obsidian" }` | `mdxRemote()`, `sanity()`, `notion()`, `obsidian()` |
| Custom source | `{ type: "custom", source }` | `custom(source)` |
| `content.root/include/exclude` beside `sources` | Allowed | Not allowed. Move into the `filesystem()` entry. |
| API references | top-level `openapi: { enabled, spec }`, `asyncapi`, `graphql` blocks | `reference: [openapi({ spec }), asyncapi({ … }), graphql({ spec, endpoint })]` from `blume/reference`. Drop `enabled`. |
| Scalar renderer | `renderer: "scalar"` | Its own `scalar({ spec, theme, … })` entry in `reference`, keeping `route` and `sources` |
| Disabled reference | `enabled: false` | Leave the entry out |
| Analytics | `analytics: { posthog: { key }, vercel: true }` | `import { posthog, vercel } from "blume/analytics"`, `analytics: [posthog({ key }), vercel()]` |
| Analytics, Cloudflare | `cloudflare: { token }` | `cloudflare({ token })` |
| Analytics, scripts | `scripts[]` entries | `script({ … })` |
| Assistant | `ai.ask: { enabled, provider: "openrouter", model, reasoning }` | `ai.assistant: { enabled, provider: openrouter({ model, reasoning }) }` (adapter from `blume/ai`) |
| Machine-readable settings | `ai.api`, `ai.catalog`, `ai.llmsTxt`, `ai.markdownComponents`, `ai.mcp`, `ai.skills`, `ai.webBotAuth`, `ai.webmcp` | `agents.api`, `agents.catalog`, `agents.llmsTxt`, `agents.markdownComponents`, `agents.mcp`, `agents.skills`, `agents.webBotAuth`, `agents.webmcp` |
| SEO agent settings | `seo.agentReadability`, `seo.contentSignals` | `agents.agentReadability`, `agents.contentSignals` (per the 2.0.0 changelog) |
| `ai` after upgrade | many keys | Keeps only `assistant` (formerly `ask`) and `openInChat` |
| lastModified | `lastModified: true` | `lastModified: "git"` |
| lastModified object | `{ type: "git" }` / `{ type: "frontmatter" }` | Bare string `"git"` / `"frontmatter"` |
| Code block config | `markdown.codeBlocks: { theme }` | `markdown.code: { theme }` (merged) |
| Theme layout | `theme: { layout: "sidebar" }` | Removed. Delete it (nothing read it). |
| Component islands | `defineComponents({ islands: { Counter } })` | `defineComponents({ mdx: { Counter: { component: Counter, client: "visible" } } })` |
| Frontmatter `search.boost` | Accepted, ignored | Now multiplies search relevance. Re-check pages that set it. |
| CLI flags | Unknown flags ignored | Every command rejects unknown flags |

### 2.3 Search

```ts
// Blume 2
import { defineConfig } from "blume";
import { algolia } from "blume/search";

export default defineConfig({
  search: algolia({ appId: "APP_ID", indexName: "docs", apiKey: "SEARCH_KEY" }),
});
```

- `apiKey` is the search-only key in every adapter that takes one.
- `mixedbread()` takes `storeId`, not a key (queries run on the docs server). Other options it gets are forwarded to the store search call; `top_k` defaults to 8.
- Admin keys stay in env vars: `ALGOLIA_ADMIN_API_KEY`, `ORAMA_PRIVATE_API_KEY`, `TYPESENSE_ADMIN_API_KEY`, `MIXEDBREAD_API_KEY`.
- Default local search needs no change.

### 2.4 Deployment

```ts
// Blume 2
import { defineConfig } from "blume";
import { vercel } from "blume/deploy";

export default defineConfig({
  deployment: vercel({ site: "https://docs.example.com" }),
});
```

- `netlify()`, `cloudflare()`, `node()` work the same. Naming an adapter means server output. `output: "static"` keeps static with that host's platform files.
- Server output is no longer inferred from the platform environment. Name the adapter in `blume.config.ts`.
- A CI step that passed a different `--base` per deploy: read it from an env var in the config (see 1.3).
- `redirects` now read `:name` segments and a trailing `*` as patterns, matched the same on every host. Blume 1 handed them to each host as written. Re-check any `from` or `to` that holds one.

### 2.5 Content sources

```ts
// Blume 2
import { defineConfig } from "blume";
import { filesystem, githubReleases } from "blume/sources";

export default defineConfig({
  content: {
    sources: [
      filesystem({ root: "content" }),
      githubReleases({ owner: "acme", repo: "sdk", prefix: "changelog" }),
    ],
  },
});
```

- Other fields of mdx-remote, sanity, notion, obsidian move into the call unchanged.
- `githubReleases()` pages now publish in ONE language. A multi-locale site no longer copies them to every locale URL (`/de/changelog/…`). If others link to those copies, add redirects to the default-locale pages.
- `notion()` text renders as written (components, `{`, Markdown characters are no longer read as MDX). If Notion pages hold components or Markdown typed as text, set `mdx: true` on the source.

### 2.6 API references

```ts
// Blume 2
import { defineConfig } from "blume";
import { graphql, openapi } from "blume/reference";

export default defineConfig({
  reference: [
    openapi({ spec: "./openapi.yaml" }),
    graphql({ spec: "./schema.graphql", endpoint: "https://api.example.com/graphql" }),
  ],
});
```

- `asyncapi: { … }` becomes `asyncapi({ … })` with the same options.
- AsyncAPI 1.x or 2.x specs are still converted to 3.0, but the converter is now an optional peer: install `@asyncapi/converter` (`bun add -d @asyncapi/converter`) or the build fails with the install command. 3.x needs nothing.

### 2.7 Analytics

```ts
// Blume 2
import { defineConfig } from "blume";
import { posthog, vercel } from "blume/analytics";

export default defineConfig({
  analytics: [posthog({ key: "phc_…" }), vercel()],
});
```

### 2.8 Assistant rename (Ask AI to assistant)

```ts
// Blume 2
import { defineConfig } from "blume";
import { openrouter } from "blume/ai";

export default defineConfig({
  ai: {
    assistant: {
      enabled: true,
      provider: openrouter({ model: "anthropic/claude-sonnet-4-5", reasoning: "none" }),
    },
  },
});
```

- A 1.x `provider` name maps to `gateway()`, `openrouter()`, `llmgateway()`, or `inkeep()`. `openai-compatible` maps to `openai({ baseUrl, name, model, apiKeyEnv })`.
- `model`, `apiKeyEnv`, `baseUrl`, `headers`, `reasoning` move INTO the adapter.
- `enabled`, `instructions`, `retrieval`, `suggestions`, `cors`, `endpoint` stay on `ai.assistant` unchanged.
- `provider` unset still uses the AI Gateway.
- Blume 2.0.0 still read `ai.ask`. If already on 2.0.0, update `blume` and do the same rename.

Every name that said Ask AI changed:

| Old | New |
| --- | --- |
| `ai.ask` | `ai.assistant` |
| `i18n.ui` group `ask` | group `assistant` |
| `search.askAi`, `search.askAiHint` (`i18n.ui`) | `search.assistant`, `search.assistantHint` |
| `useAskAI` from `blume/hooks` | `useAssistant`; types `UseAssistant`, `UseAssistantOptions` |
| `askEnabled` prop on `PageLayout`, `RootLayout`, `Header`, `Search` override | `assistantEnabled` |
| `blume:data` module `config.ask`, `ui.ask` | `config.assistant`, `ui.assistant` (`UIStrings` type from `blume` follows) |
| `blume/ai` types `AskAdapter`, `AskGatewayOptions`, … (`Ask` prefix) | `AssistantAdapter`, `AssistantGatewayOptions`, … (`Assistant` prefix) |
| `askReasoningLevels`, `AskReasoning` from `blume/schema` | `assistantReasoningLevels`, `AssistantReasoning` |
| window event `blume:open-ask-ai` | `blume:open-assistant` |
| `data-blume-ask` attribute on `<body>` | `data-blume-assistant` |

Unchanged: the generated `/api/ask` route and the `ask`, `ask_answer`, `ask_error` analytics events keep their names.

### 2.9 Agents and other moves

```ts
// Blume 2
export default defineConfig({
  agents: { mcp: { enabled: true }, skills: "./skills" },
  lastModified: "git",
  markdown: {
    code: { theme: { light: "github-light", dark: "github-dark" } },
  },
});
```

### 2.10 Component overrides (`components.ts`)

Blume 2 validates every `components.ts` entry before the build. Each `mdx` and `layout` entry must be:

- an imported component, or
- a path string, or
- a `{ component, client, media }` object.

The `islands` group is gone. An `mdx` entry with a `client` mode is an island. The `islands/` folder convention still works.

An inline function, a component declared in `components.ts` itself, a spread, or a computed key fails with `BLUME_COMPONENTS_INVALID` naming the entry. Move the component to its own file and import it.

### 2.11 Ejected apps

An app ejected on Blume 1 still depends on the `blume` package but holds a Blume 1 snapshot in `src/generated/`. Bumping to 2 pairs that snapshot with Blume 2 components and breaks. Re-eject instead:

1. Copy everything except `astro.config.mjs`, `src/`, `.blume/`, `dist/`, `node_modules/` into an empty folder (content, `blume.config.ts`, `components.ts`, `islands/`, `public/`, spec files, `package.json`). Leave the ejected app as is.
2. In the copy: `bunx blume@latest upgrade`, apply changes, then `bunx blume build`.
3. In the copy: `bunx blume eject --yes`, install the added packages, run the build script.
4. Diff the fresh `astro.config.mjs` and `src/` against your ejected app and move your own changes over.

Until then, pin the ejected app to `"blume": "^1"` and do not run `blume upgrade` in it.

### 2.12 Command-line flags

Every `blume` command rejects flags it does not take (Blume 1 ignored them). A script passing a stray or misspelled flag fails, naming the flag and the accepted ones. `blume upgrade` reports only the three removed `blume build` flags (`--adapter`, `--output`, `--base`). Check other `blume` scripts by hand.

---

## 3. Migrating from other frameworks

`blume migrate` hands the migration to a coding agent working from Blume's bundled playbook (the `blume-migrate` skill shipped in the package). Run it from the root of the docs project being migrated, from a clean working tree. The agent works in place; review one diff.

```bash
bunx blume migrate fumadocs --codex
bunx blume migrate mintlify --claude
bunx blume migrate            # no source: detect from project files
```

- Swap `fumadocs` for the source, `--codex` for `--claude` to pick the agent.
- pnpm 12: add `--allow-build=esbuild` after `pnpm dlx`.
- The agent opens interactively, so every edit goes through its permission flow.
- Without `--codex` or `--claude`: the command reports the detected source, prints the path to the bundled `blume-migrate` `SKILL.md`, and exits without changing anything. Point any other agent at that file, or install the skill with the command it prints: `bunx skills add haydenbleasel/blume --skill blume-migrate`.
- Naming a source when the project looks like another: Blume warns and continues with the one named.
- An unsupported framework still works: run with no source; the agent inventories the repo and uses the playbook's general rules.
- Detection checks the folder you run in.

### 3.1 Supported sources and detection

| Source | Detected from |
| --- | --- |
| `mintlify` | `docs.json` or `mint.json` |
| `fumadocs` | `source.config.ts`, or `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx` in `package.json` |
| `docusaurus` | `docusaurus.config.*` |
| `starlight` | `@astrojs/starlight` in `package.json` |
| `nextra` | `nextra` in `package.json` |
| `vitepress` | `.vitepress/config.ts` (or `.mts`, `.js`, `.mjs`) at root or in `docs/`, or `vitepress` in `package.json` |
| `vuepress` | `.vuepress/config.ts` (or `.js`, `.mjs`, `.yml`, `.toml`) at root or in `docs/`, `vuepress.config.*`, or `vuepress` / `vuepress-vite` / `vuepress-webpack` in `package.json` |
| `docus` | `docus` (Docus 3+) or `@nuxt-themes/docus` (Docus 1) in `package.json`; in a workspace run it from the docs package |
| `mkdocs` | `mkdocs.yml`, `mkdocs.yaml`, `zensical.toml`, `properdocs.yml`, `properdocs.yaml` |
| `mdbook` | `book.toml` at root or in `docs/` or `book/` |
| `fern` | `fern/docs.yml` |
| `gitbook` | `.gitbook.yaml`, `.gitbook.yml`, `gitbook-docs.yaml`, or `honkit` / `gitbook-cli` in `package.json`; never `SUMMARY.md` alone |
| `redocly` | `sidebars.yaml`, or `@redocly/realm` or another Realm-family package in `package.json`; never `redocly.yaml` alone |
| `readme` | `_order.yaml` in `docs/`, `reference/`, `recipes/`, `custom_pages/`; a repo that uploads with `rdme` needs the source named |
| `docsify` | `docsify-cli` or `docsify` in `package.json`; a site without `package.json` needs the source named |
| `jekyll` | `_config.yml` at root or in `docs/`, checked after every other detected source (Just the Docs) |
| `github-wiki` | Never detected (no config file). Name the source. |

Several sources also have a codemod in the playbook (Mintlify, Docus, VitePress, MkDocs, Fern, ReadMe, Docsify, Jekyll, GitHub wiki). The agent runs it first for mechanical rewrites. Each source has its own mapping reference in the playbook. The playbook also has a monorepo reference for host-repo integration (content-root scoping, pnpm `minimumReleaseAge`, lockfile, Vercel recipe).

### 3.2 Agent workflow

1. Write `blume.config.ts`, mapping only what the source declares; rely on defaults (`{}` is a valid config).
2. Restructure content into filesystem navigation. Convert per-folder ordering files (Fumadocs `meta.json`, Nextra `_meta`) to `meta.ts`.
3. Rewrite pages: frontmatter to Blume's schema, callouts to directives, icons to Lucide, snippets inlined.
4. Add a `redirects` entry for every URL that moves. Docsify `#/` URLs never reach the server: a small client script redirects them. GitHub wiki URLs stay on github.com (cannot redirect): the agent maps each page to a new route and prepares link stubs to push to the old wiki.
5. Point `package.json` scripts at `blume dev`, `blume build`, `blume preview`; swap old framework dependencies for `blume`.
6. Run `blume build` and `blume validate --strict` until both pass. Never pass `--no-strict` to `build` (it silently drops pages with invalid frontmatter or unparseable `.mdx`).
7. Final summary: migrated, dropped, approximated (for example footer links or navbar buttons with no Blume equivalent).

### 3.3 Core translation rules

| Source concept | Blume target |
| --- | --- |
| Declared sidebar/nav | Filesystem navigation: folders are groups, files are pages. Explicit `navigation.sidebar` only when files cannot express the shape (it replaces filesystem generation entirely). |
| Per-folder sidecar nav (Fumadocs `meta.json`, Nextra `_meta.*`) | One `meta.ts` per folder via `defineMeta({ title, icon, order, collapsed, pages, display, directory })` |
| Group that exists only in config, pages flat on disk | A `(group)/` folder: adds a sidebar group, adds no URL segment, so no redirects. Parenthesized folders can pull in a page from another folder with `slug`. |
| Moved pages | `redirects` entry for each old route |
| Top-level tabs / product switchers | `navigation.tabs` (`{ label, path, icon? }`), one folder per tab. Active tab = longest `path` prefix of the route. |
| Versions / products / languages | `navigation.selectors` (`kind`: `dropdown`, `product`, `version`, `language`) |
| Header links / filled CTA button | `navigation.actions` (`[{ label, href }]`) / `navigation.cta` (`{ label, href }`) |
| Always-visible utility links (blog, changelog) | `navigation.featured` (`{ label, href, icon? }`) |
| Whole site served under a prefix (Docusaurus `routeBasePath`, Fumadocs `baseUrl`) | Top-level `basePath` |
| Callout components (`<Note>`, `<Warning>`, `<Info>`, `<Tip>`, `<Check>`, `<Error>`; admonitions) | `:::note`, `:::tip`, `:::warning`, `:::danger`, `:::info`, `:::success`, optional title `:::warning[Heads up]` |
| Icons (FontAwesome, Tabler, PascalCase names) | Bare kebab-case Lucide names (`book-open`). No FontAwesome/Tabler, no `iconType`. Unmappable: drop and report. |
| Snippets / partials / includes | `<include>` statements or inlined content (no import-based includes) |
| Docs home (`README.md`) | Rename to `index.md` (`README.md` is an ordinary page at `/README`) |
| Generated API reference stub pages | Delete; point `reference: [openapi({ spec })]` at the spec. Add a `navigation.tabs` entry at the adapter's `route`. |
| Hand-maintained changelog with releases on GitHub | Offer `githubReleases()` source instead of porting entries |
| Search provider | Adapter from `blume/search` |
| Custom head scripts, analytics | Adapter from `blume/analytics` (`script()` for unknown) |
| Favicon config | Filename convention: `icon.{svg,png,ico}` or `favicon.{svg,png,ico}` (and `apple-icon.png` / `apple-touch-icon.png`) in project root or `public/`. No `favicon` config field. |
| Source site URL | `deployment.site` (unless target is Vercel or Netlify, which auto-detect) |

Details worth keeping in mind:

- **Directives need `.mdx`.** Directives, math, mermaid, and `package-install` fences are MDX-only. In `.md`, `:::note` stays literal text (warning `BLUME_MD_DIRECTIVE`). Rename such pages to `.mdx`. MDX is stricter: escape `<` not opening a tag (`<7`, `List<T>`) as `&lt;` or `\<`, and bare `{` / `}` as `\{`.
- **Directive spelling.** `::: tip Title` (space after colons, markdown-it style) is NOT a directive. Write `:::tip[Title]`. Aliases: `caution` to warning, `error` to danger, `important` to note, `warn` to warning. MDC `::note` blocks (Docus) print as text (`BLUME_MDC_SYNTAX`).
- **Frontmatter schema is strict.** Unknown keys are build errors. Map to a Blume key or remove and report. Valid keys: `title`, `description`, `type` (`doc` default; `blog`, `changelog`), `sidebar` (`label`, `order`, `icon`, `badge`, `hidden`), `seo` (`title`, `description`, `image`, `canonical`, `noindex`), `search` (`exclude`, `tags`, `boost`), `slug`, `draft`, `lastModified`, `date`, `authors`, `changelog`, `deprecated`, shorthands `hidden` and `noindex`. `title` renders the H1: remove a duplicate body H1 (bodies start at `##`).
- **Routes.** Route = path relative to `content.root` with numeric prefixes stripped (`01-intro.mdx` to `/intro`) and `(group)/` adding no segment. Names starting with a date (`YYYY-MM-DD`, `D-M-YYYY`, `M-D-YYYY`, `YYYY-MM`) keep their digits. Pin `slug` for other digit-led names.
- **Ordering priority.** Explicit `navigation.sidebar`, then folder `meta.ts` `pages`, then frontmatter `sidebar.order`, then filesystem (`index` first, numeric prefix, alphabetical).
- **Content root.** `content.root` defaults to `docs`. When content sits directly under the app dir, set `content.root` there and scope `content.include` to the real folders. A bare `root: "."` scans everything.
- **Link and asset rewrites.** Rewrite internal links to new routes. Add redirects after rewriting inbound links (a redirect `from` hides stale links from `blume validate`).
- **Old heading anchors.** Every source slugs heading ids differently. After the first build, run the playbook's `pin-heading-ids.mjs` against the old site, rebuild until 0. Leftover `BLUME_BROKEN_ANCHOR` was already dead on the old site.
- **package.json.** Needs Node 22.19+ (update `.nvmrc`, `engines.node`, CI). `blume build` empties `<project>/dist`: if the host repo already uses `dist/`, put the Blume project in its own folder. Add `.blume/`, `dist/`, `.env.local` to `.gitignore`. Regenerate the lockfile in the same change. In a pnpm workspace with `minimumReleaseAge`, add only `blume` to `minimumReleaseAgeExclude`.
- **Formatter.** If the repo uses Ultracite/oxfmt, the directives get collapsed unless the oxfmt patch is applied (see FAQ).

Checks after migrating:

```bash
bunx blume build
bunx blume validate --strict           # links, anchors, assets, redirect targets
bunx blume audit --only redirects      # follows each redirect, finds loops and chains
```

Compare pages (`/compare` on the site) set Blume beside each framework and list what migration carries over and rewrites.

---

## 4. FAQ facts

**Positioning.** Blume is a zero-config framework: point it at a folder of Markdown and it generates navigation, search, theming, OG images, SEO, and AI endpoints. No app to own. MIT-licensed, free, no paid tier, no account.

| | Blume | Mintlify | Fumadocs / Nextra / Docusaurus |
| --- | --- | --- | --- |
| Model | Zero-config framework; content only | Hosted platform | Library + app you scaffold |
| Source | Open-source (MIT) | Closed core | Open-source |
| Hosting | Anywhere: static or server function | Their infrastructure | Anywhere; you build and deploy |
| You maintain | Your Markdown | Markdown + platform config | Markdown + the app around it |
| Rendering | Astro; core theme ships zero client JS | Their runtime | React/Next.js runtime |
| AI features | `llms.txt`, raw Markdown, in-page assistant, MCP, built in, no hosted service | Built in (hosted) | Bring your own |

- **No lock-in.** Content is portable Markdown. `blume eject` turns the project into a standalone Astro app that still uses the `blume` package.
- **Fast by default.** Core theme is React-free static HTML. Server features (assistant, MCP) are opt-in.
- **Typed config.** `blume.config.ts` and every `meta.ts` are TypeScript validated by a schema.
- **No Astro/React/Tailwind knowledge needed.** Reach for them only to customize: islands (React), component overrides, theme tokens (Tailwind).
- **MDX and React.** Pages can be `.md` or `.mdx`. Built-in components need no imports. Custom `.tsx`/`.jsx` islands are supported. Blume switches React on only when the project uses it: any `.tsx`/`.jsx` file (islands included), a React `<Component>` example, a component override, or the assistant. Otherwise no framework JavaScript ships.
- **Deploy anywhere.** Static by default. Server-only features (assistant, MCP server, on-demand rendering) need server output via a `blume/deploy` adapter.
- **Search needs no hosted service.** Orama builds a local index for dev and production. Pagefind is one adapter away: `search: pagefind()`. Either ships as part of the site.
- **Customizing the look.** Theme tokens (accent color, fonts, radius, `theme.css` for any Tailwind-expressible styling), component overrides, custom pages, or `blume eject`.

### Formatter collapses directives (oxfmt / Ultracite)

oxfmt's Markdown formatter (inherited from Prettier's Markdown printer, prettier/prettier#19040; reported as oxc-project/oxc#24096) joins `:::` fence lines with adjacent prose:

```md
:::note Regenerate the project with blume dev. :::
```

That is no longer a directive and renders as literal text. It affects all of `:::note`, `:::tip`, `:::info`, `:::warning`, `:::danger`, `:::success`.

Workaround: patch oxfmt so it preserves line breaks against a `:::` fence.

1. Save a patch as `patches/oxfmt@0.71.0.patch`. Blume ships it in the `blume-migrate` skill at `assets/oxfmt@0.71.0.patch`, inside the installed `blume` package.
2. Register it.
   - Bun, in `package.json`:

     ```json
     { "patchedDependencies": { "oxfmt@0.71.0": "patches/oxfmt@0.71.0.patch" } }
     ```

   - pnpm, in `pnpm-workspace.yaml` (pnpm 11+ no longer reads settings from `package.json`):

     ```yaml
     patchedDependencies:
       oxfmt@0.71.0: patches/oxfmt@0.71.0.patch
     ```
3. Reinstall: `bun install`.

The patch is version-pinned (diff references a hashed file `dist/markdown-*.js`). When bumping oxfmt, regenerate (`bun patch oxfmt`) or check whether the upstream fix landed.

### Knip reports `blume.config.ts` dependencies as unused

Knip has no Blume plugin and its Astro plugin does not activate (project depends on `blume`, and generated `.blume/` is gitignored). Register the files Blume loads as entries in `knip.json`:

```json
{
  "entry": [
    "blume.config.{ts,mjs,js}",
    "components.{ts,tsx}",
    "islands/**/*.{ts,tsx}",
    "pages/**/*"
  ]
}
```

- In a monorepo, put the same `entry` list under the docs workspace in `workspaces`.
- Drop lines for unused conventions. Adjust `pages/**/*` if you changed `content.pages`.
- Packages named only inside strings (for example an Astro integration calling `injectScript("page", "import('some-package')")`) still need an `ignoreDependencies` entry.

---

## 5. Gotchas

Deployment:

- Server output is explicit in Blume 2. Naming `vercel()` / `netlify()` / `cloudflare()` / `node()` switches to server output. Use `output: "static"` to stay static on that host.
- `netlify()` and `cloudflare()` need `@astrojs/netlify` / `@astrojs/cloudflare` installed. `vercel()` and `node()` ship with Blume.
- pnpm needs `allowBuilds` for `sharp` (Netlify) and `workerd` (Cloudflare). pnpm 11+ fails with `ERR_PNPM_IGNORED_BUILDS` otherwise.
- `blume preview` cannot serve `vercel()` or `netlify()` server builds. It errors.
- A `vercel()` server build deletes `.vercel/output/config.json`: `vercel deploy --prebuilt` cannot ship the output.
- A Git-connected Vercel project never reads `dist/vercel.json`. Copy `redirects` and `headers` into the root `vercel.json`, or use `vercel()`.
- `cloudflare()` server builds run on Workers only (not Pages). Static builds still deploy to Pages.
- On Cloudflare static assets, set `html_handling: "drop-trailing-slash"` or `/quickstart` gets a `307`.
- Unset `site` on GitHub Pages, S3, Cloudflare (Pages or Workers), or `node()` silently drops sitemap, OG images, RSS, canonicals. Cloudflare Pages only exposes per-deploy `CF_PAGES_URL`.
- `node()` options `host` and `port` do nothing. Use `HOST` and `PORT` env vars. Deploy with installed `node_modules`, not `dist/` alone.
- `node()` behind a reverse proxy: set `allowedDomains` or rate limiting lumps readers together.
- `vercel` and `cloudflare` import names collide with `blume/analytics`. Alias one.
- Patterns in `redirects` produce no redirect page in static builds. GitHub Pages applies only exact redirects.
- Netlify forced rules (`301!`) only come from `netlify()`. Use `netlify({ output: "static" })` for real HTTP redirects on a static Netlify site.
- A pattern redirect that matches a page fails the build with `BLUME_REDIRECT_MATCHES_PAGE`. An exact redirect from a page's URL or `.md` copy warns and takes the page over.
- `basePath` and `deployment.base` are different and compose: `{deployment.base}/{basePath}/page`. Write links and redirects as if at root.
- With `base: "/docs"`, `docs/setup.md` is at `/docs/docs/setup`.
- Host protection covers the whole site. Hosted search providers keep their own copy of content. Open in chat, link previews, and agents cannot reach protected pages.
- `npm ci` wipes the OG card cache. Cloudflare Workers Builds never keep `node_modules/.cache`.
- Build secrets (content sources, narration, search sync) must be set where the site builds, not only at runtime.
- Monorepo on Vercel: keep **Include source files outside of the Root Directory** on if docs read files outside their workspace.

Upgrade:

- Run `bunx blume@latest upgrade`, not `blume upgrade`, on a Blume 1 project.
- `blume build` flags `--adapter`, `--output`, `--base` are removed and fail the build. Unknown flags on any command now fail.
- `content.root/include/exclude` cannot sit beside `content.sources`: move them into `filesystem()`.
- `search.boost` frontmatter now works. A forgotten boost will move pages up.
- Pattern-like `from`/`to` in old redirects now behave as patterns.
- `githubReleases()` no longer copies pages to other locales. Add redirects if others link to those copies.
- `notion()` no longer parses MDX from typed text. Set `mdx: true` if pages relied on it.
- AsyncAPI 1.x/2.x needs `@asyncapi/converter` installed.
- Inline functions, spreads, computed keys, and in-file components in `components.ts` fail with `BLUME_COMPONENTS_INVALID`. The `islands` group is gone.
- Do not bump an ejected Blume 1 app in place. Re-eject from an upgraded copy.
- `/api/ask` and the `ask`, `ask_answer`, `ask_error` events keep their names despite the assistant rename.

Migrate:

- Start from a clean working tree. The agent edits in place.
- Never pass `--no-strict` to `blume build` during migration.
- `README.md` is not a folder index in Blume. Rename to `index.md`.
- Directives and GitHub alerts need `.mdx`. `::: tip Title` (spaced) is not a directive.
- Unknown frontmatter keys are build errors. Map or remove them.
- Icons must be kebab-case Lucide names. PascalCase names render nothing.
- Moving pages changes URLs: add redirects. Prefer `(group)/` folders, which keep URLs.
- `github-wiki` is never auto-detected. `readme` (with `rdme`) and `docsify` (without `package.json`) may need the source named.
- `blume build` empties `dist/`: do not share it with another tool's output.
- Docsify `#/` URLs and GitHub wiki URLs cannot be redirected server-side.

Formatting and tooling:

- Ultracite/oxfmt collapses `:::` directives unless the oxfmt patch is registered under `patchedDependencies`. The patch is version-pinned to oxfmt 0.71.0.
- Knip needs explicit `entry` globs for `blume.config.*`, `components.*`, `islands/**`, `pages/**`.
