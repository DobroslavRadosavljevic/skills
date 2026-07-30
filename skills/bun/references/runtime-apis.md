# Runtime APIs

Bun-native APIs for HTTP, files, shell, databases, and related runtime features. Prefer these in Bun-first code; keep Node APIs when sharing a Node deployment target.

## Bun.serve — HTTP server

```ts
const server = Bun.serve({
  port: 3000,
  hostname: "0.0.0.0",
  routes: {
    "/": new Response("home"),
    "/json": () => Response.json({ ok: true }),
    "/users/:id": (req) => {
      return Response.json({ id: req.params.id });
    },
  },
  fetch(req, server) {
    return new Response("Not found", { status: 404 });
  },
  error(error) {
    return new Response(String(error), { status: 500 });
  },
});

console.log(server.url.href);
await server.stop(); // graceful
```

### Defaults and gotchas

- **Idle timeout:** default **10 seconds**. Long-lived responses (SSE, streaming) need:

  ```ts
  server.timeout(req, 0); // or seconds
  ```

- **`port: 0`:** ephemeral port for tests; read `server.port` / `server.url`.
- Prefer **`routes`** for static path maps; use **`fetch`** for catch-all / middleware-style logic.
- **TLS:** pass `tls: { key, cert }` (or paths per current docs).
- **WebSockets:** `websocket: { message, open, close, drain }` on the serve options; upgrade via `server.upgrade(req)`.

### Cookies / headers

Use standard `Request` / `Response` / `Headers`. Bun also documents cookie helpers — prefer Web-standard APIs unless you need Bun-specific cookie utilities.

## Fetch and networking

```ts
const res = await fetch("https://example.com");
const data = await res.json();
```

Bun’s `fetch` is the runtime default (undici-like performance). DNS / custom agents: see docs for `dns.prefetch`, unix sockets, and proxy options when needed.

## File I/O

```ts
const file = Bun.file("./package.json");
file.size;
file.type;
await file.text();
await file.json();
await file.arrayBuffer();
await file.stream();

await Bun.write("./out.bin", data);
await Bun.write("./copy.txt", Bun.file("./src.txt"));
```

`Bun.file` is lazy (does not read until consumed). Prefer it over `fs.readFile` in Bun-first code for path → Blob ergonomics.

## Shell — Bun.$

```ts
import { $ } from "bun";

await $`echo hello`;
const out = await $`cat ${filename}`.text();
await $`ls`.cwd("./packages").quiet();

// Escape user input — prefer template interpolation which escapes args
const user = "a; rm -rf /";
await $`echo ${user}`; // safe interpolation
```

Use `Bun.spawn` / `Bun.spawnSync` for lower-level process control (stdio pipes, exit codes).

## SQLite — bun:sqlite

```ts
import { Database } from "bun:sqlite";

const db = new Database("app.db"); // or ":memory:"
db.exec("PRAGMA journal_mode = WAL;");

const insert = db.prepare("INSERT INTO users (name) VALUES (?)");
insert.run("ada");

const row = db.prepare("SELECT * FROM users WHERE id = ?").get(1);
const rows = db.prepare("SELECT * FROM users").all();

db.close();
```

Synchronous API by default; fast for local/embedded use. Prefer over `better-sqlite3` when Bun-only.

## Redis — Bun.redis

```ts
await Bun.redis.set("k", "v");
await Bun.redis.get("k");
// Connection via REDIS_URL / options — confirm current docs for client construction
```

Pub/sub and some advanced commands may be **experimental** — verify before production.

## SQL — Bun.SQL

Postgres (and documented SQL backends) via tagged templates:

```ts
import { SQL } from "bun";

const sql = new SQL(process.env.DATABASE_URL!);
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Prefer parameterized tagged templates (interpolation is escaped). Check docs for transactions, pools, and MySQL/SQLite SQL driver status on your Bun version.

## S3

```ts
const s3 = new Bun.S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bucket: "my-bucket",
  // region / endpoint as needed
});

await s3.write("key.txt", "hello");
const file = s3.file("key.txt");
await file.text();
```

Useful for R2-compatible and S3-compatible endpoints — confirm endpoint/region options in current docs.

## Hashing / passwords

```ts
await Bun.password.hash("secret");
await Bun.password.verify("secret", hash);

Bun.hash("input");
new Bun.CryptoHasher("sha256").update("x").digest("hex");
```

Prefer `Bun.password` for password storage (Argon2/bcrypt family per docs).

## HTMLRewriter

Cloudflare-style HTML streaming transform — useful for edge-like HTML rewriting without a full DOM.

## Workers

```ts
const worker = new Worker(new URL("./worker.ts", import.meta.url).href);
worker.postMessage({ type: "start" });
```

Some terminate / transfer behaviors differ from browsers — treat advanced Worker features as version-sensitive.

## FFI — bun:ffi (experimental)

```ts
import { dlopen, FFIType, suffix } from "bun:ffi";
// Map C symbols — prefer Node-API native addons for production-critical FFI
```

Document as experimental; prefer stable native modules via Node-API when reliability matters.

## Utilities worth knowing

| API | Role |
|---|---|
| `Bun.sleep` / `Bun.sleepSync` | Timers |
| `Bun.which` | Resolve executable on PATH |
| `Bun.DeepEquals` / `Bun.deepEquals` | Deep equality helpers (confirm export) |
| `Bun.peek` | Inspect promise result without await when settled |
| `Bun.nanoseconds` | High-res time |
| `import.meta.main` | Is this the entry module? |
| `import.meta.path` / `dir` | File path helpers |
| `Bun.main` | Entry path |
| `Bun.argv` | CLI args |
| `Bun.version` / `Bun.revision` | Runtime version |

## When to keep Node APIs

- Isomorphic libraries that must run on Node and Bun
- Mature Node ecosystem packages that already work
- Missing or experimental Bun-native coverage

`node:fs`, `node:path`, `node:http`, etc. are largely available — see [node-compat-config.md](node-compat-config.md).
