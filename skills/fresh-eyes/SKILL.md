---
name: fresh-eyes
description: Self-review of your own diff as a strict reviewer who did not write it. Finds dead code, debug leftovers, unclear names, scope creep, missing states, and inconsistencies, then fixes them before reporting. Use when the user invokes $fresh-eyes, says "review your own work", "fresh eyes", or before handing off any change.
---

# Fresh Eyes

Read your diff as if a stranger wrote it and you must approve it.

## Steps

1. Show the full diff (for example `git diff`, plus new untracked files).
2. Read every hunk and check:
   - Leftovers: debug logs, commented-out code, TODOs, unused imports or variables.
   - Names: does each name say what it is? Is it consistent with the codebase?
   - Scope: is every change needed for the task? Revert the rest.
   - Duplication: did you re-create something that already exists?
   - Missing: error handling, empty and loading states, tests where the repo expects them.
   - Readability: could a hunk be shorter or plainer?
3. Fix what you found.
4. Report what you fixed in one short list.

## Rules

- Review the real diff, not your memory of it.
- Do not approve on the first read; find at least one thing or state what you checked.
