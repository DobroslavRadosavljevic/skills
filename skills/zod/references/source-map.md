# Source Map

This reference captures the current Zod docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-08
- Stable npm package: `zod@4.4.3`
- npm `latest` dist-tag: `4.4.3`
- npm canary observed: `4.5.0-canary.20260504T180558`
- Official homepage: https://zod.dev
- Official repository: https://github.com/colinhacks/zod
- Official docs source snapshot: https://github.com/colinhacks/zod/tree/v4.4.3/packages/docs/content
- Context7 selection used for docs research: `/websites/zod_dev_v4`, cross-checked against `/colinhacks/zod`

Treat canary and prerelease dist-tags as unavailable unless the project explicitly depends on them.

## Refresh Procedure

1. Resolve the current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info zod
   ```

3. Prefer official docs pages and official repo source. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version before applying docs that require a minimum Zod version.
5. For library support across Zod 3 and Zod 4, verify subpath imports and peer dependency ranges.

## Official Pages

- Basics: https://zod.dev/basics
- API: https://zod.dev/api
- Zod package: https://zod.dev/packages/zod
- Zod Mini: https://zod.dev/packages/mini
- Zod Core: https://zod.dev/packages/core
- Codecs: https://zod.dev/codecs
- Customizing errors: https://zod.dev/error-customization
- Formatting errors: https://zod.dev/error-formatting
- Metadata and registries: https://zod.dev/metadata
- JSON Schema: https://zod.dev/json-schema
- Library authors: https://zod.dev/library-authors
- Zod 4 release notes: https://zod.dev/v4
- Zod 4 migration guide: https://zod.dev/v4/changelog
- Zod 4 versioning: https://zod.dev/v4/versioning

## Source Files Used

- `packages/docs/content/basics.mdx`
- `packages/docs/content/api.mdx`
- `packages/docs/content/codecs.mdx`
- `packages/docs/content/error-customization.mdx`
- `packages/docs/content/error-formatting.mdx`
- `packages/docs/content/json-schema.mdx`
- `packages/docs/content/library-authors.mdx`
- `packages/docs/content/metadata.mdx`
- `packages/docs/content/packages/zod.mdx`
- `packages/docs/content/packages/mini.mdx`
- `packages/docs/content/packages/core.mdx`
- `packages/docs/content/v4/index.mdx`
- `packages/docs/content/v4/changelog.mdx`
- `packages/docs/content/v4/versioning.mdx`
