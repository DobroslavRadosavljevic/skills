# Source Map

This reference captures the T3 Env docs snapshot used to create the skill.

## Snapshot

- Captured: 2026-08-22
- Stable npm `latest`:
  - `@t3-oss/env-core@0.13.11`
  - `@t3-oss/env-nextjs@0.13.11` (depends on `@t3-oss/env-core@0.13.11`)
  - `@t3-oss/env-nuxt@0.13.11` (depends on `@t3-oss/env-core@0.13.11`)
- Published: 2026-03-22
- npm canary observed: `0.13.4-canary.2c99b41` — do not target unless the project uses it
- Official docs: https://env.t3.gg
- Official repository: https://github.com/t3-oss/t3-env
- JSR: `jsr:@t3-oss/env-core`, `jsr:@t3-oss/env-nextjs`, `jsr:@t3-oss/env-nuxt`
- Context7 selections: `/t3-oss/t3-env`, `/websites/env_t3_gg`

Treat canary and alpha dist-tags as unavailable unless the project explicitly depends on them.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering "latest" questions.
2. Check package registry metadata:

   ```sh
   bun info @t3-oss/env-core
   bun info @t3-oss/env-nextjs
   bun info @t3-oss/env-nuxt
   ```

3. Prefer official docs pages and official repo source. If docs and package metadata disagree, report the mismatch.
4. Check the local project package version before applying APIs that require a minimum T3 Env version (Standard Schema and `presets-zod` need **0.12+**; `createFinalSchema` needs **0.13+**; Vite/WXT presets **0.13.8+**; `skipValidation` also skipping presets **0.13.9+**).
5. Align `@t3-oss/env-*` packages on the same 0.13.x version.

## Official Pages

- Introduction: https://env.t3.gg/docs/introduction
- Core: https://env.t3.gg/docs/core
- Next.js: https://env.t3.gg/docs/nextjs
- Nuxt: https://env.t3.gg/docs/nuxt
- Recipes: https://env.t3.gg/docs/recipes
- Standard Schema: https://env.t3.gg/docs/standard-schema
- Customization: https://env.t3.gg/docs/customization
- Standard Schema spec: https://standardschema.dev
- Core changelog: https://github.com/t3-oss/t3-env/blob/main/packages/core/CHANGELOG.md
- npm: https://www.npmjs.com/package/@t3-oss/env-core

## Source Files Used

- `docs/src/app/docs/introduction/page.mdx`
- `docs/src/app/docs/core/page.mdx`
- `docs/src/app/docs/nextjs/page.mdx`
- `docs/src/app/docs/nuxt/page.mdx`
- `docs/src/app/docs/recipes/page.mdx`
- `docs/src/app/docs/standard-schema/page.mdx`
- `docs/src/app/docs/customization/page.mdx`
- `packages/core/src/index.ts`
- `packages/core/src/presets.ts`
- `packages/core/src/presets-zod.ts`
- `packages/nextjs/src/index.ts`
- `packages/nuxt/src/index.ts`
- `packages/core/CHANGELOG.md`

## Version Line Orientation

| Line | Role |
| --- | --- |
| **0.13.x** | Current: `createFinalSchema`, ArkType presets, Vite/WXT/Coolify/Supabase presets |
| **0.12.x** | Standard Schema (not Zod-only); presets split to `presets-zod` / `presets-valibot`; Zod min **3.24** |
| **0.11.x and earlier** | Zod-only; presets from `@t3-oss/env-core/presets`; do not use for new work |
| **0.10.0** | Presets became functions: `vercel()` not `vercel` |
| **0.9.0** | ESM-only (no CJS) |
| **0.8.0** | `extends` presets; TypeScript **>= 5.0** |
