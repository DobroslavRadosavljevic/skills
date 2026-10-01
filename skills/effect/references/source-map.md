# Source Map

Snapshot of Effect **4.0.0** (first stable v4 release, LTS) used for this skill.

## Snapshot

- Verified: 2026-10-01
- Canonical v4 source: https://github.com/Effect-TS/effect (v4 on `main`, v3 on branch `v3`); snapshot tag `effect@4.0.0`
- Verified tag archive: https://github.com/Effect-TS/effect/tree/effect%404.0.0
- Package version at that tag: `effect@4.0.0` (all monorepo packages share this number; published 2026-10-01)
- npm dist-tags: `latest` = **4.0.0**. `rc` (`4.0.0-rc.118`) and `beta` (`4.0.0-beta.107`) are historical prereleases — do not install them for new work.
- Last v3: `effect@3.22.2`. `@effect/platform@latest` is still the v3-era `0.97.x` — v4 has no `@effect/platform` package.
- Install: `bun add effect` (and matching `@effect/*` packages at the same version)
- LTS policy (README): at least three years of bug and security fixes; bug fixes for one year and security fixes for two years after the next major. Stable APIs break only in majors; `@stability unstable` APIs may break in minors; `@stability experimental` APIs may break in patches.
- `Effect-TS/effect-smol` is archived; v4 moved into `Effect-TS/effect`. A stale `.temp/effect-smol` checkout is historical beta only.
- Docs: https://effect.website (v4 API under `/docs/v4/api/`)
- API: https://effect.website/docs/v4/api/effect
- Agent-oriented in-repo docs: `.temp/effect/LLMS.md`, `.temp/effect/ai-docs/`
- Schema guide: `.temp/effect/packages/effect/SCHEMA.md`
- Migration: `.temp/effect/MIGRATION.md`, `.temp/effect/migration/v3-to-v4.md` (curated per-API map), `.temp/effect/migration/schema.md`
- Release notes: `packages/effect/CHANGELOG.md` (`## 4.0.0` plus the `4.0.0-rc.*` / `4.0.0-beta.*` history below it)

The catalogs enumerate public namespace exports from `src/index.ts`, `src/testing/index.ts`, and every `src/<area>/index.ts` (the former `src/unstable/<area>/` folders). Module stability comes from each module's `@stability` JSDoc tag.
The ecosystem list covers all non-private package manifests in the tag. It excludes internal files and per-function overloads.
The RC → 4.0 delta was taken from `packages/effect/CHANGELOG.md` entries `4.0.0-rc.113` through `4.0.0` and a tag diff `effect@4.0.0-rc.112..effect@4.0.0`.

## Refresh

```sh
mkdir -p .temp
test -d .temp/effect/.git || git clone --depth 1 --branch "effect@4.0.0" https://github.com/Effect-TS/effect.git .temp/effect
# inspect only — do not bun install / build the clone
```

```sh
bun info effect
bun info @effect/vitest
```

Do not assume an existing checkout matches this snapshot. Read its commit and package version before using it.
Refresh inventories from the same tag; compare exported names and non-private manifests, then update the snapshot date/version.
Dist-tags can change. Confirm them before presenting install commands as current.

Prefer: local installed types → `.temp/effect` sources → official v4 docs. If they disagree, implement against **installed** declarations and report drift.

## Official files that shaped this skill

- `README.md`, `LLMS.md`, `MIGRATION.md`, `migration/*.md`
- `packages/effect/src/*.ts` (root modules), `packages/effect/src/<area>/**`, `packages/effect/src/testing/**`
- `packages/effect/SCHEMA.md`, `packages/effect/CHANGELOG.md`
- `packages/{platform,sql,ai,atom,opentelemetry,vitest,tools}/**/package.json` and READMEs
- `packages/vitest/README.md` (Vitest 5 migration, fixtures, property tests)
