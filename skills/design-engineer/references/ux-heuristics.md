# UX Heuristics and Laws

Apply these as evaluation lenses, not as rigid dogma. Cite the heuristic/law in
findings when it clarifies the issue.

## Nielsen’s 10 usability heuristics

1. **Visibility of system status** — Users always know what the system is doing
   (pending, saved, failed, progress). Prefer timely, proportional feedback.
2. **Match between system and real world** — Familiar language, ordering, and
   metaphors. Avoid internal jargon in UI copy.
3. **User control and freedom** — Easy undo, cancel, escape, back. Confirm or
   offer undo for destructive actions.
4. **Consistency and standards** — Same words and patterns mean the same thing.
   Follow platform and in-product conventions.
5. **Error prevention** — Constrain inputs, confirm high-risk actions, prevent
   invalid states before they happen.
6. **Recognition rather than recall** — Show options, recent items, context; do
   not force users to remember IDs or hidden gestures.
7. **Flexibility and efficiency of use** — Shortcuts, batch actions, and defaults
   for experts without harming novices.
8. **Aesthetic and minimalist design** — Every extra unit of information competes
   with the units that matter. Remove decorative chrome that does not help the job.
9. **Help users recognize, diagnose, and recover from errors** — Plain language,
   specific cause, actionable next step. No blame.
10. **Help and documentation** — Prefer inline help; documentation when needed,
    searchable and task-focused.

## High-leverage UX laws

| Law | Practical takeaway |
| --- | --- |
| **Jakob’s Law** | Users expect your product to work like products they already know. Prefer common patterns for common jobs. |
| **Fitts’s Law** | Make primary targets large enough and close to likely pointer/thumb positions; expand hit areas when visuals are small. |
| **Hick’s Law** | Time to choose grows with number/complexity of choices. Progressive disclosure; smart defaults; group and eliminate. |
| **Miller’s Law** | Working memory is limited. Chunk, hierarchize, and avoid simultaneous unrelated demands. |
| **Doherty Threshold** | Keep interactions feeling responsive (~≤400ms perceived). If slower, show progress and allow useful continuation. |
| **Tesler’s Law** | Irreducible complexity must live somewhere — prefer the system absorbing it over the user. |
| **Postel’s Law** | Be liberal in what you accept (input forgiveness), conservative in what you emit (clear, strict UI states). |
| **Aesthetic-Usability Effect** | Attractive UI is perceived as more usable — craft matters, but never as a cover for broken flows. |
| **Peak-End Rule** | People judge experiences by peaks and endings — invest in success, empty, and error endings. |
| **Von Restorff** | Distinct items are remembered — use sparingly to emphasize the true primary action. |
| **Occam’s Razor** | Prefer the simplest adequate interaction model. |
| **Goal-Gradient** | Progress indicators help completion of multi-step jobs. |

## Mapping laws → UI moves

- Too many peer CTAs → Hick + Von Restorff → one primary, secondary quieter
- Tiny icon-only controls → Fitts → larger hit target + accessible name
- Wizard for 2 fields → Occam / Tesler → inline form
- Spinner for 80ms → Doherty / flicker → delay spinner; avoid flash
- Hover-only critical action → Jakob + a11y → keyboard + touch equivalent
- Novel nav for a standard settings page → Jakob → standard patterns first

## Heuristic evaluation pass

For scoped reviews, walk heuristics 1–10 against the surface and note only real
breaches with evidence. Silence means “checked, no issue” for in-scope
heuristics — do not invent findings to fill the list.
