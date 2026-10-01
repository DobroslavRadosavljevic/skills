# turbo.json Tasks and Package Configs

Schema: https://turborepo.dev/schema.json  
Docs: https://turborepo.dev/docs/reference/configuration · https://turborepo.dev/docs/reference/package-configurations

Prefer `turbo.jsonc` when you want comments.

## Root task registry

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    }
  }
}
```

Task names must match `package.json` scripts (except transit / graph-only nodes that intentionally have no script).

## Task options

| Key | Default | Role |
| --- | --- | --- |
| `description` | — | Docs only |
| `dependsOn` | `[]` | Task DAG |
| `inputs` | git-tracked files in package | Hash fingerprint |
| `outputs` | none (logs still cached) | Files restored on hit |
| `env` | — | In **hash** + available in strict mode |
| `passThroughEnv` | — | Runtime only; **not** hashed |
| `cache` | `true` | Disable for side effects / always-run |
| `persistent` | `false` | Long-running; blocks dependents; implies interactive |
| `interactive` | follows persistent | stdin in TUI |
| `interruptible` | `false` | Let `turbo watch` restart the task |
| `outputLogs` | `full` | `full` \| `hash-only` \| `new-only` \| `errors-only` \| `none` |
| `with` | — | Co-run other package#tasks |
| `extends` | `true` | Package configs: `false` drops inheritance |
| `tags` | — | Task labels for `--filter=tag:…` / `turbo query` (2.11.6+); not hashed; inherited, `$TURBO_EXTENDS$` appends, `[]` clears |
| `command` | package script | Argument array run without a shell; needs `futureFlags.experimentalTaskCommand` (used with native toolchains) |

## `dependsOn` microsyntax

| Form | Meaning |
| --- | --- |
| `"^build"` | Run `build` in **workspace dependencies** first |
| `"build"` | Run **same package** `build` first |
| `"@repo/ui#build"` / `"web#lint"` | Specific package#task |
| `"//#lint"` | Root workspace script |

```jsonc
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"] },
    "dev": {
      "cache": false,
      "persistent": true,
      "with": ["api#dev"]
    }
  }
}
```

### Transit nodes (parallel typecheck)

```jsonc
{
  "tasks": {
    "transit": { "dependsOn": ["^transit"] },
    "check-types": { "dependsOn": ["transit"] }
  }
}
```

Avoid serializing the whole graph with `"check-types": { "dependsOn": ["^check-types"] }` unless that is intentional.

## Inputs microsyntax

| Token | Meaning |
| --- | --- |
| `$TURBO_DEFAULT$` | Keep default inputs, then add/negate |
| `$TURBO_ROOT$/turbo.json` | Glob from repo root |
| `$TURBO_EXTENDS$` | In package configs: **append** arrays |
| Custom globs only | Replaces defaults (may ignore gitignore behavior) — usually include `$TURBO_DEFAULT$` |

```jsonc
{
  "tasks": {
    "build": {
      "inputs": ["$TURBO_DEFAULT$", ".env*", "!README.md"],
      "outputs": ["dist/**"]
    }
  }
}
```

### Deferred hashing (2.10+)

By default every task hash is computed when `turbo` starts. When an upstream task writes files a downstream task reads, use structured `inputs` objects instead of disabling cache:

```jsonc
{
  "tasks": {
    "codegen": { "cache": false },
    "build": {
      "dependsOn": ["codegen"],
      "inputs": [
        "$TURBO_DEFAULT$",
        "!src/generated/**",
        { "mode": "jit", "globs": ["src/generated/**"] } // hash just before build runs
      ]
    },
    "check-types": {
      "dependsOn": ["^check-types"],
      "outputs": ["dist/**"],
      "inputs": [
        "$TURBO_DEFAULT$",
        // hash dependency outputs: dependents miss only when the .d.ts interface changes
        { "mode": "dependencyOutputs", "globs": ["dist/**/*.d.ts"], "from": ["^check-types"] }
      ]
    }
  }
}
```

- `from` only with `dependencyOutputs`; defaults to the task's direct task dependencies. It does **not** add graph edges — keep `dependsOn`.
- Selected dependency tasks must declare `outputs`.
- Deferred tasks (and their dependents) report `hash: null` + `hashReason` in `--dry=json`.

## Outputs

Always declare for cacheable builds.

| Stack | Typical outputs |
| --- | --- |
| `tsc` / tsup / library | `dist/**` |
| Next.js | `.next/**`, `!.next/cache/**`, `!.next/dev/**` |
| Vite library | `dist/**` |
| Coverage | `coverage/**` |

Side-effect tasks (deploy, mutate remote state): `"cache": false`.

## Global options (root)

| Key | Role |
| --- | --- |
| `globalDependencies` | File globs → all task hashes |
| `globalEnv` | Env → all hashes |
| `globalPassThroughEnv` | Runtime for all (also enables strict for all) |
| `ui` | `"tui"` \| `"stream"` |
| `concurrency` | `"10"` or `"50%"` |
| `envMode` | `"strict"` (default) \| `"loose"` |
| `cacheDir` | Default `.turbo/cache` |
| `cacheMaxAge` / `cacheMaxSize` | Opt-in local cache eviction, e.g. `"7d"` / `"10GB"` (2.10+; default `"0"` = off) |
| `remoteCache` | Signature / API / timeouts |
| `boundaries` | Tag rules (experimental) |
| `futureFlags` | Opt into upcoming defaults (root only; changing any busts the global hash) |
| `daemon` | Deprecated for `run`; still used by watch/LSP |
| `noUpdateNotifier` | `true` hides the new-version notice |
| `agentGuidance` | Root only, default `true` (2.11.5+): keeps a managed Turborepo block in root `AGENTS.md` when a coding agent runs `turbo`; `false` stops updates (does not delete the block) |
| `dangerouslyDisablePackageManagerCheck` | Skip the package-manager declaration check |
| `experimentalObservability` | OTLP export of run summaries (needs the matching future flag) |
| `global` | Namespaced global keys — only with `futureFlags.globalConfiguration` |

## Future flags

Root `turbo.json` only. Each flips a behavior expected to become default later.

| Flag | Effect |
| --- | --- |
| `affectedUsingTaskInputs` | `--affected` selects tasks whose `inputs` match changed files (task level, not package level); `turbo query` affected packages and `turbo prune` follow the task graph |
| `filterUsingTasks` | `--filter` git ranges match task `inputs`; `...` traverses the task graph |
| `watchUsingTaskInputs` | `turbo watch` re-runs only tasks whose `inputs` match |
| `strictTaskEntrypointSelection` | Packages without a command for the requested task stop becoming entrypoints |
| `pruneIncludesGlobalFiles` | `turbo prune` copies `globalDependencies` files |
| `githubActionsRemoteBaseRefFallback` | Fall back to `origin/<base>` when the PR base branch has no local ref (detached `actions/checkout`) |
| `errorsOnlyShowHash` | Show hashes for successful tasks with `outputLogs: "errors-only"` |
| `longerSignatureKey` | Require a ≥ 32-byte `TURBO_REMOTE_CACHE_SIGNATURE_KEY` |
| `globalConfiguration` | Move global keys under `global` (`globalDependencies` → `global.inputs`, now prepended to each task's inputs instead of the global hash) |
| `experimentalObservability` | Honor `experimentalObservability.otel` |
| `experimentalCargoWorkspaces` / `experimentalPythonWorkspaces` / `experimentalGoWorkspaces` | Experimental native Rust / uv / Go workspaces (2.11) — see [packages-integrations.md](packages-integrations.md) |
| `experimentalTaskCommand` | Allow task `command` arrays |

```jsonc
{
  "futureFlags": {
    "affectedUsingTaskInputs": true,
    "pruneIncludesGlobalFiles": true
  }
}
```

## Package configurations

`apps/web/turbo.json`:

```jsonc
{
  "extends": ["//"],
  "tags": ["app"],
  "tasks": {
    "build": {
      "outputs": ["$TURBO_EXTENDS$", ".next/**", "!.next/cache/**", "!.next/dev/**"]
    }
  }
}
```

| Rule | Behavior |
| --- | --- |
| `extends` | Must start with `"//"` (root) |
| Scalars | Inherited; override to change |
| Arrays | **Replace** unless `$TURBO_EXTENDS$` is first |
| Task `extends: false` | Drop or redefine without inheritance |
| `tags` (top level) | Package labels; used by `turbo boundaries` and `--filter=tag:` (do not need registering in `boundaries.tags`) |
| Task `tags` | Inherited; explicit array replaces, `$TURBO_EXTENDS$` appends, `[]` clears |

## Root tasks (`//#`)

Root `package.json`:

```json
{ "scripts": { "format": "oxfmt --check" } }
```

`turbo.json`:

```jsonc
{
  "tasks": {
    "//#format": {},
    "//#format:fix": { "cache": false }
  }
}
```

Run: `bunx turbo run //#format`.

## Anti-patterns

- Empty `outputs` on build tasks you expect to restore
- `dependsOn: ["^test"]` from `build` without understanding transit fan-out
- Package scripts that call `turbo run`
- Assuming package `turbo.json` merges array fields with the root
- Using TypeScript Project References *and* turbo as two competing caches
