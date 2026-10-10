# Ecosystem Packages and Companion Tools

Snapshot 2026-10-10 against `phaser@4.2.1`. Versions and dates come from the npm registry and package READMEs. "v4" means the package declares or documents Phaser 4 support. Where support is only inferred, it says so.

## Core and official distribution

| Package | Version (date) | Purpose | Phaser 4 |
| --- | --- | --- | --- |
| `phaser` | 4.2.1 (2026-07-09) | The engine. Subpackages do not exist; `Phaser.*` namespaces ship in one bundle. | yes |
| `@phaserjs/create-game` | 1.3.2 (2026-04-21) | Interactive scaffolder: frameworks, bundlers, demo games. | templates pin `4.0.0` |
| `@phaserjs/game-agent` | 1.0.0 (2026-07-01) | CLI that links your coding agent to the hosted Phaser Game Agent via MCP. | n/a (hosted service) |
| `@phaserjs/editor-mcp-server` | 1.0.6 (2025-09-09) | MCP server that drives a running Phaser Editor v5 app. | Editor v5 targets Phaser 4 |
| `@phaserjs/editor-scripts-*` (`base` 2.0.2 2026-05-11, `quick` 2.0.2, `core` 2.0.6, `arcade`, `audio`, `camera`, `random`, `timer`, `simple-animations`) | 2.0.x (2024-2026) | Script-node and user-component libraries for Phaser Editor projects. | `base`/`quick` updated 2026-05; others 2024, unverified |
| `@phaserjs/phaser-editor-layout` | 2.16.0 (2026-08-20) | Responsive layout scene plugin (`this.layout`): anchors, zones, safe areas, orientation variants. Works without the editor. | peer `phaser ^3.60`; README says it also runs on v4 (install with `--legacy-peer-deps`) |
| `@phaserjs/rapier-connector` | 1.0.2 (2024-08-20) | Rapier physics plugin for Phaser. | **stale, README says Phaser 3**; use Rapier directly (below) |
| `@phaserjs/phaser` | 0.2.2 (2021-09-23) | Abandoned early "Phaser 4" rewrite. | **do not use** |
| `phaser3-project-template`, `phaser3-typescript-project-template`, `phaser3spectorjs` | 2018-2022 | Old templates and Spector wrapper. | **stale** |
| `phaser-ce` | 2.20.2 (2025-03-04) | Phaser 2 Community Edition. | **different engine, unrelated to v3/v4** |

No official `@phaserjs/*` packages exist for tilemap, particles, UI, or audio add-ons; those are core features. There is also no official YouTube Playables or Facebook Instant Games package at snapshot; use plain Phaser with those platforms' SDKs.

### Official templates (GitHub `phaserjs/*`)

`template-vite`, `-vite-ts`, `-react`, `-react-ts`, `-vue`, `-vue-ts`, `-nextjs`, `-angular`, `-svelte` (SvelteKit 2, Svelte 5), `-solid`, `-remix`, `-bun`, `-webpack`, `-webpack-ts`, `-rollup(-ts)`, `-parcel(-ts)`, `-esbuild(-ts)`, `-importmap`, `-rapier`, `-tauri`, `discord-template`, `discord-multiplayer-template`. At capture, `-vite`, `-react`, `-vue`, `-nextjs`, `-angular`, `-svelte`, `-solid`, `-remix`, `-bun`, `-webpack`, `-rapier` pin `phaser@4.0.0`; `template-tauri` pins `^3.88.2`; `discord-template` client pins `^3.90.0` (Phaser 3). Several repo descriptions still say "Phaser 3" even where the code pins 4.0.0, so read `package.json`. Editor variants are `phaser-editor-template-*` (Editor v4/v5 starter projects).

## Physics add-ons

| Need | Choice |
| --- | --- |
| Normal game physics | Built-in Arcade or Matter (no extra package) |
| Fast, deterministic Rust engine, joints, many bodies | **Rapier** via `@dimforge/rapier2d-compat` (0.21.0, 2026-09-25), used directly |
| Box2D v3 feel (soft-step solver, CCD, capsules) | **`phaser-box2d`** 1.1.0 (2025-01-01), MIT, standalone ESM |
| Legacy Phaser plugin glue | `@phaserjs/rapier-connector` (stale), `phaser-matter-collision-plugin` 1.0.0 (2021, v3-era) |

### Rapier (official template `template-rapier`, `phaser@4.0.0` + `@dimforge/rapier2d-compat ^0.14`)

```sh
bun add @dimforge/rapier2d-compat
```

```ts
import RAPIER from '@dimforge/rapier2d-compat';

async create() {
  await RAPIER.init();
  const world = new RAPIER.World({ x: 0, y: 9.81 }); // y down; units are meters, PPM = your pixels-per-meter constant
  const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(4, 1));
  world.createCollider(RAPIER.ColliderDesc.cuboid(0.5, 0.5), body);
  this.events.on(Phaser.Scenes.Events.UPDATE, () => {
    world.step();
    const p = body.translation();
    sprite.setPosition(p.x * PPM, p.y * PPM).setRotation(body.rotation());
  });
}
```

