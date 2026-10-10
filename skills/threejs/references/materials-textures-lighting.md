# Materials, Textures, Color, Lighting

## Color management (defaults since r152)

- `THREE.ColorManagement.enabled = true` by default: hex/CSS colors are sRGB and converted to the Linear-sRGB working space. `Color` RGB/HSL components are never converted implicitly (`convertSRGBToLinear()` / `convertLinearToSRGB()`).
- `renderer.outputColorSpace` defaults to `SRGBColorSpace`.
- Texture `colorSpace`:
  - sRGB color images (`map`, `emissiveMap`, `specularColorMap`): `texture.colorSpace = THREE.SRGBColorSpace`
  - Linear HDR (EXR/HDR): `LinearSRGBColorSpace`
  - Data maps (`normalMap`, `roughnessMap`, `metalnessMap`, `aoMap`, `displacementMap`): `NoColorSpace` (default)
- glTF textures are tagged by `GLTFLoader`.
- Custom `ShaderMaterial` must apply output conversion itself (`#include <colorspace_fragment>` at the end of `main`). `WebGPURenderer` node materials handle it.
- Symptoms: too dark means missing sRGB tag; too bright/washed means double conversion (common with post-processing without a single output pass).
- Render targets use the working color space since r184.

## Tone mapping

`renderer.toneMapping`: `NoToneMapping` (default), `LinearToneMapping`, `ReinhardToneMapping`, `CineonToneMapping`, `ACESFilmicToneMapping`, `AgXToneMapping`, `NeutralToneMapping`. `renderer.toneMappingExposure` scales exposure. Tone mapping is applied only when rendering to the screen (or in the output/`renderOutput` stage of post-processing). `NeutralToneMapping` keeps product colors closest to authored values.

## Materials

| Material | Use |
| --- | --- |
| `MeshBasicMaterial` | Unlit, flat |
| `MeshLambertMaterial` / `MeshPhongMaterial` | Cheap lit, no PBR |
| `MeshStandardMaterial` | PBR metal/roughness (default choice) |
| `MeshPhysicalMaterial` | Standard plus clearcoat, sheen, transmission, iridescence, anisotropy, specular, thickness; r186 adds retroreflectivity |
| `MeshToonMaterial`, `MeshMatcapMaterial`, `MeshNormalMaterial`, `MeshDepthMaterial` | Stylized / debug |
| `PointsMaterial`, `LineBasicMaterial`, `LineDashedMaterial`, `SpriteMaterial` | Points, lines, sprites |
| `ShaderMaterial` / `RawShaderMaterial` | Custom GLSL (WebGLRenderer only) |
| `*NodeMaterial` (`MeshStandardNodeMaterial`, ...) | TSL node graphs (see [webgpu-tsl.md](webgpu-tsl.md)) |

Key properties: `color`, `map`, `roughness`, `metalness`, `normalMap`, `aoMap` / `lightMap` (use `texture.channel = 1` for the second UV set), `emissive`, `envMapIntensity` (use `scene.environmentIntensity` for scene-wide), `transparent`, `opacity`, `alphaTest` (cheaper than blending), `side`, `depthWrite`, `flatShading`. Changing `defines`-affecting properties (adding a map, `flatShading`, `side` between Front/Double on some paths) needs `material.needsUpdate = true`.

Transmission (`MeshPhysicalMaterial.transmission`) renders the scene twice-ish; use sparingly. Sort transparent objects with `renderOrder` or `depthWrite = false`.

Custom GLSL hooks (WebGLRenderer): `onBeforeCompile` patches chunks; set `customProgramCacheKey`. Not supported on `WebGPURenderer`.

## Textures

```js
const tex = await new THREE.TextureLoader().loadAsync('/albedo.jpg');
tex.colorSpace = THREE.SRGBColorSpace;
tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
tex.generateMipmaps = true; // default; needs power-of-two NOT required on WebGL2
```

