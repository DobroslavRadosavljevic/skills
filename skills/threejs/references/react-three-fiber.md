# React Three Fiber and drei

`@react-three/fiber` 9.8.1 (React renderer for three; peers `react >=19 <19.4`, `three >=0.156`), `@react-three/drei` 10.7.9 (helpers; React ^19, fiber ^9, `three >=0.159`). Prerelease lines: fiber `10.0.0-alpha`, drei `11.0.0-alpha`. R3F v9 is the React 19 compatibility release; v8 pairs with React 18.

```sh
bun add three @react-three/fiber @react-three/drei
bun add -d @types/three
```

## Canvas

```tsx
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';

export function Scene() {
  return (
    <Canvas camera={{ position: [0, 2, 5], fov: 50 }} shadows dpr={[1, 2]}>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} castShadow />
      <Box />
      <Environment preset="city" />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}
```

- `Canvas` creates renderer, scene, camera, resize handling, render loop, and event system. Size comes from its parent: give the parent a height.
- Props: `camera`, `shadows`, `dpr` (number or `[min,max]`), `frameloop` (`always` | `demand` | `never`), `gl` (options object or factory), `flat` (no tone mapping), `linear`, `orthographic`, `events`, `onCreated`, `onPointerMissed`, `performance`. Defaults: sRGB output, ACES tone mapping (use `flat` to disable).
- JSX maps to three classes by lowercase-first name: `<mesh>`, `<boxGeometry args={[1,1,1]} />`, `<meshStandardMaterial color="hotpink" />`. Constructor args via `args` (changing `args` rebuilds the object). Nested props with dashes: `position-x={1}`, `material-color="red"`. `attach` binds children (`attach="map"`). `<primitive object={obj} />` mounts an existing object.
- `extend({ MyClass })` registers custom classes (v9: factory form `extend(THREE_CLASS)` returns a component). TypeScript: `ThreeElements['mesh']` replaces old `MeshProps`; `Props` is now `CanvasProps`.
- Remove redundant `<StrictMode>` inside Canvas (inherits from parent root).
- v9 no longer auto-converts texture props to sRGB; set `texture.colorSpace = THREE.SRGBColorSpace` on custom textures (drei `useTexture`/glTF handle common cases).

## Hooks and the loop

```tsx
import { useFrame, useThree } from '@react-three/fiber';

function Box() {
  const ref = useRef<THREE.Mesh>(null!);
  const [hovered, setHovered] = useState(false);
  useFrame((state, delta) => { ref.current.rotation.y += delta; }); // mutate refs, never setState per frame
  const { viewport, camera, gl, scene, invalidate } = useThree();   // selector: useThree(s => s.viewport)
  return (
    <mesh ref={ref} onClick={(e) => { e.stopPropagation(); }} onPointerOver={() => setHovered(true)} onPointerOut={() => setHovered(false)}>
      <boxGeometry /><meshStandardMaterial color={hovered ? 'orange' : 'teal'} />
    </mesh>
  );
}
```

- `useFrame(cb, priority)`: a positive priority takes over rendering (you then call `gl.render` yourself).
- `useThree(selector)` subscribes to store fields: `gl`, `scene`, `camera`, `size`, `viewport`, `invalidate`, `advance`, `setDpr`, `frameloop`, `get()` (non-reactive).
- `useLoader(Loader, url)` suspends; `useLoader.preload(...)`, `useLoader.clear(...)`. Accepts a loader class or a configured instance (v9).
- Events: `onClick`, `onDoubleClick`, `onContextMenu`, `onPointerDown/Up/Move/Over/Out/Enter/Leave`, `onWheel`, `onPointerMissed`. Events carry the three intersection (`e.point`, `e.object`, `e.instanceId`, `e.delta`); they bubble through the object graph; call `e.stopPropagation()`. Only meshes with handlers are raycast.

## Suspense, assets

```tsx
import { Suspense } from 'react';
import { useGLTF, Preload, Html, useProgress } from '@react-three/drei';

function Model() {
  const { scene, animations } = useGLTF('/model.glb');   // Draco/Meshopt handled; default Draco decoder from CDN, configurable
  return <primitive object={scene} />;
}
useGLTF.preload('/model.glb');

<Canvas><Suspense fallback={null}><Model /><Preload all /></Suspense></Canvas>
```

