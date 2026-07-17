# Review Checklist

Use during audit and again before completion. Mark failures with pattern IDs from [banned-patterns.md](banned-patterns.md).

## Grep / static

- [ ] No Inter / Roboto / Arial / Open Sans / Lato / Helvetica as identity fonts
- [ ] No bare `system-ui` / unstyled `font-sans` as the brand face
- [ ] No Space Grotesk or Geist as autopilot replacement
- [ ] No `#3B82F6`, `#2563EB`, `#6366F1`, `#8B5CF6`, `#7C3AED` as primary/accent
- [ ] No blue↔purple / purple↔pink hero or CTA gradients
- [ ] No `bg-clip-text` / gradient headlines or metric numbers
- [ ] No default dark shell unless brief requires dark
- [ ] No cream≈`#F4F1EA` + terracotta/serif editorial cluster without brief justification
- [ ] No `rounded-2xl`/`rounded-3xl` as universal radius
- [ ] No `rounded-full` hero eyebrows / decorative pills
- [ ] No `shadow-lg` + soft multi-shadow card stack
- [ ] No colored left-edge card stripes
- [ ] No decorative `backdrop-blur` glass chrome
- [ ] No aurora/orb/glow background layers
- [ ] No `grid-cols-3` identical icon feature rows
- [ ] No `hover:scale-105` / `transition-all` monoculture
- [ ] No universal scroll fade-up without reduced-motion handling
- [ ] No banned CTA/marketing strings (transform, unlock, supercharge, seamlessly, everything you need, …)
- [ ] Colors, radii, type resolve from project tokens — not one-off attractor hexes mid-component

## Visual / conceptual

- [ ] Design contract exists (palette, type pairing, layout idea, signature, out-of-bounds)
- [ ] Accent is not indigo/violet unless brand-locked
- [ ] Not dark-by-default
- [ ] Not second-wave cream/serif/terracotta unless justified
- [ ] Not broadsheet/newspaper autopilot unless justified
- [ ] Cards only for interaction or true comparison
- [ ] At least one asymmetric or non-template section on marketing pages
- [ ] First viewport: brand, one headline, one support line, one CTA group, one dominant real visual
- [ ] No hero overlays (badges, chips, stickers on media)
- [ ] Hero media is full-bleed / dominant when the surface is promotional
- [ ] Iconography is subject-specific — not emoji or Zap/Shield/Rocket tiles
- [ ] Social proof is real or omitted
- [ ] Motion is purposeful (≈2–3 intentional moments), not decoration spam
- [ ] Brand test: removing the logo would not let another product claim the UI

## Pivot

If **3+** checklist failures share one view: redesign the composition. Do not nudge colors on the same template.

## Pass criteria

Ship only when static bans are clear (or explicitly brief-excepted) and the brand test passes.
