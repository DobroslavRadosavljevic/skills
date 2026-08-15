# Split Heuristics

How to decide **what** to extract, **where** it goes, and **in what order**.
Use with [organization-model.md](organization-model.md) and
[examples.md](examples.md).

## Inventory a hotspot file

Read the file as a table of **export groups**, not as prose.

For each export or section record:

| Field | Ask |
| --- | --- |
| Name | What is this called today? |
| Job | Type, schema, UI, HTTP, job, mapping, error, constant, test helper? |
| Domain | Billing? Auth? Orders? Cross-cutting? |
| Callers | Who imports it (same file, same folder, distant)? |
| Change cadence | Does it change with the section above it, or independently? |

Split along **job × domain** boundaries. Keep sections that always change
together in the same file even if the file is long.

## Split signals (do it)

- Two or more unrelated domains in one file (`invoices` + `auth` + `email`)
- Two or more I/O kinds mixed (`fetch` + `sql` + `react` + `cron`)
- Types/schemas used by many files but buried in a UI or handler file
- A `*Service` / `*Manager` / `*Helper` class or object whose methods are
  independent workflows
- New features keep appending to the same file
- Tests for the file are themselves a god file covering unrelated groups
- Import graph shows a cluster of functions that only talk to each other —
  they want a subfolder
- The file name is a grab bag: `utils`, `helpers`, `misc`, `shared`, `common`,
  `lib`, `index` (when not an established barrel)

## Hold signals (do not split)

- One exhaustive mapping / codec / switch that is the whole job
- Generated or codegen-owned files
- A small cohesive module (~under 150–200 LOC, one domain, one job)
- A 20-line helper used once; inline or keep colocated
- Framework-mandated single files (some route modules, config entrypoints) —
  extract **out of** them, do not rename them
- Splitting would require rewriting control flow or inventing new abstractions

## Where the pieces go

1. **Same folder, new files** — default when the parent already is the domain.
2. **New subfolder** — when the split produces 3+ files with a shared identity,
   or when a second split is already visible.
3. **Move to an existing sibling domain** — when the inventory shows the code
   was in the wrong house (feature envy).
4. **Do not create `shared/`** — put the code under the domain that owns the
   contract. If two domains need it, the owner is the one that would break if
   the type changed.

## Apply order (avoids cycles)

1. Types, constants, error classes, schemas (no runtime dependents yet).
2. Pure leaves (mappers, formatters, predicates).
3. Workflows / use-cases that import those leaves.
4. Adapters (HTTP, DB, queue, UI) that import workflows.
5. Thin facade or re-export at the **old public path** if that path is a
   contract.
6. Tests, matching the new file names.
7. Delete the emptied original (unless step 5 kept it as a re-export).

If a cycle appears, extract the shared type or constant that both sides need
into a third file. Do not add a barrel to hide the cycle.

## Public path compatibility

| Situation | Action |
| --- | --- |
| App-internal import, all callers in this change | Update imports; delete old file |
| Many internal callers, one pass | Update all callers in scope; no shim |
| Published `exports` / documented import | Keep old path as `export * from './new-place'` or a one-line re-export |
| Framework route filename | Keep the file; it only re-exports or composes extracted modules |

Shims are temporary contracts, not a new dumping ground. Do not put logic in
the re-export file.

## Tests

- Colocated `foo.test.ts` moves with `foo.ts`
- If `foo.ts` splits into `create.ts` + `list.ts`, split the test file the
  same way
- Shared fixtures used by one domain go in that domain (`invoices/fixtures.ts`)
- Do not leave a `foo.test.ts` that imports five new files and asserts
  unrelated groups

## Import style after split

- Deep imports to the new files (`./invoices/create`) unless barrels already
  exist in that subtree
- No new `index.ts` "for convenience"
- Path aliases (`@/…`) follow existing project rules; do not invent a new alias
  per folder
- Side-effect imports (CSS, register plugins) stay on the module that must load
  them — usually the facade or route file

## False friends

| Looks like a defect | Often is not |
| --- | --- |
| 500-line exhaustive event mapper | One concern; split only if domains diverge |
| Long generated types file | Codegen owner; do not hand-split |
| `types.ts` next to `create.ts` | Colocation, not a dump |
| Multi-word file name | Descriptive; keep it |
| Route file that re-exports a folder | Correct facade |
| Duplicate-looking folder names in two packages | Different ownership; do not merge across packages |

## Pass size

Reorganize one cluster per pass (one domain folder, or one god file and its
tests). A propose map may show the full target tree; apply should still be
reviewable. Do not mix formatting, logic refactors, or dependency upgrades into
the same pass.
