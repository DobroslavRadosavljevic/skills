# Source Map

Snapshot date: 2026-08-06.

This reference records the current docs and package evidence used to create the skill. Refresh these sources whenever the user asks for latest behavior, when package versions differ, or when work touches SSR, testing, route generation, auth, search params, or data loading.

## Documentation Sources

Context7 resolution:

- Selected docs surface: `/websites/tanstack_router_v1`.
- Other relevant match: `/tanstack/router`, which has more snippets but may include version-specific package snapshots.
- CLI scaffolding: `/tanstack/cli` for `@tanstack/cli create --router-only`.

Official public docs:

- Overview: https://tanstack.com/router/latest/docs/framework/react/overview
- Quick start: https://tanstack.com/router/latest/docs/framework/react/quick-start
- Manual setup: https://tanstack.com/router/latest/docs/framework/react/installation/manual
- Vite setup: https://tanstack.com/router/latest/docs/framework/react/installation/with-vite
- Router CLI setup: https://tanstack.com/router/latest/docs/framework/react/installation/with-router-cli
- File-based routing: https://tanstack.com/router/latest/docs/framework/react/routing/file-based-routing
- File naming conventions: https://tanstack.com/router/latest/docs/framework/react/routing/file-naming-conventions
- Routing concepts (pathless layouts, `-` colocation): https://tanstack.com/router/latest/docs/framework/react/routing/routing-concepts
- File-based routing API (`routeFileIgnorePrefix`): https://tanstack.com/router/latest/docs/framework/react/api/file-based-routing
- Route trees: https://tanstack.com/router/latest/docs/framework/react/routing/route-trees
- Code-based routing: https://tanstack.com/router/latest/docs/framework/react/routing/code-based-routing
- Virtual file routes: https://tanstack.com/router/latest/docs/framework/react/routing/virtual-file-routes
- Route matching: https://tanstack.com/router/latest/docs/framework/react/routing/route-matching
- Navigation: https://tanstack.com/router/latest/docs/framework/react/guide/navigation
- Link options: https://tanstack.com/router/latest/docs/framework/react/guide/link-options
- Path params: https://tanstack.com/router/latest/docs/framework/react/guide/path-params
- Search params: https://tanstack.com/router/latest/docs/framework/react/guide/search-params
- Custom search serialization: https://tanstack.com/router/latest/docs/framework/react/guide/custom-search-param-serialization
- Data loading: https://tanstack.com/router/latest/docs/framework/react/guide/data-loading
- External data loading: https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading
- TanStack Query integration: https://tanstack.com/router/latest/docs/framework/react/integrations/query
- Deferred data loading: https://tanstack.com/router/latest/docs/framework/react/guide/deferred-data-loading
- Preloading: https://tanstack.com/router/latest/docs/framework/react/guide/preloading
- Router context: https://tanstack.com/router/latest/docs/framework/react/guide/router-context
- Authenticated routes: https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes
- Not-found errors: https://tanstack.com/router/latest/docs/framework/react/guide/not-found-errors
- Render optimizations: https://tanstack.com/router/latest/docs/framework/react/guide/render-optimizations
- History types: https://tanstack.com/router/latest/docs/framework/react/guide/history-types
- Route masking: https://tanstack.com/router/latest/docs/framework/react/guide/route-masking
- SSR: https://tanstack.com/router/latest/docs/framework/react/guide/ssr
- Devtools: https://tanstack.com/router/latest/docs/framework/react/devtools
- ESLint plugin: https://tanstack.com/router/latest/docs/framework/react/eslint/eslint-plugin-router
- Setup testing: https://tanstack.com/router/latest/docs/framework/react/how-to/setup-testing
- Test file-based routing: https://tanstack.com/router/latest/docs/framework/react/how-to/test-file-based-routing
- Deploy to production: https://tanstack.com/router/latest/docs/framework/react/how-to/deploy-to-production
- Migrate from React Router: https://tanstack.com/router/latest/docs/framework/react/installation/migrate-from-react-router

Official raw-doc mirrors used for spot checks:

- https://raw.githubusercontent.com/TanStack/router/main/docs/router/overview.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/quick-start.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/installation/manual.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/installation/with-vite.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/routing/file-based-routing.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/routing/file-naming-conventions.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/routing/route-trees.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/routing/route-matching.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/navigation.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/link-options.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/path-params.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/search-params.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/data-loading.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/router-context.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/authenticated-routes.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/not-found-errors.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/preloading.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/deferred-data-loading.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/external-data-loading.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/integrations/query.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/ssr.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/history-types.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/devtools.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/guide/render-optimizations.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/how-to/setup-testing.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/how-to/test-file-based-routing.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/how-to/deploy-to-production.md
- https://raw.githubusercontent.com/TanStack/router/main/docs/router/eslint/eslint-plugin-router.md

## Package Snapshot

Latest npm `latest` dist-tags observed on 2026-08-06:

- `@tanstack/react-router`: `1.170.20`
- `@tanstack/router-core`: `1.171.17`
- `@tanstack/router-plugin`: `1.168.25`
- `@tanstack/router-cli`: `1.167.23`
- `@tanstack/react-router-devtools`: `1.167.1`
- `@tanstack/react-router-ssr-query`: `1.167.1`
- `@tanstack/eslint-plugin-router`: `1.162.0`
- `@tanstack/zod-adapter`: `1.167.0`
- `@tanstack/cli`: `0.70.1`

Related Start packages (not Router SPA deps; noted for SSR/Start adjacency):

- `@tanstack/react-start`: `1.168.37` (`latest`; Start still not documented as stable 1.0)

## Current Status Notes

- TanStack Router supports React and Solid. This skill focuses on React and `@tanstack/react-router` unless the repo is clearly Solid.
- React requires React 18 or later with `createRoot`; TypeScript 5.3 or higher is recommended.
- File-based routing is the preferred and recommended route configuration for most projects. Code-based routes remain fully supported.
- Official quick start scaffolds with `@tanstack/cli create --router-only` (interactive prompts for file/code routes, TypeScript, Tailwind, toolchain, Git).
- Router provides typed navigation, typed JSON-first search params, path/search validation, nested layouts, route loaders with SWR caching, preloading, error boundaries, route masking, custom history, and SSR support.
- As of `@tanstack/react-router@1.170.19`, match loading uses a lane-based scheduler; documented `gcTime` / `preloadGcTime` defaults are **5 minutes** (`300_000`), matching runtime. `router.invalidate()` retires matching active preload lanes.
- SSR APIs remain documented as experimental because they share underlying implementation with TanStack Start before Start reaches stable status.

## Refresh Triggers

Refresh docs before editing or answering when:

- The user says latest, current, migration, SSR, streaming, Start, route generation, CLI, Vite plugin, Rspack, Webpack, Esbuild, deployment, testing, or production.
- The task touches route-tree generation, file naming, `routeTree.gen.ts`, `validateSearch`, path param parsing, `loaderDeps`, `beforeLoad`, route context, auth, Query integration, SSR, error/not-found boundaries, route masking, or production rewrites.
- The local package versions differ meaningfully from the snapshot.
