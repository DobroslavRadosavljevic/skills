# Test, Bundler, and Build

`bun test`, `bun build`, `--compile`, and project templates.

## bun test

Jest-compatible test runner built into Bun.

```ts
import { describe, expect, test, beforeAll, afterAll, mock, spyOn } from "bun:test";

describe("user service", () => {
  test("creates user", async () => {
    expect(await createUser("ada")).toMatchObject({ name: "ada" });
  });

  test.skip("flaky", () => {});
  test.todo("later");
});
```

### CLI

```sh
bun test
bun test ./src
bun test ./src/foo.test.ts
bun test -t "creates user"       # name pattern
bun test --timeout 10000
bun test --coverage
bun test --coverage-reporter=lcov
bun test --reporter=junit --reporter-outfile=./junit.xml
bun test --watch
bun test --bail
bun test --preload ./test/setup.ts
```

### Matchers and mocks

- `expect(...)` — Jest-like matchers (`toBe`, `toEqual`, `toMatchObject`, `toThrow`, …)
- `mock()` / `spyOn()` — function mocks
- Snapshot testing: `toMatchSnapshot()` — commit `__snapshots__`
- Lifecycle: `beforeAll`, `beforeEach`, `afterEach`, `afterAll`

### Config (`bunfig.toml`)

```toml
[test]
coverage = true
coverageThreshold = 0.8
preload = ["./test/setup.ts"]
# root / smol / etc. — confirm current keys in docs
```

### Migration from Jest / Vitest

1. Change imports to `bun:test` (or rely on globals if configured).
2. Run `bun test`; fix matchers that differ.
3. Replace Jest-only environment packages gradually.
4. Keep Vitest/Jest only when you need features Bun lacks (certain browser envs, specific plugin ecosystems).

Guide: https://bun.com/docs/guides/test/migrate-from-jest

### What bun test is good for

- Unit and integration tests for Bun/Node-targeted TS/JS
- Fast feedback with native TypeScript execution
- CI with coverage and junit reporters

### Limits

- Not a full browser test runner (use Playwright/Cypress separately for real browsers)
- Some Jest ecosystem extensions may not exist — prefer portable tests

## bun build

Bundle for Bun, Node, or browser.

```sh
bun build ./src/index.ts --outdir=dist
bun build ./src/index.ts --target=bun --outdir=dist
bun build ./src/index.ts --target=node --format=esm
bun build ./src/app.ts --target=browser --minify --outdir=public
bun build ./src/index.ts --splitting --outdir=dist
bun build ./src/index.ts --external=react --outdir=dist
bun build ./src/index.ts --sourcemap=external
```

### API

```ts
const result = await Bun.build({
  entrypoints: ["./src/index.ts"],
  outdir: "./dist",
  target: "bun",
  minify: true,
  sourcemap: "external",
});

if (!result.success) {
  console.error(result.logs);
}
```

### Important limits

- **Does not typecheck** — run `tsc --noEmit` separately when types are a gate.
- **Does not emit `.d.ts`** — use `tsc` for declarations.
- Prefer explicit `--target` matching the runtime that will execute the output.

### Plugins

Bun supports bundler plugins for custom loaders — see https://bun.com/docs/bundler/plugins. Prefer built-in loaders (TS, JSX, CSS, JSON) first.

## Standalone executables — `--compile`

```sh
bun build ./src/cli.ts --compile --outfile=mycli
./mycli --help
```

Produces a single binary embedding the Bun runtime and your code for the **compile host** (cross-compilation flags exist — verify `--target` / OS flags in current docs before relying on them).

Use for CLIs and simple services where distributing a binary is better than requiring Bun installed.

Caveats:

- Binary size includes runtime
- Native bindings and dynamic requires need careful testing
- Prefer smoke-testing the binary on each release target OS

## Templates — bun init / bun create

```sh
bun init
bun init -y
bun create <template> <dest>
```

`bun create` scaffolds from official or remote templates. Prefer `bun init` for minimal apps; `bun create` for framework starters.

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
| CI reporting | coverage / junit flags as needed |
| Bundle for Bun | run `bun dist/entry.js` or import smoke |
| Bundle for Node | run under `node` as well |
| `--compile` | execute binary; check exit code / `--help` |
| Snapshot updates | review `__snapshots__` diffs before commit |
