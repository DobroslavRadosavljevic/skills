# Ecosystem Packages

Versions captured from npm on 2026-10-10 against `three@0.186.1` (r186). "r186" means the declared peer range allows it; always smoke-test.

## Decision table

| Need | Pick | Notes |
| --- | --- | --- |
| React app | `@react-three/fiber` + `@react-three/drei` | See [react-three-fiber.md](react-three-fiber.md) |
| WebGL post-processing, richer than `EffectComposer` | `postprocessing` (`@react-three/postprocessing` in React) | WebGL only; not for WebGPURenderer |
| Fast raycast / spatial queries on big meshes | `three-mesh-bvh` | Also accelerates path tracing |
| glTF optimization (CLI/scripting) | `@gltf-transform/cli`, `gltfpack`/`meshoptimizer` | Offline build step |
| glTF to React component | `gltfjsx` | Generates typed JSX |
| Crisp 3D text | `troika-three-text` (drei `<Text>`) | SDF text, WebGL |
| Physics | `@dimforge/rapier3d-compat` (`@react-three/rapier`) or `cannon-es` | Rapier is the maintained choice |
| Camera animation/controls beyond Orbit | `camera-controls` (drei `<CameraControls>`) | |
| Offline photoreal render | `three-gpu-pathtracer` | WebGL, needs `three >= 0.185` |
| XR in React | `@react-three/xr` | |
| GUI for tweaking | `leva` (React) or `lil-gui` (bundled in addons) | |
| Perf overlay in R3F | `r3f-perf` (stale) or drei `<Stats>`/`<PerformanceMonitor>` | |
| UI in 3D | `@react-three/uikit` | |
| Math helpers (easing, noise, buffers) | `maath` | |

## Packages

| Package | Version (date) | Purpose | Compat | Maintained |
| --- | --- | --- | --- | --- |
| `three` | 0.186.1 (2026-09-24) | Core, `three/webgpu`, `three/tsl`, `three/addons` | n/a | yes (monthly+ releases) |
| `@types/three` | 0.186.0 (2026-10-04) | Types; match `three` minor | r186 | yes |
| `@react-three/fiber` | 9.8.1 (2026-10-10) | React renderer for three | React `>=19 <19.4`, three `>=0.156`; WebGPU via async `gl`; next line `10.0.0-alpha.5` | yes |
| `@react-three/drei` | 10.7.9 (2026-09-25) | R3F helpers | React ^19, fiber ^9, three `>=0.159`; `11.0.0-alpha.7` exists | yes |
| `@react-three/postprocessing` | 3.2.0 (2026-10-10) | `postprocessing` for R3F | React ^19, fiber `>=9.7`, `postprocessing ^6.36` | yes |
| `postprocessing` | 6.39.5 (2026-09-09) | Effect library (WebGL) | peer `three >=0.168 <0.187` so r186 OK, r187 not yet | yes |
| `@react-three/rapier` | 2.2.0 (2026-08-07) | Rapier physics for R3F | React ^19, fiber ^9.0.4, three `>=0.159` | yes |
| `@react-three/xr` | 6.6.31 (2026-09-28) | WebXR (VR/AR) for R3F | React `>=18`, fiber `>=8` | yes |
| `@react-three/uikit` | 1.0.76 (2026-09-01) | Flexbox UI in 3D | React `>=18`, fiber `>=8` | yes |
| `@react-three/offscreen` | 0.0.8 (2026-08-07) | Render R3F in a Web Worker | fiber `>=8` | slow (0.0.x) |
| `@react-three/test-renderer` | 9.1.1 (2026-10-10) | Test R3F scenes without a GPU | React ^19, fiber `>=9` | yes |
| `@react-three/csg` | 4.0.0 (2026-08-07) | Boolean geometry ops | R3F | yes |
| `leva` | 0.10.1 (2025-10-31) | React GUI controls | React 18/19 | moderate |
| `r3f-perf` | 7.2.3 (2024-11-08) | R3F perf overlay | fiber `>=8` | stale, verify on React 19 |
| `three-stdlib` | 2.36.1 (2025-11-10) | Standalone copy of addons (used by drei) | three `>=0.128` | not deprecated on npm but slow; prefer `three/addons` |
| `three-mesh-bvh` | 0.9.16 (2026-10-08) | BVH raycast, shapecast, GPU BVH | three `>=0.159` | yes |
| `@gltf-transform/core` `/cli` `/functions` | 4.5.1 (2026-09-28) | glTF read/write/optimize; bin `gltf-transform` | engine-agnostic | yes |
| `gltfjsx` | 6.5.3 (2024-11-04) | glTF to JSX/TSX | R3F | stale but works; bin `gltfjsx` |
| `meshoptimizer` | 1.3.0 (2026-09-25) | Meshopt compress/simplify (JS) | engine-agnostic | yes |
| `troika-three-text` | 0.52.5 (2026-07-24) | SDF text | three `>=0.125`, WebGL material | yes |
| `three-gpu-pathtracer` | 0.0.27 (2026-10-08) | GPU path tracer | three `>=0.185`, `three-mesh-bvh >=0.9.15`, `xatlas-web` | yes (0.0.x API churn) |
| `camera-controls` | 3.1.2 (2025-11-17) | Smooth camera controls | three `>=0.126` | moderate |
| `maath` | 0.10.8 (2026-08-17) | Math helpers | three `>=0.134` | moderate |
| `@dimforge/rapier3d-compat` | 0.21.0 (2026-09-25) | WASM physics (inlined wasm) | engine-agnostic | yes |
| `cannon-es` | 0.20.0 (2022-08-12) | JS physics | engine-agnostic | unmaintained; prefer Rapier |
| `@pmndrs/vanilla` | 1.25.0 (2026-10-01) | drei helpers for vanilla three | three `>=0.137` | yes |
| `zustand` | 5.0.15 (2026-08-13) | State store used with R3F | React >=18 | yes |

