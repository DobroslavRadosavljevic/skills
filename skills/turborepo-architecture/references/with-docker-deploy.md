# Extension: Docker deploy via turbo prune

Load when deployable apps are built with `turbo prune <pkg> --docker --production` from the **repo root** (empty platform Root Directory).

## Stance

Leave service Root Directory empty (`/`). Per-app `Dockerfile.<app>` + `railway.toml` (or equivalent) at known paths. Root `globalDependencies` files (e.g. `tsconfig.base.json`) are **not** copied by prune unless `futureFlags.pruneIncludesGlobalFiles: true` in root `turbo.json` — enable it or `COPY` them explicitly.

## MUST

1. Prune by **package name** (`turbo prune @org/api --docker --production`). `--production` (turbo 2.10.3+) drops workspace packages reachable only through `devDependencies`.
2. Install + build from the prune `out/` graph in Docker.
3. Keep config-as-code next to the app; do not require moving the git root.
4. Size worker images appropriately when they embed browsers (shm/RAM) — document per app.

## MUST NOT

1. Setting platform Root Directory to `apps/<app>` when the Dockerfile expects monorepo prune from `/`.
2. Forgetting workspace catalog/lockfile in the Docker build context.

## Checklist

```text
Docker deploy overlay:
- [ ] prune --docker --production by package name
- [ ] Root Directory empty (or documented exception)
- [ ] global tsconfigs available in prune output
```
