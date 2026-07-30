# CI, Prune, and Docker

Docs: https://turborepo.dev/docs/crafting-your-repository/constructing-ci · https://turborepo.dev/docs/guides/ci-vendors · https://turborepo.dev/docs/guides/tools/docker · https://turborepo.dev/docs/reference/prune

## CI principles

1. Install with frozen lockfile.
2. Set `TURBO_TOKEN` + `TURBO_TEAM` for remote cache.
3. Prefer `bunx turbo run …` (or root script that calls it).
4. Use `--affected` or filters to shrink PR work — with **enough git history**.
5. Pin global `turbo` major when prune runs **before** workspace install (Docker).

## GitHub Actions (Bun)

```yaml
name: CI
on:
  push: { branches: [main] }
  pull_request:

jobs:
  build:
    runs-on: ubuntu-latest
    env:
      TURBO_TOKEN: ${{ secrets.TURBO_TOKEN }}
      TURBO_TEAM: ${{ vars.TURBO_TEAM }}
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0 # needed for reliable --affected / git filters
      - uses: oven-sh/setup-bun@v2
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: bun install --frozen-lockfile
      - run: bunx turbo run build lint test --affected
```

Notes:

- Official docs sometimes use `fetch-depth: 2`; prefer `0` (or blobless full history) for `--affected`.
- PR base detection uses GitHub env when available.

## GitLab CI (sketch)

```yaml
default:
  image: oven/bun:1.2
  before_script:
    - bun install --frozen-lockfile

variables:
  TURBO_TOKEN: $TURBO_TOKEN
  TURBO_TEAM: $TURBO_TEAM

build:
  script:
    - bunx turbo run build --affected
```

## Skipping work

```sh
bunx turbo run build --affected
bunx turbo query affected --packages web --exit-code   # exit 1 = affected
```

`turbo-ignore` is legacy — prefer query / affected filters.

## `turbo prune`

Produce a minimal monorepo subset for an app:

```sh
bunx turbo prune web
bunx turbo prune web --docker
bunx turbo prune web --out-dir=./out
bunx turbo prune web --production
```

| Flag | Effect |
| --- | --- |
| (default) | `./out` full pruned monorepo + lockfile |
| `--docker` | `out/json/` manifests + `out/full/` sources + pruned lockfile |
| `--production` | Drop workspace packages only needed via `devDependencies` |
| `--out-dir` | Custom output |

Caveats:

- Positional package name ( `--scope` deprecated).
- `globalDependencies` files are **not** copied unless `futureFlags.pruneIncludesGlobalFiles: true`.
- Bun `--production` rewrites pruned manifests/lockfile for frozen install.

vs `pnpm deploy`: prune keeps monorepo shape; deploy makes a standalone folder.

## Docker multi-stage (official pattern)

```dockerfile
FROM oven/bun:1.2 AS base
WORKDIR /app

FROM base AS prepare
RUN bun add -g turbo@^2
COPY . .
RUN turbo prune web --docker

FROM base AS builder
COPY --from=prepare /app/out/json/ .
RUN bun install --frozen-lockfile
COPY --from=prepare /app/out/full/ .
# Optional remote cache during image build:
# ARG TURBO_TEAM
# ARG TURBO_TOKEN
# ENV TURBO_TEAM=$TURBO_TEAM TURBO_TOKEN=$TURBO_TOKEN
RUN bunx turbo run build

FROM base AS runner
# Copy only runtime artifacts (example: Node server / Next standalone)
COPY --from=builder /app/apps/web/dist ./dist
CMD ["bun", "dist/server.js"]
```

Build from **repo root**:

```sh
docker build -f apps/web/Dockerfile .
```

For Next.js standalone, copy `.next/standalone`, `.next/static`, and `public` per framework docs.

## CI speed checklist

- [ ] Remote cache env present on all jobs that build
- [ ] `--affected` or tight `--filter` on PRs
- [ ] Adequate `fetch-depth` for git filters
- [ ] Deterministic tasks + correct `outputs` / `env`
- [ ] Prune before Docker install to shrink context
- [ ] Avoid installing the entire monorepo into tiny app images

## Pitfalls

| Pitfall | Fix |
| --- | --- |
| Affected always runs everything | Shallow clone / wrong base | Full history + correct base ref |
| Docker cache never hits | No `TURBO_*` in builder | Pass build-args/env |
| Prune then frozen install fails | Lockfile/manager mismatch | Use matching bun/pnpm prune path |
| Huge image | Copied full repo | Use `--docker` two-step copy |
| Global config files missing in prune | Default behavior | futureFlag or explicit COPY |
