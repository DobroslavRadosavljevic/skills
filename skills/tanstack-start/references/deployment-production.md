# Deployment And Production

Use this reference for hosting, server entrypoints, prerendering, ISR, SPA mode, selective SSR, sessions, env, and production verification.

## Hosting Model

TanStack Start supports Vite and Rsbuild and can deploy to many hosts. Current docs list official partners including Cloudflare, Netlify, and Railway, and deployment targets such as:

- `cloudflare-workers`
- `netlify`
- `railway`
- `nitro`
- `vercel`
- `node-server`
- `bun`
- `appwrite-sites`

Always check the host-specific docs before changing adapters. Hosting details are version-sensitive and can change faster than app code.

## Cloudflare Workers

Current Cloudflare Workers guidance uses `@cloudflare/vite-plugin` and Wrangler. Keep the Cloudflare plugin before Start:

```ts
import { cloudflare } from '@cloudflare/vite-plugin'
import { tanstackStart } from '@tanstack/react-start/plugin/vite'
import viteReact from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    cloudflare({
      viteEnvironment: {
        name: 'ssr',
      },
    }),
    tanstackStart(),
    viteReact(),
  ],
})
```

`wrangler.jsonc` commonly points at Start's server entry and enables Node compatibility:

```jsonc
{
  "main": "@tanstack/react-start/server-entry",
  "compatibility_flags": ["nodejs_compat"]
}
```

For Workers and other edge runtimes, read `process.env` per request inside handlers and middleware. Do not rely on module-scope `process.env` reads. Cloudflare's native env binding is the canonical alternative when code must read env outside request callbacks.

## Netlify

Current docs use `@netlify/vite-plugin-tanstack-start` for Netlify integration. A manual `netlify.toml` uses:

```toml
[build]
  command = "vite build"
  publish = "dist/client"

[dev]
  command = "vite dev"
  port = 3000
```

If SPA mode uses server functions or server routes, ensure redirects allow those paths through to the server before the catch-all shell rewrite.

## Railway, Nitro, Vercel, Node, And Bun

Railway follows the Nitro deployment path in current docs and may be auto-detected. Vercel, Node server, Bun, and other targets have target-specific entry/runtime requirements. Before editing production config:

- Confirm the adapter target in Start docs.
- Confirm whether the app emits server output, static client output, or both.
- Confirm host env variable names and secret injection timing.
- Smoke test deployed SSR, server functions, server routes, redirects, and asset serving.

## Server Entry Point

Most apps can use Start's default server entry. Create `src/server.ts` only when customizing request handling, request context, or integration with a host/runtime.

Minimal custom server entry shape:

```tsx
import handler, { createServerEntry } from '@tanstack/react-start/server-entry'

export default createServerEntry({
  fetch(request) {
    return handler.fetch(request)
  },
})
```

For deeper customization, current docs use `createStartHandler`, `defaultStreamHandler`, and `defineHandlerCallback`. Keep the default stream handler unless the task requires request instrumentation, host context, or custom response handling.

Typed request context can be registered by augmenting TanStack Router's `Register.server.requestContext`, then passing context into `handler.fetch`.

## Production Environment

Server-only env:

- Use unprefixed `process.env` in server functions, server routes, middleware, or per-request server callbacks.
- Validate required secrets at startup on Node-like runtimes or per request on edge runtimes.
- Never expose secrets through `VITE_*` or `PUBLIC_*`.

Client-visible env:

- Vite exposes `VITE_*` through `import.meta.env`.
- Rsbuild exposes `PUBLIC_*` by default.
- Treat all public env vars as bundled and visible to users.

Start plugin supports static replacement of `process.env.NODE_ENV`:

```ts
tanstackStart({
  server: {
    build: {
      staticNodeEnv: true,
    },
  },
})
```

Use only when that build-time replacement matches the target runtime.

## Sessions And Cookies

Production session cookies should usually be:

- `HttpOnly`
- `Secure`
- `SameSite=Lax` or stricter when product requirements allow
- `Path=/`
- Bounded by `Max-Age`
- Preferably prefixed with `__Host-`

