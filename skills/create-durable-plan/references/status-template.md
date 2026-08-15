# STATUS.md Template

Authoritative for **progress**. Keep short. Implementing agents update it; the planning agent initializes it.

```markdown
# Status: <mission title>

- **Plan:** `PLAN.md`
- **State:** not-started | in-progress | blocked | verifying | done | abandoned | needs-amendment
- **Current phase:** P0x <name> | —
- **Lanes:** main=P0x <other=…>
- **Last updated:** <YYYY-MM-DD>
- **Blocked on:** none | <concrete blocker + which stop rule>
- **Revision:** none | `REVISIONS.md` #<n>

## Machine

Allowed transitions:

- not-started → in-progress
- in-progress → blocked | verifying | needs-amendment | abandoned
- verifying → done | in-progress (failed verify) | blocked
- blocked → in-progress | needs-amendment | abandoned
- needs-amendment → in-progress (after user-approved PLAN/CONTRACT edit)
- abandoned and done are terminal unless the user reopens

Do not mark a phase done if its verification-matrix rows are unrun or failing.

## Phase progress

| ID | Name | Lane | State | Evidence |
| --- | --- | --- | --- | --- |
| P00 | | main | not-started \| done \| blocked | <command, path, or —> |

## Next atomic action

<One sentence. The next agent does this first. Must be a PLAN step, not a new idea.>

## Drift

- <none | path/claim in PLAN that disagrees with the live repo, with evidence>

## Verify last run

| ID | Ran? | Result | Notes |
| --- | --- | --- | --- |
| V1 | no | | |

## Log

- <YYYY-MM-DD> — pack created; not-started.

## Notes for the next agent

- <Execution discoveries. If the plan is wrong, say so here and set needs-amendment. Do not silently rewrite PLAN.md.>
```

On create: `State: not-started`, all phases `not-started`, verify rows `no`, log `pack created`.
