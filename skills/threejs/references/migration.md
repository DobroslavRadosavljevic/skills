# Migration and Deprecations

Source of truth: https://github.com/mrdoob/three.js/wiki/Migration-Guide (per-release sections, e.g. "185 → 186"). Release notes: https://github.com/mrdoob/three.js/releases. Upgrade one or two releases at a time; three.js ships breaking changes in most minors.

Release dates (captured 2026-10-10): r183 2026-02-20, r184 2026-04-16, r185 2026-07-01, r186 2026-09-24 (npm `0.186.1`). r187 is the dev line.

## 185 → 186 (current)

- `Object3D.dispose()` added; custom subclasses call `super.dispose()`.
- `WebGPURenderer.dispose()` async.
- `Source` renamed `TextureSource`.
- `PCFSoftShadowMap` removed from WebGPURenderer (warns); use `PCFShadowMap`.
- `LightProbeGrid` to `LightProbeGridWebGL` (and the helper).
- `GaussianSplatMesh` to `GaussianSplat`; `PLYGaussianSplatLoader` to `GaussianSplatPLYLoader`.
- `SimplifyModifier` is meshoptimizer-based; `modify()` is async.
- `BufferGeometryUtils.toTrianglesDrawMode()` mutates in place; clone first.
- `Sky`/`SkyMesh` `up` uniform removed (assumes +Y).
- `GTAONode` `distanceExponent`/`distanceFallOff` deprecated.
- CommonJS build deprecated; minified builds removed.
- Features: spiral-blur PMREM, `MeshPhysicalMaterial` retroreflectivity, `compileComputeAsync()`, WebXR MSAA for WebGPU, SunLight addon (cascaded shadows), Gaussian splats, SSAO/GTAO/VXGI nodes.

## 184 → 185

- WebGPU premultiplied alpha implementation changed; use opaque background/clear if blending breaks.
- `SVGLoader.createShapes()` deprecated; use `shapePaths.toShapes()`. `DRACOLoader.setDecoderConfig()` deprecated. `LWOLoader` deprecated. `AnamorphicNode` removed (use `BloomNode`). `TiledLighting` removed (use `ClusteredLighting`).
- `PLYLoader`/`PLYExporter` honor attribute types (Float64Array possible).
- `Object3D.updateWorldMatrix()` honors `matrixWorldNeedsUpdate`; `Matrix3.translate/scale/rotate` deprecated; `determinant3x3` is `determinantAffine`.
- TSL: `positionLocal` excludes skinning (use `positionGeometry`); `directionToColor` to `packNormalToRGB`; `colorToDirection` to `unpackRGBToNormal`. `GTAONode` is darker and wider (lower `radius`/`scale`). `DRACOExporter.parse` to `parseAsync`. Bundled DRACO encoders removed.

## 183 → 184

- Render targets use the working color space. Background/environment rotation now matches object rotation.
- `FileLoader.load()`/`ImageBitmapLoader.load()` return nothing (use `onLoad`/`loadAsync`). `FBXLoader` converts +Z up to +Y up (remove manual rotations). `VTKLoader` deprecated. `FirstPersonControls` reworked.
- Deprecated instancing render paths removed from `InstancedMesh`/`BatchedMesh`. `renderer.state.pixelStorei()` for raw context pixel storage.
- Features: `HTMLTexture`, non-blocking `compileAsync()` in WebGPURenderer, NodeMaterial compatibility layer in WebGLRenderer, DevTools/Inspector, dynamic lights in WebGPU, USDC support.

## 182 → 183

- `Clock` deprecated: use `Timer` (`timer.update()` each frame; optional `timer.connect(document)`).
- `PostProcessing` renamed `RenderPipeline`; `Nodes` renamed `NodeManager`. `MeshPostProcessingMaterial` removed. `WebGLCubeRenderTarget` does not work on WebGPURenderer (use `CubeRenderTarget`).
- Camera view matrices exclude scale. WebGPU shadows improved (reduce bias). `RoomEnvironment` position changed (affects PMREM). `Sky` legacy gamma removed. `SSRNode` blending changed (additive).

## 181 → 182

- `PCFSoftShadowMap` deprecated for WebGLRenderer (`PCFShadowMap` is soft now).
- `WebGPURenderer` `colorBufferType` to `outputBufferType` (`getColorBufferType` to `getOutputBufferType`). `VOXLoader.load()` result shape changed.

## 180 → 181

- Improved PBR indirect specular and energy conservation (rough materials slightly brighter); PMREM reflections improved. Expect small visual diffs in snapshot tests.
- WebGPURenderer: `renderAsync()`/`computeAsync()` etc. deprecated (use `await renderer.init()` then sync calls); `waitForGPU()` removed. `KTX2Loader.detectSupportAsync()` deprecated. TSL `PI2` to `TWO_PI`. `PassNode.setResolution` to `setResolutionScale`. API docs regenerated (JSDoc, English only).

## 179 → 180

- `RGBELoader` to `HDRLoader`. `RGBMLoader` removed (use `EXRLoader`, `HDRLoader`, `HDRCubeTextureLoader`, `UltraHDRLoader`).
- Node `resolution` properties to scalar `resolutionScale`. Defines renamed: `USE_REVERSEDEPTHBUF` to `USE_REVERSED_DEPTH_BUFFER`, `USE_LOGDEPTHBUF` to `USE_LOGARITHMIC_DEPTH_BUFFER`. `DepthOfFieldNode` rewritten.

## Upcoming (r187 dev, from the migration wiki, unreleased)

PMREM based on cube render targets (`CubeUVReflectionMapping` removed; reflections differ), internal `WeakRef`/`FinalizationRegistry`, XR camera matrices from first sub-camera, `setViewport`/`setScissor` no longer scale by pixel ratio with a bound render target, `pixelationPass` `pixelSize` plain number, custom lights via `CustomLight.registerNode(CustomLightNode)`. Re-check before relying on it.

## Older long-lived breaks (still hit in old code/tutorials)

- `renderer.outputEncoding` / `sRGBEncoding` to `outputColorSpace` / `SRGBColorSpace` (r152). `texture.encoding` to `texture.colorSpace`.
- `useLegacyLights` removed (r165); lights are physical (r155). Old light intensities are wrong.
- `THREE.Geometry`/`Face3` removed (r125): use `BufferGeometry`. `Math` namespace is `MathUtils`.
- `Clock` (deprecated r183), `RGBELoader` (renamed r180), `PostProcessing` (renamed r183), `PCFSoftShadowMap` (r182/r186).
- Tutorials using `import 'three/examples/jsm/...'` still resolve via exports but prefer `three/addons/...`.
- `AmbientLight` `intensity` and `MeshStandardMaterial.envMapIntensity` semantics differ between old and new IBL (r181 energy conservation).

## Upgrade procedure

1. Read each migration section between current and target.
2. `bun add three@<target> && bun add -d @types/three@<matching>`.
3. `bunx tsc --noEmit`; fix deprecations flagged in the console (`THREE.<Class>: ... deprecated`).
4. Visual diff: tone mapping, PBR/IBL brightness, shadows (bias), post-processing.
5. Re-test XR, loaders (decoder paths), and WebGPU/WebGL fallback separately.