The template (and the old connector) follow this shape: init WASM once (`await`), step the world each frame, copy transforms to sprites, enable a debug renderer. Pin a Rapier version; 0.14 in the template, 0.21 is current on npm.

### Phaser Box2D

```sh
bun add phaser-box2d
```

```js
import { CreateWorld, WorldStep, b2DefaultWorldDef, b2Vec2 } from 'phaser-box2d';

const worldDef = b2DefaultWorldDef();
worldDef.gravity = new b2Vec2(0, -10);          // Box2D y-up; flip when syncing to screen
const world = CreateWorld({ worldDef });
// each frame (fixed 1/60 default, 4 substeps)
WorldStep({ worldId: world.worldId, deltaTime });
```

- Standalone: no Phaser dependency, runs client or server, under 70 KB min+gz.
- Docs and the 50+ example pack need a free Phaser account (`phaser.io/box2d`, `phaser.io/account/downloads#box2d`); the docs and examples are marked not for commercial redistribution. The code is MIT.
- Its Vite template pins `phaser ^3.87`. Phaser 4 compatibility is **not documented**; since the engine is standalone only the optional Phaser helper functions are at risk. Test before committing.

## Spine (official runtime)

| Package | Version (date) | Phaser |
| --- | --- | --- |
| `@esotericsoftware/spine-phaser-v4` | 4.3.13 (2026-07-24); tag `v4.2-latest` 4.2.120 | requires **Phaser >= 4.2.1** from runtime 4.3.11; earlier v4 runtimes need >= 4.1.0 |
| `@esotericsoftware/spine-phaser-v3` | 4.3.13 (2026-07-24) | Phaser 3 (`^3.60`) |
| `@esotericsoftware/spine-phaser` | 4.1.56 (2026-04-01) | legacy name, Phaser 3 only |
| `phaser3-spine` | 1.0.0 (2020) | **dead** |

The bundled Phaser 3 Spine plugins are not in Phaser 4. Match the runtime `major.minor` to your Spine Editor export version. Spine is commercial; check the Spine license for your project.

```sh
bun add phaser@^4.2.1 @esotericsoftware/spine-phaser-v4@~4.3.0
```

```ts
import { SpinePlugin } from '@esotericsoftware/spine-phaser-v4';

new Phaser.Game({
  // ...
  plugins: { scene: [{ key: 'spine.SpinePlugin', plugin: SpinePlugin, mapping: 'spine' }] },
});

preload() {
  this.load.spineSkeleton('hero-data', 'hero.skel');   // .json or binary .skel (format from extension, or { format: 'binary' })
  this.load.spineAtlas('hero-atlas', 'hero.atlas');
}
create() {
  const hero = this.add.spine(400, 500, 'hero-data', 'hero-atlas');
  hero.animationState.setAnimation(0, 'walk', true);
  // this.make.spine({ x, y, dataKey, atlasKey }) then this.add.existing(obj) for deferred add
}
```

Prefer `.skel` binary. Script-tag builds expose `spine.SpinePlugin` (`dist/iife/spine-phaser-v4.js`).

## Community add-ons

| Package | Version (date) | What | Phaser 4 |
| --- | --- | --- | --- |
| `phaser4-rex-plugins` | 4.2.0 (2026-07-01); built against `phaser ^4.2.0` | rexrainbow's plugin collection (rexUI, gestures, board, behaviours, text, input, shaders, ...) | **yes, dedicated v4 package**; same file layout as v3 package (`templates/ui/ui-plugin.js`, `dist/rexuiplugin.min.js`). Plugins that relied on removed v3 pipelines/FX may differ; test each. |
| `phaser3-rex-plugins` | 1.80.20 (2026-03-31) | Same collection for Phaser 3 (dev dep `phaser 3.85.2`) | **v3 only**; use the v4 package on v4 projects |
| `phaser-raycaster` | 0.11.1 (2026-07-18) | Raycasting, visibility/cone, works with Arcade and Matter | **yes** ("Phaser 3 and 4") |
| `phaser-hooks` | 0.7.2 (2026-02-11) | React-style state hooks over registry/data | README says Phaser 3; peer `*`; unverified on v4 |
| `@geckos.io/phaser-on-nodejs` | 1.3.1 (2025-06-24) | Run Phaser 3 headless on Node for authoritative servers | Phaser 3 wording; v4 unverified |
| `phaser-navmesh` | 2.3.1 (2021) | Navmesh pathfinding | **stale**, v3 `^3.55` |
| `phaser-matter-collision-plugin` | 1.0.0 (2021) | Matter collision helpers | **stale**, v3 |
| `phaser-animated-tiles` | 2.0.2 (2018) | Tiled animated tiles | **obsolete**; Tiled tile animation is core in v4 |
| `phaser3-nineslice` | 0.5.0 (2019) | 9-slice | **obsolete**; core `add.nineslice` exists |
| `easystarjs` | 0.4.4 (2020) | Engine-agnostic A* grid pathfinding | works (no Phaser dependency), but unmaintained |
| `phas3d` (GitHub `phaserjs/phas3d`) | not on npm | Experimental Phaser 4 fork with a 3D pipeline | **experimental, "must not be used in production"**; build from source |

