# Node Compatibility and Config

Node.js API compatibility, globals, watch/hot, environment loading, `bunfig.toml`, and 1.3→1.4 behavior changes.

## Compatibility stance

Bun implements a large portion of Node’s API surface, targeting **Node.js v26** (`process.versions.node`-style reporting; `process.versions.modules` is **147**). Many `node:*` modules work; some are partial or missing.

Live matrix: https://bun.com/docs/runtime/nodejs-compat

1.4 added +1,517 passing Node test-suite files vs 1.3. `node:http`, `node:fs`, `node:cluster`, `node:timers`, `node:zlib`, `node:vm`, and `node:stream` pass ~97% of Node’s own tests; `node:quic` ~99%; `node:events`, `node:trace_events`, and `node:sqlite` 100%. Playwright, Next.js 16 (`bun --bun next build`), vitest (including `--coverage`), OpenTelemetry http/fs instrumentation, and `dd-trace` are documented as working.

**Workflow for migrations:**

1. Run the app/tests under Bun unchanged.
2. Fix failures by:
   - switching to a Bun-native API, or
   - polyfilling / replacing an unsupported Node API, or
   - keeping that path on Node until support lands.
3. Consult the live matrix.

Do not claim 100% Node compatibility. Report specific modules that fail.

## Common globals and modules

Available in typical Bun apps:

- Web: `fetch`, `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, `URLPattern`, `AbortController`, `ReadableStream`, `CompressionStream`, `DecompressionStream`, …
- Timers: `setTimeout`, `setInterval`, `queueMicrotask`
- Encoding: `TextEncoder`, `TextDecoder`, `atob`, `btoa`
- `performance`, `crypto` (Web Crypto; ML-DSA / ML-KEM available)
- `Buffer` (Node-compatible; single Buffer capped at 4 GiB)
- `process` (including `process.env`, `process.argv`, `process.cwd`, …)
- `console`, `__dirname` / `__filename` — prefer `import.meta`
- `Temporal` and `Date.prototype.toTemporalInstant` are **on by default** (`BUN_JSC_useTemporal=0` to disable)

Prefer `node:`-prefixed imports when using Node APIs:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
```

## process.env vs Bun.env

- **`process.env`** — standard, mutable, preferred when values change during process lifetime.
- **`Bun.env`** — snapshot-oriented view of environment at launch; do not assume live updates.

Auto-loading: `bun file.js` loads `.env`, `.env.local`, `.env.development` / `.env.production` (and related) with documented precedence. Disable with `--no-env-file` or `env = false` in bunfig. `--env-file` can read pipes, FIFOs, and `/dev/stdin`.

When Bun is invoked **as `node`** (`bun --bun`, `bunx --bun`, a `node` symlink), it does **not** load `.env*` files. Pass `--env-file` to keep them.

Do not double-load with `dotenv` unless you need identical Node behavior.

## Watch and hot reload

```sh
bun --watch ./src/index.ts    # hard restart on change
bun --hot ./src/index.ts      # soft reload; globalThis can persist
bun --watch run dev           # flags BEFORE run
```

| Mode | Behavior | Best for |
|---|---|---|
| `--watch` | Process restart | CLIs, one-shot scripts, tests |
| `--hot` | Soft reload | Long-lived servers (`Bun.serve`) preserving in-memory state on `globalThis` |

`bun test --watch` re-runs tests on change. `--no-orphans` exits when the parent dies and SIGKILLs descendants.

## TypeScript

- Bun executes `.ts` / `.tsx` directly (transpiles, does not fully typecheck).
- Add `bun add -d @types/bun` and **`"types": ["bun"]`** — required on TypeScript 6/7 (they no longer auto-discover `@types/*`).
- For CI type safety: `tsc --noEmit` (or your project’s typecheck script).
- `paths` / `baseUrl` in tsconfig: Bun resolves many TS path aliases — verify complex setups.
- `"jsx": "react-jsx"` now emits `jsx`/`jsxs` from `jsx-runtime` (not `jsxDEV` unless `"jsx": "react-jsxdev"` or an explicit `NODE_ENV`).
- `useDefineForClassFields: false` is honored (was ignored).
- TypeScript 7.1+: import attributes type `with { type: "text" | "sqlite" | "xml" | … }`.

