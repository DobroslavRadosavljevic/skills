# Production Patterns

## Pre-Alpha Caution

`@tanstack/charts@0.3.1` is pre-alpha. Prefer verifying signatures against current docs/reference before shipping public APIs or large migrations. Keep charts behind clear version pins and parity tests. API moved quickly from `0.0.2` → `0.1.0` → `0.2.0` → `0.3.x`—do not copy `0.0.x` snippets (`tooltip: true`, flat axis labels, `groupScale`, `/portable`) into new code.

## Breaking Migration Notes (Within TanStack Charts)

### From `0.0.2`

| Old | Current |
| --- | --- |
| `tooltip: true` | `tooltip` from `@tanstack/charts/tooltip` |
| `tooltip: { portal: true, … }` | `{ use: tooltip, portal, … }` with `portal` from `@tanstack/charts/tooltip/portal` |
| Flat `label` / `ticks` / `tickRotate` / `labelOffset` on axes | Nested `axis: { label, ticks, tickLabels }` |
| Manual stack intervals only; no auto-stack | Length channels stack implicitly; `layout: group()` / `layout: stack()` |
| React `renderTooltipBody` on root `Chart` | Import `Chart` from `@tanstack/react-charts/tooltip` |

### From `0.1.0`

- Replace `@tanstack/charts/portable` with `@tanstack/charts/universal`.

### From `0.2.x` → `0.3.x`

- Move axis presentation under composable `axis` / ticks / tickLabels.
- Prefer implicit bar/area stacking; use transforms for reusable prep.
- Use `whenFocused` for focus decoration instead of renderer-specific hacks.
- Prefer `layout: group()` over obsolete `groupScale` snippets if they appear in search/Context7.

## AI Authoring Sequence

Follow this order when generating or reviewing chart code:

1. State the analytical question in one sentence.
2. Identify field semantic types (quantitative, temporal, ordinal, identifier).
3. Choose the smallest mark composition (and stack/group/transform ownership).
4. Choose explicit scales for positional and color channels; nest guide options under `axis`.
5. Decide which preparation belongs in TanStack transforms, D3, SQL, or server.
6. Add `ariaLabel` and the `tooltip` extension (plus focus mode if multi-series).
7. Verify a static scene before animation or rich interaction.
8. Extend only at documented boundaries (`createMark`, focus strategy, spatial index, custom renderer).

Generated code must include exact imports/subpaths, datum interfaces, scale construction, complete definition, adapter/host usage, meaningful `ariaLabel`, tooltip extension imports when interactive, and stable identity. Do not invent undeclared variables, casts, private source imports, or archived `react-charts` APIs.

Request template:

```text
Question:
Data shape and semantic field types:
Required encodings:
Transforms vs mark layout:
Interaction and selection:
Responsive container:
Accessibility summary:
Expected update behavior:
Bundle constraints:
Acceptance checks:
```

Ask before inventing aggregations or selection semantics that change data meaning. Use documented presentation defaults when information is missing.

## Testing Layers

Test at the narrowest owning layer:

1. **Scene** — `createChartScene(definition, { width, height })` for domains, geometry, keys, margins, focus metadata (DOM-free).
2. **SVG string** — `renderChartSvg` for aria name/description, resource IDs, element kinds, finite coordinates.
3. **DOM host** — mount for resize, pointer/keyboard, sticky tooltips, selection, reconciliation, destroy cleanup.
4. **Visual** — screenshots for label overlap, curves, themes; always pair with semantic assertions.
5. **A11y** — meaningful name, keyboard parity with pointer, reduced motion, table/summary when exact values matter.

Diagnose failures in order: prepared rows → channels → scale domains/ranges → `scene.chart` bounds → nodes/points → renderer → mounted CSS.

Always `destroy()` hosts in tests and assert no leaked observers/tooltips/listeners.

### Accessibility Checklist

