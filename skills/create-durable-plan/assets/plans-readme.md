# Plans

Durable **plan packs** for coding agents. Chat is not the source of truth. Each subdirectory is one mission.

## Layout

```text
plans/
  README.md
  YYYY-MM-DD-short-slug/
    PLAN.md          # mission, graph, file map, phase index, verification matrix
    STATUS.md        # progress (authoritative for where we are)
    TRACE.md         # evidence: facts vs inferences
    CONTRACT.md      # types, APIs, invariants, seams
    EXECUTION.md     # load order, stop conditions, drift
    phases/          # optional split phase bodies
```

Do not put secrets, tokens, or credential values in these files. Environment variable names are fine.

## Authority

| File | Trust it for |
| --- | --- |
| `EXECUTION.md` | How to work and when to stop |
| `STATUS.md` | Current phase and blockers |
| `PLAN.md` | What to do, order, files, verify |
| `CONTRACT.md` | Shapes and invariants |
| `TRACE.md` | Why; not a task list |
| Live repo | Wins on drift — stop and amend; do not freelance |

## For implementing agents

1. Open the named folder.
2. Follow `EXECUTION.md` load order. Do not skip `CONTRACT.md`.
3. Execute **one** incomplete phase at a time (or an unlocked disjoint lane named in `PLAN.md`).
4. Apply file recipes only. Do not expand blast radius.
5. Run that phase's verify commands. Update `STATUS.md`.
6. On drift or missing files, stop (`blocked` / `needs-amendment`). Do not rewrite the plan unless asked.

## For planning agents

- If `plans/` is missing, create this README and the directory from scratch.
- New packs use the full required file set above.
- Never overwrite another folder without an explicit user choice.
- Never delete other packs to tidy up.
- Prefer a new dated slug over silently rewriting a finished plan. Use `Supersedes` links.

## For humans

- Commit these files so later sessions can resume.
- Keep finished packs as history.
- Concurrent in-progress packs that share files will collide — finish or pause one.

## Index

| Date | Folder | Kind | State | Mission |
| --- | --- | --- | --- | --- |
