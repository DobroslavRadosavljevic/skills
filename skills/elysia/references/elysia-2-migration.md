# Elysia 2 Beta Migration

Use this reference when the app installs `elysia@next` (`2.0.0-beta.x`), when the user asks about Elysia 2 ("DayDream"), or when planning a 1.4 to 2.0 upgrade. The other references describe stable 1.4 APIs unless they say otherwise.

## Status (2026-10-01)

- `elysia` `latest` = `1.4.30`. The 1.4 line now receives security fixes only.
- `elysia` `next` = `2.0.0-beta.20`. It is a full rewrite. The beta label stays until most official and community plugins support 2.0.
- Official plugins publish 2.0 builds under `next` (for example `@elysia/eden`, `@elysia/openapi`, `@elysia/node`, `@elysia/cors`). `@elysia/eden@next` peers on `elysia >= 2.0.0-beta.2`. Upgrade core and every `@elysia/*` plugin together.
- The `@elysia/*` npm scope is for official plugins on Elysia 1.4+; `@elysiajs/*` stays for older 1.x plugins.
- The official docs site still documents 1.4. For 2.0, use the release blog and the early migration guide listed in [source-map.md](source-map.md).

Do not upgrade a production app to the beta unless the user asks. Check every third-party Elysia plugin for 2.0 support first.

## Upgrade Procedure

1. Commit or stash first so the codemod diff is reviewable.
2. Run the codemod: `bunx @elysia/codemod@latest`. Upstream reports about 95% automated coverage.
3. Install the beta together: `bun add elysia@next @elysia/eden@next @elysia/openapi@next typebox` (plus other `@elysia/*` plugins in use). Elysia 2 peers on `typebox >= 1.3.0` (the `typebox` package, not `@sinclair/typebox`), `exact-mirror`, `openapi-types`, and `typescript >= 5.7`.
4. Fix what the codemod cannot: error handlers, macros, WebSocket handlers, guard schema modes, and TypeBox 1.x schema changes.
5. Require TypeScript `>= 5.7` (macro inference needs it).
6. Run typecheck and the full Eden Treaty test suite, then a real HTTP smoke test. Check frontends that parse error bodies (see Problem Details below).

## API Changes

### Hook object before handler

Verb methods (`get`, `post`, `put`, `patch`, `delete`, `options`, `head`, `all`, `method`) take the hook/schema object before the handler. Routes with no hook object are unchanged.

```ts
// 1.4
app.get('/user/:id', ({ params }) => params.id, {
  params: t.Object({ id: t.Number() })
})

// 2.0
app.get('/user/:id', {
  params: t.Object({ id: t.Number() })
}, ({ params }) => params.id)
```

### Lifecycle names drop `on`

| 1.4 | 2.0 |
| --- | --- |
| `onRequest` | `request` |
| `onParse` | `parse` |
| `onTransform` | `transform` |
| `onBeforeHandle` | `beforeHandle` |
| `onAfterHandle` | `afterHandle` |
| `onAfterResponse` | `afterResponse` |
| `onError` | `error` |
| `onStart` | `setup` |
| `onStop` | `cleanup` |

### Error handling

- `error.code` is removed. Register per-class handlers with `.error(ErrorClass, fn)` and a fallback with `.error(fn)` plus `instanceof`.
- Built-in errors are classes: `NotFound` (was `NotFoundError`), `ValidationError`, and others exported from `elysia`.
- Returned and thrown errors both reach `error` hooks.
- Mapped error values are inferred into the route response type, so Eden sees them.
- Errors use RFC 9457 Problem Details with `content-type: application/problem+json`. Use `problem(status, { detail })` to opt in for app errors. Eden handles the new shape; other clients may need changes.
- Unhandled errors and `>= 500` errors without an explicit response no longer leak `message` (or `cause`) in production.

```ts
import { Elysia, NotFound, problem } from 'elysia'

new Elysia()
  .error(NotFound, () => problem(404, { detail: 'Resource not found' }))
  .error(DomainConflict, ({ error }) => problem(409, { detail: error.message }))
  .error(({ error }) => {
    console.error(error)
    return problem(500, { detail: 'Internal error' })
  })
```

### Context extension

