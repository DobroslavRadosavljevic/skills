# Legacy And Fallback Patterns

Use these signals to find kill candidates. A signal alone is not proof — confirm the path still exists only for the old world, then remove it.

## Name And Comment Signals

Search (case-insensitive) for:

- `legacy`, `deprecated`, `obsolete`, `old`, `compat`, `compatibility`, `shim`, `polyfill`
- `fallback`, `backwards`, `backward compatible`, `bcw`, `migration temporary`
- `TODO remove`, `FIXME remove`, `remove after`, `delete after`, `temporary until`
- `v1` / `v2` dual modules when one is marked old
- `legacy_`, `_legacy`, `Old`, `Deprecated`, `Compat`

Also read comments that apologize for keeping two paths.

## Control-Flow Signals

- Feature flags / env vars selecting old vs new implementation
- `if (useLegacy)` / `if (!enabledNewX)` branches where new is default forever
- Dual-read: prefer new field, else old field
- Dual-write: write both stores/columns/topics “during migration”
- Catch blocks that swallow migration errors and continue on old behavior
- Default parameters or `??` / `||` that reconstruct obsolete shapes

## Structural Signals

- Parallel modules: `foo.ts` + `foo-legacy.ts`, `foo.v1.ts` + `foo.v2.ts`
- Adapter layers whose only job is old DTO ↔ new model
- Re-exports of old names “for compatibility”
- Dead polyfills for runtimes the project no longer supports
- CSS/HTML/API routes kept only for old clients
- Config keys documented as unused but still read

## Type And Data Signals

- Optional fields that exist only so old payloads type-check
- Unions that include obsolete variants nobody constructs
- Zod/schemas (or equivalent) still parsing removed fields “just in case”
- DB columns/JSON keys retained only for old readers after app cutover
- Soft-deleted code paths behind `as any` / type assertions to keep old shapes compiling

## Test And Doc Signals

- Tests named `legacy`, `compat`, `old client`, `migration bridge`
- Fixtures encoding obsolete payloads with no current producer
- Docs describing “previous behavior” as still supported without an active support window

## Not Automatically Legacy

Do not kill merely because something is old or defensive:

| Keep | Why |
| --- | --- |
| Input validation and hard errors at boundaries | Not a fallback to old behavior |
| Sensible defaults for optional *current* API fields | Current product behavior |
| Progressive enhancement that is still supported | Active capability, not a shim |
| Versioned public APIs still in support window | Real external contract |
| Rollback switches still used in production ops | Active operational control — require user confirmation |
| Vendor SDK compatibility within supported versions | Current integration requirement |

When unsure, classify as **Keep (report only)** with an exit criterion rather than guessing.
