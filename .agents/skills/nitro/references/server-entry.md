# Server Entry and Frameworks

Server entry is a catch-all (`/**`) that runs for requests **not** matched by a more specific `routes/` file. If it returns a `Response` (or handler return value), the chain stops. If it returns `undefined`, processing continues to the renderer.

Auto-detect: `server.ts` / `.js` / `.mjs` / `.mts` / `.tsx` / `.jsx` in project root. Nitro logs `Detected server.ts as server entry.`

Dev: creating, editing, or deleting the entry reloads the server.

## Web format (`server.ts`)

Expect Web `fetch(request): Response` (object with `fetch`, or a framework app).

```ts
export default {
  async fetch(req: Request) {
    const url = new URL(req.url);
    if (url.pathname === "/health") {
      return new Response("OK", { headers: { "content-type": "text/plain" } });
    }
    // no return → continue
  },
};
```

Or `defineHandler` for H3 `event`:

```ts
import { defineHandler } from "nitro";

export default defineHandler((event) => {
  event.context.requestId = crypto.randomUUID();
  console.log(`${event.method} ${event.path}`);
});
```

### Frameworks (Web)

**H3**

```ts
import { H3 } from "h3";
const app = new H3();
app.get("/", () => "Hello from H3");
export default app;
```

**Hono**

```ts
import { Hono } from "hono";
const app = new Hono();
app.get("/", (c) => c.text("Hello from Hono"));
export default app;
```

**Elysia** — must export compiled app:

```ts
import { Elysia } from "elysia";
const app = new Elysia();
app.get("/", () => "Hello from Elysia");
export default app.compile();
```

## Node format (`server.node.ts`)

`(req, res)` frameworks. Filename `.node.` → format `"node"`; Nitro adapts via srvx.

**Express**

```ts
import Express from "express";
const app = Express();
app.use("/", (_req, res) => {
  res.send("Hello from Express with Nitro");
});
export default app;
```

**Fastify**

```ts
import Fastify from "fastify";
const app = Fastify();
app.get("/", () => "Hello, Fastify with Nitro");
await app.ready();
export default app.routing;
```

## Config

```ts
export default defineConfig({
  serverEntry: "./nitro.server.ts",
  // or
  serverEntry: { handler: "./server.ts", format: "web" }, // or "node"
  // disable:
  serverEntry: false,
});
```

## Lifecycle vs routes

When a specific route matches, **that route handles the request** (server entry is not a wrapper around every API route). Server entry + renderer chain only for unmatched paths.

Full pipeline: [plugins-lifecycle.md](plugins-lifecycle.md).

## When to use what

| Need | Use |
| --- | --- |
| Typed file APIs, code-split routes | `routes/` + `defineHandler` |
| Bring Hono/H3/Elysia/Express as the app | Server entry |
| Auth/logging on **all** HTTP including static? | Plugin `request` hook (static may still short-circuit — see lifecycle) |
| Modular per-route concerns | `middleware/` or `handlers` |
| Startup only (DB, mounts) | `plugins/` + `definePlugin` |

Keep entry logic light. Heavy per-route work belongs in `routes/` chunks.
