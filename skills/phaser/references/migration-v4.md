# Phaser 3 to Phaser 4 Migration

Source: upstream `changelog/v4/4.0/MIGRATION-GUIDE.md` and the 4.0.0 / 4.1.0 / 4.2.0 / 4.2.1 changelogs. Phaser 4.0.0 (codename Caladan) shipped 2026-04-10. Phaser 3 ended at 3.90.0 (Tsugumi, 2025-05-23).

## Strategy

1. Upgrade in a branch: `bun add phaser@^4.2`. Official templates pin `4.0.0`; move to the latest 4.x.
2. If you only use the standard API (Sprite, Text, Tilemap, Arcade, tweens), most code runs unchanged. Work through the breaking list below, then test visually.
3. Rewrite anything that touched pipelines, FX, masks, `DynamicTexture`, shaders, or `Geom.Point`.
4. Keep Phaser 3 only if you depend on removed features you cannot replace.

## Breaking changes (high impact first)

| Area | v3 | v4 |
| --- | --- | --- |
| Renderer | `Pipeline`, `setPipeline`, custom pipelines | `RenderNode` graph; register via `render.renderNodes` or `renderer.renderNodes.addNodeConstructor`. Rewrite custom pipelines. |
| Direct GL | `gl` calls tolerated | Do not call GL directly; use an `Extern` object. Removed `textureIndexes`, `genericVertexBuffer`, `genericVertexData`, `WebGLAttribLocationWrapper`. |
| Canvas | Co-equal | Deprecated; no filters/lighting. WebGL recommended. Canvas keeps 27 blend modes (WebGL: `Blend` filter can recreate). |
| FX | `preFX.addGlow()`, `postFX.addBlur()` | `obj.enableFilters(); obj.filters.internal.addGlow(...); obj.filters.external.addBlur(...)`. Works on any game object and camera. |
| Masks | `BitmapMask`, `GeometryMask` (WebGL) | `filters.internal.addMask(textureOrObject)`. `GeometryMask` Canvas only. |
| Derived FX | Bloom, Shine, Circle, Gradient FX | `Actions.AddEffectBloom`, `Actions.AddEffectShine`, `Actions.AddMaskShape`, `Gradient` game object. |
| ColorMatrix | `fx.sepia()` | `filter.colorMatrix.sepia()` |
| Tint | `setTintFill(color)`, `tintFill` | `setTint(color).setTintMode(Phaser.TintModes.FILL)`. `setTintFill` is a no-op that logs an error. Modes: `MULTIPLY FILL ADD SCREEN OVERLAY HARD_LIGHT`; `MULTIPLY_TWO` added in 4.2 (use `setTint2`); `MULTIPLY_ADD` arrives in 4.3. `setTint` no longer silently disables fill mode. |
| Camera matrices | `matrix` = position + rotation + zoom | `matrix` = rotation + zoom + scroll; new `matrixExternal` (position) and `matrixCombined`. `GetCalcMatrix(..., ignoreCameraPosition)`. Normal camera properties unchanged. |
| Texture orientation | top-left origin | GL orientation (Y=0 bottom). Re-compress compressed textures with Y flipped. PNG/JPG unaffected. Custom shaders must use GL coordinates. |
| DynamicTexture / RenderTexture | Draw executes immediately | Commands buffered; call `render()`. New `preserve()`, `callback()`, `capture()`, `renderMode`. Many batch-level methods removed. |
| Shader | positional ctor, Shadertoy uniforms auto-set | `ShaderQuadConfig` object; set uniforms yourself; `setUniform()`; `setTextures()` now replaces the array. |
| GLSL loading | fragment/vertex classification | Unclassified; combine at Shader creation; `#pragma` directives instead of templates. |
| Lighting | `setPipeline('Light2D')` | `setLighting(true)`; light `z` height; self-shadow; works on many objects. |
| TileSprite | WebGL wrap parameters, crop | Shader-based wrapping; no cropping; supports atlas frames and `tileRotation`. |
| Graphics/Shape | | `pathDetailThreshold` option. `Grid` uses stroke not outline. `Rectangle` rounded corners. |
| Geometry | `Geom.Point` and helpers | Removed. Use `Math.Vector2`. All `Geom.*` generators return `Vector2`. Replace `instanceof Phaser.Geom.Point`. See mapping below. |
| Math constants | `Math.TAU` = PI/2, `Math.PI2` = 2PI | `Math.TAU` = 2PI, `Math.PI2` removed, new `Math.PI_OVER_2`. Audit every use of `TAU`. |
| Data structures | `Phaser.Struct.Set`/`Map` | Native `Set`/`Map`; `iterateLocal`, `contains`, `setAll` removed. |
| roundPixels | default `true` | default `false`; applies only to axis-aligned unscaled objects; per-object `vertexRoundMode`. `pixelArt: true` still enables rounding. |
| Removed objects | `Mesh`, `Plane` | Removed in 4.0; `Mesh2D` (2D textured triangles, batches with sprites) added in 4.2. No 3D yet. |
| Removed plugins | Camera3D, Layer3D, Facebook Instant constants, `phaser-ie9.js` | Gone. |
| Utilities | `Create.GenerateTexture`, `TextureManager.generate`, `Math.SinCosTableGenerator`, polyfills | Removed; use native APIs and RenderTexture. |
| Spine | Bundled Spine 3/4 plugins | No longer updated; use Esoteric Software's official Phaser Spine plugin. |
| DOMElement | works without container | Throws without a container; enable `dom.createContainer`. |
| Gamepad Button | | accepts `isPressed` init parameter. |
| Tween `startDelay` | bug stuck in START_DELAY | fixed in 4.2.1. |

