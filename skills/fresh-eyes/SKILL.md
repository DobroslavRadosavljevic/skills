---
name: fresh-eyes
description: Gets a true fresh-eyes review of your own change by dispatching one or more subagents that did not write it. The orchestrator only sizes the work, writes the briefs, and dispatches; each subagent reads the real diff as a strict reviewer, fixes dead code, debug leftovers, unclear names, scope creep, duplication, and missing states, and reports what it fixed. Use when the user invokes $fresh-eyes, says "review your own work", "fresh eyes", or before handing off any change.
---

# Fresh Eyes

The author cannot review with fresh eyes. So the orchestrator does not review. It dispatches reviewer subagents with a clean context and lets them do the whole review and fix.

## Orchestrator: dispatch only

1. Do not read or judge the diff yourself. Do not share your opinion of the change, your plan, or what you think is wrong: that anchors the reviewer.
2. Collect only facts for the brief:
   - The task in one or two sentences (what the user asked for).
   - Where the change is: the branch, `git diff` range, or the list of changed and new files.
   - The commands to check the touched area (typecheck, lint, tests), scoped narrow, with short timeouts.
   - Project rules files to read (for example `CLAUDE.md`, `AGENTS.md`, contributing docs).
3. Decide how many reviewers, from the size of the change (file count and diff lines only, not its content):
   - Small or tightly linked change (about 15 files or 800 changed lines or less): one subagent.
   - Bigger change: split it into slices of disjoint files that belong together (one package, feature, or layer per slice), one subagent per slice. Keep each slice near that size. Respect the machine load and the harness limits on parallel agents.
   - Never put the same file in two slices.
4. Dispatch the subagents in parallel with the brief below, each with a fresh context, not a fork of your conversation.
5. When they report, relay the combined result to the user. Check their fixes with the diff before you call them done. If two reports conflict, or a fix crosses slices, resolve it or ask the user.

If the harness has no subagents, say so, then do the review yourself and follow the reviewer steps strictly, starting from a re-read of the full diff.

## Brief for the subagent

Copy this, filling in the brackets:

```text
You are a strict reviewer. You did not write this change. Your job is to approve it only after it is clean.

Task the change was made for: [task]
Change location: [diff range / branch]
Your slice (edit only these files): [file list, or "all" when you are the only reviewer]
Other reviewers own the other files; you may read them, but report cross-slice problems instead of editing them.
Project rules: read [rules files] first.
Checks to run after fixes: [commands, each with a short timeout]

Steps:
1. Read the full real diff of your slice, including new untracked files. Do not skim.
2. For every hunk check:
   - Leftovers: debug logs, commented-out code, TODOs, unused imports or variables.
   - Names: each name says what it is and matches the codebase style.
   - Scope: every change is needed for the task. Revert what is not.
   - Duplication: nothing re-creates code that already exists in the repo (search for it).
   - Missing: error handling, empty/loading/error states, tests where the repo expects them.
   - Readability: a hunk could be shorter or plainer.
   - Correctness: obvious bugs, wrong edge cases, broken callers.
3. Fix what you found directly in the files. Keep behavior the task asked for. Do not widen the scope.
4. Run the checks. Fix failures you caused.
5. Report: a short list of what you fixed (file:line, one line each), what you found but did not fix and why, and the check results. If you found nothing, list what you checked.
Do not approve on a first skim. Do not commit or push.
```

## Rules

- Size first: one reviewer by default, more only when the change is too big for one careful read.
- Each file has exactly one reviewer. Do not run your own review of the same diff.
- Give facts, never conclusions. The brief must not say what is good or bad about the change.
- The subagent fixes; the orchestrator verifies and reports.
