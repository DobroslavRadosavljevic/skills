---
name: intlayer
description: "Build, review, debug, configure, migrate, or plan Intlayer 9.4 internationalization in TanStack Start React apps with current docs. Use for intlayer@9.4, react-intlayer, vite-intlayer, intlayer.config.ts, .content.ts dictionaries, t/plural/enu/cond/gender/select/insert/nest/md/html/file, collections, variants, getIntlayerAsync, useIntlayer, useLocale, IntlayerProvider, getLocale, validatePrefix, getPrefix, locale routing with {-$locale}, native TanStack Link/useNavigate (no LocalizedLink wrappers), locale switchers, Vite locale proxy, SSR cookies/headers, SEO head/sitemap, CLI build/fill/push/pull/test/scan/extract, compiler, analytics, CMS/editor, compat adapters, syncJSON, and Next.js next-intlayer avoidance on Start."
---

# Intlayer

Use this skill when work touches Intlayer i18n, especially **Intlayer 9.4** (`intlayer@9.4.1` line) with TanStack Start (`@tanstack/react-start`) via `intlayer` + `react-intlayer` + `vite-intlayer`.

Pin **`intlayer` / `react-intlayer` / `vite-intlayer` to the same 9.4.x**. Do not mix 9.0.x docs or packages with 9.4 APIs (`getIntlayerAsync`, `analytics`, `compiler.enabled: "build-only"`, proxy auto mode).

## Workflow

1. Inspect the local Intlayer + Start shape before changing code:
   - Package versions for `intlayer`, `react-intlayer`, `vite-intlayer`, `@tanstack/react-start`, `@tanstack/react-router` (all Intlayer packages must match).
   - Config: `intlayer.config.ts` locales, `routing.mode`, `routing.enableProxy`, `routing.storage`, `content.contentDir`, `dictionary.importMode`, `dictionary.fill`, `compiler.enabled`, `build.optimize` / `minify` / `purge`, `editor`, `analytics`, `ai`, `plugins`.
   - Vite: `intlayer()` plugin (`proxy.ignore`, optional `compatCallers`), `tanstackStart({ router: { routeFileIgnorePattern } })`.
   - Routes: `src/routes/__root.tsx` shell + `IntlayerProvider`, `src/routes/{-$locale}/` layout with `validatePrefix`.
   - Content: `*.content.{ts,tsx,js,json,...}` dictionaries and generated `.intlayer/` output.
   - Navigation: reject `LocalizedLink`, `useLocalizedNavigate`, and any other Link/navigate wrappers — use native TanStack Router APIs only.
2. Refresh docs when the task depends on latest behavior, 9.4 APIs, CMS/editor/analytics, or package drift. Start from [source-map.md](references/source-map.md).
3. For install, config, Vite plugin, provider, and TypeScript includes, use [setup-tanstack-start.md](references/setup-tanstack-start.md).
4. For `intlayer.config.ts` knobs (routing, dictionary, compiler, build, editor, analytics, AI, plugins), use [configuration.md](references/configuration.md).
5. For content declarations, node helpers, collections/variants, formatters, and `useIntlayer`, use [content-dictionaries.md](references/content-dictionaries.md).
6. For locale routing, native links/navigate, SSR `getLocale` / `getIntlayerAsync`, SEO `head`, sitemap, and 404s, use [routing-ssr-seo.md](references/routing-ssr-seo.md).
7. For CLI, fill, CMS, visual editor, live sync, MCP, and `@intlayer/analytics`, use [cli-cms-ai.md](references/cli-cms-ai.md).
8. For compiler extraction, bundle optimize/minify/purge, import modes, compat adapters, and `syncJSON`, use [compiler-compat.md](references/compiler-compat.md).
9. Prefer `bun` / `bunx` in command examples. Prefer the official Start guide over Next.js or Solid Start docs — but **do not** copy Intlayer's `LocalizedLink` / `useLocalizedNavigate` examples; use native TanStack Router `Link` / `useNavigate` instead.

## Implementation Judgment

