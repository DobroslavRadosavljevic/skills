# Setup And Core Hooks

## Table Of Contents

- Installation
- Provider Defaults
- `useHotkey`
- `useHotkeys`
- Defaults And Options
- Target Scoping
- Metadata And Registrations
- Core Manager Access

## Installation

React apps:

```sh
bun add @tanstack/react-hotkeys
```

React devtools:

```sh
bun add @tanstack/react-devtools @tanstack/react-hotkeys-devtools
```

The React package re-exports the core `@tanstack/hotkeys` APIs. Install the core package directly only for vanilla JavaScript or non-adapter usage:

```sh
bun add @tanstack/hotkeys
```

## Provider Defaults

Use `HotkeysProvider` to set defaults for all hotkey, sequence, and recorder hooks in a subtree:

```tsx
import { HotkeysProvider } from '@tanstack/react-hotkeys'

function Root() {
  return (
    <HotkeysProvider
      defaultOptions={{
        hotkey: { preventDefault: true },
        hotkeySequence: { timeout: 1500 },
        hotkeyRecorder: { onCancel: () => logCancel() },
        hotkeySequenceRecorder: { idleTimeoutMs: 2000 },
      }}
    >
      <App />
    </HotkeysProvider>
  )
}
```

Hook-level options override provider defaults.

## `useHotkey`

Use `useHotkey` for fixed shortcuts:

```tsx
import { useHotkey } from '@tanstack/react-hotkeys'

function Editor() {
  useHotkey(
    'Mod+S',
    (event, context) => {
      saveDocument()
      console.log(context.hotkey)
      console.log(context.parsedHotkey)
    },
    {
      meta: {
        name: 'Save',
        description: 'Save the current document',
      },
    },
  )

  return <textarea />
}
```

The callback receives the original `KeyboardEvent` and a context object with:

- `hotkey`: original registered hotkey string.
- `parsedHotkey`: parsed representation.

Use `Mod` for portable shortcuts:

```tsx
useHotkey('Mod+S', () => save())
useHotkey({ key: 'S', mod: true }, () => save())
useHotkey({ key: 'S', mod: true, shift: true }, () => saveAs())
```

The React hook syncs callbacks and options on every render to avoid stale closures and unregisters on unmount.

## `useHotkeys`

Use `useHotkeys` for many shortcuts or dynamic lists:

```tsx
import { useHotkeys } from '@tanstack/react-hotkeys'

function MenuShortcuts({ items }: { items: Array<MenuItem> }) {
  useHotkeys(
    items.map((item) => ({
      hotkey: item.shortcut,
      callback: item.action,
      options: {
        enabled: item.enabled,
        meta: {
          name: item.label,
          description: item.description,
        },
      },
    })),
    { preventDefault: true },
  )
}
```

Options merge in this order:

1. `HotkeysProvider` defaults.
2. `useHotkeys` common options.
3. Per-definition options.

Dynamic array identity is based on array index plus normalized hotkey string. Reordering re-registers entries.

## Defaults And Options

Default hotkey behavior:

```tsx
{
  enabled: true,
  preventDefault: true,
  stopPropagation: true,
  eventType: 'keydown',
  requireReset: false,
  ignoreInputs: undefined,
  target: document,
  platform: undefined,
  conflictBehavior: 'warn',
}
```

Important options:

- `enabled`: soft-disable. The registration remains visible in devtools, but the callback does not run.
- `preventDefault`: default `true`; use `false` when native browser behavior should remain.
- `stopPropagation`: default `true`; use `false` when parent handlers should receive the event.
- `eventType`: `keydown` or `keyup`.
- `requireReset`: fire once per physical press; require release before firing again.
- `ignoreInputs`: input filtering. When unset, smart defaults apply.
- `target`: element, document, window, React ref, or null.
- `platform`: force `mac`, `windows`, or `linux`, mainly for tests or display parity.
- `conflictBehavior`: `warn`, `error`, `replace`, or `allow`.
- `meta`: name, description, and custom fields via declaration merging.

Smart input behavior:

- Single-key shortcuts and Shift/Alt combinations are ignored in text inputs, textareas, selects, and contenteditable elements by default.
- Ctrl/Meta shortcuts and Escape fire in inputs by default.
- Button-type inputs such as button, submit, and reset are not ignored.

Be explicit when the UX is sensitive:

```tsx
useHotkey('K', () => openCommandPalette(), { ignoreInputs: true })
useHotkey('Enter', () => submit(), { ignoreInputs: false })
```

## Target Scoping

Attach shortcuts to an element when they should only work in a panel, modal, or editor:

```tsx
import { useRef } from 'react'
import { useHotkey } from '@tanstack/react-hotkeys'

function Panel() {
  const panelRef = useRef<HTMLDivElement>(null)

  useHotkey('Escape', () => closePanel(), { target: panelRef })

  return (
    <div ref={panelRef} tabIndex={0}>
      Press Escape while this panel is focused.
    </div>
  )
}
```

Make ref targets focusable. A target listener only receives keyboard events when the target or its children have focus.

## Metadata And Registrations

Attach metadata for help screens, palettes, and devtools:

```tsx
useHotkey('Mod+K', () => openCommandPalette(), {
  meta: {
    name: 'Command palette',
    description: 'Open the command palette',
  },
})
```

Read live registrations with `useHotkeyRegistrations`:

```tsx
import { useHotkeyRegistrations } from '@tanstack/react-hotkeys'

function ShortcutHelp() {
  const { hotkeys, sequences } = useHotkeyRegistrations()

  return (
    <ul>
      {hotkeys.map((registration) => (
        <li key={registration.hotkey}>
          <kbd>{registration.hotkey}</kbd> {registration.meta?.name}
        </li>
      ))}
      {sequences.map((registration) => (
        <li key={registration.sequence.join(' ')}>
          <kbd>{registration.sequence.join(' ')}</kbd> {registration.meta?.name}
        </li>
      ))}
    </ul>
  )
}
```

## Core Manager Access

Most apps should use hooks. If imperative access is needed:

```tsx
import { getHotkeyManager } from '@tanstack/react-hotkeys'

const manager = getHotkeyManager()

manager.isRegistered('Mod+S')
manager.getRegistrationCount()
```

The manager attaches event listeners per target element.
