---
name: iterate
description: Improvement loop that makes an agent re-work a chosen piece of output (code, UI, API, copy, docs, plan, prompt, test suite, design) round after round until it is clearly better in depth, not just polished on the surface. Sets a concrete quality bar first, critiques against it, improves the weakest part, proves each round with evidence, and stops only when a round brings no real gain or the bar is met. Use when the user invokes $iterate, says "iterate on this", "keep improving", "make it better", "go deeper", "reiterate until it's good", or is unhappy with a first version.
---

# Iterate

Do not stop at the first version that works. Loop: critique, improve, prove, until the next round brings nothing real.

## 1. Set the target and the bar

1. Name exactly what to improve (a file, component, function, screen, doc, plan). One target per loop.
2. Write the bar: 3 to 6 concrete, checkable criteria for "better in depth" for this target. Pick from the angles that matter here:
   - Correctness and edge cases (empty, huge, invalid, concurrent, failure).
   - Design: simpler API, clearer names, fewer concepts, right boundaries.
   - Completeness: every state, path, and real use case covered.
   - Performance: measured numbers, not guesses.
   - UX and accessibility, for anything a person sees or uses.
   - Clarity: a new reader understands it fast.
   - Security and data safety, where input or data flows.
3. Record the baseline: how the current version scores on each criterion, with evidence (test output, measurement, screenshot, or a quoted weak spot).
4. Set a round limit (default 5) so the loop always ends.

## 2. Loop

Each round:

1. **Critique.** Find the weakest criterion and the most important problem behind it. Look for root causes, not cosmetics. Ask "what would an expert in this area still reject?"
2. **Improve.** Make the change that fixes that problem in depth. Prefer one meaningful change over many small touches. Do not break criteria that already pass.
3. **Prove.** Re-check every criterion with evidence. Compare to the previous round.
4. **Log.** One line: round number, what changed, which criterion moved, evidence.

For an unbiased critique on big or important work, have a separate reviewer with a fresh context (a subagent, if the harness has them) do the critique step from the target and the bar only, not from your reasoning. Otherwise critique yourself, starting from a full re-read of the current version, not your memory of it.

## 3. Stop

Stop when any of these is true:

- Every criterion on the bar is met, with evidence.
- A full round found no problem worth fixing, or the change made no measurable gain.
- The round limit is reached.
- The next improvement needs a decision only the user can make (scope, architecture, a new dependency, cost). Ask, then continue or stop.

Do not stop because a version "looks fine". Do not keep going for churn: if a change is a matter of taste with no gain on the bar, skip it.

## Report

- Result first: before and after on each criterion, with evidence.
- The round log.
- What still falls short of the bar and why, and the next improvement worth making.
