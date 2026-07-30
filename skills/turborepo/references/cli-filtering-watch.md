# CLI: Run, Filters, Watch, Generators

Docs: https://turborepo.dev/docs/reference/run · https://turborepo.dev/docs/reference/watch · https://turborepo.dev/docs/reference/generate

## `turbo run`

```sh
bunx turbo run build lint test [options] [-- args-passed-to-scripts]
# Local alias often: bun run build → "turbo run build"
```

Prefer `turbo run` in CI so task names never collide with future CLI subcommands.

### High-value flags

| Flag | Purpose |
| --- | --- |
| `--filter` / `-F` | Package / path / git selectors (repeatable; union; `!` negate) |
| `--affected` | Changed packages vs base (≈ git filter); AND with `--filter` |
| `--only` | Skip `dependsOn` package and task edges |
| `--concurrency` | Cap parallelism (`10`, `50%`, …) |
| `--cache=local:rw,remote:rw` | Per-source read/write/none |
| `--force` | Ignore cache reads (still writes) |
| `--dry` / `--dry=json` | Plan without execute |
| `--graph[=file]` | svg / html / mermaid / dot |
| `--summarize` | Write run summary JSON for hash debugging |
| `--env-mode=strict\|loose` | Override config |
| `--framework-inference=false` | Disable auto env prefixes |
| `--continue` | Failure policy (`never` / `dependencies-successful` / `always`) |
| `--verbosity` / `-v` | `1` info … `3` trace |
| `--profile` | Chrome + Markdown profile |

Deprecated mindset: `--parallel` discards useful DAG behavior — prefer `concurrency` + `with` for multi-dev.

### Cache flag shapes (current)

```sh
bunx turbo run build --cache=local:rw,remote:rw   # default idea
bunx turbo run build --cache=local:rw,remote:r    # read remote, write local
bunx turbo run build --cache=remote:rw            # was --remote-only
bunx turbo run build --cache=local:r,remote:r     # was --no-cache (no writes)
```

## Filter microsyntax

| Selector | Meaning |
| --- | --- |
| `web` | Package name |
| `@repo/ui` | Scoped name |
| `./apps/*` | Path glob |
| `{./apps/*}` | Path packages |
| `web...` | `web` + its dependencies |
| `...web` | `web` + packages that depend on it |
| `...web...` | Both directions |
| `^...web` / `web...^` | Omit self where `^` applies with `...` |
| `[HEAD^1]` / `[main...HEAD]` | Git range |
| `web#lint` | Specific package#task entrypoint |

```sh
bunx turbo run build --filter=web --filter=!docs
bunx turbo run test --filter=./packages/*
bunx turbo run build --filter=...[origin/main]
bunx turbo run build --affected
```

### `--affected` caveats

- Needs enough git history (shallow `fetch-depth: 1` often breaks it). Prefer full history or `fetch-depth: 0`.
- On GitHub Actions, base ref detection uses PR metadata when available.
- Combine with `--filter` to further restrict.

## Watch

```sh
bunx turbo watch lint
bunx turbo watch dev lint
bunx turbo watch lint --experimental-write-cache   # experimental
```

| Behavior | Detail |
| --- | --- |
| Command | `turbo watch` (not `turbo run --watch`) |
| Granularity | Package-level by default |
| Finer inputs | `futureFlags.watchUsingTaskInputs` |
| Persistent tasks | Run alongside; set `interruptible: true` to allow restarts |
| Cache | Off by default |
| Loop risk | Tasks must not rewrite tracked inputs |

## Generators

```sh
bunx turbo gen
bunx turbo gen run <name> --args …
bunx turbo gen workspace
bunx turbo gen workspace --copy https://github.com/vercel/turborepo/tree/main/examples/...
```

- Config: `turbo/generators/config.ts` (Plop + `@turbo/gen`) at root or in a workspace.
- Remote `--copy` may need manual package-manager fixes afterward.

## Other useful commands

| Command | Use |
| --- | --- |
| `turbo login` / `link` / `unlink` | Vercel Remote Cache |
| `turbo prune <pkg>` | Subset monorepo for Docker/deploy |
| `turbo boundaries` | Import / tag rule checks (experimental) |
| `turbo query …` | Graph/affected queries |
| `turbo ls` / `info` | Inventory |
| `turbo telemetry status\|enable\|disable` | Anonymous telemetry |

## Passing args through

```sh
bunx turbo run test --filter=web -- --watchAll=false
```

Everything after `--` is appended to each scheduled script.
