# Tailwind CSS Directives And Theme

## Table Of Contents

- [CSS-First Configuration](#css-first-configuration)
- [Theme Variables](#theme-variables)
- [Theme Namespaces](#theme-namespaces)
- [Using Theme Variables](#using-theme-variables)
- [Source Detection Directives](#source-detection-directives)
- [Custom Utilities](#custom-utilities)
- [Variants In CSS](#variants-in-css)
- [Apply And Reference](#apply-and-reference)
- [Legacy Directives](#legacy-directives)
- [Functions](#functions)
- [Custom CSS Layers](#custom-css-layers)

## CSS-First Configuration

Tailwind v4 configures most project customizations in CSS:

```css
@import "tailwindcss";

@theme {
  --font-display: "Satoshi", "sans-serif";
  --breakpoint-3xl: 120rem;
  --color-brand-500: oklch(0.72 0.11 178);
  --ease-snappy: cubic-bezier(0.2, 0, 0, 1);
}
```

Prefer this model for new v4 work.

## Theme Variables

Theme variables are special CSS variables declared with `@theme`.

Use `@theme` when a design token should create utilities or variants. Use ordinary `:root` CSS variables when a variable is just a runtime value and should not create Tailwind APIs.

Rules:

- Define theme variables at top level, not nested in selectors or media queries.
- Override an existing token by redefining it.
- Remove all default tokens in a namespace by setting the namespace to `initial`.
- Use `@theme static` when all theme CSS variables must always be emitted.
- Use `@theme inline` when a token references another variable and the generated utility should inline the resolved value.

## Theme Namespaces

Common theme variable namespaces:

- `--color-*`: color utilities.
- `--font-*`: font-family utilities.
- `--text-*`: font-size utilities.
- `--font-weight-*`: font-weight utilities.
- `--tracking-*`: letter-spacing utilities.
- `--leading-*`: line-height utilities.
- `--breakpoint-*`: responsive breakpoint variants.
- `--container-*`: container query variants and size utilities.
- `--spacing-*`: spacing and sizing utilities.
- `--radius-*`: border-radius utilities.
- `--shadow-*`, `--inset-shadow-*`, `--drop-shadow-*`: shadow utilities.
- `--blur-*`: blur utilities.
- `--perspective-*`: perspective utilities.
- `--aspect-*`: aspect-ratio utilities.
- `--ease-*`: transition timing utilities.
- `--animate-*`: animation utilities.

Defining a variable in a namespace creates corresponding utility classes or variants.

## Using Theme Variables

Use theme variables in custom CSS:

```css
.card {
  border-radius: var(--radius-lg);
  padding: --spacing(6);
  box-shadow: var(--shadow-sm);
}
```

Use theme variables in arbitrary values:

```html
<div class="bg-(--color-brand-500) shadow-[var(--shadow-xl)]"></div>
```

In JavaScript, read resolved CSS variable values with `getComputedStyle` when a runtime value is required.

## Source Detection Directives

Explicitly include a source:

```css
@import "tailwindcss";
@source "../node_modules/@acmecorp/ui-lib";
```

Set scan base path:

```css
@import "tailwindcss" source("../src");
```

Exclude a source:

```css
@source not "../src/components/legacy";
```

Disable automatic detection and register all sources:

```css
@import "tailwindcss" source(none);
@source "../admin";
@source "../shared";
```

Safelist generated utilities:

```css
@source inline("{hover:,focus:,}underline");
```

Safelist ranges:

```css
@source inline("{hover:,}bg-red-{50,{100..900..100},950}");
```

Exclude generated utilities:

```css
@source not inline("{hover:,focus:,}bg-red-{50,{100..900..100},950}");
```

## Custom Utilities

Use `@utility` to add a custom utility that participates in Tailwind's variants:

```css
@utility tab-4 {
  tab-size: 4;
}
```

For functional utilities, use Tailwind's `--value()` mechanism when the utility accepts arguments. Support theme values, bare values, and arbitrary values only when the project genuinely needs them.

Tailwind v4.3 supports default values for functional utilities so a custom utility can work both with and without an explicit value. Use that only when the value-less form has a clear semantic default.

Prefer `@utility` over old `@layer utilities` patterns for new v4 custom utilities.

## Variants In CSS

Apply an existing variant inside custom CSS:

```css
.my-element {
  background: white;

  @variant dark {
    background: black;
  }
}
```

Define a custom variant:

```css
@custom-variant theme-midnight (&:where([data-theme="midnight"] *));
```

Use custom variants when a selector pattern appears repeatedly and deserves a stable API.

Tailwind v4.3 supports stacked and compound variants directly in CSS through `@variant`. Prefer this over awkward duplicated selectors when the same Tailwind variant logic needs to apply inside custom CSS.

## Apply And Reference

Use `@apply` to inline existing utilities in custom CSS:

```css
.select2-dropdown {
  @apply rounded-b-lg shadow-md;
}
```

Use it sparingly. Prefer utilities in markup or component abstractions when you control the markup.

In separately bundled styles such as CSS modules, Vue, Svelte, or Astro style blocks, import the main stylesheet for reference:

```css
@reference "../../app.css";

h1 {
  @apply text-2xl font-bold text-red-500;
}
```

If the project has no custom theme, custom utilities, or custom variants, `@reference "tailwindcss";` can be enough.

## Legacy Directives

Use `@config` to explicitly load a legacy JavaScript config:

```css
@config "../../tailwind.config.js";
```

Use `@plugin` to load a legacy JavaScript plugin:

```css
@plugin "@tailwindcss/typography";
```

`@import`, `@reference`, `@plugin`, and `@config` support subpath imports in the CLI, Vite, and PostCSS integrations.

## Functions

Tailwind v4 functions:

- `--alpha(color / opacity)`: adjust opacity using color mixing.
- `--spacing(n)`: resolve values from the spacing scale.

Example:

```css
.panel {
  margin: --spacing(4);
  color: --alpha(var(--color-lime-300) / 50%);
}
```

The legacy `theme()` function is deprecated. Use CSS theme variables when possible. If `theme()` is still needed, prefer CSS variable names over old dot notation.

## Custom CSS Layers

Tailwind uses native cascade layers: theme, base, components, utilities.

Use `@layer base` for default element styles:

```css
@layer base {
  h1 {
    font-size: var(--text-2xl);
  }
}
```

Use the components layer for reusable classes that should remain overrideable by utilities.

Use custom CSS when:

- Styling third-party markup.
- Defining base element defaults.
- Creating a repeated project abstraction.
- Expressing selectors that would be unreadable as class names.

Keep custom CSS near the project's existing CSS entry and make sure source detection still sees the classes that should generate utilities.
