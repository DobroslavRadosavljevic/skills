# Final Response Template

Use this for the final response to the user. Lead with the outcome. Keep each section short and concrete: exact commands, exact error text, file paths with line numbers. Skip a section only if it truly does not apply, and say so.

```markdown
## Summary
One or two sentences: what was broken, the root cause, and the state now (fixed / mitigated / not reproduced / blocked).

## Symptom
- Observed: <exact error text or wrong output>
- Expected: <what should happen>
- Trigger and environment: <inputs, versions, config, frequency>
- Last known good: <commit/release/date, or "unknown">

## Repro
- Command: `<smallest command>`
- Result before the fix: <exact failing output, failure rate e.g. 20/20>
- Minimized to: <what was removed to get here>
- Not reproduced? State this plainly, list the evidence gathered, and list the next observation to add.

## Root cause
- Causal chain: <trigger> -> <faulty condition> -> <mechanism> -> <symptom>
- Location: `path/to/file.ts:LINE`
- Why it was possible: <missing validation, wrong assumption, race window, changed dependency behavior>
- Ruled out: <hypotheses tested and killed, with the evidence>

## Fix
- Change: <what changed and why here and not at the symptom>
- Files: `path/to/file.ts`
- Instrumentation removed: yes/no (checked with: `rg <tag>`)

## Proof
- Repro after the fix: <command and result, e.g. 0/50>
- Cause isolated: <only the cause changed; repro flipped; reverting brought it back>
- Broader checks: <typecheck, lint, test suites run and results>

## Regression check
- Check: <test/script path and name; which existing setup it uses>
- Fails before the fix: <how it was shown, and that it fails for the right reason>
- Passes after the fix: <result>
- Failure modes covered: <list>
- No suitable test surface? Say so and name the documented repro.

## Siblings
- Searched: <patterns and areas searched>
- Found and fixed: <list>
- Found, not fixed (with reason): <list>
- None found: <say it>

## Follow-ups
- <Residual risks, unverified items and why, mitigations that need a real fix, monitoring or alerts to add, upstream issues to file, owner decisions needed>
```

## Rules

- Do not claim "fixed" without the Proof section showing the repro flipped.
- Separate proven facts from inference. Mark inferences as such.
- Report what could not be verified (no CI access, no production data, tool unavailable) and why.
- Keep it concise. Do not paste long logs; quote the lines that carry the evidence.
