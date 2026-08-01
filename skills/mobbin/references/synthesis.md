# Synthesize Mobbin References

## Goal

Turn shipped-app evidence into a **project-fit direction**. Mobbin is a pattern oracle, not a free design system or a license to clone.

## Synthesis steps

1. **Cluster** — Group hits by pattern family (e.g. “single CTA paywall”, “comparison table”, “benefit list + social proof”).
2. **Extract operators** — For each strong reference, write 1–3 concrete operators:
   - Hierarchy (what is primary/secondary)
   - Structure (sections, steppers, sheets, split panes)
   - Trust / objection handling (microcopy, guarantees, third-party badges)
   - State coverage (loading, empty, error, success)
   - Flow timing (pre-prompt before system permission, progress always visible, etc.)
3. **Select** — Pick 2–3 operators that fit the product’s users and brand. Drop pretty-but-mismatched patterns.
4. **Adapt** — Map operators onto the project’s type scale, spacing, components, and content. Replace donor brand assets.
5. **Cite** — In the proposal, list references as `App — pattern — why` with Mobbin links when available.

## Output shape (before coding)

Use a short brief:

```markdown
## Design direction
[1–2 sentences]

## Mobbin references
- [App](mobbin_url) — [pattern taken]
- ...

## Patterns to apply
- ...

## Patterns rejected
- ... — [why]

## Open questions
- ...
```

Only after this brief (or an explicit user “skip brief / implement now”) move to wireframes or code.

## Fidelity rules

- Default to **low/mid-fi** structure first when exploring.
- Match existing design-system components when implementing in a real codebase.
- Do not paste Mobbin screenshots into production UI.
- Do not recreate trademarked illustration, mascot, or logo work.

## Anti-patterns

- Name-dropping apps without opening the returned images.
- Averaging ten screens into a generic mush (“cards + gradient + pill buttons”).
- Copying density/chrome from consumer apps into dense B2B tools (or vice versa) without justification.
- Skipping empty/error/permission states when the flow depends on them.
- Declaring “best practice” without at least one Mobbin-backed example for this session.
