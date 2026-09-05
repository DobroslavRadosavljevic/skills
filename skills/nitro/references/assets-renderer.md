# Assets and Renderer

## Public assets (`public/`)

Served as-is. Copied to `.output/public/` with a manifest (type, etag, mtime, size) embedded in the server.

Conditional requests → 304. Extra dirs:

```ts
publicAssets: [
  {
    baseURL: "build",
    dir: "public/build",
    maxAge: 3600, // Cache-Control public, max-age, immutable via route rules
    fallthrough: false,
  },
]
```

Top-level `/` fallthrough defaults **true**; non-root bases default **false**.

Precompress:

```ts
compressPublicAssets: true
// or { gzip: true, brotli: true, zstd: false }
```

Compressible MIME ≥ 1 KB; `.map` excluded. Negotiates `Accept-Encoding`.

## Server assets (`assets/`)

Bundled for `useStorage("assets:server")`. Prod: `.output/server/chunks/raw/` (lazy). Dev: fs driver.

Only files actually used via storage (or imports) should be assumed in the bundle — keep large binaries out of the server chunk; prefer public CDN/`public/` for those.

Custom:

```ts
serverAssets: [{ baseName: "templates", dir: "./templates", pattern: "**/*" }]
```

Then `useStorage("assets:templates")`.

## Inline imports

```ts
import logo from "./logo.png" with { type: "bytes" }; // Uint8Array
import readme from "./README.md" with { type: "text" };
import readme2 from "raw:./README.md";
```

Dynamic `import("./logo.png", { with: { type: "bytes" } })`. Inlined (base64 for binary) — not for large files. TS may need `// @ts-ignore` until `bytes`/`text` attributes are typed.

## Renderer

Catch-all HTML after routes + server entry. Use for SSR, templating, or SPA shell.

With **Vite + Nitro**, unmatched routes serve the SPA `index.html` by default.

`static: true` leans into prerender/static generation.

HTML template engines and server JSX (examples: mono-jsx, nano-jsx) belong in renderer/route handlers — keep them out of cached JSON APIs unless you intend to cache HTML.

Nitro HTML templates (when using the built-in renderer dialect) expose `$REQUEST`, `$METHOD`, `$URL`, `$HEADERS`, `$RESPONSE`, `$COOKIES`, plus `echo`, `redirect`, `setCookie`. Prefer framework SSR you already use rather than mixing dialects.

## SPA

Serve `index.html` for unmatched GET so the client router owns paths. Do **not** let the SPA swallow `/api/**` — keep APIs as real `routes/` files.