- TanStack Start uses **`intlayer` + `react-intlayer` + `vite-intlayer`**. Do not install or copy APIs from `next-intlayer` / `next-intlayer/server` or `solid-intlayer`. There is no `tanstack-intlayer` package.
- Next.js 9.4 merges `IntlayerClientProvider` / `IntlayerServerProvider` into `IntlayerProvider`. Start already uses `IntlayerProvider` from `react-intlayer`. Do not introduce the deprecated Next split providers.
- Locale detection/redirect is the Vite **`intlayer()` proxy**, not a TanStack Router middleware API. `routing.enableProxy` is **`undefined` (auto)** by default in 9.4 config: proxy runs; **dev/preview stay URL-driven** (ignore stored locale); **production** uses full storage-driven redirects. Set `true` to force storage-driven redirects everywhere; `false` to disable the proxy.
- **No Link/navigate wrappers.** Do not create, keep, or recommend `LocalizedLink`, `useLocalizedNavigate`, or any component/hook that wraps TanStack `Link` / `useNavigate` to inject locale. Use native `Link` and `useNavigate` with full `to` paths (`/{-$locale}/...`) and `params.locale` from `getPrefix(locale).localePrefix`. On review/migrate, delete existing wrappers and rewrite call sites.
- Always set `routeFileIgnorePattern` for `.content.*` so content files are not treated as routes.
- Match the locale route slot to `routing.mode`: `{-$locale}` for `prefix-no-default`; prefer `$locale` for `prefix-all`; remove the slot for `no-prefix` / `search-params`.
- Client UI: `useIntlayer` / `useLocale` from `react-intlayer`. Locale-aware formatters: `react-intlayer/format`. Server functions, `head`, loaders, and non-React code: `getIntlayerAsync` / `getLocale` from `intlayer` (9.4+). Use sync `getIntlayer` only when a merged all-locales dictionary is acceptable.
- In `beforeLoad`, validate locale from **`params.locale`** via `validatePrefix` — not from cookies/headers (the proxy already handled request locale).
- Co-locate `.content.*` with features. Set `content.contentDir` explicitly for Start apps under `src` (config default is `["."]`, not a Next-style `./app`).
- `compiler.enabled` defaults to **`false`**. Values: `false` | `true` | `"build-only"` (skip in dev). Bundled proxy/compiler live inside `intlayer()` — do not require separate `intlayerProxy()` / `intlayerCompiler()` unless plugin order demands it.
- For production SSR that needs the locale proxy, keep `vite-intlayer` available at runtime (move out of `devDependencies` when the proxy runs in production).
- For HTML attributes (`alt`, `title`, `aria-label`), use `.value`, `.toString()`, or `String(...)` on content nodes.
- Discriminants: `plural`/`enu` (quantity), `cond` (boolean), `gender`, `select` (any other string — 9.1). Do not index a content object with a runtime key (`node[status]`); call `node(status)` so the compiler can minify/purge.
- Collections share `key` + `item`. Variants use `variant: string | object` (9.1 merged former dynamic records into object variants). Selectors: `{ locale, item, variant }`. Resolution order: **variant → item**.
- Do not enable `build.minify` while `editor.enabled` is true (ignored). `importMode` / minify / purge require `build.optimize` (default true in production).

## Verification

Prefer the repo's existing checks. For meaningful Intlayer + Start work, include the relevant subset:

- Typecheck with `.intlayer/**/*.ts` included and route tree regenerated.
- Locale smoke: default locale (no prefix or prefixed), alternate locales, invalid prefix → 404 redirect, locale switcher.
- Navigation smoke: in-app links and programmatic navigate keep the current locale; switcher updates `params.locale` without wrapper components.
- SSR smoke: first HTML `lang`/`dir`, cookie/`Accept-Language` proxy redirects, server function `getLocale` + `getIntlayerAsync`.
- Head/metadata smoke: async `head` uses `getIntlayerAsync` so only the requested locale chunk loads.
- Content smoke: missing keys, attribute string rendering, collections/variants/`plural`/`enu`/`select` when used.
- CLI: `bunx intlayer build` and `bunx intlayer test` (alias of `content test`) when dictionaries change.
- Sitemap/prerender smoke when changing localized SEO routes.
- If CMS/editor/analytics are in scope: live sync, `push`/`pull`, and `editor.clientId` for analytics attribution.

Report which checks ran, which did not, and any version-sensitive assumptions that remain.
