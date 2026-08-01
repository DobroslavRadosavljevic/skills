# Setup and CLI

## Packages (v6)

| Package | Role |
| --- | --- |
| `react-email` | Components, Tailwind helpers, CLI (`email`), re-exports `render` / `toPlainText` |
| `@react-email/ui` | Preview UI package (needed after v5→v6 if you used `@react-email/preview-server`) |
| `@react-email/editor` | Embeddable visual editor (separate install) |
| `@react-email/render` | Render implementation; prefer importing from `react-email` |
| `create-email` | Scaffold starter via `bun create email` / `bunx create-email@latest` |

```sh
bun add react-email react react-dom
# optional
bun add -d @react-email/ui
bun add @react-email/editor
```

## Scaffold

```sh
bun create email
# or
bunx create-email@latest
cd react-email-starter
bun install
bun run dev
```

Preview defaults to `http://localhost:3000` and watches the `emails` folder.

## Add to an Existing App

```json
{
  "scripts": {
    "email": "email dev --dir emails --port 3000"
  }
}
```

Ensure `tsconfig.json` supports JSX. Keep the emails path relative to the project root (or workspace package root).

## Project Layout

```
project/
├── emails/
│   ├── welcome.tsx          # default export = template
│   ├── _components/         # underscore = hidden from preview sidebar
│   ├── static/              # local assets for email dev only
│   │   └── logo.png
│   └── tailwind.config.ts   # optional shared TailwindConfig
├── package.json
└── tsconfig.json
```

Preview heuristics: include `.js` / `.jsx` / `.tsx` files that contain `export default`. Prefix directories with `_` to hide shared modules from the sidebar.

## PreviewProps

```tsx
export default function WelcomeEmail({ name, url }: WelcomeEmailProps) {
  return (/* ... */);
}

WelcomeEmail.PreviewProps = {
  name: 'Ada Lovelace',
  url: 'https://example.com/verify',
} satisfies WelcomeEmailProps;
```

Only include props the component actually uses.

## Static Files

- Dev: place files under `emails/static/` (or `<--dir>/static/`). Served at `/static/...`.
- Production sends: host on a CDN. Local `/static` paths will not resolve in real inboxes.

```tsx
const baseURL =
  process.env.NODE_ENV === 'production' ? 'https://cdn.example.com' : '';

<Img src={`${baseURL}/static/logo.png`} alt="Acme" width={120} height={40} />
```

Ask for the real production base URL; do not hardcode `localhost`.

## CLI Commands

| Command | Purpose |
| --- | --- |
| `email dev --dir <path> --port <n>` | Watch + preview (default dir `./emails`, port `3000`) |
| `email build --dir <path>` | Copy/build preview app into `.react-email` |
| `email start` | Run the built preview app |
| `email export --dir <path> --outDir <path> [--pretty] [--plainText]` | Static HTML/text files |
| `email help <cmd>` | Command help |
| `email resend setup` / `email resend reset` | Store/clear Resend API key for CLI template upload |

Prefer:

```sh
bunx email dev --dir emails
bun run email
```

### `email export` caveats

Prefer **`render` with live props** at send time. Use `export` only when a non-JS backend or a platform that forces static templating requires it (manual mustache, Shopify-style hosts, etc.).

## Monorepos

Official guides cover bun / npm / pnpm / yarn workspaces under getting-started monorepo setup. Put `react-email` in the package that owns templates, run the CLI from that package, and keep `--dir` correct relative to that package root.

## Migrate to v6

From React Email 5 → 6:

1. Remove `@react-email/components` and `@react-email/preview-server`.
2. Install `react-email@latest` and `@react-email/ui@latest` as needed.
3. Change imports to `from 'react-email'`.
4. Replace any remaining `renderAsync` with `await render`.

From 4 → 5: replace `renderAsync` with `render`; keep CLI and components packages in sync (Tailwind 4 era).

```tsx
// before
import { Html, Button, render } from '@react-email/components';
// after
import { Html, Button, render } from 'react-email';
```
