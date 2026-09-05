# Tasks, OpenAPI, WebSocket

All three of OpenAPI and tasks are **experimental**. WebSocket is a `features` flag (stable-ish but still verify per preset).

## Tasks

```ts
experimental: { tasks: true }
```

Files: `tasks/[name].ts`. Nested dirs join with `:`. `tasks/db/migrate.ts` → `db:migrate`.

```ts
export default defineTask({
  meta: { name: "db:migrate", description: "Run database migrations" },
  run({ payload, context }) {
    return { result: "Success" };
  },
});
```

`run` receives `{ name, payload, context }` (`context.waitUntil` when the runtime supports it).

Config override (wins over scanned file):

```ts
tasks: {
  "db:migrate": {
    handler: "./tasks/custom-migrate.ts",
    description: "Run database migrations",
  },
}
```

CLI: `bunx nitro task list` / `bunx nitro task run db:migrate`.

Programmatic: `runTask(name, { payload?, context? })` from `"nitro/task"`. **Authenticate** any HTTP trigger.

### Scheduled

```ts
scheduledTasks: {
  "* * * * *": ["cms:update"],
  "0 * * * *": "db:cleanup",
}
```

Same cron → tasks run **in parallel**. Payload includes `scheduledTime: Date.now()`.

| Preset family | Engine |
| --- | --- |
| dev, node_*, bun, deno_server | croner |
| cloudflare_module / pages | Wrangler cron triggers generated at build |
| vercel | Vercel Cron generated at build; protect with `CRON_SECRET` |

## OpenAPI

```ts
experimental: { openAPI: true },
openAPI: {
  meta: { title: "My API", description: "...", version: "1.0.0" },
  route: "/_openapi.json",
  ui: {
    scalar: { route: "/_scalar", theme: "purple" },
    swagger: { route: "/_swagger" }, // or false
  },
  production: false, // or "runtime" | "prerender"
}
```

Dev endpoints: `/_openapi.json` (OpenAPI 3.1), `/_scalar`, `/_swagger`.

Metadata: `defineRouteMeta({ openAPI: { ... } })` — Operation Object. Path params inferred from `[id]`. `$global.components.schemas` hoist shared `$ref`s.

Auto tags: `/api/` → API Routes, `/_` → Internal, else App Routes.

Production default **off**. `"prerender"` = static spec; `"runtime"` = generate per request (allows middleware). **Protect** if enabled.

## WebSocket

```ts
features: { websocket: true }
```

CrossWS + H3. File routes like HTTP:

```ts
import { defineWebSocketHandler } from "nitro";

export default defineWebSocketHandler({
  upgrade(request) {
    const token = new URL(request.url).searchParams.get("token");
    if (!isValid(token)) throw new Response("Unauthorized", { status: 401 });
    return { context: { userId: id }, namespace: "chat:general" };
  },
  open(peer) {
    peer.subscribe("chat");
    peer.send("Welcome");
  },
  message(peer, message) {
    peer.publish("chat", { text: message.text() });
  },
  close(peer, details) {},
  error(peer, error) {},
});
```

`upgrade` may return `headers`, `namespace`, `context`. Default namespace = pathname (so `routes/rooms/[room].ts` isolates rooms).

Peer: `id`, `send`, `subscribe` / `unsubscribe`, `publish` (others only), `close` / `terminate`, `peers`, `topics`. Message: `text()`, `json()`, `uint8Array()`, etc.

Confirm the **preset** actually supports WS (Node/Bun/Deno/Cloudflare Workers). Serverless-without-WS hosts will fail — do not fake it with HTTP polling unless the user asks.

## SSE

```ts
import { defineHandler } from "nitro";
import { createEventStream } from "nitro/h3";

export default defineHandler((event) => {
  const stream = createEventStream(event);
  const interval = setInterval(async () => {
    await stream.push(`Message @ ${new Date().toISOString()}`);
    // or { id, event, data, retry }
  }, 1000);
  stream.onClosed(() => clearInterval(interval));
  return stream.send();
});
```

Client: `EventSource`.
