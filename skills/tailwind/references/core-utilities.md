# Tailwind Core Utilities

## Table Of Contents

- [Utility Class Model](#utility-class-model)
- [Class Detection](#class-detection)
- [Responsive Design](#responsive-design)
- [States And Variants](#states-and-variants)
- [Dark Mode](#dark-mode)
- [Arbitrary Values And Properties](#arbitrary-values-and-properties)
- [Class Composition In Components](#class-composition-in-components)
- [Preflight](#preflight)
- [Accessibility](#accessibility)
- [Class Sorting](#class-sorting)

## Utility Class Model

Tailwind styles elements by composing small single-purpose utility classes in markup.

Use this model deliberately:

- Prefer utilities for layout, spacing, typography, color, borders, shadows, transforms, and states.
- Keep related state styles beside the element they affect.
- Use project tokens first, then arbitrary values for true one-offs.
- Reach for custom CSS when styling third-party markup, defining base styles, or creating a reusable abstraction that utilities cannot express cleanly.

## Class Detection

Tailwind scans source files as plain text. It does not parse JavaScript, JSX, Vue, Svelte, template expressions, or string interpolation.

Do this:

```jsx
const variants = {
  blue: "bg-blue-600 hover:bg-blue-500 text-white",
  red: "bg-red-600 hover:bg-red-500 text-white",
};

return <button className={variants[color]}>Save</button>;
```

Avoid this:

```jsx
return <button className={`bg-${color}-600 hover:bg-${color}-500`}>Save</button>;
```

Detection defaults:

- Files in `.gitignore` are ignored.
- `node_modules` is ignored.
- Binary files are ignored.
- CSS files are ignored.
- Common package manager lockfiles are ignored.

Use `@source` when a package, workspace, or generated location must be scanned.

## Responsive Design

Tailwind breakpoints are mobile-first:

- Unprefixed utilities apply at all viewport sizes.
- `sm:`, `md:`, `lg:`, `xl:`, and `2xl:` apply at that breakpoint and wider.
- Do not use `sm:` to mean mobile.
- Build the mobile layout first, then layer larger breakpoint overrides.

Default viewport breakpoints:

- `sm`: 40rem / 640px.
- `md`: 48rem / 768px.
- `lg`: 64rem / 1024px.
- `xl`: 80rem / 1280px.
- `2xl`: 96rem / 1536px.

Use `max-*` variants with breakpoint variants for bounded ranges. Use container query variants such as `@sm:` when the component should respond to container size instead of viewport size.

## States And Variants

Variants prefix utilities and can be stacked:

```html
<button class="dark:md:hover:bg-fuchsia-600">Save</button>
```

Common variant groups:

- Interaction: `hover`, `focus`, `focus-visible`, `active`, `disabled`, `enabled`.
- Structure: `first`, `last`, `odd`, `even`, `empty`, `has-*`, `not-*`.
- Groups and peers: `group-*`, `peer-*`, `in-*`.
- Attributes: `aria-*`, `data-*`, `open`, `rtl`, `ltr`.
- Media/features: breakpoints, dark mode, `motion-safe`, `motion-reduce`, contrast, forced colors, pointer, orientation, print, supports.
- Pseudo-elements: `before`, `after`, `placeholder`, `selection`, `marker`, `file`, `backdrop`.
- Container queries: `@sm`, `@md`, `@max-*`, and arbitrary container query values.
- Size containers: use `@container-size` when container queries must depend on height as well as width.

Recent v4.2/v4.3 utility additions to consider when the project is on the current v4 line:

- Scrollbar utilities for first-party scrollbar styling.
- Logical property utilities such as block-start/block-end spacing and logical inset utilities.
- `font-features-*` utilities for OpenType feature settings.
- `zoom-*` utilities.
- `tab-*` utilities.
- New default palettes: `mauve`, `olive`, `mist`, and `taupe`.

Prefer named/custom variants when the same arbitrary selector repeats across the project.

## Dark Mode

By default, `dark:` uses `prefers-color-scheme`.

For manual class-based dark mode:

```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));
```

For data-attribute dark mode:

```css
@import "tailwindcss";
@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));
```

If the app has a three-way light/dark/system toggle, set the selector before paint when possible to avoid a flash of the wrong theme. Server-render the selector when the preference is known server-side.

## Arbitrary Values And Properties

Use square brackets for one-off values:

```html
<div class="top-[117px] bg-[#bada55] text-[22px]"></div>
```

Use arbitrary properties for CSS properties without built-in utilities:

```html
<div class="[mask-type:luminance] hover:[mask-type:alpha]"></div>
```

Use parenthesized custom property shorthand in v4:

```html
<div class="fill-(--brand-color) text-(color:--brand-text)"></div>
```

Notes:

- Underscores become spaces in arbitrary values where spaces are valid.
- Escape an underscore when the literal underscore is required.
- In JSX, use `String.raw` when a class needs a preserved backslash.
- Add CSS data type hints such as `length:` or `color:` when an arbitrary custom property is ambiguous.

## Class Composition In Components

Prefer explicit class maps for component variants:

- Map props to full class names.
- Keep base classes stable.
- Use existing project helpers such as `clsx`, `cva`, `tailwind-variants`, or local slot maps when already present.
- Keep variant names semantically meaningful.
- Avoid brittle string replacement or partial class assembly.

For design-system components, make every visual state explicit: default, hover, focus-visible, disabled, loading, invalid, selected, active, dark mode, and responsive/container states.

## Preflight

When importing Tailwind, Preflight is included in the base layer by default.

Important effects:

- Margins and padding are reset.
- Border box sizing is set globally.
- Borders default to `0 solid currentColor`.
- Headings inherit font size and weight.
- Lists are unstyled.
- Images, SVG, video, canvas, audio, iframe, embed, and object are block-level.
- Images and video are constrained to parent width by default.
- `[hidden]` stays hidden unless using `hidden="until-found"`.

Watch for conflicts with third-party widgets. Override Preflight in `@layer base` only for the affected integration boundary.

## Accessibility

- Preserve semantic HTML. Utilities should not replace semantics.
- Keep visible focus states, usually with `focus-visible:*` or explicit outlines.
- Use `role="list"` when a semantic list is visually unstyled but still needs to be announced as a list by assistive tech.
- Test dark mode and forced-colors variants for contrast.
- Respect reduced motion with `motion-safe` and `motion-reduce`.
- Avoid hiding content visually without considering screen-reader and keyboard behavior.

## Class Sorting

The official `prettier-plugin-tailwindcss` sorts classes in Tailwind's recommended order.

Use it when the project already uses Prettier or the user asks for class sorting. Do not introduce it to a repo without checking package manager policy and approval for dependency installation.