- `resolve` is removed. `derive` now runs at before-handle, after validation (the old `resolve` timing). Rename `resolve` to `derive`; review any old `derive` that intentionally ran before validation.
- `decorate`/`state` options use a string: `.decorate('override', 'key', value)`.

### Scope

- `'scoped'` is renamed to `'plugin'`. The `{ as: ... }` object form is removed.
- `app.beforeHandle('plugin', fn)`, `app.as('plugin')`, `app.guard('plugin', ...)`.
- Every `guard()` and `group()` now defaults to schema `override` (the closer schema replaces the inherited one). Add `schema: 'standalone'` where 1.4 relied on additive schemas.

### Macros

- `.macro(name, definition)` is removed. Use the object form `.macro({ auth: { ... } })`.
- The object form now infers its own schema, derived values, and function-form arguments.

### WebSocket

- WebSocket is opt-in: `import { websocket } from 'elysia/websocket'` and `.use(websocket())` once anywhere in the app.
- `.ws(path, handler)` and `.ws(path, options)` stay; the three-argument form is `.ws(path, options, handler)`.
- `ws.data` fields move onto `ws` directly.
- Prefer generator handlers with `yield` over `ws.send` so Eden infers WebSocket responses.
- On Node, import the adapter from `@elysia/node/websocket` when WebSocket is needed.

### Removed or renamed APIs

- `getSchemaValidator` becomes `Validator.create`.
- `set.redirect` is removed; use the `redirect()` context helper.
- `response` on `mapResponse`/`afterResponse` is removed; use `responseValue`.
- `parse` hooks read `ctx.contentType` instead of a second argument.
- Instance methods `.route()`, `.connect()`, `.env()`, `.affix()`, `.prefix()`, `.suffix()` and the `.store`/`.decorator`/`.config` getters are removed. Use verb methods (`method` for custom verbs), `new Elysia({ name, prefix })`, and context `store`/`decorator`.
- Passing an Elysia instance to `.mount` is deprecated; use `.use`.
- `aot: false` (dynamic mode) and `config.encodeSchema` are removed.
- `file-type` is no longer bundled. Apps that use `t.File({ type })` / `t.Files({ type })` must call `setFileTypeDetector(fileTypeFromBlob)` (or `fileTypeFromFile`) from the `file-type` package.

### TypeBox 1.x

Elysia 2 moves from TypeBox 0.34 to TypeBox 1.x:

- `t.Transform` becomes `t.Codec`.
- `t.Recursive`, `t.Not`, and `t.RegExp` are removed.
- `t.NoValidate` skips only `Check`; defaults, conversion, and codecs still run.
- Cookie schemas can be set per field: `t.Object({ a: t.Cookie(t.String(), { sign: true }) })`.
- `t.Accelerate(zodSchema)` (alpha) converts a Standard JSON Schema to the TypeBox compiler.

## New Features

- `defer(fn)` in context runs a callback after the response is sent (queued after `afterResponse`).
- Ahead-of-time build plugins: `aot('src/index.ts')` from `elysia/plugin/aot/<bundler>` (`bun`, `vite`, `esbuild`, `rspack`, `unplugin`). The plugin dry-runs the exported app at build time. Close pools/exit the build process after bundling, and guard build-only code with `Manifest.isCapturing()`. Recommended for Cloudflare Workers, which block `new Function`.
- Public adapter API: `createAdapter` from `elysia/adapter`. `@elysia/node` now runs on srvx and crossws.
- Smaller bundle (TypeBox tree-shakes when unused), faster startup, lower memory.

## Behavior Changes to Test

- `afterHandle` short-circuit skips later `afterHandle` hooks.
- Bodyless `GET`/`HEAD` routes no longer run `parse` hooks.
- Signed cookies verify lazily by default.
- Values returned early from `request()` hooks pass through `mapResponse`.
- The default 422 response no longer echoes request bodies larger than 4 KB.
- Returning the same `Response` object across requests while setting per-request headers now leaks headers; return a fresh `Response`.
- WebSocket query parsing matches HTTP (duplicate keys become arrays).
- `context.path` is read-only.

## Testing Stays the Same

Keep Eden Treaty tests with `treaty(app)` from `@elysia/eden` (use the `next` build). Do not switch to `app.handle(new Request(...))` during the migration.
