# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: **2026-10-10**
- Package: **`phaser@4.2.1`** (npm `latest`, published 2026-07-09). `Phaser.VERSION` in `master` is `4.2.1`.
- npm dist-tags: `latest` 4.2.1 · `beta` 4.0.0-rc.7 (stale) · `alpha` 4.0.0-alpha.4 (stale)
- Recent releases: 4.0.0 (2026-04-10) · 4.1.0 (2026-04-30) · 4.2.0 (2026-06-19) · 4.2.1 (2026-07-09)
- Unreleased in repo: `changelog/v4/4.3/CHANGELOG-v4.3.0.md` (adds `TintModes.MULTIPLY_ADD`); no 4.3 on npm at capture
- Phaser 3 final: `3.90.0` (Tsugumi, 2025-05-23)
- License: MIT
- Scaffolder: `@phaserjs/create-game@1.3.2` (`bun create @phaserjs/game@latest`)
- Official templates (GitHub `phaserjs/*`): `template-vite`, `template-vite-ts`, `template-react`, `template-react-ts`, `template-vue`, `template-vue-ts`, `template-nextjs`, `template-angular` (all pin `phaser@4.0.0`, Vite 6 at capture). `template-svelte-ts`, `template-sveltekit`, `template-electron`, `template-ionic-capacitor` returned 404 at capture.
- Package files: `main` `src/phaser.js`, `module` `dist/phaser.esm.js`, `browser` `dist/phaser.js`, `types` `types/phaser.d.ts`; `exports` exposes only `.` and `./package.json`.
- Bundle size: `dist/phaser.min.js` about 1.38 MB.

## URLs

- Site: https://phaser.io/
- Docs hub: https://docs.phaser.io/
- API docs: https://docs.phaser.io/api-documentation/api-documentation
- Repo: https://github.com/phaserjs/phaser
- Releases: https://github.com/phaserjs/phaser/releases
- Changelog index: https://github.com/phaserjs/phaser/blob/master/CHANGELOG.md
- v4 migration guide: https://github.com/phaserjs/phaser/blob/master/changelog/v4/4.0/MIGRATION-GUIDE.md
- v4 changelogs: `changelog/v4/4.0`, `4.1`, `4.2`, `4.2.1`, `4.3`
- Upstream topic docs (agent-oriented, in repo): `skills/<topic>/SKILL.md` and `references/REFERENCE.md` under https://github.com/phaserjs/phaser/tree/master/skills (scenes, game-setup-and-config, loading-assets, sprites-and-images, text-and-bitmaptext, groups-and-containers, animations, tweens, time-and-timers, input-keyboard-mouse-touch, cameras, physics-arcade, physics-matter, tilemaps, particles, audio-and-sound, data-manager, events-system, scale-and-responsive, filters-and-postfx, render-textures, game-object-components, graphics-and-shapes, curves-and-paths, geometry-and-math, actions-and-utilities, v3-to-v4-migration, v4-new-features)
- Cone lights doc: `docs/Phaser 4 Cone Lights.md` in the repo
- PCT atlas spec: `docs/Phaser Compact Texture Atlas Format Specification/` in the repo
- Create-game tutorial: https://phaser.io/tutorials/create-game-app
- npm: https://www.npmjs.com/package/phaser
- CDN: https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js · https://cdnjs.cloudflare.com/ajax/libs/phaser/4.2.1/phaser.min.js
- Examples: https://phaser.io/examples
- Context7 IDs: `/phaserjs/phaser` (also tag `v3_90_0` for v3), `/websites/phaser_io_api-documentation`, `/websites/phaser_io_phaser`

## Refresh Procedure

1. `curl -s https://registry.npmjs.org/phaser | jq '."dist-tags", (.time | to_entries | .[-8:])'` for versions and dates.
2. Read the newest `changelog/v4/*` file(s) and `CHANGELOG.md` table in the repo; note new game objects, config options, and breaking changes.
3. Shallow-clone the repo (`git clone --depth 1 https://github.com/phaserjs/phaser`) into a temp dir and skim `skills/*/SKILL.md` for changed APIs; verify any signature you cite with `grep` in `src/`.
4. Re-check template `package.json` files for the Phaser and Vite versions they pin.
5. Update the snapshot line in `SKILL.md`, the description version, the README row, and this file.

## Uncertainties at capture

- Svelte: no standalone official Svelte template was reachable; the Svelte pattern in the frameworks reference is the generic mount/destroy approach.
- Next.js and Vue template internals were not read line by line; their `ssr: false` and `onMounted`/`onUnmounted` patterns are the standard approach but confirm in the template repos.
- `4.3.0` may be released after this snapshot and could add APIs not covered here.
- Behaviour of colliders on `TilemapGPULayer` was not verified at runtime.
- Plugin ecosystem (rex plugins, Spine, Matter helpers) v4 compatibility was not tested.
