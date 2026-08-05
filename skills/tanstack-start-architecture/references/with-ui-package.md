# Extension: UI / design-system package

Load when primitives live in a workspace UI package (shadcn-style, Tailwind tokens) and the Start app composes pages locally.

## Stance

**Primitives + tokens + Storybook** → UI package.  
**Page/shell composition** → Start `routes/…/-components`, `src/components/`, or module `components/` after reuse.

## Tree

```text
packages/<ui>/
  src/core/* · typography/* · css/*
  **/*.stories.tsx             # Storybook on the UI package

apps/<web>/src/
  styles.css                   # import package styles; @source app files; local fonts
  components/                  # app shells / root document — not a second design system
  routes/…/-components/        # page composition using @…/ui primitives
```

## MUST

1. Build new primitives in the **UI package** when reused or design-system worthy.
2. Keep Storybook on the UI package for primitives — not a parallel Storybook of every app page.
3. App CSS **extends** the package theme; do not fork a second token set.
4. Page-specific layouts stay in route `-components` until a second consumer appears.

## MUST NOT

1. Copy-pasting button/input implementations into the Start app when the UI package already has them.
2. Putting package primitive stories only under the Start app.

## Soft defaults

- Tailwind v4 + Vite plugin on the Start app; package exports CSS entry.
- Dual path alias so UI package imports resolve like the app (`@/` → app or package as configured).

## Checklist

```text
UI package overlay:
- [ ] Primitives in packages/<ui>
- [ ] App composes; does not fork tokens
- [ ] Storybook on UI package
- [ ] Page UI in routes/-components until reuse
```
