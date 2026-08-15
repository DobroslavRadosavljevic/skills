---
name: reorganize
description: Splits oversized files and groups related code into a coherent folder tree. One concern per file; related modules sit together under domain folders; names stay descriptive. Use when the user asks to reorganize code, split a large file, untangle mixed modules, extract related files into folders, clean a messy tree, or stop unrelated logic from living in one place — not for shortening names, behavior changes, or general smell cleanup.
---

# Reorganize

Make file trees **cohesive**: related code lives together; unrelated code does
not share a file or folder; large files split into a readable tree.

Do **not** shorten names for scannability. Prefer clear, descriptive folder and
file names that match what the code owns.

Load after first steps:

- Model: [references/organization-model.md](references/organization-model.md)
- Split rules: [references/split-heuristics.md](references/split-heuristics.md)
- Before/after trees: [references/examples.md](references/examples.md)

## Scope

1. User-provided path first (package, feature, file, or subtree).
2. Current git changes if no path is given and the diff is organization-shaped.
3. Ask once if the boundary is ambiguous.

Default to **propose** (read-only split/move map). Only rewrite files when the
user says apply / migrate / implement.

## First Steps

1. Read project layout or ownership guidance if present (`AGENTS.md`,
   `CONTRIBUTING`, nested module docs, package `exports`).
2. Glob the target tree. Record large files (LOC), mixed folders, and public
   entrypoints (`package.json` exports, route files, SDK barrels already in use).
3. Load the three references above.
4. Compare against 1–2 sibling folders of similar role (optional, for local
   conventions like `public/` / `private/` trust buckets).
5. Inventory each hotspot file: export groups, section comments, types vs
   runtime vs UI vs I/O. That inventory is the split seed.

## Principles

### 1. One primary concern per file

A file owns one job: one type family, one workflow, one UI surface, one adapter.
Split when it mixes **unrelated** export groups or grows past ~250–400 LOC with
continued growth expected.

A long file that is still one concern (exhaustive mapper, generated-looking
table, single state machine) may stay. Length alone is not a defect — mixed
jobs are.

Name split pieces after what they own. Do not dump leftovers into `helpers`,
`misc`, `shared2`, or `utils.ts`.

### 2. Related code shares a parent

Put siblings that change together in the same folder (and subfolders when the
set is large). Prefer a domain tree over a flat dump of unrelated files, and
over scattering related modules across distant roots.

Gravity test: if several files import each other densely, they belong under one
parent. If they never change together and share no types, they do not.

### 3. Names stay descriptive

- Folder and file names should say the domain or aspect clearly
- Multi-word kebab-case is fine: `password-reset.ts`, `invoice-summary.ts`
- Do not rename solely to shorten
- Do not invent cryptic 2–3 letter abbreviations
- Repeating a parent in a leaf is acceptable when it disambiguates
  (`events/event-kinds.ts`) — cohesion beats brevity

### 4. Depth serves grouping, not ceremony

- Split a flat folder when it mixes domains
- Add a subfolder when a cluster has a shared identity
- Do not add empty scaffolding folders "for later"
- Do not nest `utils/helpers/lib` chains
- Respect existing trust boundaries (`public/` / `private/` / `internal/`) —
  reorganize inside them; do not flatten them away

### 5. Extract, do not rewrite behavior

Moves and splits preserve public exports, types, and call sites. New files are
mechanical extractions plus import updates — not redesigns, API changes, or
drive-by refactors.

### 6. Dependency direction

After a split, internals may import siblings; avoid new cycles. Extract shared
types/constants **first**, then leaf helpers, then workflows, then a thin
facade if a public path must remain.

Prefer a folder with a real entry file over a new barrel. Add
`index.ts` / `index.js` only when that subtree already uses barrels.

## Workflow

### Propose (default)

1. Map current tree (abbreviated). List hotspot files with LOC and mixed
   export groups.
2. Flag friction using [references/split-heuristics.md](references/split-heuristics.md).
3. Propose a target tree using
   [references/organization-model.md](references/organization-model.md) and
   [references/examples.md](references/examples.md), adapted to this archetype
   (package vs feature vs UI — do not force data-layer folder names onto UI).
4. Emit an old → new path table. For splits, list **which exports/sections**
   go to which file. Note any compatibility re-export at the old path.
5. Call out what **must not** move (applied migrations, public SDK paths,
   persisted resource IDs, framework route files, generated output) unless the
   user explicitly asks.
6. Order the apply steps so types/constants move before dependents.

### Apply (only when asked)

```text
- [ ] Extract shared types/constants first (break cycles before they start)
- [ ] Create/move/split files per the map
- [ ] Update imports, package exports, and path aliases as needed
- [ ] Keep a thin re-export at the old public path only when that import path
      is a published contract; otherwise delete the old file
- [ ] Move colocated tests with their sources; split tests to match sources
- [ ] Update nearest ownership/layout docs if paths changed
- [ ] Delete emptied leftovers
- [ ] Run the project's targeted format/lint/typecheck/tests for touched areas
```

Preserve behavior. Do not rename applied migrations or external contracts.

## Defects To Flag

- Files that mix unrelated export groups (schema + HTTP + UI + cron in one
  module)
- Files past ~250–400 LOC that keep growing **and** mix jobs
- Flat directories with many unrelated domains as siblings
- Related modules split across distant folders without a shared parent
- `utils/`, `helpers/`, `common/`, `misc/` dumping grounds
- A single `foo.ts` / `foo.service.ts` that should be a `foo/` folder of
  related pieces
- Deep trees where every segment is a vague layer name (`core/common/shared`)
- Empty or speculative folders
- Tests that still cover five source files in one blob after the source split

Do **not** flag a name for being long if it is accurate.
Do **not** flag a cohesive long file (single mapper, single protocol codec).

## Fix Rules

- Prefer split/move over rewriting logic
- Match local archetype conventions while applying cohesion rules
- Keep unrelated worktree changes untouched
- Read-only unless the user requests implementation
- One reviewable pass per cluster; do not reorganize the whole repo unasked

## Verification

Use the project's existing quality commands for touched files or packages only
(format, lint, typecheck, tests). Prefer targeted checks over full-repo gates
unless the split spans shared contracts.

If schema, migrate, or generated-path artifacts moved, run the project's usual
migration or codegen step for that surface.

## Review Output

```markdown
## Scope

[path]

## Current (abbrev)

[tree]

## Hotspots

| File | LOC | Mixed groups |
| ---- | --- | ------------ |

## Friction

1. …

## Target

[tree]

## Split / move map

| Before | After | What moves |
| ------ | ----- | ---------- |

## Apply order

1. types/constants …
2. leaves …
3. facades / import updates …

## Do not move

- …

## Compatibility

Old public path kept as re-export? yes/no — why

## Apply?

Propose only / ready to apply when asked
```

## Multi-Agent Verification

When this skill runs inside a multi-agent implementation or repair workflow,
each subagent runs only targeted checks for its assigned files/package/surface
and reports broader gate needs. The orchestrator owns the project's full quality
gate sequence and routes final-gate failures back to responsible subagents.
If no multi-agent harness is available, run the same targeted checks in chat.
