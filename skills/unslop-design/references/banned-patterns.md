# Banned Patterns

Enforceable AI-design fingerprints. One hit is a warning; a cluster is a confession. Prefer removing the pattern over restyling it in place.

Pattern IDs are stable for audit reports.

## Color — C*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| C01 | Blue/indigo/violet primary | `#3B82F6`, `#2563EB`, `#6366F1`, `#8B5CF6`, `#7C3AED`; Tailwind `blue-500/600`, `indigo-*`, `violet-*`, `purple-*` as brand primary |
| C02 | Blue↔purple / purple↔pink hero gradients | `from-blue-* to-purple-*`, `from-violet-* to-fuchsia-*`, `linear-gradient(... #2563EB, #7C3AED)` |
| C03 | Gradient text for impact | `bg-clip-text text-transparent` with multi-hue fills on H1 or metrics |
| C04 | Neon cyan + violet on slate dark | `#38BDF8` + `#A855F7` on `#0F172A` / `slate-950` |
| C05 | Pure black / pure white canvas | Main bg `#000` / `#FFF` with no tint toward brand |
| C06 | Raw Tailwind gray paper | Unmodified `gray-50` `#F9FAFB`, `zinc-50`, timid even palettes with no dominant hue |
| C07 | Dark mode by default | Perma-dark shell when the brief did not request dark |
| C08 | Gradient-filled CTAs | Linear-gradient button fills as the primary action style |
| C09 | Second-wave cream editorial | ~`#F4F1EA` / beige paper + terracotta/clay/olive accent as the default “tasteful” fix |
| C10 | Acid accent on near-black | Near-black + single neon green/vermilion accent as autopilot “bold” |

**Rule:** Primary/accent outside the 200–290° blue→violet band unless the brand identity requires it. Neutrals must be tinted. Second-wave palettes need brief justification, not vibes.

## Typography — T*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| T01 | Default sans identity | Inter, Roboto, Arial, Open Sans, Lato, Helvetica as display and/or body identity |
| T02 | System stack as brand | `system-ui`, `font-sans` with no explicit family decision |
| T03 | Autopilot “distinctive” swaps | Space Grotesk or Geist used as the reflexive anti-Inter fix |
| T04 | Single-family page | One geometric sans for hero and body with no pairing |
| T05 | Decorative mid-headline swap | One italic/serif/color-shifted word in an otherwise plain headline solely for “taste” |
| T06 | Tracked-out label monoculture | All-caps / widely tracked eyebrows on every section |
| T07 | Uniform type ladder | Exact `text-5xl/4xl/2xl/base` + all headings `font-bold` with no weight or optical hierarchy |

**Rule:** Name a display + body pairing before coding. Size and weight create hierarchy — not gradient fills.

## Shape and chrome — S*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| S01 | Soft SaaS radius everywhere | `rounded-2xl` / `rounded-3xl` on most surfaces |
| S02 | Pill eyebrows and badges | `rounded-full` chips above H1 (“New”, “AI-powered”, ✨) |
| S03 | Soft elevation stack | `shadow-md`/`shadow-lg`/multi-layer shadows on every card |
| S04 | Side-stripe cards | 3–6px colored left border on feature cards |
| S05 | Glassmorphism default | Widespread `backdrop-blur`, frosted nav pills, translucent cards |
| S06 | Glow / aurora / orbs | Blurred purple/pink/cyan circles, mesh gradients, neon under-card glow |
| S07 | Cardocalypse | Non-interactive content wrapped in bordered/shadowed cards; card-in-card nesting |
| S08 | Unmodified shadcn pillow card | `rounded-2xl shadow-lg p-6 border` as the universal container |

**Rule:** Default is **no cards**. Borders and shadows are rare. Glass and glow need a functional reason (overlap, legibility), not “premium.”

## Layout — L*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| L01 | Full-viewport centered hero | `min-h-screen` + centered H1 + sub + dual CTAs as the only hero idea |
| L02 | Three equal feature cards | `grid-cols-3` / `repeat(3,1fr)` identical icon+title+blurb cells |
| L03 | Template section stack | nav → hero → logos → 3 features → stats → testimonials → pricing → FAQ → CTA → 4-col footer, unchanged |
| L04 | Sticky SaaS nav chrome | logo left, 4–5 links, CTA right, hairline border as genre-blind default |
| L05 | Stats strip / 1-2-3 steps as filler | Big-number row or numbered steps with no product-specific reason |
| L06 | Dashboard-everything | Left sidebar + metric card grid applied to marketing or non-analytics products |
| L07 | Weak marketing hero media | Inset hero image, side-panel hero, rounded media card, tiled collage, or floating screenshot stack as the main brand plane |
| L08 | Hero overlays | Detached labels, floating badges, promo stickers, info chips on top of hero media |
| L09 | Broadsheet autopilot | Hairline rules, zero radius, dense newspaper columns used as the default “editorial” escape |

**Rule:** First viewport reads as one composition. Asymmetry, content-height heroes, and product-led media beat the template stack.

## Components and content — K*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| K01 | Emoji-as-icon | 🚀 ✨ ⚡ 🔒 as section or feature icons |
| K02 | Cliché Lucide tiles | Zap / Shield / Rocket / Sparkles in tinted rounded squares as the feature story |
| K03 | Fake social proof | DiceBear/geometric avatars, unverifiable 5-star rows, stock “team at laptop” |
| K04 | Pricing cliché | Three tiers, middle “Most popular” gradient pill, identical check lists |
| K05 | Empty SaaS copy | transform, unlock, seamlessly, supercharge, elevate, 10x, everything you need, built for modern teams, ship faster |
| K06 | Terminal cosplay | Traffic-light window chrome + monospace dump as fake product proof |
| K07 | Hollow empty-state mascot | Friendly blob/character empty states with no product meaning |

## Motion — M*

| ID | Ban | Fingerprints |
| --- | --- | --- |
| M01 | Fade-up monoculture | Every block `opacity: 0` + `y: 20` on scroll |
| M02 | `transition-all` | Global `transition-all duration-300 ease-in-out` |
| M03 | Scale-on-hover everywhere | `hover:scale-105` as the only interaction idea |
| M04 | Eternal decoration | Continuous glow, pulse, or shimmer on static chrome |
| M05 | No reduced-motion path | Motion with no `prefers-reduced-motion` equivalent |

**Rule:** Prefer 2–3 intentional motions that clarify hierarchy or feedback. Animate opacity/transform. Never block tasks for decoration.

## Stack monoculture note

React + Tailwind + shadcn + Lucide + Inter is a common substrate. The stack is allowed; **unmodified defaults are not**. Theme tokens must replace attractor colors, radii, shadows, and type before components ship.
