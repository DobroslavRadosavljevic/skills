# Usage Guide

Snapshot: three r186. Code is ESM, WebGLRenderer unless noted.

## Install and imports

```sh
bun add three
bun add -d @types/three   # keep the minor equal to three (0.186.x)
```

```js
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
```

Package exports: `three`, `three/webgpu`, `three/tsl`, `three/addons/*` (= `examples/jsm/*`), `three/addons` (barrel), `three/src/*`. The `require` entry (`three.cjs`) is deprecated since r186.

No bundler: pin one version in an import map.

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
} }
</script>
```

For WebGPU/TSL map `three` and `three/webgpu` to `build/three.webgpu.js`, `three/tsl` to `build/three.tsl.js` (see [webgpu-tsl.md](webgpu-tsl.md)). Serve files over HTTP, not `file://`.

## Minimal scene

```js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.1, 100);
camera.position.set(0, 1.5, 4);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping; // opt in; default is NoToneMapping
document.body.appendChild(renderer.domElement);

const mesh = new THREE.Mesh(
  new THREE.BoxGeometry(1, 1, 1),
  new THREE.MeshStandardMaterial({ color: 0x44aa88 }),
);
scene.add(mesh, new THREE.DirectionalLight(0xffffff, 2), new THREE.AmbientLight(0xffffff, 0.3));

const timer = new THREE.Timer();
timer.connect(document); // pauses delta spikes when the tab is hidden
renderer.setAnimationLoop((time) => {
  timer.update(time);
  mesh.rotation.y += timer.getDelta();
  renderer.render(scene, camera);
});
```

Prefer `setAnimationLoop` (needed for XR and handles WebGPU init). Stop with `renderer.setAnimationLoop(null)`. `Timer.update()` must be called each frame; `getDelta()`/`getElapsed()` are idempotent within a frame.

## Resize

```js
const canvasHost = renderer.domElement.parentElement;
new ResizeObserver(() => {
  const { clientWidth: w, clientHeight: h } = canvasHost;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);          // third arg false = leave CSS size alone
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
}).observe(canvasHost);
```

Render-on-demand (no loop): call `renderer.render` after controls `change` events and resizes.

## Cameras

- `PerspectiveCamera(fov, aspect, near, far)`: keep `near/far` tight (avoids z-fighting); use `logarithmicDepthBuffer` or reversed depth only when needed.
- `OrthographicCamera(left, right, top, bottom, near, far)`: update all four bounds on resize.
- `camera.lookAt(x, y, z)` sets orientation; controls override it.

## Geometry

- Built-ins (Box, Sphere, Plane, Cylinder, Torus, TorusKnot, Extrude, Lathe, Tube, Shape). Segment counts drive vertex cost.
- Custom `BufferGeometry`:

```js
const g = new THREE.BufferGeometry();
g.setAttribute('position', new THREE.BufferAttribute(new Float32Array([0,0,0, 1,0,0, 0,1,0]), 3));
g.setIndex([0, 1, 2]);
g.computeVertexNormals();
g.computeBoundingSphere(); // needed for frustum culling after manual edits
```

- Mutate in place: edit `attribute.array`, set `attribute.needsUpdate = true`. Buffer size cannot grow; allocate the max up front, use `geometry.setDrawRange(0, n)`.
- Dynamic usage: `attribute.setUsage(THREE.DynamicDrawUsage)`.
- Utilities: `three/addons/utils/BufferGeometryUtils.js` (`mergeGeometries`, `mergeVertices`, `toCreasedNormals`). Since r186 `toTrianglesDrawMode()` mutates in place, clone first.
- `Object3D.pivot` exists since r183. Camera view matrices exclude scale since r183.

## Instancing

```js
const inst = new THREE.InstancedMesh(geometry, material, 10000);
const m = new THREE.Matrix4();
for (let i = 0; i < inst.count; i++) {
  m.setPosition(Math.random() * 100, 0, Math.random() * 100);
  inst.setMatrixAt(i, m);
  inst.setColorAt(i, color.setHSL(Math.random(), 1, 0.5));
}
inst.instanceMatrix.needsUpdate = true;
if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
inst.computeBoundingSphere(); // culling + raycast use bounds
```

`BatchedMesh(maxInstanceCount, maxVertexCount, maxIndexCount, material)`: many different geometries in one draw call with `addGeometry`, `addInstance`, `setMatrixAt`, `setColorAt`, `setVisibleAt`; per-instance frustum culling and sorting are built in. Set `perObjectFrustumCulled = false` to skip culling cost. Instancing render paths changed in r184 (deprecated paths removed).

`THREE.LOD`: `lod.addLevel(mesh, distance)`; updated automatically on render.

## Raycasting and picking

```js
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', (e) => {
  const r = renderer.domElement.getBoundingClientRect();
  pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(scene.children, true)[0];
  if (hit) console.log(hit.object, hit.point, hit.instanceId /* InstancedMesh */, hit.faceIndex);
});
```

Raycasting is CPU; for dense meshes use `three-mesh-bvh` (third party) or GPU/ID-buffer picking. `camera.matrixWorld` must be current (renderer updates it each render).

## Controls

Addons under `three/addons/controls/`: `OrbitControls`, `MapControls`, `TrackballControls`, `FlyControls`, `FirstPersonControls` (new interaction model in r184), `PointerLockControls`, `TransformControls`, `DragControls`, `ArcballControls`.

```js
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;      // then call controls.update() every frame
controls.target.set(0, 1, 0);
controls.update();
// teardown
controls.dispose();
```

## Object graph tips

- `object.add/remove`, `Group`, `traverse`, `getObjectByName`. `scene.remove(obj)` does not free GPU memory.
- Matrices update automatically each render; for static objects set `object.matrixAutoUpdate = false` and call `updateMatrix()` after changes. Since r185 `updateWorldMatrix()` honors `matrixWorldNeedsUpdate`; set it when you edit `matrix` by hand.
- Layers: `object.layers.set(n)`, `camera.layers.enable(n)` for selective render/raycast.
- Reuse scratch `Vector3`/`Matrix4`/`Quaternion`; avoid allocation per frame.

## TypeScript and bundling

- Types come from `@types/three` (matching minor). `tsconfig`: `"moduleResolution": "bundler"`, `"module": "ESNext"`.
- Vite: `import url from './model.glb?url'` or place assets in `public/`. `three` needs no special config; keep a single copy (`bun pm ls three`) to avoid "Multiple instances of Three.js" warnings from addon/third-party duplicates (use `resolve.dedupe: ['three']`).
- Copy decoders when using a bundler: `node_modules/three/examples/jsm/libs/draco/` and `.../libs/basis/` into `public/` (see [loaders-animation.md](loaders-animation.md)).
- Tree shaking: named imports from `three` shrink bundles in production builds; avoid importing the whole `three/addons` barrel.

## React Three Fiber (integration point)

`@react-three/fiber` 9.8.x (React 19) with `@react-three/drei` 10.7.x. Details, WebGPU `gl` factory, and performance: [react-three-fiber.md](react-three-fiber.md). Addon folder map: [addons-index.md](addons-index.md). Companion packages: [ecosystem-packages.md](ecosystem-packages.md).
