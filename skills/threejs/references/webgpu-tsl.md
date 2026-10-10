# WebGPURenderer, TSL, Compute

## Setup

```js
import * as THREE from 'three/webgpu';
import { Fn, uniform, time, uv, vec3, color, mix, sin } from 'three/tsl';

const renderer = new THREE.WebGPURenderer({ antialias: true }); // add forceWebGL: true to test fallback
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.setAnimationLoop(render);   // first frame awaits init automatically
document.body.appendChild(renderer.domElement);
```

- If you call the renderer outside `setAnimationLoop` (compute, `compileAsync`, `KTX2Loader.detectSupport`, readbacks), `await renderer.init()` first.
- WebGPU is used when available; otherwise the renderer falls back to a WebGL 2 backend automatically. Detect the backend with `renderer.backend.isWebGPUBackend` (verify against current source) when behavior must differ.
- Import everything from `three/webgpu` (it re-exports core). Import map (no bundler):

```html
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
  "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.webgpu.js",
  "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.tsl.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/"
} }
</script>
```

With R3F use an async `gl` factory that awaits `renderer.init()` ([react-three-fiber.md](react-three-fiber.md)). With a bundler, alias `three` to `three/webgpu` (so addons and your code share one class set) and check for duplicate-instance warnings.
- Not supported on WebGPURenderer: `ShaderMaterial`, `RawShaderMaterial`, `onBeforeCompile`, `EffectComposer`. `WebGLCubeRenderTarget` must be `CubeRenderTarget` (r183). Premultiplied alpha handling changed in r185 (use an opaque clear color if blending breaks).
- `renderAsync()` / `computeAsync()` are deprecated (r181); `waitForGPU()` removed. `compileAsync()` is non-blocking (r184); `compileComputeAsync()` exists (r186). `renderer.dispose()` is async (r186): `await renderer.dispose()`.
- `outputBufferType` (was `colorBufferType`, r182).
- Use the Inspector (`renderer.inspector = new Inspector()` from `three/addons/inspector/Inspector.js`) for debugging nodes and timing (r184 DevTools).

## Node materials

`MeshBasicNodeMaterial`, `MeshStandardNodeMaterial`, `MeshPhysicalNodeMaterial`, `MeshPhongNodeMaterial`, `LineBasicNodeMaterial`, `PointsNodeMaterial`, `SpriteNodeMaterial`, `NodeMaterial`. Assign TSL nodes to slots: `colorNode`, `opacityNode`, `roughnessNode`, `metalnessNode`, `emissiveNode`, `normalNode`, `positionNode` (vertex displacement), `alphaTestNode`, `envNode`, `fragmentNode`, `vertexNode`, `outputNode`.

```js
const speed = uniform(1);
const mat = new THREE.MeshStandardNodeMaterial({ roughness: 0.4 });
mat.colorNode = mix(color(0x2244ff), color(0xff8844), sin(time.mul(speed)).mul(0.5).add(0.5));
mat.positionNode = positionLocal.add(normalLocal.mul(sin(time.add(positionLocal.y.mul(4))).mul(0.05)));
speed.value = 2; // update uniforms from JS
```

(import `positionLocal`, `normalLocal` from `three/tsl`.)

## TSL basics

