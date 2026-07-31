# Frameworks & Clients

Default HTTP surface: **`/api/auth/*`** (`basePath` configurable).

## Client entry points

| Import | UI |
|---|---|
| `better-auth/client` | Vanilla / shared |
| `better-auth/react` | React (`useSession`, …) |
| `better-auth/vue` | Vue |
| `better-auth/svelte` | Svelte |
| `better-auth/solid` | Solid |
| `better-auth/lynx` | Lynx |

```ts
import { createAuthClient } from "better-auth/react"
import { organizationClient, twoFactorClient } from "better-auth/client/plugins"
import { passkeyClient } from "@better-auth/passkey/client"

export const authClient = createAuthClient({
  plugins: [organizationClient(), twoFactorClient(), passkeyClient()],
})
```

Client plugins must mirror server plugins for typed methods.

## Next.js

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

- Server actions that set cookies: add `nextCookies()` from `better-auth/next-js` as the **last** plugin.
- RSC session: `auth.api.getSession({ headers: await headers() })`.
- Middleware: cookie presence (`getSessionCookie`) is **optimistic only** — not authorization.

Pages Router: `toNodeHandler(auth.handler)` + disable bodyParser on that route.

## TanStack Start

```ts
// routes/api/auth/$.ts
import { auth } from "~/lib/auth"
export const APIRoute = { GET: ({ request }) => auth.handler(request), POST: ... }
```

Add `tanstackStartCookies()` last (from `better-auth/tanstack-start` or Solid variant).

## Other official mounts

| Framework | Helper / pattern |
|---|---|
| SvelteKit | `svelteKitHandler({ event, resolve, auth, building })` — `better-auth/svelte-kit` |
| SolidStart | `toSolidStartHandler(auth)` — `better-auth/solid-start` |
| Nuxt / Nitro | `toWebRequest(event)` + `auth.handler` |
| Hono | `auth.handler(c.req.raw)` on `/api/auth/*` |
| Elysia | path handler or `.mount(auth.handler)` |
| Express | `toNodeHandler(auth)` from `better-auth/node` **before** `express.json()` |
| Fastify | Bridge to Web `Request` + `fromNodeHeaders` |
| Astro, React Router v7, NestJS, Nitro, Waku, Encore, Electron | See `/docs/integrations/*` |
| Cloudflare Workers | fetch handler + `nodejs_compat` / `nodejs_als` as documented |

## Expo / React Native

```sh
bun add @better-auth/expo
```

Use `@better-auth/expo` (+ `/client`, `/plugins`). Add app scheme to `trustedOrigins` (e.g. `myapp://`, `exp://**`). Secure storage / deep links per Expo docs.

## Electron

```sh
bun add @better-auth/electron
```

Client/proxy/preload/storage helpers — follow Electron integration docs.

## Convex / community

`@convex-dev/better-auth` and other community adapters exist — prefer official docs when the project already uses them; not first-party monorepo packages.

## Email/password & social (client)

```ts
await authClient.signUp.email({ email, password, name })
await authClient.signIn.email({ email, password })
await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
await authClient.signOut()
```

Apple: include `https://appleid.apple.com` in `trustedOrigins`; client secret is often a signed JWT.