## Debugger and profiles

```sh
bun --inspect ./src/index.ts
bun --inspect-brk ./src/index.ts
bun --cpu-prof ./app.ts          # .cpuprofile
bun --cpu-prof-md ./app.ts       # Markdown hot-function report
bun --heap-prof ./app.ts         # V8-compatible .heapsnapshot
bun --heap-prof-md ./app.ts
```

`BUN_CPU_PROFILE=1` turns on the CPU profiler when you cannot pass flags. Use Chrome DevTools or compatible clients against the inspector URL Bun prints. `bun --inspect` is the supported debugger; `Bun.serve({ inspector: true })` is gone.

`bun repl` is native (no npm download): top-level await, `_` / `_error`, bare object literals.

## bunfig.toml overview

Project root `bunfig.toml` (optional global `~/.bunfig.toml` / `$XDG_CONFIG_HOME/.bunfig.toml` for package-manager commands). Project overrides global. **Strings must be quoted** — unquoted values are a `SyntaxError`. Integers past `Number.MAX_SAFE_INTEGER` are also errors. Project bunfig overrides `.npmrc` for the same key.

```toml
preload = ["./src/preload.ts"]

[install]
exact = true
linker = "isolated"
globalStore = false
# offline = false
# prefer = "offline"
# frozenLockfile = false
# minimumReleaseAge = 259200

[install.scopes]
# "@myorg" = { url = "https://npm.example.com", token = "$NPM_TOKEN" }

[run]
bun = true
# shell = "system"
# noOrphans = true
# silent = true

[test]
coverage = true
# preload = ["./test/setup.ts"]
# root = "./src"
# retry = 3
# pathIgnorePatterns = ["vendor/**"]

[serve]
# port = 3000

[serve.static]
# sourcemap = "linked"

[env]
# file = false   # skip automatic .env load

[console]
# depth = 3
```

Also relevant:

- `package.json` `"trustedDependencies"` / `"nativeDependencies"` / `"ignoreScripts"`
- `.npmrc` for registry auth
- `NODE_ENV` / `BUN_ENV` patterns per docs

## CLI flags agents should remember

```sh
bun --version
bun --revision
bun --print "1+1"              # evaluate expression
bun --eval "console.log(1)"
bun --filter <pattern> run … # workspaces
bun --cwd <dir>
bun --env-file=.env.custom
bun --no-env-file
bun --define KEY=value         # build/runtime define
bun --smol                     # lower memory tradeoffs
bun --cpu-prof / --heap-prof / --cpu-prof-md / --heap-prof-md
bun --no-orphans
bun --no-ffi-cc
bun --experimental-http3-fetch
```

Always put **runtime flags before** the script subcommand:

```sh
bun --hot run server
bun --env-file=.env.test test
```

## Platforms (1.4)

Official binaries: macOS arm64/x64, Linux arm64/x64 (glibc ≥ 2.17; kernel ≥ 3.10), Windows x64 and **Windows ARM64**, FreeBSD x64/arm64. x64 releases are baseline-only (AVX dispatched at runtime; `-baseline` packages are aliases). Android aarch64/x64 is experimental.

## Partial / problematic areas (check matrix)

Treat as “verify before relying”:

- Some `node:vm`, `node:cluster`, `node:domain`, `node:inspector` behaviors
- Certain native Node addons (non–Node-API, or prebuilds keyed to the wrong `NODE_MODULE_VERSION`)
- Edge cases in `node:http2` (no gRPC trailers on `Bun.serve` HTTP/2), worker_threads parity
- Experimental Bun features: HTTP/2 and HTTP/3 on `Bun.serve`/`fetch`, Redis pub/sub, `bun:ffi`, `Bun.WebView`, some Worker APIs
- `node:sea` is not implemented — use `bun build --compile`

