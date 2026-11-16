# Detection and measurement tools

Prefer what the project already has. Ask before adding a dependency. Run each tool scoped to the target with a short timeout.

## JavaScript / TypeScript

- Graph and cycles: `bunx madge --circular --extensions ts,tsx src`, `bunx madge --image graph.svg <entry>`, or `dependency-cruiser` (`bunx depcruise src --output-type err`), which can also enforce rules in CI.
- Unused exports and files: `bunx knip`.
- Bundle contents: the bundler's analyzer (`vite-bundle-visualizer`, `rollup-plugin-visualizer`, `@next/bundle-analyzer`, esbuild `--metafile` with the esbuild analyzer, `source-map-explorer`).
- Startup and import cost: `node --cpu-prof <entry>`, `NODE_DEBUG=module`, or count loaded modules with a tiny script that imports the entry and prints `Object.keys(require.cache).length` (CJS) or uses a loader hook (ESM). Bun: `bun --print` or a timing import.
- Lint guards: `import/no-cycle`, `import/no-restricted-paths`, `no-restricted-imports`, `@typescript-eslint/consistent-type-imports`, Oxlint equivalents, Nx or Turborepo boundaries.
- Barrel check: `grep -rn "export \* from" src` and list barrels by fan-out.

## Python

- Import time: `python -X importtime -c "import pkg" 2> imports.log`, then sort by cumulative time.
- Graph and cycles: `pydeps`, `import-linter` (contracts for layers and forbidden imports), `pylint --enable=cyclic-import`.
- Type-only imports: `if TYPE_CHECKING:`; Ruff rules `TCH`/`TC`.

## Go

- `go list -deps ./cmd/app | wc -l`, `go mod why <pkg>`, `go mod graph`.
- Go forbids package cycles; look for oversized packages and `internal/` boundaries instead.

## Rust

- `cargo tree -e normal -i <crate>`, `cargo udeps`, `cargo build --timings`.
- Module coupling: `cargo modules dependencies`.

## Any language

- Fan-in count per module: `grep -rn "<module-name>" --include=<ext> | wc -l` to find hubs.
- Diff the measured numbers before and after; keep the commands in the report so they can be re-run.
