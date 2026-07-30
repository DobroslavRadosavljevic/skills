# Internal Packages, Integrations, Boundaries, Migrations

Docs: https://turborepo.dev/docs/core-concepts/internal-packages · https://turborepo.dev/docs/guides/tools/typescript · framework/tool guides under `/docs/guides/`

## Internal package strategies

| Strategy | `exports` | Turbo `build` | When |
| --- | --- | --- | --- |
| **Just-in-Time (JIT)** | Point at source (`.ts`/`.tsx`) | No package build; app bundler compiles | Vite / Next / Turbopack consumers |
| **Compiled** | `types` → src or dts, `default` → `dist` | `tsc`/tsup + `outputs: ["dist/**"]` | Need cacheable artifacts / non-TS consumers |
| **Publishable** | Stable public API + dts | + Changesets / release | npm publish |

Workspace protocol:

```json
{ "dependencies": { "@repo/ui": "workspace:*" } }
```

(yarn/npm may use `"*"` depending on manager.)

### TypeScript tips

- Share `@repo/typescript-config`; keep **per-package** `tsconfig` (avoid one root tsconfig that dirties all caches).
- Prefer Node `#` subpath imports over brittle `paths` for JIT packages.
- **Do not layer TypeScript Project References on top of Turbo** — use `dependsOn` / transit nodes instead.

## Framework and tool task graphs

```jsonc
{
  "$schema": "https://turborepo.dev/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "!.next/cache/**", "!.next/dev/**"]
    },
    "dev": { "cache": false, "persistent": true },
    "test": {
      "dependsOn": ["transit"],
      "outputs": ["coverage/**"]
    },
    "test:watch": { "cache": false, "persistent": true },
    "e2e": { "dependsOn": ["build"], "cache": false },
    "storybook": { "cache": false, "persistent": true },
    "transit": { "dependsOn": ["^transit"] },
    "check-types": { "dependsOn": ["transit"] },
    "//#lint": {},
    "//#format": {},
    "//#format:fix": { "cache": false }
  }
}
```

| Tool | Pattern |
| --- | --- |
| **Next.js** | Package `turbo.json` extends `//`; careful `.next` outputs; JIT UI packages via bundler |
| **Vite** | Separate `build` and `check-types` scripts for independent caching |
| **Vitest** | Per-package `vitest run` + turbo cache; watch = persistent |
| **Playwright** | Shared helpers via workspace; e2e often depends on `build`; cache deliberately |
| **Storybook** | Persistent, uncached |
| **ESLint** | Shared `@repo/eslint-config`; per-pkg or root |
| **Oxlint / Oxfmt** | Root `//#lint` / `//#format` or per-package; see those skills. Type-aware oxlint may need prior builds |

```sh
bun add -D oxlint oxfmt
# root scripts: "lint": "oxlint .", "format": "oxfmt --check"
bunx turbo run //#lint //#format
```

## Boundaries (experimental)

```sh
bunx turbo boundaries
```

Checks:

1. Imports outside the package directory
2. Imports of packages not listed in `package.json` dependencies

Tags in package `turbo.json`:

```jsonc
{ "extends": ["//"], "tags": ["internal"] }
```

Rules in root:

```jsonc
{
  "boundaries": {
    "tags": {
      "public": {
        "dependencies": { "allow": ["public"], "deny": ["internal"] }
      }
    }
  }
}
```

Rules apply transitively. Treat as evolving API.

## Generators and scaffolding

```sh
bunx create-turbo@latest -m bun
bunx turbo gen workspace
bunx turbo gen run <generator>
```

Keep generators under `turbo/generators/` with Plop config.

## Migration playbooks

### From bare workspaces

1. `bun add -D turbo`
2. Add `turbo.jsonc` mapping existing scripts
3. Declare package manager field
4. Add outputs/`^build` incrementally
5. Enable remote cache in CI

### From Lerna

- Keep Lerna for publish/version if needed
- Replace `lerna run` with `turbo run`
- Leave package graph to workspaces

### From Nx

Official guide: https://turborepo.dev/docs/guides/migrating-from-nx

- Move to package-local scripts + workspaces
- Map `nx.json` targets → `turbo.json` tasks
- **Move dependencies off the root into packages**
- Dual-run during transition
- CLI map sketch: `nx generate` → `turbo gen`, `--projects` → `--filter`, reset ≈ `--force`

## Bun-specific notes

| Item | Status |
| --- | --- |
| Support | Stable for **bun 1.2+** |
| Workspaces | Root `workspaces` + `workspace:*` |
| create-turbo / CI | `-m bun` first-class |
| prune `--production` | Bun-aware lockfile rewrite |
| Caveat | Pin `devEngines.packageManager`; watch lockfile format across Bun majors |

```sh
bun add -D turbo
bun add -g turbo   # optional local DX / Docker prepare stage
```

## Package manager support matrix

| Manager | Policy |
| --- | --- |
| pnpm 8+ | Stable |
| npm 8+ | Stable |
| yarn 1+ (incl. PnP) | Stable |
| bun 1.2+ | Stable |

Workspace globs: prefer `apps/*`, `packages/*` — avoid ambiguous `**` nesting across managers.

## Anti-patterns

- Root-hoisting all deps “like Nx default” — hurts cache and prune
- One root `tsconfig` that includes every package
- Competing Project References + turbo caches
- Mixing Prettier and Oxfmt (or ESLint format) without a single format owner
- Enabling boundaries/watch write-cache in production CI without understanding experimental status
