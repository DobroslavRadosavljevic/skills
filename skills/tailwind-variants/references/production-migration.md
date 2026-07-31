# Conflict Resolution And Migration

## Conflict resolution (default build)

Merging is available on `tv`, `createTV`, `cn`, and `cnMerge`. Not on `cx` or `/lite`.

```ts
import { tv, cn } from 'tailwind-variants'

cn('px-2', 'px-4') // "px-4"
tv({ base: 'px-2', variants: { size: { lg: 'px-4' } } })({ size: 'lg' }) // "px-4"
```

Disable per call/factory:

```ts
tv({ base: 'px-2' }, { twMerge: false })
cnMerge('px-2', 'px-4')({ twMerge: false }) // "px-2 px-4"
```

### Custom `twMergeConfig`

Prefer `{ extend, override }`. Legacy flat `theme` / `classGroups` fields still normalize into `extend`.

```ts
import { createTV, type TWMergeConfig } from 'tailwind-variants'

const twMergeConfig = {
  extend: {
    classGroups: {
      elevation: ['elevation-low', 'elevation-high'],
    },
  },
} satisfies TWMergeConfig

const tv = createTV({ twMergeConfig })
```

If the app already uses `extendTailwindMerge`, reuse the **config object**, not the merge function return value. Do not pass `getDefaultConfig()` dumps or factory functions as `twMergeConfig`.

For design-system wrappers, merge project `twMergeConfig` with per-call config while keeping `twMerge: true` by default (see Config docs advanced wrapper pattern).

## When to choose `/lite`

- Bundle size is critical
- No conflicting utilities in recipes / callers
- You merge classes elsewhere (or not at all)

Lite ignores merge options and does not export `cnMerge`.

## vs CVA

Use Tailwind Variants when you need **slots**, **compound slots**, **`extend` composition**, or **built-in Tailwind conflict resolution**. Prefer CVA when you only need single-element variants without those features ([comparison](https://www.tailwind-variants.org/docs/comparison)).

## Migration map

### to v3.3.0

- Conflict resolution ships in the default build → `bun add tailwind-variants` is enough for TV merge.
- Remove unused `tailwind-merge` if nothing else imports it.
- Prefer `{ extend, override }` for configs.
- Remember empty `slots: {}` enables slot mode.

### v3.2.2

- `cn(...)` returns a string (default merge).
- Per-call config moves to `cnMerge(...)(config)`.

### v3.2.0

- Add `cx`; replace `cnBase` → `cx`.
- Default-build `cn` merges conflicts (`twMerge` default true).
- `defaultConfig` exported as a mutable value.
- **`responsiveVariants` removed** — use responsive prefixes in classes.

### v2 → v3

- Choose default vs `/lite` entry.
- Historical note: early v3 still needed `tailwind-merge` for default merge; **superseded by v3.3.0** built-in resolution.
- Prefer `cn` over `cnBase`.

### v1 → v2

- `tailwind-merge` became optional peer (bundle win if merge off).
- APIs otherwise stable; performance improved.

### Tailwind CSS v3 projects

Stay on **TV v0.x** or upgrade Tailwind to v4 before adopting TV v3.

## Upgrade checklist

1. Confirm Tailwind major ↔ TV major pairing.
2. Grep for `responsiveVariants`, `cnBase`, `cn(...)(`, `@/lite` vs default mismatches.
3. Align all imports to one build (default or lite).
4. Reuse or rewrite `twMergeConfig` as `{ extend, override }`.
5. Typecheck `VariantProps` / `extend` recipes.
6. Spot-check compound variants and slot overrides visually.
7. Measure bundle if introducing default merge or dropping `/lite`.
