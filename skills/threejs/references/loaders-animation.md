# Loaders and Animation

## glTF pipeline

`GLTFLoader` is the standard 3D asset path (`.glb`/`.gltf`). Typical production loader:

```js
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/addons/loaders/DRACOLoader.js';
import { KTX2Loader } from 'three/addons/loaders/KTX2Loader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';

const draco = new DRACOLoader().setDecoderPath('/draco/'); // folder holding the decoder files
const ktx2 = new KTX2Loader().setTranscoderPath('/basis/').detectSupport(renderer);

const loader = new GLTFLoader()
  .setDRACOLoader(draco)
  .setKTX2Loader(ktx2)
  .setMeshoptDecoder(MeshoptDecoder);

const gltf = await loader.loadAsync('/model.glb');
scene.add(gltf.scene);
// gltf.animations: AnimationClip[], gltf.cameras, gltf.scenes, gltf.asset
```

- Decoder files live in `node_modules/three/examples/jsm/libs/draco/` (and `draco/gltf/`) and `.../libs/basis/`. With a bundler copy them to `public/` and point the loaders there, or use a CDN path. Since r185 the bundled DRACO *encoders* were removed; the DRACO decoder is the one to ship. `DRACOLoader.setDecoderConfig()` is deprecated (WASM will be the only path).
- With `WebGPURenderer`, `await renderer.init()` before `ktx2.detectSupport(renderer)`; `detectSupportAsync()` is deprecated.
- Dispose loaders you no longer need: `draco.dispose()`, `ktx2.dispose()` (frees worker pools). Share one instance across loads.
- Optimize assets offline with `gltf-transform` (`bunx @gltf-transform/cli optimize in.glb out.glb`) or `gltfpack` (`-cc -tc` for Meshopt + KTX2). Quantize, dedupe, resize textures, compress.
- Loader basics: `loader.load(url, onLoad, onProgress, onError)`, `loadAsync`. `LoadingManager` aggregates progress. Since r184 `FileLoader.load()`/`ImageBitmapLoader.load()` return nothing; use callbacks/`loadAsync`.
- glTF materials are `MeshStandardMaterial` (or Physical with extensions). `gltf.scene.traverse` to set `castShadow`/`receiveShadow`, or to swap materials.
- Reuse models: `clone()` shares geometry/material; for skinned meshes use `SkeletonUtils.clone` (`three/addons/utils/SkeletonUtils.js`).
- Draco-compressed meshes decode in workers: first load is slower; keep decoders cached.

Other loaders: `TextureLoader`, `CubeTextureLoader`, `HDRLoader` (ex `RGBELoader`), `EXRLoader`, `KTX2Loader`, `FBXLoader` (auto converts +Z up to +Y since r184), `OBJLoader`/`MTLLoader`, `STLLoader`, `PLYLoader` (keeps data types since r185: may yield `Float64Array`), `USDLoader` (USDC support, r184), `SVGLoader` (`createShapes` deprecated: use `shapePaths.toShapes()`), `FontLoader`+`TextGeometry`, Gaussian splat loaders (r186, `GaussianSplat`, `GaussianSplatPLYLoader`). `VTKLoader` and `LWOLoader` are deprecated.

Exporters: `GLTFExporter` (`parseAsync`), `DRACOExporter` (`parseAsync` since r185), `OBJExporter`, `STLExporter`, `PLYExporter`, `USDZExporter`.

## Animation system

Pieces: `AnimationClip` (keyframe tracks) → `AnimationMixer(root)` (one per animated root) → `AnimationAction` (play/blend one clip).

```js
const mixer = new THREE.AnimationMixer(gltf.scene);
const actions = Object.fromEntries(gltf.animations.map((c) => [c.name, mixer.clipAction(c)]));
actions.Idle.play();

// crossfade
function fadeTo(next, duration = 0.3) {
  next.reset().play();
  current.crossFadeTo(next, duration, false);
  current = next;
}

// per frame
mixer.update(timer.getDelta());
```

- Action controls: `.setLoop(THREE.LoopOnce, 1)`, `.clampWhenFinished = true`, `.setEffectiveWeight(w)`, `.setEffectiveTimeScale(s)`, `.fadeIn(t)`, `.fadeOut(t)`, `.paused`, `.time`.
- Events: `mixer.addEventListener('finished', e => ...)` and `'loop'`.
- `clip.optimize()` removes redundant keyframes; `AnimationUtils.makeClipAdditive(clip)` for layered motion.
- Morph targets: `mesh.morphTargetInfluences[mesh.morphTargetDictionary.name] = v` (animated by tracks too).
- Skinning: `SkinnedMesh` + `Skeleton`; `SkeletonHelper` for debug. Many identical skinned characters are expensive (CPU skinning matrices); bake to textures or instance via vertex-animation textures when scaling up.
- Cleanup: `mixer.stopAllAction(); mixer.uncacheRoot(root);` when removing a model.
- Procedural animation: update transforms inside the loop with `delta` from `THREE.Timer` (not `Clock`, deprecated since r183). `timer.connect(document)` stops large deltas after tab switches.
- Property binding paths use node names (`Bone.position`, `.morphTargetInfluences[name]`); renaming nodes breaks tracks.
