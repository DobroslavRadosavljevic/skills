# TanStack Form Source Map

Snapshot date: 2026-10-01.

## Current Package Evidence

Npm evidence from this snapshot (`dist-tags.latest`):

- `@tanstack/react-form`: `1.33.5` (published 2026-08-11; peer `react` `^17 || ^18 || ^19`)
- `@tanstack/form-core`: `1.33.5` (depends on `@tanstack/store` `^0.11.0`, `@tanstack/pacer-lite` `^0.1.1`, `@tanstack/devtools-event-client` `^0.4.1`)
- `@tanstack/react-form-start`: `1.33.5`
- `@tanstack/react-form-nextjs`: `1.33.5`
- `@tanstack/react-form-remix`: `1.33.5`
- `@tanstack/react-form-devtools`: `0.2.34` (depends on `@tanstack/form-devtools` `0.2.34`)
- `@tanstack/react-devtools`: `0.10.13` (host shell for the form plugin)
- Related framework adapters also on `1.33.5`: `@tanstack/solid-form`, `@tanstack/vue-form`, `@tanstack/angular-form`, `@tanstack/svelte-form` (`@tanstack/lit-form` latest is `1.25.5`)
- Legacy schema adapter packages still on npm at `0.42.1` (`@tanstack/zod-form-adapter`, `@tanstack/valibot-form-adapter`, `@tanstack/yup-form-adapter`). Current docs use Standard Schema directly on validators; prefer that over these adapters.

Changes since the previous snapshot (`1.33.3`): `1.33.4` had no notable changes; `1.33.5` preserves sibling fields whose names share a prefix when deleting a field. No v1 API changes.

## v2 Alpha

- `alpha` dist-tag: `2.0.0-alpha.2` (2026-08-21) for `@tanstack/react-form`, `@tanstack/form-core`, `@tanstack/react-form-start`, `@tanstack/react-form-nextjs`, and other framework adapters; devtools packages are on `1.0.0-alpha.2`. `@tanstack/react-form-remix` has no v2 release.
- v2 changes field render props, validator shape, error objects, arrays, composition, and server validation. See [v2-alpha.md](v2-alpha.md).
- Primary source: `https://github.com/TanStack/form/blob/alpha/docs/migrate-from-v1.md` (raw: `https://raw.githubusercontent.com/TanStack/form/alpha/docs/migrate-from-v1.md`). The `/form/latest` site documents v1.

## Docs Notes

Context7: `/websites/tanstack_form` is the strongest website-backed docs ID. `/tanstack/form` remains useful but its exposed Context7 version can lag npm `latest`. Prefer `/form/latest` pages and GitHub `main` raw docs when versions matter. Raw checks on 2026-10-01 confirmed the v1 reactivity guide prefers `useSelector(form.store, selector)` (`useStore` is a deprecated alias) and Start SSR examples use `createServerFn().validator(...)` with `@tanstack/react-form-start`.

The v1 SSR guide links to a TanStack Start "TanStack Form" guide (`/start/latest/docs/framework/react/guide/tanstack-form`). At this snapshot the Router-repo PR adding that page was still open, so the link may not resolve yet.

## Official Current Docs

Core:

- Overview: `https://tanstack.com/form/latest/docs/overview`
- Installation: `https://tanstack.com/form/latest/docs/installation`
- Philosophy: `https://tanstack.com/form/latest/docs/philosophy`
- TypeScript: `https://tanstack.com/form/latest/docs/typescript`

React:

- Quick start: `https://tanstack.com/form/latest/docs/framework/react/quick-start`
- Basic concepts: `https://tanstack.com/form/latest/docs/framework/react/guides/basic-concepts`
- Validation: `https://tanstack.com/form/latest/docs/framework/react/guides/validation`
- Dynamic validation: `https://tanstack.com/form/latest/docs/framework/react/guides/dynamic-validation`
- Custom errors: `https://tanstack.com/form/latest/docs/framework/react/guides/custom-errors`
- Submission handling: `https://tanstack.com/form/latest/docs/framework/react/guides/submission-handling`
- Arrays: `https://tanstack.com/form/latest/docs/framework/react/guides/arrays`
- Form composition: `https://tanstack.com/form/latest/docs/framework/react/guides/form-composition`
- Form groups: `https://tanstack.com/form/latest/docs/framework/react/guides/form-groups`
- Linked fields: `https://tanstack.com/form/latest/docs/framework/react/guides/linked-fields`
- Listeners: `https://tanstack.com/form/latest/docs/framework/react/guides/listeners`
- Reactivity: `https://tanstack.com/form/latest/docs/framework/react/guides/reactivity`
- Async initial values: `https://tanstack.com/form/latest/docs/framework/react/guides/async-initial-values`
- Focus management: `https://tanstack.com/form/latest/docs/framework/react/guides/focus-management`
- UI libraries: `https://tanstack.com/form/latest/docs/framework/react/guides/ui-libraries`
- React Native: `https://tanstack.com/form/latest/docs/framework/react/guides/react-native`
- Devtools: `https://tanstack.com/form/latest/docs/framework/react/guides/devtools`
- Debugging: `https://tanstack.com/form/latest/docs/framework/react/guides/debugging`
- SSR and meta-framework usage: `https://tanstack.com/form/latest/docs/framework/react/guides/ssr`

Reference:

- `useForm`: `https://tanstack.com/form/latest/docs/framework/react/reference/functions/useForm`
- `createFormHook`: `https://tanstack.com/form/latest/docs/framework/react/reference/functions/createFormHook`
- `createFormHookContexts`: `https://tanstack.com/form/latest/docs/framework/react/reference/functions/createFormHookContexts`
- `useFieldGroup`: `https://tanstack.com/form/latest/docs/framework/react/reference/functions/useFieldGroup`
- `formOptions`: `https://tanstack.com/form/latest/docs/reference/functions/formOptions`
- `revalidateLogic`: `https://tanstack.com/form/latest/docs/reference/functions/revalidateLogic`
- `mergeForm`: `https://tanstack.com/form/latest/docs/reference/functions/mergeForm`

## Raw Docs

Use GitHub raw docs when the website is hard to fetch:

- `https://raw.githubusercontent.com/TanStack/form/main/docs/installation.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/overview.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/philosophy.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/framework/react/quick-start.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/framework/react/guides/<guide-name>.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/framework/react/reference/functions/<FunctionName>.md`
- `https://raw.githubusercontent.com/TanStack/form/main/docs/reference/functions/<functionName>.md`

Refresh this source map when package versions drift, when SSR adapter docs change, when Standard Schema support changes, or when the app hits TypeScript performance limits around form composition.
