# Rendering, Filters, Lighting, Performance

## Renderer model (v4)

- WebGL is the default and the target. `Phaser.AUTO` uses WebGL and falls back to Canvas; Canvas is deprecated in v4 and lacks filters, lighting, GPU layers, Gradient/Noise, and most new objects.
- The v3 `Pipeline` system is gone. Rendering is a graph of **RenderNodes** (`run`, sometimes `batch`) owned by `renderer.renderNodes`: BatchHandlers (quad, tri, tile sprite, strip, point light), Submitters, Transformers, Texturers, Filter nodes, Fill/Stroke nodes.
- Custom nodes: register via game config `render: { renderNodes: { MyNode: MyNodeClass } }` or `renderer.renderNodes.addNodeConstructor('MyNode', Cls)`; attach with `gameObject.setRenderNodeRole('Submitter', 'MyNode', data)` (pass `null` to restore default).
- Never call raw `gl.*` in a v4 game: it desynchronises Phaser's `WebGLGlobalWrapper`. Use an `Extern` game object when you need direct GL (it resets state after).
- `GameObject#addRenderStep(fn)` injects code into a render; the Filters system itself uses render steps.

## Filters

Filters replace v3 preFX/postFX and masks. WebGL only.

```ts
sprite.enableFilters();                                   // objects need this; cameras have filters already
const glow = sprite.filters!.internal.addGlow(0x00ff88, 4, 0, 1); // color, outer, inner, scale, knockout, quality, distance
glow.outerStrength = 8; glow.setActive(false); sprite.filters!.internal.remove(glow);

const cam = this.cameras.main;
cam.filters.internal.addBlur(0, 2, 2, 1);                 // quality 0|1|2, x, y, strength, color, steps
cam.filters.external.addVignette(0.5, 0.5, 0.5, 0.5);     // x, y, radius, strength, color, blendMode
cam.filters.internal.addColorMatrix().colorMatrix.sepia(); // v4: methods live on .colorMatrix
```

- **Internal** filters run before the camera/object transform, in local space, and are sized to the object (cheaper; a blur rotates with the sprite). **External** filters run in screen space at context size (a horizontal blur stays horizontal).
- Order matters: each filter feeds the next. `filters.internal.list` can be reordered.
- Available adders on `FilterList`: `addBarrel`, `addBlend`, `addBlocky`, `addBlur`, `addBokeh`, `addColorMatrix`, `addCombineColorMatrix`, `addDisplacement`, `addGlow`, `addGradientMap`, `addImageLight`, `addKey`, `addMask`, `addNormalTools`, `addPanoramaBlur`, `addPixelate`, `addQuantize`, `addSampler`, `addShadow`, `addThreshold`, `addTiltShift`, `addVignette`, `addWipe`, `addParallelFilters`.
- Masks: `sprite.filters.internal.addMask(maskTextureKeyOrGameObject, invert, viewCamera)`. For a static mask object set `mask.autoUpdate = false` and `mask.needsUpdate = true` once; otherwise it redraws every frame.
- Bloom: no dedicated filter. Use `addParallelFilters()` (top path `addThreshold` + `addBlur`, blended ADD) or `Phaser.Actions.AddEffectBloom` / `AddEffectShine` / `AddMaskShape`.
- Glow `quality` and `distance` are fixed at creation; recreate to change.
- Expanding effects (blur, glow, shadow) auto-pad the buffer; override with `setPaddingOverride(l, t, r, b)` (`null` clears). On cameras use `getPaddingWrapper`. In 4.1+ controllers expose `getPaddingCeil()`.
- Reuse one controller on many objects by setting `ignoreDestroy = true` (you then own its lifecycle).
- `filtersForceComposite`, `renderFilters` toggle; `willRenderFilters()` checks activity.
- Each filtered object adds draw calls and framebuffers. Test early on target hardware, filter few large things rather than many small ones, prefer camera filters for whole-scene looks.
- Wipe transitions: `camera.filters.external.addWipe(0.1, 0, 0)` then tween `wipe.progress` 0 to 1.
- CaptureFrame (`this.add.captureFrame('key')`) snapshots the framebuffer at that display-list point; needs `camera.setForceComposite(true)` or a filter/framebuffer context.

## Lighting

```ts
this.lights.enable().setAmbientColor(0x222233);
const l = this.lights.addLight(400, 300, 220, 0xffddaa, 1.2, 40); // x, y, radius, rgb, intensity, z
const torch = this.lights.addConeLight(x, y, 300, 0xffffff, 1.5, rotation, innerAngle, outerAngle, z); // 4.2+
sprite.setLighting(true);                 // replaces setPipeline('Light2D')
sprite.setSelfShadow(true, 0.5, 1 / 3);   // enabled, penumbra, diffuseFlatThreshold
```

- Lighting is a property of many objects: Image, Sprite, Text, BitmapText, Graphics, Shape, TileSprite, Video, TilemapLayer, TilemapGPULayer, SpriteGPULayer, Particles, Stamp.
- Light `z` sets height explicitly; `maxLights` (default 10) is per camera. Game config `render.selfShadow` sets a default.
- Lit objects use a different shader and break batches; group lit and unlit objects.
- Normal maps: pass texture arrays (`load.image('hero', ['hero.png', 'hero_n.png'])`).

