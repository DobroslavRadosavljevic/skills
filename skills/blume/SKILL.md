---
name: blume
description: "Build, configure, write, review, debug, deploy, upgrade, or migrate docs sites with Blume (npm `blume` 2.x, useblume.dev), the Markdown-first docs framework on Astro/Vite. Use for blume.config.ts, defineConfig, defineMeta/meta.ts, components.ts, MDX pages, frontmatter, directives (:::note), built-in components, sidebar/tabs, theming, search adapters (orama, pagefind, algolia), the assistant (ai.assistant), llms.txt, .md mirrors, JSON docs API, MCP server, OG/RSS/sitemap, OpenAPI/AsyncAPI/GraphQL/Scalar references, i18n, versioning, changelog/blog, content sources (Obsidian, Notion, Sanity, GitHub Releases), analytics, deploy adapters (vercel, netlify, cloudflare, node), and the blume CLI (init, dev, build, doctor, validate, audit, eval, translate, eject, upgrade, migrate). Also use when a repo depends on `blume` or has blume.config.ts, for Blume 1→2 upgrades, or to move Mintlify, Docusaurus, GitBook, MkDocs, or ReadMe docs to Blume."
---

# Blume

Use this skill for **Blume 2.x** (`blume`): Markdown/MDX in a folder becomes a static Astro docs site with search, OG images, and an agent-facing layer (llms.txt, `.md` mirrors, JSON API, optional MCP). The CLI generates and drives a hidden Astro project in `.blume/`; users own only content and config. Docs: [useblume.dev/docs](https://useblume.dev/docs). Snapshot **2.2.2** (2026-10-09).

## Workflow

1. Inspect the project before writing anything:
   - Installed version: `bun pm ls blume` or the `version` in `node_modules/blume/package.json`. These references target **2.x**. Node must be **>= 22.19**.
   - Find the project root: the folder with `blume.config.ts` (in monorepos often `apps/docs`). Content root is `content.root` (default `docs/`).
   - Blume 1 leftovers (`ai.ask`, `ai.llmsTxt`, `deployment.adapter`, top-level `openapi:`, `analytics: { posthog }`, `markdown.codeBlocks`, an `islands` group in `components.ts`) mean an upgrade comes first. See [deploy-upgrade-migrate.md](references/deploy-upgrade-migrate.md).
   - Ejected app (an Astro project that imports `blume`)? Then edit Astro files directly. Otherwise never edit `.blume/`: it is regenerated on every run.
2. When the installed package and these references disagree, trust the package. Its bundled `docs/` folder matches the installed version. Locate it with `node -e "console.log(require.resolve('blume/package.json'))"` from the depending workspace. See [source-map.md](references/source-map.md).
3. Route to the right reference:
   - Config keys, site chrome, adapter import names: [config.md](references/config.md)
   - Routes, frontmatter, `meta.ts`, sidebar, tabs, selectors: [content-navigation.md](references/content-navigation.md)
   - Markdown/MDX syntax, directives, code blocks, components, includes, variables, islands: [authoring.md](references/authoring.md)
   - Theme tokens, fonts, component overrides, layout slots, `blume add`, search adapters, PDF/EPUB export: [theming-search.md](references/theming-search.md)
   - Assistant, rate limiting, narration, analytics, consent: [assistant-analytics.md](references/assistant-analytics.md)
   - SEO, OG, RSS, sitemap, llms.txt, `.md` mirrors, Copy as Markdown, Open in chat, JSON API, MCP, discovery manifests: [discoverability.md](references/discoverability.md)
   - OpenAPI, AsyncAPI, GraphQL, Scalar, hand-written API pages: [api-references.md](references/api-references.md)
   - Content sources, i18n, versioning, changelog, blog, custom `.astro` pages: [sources-i18n-versioning.md](references/sources-i18n-versioning.md)
   - Every CLI command, flag, exit code, and CI recipe: [cli.md](references/cli.md)
   - Hosting, redirects, `basePath`, Blume 1→2 upgrade, migration from other frameworks, FAQ: [deploy-upgrade-migrate.md](references/deploy-upgrade-migrate.md)
4. Make the smallest change that works: content first, then frontmatter, then `meta.ts`, then `blume.config.ts`, then component overrides. Eject only when the user asks for full control.
5. Verify (below) and report what ran.

## Core Judgment

- **Zero config is the default.** A `docs/` folder with one `.mdx` file is a full project. Do not add config, an explicit sidebar, or overrides the task does not need.
- **Navigation comes from the file tree.** Order with numeric prefixes (`01-intro.mdx`, stripped from URLs), `sidebar.order`, or `meta.ts` `pages`. Group without a URL segment with `(group)` folders. An explicit `navigation.sidebar` freezes the tree; use it only when asked.
- **Built-in components need no imports** in `.mdx`. Prefer directives (`:::note`, `:::tip`, `:::warning`) for callouts. Use `.md` for plain prose, `.mdx` for components. In `.mdx`, escape `{`, write `{/* comments */}`, and self-close void tags.
- **Frontmatter is strict.** Unknown keys fail the build. Declare custom keys with `frontmatter.extend` or `content.types` (Standard Schema: Zod, Valibot, ArkType). Quote YAML values that contain `: `.
- **Blume 2 is adapter-based.** Pluggable features take adapter calls from subpaths: `search: pagefind()` from `blume/search`, `deployment: vercel()` from `blume/deploy`, `reference: [openapi({ … })]` from `blume/reference`, `analytics: [posthog({ … })]` from `blume/analytics`, `ai.assistant.provider: gateway({ … })` from `blume/ai`. Check exact export names in [config.md](references/config.md#adapter-subpaths). Install the optional peer dependency an adapter needs.
- **`ai` vs `agents`.** `ai` holds reader-facing model features (assistant, Open in chat). `agents` holds the machine-readable surface (llms.txt, Markdown, JSON API, MCP, skills, manifests).
- **Static by default; server only when needed.** No `deployment` means a static build to `dist/`. The MCP server, the assistant, server-side search, and the API playground proxy need server output: name a host adapter. A static build that uses one fails and says which adapter to set.
- **Set `deployment.site`** (or deploy on Vercel, Netlify, or Cloudflare Pages, where it is detected) before relying on sitemap, RSS, auto OG images, the AI catalog, or `/skill.md`.
- **Secrets stay in env.** Local secrets go in `.env.local` (gitignored by `blume init`). Never inline API keys in `blume.config.ts`.
- **Prefer the CLI for diagnosis.** `blume doctor` checks config, content, Node version, and server-only features. `blume validate` checks links. Diagnostics carry `BLUME_*` codes with file and line; fix the cause instead of passing `--no-strict`.
- **Migrations and upgrades have tooling.** Use `blume upgrade` (rerun until it exits 0) for 1→2, and `blume migrate <source>` for other frameworks. Both can hand off to Codex or Claude Code with `--codex` / `--claude`.

## Quick Start

```bash
bunx blume init          # prompts; --yes for defaults, --no-install to only write files
bun run dev              # dev server with hot reload
bun run build            # static HTML in dist/ plus a local search index
```

Existing `package.json`? `blume init` leaves it alone and skips the install. Then run `bun add blume` and add `"dev": "blume dev"`, `"build": "blume build"`, `"doctor": "blume doctor"` scripts. Any package manager works. pnpm 12 needs esbuild's build script approved. Yarn 2+ needs a `node_modules` linker; `init` writes `.yarnrc.yml` for that.

```mdx docs/index.mdx
---
title: Introduction
description: Welcome to my docs.
---

Welcome! Use **Markdown** and built-in components with no imports:

:::note
Blume ships callouts, cards, tabs, steps, and more.
:::
```

```ts blume.config.ts
import { defineConfig } from "blume";

export default defineConfig({
  title: "Acme Docs",
  description: "Documentation for Acme.",
  logo: "/logo.svg",
  github: { owner: "acme", repo: "docs" },
  deployment: { site: "https://docs.acme.com" },
});
```

## Verification

Prefer repository scripts. Cover the relevant subset:

- `bunx blume doctor`: config, content, Node version, server-only features.
- `bunx blume validate` (add `--strict` in CI so warnings fail; external URL checks are opt-in): internal links, anchors, `related`, nav hrefs.
- `bunx blume build`: must pass with no `BLUME_*` errors. Do not hide failures with `--no-strict`.
- `bunx blume audit` after a build, for SEO and site-health issues with source file and line.
- For agent-facing work, check the built output: `dist/llms.txt`, a page's `.md` mirror, `sitemap.xml`, `robots.txt`. For MCP or the assistant, run the server build and call the route.
- After an upgrade, `bunx blume upgrade` must exit 0, then run `doctor` and `build`.

Report which checks ran, which were skipped and why, and any version assumptions that remain.