### rexUI on Phaser 4

```sh
bun add phaser4-rex-plugins
```

```ts
import RexUIPlugin from 'phaser4-rex-plugins/templates/ui/ui-plugin.js';

new Phaser.Game({
  plugins: { scene: [{ key: 'rexUI', plugin: RexUIPlugin, mapping: 'rexUI' }] },
  scene: [Main],
});

// in a scene
const label = this.rexUI.add.label({ background: this.rexUI.add.roundRectangle(0, 0, 0, 0, 12, 0x333333), text: this.add.text(0, 0, 'Play'), space: { left: 12, right: 12, top: 8, bottom: 8 } }).setPosition(400, 300).layout();
```

The import path form mirrors the v3 package and the file exists in the 4.2.0 tarball; individual plugin behaviour on v4 is not verified here. Docs: https://rexrainbow.github.io/phaser3-rex-notes/docs/site/ (written for Phaser 3; v4 differences follow the migration reference).

### phaser-raycaster

```sh
bun add phaser-raycaster
```

```ts
import PhaserRaycaster from 'phaser-raycaster';

new Phaser.Game({
  plugins: { scene: [{ key: 'PhaserRaycaster', plugin: PhaserRaycaster, mapping: 'raycasterPlugin' }] },
});
// scene: this.raycaster = this.raycasterPlugin.createRaycaster(); const ray = this.raycaster.createRay({ origin: { x, y } });
```

## Tooling and hosted services

- **Phaser Editor v5** (desktop IDE, subscription; plans start at $12/month per phaser.io). Publishes plain Phaser code; v5 targets Phaser 4 with Filters and keeps Phaser 3 support. Pair with `@phaserjs/editor-mcp-server` (needs the editor running) in an MCP host:

  ```json
  { "mcpServers": { "phaser-editor": { "command": "bunx", "args": ["@phaserjs/editor-mcp-server"] } } }
  ```

  The README documents `npx`; `bunx` is the equivalent runner.
- **Phaser Game Agent** (`@phaserjs/game-agent`): `bunx @phaserjs/game-agent` detects installed coding-agent CLIs (Claude Code, VS Code, Codex, Cursor, Gemini CLI, Antigravity, Windsurf, Qoder), signs you in via a browser, and writes their MCP config. It uses a Phaser account, a private cloud workspace, and credits. Only run it when the user wants that account link; it edits client MCP config files. Subcommands: `login`, `setup`, `manual` (prints config), `status`, `logout`.
- **Phaser Launcher / Phaser Desktop / beam and compression tools**: no npm package found. phaser.io lists some products (Phaser Agent MCP, Phaser Desktop) without technical detail; treat them as unverified.
- **Debugging**: Spector.js (browser extension) for WebGL draw calls; `phaser3spectorjs` is stale.
- **Texture packing**: free-tex-packer, TexturePacker, Aseprite (`load.aseprite`), PCT atlases (`load.atlasPCT`; phaser.io/tools packer announced in the 4.0.0 changelog). Tiled for maps.

## Decision table

| If you want | Use |
| --- | --- |
| New project quickly | `bun create @phaserjs/game@latest`, then bump `phaser` to `^4.2` |
| Skeletal animation | `@esotericsoftware/spine-phaser-v4` (Phaser >= 4.2.1) |
| Rich UI widgets, drag/gesture behaviours | `phaser4-rex-plugins` (never mix with `phaser3-rex-plugins`) |
| Raycast / line of sight | `phaser-raycaster` |
| Joints and heavy rigid-body sims | Rapier directly, or Matter; Box2D if you accept unverified v4 status |
| Responsive anchoring and safe areas | `@phaserjs/phaser-editor-layout` (v4 via `--legacy-peer-deps`) or Scale Manager plus your own layout |
| Visual scene authoring | Phaser Editor v5 |
| Agent assistance | `@phaserjs/game-agent` (hosted) or `@phaserjs/editor-mcp-server` (local editor) |
| 3D | Use Three.js alongside Phaser, not `phas3d` in production |

## Rules for adding packages

1. Check `peerDependencies`/README for Phaser 4 before installing; v3 plugins that use `Pipeline`, `preFX`/`postFX`, `BitmapMask`, `Mesh`, `Plane`, or `Geom.Point` need rewrites or replacements.
2. Install v4-specific variants where they exist (`-v4`, `phaser4-*`), and never both v3 and v4 variants.
3. Register plugins in `plugins.scene` or `plugins.global` in game config, with the documented mapping name.
4. Pin versions; many companion packages track Phaser minor versions closely (Spine requires >= 4.2.1 from 4.3.11).
5. Re-verify against the npm registry and READMEs when refreshing (see [source-map.md](source-map.md)).
