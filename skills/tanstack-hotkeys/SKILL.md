---
name: tanstack-hotkeys
description: "Build, review, debug, migrate, or plan TanStack Hotkeys keyboard shortcut systems with current docs. Use for @tanstack/react-hotkeys, @tanstack/hotkeys, useHotkey, useHotkeys, HotkeysProvider, useHotkeySequence, useHotkeySequences, useHotkeyRecorder, useHotkeySequenceRecorder, useHotkeyRegistrations, useHotkeyHint, useHeldKeys, useHeldKeyCodes, useKeyHold, formatForDisplay, findHotkeyConflicts, logical vs physical (Mod+[KeyS]) bindings, recordBy, recorder validation and conflict detection, shortcut palettes, custom shortcut settings, key sequences, scoped hotkeys, input handling, preventDefault, stopPropagation, conflictBehavior, devtools, accessibility, SSR-safe React usage, and cross-platform Mod/Ctrl/Cmd shortcuts."
---

# TanStack Hotkeys

Use this skill when work touches TanStack Hotkeys, especially React keyboard shortcuts, command palettes, shortcut settings UIs, scoped shortcuts, Vim-style sequences, or held-key state.

## Workflow

1. Inspect the local shortcut stack before changing code:
   - Package versions for `@tanstack/react-hotkeys` (`0.12.x`), `@tanstack/hotkeys` (`0.10.x`), devtools, React, framework adapter, and test utilities. Code written for core `0.8` or older may rely on pre-`0.9` recorder and type behavior.
   - Shortcut shape: one-off hotkeys, dynamic shortcut lists, element-scoped shortcuts, global defaults, sequences, user-recorded bindings, or shortcut palettes.
   - Interaction constraints: focused inputs, modals, command palettes, native browser shortcuts, app modes, disabled state, and accessibility.
2. Refresh current docs and package evidence when behavior or versions matter. Start from [source-map.md](references/source-map.md).
3. For installation, ESM/runtime requirements, logical vs physical bindings, `HotkeysProvider`, `useHotkey`, `useHotkeys`, defaults, options, scoped targets, and registrations, use [setup-core.md](references/setup-core.md).
4. For `useHotkeySequence`, `useHotkeySequences`, `useHotkeyRecorder`, `useHotkeySequenceRecorder`, recorder validation/conflicts, held-key hooks, `useHotkeyHint`, and dynamic user shortcuts, use [sequences-recording-state.md](references/sequences-recording-state.md).
5. For display formatting, shortcut palettes, devtools, SSR notes, accessibility, and testing, use [display-production.md](references/display-production.md).

## Implementation Judgment

- Prefer `Mod` for cross-platform app shortcuts; it maps to Command on macOS and Control on Windows/Linux.
- Treat the library as alpha (`0.x`). Verify current docs before relying on edge behavior, especially recorder options, binding types, and sequence handling. Packages are ESM-only since core `0.10`.
- Choose logical bindings (`Mod+S`) for mnemonic shortcuts and physical bindings (`Mod+[KeyS]`, `{ code: 'KeyS', mod: true }`) for position-based controls. A binding has `key` or `code`, never both.
- Use `useHotkey` for fixed shortcuts and `useHotkeys` for dynamic or variable-length lists. Do not call hooks inside loops to register menu data.
- Scope hotkeys with `target` refs for panels, editors, and modals. Ensure the target can receive focus, usually with `tabIndex`.
- Leave `preventDefault` and `stopPropagation` intentional. They default to `true`, which is right for app shortcuts like `Mod+S` but wrong when native browser behavior should remain.
- Respect normal typing. Understand the smart `ignoreInputs` default before forcing single-key shortcuts to fire in text inputs.
- Use `enabled` for mode/state gating. Disabled hotkeys remain registered and visible in devtools; execution is suppressed.
- Add `meta` names, descriptions, and `group` for shortcuts that appear in help screens, command palettes, or devtools.
- Use recorder hooks only for settings UIs where users customize shortcuts. Recorders default to `recordBy: 'code'` (physical strings like `Mod+[KeyS]`); clearing calls only `onClear`. Use `validate`, `detectConflicts`, and `onReject` instead of hand-rolled duplicate checks. Persist normalized `Hotkey` or `HotkeySequence` values, not display labels.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Hotkeys changes, include the relevant subset:

- Typecheck for hotkey strings, `Hotkey`/`HotkeySequence` values, `RawHotkey`/`ParsedHotkey` unions, target refs, and adapter imports.
- Unit or component tests (synthetic events with both `key` and `code`) for callback firing, `enabled`, `ignoreInputs`, `preventDefault`, `stopPropagation`, target focus, and cleanup on unmount.
- Browser smoke for cross-platform display labels, focused input behavior, modal scoping, command palette shortcuts, and sequence timeouts.
- Tests with fake timers for sequence timeout, recorder idle commit, and debounced UI around shortcut capture.
- Devtools inspection for duplicate registrations, disabled registrations, held keys, target scoping, and conflict behavior.
