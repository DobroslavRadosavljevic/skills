# Scenes, Loader, Game Objects, Animation, Input

Verified against Phaser 4.2.1 source and the bundled upstream skill docs.

## Scene lifecycle and states

Order: `constructor` (once) -> `init(data)` -> `preload()` -> loader runs -> `create(data)` -> `update(time, delta)` loop.

| State | Updates | Renders |
| --- | --- | --- |
| RUNNING | yes | yes |
| PAUSED | no | yes |
| SLEEPING | no | no (state kept) |
| SHUTDOWN | no | no (can restart) |
| DESTROYED | gone | gone |

Without `preload`, flow is `init -> create -> update`. `update` does not run during preload. The `create` event fires after `create()` returns.

### Scene operations (all queued to the next step)

```ts
this.scene.start('Level', { level: 2 });  // stops this scene, starts target
this.scene.restart({ level: 1 });         // same scene, re-runs init/create
this.scene.launch('UI', { lives: 3 });    // parallel, keeps this scene running
this.scene.run('UI');                      // start, or resume/wake if paused/sleeping
this.scene.switch('Pause');                // sleep this, start/wake target
this.scene.pause(); this.scene.resume(); this.scene.sleep(); this.scene.wake('Other');
this.scene.stop('UI');
this.scene.bringToTop('UI'); this.scene.moveAbove('Game', 'UI');
this.scene.transition({ target: 'Next', duration: 800, onUpdate: (p) => {} });
```

- Data given to `start/launch/restart/run/wake` reaches `init(data)` and `create(data)`; read later with `this.sys.getData()`.
- Scenes update top-down (top scene gets input first) and render bottom-up. Array order in the config sets layering.
- Scene config accepts per-scene `physics`, `loader`, `pack` (assets before preload), `plugins` (restrict injected systems), `active`, `visible`, `map`.
- `shutdown` fires on stop/restart; `destroy` once on removal. Clear arrays of game objects and external listeners on `shutdown`.
- Never overwrite `this.sys`.

### Scene communication

1. Data arguments (parent to child).
2. `this.registry` (global DataManager, `changedata-<key>` events).
3. `this.scene.get('Key').events` emitters (UI listens to game).
4. A shared module-level `EventEmitter` (framework bridge; see frameworks reference).

### Injected systems

`this.add`, `this.make` (create without adding), `this.load`, `this.input`, `this.cameras`, `this.tweens`, `this.time`, `this.anims` (global), `this.cache` (global), `this.textures` (global), `this.sound` (global), `this.registry` (global), `this.data`, `this.events`, `this.scale`, `this.lights`, `this.physics`, `this.matter`, `this.children` (display list), `this.scene`, `this.game`, `this.renderer`, `this.plugins`.

## Loader

```ts
this.load.setPath('assets/');     // or this.load.setBaseURL(...)
this.load.setPrefix('MENU.');     // keys become 'MENU.bg'
this.load.setCORS('anonymous');   // cross-origin textures for WebGL
```

File types (selected): `image`, `spritesheet`, `atlas`, `atlasXML`, `multiatlas`, `unityAtlas`, `atlasPCT`, `aseprite`, `animation`, `audio`, `audioSprite`, `video`, `svg`, `json`, `xml`, `text`, `binary`, `glsl`, `font`, `bitmapFont`, `tilemapTiledJSON`, `tilemapCSV`, `tilemapImpact`, `html`, `htmlTexture`, `css`, `script`, `plugin`, `scenePlugin`, `pack`, `texture` (compressed).

Rules:
- Keys are unique per type; duplicates are ignored silently. `textures.remove(key)` first to replace.
- `spritesheet` = fixed grid by index. `atlas` = packed named frames.
- Loading outside `preload()` needs `this.load.start()`.
- `maxRetries` (default 2) applies per file at creation.
- Events: `progress`, `fileprogress`, `filecomplete`, `filecomplete-<type>-<key>`, `loaderror`, `complete`.
- Asset pack JSON groups files by section with `prefix`, `path`, `defaultType`, `files`. Load with `this.load.pack(key, urlOrObject)`.
- Mid-load chaining: on `filecomplete-json-level1`, call more `this.load` methods.
- Memory: `this.textures.remove(key)`, `this.cache.json.remove(key)`, `this.cache.audio.remove(key)`.
- Compressed textures (KTX2/PVR/etc.) must be Y-flipped for v4 (GL orientation).

