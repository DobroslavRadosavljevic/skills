---
name: hugeicons
description: "Add, choose, style, review, or migrate Hugeicons icons with @hugeicons/react 1.1 and @hugeicons/core-free-icons 4.3 (plus Vue, Svelte, Angular, React Native renderers and @hugeicons-pro/* packages). Use for HugeiconsIcon, icon={...}, strokeWidth, absoluteStrokeWidth, altIcon/showAlt, primaryColor/secondaryColor, Tailwind size classes, accessible icons, icon-only buttons, finding the right icon name, Pro registry setup (npm.hugeicons.com, HUGEICONS_LICENSE_KEY, .npmrc, bunfig.toml), shadcn iconLibrary hugeicons, Lucide-to-Hugeicons migration, @hugeicons/migrate, and the Hugeicons MCP server. Use whenever code imports @hugeicons or the user asks for an icon in a project that uses Hugeicons."
---

# Hugeicons

Hugeicons splits rendering from icon data. A renderer package (`@hugeicons/react`, `@hugeicons/vue`, ...) exports one `HugeiconsIcon` component. Icon packages (`@hugeicons/core-free-icons`, `@hugeicons-pro/core-*`) export plain SVG data arrays such as `Home01Icon`. You always pass an icon object to the component.

## Workflow

