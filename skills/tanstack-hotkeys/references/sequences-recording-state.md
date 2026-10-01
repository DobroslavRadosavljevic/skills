# Sequences, Recording, And Key State

## Table Of Contents

- Hotkey Sequences
- Dynamic Sequence Lists
- Sequence Options
- Hotkey Recorder
- Recorder Validation And Conflicts
- Sequence Recorder
- Key State Tracking
- Modifier-Held Hints
- User-Editable Shortcuts

## Hotkey Sequences

Use `useHotkeySequence` for Vim-style or multi-step shortcuts:

```tsx
import { useHotkeySequence } from '@tanstack/react-hotkeys'

function VimNavigation() {
  useHotkeySequence(['G', 'G'], () => scrollToTop())
  useHotkeySequence(['D', 'D'], () => deleteLine())
  useHotkeySequence(['D', 'I', 'W'], () => deleteInnerWord(), {
    timeout: 500,
  })
  useHotkeySequence(['Shift+R', 'Shift+T'], () => nextAction())
}
```

Each step may include modifiers. Modifier-only keydown events, IME composition, and automatic key repeats are ignored while a sequence is in progress; they do not advance the sequence, reset it, or extend its timeout. This supports chained modifier chords such as `Shift+R` then `Shift+T`.

Steps use the same binding syntax as single hotkeys. `['G', 'G']` follows the logical letter; `['[KeyG]', '[KeyG]']` follows the physical position. Steps can mix forms, such as `['Mod+[KeyK]', 'C']`.

Sequences can share prefixes:

```tsx
useHotkeySequence(['D', 'D'], () => deleteLine())
useHotkeySequence(['D', 'W'], () => deleteWord())
useHotkeySequence(['D', 'I', 'W'], () => deleteInnerWord())
```

For standalone sequence matching outside React hooks, use `createSequenceMatcher` from the core package (re-exported by `@tanstack/react-hotkeys`).

## Dynamic Sequence Lists

Use `useHotkeySequences` for dynamic lists:

```tsx
import { useHotkeySequences } from '@tanstack/react-hotkeys'

function SequenceCommands({ commands }: { commands: Array<Command> }) {
  useHotkeySequences(
    commands.map((command) => ({
      sequence: command.sequence,
      callback: command.action,
      options: {
        enabled: command.enabled,
        meta: {
          name: command.name,
          description: command.description,
        },
      },
    })),
    { preventDefault: true },
  )
}
```

Empty sequences are skipped. Disabled sequences remain registered and visible in devtools; only execution is suppressed.

## Sequence Options

Sequence options extend hotkey options except `requireReset`, and add:

- `timeout`: milliseconds allowed between consecutive key presses. Default is `1000`.

Common options:

```tsx
useHotkeySequence(['G', 'G'], () => scrollToTop(), {
  timeout: 1500,
  enabled: isVimMode,
  ignoreInputs: true,
  meta: {
    name: 'Go to top',
    description: 'Scroll to the top of the page',
  },
})
```

`HotkeysProvider` can set `hotkeySequence` defaults:

```tsx
<HotkeysProvider defaultOptions={{ hotkeySequence: { timeout: 1500 } }}>
  <App />
</HotkeysProvider>
```

## Hotkey Recorder

Use `useHotkeyRecorder` for settings UIs where users choose a shortcut. Since core `0.9`, recorders default to `recordBy: 'code'` and store physical strings such as `Mod+[KeyS]`; pass them straight to `useHotkey`. Set `recordBy: 'key'` only when the produced character should be stored.

```tsx
import {
  formatForDisplay,
  useHotkeyRecorder,
} from '@tanstack/react-hotkeys'
import type { Hotkey } from '@tanstack/react-hotkeys'

function ShortcutRecorder() {
  const [shortcut, setShortcut] = useState<Hotkey>('Mod+S')

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => setShortcut(hotkey), // e.g. 'Mod+Shift+[KeyS]'
    onCancel: () => closeRecorder(),
    onClear: () => resetShortcut(),
  })

  return (
    <button
      type="button"
      onClick={
        recorder.isRecording
          ? recorder.cancelRecording
          : recorder.startRecording
      }
    >
      {recorder.isRecording
        ? 'Press keys'
        : formatForDisplay(recorder.recordedHotkey ?? shortcut)}
    </button>
  )
}
```

