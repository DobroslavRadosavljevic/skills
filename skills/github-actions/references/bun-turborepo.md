# Bun and Turborepo in CI

Versions checked 2026-10-09: `oven-sh/setup-bun` v2.2.0 (node24), Bun 1.4.2, `turbo` 2.11.7, `vercel/setup-turborepo-remote-cache-action` v1.1.0.

## Installing Bun

`oven-sh/setup-bun@v2` (current major is still 2; pin the SHA). Version resolution order:

1. `bun-version` input, or `bun-version-file` (`package.json`, `.bun-version`, `.tool-versions`).
2. `package.json` `packageManager` (`"bun@1.4.2"`), then `engines.bun`.
3. `latest` (avoid: CI changes without a commit).

Commit `"packageManager": "bun@x.y.z"` so local, CI, and Docker use one version. `no-cache: true` only disables caching of the downloaded Bun executable, not dependency caching. Private registries: `registries:` input with `$ENV` tokens passed via `env`, never inline secrets.

## Installing dependencies

- `bun install --frozen-lockfile` (same as `bun ci`). Bun does not freeze the lockfile automatically in CI. Commit the text `bun.lock`.
- Bun does not run dependency lifecycle scripts unless the package is in `trustedDependencies`. Keep that list reviewed; do not pass `--ignore-scripts` unless you also run the needed postinstall by hand.
- `minimumReleaseAge` (seconds, `bunfig.toml` or `--minimum-release-age`) delays brand-new package versions on new resolution; it does not touch existing `bun.lock` entries.
- Cache Bun's global package cache, not `node_modules`:

```yaml
- uses: actions/cache@55cc8345863c7cc4c66a329aec7e433d2d1c52a9 # v6.1.0
  with:
    path: ~/.bun/install/cache
    key: bun-${{ runner.os }}-${{ runner.arch }}-${{ hashFiles('**/bun.lock') }}
    restore-keys: |
      bun-${{ runner.os }}-${{ runner.arch }}-
```

  Bun's installs are fast enough that a cache miss costs seconds on small repos; measure before adding more caching. Skip the cache in release and publish jobs (cache poisoning surface). `actions/cache` v6 is ESM on Node 24, needs runner 2.327.1 or newer, and the service caps at 10 GB per repository. PR caches are scoped to the PR ref and read from the base branch cache.

## Type check, tests

- `bun check` is Bun's built-in type checker (reads `tsconfig.json`, no `typescript` package needed, exit 1 on errors or empty input). In Actions it prints workflow commands, so errors become PR annotations without a problem matcher. `bunx tsc --noEmit` stays valid; TypeScript 7 (`tsc`) is the native compiler. Pick one and keep it identical to the local script.
- `bun test` auto-emits GitHub annotations when `GITHUB_ACTIONS` is set; `NODE_ENV` defaults to `test`; default per-test timeout 5000 ms. For sharding, parallel runs, and JUnit output, read the flags in Bun's test runner docs for the installed Bun version before using them.

## Turborepo remote cache

Preferred: OIDC (no stored token). Create a "Turborepo CLI" OIDC policy on the Vercel team (restrict repo, branch, or workflow), set repository variable `TURBO_TEAM`, grant `id-token: write` to that job only, and run the action before any `turbo` step:

```yaml
- uses: vercel/setup-turborepo-remote-cache-action@49d7b1b46ba4c9251e1977986bfe18336feabc8f # v1.1.0
  with:
    team: ${{ vars.TURBO_TEAM }}
```

It exchanges the GitHub OIDC token for a short-lived token, sets `TURBO_TOKEN`/`TURBO_TEAM`, and revokes the token when the job ends. Fork PRs get no `id-token`; guard the step with `github.event.pull_request.head.repo.fork != true`.

Fallback: `TURBO_TOKEN` (secret) plus `TURBO_TEAM` (variable) in `env`. Self-hosted caches implement the Remote Caching HTTP API (v8 endpoints); set `TURBO_API`. Turborepo can sign artifacts: `"remoteCache": { "signature": true }` plus `TURBO_REMOTE_CACHE_SIGNATURE_KEY`; unverifiable artifacts count as misses.

Cache safety:

- Turborepo treats logs as artifacts. Do not print secrets in tasks.
- Hits are only as correct as `inputs`, `outputs`, and `env`/`globalEnv`. Missing `env` keys cause hits across different environments; wrong `outputs` replay empty results.
- Limit who can write: scope the OIDC policy to branches, and prefer read-only cache for untrusted PRs.

## `--affected`

- `turbo run lint test build --affected` runs only packages changed versus the base. On `pull_request` it compares PR base and head via `GITHUB_BASE_REF`; on `push` it reads `GITHUB_EVENT_PATH` and falls back to the parent of the first commit on force pushes.
- It needs git history. Use `fetch-depth: 0` (optionally `filter: blob:none`) on checkout. On a shallow clone Turborepo treats everything as changed and runs all tasks: slow but safe.
- Pair `--affected` with remote cache: unchanged packages still hit cache; changed packages rebuild once for the whole team.
- Use `turbo run <task>` rather than `turbo <task>` so a future subcommand cannot shadow your task name. If `turbo` must run before install, use the standalone binary (`curl -fsSL https://turborepo.dev/install | TURBO_VERSION=2.11.7 sh`; standalone starts at 2.11.5).
- Required checks with `--affected`: the job always runs; the work inside shrinks. Do not use `paths:` on the workflow.

## Monorepo job layout

- One `turbo run format:check lint typecheck knip test build --affected` job is simplest and uses cache best. Split into a matrix of tasks only when logs or timing need it; every job pays install time.
- Put end-to-end suites in their own workflow or job so service containers and browsers load only there (`assets/e2e.yml`).
- Docker image builds: use `turbo prune <app> --docker` in the Dockerfile and cache layers with the registry or `actions/cache`; keep image publishing out of the PR quality gate.
