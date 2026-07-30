# SSR and Backend Integration

Low-level Vite SSR, middleware mode, production dual builds, and embedding Vite behind an existing backend.

## When to use what

| Need | Approach |
|---|---|
| SPA / static site | Default Vite — no SSR APIs |
| Custom Node SSR | `middlewareMode` + `ssrLoadModule` + dual `vite build` |
| Meta-framework (Nuxt, Remix, etc.) | Prefer that framework’s Vite integration |
| Rails / Laravel / PHP / etc. | Backend integration + manifest |
| Multi-runtime future | Environment API (**RC**) |

Vite’s SSR guide is a **low-level** toolkit for authors — not a full framework.

Docs: https://vite.dev/guide/ssr

## Dev SSR (middleware mode)

```ts
import fs from 'node:fs'
import path from 'node:path'
import express from 'express'
import { createServer as createViteServer } from 'vite'

const app = express()

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom', // disable Vite HTML middlewares
})

app.use(vite.middlewares)

app.use('*all', async (req, res, next) => {
  try {
    const url = req.originalUrl
    let template = fs.readFileSync(
      path.resolve(import.meta.dirname, 'index.html'),
      'utf-8',
    )
    template = await vite.transformIndexHtml(url, template)
    const { render } = await vite.ssrLoadModule('/src/entry-server.js')
    const appHtml = await render(url)
    const html = template.replace(`<!--ssr-outlet-->`, () => appHtml)
    res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
  } catch (e) {
    vite.ssrFixStacktrace(e as Error)
    next(e)
  }
})

app.listen(5173)
```

Typical files: `index.html` with `<!--ssr-outlet-->`, `src/entry-client.js`, `src/entry-server.js`.

APIs: `vite.middlewares`, `transformIndexHtml`, `ssrLoadModule`, `ssrFixStacktrace`.

`import.meta.env.SSR` is statically replaced / tree-shaken.

### WebSocket proxy + middlewareMode

Pass the parent HTTP server so WS proxy binds correctly:

```ts
import http from 'node:http'
import { createServer } from 'vite'

const parentServer = http.createServer()
const vite = await createServer({
  server: {
    middlewareMode: { server: parentServer },
    proxy: { '/ws': { target: 'ws://localhost:3000', ws: true } },
  },
})
```

## Production SSR builds

```json
{
  "scripts": {
    "build:client": "vite build --outDir dist/client --ssrManifest",
    "build:server": "vite build --outDir dist/server --ssr src/entry-server.js"
  }
}
```

Prod server imports `./dist/server/entry-server.js`, serves `dist/client` static assets, and does **not** need Vite middleware.

### SSR config knobs

| Option | Role |
|---|---|
| `ssr.external` / `ssr.noExternal` | Control bundling of deps (`true` = bundle all) |
| `ssr.target` | `'node'` (default) \| `'webworker'` |
| `ssr.resolve.conditions` / `mainFields` | Resolution for SSR graph |

Docs: https://vite.dev/config/ssr-options

For worker targets, `ssr.noExternal: true` is common; Node builtins will error if pulled in.

## Backend integration (non-JS HTML hosts)

Docs: https://vite.dev/guide/backend-integration

1. Prefer an existing community integration when available.
2. Manual pattern:

```ts
export default defineConfig({
  server: {
    cors: {
      origin: 'http://my-backend.example.com',
    },
  },
  build: {
    manifest: true, // → dist/.vite/manifest.json
    rolldownOptions: {
      input: '/path/to/main.js', // non-HTML entry
    },
  },
})
```

**Dev** — inject into backend-rendered HTML:

```html
<script type="module" src="http://localhost:5173/@vite/client"></script>
<script type="module" src="http://localhost:5173/main.js"></script>
```

React Refresh may also need the `/@react-refresh` preamble (see docs + `@vitejs/plugin-react`).

**Entry without HTML** may need:

```ts
import 'vite/modulepreload-polyfill'
```

(`vite/modulepreload-polyfill` is a **virtual module** — empty in dev, polyfill in client build.)

**Prod** — read `ManifestChunk` fields (`file`, `css`, `imports`, `dynamicImports`, `isEntry`) and emit `<link>` / `<script type="module">` (+ modulepreload as needed).

## Proxy patterns

```ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:8080',
      changeOrigin: true,
      configure: (proxy, options) => {},
    },
  },
}
```

If `base` is non-relative, prefix proxy keys accordingly. Proxied traffic skips Vite transforms.

## appType

| Value | Behavior |
|---|---|
| `spa` | HTML middleware + SPA fallback (default-ish for SPAs) |
| `mpa` | Multi-page HTML |
| `custom` | No Vite HTML middlewares — parent server owns HTML (SSR) |

## Environment API note

Future SSR direction uses per-environment Module Runner APIs. Status **RC**. Existing `ssrLoadModule` remains the practical path for many apps today; frameworks may adopt Environment API earlier.

Docs: https://vite.dev/guide/api-environment · https://vite.dev/changes/ssr-using-modulerunner

## Security / ops reminders

- AuthZ and secrets stay on the **backend**, not in Vite client bundles.
- `vite preview` is for local smoke of static output — not a hardened prod SSR host.
- CORS/`server.origin` matter when the browser loads Vite assets from another origin.
