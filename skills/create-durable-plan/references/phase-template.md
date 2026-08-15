# Phase Template

Use this field set for every phase. Inline in `PLAN.md` or as `phases/Pxx-<slug>.md`.

```markdown
# P0x — <name>

- **Kind:** discover | implement | migrate | verify | cleanup
- **Lane:** main | <name>
- **Depends on:** — | P0y (done + its seam in CONTRACT)
- **Unlocks:** P0z
- **Blast radius:** <paths / packages>
- **Objective:** <one paragraph, testable>

## Prerequisites

- Previous phase seams:
- User action (if any):
- Feature flag / env **names**:

## Stop if

- Live repo disagrees with the recipes below
- Would require editing a do-not-touch path
- Would expand into a different package/app
- Missing a user decision listed as Q# without a default

## File recipes

| Path | Action | Patch intent (add / change / remove / do-not-edit) | Canonical sibling |
| --- | --- | --- | --- |
| `<path>` | create/modify/delete | | `<path>` or — |

### `<path>`

- **Exists today:** <symbols / current behavior> (or "will be created")
- **Change:** numbered edits, including export names, signatures, UI states, schema fields
- **Do not:** unrelated refactors in this file
- **Snippet (only if the contract is ambiguous):** fenced code of the new signature or schema, not the whole file

Repeat for each path. "See architecture section" is not a recipe.

## Discover protocol (only if kind = discover)

- Questions:
- Inspect: paths, commands, URLs
- Artifact: update `TRACE.md` facts; write go/no-go in `STATUS.md`
- Exit: implement phases may start only if <condition>

## Invariants to preserve this phase

- Point at `CONTRACT.md` items. Call out any temporary dual-write.

## Tests

| File | Action | Cases |
| --- | --- | --- |
| `<path>` | create/modify | |

## Verify

1. `<exact repo command>`
2. <manual check only if no test can exist yet, with exact UI path>

Must cover this phase's rows in the verification matrix.

## Rollback / undo

- Git-level: revert this phase's paths only.
- Data: <none | migrate down | manual>
- Flags: <off means>

## Done when

- [ ] Every file recipe applied
- [ ] Tests above exist and pass (or named skip with reason)
- [ ] Verify commands run; results noted in `STATUS.md`
- [ ] CONTRACT seam for this phase exists
- [ ] No extra files touched

## Phase resources

- `<path or URL>` — <takeaway>
```

`P00` must still be executable. Do not emit a phase whose only step is "start working".
