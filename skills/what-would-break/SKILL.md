---
name: what-would-break
description: Post-change risk check. Lists the most likely ways a change breaks (callers, edge inputs, state, concurrency, data, deploy) and checks each one before reporting. Use when the user invokes $what-would-break, asks "what could break?", or after any non-trivial change before calling it done.
---

# What Would Break?

After a change, find how it fails before someone else does.

## Steps

1. Summarize the change in one line.
2. List the 3 to 5 most likely ways it breaks. Look at:
   - Callers and importers of anything you changed (search for them).
   - Edge inputs: empty, null, huge, unicode, negative, duplicate.
   - State: loading, error, retry, stale cache, double submit.
   - Concurrency and ordering.
   - Data: existing rows, migrations, saved formats.
   - Build, config, env, and deploy differences.
3. Check each risk with a search, a test, or a run. Mark it safe, fixed, or open.
4. Report the list with each status. Fix what you can now.

## Rules

- Name concrete risks for this change, not a generic checklist.
- An unchecked risk stays "open" in the report.
