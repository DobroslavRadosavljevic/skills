# Routing, SSR, and SEO

## Locale proxy (SSR)

The Vite `intlayer()` plugin wires locale detection/redirect/rewrite when `routing.enableProxy` is not `false`.

**9.4 `enableProxy` (configuration page):**

| Value | Behavior |
| --- | --- |
| `undefined` (auto, default) | Proxy runs. Dev/preview stay **URL-driven** (ignore cookie/header locale). Production uses full storage-driven redirects. Locale prefixes still resolve; Accept-Language still applies. |
| `true` | Full behaviour in every environment, including storage-driven redirects in dev. |
| `false` | No locale routing. Handle it yourself. |

Older v9 notes said the default was `true`. Prefer the live configuration page (`undefined` / auto) and report a mismatch if the installed package types disagree.

Detection order (docs/defaults): URL prefix → cookie (default `INTLAYER_LOCALE`) → `Accept-Language` / locale header (`x-intlayer-locale`).

`routing.storage` default: `["cookie", "header"]`. Also: `localStorage`, `sessionStorage`, or an array.

Ignore API/server-route paths in the plugin so they are not rewritten:

```ts
intlayer({
  proxy: { ignore: (req) => req.url?.startsWith("/api") },
})
```

Production proxy needs `vite-intlayer` in runtime `dependencies`.

Advanced: `routing.basePath`, `routing.domains` (host → locale, no path prefix), `routing.rewrite` (locale-specific path aliases; Start has no `nextjsRewrite` requirement — only use rewrite helpers that exist in `intlayer/routing` for this stack).

## Locale-aware navigation (native TanStack only)

**Hard rule:** Do not create, keep, or recommend wrappers around TanStack Router navigation (`LocalizedLink`, `useLocalizedNavigate`, `locacalizeTo`, etc.). Use `@tanstack/react-router` `Link` and `useNavigate` directly with typed `to` paths that include the locale slot and `params.locale` from `getPrefix`.

In `prefix-no-default`, `getPrefix(locale).localePrefix` is `undefined` for the default locale — pass that through so the optional `{-$locale}` segment is omitted.

### `Link`

```tsx
import { Link } from "@tanstack/react-router";
import { getPrefix } from "intlayer";
import { useLocale } from "react-intlayer";

function Nav() {
  const { locale } = useLocale();
  const { localePrefix } = getPrefix(locale);

  return (
    <>
      <Link to="/{-$locale}/" params={{ locale: localePrefix }}>
        Home
      </Link>
      <Link to="/{-$locale}/about" params={{ locale: localePrefix }}>
        About
      </Link>
    </>
  );
}
```

### `useNavigate`

```tsx
import { useNavigate } from "@tanstack/react-router";
import { getPrefix } from "intlayer";
import { useLocale } from "react-intlayer";

function GoAbout() {
  const navigate = useNavigate();
  const { locale } = useLocale();
  const { localePrefix } = getPrefix(locale);

  return (
    <button
      type="button"
      onClick={() =>
        navigate({
          to: "/{-$locale}/about",
          params: { locale: localePrefix },
        })
      }
    >
      About
    </button>
  );
}
```

### Locale switcher

Stay on the current route and only change `locale` via function-style `params` (TanStack optional-path i18n pattern). Call `setLocale` for Intlayer client state:

```tsx
import { Link } from "@tanstack/react-router";
import { getHTMLTextDir, getLocaleName, getPrefix } from "intlayer";
import { useLocale } from "react-intlayer";

export function LocaleSwitcher() {
  const { availableLocales, locale, setLocale } = useLocale();

  return (
    <ul>
      {availableLocales.map((localeEl) => {
        const { localePrefix } = getPrefix(localeEl);

        return (
          <li key={localeEl}>
            <Link
              aria-current={localeEl === locale ? "page" : undefined}
              onClick={() => setLocale(localeEl)}
              params={(prev) => ({
                ...prev,
                locale: localePrefix,
              })}
              to="."
            >
              <span dir={getHTMLTextDir(localeEl)} lang={localeEl}>
                {getLocaleName(localeEl)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
```

`useLocale` also accepts `{ onLocaleChange, isCookieEnabled }`. If `to="."` is insufficient for a given route tree, use the concrete current route `to` (for example `"/{-$locale}/about"`) with the same `params` updater — still no wrapper.

### Migrate / delete wrappers

When a project already has `LocalizedLink`, `useLocalizedNavigate`, or similar:

1. Delete the wrapper files.
2. Rewrite call sites to native `Link` / `useNavigate` with full `to` + `params.locale`.
3. Do not reintroduce wrappers “for DX” — typed route paths are the DX.

## Server functions (9.4)

Prefer `getIntlayerAsync` so metadata/server payloads do not ship every locale:

