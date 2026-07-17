---
name: unslop-design
description: Bans AI-slop frontend aesthetics and reworks UI so it does not look machine-made. Removes purple/indigo gradients, Inter-class defaults, cream-terracotta-serif convergence, glassmorphism, pill badges, three equal feature cards, glow effects, emoji chrome, fake social proof, and template landing/dashboard skeletons. Use when the user says "unslop-design", "AI design slop", "looks AI", "generic AI UI", or asks to make frontend design distinctive, human-crafted, or free of AI-looking patterns.
---

# Unslop Design

AI frontend output converges on the statistical average of Tailwind/shadcn/SaaS training data. Detection is about **clusters of defaults**, not one ugly choice. This skill **bans those defaults** and requires a rework until the UI would not pass for another brand after the logo is removed.

## Core Mandate

1. **Ban first.** Do not polish AI-looking UI. Strip banned patterns, then rebuild with a committed direction.
2. **Commit before coding.** Lock palette, type pairing, layout concept, radius/elevation rules, and one signature element. "Clean and modern" is not a direction.
3. **Default is no cards.** Cards are allowed only as containers for user interaction or true comparison units.
4. **Second-wave escapes are still banned.** Cream + terracotta + italic serif, Space Grotesk/Geist autopilot, black + acid accent, and broadsheet newspaper layouts are convergence zones — not craft — unless the brief and brand research justify them.
5. **Pivot rule.** If a screen hits **3+** banned patterns, stop polishing and redesign the composition.

## Hard Bans (never ship)

| Cluster | Banned |
| --- | --- |
| Color | Purple/indigo/violet as primary or hero gradient; `#3B82F6` / `#6366F1` / `#8B5CF6` band; purple→pink/cyan ramps; neon cyan+violet on slate dark; gradient text (`background-clip: text`); pure `#000`/`#fff` as main canvas/ink; dark mode by default |
| Second-wave | Warm cream (~`#F4F1EA`) + terracotta/clay + large italic serif as default; tracked-out label rows + ticker bars without brand reason; decorative one-word italic/serif mid-headline |
| Type | Inter, Roboto, Arial, Open Sans, Lato, system-ui, bare `font-sans` as the identity; Space Grotesk or Geist as the autopilot “fix”; one family for display and body with no pairing decision |
| Shape | `rounded-2xl`/`rounded-3xl` everywhere; `rounded-full` pill badges/eyebrows; multi-layer soft shadows; colored left-edge card stripes; glass `backdrop-blur` chrome by default; glow/aurora/mesh orbs |
| Layout | Centered full-viewport hero template; exactly three equal feature cards; hero → logos → 3 cards → stats → testimonials → pricing → FAQ skeleton unchanged; dashboard-everywhere for non-analytics products; inset/side-panel/floating hero media on marketing surfaces |
| Chrome | Floating frosted nav pills; emoji as icons (🚀✨⚡); Lucide Zap/Shield/Rocket icon tiles as the feature story; DiceBear/fake avatars; 5-star testimonial rows; “Most popular” middle pricing tier as reflex |
| Motion | Universal fade-up-on-scroll; `transition-all`; `hover:scale-105` everywhere; continuous glow/pulse decoration; motion without a reduced-motion path |
| Copy | “Transform / unlock / seamlessly / supercharge / everything you need / ship faster / built for modern teams”; emoji CTAs; interchangeable SaaS headlines that fit any product |

Full catalog with code fingerprints: [references/banned-patterns.md](references/banned-patterns.md).

## Workflow

### 1. Scope

- **Full unslop:** audit and rework first-party UI (pages, components, global styles, tokens).
- **Targeted unslop:** only named routes, components, or surfaces — plus shared tokens if they force slop downstream.

State the scope, then proceed.

### 2. Audit

Search CSS/Tailwind/theme files and components for banned fingerprints (hexes, font names, `from-*-to-*`, `backdrop-blur`, `rounded-full` badges, `grid-cols-3` feature rows, cliché copy). Record each hit with file, pattern id, and severity.

Use [references/review-checklist.md](references/review-checklist.md).

### 3. Lock a real aesthetic

Before editing visuals, write a short design contract:

- Subject / brand world (materials, vernacular, audience) — not “SaaS”
- Light vs dark (only dark if brief demands it)
- 4–6 named colors with roles (bg, surface, text, muted, border, accent, semantic)
- Display + body (+ mono if needed) pairing — named faces, not “a nice sans”
- Layout idea (asymmetric split, editorial masthead, product-led, dense tool, etc.)
- Radius and elevation rules (usually tighter and rarer than soft SaaS)
- One signature element; everything else quieter
- What is explicitly out of bounds for this brief

If the contract would still fit any similar product, revise it.

Craft replacements: [references/craft-antidotes.md](references/craft-antidotes.md).

### 4. Rework

For each banned hit:

1. Remove the fingerprint (gradient, pill, card shell, font import, glow, template section).
2. Replace with the locked tokens and layout idea.
3. Prefer spacing, type hierarchy, real media, and structure over decorative chrome.
4. On marketing/landing first viewports: brand as hero-level signal; one headline; one short support line; one CTA group; one dominant real visual. No detached labels, floating badges, stat strips, or promo chips on the hero media.
5. Preserve behavior, routes, and content meaning unless the user authorizes copy changes needed to kill slop language.

### 5. Verify

Re-run the checklist. Pass the brand test: if removing the logo/name would let another product claim the screen, redesign. Prefer 2–3 intentional motions over many micro-animations. Respect `prefers-reduced-motion`.

## Completion Report

- Scope audited
- Banned patterns removed (grouped by cluster)
- Design contract locked (palette, type, layout, signature)
- Remaining exceptions (only if brief-justified), each with reason
- Checklist status

## Reference Routing

- [references/banned-patterns.md](references/banned-patterns.md) — enforceable ban catalog and code tells
- [references/craft-antidotes.md](references/craft-antidotes.md) — replacements and composition rules
- [references/review-checklist.md](references/review-checklist.md) — audit/rework checklist
- [references/sources.md](references/sources.md) — research basis