WebGPU compatibility: only core `three/webgpu` + `three/tsl` + `three/addons/tsl/*` are WebGPU-native. `postprocessing`, `troika-three-text`, `three-gpu-pathtracer`, and the WebGL `EffectComposer` assume `WebGLRenderer`/`ShaderMaterial`. `three-mesh-bvh` is CPU-side and works with either renderer.

## Snippets

```sh
bun add three @types/three
bun add @react-three/fiber @react-three/drei
bun add postprocessing                      # vanilla; or @react-three/postprocessing for React
bun add three-mesh-bvh @dimforge/rapier3d-compat troika-three-text camera-controls
bunx @gltf-transform/cli optimize in.glb out.glb --compress draco --texture-compress webp
bunx gltfjsx model.glb --types --transform   # writes Model.tsx and a compressed model-transformed.glb
```

three-mesh-bvh (accelerate raycasting):

```js
import { computeBoundsTree, disposeBoundsTree, acceleratedRaycast } from 'three-mesh-bvh';
THREE.BufferGeometry.prototype.computeBoundsTree = computeBoundsTree;
THREE.BufferGeometry.prototype.disposeBoundsTree = disposeBoundsTree;
THREE.Mesh.prototype.raycast = acceleratedRaycast;
geometry.computeBoundsTree();             // before raycasting; call disposeBoundsTree() on teardown
raycaster.firstHitOnly = true;
```

postprocessing (vanilla WebGL; replaces `EffectComposer` from addons):

```js
import { EffectComposer, RenderPass, EffectPass, BloomEffect } from 'postprocessing';
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
composer.addPass(new EffectPass(camera, new BloomEffect({ mipmapBlur: true, intensity: 1 })));
renderer.setAnimationLoop((t) => composer.render()); // composer handles tone mapping; keep renderer.toneMapping = NoToneMapping with tone-mapping effect
```

Rapier (vanilla):

```js
import RAPIER from '@dimforge/rapier3d-compat';
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -9.81, z: 0 });
const body = world.createRigidBody(RAPIER.RigidBodyDesc.dynamic().setTranslation(0, 5, 0));
world.createCollider(RAPIER.ColliderDesc.ball(0.5), body);
// per frame: world.step(); const p = body.translation(); mesh.position.set(p.x, p.y, p.z);
```

troika text: `import { Text } from 'troika-three-text'; const t = new Text(); t.text='Hi'; t.fontSize=0.2; t.sync(); scene.add(t);` (`t.dispose()` on teardown).

glTF-Transform scripting: `import { NodeIO } from '@gltf-transform/core'; import { ALL_EXTENSIONS } from '@gltf-transform/extensions'; import { dedup, prune, textureCompress } from '@gltf-transform/functions';` then `await doc.transform(dedup(), prune())`.

## Staleness and risk notes

- `r3f-perf`, `gltfjsx`, `cannon-es` have not been published in a year or more; check issues before adopting.
- `postprocessing` pins an upper bound on `three`; upgrading three past that range needs a `postprocessing` release first.
- `three-stdlib` forks addons; mixing its classes with `three/addons` classes in one scene is fine but pin one source per feature.
- `@react-three/*` packages generally require React 19 and R3F v9; R3F `10.0.0-alpha`, drei `11.0.0-alpha` are prerelease lines, do not use in production.
