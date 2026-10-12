# Migrating to Hugeicons

Use this when a repo moves from Lucide, Heroicons, Tabler, Phosphor, Feather, or Font Awesome to Hugeicons, or when it still uses the old `hugeicons-react` package.

## Plan

1. Find every icon import and count them. `rg -n "from ['\"](lucide-react|@heroicons/react|@tabler/icons-react|@phosphor-icons/react|react-feather)" --glob '*.{ts,tsx}'`
2. Decide the free or Pro set, the stroke width (Lucide uses 2; Hugeicons free icons default to 1.5), and the size convention.
3. Run the official tool in dry-run mode first, then review the diff.
4. Fix the leftovers by hand, typecheck, and compare the screens that changed.
5. Remove the old icon package.

## `@hugeicons/migrate`

```bash
bunx @hugeicons/migrate scan .
```

```bash
bunx @hugeicons/migrate plan .
```

```bash
bunx @hugeicons/migrate apply . --report
```

```bash
bunx @hugeicons/migrate apply . --write --style free
```

- `scan` lists detected icon libraries and usage counts.
- `plan` shows the mappings, the files that will change, and the packages to install.
- `apply` without `--write` is a dry run. `--report` writes an HTML report. `--style` is `free` (default) or `pro`.
- `revert` restores from the backup that `apply --write` made.

It detects Lucide, Font Awesome, Heroicons, Feather, Tabler, and Phosphor. Review every mapping: automatic matches pick a similar icon, not always the one a designer would pick.

## Manual Lucide Mapping

Lucide renders components (`<Search className="size-4" />`). Hugeicons renders data through one component:

```tsx
// Before
import { Search } from "lucide-react";
<Search className="size-4" />;

// After
import { HugeiconsIcon } from "@hugeicons/react";
import { Search01Icon } from "@hugeicons/core-free-icons";
<HugeiconsIcon icon={Search01Icon} className="size-4" strokeWidth={2} />;
```

`@hugeicons/core-free-icons` also exports about 2,000 Lucide-style aliases (`Search`, `X`, `Check`, `ChevronDown`, `Trash2`, `Settings`, `Home`, `House`, ...). Each one points at a Hugeicons icon:

| Lucide name | Hugeicons export |
| --- | --- |
| `X` | `Cancel01Icon` |
| `Check` | `Tick01Icon` |
| `ChevronDown` | `ArrowDown01Icon` |
| `ChevronRight`, `ArrowRight` | `ArrowRight01Icon` |
| `Search` | `Search01Icon` |
| `Plus` | `Add01Icon` |
| `Trash` / `Trash2` | `Delete01Icon` / `Delete02Icon` |
| `Pencil` | `PencilIcon` |
| `Settings` | `Settings01Icon` |
| `Home`, `House` | `Home01Icon` |
| `Menu` | `Menu01Icon` |
| `User` | `UserIcon` |
| `Info` | `InformationCircleIcon` |
| `AlertCircle` | `AlertCircleIcon` |
| `ExternalLink` | `ArrowUpRight01Icon` |
| `Copy` | `Copy01Icon` |
| `Eye` / `EyeOff` | `ViewIcon` / `ViewOffIcon` |
| `MoreHorizontal` | `MoreHorizontalIcon` |
| `LogOut` | `Logout01Icon` |
| `Calendar` | `Calendar01Icon` |
| `Mail` | `Mail01Icon` |
| `Sun` / `Moon` | `Sun01Icon` / `MoonIcon` |

The aliases are data, not components, so `<Search />` still fails. You must still wrap them in `HugeiconsIcon`. They are useful as a lookup table and as a temporary bridge. Write the canonical `*Icon` names in finished code, because they match the docs, the MCP search results, and the Pro packages. Not every Lucide name has an alias (for example `Loader2`); search for those.

Find what an alias points to:

```bash
rg -o "[A-Za-z0-9]+ as Trash2\b" node_modules/@hugeicons/core-free-icons/dist/types/index.d.ts
```

The package also exports `<Name>FreeIcons` aliases (`AbacusFreeIcons`). Do not use them in app code.

## Visual Differences

- Lucide draws on a 24×24 grid with a 2px stroke. To keep the same visual weight, pass `strokeWidth={2}` (or set it once in a wrapper).
- Spinners: Lucide's `Loader2` + `animate-spin` maps to `Loading03Icon` + `animate-spin`. Check that the chosen icon is rotationally symmetric.
- Lucide `size` and `strokeWidth` props work the same way on `HugeiconsIcon`. Lucide `absoluteStrokeWidth` maps to the same prop name, which only works with a numeric `size`.

## Old `hugeicons-react` Package

`hugeicons-react` (0.x) exported one React component per icon. It is replaced by `@hugeicons/react` + `@hugeicons/core-free-icons`:

```tsx
// Before
import { Home01Icon } from "hugeicons-react";
<Home01Icon size={20} />;

// After
import { HugeiconsIcon } from "@hugeicons/react";
import { Home01Icon } from "@hugeicons/core-free-icons";
<HugeiconsIcon icon={Home01Icon} size={20} />;
```

Icon names stay the same, so the change is mechanical: move the import and wrap each usage.