- Power-of-two sizes are not required in WebGL 2 but help GPU packing and compression.
- Prefer **KTX2 (Basis Universal)** for large textures: GPU-compressed, mipmapped, small download. Use `KTX2Loader` with `detectSupport(renderer)`; generate with `gltf-transform`/`gltfpack`/`toktx`. Init the renderer first with WebGPU (`await renderer.init()`); `detectSupportAsync` is deprecated (r181).
- Free CPU copies of big images with `ImageBitmapLoader` or after upload; call `texture.dispose()` when unused.
- `CanvasTexture`, `VideoTexture`, `DataTexture`, `Data3DTexture`, `CompressedTexture`, `CubeTexture`, `DepthTexture`, `HTMLTexture` (r184). `Source` is renamed `TextureSource` (r186).
- Update a dynamic texture with `texture.needsUpdate = true`.

## Environment and IBL

```js
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js';   // was RGBELoader (renamed r180)
const env = await new HDRLoader().loadAsync('/studio.hdr');
env.mapping = THREE.EquirectangularReflectionMapping;
scene.environment = env;       // image-based lighting for PBR
scene.background = env;        // optional skybox
scene.backgroundBlurriness = 0.1;
scene.environmentIntensity = 1;
```

- Procedural studio light without assets: `RoomEnvironment` + `PMREMGenerator`:

```js
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
pmrem.dispose();
```

- `PMREMGenerator.fromEquirectangular(tex)` converts HDRI for roughness-correct reflections (also done automatically for `scene.environment` equirect maps). r186 uses spiral blur; r187 dev bases PMREM on cube render targets (`CubeUVReflectionMapping` removed) so reflections differ slightly across versions.
- `EXRLoader`, `UltraHDRLoader`, `HDRCubeTextureLoader` are other HDR options. `RGBMLoader` was removed.
- Background and environment rotation matches object rotation since r184 (`scene.backgroundRotation`, `environmentRotation`).

## Lights (physical units since r155)

| Light | Notes |
| --- | --- |
| `AmbientLight`, `HemisphereLight` | Cheap fill; no shadows |
| `DirectionalLight` | Sun; intensity in lux; shadow camera is orthographic |
| `PointLight` | candela; `decay = 2` default; cube shadow (6 renders) is costly |
| `SpotLight` | candela; `angle`, `penumbra`; one shadow pass |
| `RectAreaLight` | Needs `RectAreaLightUniformsLib.init()` (WebGL), no shadows, Standard/Physical only |
| `LightProbe` | SH ambient from env |

Old pre-r155 intensities (e.g. `1`) are far too dim for point/spot lights; scale up (tens to hundreds) or use `scene.environment`. Many dynamic lights are expensive on WebGLRenderer (per-light shader cost); `WebGPURenderer` has clustered (Forward+) lighting (r185, `ClusteredLighting`; `TiledLighting` was removed).

## Shadows

```js
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;   // soft since r182; PCFSoftShadowMap deprecated/removed for WebGPU
// also VSMShadowMap, BasicShadowMap
light.castShadow = true;
light.shadow.mapSize.set(2048, 2048);
Object.assign(light.shadow.camera, { near: 0.5, far: 50, left: -10, right: 10, top: 10, bottom: -10 });
light.shadow.camera.updateProjectionMatrix();
light.shadow.bias = -0.0005;
light.shadow.normalBias = 0.02;
mesh.castShadow = true; floor.receiveShadow = true;
scene.add(new THREE.CameraHelper(light.shadow.camera)); // debug the frustum
```

- Fit the shadow camera tightly; resolution is wasted on empty space.
- Fix acne with `normalBias` first, `bias` second. `WebGPURenderer` shadows changed in r183: reduce bias values.
- Static scenes: `renderer.shadowMap.autoUpdate = false; renderer.shadowMap.needsUpdate = true;` when needed.
- Cascaded shadows: `SunLight` addon (r186, WebGPU) for large outdoor scenes.
