# Frameworks, Interaction, And SSR

## React Quick Pattern

```tsx
import { useMemo } from 'react'
import { barY, defineChart } from '@tanstack/charts'
import { scaleBand } from '@tanstack/charts/scales/band'
import { scaleLinear } from '@tanstack/charts/scales/linear'
import { tooltip } from '@tanstack/charts/tooltip'
import { Chart } from '@tanstack/charts/react'

export function LetterFrequencyChart({
  rows,
  accent,
}: {
  rows: readonly { letter: string; frequency: number }[]
  accent: string
}) {
  const definition = useMemo(
    () =>
      defineChart({
        marks: [
          barY(rows, {
            x: 'letter',
            y: 'frequency',
            fill: accent,
          }),
        ],
        x: { scale: () => scaleBand().padding(0.18) },
        y: {
          scale: scaleLinear,
          nice: true,
          grid: true,
          axis: { label: 'Frequency' },
        },
        svgAnimation: true,
        tooltip,
      }),
    [rows, accent],
  )

  return (
    <Chart
      definition={definition}
      height={320}
      ariaLabel="English letter frequencies"
    />
  )
}
```

Keep fixed definitions at module scope. Do not add component generics or casts.

Required props: `definition`, `ariaLabel`. Common: `height` (default `320`), `width`, `aspectRatio`, `initialWidth` (default `640` for SSR), `ariaDescription`, `className`, `style`, `tabIndex`, `onFocusChange`, `onFocusGroupChange`, `onSelect`, `onRender`, `idPrefix`.

### React Entry Points

| Import | Use |
| --- | --- |
| `@tanstack/charts/react` | Default SVG `Chart` (native tooltip, no React body bridge) |
| `@tanstack/charts/react/canvas` | Optional Canvas `Chart` |
| `@tanstack/charts/react/core` | Application `renderer` (for example `motion()`) |
| `@tanstack/charts/react/tooltip` | `Chart` / `CanvasChart` / `RendererChart` with `renderTooltipBody` |

## React Native (Experimental)

```tsx
import { lineY } from '@tanstack/charts/line'
import { defineChart } from '@tanstack/charts/scene'
import { Chart } from '@tanstack/charts/react-native'
import { tooltip } from '@tanstack/charts/react-native/tooltip'
```

Prefer exact subpaths under Metro. Expo 57: `bunx expo install react-native-svg`. Packed Metro fixtures exist; physical-device and screen-reader parity are not currently a release gate.

## Sizing

| Props | Behavior |
| --- | --- |
| No `width`, fixed `height` | Host `width: 100%`; scene uses measured width × height |
| Fixed `width` + `height` | Fixed box and scene |
| `aspectRatio` without height | Measured width / ratio |
| Neither height nor aspect ratio | Default height `320` |

`initialWidth` drives server/hidden first paint. Fixed `height` wins over `aspectRatio`. Outer: `.ts-chart-host` → `.ts-chart-surface` → `svg.ts-chart` or Canvas.

## Tooltips And Focus

Focus modes:

| Mode | Result |
| --- | --- |
| omitted | Nearest painted geometry / point in 2D (`maxFocusDistance` default 48) |
| `nearest-x` / `nearest-y` | Axis-prioritized nearest |
| `group-x` / `group-y` | Containing mark first, then semantic group |
| `focusGroupAngle` | Radial equivalent of `group-x` (`@tanstack/charts/polar`) |
| `false` | Omit generated focus geometry |
| `focusDisabled` | Application gesture owns the surface |

Default pointer focus resolves against **painted** primitives (containment, then affinity). Facet-local primary markers stay bound to the primary point; `whenFocused(..., { match: 'x' \| 'y' })` for synchronized cursors without extra selected points.

Keep the built-in primary focus ring unless authored geometry replaces it (`focusRing: false`).

### Crosshair

```ts
import { crosshair } from '@tanstack/charts/crosshair'

defineChart({
  marks: [
    lineY(rows, { x: 'week', y: 'value', points: true }),
    crosshair({ x: { label: true }, y: false }),
  ],
  focus: 'nearest-x',
  maxFocusDistance: Number.POSITIVE_INFINITY,
  tooltip,
  x: { scale: () => scalePoint<string>().padding(0.2) },
  y: { scale: scaleLinear, grid: true },
})
```

`crosshair` is data-less. It does not add hit targets. Infinite `maxFocusDistance` is an explicit continuous-snap policy.

Datum-bound animated guides: `focusGuideX` / `focusGuideY` from `@tanstack/charts/focus/guide`.

### Tooltip composition (React)

