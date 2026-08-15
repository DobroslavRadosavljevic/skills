# `plans/` Layout

Repo-root durable plan packs live here. This skill **creates the tree from scratch** when it is missing.

## Target tree

```text
<repo-root>/
  plans/
    README.md
    <YYYY-MM-DD>-<slug>/
      PLAN.md
      STATUS.md
      TRACE.md
      CONTRACT.md
      EXECUTION.md
      phases/                 # optional
        P00-<slug>.md
      REVISIONS.md            # only when the plan is amended after create
```

Never use `docs/plans/`, `.cursor/plans/`, or a package-local `plans/` unless the user names a different root.

## Bootstrap (folder missing)

Do all of this in one pass:

1. Create repo-root `plans/`.
2. Copy `assets/plans-readme.md` → `plans/README.md`. Fill a repo name in the index caption if known; do not invent product copy.
3. Scan root `.gitignore` and nested ignore files that apply for `plans`, `/plans`, `plans/`, `plans/**`.
   - If ignored: stop. Report the rule. Ask to un-ignore or confirm local-only.
   - If not ignored: continue. **Never** add `plans/` to gitignore.
4. If root `AGENTS.md` exists, add a `plans/` pointer if missing. Do not create `AGENTS.md`.
5. Then create the first plan pack subdirectory.

## Bootstrap (folder exists, incomplete)

| Finding | Action |
| --- | --- |
| `plans/` exists, `README.md` missing | Add `README.md` from `assets/plans-readme.md` |
| `README.md` exists and looks custom | Leave body; add an **Index** table at the end if missing; append a row for the new pack |
| Old packs with only `PLAN.md` + `STATUS.md` | Leave them. New packs use the full required set |
| Stray files | Leave them. Do not tidy |
| Dirs that do not match `YYYY-MM-DD-slug` | Leave them. New packs still use dated slugs |

## Naming

- Directory: `YYYY-MM-DD-kebab-slug`
- Date: user's local calendar date
- Slug: lowercase letters, digits, hyphens; ~3–8 words
- Collision: never overwrite; ask; `-2` is acceptable
- Supersede: new dated directory; bidirectional path links in both `PLAN.md` metadata blocks

## Allowed writes (planning session)

- `plans/README.md` (create or index-row append)
- `plans/<dir>/PLAN.md`
- `plans/<dir>/STATUS.md`
- `plans/<dir>/TRACE.md`
- `plans/<dir>/CONTRACT.md`
- `plans/<dir>/EXECUTION.md`
- `plans/<dir>/phases/Pxx-*.md` when split
- `plans/<dir>/REVISIONS.md` only when amending an existing pack the user asked to update
- optional pointer in **existing** root `AGENTS.md`

Nothing else.

## Related packs

Before writing, list other `plans/*` dirs whose titles or file maps overlap. In `PLAN.md` metadata set `Related` and/or `Supersedes`. If overlap is high, ask once.
