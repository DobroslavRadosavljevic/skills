---
name: phaser
description: "Build, review, debug, migrate, or plan Phaser 4 HTML5 2D games (phaser 4.2.x, WebGL render nodes and Filters). Use for Phaser.Game and GameConfig, scale manager (FIT, RESIZE, pixelArt), Scene lifecycle (init, preload, create, update), loader and asset packs, sprites, images, text, BitmapText, containers, groups, TileSprite, Graphics, animations, tweens, timelines, input (pointer, keyboard, gamepad), cameras, Arcade and Matter physics, Tiled tilemaps, TilemapGPULayer, SpriteGPULayer, particles, sound, DataManager and events, filters (internal and external, masks, glow, blur), lighting, Mesh2D, Stencil, RenderTexture, EventBus bridges for React, Vue, Svelte, or Next.js, Vite and TypeScript setup, pooling, memory and mobile performance, companion packages (@phaserjs/create-game, @esotericsoftware/spine-phaser-v4, phaser4-rex-plugins, rexUI, phaser-raycaster, phaser-box2d, Rapier, @phaserjs/game-agent, Phaser Editor, editor-mcp-server), and Phaser 3 to Phaser 4 migration (pipelines, preFX, postFX, BitmapMask, setTintFill, Point, Math.TAU, DynamicTexture render)."
---

# Phaser

Use this skill for any work on a Phaser game: scaffolding, scenes, assets, game objects, physics, tilemaps, rendering effects, framework embedding, performance, or a Phaser 3 to 4 upgrade.

Snapshot: `phaser@4.2.1` (npm `latest`, 2026-07-09). `4.3.0` is in the repo changelog but not on npm yet. Phaser 4.0.0 shipped 2026-04-10. Phaser 3 is frozen at `3.90.0` (2025-05-23). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the project first:
   - `phaser` version in `package.json` (4.x or 3.x). Treat 3.x code and tutorials as a different API surface.
   - Bundler (Vite is the official template default), TypeScript, framework wrapper, `Phaser.Game` config, scene list, physics choice, asset folder.
2. For everyday work follow [usage-guide.md](references/usage-guide.md): install, config, scene skeleton, assets, input, cameras, tweens, sound, run and build.
3. Route deeper detail:
   - Scenes, loader, packs, sprites, text, groups, animations, tweens, timeline, input, data, events: [scenes-loader-objects.md](references/scenes-loader-objects.md).
   - Arcade, Matter, Tiled tilemaps, GPU layers: [physics-tilemaps.md](references/physics-tilemaps.md).
   - Filters, lighting, masks, shaders, render nodes, RenderTexture, performance, memory, mobile: [rendering-fx-performance.md](references/rendering-fx-performance.md).
   - Vite, TypeScript, React, Vue, Svelte, Next.js, EventBus, cleanup: [frameworks-typescript.md](references/frameworks-typescript.md).
   - Phaser 3 to 4 breaking changes and checklist: [migration-v4.md](references/migration-v4.md).
   - Companion packages (Spine, rex plugins, Box2D, Rapier, raycaster, create-game, Editor, Game Agent MCP), v4 support status, stale packages: [ecosystem-packages.md](references/ecosystem-packages.md).
   - Official URLs, refresh procedure, uncertainties: [source-map.md](references/source-map.md).
4. Verify with the project build (`bun run build`) and a real browser run. Phaser games cannot be proven correct by types alone.

## Decision Rules

- Default to **Phaser 4**, WebGL (`Phaser.AUTO` falls back to Canvas). Canvas is deprecated in v4 and has no filters, lighting, or GPU layers.
- Pick **Arcade** for AABB and circle bodies, platformers, shooters, and overlap triggers. Pick **Matter** only for polygons, joints, stacking, or realistic rotation. Do not mix them in one scene without a reason.
- Pick **BitmapText** for text that changes often (scores, timers). `Text` re-uploads a canvas texture on every change.
- Pick **Group** to pool and run batch operations. Pick **Container** only for transform groups; each child costs extra matrix math. A **Layer** orders and filters without a transform.
- Pick **Filters** (`enableFilters()`, `filters.internal` / `filters.external`) for glow, blur, masks, color grading. Prefer internal filters; external ones run at full screen size.
- Use **TilemapGPULayer** or **SpriteGPULayer** for very large static maps or sprite fields; accept their limits (one texture or tileset, orthographic, manual data refresh).
- Keep game state in a scene `init()`, the registry (`this.registry`), or a plain module. Do not rely on the scene constructor for state that must reset on restart.
- Add a plugin or companion package only after checking its Phaser 4 status in [ecosystem-packages.md](references/ecosystem-packages.md); use `-v4` / `phaser4-*` variants and avoid v3-only add-ons.
- Bridge to React, Vue, Svelte, or Next.js with a small `EventEmitter` and destroy the game on unmount. Keep UI in the framework and play-field code in scenes.

## Pitfalls

- Scene ops (`start`, `launch`, `stop`, `switch`) are queued and run on the next step. `start()` stops the calling scene; use `launch()` or `run()` to keep it.
- Listeners added with `on()` in `create()` pile up across `scene.restart()`. Use `once`, or remove them on `shutdown`.
- `Text` needs the font loaded first: use `this.load.font(key, url)` (FontFace API) or CSS `@font-face` and wait for it. Quote names with digits or spaces.
- Static Arcade bodies need `refreshBody()` after moving or scaling. `setCollision()` must run before tile colliders work. Collision events need `onCollide` / `onOverlap` set on the body.
- Tween `loop: -1` or animation `repeat: -1` never fires its complete event. Timelines start paused. `repeat: 4` means five runs.
- Duplicate loader keys are ignored silently. Calling `load` outside `preload` needs `this.load.start()`.
- Browsers lock audio until a user gesture. Phaser unlocks it; do not autoplay in `create()` without checking `sound.locked`.
- v4 only: no `Pipeline`, `preFX`/`postFX`, `BitmapMask`, `setTintFill`, `Geom.Point`, `Struct.Set`/`Map`. `Math.TAU` is now `2 * PI`. `DynamicTexture`/`RenderTexture` need `render()`. `roundPixels` defaults to `false`. See [migration-v4.md](references/migration-v4.md).
- Never call raw WebGL (`gl.*`) in v4. Use an `Extern` game object when you must.
- Do not set `debug: true` on physics in release builds. Do not style the canvas with CSS that fights the ScaleManager.
- Destroy what you create: `game.destroy(true)` on framework unmount, `destroy()` on game objects, `textures.remove()` and `cache.*.remove()` for assets no longer needed.

## Verification

- `bun run build` (or project script) succeeds; `bunx tsc --noEmit` when TypeScript is used.
- Run the game in a browser: no console errors, assets load (check the network tab for 404 keys), input works on touch and keyboard.
- After scene changes: restart the scene twice and confirm listeners, timers, and sounds do not duplicate.
- After physics changes: toggle debug rendering once, then turn it off.
- After a v3 to v4 upgrade: scan for removed APIs listed in the migration reference and re-test filters, masks, tint, and render textures.

Report which checks ran, which did not, and the Phaser version assumed.
