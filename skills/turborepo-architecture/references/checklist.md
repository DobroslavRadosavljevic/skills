# Checklists (Turborepo architecture)

## Scaffold a package

```text
Package scaffold:
- [ ] packages/<name>/ (or nested group path)
- [ ] package.json name @org/<name>, type module
- [ ] exports → ./src/index.ts
- [ ] workspace:* / catalog: deps as needed
- [ ] tsconfig extends base
- [ ] typecheck + lint/format + test scripts (as applicable)
- [ ] turbo participates automatically via scripts
```

## Scaffold an app

```text
App scaffold:
- [ ] apps/<name>/ package + entry
- [ ] .env / .env.example + src/env.ts (T3 Env createEnv)
- [ ] wires package Layers/clients from env
- [ ] quality scripts + optional dev/start
- [ ] root convenience script filter (optional)
- [ ] dependency boundary respected (see with-dependency-boundaries)
```

## Review monorepo wiring

```text
Wiring review:
- [ ] Workspace globs cover new paths
- [ ] Catalog pins for new shared deps
- [ ] turbo.jsonc tasks still correct (transit, cache)
- [ ] No process.env in packages
- [ ] No recursive turbo in package scripts
- [ ] Filters use package names
```

## Closing gate (soft default)

```text
- [ ] format → lint → typecheck → test (full graph)
- [ ] typegen if contracts stale
- [ ] test:integration if real deps required
```
