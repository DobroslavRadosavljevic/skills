# Checklists (TanStack Start architecture)

## Scaffold a page

```text
Page scaffold:
- [ ] routes/…/<segment>/index.tsx created (not a flat leaf)
- [ ] Page UI under -components/
- [ ] Page-only hooks under -hooks/ (if any)
- [ ] Page-only helpers under -lib/ (if any)
- [ ] No unprefixed non-route files under routes/
- [ ] Layout membership correct (_pathless vs URL segment)
```

## Scaffold / grow a module

```text
Module scaffold:
- [ ] Reuse gate satisfied (2+ consumers or clear shared client)
- [ ] modules/<feature>/… with concrete files (no empty barrels)
- [ ] No imports from src/routes
- [ ] Routes updated to import the module path
- [ ] Duplicate route-local copies removed after promote
```

## Add UI to an existing route

```text
Apply:
- [ ] Belongs only to this route? → -components / -hooks / -lib
- [ ] Used by 2+ routes already? → modules/<feature>/
- [ ] App-wide primitive? → src/components/
- [ ] Non-feature infra? → src/lib/
```

## Review / reorganize

```text
Layout review:
- [ ] Tree matches references/tree.md
- [ ] No accidental routes from unprefixed files
- [ ] Modules do not import routes
- [ ] No unnecessary barrels
- [ ] Propose move map before rewriting paths
- [ ] If Effect / generated client in repo → matching extension checklist
```

## Done criteria

- URL structure is obvious from `routes/`.
- Private page code is clearly ignored by the router (`-` prefix).
- Shared feature code has a single home under `modules/`.
- No second parallel layout introduced “just for this PR.”
