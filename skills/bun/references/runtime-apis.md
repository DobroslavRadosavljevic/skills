# Runtime APIs

Bun-native APIs for HTTP, files, shell, databases, images, and related runtime features. Prefer these in Bun-first code; keep Node APIs when sharing a Node deployment target.

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
    "/api/posts": {
      GET: () => new Response("List posts"),
      POST: async (req) => Response.json(await req.json()),
    },
    "/static/*": { dir: "./public" },
  },
  fetch(req, server) {
    return new Response("Not found", { status: 404 });
  },
  error(error) {
    return new Response(String(error), { status: 500 });
  },
});

console.log(server.url.href);
await server.stop(); // graceful: close idle keep-alives, wait for in-flight
```

`export default { fetch, routes }` is equivalent — Bun treats a default export with `fetch` as `Bun.serve` options.

### Defaults and gotchas

- **Idle timeout:** default **10 seconds** (max 255; `0` disables). Long-lived responses (SSE, streaming) need:

  ```ts
  server.timeout(req, 0); // or seconds
  ```

- **`port: 0`:** ephemeral port for tests; read `server.port` / `server.url`.
- Prefer **`routes`** for static path maps; use **`fetch`** for catch-all / middleware-style logic.
- **Directory routes** (`{ dir }`) stream with `sendfile`, set `Content-Type`/`ETag`/`Last-Modified`, serve `index.html`, and honor `Range` / conditional requests (`206` / `304` / `412`). Paths are normalized; Linux uses `O_RESOLVE_BENEATH`.
- **File bodies** (`Bun.file()`) also honor `Range` and conditionals.
- **TLS:** pass `tls: { key, cert }` (or paths per current docs).
- **WebSockets:** `websocket: { message, open, close, drain }` on the serve options; upgrade via `server.upgrade(req)` (HTTP/1.1 only).
- **`server.stop()`** closes idle keep-alives immediately and waits for in-flight responses. `server.stop(true)` force-closes. `server.closeIdleConnections()` closes idle sockets without stopping.
- **`server.publish()`** returns byte count, `0` (dropped / no subscribers), or `-1` (backpressure).
- Production HTML routes do **not** serve sourcemaps; set `[serve.static] sourcemap` in bunfig to override.

### HTTP/2 and HTTP/3 (experimental)

```ts
Bun.serve({
  tls: { key, cert },
  http2: true, // ALPN over TLS; prior-knowledge on cleartext
  // http3: true, // UDP/QUIC on the same port; Alt-Svc advertised
  // http1: false, // refuse HTTP/1.x (also disables WebSocket upgrades)
  fetch(req) {
    return new Response("hi");
  },
});
```

Docs still mark both as experimental. WebSockets, `server.upgrade()`, server push, and response trailers are **not** supported over HTTP/2. HTTP/3: no unix sockets; 0-RTT disabled. Do not ship `http3: true` to production yet.

## Fetch and networking

```ts
const res = await fetch("https://example.com");
const data = await res.json();

await fetch(url, {
  method: "POST",
  body: largeJsonString,
  compress: "gzip", // or true, "deflate", "br", "zstd", { encoding, level }
});
```

- `compress` applies to buffered bodies and sets `Content-Encoding`; streaming bodies pass through.
- `proxy` accepts a string or `{ url, headers }` (e.g. `Proxy-Authorization`).
- Unix sockets reuse connections (`{ unix: "/tmp/app.sock" }`).
- TLS is verified against the **URL hostname**, not a custom `Host` header. Set `tls.servername` to verify a different name.
- Experimental client: `{ protocol: "http2" | "http3" }`.
- `localhost` / `*.localhost` resolve to loopback without the system resolver.

`Bun.write(path, response)` streams a `Response`/`Request`/`ReadableStream` to disk (does not buffer the whole body).

## File I/O

```ts
const file = Bun.file("./package.json");
file.size;
file.type;
await file.text();
await file.json();
await file.arrayBuffer();
await file.stream();
await file.image(); // Bun.Image pipeline

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

const user = "a; rm -rf /";
await $`echo ${user}`; // template interpolation escapes args
```

Only globs written **in the template** expand (`*`, `**`, braces). Characters from `${...}` are literal. Use `Bun.spawn` / `Bun.spawnSync` for lower-level process control. `terminal: { cols, rows, data }` on spawn is a built-in PTY (`Bun.Terminal`).

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
```

Connection via `REDIS_URL` / options — confirm current docs for client construction. `rediss://` verifies the TLS hostname. Pub/sub and some advanced commands may be **experimental** — verify before production.

## SQL — Bun.SQL

Postgres, MySQL, and SQLite via tagged templates:

```ts
import { SQL } from "bun";

const sql = new SQL(process.env.DATABASE_URL!);
const users = await sql`SELECT * FROM users WHERE id = ${userId}`;
```

Prefer parameterized tagged templates (interpolation is escaped). Check docs for transactions, pools, and driver status on your Bun version.

## S3

```ts
const s3 = new Bun.S3Client({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  bucket: "my-bucket",
});

await s3.write("key.txt", "hello");
const file = s3.file("key.txt");
await file.text();
await file.image(); // pipeline from object storage
```

Useful for R2-compatible and S3-compatible endpoints — confirm endpoint/region options in current docs.

## Bun.Image

