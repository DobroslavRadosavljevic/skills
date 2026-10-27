# Parity Rubric

Check every point against the installed `@mantine/hooks` source or docs, not memory. Verdict:

- `replace`: all points hold, or every difference is a clear fix.
- `needs-approval`: a difference changes visible behavior or stored data.
- `keep`: Mantine cannot do it, or the swap needs a wrapper that adds more code than it removes.

## Points

1. **Return shape.** Callers get the same values, or call sites are updated in the same batch.
2. **Initial value and SSR.** Same value on the server render and first client paint. Mantine media/storage hooks default to `getInitialValueInEffect: true`; set `initialValue`/`defaultValue` or `getInitialValueInEffect: false` (CSR only) to match old behavior.
3. **Timing.** Same debounce/throttle delay, leading vs trailing edge, and flush/cancel on unmount.
4. **Event target and phase.** Same events (`mousedown` vs `click`, `touchstart`), same target (`window` vs `document` vs element), same capture setting, same set of ignored nodes.
5. **Storage format.** Same key, same serialize/deserialize. A different format loses user data: `needs-approval` plus a migration plan.
6. **Cross-tab and sync.** Same `storage` event sync, or the change is a fix.
7. **Cleanup.** Listeners, timers, and observers are removed on unmount. If the old code leaked, the swap is `better`.
8. **Stable identity.** Callers that depend on stable callbacks or refs still get them.
9. **Edge cases.** Null refs, node swaps, disabled state, hotkeys inside inputs (`tagsToIgnore`), `mod` key on all platforms.
10. **Types.** Use exported Mantine types; no `any` or casts to fit.
