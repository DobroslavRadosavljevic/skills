# Source Map

This reference captures the schema-dts docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-05
- Stable npm packages:
  - `schema-dts@2.0.0` (Schema.org v30 core typings)
  - `schema-dts-gen@2.0.0` (generator CLI)
  - `schema-dts-lib@1.0.0` (shared helpers: `JsonLdObject`, `IdReference`, `MergeLeafTypes`)
- npm `latest` dist-tag (schema-dts): `2.0.0`
- Official repository: https://github.com/google/schema-dts
- Package homepage: https://opensource.google/projects/schema-dts
- License: Apache-2.0
- Context7 selection used for docs research: `/google/schema-dts`

`schema-dts` is **not** an officially supported Google product (upstream disclaimer).

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info schema-dts
   bun info schema-dts-gen
   bun info schema-dts-lib
   ```

3. Prefer the GitHub README, `examples.md`, package READMEs, and [releases](https://github.com/google/schema-dts/releases). If docs and package metadata disagree, report the mismatch.
4. Check the local project package version before applying v2-only APIs (`MergeLeafTypes`, `*Leaf`, `WithActionConstraints`, `schema-dts-lib`).
5. Cross-check Schema.org vocabulary changes against https://schema.org/docs/releases.html when types look missing or renamed.

## Official Pages

- Monorepo README: https://github.com/google/schema-dts/blob/main/README.md
- Integration examples (React, Next, Astro, Svelte): https://github.com/google/schema-dts/blob/main/examples.md
- `schema-dts` package README: https://github.com/google/schema-dts/blob/main/packages/schema-dts/README.md
- `schema-dts-gen` package README: https://github.com/google/schema-dts/blob/main/packages/schema-dts-gen/README.md
- npm `schema-dts`: https://www.npmjs.com/package/schema-dts
- npm `schema-dts-gen`: https://www.npmjs.com/package/schema-dts-gen
- npm `schema-dts-lib`: https://www.npmjs.com/package/schema-dts-lib
- v2.0.0 release notes: https://github.com/google/schema-dts/releases/tag/v2.0.0
- Schema.org vocabulary: https://schema.org/
- Schema.org Actions (input/output): https://schema.org/docs/actions.html
- Related React helper: https://github.com/google/react-schemaorg

## Package Roles

| Package | Role |
| --- | --- |
| `schema-dts` | Prebuilt TypeScript typings for latest **core** Schema.org (no pending layers) |
| `schema-dts-gen` | CLI / library to generate `.d.ts` from a Schema.org-compatible N-Triples ontology |
| `schema-dts-lib` | Ontology-agnostic JSON-LD helpers; dependency of v2 `schema-dts` and gen output |

## Source Files Used

- Root `README.md`, `examples.md`
- `packages/schema-dts/README.md`, `packages/schema-dts/package.json`
- `packages/schema-dts-gen/README.md`
- Installed `schema-dts@2.0.0` `dist/schema.d.ts` and `schema-dts-lib@1.0.0` `dist/index.d.ts`
- GitHub release body for `v2.0.0`
