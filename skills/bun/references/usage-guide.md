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

Pin in CI with `oven-sh/setup-bun` and an explicit version (e.g. `1.3.14`).

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

`tsconfig.json` should include `"types": ["bun"]` (or rely on `@types/bun` package defaults). Bun runs TypeScript natively — no `tsc` required for execution.

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

1. Install Bun locally / in CI.
2. From the project root:

   ```sh
   bun install
   ```

   Bun reads `package.json`, may consume npm/yarn/pnpm lockfiles on first migrate, and writes **`bun.lock`**.

3. Commit `bun.lock`. Remove other lockfiles once the team standardizes on Bun (avoid dual lockfile drift).
4. Switch scripts gradually:
   - `node` → `bun` for app entrypoints
   - `jest` / `vitest` → `bun test` when Jest-like API is enough
   - Keep Node for packages that require unsupported native addons until verified
5. Run the existing test suite under Bun; note failures in [node-compat-config.md](node-compat-config.md).
6. Only then introduce Bun-native APIs (`Bun.serve`, `bun:sqlite`, …).

## 5. Package management day-to-day

```sh
bun install                 # install from lockfile / package.json
bun ci                      # frozen lockfile (CI)
bun add lodash              # dependency
bun add -d typescript       # devDependency
bun add -g neonctl          # global (optional)
bun remove lodash
bun update                  # update within ranges
bun outdated
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
bun run --filter './packages/*' test
```

**Catalogs** (shared versions) and **overrides** — see [package-manager.md](package-manager.md).

**Linker:** new projects often use **isolated** installs; older lockfiles may stay **hoisted**. Do not flip linker casually mid-project.

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

## 7. First HTTP server (Bun-native)

```ts
const server = Bun.serve({
  port: 3000,
  routes: {
    "/": () => new Response("ok"),
    "/api/:id": (req) => Response.json({ id: req.params.id }),
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

Use `port: 0` in tests to bind an ephemeral port, then `server.port` / `server.url`.

## 8. Files, env, shell

```ts
const text = await Bun.file("./data.json").text();
await Bun.write("./out.txt", "hello");

// Env: process.env for mutable; Bun.env is a snapshot at launch
const port = Number(process.env.PORT ?? 3000);

// Shell (Bun.$)
import { $ } from "bun";
const { stdout } = await $`ls -la`.quiet();
```

`.env`, `.env.local`, `.env.[NODE_ENV]` load automatically (see docs for precedence).

## 9. SQLite / Redis / SQL (Bun-first)

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

Prefer these over Node `better-sqlite3` / `ioredis` when targeting Bun only. Keep Node clients if you must stay isomorphic with Node deployments.

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
```

Jest-like API (`describe`/`it`/`expect`/`mock`/`spyOn`). Snapshots and coverage are built in. See [test-bundler-build.md](test-bundler-build.md).

## 11. Bundling and executables

```sh
bun build ./src/index.ts --outdir=dist --target=bun
bun build ./src/cli.ts --compile --outfile=mycli
```

- `bun build` does **not** typecheck or emit declaration files — use `tsc --noEmit` / `tsc -d` when needed.
- `--compile` produces a single binary for the **host** platform (cross-compile flags exist; verify current docs).
- Prefer `--target=bun` for Bun servers; `--target=browser` / `node` when emitting for those runtimes.

## 12. bunfig.toml (minimal)

```toml
[install]
exact = true
# linker = "isolated"

[run]
bun = true

[test]
coverage = true
```

Project `bunfig.toml` overrides global. Full keys: [node-compat-config.md](node-compat-config.md) and official bunfig docs.

## 13. Progressive adoption path

1. **Install only** — `bun install` / `bun ci` while still running with Node.
2. **Run scripts** — `bun run` / replace `node` with `bun` for TS/JS entrypoints.
3. **Tests** — `bun test` for new or portable suites.
4. **Native APIs** — `Bun.serve`, `Bun.file`, `bun:sqlite` where Bun is the only runtime.
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
| Types missing for `Bun` | `bun add -d @types/bun`, `"types": ["bun"]` |
| Native addon fails | Node-API module may be incomplete under Bun — try Bun-native API or Node fallback |
| Monorepo weird resolution | Confirm linker (isolated vs hoisted) and workspace filters |

## 15. What not to do

- Do not commit both `bun.lock` and npm/pnpm lockfiles as sources of truth.
- Do not assume every Node builtin and every native addon works — verify against the compat matrix.
- Do not use `bun:ffi` for production-critical paths without a fallback plan.
- Do not treat `bun build` as a full TypeScript project compiler.
- Do not flip install linker mid-flight without regenerating lockfile and validating all packages.
