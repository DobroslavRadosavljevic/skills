# Source Map

Snapshot of Effect **v4 RC** used for this skill.

## Snapshot

- Verified: 2026-09-22
- Canonical v4 source: https://github.com/Effect-TS/effect (v4 on `main`); snapshot tag `effect@4.0.0-rc.112`
- Verified tag archive: https://github.com/Effect-TS/effect/tree/effect%404.0.0-rc.112
- Package version at that tag: `effect@4.0.0-rc.112` (all ecosystem packages share this number)
- Install: `bun add effect@rc` (and matching `@effect/*@rc`)
- npm `latest` (`effect@3.x`) is **not** v4
- `Effect-TS/effect-smol` is archived; v4 moved into `Effect-TS/effect`. A stale `.temp/effect-smol` checkout is historical beta only — **do not** treat it as current RC.
- Docs: https://effect.website (v4 docs under `/docs/v4/`)
- API: https://effect.website/docs/v4/api/effect
- Agent-oriented in-repo docs: `.temp/effect/LLMS.md`, `.temp/effect/ai-docs/`
- Schema guide: `.temp/effect/packages/effect/SCHEMA.md`
- Migration: `.temp/effect/MIGRATION.md`, `.temp/effect/migration/`

Treat `effect@rc` as separate from `effect@latest`. Pin matching `4.0.0-rc.N` across the ecosystem.

The catalogs enumerate public namespace exports from `src/index.ts`, `src/testing/index.ts`, and every `src/unstable/*/index.ts`.
The ecosystem list covers all non-private package manifests in the tag. It excludes internal files and per-function overloads.
Context7 v4 RC documentation also confirmed service, runtime, and unstable-module guidance.

## Refresh

```sh
mkdir -p .temp
test -d .temp/effect/.git || git clone --depth 1 --branch main https://github.com/Effect-TS/effect.git .temp/effect
# inspect only — do not bun install / build the clone
```

```sh
bun info effect@rc
bun info @effect/vitest@rc
```

Do not assume an existing checkout matches this snapshot. Read its commit and package version before using it.
Refresh inventories from the same tag; compare exported names and non-private manifests, then update the snapshot date/version.
Release tags and dist-tags can change. Confirm them before presenting install commands as current.

Prefer: local installed types → `.temp/effect` sources → official v4 docs. If they disagree, implement against **installed** declarations and report drift.

## Official files that shaped this skill

- `README.md`, `LLMS.md`, `MIGRATION.md`, `migration/*.md`
- `packages/effect/src/*.ts` (stable modules), `packages/effect/src/unstable/**`, `packages/effect/src/testing/**`
- `packages/effect/SCHEMA.md`
- `packages/{platform,sql,ai,atom,opentelemetry,vitest,tools}/**/package.json` and READMEs
- `packages/vitest/README.md`
