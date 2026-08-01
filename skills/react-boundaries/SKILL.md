---
name: react-boundaries
description: Enforces React component ownership boundaries—colocate state, queries, and mutations with consuming leaves; avoid prop drilling and parent data hubs; structure trees for render isolation and composability. Includes TanStack Query, Router, Start, Form, and Store patterns. Use when designing or reviewing component architecture, refactoring prop-heavy trees, fixing unnecessary re-renders from lifted state, deciding where API or query logic should live, or when the user says react-boundaries, ownership boundaries, push state down, or stop prop drilling.
---

# React Boundaries

Own state, data, and side effects at the **lowest correct boundary**. Parents compose structure; they do not become data hubs.

**Principle:** a component should own what it needs to render and act—unless another boundary must genuinely coordinate, gate, or load in parallel.

## Hard Defaults

1. **Push down.** State and fetches live with the consumer. Lift only via the exception list.
2. **Pass identity, not payloads.** Give children an `id` (or stable handle); let them subscribe or query. Do not drill entities through wrappers that never use them.
3. **Compose UI, don’t pipe props.** Prefer `children` / slots / named parts over threading `data`, `isLoading`, and handlers through layout shells.
4. **Shared clients, local hooks.** One API or QueryClient; many leaf hooks. Do not centralize “call the API” five layers up.
5. **Structure over memo theater.** Fix ownership and tree shape before spraying `memo` / `useCallback` / `useMemo`. Prefer patterns that work with React Compiler.
6. **Justify every hoist** in one line when you lift or route-fetch (“SEO”, “gate before mount”, “sibling sync”, “anti-waterfall”).

## When Hoisting Is Correct

Hoist state or data ownership only for:

| Exception | Own at |
| --- | --- |
| Route / SSR / SEO needs data before paint or for meta | Router loader, Start server function, or RSC prefetch |
| Auth, permissions, or “don’t mount until X” | Route or parent gate |
| Two+ siblings must share one interactive source of truth | Nearest common parent or a narrow store |
| Parent must know *which* children exist before they can fetch | Parent / loader (anti-waterfall) |
| Cache already dedupes the same key | Leaves still subscribe; parent may **prefetch only** |

Everything else stays down. Details: [ownership.md](references/ownership.md).

## Workflow

1. **Scope** — feature, route, or component tree the user named.
2. **Map ownership** — for each piece of state and each query/mutation, name the owner and who re-renders when it changes.
3. **Apply defaults** — move ownership down; replace drilled payloads with ids + leaf subscriptions; replace prop pipelines with composition.
4. **Apply TanStack patterns** — [tanstack-patterns.md](references/tanstack-patterns.md).
5. **Check composition** — [composition.md](references/composition.md).
6. **Kill anti-patterns** — [anti-patterns.md](references/anti-patterns.md).
7. **Verify** — typecheck/lint/tests for the touched surface; confirm high-churn state no longer sits in page/route shells.

## Placement Checklist

Before finishing a change, answer:

- [ ] Who re-renders if this state or query updates?
- [ ] Who actually *uses* this data or state?
- [ ] Can the leaf own the query/mutation (or subscribe to a shared key)?
- [ ] Are intermediates composing UI or only forwarding props?
- [ ] If hoisted: which exception applies (one-line justification)?
- [ ] Is Context / Store carrying stable deps or high-churn values that should be local?

## Non-Goals

- Not “never use Context,” “never use route loaders,” or “never pass props.”
- Not restyling, a11y primitive design, or general React API docs.
- Not replacing TanStack Query with ad-hoc parent `useEffect` fetching.

## Completion

Report briefly:

- Ownership moves (what moved down or stayed up, and why).
- Prop-drilling or data-hub removals.
- Prefetch vs subscribe split (if any).
- Remaining hoists with their exception justification.
