# Interaction Patterns

Prefer **common, recognizable patterns** for common jobs. Invent only when the
product job is genuinely new or the system already has a signature pattern.

## Pattern selection method

1. Name the **user job** in one sentence.
2. Name the **platform** (web app, marketing site, iOS-like, desktop dense).
3. Find how peers solve that job (shipped apps / in-product cousins).
4. Prefer the pattern family users already know (Jakob’s Law).
5. Adapt to local tokens and components — do not clone skins.
6. Specialize only after the familiar baseline works.

## Pattern catalog (common jobs)

### Navigation & wayfinding

| Job | Prefer | Avoid |
| --- | --- | --- |
| App sections | Persistent side nav or top nav with clear current state | Hidden nav for primary destinations |
| Many destinations | Grouped nav + search / command palette | Mega-menus of equal weight |
| Settings | Single settings surface with side sections or search | Scattered preference modals |
| Deep object | Hierarchical breadcrumbs + local subnav | Orphan pages with only browser back |

### Lists, tables, catalogs

| Job | Prefer | Avoid |
| --- | --- | --- |
| Scan many records | Table or compact list with sticky header | Equal card grid for dense data |
| Compare attributes | Table columns, optional density toggle | Nested cards that hide comparison |
| Browse media | Responsive grid with strong thumbnails | Tiny cropped squares + heavy chrome |
| Bulk act | Row selection + bulk bar | Per-row only when bulk is common |

### Forms & input

| Job | Prefer | Avoid |
| --- | --- | --- |
| Short create/edit | Inline or single modal form | Multi-step wizard |
| Complex onboarding | Stepped flow with progress + save | One endless scrolling form |
| Inline fix | Inline edit / popover for 1–2 fields | Full-page navigation |
| Dangerous submit | Confirm or undo window | Silent irreversible actions |
| Validation | Inline, field-level, on blur/submit appropriately | Only toast after submit |
| Selects / menus | Accessible primitives (listbox, combobox) | Div click menus without keyboard |

### Overlays

| Job | Prefer | Avoid |
| --- | --- | --- |
| Confirm / small task | Modal dialog, focus trapped | Full route for 1 question |
| Contextual detail | Drawer / side panel keeping parent context | Modal that hides the referent |
| Quick actions | Popover / dropdown near the control | Page-level toolbar only |
| Global search / commands | Command palette (⌘K pattern on desktop) | Only buried search pages |

### Feedback & status

| Job | Prefer | Avoid |
| --- | --- | --- |
| Transient success | Toast / inline check; don’t steal focus | Modal for “Saved” |
| Blocking failure | Inline error + recovery | Generic “Something went wrong” only |
| Background work | Progress + allow leave when safe | Spinners that freeze the whole app |
| Optimistic UI | Update immediately; rollback + error on failure | Waiting for every round trip when success is likely |

### Empty, onboarding, permission

| Job | Prefer | Avoid |
| --- | --- | --- |
| First-use empty | Explanation + one primary CTA | Blank void or illustration-only |
| No results | Adjust filters / clear search | Same as first-use empty |
| No permission | Explain why + request access path | Silent hide of the feature |
| Educate | Progressive tips near the action | Multi-page tour before value |

### Marketing / content sections

| Job | Prefer | Avoid |
| --- | --- | --- |
| Hero | Brand + one promise + one CTA + one visual | Card collage + badge pile |
| Features | One idea per section with real UI/context imagery | Icon grid of six equal claims |
| Pricing | Clear tiers, highlighted recommended, honest limits | Dark-pattern compare tables |
| Social proof | Specific and credible | Fake logos / vague quotes |

## Component choice rules

1. **Use the design system component** if it exists for the job.
2. **Compose primitives** (dialog, popover, tabs, menu) before building custom
   behavior — especially for focus and keyboard.
3. **Match control to choice type**
   - 2–5 exclusive options → segmented control / radio
   - Many options → select / combobox / command list
   - Independent toggles → checkbox / switch (switch for immediate settings)
4. **Links vs buttons** — navigation is a link (`<a>` / router `Link`); actions
   that perform are buttons. Never fake navigation with `<button>` or `<div>`.
5. **Menus that need more input** end with an ellipsis (“Rename…”).

## Microcopy patterns

- Buttons: verb-first (“Save changes”, “Delete project”)
- Destructive: name the object (“Delete `acme-prod`”)
- Errors: what happened + how to fix
- Empty: why it’s empty + what to do next
- Loading labels keep the original verb (“Saving…” not only a spinner)

## Anti-patterns checklist

- Card wrapping every piece of text
- Multiple competing primary buttons
- Hover-only critical actions
- Custom checkbox/radio without accessible primitives
- Modal stacked on modal
- Disabling paste, zoom, or browser back as “UX”
- Infinite onboarding before first value
- Pattern novelty for standard CRUD
