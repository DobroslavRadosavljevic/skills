# Setup and frameworks

## Contents

- [Packages and imports](#packages-and-imports)
- [Build a reusable component](#build-a-reusable-component)
- [Starter kits](#starter-kits)
- [Locale and SSR](#locale-and-ssr)
- [Next.js app router](#nextjs-app-router)
- [React Router framework mode](#react-router-framework-mode)
- [Client-only bundlers](#client-only-bundlers)
- [Client side routing](#client-side-routing)
- [Content Security Policy](#content-security-policy)
- [Docs for agents](#docs-for-agents)

Docs: https://react-aria.adobe.com/getting-started, https://react-aria.adobe.com/frameworks

## Packages and imports

```bash
bun add react-aria-components
```

`react-aria-components` depends on `react-aria`, `react-stately`, and `@internationalized/date`. Add `@internationalized/date` as your own direct dependency when your code imports it (any date or time component). Add `react-aria` or `react-stately` when your code imports from them. Pin all of them to versions that were released together.

Peer dependencies: React and React DOM 16.8 or newer, including 19.

Import from subpaths. Since 1.17, each component has a subpath that also exports the child components used with it:

```tsx
import {Menu, MenuItem, MenuTrigger, Popover} from 'react-aria-components/Menu';
import {Button} from 'react-aria-components/Button';
import {useButton} from 'react-aria/useButton';
import {useToggleState} from 'react-stately/useToggleState';
import {parseDate} from '@internationalized/date';
```

Subpaths give smaller bundles without relying on tree shaking, faster builds and test runs, and autocomplete that shows only related parts. The main entry (`react-aria-components`) still works and holds a few exports with no component subpath, such as `RouterProvider`.

Utility subpaths: `react-aria-components/slots` (`Provider`, `useContextProps`, `useSlottedContext`, `DEFAULT_SLOT`), `/composeRenderProps`, `/useRenderProps`, `/useListData`, `/useAsyncList`, `/useTreeData`, `/useDragAndDrop`, `/useDrag`, `/useDrop`, `/i18n`, `/I18nProvider`, `/Collection`.

Do not copy `vanilla-starter/*` or `tailwind-starter/*` imports from docs examples into an app. They name the docs' own starter kit, not npm packages. Their components also have convenience props such as `label` and `errorMessage` that real components do not have.

## Build a reusable component

Each React Aria component renders one DOM element. A pattern is a composition of parts. Wrap the parts once and reuse the wrapper:

```tsx
import type {ListBoxItemProps, SelectProps as AriaSelectProps} from 'react-aria-components/Select';
import {
  Select as AriaSelect,
  Button,
  FieldError,
  Label,
  ListBox,
  ListBoxItem,
  Popover,
  SelectValue,
  Text
} from 'react-aria-components/Select';
import type {ReactNode} from 'react';

interface SelectProps<T extends object> extends Omit<AriaSelectProps<T>, 'children'> {
  label?: string;
  description?: string;
  errorMessage?: string;
  items?: Iterable<T>;
  children: ReactNode | ((item: T) => ReactNode);
}

export function Select<T extends object>({label, description, errorMessage, items, children, ...props}: SelectProps<T>) {
  return (
    <AriaSelect {...props}>
      {label && <Label>{label}</Label>}
      <Button>
        <SelectValue />
        <span aria-hidden="true">▼</span>
      </Button>
      {description && <Text slot="description">{description}</Text>}
      <FieldError>{errorMessage}</FieldError>
      <Popover>
        <ListBox items={items}>{children}</ListBox>
      </Popover>
    </AriaSelect>
  );
}

export function SelectItem(props: ListBoxItemProps) {
  return <ListBoxItem {...props} />;
}
```

`Button`, `Popover`, `Label`, and the other shared parts are the same components everywhere. Style them once. There is no `SelectPopover` or `NumberFieldButton`.

## Starter kits

The docs offer each example as copy-paste code, a ZIP, or a StackBlitz project, in vanilla CSS and in Tailwind. The `shadcn` CLI can add the code, styles, and dependencies to a project. Use the menu on each docs example for the exact command. Storybook starter kits hold every component for teams that build a full library. These are copied into your code, so you own them after that. The vanilla examples use `lucide-react` and the Tailwind examples use `lucide-react` and `tailwind-variants`.

## Locale and SSR

React Aria detects the browser language on the client. During SSR the server must use the same locale, or text and date formats cause a hydration mismatch.

1. Find the locale on the server: `Accept-Language`, URL, or a user setting. Check it against your supported list (see below).
2. Set `lang` and `dir` on `<html>`. Use `isRTL(locale)` or `useLocale()`.
3. Wrap the app in `I18nProvider locale={locale}`.
4. Keep strings out of the client bundle with `@react-aria/optimize-locales-plugin`.

React 18 and newer use `React.useId`, so ids match without extra work. `SSRProvider` from `@react-aria/ssr` is only for React 16 and 17.

Three APIs in `react-aria-components/i18n` deliver strings for one locale on the server when the bundle has none:

- `getLocalizationScript(locale, dictionary?)` returns a script string for `bootstrapScriptContent`.
- `LocalizedStringProvider` with `locale`, optional `dictionary`, optional `nonce` renders that script as an element.
- `createLocalizedStringDictionary(packages)` builds a dictionary with only the named packages.

`react-aria-components/i18n/<locale>` holds strings for one locale, such as `react-aria-components/i18n/fr-FR`.

Validate the locale before you use it. The docs examples take the first value of `Accept-Language` as is, but that is client input. `*` is a legal header value, and both `isRTL('*')` and `getLocalizationScript('*')` throw a `RangeError` (tested at 1.22.1). Unhandled, one such request fails with a server error. Also, `getLocalizationScript` puts the locale in an inline script with `JSON.stringify`. So use a known value only:

```ts
const SUPPORTED = ['en-US', 'fr-FR'] as const;

/** Matches on exact tag, then on language, and never returns client text as is. */
export function pickLocale(header: string | null): (typeof SUPPORTED)[number] {
  for (let part of header?.split(',') ?? []) {
    let tag = part.split(';')[0].trim().toLowerCase();
    let match =
      SUPPORTED.find(l => l.toLowerCase() === tag) ??
      SUPPORTED.find(l => l.split('-')[0].toLowerCase() === tag.split('-')[0]);
    if (match) {
      return match;
    }
  }
  return SUPPORTED[0];
}
```

The Next.js and React Router examples below show the header line from the docs for clarity. Replace it with `pickLocale`.

## Next.js app router

Client boundary first. React Aria Components are client components (the package depends on `client-only`), so server components must not render logic that needs them outside a `'use client'` boundary.

```tsx
// app/layout.tsx
import {headers} from 'next/headers';
import {isRTL} from 'react-aria-components/I18nProvider';
import {ClientProviders} from './provider';

export default async function RootLayout({children}) {
  const acceptLanguage = (await headers()).get('accept-language');
  const lang = acceptLanguage?.split(/[,;]/)[0] || 'en-US';

  return (
    <html lang={lang} dir={isRTL(lang) ? 'rtl' : 'ltr'}>
      <body>
        <ClientProviders lang={lang}>{children}</ClientProviders>
      </body>
    </html>
  );
}
```

```tsx
// app/provider.tsx
'use client';
import {I18nProvider} from 'react-aria-components/I18nProvider';

export function ClientProviders({lang, children}) {
  return <I18nProvider locale={lang}>{children}</I18nProvider>;
}
```

Turbopack needs Next.js 15.4 or newer for the locale plugin. Spread its rules into your existing rules:

```ts
// next.config.ts
import type {NextConfig} from 'next';
import optimizeLocales from '@react-aria/optimize-locales-plugin';

const localeOptimization = optimizeLocales.turbopack({locales: ['en-US', 'fr-FR']});

// At plugin 2.1.0 and Next 16.4, the plugin's rule type does not match Next's rule type, so cast.
type TurbopackRules = NonNullable<NonNullable<NextConfig['turbopack']>['rules']>;

const config: NextConfig = {
  turbopack: {
    rules: {
      ...(localeOptimization.rules as unknown as TurbopackRules)
    }
  }
};

export default config;
```

With webpack, push `optimizeLocales.webpack({locales})` into `config.plugins`.

Add `<meta property="csp-nonce" content={nonce}>` when a CSP uses nonces.

## React Router framework mode

Reveal `entry.server.tsx` with `bunx react-router reveal`, then wrap and inject:

```tsx
// app/entry.server.tsx (the changed parts)
import {I18nProvider} from 'react-aria-components/I18nProvider';
import {getLocalizationScript} from 'react-aria-components/i18n';

const lang = request.headers.get('accept-language')?.split(/[,;]/)[0] || 'en-US';

const {pipe, abort} = renderToPipeableStream(
  <I18nProvider locale={lang}>
    <ServerRouter context={routerContext} url={request.url} />
  </I18nProvider>,
  {bootstrapScriptContent: getLocalizationScript(lang)}
);
```

```tsx
// app/root.tsx
import {useLocale} from 'react-aria-components/I18nProvider';

export function Layout({children}) {
  let {locale, direction} = useLocale();
  return (
    <html lang={locale} dir={direction}>
      <body>{children}</body>
    </html>
  );
}
```

```ts
// vite.config.ts: no strings in the client bundle, because the server injects them
import localesPlugin from '@react-aria/optimize-locales-plugin';

const plugins = [
  {...localesPlugin.vite({locales: []}), enforce: 'pre' as const}
];
```

Any other SSR framework follows the same plan: `I18nProvider` on the server, `lang` and `dir` on `<html>`, and `getLocalizationScript` or `LocalizedStringProvider` with `locales: []`. TanStack Start and others are not covered by the docs, so verify hydration in the real app.

## Client-only bundlers

Without the plugin, strings for all 30+ languages ship in the bundle. List the locales that you support:

```ts
// Vite: the plugin must run first
import optimizeLocales from '@react-aria/optimize-locales-plugin';

const plugins = [
  {...optimizeLocales.vite({locales: ['en-US', 'fr-FR']}), enforce: 'pre' as const}
];
```

```js
// webpack
const optimizeLocales = require('@react-aria/optimize-locales-plugin');
module.exports = {plugins: [optimizeLocales.webpack({locales: ['en-US', 'fr-FR']})]};
```

```js
// Rollup: plugins: [optimizeLocales.rollup({locales})]
// esbuild: plugins: [optimizeLocales.esbuild({locales})]
```

Parcel uses a resolver instead. Install `@react-aria/parcel-resolver-optimize-locales`, then:

```json
{"extends": "@parcel/config-default", "resolvers": ["@react-aria/parcel-resolver-optimize-locales", "..."]}
```

Add `"locales": ["en-US", "fr-FR"]` to the root `package.json`.

Plugin version 2 uses `unplugin@2`, which webpack 4 does not support.

## Client side routing

Links with `href` (in `Link`, `MenuItem`, `ListBoxItem`, `Tab`, `Breadcrumb`, and other items) are plain page navigations by default. Two ways to connect a router:

Use `render` on one element. This also keeps router features such as prefetch on hover:

```tsx
import {Link} from 'react-aria-components/Link';
import NextLink from 'next/link';

<Link href="/about" render={props => ('href' in props ? <NextLink {...props} /> : <span {...props} />)}>
  About
</Link>;
```

```tsx
import {Link} from 'react-aria-components/Link';
import {Link as RouterLink} from 'react-router';

<Link
  href="/about"
  render={props => ('href' in props ? <RouterLink {...props} to={props.href} /> : <span {...props} />)}>
  About
</Link>;
```

The docs show `render={props => <NextLink {...props} />}` with no check. In TypeScript, `Link` passes props for either an `<a>` or a `<span>`, because a `Link` with no `href` renders a `<span role="link">`. The `'href' in props` check narrows the type and also handles that case. The same pattern fits other routers, such as TanStack Router's `Link` with `to={props.href}`. The React Aria docs do not cover that router, so test it in the app.

Use `RouterProvider` to send all nested React Aria links through one function. `useHref` converts a router path to a real `href`, for example to add a base path:

```tsx
import {RouterProvider} from 'react-aria-components';
import {useHref, useNavigate} from 'react-router';

function Providers({children}) {
  let navigate = useNavigate();
  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      {children}
    </RouterProvider>
  );
}
```

To type `href` and pass options through `routerOptions`, augment `RouterConfig`:

```ts
import type {NavigateOptions} from 'react-router';

declare module '@react-types/shared' {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}
```

Target `@react-types/shared`, where the interface is declared. `react-aria-components` only re-exports it, so augmenting that name does not change `Href` or `RouterOptions`. With strict `node_modules` layouts such as pnpm, add `@react-types/shared` as a direct dev dependency so the module name resolves.

## Content Security Policy

Some components inject style elements. When a CSP uses a nonce, React Aria reads it from one of these:

- `<meta property="csp-nonce" content="...">` in the document head (Next.js, React Router, Parcel, Rollup, esbuild).
- `html.cspNonce` in Vite config.
- `__webpack_nonce__` set in the webpack entry script.

## Docs for agents

- Every docs page has Markdown: add `.md` to the URL. The index is https://react-aria.adobe.com/llms.txt.
- Official MCP server: `bunx @react-aria/mcp@latest` (the docs show the `npx` form). It needs Node.js.
- `@react-aria/test-utils` is a separate dev dependency. See [testing.md](testing.md).
