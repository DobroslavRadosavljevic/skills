# Production, SSR, Testing, And Tooling

Use this reference for SSR, production hosting, tests, devtools, ESLint, migrations, and verification.

## SPA Production Rewrites

For client-rendered Router SPAs, configure the host to serve `index.html` for all application routes. Without rewrites, direct deep links usually 404 before the client router can handle them.

Netlify `_redirects`:

```text
/* /index.html 200
```

Netlify `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[build]
  publish = "dist"
  command = "bun run build"
```

Cloudflare Pages `_redirects`:

```text
/* /index.html 200
```

Vercel `vercel.json`:

```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

Nginx:

```nginx
location / {
  try_files $uri $uri/ /index.html;
}
```

GitHub Pages commonly needs `dist/404.html` copied from `dist/index.html`.

If the app uses TanStack Start or custom SSR, follow Start/SSR host-specific docs instead of applying plain SPA rewrites blindly.

## SSR

TanStack Router SSR APIs are documented as experimental while Start is not fully stable. Verify current docs before changing SSR code.

For SSR, create routers via a factory:

```tsx
import { createRouter as createTanStackRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createRouter() {
  return createTanStackRouter({ routeTree })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createRouter>
  }
}
```

Server render with request handler:

```tsx
import {
  createRequestHandler,
  defaultRenderHandler,
} from '@tanstack/react-router/ssr/server'
import { createRouter } from './router'

export async function render({ request }: { request: Request }) {
  const handler = createRequestHandler({ request, createRouter })
  return await handler(defaultRenderHandler)
}
```

Client hydrate:

```tsx
import { hydrateRoot } from 'react-dom/client'
import { RouterClient } from '@tanstack/react-router/ssr/client'
import { createRouter } from './router'

hydrateRoot(document, <RouterClient router={createRouter()} />)
```

For streaming, use `defaultStreamHandler` or `renderRouterToStream`.

SSR automatically uses server-appropriate history through RouterServer. For client-only or tests, browser/hash/memory history can still be configured explicitly.

Data serialization supports common values such as `undefined`, `Date`, `Error`, and `FormData`. Complex values such as `Map`, `Set`, and `BigInt` may need custom handling.

Avoid wrong-framework code in Router apps:

- Do not create `src/pages`, Next `app/layout.tsx`, `_app/index.tsx`, `getServerSideProps`, or `getStaticProps`.
- Do not import Router primitives from `react-router-dom` or Next.
- Use `src/routes`, `createFileRoute`, `Link`, `useNavigate`, and `redirect` from `@tanstack/react-router`.

## Query SSR

For Router plus TanStack Query SSR, prefer `@tanstack/react-router-ssr-query`:

```tsx
import { QueryClient } from '@tanstack/react-query'
import { createRouter } from '@tanstack/react-router'
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query'

export function getRouter() {
  const queryClient = new QueryClient()
  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: 'intent',
  })

  setupRouterSsrQueryIntegration({ router, queryClient })
  return router
}
```

Create a fresh `QueryClient` per SSR request. Pass `wrapQueryClient: false` if the app already owns its provider. Use `dehydrateOptions` and `hydrateOptions` when payload filtering or custom serialization is needed.

## Testing File-Based Routes

For file-based routing tests:

- Include `tanstackRouter()` in the test/build plugin path when route generation is needed.
- Import the generated `routeTree` for integration tests.
- Use `createMemoryHistory` for deterministic initial locations.
- Provide required router context.

Example utility:

```tsx
import { render } from '@testing-library/react'
import {
  RouterProvider,
  createMemoryHistory,
  createRouter,
} from '@tanstack/react-router'
import { routeTree } from '../routeTree.gen'

export function renderWithFileRoutes(initialLocation = '/', context = {}) {
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({
      initialEntries: [initialLocation],
    }),
    context,
  })

  return {
    router,
    ...render(<RouterProvider router={router} />),
  }
}
```

Test:

- Route tree exists and includes expected paths.
- Direct initial locations render correct routes.
- Dynamic params are parsed.
- Search validation normalizes malformed input.
- Layout and pathless routes wrap children.
- Links and imperative navigation update router state.
- Loaders run and expose data.
- Error and not-found boundaries render correctly.

## Testing Code-Based Routes

Use code-based route factories with `createRootRoute`, `createRoute`, and either browser or memory history:

```tsx
import {
  RouterProvider,
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
} from '@tanstack/react-router'

const rootRoute = createRootRoute()
const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: () => <h1>Home</h1>,
})

const router = createRouter({
  routeTree: rootRoute.addChildren([indexRoute]),
  history: createMemoryHistory({ initialEntries: ['/'] }),
})
```

Reset history, mocks, and rendered DOM between tests. Use Testing Library user events for navigation behavior rather than only asserting router internals.

## Devtools

Install `@tanstack/react-router-devtools`.

```tsx
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

export const Route = createRootRoute({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools initialIsOpen={false} />
    </>
  ),
})
```

The normal devtools import is hidden in production. Use `TanStackRouterDevtoolsInProd` only when intentionally exposing devtools in production-like environments.

## ESLint

Install `@tanstack/eslint-plugin-router` to enforce Router best practices.

Flat config:

```js
import pluginRouter from '@tanstack/eslint-plugin-router'

export default [
  ...pluginRouter.configs['flat/recommended'],
]
```

Custom flat config:

```js
import pluginRouter from '@tanstack/eslint-plugin-router'

export default [
  {
    plugins: {
      '@tanstack/router': pluginRouter,
    },
    rules: {
      '@tanstack/router/create-route-property-order': 'error',
    },
  },
]
```

If using `@typescript-eslint/only-throw-error`, allow TanStack Router's throwable redirect and not-found objects from `@tanstack/router-core`.

## Migration Notes

From React Router:

- Replace `BrowserRouter`/`Routes`/`Route` trees with `createRouter` plus file-based or code-based TanStack routes.
- Replace `react-router-dom` `Link`, `useNavigate`, and redirects with TanStack Router primitives.
- Move route data logic to `beforeLoad`, `loaderDeps`, and `loader`.
- Add `validateSearch` for URL search state.
- Replace path string interpolation with typed `to`, `params`, and `search` options.
- Rebuild tests around generated route trees or explicit route factories.

From Next/Remix:

- Do not copy framework-specific `pages`, `app`, `getServerSideProps`, `getStaticProps`, `loader` export, or `action` export patterns into Router.
- Use TanStack Start if the app needs full-stack server functions/routes and integrated SSR deployment.

## Production Verification

Before calling Router changes done, run the smallest honest local gates:

- Route tree generation succeeds.
- Typecheck catches no navigation/search/params/context errors.
- Focused tests cover changed routes and route helpers.
- Build succeeds with the Router plugin.
- Direct deep links work in preview or deployed environment.
- Refresh on nested routes works.
- Back/forward browser navigation works.
- Search params survive share/refresh and malformed input is handled.
- Auth redirects preserve intended destinations and do not expose private data.
- Loader cache invalidation and Query integration behave after mutation.
- Not-found and error boundaries render useful UI.
- SSR apps hydrate without mismatch warnings.
