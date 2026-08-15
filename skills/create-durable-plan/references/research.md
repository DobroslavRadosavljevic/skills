# Evidence Gathering

The pack is only as true as `TRACE.md`. Implementation steps that name files you did not open are a failed plan.

## Read-only

Until the pack is written: read, search, inspect. No product edits, installs, migrations, commits, or formatters-as-writes.

Inspection commands that only print state are allowed (`git status`, test --help, package scripts list). Commands that write lockfiles, generate code, or start servers that mutate data are not.

## Internal map (do this)

1. Root agent/docs files if present (`AGENTS.md`, `README.md`, architecture notes) — constraints only, do not clone them into the plan.
2. Manifests, workspace layout, CI, real scripts for lint/typecheck/test/build.
3. For each suspected touch area: entrypoints, public types, schemas, routes, UI, workers, tests, generated output.
4. Follow **callers and callees** far enough to name blast radius. One-file plans for cross-cutting behavior are a fail.
5. Identify the **canonical sibling** to copy (existing module that already does the closest thing).
6. Note dead, deprecated, or dual paths so the plan does not extend the wrong one.

Record in `TRACE.md`: path, what was checked, fact extracted.

## External docs (do this when the plan depends on a library, API, CLI, protocol, or cloud product)

1. Prefer configured documentation tools when available; otherwise official docs URLs.
2. Resolve the current major version the **repo actually uses** (lockfile / manifest), not the latest you remember.
3. Capture: title, URL, version or retrieved date, exact takeaway the plan relies on.
4. Do not cite blogs or memory as the contract for APIs.

If docs cannot be fetched, mark confidence `low` for that area and either (a) add a discover phase whose first step is to read those docs, or (b) ask the user.

## Facts vs inferences vs unknowns

| Kind | Write as | Allowed in steps? |
| --- | --- | --- |
| Fact | path/URL + quote or paraphrase | Yes |
| Inference | "because facts A,B →" | Yes, labeled |
| Unknown | question + default + absorbing phase | Only as discover steps or assumed defaults the user accepted |

Never promote an unknown to a file recipe.

## Confidence gate (must pass before writing recipes)

For every phase that is `implement` or `migrate`:

- Named files exist (or are explicitly **create**).
- Named symbols exist or are specified as new in `CONTRACT.md`.
- At least one verify command is repo-real or a new test file is specified with cases.
- Blast radius includes tests and callers, not only the happy-path file.

If a phase fails the gate, convert it to `discover` with an investigation protocol, or ask the user. Do not fill the gap with "follow existing patterns".

## Related plans

Search `plans/` for overlapping slugs, file maps, or missions. Link them. If a live pack is in-progress on the same files, warn: concurrent execution will collide.