When blocked: use Bun-native alternative, a pure-JS package, or run that component under Node.

## 1.3 → 1.4 breaking changes

Most apps keep working. Highest-impact items:

| Change | What to do |
|---|---|
| Reports Node **26**; `process.versions.modules` **147** | Rebuild native addons that pick prebuilds by `NODE_MODULE_VERSION` |
| `res.writeHeader()` removed | Use `res.writeHead()` |
| Paused `readable.read()` (no size) returns **one** chunk | Loop until `null` (`setEncoding()` keeps old behavior) |
| New workspaces default to **isolated** linker | Existing lockfiles stay hoisted; pin `linker = "hoisted"` if needed |
| `bunfig.toml` / `Bun.TOML` **strict** | Quote strings; no missing newlines; no unsafe integers |
| Invoked as `node` → **no** auto `.env` | Pass `--env-file` |
| `Bun.YAML` is YAML **1.2** | `yes`/`no`/`on`/`off` are strings (`on: push` → `{ on: "push" }`) |
| `.xml` import returns parsed object | `--loader .xml:file` for a path string |
| `.css` runtime default export is `{}` | Was the absolute path |
| `"jsx": "react-jsx"` uses production runtime | Set `"jsx": "react-jsxdev"` to keep `jsxDEV` |
| `bun:ffi` `cstring` is a plain string; `CString` has no `.ptr` | Keep the original pointer to free |
| `--compile` does not auto-load tsconfig/package.json | Opt in with `--compile-autoload-*` |
| `fs.rmdir({ recursive: true })` throws | Use `fs.rm(path, { recursive: true, force: true })` |
| `Bun.cron` in-process / `parse()` use **local** time | Pass `{ tz: "UTC" }` to keep UTC |
| `Bun.$` globs only template literals | Write `**/*` in the template, not `${pattern}` |
| `Request`/`Response#clone()` throws if body already read | `clone()` first |
| Duplicate fetch/`Bun.serve` headers joined with `,` | Was last-wins |
| `tls.connect` default `servername` is `host` | Pass `servername` when connecting by IP |
| `Bun.connect` / `Bun.listen` default `rejectUnauthorized: true` | Pass CA or `rejectUnauthorized: false` |
| `server.stop()` waits for in-flight requests | Use `stop(true)` to force |
| `jest.resetAllMocks()` drops implementations | Use `clearAllMocks()` for history-only |
| `bun update <name>` errors if unused | It no longer adds the package |
| `bun feedback` removed | Use GitHub issues |
| Argon2 `memoryCost` ≥ 8 | Old lower-cost hashes still verify |
| `Bun.Socket#setKeepAlive` delay is **milliseconds** | Was treated as seconds |
| `Bun.mmap({ offset })` view starts at `offset` | Was page-rounded |
| `import "."` / `".."` resolve as directories | Was a sibling file with the directory’s name |

Security defaults also tightened (TLS hostname checks, `checkServerIdentity` before sending `fetch` bodies, Redis TLS hostname, tarball path traversal). A connection that worked on 1.3 may now fail verification — that is intentional.

## Config decision guide

| Goal | Prefer |
|---|---|
| Reproducible CI installs | `bun ci` + committed `bun.lock` |
| Strict node_modules | `linker = "isolated"` (new workspaces) |
| Faster warm isolated installs | `globalStore = true` (isolated only) |
| Max compatibility with tools expecting flat node_modules | `linker = "hoisted"` |
| Run lifecycle scripts for native pkgs | `trustedDependencies` / `bun pm trust` |
| Force scripts to use Bun instead of node | `[run] bun = true` or `bun --bun` |
| Dev server iteration | `bun --hot` + `Bun.serve` |
| Type safety gate | separate `tsc --noEmit` + `"types": ["bun"]` |
| Profile a hang | `--cpu-prof-md` / `--heap-prof-md` |
