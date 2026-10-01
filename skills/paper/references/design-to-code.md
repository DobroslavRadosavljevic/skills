# Design → code and code → design

## Design → code

Goal: production code in the repo's own conventions, with exact values from Paper.

1. **Find the target.** `get_selection` (what the user points at) or `get_basic_info` → artboard by name.
2. **Orient.** `get_tree_summary({ depth: 4–6 })`. Identify repeated rows, cards, and sections that map to existing components in the repo.
3. **Structure.** `get_jsx({ format: "tailwind" })` on the artboard or section. For large artboards, call it per section to keep output small.
4. **Exact values.** `get_computed_styles` in one batch on the nodes whose values matter (type, spacing, borders, shadows, radius). Never read sizes or colors from screenshots.
5. **Tokens.** `get_tokens({ format: "tailwind" })`. Map Paper token names to the app's Tailwind theme. Where Paper uses a literal that matches a token, use the token.
6. **Images.** `get_fill_image` → `originalUrl` → download (see image-generation.md). For vector nodes, `get_jsx` gives the SVG; prefer the repo's icon library if an equal icon exists.
7. **Translate, do not paste.** Rebuild with the repo's UI primitives, class-merging helper, variants, and file layout. Remove Paper-only wrappers and absolute positions that flexbox can express. Add states the static design does not show (hover, focus, disabled, loading, empty, error).
8. **Verify.** Run the app and compare with `get_screenshot` of the artboard at the same width. Screenshots are for comparison only.
9. **Report** the files you changed and any values without a matching token.

## Code → design

Goal: an editable Paper recreation of existing UI, for iteration.

1. Read the component source and its styles. Resolve classes to the file's tokens (`get_tokens`) or to literal CSS.
2. Check fonts with `get_font_family_info`.
3. `create_artboard` at the real viewport size on a page the user chooses (pass `pageId`).
4. Build in small `write_html` steps, one visual group each. Use `var(--token)` for token-backed values. Name layers after the React components (`layer-name="ChatComposer"`) so the mapping back to code stays clear.
5. For real content images, use `<img src="paper-asset:///absolute/path/in/repo.png">`.
6. Screenshot, compare with the running app, fix, then `finish_working_on_nodes`.

## Token sync

- Paper → repo: `get_tokens({ format: "tailwind" })` returns an `@theme` block. Compare with the repo's theme CSS and update only the changed variables. Keep the repo's naming if it differs; write a mapping.
- Repo → Paper: read the theme CSS, then `create_tokens` for new names and `set_tokens` for changed values or renames. Alias with `var(--other)` instead of duplicating values.
- Token names in Paper follow Tailwind v4 namespaces: `--color-*`, `--font-*`, `--font-weight-*`, `--text-*`, `--tracking-*`, `--leading-*`, `--spacing-*` or `--space-*`, `--radius-*`, `--container-*`, `--breakpoint-*`, `--opacity-*`.
