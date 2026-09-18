# Source Map

This reference captures the Bun docs and package snapshot used to create the skill.

## Snapshot

- Captured: **2026-09-18**
- Stable Bun: **1.4.2** (GitHub `bun-v1.4.2`, 2026-09-05; commit `744846f`)
- Line: **1.4.0** (2026-08-20) → **1.4.1** (2026-09-04) → **1.4.2** (2026-09-05)
- npm `bun` `latest`: **1.4.2**
- npm `@types/bun` `latest`: **1.4.2** (2026-09-08; depends on `bun-types@1.4.2`)
- npm `bun-types` `latest`: **1.4.2** (canaries exist on 1.4.3; ignore unless the user is on canary)
- Docs: https://bun.com/docs
- Machine index: https://bun.com/docs/llms.txt
- Blog: https://bun.com/blog · 1.4: https://bun.com/blog/bun-v1.4 · 1.4.1: https://bun.com/blog/bun-v1.4.1 · 1.4.2: https://bun.com/blog/bun-v1.4.2
- Context7 IDs: `/websites/bun`, `/websites/bun_sh`, `/oven-sh/bun`, `/oven-sh/bun/bun-v1.4.2`, `/llmstxt/bun_llms_txt`
- Node compatibility matrix targets **Node.js v26** (`process.versions.modules` **147**)

Local installs may lag on 1.3.x. Prefer `bun upgrade` before relying on 1.4 APIs.

## In-skill usage guide

- Full how-to: [usage-guide.md](usage-guide.md)

## Refresh Procedure

1. Resolve current docs before answering “latest” questions.
2. Check versions:

   ```sh
   bun --version
   bun --revision
   ```

3. Prefer https://bun.com/docs/ and https://bun.com/docs/llms.txt. If docs and the installed binary disagree, report the mismatch.
4. Re-check experimental APIs (HTTP/2, HTTP/3, Redis pub/sub, FFI, WebView, Workers) against current docs.
5. For lockfile/linker defaults, confirm `bun.lock` `lockfileVersion` / `configVersion` and `[install].linker` / `globalStore` in bunfig.

## Official Pages

### Getting started

- Docs home: https://bun.com/docs
- Installation: https://bun.com/docs/installation
- TypeScript: https://bun.com/docs/typescript
- TypeScript 6 and 7: https://bun.com/docs/typescript-6
- Runtime overview: https://bun.com/docs/runtime
- Bun APIs: https://bun.com/docs/runtime/bun-apis
- bunfig: https://bun.com/docs/runtime/bunfig
- Globals: https://bun.com/docs/runtime/globals
- Node compat: https://bun.com/docs/runtime/nodejs-compat
- Watch / hot: https://bun.com/docs/runtime/watch-mode
- Debugger: https://bun.com/docs/runtime/debugger
- REPL: https://bun.com/docs/runtime/repl
- Env: https://bun.com/docs/runtime/environment-variables
- Reference: https://bun.com/reference
- Releases: https://github.com/oven-sh/bun/releases

### HTTP / networking

- Bun.serve: https://bun.com/docs/runtime/http/server
- Routing: https://bun.com/docs/runtime/http/routing
- TLS: https://bun.com/docs/runtime/http/tls
- WebSockets: https://bun.com/docs/runtime/http/websockets
- Cookies: https://bun.com/docs/runtime/cookies
- Fetch: https://bun.com/docs/runtime/networking/fetch
- DNS: https://bun.com/docs/runtime/networking/dns
- Streams: https://bun.com/docs/runtime/streams

### Data / I/O / stdlib

- File I/O: https://bun.com/docs/runtime/file-io
- Shell: https://bun.com/docs/runtime/shell
- Child process: https://bun.com/docs/runtime/child-process
- SQLite: https://bun.com/docs/runtime/sqlite
- SQL: https://bun.com/docs/runtime/sql
- Redis: https://bun.com/docs/runtime/redis
- S3: https://bun.com/docs/runtime/s3
- Image: https://bun.com/docs/runtime/image
- WebView: https://bun.com/docs/runtime/webview
- Markdown: https://bun.com/docs/runtime/markdown
- Cron: https://bun.com/docs/runtime/cron
- JSON5: https://bun.com/docs/runtime/json5
- JSONL: https://bun.com/docs/runtime/jsonl
- XML: https://bun.com/docs/runtime/xml
- TOML: https://bun.com/docs/runtime/toml
- YAML: https://bun.com/docs/runtime/yaml
- Archive: https://bun.com/docs/runtime/archive
- Hashing: https://bun.com/docs/runtime/hashing
- HTMLRewriter: https://bun.com/docs/runtime/html-rewriter
- Workers: https://bun.com/docs/runtime/workers
- FFI: https://bun.com/docs/runtime/ffi
- CSRF: https://bun.com/docs/runtime/csrf
- Secrets: https://bun.com/docs/runtime/secrets

### Package manager

- Install: https://bun.com/docs/pm/cli/install
- Add / remove / update / outdated: under https://bun.com/docs/pm/cli/
- Lockfile: https://bun.com/docs/pm/lockfile
- Workspaces: https://bun.com/docs/pm/workspaces
- Catalogs: https://bun.com/docs/pm/catalogs
- Overrides: https://bun.com/docs/pm/overrides
- Lifecycle / trust: https://bun.com/docs/pm/lifecycle
- bunx: https://bun.com/docs/pm/bunx
- `.npmrc`: https://bun.com/docs/pm/npmrc
- Isolated installs: https://bun.com/docs/pm/isolated-installs
- Global virtual store: https://bun.com/docs/pm/global-store
- Audit: https://bun.com/docs/pm/cli/audit
- Dedupe: https://bun.com/docs/pm/cli/dedupe
- Prune: https://bun.com/docs/pm/cli/prune
- npm → bun: https://bun.com/docs/guides/install/from-npm-install-to-bun-install
- setup-bun Action: https://github.com/oven-sh/setup-bun

### Test / bundler / templates

- Test: https://bun.com/docs/test · https://bun.com/docs/cli/test
- Writing tests: https://bun.com/docs/test/writing-tests
- Parallel / isolate / shard: https://bun.com/docs/test/parallel
- Mocks / snapshots / coverage / config: under https://bun.com/docs/test/
- Migrate from Jest: https://bun.com/docs/guides/test/migrate-from-jest
- Bundler: https://bun.com/docs/bundler
- Executables: https://bun.com/docs/bundler/executables
- Bytecode: https://bun.com/docs/bundler/bytecode
- Plugins: https://bun.com/docs/bundler/plugins
- bun init: https://bun.com/docs/runtime/templating/init
- bun create: https://bun.com/docs/runtime/templating/create
- patch / link / publish: https://bun.com/docs/pm/cli/patch · link · publish