Typical Preloader pattern: Boot scene loads a small logo and bar via `pack`, Preloader shows a progress bar, Preloader `create` registers global animations then starts the menu.

## Game objects

| Object | Notes |
| --- | --- |
| `Image` | Static texture, no animation. Cheapest textured object. |
| `Sprite` | Image plus animation state (`sprite.anims`). |
| `Text` | Canvas-rendered. Re-creates texture on change. Origin top-left. `align` affects multi-line only. `setRTL` before `setText`. Batch style edits then `updateText()`. Non-zero `letterSpacing` is slow. |
| `BitmapText` | Atlas-based, cheap updates. `setMaxWidth` wraps on whitespace only. `setDropShadow`/`setCharacterTint` WebGL only. `DynamicBitmapText` is slower. |
| `Graphics` | Vector commands. `pathDetailThreshold` merges close vertices. Re-issuing every frame is costly; render once to a texture when static. |
| `Shape` (`rectangle`, `circle`, `ellipse`, `triangle`, `star`, `polygon`, `line`, `arc`, `grid`, `curve`, `isotriangle`) | `Grid` uses stroke (not outline) in v4. `Rectangle` supports rounded corners. |
| `TileSprite` | Repeating texture or atlas frame; `tilePositionX/Y`, `tileRotation` (v4). No cropping in v4. |
| `NineSlice` | `this.add.nineslice(x, y, key, frame, w, h, left, right, top, bottom)`; 3-slice if top/bottom 0. |
| `Container` | Transform group; origin 0,0; costs matrix math per child; needs `setSize` for input; physics on children is fragile. |
| `Layer` | Display-list grouping with own depth and (v4.1+) real GameObject so filters work. Cannot sit inside a Container. |
| `Group` | Not on the display list. Pooling and batch ops. `create()` adds to scene; `add()` does not unless `true` passed. |
| `Zone` | Invisible hit area / trigger. |
| `Video`, `DOMElement`, `Extern` | Video texture, DOM overlay (needs `dom: { createContainer: true }` and a container), raw-GL escape hatch. |
| `Blitter` | Many cheap sprites ("Bobs"). Legacy; prefer Group or SpriteGPULayer. |
| `Gradient`, `Noise*`, `CaptureFrame`, `Stamp` | v4 shader-backed objects (WebGL). |
| `SpriteGPULayer`, `TilemapGPULayer` | v4 mass-render layers. |
| `Mesh2D` (4.2) | Textured triangle mesh, batches with sprites. Replaces removed `Mesh`/`Plane` for 2D use. |
| `Stencil`, `StencilReference`, `CustomContext` (4.2) | Persistent stencil masking and low-level draw context control. |
| `ParticleEmitter` | `this.add.particles(x, y, key, config)`. |

### Common components

Transform (`x y z scale rotation angle setOrigin`), Depth, Alpha, Visible, Flip, Tint (`setTint(color)` + `setTintMode(Phaser.TintModes.FILL)`; modes `MULTIPLY FILL ADD SCREEN OVERLAY HARD_LIGHT`, plus `MULTIPLY_TWO` in 4.2 and `MULTIPLY_ADD` landing in 4.3), BlendMode, ScrollFactor, Crop, Mask (Canvas only; WebGL uses Filter masks), Lighting (`setLighting(true)`), Filters (`enableFilters()`), Size, Origin, RenderNodes.

### Groups

```ts
const bullets = this.physics.add.group({ classType: Bullet, maxSize: 30, runChildUpdate: true });
const b = bullets.get(x, y) as Bullet | null;  // reuses an inactive member, creates up to maxSize
b?.fire();
bullets.killAndHide(b); // sets active=false, visible=false; stays in the group
```

`get()` returns the first inactive member (creating if under `maxSize`), `getFirstDead` does not create. Group defaults apply only at creation.

### Containers vs groups

Move many objects together: Container. Pool/iterate/collide: Group. Z-order bucket or per-layer filter: Layer.

## Animations

```ts
this.anims.create({ key: 'walk', frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 5 }), frameRate: 10, repeat: -1 });
this.anims.create({ key: 'open', frames: this.anims.generateFrameNames('ui', { prefix: 'door_', start: 1, end: 6, zeroPad: 2 }), frameRate: 12 });
this.anims.createFromAseprite('boss');     // after load.aseprite
sprite.play({ key: 'walk', startFrame: 2 }).chain('idle');
sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE, (anim, frame) => {});
sprite.anims.pause(); sprite.anims.timeScale = 0.5;
this.anims.addMix('walk', 'run', 150);     // blend delay between two anims
```