```tsx
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getCookie, getIntlayerAsync, getLocale } from "intlayer";

export const getLocaleServer = createServerFn().handler(async () => {
  const locale = await getLocale({
    getCookie: (name) => getCookie(name, getRequestHeader("cookie")),
    getHeader: (name) => getRequestHeader(name),
  });
  const content = await getIntlayerAsync("app", locale);
  return { locale, content };
});
```

Pattern:

| Context | API |
| --- | --- |
| Client components | `useIntlayer` / `useLocale` from `react-intlayer` |
| Client formatters | `react-intlayer/format` |
| Server functions / async `head` / loaders | `getIntlayerAsync` / `getLocale` from `intlayer` |
| Sync non-React (acceptable if all locales in bundle) | `getIntlayer` |

## SEO `head` (9.4)

`head` must be `async`. `getIntlayerAsync` is rewritten (when optimize plugins run) to the per-locale chunk.

```ts
import {
  defaultLocale,
  getIntlayerAsync,
  getLocalizedUrl,
  localeMap,
} from "intlayer";

head: async ({ params }) => {
  const locale = params.locale ?? defaultLocale;
  const metaContent = await getIntlayerAsync("app", locale);
  const path = "/";

  return {
    meta: [
      { title: metaContent.meta.title },
      { name: "description", content: metaContent.meta.description },
    ],
    links: [
      { rel: "canonical", href: getLocalizedUrl(path, locale) },
      ...localeMap(({ locale: mapLocale }) => ({
        rel: "alternate",
        hrefLang: mapLocale,
        href: getLocalizedUrl(path, mapLocale),
      })),
      {
        rel: "alternate",
        hrefLang: "x-default",
        href: getLocalizedUrl(path, defaultLocale),
      },
    ],
  };
},
```

Adapt property paths to the project's dictionary shape. Concurrent `getIntlayerAsync` calls for the same chunk share one load.

## 404 strategy

Under the locale layout, provide:

1. Dedicated `404` route targeted by `validatePrefix` redirect when the prefix is invalid.
2. `notFoundComponent` on the locale layout when useful (reuse the same `NotFoundComponent`).
3. Catch-all `$.tsx` under `{-$locale}` for unknown paths (`createFileRoute("/{-$locale}/$")`).

Avoid stacking multiple dynamic segments with optional `{-$locale}` on the same route path (documented pitfall).

## Sitemap / prerender

Disable Start's default sitemap if Intlayer generates one. Emit one URL set per locale matching `routing.mode`.

```ts
// src/routes/sitemap[.]xml.ts
import { createFileRoute } from "@tanstack/react-router";
import { generateSitemap } from "intlayer";

const SITE_URL = (import.meta.env.VITE_SITE_URL ?? "http://localhost:3000").replace(
  /\/$/,
  "",
);

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const sitemap = generateSitemap(
          [
            { path: "/", changefreq: "daily", priority: 1.0 },
            { path: "/about", changefreq: "monthly", priority: 0.8 },
          ],
          { siteUrl: SITE_URL },
        );
        return new Response(sitemap, {
          headers: { "Content-Type": "application/xml" },
        });
      },
    },
  },
});
```

Prerender localized pages with `localeFlatMap` and disable Start's built-in sitemap:

```ts
import { localeFlatMap } from "intlayer";

export const pathList = ["", "/about", "/404"];

const localizedPages = localeFlatMap(({ urlPrefix }) =>
  pathList.map((path) => ({
    path: `${urlPrefix}${path}`,
    prerender: { enabled: true },
  })),
);

// tanstackStart({ sitemap: { enabled: false }, prerender: { enabled: true, crawlLinks: false }, pages: localizedPages })
```

`localeFlatMap` also builds custom URL lists (`data.urlPrefix`, `data.isDefault`). Follow the current Start guide + template for the exact `sitemap[.]xml.ts` / `pages` shape — do not invent Start-specific sitemap APIs.

## Pitfalls checklist

- Missing `routeFileIgnorePattern` → `.content.*` become routes.
- Using `next-intlayer` APIs on Start.
- Adding or keeping `LocalizedLink` / `useLocalizedNavigate` (or any Link/navigate wrapper) instead of native TanStack `Link` / `useNavigate`.
- Copying Intlayer Start template / docs navigation wrappers instead of native optional-param links.
- Sync `getIntlayer` in `head` on 9.4+ (loads all locales). Use `getIntlayerAsync` + `async` `head`.
- `vite-intlayer` only in `devDependencies` while production SSR needs the proxy.
- Locale slot mismatches `routing.mode`.
- Reading cookies/headers in `beforeLoad` instead of `params.locale`.
- Passing a fake default-locale prefix when `getPrefix` returns `localePrefix: undefined` in `prefix-no-default`.
- Treating content nodes as raw strings in HTML attributes.
- Expecting cookie-driven locale switches in **dev** while `enableProxy` is auto (URL-driven in dev/preview).
