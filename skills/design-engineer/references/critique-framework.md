# Critique Framework

Use this lens before proposing solutions. Diagnosis without evidence is guessing.

## Capture context

1. **Surface** — page, modal, flow step, component, marketing section
2. **User** — role, expertise, device, frequency
3. **Job** — success looks like …
4. **Constraints** — brand, tokens, a11y bar, performance budget, stack
5. **Evidence** — code paths, rendered behavior, copy, spacing, focus order

Ask clarifying questions only when the answer would change the solution set.

## Walk the surface

Inspect in this order (stop early only if scope is a single micro-interaction):

1. **First read (3–5 seconds)** — Can you name the purpose and primary action?
2. **Hierarchy** — Does type, weight, color, and space encode importance?
3. **Scan path** — F/Z patterns, left nav, content columns — where does the eye go?
4. **Action clarity** — One primary CTA? Destructive actions differentiated?
5. **Information density** — Too sparse for a tool, or too noisy for the job?
6. **Grouping** — Related controls clustered? Orphaned actions?
7. **Affordances** — Interactive elements look interactive? Dead zones?
8. **Feedback** — Pending, success, failure visible and timely?
9. **State lattice** — Empty/loading/error/partial designed or improvised?
10. **Consistency** — Matches sibling screens and system components?
11. **Keyboard / focus** — Tab order, focus rings, escape, restore focus?
12. **Responsive** — Breakpoints preserve hierarchy; touch targets adequate?
13. **Motion** — Clarifies or distracts? Reduced-motion path?
14. **Copy** — Human, specific, action-oriented? Jargon or blame in errors?
15. **Anti-slop** — AI-default aesthetics, card soup, purple glow, fake stats?

## Severity tags

| Tag | Meaning | Treat as |
| --- | --- | --- |
| `blocker` | Prevents task completion, causes data loss, or fails a11y for core path | Must fix in scope |
| `friction` | Slows, confuses, or increases error rate | Should fix |
| `polish` | Craft gap that does not block the job | Fix if cheap / in craft pass |
| `out-of-scope` | Real issue outside the named surface | Record, do not expand |

Also tag business impact when useful:

- `blocks-conversion`
- `adds-friction`
- `reduces-trust`
- `minor-polish`

## Issue taxonomy

Write each finding as: **observation → user impact → likely cause → taxonomy**.

Taxonomy codes:

- `IA` — information architecture / navigation / findability
- `HIER` — visual hierarchy / emphasis
- `INTERACT` — controls, targets, gestures, complexity of choice
- `FEEDBACK` — system status, validation, optimistic UI
- `STATE` — missing or weak non-happy states
- `A11Y` — keyboard, semantics, names, contrast, motion prefs
- `MOTION` — missing, excessive, or janky motion
- `PERF` — perceived or real responsiveness
- `VISUAL` — spacing, type, color, alignment, depth
- `COPY` — labels, microcopy, errors, empty states
- `SYSTEM` — token/component inconsistency or reinvention
- `PATTERN` — fights platform or domain conventions users know

## Persona spot-checks

Quick pass with 2–3 relevant personas (pick what fits):

- **First-time user** — Can they succeed without tribal knowledge?
- **Power user** — Density, shortcuts, batch actions, speed?
- **Keyboard / AT user** — Operable without a pointer?
- **Mobile / thumb user** — Reach, target size, no hover-only?
- **Stressed / error-recovery user** — Clear diagnosis and next step?

## Pattern research gate

When the diagnosis implies a **new layout or interaction model**, gather 2–3
shipped references before locking options:

- Same job in peer products (e.g. invite modal, filter bar, empty inbox)
- Same platform conventions (iOS vs web; dashboard vs marketing)
- Existing in-product screens that already solve a cousin problem

Extract structure (hierarchy, progressive disclosure, CTA placement), not skin.

## Diagnosis output shape

```markdown
## Diagnosis

| # | Finding | Severity | Code | Evidence |
| --- | --- | --- | --- | --- |
| 1 | Primary and secondary CTAs same weight | friction | HIER | Header actions; both `variant=default` |
| 2 | No empty state when list length 0 | blocker | STATE | `List.tsx` renders null |
```

Do not propose solutions in the same breath as findings until the table is honest.
