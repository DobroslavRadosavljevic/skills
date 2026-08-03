---
name: deduplicate
description: Deduplicates code by finding one single source of truth and sharing it across call sites. Works on a named target or the full first-party codebase. Collapses duplicated logic, types, schemas, constants, UI, and tests that represent the same knowledge—without inventing false abstractions. Use when the user says "deduplicate", "dedupe", "DRY this up", "remove duplication", "single source of truth", "extract shared", or asks to consolidate repeated code into one place.
---

# Deduplicate

**Single goal:** remove duplicated knowledge by placing one canonical implementation and having every consumer use it.

Do not broaden into general cleanup, renaming, layout rewrites, or smell hunting. If something is not duplication (or forced by a correct dedupe), leave it alone.

## Core Rules

- Preserve behavior, public APIs, and data formats unless the user authorizes a change.
- Deduplicate **knowledge that will drift**, not coincidental structural similarity.
- Prefer a little intentional duplication over a wrong abstraction. Extract only when the copies share one stable concept, name, and change reason.
- Reuse an existing home for the concept when one exists. Do not invent a competing `utils` / `helpers` / `shared` dump.
- Keep edits reviewable: one duplication cluster (or tightly related cluster) per pass when the scope is large.
- Preserve unrelated user changes.

## Establish Scope

- **Targeted:** only the named file, directory, module, feature, or duplication cluster. Follow references outside the target for understanding; change them only when required to wire the shared source.
- **Full codebase:** search first-party code for duplication hotspots. Exclude generated files, vendored code, build output, caches, lockfiles, snapshots, and migrations unless they are the stated problem.

If the boundary is ambiguous and would change what gets edited, ask one focused scope question. Otherwise state the inferred boundary and proceed.

## Workflow

### 1. Map candidates

Search for repeated:

- Logic / algorithms / validation / mapping
- Types, interfaces, schemas, constants, enums, config
- UI fragments that express the same product concept
- Test setup that encodes the same domain fixture

Record each cluster with: locations, what knowledge is duplicated, confidence, and proposed canonical home.

Skip clusters that are only similar shape with different meaning, or that will diverge for good reasons. Details: [when-not-to.md](references/when-not-to.md).

### 2. Choose the single source of truth

For each accepted cluster, pick **one** home using [ssot-placement.md](references/ssot-placement.md).

Decision order:

1. Does an existing module already own this concept? Prefer it.
2. Else, place it at the narrowest owner that all consumers share (feature → package → workspace package).
3. Name it for the **concept**, not for “shared helper.”
4. Prefer one clear export over a grab-bag file.

State the chosen path and why before (or as you) extract.

### 3. Extract and rewire

1. Move or create the canonical implementation in the chosen home.
2. Replace every duplicate with an import / composition of that source.
3. Delete the now-dead copies.
4. Update tests: assert through the shared source; keep only consumer-specific coverage local.
5. Do not leave “thin wrappers” that only re-export without adding meaning—unless a public boundary requires a stable facade.

### 4. Verify

Run the narrowest existing format / lint / typecheck / tests for touched surfaces. Expand only when the shared module sits on a cross-cutting boundary.

If checks cannot run, say what was skipped and why.

## Completion Report

Keep it short:

- Scope inspected
- Clusters deduplicated: concept → canonical path → former locations
- Clusters left alone (with reason: intentional divergence, false similarity, out of scope, low confidence)
- Verification run and results
