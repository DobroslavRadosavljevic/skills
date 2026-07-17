---
name: loop
description: Implement-review-fix loop for development tasks. Use when the user invokes $loop, says "loop", "loop this", "run the loop", "implement then review", "review/fix until clean", or otherwise asks Codex to keep cycling through implementation, review, fixes, and re-review until no actionable issues remain.
---

# Loop

## Overview

Run the requested task as an iterative implementation pipeline. Implement the change, review the result, fix every actionable issue, and repeat until the review is clean or a real blocker prevents further progress.

## Operating Rules

- Keep ownership with the orchestrator agent. Use reviewers for independent scrutiny, but the main agent decides what to fix, performs the fixes, and verifies the final state.
- Do not stop after finding review issues. Fix them, then run another review pass.
- Treat review findings as actionable unless they are demonstrably incorrect, duplicate, impossible with available context, or outside the user's requested scope.
- Do not claim the loop is complete while known correctness, security, data-loss, regression, build, test, or user-visible defects remain.
- Preserve unrelated user changes. If a review finding points at unrelated dirty work, call it out instead of rewriting it.
- When the harness supports todo lists, plans, or task checklists, create a clear, detailed todo list before implementation and keep item statuses current through every review and fix cycle.
- Keep the user updated during long loops, especially before substantial edits and after each review cycle.

## Workflow

1. Understand the task and inspect the relevant repo context.
2. Create a useful todo list if the harness supports one, with enough detail to track implementation, verification, review, and follow-up fixes.
3. Implement the requested change using the repo's existing patterns.
4. Run the most relevant verification available for the change.
5. Run a review pass against the implementation.
6. If the review finds actionable issues, fix them.
7. Re-run affected verification.
8. Re-run review.
9. Continue steps 6-8 until the review has no actionable findings.
10. Finish with the final state, verification performed, and any residual blockers or explicitly deferred non-issues.

## Review Mode

Choose the smallest review method that gives credible coverage:

- Use a self-review pass for narrow, low-risk, single-area changes.
- Use one or more parallel reviewer agents when available and useful for broad changes, security-sensitive work, cross-cutting behavior, unfamiliar code, or when the user asks for independent review.
- Split reviewer agents by concern when that improves signal, such as correctness, tests, UX, performance, security, or docs.
- Give reviewers the task, changed files or diff, and verification output. Do not give them the desired answer or ask them to rubber-stamp the work.

## Review Standard

Every review pass should check:

- The user's request is fully satisfied.
- The change fits existing architecture, naming, style, and ownership boundaries.
- Error handling, edge cases, and rollback or failure behavior are reasonable.
- Tests or verification cover the risky behavior touched by the change.
- No unrelated edits, secrets, generated noise, or local-only assumptions were introduced.
- Documentation or user-facing text was updated when the behavior changed.

## Fixing Review Findings

For each actionable finding:

- Reproduce or inspect the issue enough to understand it.
- Patch the root cause, not only the symptom.
- Add or update tests when the bug is behavioral and the repo has a suitable test surface.
- Re-run the narrowest useful verification first, then broader gates when risk or repo norms call for them.
- Keep a short internal ledger of findings and status so repeated review cycles do not lose track.

If a finding is not fixed, it must have a concrete reason: false positive, duplicate, out of scope, blocked by missing prerequisite, or requires user product judgment. Report that clearly in the final response.

## Stopping Criteria

Stop only when one of these is true:

- A review pass returns no actionable issues and relevant verification has passed or been honestly reported as unavailable.
- The same blocker prevents progress after serious attempts to resolve it, such as missing credentials, unavailable services, failing external dependencies, or an ambiguous product decision that cannot be inferred safely.
- The user explicitly asks to pause, stop, or change direction.

Do not stop merely because one review-fix cycle completed. The loop ends when the work is clean, not when the first review has been addressed.

## Final Response

Summarize:

- What changed.
- How many review cycles ran and what the last review concluded.
- Verification commands and results.
- Any unfixed finding, blocker, or intentional deferral.
