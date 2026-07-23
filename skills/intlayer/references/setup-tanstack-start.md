# Setup: Intlayer + TanStack Start

Target stack: TanStack Start (React) on Vite SSR with Intlayer v9.

## Packages

```bash
bunx intlayer-cli init
# or interactive: bunx intlayer@canary init --interactive

bun add intlayer react-intlayer
bun add vite-intlayer --dev
```

| Package | Role |
| --- | --- |
| `intlayer` | Config, `t` / `Dictionary`, CLI, `getIntlayer`, `getLocale`, `validatePrefix`, `getPrefix`, routing helpers |
| `react-intlayer` | `IntlayerProvider`, `useIntlayer`, `useLocale` |
| `vite-intlayer` | Vite plugin `intlayer()` — dictionary build, aliases, locale proxy |

Do **not** install `next-intlayer` or `solid-intlayer` for React Start.

If production SSR needs the locale proxy, move `vite-intlayer` to runtime `dependencies`.

## `intlayer.config.ts`

```ts
import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    defaultLocale: Locales.ENGLISH,
    locales: [Locales.ENGLISH, Locales.FRENCH, Locales.SPANISH],
  },
  // Recommended for Start apps that keep content under src/
  content: {
    contentDir: ["src"],
    codeDir: ["src"],
  },
  // routing.mode default: "prefix-no-default"
  // routing.enableProxy default: true (v9)
  // compiler.enabled default: false (v9)
};

export default config;
```

Key option groups:

| Section | Common knobs |
| --- | --- |
| `internationalization` | `locales`, `defaultLocale`, `requiredLocales`, `strictMode` |
| `routing` | `mode`, `enableProxy`, `storage`, `basePath`, `domains` |
| `dictionary` | `importMode` (`static` \| `dynamic` \| `fetch`), `fill`, `location` |
| `content` | `contentDir`, `codeDir`, `fileExtensions`, `watch` |
| `compiler` | `enabled` (opt in), `output` |

Routing modes:

| `routing.mode` | Locale route slot |
| --- | --- |
| `prefix-no-default` (default) | `{-$locale}` optional |
| `prefix-all` | Prefer `$locale` required |
| `no-prefix` / `search-params` | No locale path segment |

## Vite config

```ts
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import { intlayer } from "vite-intlayer";

export default defineConfig({
  plugins: [
    nitro(),
    intlayer({
      proxy: {
        ignore: (req) => req.url?.startsWith("/api"),
      },
    }),
    tanstackStart({
      router: {
        routeFileIgnorePattern:
          ".content.(ts|tsx|js|mjs|cjs|jsx|json|jsonc|json5|md|mdx|yaml|yml)$",
      },
    }),
    viteReact(),
  ],
});
```

v9 notes:

- `intlayer()` bundles dictionary build, env aliases, locale proxy (when `routing.enableProxy`), and optional compiler (when `compiler.enabled`).
- Standalone `intlayerProxy()` / `intlayerCompiler()` remain available for advanced plugin order; registering them with `intlayer()` is safe (deduped).
- If registering `intlayerProxy` separately with Nitro, place the proxy **before** `nitro()`.

## Root shell + provider

```tsx
// src/routes/__root.tsx
import {
  createRootRouteWithContext,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { defaultLocale, getHTMLTextDir } from "intlayer";
import type { ReactNode } from "react";
import { IntlayerProvider } from "react-intlayer";
import { Route as LocaleRoute } from "./{-$locale}/route";

export const Route = createRootRouteWithContext()({
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  const params = LocaleRoute.useParams();
  const locale = params?.locale ?? defaultLocale;

  return (
    <html dir={getHTMLTextDir(locale)} lang={locale}>
      <head>
        <HeadContent />
      </head>
      <body>
        <IntlayerProvider locale={locale}>{children}</IntlayerProvider>
        <Scripts />
      </body>
    </html>
  );
}
```

Set `lang` / `dir` on `<html>` in the shell for SSR. Do not rely only on a client `useEffect` for first paint.

## Locale layout

```tsx
// src/routes/{-$locale}/route.tsx
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { validatePrefix } from "intlayer";

export const Route = createFileRoute("/{-$locale}")({
  beforeLoad: ({ params }) => {
    const { isValid, localePrefix } = validatePrefix(params.locale);
    if (!isValid) {
      throw redirect({
        to: "/{-$locale}/404",
        params: { locale: localePrefix },
      });
    }
  },
  component: Outlet,
});
```

Validate from **route params**, not cookies/headers.

## TypeScript + git

- Include generated types: `.intlayer/**/*.ts` in `tsconfig.json`.
- Gitignore `.intlayer` (generated dictionaries/types/cache).
- Keep `routeTree.gen.ts` generated; do not hand-edit after adding `{-$locale}` routes.

## Suggested layout

```text
project/
  intlayer.config.ts
  vite.config.ts
  src/
    components/
      localized-link.tsx
      locale-switcher.tsx
    hooks/
      useLocalizedNavigate.ts
    routes/
      __root.tsx
      {-$locale}/
        route.tsx
        index.tsx
        index.content.ts
        about.tsx
        about.content.ts
        404.tsx
        $.tsx
```

Official template: https://github.com/aymericzip/intlayer-tanstack-start-template
