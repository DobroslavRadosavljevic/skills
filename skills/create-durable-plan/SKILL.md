---
name: create-durable-plan
description: >-
  Create an advanced durable plan pack under repo-root plans/<YYYY-MM-DD-slug>
  (PLAN, STATUS, TRACE, CONTRACT, EXECUTION, optional phase files) so any later
  coding agent can execute file-level, contracted, verifiable work without
  guessing. Use when the user invokes $create-durable-plan, says "create durable
  plan", "durable plan", "write a plan to /plans", "plans folder", or asks for a
  highly specific, phased, file-level plan persisted in the codebase. If root
  plans/ is missing, set it up from scratch first.
---

# Create Durable Plan

## Overview

Write a **durable plan pack in the repo**. Target `plans/<YYYY-MM-DD-slug>/`. A later coding agent with **no chat history** must know what to do, where, how, in what order, which invariants to preserve, when to stop, and how to prove a phase is done.

This skill **researches and writes plan files**. It does **not** implement product work unless the user explicitly asks after the pack exists.

## Output pack

```text
plans/
  README.md
  <YYYY-MM-DD>-<slug>/
    PLAN.md          # mission, graph, file map, phase index, verification matrix
    STATUS.md        # progress machine (authoritative for where we are)
    TRACE.md         # evidence: facts vs inferences, sources, dead ends
    CONTRACT.md      # types, APIs, invariants, phase seams, do-not-break
    EXECUTION.md     # load order, stop conditions, drift, amendment rules
    phases/          # only when phases are split (see pack rules)
      P00-<slug>.md
```

Required on every create: `PLAN.md`, `STATUS.md`, `TRACE.md`, `CONTRACT.md`, `EXECUTION.md`.

Pack rules: [references/plan-pack.md](references/plan-pack.md). Templates: [references/plan-template.md](references/plan-template.md), [references/status-template.md](references/status-template.md), [references/trace-template.md](references/trace-template.md), [references/contract-template.md](references/contract-template.md), [references/phase-template.md](references/phase-template.md), [references/execution.md](references/execution.md).

## Safety

- Never overwrite an existing `plans/<dir>/` without an explicit user choice (new slug, overwrite, or abort).
- Never delete other plan folders.
- No secrets: env var **names** only.
- **Planning writes only:** `plans/**` plus an optional pointer in an **existing** root `AGENTS.md`. Do not create `AGENTS.md`. Do not implement product code, install deps, migrate data, or mutate the rest of the repo.
- Research is read-only until the pack is written.
- Do not commit unless the user asks.
- If `.gitignore` ignores `plans/` / `plans/**`, stop and ask to un-ignore or confirm local-only. Do not add `plans/` to gitignore.
- If an existing plan already covers the same mission, link it and ask whether to extend, supersede (new dated folder), or abort. Do not silently duplicate.

## Workflow

### 1. Bootstrap `plans/` if missing

If repo-root `plans/` does not exist, set it up completely. Follow [references/layout.md](references/layout.md). Copy [assets/plans-readme.md](assets/plans-readme.md) to `plans/README.md`.

If `plans/` exists without `README.md`, add it from the asset. Do not rewrite a custom README; append an index row for the new plan.

### 2. Preflight

Record in `TRACE.md` (and summarize in `PLAN.md` metadata):

- Repo root, branch, dirty-tree note (names only; do not stash or revert).
- Package manager and real verify commands from manifests/CI.
- Related files under `plans/` (supersedes / related / conflicts).
- Plan **kind**: `feature` | `fix` | `migrate` | `extract` | `delete` | `infra` | `spike`.
- Blast-radius guess: modules, apps, packages, generated code, public APIs.

A `spike` must name the decision it unblocks and the artifact that ends the spike. It is not an unbounded research folder.

### 3. Lock the mission

Restate mission, goals, non-goals, and success as **testable claims**. If the request cannot yield an executable pack, ask a small batch of high-leverage questions, each with a recommended default.

If the user proceeds on assumptions, each assumption gets: statement, why it was needed, blast if wrong, and which phase absorbs the risk.

### 4. Evidence (mandatory)

Follow [references/research.md](references/research.md). Do not write implementation steps from memory of libraries or of unread files.

Minimum:

- Inspect canonical paths, symbols, tests, schemas, and callers for every area the plan will touch.
- Fetch current official docs for libraries, APIs, CLIs, or cloud behavior the plan depends on. Record URL, version/date, and the exact takeaway.
- Separate **facts**, **inferences**, and **unknowns** in `TRACE.md`.
- Confidence gate: if a subsystem is not understood well enough to name files and verify steps, that work becomes an explicit **discover** phase with a written investigation protocol — not invented certainty.

### 5. Name the folder

- `plans/YYYY-MM-DD-kebab-slug` using the user's local date.
- Slug: 3–8 words, lowercase, digits, hyphens.
- Collision: ask. `-2` suffix is fine. Never overwrite by default.
- Superseding an older plan: new dated folder; in both `PLAN.md` files set `Supersedes` / `Superseded by` paths.

### 6. Design the work graph before prose

Before filling templates, invent:

1. **File map** — every create / modify / delete / do-not-touch path.
2. **Phase graph** — `P00…Pn`, dependencies, optional disjoint **lanes**, critical path.
3. **Seams** — what each phase must leave behind for the next (types, flags, tests, data). Those seams go in `CONTRACT.md`.
4. **Verification matrix** — every success criterion maps to a command or named test.

Parallel lanes are allowed only when file maps are disjoint **and** `CONTRACT.md` defines the shared seam. Default is a single ordered path.

### 7. Write the pack

Fill every required file. Omit empty sections inside a file; do not omit required files.

Depth rule: **a stranger agent must not rediscover scope, files, sequence, contracts, or stop rules.**

Each phase (in `PLAN.md` and/or `phases/Pxx-*.md`) must include the fields in [references/phase-template.md](references/phase-template.md): objective, kind, deps, blast radius, file table, **patch recipes**, invariants to preserve, tests, verify commands, rollback, done-when, stop-if, and phase-local resources.

`PLAN.md` always keeps a phase **index** even when bodies live under `phases/`.

Meet [references/quality-bar.md](references/quality-bar.md). Run the self-audit there **before** telling the user the pack is ready. If it fails, fix the pack; do not ship a shallow plan.

### 8. Index and optional AGENTS.md pointer

- Append a row to the index table in `plans/README.md`.
- If root `AGENTS.md` exists and has no `plans/` pointer, add:
  `- [plans/](plans/) — durable plan packs; read EXECUTION.md, then STATUS.md, then PLAN.md`
- If `AGENTS.md` is missing, skip.

### 9. Deliver

Report:

- Bootstrapped `plans/` or not.
- Folder path, kind, phase count, whether phases were split.
- Critical path and any parallel lanes.
- Open assumptions / risks.
- Self-audit result (pass / what you tightened).
- Resume line:

```text
Read plans/<dir>/EXECUTION.md, then STATUS.md, then PLAN.md, then CONTRACT.md. Execute the next incomplete phase only. Follow stop conditions. Update STATUS.md after each phase. Do not skip verification or file recipes.
```

Do not implement in the same turn unless the user explicitly asked to execute after the pack exists.

## Isolation

This skill stands alone. Do not mention, link to, or depend on other skills. Reference only the target repo, user input, official docs, and this skill's `references/` and `assets/`.

## Out of Scope

- Implementing the planned product work while authoring the pack.
- Chat-only plans.
- Phase titles without file recipes and verify steps.
- Creating `AGENTS.md` when missing.
- Committing, opening PRs, or changing issue trackers unless the user asks.
