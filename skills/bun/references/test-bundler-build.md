# Test, Bundler, and Build

`bun test`, `bun build`, `--compile`, and project templates.

## bun test

Jest-compatible test runner built into Bun.

```ts
import { describe, expect, test, beforeAll, afterAll, mock, spyOn, onTestFinished } from "bun:test";

describe("user service", () => {
  test("creates user", async () => {
    expect(await createUser("ada")).toMatchObject({ name: "ada" });
  });

  test.skip("flaky", () => {});
  test.todo("later");

  test("temp resource", () => {
    const handle = open();
    onTestFinished(() => handle.close());
  });

  test("flaky network", async () => {
    await fetch("https://example.com");
  }, { retry: 5 });
});
```

`spyOn()` / `mock()` implement `Symbol.dispose` — `using spy = spyOn(obj, "method")` restores on scope exit. `jest.resetAllMocks()` / `vi.resetAllMocks()` now drop implementations (Jest-compatible); use `clearAllMocks()` to clear call history only. `jest.useFakeTimers()` drives `setTimeout` / `Date` and in-process `Bun.cron`.

### CLI

```sh
bun test
bun test ./src
bun test ./src/foo.test.ts
bun test -t "creates user"       # name pattern (--grep is an alias)
bun test --timeout 10000
bun test --coverage
bun test --coverage-reporter=lcov
bun test --reporter=junit --reporter-outfile=./junit.xml
bun test --watch
bun test --bail
bun test --preload ./test/setup.ts
bun test --only-failures
bun test --pass-with-no-tests
bun test --retry 3
bun test --changed               # uncommitted
bun test --changed=main          # diff against a branch/commit
bun test --parallel              # files across CPU workers; implies --isolate
bun test --parallel=4 --isolate
bun test --parallel --no-isolate # faster; workers share a global
bun test --shard=1/3
bun test --timings=timings.json --update-timings
bun test --shard=1/3 --parallel --timings=timings.json
```

`--parallel` hands files to workers (`BUN_TEST_WORKER_ID` / `JEST_WORKER_ID`, 1-based). Coverage and JUnit merge. `--isolate` (default under `--parallel`) gives each file a fresh `globalThis` and module registry. `--no-isolate` is faster for huge suites of tiny files that do not leak state.

`--shard=M/N` is 1-based, deterministic, Jest/Vitest/Playwright-compatible. Empty shards exit 0. `--timings` balances shards/workers by recorded duration (slowest first).

### Matchers and mocks

- `expect(...)` — Jest-like matchers (`toBe`, `toEqual`, `toMatchObject`, `toThrow`, …). Temporal objects compare **by value**.
- `mock()` / `spyOn()` — function mocks
- Snapshot testing: `toMatchSnapshot()` — commit `__snapshots__`
- Lifecycle: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`, `onTestFinished`

### Config (`bunfig.toml`)

```toml
[test]
coverage = true
coverageThreshold = 0.8
preload = ["./test/setup.ts"]
pathIgnorePatterns = ["vendor/**"]
retry = 3
onlyFailures = false
randomize = false
```

### Migration from Jest / Vitest

1. Change imports to `bun:test` (or rely on globals if configured).
2. Run `bun test`; fix matchers that differ.
3. Replace Jest-only environment packages gradually.
4. Keep Vitest/Jest only when you need features Bun lacks (certain browser envs, specific plugin ecosystems). Vitest and Playwright also run **under** Bun as of 1.4.

Guide: https://bun.com/docs/guides/test/migrate-from-jest

### What bun test is good for

- Unit and integration tests for Bun/Node-targeted TS/JS
- Fast feedback with native TypeScript execution
- CI with `--parallel` / `--shard` / `--timings`, coverage, and junit reporters

### Limits

- Not a full browser test runner (use Playwright, or experimental `Bun.WebView`, separately for real browsers)
- Some Jest ecosystem extensions may not exist — prefer portable tests
- `--parallel` re-evaluates imports per file under `--isolate`; tiny CPU-bound suites can be faster serial

## bun build

Bundle for Bun, Node, or browser.

```sh
bun build ./src/index.ts --outdir=dist
bun build ./src/index.ts --target=bun --outdir=dist
bun build ./src/index.ts --target=node --format=esm
bun build ./src/app.ts --target=browser --minify --outdir=public
bun build ./src/index.ts --splitting --outdir=dist
bun build ./src/index.ts --splitting --min-chunk-size=16384 --outdir=dist
bun build ./src/index.ts --external=react --outdir=dist
bun build ./src/index.ts --sourcemap=external
bun build ./src/index.tsx --react-compiler --outdir=dist
bun build ./src/index.ts --metafile-md=./dist/meta.md
```

### API

```ts
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  minify: true,
  sourcemap: "external",
  splitting: true,
  minChunkSize: 16 * 1024,
  reactCompiler: true,
  optimizeImports: ["antd", "@mui/material"],
  bytecode: false,
});

