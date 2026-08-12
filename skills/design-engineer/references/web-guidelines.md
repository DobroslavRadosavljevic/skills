# Web Interface Guidelines (Practical Digest)

Distilled interaction and craft rules commonly used by strong web design-engineering
teams (framework-agnostic unless noted). Apply when building or reviewing web UI.

## Interactions

- Keyboard works everywhere; complex widgets follow WAI-ARIA authoring patterns
- Clear `:focus-visible`; use `:focus-within` for grouped controls
- Manage focus: trap, move, and restore for overlays
- Hit targets: expand to ≥24px when visuals are smaller; ≥44px on mobile
- Mobile input font-size ≥16px (or equivalent) to prevent iOS focus zoom
- Never disable browser zoom
- Hydration-safe inputs: do not lose focus or value after hydrate
- Never disable paste in inputs
- Loading buttons: keep label + progress indicator
- Minimum loading-state duration / show-delay to avoid flicker
- URL as state for shareable UI state
- Optimistic UI when safe; reconcile; error + rollback/undo on failure
- Ellipsis for follow-up input and in-progress labels
- Confirm destructive actions or provide undo
- `touch-action: manipulation` on controls when appropriate
- Forgiving interactions: generous targets, clear affordances, predictable behavior
- Overscroll contain in modals/drawers when inner scroll should not chain
- Autofocus single primary desktop input; rare on mobile
- No dead zones on controls
- Deep-link filters, tabs, pagination, expanded panels when useful
- While dragging: disable selection; inert inappropriate peers
- Links are links (`<a>` / router Link) — not buttons styled as nav
- Announce async updates with polite live regions when needed
- Locale-aware shortcuts; show platform-specific symbols

## Animations

- Honor `prefers-reduced-motion`
- Prefer CSS → WAAPI → JS libraries
- Compositor-friendly: `transform`, `opacity`
- Animate only for cause/effect or deliberate delight
- Interruptible; prefer input-driven over autoplay
- Correct transform origin
- Never `transition: all`
- SVG: often transform a wrapper; `transform-box: fill-box; transform-origin: center`

## Layout

- Optical alignment when needed
- Deliberate alignment to grid/baseline/edge
- Balance contrast in icon+text lockups
- Verify mobile, laptop, ultra-wide
- Safe-area insets where relevant
- Prefer flex/grid/intrinsic sizing over JS measurement

## Content and controls

- Inline help before tooltips
- Icons have text equivalents for meaning
- Accessible names even when visuals omit visible labels
- Enter submits when a single primary field flow expects it
- Labels everywhere; label click activates control
- Disable duplicate submits during in-flight requests

## Visual details

- Layered shadows when depth is used; crisp borders help
- Nested radii concentric
- Hue-consistent borders/shadows on tinted surfaces
- Accessible chart palettes
- Interactions increase contrast vs rest
- Match browser UI via theme-color / `color-scheme`
- Avoid animating text nodes directly when smoothing artifacts appear
- Watch gradient banding; prefer techniques that stay clean

## Using this digest

Treat items as a **ship checklist**, not a mandate to add features. Skip items
that do not apply to the surface; do not invent work to “complete the list.”
