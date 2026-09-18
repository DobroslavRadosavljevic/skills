---
name: vite
description: "Build, review, debug, configure, migrate, teach, or plan Vite 8.3 frontend tooling with current docs and a full usage guide. Use for vite, create-vite, vite.config, defineConfig, loadEnv, import.meta.env, HMR, optimizeDeps, build.rolldownOptions, oxc, Lightning CSS, Rolldown, DevTools, bundledDev, plugins (@vitejs/plugin-react, plugin-vue, plugin-legacy), SSR middlewareMode, ssrLoadModule, library mode, backend integration, multi-page apps, Environment API (RC), and Vite 7 to Vite 8 / Rolldown migration."
---

# Vite

Use this skill when work touches Vite: scaffolding, `vite.config`, plugins, env/modes, dep optimization, production builds, SSR/backend integration, library mode, DevTools, or upgrading to Vite 8 (Rolldown/Oxc/Lightning CSS).

Snapshot: `vite@8.3.0`, `create-vite@9.2.1` (2026-09-18). Refresh from [source-map.md](references/source-map.md) if versions differ.

## Workflow

1. Inspect the local Vite surface:
   - Package version (`vite@8.x` preferred; snapshot **8.3.0**). Node: `^20.19.0 || >=22.12.0`.
   - Config: `vite.config.ts` / `.js`, `defineConfig`, plugins, `appType`, top-level `input`.
   - Defaults in use: **Rolldown** (bundle + optimize) + **Oxc** (transform/minify) + **Lightning CSS** (CSS minify). Vite 7- used esbuild/Rollup.
   - Scripts: `vite` / `vite build` / `vite preview`; framework plugins (`@vitejs/plugin-*`).
2. For day-to-day how-to, follow [usage-guide.md](references/usage-guide.md) first.
3. Refresh docs when versions drift or the task is migration/SSR/Environment API/DevTools. Start from [source-map.md](references/source-map.md).
4. Route deeper detail:
   - Config, CLI, env, assets, CSS, HMR: [config-cli-env.md](references/config-cli-env.md).
   - Plugins, build, lib mode, MPA, performance, DevTools: [plugins-build.md](references/plugins-build.md).
   - SSR, backend integration, proxy, middleware: [ssr-backend.md](references/ssr-backend.md).
   - Vite 7→8 / Rolldown: [migration-v8.md](references/migration-v8.md).
5. Prefer Vite 8 APIs (`build.rolldownOptions`, `oxc`, `optimizeDeps.rolldownOptions`). Treat **Environment API as RC**. Treat **bundled Dev Mode**, **Lightning CSS as full transformer**, **`--app` / `builder`**, and **DevTools** as **experimental**.
6. Verify with `bunx vite build` (or project scripts), `vite preview`, and separate `tsc --noEmit` when types matter.

## Core Judgment

- Vite = **dev server (native ESM + HMR)** + **production bundler**. Vite 8 defaults: bundler/optimizer **Rolldown** (`rolldown@~1.2.6` in 8.3.0); JS transform/minify **Oxc**; CSS minify **Lightning CSS**. PostCSS remains the default CSS *transformer*.
- Prefer **`bunx vite`** / **`bun create vite`** in command examples; keep narrative npm registry references when describing packages.
- `index.html` is the app entry (not under `public/`). `public/` is copy-as-is static files. Non-HTML entries: set top-level `input` (used in dev and build).
- Vite **does not typecheck** — run `tsc --noEmit` (or project typecheck) separately. Oxc transpiles only.
- Client env: only `envPrefix` (default **`VITE_`**) reaches `import.meta.env`. Never put secrets in `VITE_*`.
- Config files do **not** auto-load `.env` — use `loadEnv` inside `defineConfig`.
- Prefer `build.rolldownOptions` over deprecated `build.rollupOptions`; prefer `oxc` over deprecated `esbuild` config; prefer `server.ws` over deprecated WebSocket fields on `server.hmr`.
- Chunk splitting: object `manualChunks` **removed**; function form **deprecated** → Rolldown **`output.codeSplitting`**.
- `vite preview` is **not** a production server — use it only to smoke `dist`.
- Dep cache: `node_modules/.vite`; force with `vite --force` (do not rely on deprecated `vite optimize`).
- Official plugins live under `@vitejs/*`. PWA (`vite-plugin-pwa`) is community.
- Environment API stays **RC** (stability between majors; some APIs still experimental). SPA/MPA apps usually need not configure `environments`. Prefer `ssrLoadModule` unless a framework already uses Module Runner.
- SSR/backend: enforce real security/auth on the host server; Vite middleware is a tooling layer.

## Verification

Prefer repository-owned commands. For meaningful Vite work, cover the relevant subset:

- `bunx vite --version` (or project `vite`) and confirm major (7 vs 8) and minor (8.3 vs older 8.x).
- Dev smoke: `bun run dev` / HMR for the changed module.
- `bun run build` then `bun run preview` (or equivalent).
- Typecheck separately when TS/paths/`import type` matter.
- After config migration: confirm no remaining `manualChunks` object form; Rolldown options resolve via `configResolved` if debugging.
- SSR: client + server builds; middleware mode smoke; `import.meta.env.SSR` branches.
- Backend integration: manifest entries render correct CSS/JS URLs.

Report which checks ran, which did not, and any Vite version assumptions that remain.
