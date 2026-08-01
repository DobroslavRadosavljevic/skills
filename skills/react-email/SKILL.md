---
name: react-email
description: "Build, review, debug, render, migrate, or plan HTML email templates with React Email (react-email v6+). Use for react-email, create-email, @react-email/editor, @react-email/render, @react-email/ui, email templates, Tailwind email styling, pixelBasedPreset, render/toPlainText, PreviewProps, email CLI (email dev/export/build), transactional emails, newsletters, Resend/Nodemailer/SendGrid/Mailgun/Postmark/SES integrations, and upgrades from @react-email/components."
---

# React Email

Use this skill for HTML emails built with **React Email** (`react-email` **6.x**): components, Tailwind styling, CLI preview, `render`, ESP sending, and the optional visual editor.

## Workflow

1. Inspect the local surface before changing code:
   - Packages: `react-email` (components + CLI + `render`), optional `@react-email/editor`, `@react-email/ui`, peers `react` / `react-dom` 18+.
   - Legacy installs still on `@react-email/components` or `renderAsync` → treat as a **v5→v6** migration (see [setup-cli.md](references/setup-cli.md)).
   - Emails directory (default `emails/`), `static/` assets, `email` script, shared Tailwind config if any.
   - How mail is sent: `render` + ESP HTML, Resend `react:` prop, or static `email export`.
2. Refresh docs when versions are unclear or work touches Tailwind 4 email behavior, the editor, monorepos, or major upgrades. Start from [source-map.md](references/source-map.md).
3. Route deeper detail:
   - Install, CLI, monorepo, PreviewProps, static files: [setup-cli.md](references/setup-cli.md).
   - Components API and structure: [components.md](references/components.md).
   - Tailwind, `pixelBasedPreset`, client CSS limits: [styling.md](references/styling.md).
   - `render`, plain text, ESP integrations: [render-send.md](references/render-send.md).
   - Embeddable TipTap editor: [editor.md](references/editor.md).
   - i18n and common template shapes: [patterns.md](references/patterns.md).
4. Prefer the project's existing email folder layout, brand tokens, and ESP. Do not invent a second emails package unless asked.
5. Verify the smallest useful surface (preview, render smoke, typecheck, send dry-run).

## Core Judgment

- Import components and `render` from **`react-email`**, not `@react-email/components` (removed as the primary entry in v6).
- `render` is **async**. Never use `renderAsync` (removed). Prefer `await render(<Email />)` at send time over `email export` unless a non-JS backend forces static HTML.
- Style with `<Tailwind config={{ presets: [pixelBasedPreset] }}>` — email clients do not support `rem`. Avoid flex/grid, `sm:`/`md:`/`dark:` utilities, SVG/WEBP images.
- Structure: `<Html>` → `<Tailwind>` → `<Head />` → `<Body>` with `<Preview>` first inside `<Body>`. One `<Container>` for the main column (~600px / `max-w-xl`). Use `Section` / `Row` / `Column` for layout tables.
- Buttons need `box-border`. Borders need an explicit style (`border-solid`). Linked images need meaningful `alt` (never decorative-empty alt on a link).
- Props are TypeScript — never put ESP mustache (`{{name}}`) in JSX. If a host requires mustache samples, put them only in `.PreviewProps`.
- Images: absolute CDN URLs in production; local `emails/static/` only works in `email dev`. Gate with a production base URL env.
- Always ship HTML **and** plain text (`render(..., { plainText: true })` or ESP auto-plaintext). Keep HTML under ~102KB (Gmail clip).
- Use verified sending domains. Prefer `bun` / `bunx` in command examples.

## Clarifying Before New Templates

If the user did not specify brand/assets, ask briefly (or proceed with placeholders they can swap):

1. Primary brand color (hex)
2. Logo URL or file (PNG/JPEG only)
3. Tone (transactional / marketing / minimal)
4. Production asset base URL

## Verification

Prefer repository-owned commands. Cover the relevant subset:

- `bun pm ls react-email` (and `@react-email/editor` / `@react-email/ui` if used).
- `bun run email` / `bunx email dev --dir emails` — preview compiles and `PreviewProps` render.
- `await render(<Template {...props} />)` and optional `{ plainText: true }` smoke in a script or test.
- Typecheck template props and default exports.
- ESP dry-run or sandbox send when changing send paths (Resend `react:`, Nodemailer `html`, etc.).
- Client spot-check notes for Outlook/Gmail when layout or borders change.

Report which checks ran, which did not, and version assumptions that remain.
