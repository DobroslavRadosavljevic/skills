---
name: intlayer
description: "Build, review, debug, configure, migrate, or plan Intlayer v9 internationalization in TanStack Start React apps with current docs. Use for intlayer, react-intlayer, vite-intlayer, intlayer.config.ts, .content.ts dictionaries, t(), useIntlayer, useLocale, IntlayerProvider, getIntlayer, getLocale, validatePrefix, getPrefix, locale routing with {-$locale}, LocalizedLink, locale switchers, Vite locale proxy, SSR cookies/headers, SEO head/sitemap, CLI build/fill/push/pull, collections, variants, and Next.js next-intlayer avoidance on Start."
---

# Intlayer

Use this skill when work touches Intlayer i18n, especially Intlayer v9 with TanStack Start (`@tanstack/react-start`) via `intlayer` + `react-intlayer` + `vite-intlayer`.

## Workflow

1. Inspect the local Intlayer + Start shape before changing code:
   - Package versions for `intlayer`, `react-intlayer`, `vite-intlayer`, `@tanstack/react-start`, `@tanstack/react-router`.
   - Config: `intlayer.config.ts` locales, `routing.mode`, `routing.enableProxy`, `content.contentDir`, `dictionary.importMode`, `compiler.enabled`.
   - Vite: `intlayer()` plugin, `proxy.ignore`, `tanstackStart({ router: { routeFileIgnorePattern } })`.
   - Routes: `src/routes/__root.tsx` shell + `IntlayerProvider`, `src/routes/{-$locale}/` layout with `validatePrefix`.
   - Content: `*.content.{ts,tsx,js,json,...}` dictionaries and generated `.intlayer/` output.
2. Refresh docs when the task depends on latest behavior, v9 defaults, CMS/editor, or package drift. Start from [source-map.md](references/source-map.md).
3. For install, config, Vite plugin, provider, and TypeScript includes, use [setup-tanstack-start.md](references/setup-tanstack-start.md).
4. For content declarations, `t()`, `useIntlayer`, collections, variants, and attribute string rendering, use [content-dictionaries.md](references/content-dictionaries.md).
5. For locale routing, links/navigate, SSR `getLocale`/`getIntlayer`, SEO head, sitemap, and 404s, use [routing-ssr-seo.md](references/routing-ssr-seo.md).
6. Prefer `bun` / `bunx` in command examples. Prefer the official Start guide over Next.js or Solid Start docs.

## Implementation Judgment

- TanStack Start uses **`intlayer` + `react-intlayer` + `vite-intlayer`**. Do not install or copy APIs from `next-intlayer` / `next-intlayer/server` or `solid-intlayer`.
- There is no `tanstack-intlayer` package. Locale detection/redirect is the Vite **`intlayer()` proxy** (`routing.enableProxy`, default `true`), not a TanStack Router middleware API.
- Always set `routeFileIgnorePattern` for `.content.*` so content files are not treated as routes.
- Match the locale route slot to `routing.mode`: `{-$locale}` for `prefix-no-default`; prefer `$locale` for `prefix-all`; remove the slot for `no-prefix` / `search-params`.
- Client UI: `useIntlayer` / `useLocale` from `react-intlayer`. Server functions, `head`, and non-React code: `getIntlayer` / `getLocale` from `intlayer`.
- In `beforeLoad`, validate locale from **`params.locale`** via `validatePrefix` — not from cookies/headers (the proxy already handled request locale).
- Co-locate `.content.*` with features. Set `content.contentDir` explicitly for Start apps under `src` (do not assume a Next-style `./app` default without checking config).
- v9: `compiler.enabled` defaults to **`false`**; bundled proxy/compiler live inside `intlayer()` — do not require separate `intlayerProxy()` / `intlayerCompiler()` unless plugin order demands it.
- For production SSR that needs the locale proxy, keep `vite-intlayer` available at runtime (move out of `devDependencies` when docs/proxy require it).
- For HTML attributes (`alt`, `title`, `aria-label`), use `.value`, `.toString()`, or `String(...)` on content nodes.

## Verification

Prefer the repo's existing checks. For meaningful Intlayer + Start work, include the relevant subset:

- Typecheck with `.intlayer/**/*.ts` included and route tree regenerated.
- Locale smoke: default locale (no prefix or prefixed), alternate locales, invalid prefix → 404 redirect, locale switcher.
- SSR smoke: first HTML `lang`/`dir`, cookie/`Accept-Language` proxy redirects, server function `getLocale` + `getIntlayer`.
- Content smoke: missing keys, attribute string rendering, collections/variants when used.
- CLI: `bunx intlayer build` and `bunx intlayer content test` (or `intlayer test`) when dictionaries change.
- Sitemap/prerender smoke when changing localized SEO routes.

Report which checks ran, which did not, and any version-sensitive assumptions that remain.
