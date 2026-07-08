# Tailwind Setup And Migration

## Table Of Contents

- [Choose The Integration](#choose-the-integration)
- [Vite](#vite)
- [PostCSS](#postcss)
- [Tailwind CLI](#tailwind-cli)
- [webpack](#webpack)
- [Framework Guides](#framework-guides)
- [v3 To v4 Upgrade](#v3-to-v4-upgrade)
- [Manual Migration Hazards](#manual-migration-hazards)
- [JavaScript Config Compatibility](#javascript-config-compatibility)
- [Verification](#verification)

## Choose The Integration

Start from the project that already exists:

- Vite app: prefer `@tailwindcss/vite`.
- PostCSS-owned framework or build: use `@tailwindcss/postcss`.
- Simple static site or custom build: use `@tailwindcss/cli`.
- webpack project: consider `@tailwindcss/webpack`, especially for large builds or framework paths that support webpack loaders.
- Framework with an official Tailwind guide: follow the framework guide first.

Do not add multiple integration paths unless the project genuinely has multiple CSS pipelines.

## Vite

Install:

```sh
npm install tailwindcss @tailwindcss/vite
```

Configure:

```ts
import { defineConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [tailwindcss()],
});
```

Import Tailwind in the CSS entry:

```css
@import "tailwindcss";
```

Use Vite integration for frameworks like React Router, SvelteKit, Laravel, Nuxt, and SolidJS when their guide points that way.

## PostCSS

Install:

```sh
npm install tailwindcss @tailwindcss/postcss postcss
```

Configure:

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

Import Tailwind in CSS:

```css
@import "tailwindcss";
```

In v4, the PostCSS plugin is no longer the `tailwindcss` package. Use `@tailwindcss/postcss`.

PostCSS imports and vendor prefixing are handled for Tailwind v4, so many projects can remove `postcss-import` and `autoprefixer` if they were only present for Tailwind.

## Tailwind CLI

Install:

```sh
npm install tailwindcss @tailwindcss/cli
```

Create an input CSS file:

```css
@import "tailwindcss";
```

Run:

```sh
npx @tailwindcss/cli -i ./src/input.css -o ./src/output.css --watch
```

In v4, the CLI package is `@tailwindcss/cli`, not the `tailwindcss` package.

## webpack

Install:

```sh
npm install tailwindcss @tailwindcss/webpack
```

Example webpack loader chain:

```js
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = {
  plugins: [new MiniCssExtractPlugin()],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, "css-loader", "@tailwindcss/webpack"],
      },
    ],
  },
};
```

Use the dedicated loader when the project owns webpack configuration and the framework supports it. It avoids routing Tailwind through PostCSS solely for compilation and can materially improve large webpack builds.

## Framework Guides

Use official framework guides for framework-owned setup. The docs include guides for environments such as Next.js, Angular, Astro, Laravel, React Router, TanStack Start, SvelteKit, Nuxt, Ruby on Rails, Phoenix, Qwik, Rspack, Solid, and others.

When a framework imports CSS for you, verify where the CSS entry is included rather than adding duplicate link tags.

## v3 To v4 Upgrade

Preferred path:

1. Check browser requirements. Tailwind v4 targets Safari 16.4+, Chrome 111+, and Firefox 128+.
2. Run the upgrade tool in a new branch or otherwise isolated diff:

```sh
npx @tailwindcss/upgrade
```

3. Use Node.js 20 or newer for the upgrade tool.
4. Review the diff carefully.
5. Run the app and inspect real screens in the browser.

Do not run the upgrade tool blindly in a dirty worktree. It can update dependencies, migrate config to CSS, and rewrite template files.

## Manual Migration Hazards

Replace v3 directives:

```css
/* v3 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* v4 */
@import "tailwindcss";
```

Use the dedicated integration packages:

- `@tailwindcss/vite` for Vite.
- `@tailwindcss/postcss` for PostCSS.
- `@tailwindcss/cli` for CLI.
- `@tailwindcss/webpack` for webpack.

Known v4 behavior changes:

- `border-*` and `divide-*` default to `currentColor` instead of the old gray default. Add a base-layer compatibility rule only when preserving v3 behavior is required.
- Default ring width/color changed. Preserve v3 behavior with `--default-ring-width` and `--default-ring-color` only when needed.
- Deprecated opacity utilities were removed. Use slash opacity modifiers such as `bg-black/50`.
- Deprecated names such as `flex-shrink-*`, `flex-grow-*`, and `overflow-ellipsis` should use modern names like `shrink-*`, `grow-*`, and `text-ellipsis`.
- Several shadow, drop-shadow, and blur sizes were renamed. Check the upgrade guide's full table before applying bulk replacements.
- Prefixes now behave like variants and belong at the beginning of class names.
- The important modifier belongs at the end of the class name in v4.
- Gradient variant behavior preserves other gradient stops; use `via-none` when explicitly unsetting a middle stop.
- `theme()` is retained for compatibility but deprecated; use CSS theme variables when possible.

## JavaScript Config Compatibility

Tailwind v4 does not auto-detect JavaScript config files. Load a legacy config explicitly:

```css
@config "../../tailwind.config.js";
```

Compatibility limits:

- `corePlugins`, `safelist`, and `separator` are not supported in v4 JavaScript config compatibility.
- Use `@source inline()` for safelisting in v4.
- CSS-defined theme variables, utilities, and variants take precedence where merging is supported.
- Prefer migrating theme tokens, custom utilities, and variants into CSS over extending legacy config forever.

## Verification

After setup or migration:

- Run the CSS build or framework build.
- Check generated CSS is loaded by the app.
- Search for old directives and legacy packages.
- Inspect representative light/dark, responsive, hover/focus, disabled, invalid, and content-heavy screens.
- Watch for unexpected Preflight interactions with third-party widgets.
- Confirm editor/formatter class sorting still works if the project uses the Prettier plugin.
