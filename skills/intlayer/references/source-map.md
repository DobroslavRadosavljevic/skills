# Source Map

This reference captures the Intlayer docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-10-01
- Target line: **Intlayer 9.6** (`latest` dist-tag); APIs match the 9.5 line
- Stable npm packages: `intlayer@9.6.0`, `react-intlayer@9.6.0`, `vite-intlayer@9.6.0`
- npm `latest` dist-tag: `9.6.0` (published 2026-09-30)
- Matching companions observed at `9.6.0`: `@intlayer/analytics`, `@intlayer/mcp`, `@intlayer/types`, `elysia-intlayer`, `next-intlayer`
- npm canary observed: `9.5.9-canary.0` (older than `latest`; ignore)
- Official homepage: https://intlayer.org
- Official repository: https://github.com/aymericzip/intlayer
- Official TanStack Start template: https://github.com/aymericzip/intlayer-tanstack-start-template
- LLM index: https://intlayer.org/llms.txt (Start: `/doc/environment/tanstack-start.md`)
- MCP: local `bunx @intlayer/mcp`; remote `https://mcp.intlayer.org`
- Context7 selections used: `/websites/intlayer_doc`, `/aymericzip/intlayer` (Context7 version list may lag npm — listed `v8.12.2` at snapshot time; prefer npm + intlayer.org for 9.5)

Treat canary and prerelease dist-tags as unavailable unless the project explicitly depends on them. Keep all `@intlayer/*` and `*-intlayer` packages on the **same 9.5.x**.

### Releases since the previous skill snapshot (`9.4.1`, 2026-08-26)

| Version | Date | Skill-relevant changes |
| --- | --- | --- |
| 9.4.2–9.4.4 | 2026-09-02 – 09-04 | Line patches after 9.4.1 alignment |
| 9.5.0 | 2026-09-08 | Remix 3 guide; Next `withIntlayer` starts its own content watcher (Next-only). `build.chunkGrouping` / `build.dictionariesPreload` present in 9.5 types (defaults `true`; Vite `intlayerChunk` + `intlayerPreload`) |
| 9.5.1 | 2026-09-09 | Benchmark / docs refresh |
| 9.5.2 | 2026-09-12 | CLI: replace `intlayer ci <cmd>` with **`--ci` flag** on the real command (`fill --ci`, `build --ci`, …) |
| 9.5.3 | 2026-09-14 | Line patch |
| 9.5.4 | 2026-09-18 | Version alignment. Engine: insertion handling for markdown/HTML via auto-decorate. `react-intlayer` analytics: `useExperiment`. `vite-intlayer/nitro-handler` (h3 v2) for Nitro/Start production SSR |

### Releases since the 9.5.4 snapshot (2026-09-18)

| Version | Date | Skill-relevant changes |
| --- | --- | --- |
| 9.5.5–9.5.7 | 2026-09-20 – 09-23 | Astro/Remix integration work; `vite-intlayer` web proxy handler for Astro (`vite-intlayer/web-proxy-handler`, not used on Start); `init infra` |
| 9.5.8 | 2026-09-24 | CLI **`intlayer upgrade`** |
| 9.5.9–9.5.11 | 2026-09-24 – 09-27 | `getConfiguration` deprecated (import `defaultLocale` / `locales` / `routing` / `editor` from `intlayer`); `scan` detects routing strategy, hreflang reciprocity, `og:locale`, sitemap indexes |
| 9.5.12 | 2026-09-30 | `getIntlayer` / `getIntlayerAsync` with omitted locale resolve the request locale (Next.js) → stored locale → default |
| 9.6.0 | 2026-09-30 | `init` installs packages + framework only, opt-in steps become sub-commands, `--interactive` requires a terminal; compat adapters `@intlayer/svelte-i18n`, `@intlayer/nuxtjs-i18n` (the doc page says `@intlayer/nuxt-i18n`, which is not on npm), `@intlayer/ngx-translate`; replaced i18n packages move to devDependencies; Nitro handler path fix on Windows; Vite content-watcher lock; React `IntlayerProvider` locale-change refactor and eager dictionary transform; browser (Chrome/Firefox) extension; AI `model` typed per provider. No config default changes |

