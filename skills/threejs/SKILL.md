---
name: threejs
description: "Build, review, debug, optimize, migrate, teach, or plan Three.js r186 (npm three@0.186.x) 3D web graphics with current docs and a full usage guide. Use for three, THREE.Scene/PerspectiveCamera/WebGLRenderer, WebGPURenderer, three/webgpu, three/tsl, three/addons, TSL (Three Shading Language), NodeMaterial, Fn, uniform, compute shaders, instancedArray, RenderPipeline (ex PostProcessing), EffectComposer, UnrealBloomPass, BufferGeometry, InstancedMesh, BatchedMesh, LOD, MeshStandardMaterial/MeshPhysicalMaterial, ShaderMaterial, textures, colorSpace, tone mapping, PMREMGenerator, HDRLoader, lights and shadows, GLTFLoader with DRACO/Meshopt/KTX2, AnimationMixer, Timer (replaces Clock), Raycaster, OrbitControls, WebXR, dispose(), renderer.info, @types/three, Vite bundling, React Three Fiber/drei interop, and r17x to r186 migration (Clock, RGBELoader, PCFSoftShadowMap, renderAsync)."
---

# Three.js

Use this skill when work touches Three.js: scene/camera/renderer setup, render loop, geometry, materials, textures, lights/shadows, glTF assets, animation, picking, controls, post-processing, WebGPU/TSL, XR, performance/memory, TypeScript/bundling, or version upgrades.

Snapshot: `three@0.186.1` = **r186** (2026-09-24), `@types/three@0.186.0`. Next dev line is r187 (migration notes exist, not released). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the project: `three` version (npm `0.x.y` = release `r<x>`), `@types/three` match, renderer in use (`WebGLRenderer` vs `three/webgpu`), bundler/import map, loop style (`setAnimationLoop` vs custom rAF), React wrapper (R3F) or vanilla.
2. Everyday setup, loop, resize, geometry, picking, controls: [usage-guide.md](references/usage-guide.md).
3. Materials, textures, color space, lights, shadows, environment maps: [materials-textures-lighting.md](references/materials-textures-lighting.md).
4. glTF/Draco/Meshopt/KTX2 loading and the animation system: [loaders-animation.md](references/loaders-animation.md).
5. `WebGPURenderer`, node materials, TSL, compute, `RenderPipeline`: [webgpu-tsl.md](references/webgpu-tsl.md).
6. Draw calls, instancing, memory/dispose, `EffectComposer`, profiling: [postprocessing-performance.md](references/postprocessing-performance.md).
7. Upgrades and deprecations (r170 to r186): [migration.md](references/migration.md). Official URLs to refresh: [source-map.md](references/source-map.md).
8. Verify: `bunx tsc --noEmit`, a production build, console clean of `THREE.` warnings, `renderer.info` stable across a mount/unmount cycle.

## Decision Rules

- **Default to `WebGLRenderer`** (import from `three`) for broad compatibility and existing `ShaderMaterial`/`onBeforeCompile`/`EffectComposer` code.
- **Choose `WebGPURenderer`** (import from `three/webgpu`) for TSL, compute shaders, node materials, clustered lights, or the new post stack. It uses WebGPU and falls back to a WebGL 2 backend (`forceWebGL: true` to test). The manual still calls it experimental.
- `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, and `EffectComposer` do **not** work with `WebGPURenderer`; port to node materials/TSL and `RenderPipeline`.
- With `three/webgpu`, import **everything** (core and renderer) from `three/webgpu` and TSL from `three/tsl`. Do not mix `three` and `three/webgpu` class identities; alias `three` to the webgpu build as the manual's import map does.
- Addons come from `three/addons/...` (maps to `examples/jsm`). Pin addons and core to the same version.
- Prefer `renderer.setAnimationLoop(fn)` over hand-rolled rAF: it handles WebGPU init and XR.
- Use `THREE.Timer` for delta time; `Clock` is deprecated (r183).

## Pitfalls

- Color textures need `texture.colorSpace = THREE.SRGBColorSpace`; data maps (normal, roughness, AO, metalness) stay `NoColorSpace`. Wrong settings cause washed-out or dark scenes.
- Lights use physical units; old intensity values look wrong. PBR materials need `scene.environment` or lights.
- Cap pixel ratio (`Math.min(devicePixelRatio, 2)`), update `camera.aspect` and call `updateProjectionMatrix()` on resize.
- After editing `InstancedMesh` matrices set `instanceMatrix.needsUpdate = true`; recompute bounding volumes for culling/picking.
- Disposing: `geometry`, `material`, `texture`, `RenderTarget`, and `renderer` need `dispose()`; removing from the scene frees nothing on the GPU. `WebGPURenderer.dispose()` is async since r186.
- Never create geometries, materials, vectors, or raycasters inside the render loop; reuse scratch objects.
- `PCFSoftShadowMap` is deprecated (r182) and removed for WebGPU (r186); use `PCFShadowMap`.
- `RGBELoader` is `HDRLoader` (r180); `PostProcessing` is `RenderPipeline` (r183); `renderAsync`/`computeAsync` are deprecated (r181): use `await renderer.init()` then sync calls.
- The CommonJS build is deprecated (r186) and minified builds were removed; use ESM.
- `@types/three` minor must track `three` minor (0.186.x with 0.186.x).

## Verification

Report which checks ran: typecheck, production build, browser run on the target renderer (WebGPU and the WebGL fallback if both matter), `renderer.info` (calls, triangles, geometries, textures) before and after teardown, and any version assumptions left.
