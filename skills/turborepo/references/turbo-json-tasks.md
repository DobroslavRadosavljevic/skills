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
| `remoteCache` | Signature / API / timeouts |
| `boundaries` | Tag rules (experimental) |
| `futureFlags` | Opt into upcoming defaults (can bust hashes) |
| `daemon` | Deprecated for `run`; still used by watch/LSP |

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
| `tags` | Package-only; used by `turbo boundaries` |

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
