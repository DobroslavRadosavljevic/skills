# Solution Selection

After diagnosis, generate **2–4 genuinely different** solutions, then choose one.

## Option quality bar

Options fail if they are:

- Recolors or spacing tweaks of the same structure (those are variants, not options)
- Identical interaction models with different component names
- “Do nothing” unless explicitly useful as a baseline
- Impossible under stated stack/token constraints

Good divergence axes (pick 1–2 per set):

- **Structure** — single column vs split, page vs drawer, table vs cards
- **Disclosure** — all-at-once vs stepped vs progressive
- **Initiative** — user-driven vs intelligent defaults / suggestions
- **Density** — comfortable vs compact vs configurable
- **Locus of control** — inline edit vs modal vs separate route
- **Pattern family** — familiar platform pattern vs product-specific signature

## For each option document

```markdown
### Option [A|B|C|D] — [short name]

- **Model:** [one sentence interaction/layout model]
- **Addresses:** [finding #s]
- **Why it might win:** …
- **Risks:** …
- **Effort:** S | M | L
- **System fit:** reuses X / needs new Y
- **Pattern refs:** [shipped examples or in-app cousins]
```

## Decision matrix

Score 1–5 (higher better). Weight defaults:

| Criterion | Weight | Notes |
| --- | --- | --- |
| Usability for the job | 5 | Speed, clarity, error rate |
| Consistency / Jakob’s Law | 4 | Matches user expectations & product |
| Value / focus | 4 | Removes noise; serves primary job |
| Accessibility | 4 | Must not regress; prefer gains |
| Feasibility / maintainability | 3 | Tokens, primitives, complexity |
| Craft / brand expression | 2 | Raise when marketing or signature UI |
| Novelty | 1 | Only when user asked for distinctive |

**Default winner:** highest weighted score. If tied, prefer the option that:

1. Fixes `blocker` findings completely
2. Reuses the design system more
3. Introduces fewer new interaction models
4. Is easier to undo

## Explicit rejection

Always say why losers lose. Example:

> Reject A (card grid): looks “modern” but destroys scan speed for 200-row
> expert workflows. Reject C (wizard): over-segments a 3-field form (Hick /
> Tesler misuse).

## When to ask the user

Ask before implementing when:

- Options diverge on brand risk or information architecture
- Effort is L and multiple options remain close
- The user asked for Propose mode
- A choice permanently changes a shared primitive used elsewhere

Otherwise, in Improve mode: **decide, state the decision, implement**.

## Partial adoption

You may combine: take B’s structure + C’s empty state. Say so explicitly so the
decision record stays honest. Do not silently merge after presenting A/B/C as
exclusive if the ship plan is a hybrid.

## Scope discipline

The chosen option must stay inside the named surface unless a tiny shared token
or primitive fix is required for correctness. If a shared fix is needed, call it
out and keep it minimal.
