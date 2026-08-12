# Design Engineer Mindset

Design engineers sit in the overlap of **visual design** and **production code**.
They do not wait for a perfect handoff. They diagnose problems, prototype in the
medium that ships (code), and own the result through accessibility, performance,
and polish.

## What “good” means

Beyond pretty pixels:

- Delightful, understandable interactions and clear affordances
- Reusable primitives that match the product system
- Fast perceived and real performance
- Cross-browser and cross-input support (keyboard, pointer, touch)
- Respect for user preferences (`prefers-reduced-motion`, contrast, zoom)
- Assistive technology support as a first-class requirement

## Guiding questions (VUFB)

Before any change, answer:

1. **Value** — Does this create meaningful value for the user’s job, or is it noise?
2. **Usability** — Can the user accomplish the goal faster, with fewer errors and less memory load?
3. **Feasibility** — Can we ship this at production quality in this stack without fragile hacks?
4. **Business viability** — Does this align with product goals, brand, and long-term system cost?

Some animations and flourishes fail Value. Elegant tech that confuses users fails
Usability. Beautiful Figma that cannot survive real data fails Feasibility.

## Operating principles

### Own outcomes, not layers

A design engineer is responsible for how the interface **feels in production**,
not for a static mock. States, edge cases, keyboard paths, and loading behavior
are design decisions.

### Taste with evidence

Taste is necessary but not sufficient. Ground choices in:

- Observed friction in the current UI
- Established usability heuristics and UX laws
- Patterns users already know from similar products
- Constraints of the local design system

### Systems over one-offs

Prefer extending tokens, variants, and primitives. One-off magic is allowed for
signature moments (marketing hero, empty-state delight) when it does not fracture
the product language.

### Cost vs impact

During optioning, weigh implementation cost against experience impact. Kill
low-impact complexity early. Polish the primary path harder than decorative edges.

### Iterate to greatness

Ship continuous improvements. Avoid the perfection trap, but do not ship known
accessibility or hierarchy failures as “fine for now” when they are in scope.

### Prototype in code when it matters

Keyboard behavior, focus management, touch targets, animation, and responsive
reflow are cheaper and truer in code than in static design tools. Use mocks for
exploration; validate interaction in the running UI when possible.

## Mental model of a surface

For any screen or component under review, map:

| Layer | Questions |
| --- | --- |
| Job | What is the user trying to do? How often? |
| Hierarchy | What is primary / secondary / tertiary? |
| Structure | Layout, grouping, progressive disclosure |
| Interaction | Controls, shortcuts, gestures, navigation |
| Feedback | Status, validation, optimistic UI, undo |
| States | Empty, loading, error, partial, permission |
| Motion | What must move to explain change? |
| Copy | Labels, errors, empty states, confirmations |
| System | Tokens, components, density, brand |

## Anti-mindsets

- “Make it modern” without a user job
- Decorating before fixing hierarchy or state gaps
- Treating accessibility as a final checklist only
- Copying Dribbble aesthetics into dense product tools
- Adding motion because the screen feels “static”
- Inventing a new component when the system already has one
