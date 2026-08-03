---
name: kill-legacy
description: Finds and removes legacy, deprecated, compatibility-shim, and fallback code paths so only the current canonical implementation remains. Works on a named target or the full first-party codebase. Use when the user says "kill-legacy", "kill legacy", "remove legacy", "remove fallbacks", "drop compatibility shims", "delete deprecated paths", "remove old code paths", or asks to clean up migration leftovers and dual-write/dual-read bridges that are no longer needed.
---

# Kill Legacy

**Single goal:** eliminate legacy and fallback code so the codebase has one current path, not old + new forever.

Do not broaden into general smell cleanup, renaming, or unrelated refactors. If code is not legacy/fallback (or required to finish removing it), leave it alone.

## Core Rules

- Prefer deleting the old path over wrapping, flagging, or “cleaning up later.”
- The **current** implementation wins. Do not preserve dead dual paths “just in case” without evidence they are still required.
- Preserve public behavior and external contracts unless the user authorizes a breaking change. When a legacy path *is* the public contract, migrate callers or get explicit approval before removal.
- Prove a path is unused or replaceable before deleting it (references, feature flags, env defaults, runtime config, docs, tests).
- Remove the scaffolding that kept legacy alive: flags, env vars, adapters, dual-read/dual-write, temporary branches, and tests that only exist for the old path.
- Do not replace a removed fallback with a new silent fallback. Fail loudly at the boundary if input is invalid for the current model.
- Preserve unrelated user changes. Keep passes reviewable.

## Establish Scope

- **Targeted:** only the named file, directory, module, feature, flag, or migration leftover. Change outside files only when required to finish the removal.
- **Full codebase:** search first-party code for legacy/fallback hotspots. Exclude generated files, vendored code, build output, caches, lockfiles, and applied migration history on disk unless they are the stated problem. New migration code that *drops* legacy columns/tables is allowed when that is the cleanup.

If whether a path is still required is ambiguous and removal would break production or public API, ask one focused question. Otherwise state the assumption and proceed with evidence.

## What Counts As Legacy / Fallback

Treat as kill targets when they exist to support an old world alongside the new one:

- Deprecated APIs, dual implementations, compatibility shims, adapters “for old clients”
- Feature flags / env toggles whose default is permanently “new” and old branch is dead
- Dual-read / dual-write, transitional caches, temporary redirects, polyfills no longer needed for supported runtimes
- Commented-out old implementations, `#ifdef`-style dead branches, `TODO: remove after migration`
- Fallback values/branches that mask missing migration (`|| oldField`, `?? legacyDefault`, `any` casts to keep old shapes alive)
- Tests, fixtures, docs, and types that only exercise or describe the old path

Catalog patterns: [legacy-patterns.md](references/legacy-patterns.md).

## Workflow

### 1. Find candidates

Search for signals in [legacy-patterns.md](references/legacy-patterns.md). For each candidate record:

- Location
- What old behavior it preserves
- What the canonical current path is
- Evidence it is still required vs safe to remove
- Removal risk (public API, data format, clients, flags still on in prod)

### 2. Decide keep vs kill

| Decision | When |
| --- | --- |
| **Kill now** | No remaining callers/config; flag default forever new; supported clients all on new path; user authorized break |
| **Kill with migration** | Callers/data still on old path but user wants cleanup — migrate then delete in the same effort |
| **Keep (report only)** | Still required for supported clients, active rollback, or legal/compliance retention — list owner and exit criteria |

Do not leave “soft” legacy (commented code, unused flag, empty shim file). Either remove it or document why it must stay with a concrete exit condition.

### 3. Remove completely

For each kill:

1. Switch all remaining consumers to the canonical path (or delete consumers that only existed for legacy).
2. Delete the legacy implementation, types, exports, flags, env plumbing, and adapters.
3. Delete or rewrite tests so they assert only current behavior.
4. Update docs/comments that describe the old path.
5. Remove re-exports and barrels that existed only to expose legacy names.
6. Do not leave stub functions that throw “deprecated” unless the user requires a temporary hard break for external clients — prefer compile-time removal for internal code.

Details: [removal-checklist.md](references/removal-checklist.md).

### 4. Verify

Run the narrowest relevant typecheck, lint, tests, and build for touched surfaces. Grep once more for the removed names/flags to ensure no stragglers.

If verification cannot run, say what was skipped.

## Completion Report

- Scope inspected
- Removed: path/flag/shim → canonical replacement
- Kept (with exit criteria): anything still required
- Stragglers searched for
- Verification run and results
