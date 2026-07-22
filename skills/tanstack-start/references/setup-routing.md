# Setup And Routing

Use this reference for app scaffolding, build-tool setup, file routing, root route structure, loaders, and TanStack Query integration.

## Starting A Project

Preferred current starting points:

- TanStack Builder for the guided AI-first setup flow.
- TanStack CLI for local scaffolding:

```bash
bunx @tanstack/cli@latest create
```

The CLI prompts for package manager and optional add-ons such as Tailwind CSS and ESLint.

Official examples are useful when matching existing patterns:

- `start-basic`
- `start-basic-auth`
- `start-basic-react-query`
- `start-clerk-basic`
- `start-supabase-basic`
- `start-workos`
- `start-material-ui`

Clone examples with `gitpick` when the user wants a working reference:

```bash
bunx gitpick TanStack/router/tree/main/examples/react/start-basic start-basic
cd start-basic
bun install
bun run dev
```

Do not install dependencies without approval when repo policy requires package-safety review.

## Core Packages

Current build-from-scratch docs install:

```bash
bun add @tanstack/react-start @tanstack/react-router
bun add react react-dom
```

Choose one build tool:

- Vite with `@tanstack/react-start/plugin/vite` and `@vitejs/plugin-react`.
- Rsbuild with `@tanstack/react-start/plugin/rsbuild` and `@rsbuild/plugin-react`.

Add `@tanstack/react-query` when the app uses TanStack Query for cache management.

## Package Scripts

Use ESM package mode:

```json
{
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build"
  }
}
```

For Rsbuild, use the equivalent `rsbuild dev` and `rsbuild build` scripts.

## TypeScript

Use TypeScript. Recommended compiler settings include:

```json
{
  "compilerOptions": {
    "jsx": "react-jsx",
    "module": "ESNext",
    "moduleResolution": "Bundler",
    "target": "ES2022",
    "skipLibCheck": true,
    "strictNullChecks": true
  }
}
```

Important caveat: keep `verbatimModuleSyntax` disabled unless the current docs and repo setup explicitly support it. The official build-from-scratch guide warns that enabling it can let server code leak into client bundles.

## Vite Config

Start's Vite plugin should come before React's Vite plugin:

```ts
import { defineConfig } from 'vite'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'

export default defineConfig({
  server: {
    port: 3000,
  },
  plugins: [
    tanstackStart(),
    viteReact(),
  ],
})
```

If the repo uses TypeScript path aliases, preserve the local `resolve` or tsconfig-paths setup rather than replacing it.

## Rsbuild Config

Current docs support Rsbuild as an alternative build tool:

```ts
import { defineConfig } from '@rsbuild/core'
import { pluginReact } from '@rsbuild/plugin-react'
import { tanstackStart } from '@tanstack/react-start/plugin/rsbuild'

export default defineConfig({
  plugins: [
    pluginReact(),
    tanstackStart(),
  ],
})
```

Follow the repo's existing build-tool choice unless the user explicitly asks to migrate.

## Required Files

A minimal Start app usually includes:

```text
src/
  router.tsx
  routeTree.gen.ts
  routes/
    __root.tsx
    index.tsx
vite.config.ts or rsbuild.config.ts
package.json
tsconfig.json
```

`routeTree.gen.ts` is generated on first run by the Router/Start tooling. Treat it as generated output unless the repo has a policy for checking it in.

## Router Setup

`src/router.tsx` should create a Router from the generated route tree:

```tsx
import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree.gen'

export function createAppRouter() {
  return createRouter({
    routeTree,
    scrollRestoration: true,
  })
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof createAppRouter>
  }
}
```

Add router context here when loaders need shared services such as a Query client, auth/session state, or feature flags.

## Root Route

The root route owns the document shell. Use `HeadContent`, `Scripts`, and `Outlet`:

```tsx
import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
} from '@tanstack/react-router'

export const Route = createRootRoute({
  component: RootDocument,
})

function RootDocument() {
  return (
    <html>
      <head>
        <HeadContent />
      </head>
      <body>
        <Outlet />
        <Scripts />
      </body>
    </html>
  )
}
```

When disabling root component SSR, keep the document shell server-rendered with `shellComponent`; see [deployment-production.md](deployment-production.md).

## File-Based Routes

Routes live under `src/routes` and use TanStack Router's file-route conventions:

- `src/routes/index.tsx` maps to `/`.
- `src/routes/about.tsx` maps to `/about`.
- `src/routes/posts/$postId.tsx` maps to `/posts/:postId` with typed params.
- `src/routes/users.$id.posts.tsx` and nested directories can both express nested paths.
- `src/routes/my-script[.]js.ts` maps to `/my-script.js`.
- Pathless layout routes and break-out routes follow Router conventions.

Define routes with `createFileRoute`:

```tsx
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/$postId')({
  loader: async ({ params }) => {
    return getPost(params.postId)
  },
  component: PostRoute,
})

function PostRoute() {
  const post = Route.useLoaderData()
  return <article>{post.title}</article>
}
```

## Loaders

Loaders are isomorphic. On initial SSR they can run on the server; on client navigation they can run on the client. Do not put secrets, database clients, or filesystem work directly in loaders. Instead:

- Call a server function from the loader for server-only work.
- Use a server route for external HTTP endpoints.
- Use `createServerOnlyFn` or `.server.*` modules for non-RPC server-only utilities.

After mutations, invalidate router data:

```tsx
import { useRouter } from '@tanstack/react-router'

function SaveButton() {
  const router = useRouter()

  return (
    <button
      onClick={async () => {
        await savePost({ data: { title: 'Updated' } })
        await router.invalidate()
      }}
    >
      Save
    </button>
  )
}
```

## TanStack Query Integration

When the app uses TanStack Query, prefer loader prefetching plus component cache reads:

```tsx
import { queryOptions, useQuery } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'

const postsQueryOptions = () =>
  queryOptions({
    queryKey: ['posts'],
    queryFn: () => getPosts(),
  })

export const Route = createFileRoute('/posts')({
  loader: ({ context }) => {
    return context.queryClient.ensureQueryData(postsQueryOptions())
  },
  component: PostsRoute,
})

function PostsRoute() {
  const postsQuery = useQuery(postsQueryOptions())
  return <PostList posts={postsQuery.data ?? []} />
}
```

Keep query keys stable and include route params/search values in the key when they change the fetched data.

## Migration Notes

For Next.js migrations:

- Move document layout concerns into `src/routes/__root.tsx`.
- Replace framework route handlers with Start server routes when exposing HTTP endpoints.
- Replace server actions or app-internal RPC patterns with Start server functions where appropriate.
- Convert page data dependencies into Router loaders and/or Query prefetching.
- Rebuild auth boundaries at server function/server route middleware level; route guards remain UX, not data security.
