---
name: tailwind-variants
description: "Build, review, debug, migrate, or plan Tailwind Variants class systems with current docs. Use for tailwind-variants, tv, createTV, cn, cnMerge, cx, VariantProps, slots, compoundVariants, compoundSlots, defaultVariants, extend composition, twMergeConfig, /lite build, class overrides, TypeScript props, Tailwind CSS v4 pairing, and upgrades from v0/v1/v2/v3.x."
---

# Tailwind Variants

Use this skill when work touches [Tailwind Variants](https://www.tailwind-variants.org/) (`tv`, slots, compound variants, `extend`, `cn`/`cx`/`cnMerge`, `/lite`, or migrations across TV majors).

## Workflow

1. Inspect the local styling stack before changing code:
   - Packages: `tailwind-variants` version, Tailwind CSS major (`v4` vs `v3`), optional direct `tailwind-merge` usage, Prettier Tailwind plugin.
   - Import path: default `tailwind-variants` vs `tailwind-variants/lite`.
   - Patterns in use: single-element `tv`, slots, `extend`, shared `createTV`/`defaultConfig`, `VariantProps` on components.
2. Refresh docs when versions are unclear or work touches merge config, lite builds, or major upgrades. Start from [source-map.md](references/source-map.md).
3. For install, default vs lite builds, `cn`/`cnMerge`/`cx`, and config, use [setup-core.md](references/setup-core.md).
4. For `variants`, boolean/compound variants, slots, and `compoundSlots`, use [variants-slots.md](references/variants-slots.md).
5. For `extend`, overrides, TypeScript `VariantProps`, and DX tooling, use [composition-typescript.md](references/composition-typescript.md).
6. For conflict resolution, custom `twMergeConfig`, and v0/v1/v2/v3 migrations, use [production-migration.md](references/production-migration.md).

## Implementation Judgment

- Pair **TV v3.x with Tailwind CSS v4.x**. If the project is still on Tailwind CSS v3, use `tailwind-variants` **v0.x** (or upgrade Tailwind first).
- Prefer the **default** build (`import { tv, cn } from 'tailwind-variants'`) for design-system work. Use `/lite` only when bundle size matters and merge is unnecessary.
- On **v3.3.0+**, conflict resolution is built into the default build—do not require `tailwind-merge` solely for TV. Keep `tailwind-merge` only if the app calls it directly.
- Omit `slots` for a string-returning recipe. Passing `slots: {}` enables slot mode (implicit `base` slot)—avoid accidental empty-slot objects.
- Prefer `extend` for typed composition over string-splicing `tv` results into `base` arrays.
- Use `class` / `className` props for consumer overrides; let merge resolve conflicts when enabled.
- Type React/Vue props with `VariantProps<typeof recipe>`. Make variants required with `Omit`/`Required` when defaults are wrong.
- Do **not** use removed `responsiveVariants`. Put responsive prefixes (`md:`, `lg:`) in the class strings themselves.
- Prefer `cx` over deprecated `cnBase`. Prefer `cn` for merged joins; use `cnMerge` only for per-call merge config.

## Verification

Prefer the repo's existing checks. For meaningful Tailwind Variants changes, include the relevant subset:

- Typecheck for `VariantProps`, slot return shapes, and `extend` merges.
- Unit assertions on recipe output strings for critical variant/compound combinations (especially with merge on/off).
- Visual/browser smoke for overridden slots and composed components.
- Bundle check when switching default ↔ `/lite` or adding heavy `twMergeConfig`.
- IntelliSense/`tailwindFunctions: ['tv']` sanity if editors stop completing classes inside `tv`.