Return value:

- `isRecording`
- `recordedHotkey` (`Hotkey | null`)
- `startRecording`
- `stopRecording`: stop and reset state without calling `onRecord`
- `cancelRecording`: stop, discard, and call `onCancel`

There is no `clearRecording` method. Clearing is keyboard-driven during an active session.

Recording behavior:

- Modifier-only keys wait for a non-modifier key.
- Modifier plus key records the combination.
- Single non-modifier keys record as a single key.
- Escape cancels recording (`onCancel`).
- Backspace or Delete clears and stops recording. Clearing calls only `onClear`; `onRecord` is not called with an empty value (changed in core `0.9`).
- Recorded values use portable `Mod` format: Command+S on macOS records `Mod+[KeyS]`.
- In code mode, Option+S on macOS (producing `ß`) records `Alt+[KeyS]`. AltGraph entry is rejected in code mode; IME composition is ignored.
- Recording keystrokes, repeats, and releases never trigger registered hotkeys or sequences.
- `ignoreInputs` defaults to `true`; Escape still cancels when focused in an input.

## Recorder Validation And Conflicts

Both recorder hooks accept `validate`, `detectConflicts`, and `onReject`. A rejected candidate keeps recording active:

```tsx
const recorder = useHotkeyRecorder({
  detectConflicts: {
    excludeIds: [editingRegistrationId],
    target: document,
    eventType: 'keydown',
  },
  validate: (_hotkey, { parsedHotkey }) =>
    parsedHotkey.modifiers.length > 0 || 'Include a modifier.',
  onReject: ({ reason, message, conflicts }) => {
    showShortcutError(reason, message, conflicts)
  },
  onRecord: (hotkey) => saveBinding(hotkey),
})
```

- `validate` returns `true` to accept, or `false` / a message string to reject.
- `onReject` receives `reason` (`missing-code`, `alt-graph`, `invalid`, `validation`, or `conflict`), `message`, the candidate when available, and conflicting registration views.
- `detectConflicts: true` checks enabled live registrations with the same event type (default `keydown`) on overlapping targets (default `document`). The object form also accepts `excludeIds`, `exclude(registration)`, `scope: 'all'`, and `includeDisabled`. Sequence prefixes are checked too.
- Conflict checks are conservative collision checks, not proof two callbacks will both run.
- Outside recording, use `findHotkeyConflicts(bindingOrSequence, options)`. Without source events it compares binding identity and sequence prefixes only; it does not equate a logical character with a physical position.

## Sequence Recorder

Use `useHotkeySequenceRecorder` for recording multi-chord shortcuts:

```tsx
import {
  formatForDisplay,
  useHotkeySequenceRecorder,
} from '@tanstack/react-hotkeys'
import type { HotkeySequence } from '@tanstack/react-hotkeys'

function SequenceRecorder() {
  const [sequence, setSequence] = useState<HotkeySequence>(['G', 'G'])

  const recorder = useHotkeySequenceRecorder({
    idleTimeoutMs: 2000,
    onRecord: (nextSequence) => setSequence(nextSequence),
  })

  return (
    <button type="button" onClick={recorder.startRecording}>
      {recorder.isRecording
        ? 'Press chords, then Enter'
        : sequence.map((hotkey) => formatForDisplay(hotkey)).join(' ')}
    </button>
  )
}
```

Return value:

- `isRecording`
- `steps`
- `recordedSequence`
- `startRecording`
- `stopRecording`: stop without calling `onRecord`
- `cancelRecording`: stop and call `onCancel`
- `commitRecording`: commit current `steps` (no-op if empty)

Sequence recorders also default to `recordBy: 'code'`, producing steps such as `['[KeyG]', 'Alt+[KeyS]']`, and accept the same `validate(sequence, { events, parsedSequence })`, `detectConflicts`, and `onReject` options. A rejected commit keeps recording active with steps intact.

