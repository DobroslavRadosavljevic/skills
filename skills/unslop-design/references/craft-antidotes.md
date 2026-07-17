# Craft Antidotes

What to do after bans remove the average. The goal is a committed, subject-specific UI — not a different template.

## Design contract (required)

Write this before visual edits:

1. **Subject world** — materials, culture, product vernacular (tool, atelier, clinic, archive, field kit, …)
2. **Mode** — light by default; dark only when brief/brand demands
3. **Color roles** — 8–12 roles beats 3 lonely hexes: bg, surface, text, muted, border, accent, accent-subtle, success/warn/danger
4. **Type pairing** — named display + body (+ mono). State why the pairing fits the subject
5. **Layout concept** — one sentence (asymmetric split, masthead + full-bleed media, dense instrument panel, …)
6. **Radius / elevation** — usually tighter radii; elevation reserved for true overlays
7. **Signature** — one memorable risk; cut competing decoration
8. **Out of bounds** — paste the hard bans that matter most for this brief

If another brand could reuse the contract unchanged, it is still slop.

## Color

| Instead of | Do |
| --- | --- |
| Blue–violet attractor | Pick a primary outside 200–290° unless brand-locked; one sharp accent; tint neutrals toward the anchor hue |
| Hero multi-stop gradients | Flat tinted paper, subtle adjacent-hue wash, photography, or purposeful texture |
| Gradient text | Weight, size, italic of the display face, or solid ink |
| Pure `#fff`/`#000` | Off-white / off-black with warm or cool bias |
| Timid even palette | Dominant surface + restrained accent; custom `::selection` |

## Typography

| Instead of | Do |
| --- | --- |
| Inter / system | Distinct pairing chosen for the brief (editorial, industrial, product, humanist, …) |
| Space Grotesk autopilot | A face justified by the subject — not the current “anti-slop” fashion |
| One size ladder | Larger jumps between display and body; use weight extremes; tighten tracking on large display |
| Decorative one-word swap | Hierarchy through layout and scale; special word treatment only when content role demands it |

## Layout and composition

| Instead of | Do |
| --- | --- |
| Centered template hero | Left/right bias, split layouts (`5fr 3fr`), content-height heroes, editorial mastheads |
| Three equal cards | Unequal spans, lists, prose blocks, tables, media + caption, staggered rhythm |
| Section sameness | Vary vertical rhythm; break the hero→features→pricing order when the story needs it |
| Dashboard for everything | Chrome that matches the job: document, canvas, feed, wizard, map — not metric cards by reflex |

### Marketing / landing first viewport

One composition:

- Brand or product name as a hero-level signal (not only nav text)
- One headline
- One short supporting sentence
- One CTA group
- One dominant real visual (product, place, atmosphere) — full-bleed / edge-to-edge on promotional surfaces

Do not load the first viewport with stats, schedules, address blocks, promo rows, or secondary marketing.

### Cards

Default: **no cards**.

Allowed when the container is the interaction (selectable item, form group, expandable panel) or a true comparison unit. If removing border, shadow, fill, or radius does not hurt understanding, remove them.

## Imagery and atmosphere

| Instead of | Do |
| --- | --- |
| Blur orbs / plastic 3D blobs | Real product shots, environment photography, diagrams, or intentional flat tinted paper |
| Huge Lucide icon as “art” | Subject-specific media or typographic composition |
| Dark scrim over generic stock | Media that could only belong to this product |

Decorative gradients alone do not count as the main visual idea.

## Motion

| Instead of | Do |
| --- | --- |
| Fade-up everywhere | One orchestrated entrance or a few feedback motions |
| `transition-all` / scale-hover spam | Explicit properties, crafted easing, interruptible feedback |
| Eternal glow | Motion that finishes or tracks real progress |

Always provide a reduced-motion equivalent (instant state, fade, or shorter alternative).

## Copy

| Instead of | Do |
| --- | --- |
| Interchangeable uplift | Specific claims a competitor could not paste |
| Emoji CTAs | Plain verbs that match the action |
| Fake testimonials | Real quotes, metrics, or omit social proof |

## Signature test

After rework, answer:

1. What is the one memorable visual risk?
2. Would this still look correct with another brand’s logo?
3. Did we ban the attractor cluster, or only recolor it?

Fail any → continue reworking.
