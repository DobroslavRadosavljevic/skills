# TanStack Hotkeys Source Map

Snapshot date: 2026-10-01.

## Current Package Evidence

Npm `latest` dist-tags verified on this snapshot (published 2026-09-27). Only `latest` exists; there are no alpha/beta/rc dist-tags.

- `@tanstack/hotkeys`: `0.10.1`
- `@tanstack/hotkeys-devtools`: `1.1.1`
- `@tanstack/react-hotkeys`: `0.12.1` (depends on `@tanstack/hotkeys@0.10.1`, `@tanstack/react-store@^0.11.1`; peers `react` / `react-dom >=16.8`; `engines.node >=20`)
- `@tanstack/react-hotkeys-devtools`: `0.9.1`
- `@tanstack/preact-hotkeys`: `0.12.1`
- `@tanstack/preact-hotkeys-devtools`: `0.9.1`
- `@tanstack/solid-hotkeys`: `0.12.1`
- `@tanstack/solid-hotkeys-devtools`: `0.9.1`
- `@tanstack/svelte-hotkeys`: `0.12.1`
- `@tanstack/vue-hotkeys`: `0.12.1`
- `@tanstack/vue-hotkeys-devtools`: `0.9.1`
- `@tanstack/angular-hotkeys`: `0.12.1`
- `@tanstack/lit-hotkeys`: `0.13.1`

`@tanstack/hotkeys-core` was not found on npm. The core package name is `@tanstack/hotkeys`. Framework packages re-export core APIs, so React apps usually install only `@tanstack/react-hotkeys` unless they need direct vanilla JS usage.

The repository README still marks TanStack Hotkeys as **alpha**; minor versions can break APIs. Re-check docs before treating edge behavior as stable.

Changes since the previous snapshot (core `0.8.0` / React `0.10.0`):

- Core `0.9.0` / React `0.11.0` (breaking):
  - `RawHotkey` and `ParsedHotkey` are unions with either `key` or `code`. Use type intersections instead of `interface X extends RawHotkey`.
  - Physical bindings: bracketed codes in strings (`Mod+[KeyS]`, `[NumpadEnter]`) and `{ code: 'KeyS', mod: true }` objects.
  - Recorders default to `recordBy: 'code'` and record physical strings such as `Mod+[KeyS]`. Set `recordBy: 'key'` for logical characters.
  - Clearing a recording calls only `onClear`; `onRecord` is no longer called with an empty value.
  - New: recorder `validate`, `detectConflicts`, `onReject`; `findHotkeyConflicts`; `HotkeyMeta.group`; `matchesHeldModifiers` and `useHotkeyHint`; `formatForDisplay` `parts`, split `useSymbols`, `keyLabels`, `layoutMap`; F1-F24 and more named keys; `platform` option for `parseKeyboardEvent`.
  - Fixes: layout-aware matching, exact matches preferred over physical fallbacks, `Mod++` literal plus, no firing during IME composition or AltGraph entry, recorder keystrokes no longer trigger registered shortcuts.
- Core `0.10.0` / React `0.12.0`: ES2022 ESM-only packages, Node.js 20 minimum, no CommonJS builds, no published `src` or source maps (inspect `dist/*.d.ts`).
- Core `0.10.1`: macOS display orders modifiers Control, Option, Shift, Command (`Mod+Shift+S` shows `⇧ ⌘ S`) without changing normalized strings.
- Devtools `0.9.1`: standalone `HotkeysDevtoolsPanel` renders without props (`theme` defaults to `'dark'`, `devtoolsOpen` to `true`).

Context7 resolved official TanStack Hotkeys docs:

- `/websites/tanstack_hotkeys`: official website docs, high reputation, preferred for current guides.
- `/tanstack/hotkeys`: official repository docs, high reputation, strong snippet coverage.

Refresh commands:

```sh
npm view @tanstack/react-hotkeys version dist-tags
npm view @tanstack/hotkeys version dist-tags
npm view @tanstack/react-hotkeys-devtools version dist-tags
```

