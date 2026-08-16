# Overlays (dialog, sheet, command, toast)

**Job:** Interrupt as lightly as possible.

| Overlay | Use | Don’t |
| --- | --- | --- |
| `Dialog` | Short task, fits without scroll (`sm:max-w-lg`) | Long CRUD, tables |
| `AlertDialog` | Irreversible confirm | Tips |
| `Sheet` | Edit beside a list; mobile filters; settings panel | Tiny 2-button confirms |
| `Drawer` | Mobile stand-in for Dialog | Desktop primary if Sheet is the pattern |
| `Command` | Global jump (⌘K) | Replacing settings |
| Toast / Sonner | Transient confirmation | Errors the user must fix in a field |

## Structure

```text
Header: Title (required) + Description (required or visually hidden)
Body
Footer: Cancel outline/ghost  →  primary right
```

`showCloseButton={false}` only if footer has Close/Cancel. No nested dialogs.
Unsaved Sheet/Dialog: confirm before dismiss.

Command: `CommandInput` → `CommandList` → groups → `CommandEmpty`. Selecting an
item **is** the action.

## Density

Dialog: `gap-4`, `p-6`. Sheet: sticky footer on long forms. Command: `text-sm`,
shortcuts `CommandShortcut`. Overlay dim `bg-black/40`–`/60`.

## z-index

Primitives often share `z-50`. Put toasts at `z-[60]` so they are not trapped
behind a dialog portal.

## Motion

Enter 200–250ms, exit 150–200ms, `transform` + `opacity`. Under
`prefers-reduced-motion`, skip travel; keep open/closed state.

Sources: https://ui.shadcn.com/docs/components/dialog · https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
