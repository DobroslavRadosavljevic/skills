# Single-Source Placement

Put shared code where the **concept** lives, at the narrowest correct boundary. Placement is the main decision; extraction is mechanical.

## Placement Ladder

Climb only as far as consumers require:

1. **Same file** — private helper when all uses are local.
2. **Sibling module in the same feature/folder** — concept is feature-owned; multiple files in that feature need it.
3. **Feature or domain package root** — multiple folders inside one feature/package need it; still not cross-package.
4. **Workspace / shared package** — two or more packages need the same concept, and it is a real shared domain (not a convenience dump).
5. **Public SDK / library surface** — only when external consumers must import it; treat as an API decision.

Never jump to (4) or (5) because a `utils` folder is convenient.

## Prefer Existing Homes

Before creating a new file or package:

| Signal | Prefer |
| --- | --- |
| Schema / validation already exists | Extend that schema module; derive types from it |
| Domain type or model already exists | Colocate helpers next to that model |
| UI primitive or compound already exists | Extend or compose it; do not fork a parallel component |
| Config / constants module already exists | Add to it if the constant belongs to the same domain |
| Package already exports a related API | Add the export there instead of a new side door |

If two homes compete, pick the one whose **name and ownership** match the concept. Move the weaker copy into it.

## Naming the Canonical Module

- Name for the domain concept: `money`, `permissions`, `invoice-status`, `parse-csv`.
- Do **not** name for role soup: `helpers`, `utils`, `shared`, `common`, `lib2`, `misc`.
- One primary concern per file. Do not open a dumping ground to absorb this dedupe.
- Match local path conventions (folder nouns, short leaf names) without renaming the wider tree.

## Monorepo Rules

- Shared package only when ≥2 packages need the same concept **and** the concept is stable.
- Prefer depending downward into a lower-level domain package over creating a new `packages/shared`.
- Do not create circular package deps to “share” something; rethink ownership instead.
- Keep app-specific UI/copy out of domain packages.

## UI Deduping

- Same product concept + same behavior → one component or recipe.
- Same visual shape, different meaning → leave separate (or share only tokens/primitives).
- Prefer composition (`children` / slots / small primitives) over a mega-component with mode flags.
- Do not merge screens that happen to use similar layout chrome.

## Types, Schemas, Constants

- One runtime source of truth when possible (schema, const object, enum). Derive types from it.
- Kill parallel interfaces that describe the same shape under different names unless a boundary adapter is required.
- Boundary adapters (DTO ↔ domain) are allowed; duplicate domain models are not.

## Tests

- Shared fixture/factory only when it encodes shared domain setup.
- Do not force unrelated suites onto one mega-fixture.
- Prefer importing the production SSoT in tests over re-declaring the same constants/types.

## Anti-Homes

Reject these as the default destination unless the repo already uses them coherently for this exact concept:

- Top-level `utils/`, `helpers/`, `common/`, `shared/`, `lib/`
- Catch-all `hooks/useSomethingGeneric.ts` with unrelated concerns
- Barrel `index.ts` files created only to re-export the new helper
- Cross-feature “god” modules that know every domain

If the only available shared bucket is a dump, create a **named concept module** beside the real owner instead of growing the dump.
