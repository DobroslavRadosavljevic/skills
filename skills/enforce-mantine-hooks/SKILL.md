---
name: enforce-mantine-hooks
description: "Finds hand-written React hooks, effects, and utilities in a codebase that @mantine/hooks already provides, and dispatches parallel subagents to replace them when the Mantine hook keeps the same behavior or improves it. Use when the user invokes $enforce-mantine-hooks, says \"enforce mantine hooks\", \"replace custom hooks with mantine\", \"use @mantine/hooks instead of our hooks\", \"swap custom useDebounce/useLocalStorage/useClickOutside for mantine\", or asks to audit a codebase for code that @mantine/hooks covers. Requires the mantine-hooks skill for hook APIs."
---

# Enforce Mantine Hooks

**Goal:** remove custom code that `@mantine/hooks` already does, but only when the swap keeps the behavior the same or makes it better. A swap that changes behavior in a way nobody asked for is a bug, not a cleanup.

## Required companion skill

Load the `mantine-hooks` skill before you scan, and tell every worker to load it too. It holds the hook catalog, the 9.x API, SSR rules, and migration traps. If it is not available, use the current docs at `https://mantine.dev/hooks/` and say so in the report.

## Preconditions

1. Read `package.json` (and workspace packages). Record the `@mantine/hooks` version and the React version.
2. If `@mantine/hooks` is not installed, stop and ask before you add it (new dependency). `@mantine/hooks@9.x` needs `react@^19.2`. On older React, ask whether to pin 8.x or stop.
3. Note if the app renders on the server (SSR, hydration). This changes the safe options for media, storage, and viewport hooks.
4. Use only `@mantine/hooks`. Never add `@mantine/core` or other `@mantine/*` packages for this task.

## Workflow

### 1. Scan

Find candidates in first-party code only (skip `node_modules`, generated files, vendored code, build output). Use the signals in [candidates.md](references/candidates.md): custom hook names, raw `addEventListener` / `matchMedia` / `ResizeObserver` / `IntersectionObserver` / `localStorage` / `setTimeout` patterns inside effects, and small utils such as `clamp` or `randomId`.

Output one inventory row per candidate: file, symbol, the Mantine hook that may replace it, and its call sites.

### 2. Batch

Group candidates into disjoint batches. Put a custom hook and all of its call sites in the same batch. Two workers must never edit the same file. Shared files (a `hooks/` barrel, a shared util) stay with the orchestrator.

### 3. Dispatch

Give each batch to one parallel subagent with the brief in [worker-brief.md](references/worker-brief.md): the versions, the SSR flag, its exact file list, and the parity rubric in [parity.md](references/parity.md). Use a capable model for this work; the parity check needs judgment.

If the harness has no subagents, run the batches one after another yourself with the same brief.

### 4. Reconcile

Collect each worker's verdicts (`replace`, `keep`, `needs-approval`). Then:

- Delete custom hooks and utils that no file imports any more, and their tests that only tested the removed code. List each deletion in the report.
- Remove dead re-exports from barrels.
- Bring every `needs-approval` item to the user. Do not apply it without a yes.

### 5. Verify

Run typecheck, lint, and the existing tests. Search for imports of deleted symbols. Then run the real app and exercise each changed flow (outside click, hotkeys, debounced search, stored settings, media query layout). If a check cannot run, say so.

## Rules

- **Parity first.** Replace only when every point in [parity.md](references/parity.md) holds, or when the difference is a clear fix (for example a missing cleanup, a stale closure, an SSR crash). Name the fix in the report.
- **Keep, do not force.** Custom code with logic Mantine does not have stays. Do not wrap a Mantine hook in a new custom hook just to keep the old name; update the call sites.
- **No compat aliases.** Remove the old hook in the same change. Do not leave a re-export "for later".
- **Ask first** before you add the dependency, change public package exports, or change visible behavior (timing, initial value on first paint, storage key format, event target).
- Preserve unrelated user changes. Keep each batch reviewable.

## Report

Lead with the count of replacements and deleted lines. Then a table: file → old code → Mantine hook → `same` or `better (why)`. Then kept candidates with reasons, `needs-approval` items, and checks that did not run.
