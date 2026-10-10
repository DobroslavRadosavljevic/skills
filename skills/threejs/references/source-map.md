# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: **2026-10-10**
- Package: **`three@0.186.1`** (npm `latest`, published 2026-09-24) = release **r186** (GitHub tag `r186`, 2026-09-24T14:35Z; `0.186.0` 2026-09-08)
- Types: **`@types/three@0.186.0`** (2026-10-04). Keep minor aligned with `three`.
- Exports: `three`, `three/webgpu`, `three/tsl`, `three/addons`, `three/addons/*`, `three/src/*`, `three/examples/jsm/*`. License MIT.
- Prior releases: r185 (2026-07-01, `0.185.0`), r184 (2026-04-16), r183 (2026-02-20).
- React integration: `@react-three/fiber@9.8.1` (peers: react `>=19 <19.4`, three `>=0.156`), `@react-three/drei@10.7.9` (react ^19, three `>=0.159`, fiber ^9).
- Repo: https://github.com/mrdoob/three.js
- Context7 IDs: `/mrdoob/three.js`, `/websites/threejs`, `/llmstxt/threejs_llms-full_txt`
- Raw manual sources (the `threejs.org/manual/en/*.html` paths 404; manual pages live under `manual/pages/` in the repo): https://github.com/mrdoob/three.js/tree/dev/manual/pages

## Official URLs

- Site: https://threejs.org/
- Manual: https://threejs.org/manual/ (anchors like `#installation`, `#color-management`, `#webgpurenderer`, `#webgpu-postprocessing`, `#animation-system`, `#how-to-dispose-of-objects`)
- API docs: https://threejs.org/docs/ (WebGPURenderer: `#WebGPURenderer`; TSL: `#TSL`)
- Examples: https://threejs.org/examples/ (WebGPU and WebGL example sets; source in `examples/` of the repo)
- TSL playground and guide: https://threejs.org/tsl/ ; guide source `tsl/content/Guide.md`
- LLM-oriented docs: `docs/llms.txt`, `docs/llms-full.txt` in the repo (dev branch)
- Migration guide: https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Releases: https://github.com/mrdoob/three.js/releases (API: `https://api.github.com/repos/mrdoob/three.js/releases`)
- TSL wiki: https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language
- npm: https://www.npmjs.com/package/three ; types https://www.npmjs.com/package/@types/three
- R3F: https://r3f.docs.pmnd.rs/ ; drei: https://drei.docs.pmnd.rs/

## Refresh procedure

```sh
bun info three version time.modified dist-tags
bun info @types/three version
bun pm ls three
```

1. Check GitHub releases for the newest `rNNN` and read its notes.
2. Read the new section at the end of the Migration Guide wiki.
3. Query Context7 `/mrdoob/three.js` for changed APIs (WebGPURenderer, TSL, RenderPipeline).
4. Update the snapshot lines in `SKILL.md` and this file; add new migration entries to [migration.md](migration.md).

## Evidence notes

- Migration entries for r180 through r186 (and the r187 dev section) come from the Migration Guide wiki.
- r183 to r186 feature lists come from GitHub release notes; r186 notes do not mention `Timer` (introduced r183).
- WebGPURenderer fallback, `forceWebGL`, limitations, import-map, and RenderPipeline details come from `manual/pages/webgpurenderer.html` and `webgpu-postprocessing.html`.
- Color management details come from `manual/pages/color-management.html`.
- Items to re-verify on upgrade: backend detection property name, R3F + WebGPU wiring, bundler alias of `three` to `three/webgpu`, TSL update-hook helper names.
