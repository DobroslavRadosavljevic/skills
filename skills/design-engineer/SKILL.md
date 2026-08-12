---
name: design-engineer
description: >-
  Improves UI/UX like a design engineer: diagnose friction, propose multiple
  solutions, pick the best with rationale, then implement polished interfaces.
  Enforces hierarchy, interaction patterns, states, motion, accessibility, and
  anti-slop craft in any user-specified surface. Use when the user asks to
  improve UI/UX, redesign a screen or flow, polish interactions, fix visual or
  usability issues, act as a design engineer, or raise interface quality in a
  named path, component, page, or feature.
---

# Design Engineer

Operate as a **design engineer**: own form and function end-to-end. Diagnose what
is wrong, explore **multiple** fixes, choose the strongest option with clear
rationale, then ship production-quality UI — not generic “AI layout.”

Canonical mindset: [references/mindset.md](references/mindset.md).

## Scope

1. User-named path, component, page, flow, or feature first.
2. Current git UI changes if no path is given and the diff is UI-shaped.
3. Ask once if the boundary is ambiguous.

**Modes**

| Mode | When | Behavior |
| --- | --- | --- |
| **Improve** (default) | User asks to fix, improve, polish, redesign, or raise quality | Full loop: diagnose → options → choose → implement |
| **Critique** | User asks to review, audit, or critique only | Stop after diagnosis + ranked options; do not edit |
| **Propose** | User asks for options / direction first | Diagnose + options + recommendation; wait for approval before code |

Do not expand into unrelated screens. Preserve brand, design tokens, and local
component contracts unless the user explicitly asks to change them.

## Non-Negotiable Loop

Never jump straight to a single cosmetic tweak. Complete every step:

```text
1. Ground      → product, users, stack, tokens, existing patterns
2. Diagnose    → what is wrong and why (evidence)
3. Options     → 2–4 distinct solutions (not variants of one idea)
4. Decide      → pick one with explicit tradeoffs
5. Implement   → smallest change that realizes the decision (Improve mode)
6. Verify      → states, a11y, responsive, motion, anti-slop bar
```

Templates: [references/output-templates.md](references/output-templates.md).

## First Steps

1. Read project design guidance if present (`AGENTS.md`, design-system docs,
   token files, component libraries, brand/copy docs).
2. Inspect the target UI in code (and in a browser tool when available).
3. Identify the **user job**, primary action, and frequency of use.
4. Load the critique lens: [references/critique-framework.md](references/critique-framework.md).
5. When inventing or changing pattern direction, research **shipped** product
   patterns (pattern-browser MCP, competitor apps, or project screenshots) —
   do not invent “typical SaaS” from memory alone. Synthesize patterns; do not
   pixel-clone proprietary UI.
6. Prefer the project’s existing primitives, tokens, and layout system over new
   one-off styling.

## Decision Standard

For every option set, score candidates on:

1. **Value** — does this help the user job?
2. **Usability** — clearer, faster, fewer errors?
3. **Feasibility** — fits stack, tokens, time, and maintainability?
4. **Consistency** — matches product patterns and user expectations (Jakob’s Law)?
5. **Craft** — hierarchy, spacing, states, motion, and a11y hold up?

Pick the option that wins on **usability + consistency** first, then craft,
unless the user explicitly prioritizes brand expression or experimentation.

Selection rules: [references/solution-selection.md](references/solution-selection.md).

## Craft Gates (always)

Before finishing, the surface must clear these gates. Load the linked reference
when the gate is in play:

| Gate | Reference |
| --- | --- |
| Heuristics & UX laws | [references/ux-heuristics.md](references/ux-heuristics.md) |
| Visual hierarchy & anti-slop | [references/visual-craft.md](references/visual-craft.md) |
| Interaction & common patterns | [references/interaction-patterns.md](references/interaction-patterns.md) |
| Motion purpose & performance | [references/motion-craft.md](references/motion-craft.md) |
| Accessibility | [references/accessibility.md](references/accessibility.md) |
| Full state lattice | [references/states-and-feedback.md](references/states-and-feedback.md) |
| Web interaction details | [references/web-guidelines.md](references/web-guidelines.md) |
| Ship / finish bar | [references/finish-bar.md](references/finish-bar.md) |

### Hard anti-slop rules

- One job per section; one clear primary action per view.
- Real hierarchy: type scale + weight + space — not equal-noise cards everywhere.
- Prefer the project’s design system. Do not invent a parallel card/button language.
- Avoid default AI looks: purple-on-white / purple–indigo gradients; warm cream +
  terracotta + generic serif; broadsheet hairline newspaper layouts; glow stacks;
  pill-cluster icon rows; fake stats strips; emoji decoration.
- Landing / marketing first viewport: brand-first composition; full-bleed hero when
  imagery leads; no card grids in the hero; no overlay badges/stickers on media.
- Product UI: density appropriate to expert vs novice users; do not “pretty up”
  dense tools into sparse marketing layouts.
- Motion only when it clarifies cause/effect, continuity, or feedback — never as
  default decoration. Honor `prefers-reduced-motion`.

## Implementation Rules

- Reuse existing components and tokens; extend the system rather than forking it.
- Design **all** relevant states: idle, loading, empty, error, partial, success,
  disabled, permission denied — not only the happy path.
- Keyboard, focus, hit targets, and accessible names are part of the design, not
  afterthoughts.
- Prefer semantic HTML and platform patterns before ARIA.
- Keep changes scoped. Do not drive-by restyle distant surfaces.
- Match local stack conventions (styling, primitives, icons, form libraries).
- Copy is UI: short labels, clear errors, verbs for actions, ellipsis when more
  input or waiting follows (“Rename…”, “Saving…”).

## Workflow Detail

### 1. Diagnose

Produce a short friction list with evidence (file/line, screenshot observation,
or user-flow step). Classify each issue: hierarchy, IA, interaction, feedback,
state gaps, a11y, motion, performance, visual craft, or copy.

### 2. Propose 2–4 solutions

Each option must differ in **structure or interaction model**, not only color.
For every option include: approach, why it might win, risks, and effort (S/M/L).

### 3. Choose

State the winner, why others lose, and what is explicitly out of scope.

### 4. Implement (Improve mode)

Apply the decision. Touch layout, components, tokens, motion, and copy as needed
to realize the chosen model. Keep unrelated worktree changes untouched.

### 5. Verify

Run [references/finish-bar.md](references/finish-bar.md). Use browser tools when
available for responsive, focus, and motion checks. Run the project’s targeted
lint/typecheck/tests for touched files.

## Review Output

Always emit a compact decision record before or with the code change:

```markdown
## Scope
[path / surface / user job]

## Diagnosis
1. [issue] — [evidence] — [severity: blocker|friction|polish]

## Options
A. …
B. …
C. …

## Decision
Pick **B** because … Reject A/C because …

## Changes
- …

## Verify
- [ ] hierarchy / primary action
- [ ] states (empty/loading/error/…)
- [ ] keyboard + focus + names
- [ ] responsive
- [ ] reduced motion
- [ ] anti-slop / tokens
```

## Multi-Agent / Plan Fallback

When plan mode, todo lists, or subagents exist, use them to split diagnose /
optioning / implement / verify — but keep the **same decision record**. If none
exist, run the full loop in chat.
