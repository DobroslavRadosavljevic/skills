# Accessibility

Accessibility is part of the design, not a final coat of ARIA.

## Baseline requirements

- **Keyboard** — all flows operable; follow WAI-ARIA authoring patterns for
  complex widgets
- **Focus visible** — `:focus-visible` rings; `:focus-within` for grouped controls
- **Focus management** — trap/move/restore per dialog/drawer patterns; do not
  lose focus on re-render/hydration
- **Semantics first** — `button`, `a`, `label`, `input`, headings, lists, tables
  before ARIA
- **Names** — every control has an accessible name; icon-only buttons have
  descriptive `aria-label`; decorative icons `aria-hidden`
- **Labels** — visible label or programmatic association; clicking label focuses control
- **Hit targets** — ≥24px effective target (prefer expand hit area if visual is
  smaller); ≥44px on mobile touch UIs
- **Zoom** — never disable browser zoom; mobile inputs ≥16px font to avoid iOS zoom traps
- **Contrast** — text and essential icons meet the project’s contrast standard;
  interactive states increase contrast
- **Motion** — honor `prefers-reduced-motion`
- **Live updates** — polite `aria-live` for toasts and inline validation when needed
- **Structure** — one logical heading order; skip link to main content when applicable

## Design implications

- Do not rely on color alone for state (error, selected, busy)
- Do not ship hover-only instructions or actions
- Disabled controls need a story (why disabled; how to enable) when users can reach them
- Error text is associated with fields (`aria-describedby` / analogous)
- Dialogs have titles and clear dismiss; Escape works
- Tabs, menus, comboboxes, listboxes use the correct roles and arrow-key models —
  prefer battle-tested primitives from the project’s library

## Touch and pointer

- `touch-action: manipulation` on controls to reduce double-tap zoom delay when appropriate
- No dead zones: if it looks interactive, the whole visual is interactive
- Drag interactions disable text selection and use `inert` on inappropriate peers while dragging

## QA checklist

- [ ] Tab through entire flow; order matches visual order
- [ ] Focus never disappears; return focus on close
- [ ] Screen-reader names make sense without sight
- [ ] Errors announced / linked to fields
- [ ] Reduced motion OK
- [ ] Zoom 200% usable
- [ ] Touch targets adequate on the target breakpoints
