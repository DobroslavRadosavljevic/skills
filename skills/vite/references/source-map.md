# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: **2026-09-18**
- Package: **`vite@8.3.0`** (npm `latest`)
- Previous major tag: `previous` → **7.3.6**
- Dist-tags: `latest` 8.3.0 · `beta` 8.3.0-beta.1 · `previous` 7.3.6
- Scaffold: **`create-vite@9.2.1`** (npm `latest`; 9.2.0 added nub package-manager support)
- Engines: Node `^20.19.0 || >=22.12.0` (same floor as Vite 7/8.0)
- Bundled toolchain (Vite 8.3.0 dependencies): **Rolldown `~1.2.6`**, **Lightning CSS `^1.33.0`**, PostCSS `^8.5.28`
- Defaults (Vite 8): bundler/optimizer **Rolldown**, transform/minify JS **Oxc**, CSS minify **Lightning CSS**; CSS transformer still **PostCSS** (`css.transformer: 'lightningcss'` is experimental)
- Homepage: https://vite.dev/
- Docs ToC: https://vite.dev/llms.txt
- Repo: https://github.com/vitejs/vite
- License: MIT
- Context7 IDs: `/vitejs/vite`, `/websites/vite_dev`, `/llmstxt/vite_dev_llms-full_txt`
- Older majors: https://v7.vite.dev · https://v6.vite.dev
- Support (https://vite.dev/releases): regular patches **`vite@8.3`**; important + security **`7.3`** and **`8.2`**; security **`6.4`** and **`8.1`**

There is **no** `announcing-vite8-3` blog post. 8.3 user-facing notes live in the GitHub changelog (8.3.0 + 8.3.0-beta.0/beta.1). Architecture still comes from Vite 8.0 / 8.1 blogs.

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check versions:

   ```sh
   bunx vite --version
   bun pm ls vite
   bun info vite
   bun info create-vite
   ```

3. Prefer https://vite.dev/ and https://vite.dev/llms.txt. If docs and installed package disagree, report the mismatch.
4. Re-check experimental / RC items (Environment API, bundled Dev Mode, Lightning CSS transformer, `--app` / `builder`, DevTools).
5. For upgrades, re-read https://vite.dev/guide/migration, https://vite.dev/blog/announcing-vite8, https://vite.dev/blog/announcing-vite8-1, and https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md.

## Vite 8.3 highlights (from changelog)

Shipped 2026-09-10 as `v8.3.0` (features landed in 8.3.0-beta.0 / beta.1):

| Area | What changed |
|---|---|
| DevTools | Dev-server integration (`devtools` config). Requires `@vitejs/devtools` and Vite **8.3+**. Experimental. |
| Config | Top-level **`tsconfig`** path (discouraged — prefer per-file discovery). |
| Plugins | **`closeServer`** / **`closePreviewServer`** hooks. Warn on unsupported hooks from `applyToEnvironment`. |
| Watch | `server.watch` accepts Rolldown watch options when bundled-dev is on. |
| CLI | `--profile [name]` writes `<name>.cpuprofile`. |
| CSS | Minify `<style>` tags. Lightning CSS remains default CSS minifier. |
| Workers | Preserve search params; drop unreferenced worker chunks. |
| Imports | Subpath imports (`#…`) in dynamic `import()`. |
| Assets | `import.meta.ROLLDOWN_FILE_URL_<referenceId>` for plugin-emitted assets (JS). `__VITE_ASSET__<id>__` in CSS/HTML. |
| JSON | Warn on named imports from JSON modules (`json.namedExports` still defaults `true`). |
| Build | Avoid settling seen preload deps (perf). Treat only whole `node_modules` path segments as dependencies. |

8.2 (already in Vite 8 line): top-level **`input`**, `resolve.tsconfigPaths` no longer marked experimental.

8.1: experimental **bundled Dev Mode** (`experimental.bundledDev` / `--experimental-bundle`; formerly “Full Bundle Mode”), experimental **chunk import map**, Wasm ESM integration, Lightning CSS closer to default transformer, `import.meta.glob` `caseSensitive`, `html.additionalAssetSources`, `server.hmr` WebSocket fields → **`server.ws`**.

## Official Pages

### Guide

- Getting started: https://vite.dev/guide/
- Features: https://vite.dev/guide/features
- CLI: https://vite.dev/guide/cli
- Using plugins: https://vite.dev/guide/using-plugins
- Dep pre-bundling: https://vite.dev/guide/dep-pre-bundling
- Assets: https://vite.dev/guide/assets
- Production build: https://vite.dev/guide/build
- Env & modes: https://vite.dev/guide/env-and-mode
- SSR: https://vite.dev/guide/ssr
- Backend integration: https://vite.dev/guide/backend-integration
- Troubleshooting: https://vite.dev/guide/troubleshooting
- Performance: https://vite.dev/guide/performance
- Migration v7→v8: https://vite.dev/guide/migration
- Breaking / future: https://vite.dev/changes
- Releases: https://vite.dev/releases
- Announcing Vite 8: https://vite.dev/blog/announcing-vite8
- Announcing Vite 8.1: https://vite.dev/blog/announcing-vite8-1
- Changelog: https://github.com/vitejs/vite/blob/main/packages/vite/CHANGELOG.md

### APIs

- Plugin API: https://vite.dev/guide/api-plugin
- HMR API: https://vite.dev/guide/api-hmr
- JavaScript API: https://vite.dev/guide/api-javascript
- Environment API (RC): https://vite.dev/guide/api-environment
- Environment instances (RC): https://vite.dev/guide/api-environment-instances
- Environment plugins (RC): https://vite.dev/guide/api-environment-plugins
- Environment frameworks (RC): https://vite.dev/guide/api-environment-frameworks
- Environment runtimes (RC): https://vite.dev/guide/api-environment-runtimes

### Config

- Configuring Vite: https://vite.dev/config/
- Shared: https://vite.dev/config/shared-options
- Server: https://vite.dev/config/server-options
- Build: https://vite.dev/config/build-options
- Preview: https://vite.dev/config/preview-options
- Dep optimization: https://vite.dev/config/dep-optimization-options
- SSR: https://vite.dev/config/ssr-options
- Workers: https://vite.dev/config/worker-options

### Ecosystem

- Plugins index: https://vite.dev/plugins/
- Registry: https://registry.vite.dev
- Rolldown: https://rolldown.rs
- Oxc: https://oxc.rs
- Lightning CSS: https://lightningcss.dev
- Vite DevTools: https://devtools.vite.dev
- npm `vite`: https://www.npmjs.com/package/vite
- npm `create-vite`: https://www.npmjs.com/package/create-vite

Vite 8 docs no longer have a standalone “Rolldown Integration” guide — Rolldown is the default bundler. Vite 7 preview docs: https://v7.vite.dev/guide/rolldown

## Related official packages (aligned 2026-09-18)

| Package | npm | Role |
|---|---|---|
| `@vitejs/plugin-react` | **6.1.1** | React Fast Refresh via Oxc. Peer `vite@^8`. Optional peers: `oxc-transform-react`, `@rolldown/plugin-babel`, `babel-plugin-react-compiler`. |
| `@vitejs/plugin-react-swc` | **4.3.3** | React via SWC (`vite@^4 \|\| ^5 \|\| ^6 \|\| ^7 \|\| ^8`) |
| `@vitejs/plugin-vue` | **6.0.9** | Vue 3 SFC |
| `@vitejs/plugin-vue-jsx` | **5.1.6** | Vue JSX |
| `@vitejs/plugin-legacy` | **8.2.3** | Legacy browsers. **No ES5 lowering** on Rolldown. Prefers Oxc minifier. |
| `@vitejs/plugin-rsc` | **0.5.35** | RSC primitives (Environment API). Still 0.x. |
| `@vitejs/plugin-basic-ssl` | **2.3.0** | Dev HTTPS certs |
| `@vitejs/devtools` | **0.7.5** | Optional Vite peer (`^0.7.1`). Enable with `devtools` in **user** config. Also `@vitejs/devtools-vite` / `-rolldown` / `-oxc` (optional). |

## Package exports (`vite@8.3.0`)

`.` (Node API), `./client` (types), `./module-runner`, `./internal`, `./dist/client/*`, `./types/*`, `./package.json`. `./types/internal/*` is `null`.

Useful named exports: `defineConfig`, `loadEnv`, `createServer`, `build`, `preview`, `transformWithOxc` (prefer over deprecated `transformWithEsbuild`), `esmExternalRequirePlugin`, `normalizePath`, `mergeConfig`, `version`, `rolldownVersion`.

Optional/peer tooling Vite may use: `esbuild` (only if you force esbuild minify/transform), `terser`, CSS preprocessors (`sass-embedded` / `sass` / `less` / `stylus`), `@vitejs/devtools`.
