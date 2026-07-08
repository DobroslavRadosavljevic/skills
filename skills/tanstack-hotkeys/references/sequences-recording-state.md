# Sequences, Recording, And Key State

## Table Of Contents

- Hotkey Sequences
- Dynamic Sequence Lists
- Sequence Options
- Hotkey Recorder
- Sequence Recorder
- Key State Tracking
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

Each step may include modifiers. Modifier-only keydown events while a sequence is in progress are ignored; they do not advance the sequence and do not reset it. This supports chained modifier chords such as `Shift+R` then `Shift+T`.

Sequences can share prefixes:

```tsx
useHotkeySequence(['D', 'D'], () => deleteLine())
useHotkeySequence(['D', 'W'], () => deleteWord())
useHotkeySequence(['D', 'I', 'W'], () => deleteInnerWord())
```

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

Use `useHotkeyRecorder` for settings UIs where users choose a shortcut:

```tsx
import {
  formatForDisplay,
  useHotkeyRecorder,
} from '@tanstack/react-hotkeys'
import type { Hotkey } from '@tanstack/react-hotkeys'

function ShortcutRecorder() {
  const [shortcut, setShortcut] = useState<Hotkey>('Mod+S')

  const recorder = useHotkeyRecorder({
    onRecord: (hotkey) => setShortcut(hotkey),
    onCancel: () => closeRecorder(),
    onClear: () => resetShortcut(),
  })

  return (
    <button
      type="button"
      onClick={
        recorder.isRecording
          ? recorder.stopRecording
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
- `recordedHotkey`
- `startRecording`
- `stopRecording`
- `cancelRecording`
- `clearRecording`

Recording behavior:

- Modifier-only keys wait for a non-modifier key.
- Modifier plus key records the combination.
- Single non-modifier keys record as a single key.
- Escape cancels recording.
- Backspace or Delete clears the current hotkey.
- Recorded values use portable `Mod` format.
- `ignoreInputs` defaults to `true`; Escape still cancels when focused in an input.

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
- `stopRecording`
- `cancelRecording`
- `commitRecording`

Options:

- `onRecord(sequence)`: called on commit, including `[]` when cleared with no steps.
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
- Backspace/Delete removes the last step, or clears and records `[]` if empty.

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

## User-Editable Shortcuts

For customizable shortcut settings:

- Store normalized `Hotkey` or `HotkeySequence` values.
- Display values with `formatForDisplay`, not stored custom labels.
- Disable registered shortcuts while recording to avoid triggering app commands.
- Validate user-provided strings before saving if users can type shortcuts manually.
- Detect duplicates with the local shortcut registry or by checking registration conflicts.
- Keep action metadata next to stored bindings so shortcut palettes remain readable.
