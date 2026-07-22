# Display, Devtools, Accessibility, And Production

## Table Of Contents

- Display Formatting
- Parsing, Normalization, And Validation
- Devtools
- SSR And Hydration
- Accessibility
- Testing
- Production Checklist

## Display Formatting

Use `formatForDisplay` for platform-aware shortcut labels:

```tsx
import { formatForDisplay } from '@tanstack/react-hotkeys'

function ShortcutBadge({ hotkey }: { hotkey: string }) {
  return <kbd>{formatForDisplay(hotkey)}</kbd>
}
```

Behavior:

- macOS uses symbols by default and spaces between modifiers and keys.
- Windows/Linux use text labels joined with `+`.
- `Mod` displays as Command on macOS and Ctrl on Windows/Linux.

Options:

```tsx
formatForDisplay('Mod+Shift+S', {
  platform: 'mac',
  useSymbols: false,
})
```

Use `formatWithLabels` when UI should show text labels on every platform:

```tsx
import { formatWithLabels } from '@tanstack/react-hotkeys'

formatWithLabels('Mod+S', { platform: 'mac' })
formatWithLabels('Mod+S', { platform: 'windows' })
```

Prefer `<kbd>` for visible keyboard shortcuts.

## Parsing, Normalization, And Validation

Use core helpers when accepting user-authored strings or migrating existing shortcut config:

```tsx
import {
  normalizeHotkey,
  normalizeRegisterableHotkey,
  parseHotkey,
  validateHotkey,
} from '@tanstack/react-hotkeys'

const validation = validateHotkey('Alt+A')
if (!validation.valid) {
  showErrors(validation.errors)
}

const parsed = parseHotkey('Mod+K', 'mac')
const normalized = normalizeHotkey('Ctrl+Shift+s', 'windows')
const registerable = normalizeRegisterableHotkey(
  { key: 'S', mod: true, shift: true },
  'mac',
)
```

`normalizeHotkey` and `normalizeRegisterableHotkey` produce canonical strings. When possible, store canonical `Hotkey` values and derive display labels at render time.

`validateHotkey` returns errors and warnings; warnings can include platform caveats such as Alt plus letter combinations on macOS.

## Devtools

Install React devtools integration:

```sh
bun add @tanstack/react-devtools @tanstack/react-hotkeys-devtools
```

Setup:

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools'

function AppDevtools() {
  return <TanStackDevtools plugins={[hotkeysDevtoolsPlugin()]} />
}
```

Devtools show:

- Registered hotkeys.
- Held keys.
- Programmatic trigger controls.
- Registration details such as target, event type, and conflict behavior.
- Enabled and disabled registrations.

The devtools adapter is normally development-only. React has a production import when intentionally debugging production builds:

```tsx
import { hotkeysDevtoolsPlugin } from '@tanstack/react-hotkeys-devtools/production'
```

## SSR And Hydration

The React `useHotkey` implementation registers listeners inside `useEffect`. It resolves the default target inside the effect and skips registration when `document` is unavailable or a target ref is still null. That makes normal React SSR rendering safe, but shortcuts only become active after hydration and effect execution.

Practical SSR guidance:

- Do not depend on shortcuts for first-render critical behavior.
- Avoid reading browser keyboard state during server render.
- Keep displayed shortcut labels deterministic if server/client platform detection could differ.
- In Next.js or similar Server Component frameworks, put hotkey hooks in client components.
- If target refs are conditionally rendered, confirm the hook registers after the element exists.

## Accessibility

Keyboard shortcuts are accelerators, not replacements for visible controls.

- Keep every shortcut action reachable through normal buttons, links, or menus.
- Avoid single-letter global shortcuts that interfere with typing or assistive workflows.
- Scope modal/editor shortcuts to focused regions where possible.
- Document shortcuts in menus, help dialogs, or command palettes.
- Use `aria-keyshortcuts` for controls when it helps assistive tech expose shortcuts.
- Do not trap Escape unless the active UI owns Escape, such as a modal, menu, or command palette.
- Preserve native browser shortcuts when the app does not clearly own the action.

Example visible control:

```tsx
function SaveButton() {
  useHotkey('Mod+S', () => save(), {
    meta: { name: 'Save', description: 'Save the document' },
  })

  return (
    <button type="button" onClick={save} aria-keyshortcuts="Control+S Meta+S">
      Save <kbd>{formatForDisplay('Mod+S')}</kbd>
    </button>
  )
}
```

## Testing

Recommended coverage:

- Register a shortcut, dispatch `keydown`, and assert the action runs.
- Assert `enabled: false` suppresses callback but keeps UI/registration expectations.
- Assert `preventDefault` and `stopPropagation` when app code depends on them.
- Focus text inputs and verify `ignoreInputs` behavior for single-key shortcuts, `Mod` shortcuts, and Escape.
- Focus a scoped `target` and verify shortcuts fire only inside that region.
- Unmount components and verify callbacks no longer fire.
- Test sequence success and timeout with fake timers.
- Test recorder flows for record, cancel, clear, and input focus behavior.
- Snapshot or browser-test display labels when cross-platform formatting matters.

Event examples:

```tsx
fireEvent.keyDown(document, { key: 's', code: 'KeyS', metaKey: true })
fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' })
fireEvent.keyDown(input, { key: 'k', code: 'KeyK' })
```

When testing `Mod`, set `platform` explicitly on the hook or provider if the test environment's platform is not the scenario under test.

## Production Checklist

Before calling a hotkeys change done:

- Verify package versions against current docs because the library is alpha.
- Use `Mod` for app-wide cross-platform shortcuts.
- Make target regions focusable and browser-test focus behavior.
- Confirm shortcuts do not break text entry, form controls, or contenteditable areas.
- Decide whether `preventDefault` and `stopPropagation` should remain at their defaults.
- Add `meta` for shortcuts that should appear in devtools, help, or palettes.
- Resolve duplicate shortcut conflicts deliberately with `conflictBehavior`.
- Ensure user-recorded shortcuts are normalized, validated, persisted, and displayed separately.
- Keep non-keyboard alternatives available for every action.
- Inspect devtools for duplicate registrations and stale disabled entries during development.
