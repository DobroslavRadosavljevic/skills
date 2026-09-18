# Source Map

This reference captures the current Zod docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-09-18
- Stable npm package: `zod@4.6.5` (published 2026-09-13)
- npm `latest` dist-tag: `4.6.5`
- npm `canary` observed: `4.5.0-canary.20260828T171753` (behind `latest`; do not use unless the project already depends on it)
- Standalone Mini: `@zod/mini@4.6.5` (peer `zod@^4.6.0`, lockstep with `zod` since 4.5)
- Official homepage: https://zod.dev
- Official repository: https://github.com/colinhacks/zod
- Official docs source snapshot: https://github.com/colinhacks/zod/tree/v4.6.5/packages/docs/content
- LLM index: https://zod.dev/llms.txt
- Context7 selection used for docs research: `/websites/zod_dev` (redirected from `/websites/zod_dev_v4`), cross-checked against `/colinhacks/zod`

Treat canary and prerelease dist-tags (`next`, `alpha`, `beta`, `canary`) as unavailable unless the project explicitly depends on them.

## Refresh Procedure

1. Resolve the current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info zod
   bun info @zod/mini
   ```

3. Prefer official docs pages, blog posts, and official repo source. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version before applying APIs that require a minimum Zod version (compile 4.5+, `validate` method / `z.iban` / `z.withParser` 4.6+, `z.currencyCode` 4.6.4+).
5. For library support across Zod 3 and Zod 4, verify subpath imports and peer dependency ranges.

## Official Pages

- Basics: https://zod.dev/basics
- API: https://zod.dev/api
- AOT compilation: https://zod.dev/compile
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
- Zod 4.5: https://zod.dev/blog/zod-4-5
- Zod 4.6: https://zod.dev/blog/zod-4-6
- Introducing `z.compile()`: https://zod.dev/blog/introducing-z-compile

## Source Files Used

- `packages/docs/content/basics.mdx`
- `packages/docs/content/api.mdx`
- `packages/docs/content/compile.mdx`
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
- `packages/docs/content/blog/zod-4-5.mdx`
- `packages/docs/content/blog/zod-4-6.mdx`
- GitHub releases `v4.5.0`–`v4.6.5`

## Version Line Orientation

| Line | Role |
| --- | --- |
| **4.6.5** | Current `latest`. `.validate()`, `z.instanceof().properties()`, `z.iban()`, `z.withParser()`, `z.currencyCode()`, lazy `safeParse` errors |
| **4.5.x** | `z.compile()`, `z.creditCard()`, `z.deepPartial()` function, `.exactPartial()`, `z.toZod`, cyclical inputs, ~9x smaller schemas |
| **4.4.x** | Previous skill snapshot (`4.4.3`) |
| **4.1.x** | Codecs |
| **4.0.x** | Zod 4 on the package root |
| **3.25.x** | Dual-publish with `zod/v4` subpath; Zod 3 functionally EOL |