## Official Current Docs

Core:

- Overview: `https://tanstack.com/hotkeys/latest/docs/overview`
- Installation: `https://tanstack.com/hotkeys/latest/docs/installation`
- Devtools: `https://tanstack.com/hotkeys/latest/docs/devtools`

React:

- Quick start: `https://tanstack.com/hotkeys/latest/docs/framework/react/quick-start`
- Hotkeys guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/hotkeys`
- Sequences guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/sequences`
- Hotkey recording guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/hotkey-recording`
- Sequence recording guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/sequence-recording`
- Key state tracking guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/key-state-tracking`
- Formatting and display guide: `https://tanstack.com/hotkeys/latest/docs/framework/react/guides/formatting-display`

React references:

- `HotkeysProvider`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/HotkeysProvider`
- `useHotkey`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkey`
- `useHotkeys`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeys`
- `useHotkeySequence`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeySequence`
- `useHotkeySequences`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeySequences`
- `useHotkeyRecorder`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeyRecorder`
- `useHotkeySequenceRecorder`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeySequenceRecorder`
- `useHeldKeys`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHeldKeys`
- `useHeldKeyCodes`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHeldKeyCodes`
- `useKeyHold`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useKeyHold`
- `useHotkeyHint`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeyHint`
- `useHotkeyRegistrations`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeyRegistrations`
- `useDefaultHotkeysOptions`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useDefaultHotkeysOptions`
- `useHotkeysContext`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/functions/useHotkeysContext`
- `UseHotkeyOptions`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/interfaces/UseHotkeyOptions`
- `UseHotkeySequenceOptions`: `https://tanstack.com/hotkeys/latest/docs/framework/react/reference/interfaces/UseHotkeySequenceOptions`

Core references:

- `HotkeyOptions`: `https://tanstack.com/hotkeys/latest/docs/reference/interfaces/HotkeyOptions`
- `SequenceOptions`: `https://tanstack.com/hotkeys/latest/docs/reference/interfaces/SequenceOptions`
- `HotkeyRecorderOptions`: `https://tanstack.com/hotkeys/latest/docs/reference/interfaces/HotkeyRecorderOptions`
- `HotkeySequenceRecorderOptions`: `https://tanstack.com/hotkeys/latest/docs/reference/interfaces/HotkeySequenceRecorderOptions`
- `formatForDisplay`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/formatForDisplay`
- `formatWithLabels`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/formatWithLabels`
- `parseHotkey`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/parseHotkey`
- `normalizeHotkey`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/normalizeHotkey`
- `normalizeHotkeyFromParsed`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/normalizeHotkeyFromParsed`
- `normalizeRegisterableHotkey`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/normalizeRegisterableHotkey`
- `validateHotkey`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/validateHotkey`
- `HotkeyManager`: `https://tanstack.com/hotkeys/latest/docs/reference/classes/HotkeyManager`
- `SequenceManager`: `https://tanstack.com/hotkeys/latest/docs/reference/classes/SequenceManager`
- `KeyStateTracker`: `https://tanstack.com/hotkeys/latest/docs/reference/classes/KeyStateTracker`
- `createSequenceMatcher`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/createSequenceMatcher`
- `findHotkeyConflicts`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/findHotkeyConflicts`
- `matchesHeldModifiers`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/matchesHeldModifiers`
- `parseKeyboardEvent`: `https://tanstack.com/hotkeys/latest/docs/reference/functions/parseKeyboardEvent`

## Raw Docs

Use GitHub raw docs when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/devtools.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/framework/react/guides/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/framework/react/reference/functions/<functionName>.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/framework/react/reference/interfaces/<InterfaceName>.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/reference/functions/<functionName>.md`
- `https://raw.githubusercontent.com/TanStack/hotkeys/main/docs/reference/interfaces/<InterfaceName>.md`
