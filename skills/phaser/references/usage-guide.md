# Usage Guide

Day-to-day Phaser 4.2 workflow. Sibling references hold depth.

## 1. Install and scaffold

```sh
# Official scaffolder (interactive: pick framework, bundler, TS or JS)
bun create @phaserjs/game@latest

# Or add to an existing project
bun add phaser
```

- Official templates (`phaserjs/template-vite`, `-vite-ts`, `-react`, `-react-ts`, `-vue`, `-vue-ts`, `-nextjs`, `-angular`) pin `phaser@4.0.0` at snapshot time. Bump to `phaser@^4.2` after scaffolding.
- Their `dev`/`build` scripts call `node log.js` (anonymous usage ping). Use the `dev-nolog` / `build-nolog` scripts, or delete `log.js`, if telemetry is not wanted.
- CDN (no bundler): `https://cdn.jsdelivr.net/npm/phaser@4.2.1/dist/phaser.min.js` exposes global `Phaser`.
- ESM import: `import Phaser from 'phaser'` or named `import { Game, Scene, AUTO } from 'phaser'`. The package ships `dist/phaser.esm.js` (import) and `dist/phaser.js` (require/browser), plus `types/phaser.d.ts`.

## 2. Minimal game

```ts
import { Game, Scene, AUTO, Scale } from 'phaser';

class Main extends Scene {
  constructor() { super('Main'); }
  preload() { this.load.image('logo', 'assets/logo.png'); }
  create() { this.add.image(512, 384, 'logo'); }
  update(time: number, delta: number) {}
}

new Game({
  type: AUTO,
  width: 1024,
  height: 768,
  parent: 'game-container',
  backgroundColor: '#1a1a2e',
  scale: { mode: Scale.FIT, autoCenter: Scale.CENTER_BOTH },
  scene: [Main],
});
```

Defaults: size 1024x768, `type: AUTO`, scale mode `NONE`, `roundPixels: false`, `batchSize: 16384`, `maxLights: 10`.

## 3. Game config essentials

| Option | Notes |
| --- | --- |
| `type` | `Phaser.AUTO` (WebGL, Canvas fallback), `CANVAS`, `WEBGL` (no fallback), `HEADLESS` (tests) |
| `width` / `height` / `scale.*` | `scale` object wins over top-level values |
| `parent` | element or id; `undefined` appends to body, `null` leaves detached |
| `pixelArt: true` | sets `antialias: false` and `roundPixels: true` |
| `smoothPixelArt: true` | WebGL only; blocky pixels with smoothed edges when scaled |
| `transparent: true` | transparent canvas over HTML |
| `physics` | `{ default: 'arcade', arcade: { gravity: { y: 300 }, debug: false } }` or `matter` |
| `fps` | `{ target: 60, limit: 0, smoothStep: true }`; `Timestep#setFPSLimit` changes limit at runtime (4.2) |
| `input` | toggle `keyboard`, `mouse`, `touch`, `gamepad`; `activePointers` |
| `render` | `antialias`, `powerPreference`, `batchSize`, `maxTextures`, `maxLights`, `selfShadow`, `pathDetailThreshold`, `mipmapFilter`, `stencil`, `alphaStrategy`, `renderNodes` |
| `callbacks` | `preBoot(game)`, `postBoot(game)` |
| `banner: false` | hide console banner |
| `disableContextMenu` | block right-click menu |

Only the first scene in `scene: [...]` starts automatically. Others start with `{ active: true }` in their scene config or via `scene.start`/`launch`.

## 4. Scale manager

```ts
scale: {
  mode: Phaser.Scale.FIT,               // letterbox, keep ratio
  autoCenter: Phaser.Scale.CENTER_BOTH,
  width: 1280, height: 720,
  min: { width: 640, height: 360 },
  max: { width: 1920, height: 1080 },
}
```

Modes: `NONE`, `WIDTH_CONTROLS_HEIGHT`, `HEIGHT_CONTROLS_WIDTH`, `FIT`, `ENVELOP`, `RESIZE` (canvas fills parent, no ratio), `EXPAND`.

- Give the parent real CSS size; no padding on the parent; do not style the canvas width/height.
- `scale.resize()` only in `NONE`; use `scale.setGameSize()` in FIT/ENVELOP.
- Fullscreen: `this.scale.toggleFullscreen()` from a `pointerup` handler (not `pointerdown`). Iframes need `allowfullscreen`.
- Listen: `this.scale.on('resize', (gameSize) => {...})` and reposition UI.
- Use world units from `this.scale.width/height` or `this.cameras.main.width/height` instead of literals when layouts must adapt.

## 5. Scene skeleton with cleanup

```ts
export class Play extends Phaser.Scene {
  private score = 0;
  constructor() { super('Play'); }

  init(data: { level?: number }) {      // runs on every start/restart
    this.score = 0;
    this.registry.set('level', data.level ?? 1);
  }

  create() {
    const onResize = () => this.layout();
    this.scale.on('resize', onResize);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.scale.off('resize', onResize);
    });
  }
}
```

## 6. Loading assets

```ts
preload() {
  this.load.setPath('assets/');                       // trailing slash added
  this.load.image('bg', 'bg.png');
  this.load.spritesheet('hero', 'hero.png', { frameWidth: 32, frameHeight: 48 });
  this.load.atlas('ui', 'ui.png', 'ui.json');         // named frames
  this.load.audio('bgm', ['bgm.ogg', 'bgm.mp3']);     // format fallbacks
  this.load.tilemapTiledJSON('map', 'level1.json');
  this.load.bitmapFont('pixel', 'pixel.png', 'pixel.xml');
  this.load.font("Orbitron", "Orbitron.ttf");         // web font via FontFace API, then fontFamily: "Orbitron"
  this.load.pack('main', 'pack.json');                // asset pack manifest
  this.load.on('progress', (p: number) => bar.setScale(p, 1));
}
```

