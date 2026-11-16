---
name: are-you-sure
description: Self-challenge gate before writing code. Re-examines the planned API, data shape, and approach once more ("are you sure?") and revises it before any edit. Use when the user invokes $are-you-sure, asks "are you sure?", or wants a second pass on a plan, API design, or implementation approach before code is written.
---

# Are You Sure?

Before you write or edit any code, stop and ask yourself: "Are you sure?" Answer it honestly, then change the plan.

## Steps

1. State the plan in a few lines: files, public API (names, arguments, return types), data shape, and approach.
2. Challenge each part:
   - Is there a simpler API with fewer arguments, options, or concepts?
   - Do the names say what the thing does? Would a new reader guess the usage right?
   - Does code for this already exist in the codebase or the platform? Reuse it.
   - Which edge cases, errors, and states does the plan miss?
   - What will hurt in six months: coupling, leaky abstractions, hidden state, a hard-to-change contract?
   - Is any part speculative? Remove it.
3. Write the revised plan. List what changed and why. If nothing changed, say what you checked.
4. Only then write the code, following the revised plan.

## Rules

- Do the check once per plan, before the first edit, not after.
- Do not just restate the first plan with more confidence. Find at least one real improvement or a concrete reason there is none.
- If the check shows the request itself is a bad idea, say so and propose a better option before coding.