Chainable decode → transform → encode (Sharp-shaped). Work runs off-thread only after you await a terminal.

```ts
await Bun.file("photo.jpg")
  .image()
  .resize(1024, 1024, { fit: "inside" })
  .rotate(90)
  .webp({ quality: 85 })
  .write("thumb.webp");

const { width, height, format } = await new Bun.Image("./photo.jpg").metadata();
const lqip = await Bun.file("hero.jpg").image().placeholder(); // ThumbHash data URL
```

JPEG/PNG/WebP everywhere; HEIC/AVIF/TIFF on macOS/Windows. CMYK/YCCK JPEGs decode to RGB (1.4.2). Do not pass user-controlled path strings to the constructor — read untrusted bytes first.

## Bun.WebView (experimental)

Headless browser: WebKit on macOS (no install), Chrome/Edge via CDP elsewhere.

```ts
await using view = new Bun.WebView({ width: 800, height: 600 });
await view.navigate("https://bun.com");
await view.click("a[href='/docs']");
const title = await view.evaluate("document.title");
await Bun.write("page.png", await view.screenshot());
```

Clicks are trusted input. Chrome backend: `view.cdp(method, params)` for raw CDP. Headful (`headless: false`) is not implemented.

## Markdown, cron, parsers

```ts
const html = Bun.markdown.html("# Hello **world**");
// HTML is not sanitized — raw HTML / javascript: hrefs pass through

using job = Bun.cron("*/5 * * * *", async () => {
  await cleanupTempFiles();
});
await Bun.cron("./worker.ts", "30 2 * * MON", "weekly-report"); // OS crontab/launchd/Task Scheduler
const next = Bun.cron.parse("*/15 * * * *"); // local TZ; pass { tz: "UTC" } to keep UTC

Bun.JSON5.parse("{ a: 1, }");
Bun.JSONL.parse('{"a":1}\n{"b":2}\n');
Bun.XML.parse(`<order id="A1"><item>Tea</item></order>`);
Bun.TOML.parse(`name = "app"`);
Bun.YAML.parse("on: push"); // YAML 1.2: "on" is a string, not true
```

Import `.json5` / `.xml` / `.toml` / `.yaml` / `.md` directly. `.xml` imports parse as objects (not a file path) — use `--loader .xml:file` for the old path export. `bun ./README.md` renders Markdown to the terminal without starting a JS VM.

## Hashing / passwords

```ts
await Bun.password.hash("secret");
await Bun.password.verify("secret", hash);

Bun.hash("input");
new Bun.CryptoHasher("sha256").update("x").digest("hex");
```

Prefer `Bun.password` for password storage (Argon2/bcrypt family per docs). Argon2 `memoryCost` must be ≥ 8; hashes made with a lower cost in 1.3 still verify. `node:crypto` `argon2` / `argon2Sync` are implemented.

## HTMLRewriter

Cloudflare-style HTML streaming transform — useful for edge-like HTML rewriting without a full DOM.

## Workers

```ts
const worker = new Worker(new URL("./worker.ts", import.meta.url).href);
worker.postMessage({ type: "start" });
```

Some terminate / transfer behaviors differ from browsers — treat advanced Worker features as version-sensitive.

## FFI — bun:ffi (experimental)

Engine-native in 1.4 (replaces TinyCC). ~3× faster calls.

```ts
import { dlopen, FFIType, suffix } from "bun:ffi";

const { symbols } = dlopen("libhash.so", {
  hash: { args: ["buffer", "buffer_length"], returns: "cstring" },
});
const digest = symbols.hash(data, data); // string | null
```

`returns: "cstring"` is a **plain string**; `NULL` is `null`. `new CString(ptr)` has **no** `.ptr` — keep the original pointer if you need to free it. `--no-ffi-cc` / `--no-addons` disable `cc()`. Prefer Node-API native addons for production-critical FFI.

## Utilities worth knowing

| API | Role |
|---|---|
| `Bun.sleep` / `Bun.sleepSync` | Timers |
| `Bun.which` | Resolve executable on PATH |
| `Bun.deepEquals` | Deep equality |
| `Bun.peek` | Inspect promise result without await when settled |
| `Bun.nanoseconds` | High-res time |
| `Bun.stringWidth` / `Bun.sliceAnsi` / `Bun.wrapAnsi` | Terminal columns, ANSI-aware |
| `Bun.Archive` | Create/extract tar off the main thread |
| `Bun.CSRF` | Tokens; optional `sessionId` binds HMAC associated data |
| `Bun.isStandaloneExecutable` | `true` inside `bun build --compile` |
| `import.meta.main` | Is this the entry module? |
| `import.meta.path` / `dir` | File path helpers |
| `Bun.main` | Entry path |
| `Bun.argv` | CLI args |
| `Bun.version` / `Bun.revision` | Runtime version |
| `process.on("memoryPressure")` | OS low-memory (`warning` / `critical`) |

`CompressionStream` / `DecompressionStream` are native (`gzip`, `deflate`, plus brotli/zstd). `URLPattern` is implemented.

## When to keep Node APIs

- Isomorphic libraries that must run on Node and Bun
- Mature Node ecosystem packages that already work
- Missing or experimental Bun-native coverage

`node:fs`, `node:path`, `node:http`, etc. are largely available — see [node-compat-config.md](node-compat-config.md).