1. Check the setup: renderer package and version, free vs Pro icon packages, how the repo sizes icons (Tailwind `size-*` classes or `size` prop), the `strokeWidth` it uses, and any app-level `Icon` wrapper. Match the existing convention. Do not add a second icon library.
2. Find the icon name. Do not guess names.
   - With the Hugeicons MCP server: `search_icons` with a few comma-separated terms (`"trash, delete"`), then pick from the returned kebab names.
   - Without it: search the type declarations in the installed package (see [Find and verify names](#find-and-verify-names)).
3. Convert the kebab name to the export: `home-01` → `Home01Icon`, `arrow-right-02` → `ArrowRight02Icon`, `information-circle` → `InformationCircleIcon`. Confirm the export exists before you use it.
4. Render it with `HugeiconsIcon` and the repo's conventions. For other frameworks, Pro setup, or migrations, read the matching reference below.

## React Usage

```bash
bun add @hugeicons/react @hugeicons/core-free-icons
```

```tsx
import { HugeiconsIcon } from "@hugeicons/react";
import { Delete02Icon, Search01Icon } from "@hugeicons/core-free-icons";

export function SearchButton() {
  return (
    <button type="button" className="inline-flex items-center gap-2">
      <HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} aria-hidden />
      Search
    </button>
  );
}

export function DeleteButton({ onDelete }: { onDelete: () => void }) {
  return (
    <button type="button" aria-label="Delete item" onClick={onDelete}>
      <HugeiconsIcon icon={Delete02Icon} className="size-4" strokeWidth={2} aria-hidden />
    </button>
  );
}
```

`HugeiconsIcon` props (`@hugeicons/react` 1.1.10). It also forwards `ref` and every SVG attribute (`className`, `style`, `aria-*`, `data-*`):

| Prop | Default | Behavior |
| --- | --- | --- |
| `icon` | required | Icon data from an icon package. |
| `size` | `24` | Sets the `width` and `height` attributes. CSS width/height (Tailwind `size-4`) overrides it. |
| `color` | `currentColor` | Sets the SVG `color`. Paths use `currentColor`, so Tailwind `text-*` classes work too. |
| `strokeWidth` | none | When set, also forces `stroke="currentColor"` on the SVG and every path. When unset, each path keeps its own width (1.5 in the free set). |
| `absoluteStrokeWidth` | `false` | Scales `strokeWidth` by `24 / size` so strokes keep the same pixel width at any size. It reads the numeric `size` prop only. |
| `altIcon`, `showAlt` | none, `false` | Renders `altIcon` instead of `icon` when `showAlt` is true. |
| `primaryColor`, `secondaryColor` | none | Colors for multicolor Pro styles (bulk, duotone, twotone). Secondary paths are the ones with an `opacity` attribute. |
| `disableSecondaryOpacity` | `false` | Removes the default opacity on secondary paths. |

## Rules

- Prefer `className="size-4"` (or the repo's size scale) over `size={16}` in Tailwind projects. Keep icons the same size as the text next to them.
- Pass `strokeWidth` only to stroke styles (free icons, `core-stroke-*`). On solid, bulk, duotone, or twotone icons it adds an outline to filled shapes and makes them look heavier.
- `absoluteStrokeWidth` has no effect when the size comes from CSS classes, because `size` stays at `24`. Use it only with a numeric `size`.
- Mark decorative icons `aria-hidden`. Give icon-only controls an accessible name on the button (`aria-label`), not on the SVG. Do not use an icon as the only signal for a status or error; add text or a tooltip.
- Use named imports from the package root. Never `import * as Icons`. That blocks tree-shaking and pulls in the whole set (~5 MB).
- For icon pickers or icons chosen at runtime, load one icon at a time: `(await import("@hugeicons/core-free-icons/Home01Icon")).default`. Do not build a name → icon map of the whole package.
- Type icon props and config maps with `IconSvgElement` from `@hugeicons/react` (or `typeof SomeIcon`).
- For two-state icons (filled when active, outline otherwise), use `altIcon` + `showAlt` instead of a conditional `icon`.
- In new code, use the canonical `*Icon` export names, not the Lucide-style aliases (see migration below).

## Wrapper Components

Add an app-level wrapper only when the repo has many call sites with the same defaults. Keep it thin:

```tsx
import { HugeiconsIcon, type HugeiconsIconProps } from "@hugeicons/react";
import { cn } from "@/lib/utils";

export function Icon({ className, strokeWidth = 2, ...props }: HugeiconsIconProps) {
  return <HugeiconsIcon aria-hidden className={cn("size-4 shrink-0", className)} strokeWidth={strokeWidth} {...props} />;
}
```

If a repo already uses `HugeiconsIcon` directly everywhere, do not add a wrapper as part of an unrelated change.

## Find and verify names

Search the installed type declarations when no MCP server is available:

```bash
rg -o "declare const [A-Za-z0-9]*Trash[A-Za-z0-9]*Icon" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts
```

Verify one exact name:

```bash
rg -w "Delete02Icon" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts
```

Name tips:

- Many icons come in numbered variants (`home-01` to `home-13`, `settings-01` to `settings-05`). Pick the one that matches the visual style already used nearby.
- The free set has 6,000+ icons, all in the stroke-rounded style. Pro packages use the same export names in each style, so `Home01Icon` exists in `core-stroke-rounded`, `core-solid-rounded`, and so on.
- Common picks: close `Cancel01Icon`, check `Tick02Icon`, chevrons `ArrowDown01Icon`/`ArrowRight01Icon`, search `Search01Icon`, delete `Delete02Icon`, edit `PencilEdit02Icon`, add `Add01Icon`, menu `Menu01Icon`, settings `Settings01Icon`, user `UserIcon`, loading `Loading03Icon`. Verify each before use.

## References

- [setup-and-frameworks.md](references/setup-and-frameworks.md): Pro packages and registry auth (npm, Bun, pnpm, CI), Next.js and shadcn config, Vue, Svelte, Angular, React Native, and the MCP server.
- [migration.md](references/migration.md): Lucide and other icon libraries to Hugeicons, the `@hugeicons/migrate` tool, Lucide-name aliases, and the old `hugeicons-react` package.

## Verification

- Typecheck. A wrong icon name fails as a missing export.
- Check the rendered size and stroke weight next to existing icons in the same view.
- Check icon-only buttons for an accessible name.
- For Pro packages, confirm a clean install works with only `HUGEICONS_LICENSE_KEY` set (no token committed).
