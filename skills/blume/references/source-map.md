# Source map

Where Blume facts come from, how to refresh them, and the version timeline. Snapshot: `blume` **2.2.2** (published 2026-10-09).

## Contents

- [Primary sources](#primary-sources)
- [Read the installed docs first](#read-the-installed-docs-first)
- [Agent-readable endpoints on useblume.dev](#agent-readable-endpoints-on-useblumedev)
- [Docs page map](#docs-page-map)
- [Version timeline](#version-timeline)
- [Refresh checklist](#refresh-checklist)

## Primary sources

| Source | URL / path |
| --- | --- |
| Site and docs | https://useblume.dev, https://useblume.dev/docs |
| npm | https://www.npmjs.com/package/blume |
| Repository | https://github.com/haydenbleasel/blume (package in `packages/blume`, docs in `apps/docs/content/docs`, skills in repo-root `skills/`) |
| Changelog | https://useblume.dev/changelog (RSS: `/changelog/rss.xml`; entries at `/changelog/blume-<major>-<minor>-<patch>`) |
| License / author | MIT, Hayden Bleasel |

Package facts (2.2.2): ESM, `bin: blume`, Node `>=22.19.0`. Ships `docs/`, `skills/`, `AGENTS.md`, `CHANGELOG.md`, and `src/` (exports point at TypeScript source; types in `dist/types`).

## Read the installed docs first

The installed package bundles the full docs and upstream skills. They match the installed version exactly, so prefer them over web pages when they disagree.

```bash
node -e "console.log(require.resolve('blume/package.json'))"
```

Run it from the workspace that depends on `blume`. In pnpm or Bun monorepos the package lives under that workspace (`apps/docs/node_modules/blume`), not the repo root.

| Path in package | Content |
| --- | --- |
| `docs/index.mdx`, `docs/01-quickstart.mdx` | Overview, quickstart |
| `docs/02-deployment.mdx`, `docs/03-upgrading.mdx`, `docs/04-migrating.mdx`, `docs/08-faq.mdx` | Deploy, v1→v2, migration, FAQ |
| `docs/content/` | Pages, navigation, meta, frontmatter, syntax, components, includes, variables, islands, i18n, versioning, `sources/` |
| `docs/configuration/` | Config file, theming, customization, search, assistant, rate limiting, narration, analytics, consent, export |
| `docs/discoverability/` | Metadata, OG, structured data, RSS, sitemap/robots, llms.txt, Markdown, JSON API, MCP, agent discovery |
| `docs/references/` | OpenAPI, AsyncAPI, GraphQL, Scalar, hand-written API pages |
| `docs/cli/` | CLI index, doctor, validate, audit, evals, translate, version |
| `docs/advanced/` | Skills, custom pages, changelog, blog |
| `skills/blume`, `skills/blume-migrate`, `skills/blume-update-docs`, `skills/blume-write-skill` | Upstream agent skills |
| `CHANGELOG.md` | Per-release notes with migration snippets |

Upstream skills can also be installed with `bunx skills add haydenbleasel/blume`.

## Agent-readable endpoints on useblume.dev

| Endpoint | Use |
| --- | --- |
| `/llms.txt` | Page index with summaries and the changelog list |
| `/llms-full.txt` | Full corpus (about 5 MB, includes all locales and changelog) — grep it, do not load it whole |
| `/<page>.md` | Markdown mirror of any page (`/docs/quickstart.md`) |
| `/api/docs/pages.json` + `/openapi.json` | JSON docs API |
| `/mcp` (+ `/.well-known/mcp.json`) | MCP server: `search_docs`, `get_page`, `list_pages`, `get_navigation` |
| `/.well-known/agent-skills/index.json` | Published skills index |
| `/.well-known/ai-catalog.json`, `/.well-known/api-catalog`, `/agent-readability.json` | Discovery manifests |

Localized docs live under `/de`, `/hi`, `/ja`, `/pt` with the same paths.

## Docs page map

| Topic | URL path |
| --- | --- |
| Quickstart, deployment, upgrading, migrating, FAQ | `/docs/quickstart`, `/docs/deployment`, `/docs/upgrading`, `/docs/migrating`, `/docs/faq` |
| Content | `/docs/content`, `/navigation`, `/meta`, `/frontmatter`, `/syntax`, `/includes`, `/variables`, `/components`, `/islands`, `/i18n`, `/versioning`, `/sources/*` |
| Configuration | `/docs/configuration`, `/theming`, `/customization`, `/search`, `/assistant`, `/rate-limiting`, `/narration`, `/analytics`, `/consent`, `/export` |
| Discoverability | `/docs/discoverability`, `/metadata`, `/open-graph`, `/structured-data`, `/rss`, `/sitemap-and-robots`, `/llms-txt`, `/markdown`, `/json-api`, `/mcp`, `/agent-discovery` |
| API references | `/docs/references/openapi`, `/asyncapi`, `/graphql`, `/scalar`, `/api-pages` |
| CLI | `/docs/cli`, `/doctor`, `/validate`, `/audit`, `/evals`, `/translate`, `/version` |
| Advanced | `/docs/advanced/skills`, `/custom-pages`, `/changelog`, `/blog` |

## Version timeline

| Version | Change worth knowing |
| --- | --- |
| 1.0.0 | First stable release |
| 1.1.0 | `blume audit` |
| 1.2.0 | `integrations` array in config |
| 1.5.0 | Docs versioning |
| 1.6.0 | Native GraphQL references |
| 1.6.2 | JSON docs API |
| 1.7.3 | AI Catalog / ARD manifest |
| **2.0.0** | Adapter model: `search`, `deployment`, `content.sources`, `reference`, `analytics`, and the assistant backend become adapters from `blume/*`; `ai.ask` → `ai.assistant`; machine-readable settings `ai.*` → `agents.*`; `components.ts` planned statically (`islands` group removed); unknown CLI flags rejected; `redirects` exact paths only; `--adapter/--output/--base` build flags removed; `@asyncapi/converter` optional peer |
| 2.1.0 | API reference code samples in 18 languages |
| 2.1.1 | Algolia sync splits long pages (10 KB record cap) |
| 2.1.2 | `X-Powered-By: Blume` header (`poweredBy: false` to drop) |
| 2.1.3 | Install fix for `@vitejs/plugin-react` / `@astrojs/react` peer conflict |
| 2.2.0 | `blume migrate` sources expanded (VitePress, VuePress, Docus, MkDocs/Material/Zensical, mdBook, Fern, GitBook, Redocly, …) |
| 2.2.1 | `footer.copyright` (string or locale map) |
| 2.2.2 | Page actions menu wraps long labels |

## Refresh checklist

1. `bun info blume` (or `npm view blume version time`) for the current `latest`.
2. Read `CHANGELOG.md` entries newer than 2.2.2 in the installed package, or the `/changelog` index.
3. Diff `docs/` between versions when a config key behaves differently than these references say.
4. Re-verify adapter export names: `src/search/adapters/index.ts`, `src/deploy/adapters/index.ts`, `src/sources/index.ts`, `src/reference/index.ts`, `src/analytics/index.ts`, `src/consent/index.ts`, `src/ai/index.ts`, `src/ratelimit/index.ts`, `src/captcha/index.ts`.
5. Update the snapshot version in `SKILL.md` and this file.
