# TanStack Virtual Source Map

Snapshot date: 2026-10-09.

## Current Package Evidence

Npm evidence from this snapshot (`dist-tags.latest`):

- `@tanstack/react-virtual`: `3.14.14` (published 2026-10-09). Depends on `@tanstack/virtual-core` exactly `3.18.0`.
- `@tanstack/virtual-core`: `3.18.0` (published 2026-10-09).
- `@tanstack/vue-virtual`: `3.13.40`, `@tanstack/solid-virtual`: `3.13.41` (same day).
- Release tags the same day also include `marko-virtual@3.16.0`, `lit-virtual@3.14.3`, `angular-virtual@6.1.0`, `svelte-virtual@3.13.40`.
- React peer range: `react` and `react-dom` `^16.8.0 || ^17.0.0 || ^18.0.0 || ^19.0.0`.
- `@tanstack/virtual-core` is ESM (`"type": "module"`, `"sideEffects": false`).
- Other dist-tags (`alpha`, `beta`) point to `3.0.0-*` prereleases from the 3.0 cycle. Ignore them.

v4 status:

- No v4 is published. `latest` is 3.x on every adapter.
- The upstream git branch `v4` exists but its last commit is from February 2025 and its `virtual-core` version is `3.12.0`. It is 205 commits behind `main`. Treat it as abandoned scaffolding, not a release candidate.
- Re-check with `npm view @tanstack/react-virtual dist-tags` before telling a user a v4 exists or does not.

Package notes from the changelog (react-virtual and virtual-core releases):

- core `3.15.0` (2026-05-20): iOS momentum handling, no compensation of re-measures during backward scroll, `takeSnapshot()`, typed-array measurement storage.
- core `3.16.0` (2026-05-25): `anchorTo`, `followOnAppend`, `scrollEndThreshold`, `scrollToEnd`, `getDistanceFromEnd`, `isAtEnd`.
- react `3.14.0` (2026-06-01): `directDomUpdates`, `directDomUpdatesMode`, `containerRef`.
- core `3.17.0` (2026-06-02): `useCachedMeasurements`.
- core `3.17.1` to `3.17.11` (2026-06 to 2026-09): backward-scroll and streaming fixes, iOS deferral fixes, `gap` invalidation, multi-lane performance, smooth-scroll survival across prepend, scroll reset cleanup.
- react `3.14.13` (2026-09-14): skip `flushSync` for the notify raised from `measureElement`.
- core `3.18.0` (2026-10-09): `cancelScroll()`, `scrollToIndex` end alignment respects `scrollPaddingEnd`.
- react `3.14.14` (2026-10-09): `directDomUpdates` rows mounted by a child re-render are positioned.

React Compiler evidence:

- GitHub issue `#736` (closed 2026-06-02) and `#1119` (open at this snapshot): React lists `@tanstack/react-virtual` as an incompatible library. Maintainer comments recommend `directDomUpdates` and `overflow-anchor: none`.

## Official Docs

Overview:

- Introduction: `https://tanstack.com/virtual/latest/docs/introduction`
- Installation: `https://tanstack.com/virtual/latest/docs/installation`
- React adapter (`useVirtualizer`, `useWindowVirtualizer`, `useFlushSync`, `directDomUpdates`): `https://tanstack.com/virtual/latest/docs/framework/react/react-virtual`
- Chat guide (end anchoring): `https://tanstack.com/virtual/latest/docs/chat`
- Text measurement with Pretext: `https://tanstack.com/virtual/latest/docs/pretext`

Core API:

- Virtualizer options and instance: `https://tanstack.com/virtual/latest/docs/api/virtualizer`
- VirtualItem: `https://tanstack.com/virtual/latest/docs/api/virtual-item`

React examples (website):

- `https://tanstack.com/virtual/latest/docs/framework/react/examples/fixed`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/variable`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/dynamic`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/padding`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/scroll-padding`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/sticky`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/infinite-scroll`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/smooth-scroll`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/window`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/table`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/chat`
- `https://tanstack.com/virtual/latest/docs/framework/react/examples/pretext`

## Raw Docs And Source

Use GitHub raw files when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/virtual/main/docs/api/virtualizer.md`
- `https://raw.githubusercontent.com/TanStack/virtual/main/docs/api/virtual-item.md`
- `https://raw.githubusercontent.com/TanStack/virtual/main/docs/framework/react/react-virtual.md`
- `https://raw.githubusercontent.com/TanStack/virtual/main/docs/chat.md`
- `https://raw.githubusercontent.com/TanStack/virtual/main/docs/pretext.md`
- `https://raw.githubusercontent.com/TanStack/virtual/main/examples/react/<example>/src/main.tsx` (examples: `chat`, `dynamic`, `fixed`, `infinite-scroll`, `padding`, `pretext`, `scroll-padding`, `smooth-scroll`, `sticky`, `table`, `variable`, `window`)
- Core source: `https://github.com/TanStack/virtual/blob/main/packages/virtual-core/src/index.ts`
- React adapter source: `https://github.com/TanStack/virtual/blob/main/packages/react-virtual/src/index.tsx`
- Releases and changelog: `https://github.com/TanStack/virtual/releases`

The npm tarballs (`npm pack @tanstack/virtual-core`, unpacked into an empty directory) contain `src/index.ts`; reading it is the most reliable check of defaults such as `overscan: 1`, `isScrollingResetDelay: 150`, and `scrollEndThreshold: 1`.

## TanStack Table Examples

Used for the table integration reference (Table v9 `9.2.x` examples depend on `@tanstack/react-virtual ^3.14.13`):

- Virtualized rows: `https://github.com/TanStack/table/tree/main/examples/react/virtualized-rows`
- Virtualized columns: `https://github.com/TanStack/table/tree/main/examples/react/virtualized-columns`
- Virtualized infinite scrolling: `https://github.com/TanStack/table/tree/main/examples/react/virtualized-infinite-scrolling`
- Experimental variant: `https://github.com/TanStack/table/tree/main/examples/react/virtualized-rows-experimental`

## Related References

- TanStack Query infinite queries: `https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries`
- WAI-ARIA Authoring Practices, grid pattern: `https://www.w3.org/WAI/ARIA/apg/patterns/grid/`
- WAI-ARIA Authoring Practices, listbox pattern: `https://www.w3.org/WAI/ARIA/apg/patterns/listbox/`
- ResizeObserver (MDN): `https://developer.mozilla.org/en-US/docs/Web/API/ResizeObserver`
- Pretext text measurement library: `https://github.com/chenglou/pretext`

## Local Verification Notes

- The jsdom testing recipes in the production reference were run on 2026-10-09 with `react@19.3.0`, `react-dom@19.3.0`, `jsdom@30.1.2`, and `@tanstack/react-virtual@3.14.14` under Bun. Results: no stubs rendered 0 rows; stubbed `observeElementRect` with `measureElement: () => 50` rendered 9 rows of a 1000-row list; a stubbed rect with zero-size measured rows threw `Maximum update depth exceeded`; setting `scrollTop = 500` and dispatching `scroll` rendered indexes 9 through 18.
- Accessibility patterns come from the WAI-ARIA Authoring Practices, not from TanStack docs. The table spacer-row variant is a community pattern that predates the current official table example.

Refresh this source map when package versions drift, when `anchorTo` or `directDomUpdates` semantics change, when React Compiler support is addressed upstream, or when a v4 prerelease appears under a dist-tag.
