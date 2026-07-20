---
name: simplify-layout
description: Shortens file and folder names and groups related code so paths stay scannable. Folder context carries the noun; leaf files stay short verbs or aspects; related modules sit together. Use when the user asks to simplify names, improve grouping, clean a file tree, shorten paths, reorganize related modules, or make a package or feature layout easier to scan — not for broad boundary or scalability migrations, or general smell cleanup (use unsmell).
---

# Simplify Layout

Make file trees **short-named** and **well-grouped**: folder context carries the
noun; leaf files stay short verbs/aspects; related code sits together.

Canonical shape: [references/layout-model.md](references/layout-model.md).

## Scope

1. User-provided path first (package, feature, or subtree).
2. Current git changes if no path is given and the diff is layout-shaped.
3. Ask once if the boundary is ambiguous.

Default to **propose** (read-only rename/group map). Only rewrite paths when the
user says apply / migrate / implement.

## First Steps

1. Read project naming or layout guidance if present (`AGENTS.md`, `CONTRIBUTING`,
   nested ownership docs, design-system docs).
2. Glob the target tree; sketch an abbreviated current layout.
3. Load the layout model: [references/layout-model.md](references/layout-model.md).
4. Compare against 1–2 sibling folders of similar role (optional, for local
   conventions like `public/` / `private/` trust buckets).

## Principles

### 1. Path context replaces filename prefixes

Do not repeat the parent folder (or package) in the leaf name.

| Avoid | Prefer |
| --- | --- |
| `queries/user-profile-query.ts` | `queries/users/profile.ts` |
| `auth/auth-token-helper.ts` | `auth/token.ts` |
| `rows/events/event-row-mapper.ts` | `rows/events/map.ts` |
| `billing-invoice-summary.ts` under `packages/billing` | `invoices/summary.ts` |

### 2. Folder = noun / domain; file = aspect / operation

- Domain folders: `users/`, `billing/`, `auth/`, `orders/`, `seed/`
- Leaf files: `card.ts`, `detail.ts`, `overview.ts`, `create.ts`, `sync.ts`, `map.ts`
- Stable role folders when the archetype needs them: `queries/`, `services/`,
  `components/`, `hooks/`, `errors/`, `utils/` — keep those short too

### 3. Group related code under one parent

Put siblings that change together in the same folder. Prefer:

```text
queries/
  users/profile.ts
  users/list.ts
  orders/detail.ts
  orders/overview.ts
  billing/invoice.ts
```

Over a flat dump of `users-profile.ts`, `orders-detail.ts`, `billing-invoice.ts`
at one level, or scattering related modules across unrelated roots.

### 4. Short names; spell out only when ambiguous

- Prefer one word when clear: `day`, `stamp`, `lookup`, `list`, `card`
- Use kebab-case multi-word only when needed: `dimension-filters.ts`,
  `currency-fraction-digits.ts`
- Do not invent cryptic 2–3 letter abbreviations that need a glossary
- Service or package **folder** identities may stay longer
  (`analytics-traffic-read`) when they are the public domain name; files inside
  stay short (`service.ts`, `errors/…`)

### 5. Depth serves grouping, not ceremony

- Split a flat folder when it mixes domains or names start carrying prefixes
- Do not add empty scaffolding folders "for later"
- Do not nest `utils/helpers/lib` chains; one private helper bucket is enough
- Respect existing trust boundaries (`public/` / `private/` / `internal/`) —
  shorten names inside them; do not flatten them away

### 6. One primary concern per file

Split when a file mixes unrelated export groups or grows past ~250–400 LOC with
continued growth expected. Name the split pieces by aspect, not by
`helpers` / `misc` / `shared2`.

## Workflow

### Propose (default)

1. Map current tree (abbreviated).
2. Flag friction: long names, repeated path segments, mixed domains, scattered
   siblings, god files, useless nesting.
3. Propose a target tree using the layout model adapted to this archetype
   (package vs feature vs UI — do not force data-layer folder names onto UI).
4. Emit an old → new path table for every rename/move.
5. Call out what **must not** rename (migrations on disk, public SDK paths,
   persisted resource IDs, API routes) unless the user explicitly asks.

### Apply (only when asked)

```text
- [ ] Create/move/rename files per the map
- [ ] Update imports, package exports, and path aliases as needed
- [ ] Move colocated tests with their sources
- [ ] Update nearest ownership/layout docs if paths changed
- [ ] Delete emptied leftovers
- [ ] Run the project's targeted format/lint/typecheck/tests for touched areas
```

Preserve behavior. No barrels (`index.ts` / `index.js`) unless that subtree
already uses them. Do not rename applied migrations or external contracts.

## Defects To Flag

- Leaf names that restate parent folders (`…/events/event-*.ts`)
- Package or brand restated in paths inside the owning package
  (`acme-*` under `packages/acme`)
- Flat directories with many prefix-disambiguated files (`foo-bar-baz.ts` siblings)
- Related modules split across distant folders without a shared parent
- `utils/`, `helpers/`, `common/`, `misc/` dumping grounds
- `something.service.ts` collapsing a service folder (prefer
  `something/service.ts` when that is the local service shape)
- Deep trees where every segment is a vague layer name

## Fix Rules

- Prefer rename/move over rewriting logic
- Match local archetype conventions (feature trust buckets, UI primitives) while
  applying short-name + grouping rules
- Keep unrelated worktree changes untouched
- Read-only unless the user requests implementation

## Verification

Use the project's existing quality commands for touched files or packages only
(format, lint, typecheck, tests). Prefer targeted checks over full-repo gates
unless the rename spans shared contracts.

If schema, migrate, or generated-path artifacts moved, run the project's usual
migration or codegen step for that surface.

## Review Output

```markdown
## Scope

[path]

## Current (abbrev)

[tree]

## Friction

1. …

## Target

[tree]

## Rename map

| Before | After |
| ------ | ----- |

## Do not rename

- …

## Apply?

Propose only / ready to apply when asked
```

## Related Skills

| Skill | Use when |
| --- | --- |
| `unsmell` | Maintainability beyond naming/grouping (duplication, complexity, types) |

## Multi-Agent Verification

When this skill runs inside a multi-agent implementation or repair workflow,
each subagent runs only targeted checks for its assigned files/package/surface
and reports broader gate needs. The orchestrator owns the project's full quality
gate sequence and routes final-gate failures back to responsible subagents.
If no multi-agent harness is available, run the same targeted checks in chat.
