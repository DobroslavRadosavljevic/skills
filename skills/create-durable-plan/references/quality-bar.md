# Plan Quality Bar

A pack fails if another agent still has to invent scope, paths, sequence, contracts, or stop rules.

## Must pass

- **Closed-world execute:** `EXECUTION.md` + `STATUS.md` + `PLAN.md` + `CONTRACT.md` are enough to start. Chat is optional.
- **Graph, not a list of titles:** every phase has id, kind, deps, lane, done-when, stop-if.
- **File recipes:** every create/modify/delete names a path and a patch intent. Directories-only is a fail.
- **Current vs target:** today's behavior cited from files; target names new types/routes/files.
- **Contracts:** public shapes, invariants, and phase seams are in `CONTRACT.md`, not implied.
- **Evidence:** `TRACE.md` has facts with paths/URLs; inferences labeled; unknowns have defaults.
- **Resources:** internal paths **and** external URLs with version/date and takeaway.
- **Verification matrix:** every success criterion maps to a command or named test case.
- **Boundaries:** do-not-touch, non-goals, rejected alternatives, blast radius.
- **Stop rules:** drift, missing decision, contract break, extra-scope edits.
- **No secrets. No invented files/APIs/commands.**

## Depth by default

Write more specific than a ticket or a design doc:

- Numbered steps with paths.
- Patch recipes: add / change / remove / do-not-edit, plus the canonical sibling to copy.
- Data: fields, nullability, identity, invariants, migrations.
- UI: routes, states (empty, loading, error, permission), copy if user-facing.
- Failures: retries, authz, tenancy, partial success, rollback.
- Tests: file path, cases, fixtures. "Add tests" is a fail.
- Commands copied from the repo's real package manager and scripts.

If a step could land in three files, **name the file**. If a library has two APIs, **name the one to use and why**, with a doc URL.

## Self-audit (run before delivery)

- [ ] Five required files exist and have no leftover `<placeholders>` or `TODO`.
- [ ] Phase IDs in `PLAN.md`, `STATUS.md`, and `phases/` match.
- [ ] File map ∪ phase recipes cover the same paths; no orphan "important" files.
- [ ] Every `modify` path was opened during research (listed in `TRACE.md`).
- [ ] Every `create` path has a parent that exists or is also created earlier.
- [ ] Every success criterion appears in the verification matrix.
- [ ] Parallel lanes have disjoint file maps and a CONTRACT seam.
- [ ] Discover phases have questions, inspect list, and an artifact — not vibes.
- [ ] Verify commands match package.json / Makefile / CI (or explicitly new).
- [ ] Do-not-touch includes generated dirs, vendor, and unrelated apps in a monorepo.
- [ ] Spike plans name the decision and stop artifact.
- [ ] Related/supersedes links are set if other packs exist.
- [ ] `EXECUTION.md` load order matches the files actually written.
- [ ] No secrets.

If any box fails, fix the pack before the user-facing "ready" message.

## Fail the bar if

- Phases are titles (`P01 Backend`).
- "Update the API" / "wire it up" / "follow existing patterns" with no path.
- Resources are "see the docs" with no URL.
- Tests are unnamed.
- The next agent must re-ask the original user for the mission.
- `CONTRACT.md` is a stub while new types or routes are in the file map.
- `TRACE.md` is empty or only restates the user prompt.
- Implementation is mixed into the planning session.

## Size

Long and specific beats short and vague. Split phase **bodies** using pack rules; never split by deleting required files.