### Point to Vector2 map

`Point.Ceil/Floor/Clone/Equals` -> `Vector2.ceil/floor/clone/equals`; `Point.CopyFrom(src, dest)` -> `dest.copy(src)`; `GetMagnitude` -> `length`; `GetMagnitudeSq` -> `lengthSq`; `Invert` -> `invert`; `Negative` -> `negate`; `SetMagnitude` -> `setLength`; `Project`/`ProjectUnit` -> `project`/`projectUnit`; `Point.GetCentroid` -> `Math.GetCentroid`; `Point.Interpolate` -> `Math.LinearXY`; `GetRectangleFromPoints` -> `Math.GetVec2Bounds`.

## Code conversions

```js
// FX -> Filters
sprite.preFX.addGlow(0xff00ff, 4);            // v3
sprite.enableFilters();                        // v4
sprite.filters.internal.addGlow(0xff00ff, 4, 0, 1);
sprite.filters.external.addBlur(0, 2, 2, 1);

// BitmapMask -> Mask filter
sprite.setMask(new Phaser.Display.Masks.BitmapMask(this, maskImage)); // v3
sprite.enableFilters(); sprite.filters.internal.addMask(maskImage);    // v4

// Tint fill
sprite.setTintFill(0xff0000);                                          // v3
sprite.setTint(0xff0000).setTintMode(Phaser.TintModes.FILL);           // v4

// Lighting
sprite.setPipeline('Light2D');                                         // v3
sprite.setLighting(true);                                              // v4

// Render textures
rt.draw(obj, x, y); rt.render();                                       // v4 requires render()

// Tilemap GPU layer (new)
map.createLayer('Ground', tileset, 0, 0, true);
```

## Checklist

- [ ] `phaser@^4.2` installed; Node and bundler build ok; ESM import works
- [ ] Custom pipelines rewritten as render nodes (or removed)
- [ ] `preFX` / `postFX` / `BitmapMask` / `setMask` replaced by `enableFilters` + filters
- [ ] Bloom/Shine/Circle/Gradient FX replaced by Actions or `Gradient`
- [ ] `ColorMatrix` calls use `.colorMatrix`
- [ ] `setTintFill` removed; `setTintMode` used
- [ ] `Geom.Point` -> `Vector2`
- [ ] `Math.TAU` / `Math.PI2` audited; `PI_OVER_2` used where PI/2 meant
- [ ] `Struct.Set` / `Struct.Map` -> native
- [ ] `DynamicTexture` / `RenderTexture` call `render()`; uses of removed methods fixed
- [ ] Compressed textures re-exported with Y flip
- [ ] Direct `Camera#matrix` use updated
- [ ] `Shader` objects use `ShaderQuadConfig`; GLSL uses GL Y orientation
- [ ] Lights use `setLighting(true)` and `z`
- [ ] TileSprite cropping removed; Grid stroke props renamed
- [ ] `Mesh`/`Plane` removed or replaced (`Mesh2D` for 2D)
- [ ] Spine uses Esoteric plugin
- [ ] `Create.GenerateTexture` / `TextureManager.generate` not used
- [ ] `roundPixels` look verified; `pixelArt` or `vertexRoundMode` set
- [ ] DOMElements have containers
- [ ] No reliance on removed polyfills, `phaser-ie9.js`, Camera3D/Layer3D
- [ ] Visual regression pass on masks, glow, blur, tint, lighting, render textures
- [ ] Mobile performance retested (filters and lighting break batches)

## Changes after 4.0.0 worth knowing

- **4.1.0 (2026-04-30)**: `Layer` is a true GameObject (filters work); `mipmapRegeneration` render option; ESM default export, `Class` and `LOG_VERSION` export fixes; `getPaddingCeil()` replaces `getPadding()` in custom filter nodes; `Utils.Array.GetRandom` fix.
- **4.2.0 (2026-06-19)**: `Mesh2D`, `BatchHandlerTri`, `Stencil`, `StencilReference`, `CustomContext`, alpha strategies (`render.alphaStrategy`, `render.stencil`, `render.stencilAlphaStrategy`), `TintModes.MULTIPLY_TWO` and `setTint2`, cone lights (`lights.addConeLight`, `Light.setCone`), `Timestep#setFPSLimit`. Stencil test is now on by default in `WebGLStencilParametersFactory`.
- **4.2.1 (2026-07-09)**: stencil invert and clear fixes, ESM namespace-access fixes, ScaleManager parent resize fix, tween `startDelay` state fix, `AnimationManager#get` doc type.
- **4.3.0** (in repo changelog, unreleased at snapshot): `TintModes.MULTIPLY_ADD`.

## Ecosystem

- Plugins and tutorials written for v3 (especially pipelines, FX, Mesh/Plane, rex plugins that patch pipelines) may break; check each plugin's v4 support.
- Many blog posts and AI answers still describe v3 APIs. Verify against the 4.x API docs.
- The `v3_90_0` Context7 tag is Phaser 3.90; use the default or website IDs for v4.
