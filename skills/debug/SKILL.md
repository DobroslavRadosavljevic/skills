---
name: debug
description: Disciplined root-cause debugging workflow. Captures the symptom, reproduces it deterministically, minimizes the repro, ranks hypotheses and tests the cheapest first, proves the cause, fixes it at the root, locks it in with a regression check, and hunts sibling bugs. Use when the user says "debug", "fix this bug", "why is this failing", "root cause", "flaky test", "regression", "it worked before", "crash", "wrong output", "intermittent", "only in production", "hydration mismatch", "memory leak", "slow after upgrade", or pastes an error message or stack trace.
---

# Debug

**Single goal:** find the real cause of a defect, prove it, and fix it there. A passing run is not a diagnosis.

Reproduce first, hypothesize second, edit third. Every edit before the cause is proven is a guess that can hide the bug.

## Core Rules

- Treat the user's explanation and your first theory as hypotheses, not facts.
- Never fix what you cannot reproduce. If you cannot reproduce, gather evidence instead of guessing.
- Change one variable at a time. Keep a short log of what you tried and what each result ruled out.
- Read the actual code path and the actual error before theorizing. Quote the exact error text.
- Fix the root cause, not the symptom. Do not mask with retries, longer timeouts, broad `try/catch`, fallback values, or skipped tests.
- Keep the fix as small as correctness allows. No drive-by refactors.
- Remove all temporary instrumentation before finishing.
- Do not add a test framework or new tooling. Use what the repo already has.
- Do not run destructive or production-mutating commands to investigate. Use read-only inspection, copies, or local replicas.
- Preserve unrelated user changes. Do not stash, reset, or bisect over a dirty tree without saving the user's work first.
- Do not claim "fixed" until the original repro has been re-run and flipped.

## Workflow

### 1. Capture the symptom

Record exactly, from the user's message and the repo:

- Error text, stack trace, exit code, failing test name, or wrong-output example
- Expected vs actual behavior
- Trigger: inputs, steps, command, URL, request payload
- Environment: runtime and package versions, OS, env vars, config, data, branch or commit
- Frequency: always, intermittent, only in one environment
- Last known good: commit, release, or date when it worked

Find what you can yourself (logs, CI output, git history, config). Ask the user only for what cannot be found, in one batched question.

### 2. Reproduce deterministically

Find the smallest command that shows the failure: one test, one script, one request. Run it. Record the command and its exact output. This is the **repro**.

- Run it enough times to know its failure rate (e.g. 20 runs). A 1-in-20 failure needs 20+ runs to judge any change.
- If it cannot be reproduced, say so plainly. Switch to evidence gathering: logs, traces, crash dumps, metrics, diffs between environments. Add observability, then wait for or provoke the next occurrence. See [special-cases.md](references/special-cases.md).
- If the failure is intermittent, make it deterministic by controlling time, randomness, ordering, concurrency, or data before theorizing.

### 3. Minimize

Shrink the repro until every remaining piece is needed: smaller input, fewer files, one module, one test, no network, no UI. Each removed piece that does not change the failure is evidence about where the bug is not. Stop when removing anything makes the failure vanish.

### 4. Hypothesize and rank

Write 2-5 hypotheses. For each give:

- The claim ("cache key omits tenant id")
- The evidence that would confirm it and the evidence that would kill it
- The cost of testing it

Rank by likelihood against cost. Test the cheapest discriminating hypothesis first. A good test separates two hypotheses at once. No shotgun edits: do not change several suspects together to "see if it helps".

When the harness supports subagents, delegate independent, read-only hypothesis checks in parallel, each with the repro, one hypothesis, and the evidence to return. Without subagents, test them one by one in rank order.

### 5. Investigate with the right tool

Pick tools that answer the current hypothesis. Toolkit and commands: [investigation-toolkit.md](references/investigation-toolkit.md). Summary:

- Read the code path from entry to failure. Check types, config, and callers.
- Temporary targeted logging or assertions at the boundary where good state turns bad. Tag them (e.g. `DEBUGTMP`) so removal is a grep.
- A debugger (`bun --inspect-brk`, `node --inspect-brk`) when state matters more than flow.
- `git bisect run <repro>` for regressions. `git log -S`, `git blame`, and lockfile diffs for "it worked before".
- Environment, config, and data diffs between a working and failing setup.
- Network, DB, and queue inspection for boundary bugs.

Bisect the problem space: halve the code path, the input, or the history until the failing step is one line or one commit.

### 6. Prove the root cause

A cause is proven only when you can state the causal chain and show the repro flips:

1. State the chain: trigger, faulty condition, mechanism, symptom.
2. Predict an observable you have not seen yet and confirm it.
3. Change only the suspected cause (the minimal fix, or a toggle that undoes it) and show the repro flips from fail to pass.
4. Revert the change and show it fails again. A cause that does not flip both ways is a correlation.

If proof fails, discard the hypothesis, record what it ruled out, and return to step 4.

### 7. Fix at the root

Apply the smallest correct change at the place the invariant is broken, not where it surfaced. Ask: why was this state possible? Prefer making the bad state unrepresentable (types, validation at the boundary) over guarding each reader. Remove temporary instrumentation. Review the diff for leftovers.

### 8. Lock it in

Add a regression check that **fails before the fix and passes after**.

- Write the failure modes first: the exact failing case from the repro, plus the nearest neighbors (boundaries, empty, concurrent, other callers).
- Use the repo's existing test setup. Prefer an end-to-end or integration check that exercises the real path. Use a lower-level test only when the repo has no higher-level surface or the bug lives in one pure function.
- Do not introduce a new test framework or harness. If the repo has no test surface for this bug, keep the repro as a documented script or command and report that gap.
- Prove the check: run it on the unfixed code (stash the fix or use a worktree) and confirm it fails for the right reason, then on the fixed code.
- Never delete, skip, loosen, or retry-wrap a failing test to get green.

### 9. Hunt siblings

The same root cause rarely lives in one place. Search for the same pattern: same helper, same API misuse, same assumption, copy-pasted logic, same lockfile-affected call sites. Fix siblings that share the cause when in scope; otherwise list them. Report negative results too ("searched X, found none").

### 10. Verify and report

Re-run the original repro, the regression check, and the narrowest relevant existing suite, then the broader typecheck, lint, and tests that repo norms call for. Report with [response-template.md](references/response-template.md). If something could not be verified, say what and why.

## Stuck Protocol

If three hypotheses die in a row, stop and re-check assumptions: Is the repro really testing what you think? Are you running the code you edited (stale build, cache, wrong process, wrong environment)? Did you read the real error, or its wrapper? Is the "working" case actually working? Explain the problem step by step to the user or in the log; mismatches often surface in the telling. If still stuck, report evidence gathered, ruled-out causes, and the next most informative experiment instead of guessing.

## References

- [investigation-toolkit.md](references/investigation-toolkit.md): commands for bisect, history, dependencies, debugger, logging, profiling, network, and DB inspection.
- [special-cases.md](references/special-cases.md): flaky tests, races, memory leaks, performance regressions, production-only bugs, dependency upgrades, type vs runtime errors, hydration mismatches, heisenbugs.
- [anti-patterns.md](references/anti-patterns.md): behaviors that make debugging worse, with the correct alternative.
- [response-template.md](references/response-template.md): final response format.
