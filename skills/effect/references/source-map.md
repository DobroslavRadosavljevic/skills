# Source Map

This reference captures the Effect v4 beta docs and repository snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-08
- `effect` npm `latest`: `3.21.4`
- `effect` npm `beta`: `4.0.0-beta.94`
- `@effect/vitest` npm `latest`: `0.29.0`
- `@effect/vitest` npm `beta`: `4.0.0-beta.94`
- Effect v4 beta repository: https://github.com/Effect-TS/effect-smol
- Repository commit inspected: `bdca35449d5dfce5b4433da75ec0a88d0a9b2b27`
- Latest inspected commit time: 2026-07-08T13:04:23Z
- Official Effect docs: https://effect.website
- Effect v4 beta announcement: https://effect.website/blog/releases/effect/40-beta/
- API reference: https://effect-ts.github.io/effect/
- Context7 docs checked: `/effect-ts/effect`, `/effect-ts/website`

Treat `effect@beta` as separate from npm `latest`: as of this snapshot, stable npm `latest` is still Effect v3 while v4 is on the `beta` dist-tag.

## Refresh Procedure

1. Resolve current docs with documentation tooling before answering latest-version questions.
2. Check npm metadata:

   ```sh
   npm view effect version dist-tags repository.url homepage description --json
   npm view @effect/vitest version dist-tags --json
   ```

3. Check the local project's installed versions before applying v4 guidance.
4. For v4 beta specifics, prefer the official `Effect-TS/effect-smol` repository and installed package declarations over older v3 docs.
5. If docs, repository source, and local types disagree, prefer local installed declarations for implementation and report the drift.

## Official Source Files Used

- `Effect-TS/website`: `content/src/content/docs/blog/releases/effect/4.0-beta.mdx`
- `Effect-TS/effect-smol`: `MIGRATION.md`
- `Effect-TS/effect-smol`: `migration/services.md`
- `Effect-TS/effect-smol`: `migration/runtime.md`
- `Effect-TS/effect-smol`: `migration/error-handling.md`
- `Effect-TS/effect-smol`: `migration/forking.md`
- `Effect-TS/effect-smol`: `migration/layer-memoization.md`
- `Effect-TS/effect-smol`: `migration/scope.md`
- `Effect-TS/effect-smol`: `migration/fiberref.md`
- `Effect-TS/effect-smol`: `migration/yieldable.md`
- `Effect-TS/effect-smol`: `migration/cause.md`
- `Effect-TS/effect-smol`: `migration/equality.md`
- `Effect-TS/effect-smol`: `migration/v3-to-v4.md`
- `Effect-TS/effect-smol`: `packages/effect/README.md`
- `Effect-TS/effect-smol`: `packages/effect/SCHEMA.md`
- `Effect-TS/effect-smol`: `packages/effect/src/Config.ts`
- `Effect-TS/effect-smol`: `packages/effect/src/ConfigProvider.ts`
- `Effect-TS/effect-smol`: `packages/effect/src/ManagedRuntime.ts`
- `Effect-TS/effect-smol`: `packages/vitest/README.md`
- `Effect-TS/effect-smol`: selected `packages/*/test` examples for services, layers, HTTP, and tests.

## Current v4 Themes

- Effect v4 is beta and APIs may change between beta releases.
- v4 packages share one version number across the ecosystem.
- Many formerly separate packages are consolidated into the core `effect` package.
- Platform-specific, provider-specific, and technology-specific packages remain separate and should use matching v4 beta versions.
- New and evolving functionality lives under `effect/unstable/*`; these modules may break in minor releases.
- The v4 codebase and migration guides are in `Effect-TS/effect-smol`.
