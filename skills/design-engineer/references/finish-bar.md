# Finish Bar

Run this before declaring UI work done. Fail any in-scope item → fix or explicitly
defer with reason.

## 1. Hierarchy

- [ ] Purpose of the surface is obvious in a few seconds
- [ ] One clear primary action
- [ ] Secondary actions are visually quieter
- [ ] No equal-weight competing CTAs

## 2. Type and space

- [ ] Uses project type scale / tokens
- [ ] Spacing on rhythm; no random one-offs
- [ ] Alignment intentional; optical fixes where needed

## 3. System fidelity

- [ ] Reuses existing components/variants
- [ ] No parallel button/card/input language
- [ ] Colors from tokens; dark/light considered if product has them

## 4. Pattern fit

- [ ] Interaction model matches common expectations for the job
- [ ] Links vs buttons correct
- [ ] Overlays/forms chosen appropriately (modal vs drawer vs inline)

## 5. States

- [ ] Idle / loading / empty / error / success covered as applicable
- [ ] Empty first-use ≠ empty no-results
- [ ] Destructive paths confirm or undo

## 6. Feedback

- [ ] Pending actions visible without flicker
- [ ] Errors specific and recoverable
- [ ] Async updates announced when needed

## 7. Accessibility

- [ ] Keyboard complete; focus visible and restored
- [ ] Accessible names present
- [ ] Hit targets adequate
- [ ] Contrast acceptable
- [ ] Zoom not broken

## 8. Motion

- [ ] Only purposeful motion
- [ ] Reduced-motion path
- [ ] Compositor-friendly; interruptible

## 9. Responsive

- [ ] Key breakpoints preserve hierarchy and usability
- [ ] Touch-friendly where mobile matters
- [ ] No horizontal overflow surprises from real content

## 10. Anti-slop

- [ ] No AI-default palette/layout clichés unless brand
- [ ] No decorative card soup / fake stats / badge pile
- [ ] Marketing surfaces pass brand-first / hero budget rules
- [ ] Product surfaces stay appropriately dense

## 11. Copy

- [ ] Action verbs; honest labels
- [ ] Ellipsis where required
- [ ] Errors without blame

## 12. Engineering hygiene

- [ ] Scoped diff; no unrelated restyles
- [ ] Targeted lint/typecheck/tests for touched files
- [ ] Browser check when tools available (focus, resize, reduced motion)

## Done means

Decision record written, finish bar checked, and Improve-mode code matches the
chosen option — not a different design that “appeared while coding.”
