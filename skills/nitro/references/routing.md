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

Global middleware runs on every request; filter with `event.url.pathname` or use `handlers` + `middleware: true` + `route`.

## Code splitting

Each route is its own chunk (lazy on first hit). `inlineDynamicImports` forces a single bundle.

## Route rules (experimental)

Map rou3 patterns → options in `nitro.config`. Runs as middleware after static assets (see [plugins-lifecycle.md](plugins-lifecycle.md)).

Typical options (see config + cache docs):

- `headers` — response headers
- redirects / rewrites / proxy (host-specific details in [deploy.md](deploy.md))
- `cache` — wrap matching handlers with `defineCachedHandler`
- `swr: true | number` — shortcut for SWR cache (`number` = `maxAge` seconds)
- `cache: false` — disable cache for a subtree
- `isr` — platform ISR (Vercel/Netlify presets)

```ts
routeRules: {
  "/blog/**": { cache: { maxAge: 60 * 60 } },
  "/api/**": { swr: 3600 },
  "/api/realtime/**": { cache: false },
  "/**": { headers: { "x-nitro": "1" } },
}
```

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
