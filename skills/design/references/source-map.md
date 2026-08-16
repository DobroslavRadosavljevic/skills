# Source map

Prefer these primary sources when a local project’s tokens or component APIs
disagree with memory. Dates in comments are retrieval context (2026), not
expiry.

## shadcn/ui

- Theming (OKLCH tokens, radius, adding tokens): https://ui.shadcn.com/docs/theming
- Dark mode: https://ui.shadcn.com/docs/dark-mode
- Tailwind v4 + OKLCH: https://ui.shadcn.com/docs/tailwind-v4
- Manual install CSS scaffold: https://ui.shadcn.com/docs/installation/manual
- Chart tokens: https://ui.shadcn.com/docs/components/chart
- Typeset (markdown/docs/chat rhythm): https://ui.shadcn.com/docs/components/typography
- Sidebar: https://ui.shadcn.com/docs/components/sidebar
- Blocks (dashboard, login, sidebar): https://ui.shadcn.com/blocks
- Login blocks: https://ui.shadcn.com/blocks/login
- Registry theming examples: https://ui.shadcn.com/docs/registry/examples
- Customization notes: https://github.com/shadcn-ui/ui/blob/HEAD/skills/shadcn/customization.md

CLI (this repo prefers bun):

```bash
bunx shadcn@latest add button
```

## Tailwind CSS

- Font size scale: https://tailwindcss.com/docs/font-size
- Line height: https://tailwindcss.com/docs/line-height
- Font family / theme: https://tailwindcss.com/docs/font-family
- Spacing / padding: https://tailwindcss.com/docs/padding
- Breakpoints: https://tailwindcss.com/docs/responsive-design
- Max width: https://tailwindcss.com/docs/max-width
- z-index: https://tailwindcss.com/docs/z-index
- v4 theme: https://tailwindcss.com/blog/tailwindcss-v4

## Accessibility and contrast

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Contrast (text) 1.4.3: https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum
- Non-text contrast 1.4.11: https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast
- Use of color 1.4.1: https://www.w3.org/WAI/WCAG22/Understanding/use-of-color
- Target size AA 2.5.8: https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum
- Target size AAA 2.5.5: https://www.w3.org/WAI/WCAG22/Understanding/target-size-enhanced
- Focus visible: https://www.w3.org/WAI/WCAG22/Understanding/focus-visible
- Focus not obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum
- Text spacing 1.4.12: https://www.w3.org/WAI/WCAG22/Understanding/text-spacing
- Labels 3.3.2: https://www.w3.org/WAI/WCAG22/Understanding/labels-or-instructions
- APG dialog: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
- Reduced motion: https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

## Color science and palettes

- OKLCH in CSS: https://evilmartians.com/chronicles/oklch-in-css-why-quit-rgb-hsl
- oklch() reference: https://css-tricks.com/almanac/functions/o/oklch/
- Paul Tol colorblind-safe schemes: https://personal.sron.nl/~pault/

## Typography

- Measure / line length: https://practicaltypography.com/line-length.html
- web.dev typography: https://web.dev/learn/design/typography

## Product patterns

- Empty states (NN/g): https://www.nngroup.com/articles/empty-state-interface-design/
- Error messages (NN/g): https://www.nngroup.com/articles/error-message-guidelines/
- Stripe Customer Portal vs Checkout: https://docs.stripe.com/customer-management/integrate-customer-portal
