# Source Map

This reference captures the Intlayer docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-23
- Stable npm packages: `intlayer@9.0.1`, `react-intlayer@9.0.1`, `vite-intlayer@9.0.1`
- npm `latest` dist-tag: `9.0.1`
- npm canary observed: `9.0.0-canary.21`
- Official homepage: https://intlayer.org
- Official repository: https://github.com/aymericzip/intlayer
- Official TanStack Start template: https://github.com/aymericzip/intlayer-tanstack-start-template
- Context7 selections used: `/websites/intlayer_doc`, `/aymericzip/intlayer` (Context7 version list may lag npm; prefer npm + intlayer.org for v9)

Treat canary and prerelease dist-tags as unavailable unless the project explicitly depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info intlayer
   bun info react-intlayer
   bun info vite-intlayer
   ```

3. Prefer official docs pages and the Start guide. If docs and package metadata disagree, report the mismatch.
4. Check the local project package versions before applying docs that require a minimum Intlayer version.
5. Prefer the React TanStack Start guide over Next.js (`next-intlayer`) or Solid Start (`solid-intlayer`) pages unless the project uses those stacks.

## Official Pages

- TanStack Start guide: https://intlayer.org/doc/environment/tanstack-start
- Vite + React: https://intlayer.org/doc/environment/vite-and-react
- v9 release notes: https://intlayer.org/doc/releases/v9
- Configuration: https://intlayer.org/doc/concept/configuration
- How Intlayer works: https://intlayer.org/doc/concept/how-works-intlayer
- Content / translation: https://intlayer.org/doc/concept/content/translation
- CLI: https://intlayer.org/doc/concept/cli
- Vite plugin: https://intlayer.org/doc/packages/vite-intlayer/intlayer
- `useIntlayer`: https://intlayer.org/doc/packages/react-intlayer/useIntlayer
- `useLocale`: https://intlayer.org/doc/packages/react-intlayer/useLocale
- Source doc (GitHub): https://github.com/aymericzip/intlayer/blob/main/docs/docs/en/intlayer_with_tanstack.md

## Source Files Used

- `docs/docs/en/intlayer_with_tanstack.md`
- `docs/docs/en/releases/v9` (published at `/doc/releases/v9`)
- `docs/docs/en/configuration.md` (published at `/doc/concept/configuration`)
- Official template: `aymericzip/intlayer-tanstack-start-template`