if (!result.success) {
  console.error(result.logs);
}
```

`--react-compiler` / `reactCompiler: true` runs React's auto-memoization inside Bun's parser (no Babel). `sideEffects: false` packages get barrel-import tree-shaking automatically; otherwise list them in `optimizeImports`.

`--splitting` with `--target browser` injects `<link rel="modulepreload">` (disable with `--no-module-preload`). Dynamic `import()` named reads are tree-shaken. `--min-chunk-size` folds small side-effect-free chunks.

### Important limits

- **Does not typecheck** — run `tsc --noEmit` separately when types are a gate.
- **Does not emit `.d.ts`** — use `tsc` for declarations.
- Prefer explicit `--target` matching the runtime that will execute the output.
- Runtime `.css` default export is `{}` (was a file path). `.xml` imports parse as objects.

### Plugins

Bun supports bundler plugins for custom loaders — see https://bun.com/docs/bundler/plugins. Prefer built-in loaders (TS, JSX, CSS, JSON, HTML, YAML, TOML, XML, JSON5) first.

## Standalone executables — `--compile`

```sh
bun build ./src/cli.ts --compile --outfile=mycli
bun build ./src/cli.ts --compile --bytecode --bytecode-depth=1 --outfile=mycli
bun build ./src/cli.ts --compile --bytecode --target=bun-windows-x64 --outfile=mycli.exe
```

```ts
await Bun.build({
  entrypoints: ["./src/cli.ts"],
  compile: {
    target: "bun-linux-x64",
    outfile: "./dist/mycli",
    execArgv: ["--smol"],
    autoloadDotenv: false,
    autoloadBunfig: false,
  },
  bytecode: true,
  minify: true,
});
```

Produces a single binary embedding the Bun runtime and your code. Cross-compilation flags exist (`--target=bun-darwin-arm64`, `bun-linux-x64`, `bun-windows-x64`, …). `--bytecode` is cross-platform as of 1.4.1 (identical cache format). `--bytecode-depth` limits how many nested function levels get bytecode ahead of time.

Compiled binaries **do not** auto-load `tsconfig.json` or `package.json` from the runtime cwd (opt in with `--compile-autoload-tsconfig` / `--compile-autoload-package-json`). `.env` and `bunfig.toml` still auto-load unless disabled. `Bun.isStandaloneExecutable` is `true` inside the binary.

Caveats:

- Binary size includes runtime (bytecode packing in 1.4.1 cut that substantially)
- Native bindings and dynamic requires need careful testing
- Prefer smoke-testing the binary on each release target OS
- macOS: codesign when distributing (`codesign` failures were reported on rare darwin-arm64 builds; re-compile on 1.4.1+)

## Templates — bun init / bun create

```sh
bun init
bun init -y
bun init --react=tanstack
bun create <template> <dest>
```

`bun create` scaffolds from official or remote templates. Prefer `bun init` for minimal apps; `bun create` for framework starters. `bun init` ships a tsconfig that works with TypeScript 7 (`"types": ["bun"]`).

## Recommended scripts

```json
{
  "scripts": {
    "dev": "bun --hot ./src/index.ts",
    "start": "bun ./src/index.ts",
    "test": "bun test",
    "test:coverage": "bun test --coverage",
    "typecheck": "tsc --noEmit",
    "build": "bun build ./src/index.ts --outdir=dist --target=bun",
    "compile": "bun build ./src/cli.ts --compile --outfile=dist/cli"
  }
}
```

Keep `typecheck` as a separate gate from `build` when TypeScript correctness matters.

## Verification matrix

| Change | Verify with |
|---|---|
| New unit tests | `bun test` path or `-t` |
| Large suite / CI | `--parallel`, `--shard`, `--timings` as needed |
| CI reporting | coverage / junit flags as needed |
| Bundle for Bun | run `bun dist/entry.js` or import smoke |
| Bundle for Node | run under `node` as well |
| `--compile` | execute binary; check exit code / `--help` |
| Snapshot updates | review `__snapshots__` diffs before commit |
