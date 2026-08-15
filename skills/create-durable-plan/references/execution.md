# EXECUTION.md Template

Write this file into every pack (customize the load list and stop rules to **this** mission). Implementing agents follow it. Planning agents do not execute product work.

```markdown
# Execution: <mission title>

## Role

You are implementing this pack, not redesigning it. Chat history is not authority.

## Load order (mandatory)

1. This file
2. `STATUS.md` — where we are
3. `PLAN.md` — graph, file map, verification matrix, phase index
4. `CONTRACT.md` — invariants and seams
5. The current phase body (`PLAN.md` inline or `phases/Pxx-*.md`)
6. `TRACE.md` only if a recipe looks wrong or the repo disagrees
7. `REVISIONS.md` if STATUS points at a revision

Do not skim past CONTRACT.

## Allowed writes while executing

- Product/test/docs files named in the current phase recipes (and earlier seams you are completing)
- `STATUS.md` after every phase, on block, and after verify
- `TRACE.md` only to add newly discovered **facts** (append). Do not delete facts.
- `PLAN.md` / `CONTRACT.md` only if the user asked to amend, then add `REVISIONS.md`

Do not edit other plan packs. Do not drive-by format the repo.

## Loop

1. Read STATUS. If `done` or `abandoned`, stop. If `blocked` or `needs-amendment`, do not code; report.
2. Take the next atomic action named in STATUS, which must be the next incomplete phase on the critical path (or an unlocked disjoint lane).
3. Re-read that phase's recipes and CONTRACT seam.
4. Apply **only** those file recipes.
5. Run that phase's verify commands.
6. Update STATUS (phase state, verify table, log, next atomic action).
7. Repeat.

Optional todo lists or plan-mode UIs are helpers. STATUS remains the portable progress file.

## Parallel lanes

Only if `PLAN.md` says so. Never start a lane whose depends-on phase is not `done`. Never touch another lane's files.

## Stop conditions (immediate)

Stop and set STATUS `blocked` or `needs-amendment` when:

- A named path does not exist and was not scheduled as `create`
- A named symbol/API disagrees with the live code
- A recipe requires a do-not-touch path
- Verify fails for reasons outside this phase and cannot be fixed inside the recipes
- A user decision (Q#) has no default and blocks progress
- The work wants a new public field/endpoint/flag not in CONTRACT
- Dirty unrelated user changes would be overwritten

Report the stop rule, the path, and the next human/agent action. Do not invent a side design.

## Drift protocol

Repo wins over PLAN. On drift:

1. Do not "adapt" across packages.
2. Write the mismatch in STATUS **Drift**.
3. Set `needs-amendment`.
4. Ask to amend the pack, then continue.

## Done rules

- A phase is done only if its done-when checklist and verification-matrix rows pass.
- The pack is done only if STATE=done, all phases done, and remaining matrix rows pass or are explicitly waived in STATUS with a reason.
- Do not commit or open a PR unless the user asks.

## Secrets

Never write secret values into plan files or logs. Env names only.
```
