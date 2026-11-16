---
name: untangle
description: Untangles the dependency graph of any codebase so each module imports only what it really needs. Finds and fixes unrelated code pulled in through barrel files, side-effect imports, heavy transitive chains, circular dependencies, server code leaking into client bundles, test or dev code in production paths, and shared "utils" or "types" hubs that couple unrelated features. Language-agnostic (TypeScript/JavaScript, Python, Go, Rust, and others). Use when the user says "untangle", asks why a file imports so much, wants to cut import chains, fix circular imports, shrink bundles or cold start caused by imports, split a god module that everything depends on, or decouple unrelated features. For splitting files into folders without changing the import graph, or general smell cleanup, prefer a reorganize or cleanup workflow instead.
---

# Untangle

Goal: every module depends only on what it truly uses, dependencies point one way, and loading one feature does not load unrelated ones. Behavior stays the same.

## 1. Scope and baseline

1. Take the target from the user (file, entry point, package, or whole repo). With no target, start at the entry points (app routes, CLI main, workers, public package exports).
2. Measure before changing anything, so you can prove the win:
   - The import graph and its cycles.
   - For a chosen entry point: how many modules it loads, bundle size, or cold-start / import time.
   - Use the tools in [references/detection.md](references/detection.md) that fit the language. Prefer tools the project already has; ask before adding a dependency.

## 2. Find the tangles

Trace the graph, not just single files. For each suspicious edge, ask: "Does this module use the thing, or does it only come along for the ride?" Look for the patterns in [references/patterns.md](references/patterns.md):

- **Barrel fan-out**: `import { x } from "./index"` loads every sibling of `x`.
- **Side-effect imports**: modules that run code on import (registration, polyfills, global config, DB or SDK clients created at top level).
- **Hub modules**: one `utils`, `helpers`, `types`, `constants`, or `common` file that many unrelated features import, so each pulls all the others' dependencies.
- **Wrong-direction edges**: lower layers importing higher ones (lib → feature, domain → UI, shared → app).
- **Cycles**: A → B → A, often hidden behind barrels.
- **Boundary leaks**: server-only code, secrets, or Node APIs reachable from client code; test, mock, story, or dev code reachable from production.
- **Heavy transitive pulls**: a tiny helper living next to a heavy dependency in the same file.
- **Type-only imports compiled as value imports**.

Rank findings by impact: cycles and boundary leaks first, then the edges with the biggest load-size or startup cost, then hygiene.

## 3. Untangle

Pick the smallest fix that cuts the edge, in this order:

1. Import directly from the source file instead of a barrel.
2. Mark type-only imports as type-only (`import type`, `TYPE_CHECKING`, and so on).
3. Move the small thing out of the heavy file into its own module, next to its real owner.
4. Split a hub module by feature; move each piece to the feature that uses it, or to a shared module only when two or more features use it.
5. Make side effects explicit: replace top-level work with a function or lazy getter, called where it is needed.
6. Break a cycle by moving the shared piece down a layer, or by inverting the dependency (pass it in, use an interface or callback).
7. Lazy-load (dynamic import, local import) only when the dependency is real but rarely used.

Rules:

- When the same import rewrite repeats across many files, use one scripted codemod (AST-based when possible) with a dry run and counts, not hand edits.
- Move every caller and delete the old path in the same change. No re-export shims.
- Do not change behavior. Keep side effects that something relies on, and make their trigger explicit.
- Do not merge unrelated code to "simplify" the graph, and do not create a new hub.
- Keep public package APIs stable unless the user agrees to change them.

## 4. Prove it

1. Re-run the same measurements from step 1. Report before and after: cycles, modules loaded per entry, bundle size or import time.
2. Run typecheck, lint, tests, and a build of the touched packages.
3. Run the real app or entry point once to catch missing side effects (registrations, polyfills, init order).
4. Where the project supports it, add a guard so the tangle cannot return: an import-boundary lint rule, a cycle check in CI, or a dependency-rules config.

## Report

- Result first: the numbers before and after.
- The edges you cut, grouped by pattern, one line each.
- What is not done or not verified, and any risky edge you left for the user to decide.
