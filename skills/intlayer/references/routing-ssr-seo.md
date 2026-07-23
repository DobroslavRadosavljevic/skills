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

## Locale-aware navigation

### `LocalizedLink`

Strip the `{-$locale}` segment from `to`, inject `params.locale` via `getPrefix(locale).localePrefix`:

```tsx
import { Link, type LinkComponentProps } from "@tanstack/react-router";
import { getPrefix } from "intlayer";
import { useLocale } from "react-intlayer";

export const LOCALE_ROUTE = "{-$locale}" as const;

export function LocalizedLink(props: Omit<LinkComponentProps, "to"> & { to?: string }) {
  const { locale } = useLocale();
  const { localePrefix } = getPrefix(locale);

  return (
    <Link
      {...props}
      params={{
        locale: localePrefix,
        ...(typeof props.params === "object" ? props.params : {}),
      }}
      to={`/${LOCALE_ROUTE}${props.to ?? ""}` as LinkComponentProps["to"]}
    />
  );
}
```

In `prefix-no-default`, default locale `localePrefix` may be empty — that is expected.

### `useLocalizedNavigate`

Mirror the same prefix injection with `useNavigate` from TanStack Router. Prefer typed helpers from the official guide / template when the project already has them.

### Locale switcher

```tsx
import { useLocation } from "@tanstack/react-router";
import {
  getHTMLTextDir,
  getLocaleName,
  getPathWithoutLocale,
  getPrefix,
} from "intlayer";
import { useLocale } from "react-intlayer";
import { LocalizedLink } from "./localized-link";

export function LocaleSwitcher() {
  const { pathname } = useLocation();
  const { availableLocales, locale, setLocale } = useLocale();
  const pathWithoutLocale = getPathWithoutLocale(pathname);

  return (
    <ul>
      {availableLocales.map((localeEl) => (
        <li key={localeEl}>
          <LocalizedLink
            aria-current={localeEl === locale ? "page" : undefined}
            onClick={() => setLocale(localeEl)}
            params={{ locale: getPrefix(localeEl).localePrefix }}
            to={pathWithoutLocale}
          >
            <span dir={getHTMLTextDir(localeEl)} lang={localeEl}>
              {getLocaleName(localeEl)}
            </span>
          </LocalizedLink>
        </li>
      ))}
    </ul>
  );
}
```

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
- `vite-intlayer` only in `devDependencies` while production SSR needs the proxy.
- Locale slot mismatches `routing.mode`.
- Reading cookies/headers in `beforeLoad` instead of `params.locale`.
- Forgetting empty `localePrefix` for default locale in `prefix-no-default`.
- Treating content nodes as raw strings in HTML attributes.
