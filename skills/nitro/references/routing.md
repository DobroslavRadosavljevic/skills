# Routing and Middleware

Handlers receive an H3 `event`. Prefer `defineHandler` for inference.

```ts
import { defineHandler } from "nitro";

export default defineHandler((event) => {
  return { hello: "API" };
});
```

Returns: objects (JSON), strings, `Response`, readable streams.

## Filesystem

Scan `routes/` (and nested `api/`). One handler per file.

```
routes/
  hello.get.ts          GET /hello
  hello.post.ts         POST /hello
  api/test.ts           ANY /api/test
  api/[org]/[repo].ts   ANY /api/:org/:repo
  (admin)/users.ts      ANY /users   (group not in URL)
```

With `serverDir: "./server"`, files live under `server/routes/` (or `server/api/` depending on layout). Path still maps from the routes tree.

### Params

- `[name]` → `event.context.params.name` (or `getRouterParam`)
- Nested folders for multiple params — not two params in one filename
- `[...]` catch remaining path including `/`
- `[...].ts` unmatched catch-all route

### Methods

Append to filename: `get`, `post`, `put`, `delete`, `patch`, `head`, `options`, `connect`, `trace`.

Read body with Web APIs on the event request, e.g. `await event.req.json()`.

### Environment-specific files

Suffix after method: `.dev`, `.prod`, `.prerender`.

```
routes/env/index.dev.ts
routes/env/index.get.prod.ts
```

Programmatic `routes` config can target multiple envs or a **preset name**.

### Ignore

```ts
ignore: ["routes/api/**/_*", "middleware/_*.ts", "routes/_*.ts"]
```

Globs relative to server directory.

## Programmatic routes

```ts
export default defineConfig({
  routes: {
    "/api/hello": "./server/routes/api/hello.ts",
    "/api/custom": {
      handler: "./server/routes/api/hello.ts",
      method: "POST",
      lazy: true,
    },
    "/virtual": { handler: "#virtual-route" },
  },
});
```

Entry fields: `handler`, `method`, `lazy`, `format` (`"web"` | `"node"`), `env`.

`handlers` array for middleware-style matching:

```ts
handlers: [
  {
    route: "/api/**",
    handler: "./server/middleware/api-auth.ts",
    middleware: true,
  },
]
```

Patterns: `/test`, `/api/:id`, `/blog/**`.

## Middleware

Auto from `middleware/`. Same `defineHandler` shape. **Do not return** unless you intend to end the request (discouraged). Mutate `event.context` instead.

Order: directory listing. Prefix `01.`, `02.` — string sort (`10` sorts after `1`; zero-pad).

Global middleware runs on every request; filter with `event.url.pathname` or use route-scoped middleware (experimental): `handlers` + `middleware: true` + `route`. Keep route-scoped handler files outside `middleware/` so scanning does not also register them globally.

## Code splitting

Each route is its own chunk (lazy on first hit). `inlineDynamicImports` forces a single bundle.

## Route rules

Map rou3 patterns → options in `nitro.config` (h3 route rules engine, rou3 0.9). Runs as middleware after static assets (see [plugins-lifecycle.md](plugins-lifecycle.md)). Rules merge from least to most specific; `false` disables an inherited option. `GET` routes also answer `HEAD`.

| Option | Use |
| --- | --- |
| `headers` | Response headers |
| `redirect` | `string` (307) or `{ to, status }`; `/**` suffix preserves the rest of the path |
| `proxy` | `string` or `{ to, ...h3 proxy options }` |
| `cors` | `true` (permissive) or h3 `CorsOptions`; `credentials: true` + wildcard origin fails the build. Applied by the server, not the CDN |
| `cache` | Cache options (wraps with `defineCachedHandler`) or `false` |
| `swr` | `true` = `cache: { swr: true }`; number = `{ swr: true, maxAge }` |
| `static` | Static caching shortcut |
| `prerender` | Build-time prerender (do not combine with `isr`) |
| `isr` | Vercel ISR (`true`, seconds, or `{ expiration, allowQuery, group }`) |

```ts
routeRules: {
  "/blog/**": { cache: { maxAge: 60 * 60 } },
  "/api/**": { swr: 3600, cors: true },
  "/api/internal/**": { cors: false },
  "/api/realtime/**": { cache: false },
  "POST /api/**": { headers: { "x-write": "true" } }, // method-scoped
  "/**": { headers: { "x-nitro": "1" } },
}
```

Method-scoped keys are resolved at runtime; platform-generated static config (`_headers`, `_redirects`, Vercel `config.json`) does not split by method, so keep `headers` / `redirect` / `proxy` keys method-agnostic when the platform should emit them.

There is no auth rule (`basicAuth` rules were removed). Use h3 `basicAuth` as middleware:

```ts
import { defineHandler } from "nitro";
import { basicAuth } from "nitro/h3";

export default defineHandler({
  middleware: [basicAuth({ username: "admin", password: process.env.ADMIN_PASSWORD! })],
  handler: (event) => `Hello, ${event.context.basicAuth?.username}!`,
});
```

Runtime overrides: `runtimeConfig.nitro.routeRules` (env-overridable without rebuild).

Types: `RouteRuleConfig` / `NormalizedRouteRules` (old `NitroRouteConfig` / `NitroRouteRules` are deprecated aliases).

Route-rule cache group is `'nitro/route-rules'`.

## Route meta (experimental)

Build-time macro — no runtime cost. Used for OpenAPI:

```ts
import { defineRouteMeta, defineHandler } from "nitro";

defineRouteMeta({
  openAPI: {
    tags: ["test"],
    description: "Test route",
    parameters: [{ in: "query", name: "test", required: true }],
  },
});

export default defineHandler(() => "OK");
```

## Errors

Use H3 error helpers. Dev HTML error pages when `Accept: text/html`; production JSON. Custom handler: `errorHandler` in config (`defineErrorHandler`).

## Performance notes

Specific `routes/` handlers beat a fat `server.ts` catch-all. Keep server entry and global middleware thin.
