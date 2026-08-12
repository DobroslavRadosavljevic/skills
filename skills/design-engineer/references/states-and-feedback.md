# States and Feedback

Happy-path-only UI is unfinished UI. Design the **state lattice** for every
in-scope surface before calling the work done.

## Core states

| State | User need | Design notes |
| --- | --- | --- |
| **Idle** | Understand what to do | Clear primary action; sensible defaults |
| **Loading** | Know the system is working | Delay spinner ~150–300ms; min visible ~300–500ms; keep labels (“Saving…”) |
| **Empty (first use)** | Start successfully | Explain + one CTA; not a blank void |
| **Empty (no results)** | Adjust query | Differ from first-use; offer clear filters / reset |
| **Partial** | Act on incomplete data | Show what’s available; flag what’s missing |
| **Error** | Recover | Specific cause + next step; preserve input |
| **Success** | Confirm & continue | Quiet when frequent; celebrate rare milestones |
| **Disabled** | Know why / how to enable | Prefer preventing invalid action with explanation |
| **Permission denied** | Understand access | Path to request access; don’t silently hide if discoverable |
| **Offline / degraded** | Continue or retry | Cached data when safe; honest limitations |
| **Conflict / stale** | Resolve versions | Explain conflict; offer reload or merge path |
| **Skeleton vs blank** | Perceived speed | Skeleton mirroring layout beats empty flash |

## Feedback hierarchy

1. **Inline** next to the thing (field errors, row status) — default
2. **Section / banner** for page-level issues
3. **Toast** for transient, non-blocking confirmations
4. **Modal** only when the user must decide before continuing

Do not use modals for routine “Saved” if a quieter pattern works.

## Buttons and async actions

- On submit: prevent double submit; show progress; keep original label semantics
- Ellipsis for in-progress (“Publishing…”) and for actions needing more input (“Move…”)
- Optimistic updates when success is likely; rollback + error on failure; undo when destructive

## URL and persistence

- Persist filters, tabs, pagination, and open panels in the URL when share/refresh/back matter
- Restore scroll on back/forward when the platform allows

## Micro-timing

- Doherty: aim for ≤400ms perceived response; if slower, show progress
- Tooltip groups: delay the first; subsequent peers can be immediate
- Autofocus single primary input on desktop; rarely on mobile (keyboard layout shift)

## State design checklist

For the chosen solution, explicitly mark which states apply and how they look:

```text
[ ] Idle
[ ] Loading (first paint + subsequent refresh)
[ ] Empty first-use
[ ] Empty no-results
[ ] Error (inline + boundary)
[ ] Success
[ ] Disabled / permission
[ ] Offline / retry (if relevant)
```

If a state is N/A, say so. “Forgot” is not N/A.
