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

Client plugins must mirror server plugins for typed methods, except Generic OAuth (use `signIn.social` / `linkSocial`).

### hydrateSession (SSR)

```tsx
// server: const session = await auth.api.getSession({ headers: await headers() })
// client:
authClient.hydrateSession(initialSession)
const { data, isPending, isRefetching } = authClient.useSession()
const session = isPending && !isRefetching ? initialSession : data
```

First non-null `hydrateSession` wins; `null` is ignored.

Non-browser clients: `disableDefaultFetchPlugins: true` (Expo often needs this).

## Next.js

```ts
// app/api/auth/[...all]/route.ts
import { auth } from "@/lib/auth"
import { toNextJsHandler } from "better-auth/next-js"

export const { GET, POST } = toNextJsHandler(auth)
```

- Server actions that set cookies: add `nextCookies()` from `better-auth/next-js` as the **last** plugin.
- RSC session: `auth.api.getSession({ headers: await headers() })`. RSC cannot refresh cookie cache — refresh from an action/route.
- Next 16: `proxy.ts` + `proxy()` (codemod: `middleware-to-proxy`). Cookie presence (`getSessionCookie`) is **optimistic only** — not authorization.
- Next 15.2+: Node runtime middleware can call `auth.api.getSession` (`runtime: "nodejs"`). Older Edge middleware cannot.

Pages Router: `toNodeHandler(auth.handler)` + disable bodyParser on that route.

## TanStack Start

```ts
// src/routes/api/auth/$.ts
import { auth } from "@/lib/auth"
import { createFileRoute } from "@tanstack/react-router"

export const Route = createFileRoute("/api/auth/$")({
  server: {
    handlers: {
      GET: ({ request }) => auth.handler(request),
      POST: ({ request }) => auth.handler(request),
    },
  },
})
```

Add `tanstackStartCookies()` last from `better-auth/tanstack-start` (Solid: `better-auth/tanstack-start/solid`).

## Other official mounts

| Framework | Helper / pattern |
|---|---|
| SvelteKit | `svelteKitHandler({ event, resolve, auth, building })` — `better-auth/svelte-kit` |
| SolidStart | `toSolidStartHandler(auth)` — `better-auth/solid-start` |
| Nuxt / Nitro | `toWebRequest(event)` + `auth.handler`. Vue `useSession` has typed `useFetch` |
| Hono | `auth.handler(c.req.raw)` on `/api/auth/*` |
| Elysia | path handler or `.mount(auth.handler)` |
| Express | `toNodeHandler(auth)` from `better-auth/node` **before** `express.json()`. Express 5: `/api/auth/{*any}` |
| Fastify | Bridge to Web `Request` + `fromNodeHeaders` |
| Astro, React Router v7, NestJS, Nitro, Waku, Encore, Electron | See `/docs/integrations/*` |
| Cloudflare Workers | fetch handler + `nodejs_compat` / `nodejs_als` as documented |

## Expo / React Native

```sh
bun add @better-auth/expo
```

Use `@better-auth/expo` (+ `/client`, `/plugins`). Add app scheme to `trustedOrigins` (e.g. `myapp://`, `exp://**`).

**1.7:** SecureStore access is async.

```ts
const cookie = await authClient.getCookie()
```

Custom storage must provide `getItem`, `getItemAsync`, `setItem`, and `setItemAsync`. `storageAdapter.setItem()` is sync — use `setItemAsync()` when the write must be awaited. Passing `expo-secure-store` directly still works.

## Electron

```sh
bun add @better-auth/electron
```

Upgrade client + server together. S256 PKCE is required. Put the app URL scheme in `trustedOrigins`. Remove `disableOriginOverride`. Host-bearing custom schemes (e.g. `myapp://callback`) match that host exactly.

## Convex / community

`@convex-dev/better-auth` and other community adapters exist — prefer official docs when the project already uses them; not first-party monorepo packages.

## Email/password & social (client)

```ts
await authClient.signUp.email({ email, password, name })
await authClient.signIn.email({ email, password })
await authClient.signIn.social({ provider: "google", callbackURL: "/dashboard" })
await authClient.signOut()
```

Generic OAuth uses the **same** `signIn.social({ provider: "<providerId>" })` / `linkSocial()` — not `signIn.oauth2`. Callback: `/api/auth/callback/:id`.

Apple: include `https://appleid.apple.com` in `trustedOrigins`; client secret is often a signed JWT.

Per-request extras: `additionalParams` / `loginHint` on `signIn.social`, `linkSocial`, and `signIn.sso`.
