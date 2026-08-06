# Nested AGENTS.md

## When to nest

Add a nested `AGENTS.md` under a package or app directory when that subtree has **different**:

- Commands or test entrypoints
- Boundaries (e.g. payments never rotate keys without approval)
- Conventions or generated-code paths
- Review rules that only apply there

Do **not** nest only to repeat the root file.

## Layout

```text
repo/
  AGENTS.md                 # workspace map + shared rules + command index
  apps/web/AGENTS.md        # web-only deltas
  packages/api/AGENTS.md    # api-only deltas
```

## How agents resolve them

Behavior varies slightly by tool, but practical rules:

- Place overrides as close as possible to the code they govern.
- Prefer nested files that state **deltas** (“Use `make test-payments` instead of the root test command”).
- Assume **more specific / closer** guidance wins on conflicts; user chat still overrides everything.
- Some agents concatenate from repo root down to the working directory — put shared rules at the root and keep nested files short so the combined prompt stays small.
- Watch aggregate size; if tools truncate project docs, split rather than grow one file past soft caps.

## Root vs nested responsibilities

| Root `AGENTS.md` | Nested `AGENTS.md` |
| --- | --- |
| Package manager and workspace filters | Package-local scripts |
| Shared boundaries and invariants | Extra never/ask-first for that area |
| Index of major apps/packages | Pointers to package docs |
| Default test/lint entrypoints | Alternate runners (e.g. breeze, bazel, just) |

## Override files

Some agents also honor `AGENTS.override.md` for temporary or stricter local overrides. Prefer documenting that in team process; default committed guidance should stay in `AGENTS.md` so clones behave the same.
