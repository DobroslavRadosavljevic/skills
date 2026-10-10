# Addons Index (`three/addons/*`)

`three/addons/<path>` resolves to `examples/jsm/<path>` inside the `three` package (verified against `three@0.186.1`). There is no separate install. `three/addons` (barrel, `Addons.js`) re-exports many modules but defeats tree shaking; import by path. `three/examples/jsm/*` also resolves (legacy spelling). Addons import from `three`; with `three/webgpu` alias `three` to the webgpu build ([webgpu-tsl.md](webgpu-tsl.md)).

Entry points of the package itself: `three` (core + WebGLRenderer), `three/webgpu` (core + WebGPURenderer + node materials), `three/tsl` (TSL functions), `three/addons/*`, `three/src/*` (raw source). Build files: `build/three.module.js`, `three.core.js`, `three.webgpu.js`, `three.webgpu.nodes.js`, `three.tsl.js`, `three.cjs` (deprecated).

| Folder | Contents (most useful) |
| --- | --- |
| `controls/` | `OrbitControls`, `MapControls`, `TrackballControls`, `ArcballControls`, `FlyControls`, `FirstPersonControls`, `PointerLockControls`, `TransformControls`, `DragControls` |
| `loaders/` | `GLTFLoader`, `DRACOLoader`, `KTX2Loader`, `HDRLoader` (ex RGBELoader), `EXRLoader`, `FBXLoader`, `OBJLoader`/`MTLLoader`, `STLLoader`, `PLYLoader`, `USDLoader`/`USDZLoader`, `SVGLoader`, `FontLoader`, `TTFLoader`, `ColladaLoader`, `3MFLoader`, `LDrawLoader`, `VRMLLoader`, `LUT*Loader`, `GaussianSplatPLYLoader`, `SPZLoader`, `KSPLATLoader`, `SPLATLoader`, `MaterialXLoader` |
| `exporters/` | `GLTFExporter`, `DRACOExporter`, `OBJExporter`, `PLYExporter`, `STLExporter`, `USDZExporter`, `EXRExporter`, `KTX2Exporter` |
| `postprocessing/` | WebGL `EffectComposer`, `RenderPass`, `OutputPass`, `UnrealBloomPass`, `BokehPass`, `GTAOPass`, `SAOPass`, `SSAOPass`, `SSRPass`, `OutlinePass`, `FXAAPass`, `SMAAPass`, `TAARenderPass`, `ShaderPass`, `FilmPass`, `GlitchPass`, `HalftonePass`, `LUTPass` |
| `tsl/display/` | WebGPU post-processing nodes: `BloomNode`, `GTAONode`, `SSAONode`, `SSRNode`, `SSGINode`, `DepthOfFieldNode`, `FXAANode`, `SMAANode`, `TRAANode`, `OutlineNode`, `MotionBlur`, `GodraysNode`, `DenoiseNode`, `FilmNode`, `LensflareNode`, `Lut3DNode`, `OITPassNode`, `PixelationPassNode`, `RGBShiftNode`, `DotScreenNode`, `GaussianBlurNode`, `SharpenNode`, `TransitionNode` |
| `tsl/` other | `lighting/`, `shadows/`, `math/`, `utils/`, `WebGLNodesHandler.js` |
| `geometries/` | `RoundedBoxGeometry`, `TextGeometry`, `DecalGeometry`, `ConvexGeometry`, `ParametricGeometry`, `LoftGeometry`, `BoxLineGeometry`, `TeapotGeometry` |
| `utils/` | `BufferGeometryUtils` (merge, mergeVertices, toCreasedNormals), `SkeletonUtils` (clone skinned), `SceneUtils`, `SceneOptimizer`, `CameraUtils`, `SortUtils`, `WorkerPool`, `ShadowMapViewer(GPU)`, `GeometryCompressionUtils`, `WebGPUTextureUtils` |
| `csm/` | Cascaded shadow maps for WebGL: `CSM`, `CSMHelper`; `CSMShadowNode` for WebGPU |
| `objects/` | `Sky`/`SkyMesh`, `Water`/`WaterMesh`, `Water2`/`Water2Mesh`, `Reflector`, `Refractor`, `Lensflare`/`LensflareMesh`, `MarchingCubes`, `ShadowMesh`, `GroundedSkybox`, `GaussianSplat` |
| `lights/` | `SunLight` (cascaded, WebGPU, r186), `RectAreaLightUniformsLib`, `LightProbeGenerator` |
| `lines/` | fat lines: `Line2`, `LineGeometry`, `LineMaterial`, `LineSegments2`, `Wireframe` (`lines/webgpu/` for WebGPU) |
| `modifiers/` | `SimplifyModifier` (async since r186), `EdgeSplitModifier`, `TessellateModifier`, `CurveModifier` |
| `environments/` | `RoomEnvironment`, `DebugEnvironment`, `ColorEnvironment` |
| `webxr/` | `VRButton`, `ARButton`, `XRButton`, `XRControllerModelFactory`, `XRHandModelFactory`, `XRPlanes`, `XREstimatedLight`, `OculusHand*` |
| `physics/` | thin demo wrappers `RapierPhysics`, `JoltPhysics`, `AmmoPhysics` (examples, not full engines) |
| `renderers/` | `CSS2DRenderer`, `CSS3DRenderer`, `SVGRenderer` (HTML labels/overlays) |
| `math/` | `Octree`, `OBB`, `Capsule`, `ConvexHull`, `MeshSurfaceSampler`, `SimplexNoise`, `ImprovedNoise`, `Lut` |
| `helpers/` | `ViewHelper`, `VertexNormalsHelper`, `RectAreaLightHelper`, `PositionalAudioHelper`, `OctreeHelper` |
| `animation/` | `CCDIKSolver`, `AnimationClipCreator` |
| `interactive/` | `HTMLMesh`, `InteractiveGroup`, `SelectionBox` |
| `inspector/` | `Inspector` (set `renderer.inspector = new Inspector()`, WebGPU debugging) |
| `capabilities/` | `WebGL.js`, `WebGPU.js` feature checks |
| `misc/` | `GPUComputationRenderer`, `Volume`, `Gyroscope`, `ProgressiveLightMap`, `TubePainter`, `Sculptor` |
| `libs/` | Bundled third-party: `draco/`, `basis/`, `meshopt_decoder.module.js`, `meshopt_simplifier.module.js`, `lil-gui.module.min.js`, `stats.module.js`, `tween.module.js`, `fflate.module.js` |
| `shaders/` | Shader chunks used by WebGL passes (`CopyShader`, `FXAAShader`, ...) |

Notes:
- Addon APIs are not semver-stable; they move with `three` releases (see [migration.md](migration.md)). Pin addons to the same version as `three`.
- Addons are typed by `@types/three` (`three/addons/*` paths resolve).
- Third-party copies of addons (`three-stdlib`) lag behind; prefer `three/addons` unless a package needs `three-stdlib`.
- Official tools: the online editor at https://threejs.org/editor/ (source in the repo `editor/`), the browser DevTools extension ("Three.js Developer Tools"), and the in-app `Inspector` addon.
