---
name: motion
description: Motion design guidance for designing, auditing, specifying, prototyping, or implementing product UI animation. Use for websites, apps, SaaS products, UI components, microinteractions, page transitions, loading states, data visualizations, design systems, accessibility/reduced-motion review, performance-safe animation, and product-feel polish. Do not use for non-interactive video or film motion unless adapting it to interactive product UI.
---

# Motion

## Overview

Design motion as product behavior, not decoration. Use animation only when it improves comprehension, feedback, perceived responsiveness, orientation, hierarchy, or brand expression without harming speed, comfort, accessibility, or task completion.

## Core Rule

Before proposing or coding animation, answer:

1. What changed in the interface?
2. Why did it change?
3. Where did the changed thing come from, and where is it going?
4. What should the user notice next?
5. Can the user keep working without waiting for decoration?
6. What is the reduced-motion equivalent?
7. Will this animate on the compositor, or does it trigger layout or paint?

If an animation cannot pass this test, remove it or replace it with a simpler state change.

## Workflow

1. Classify the interaction: feedback, reveal, overlay, navigation, list/data change, loading, expressive moment, or ambient motion.
2. Define the motion contract: trigger, purpose, start state, end state, duration, easing, interruption behavior, reduced-motion equivalent, accessibility risk, and performance risk.
3. Prefer existing platform, product, or design-system motion tokens. If none exist, propose a small named token set before adding one-off values.
4. Choose the smallest reliable implementation: CSS for simple transitions, platform-native APIs for native apps, WAAPI for runtime control, View Transitions for progressive page/view transitions, or a motion library only when already used or clearly justified.
5. Verify purpose, timing, easing, reduced motion, focus behavior, keyboard behavior, screen-reader semantics, performance, interruptibility, and repeated-use comfort.

## Reference Routing

Load only the focused reference needed for the task:

- [references/foundations.md](references/foundations.md): motion purpose, decision workflow, human-centered principles, duration tokens, easing tokens, delay, and stagger.
- [references/web-implementation.md](references/web-implementation.md): CSS transitions, CSS keyframes, reduced-motion CSS, WAAPI, FLIP, View Transitions, and scroll-driven animation.
- [references/frameworks-platforms.md](references/frameworks-platforms.md): React motion libraries, native app guidance, React Native, Lottie, Rive, SVG, Canvas, WebGL, and video.
- [references/component-recipes.md](references/component-recipes.md): common UI component recipes and product-state animation patterns.
- [references/performance.md](references/performance.md): compositor-only rules, layout-thrash prevention, `will-change`, responsiveness, and testing under real conditions.
- [references/accessibility.md](references/accessibility.md): reduced motion, non-motion alternatives, pause/stop/hide controls, seizure/discomfort triggers, and focus order.
- [references/deliverables-qa.md](references/deliverables-qa.md): anti-patterns, audit/specification/code-review deliverables, implementation handoff format, and QA checklists.

When implementing with a specific library, framework, SDK, CLI, or platform API, use a current documentation source if available before relying on memory for syntax or version-sensitive behavior.

## Motion Defaults

- Keep interaction feedback fast and interruptible.
- Prefer transform and opacity for performance.
- Avoid animating layout properties unless the product value justifies the cost and the implementation is measured.
- Prefer fades, highlights, or instant changes when there is no meaningful spatial model.
- Avoid motion that blocks task completion, repeats constantly, flashes, causes vestibular discomfort, steals focus, or becomes annoying after repeated use.
- Make reduced motion mandatory. Reduced motion may remove, shorten, fade, substitute a color or state change, or make motion user-controlled.

## Deliverables

For audits, return findings with severity, rationale, and specific fixes.

For specifications, include the trigger, purpose, state changes, timing, easing, reduced-motion behavior, interruption behavior, accessibility notes, and performance notes.

For implementation, keep changes scoped, use existing design-system patterns, and include verification for reduced motion and performance-sensitive behavior when the environment supports it.