- Nodes are immutable expression graphs built with chained methods: `a.add(b)`, `.mul`, `.sub`, `.div`, `.mod`, `.pow`, `.sin`, `.normalize()`, `.oneMinus()`, `.clamp(0, 1)`, `.smoothstep(a, b)`, swizzles `.xyz`, `.x`.
- Types: `float`, `int`, `uint`, `bool`, `vec2/3/4`, `color`, `mat3/4`, `texture(tex, uvNode)`, `uniform(value)`, `attribute`, `varying`, `property`.
- Built-ins: `time`, `deltaTime`, `uv()`, `positionLocal/World/View/Geometry`, `normalLocal/World/View`, `cameraPosition`, `screenUV`, `instanceIndex`, `vertexIndex`.
- Functions: `Fn(([a, b]) => expr)` (or `Fn(() => {...})`), call with `fn(x, y)`. Inside, use `.toVar()` for mutable locals, `.assign()`, `If(cond, () => {...}).ElseIf(...).Else(...)`, `Loop(n, ({ i }) => {...})`, `Return`, `Discard()`.
- Update hooks: `OnMaterialUpdate`, `OnBeforeMaterialUpdate`, `OnObjectUpdate`, `OnFrameUpdate`.
- TSL compiles to WGSL (WebGPU) or GLSL (WebGL 2 backend) from the same graph.
- Renames: `PI2` to `TWO_PI` (r181), `directionToColor` to `packNormalToRGB`, `colorToDirection` to `unpackRGBToNormal` (r185). In TSL, `positionLocal` no longer includes skinning updates (r185); use `positionGeometry`.
- Docs: TSL Guide `https://threejs.org/docs/#TSL`, playground `https://threejs.org/tsl/`.

## Compute

```js
import { Fn, instancedArray, instanceIndex, deltaTime } from 'three/tsl';

const count = 100_000;
const positions = instancedArray(count, 'vec3');
const velocities = instancedArray(count, 'vec3');

const update = Fn(() => {
  const p = positions.element(instanceIndex);
  const v = velocities.element(instanceIndex);
  p.addAssign(v.mul(deltaTime));
})().compute(count);

await renderer.init();
renderer.setAnimationLoop(() => {
  renderer.compute(update);          // dispatch before render
  renderer.render(scene, camera);
});

// use the buffer in a material
spriteMaterial.positionNode = positions.toAttribute();   // or positions.element(instanceIndex) in SpriteNodeMaterial
```

- Buffers: `instancedArray(count, type)`, `attributeArray(count, type)`, `storage(StorageBufferAttribute, type, count)`. Read-write storage and atomics are allowed in non-compute stages (r186).
- `renderer.compute(node)` runs synchronously; `computeAsync` is deprecated. Use `compileComputeAsync()` to precompile (r186).
- Readback: `await renderer.getArrayBufferAsync(attribute)`.
- Compute needs a real WebGPU backend for many features; the WebGL fallback has limited compute support, so feature-test and offer a CPU or simplified path.

## RenderPipeline (post-processing; was PostProcessing before r183)

```js
import { pass } from 'three/tsl';
import { bloom } from 'three/addons/tsl/display/BloomNode.js';

const renderPipeline = new THREE.RenderPipeline(renderer);
const scenePass = pass(scene, camera);
const color = scenePass.getTextureNode('output');
renderPipeline.outputNode = color.add(bloom(color));

renderer.setAnimationLoop(() => renderPipeline.render()); // instead of renderer.render
```

- Effects live in `three/addons/tsl/display/*` (Bloom, FXAA, SMAA, DepthOfField, GTAO/SSAO, SSR, SSGI, VXGI, DotScreen, RGBShift, Pixelation, TRAA, Film, Sobel, Gaussian blur, ...). Chain: each effect takes the previous node.
- Tone mapping + color space are applied automatically at the end of the chain. To control placement set `renderPipeline.outputColorTransform = false` and wrap with `renderOutput(node)` (e.g. FXAA after output in sRGB).
- MRT: `scenePass.setMRT(mrt({ output, velocity }))`, then `scenePass.getTextureNode('velocity')`; depth is available without MRT setup. MRT attachments default to RGBA16F; set `texture.type = THREE.UnsignedByteType` to save bandwidth.
- `renderer.toneMapping` still set on the renderer.
- Breaking history: `PostProcessing` to `RenderPipeline` (r183); `AnamorphicNode` removed (use `BloomNode`, r185); `SSAAPassNode` clear colors removed; `PassNode.setResolution` to `setResolutionScale` (r181).