```tsx
import { Chart } from '@tanstack/charts/react/tooltip'

<Chart
  definition={definition}
  ariaLabel="Revenue"
  renderTooltipBody={({ defaultBody, pinned, dismiss }) => (
    <div>
      {defaultBody}
      {pinned ? (
        <button type="button" onClick={dismiss}>
          Close
        </button>
      ) : null}
    </div>
  )}
/>
```

Keep interactive controls behind `pinned`. Theme the DOM tooltip through inherited CSS on the host (from `0.10.0`). Use `portal` to escape `overflow: hidden`.

Keyboard: first point on focus; arrows; Home/End; Enter/Space select/pin; Escape dismisses sticky tooltip. `keyboard: false` forces `tabIndex` `-1`.

## Controlled Interaction Subpaths

These are exact optional entries. They own their D3 implementations where needed. Prefer them over reinventing brush/zoom with private DOM.

```ts
import { brushX } from '@tanstack/charts/interaction/brush'
import { zoomX } from '@tanstack/charts/interaction/zoom'
import { continuousCursor } from '@tanstack/charts/interaction/cursor'
import { handleX } from '@tanstack/charts/interaction/handle'
import { controlledSignal } from '@tanstack/charts/interaction/signal'
import { keyedSelection, whenSelected } from '@tanstack/charts/selection'
```

Definition `cursor` binds an application-owned controller (focus-snapped or free). Add `crosshair(...)` when that cursor needs a visual. `controls` (not `behaviors`) resolve after final scales.

Change callbacks use a context object: `(value, { reason })`, `key(datum, { point })`, `format(value, { point })`.

`pointer: false` when the app decides when inspection begins. Resolve through `host.interaction` / `onRender`:

```ts
const target = interaction.resolvePointer(event.clientX, event.clientY)
interaction.setControlledFocus(target)
interaction.setControlledFocus(null)
```

Disable native focus with `focusDisabled` when a gesture owns the surface.

## Themes

Inherit `currentColor` and `--ts-chart-1` … `--ts-chart-6`. Use definition `theme` only when a chart needs explicit scene colors. Legends are hidden from the SVG a11y tree—also expose meaning via labels, HTML, or a table.

## Animation

Default SVG:

```ts
defineChart({
  marks,
  x,
  y,
  svgAnimation: true,
  // or { duration: 280, easing: 'ease-out', respectReducedMotion: true, resize: false }
})
```

`respectReducedMotion` defaults to `true`. `resize: false` avoids restarting on relayout. Static SVG / SSR / `createChartScene` do not animate.

### Optional `motion()` renderer

Each host has **one** animation owner: default SVG uses `svgAnimation`; `motion()` ignores `svgAnimation` and reads `motion`.

```ts
import { motion, stagger } from '@tanstack/charts/motion'
import { Chart } from '@tanstack/charts/react/core'

const definition = defineChart({
  motion: {
    transition: { type: 'spring', stiffness: 170, damping: 18, mass: 1 },
  },
  marks: [
    lineY(rows, {
      x: 'date',
      y: 'actual',
      key: 'id',
      motion: { transition: { type: 'spring', mass: 1.25 } },
    }),
  ],
  x: { scale: xScale },
  y: { scale: yScale },
})

<Chart
  definition={definition}
  renderer={motion()}
  height={360}
  ariaLabel="Actual revenue"
/>
```

Springs use physical `stiffness` / `damping` / `mass` (no duration). Tween focus-state transitions need `type: 'tween'`. Isolated stagger types: `@tanstack/charts/motion/definition`. Tooltip motion is injected as a renderer capability (`0.14.0`) so split entries still animate.

## SSR And Hydration

- SVG adapters emit complete accessible SVG at `initialWidth`, then adopt on the client.
- Canvas emits an accessible shell; client paints after mount.
- `motion()` adopts server SVG without replaying entrance motion.
- Keep definitions, transforms, formatters, and dimensions deterministic.
- React sanitizes `idPrefix` from `useId()` when omitted.

```ts
import { createChartRuntime, renderChartSvg } from '@tanstack/charts'

const runtime = createChartRuntime()
const scene = runtime.render(definition, { width: 720, height: 400 })
const svg = renderChartSvg(scene, { ariaLabel: 'Daily traffic', idPrefix: 'traffic' })
runtime.destroy()
```

## Other Adapters

Same definition across adapters. React and Octane provide `/canvas` and `/core`. Tooltip bodies: React/Preact/Solid/Octane `renderTooltipBody` (React via `/tooltip`); Vue `#tooltipBody`; Svelte `tooltipBody` snippet; Angular template binding; Lit/Alpine options; RN `/react-native/tooltip`.

`ChartPoint` carries `datum`, keys, group label, typed `xValue`/`yValue`, interval hints, pixel `x`/`y`, and color. Product logic should read `point.datum`.
