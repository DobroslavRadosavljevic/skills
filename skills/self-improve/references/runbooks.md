# Runbook Conventions

A runbook lets a new agent finish a recurring flow without finding it out again. It covers the steps, the decisions, the checks, and the way back.

## File Rules

- Path: `runbooks/<slug>.md`, kebab-case, one flow per file.
- Frontmatter has exactly these fields:
  - `name`: matches the filename.
  - `description`: one line on what the flow does and when to use it.
  - `last-verified`: `YYYY-MM-DD`.
- Use the sections in `runbooks/README.md` (copied from [../assets/runbooks-readme.md](../assets/runbooks-readme.md)).
- Add every runbook to the index in `runbooks/README.md`: `- [Title](slug.md) — purpose`, sorted by name.

## Writing

- Write for an agent that has never seen the repo. Use exact commands, exact paths, and expected output.
- Write script paths relative to the repo root. `scripts/check-runbooks.ts` checks that they exist.
- Put mechanical steps in scripts and call them. Keep in the runbook the judgment, decision points, and checks between steps.
- Give each step that can fail its expected result and what to do if the result differs.
- Name env vars and where to get secrets. Never write secret values.
- Mark irreversible steps clearly, and put the safeguard (backup, dry run, confirmation) before them.
- Link related runbooks instead of copying their steps.
- Keep it short. If a runbook covers two flows, split it into two files.

## Last-Verified Date

- Set `last-verified` to today only after the flow was really run end to end, or after each step was checked against the current code and config.
- During setup, if you could not run a flow safely, still check each step against the code and set the date. Then note "steps verified against code, not run" in the report.

## Re-Run Audit

On a re-run of this skill:

- Flag runbooks whose `last-verified` is old compared to recent changes in the files they touch.
- Fix broken script references. The checker reports them.
- Merge runbooks that overlap, and remove runbooks for flows that no longer exist. Ask the user first.
