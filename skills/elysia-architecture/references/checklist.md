# Checklists (Elysia architecture)

## Scaffold a feature module

Copy and track:

```text
Feature scaffold:
- [ ] modules/<feature>/ created
- [ ] routes/index.ts mount table
- [ ] routes/<action>.ts for each endpoint (one plugin each)
- [ ] schema/ files for body/response/query/params as needed
- [ ] domain/services module(s) for business rules
- [ ] Feature mounted from app entry (or parent mount table)
- [ ] No HTTP helpers in utils/
- [ ] If Effect in repo → also with-effect.md checklist
```

## Add an endpoint

```text
New endpoint:
- [ ] Correct feature folder (existing or new)
- [ ] New routes/<action>.ts (avoid stuffing unrelated verbs into an existing file)
- [ ] Schemas under schema/; wired on the route
- [ ] Handler thin; domain call extracted
- [ ] Failures mapped at edge to status + small body
- [ ] Mounted in routes/index.ts
```

## Review / reorganize

```text
Layout review:
- [ ] Tree matches references/tree.md
- [ ] Mount tables have no handlers
- [ ] No route factories / *-http utils
- [ ] No route→route or service→route imports
- [ ] Names short; no repeated parent noun in leaves
- [ ] Propose move map before rewriting paths
```

## Done criteria

- New HTTP code sits under `modules/<feature>/…` in the canonical roles.
- A stranger can find “the create endpoint” by path alone.
- No second parallel layout introduced “just for this PR.”
