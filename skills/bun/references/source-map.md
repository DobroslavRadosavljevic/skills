# Source Map

This reference captures the Bun docs and package snapshot used to create the skill.

## Snapshot

- Captured: 2026-07-30
- Stable Bun: **1.3.14** (GitHub `bun-v1.3.14`, 2026-05-13)
- npm package `bun` `latest`: **1.3.14**
- Docs: https://bun.com/docs
- Machine index: https://bun.com/docs/llms.txt
- Context7 IDs: `/websites/bun`, `/websites/bun_sh`, `/oven-sh/bun`, `/llmstxt/bun_llms_txt`
- Node compatibility matrix targets roughly **Node.js v23** APIs

Local installs may lag (e.g. 1.3.11). Prefer `bun upgrade` before relying on newest APIs.

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
4. Re-check experimental APIs (HTTP/3, Redis pub/sub, FFI, Workers) against current docs.
5. For lockfile/linker defaults, confirm `bun.lock` `configVersion` and `[install].linker` in bunfig.

## Official Pages

### Getting started

- Docs home: https://bun.com/docs
- Installation: https://bun.com/docs/installation
- TypeScript: https://bun.com/docs/typescript
- Runtime overview: https://bun.com/docs/runtime
- Bun APIs: https://bun.com/docs/runtime/bun-apis
- bunfig: https://bun.com/docs/runtime/bunfig
- Globals: https://bun.com/docs/runtime/globals
- Node compat: https://bun.com/docs/runtime/nodejs-compat
- Watch / hot: https://bun.com/docs/runtime/watch-mode
- Debugger: https://bun.com/docs/runtime/debugger
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

### Data / I/O

- File I/O: https://bun.com/docs/runtime/file-io
- Shell: https://bun.com/docs/runtime/shell
- Child process: https://bun.com/docs/runtime/child-process
- SQLite: https://bun.com/docs/runtime/sqlite
- SQL: https://bun.com/docs/runtime/sql
- Redis: https://bun.com/docs/runtime/redis
- S3: https://bun.com/docs/runtime/s3
- Hashing: https://bun.com/docs/runtime/hashing
- HTMLRewriter: https://bun.com/docs/runtime/html-rewriter
- Workers: https://bun.com/docs/runtime/workers
- FFI: https://bun.com/docs/runtime/ffi

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
- npm → bun: https://bun.com/docs/guides/install/from-npm-install-to-bun-install
- setup-bun Action: https://github.com/oven-sh/setup-bun

### Test / bundler / templates

- Test: https://bun.com/docs/test · https://bun.com/docs/cli/test
- Writing tests: https://bun.com/docs/test/writing-tests
- Mocks / snapshots / coverage / config: under https://bun.com/docs/test/
- Migrate from Jest: https://bun.com/docs/guides/test/migrate-from-jest
- Bundler: https://bun.com/docs/bundler
- Executables: https://bun.com/docs/bundler/executables
- Plugins: https://bun.com/docs/bundler/plugins
- bun init: https://bun.com/docs/runtime/templating/init
- bun create: https://bun.com/docs/runtime/templating/create
- patch / link / publish: https://bun.com/docs/pm/cli/patch · link · publish
