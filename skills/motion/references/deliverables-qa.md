# Motion Deliverables and QA

Use for anti-patterns, audit/specification/code-review deliverables, implementation handoff format, and QA checklists.

## What to avoid

Avoid these patterns unless there is a strong, tested reason:

- Gratuitous animation on every interaction.
- Long intro animations before content or CTA appears.
- Delayed tap/click feedback.
- Page-wide zooms and rotations.
- Heavy parallax during reading.
- Auto-playing carousel movement.
- Infinite spinners for long server work.
- Fake progress that stalls near completion.
- `transition: all` in production UI.
- Animating `height`, `width`, `top`, or `left` in high-frequency interactions.
- Large animated shadows, blurs, filters, and backdrop filters on mobile.
- Multiple unrelated animations competing for attention.
- Bounce/elastic motion in dense professional tools.
- Animation that makes content harder to read.
- Motion that masks slow performance instead of fixing it.
- Motion that only works with mouse hover.
- Motion that ignores reduced-motion settings.
- Animation that is impossible to interrupt.
- Motion values copied from another product without matching this productâ€™s intent.

## Deliverable formats

When the user asks for motion design recommendations, provide:

```text
Motion intent: why motion is needed
Interaction map: which components/states move
Motion specs: trigger, properties, duration, easing, origin, stagger, reduced-motion variant
Implementation notes: CSS/JS/library/platform approach
Accessibility notes: reduced motion, focus, semantics, pause/stop
Performance notes: compositor-only, layout/paint risks, testing plan
What to avoid: likely anti-patterns for this product
```

When the user asks for code, include:

- Tokens.
- Component implementation.
- Reduced-motion handling.
- Cleanup/cancellation if JavaScript is involved.
- Comments only where they clarify non-obvious choices.

When the user asks for critique/audit, return issues in priority order:

```text
Severity: blocker | high | medium | low
Area: UX | accessibility | performance | implementation | consistency
Problem: what is wrong
Why it matters: user/product impact
Fix: exact recommended change
Validation: how to test the fix
```

## Motion QA checklist

Before final answer or final code, verify:

- The animation has a named purpose.
- User feedback begins immediately.
- Duration matches scale and frequency.
- Easing matches intent.
- Direction/origin matches spatial model.
- Only one main focal point moves at a time.
- The animation can be interrupted/reversed/skipped.
- The reduced-motion variant exists and preserves meaning.
- Continuous motion can be paused/stopped/hidden.
- No important information depends on motion alone.
- Focus management and keyboard interaction are correct.
- Screen-reader status is correct for loading, success, error, and dialog states.
- Transform/opacity are used where possible.
- Layout/paint properties are justified and tested.
- No `transition: all` unless there is a narrow, safe, documented reason.
- Performance is acceptable on low-end devices.
- The motion still feels good after repeated use.

## Research basis

This skill is informed by current agent-skill conventions and motion/accessibility/performance guidance from OpenAI Codex Skills, the Agent Skills specification, Material Design motion, Apple Human Interface Guidelines and Reduced Motion criteria, Microsoft Fluent motion, IBM Carbon motion, Atlassian motion foundations, Nielsen Norman Group UX animation and response-time guidance, W3C WCAG guidance for animation and moving content, MDN documentation for CSS transitions/animations/easing/prefers-reduced-motion/Web Animations/View Transitions, web.dev and Chrome guidance on animation performance and INP, and academic work on functional animation taxonomies in interface design.
