# Source Map

Docs and package snapshot used to create this skill.

## Snapshot

- Captured: 2026-07-30
- Package: **`vite@8.2.0`** (npm `latest`)
- Previous major tag: `previous` → **7.3.6**
- Scaffold: `create-vite@9.1.2`
- Engines: Node `^20.19.0 || >=22.12.0`
- Defaults (Vite 8): bundler/optimizer **Rolldown**, transform/minify JS **Oxc**, CSS minify **Lightning CSS**
- Homepage: https://vite.dev/
- Docs ToC: https://vite.dev/llms.txt
- Repo: https://github.com/vitejs/vite
- License: MIT
- Context7 IDs: `/vitejs/vite`, `/websites/vite_dev`, `/llmstxt/vite_dev_llms-full_txt`
- Older majors: https://v7.vite.dev · https://v6.vite.dev

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check versions:

   ```sh
   bunx vite --version
   bun pm ls vite
   # or: npm view vite version
   ```

3. Prefer https://vite.dev/ and https://vite.dev/llms.txt. If docs and installed package disagree, report the mismatch.
4. Re-check experimental / RC items (Environment API, Full Bundle Mode, Lightning CSS transformer, `--app`).
5. For upgrades, re-read https://vite.dev/guide/migration and https://vite.dev/blog/announcing-vite8.

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
- Announcing Vite 8: https://vite.dev/blog/announcing-vite8

### APIs

- Plugin API: https://vite.dev/guide/api-plugin
- HMR API: https://vite.dev/guide/api-hmr
- JavaScript API: https://vite.dev/guide/api-javascript
- Environment API (RC): https://vite.dev/guide/api-environment

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
- npm `vite`: https://www.npmjs.com/package/vite

## Related official packages (aligned ~2026-07-30)

| Package | Role |
|---|---|
| `@vitejs/plugin-react` | React Fast Refresh (Oxc) |
| `@vitejs/plugin-react-swc` | React via SWC |
| `@vitejs/plugin-vue` | Vue 3 SFC |
| `@vitejs/plugin-vue-jsx` | Vue JSX |
| `@vitejs/plugin-legacy` | Legacy browsers (no ES5 lowering on Rolldown) |
| `@vitejs/plugin-rsc` | RSC primitives (Environment API) |
| `@vitejs/plugin-basic-ssl` | Dev HTTPS certs |

## Package exports (`vite@8.2.0`)

`.` (Node API), `./client` (types), `./module-runner`, `./internal`, `./dist/client/*`, `./types/*`
