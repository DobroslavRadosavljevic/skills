# Review Checklist

Use during audit and again before completion. Mark failures with pattern IDs from [banned-patterns.md](banned-patterns.md).

## Critical — leaked internals (must be zero)

- [ ] No instruction/criteria/implementation notes as visible UI copy (I01)
- [ ] No prompt/agent/session residue (I02)
- [ ] No `TODO` / `FIXME` / `lorem` / placeholder honesty (I03)
- [ ] No API paths, schema keys, enums, or code names as labels (I04)
- [ ] No feature flags / env names / internal IDs in UI (I05)
- [ ] No stack traces, `TypeError`, `ECONN*`, or raw `error.message` in UI (I06)
- [ ] No bare HTTP codes as the primary message (I07)
- [ ] No framework/component jargon as user copy (I08)

## Grep / static

Scan JSX, HTML, i18n/locale JSON/YAML, toasts, `aria-label`, meta, alt:

- [ ] No power-verb cluster: `unlock|empower|elevate|supercharge|harness|unleash|revolutionize|transform`
- [ ] No `effortlessly|seamlessly|streamline`
- [ ] No empty adjectives: `cutting-edge|next-generation|game-changing|world-class|AI-powered` as filler
- [ ] No `In today's|Let's dive|It's worth noting|Not just|It's not .* it's`
- [ ] No ghost CTAs alone: `Learn more|Get started|Click here|Submit|OK`
- [ ] No vague errors alone: `Something went wrong|An error occurred|Invalid input`
- [ ] No `No data available|No items found` without a next step
- [ ] No emoji/`!` on buttons
- [ ] No `error.message` / `String(err)` rendered into user-visible nodes

## Per-surface quality

### Buttons / links
- [ ] Verb (+ noun) names the outcome
- [ ] Sentence case; no punctuation/emoji
- [ ] Destructive actions name the object
- [ ] Same destination → same label

### Errors
- [ ] What happened + what to do next (why only if useful)
- [ ] Plain language; no blame; no validation-`sorry`
- [ ] Exceptions mapped through a user-message helper

### Empty states
- [ ] Why empty + one primary CTA
- [ ] Failure-as-empty uses error copy, not “no data”

### Forms / settings
- [ ] Visible labels; placeholders are examples only
- [ ] User vocabulary, not implementation names
- [ ] Glossary consistency (one word per concept)

### Marketing
- [ ] Claims are specific (numbers, named integrations, real proof) or cut
- [ ] CTA names the action/destination
- [ ] No performed-contrast / throat-clearing openers

## Voice

- [ ] Voice contract exists
- [ ] Tone matches stakes (no cheer on billing failures)
- [ ] Prefer delete over decorate
- [ ] Human test passes (non-engineer knows next step)
- [ ] Any-product test fails (sentence is not interchangeable)

## Pivot

If **3+** checklist failures share one view or hero: rewrite the whole message set. Do not synonym-swap.

## Pass criteria

Ship only when critical leaks are zero, banned clusters are cleared (or explicitly brief-excepted), and public copy is plain, specific, and actionable for humans.