- Required `ariaLabel`; optional `ariaDescription` for non-obvious gaps/units.
- Surrounding HTML heading, units, time range, and exact-value table when needed.
- Never encode essential state with color alone.
- Keep `respectReducedMotion: true` unless a stronger product policy exists.
- Tooltips are supplemental; essential info must not require hover.
- Pinned tooltip bodies: controls only while `pinned`; Escape/`dismiss()` restore chart focus.

## Large Data

Prefer bounded encodings over indexing every raw point when many rows share pixels (aggregates, bins, hexbin, density, sampling). Prefer TanStack `bin*` / `groupBy` or D3 prep, then marks. Add a `ChartSpatialIndexFactory` only when many independently focusable points remain necessary. Keep transforms visible in ordinary functions and memoize through app reactivity.

## Canvas And Custom Surfaces

```tsx
import { Chart as CanvasChart } from '@tanstack/react-charts/canvas'
```

Use Canvas when paint volume or path density needs it. Expect no server pixel paint—only the accessible shell. For application-owned surfaces, use `@tanstack/react-charts/core` with an explicit `renderer`.

Gradients: declare on the definition and use resource-aware SVG (`renderChartSvgWithResources` / `renderSvg`) when needed; Canvas consumes declared gradients without the SVG resource serializer.

## Custom Marks And Interaction Ownership

Use `createMark` only when geometry cannot be composed from built-ins. Custom marks must materialize scale channels, emit stable keyed nodes, and optionally typed interaction points.

Brush, zoom, scrubbers, and playback are application-owned. Invert pixels through a copied chart scale from `host.getScene()` / render context, then rebuild the definition with a configured domain. Disable native nearest-point focus with `focusDisabled` when it conflicts with the gesture.

## Export

Use `@tanstack/charts/export` for SVG serialization/download and browser image export when product needs static assets. Keep export paths in tests if they are user-facing.

## Migrating From Another Library

Do not translate component names. Inventory semantics first (rows, transforms, domains, missing-value policy, tooltips, keyboard, animation identity, a11y, bundle budgets).

Reliable order:

1. Static fixed-size chart
2. Match scales, marks, guides (`axis` nesting)
3. Responsive sizing / automatic margins
4. Tooltip and keyboard focus (`tooltip` / `portal` extensions)
5. Selection and controlled viewport
6. Memoized live definitions
7. Animation
8. Bundle/performance gates
9. Remove old renderer after parity suite passes

Preserve proven transforms initially. Keep a temporary renderer switch only as a verification tool with a removal gate.

### Archived `react-charts` Specifics

Old API centered on `options.data` series wrappers, `primaryAxis` / `secondaryAxes`, and element types on axes. New API:

- Mark-local data arrays
- Explicit D3 (or compact) scales on `x` / `y`
- Geometry chosen by mark functions (`lineY`, `barY`, …)
- Implicit stacking or `layout: stack()` / prepared intervals—not `stacked: true` axis flags

Reject any solution that reintroduces the archived option object shape into `@tanstack/react-charts@0.x`.

## Bundle Discipline

- Import only needed marks, transforms, and D3 modules.
- Prefer root imports for ordinary apps; use subpaths for hard isolation.
- Keep polar/geo/Canvas/export/tooltip-portal off the critical path until required.
- Prefer granular `@tanstack/charts/transform/*` when only one transform family is needed.
- Official comparison (workspace `c422a2c`, baseline `2026-07-31`): TanStack Charts cold-page gzip ~26.58–32.08 KiB vs Chart.js ~44.7–58.2, Plot ~83–92, Recharts/ECharts ~153–173—re-measure for the app's actual charts.

## Production Checklist

- Correct packages (`@tanstack/*-charts` on a coherent version line), not archived `react-charts`
- No stale `0.0.x` APIs (`tooltip: true`, flat axis labels, `groupScale`, `/portable`)
- Question, encodings, scales, and transform/layout ownership are explicit
- Definition memoization matches captured values
- Empty, constant-domain, and missing-value policies are intentional
- `ariaLabel` present; keyboard/pointer parity verified
- Light and dark readable via inheritance or theme
- Update/reorder/resize preserve keys and selection where expected
- Destroy/unmount cleans host resources
- Migration parity gates green before deleting the previous renderer
