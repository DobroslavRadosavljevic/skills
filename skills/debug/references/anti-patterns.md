# Anti-Patterns

Each item is a way debugging goes wrong, with the correct move. If you notice yourself doing one, stop and switch.

| Anti-pattern | Why it hurts | Do this instead |
| --- | --- | --- |
| Changing many things at once | You cannot tell which change mattered, and you add new bugs | Change one variable per experiment; log each result |
| Editing before reproducing | You "fix" a problem you have not seen and cannot verify | Record a repro command first; no repro means gather evidence |
| Trusting the first theory (or the user's) | Confirmation bias; the real cause survives | Rank 2-5 hypotheses; design a test that can kill each |
| Catching and swallowing errors (`catch {}`, `.catch(() => {})`, default values) | The failure moves somewhere harder to see | Let it fail loudly at the right layer; handle only errors you can act on |
| "Fixing" with retries, longer timeouts, or `sleep` | Hides races and slow paths; flakiness returns under load | Find the ordering or resource cause; fix the synchronization |
| Deleting, skipping, or loosening the failing test | The bug stays and the safety net is gone | Fix the cause; if the test is wrong, prove why and fix the test |
| Weakening types (`any`, `as`, `!`, `@ts-ignore`) to pass | Moves a compile-time error to runtime | Fix the model or narrow with a real check |
| Fixing the symptom where it surfaces | The broken invariant lives upstream and breaks elsewhere | Trace the bad value to where it first became wrong |
| Declaring done without re-running the repro | "Looks right" is not evidence | Re-run the original repro and show it flipped |
| Passing repro on a different build, env, or cache | You verified something else | Confirm the running code includes the edit; clear stale build and cache |
| Guessing at a flaky failure after one green run | One pass proves nothing at a 1-in-20 rate | Run a sample large enough to beat the original failure rate |
| Reading only the last error line | Later errors are often fallout of the first | Read from the first error; follow the `cause` chain |
| Debugging with stale or unrelated logs | Misleading timeline | Re-run and capture fresh logs with timestamps |
| Leaving instrumentation behind | Noise, leaks, slowdowns, secrets in logs | Tag temporary lines; `rg` the tag before finishing |
| Bisecting a dirty tree or flaky repro | Wrong commit blamed, user work lost | Save work or use a worktree; make the repro deterministic first |
| Blaming the framework, compiler, or cache first | Rarely true; wastes time | Exhaust your own code and config; then build a minimal repro for upstream |
| Upgrading or pinning dependencies at random | Adds variables and may hide the cause | Bisect the lockfile diff; pin only to prove or as a labeled mitigation |
| Rewriting the module | Throws away the evidence and risks new bugs | Make the minimal fix; refactor separately if justified |
| Adding a new test framework or harness for one bug | Scope creep and tooling debt | Use the repo's existing test surface; otherwise keep a documented repro script |
| Writing the regression check only after the fix and never running it on the old code | The check may pass for the wrong reason | Run it on the unfixed code and confirm it fails for the right reason |
| Mutating production or shared data to test a theory | Real damage | Use read-only inspection, copies, or local replicas; ask first |
| Stopping at the first fix | Sibling bugs ship | Search for the same pattern elsewhere and report |
| Hiding uncertainty | The user acts on a false claim | State what is proven, what is likely, and what is unknown |
