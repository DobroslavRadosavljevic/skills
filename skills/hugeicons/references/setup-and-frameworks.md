# Hugeicons Setup and Frameworks

Pro package auth, bundler and shadcn config, the non-React renderers, and the MCP server. Versions at snapshot 2026-10-12: `@hugeicons/react` 1.1.10, `@hugeicons/core-free-icons` 4.3.5, `@hugeicons/vue` 1.0.8, `@hugeicons/svelte` 1.1.5 (Svelte 5), `@hugeicons/angular` 1.0.12 (Angular 17.1–22), `@hugeicons/react-native` 1.0.16, `@hugeicons/mcp-server` 0.2.2, `@hugeicons/migrate` 0.1.4.

## Pro Packages

Ten Pro icon packages, one per style. Each one exports the same icon names:

| Family | Packages |
| --- | --- |
| Stroke | `@hugeicons-pro/core-stroke-rounded`, `core-stroke-sharp`, `core-stroke-standard` |
| Solid | `@hugeicons-pro/core-solid-rounded`, `core-solid-sharp`, `core-solid-standard` |
| Duotone | `@hugeicons-pro/core-duotone-rounded`, `core-duotone-standard` |
| Twotone | `@hugeicons-pro/core-twotone-rounded` |
| Bulk | `@hugeicons-pro/core-bulk-rounded` |

Pro packages come from a private registry at `https://npm.hugeicons.com/`. Authenticate with the license key from the `HUGEICONS_LICENSE_KEY` environment variable. Never write the key itself into a committed file.

`.npmrc` (safe to commit, because it only references the variable). Bun reads it too:

```ini
@hugeicons-pro:registry=https://npm.hugeicons.com/
//npm.hugeicons.com/:_authToken=${HUGEICONS_LICENSE_KEY}
```

Bun-only alternative in `bunfig.toml`:

```toml
[install.scopes]
"@hugeicons-pro" = { token = "$HUGEICONS_LICENSE_KEY", url = "https://npm.hugeicons.com/" }
```

Other package managers:

- pnpm 10+ ignores the token line in `.npmrc`. Set it once per machine: `pnpm config set "//npm.hugeicons.com/:_authToken" "$HUGEICONS_LICENSE_KEY"`.
- Yarn 2+ ignores `.npmrc`. Configure `npmScopes` in `.yarnrc.yml` instead.
- CI and hosting: add `HUGEICONS_LICENSE_KEY` as a secret environment variable for the install step.

If you find a literal license key in `bunfig.toml` or `.npmrc`, replace it with the variable reference and tell the user that the key is in git history and should be rotated.

Mixing styles in one file needs import aliases, because the names collide:

```tsx
import { Home01Icon } from "@hugeicons-pro/core-stroke-rounded";
import { Home01Icon as Home01SolidIcon } from "@hugeicons-pro/core-solid-rounded";

<HugeiconsIcon icon={Home01Icon} altIcon={Home01SolidIcon} showAlt={isActive} className="size-5" />;
```

Multicolor styles (bulk, duotone, twotone) use `primaryColor` and `secondaryColor`. Do not pass `strokeWidth` to solid, bulk, duotone, or twotone icons.

```tsx
import { Notification03Icon } from "@hugeicons-pro/core-duotone-rounded";

<HugeiconsIcon icon={Notification03Icon} primaryColor="var(--color-primary)" secondaryColor="var(--color-primary)" className="size-6" />;
```

## Next.js

Next.js can compile barrel packages faster when you list them in `optimizePackageImports`. Add every Pro package the app imports:

```ts
// next.config.ts
const nextConfig = {
  experimental: {
    optimizePackageImports: ["@hugeicons-pro/core-stroke-rounded", "@hugeicons-pro/core-solid-rounded"],
  },
};
export default nextConfig;
```

`HugeiconsIcon` has no hooks or browser APIs, so it renders in Server Components.

## shadcn

Set `"iconLibrary": "hugeicons"` in `components.json`. The shadcn CLI then writes Hugeicons imports into the components it adds. Some shadcn styles mark icons inside buttons with `data-icon="inline-start"` or `data-icon="inline-end"` for spacing; keep that attribute when you edit those components, because `HugeiconsIcon` forwards it to the SVG.

## Vue

```vue
<script setup lang="ts">
import { HugeiconsIcon } from "@hugeicons/vue";
import { Search01Icon } from "@hugeicons/core-free-icons";
</script>

<template>
  <HugeiconsIcon :icon="Search01Icon" :size="20" :stroke-width="2" class="size-5" aria-hidden="true" />
</template>
```

Props use kebab case in templates: `alt-icon`, `show-alt`, `stroke-width`, `absolute-stroke-width`. Supports Vue 2.6+ and 3.

## Svelte

```svelte
<script lang="ts">
  import { HugeiconsIcon } from "@hugeicons/svelte";
  import { Search01Icon } from "@hugeicons/core-free-icons";
</script>

<HugeiconsIcon icon={Search01Icon} size={20} strokeWidth={2} class="size-5" aria-hidden="true" />
```

`@hugeicons/svelte` 1.x needs Svelte 5. Use `class`; the `className` prop still works but is deprecated in the component source (the README still shows `className`).

## Angular

```ts
import { Component } from "@angular/core";
import { HugeiconsIconComponent } from "@hugeicons/angular";
import { Search01Icon } from "@hugeicons/core-free-icons";

@Component({
  selector: "app-search-icon",
  standalone: true,
  imports: [HugeiconsIconComponent],
  template: `<hugeicons-icon [icon]="Search01Icon" [size]="20" [strokeWidth]="2" aria-hidden="true" />`,
})
export class SearchIconComponent {
  protected readonly Search01Icon = Search01Icon;
}
```

Expose each icon as a component field so the template can bind it. Inputs: `icon`, `altIcon`, `showAlt`, `size`, `color`, `strokeWidth`, `absoluteStrokeWidth`, `class`.

## React Native

```bash
bun add @hugeicons/react-native @hugeicons/core-free-icons react-native-svg
```

```tsx
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Search01Icon } from "@hugeicons/core-free-icons";

<HugeiconsIcon icon={Search01Icon} size={20} color="#111827" strokeWidth={2} />;
```

There is no CSS `currentColor` inheritance in React Native, and the default `color` is `black`. Pass `color` from the theme. `className` works only with NativeWind.

## MCP Server

The Hugeicons MCP server searches icon names and returns platform usage. Configure it in the client's MCP config:

```json
{
  "mcpServers": {
    "hugeicons": { "command": "bunx", "args": ["@hugeicons/mcp-server"] }
  }
}
```

Tools: `search_icons` (comma-separated queries, returns kebab names, tags, category), `list_icons` (the full list, which is large, so prefer search), `get_platform_usage` (install and props per platform), `get_icon_glyphs` and `get_icon_glyph_by_style` (font-glyph code points for icon-font usage).

Search results include icons from every category. Search with two or three short synonyms, then convert the kebab name to `PascalCase` + `Icon` and verify the export exists.
