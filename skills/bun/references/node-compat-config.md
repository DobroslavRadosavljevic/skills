# Node Compatibility and Config

Node.js API compatibility, globals, watch/hot, environment loading, and `bunfig.toml`.

## Compatibility stance

Bun implements a large portion of Node’s API surface (roughly targeting modern Node, historically documented around **Node.js v23** APIs). Many `node:*` modules work; some are partial or missing.

**Workflow for migrations:**

1. Run the app/tests under Bun unchanged.
2. Fix failures by:
   - switching to a Bun-native API, or
   - polyfilling / replacing an unsupported Node API, or
   - keeping that path on Node until support lands.
3. Consult the live matrix: https://bun.com/docs/runtime/nodejs-compat

Do not claim 100% Node compatibility. Report specific modules that fail.

## Common globals and modules

Available in typical Bun apps:

- Web: `fetch`, `Request`, `Response`, `Headers`, `URL`, `URLSearchParams`, `AbortController`, `ReadableStream`, …
- Timers: `setTimeout`, `setInterval`, `queueMicrotask`
- Encoding: `TextEncoder`, `TextDecoder`, `atob`, `btoa`
- `performance`, `crypto` (Web Crypto)
- `Buffer` (Node-compatible)
- `process` (including `process.env`, `process.argv`, `process.cwd`, …)
- `console`, `__dirname` / `__filename` behavior depends on module format — prefer `import.meta`

Prefer `node:`-prefixed imports when using Node APIs:

```ts
import fs from "node:fs/promises";
import path from "node:path";
import { createServer } from "node:http";
```

## process.env vs Bun.env

- **`process.env`** — standard, mutable, preferred when values change during process lifetime.
- **`Bun.env`** — snapshot-oriented view of environment at launch; do not assume live updates.

Auto-loading: Bun loads `.env`, `.env.local`, `.env.development` / `.env.production` (and related) with documented precedence. Do not double-load with `dotenv` unless you need identical Node behavior.

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

`bun test --watch` re-runs tests on change.

## TypeScript

- Bun executes `.ts` / `.tsx` directly (transpiles, does not fully typecheck).
- Add `bun add -d @types/bun` and ensure types are visible (`"types": ["bun"]`).
- For CI type safety: `tsc --noEmit` (or your project’s typecheck script).
- `paths` / `baseUrl` in tsconfig: Bun resolves many TS path aliases — verify complex setups.

## Debugger

```sh
bun --inspect ./src/index.ts
bun --inspect-brk ./src/index.ts
```

Use Chrome DevTools or compatible clients against the inspector URL Bun prints. See https://bun.com/docs/runtime/debugger.

## bunfig.toml overview

Project root `bunfig.toml` (optional global in home directory). Project overrides global.

```toml
# Example — keep only keys you need; verify names against current docs

preload = ["./src/preload.ts"]

[install]
exact = true
# linker = "isolated"
# optional = false
# peer = false
# production = false
# dryRun = false
# frozenLockfile = false

[install.scopes]
# "@myorg" = { url = "https://npm.example.com", token = "$NPM_TOKEN" }

[run]
bun = true          # prefer Bun when scripts use node
# shell = "system"  # or bun shell behavior — confirm docs

[test]
coverage = true
# preload = ["./test/setup.ts"]
# root = "./src"

[serve.static]
# plugins / static options when using bun-related serve tooling
```

Also relevant:

- `package.json` `"trustedDependencies"`
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
bun --define KEY=value         # build/runtime define (confirm context)
bun --smol                     # lower memory tradeoffs when available
```

Always put **runtime flags before** the script subcommand:

```sh
bun --hot run server
bun --env-file=.env.test test
```

## Partial / problematic areas (check matrix)

Treat as “verify before relying”:

- Some `node:vm`, `node:cluster`, `node:domain` behaviors
- Certain native Node addons (non–Node-API or exotic ABIs)
- Edge cases in `node:http2`, worker_threads parity
- Experimental Bun features: HTTP/3, Redis pub/sub, `bun:ffi`, some Worker APIs

When blocked: use Bun-native alternative, a pure-JS package, or run that component under Node.

## Config decision guide

| Goal | Prefer |
|---|---|
| Reproducible CI installs | `bun ci` + committed `bun.lock` |
| Strict node_modules | `linker = "isolated"` (new repos) |
| Max compatibility with tools expecting flat node_modules | `linker = "hoisted"` |
| Run lifecycle scripts for native pkgs | `trustedDependencies` / `bun pm trust` |
| Force scripts to use Bun instead of node | `[run] bun = true` or `bun --bun` |
| Dev server iteration | `bun --hot` + `Bun.serve` |
| Type safety gate | separate `tsc --noEmit` |
