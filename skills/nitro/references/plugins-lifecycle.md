# Plugins and Lifecycle

## Plugins

Auto-scan `plugins/`. Extra paths: `plugins: ["my-plugins/hello.ts"]`.

Run **once** at startup, **sync by filename order**. Plugin function must return `void` (sync). Hooks registered inside may be async.

```ts
import { definePlugin } from "nitro";

export default definePlugin((nitroApp) => {
  nitroApp.hooks.hook("close", async () => {
    // connections, timers
  });
});
```

v2 `defineNitroPlugin` is gone — [migration.md](migration.md).

### `nitroApp`

| Property | Role |
| --- | --- |
| `hooks` | `hook(name, fn)` — returns unregister |
| `h3` | H3 app |
| `fetch` | Internal `(req) => Response` |
| `captureError` | Feed errors into `error` hooks |

### Runtime hooks

| Hook | When |
| --- | --- |
| `request` | Start of request |
| `response` | After `Response` exists (including static and errors) |
| `error` | Captured errors; `context.tags` e.g. `request`, `response`, `cache`, `plugin`, `unhandledRejection`, `uncaughtException` |
| `close` | Shutdown; waits for `event.waitUntil` work |

Errors in `request` hook are captured; they do **not** abort the pipeline.

Presets may add hooks (`cloudflare:scheduled`, `cloudflare:email`, `cloudflare:queue`, …). `NitroRuntimeHooks` is augmentable.

`features.runtimeHooks` defaults on when at least one plugin exists.

## Request order

A layer may finish the request.

1. **`request` hook**
2. **Static `public/`** (most presets) — ETag / Last-Modified / Cache-Control; optional precompressed encodings. Non-root `baseURL` assets: missing file → **404**, no fallthrough
3. **Route rules** (headers, redirects, cache wrap)
4. **Global `middleware/`**
5. **Routed middleware** (`handlers` with `middleware: true`)
6. **Matched `routes/`** — else **server entry** (`/**`)
7. **Renderer** if still unmatched
8. **`response` hook**

Custom `errorHandler` formats HTTP errors after the `error` hook. Per-request: `event.req.context.nitro.errors`.

```ts
export default defineConfig({
  errorHandler: "~/error",
});
```

## Shutdown

Node presets: `NITRO_SHUTDOWN_*` env (see [deploy.md](deploy.md)). Hook `close` for cleanup.
