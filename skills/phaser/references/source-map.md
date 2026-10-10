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
- Official templates (GitHub `phaserjs/*`): `template-vite(-ts)`, `-react(-ts)`, `-vue(-ts)`, `-nextjs`, `-angular`, `-svelte`, `-solid`, `-remix`, `-bun`, `-webpack`, `-rapier` pin `phaser@4.0.0` (Vite 6 at capture); `template-tauri` pins `^3.88.2`; `discord-template` client pins `^3.90.0`. Full list and notes in [ecosystem-packages.md](ecosystem-packages.md).
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

## Ecosystem URLs

- Companion packages reference: [ecosystem-packages.md](ecosystem-packages.md)
- phaserjs GitHub org: https://github.com/phaserjs (repos: `create-game`, `phaser-box2d`, `rapier-connector`, `template-*`, `phaser-editor-template-*`, `editor-scripts-*`, `phaser-game-agent`, `editor-mcp-server`, `phas3d`, `discord-template`)
- npm scope: https://www.npmjs.com/org/phaserjs · `https://registry.npmjs.org/-/v1/search?text=scope:phaserjs`
- Create Game: https://www.npmjs.com/package/@phaserjs/create-game
- Game Agent (MCP): https://www.npmjs.com/package/@phaserjs/game-agent
- Editor: https://phaser.io/editor · MCP server: https://www.npmjs.com/package/@phaserjs/editor-mcp-server
- Box2D: https://phaser.io/box2d · https://github.com/phaserjs/phaser-box2d · https://www.npmjs.com/package/phaser-box2d
- Rapier: https://rapier.rs/ · https://www.npmjs.com/package/@dimforge/rapier2d-compat · https://github.com/phaserjs/template-rapier
- Spine for Phaser: https://en.esotericsoftware.com/spine-phaser · https://www.npmjs.com/package/@esotericsoftware/spine-phaser-v4
- Rex plugins: https://www.npmjs.com/package/phaser4-rex-plugins · https://www.npmjs.com/package/phaser3-rex-plugins · https://rexrainbow.github.io/phaser3-rex-notes/docs/site/
- Raycaster: https://wiserim.github.io/phaser-raycaster/ · https://www.npmjs.com/package/phaser-raycaster
- Responsive layout: https://www.npmjs.com/package/@phaserjs/phaser-editor-layout
- phas3d (experimental 3D fork): https://github.com/phaserjs/phas3d
- Phaser 3 vs 4 article: https://phaser.io/news/2026/05/phaser-3-vs-phaser-4

## Refresh Procedure

1. `curl -s https://registry.npmjs.org/phaser | jq '."dist-tags", (.time | to_entries | .[-8:])'` for versions and dates.
2. Read the newest `changelog/v4/*` file(s) and `CHANGELOG.md` table in the repo; note new game objects, config options, and breaking changes.
3. Shallow-clone the repo (`git clone --depth 1 https://github.com/phaserjs/phaser`) into a temp dir and skim `skills/*/SKILL.md` for changed APIs; verify any signature you cite with `grep` in `src/`.
4. Re-check template `package.json` files for the Phaser and Vite versions they pin.
5. Update the snapshot line in `SKILL.md`, the description version, the README row, and this file.

## Uncertainties at capture

- Svelte: official `phaserjs/template-svelte` exists (SvelteKit 2, Svelte 5, `phaser@4.0.0`); the frameworks reference uses its mount/destroy pattern.
- Ecosystem: Box2D, `@phaserjs/phaser-editor-layout`, `phaser-hooks`, and `@geckos.io/phaser-on-nodejs` v4 compatibility is undocumented or only claimed in a README; rex plugins have a dedicated v4 package but each plugin was not run on v4. No npm packages were found for Phaser Launcher, Phaser Desktop, or beam/compression tools, nor official YouTube Playables or Facebook Instant Games templates.
- Next.js and Vue template internals were not read line by line; their `ssr: false` and `onMounted`/`onUnmounted` patterns are the standard approach but confirm in the template repos.
- `4.3.0` may be released after this snapshot and could add APIs not covered here.
- Behaviour of colliders on `TilemapGPULayer` was not verified at runtime.
- Plugin ecosystem (rex plugins, Spine, Matter helpers) v4 compatibility was not tested.
