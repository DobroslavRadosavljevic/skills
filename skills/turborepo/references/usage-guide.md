# Turborepo Usage Guide

End-to-end guide for installing, configuring, running, and adopting Turborepo day to day. Prefer `bun` / `bunx` in commands (bun 1.2+ is stable with Turbo).

Companion docs:

- [turbo-json-tasks.md](turbo-json-tasks.md) — `turbo.json` schema, `dependsOn`, package configs
- [cli-filtering-watch.md](cli-filtering-watch.md) — `turbo run`, filters, watch, generators
- [caching-env-remote.md](caching-env-remote.md) — cache hashing, env modes, remote cache
- [ci-docker-prune.md](ci-docker-prune.md) — CI, prune, Docker
- [packages-integrations.md](packages-integrations.md) — internal packages, frameworks, migrations

Official quickstart: https://turborepo.dev/docs/getting-started/installation

---

## 1. What Turborepo does

| Layer | Owns |
| --- | --- |
| Workspaces (bun/pnpm/npm/yarn) | Package graph, installs, linking |
| **Turborepo** | Task DAG, parallelism, local + remote cache |
| App tools (Next, Vite, Vitest, …) | Actual build/test/dev commands in `package.json` scripts |

Use Turbo when you have repeated `build` / `lint` / `test` / `check-types` across packages and want incremental + shared cache. Skip it for tiny single-package repos with no CI duplication pain.

---

## 2. Greenfield setup

### Option A — Scaffold

```sh
bunx create-turbo@latest
# flags: -m bun | pnpm | npm | yarn
#         --example with-vitest
#         --skip-install
```

### Option B — Add to existing workspaces

```sh
bun add -D turbo
```

1. Ensure root workspaces (`"workspaces": ["apps/*", "packages/*"]` or `pnpm-workspace.yaml`).
2. Declare package manager (`devEngines.packageManager` preferred).
3. Add root `turbo.json` / `turbo.jsonc`.
4. Ensure every package has a unique `name` and scripts matching task names.
5. Optionally wrap root scripts: `"build": "turbo run build"`.

### Minimal `turbo.jsonc`

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "!.next/dev/**"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

### Root `package.json` scripts

```json
{
  "scripts": {
    "build": "turbo run build",
    "dev": "turbo run dev",
    "lint": "turbo run lint",
    "test": "turbo run test",
    "check-types": "turbo run check-types"
  }
}
```

**Never** put `"build": "turbo run build"` inside a **workspace package** that turbo will invoke for `build` — that recurses.

### First run

```sh
bunx turbo run build --dry=json
bunx turbo run build
bunx turbo run build          # second run should be mostly cache hits
```

---

## 3. Day-to-day commands

| Goal | Command |
| --- | --- |
| Run tasks | `bunx turbo run build lint test` |
| One package | `bunx turbo run build --filter=web` |
| Directory filter | `bunx turbo run build --filter=./apps/*` |
| Package + deps | `bunx turbo run build --filter=web...` |
| Dependents of pkg | `bunx turbo run build --filter=...@repo/ui` |
| Changed vs main | `bunx turbo run build --affected` |
| Skip task deps | `bunx turbo run build --only --filter=web` |
| Plan only | `bunx turbo run build --dry` / `--dry=json` |
| Visualize graph | `bunx turbo run build --graph` |
| Force rebuild | `bunx turbo run build --force` |
| Cache mode | `bunx turbo run build --cache=local:rw,remote:r` |
| Pass args to scripts | `bunx turbo run test -- --reporter=verbose` |
| Watch | `bunx turbo watch lint` |
| Prune for Docker | `bunx turbo prune web --docker` |
| Boundaries | `bunx turbo boundaries` |
| Debug hashing | `bunx turbo run build --summarize` |

Prefer **`turbo run`** in CI. Locally, root npm scripts that wrap `turbo run` are fine.

---

## 4. Progressive adoption

### Phase A — Map existing scripts

Identify shared script names (`build`, `lint`, `test`, `dev`). Add matching `tasks` with empty `{}` first. Run and fix missing scripts package-by-package.

### Phase B — Wire the DAG

```jsonc
{
  "tasks": {
    "build": { "dependsOn": ["^build"], "outputs": ["dist/**"] },
    "test": { "dependsOn": ["build"] },
    "lint": {}
  }
}
```

### Phase C — Outputs + env

- Add real `outputs` per bundler (Next needs `.next/**` exclusions).
- Move undeclared env into `env` / `globalEnv` (strict mode).
- Add `.env*` to `inputs` if dotenv files should bust cache.

### Phase D — Filters + remote cache

- CI: `TURBO_TOKEN` + `TURBO_TEAM`.
- Use `--affected` or filters to shrink PR CI.
- Local: `bunx turbo login` → `bunx turbo link`.

