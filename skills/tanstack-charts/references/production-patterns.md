# Production Patterns

## Pre-Alpha Caution

`@tanstack/charts@0.0.2` is pre-alpha. Prefer verifying signatures against current docs/reference before shipping public APIs or large migrations. Keep charts behind clear version pins and parity tests.

## AI Authoring Sequence

Follow this order when generating or reviewing chart code:

1. State the analytical question in one sentence.
2. Identify field semantic types (quantitative, temporal, ordinal, identifier).
3. Choose the smallest mark composition.
4. Choose explicit scales for positional and color channels.
5. Decide which preparation belongs in app code, D3, SQL, or server.
6. Add `ariaLabel` and default focus/tooltip behavior.
7. Verify a static scene before animation or rich interaction.
8. Extend only at documented boundaries (`createMark`, focus strategy, spatial index, custom renderer).

Generated code must include exact imports/subpaths, datum interfaces, scale construction, complete definition, adapter/host usage, meaningful `ariaLabel`, and stable identity. Do not invent undeclared variables, casts, or private source imports.

Request template:

```text
Question:
Data shape and semantic field types:
Required encodings:
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

## Large Data

Prefer bounded encodings over indexing every raw point when many rows share pixels (aggregates, bins, hexbin, density, sampling). Add a `ChartSpatialIndexFactory` only when many independently focusable points remain necessary. Keep transforms visible in ordinary functions and memoize through app reactivity.

## Canvas And Custom Surfaces

```tsx
import { Chart as CanvasChart } from '@tanstack/react-charts/canvas'
```

Use Canvas when paint volume or path density needs it. Expect no server pixel paint—only the accessible shell. For application-owned surfaces, use `@tanstack/react-charts/core` with an explicit `renderer`.

Gradients: declare on the definition and use resource-aware SVG (`renderChartSvgWithResources` / `renderSvg`) when needed; Canvas consumes declared gradients without the SVG resource serializer.

## Custom Marks And Interaction Ownership

Use `createMark` only when geometry cannot be composed from built-ins. Custom marks must materialize scale channels, emit stable keyed nodes, and optionally typed interaction points.

Brush, zoom, scrubbers, and playback are application-owned. Invert pixels through a copied chart scale from `host.getScene()` / render context, then rebuild the definition with a configured domain. Disable native nearest-point focus when it conflicts with the gesture.

## Export

Use `@tanstack/charts/export` for SVG serialization/download and browser image export when product needs static assets. Keep export paths in tests if they are user-facing.

## Migrating From Another Library

Do not translate component names. Inventory semantics first (rows, transforms, domains, missing-value policy, tooltips, keyboard, animation identity, a11y, bundle budgets).

Reliable order:

1. Static fixed-size chart
2. Match scales, marks, guides
3. Responsive sizing / automatic margins
4. Tooltip and keyboard focus
5. Selection and controlled viewport
6. Memoized live definitions
7. Animation
8. Bundle/performance gates
9. Remove old renderer after parity suite passes

Preserve proven transforms initially. Keep a temporary renderer switch only as a verification tool with a removal gate.

### Archived `react-charts` Specifics

Old API centered on `options.data` series wrappers, `primaryAxis` / `secondaryAxes`, and element types on axes. New API:

- Mark-local data arrays
- Explicit D3 scales on `x` / `y`
- Geometry chosen by mark functions (`lineY`, `barY`, …)
- Stacking prepared as intervals, not `stacked: true` axis flags

Reject any solution that reintroduces the archived option object shape into `@tanstack/react-charts@0.0.x`.

## Bundle Discipline

- Import only needed marks and D3 modules.
- Prefer root imports for ordinary apps; use subpaths for hard isolation.
- Keep polar/geo/Canvas/export off the critical path until required.
- Measure production consumers when adding a capability; official comparison positions TanStack Charts as a small cold-page gzip relative to Recharts/ECharts/Plot in their pinned suite—re-measure for the app's actual charts.

## Production Checklist

- Correct packages (`@tanstack/*-charts`), not archived `react-charts`
- Question, encodings, and scales are explicit
- Definition memoization matches captured values
- Empty, constant-domain, and missing-value policies are intentional
- `ariaLabel` present; keyboard/pointer parity verified
- Light and dark readable via inheritance or theme
- Update/reorder/resize preserve keys and selection where expected
- Destroy/unmount cleans host resources
- Migration parity gates green before deleting the previous renderer