When using Start session helpers, keep the password/secret at least 32 characters and server-only. When rolling your own, use opaque session IDs backed by a database if revocation matters.

## Static Prerendering

Enable static prerendering with the Start plugin:

```ts
tanstackStart({
  prerender: {
    enabled: true,
    autoSubfolderIndex: true,
    autoStaticPathsDiscovery: true,
    concurrency: 14,
    crawlLinks: true,
    failOnError: true,
  },
})
```

Use `pages` for explicit paths:

```ts
tanstackStart({
  pages: [
    {
      path: '/docs',
      prerender: {
        enabled: true,
        outputPath: '/docs/index.html',
      },
    },
  ],
})
```

Automatic discovery excludes dynamic param routes, layout routes, and routes without components. Dynamic routes can still be prerendered when linked from crawled pages.

## ISR-Style Caching

TanStack Start's ISR guidance relies on standard HTTP cache headers rather than a proprietary API:

```tsx
export const Route = createFileRoute('/blog/posts/$postId')({
  loader: async ({ params }) => {
    return { post: await fetchPost(params.postId) }
  },
  headers: () => ({
    'Cache-Control':
      'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  }),
})
```

Use server route response headers for API-style cache control:

```tsx
return Response.json(
  { product },
  {
    headers: {
      'Cache-Control': 'public, max-age=300, stale-while-revalidate=600',
    },
  },
)
```

For on-demand revalidation, build a protected server route that verifies a secret and calls the CDN purge API. Do not expose purge credentials or accept unauthenticated purge requests.

## SPA Mode

SPA mode disables initial full SSR for app content while retaining the ability to use server functions and server routes.

```ts
tanstackStart({
  spa: {
    enabled: true,
  },
})
```

Build output includes a shell such as `/_shell.html`, and hosts need rewrites:

```text
/* /_shell.html 200
```

When server functions or server routes are still used, allow-list them before the catch-all shell rewrite:

```text
/_serverFn/* /_serverFn/:splat 200
/api/* /api/:splat 200
/* /_shell.html 200
```

SPA mode is easier and cheaper to host but usually has slower time to full content and weaker SEO/link-preview behavior than SSR.

## Selective SSR

Routes are SSR-enabled by default. Use `ssr` to make route handling more restrictive:

```tsx
export const Route = createFileRoute('/reports')({
  ssr: 'data-only',
  loader: () => getReports(),
  component: ReportsRoute,
})
```

Options:

- `true`: run `beforeLoad`, run `loader`, and render route component on the server.
- `false`: skip server execution of `beforeLoad` and `loader`, and skip server rendering the component.
- `'data-only'`: run `beforeLoad` and `loader` on the server, but render the component on the client.
- Function form: choose `true`, `false`, or `'data-only'` at request time from validated params/search.

Child routes can inherit parent SSR settings only in a more restrictive direction. A child cannot opt back into full SSR when a parent disables it.

To change the default globally:

```tsx
import { createStart } from '@tanstack/react-start'

export const startInstance = createStart(() => ({
  defaultSsr: false,
}))
```

The HTML shell still needs to render on the server. If root route component SSR is disabled, use `shellComponent` for the document shell.

## Production Verification Checklist

Run the repo's existing checks first. For Start-specific production changes, verify:

- Build passes and route tree generation succeeds.
- Server-only code is absent from the client bundle; import protection has no build violations.
- App navigation works for direct loads and client transitions.
- SSR output hydrates without mismatch warnings.
- Loaders, pending states, error boundaries, and not-found boundaries behave on first load and client navigation.
- Server functions work from loaders and components.
- Server routes return expected status codes, headers, JSON/body shapes, and auth failures.
- `src/start.ts` preserves CSRF, auth, logging, and global middleware behavior.
- Env vars exist in the target runtime and secrets are not public-prefixed.
- Cookies include correct security flags in production.
- SPA rewrites, server function routes, and API routes do not shadow each other.
- Prerendered routes and CDN cache headers match freshness requirements.
- Deployed smoke test covers at least one SSR page, one dynamic route, one server function, one server route, and one protected route.
