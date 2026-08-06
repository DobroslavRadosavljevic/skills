# TanStack Form Source Map

Snapshot date: 2026-08-06.

## Current Package Evidence

Npm evidence from this snapshot (`dist-tags.latest`):

- `@tanstack/react-form`: `1.33.3` (published 2026-08-01)
- `@tanstack/form-core`: `1.33.3` (dependency of react-form; also depends on `@tanstack/store` `^0.11.0`, `@tanstack/pacer-lite` `^0.1.1`)
- `@tanstack/react-form-start`: `1.33.3`
- `@tanstack/react-form-nextjs`: `1.33.3`
- `@tanstack/react-form-remix`: `1.33.3`
- `@tanstack/react-form-devtools`: `0.2.32` (depends on `@tanstack/form-devtools` `0.2.32`)
- `@tanstack/react-devtools`: `0.10.9` (host shell for the form plugin)
- Related framework adapters also on `1.33.3`: `@tanstack/solid-form`, `@tanstack/vue-form`, `@tanstack/angular-form`, `@tanstack/svelte-form` (`@tanstack/lit-form` latest was `1.25.3`)
- Legacy schema adapter packages still on npm at `0.42.1` (`@tanstack/zod-form-adapter`, `@tanstack/valibot-form-adapter`, `@tanstack/yup-form-adapter`). Current docs use Standard Schema directly on validators; prefer that over these adapters.

Context7: `/websites/tanstack_form` is the strongest website-backed docs ID. `/tanstack/form` remains useful but its exposed Context7 version was still `v1.11.0` while npm `latest` was `1.33.3`. Prefer `/form/latest` pages and GitHub `main` raw docs when versions matter. Exa/raw checks on 2026-08-06 confirmed reactivity prefers `useSelector` (`useStore` deprecated alias) and Start SSR examples use `createServerFn().validator(...)`.

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