Options:

- `recordBy`: `'code'` (default) or `'key'`.
- `onRecord(sequence)`: called when a nonempty sequence is committed. Clearing calls only `onClear`.
- `onCancel`
- `onClear`
- `commitKeys`: `enter` by default, or `none`.
- `commitOnEnter`: when `commitKeys` is `enter`, set `false` to record Enter as a chord.
- `idleTimeoutMs`: auto-commit after inactivity after the last completed chord.
- `ignoreInputs`: default `true`.

Behavior:

- Valid chord appends to `steps`.
- Plain Enter commits when `commitKeys` is `enter` and at least one step exists.
- Escape cancels.
- Backspace/Delete removes the last step (without committing), or, when empty, calls only `onClear` and stops.
- Repeats and IME composition never append steps.

## Key State Tracking

Use key state hooks for hold-to-reveal UI, status bars, and debugging:

```tsx
import {
  formatForDisplay,
  useHeldKeyCodes,
  useHeldKeys,
  useKeyHold,
} from '@tanstack/react-hotkeys'

function KeyboardStatus() {
  const heldKeys = useHeldKeys()
  const heldCodes = useHeldKeyCodes()
  const shiftHeld = useKeyHold('Shift')

  return (
    <div>
      {shiftHeld && <span>Shift mode</span>}
      {heldKeys.map((key) => (
        <span key={key}>
          {formatForDisplay(key)} {heldCodes[key]}
        </span>
      ))}
    </div>
  )
}
```

Use `useKeyHold` when only one key matters; it re-renders only when that key's held state changes.

The underlying key state tracker clears held keys on window blur and handles macOS cases where some keyup events may be swallowed while modifiers are held.

For event handlers that need the latest held keys without subscribing to renders, read the shared tracker inside the callback: `getKeyStateTracker().getHeldKeys()`, `isKeyHeld('Space')`, `isAnyKeyHeld([...])`, or `areAllKeysHeld([...])`. Do not destroy the shared tracker on unmount. For mouse or wheel handlers, prefer the event's own `ctrlKey` / `shiftKey` / `altKey` / `metaKey` (note that trackpad pinch can report `ctrlKey`).

## Modifier-Held Hints

Use `useHotkeyHint` to reveal shortcut badges while relevant modifiers are held:

```tsx
import { formatForDisplay, useHotkeyHint } from '@tanstack/react-hotkeys'

function MenuItemHint({ enabled }: { enabled: boolean }) {
  const visible = useHotkeyHint('Alt+Shift+[KeyK]')
  if (!enabled || !visible) return null
  return <kbd>{formatForDisplay('Alt+Shift+[KeyK]')}</kbd>
}
```

- Holding any nonempty subset of the binding's modifiers reveals the hint; an extra modifier hides it. AltGraph never reveals hints.
- Pass `{ exact: true }` to require every modifier, or `{ platform }` matching the registration when overriding detection.
- Re-renders only when visibility changes. It does not register a shortcut or check target focus, so combine it with the action's enabled state.
- Core equivalent: `matchesHeldModifiers(binding, heldKeys, options)`.

## User-Editable Shortcuts

For customizable shortcut settings:

- Store normalized `Hotkey` or `HotkeySequence` values, keeping physical brackets (`Mod+[KeyS]`) intact.
- Display values with `formatForDisplay`, not stored custom labels.
- Recording no longer triggers registered shortcuts, but still gate destructive commands while a settings dialog is open if the UX needs it.
- Validate user-provided strings with `validateHotkey` before saving if users can type shortcuts manually; use recorder `validate` for recorded input.
- Detect duplicates with recorder `detectConflicts` (exclude the binding being edited by registration id) or `findHotkeyConflicts`.
- Keep the initial binding in app state to support a reset button; clearing only calls `onClear`, so the app decides whether that removes or restores a binding.
- Keep action metadata next to stored bindings so shortcut palettes remain readable.
