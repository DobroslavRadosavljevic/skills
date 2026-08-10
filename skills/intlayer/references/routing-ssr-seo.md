# Routing, SSR, and SEO

## Locale proxy (SSR)

The Vite `intlayer()` plugin wires locale detection/redirect/rewrite when `routing.enableProxy` is `true` (v9 default).

Detection order (docs/defaults): URL prefix → cookie (default `INTLAYER_LOCALE`) → `Accept-Language` / locale header (`x-intlayer-locale`).

Disable only when the app owns locale routing:

```ts
routing: { enableProxy: false }
```

Ignore API/server-route paths in the plugin so they are not rewritten:

```ts
intlayer({
  proxy: { ignore: (req) => req.url?.startsWith("/api") },
})
```

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

If `to="."` is insufficient for a given route tree, use the concrete current route `to` (for example `"/{-$locale}/about"`) with the same `params` updater — still no wrapper.

### Migrate / delete wrappers

When a project already has `LocalizedLink`, `useLocalizedNavigate`, or similar:

1. Delete the wrapper files.
2. Rewrite call sites to native `Link` / `useNavigate` with full `to` + `params.locale`.
3. Do not reintroduce wrappers “for DX” — typed route paths are the DX.

## Server functions

```tsx
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { getCookie, getIntlayer, getLocale } from "intlayer";

export const getLocaleServer = createServerFn().handler(async () => {
  const locale = await getLocale({
    getCookie: (name) => getCookie(name, getRequestHeader("cookie")),
    getHeader: (name) => getRequestHeader(name),
  });
  const content = getIntlayer("app", locale);
  return { locale, content };
});
```

Pattern:

| Context | API |
| --- | --- |
| Client components | `useIntlayer` / `useLocale` from `react-intlayer` |
| Server functions / head / non-React | `getIntlayer` / `getLocale` from `intlayer` |

## SEO `head`

```ts
import {
  defaultLocale,
  getIntlayer,
  getLocalizedUrl,
  localeMap,
} from "intlayer";

head: ({ params }) => {
  const locale = params.locale ?? defaultLocale;
  const metaContent = getIntlayer("app", locale);

  return {
    meta: [
      { title: metaContent.meta.title },
      { name: "description", content: metaContent.meta.description },
    ],
    links: [
      { rel: "canonical", href: getLocalizedUrl("/", locale) },
      ...localeMap(({ locale: mapLocale }) => ({
        rel: "alternate",
        hrefLang: mapLocale,
        href: getLocalizedUrl("/", mapLocale),
      })),
      {
        rel: "alternate",
        hrefLang: "x-default",
        href: getLocalizedUrl("/", defaultLocale),
      },
    ],
  };
},
```

Adapt property paths to the project's dictionary shape.

## 404 strategy

Under the locale layout, provide:

1. `404` route targeted by `validatePrefix` redirect when the prefix is invalid.
2. `notFoundComponent` on the locale layout when useful.
3. Catch-all `$.tsx` under `{-$locale}` for unknown paths.

Avoid stacking multiple dynamic segments with optional `{-$locale}` on the same route path (documented pitfall).

## Sitemap / prerender

When using Intlayer sitemap helpers (`generateSitemap`, `localeFlatMap` / `localeMap`):

- Disable or replace Start's default sitemap if it conflicts.
- Emit one URL set per locale matching `routing.mode`.
- Prerender localized pages via locale mapping helpers when the project uses static/prerender modes.

Follow the current Start guide + template for the exact `sitemap[.]xml.ts` shape — do not invent Start-specific sitemap APIs.

## Pitfalls checklist

- Missing `routeFileIgnorePattern` → `.content.*` become routes.
- Using `next-intlayer` APIs on Start.
- Adding or keeping `LocalizedLink` / `useLocalizedNavigate` (or any Link/navigate wrapper) instead of native TanStack `Link` / `useNavigate`.
- Copying Intlayer Start template / docs navigation wrappers instead of native optional-param links.
- `vite-intlayer` only in `devDependencies` while production SSR needs the proxy.
- Locale slot mismatches `routing.mode`.
- Reading cookies/headers in `beforeLoad` instead of `params.locale`.
- Passing a fake default-locale prefix when `getPrefix` returns `localePrefix: undefined` in `prefix-no-default`.
- Treating content nodes as raw strings in HTML attributes.
