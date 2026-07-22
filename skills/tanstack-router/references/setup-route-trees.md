# Setup And Route Trees

Use this reference for installation, file-based routing, code-based routing, route naming, route trees, generated files, and setup pitfalls.

## Starting A Router App

Use TanStack CLI for a new router-only project:

```bash
bunx @tanstack/cli@latest create --router-only
```

The CLI asks for file-based or code-based routing, TypeScript, Tailwind, toolchain setup, and Git initialization.

Do not install packages without approval when repo policy requires package-safety review.

## Existing React App Requirements

For React:

- `react` 18 or later.
- `react-dom` 18 or later.
- TypeScript 5.3 or higher is recommended.
- Install `@tanstack/react-router`.

For file-based route generation, install `@tanstack/router-plugin` as a development dependency.

Add devtools when useful:

```bash
bun add @tanstack/react-router @tanstack/react-router-devtools
bun add -d @tanstack/router-plugin
```

## Vite Plugin

For file-based routing with Vite, add the Router plugin before React:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { tanstackRouter } from '@tanstack/router-plugin/vite'

export default defineConfig({
  plugins: [
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
    }),
    react(),
  ],
})
```

Useful plugin defaults:

```json
{
  "routesDirectory": "./src/routes",
  "generatedRouteTree": "./src/routeTree.gen.ts",
  "routeFileIgnorePrefix": "-",
  "quoteStyle": "single"
}
```

Respect any local plugin options before changing file names or generated paths.

## Generated Route Tree

The generated route tree is normally `src/routeTree.gen.ts`.

- It is generated during bundler dev/build or via Router CLI commands such as `tsr watch` and `tsr generate`.
- It should be ignored by formatters and linters where possible.
- Do not hand-edit it.
- If it opens with transient errors in VS Code after route renames, mark it readonly and exclude it from search/watch in workspace settings if the repo allows that.

## Minimal File-Based Shape

Typical files:

```text
src/
  main.tsx
  routeTree.gen.ts
  routes/
    __root.tsx
    index.tsx
    about.tsx
```

Root route:

```tsx
import { createRootRoute, Link, Outlet } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: RootLayout,
})

function RootLayout() {
  return (
    <>
      <nav>
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
      </nav>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  )
}
```

Route file:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/about')({
  component: AboutRoute,
})

function AboutRoute() {
  return <div>About</div>
}
```

Router creation:

```tsx
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

const router = createRouter({ routeTree })

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

root.render(<RouterProvider router={router} />)
```

For SSR, expose a `createRouter()` factory instead of a singleton so each request can get isolated state.

## File Naming

Important file naming conventions:

| Pattern | Meaning |
| --- | --- |
| `__root.tsx` | Required root route file at the root of `routesDirectory`. |
| `index.tsx` | Exact index route for the parent path. |
| `.` separator | Creates nested route structure in flat file names. |
| `$param` | Dynamic path param. |
| `$` | Splat or wildcard param, exposed as `_splat`. |
| `_prefix` | Pathless layout route. |
| `suffix_` | Excludes the route from nesting under parent routes. |
| `-prefix` | Excludes file or folder from the route tree. |
| `(folder)` | Route group; omitted from URL path. |
| `[x]` | Escapes routing-special characters, such as `script[.]js.tsx`. |
| `route.tsx` | Directory route file for the directory path. |

Examples:

```text
routes/
  __root.tsx
  index.tsx
  posts.tsx
  posts.index.tsx
  posts.$postId.tsx
  posts.$postId.edit.tsx
  _authenticated.tsx
  _authenticated.dashboard.tsx
  files.$.tsx
  script[.]js.tsx
```

## Route Trees

TanStack Router uses a nested route tree to match URLs and render nested components. File-based and code-based routes support the same core features, but file-based routing requires less manual type linkage.

Route matching is sorted by specificity, regardless of declaration order:

1. Index routes.
2. Static routes, most specific first.
3. Dynamic routes, longest first.
4. Splat or wildcard routes.

Use pathless routes for shared layout or route middleware without adding a URL segment. Use route groups to organize files without affecting the path.

## Code-Based Routes

Use code-based routes when the repo already owns route trees manually, when routes are generated from a non-filesystem source, or when the user explicitly wants programmatic configuration.

```tsx
import {
  Link,
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

const rootRoute = createRootRoute({
  component: () => (
    <>
      <Link to="/">Home</Link>
      <Outlet />
    </>
  ),
})

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <div>Home</div>,
})

const routeTree = rootRoute.addChildren([indexRoute])
const router = createRouter({ routeTree })
```

Split code-based route definitions across files as apps grow; avoid a single giant route-definition file.

## Devtools

Install `@tanstack/react-router-devtools` and render `TanStackRouterDevtools` near the root route in development. The standard `TanStackRouterDevtools` import is hidden in production; use `TanStackRouterDevtoolsInProd` only when production devtools are intentionally required.
