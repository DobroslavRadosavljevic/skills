# Caching, Environment Variables, and Remote Cache

Docs: https://turborepo.dev/docs/crafting-your-repository/caching · https://turborepo.dev/docs/crafting-your-repository/using-environment-variables · https://turborepo.dev/docs/core-concepts/remote-caching

## Local cache

- Default directory: `.turbo/cache`
- Restores declared `outputs` + task logs on hit
- Assumes tasks are **deterministic**
- Git worktrees share the main worktree cache unless `cacheDir` is set

```sh
bunx turbo run build          # miss then write
bunx turbo run build          # hit
bunx turbo run build --force  # ignore reads, rewrite artifacts
```

## What goes into the hash

**Global factors:** resolved task definitions, root lockfile / root `package.json`, `globalDependencies`, `globalEnv`, behavior flags (`--env-mode`, `--framework-inference`, `--cache-dir`), passthrough args after `--`.

**Package factors:** package `turbo.json`, package `package.json` / lock contribution, file `inputs` (or defaults).

### Debugging hashes

```sh
bunx turbo run build --summarize
bunx turbo run build --dry=json
```

Inspect `.turbo/runs/*.json` summaries when hits/misses look wrong.

## Outputs and logs

- Without `outputs`, a “hit” may restore only logs — builds look cached but artifacts are missing.
- **Logs are cache artifacts** — never print secrets.

## Remote cache

Default provider: **Vercel Remote Cache** (usable without hosting the app on Vercel).

### Local link

```sh
bunx turbo login
bunx turbo link
```

### CI env

```yaml
env:
  TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
  TURBO_TEAM: ${{ vars.TURBO_TEAM }}   # team slug
```

| Variable | Role |
| --- | --- |
| `TURBO_TOKEN` | Bearer auth |
| `TURBO_TEAM` | Team slug |
| `TURBO_TEAMID` | Team id alternative |
| `TURBO_API` | Custom remote base URL |
| `TURBO_LOGIN` | Login URL override |
| `TURBO_REMOTE_CACHE_SIGNATURE_KEY` | HMAC signing secret |
| `TURBO_REMOTE_CACHE_TIMEOUT` / `_UPLOAD_TIMEOUT` | Timeouts |
| `TURBO_CACHE` | Same shape as `--cache` |
| `TURBO_FORCE` | Same as `--force` |

```jsonc
{
  "remoteCache": {
    "signature": true,
    "timeout": 30,
    "uploadTimeout": 60
  }
}
```

### Self-hosted

Point `TURBO_API` / `remoteCache.apiUrl` at a server implementing the Remote Cache API (OpenAPI: https://turborepo.dev/docs/openapi). Community options include `ducktors/turborepo-remote-cache` and Cloudflare Worker ports.

### Cache source flags

| Intent | Flag |
| --- | --- |
| Full local+remote RW | `--cache=local:rw,remote:rw` |
| Read remote, write local | `--cache=local:rw,remote:r` |
| Remote only | `--cache=remote:rw` |
| No writes | `--cache=local:r,remote:r` |

Prefer these over deprecated `--no-cache` / `--remote-only` / `--remote-cache-read-only`.

## Environment modes

| Mode | Behavior |
| --- | --- |
| **`strict` (default in Turbo 2)** | Only listed env (+ passthrough + built-ins like `PATH`) reach the task |
| **`loose`** | Full process env available — easier migrate, easier wrong cache |

### Hash vs runtime

| Mechanism | In hash? | In strict runtime? |
| --- | --- | --- |
| `env` / `globalEnv` | Yes | Yes |
| `passThroughEnv` / `globalPassThroughEnv` | No | Yes |
| Framework Inference prefixes | Yes (auto) | Yes |
| `.env` files | Only if in `inputs` / `globalDependencies` | Loaded by the app/tool — Turbo does not inject them |

```jsonc
{
  "globalEnv": ["CI"],
  "tasks": {
    "build": {
      "env": ["MY_API_URL", "NEXT_PUBLIC_ANALYTICS_ID"],
      "passThroughEnv": ["AWS_SECRET_ACCESS_KEY"],
      "inputs": ["$TURBO_DEFAULT$", ".env*"]
    }
  }
}
```

Use `passThroughEnv` for secrets that must be present at runtime but should not create distinct cache entries per value (understand the security/correctness tradeoff).

## Framework inference

Per-package automatic env wildcards (examples):

| Framework | Prefixes |
| --- | --- |
| Next.js | `NEXT_PUBLIC_*` |
| Vite / SolidStart | `VITE_*` |
| CRA | `REACT_APP_*` |
| Nuxt | `NUXT_*`, `NUXT_ENV_*` |
| Expo | `EXPO_PUBLIC_*` |
| Astro / SvelteKit | `PUBLIC_*` |

Opt out: `--framework-inference=false` or negate in `env` (`"!NEXT_PUBLIC_*"`).

Prefer app-local `.env` files over a single root `.env` that dirties every package.

## `eslint-config-turbo` / plugin

Use turbo ESLint helpers to catch env vars used in code but missing from `turbo.json` hashing — reduces false cache hits.

## Pitfalls

| Pitfall | Fix |
| --- | --- |
| Env change, cache still hits | Add to `env` / `globalEnv` |
| `.env` edit ignored | Add to `inputs` |
| Inline `export FOO=1 && build` | Declared after hash — put FOO in turbo env instead |
| Secrets in logs | Redact; remember logs are cached |
| `cache: false` forgotten on deploy | Side-effect tasks must disable cache |
| Signature failures in CI | Align `TURBO_REMOTE_CACHE_SIGNATURE_KEY` / `remoteCache.signature` |