## Shaders and procedural objects

- `this.add.shader(config, x, y, w, h, textures?)` uses `ShaderQuadConfig` (v4). Shadertoy uniforms are no longer auto-set; `shader.setUniform(name, value)`. Load GLSL with `this.load.glsl(key, url)`; `#pragma` directives replace the v3 template syntax. Y=0 is the bottom of textures in GL orientation.
- `this.add.gradient(config, x, y, w, h)` for GPU gradients (bands, linear/radial). Call `gradient.ramp.encode()` after changing the ramp at runtime.
- `this.add.noise*(config, x, y, w, h)` for procedural noise (cell, simplex, white).
- `Mesh2D` (4.2) for textured triangles; call `buildOrderedIndices()` once when the topology is stable.
- `Stencil` / `StencilReference` (4.2) give persistent, universal masking that supports any pixel source; `CustomContext` exposes alpha strategy (`keep`, `dither`, `threshold`), scissor, color write mask.

## RenderTexture and DynamicTexture

```ts
const rt = this.add.renderTexture(0, 0, 512, 512);
rt.draw(sprite, 100, 100);       // buffers commands in v4
rt.render();                      // REQUIRED in v4 to execute them
const key = rt.saveTexture('snapshot');
```

- v4 buffers draw commands; call `render()`. `preserve()` keeps the command list for re-rendering; `callback()` inserts a callback; `capture()` is more accurate than `draw()` for game objects.
- `renderMode`: `'render'`, `'redraw'`, `'all'`.
- Use for static composited backgrounds, minimap snapshots, trails, runtime texture generation. `TextureManager.generate` / `Create.GenerateTexture` are removed.

## Performance

Draw calls and batching
- Use texture atlases; sprites from one atlas batch together. Keep the texture count per batch under `maxTextures` (mobile defaults to one texture per batch via `autoMobileTextures`).
- Order the display list to avoid texture/blend/shader switches. Lights, filters, masks, and blend-mode changes break batches.
- `BitmapText` over `Text` for dynamic text. Cache `Graphics` into textures when static.
- Prefer `SpriteGPULayer` (static, huge counts) and `TilemapGPULayer` for background scenery.
- Avoid deep `Container` trees; use Groups and `setDepth`.

CPU and GC
- Pool bullets, enemies, particles, and effects with `Group({ maxSize })` + `get()` + `killAndHide`/`disableBody`. Do not `new`/`destroy` per frame.
- `ParticleEmitter`: `reserve(n)` pre-allocates, `maxParticles`, `maxAliveParticles`, `frequency: -1` plus `explode(n)` for bursts. `frequency: 0` emits every frame.
- Avoid allocating vectors, arrays, and closures inside `update`; reuse temp `Phaser.Math.Vector2`.
- `update` should be cheap; use events and timers instead of polling everything every frame.
- Turn off physics `debug`, `useTree: false` only for 5000+ dynamic bodies, limit active colliders.
- Offscreen culling is automatic for camera views, but physics bodies still step; disable far bodies.

Memory
- Remove unused textures and cache entries when leaving a level (`textures.remove`, `cache.audio.remove`).
- `destroy()` game objects, tweens, timers, and listeners you created; scene `shutdown` does most game-object cleanup, not external listeners or sounds.
- Use compressed textures (KTX2/ASTC/ETC/PVR) for big mobile art (Y-flipped for v4). Use power-of-two atlases for pixel art with SpriteGPULayer.
- A WebGL context can be lost on mobile; v4 supports context restoration, but keep generated textures reproducible.

Frame pacing
- `fps: { limit: 30 }` or `game.loop.setFPSLimit` (`Timestep#setFPSLimit`, 4.2) saves battery.
- `render.powerPreference: 'high-performance' | 'low-power'`.
- Pause with `game.pause()` or on `hidden`/`blur` game events for background tabs.
- `roundPixels` defaults to `false` in v4. For pixel art use `pixelArt: true` (or `smoothPixelArt: true` in WebGL); per-object `vertexRoundMode` (`'off' | 'safe' | 'safeAuto' | 'full' | 'fullAuto'`).

Profiling
- Chrome Performance panel and `Spector.js` for draw calls. In-game: `this.game.loop.actualFps` for a debug readout.
- Test on a mid-range Android device, not only a desktop.

## Mobile

- Scale mode `FIT` or `EXPAND` with `autoCenter`; handle orientation via `this.scale.on('orientationchange')` and `resize`.
- Touch: add pointers for multitouch, avoid hover-only UI, enlarge hit areas (`setInteractive(new Rectangle(...))`), use `pointerup` for fullscreen requests.
- Audio unlock requires a gesture; show a "tap to start" screen. iOS Safari lacks stereo pan.
- `input.touch.capture`, `disableContextMenu`, CSS `touch-action: none` on the canvas parent, `user-select: none`.
- Wrap with Capacitor, Cordova, or Electron; the loader treats `file://` and `capacitor://` as local schemes.
- Respect safe-area insets with CSS env vars on the parent element.
