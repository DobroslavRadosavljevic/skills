# Usage Guide

How to adopt Bun for installs, scripts, runtime code, tests, and builds. Prefer this guide for day-to-day work; use the sibling references for API and CLI depth.

## 1. Install Bun

```sh
curl -fsSL https://bun.com/install | bash
# or
brew install oven-sh/bun/bun
bun --version
bun upgrade          # update to latest stable
```

Pin in CI with `oven-sh/setup-bun` and an explicit version (e.g. `1.4.2`).

## 2. New project

```sh
mkdir my-app && cd my-app
bun init                 # interactive; creates package.json, tsconfig, index
# or
bun init -y              # defaults
```

Add TypeScript types for Bun globals:

```sh
bun add -d @types/bun
```

`tsconfig.json` should include `"types": ["bun"]`. **TypeScript 6/7 no longer auto-discovers `@types/*`** — without that field, editors report `Cannot find name Bun`. Bun runs TypeScript natively — no `tsc` required for execution.

## 3. Prefer bun / bunx in commands

| Instead of | Use |
|---|---|
| `npm install` | `bun install` |
| `npm ci` | `bun ci` |
| `npm install pkg` | `bun add pkg` |
| `npx pkg` | `bunx pkg` |
| `node script.ts` | `bun script.ts` |
| `npm run test` | `bun test` (or `bun run test` if script wraps something else) |

Keep narrative references to the npm registry when describing package metadata; use Bun CLIs for execution.

## 4. Migrate an existing Node project

1. Install Bun locally / in CI (`1.4.2` or current stable).
2. From the project root:

   ```sh
   bun install
   ```

   Bun reads `package.json`, may consume npm/yarn/pnpm lockfiles on first migrate, and writes **`bun.lock`**.

3. Commit `bun.lock`. Remove other lockfiles once the team standardizes on Bun (avoid dual lockfile drift).
4. Switch scripts gradually:
   - `node` → `bun` for app entrypoints
   - `jest` / `vitest` → `bun test` when Jest-like API is enough
   - Keep Node for packages that require unsupported native addons until verified (rebuild for `NODE_MODULE_VERSION` **147** under 1.4)
5. Run the existing test suite under Bun; note failures in [node-compat-config.md](node-compat-config.md).
6. Only then introduce Bun-native APIs (`Bun.serve`, `bun:sqlite`, `Bun.Image`, …).

Coming from **Bun 1.3**: upgrade with `bun upgrade`, then walk the 1.3→1.4 list in [node-compat-config.md](node-compat-config.md) before relying on new APIs.

## 5. Package management day-to-day

```sh
bun install                 # install from lockfile / package.json
bun ci                      # frozen lockfile (CI)
bun add lodash              # dependency
bun add -d typescript       # devDependency
bun add -g neonctl          # global (optional)
bun remove lodash
bun update                  # update within ranges (including transitives in 1.4)
bun outdated
bun audit                   # known vulns
bun audit fix               # bump to a safe version and install
bun dedupe                  # collapse duplicate versions in bun.lock
bun prune                   # drop node_modules not in the lockfile
bun pm ls                   # why is this installed?
bun pm untrusted            # blocked lifecycle scripts
bun pm trust sharp          # allow scripts for a package
```

**Trust model:** lifecycle scripts (`postinstall`, etc.) do **not** run unless the package is in `trustedDependencies` or you trust it via CLI. After adding `sharp`, `esbuild`, or other native packages, check `bun pm untrusted`.

**Workspaces** — root `package.json`:

```json
{
  "name": "monorepo",
  "workspaces": ["packages/*", "apps/*"]
}
```

```sh
bun install
bun add zod --filter ./packages/api
bun add react --catalog
bun run --filter './packages/*' test
bun run --parallel --filter '*' test
```

**Catalogs**, **overrides**, **isolated linker**, and **global virtual store** — see [package-manager.md](package-manager.md).

**Linker:** new workspaces often use **isolated** installs; older lockfiles may stay **hoisted**. Do not flip linker casually mid-project. `globalStore` is a separate opt-in on isolated installs.

## 6. Scripts and watch modes

```json
{
  "scripts": {
    "dev": "bun --hot ./src/index.ts",
    "start": "bun ./src/index.ts",
    "test": "bun test",
    "build": "bun build ./src/index.ts --outdir=dist"
  }
}
```

Flag placement:

```sh
bun --watch run dev          # correct: flags before `run`
bun run --bun vite           # force Bun as Node for a tool
# NOT: bun run dev --watch   # --watch goes to the script, not Bun
```

- `--watch`: hard restart on file change
- `--hot`: soft reload; `globalThis` state can persist (ideal for `Bun.serve`)

`bun run --parallel build test` runs named `package.json` scripts concurrently (replaces concurrently / npm-run-all for this). `--sequential` is the same prefixed output, one at a time.

When Bun is invoked **as `node`** (`bun --bun`, `bunx --bun`, a `node` symlink), it does **not** auto-load `.env` files (Node-compatible). Pass `--env-file` to keep them.

## 7. First HTTP server (Bun-native)

```ts
const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("ok"),
    "/api/:id": (req) => Response.json({ id: req.params.id }),
    "/static/*": { dir: "./public" },
  },
  fetch(req) {
    return new Response("Not found", { status: 404 });
  },
});

console.log(`Listening on ${server.url}`);
```

Idle timeout defaults to **10 seconds**. For SSE / long streams:

```ts
Bun.serve({
  async fetch(req, server) {
    server.timeout(req, 0); // disable idle timeout
    // ... stream response
  },
});
```

