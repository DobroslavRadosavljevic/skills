# Source Map

This reference captures the Intlayer docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-26
- Target line: **Intlayer 9.4** (`latest` dist-tag)
- Stable npm packages: `intlayer@9.4.1`, `react-intlayer@9.4.1`, `vite-intlayer@9.4.1`
- npm `latest` dist-tag: `9.4.1` (published 2026-08-26; 9.4.1 is a same-day version-alignment fix on 9.4.0)
- npm canary observed: `9.4.0-canary.0`
- Official homepage: https://intlayer.org
- Official repository: https://github.com/aymericzip/intlayer
- Official TanStack Start template: https://github.com/aymericzip/intlayer-tanstack-start-template
- Context7 selections used: `/websites/intlayer_doc`, `/aymericzip/intlayer` (Context7 version list may lag npm; prefer npm + intlayer.org for 9.4)

Treat canary and prerelease dist-tags as unavailable unless the project explicitly depends on them. Keep all `@intlayer/*` and `*-intlayer` packages on the **same 9.4.x**.

### Releases since the previous skill snapshot (`9.0.1`, 2026-07-23)

| Version | Date | Skill-relevant changes |
| --- | --- | --- |
| 9.0.2 | 2026-07-26 | Patch on 9.0 |
| 9.1.0–9.1.3 | 2026-07-30 – 08-05 | `select()` content node; object `variant` absorbs former dynamic records; drop `meta` |
| 9.2.0 | 2026-08-07 | Mid-line features |
| 9.3.0–9.3.3 | 2026-08-10 – 08-20 | Analytics default-on when `@intlayer/analytics` is installed (9.3.3) |
| 9.4.0 | 2026-08-26 | `getIntlayerAsync` / `getDictionaryAsync`; Start `head` loads per-locale chunks; `elysia-intlayer`; domain rewrite types; Next providers merged |
| 9.4.1 | 2026-08-26 | Version alignment across packages |

If the installed project is still on 9.0.x, do not use `getIntlayerAsync` until packages are bumped to 9.4.x together.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info intlayer
   bun info react-intlayer
   bun info vite-intlayer
   ```

3. Prefer official docs pages and the Start guide on **intlayer.org** over GitHub `docs/docs/en` when they disagree — the published Start guide updates (for example 9.4.0 `getIntlayerAsync` in `head`) can land on the site before the raw GitHub file.
4. Check the local project package versions before applying docs that require a minimum Intlayer version.
5. Prefer the React TanStack Start guide over Next.js (`next-intlayer`) or Solid Start (`solid-intlayer`) pages unless the project uses those stacks.
6. Ignore Intlayer docs/template samples that introduce `LocalizedLink` / `useLocalizedNavigate`. This skill requires native TanStack Router `Link` / `useNavigate` with `{-$locale}` + `params.locale` only.
7. If configuration.md and v9 release notes disagree (notably `routing.enableProxy` default), prefer the live [configuration](https://intlayer.org/doc/concept/configuration) page and report the mismatch.

## Official Pages

### Start + Vite

- TanStack Start guide: https://intlayer.org/doc/environment/tanstack-start
- Vite + React: https://intlayer.org/doc/environment/vite-and-react
- Vite plugin: https://intlayer.org/doc/packages/vite-intlayer/intlayer
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
- Formatters: https://intlayer.org/doc/formatters
- Bundle optimization: https://intlayer.org/doc/concept/bundle-optimization

### Packages / APIs

- `getIntlayerAsync`: https://intlayer.org/doc/packages/intlayer/getIntlayerAsync
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

- Published Start guide at `/doc/environment/tanstack-start` (history 9.4.0, 2026-08-22)
- `docs/docs/en/packages/intlayer/getIntlayerAsync.md` (9.4.0)
- `docs/docs/en/releases/v9.md` / published `/doc/releases/v9`
- Published `/doc/concept/configuration`
- Published `/doc/concept/cli`, `/doc/concept/analytics`, `/doc/concept/content/plural`, `/doc/formatters`
- `docs/docs/en/dynamic_dictionaries/index.md` (9.1 object variants)
- Official template: `aymericzip/intlayer-tanstack-start-template`
