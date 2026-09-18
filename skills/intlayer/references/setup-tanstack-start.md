# Setup: Intlayer 9.5 + TanStack Start

Target stack: TanStack Start (React) on Vite SSR with Intlayer **9.5.x**.

## Packages

```bash
bunx intlayer init
# Interactive (humans): bunx intlayer init --interactive
# Agents: skip --interactive; `intlayer-cli init` also works.

bun add intlayer react-intlayer
bun add vite-intlayer --dev
```

Keep **`intlayer`, `react-intlayer`, and `vite-intlayer` on the same 9.5.x**. Mixed 9.4.x / 9.5.x trees fail the same way mixed 9.4.0 / 9.4.1 trees did.

| Package | Role |
| --- | --- |
| `intlayer` | Config, `t` / `Dictionary`, CLI, `getIntlayer` / `getIntlayerAsync`, `getLocale`, `validatePrefix`, `getPrefix`, `getCanonicalPath` / `getLocalizedPath`, `generateSitemap`, locale mappers |
| `react-intlayer` | `IntlayerProvider`, `useIntlayer`, `useLocale`, `useConversion`, `useExperiment`, `useRewriteURL` |
| `react-intlayer/format` | Locale-bound `useNumber`, `useCurrency`, `useDate`, … |
| `react-intlayer/analytics` | Same analytics hooks as the root export (`useExperiment`, `useConversion`, `useAnalytics`, `AnalyticsProvider`) |
| `vite-intlayer` | Vite plugin `intlayer()` — dictionary build, aliases, locale proxy, optional compiler, chunk grouping/preload |
| `vite-intlayer/nitro-handler` | h3 v2 Nitro middleware for production SSR (auto-registered; do not import unless you own a custom Nitro module) |

Do **not** install `next-intlayer` or `solid-intlayer` for React Start. Do **not** import `react-intlayer/server` (`IntlayerServerProvider`) on Start.

If production SSR needs the locale proxy, move `vite-intlayer` to runtime `dependencies`. The Nitro handler lives in that package.

Optional, only when in scope:

| Package | When |
| --- | --- |
| `@intlayer/analytics` | Content exposure + A/B (often already optional-dep; install if skipped) |
| `@intlayer/sync-json-plugin` | Keep existing i18next/ICU JSON in sync |
| `@intlayer/react-i18next` (and siblings) | Compat adapters — not the Start default path |
| `elysia-intlayer` | Elysia backends only |

## `intlayer.config.ts`

```ts
import { Locales, type IntlayerConfig } from "intlayer";

const config: IntlayerConfig = {
  internationalization: {
    defaultLocale: Locales.ENGLISH,
    locales: [Locales.ENGLISH, Locales.FRENCH, Locales.SPANISH],
  },
  content: {
    contentDir: ["src"],
    codeDir: ["src"],
  },
  // routing.mode default: "prefix-no-default"
  // routing.enableProxy default: undefined (auto) — see configuration.md
  // compiler.enabled default: false
  // build.chunkGrouping / dictionariesPreload default: true (dynamic importMode only)
};

export default config;
```

`intlayer@9.5.4` public types do **not** export `defineConfig`. Use `export default config`. Full knobs: [configuration.md](configuration.md).

Routing modes vs locale slot:

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

Plugin options:

| Option | Role |
| --- | --- |
| `proxy.ignore` | Skip locale rewrite (API / server routes) |
| `compatCallers` | Extra caller patterns for compat-adapter packages |
| `configFile` | Custom path to `intlayer.config.*` |

9.5 notes:

- `intlayer()` bundles dictionary build, env aliases, locale proxy (when `routing.enableProxy` is not `false`), optional compiler (when `compiler.enabled` is `true` or `"build-only"` and `compiler.output` is set), plus production `intlayerOptimize` / `intlayerPrune` / `intlayerMinify` / `intlayerChunk` / `intlayerPreload`.
- Standalone `intlayerProxy()` / `intlayerCompiler()` remain available for advanced plugin order; registering them with `intlayer()` is safe (deduped).
- If registering `intlayerProxy` separately with Nitro, place the proxy **before** `nitro()`.
- Do not keep a leftover `intlayerProxy()` call just because older docs showed it — current website Start configs drop it.
- Production SSR: `intlayerProxy` carries a `.nitro` property. `nitro/vite` pushes `intlayerNitroHandler` into `nitroConfig.modules`. No manual `server/middleware` file. The handler uses h3 v2 Web Fetch (`event.headers`, `event.url`), not `fromNodeMiddleware`.

## Root shell + provider

Prefer `getRouteApi("/{-$locale}")` over importing the locale `Route` object (avoids circular imports). Set `lang` / `dir` on `<html>` in the shell for SSR.

```tsx
// src/routes/__root.tsx
import {
  createRootRouteWithContext,
  getRouteApi,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { defaultLocale, getHTMLTextDir } from "intlayer";
import type { ReactNode } from "react";
import { IntlayerProvider } from "react-intlayer";

const localeRoute = getRouteApi("/{-$locale}");

export const Route = createRootRouteWithContext<{}>()({
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: ReactNode }) {
  const params = localeRoute.useParams();
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

`IntlayerProvider` props: `locale`, `defaultLocale`, `setLocale`, `disableEditor`, `isCookieEnabled`. Use `IntlayerProviderContent` only when you need the context without editor chrome.

Do not use `IntlayerClientProvider` / `IntlayerServerProvider` (`next-intlayer` or `react-intlayer/server`) on Start.

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

`{-$locale}` is optional (works with `prefix-no-default`). Pitfall: stacking multiple dynamic segments with optional `{-$locale}` on the same path. For `prefix-all`, prefer `$locale`. For `no-prefix` / `search-params`, remove the slot.

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
      locale-switcher.tsx
    routes/
      __root.tsx
      sitemap[.]xml.ts
      {-$locale}/
        route.tsx
        index.tsx
        index.content.ts
        about.tsx
        about.content.ts
        404.tsx
        $.tsx
```

Do **not** add `localized-link.tsx`, `useLocalizedNavigate.ts`, or any other Link/navigate wrappers. Use native TanStack Router `Link` / `useNavigate` with `{-$locale}` and `params.locale` (see [routing-ssr-seo.md](routing-ssr-seo.md)).

Official template: https://github.com/aymericzip/intlayer-tanstack-start-template — treat its `LocalizedLink` / `useLocalizedNavigate` samples as outdated for this skill; strip them on adopt/migrate. Template still lists `vite-intlayer` under `devDependencies`; move it to `dependencies` when production SSR needs the proxy.
