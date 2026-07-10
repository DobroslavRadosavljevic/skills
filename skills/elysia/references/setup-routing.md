# Setup, Routing, and Structure

Use this reference for application setup, route design, handler behavior, project organization, and streaming responses.

## Inspect Before Editing

- Read `package.json`, lockfile, TypeScript config, runtime scripts, entrypoint, deployment config, and tests.
- Identify whether the root app calls `.listen(...)`, exports an Elysia instance, exposes `app.fetch`, or uses a runtime adapter.
- Record prefixes, `group` calls, feature plugins, route schemas, hooks, and any Bun-only context usage.
- Preserve the repository's package manager and runtime. Elysia is Bun-first, but current docs also cover Node, Deno, Cloudflare Worker, Vercel, and Netlify shapes.

## Minimal Bun Shape

```ts
import { Elysia, t } from 'elysia'

export const app = new Elysia()
  .get('/health', () => ({ ok: true }), {
    response: t.Object({ ok: t.Boolean() })
  })
  .listen(process.env.PORT ?? 3000)

export type App = typeof app
```

Keep `strict` TypeScript enabled. Let route schemas and the fluent chain drive inference.

## Routes and Matching

- Static routes outrank dynamic routes, which outrank wildcards.
- Use `:id` for dynamic segments, `:id?` for optional segments, and `*` for the unmatched suffix.
- Path parameters infer as strings without a schema. Add a `params` schema for numeric coercion, constraints, or template patterns.
- Prefer the verb helpers (`get`, `post`, `put`, `patch`, `delete`) for standard methods. Use `route` for a custom uppercase method and `all` only when all methods truly share a contract.
- Use `group(prefix, callback)` for a small local route family. Prefer a feature Elysia instance with constructor `prefix` when the route family has its own dependencies, schemas, hooks, or tests.
- Decide whether trailing slash tolerance is desired. `strictPath: true` distinguishes `/name` from `/name/`; the default is tolerant.

## Feature-Oriented Structure

Elysia is unopinionated, but the official best-practice guide recommends feature folders when no stronger repository convention exists:

```text
src/
  modules/
    auth/
      index.ts    # Elysia controller/plugin
      model.ts    # request/response schemas
      service.ts  # business logic
  index.ts        # composition root
```

Use one feature-scoped Elysia instance as the HTTP controller. Keep non-request-dependent business logic in plain functions or modules. Do not pass the entire dynamic Elysia context into a class controller or service; destructure only the values the operation needs.

Use a request-dependent Elysia plugin when logic genuinely needs cookies, headers, validated body/query data, lifecycle participation, or typed context extension.

## Handler Rules

- A handler may return a literal, object, `Response`, file, form data, generator, or async value supported by the runtime.
- Inline literal values can be compiled as static responses. They are not a cache.
- Prefer `status(code, body)` over legacy `set.status` when response type inference matters.
- Use `set.headers` for response headers. Use lower-case names consistently.
- `request` is a Web Standard `Request`. Reach for it when the parsed context is insufficient.
- `server` and `server.requestIP(request)` are Bun-only and exist only after an HTTP server is listening. Do not bake them into portable feature modules.

## Body Parsing

Elysia selects parsers from content type and schema. Built-in parsing covers text, JSON, multipart form data, and URL-encoded bodies.

- Set route `parse` explicitly when inference is ambiguous.
- Use `parse: 'none'` when passing the original `Request` to another library that must consume the body itself; a Web Standard body can be consumed only once.
- Add a named custom parser only for a media type the built-ins do not cover.
- GET and HEAD bodies are ignored by default in line with normal HTTP semantics.

## Files, Streams, and SSE

- Validate uploads with `t.File` or `t.Files` and set realistic size/type limits.
- A generator handler streams yielded chunks. Client cancellation stops the generator automatically.
- Wrap SSE events with `sse(...)`; Elysia sets `text/event-stream` and formats events.
- Set stream headers before the first yielded chunk. Header mutations after the first chunk are too late.
- Test cancellation and cleanup for long-lived streams, not just the happy path.

## Review Checklist

- Does each route use the correct verb and most specific path?
- Are feature prefixes applied exactly once?
- Are handlers thin and schemas colocated with the boundary?
- Is portable code free of Bun-only `server`, `Bun.file`, and `Bun.*` assumptions?
- Are body parsing, upload limits, response headers, and streaming cleanup explicit where necessary?
