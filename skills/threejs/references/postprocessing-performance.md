# Post-processing, Performance, Memory, XR

## EffectComposer (WebGLRenderer only)

```js
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.8, 0.4, 0.85));
composer.addPass(new OutputPass()); // tone mapping + sRGB conversion, always last
renderer.setAnimationLoop(() => composer.render());
// resize: composer.setSize(w, h); composer.setPixelRatio(renderer.getPixelRatio());
```

- Without `OutputPass`, output looks dark (no sRGB conversion). A second conversion makes it washed out.
- Every full-screen pass costs fill rate; prefer few passes, lower resolution for blur/SSAO, and render-target `samples` for MSAA (`new WebGLRenderTarget(w, h, { samples: 4 })`).
- Selective bloom: render bloom layer separately with `layers`, or use emissive + threshold.
- Dispose composer targets: `composer.dispose()`.
- Third-party `postprocessing` (pmndrs, 6.39.x, peer `three >=0.168 <0.187`) is a popular WebGL alternative; see [ecosystem-packages.md](ecosystem-packages.md).
- WebGPU: use `RenderPipeline` + TSL display nodes instead (see [webgpu-tsl.md](webgpu-tsl.md)).

## Performance checklist

Measure first: `renderer.info.render.calls`, `.triangles`, `renderer.info.memory.geometries/textures`, browser GPU profiler, `Stats` addon (`three/addons/libs/stats.module.js`), WebGPU Inspector (r184+).

- **Draw calls**: merge static geometry (`mergeGeometries`), use `InstancedMesh` for repeats of one geometry+material, `BatchedMesh` for many geometries sharing a material. Share materials and geometries between meshes. Aim for hundreds, not thousands, of calls.
- **Triangles**: LOD (`THREE.LOD`), decimation (`SimplifyModifier` is async since r186), Draco/Meshopt for download size (not for GPU cost).
- **Culling**: `frustumCulled` is on by default; make sure bounding spheres are right after manual edits or vertex-shader displacement (set `frustumCulled = false` or enlarge bounds for GPU-driven vertices). Occlusion culling is manual.
- **Fill rate / pixels**: cap `setPixelRatio` at 2 (or lower on mobile), drop to ~1 under load (adaptive DPR). Avoid large transparent overdraw; prefer `alphaTest`. Sort and limit transmission/refraction.
- **Lights/shadows**: few dynamic lights, few shadow casters, small tight shadow maps, static shadows via `shadowMap.autoUpdate = false`, bake lightmaps for static content.
- **Textures**: KTX2 compression, mipmaps, sensible sizes (4K only where visible), share atlases.
- **Shaders**: prefer `MeshStandardMaterial` over Physical unless needed; avoid `onBeforeCompile` churn (recompiles); precompile with `renderer.compile(scene, camera)` or `compileAsync` to avoid first-use hitches.
- **Render on demand**: for static scenes render only on change (controls `change`, resize, data updates).
- **CPU**: avoid per-frame allocation, avoid `scene.traverse` in the loop, disable `matrixAutoUpdate` for static nodes, throttle raycasts (pointermove) and use BVH for large meshes.
- **Antialiasing**: `antialias: true` (MSAA) is cheap on desktop; use FXAA/SMAA passes if MSAA is not available with post-processing.
- **Mobile**: lower DPR, fewer lights, `powerPreference: 'high-performance'` option, avoid float render targets when unsupported.

## Memory and disposal

The GPU resources behind objects are not freed when objects leave the scene or JS references drop. Dispose explicitly:

```js
function disposeObject(root) {
  root.traverse((o) => {
    o.geometry?.dispose();
    const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : [];
    for (const m of mats) {
      for (const v of Object.values(m)) if (v?.isTexture) v.dispose();
      m.dispose();
    }
    o.dispose?.();               // Object3D.dispose() exists since r186; custom subclasses call super.dispose()
  });
}
```

- Also dispose: `WebGLRenderTarget`/`RenderTarget`, `PMREMGenerator`, `EffectComposer`, `OrbitControls` (`controls.dispose()`), `Timer`, custom loaders, `SkeletonHelper`, `TextureLoader`-created textures, and `renderer` when unmounting. `WebGPURenderer.dispose()` is async since r186.
- Textures shared by several materials: dispose once.
- `renderer.forceContextLoss()` on WebGLRenderer teardown in SPAs that create many canvases.
- Verify with `renderer.info.memory` returning to baseline after teardown.
- Handle `webglcontextlost`/`webglcontextrestored` events on `renderer.domElement` for long-lived apps.
- In React/R3F: R3F auto-disposes unmounted objects (opt out with `dispose={null}` for shared assets).

## WebXR

```js
import { VRButton } from 'three/addons/webxr/VRButton.js';   // or XRButton / ARButton
renderer.xr.enabled = true;
document.body.appendChild(VRButton.createButton(renderer));
renderer.setAnimationLoop((time, frame) => renderer.render(scene, camera));
```

Requires `setAnimationLoop` and HTTPS (or localhost). Controllers: `renderer.xr.getController(i)`, `getControllerGrip(i)` with `XRControllerModelFactory` (`three/addons/webxr/`). `WebGPURenderer` gained WebXR support in r185 (MSAA in r186). The XR camera matrices come from the first sub-camera as of the r187 dev line. `setViewport`/`setScissor` stop scaling by pixel ratio when a render target is bound (r187 dev).

## Debug helpers

`AxesHelper`, `GridHelper`, `BoxHelper`, `Box3Helper`, `CameraHelper`, `DirectionalLightHelper`, `SkeletonHelper`, `VertexNormalsHelper` (addon). Remove them from production builds and dispose them.