- Self-host decoders: `useGLTF.setDecoderPath('/draco/')`. KTX2 via drei `useKTX2`.
- Clone to reuse: `scene.clone()` (skinned: `SkeletonUtils.clone`) or drei `<Clone>`.
- Typed components: `bunx gltfjsx model.glb --types --transform`.
- Animations: drei `useAnimations(animations, groupRef)` returns `{ actions, mixer }`.

## drei essentials

Controls: `OrbitControls`, `CameraControls`, `MapControls`, `TrackballControls`, `PointerLockControls`, `KeyboardControls`, `ScrollControls`. Staging: `Environment`, `Sky`, `Stage`, `Lightformer`, `ContactShadows`, `AccumulativeShadows`, `SoftShadows`, `Bounds`, `Center`, `Float`, `Backdrop`. Loaders: `useGLTF`, `useTexture`, `useKTX2`, `useFBX`, `useProgress`, `Loader`. Text/UI: `Text` (troika), `Text3D`, `Html`, `Billboard`, `Line`, `Edges`. Perf: `Instances`/`Instance`, `Merged`, `Bvh`, `Detailed` (LOD), `AdaptiveDpr`, `AdaptiveEvents`, `PerformanceMonitor`, `Preload`, `Stats`. Materials: `MeshTransmissionMaterial`, `MeshReflectorMaterial`, `MeshDistortMaterial`, `shaderMaterial()`. Misc: `View`, `RenderTexture`, `Hud`, `useHelper`, `Grid`, `Gltf`.

## Performance

- Frame loop: `frameloop="demand"` and call `invalidate()` (or rely on prop changes/controls) for static scenes.
- Never put per-frame values in React state; use refs/`useFrame`, `maath/easing`, or `useThree(s => s.get)`.
- Reuse geometries/materials (declare outside components or `useMemo`); use `<Instances>`/`InstancedMesh` for repeats; `dpr={[1, 2]}`, `<AdaptiveDpr pixelated />`, `<PerformanceMonitor>`.
- Mount/unmount objects freely: R3F disposes geometries/materials/textures on unmount (opt out per object with `dispose={null}` for shared assets).
- Avoid creating `new THREE.Vector3()` inside `useFrame`.
- Debug: `<Stats />` (drei), `r3f-perf` (stale), browser profiler, `gl.info`.

## WebGPURenderer with R3F (from the R3F v9 docs)

```tsx
import * as THREE from 'three/webgpu';
import { Canvas, extend, type ThreeToJSXElements } from '@react-three/fiber';

declare module '@react-three/fiber' { interface ThreeElements extends ThreeToJSXElements<typeof THREE> {} }
extend(THREE as any);

<Canvas gl={async (props) => {
  const renderer = new THREE.WebGPURenderer(props as any);
  await renderer.init();
  return renderer;
}}>
  <mesh><boxGeometry /><meshBasicNodeMaterial /></mesh>
</Canvas>
```

The v9 docs call WebGPU support work in progress. drei and `@react-three/postprocessing` components that depend on `ShaderMaterial`/`onBeforeCompile` (e.g. `MeshTransmissionMaterial`, EffectComposer) are WebGL-only; use TSL nodes and `RenderPipeline` instead ([webgpu-tsl.md](webgpu-tsl.md)). Alias `three` to `three/webgpu` in the bundler so drei and your code share one class set.

## Post-processing in R3F

```tsx
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
<Canvas><Scene /><EffectComposer><Bloom mipmapBlur intensity={0.8} /><Vignette darkness={1.1} /></EffectComposer></Canvas>
```

The composer forces `autoClear=false` and `NoToneMapping` while mounted; put a tone-mapping effect inside if needed. WebGL only.

## Physics, XR, testing, state

- Physics: `@react-three/rapier` (`<Physics><RigidBody><mesh/></RigidBody></Physics>`).
- XR: `@react-three/xr` (`createXRStore`, `<XR store={store}>`); see its docs for the v6 API.
- UI: `@react-three/uikit`. State: `zustand`. GUI: `leva`.
- Tests: `@react-three/test-renderer` renders to a scene graph without a GPU; `await ReactThreeTestRenderer.create(<Comp />)` then inspect `renderer.scene`.
- Next.js/SSR: Canvas is client-only; mark the component `"use client"` or load dynamically without SSR.
