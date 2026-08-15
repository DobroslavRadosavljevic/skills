# Plan Pack Rules

## Required files

Every new pack includes all five. Empty section ≠ missing file.

| File | Authority | If it disagrees |
| --- | --- | --- |
| `EXECUTION.md` | How to work, when to stop | Stop; do not improvise process |
| `STATUS.md` | Where we are | Trust STATUS over chat; if STATUS contradicts git, stop |
| `PLAN.md` | What to do and in what order | STATUS may not skip PLAN steps |
| `CONTRACT.md` | Invariants and seams | Code that violates CONTRACT is not done |
| `TRACE.md` | Why we believe the plan | Use when a claim looks stale; do not execute from TRACE |

## Split phases onto disk when any is true

- More than **four** implementation phases, or
- Any phase has **more than ~12 file recipes**, or
- Two or more **parallel lanes**, or
- `PLAN.md` phase bodies would drown the graph and verification matrix.

When split:

- Create `phases/P00-<short-slug>.md` … matching phase IDs in `PLAN.md`.
- `PLAN.md` keeps a complete **index** (id, name, kind, deps, lane, files count, verify one-liner, link).
- Phase bodies live only in `phases/` (do not duplicate full recipes in `PLAN.md`).
- Use [phase-template.md](phase-template.md) for each file.

When not split: put full phase bodies in `PLAN.md` using the same template fields. Do not create an empty `phases/` directory.

## Phase IDs

- `P00`, `P01`, … zero-padded two digits.
- `P00` is usually discover/prep or the first implement slice — never a fake "setup" with no files.
- Last phase is usually **verify / docs / leftover cleanup** with a repo-real command list.
- Kind per phase: `discover` | `implement` | `migrate` | `verify` | `cleanup`.
- A `discover` phase must name the questions, the files/commands to inspect, and the artifact it writes (usually an update to `TRACE.md` + a go/no-go in `STATUS.md`). It must not be "look around".

## Lanes

- Default: one lane `main`, strictly ordered.
- Extra lanes only if file maps are disjoint and `CONTRACT.md` defines the shared seam (types, flags, fixtures).
- Name lanes after ownership (`api`, `web`, `worker`), not people.
- `STATUS.md` tracks each lane's current phase.
- Critical path: the longest dependency chain; say it in `PLAN.md`.

## Amendments after create

Do not silently rewrite history.

- User asked to change the plan: append `REVISIONS.md` (date, reason, files touched, what executing agents must do differently). Update `PLAN.md` / `CONTRACT.md` in place **and** point STATUS at the revision.
- Executing agent found drift: stop, record in `STATUS.md`, do not rewrite `PLAN.md` unless the user asks to amend.

## What not to add

- Per-file source dumps of the whole repo.
- Chat transcripts.
- Secrets.
- Duplicate copies of `EXECUTION.md` process in every phase (link it once).