Atlas options in v4: JSON array/hash, Unity, multi-atlas, and the new **PCT** (Phaser Compact Texture) via `this.load.atlasPCT(key, url)` (90-95% smaller descriptors).

## 7. Game objects

```ts
const img = this.add.image(x, y, 'bg').setOrigin(0.5).setScale(2).setDepth(10);
const spr = this.add.sprite(x, y, 'hero', 0);
const txt = this.add.text(16, 16, 'Score: 0', { fontFamily: 'Arial', fontSize: '24px', color: '#fff' });
const bmp = this.add.bitmapText(16, 48, 'pixel', 'HP 100', 16);
const gfx = this.add.graphics().fillStyle(0xff0000, 1).fillRect(0, 0, 64, 64);
const tile = this.add.tileSprite(512, 384, 1024, 768, 'bg');
const nine = this.add.nineslice(400, 300, 'panel', undefined, 200, 80, 16, 16, 16, 16);
const rect = this.add.rectangle(100, 100, 80, 40, 0x00ff00);
```

Transform: origin defaults to center for Image/Sprite, top-left for Text. `setDepth` orders within a scene. Container origin is fixed at 0,0.

## 8. Animations

```ts
this.anims.create({
  key: 'run',
  frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 7 }),
  frameRate: 12,
  repeat: -1,
});
hero.play('run');                 // play(key, true) skips if already playing
hero.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'attack', () => {});
```

Animations are global; create each key once (a Boot or Preloader scene). `repeat: -1` never fires complete.

## 9. Tweens, timeline, timers

```ts
this.tweens.add({ targets: spr, x: 600, y: '-=40', duration: 800, ease: 'Sine.easeInOut', yoyo: true, repeat: 2 });
this.tweens.chain({ targets: spr, tweens: [{ x: 200, duration: 300 }, { alpha: 0, duration: 200 }] });

const tl = this.add.timeline([
  { at: 0, run: () => title.setAlpha(1) },
  { at: 1000, tween: { targets: title, y: 100, duration: 500 } },
]);
tl.play();                         // timelines start paused

this.time.delayedCall(2000, () => this.scene.start('GameOver'));
this.time.addEvent({ delay: 500, loop: true, callback: this.spawn, callbackScope: this });
```

Tweens auto-destroy on completion (`persist: true` keeps them). `loop: -1` never completes; use `completeAfterLoop()`.

## 10. Input

```ts
const cursors = this.input.keyboard!.createCursorKeys();
this.input.keyboard!.on('keydown-SPACE', () => fire());
this.input.on('pointerdown', (p: Phaser.Input.Pointer) => console.log(p.worldX, p.worldY));
sprite.setInteractive({ useHandCursor: true }).on('pointerup', () => start());
this.input.setDraggable(sprite.setInteractive());
this.input.on('drag', (_p, obj, x, y) => obj.setPosition(x, y));
this.input.addPointer(2);          // extra touch pointers (max 10 total)
```

Poll in `update`: `cursors.left.isDown`, `Phaser.Input.Keyboard.JustDown(key)`. Gamepad: enable `input: { gamepad: true }` and use `this.input.gamepad`. Containers need `setSize()` before `setInteractive()`. Use `pointer.worldX/worldY` (camera-aware) for world picking.

## 11. Cameras

```ts
const cam = this.cameras.main;
cam.setBounds(0, 0, mapW, mapH).startFollow(player, true, 0.1, 0.1).setZoom(1.5);
cam.shake(200, 0.01); cam.flash(250); cam.fadeOut(400, 0, 0, 0);
cam.once('camerafadeoutcomplete', () => this.scene.start('Next'));
const ui = this.cameras.add(0, 0, 1024, 80);      // extra camera
hud.setScrollFactor(0);                            // pin object to screen
```

Run HUD in a parallel scene (`this.scene.launch('UI')`) when its camera should not zoom or scroll.

## 12. Sound

```ts
this.sound.play('click');                           // fire and forget
const bgm = this.sound.add('bgm', { loop: true, volume: 0.5 });
if (this.sound.locked) this.sound.once('unlocked', () => bgm.play()); else bgm.play();
this.sound.setMute(true);
```

One sound manager per game, shared across scenes; looping sounds keep playing across scene changes until stopped. Supply OGG plus MP3 (or M4A for Safari). HTML5 audio needs `instances` for overlap.

## 13. Data and events

```ts
this.registry.set('hp', 100);                       // global DataManager
this.registry.events.on('changedata-hp', (_parent, value) => hud.setText(String(value)));
sprite.setData('hp', 3); sprite.data.inc('hp', -1);
this.events.emit('score', 10);                       // scene emitter
this.game.events.on(Phaser.Core.Events.BLUR, () => this.scene.pause());
```

Use named constants (`Phaser.Scenes.Events.SHUTDOWN`, `Phaser.Input.Events.POINTER_DOWN`). Remove listeners you add on shared emitters (`registry`, `game.events`, `sound`).

## 14. Dev, build, ship

```sh
bun run dev                 # Vite dev server (template default port 8080)
bun run build               # dist/ with hashed assets
bunx vite preview           # smoke the build
```

- Use relative `base: './'` for itch.io, GitHub Pages sub-paths, or embedded webviews.
- Phaser is large (`phaser.min.js` is about 1.4 MB before compression); split it into its own chunk and let the CDN cache it. See [frameworks-typescript.md](frameworks-typescript.md).
- Serve assets with gzip or brotli. Prefer atlases, compressed audio, and PCT atlases.
- Test on a real phone: touch, orientation, audio unlock, safe-area insets, and performance.