- Global by default; per-sprite `sprite.anims.create` is local and overrides global.
- `frameRate` beats `duration` when both set. Per-frame `duration` adds on top.
- `play()` stops the current anim (fires `animationstop`). `play(key, true)` ignores if same key already playing.
- `generateFrameNumbers` end `-1` = last frame.
- `repeat: -1` never fires complete; `stop()` and listen to `animationstop`.

## Tweens

```ts
this.tweens.add({ targets: [a, b], alpha: { from: 0, to: 1 }, y: '+=20', duration: 400, delay: this.tweens.stagger(80), ease: 'Back.easeOut' });
this.tweens.addCounter({ from: 0, to: 100, duration: 1000, onUpdate: (t) => bar.width = t.getValue()! });
const chain = this.tweens.chain({ targets: spr, tweens: [{ x: 300, duration: 300 }, { y: 100, duration: 200 }] });
this.tweens.killTweensOf(spr);
```

- Value forms: absolute, `'+=n'`/`'-=n'`, `{ from, to }`, arrays (interpolate), functions `(target, key, value, i, total, tween)`.
- Props starting with `_` are ignored. Duration is clamped to >= 0.01 ms.
- `repeat` is per property; `loop` restarts whole tween; `yoyo`, `hold`, `repeatDelay`.
- `TweenManager.timeScale` multiplies `Tween.timeScale`.
- 4.2.1 fixed tweens with `startDelay` sticking in START_DELAY state.
- Kill tweens of an object before `destroy()` it; a tween completes early if its target `isDestroyed`.

## Timeline and timers

```ts
const tl = this.add.timeline([
  { at: 0, run: () => this.cameras.main.fadeIn(300) },
  { at: 1000, tween: { targets: title, y: 80, duration: 400 }, sound: 'whoosh' },
  { at: 2000, set: { alpha: 0 }, target: title, event: 'INTRO_DONE' },
]);
tl.on('INTRO_DONE', () => {}); tl.play();
```

- Timelines start paused. `from` offsets are relative to the previous event. `once` events are removed after firing. Scene pause pauses them; `timeScale` on the timeline does not scale child tweens.
- `this.time.addEvent({ delay, repeat, loop, callback, callbackScope, args })`. `repeat: 4` = 5 calls. `delay: 0` with repeat throws. Omitted `callbackScope` makes `this` the TimerEvent; use arrows.
- `this.time.delayedCall(ms, fn)`, `this.time.paused = true` freezes.

## Input detail

- `this.input.topOnly` (default true) limits events to the top object. Set false for stacked buttons.
- `setInteractive({ pixelPerfect: true, alphaTolerance: 1 })`, custom hit areas via `setInteractive(new Phaser.Geom.Circle(...), Phaser.Geom.Circle.Contains)`.
- Events on objects: `pointerdown/up/over/out/move`, `wheel`, `dragstart/drag/dragend/drop`. Scene-level: `this.input.on('gameobjectdown', (pointer, obj) => {})`.
- Keyboard: `this.input.keyboard.addKey('W')`, `addKeys('W,A,S,D')`, `createCursorKeys()`, `addCapture('SPACE')` to stop browser scroll, key combos via `createCombo`. Disable when a DOM `<input>` has focus: `this.input.keyboard.enableGlobalCapture()` / `disableGlobalCapture()`.
- Gamepad: `input: { gamepad: true }`; `this.input.gamepad.once('connected', pad => ...)`; `pad.leftStick`, `pad.A`. v4 `Button` accepts an `isPressed` init argument for scene transitions.
- Touch: default 2 pointers; `addPointer(n)` up to 10. Use `pointer.worldX/Y` with scrolled cameras.
- Pointer lock: `this.input.mouse.requestPointerLock()`.
- Disable context menu: `disableContextMenu: true` for right-click games.

## Events

`EventEmitter` from `Phaser.Events.EventEmitter` (eventemitter3). `on`, `once`, `off`, `emit`, `removeAllListeners`. Event constants live under `Phaser.<System>.Events`. Common leak: `on()` in `create()` of a restarted scene; use `once` or remove on `shutdown`. Sleeping scenes still receive global registry events.

## DataManager

`obj.setData('k', v)`, `getData`, `data.inc`, `data.toggle`, `data.has`, `data.each`, events `setdata`, `changedata`, `changedata-<key>`, `removedata`. `this.data` is per scene; `this.registry` is global; game objects have their own `data` manager created lazily.
