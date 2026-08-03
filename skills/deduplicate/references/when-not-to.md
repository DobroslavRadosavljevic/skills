# When Not To Deduplicate

Leaving copies is correct when merging them would hide different meanings, force awkward APIs, or create a false abstraction.

## Leave It Alone

| Pattern | Why |
| --- | --- |
| Same shape, different domain meaning | `UserId` parsing vs `OrderId` parsing may look alike and must diverge independently |
| Temporary / one-off copy about to change | Premature sharing freezes the wrong design |
| Two call sites, unstable concept | Wait until the third use (or a clear shared name) unless the user asks to extract now |
| Framework boilerplate that must stay local | Route files, config stubs, generated clients |
| Parallel implementations behind a deliberate boundary | Public API vs internal; client vs server; package A must not import package B |
| Tests asserting different scenarios with similar setup | Share only the truly identical fixture pieces |
| “Almost the same” with growing conditionals | A shared function full of `if (mode === …)` is usually worse than two clear copies |

## False Abstraction Smells

Stop and split (or keep duplicates) if the candidate shared API needs:

- Mode / variant / `type` flags that change most of the body
- Optional parameters that each caller uses a disjoint subset of
- Names like `handleThing`, `processData`, `doStuff`, `helper`
- Knowledge of multiple unrelated domains to “reuse” one function
- Comments explaining which caller should pass which combination of knobs

## Accidental Similarity

Do not merge solely because of:

- Matching line count or formatting
- Similar JSX structure with different copy, data, or actions
- Repeated language idioms (`map` + `filter`, guard clauses, try/catch)
- Independent constants that happen to share a value today but mean different things

Require a shared **concept name** you can say out loud. If you cannot name it without “and”, it is probably two concepts.

## Intentional Duplication Is Fine

Prefer clear local copies when:

- Boundaries must stay sealed (security, package graph, deploy units)
- Divergence is expected soon (feature flags, market-specific rules)
- The duplication is trivial and the abstraction would be larger than the copies

Document the choice briefly in the completion report when you skip a tempting cluster.
