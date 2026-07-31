# Source Map

This reference captures the Effect v4 beta docs and repository snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-31 (testing section refreshed)
- Prior core snapshot: 2026-07-08
- `effect` npm `latest`: still Effect v3 line (check registry)
- `effect` npm `beta`: `4.0.0-beta.102` (verify with `bun info effect`)
- `@effect/vitest` for Effect **v4**: install `@effect/vitest@beta` → `4.0.0-beta.102` (align with `effect@beta`)
- `@effect/vitest` npm `latest` is still `0.30.0` (Effect **v3**) — do not use with `effect@beta`
- Effect v4 beta repository: https://github.com/Effect-TS/effect-smol (migration/history) and published packages from https://github.com/Effect-TS/effect
- Official Effect docs: https://effect.website
- Effect v4 beta announcement: https://effect.website/blog/releases/effect/40-beta/
- API reference: https://effect-ts.github.io/effect/
- `@effect/vitest` package: https://github.com/Effect-TS/effect/tree/main/packages/vitest
- Context7 docs checked: `/effect-ts/effect`, `/effect-ts/website`

Treat `effect@beta` as separate from npm `latest`: as of this snapshot, stable npm `latest` is still Effect v3 while v4 is on the `beta` dist-tag.

## Refresh Procedure

1. Ensure a local `effect-smol` checkout exists under `.temp/` (create `.temp` if needed). Clone once; reuse on later runs:

   ```sh
   mkdir -p .temp
   test -d .temp/effect-smol/.git || git clone --depth 1 https://github.com/Effect-TS/effect-smol.git .temp/effect-smol
   ```

   When referencing Effect v4 code, always browse `.temp/effect-smol` (sources, `MIGRATION.md`, `migration/*`, package READMEs, and tests). Pull or re-clone if the checkout is stale relative to the installed beta.
2. Resolve current docs with documentation tooling before answering latest-version questions.
3. Check package registry metadata:

   ```sh
   bun info effect
   bun info @effect/vitest
   ```

4. Check the local project's installed versions before applying v4 guidance.
5. For v4 beta specifics, prefer the local `.temp/effect-smol` checkout and installed package declarations over older v3 docs.
6. If docs, repository source, and local types disagree, prefer local installed declarations for implementation and report the drift.

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
- `Effect-TS/effect` / `effect-smol`: `packages/vitest/README.md`, `packages/vitest/src/**` (v4 `@effect/vitest`)
- In-skill deep testing guide: [vitest-testing.md](vitest-testing.md)
- `Effect-TS/effect-smol`: selected `packages/*/test` examples for services, layers, HTTP, and tests.

## Current v4 Themes

- Effect v4 is beta and APIs may change between beta releases.
- v4 packages share one version number across the ecosystem.
- Many formerly separate packages are consolidated into the core `effect` package.
- Platform-specific, provider-specific, and technology-specific packages remain separate and should use matching v4 beta versions.
- New and evolving functionality lives under `effect/unstable/*`; these modules may break in minor releases.
- The v4 codebase and migration guides are in `Effect-TS/effect-smol`.