If the installed project is still on 9.4.x, do not use `--ci`, `useExperiment`, or assume `chunkGrouping` / `dictionariesPreload` until packages are bumped to 9.5.x together. `getIntlayerAsync` remains the 9.4+ server/head API.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info intlayer
   bun info react-intlayer
   bun info vite-intlayer
   ```

3. Prefer official docs pages and the Start guide on **intlayer.org** over GitHub `docs/docs/en` when they disagree — published Start guide updates can land on the site before the raw GitHub file.
4. Check the local project package versions before applying docs that require a minimum Intlayer version.
5. Prefer the React TanStack Start guide over Next.js (`next-intlayer`) or Solid Start (`solid-intlayer`) pages unless the project uses those stacks.
6. Ignore Intlayer docs/template samples that introduce `LocalizedLink` / `useLocalizedNavigate`. This skill requires native TanStack Router `Link` / `useNavigate` with `{-$locale}` + `params.locale` only. The official Start template still contains those wrappers as of this snapshot.
7. If configuration.md, v9 release notes, and `vite-intlayer` plugin docs disagree (notably `routing.enableProxy` default), prefer the live [configuration](https://intlayer.org/doc/concept/configuration) page plus `@intlayer/types` `config.d.ts` and report the mismatch.
8. `llms.txt` still omits `/doc/releases/v9.md` (lists v6–v8 only). Do not treat that gap as “v9 unpublished”.

## Official Pages

### Start + Vite

- TanStack Start guide: https://intlayer.org/doc/environment/tanstack-start
- Vite + React: https://intlayer.org/doc/environment/vite-and-react
- Vite plugin: https://intlayer.org/doc/packages/vite-intlayer/intlayer
- Vite proxy: https://intlayer.org/doc/packages/vite-intlayer/intlayerProxy
- Source doc (GitHub, may lag site): https://github.com/aymericzip/intlayer/blob/main/docs/docs/en/intlayer_with_tanstack.md

### Core

- v9 release notes: https://intlayer.org/doc/releases/v9
- Configuration: https://intlayer.org/doc/concept/configuration
- How Intlayer works: https://intlayer.org/doc/concept/how-works-intlayer
- Content file: https://intlayer.org/doc/concept/content
- Translation: https://intlayer.org/doc/concept/content/translation
- Plural: https://intlayer.org/doc/concept/content/plural
- Select: https://intlayer.org/doc/concept/content/select
- Dynamic dictionaries: https://intlayer.org/doc/concept/dynamic-dictionaries
- CLI: https://intlayer.org/doc/concept/cli
- CLI upgrade: https://intlayer.org/doc/concept/cli/upgrade
- Formatters: https://intlayer.org/doc/formatters
- Bundle optimization: https://intlayer.org/doc/concept/bundle-optimization

### Packages / APIs

- `getIntlayerAsync`: https://intlayer.org/doc/packages/intlayer/getIntlayerAsync
- `intlayer` exports: https://intlayer.org/doc/packages/intlayer/exports
- `useIntlayer`: https://intlayer.org/doc/packages/react-intlayer/useIntlayer
- `useLocale`: https://intlayer.org/doc/packages/react-intlayer/useLocale
- `IntlayerProvider`: https://intlayer.org/doc/packages/react-intlayer/IntlayerProvider

### Optional platforms

- Analytics: https://intlayer.org/doc/concept/analytics
- CMS: https://intlayer.org/doc/concept/cms
- Visual editor: https://intlayer.org/doc/concept/editor
- MCP: https://intlayer.org/doc/mcp-server
- Compat adapters: https://intlayer.org/doc/releases/v9
- Sync JSON plugin: https://intlayer.org/doc/plugin/sync-json

## Source Files Used

- Published Start guide at `/doc/environment/tanstack-start` (history still 9.4.0 for `getIntlayerAsync` head; page updated 2026-08-29 with static / dynamic / cached-dynamic tabs)
- `docs/docs/en/packages/intlayer/getIntlayerAsync.md` (9.4.0)
- `docs/docs/en/releases/v9.md` / published `/doc/releases/v9` (does not list 9.5 point releases)
- Published `/doc/concept/configuration` (includes `chunkGrouping` / `dictionariesPreload` in the example; history last entry 9.3.3)
- `@intlayer/types@9.5.4` `config.d.ts` (authoritative knob defaults)
- `intlayer@9.6.0` / `react-intlayer@9.6.0` / `vite-intlayer@9.6.0` package exports (9.6.0 adds `vite-intlayer/web-proxy-handler`)
- `@intlayer/types@9.6.0` `config.d.ts` diff vs 9.5.4 (only AI model typing changed)
- `docs/docs/en/cli/init.md`, `cli/upgrade.md`, `packages/intlayer/getIntlayer.md`, `packages/intlayer/getConfiguration.md` at tag `v9.6.0`
- `docs/docs/en/cli/index.md`, `build.md`, `fill.md` (9.5.2 `--ci`)
- `docs/docs/en/packages/vite-intlayer/intlayerProxy.md` (Nitro auto-injection)
- Official template: `aymericzip/intlayer-tanstack-start-template` (still ships `LocalizedLink`)