Use `port: 0` in tests to bind an ephemeral port, then `server.port` / `server.url`. Directory routes handle `Range`, `ETag`, and `index.html`. HTTP/2 and HTTP/3 flags are experimental — see [runtime-apis.md](runtime-apis.md).

## 8. Files, env, shell

```ts
const text = await Bun.file("./data.json").text();
await Bun.write("./out.txt", "hello");
await Bun.write("./big.tar.gz", await fetch(url)); // streams Response to disk (1.4.1+)

// Env: process.env for mutable; Bun.env is a snapshot at launch
const port = Number(process.env.PORT ?? 3000);

// Shell (Bun.$)
import { $ } from "bun";
const { stdout } = await $`ls -la`.quiet();
```

`.env`, `.env.local`, `.env.[NODE_ENV]` load automatically for `bun file.js` (see docs for precedence). Disable with `--no-env-file` / `env = false` in bunfig.

## 9. SQLite / Redis / SQL / Image (Bun-first)

```ts
import { Database } from "bun:sqlite";
const db = new Database("app.db");
db.run("CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY, name TEXT)");
```

```ts
await Bun.redis.set("key", "value");
const v = await Bun.redis.get("key");
```

```ts
import { SQL } from "bun";
const sql = new SQL(process.env.DATABASE_URL!);
const rows = await sql`SELECT 1 AS ok`;
```

```ts
await Bun.file("photo.jpg").image().resize(400, 400, { fit: "inside" }).webp({ quality: 80 }).write("thumb.webp");
```

Prefer these over Node `better-sqlite3` / `ioredis` / `sharp` when targeting Bun only. Keep Node clients if you must stay isomorphic with Node deployments.

## 10. Testing

```ts
import { describe, expect, test, mock } from "bun:test";

describe("math", () => {
  test("adds", () => {
    expect(1 + 1).toBe(2);
  });
});
```

```sh
bun test
bun test ./src/foo.test.ts
bun test -t "adds"
bun test --coverage
bun test --parallel
bun test --changed=main
```

Jest-like API (`describe`/`it`/`expect`/`mock`/`spyOn`). Snapshots and coverage are built in. `--parallel` implies `--isolate`. See [test-bundler-build.md](test-bundler-build.md).

## 11. Bundling and executables

```sh
bun build ./src/index.ts --outdir=dist --target=bun
bun build ./src/cli.ts --compile --outfile=mycli
bun build ./src/cli.ts --compile --bytecode --target=bun-linux-x64 --outfile=mycli
```

- `bun build` does **not** typecheck or emit declaration files — use `tsc --noEmit` / `tsc -d` when needed.
- `--compile` produces a single binary. Cross-compile with `--target`; `--bytecode` works across platforms as of 1.4.1.
- Prefer `--target=bun` for Bun servers; `--target=browser` / `node` when emitting for those runtimes.

## 12. bunfig.toml (minimal)

```toml
[install]
exact = true
# linker = "isolated"
# globalStore = true   # isolated only; opt-in shared cache

[run]
bun = true

[test]
coverage = true
```

Quote every string. Project `bunfig.toml` overrides global. Full keys: [node-compat-config.md](node-compat-config.md) and official bunfig docs.

## 13. Progressive adoption path

1. **Install only** — `bun install` / `bun ci` while still running with Node.
2. **Run scripts** — `bun run` / replace `node` with `bun` for TS/JS entrypoints.
3. **Tests** — `bun test` for new or portable suites (`--parallel` when the suite is I/O-heavy).
4. **Native APIs** — `Bun.serve`, `Bun.file`, `bun:sqlite`, `Bun.Image` where Bun is the only runtime.
5. **Build / compile** — when shipping Bun-targeted artifacts or CLI binaries.

Stop at the step that matches deployment constraints.

## 14. Troubleshooting checklist

| Symptom | Check |
|---|---|
| `postinstall` did not run | `bun pm untrusted` → trust or `trustedDependencies` |
| Lockfile / node_modules mismatch | Delete `node_modules`, `bun install`; confirm single lockfile |
| Script flag ignored | Put Bun flags **before** `run` |
| SSE / long poll dies at ~10s | `server.timeout(req, 0)` |
| Env “stuck” | Prefer `process.env` over `Bun.env` |
| Env missing under `bun --bun` / `node` symlink | Pass `--env-file`; 1.4 does not auto-load `.env` when invoked as Node |
| Types missing for `Bun` | `bun add -d @types/bun`, `"types": ["bun"]` (required on TS 6/7) |
| Native addon fails | Needs a build for `NODE_MODULE_VERSION` 147, or incomplete under Bun — try Bun-native API or Node fallback |
| `TOML Parse error: Strings must be quoted` | Quote bunfig values: `linker = "isolated"` |
| Monorepo weird resolution | Confirm linker (isolated vs hoisted), `globalStore`, and workspace filters |
| Phantom `require` after enabling `globalStore` | Package never declared the dep — add it, or set `globalStore = false` |

## 15. What not to do

- Do not commit both `bun.lock` and npm/pnpm lockfiles as sources of truth.
- Do not assume every Node builtin and every native addon works — verify against the Node 26 compat matrix.
- Do not use `bun:ffi` for production-critical paths without a fallback plan.
- Do not treat `bun build` as a full TypeScript project compiler.
- Do not flip install linker or `globalStore` mid-flight without regenerating lockfile/`node_modules` and validating all packages.
- Do not ship experimental `http2: true` / `http3: true` without reading current docs and testing clients (WebSockets over HTTP/2 are unsupported).
