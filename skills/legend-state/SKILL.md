---
name: legend-state
description: "Build, review, debug, migrate, or plan Legend-State v3 applications with current docs. Use for @legendapp/state v3 beta, observable, useValue, observer, Memo, $React, useObservable, computed or linked observables, observe, when, batch, fine-grained React rendering, React Native, local persistence, syncObservable, synced, syncedCrud, syncedFetch, syncedQuery, Supabase, Firebase, Keel, offline-first sync, transforms, syncState, testing, performance, and v2-to-v3 migrations."
---

# Legend-State

Use this skill for Legend-State v3 work across core observables, React or React Native integration, persistence, remote sync, and migrations.

## Workflow

1. Inspect the project before changing code:
   - Read local agent guidance and nearby state conventions.
   - Check the exact `@legendapp/state` version and package manager lockfile.
   - Identify the runtime: vanilla TypeScript, React web, React Native, Expo, SSR, or a mixed app.
   - Map observable ownership and lifetime: module singleton, request scoped, provider scoped, component local, or synced resource.
   - Inventory React consumption (`useValue`, `observer`, `Memo`, `$React`, control-flow components), persistence plugins, sync plugins, and deprecated APIs.
2. Confirm the release channel before using v3 APIs. Version 3 is prerelease in the current snapshot while npm `latest` is v2. Start with [references/source-map.md](references/source-map.md), then refresh current docs and package metadata when versions matter.
3. For observable creation, reads and writes, computed or linked state, reactivity, arrays, events, batching, and helpers, use [references/core-observables.md](references/core-observables.md).
4. For React, React Compiler compatibility, fine-grained rendering, React Native, hooks, control flow, context, and tracing, use [references/react-integration.md](references/react-integration.md).
5. For local persistence, remote sync, CRUD, retries, transforms, plugins, sync status, and local-first reliability, use [references/persistence-sync.md](references/persistence-sync.md).
6. For v2 migrations, beta drift, architecture, security, performance, SSR, debugging, and tests, use [references/production-migration-testing.md](references/production-migration-testing.md).
7. Match the installed declarations and existing project style. Do not copy v2 examples into v3 code or assume a v3 beta API remains unchanged.

## Implementation Judgment

- Prefer `useValue(observableOrSelector)` for React reads. Treat `useSelector` and `use$` as migration aliases, and do not rely on direct `.get()` calls inside `observer`; that pattern conflicts with React Compiler guidance.
- Use `observer` as an optional hook-count optimization for components with many or conditional `useValue` calls, not as the primary subscription API.
- Mutate through observable APIs such as `set`, `assign`, `delete`, array methods, and Map or Set methods. Never mutate raw data returned by `get()` or `peek()` and expect notifications.
- Use `peek()` only for deliberately untracked reads. Use `get(true)` for shallow key or collection tracking when that is the actual dependency.
- Keep computed, linked, and synced getters pure except for the documented data-loading behavior of async or synced getters. Put side effects in actions, `observe`, `onChange`, or explicit application services.
- Prefer narrow observable nodes and selectors. Use `Memo`, `$React`, `For`, `Show`, or `Switch` only when moving updates to a smaller React boundary materially helps.
- Batch related writes. This matters for listener churn, React renders, and persistence write amplification.
- Choose `synced(...)` when lazy activation on first read is desired; choose `syncObservable(...)` when an existing observable should begin syncing immediately.
- Treat persistence as a cache and retry queue, not as authorization or secure secret storage. Keep server authorization, row-level access, validation, and conflict policy explicit.
- For async persistence, gate reads that require hydrated data on `syncState(state$).isPersistLoaded`. For remote readiness, use `isLoaded`, `error`, and pending-change state rather than guessing from data shape.
- Model logout, tenant changes, and auth gates explicitly. A live `useValue` or other observer can reactivate a lazy synced observable after reset unless the selector or sync configuration is gated.

## Verification

Use the repository's existing checks. For meaningful Legend-State work, include the relevant subset:

- Typecheck against the installed v3 beta declarations and exact subpath imports.
- Unit tests for observable writes, computed dependencies, linked setters, batching, cleanup, Map or Set behavior, and raw-data mutation mistakes.
- React tests for render boundaries, `useValue`, `observer`, `Memo`, `For`, `Show`, Strict Mode cleanup, Suspense, and React Compiler-sensitive patterns.
- Persistence tests for hydration order, transforms, migrations, retry metadata, out-of-order saves, resets, and storage failures.
- Sync tests for create, update, delete, paging, realtime subscriptions, retries, conflict or last-write rules, auth gating, and pending changes across restart.
- Browser or device smoke tests for offline edits, reload, reconnect, failed writes, logout, tenant switching, and storage upgrades.
- Migration scans for v2 persistence APIs, old computed or proxy helpers, `useSelector` or `use$`, direct `.get()` in render paths, legacy reactive component imports, and renamed return or callback behavior.
