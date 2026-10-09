# Grouping And Ordering

## Contents

- Classify each package
- Execution order
- Coupled families
- Group plan template
- Rules of thumb

## Classify Each Package

For every row in `bun outdated` and `bun audit`, record: current, target, semver distance (patch, minor, major), kind (runtime dep, dev tool, types, peer), where declared (member, catalog, override), and risk.

| Class | Meaning | Handling |
| --- | --- | --- |
| Security | Appears in `bun audit` | Own group, first, even when it is a major |
| Floor | Bun, Node, TypeScript, `@types/node`, `@types/bun` | Own group per tool; after security |
| Patch/minor | In-range or `Update` column bump | One batch; split if the batch fails |
| Family | Packages that must share a version line | One group per family |
| Major | Semver-major (or 0.x minor) | One group each |
| Blocked | Peer or engine conflict, ESM-only, no plugin support yet | Defer with reason |
| Pinned on purpose | Exact pin with a comment, a patch, or a user note | Leave; list in report |

0.x packages: treat every minor as a major. `^0.4.1` does not accept `0.5.0`.

## Execution Order

1. Security fixes.
2. Runtime and language floor: Bun, Node, TypeScript, `@types/*` for them.
3. Patch + minor batch.
4. Coupled families.
5. Remaining majors, lowest risk and smallest blast radius first. Build tooling and test runners before application frameworks, so later groups verify on newer tooling. Leave the framework or ORM that most of the code depends on for last, when the tree is green and fresh.
6. Cleanup: `bun dedupe`, remove obsolete overrides, shims, polyfills, `trustedDependencies` entries for removed packages.

Why: a failure late in the list then has a narrow suspect list, and security does not wait behind a long migration.

## Coupled Families

Move these together, in one group, because their versions or peer ranges interlock. Confirm against each package's peer ranges; the lists are examples, not a closed set.

| Family | Typical members |
| --- | --- |
| React | `react`, `react-dom`, `@types/react`, `@types/react-dom`, `react-is`, testing library |
| TypeScript tooling | `typescript`, `typescript-eslint` packages, `ts-node`/`tsx` if present, `@types/node` stays with the Node floor |
| Vite | `vite`, `@vitejs/plugin-*`, `vite-tsconfig-paths`, framework plugins that declare a Vite peer |
| Vitest | `vitest`, `@vitest/*`, browser-mode providers, coverage provider (must match the vitest version) |
| TanStack | packages from the same library (Query, Router, Start, Table, Form, Store) share a release line; bump the family for one library together, then verify the next library separately |
| Storybook | `storybook`, `@storybook/*`, addons, framework builders |
| Tailwind | `tailwindcss`, `@tailwindcss/*` plugins, prettier/class-sort plugins |
| ESLint / Oxlint / formatter | linter core plus its plugins and config packages |
| ORM | `drizzle-orm` with `drizzle-kit`; `prisma` with `@prisma/client` |
| AI SDK | `ai` with `@ai-sdk/*` providers |
| Effect | `effect` with `@effect/*` packages |
| Observability | `@opentelemetry/*` packages (API, SDK, exporters, instrumentations) |
| Babel / SWC / esbuild plugins | core plus presets and loader plugins |
| Types with library | `@types/foo` moves with `foo`; drop `@types/foo` once `foo` ships its own types |

How to find a family you do not know: `bun why '@scope/*'`, check the major package's `peerDependencies` via `bun info <pkg> peerDependencies --json`, and read the release notes' "upgrade together" notes.

## Group Plan Template

Write this plan before the first edit and keep it current (todo list if the harness has one, otherwise in chat).

```md
| # | Group | Packages (from -> to) | Type | Risk | Source (notes URL) | Gates beyond baseline |
| 1 | security | ms 0.7.0 -> 0.7.1 | patch | low | GHSA-... | tests |
| 2 | typescript | typescript 5.8.3 -> 5.9.x | minor | med | release notes URL | typecheck delta |
| 3 | minor/patch batch | 14 packages | patch+minor | low | n/a | none |
| 4 | vitest family | vitest, @vitest/coverage-v8 | major | med | migration guide URL | coverage run |
```

## Rules Of Thumb

- If one package in a batch fails, drop only that package and re-run the batch; do not abandon the batch.
- If two majors depend on each other, upgrade the one with fewer dependents first and verify before the second.
- A catalog bump affects every member. Treat each catalog entry as its own group, or group the entries of a family.
- Do not upgrade a dependency and migrate its usage to a new API in the same commit when the old API still works on the new version. Upgrade first (green), then migrate in a separate, labeled follow-up if the user wants it.
- Prerelease dist-tags (`next`, `beta`, `canary`) are out of scope unless the user asks.
