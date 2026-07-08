---
name: tanstack-store
description: "Build, review, debug, migrate, or plan TanStack Store state management with current docs. Use for @tanstack/store, @tanstack/react-store, createStore, Store, ReadonlyStore, setState, subscribe, batch, flush, shallow, derived stores, createAtom, createAsyncAtom, useSelector, useStore migrations, useAtom, useCreateStore, useCreateAtom, createStoreContext, selector compare functions, immutable updates, actions factories, SSR-safe store lifetime, framework adapters, testing, and production state patterns."
---

# TanStack Store

Use this skill when work touches TanStack Store, especially `@tanstack/react-store`, framework-agnostic stores, atoms, derived state, or migration from older `useStore` examples.

## Workflow

1. Inspect the local state shape before changing code:
   - Package versions for `@tanstack/store`, `@tanstack/react-store`, framework adapters, React, and test utilities.
   - Store lifetime: module singleton, context-provided bundle, component-lifetime store, request-scoped SSR state, or local atom.
   - Read/write APIs in use: `useSelector`, deprecated `useStore`, `_useStore`, `useAtom`, `setState`, actions factories, subscriptions, or atoms.
   - Update expectations: immutable object updates, derived computations, batching, persistence side effects, and selector re-render behavior.
2. Refresh current docs and package evidence when behavior or versions matter. Start from [source-map.md](references/source-map.md).
3. For installation, package names, core `createStore`, `Store`, actions, subscriptions, immutable updates, and batching, use [setup-core.md](references/setup-core.md).
4. For React usage, `useSelector`, selector `compare`, `useAtom`, `useCreateStore`, `useCreateAtom`, contexts, and `useStore` migrations, use [react-patterns.md](references/react-patterns.md).
5. For atoms, async atoms, derived stores, previous values, equality, `shallow`, and reactive graph behavior, use [atoms-derived-batching.md](references/atoms-derived-batching.md).
6. For SSR, testing, lifecycle, persistence, framework adapters, debugging without devtools, and production checks, use [production-testing.md](references/production-testing.md).

## Implementation Judgment

- Prefer `useSelector` in React. Treat `useStore` as a deprecated alias and `_useStore` as transitional unless the codebase deliberately adopted it.
- Keep store updates immutable. `setState` replaces the store value with the updater return, so object updates should spread or construct the complete next state.
- Use narrow selectors for React rendering. Selecting the whole store couples a component to every change.
- Add `compare` or `shallow` only when a selector returns composite values that would otherwise churn; prefer stable primitive selections first.
- Use `batch` when multiple store or atom updates should notify subscribers once with final state.
- Use action factories when a store owns domain operations; keep UI components from hand-rolling repeated update logic.
- Avoid module-scope user/session stores in SSR unless the state is truly global and public. Create request- or component-scoped stores for per-user data.
- Use `subscribe` for side effects like persistence or logging, and always keep the `unsubscribe` cleanup.
- Check current docs before relying on adapter details. Store is v0, and adapter APIs are still evolving.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Store changes, include the relevant subset:

- Typecheck for store state, action factories, selectors, atom values, and context bundles.
- Unit tests for `setState`, action methods, derived stores, atoms, async atoms, batching, and subscription cleanup.
- Component tests for selector re-render boundaries, `compare`, `useAtom` setters, context errors, and deprecated API migrations.
- SSR/request tests when changing store lifetime, module scope, context providers, or server-created initial state.
- Browser smoke for UI flows that depend on derived state, optimistic local state, persistence, or cross-component subscriptions.