### Phase E — Dev ergonomics

- `dev`: `persistent` + `cache: false`.
- Multi-service: `"with": ["api#dev"]`.
- Non-aware tools under watch: `interruptible: true`.

### Phase F — Structure

- Extract internal packages (JIT vs compiled).
- Package `turbo.json` with `"extends": ["//"]` for app-specific outputs.
- Optional: boundaries tags, generators.

---

## 5. Recommended baselines

### App monorepo (Next/Vite + packages)

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "ui": "tui",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "!.next/dev/**"]
    },
    "check-types": {
      "dependsOn": ["transit"]
    },
    "transit": {
      "dependsOn": ["^transit"]
    },
    "lint": {},
    "test": {
      "dependsOn": ["transit"],
      "outputs": ["coverage/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "//#format": {},
    "//#format:fix": { "cache": false }
  }
}
```

`transit` / `topo` lets typecheck run in parallel while still respecting package edges — prefer over `dependsOn: ["^check-types"]` when that serializes too hard.

### Root Oxlint / Oxfmt

```json
{
  "scripts": {
    "lint": "oxlint .",
    "format": "oxfmt --check",
    "format:fix": "oxfmt"
  }
}
```

Register as `//#lint` / `//#format` when they live only at the root.

---

## 6. Mental model: scripts vs tasks

```
apps/web/package.json     "build": "next build"     ← what runs
turbo.json                tasks.build.dependsOn…    ← when / cache / order
bunx turbo run build      ← schedules web#build after ^build deps
```

| Concern | Where |
| --- | --- |
| Command line | `package.json` `scripts` |
| Ordering / cache / outputs / env hash | `turbo.json` `tasks` |
| Package identity | `package.json` `name` + workspace deps |

---

## 7. Pairing with common tools

| Tool | Turbo pattern |
| --- | --- |
| Next.js | Package config extends `//`; build outputs `.next/**` (+ exclusions) |
| Vite | Split `build` vs `check-types` scripts — don’t glue `tsc && vite build` if you want separate caching |
| Vitest | `vitest run` per package + outputs; watch = persistent / no cache |
| Playwright | Often `dependsOn: ["build"]`; cache carefully or disable |
| Storybook | `persistent` + `cache: false` |
| Oxlint / Oxfmt | Root tasks or per-package; type-aware oxlint may need builds first |

Details: [packages-integrations.md](packages-integrations.md).

---

## 8. Cache correctness loop

When something “should have rebuilt” but didn’t:

1. `bunx turbo run build --summarize` — inspect hash inputs.
2. Check missing `env`, `.env` not in `inputs`, wrong `outputs`.
3. Confirm you didn’t use `--force` / empty cache accidentally.
4. For remote: verify `TURBO_TOKEN` / team and `--cache` mode.
5. Re-run with `--force` once to refresh artifacts after fixing config.

When CI is slow:

1. Enable remote cache.
2. Use `--affected` with adequate git history.
3. Tighten `inputs` (with `$TURBO_DEFAULT$`) so unrelated files don’t bust hashes.
4. Avoid root-hoisted deps that change every package’s fingerprint.

---

## 9. Troubleshooting

| Symptom | Likely cause | Fix |
| --- | --- | --- |
| Cache hit but empty/wrong artifacts | Missing / wrong `outputs` | Declare outputs; exclude caches |
| Wrong API URL in cached build | Env not hashed | Add to `env` / `globalEnv`; keep strict |
| `.env` change ignored | Not in inputs | `"inputs": ["$TURBO_DEFAULT$", ".env*"]` |
| `--affected` no-ops | Shallow clone | Fetch full history / depth 0 |
| Recursive turbo error | Package script calls turbo | Call the underlying tool only |
| Dev blocks other tasks | Missing `persistent` | Set `persistent: true`, `cache: false` |
| Package config dropped root outputs | Arrays replace | Lead with `$TURBO_EXTENDS$` |
| Typecheck misses dep source edits | Empty `check-types: {}` | Use transit nodes or `^check-types` |
| Nested turbo invocation | Root+package both turbo | Root wraps; packages run real commands |
| Prune missing global files | Default prune | `futureFlags.pruneIncludesGlobalFiles` or copy manually |

---

## 10. Agent checklist

When asked to “add Turborepo” or “fix the monorepo pipeline”:

1. Detect package manager, workspaces, existing Nx/Lerna/turbo.
2. Add `turbo` matching 2.x; create `turbo.jsonc` with `$schema`.
3. Map scripts → tasks; set `^build` / outputs / `dev` persistent.
4. Validate with `--dry=json` / `--graph`, then a real `build`.
5. Wire root scripts + CI remote cache + optional `--affected`.
6. Do not recurse turbo inside packages; do not invent Project References “because monorepo”.
7. For lint/format/framework details, follow the project’s existing tools and their official docs.
