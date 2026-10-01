# TanStack Form v2 Alpha

Use this reference only when a repo installs `@tanstack/react-form@alpha` (`2.0.0-alpha.*`) or the user asks to plan a v1-to-v2 migration. npm `latest` is still v1 (`1.33.x`); build new production code on v1 unless the user opts into the alpha.

Status at the 2026-10-01 snapshot:

- `@tanstack/react-form`, `@tanstack/form-core`, `@tanstack/react-form-start`, `@tanstack/react-form-nextjs`: `2.0.0-alpha.2` (2026-08-21), `alpha` dist-tag.
- `@tanstack/react-form-devtools` / `@tanstack/form-devtools`: `1.0.0-alpha.2`.
- `@tanstack/react-form-remix` has no v2 release; the v2 migration guide says it was removed.
- Source: the `alpha` branch of `TanStack/form`, file `docs/migrate-from-v1.md`. Alpha APIs can change between alpha releases; re-read that file before writing v2 code.

## Platform Requirements

- React 18 or 19 (React 17 dropped). Replace `CrossVersionReactNode` imports with `ReactNode` from `react`.
- ESM only, Node.js 18 or newer. No CommonJS build; use dynamic `import()` from CommonJS.
- Vue adapter needs Vue 3.6+ (not relevant to React apps).

## API Changes To Expect

| v1 | v2 alpha |
| --- | --- |
| `field.state.value`, `field.state.meta` | `field.value`, `field.meta` |
| Optional `defaultValues`; field `defaultValue` / `defaultMeta` | `defaultValues` required on `useForm`; field defaults move to form `defaultValues`; `defaultMeta` removed (use validators, `runOnMount`, `errorVisibility`) |
| `validators={{ onChange, onBlur, onChangeAsync, ... }}` | `validators={[{ run, triggers: ['change', 'blur'], ... }]}` (ordered array) |
| `onMount` validator | validator with `runOnMount: true` |
| `onSubmit` validator | `triggers: []`; every validator runs on submit by default (`runOnSubmit: false` to opt out; never put `'submit'` in `triggers`) |
| `onChangeAsyncDebounceMs` | `triggerDebounceMs` on the validator |
| `onChangeListenTo` / `onBlurListenTo` | `watchFields` |
| `validationLogic: revalidateLogic()` | explicit `triggers` (with `when` predicates), `runOnSubmit`, `bailIfInvalid` |
| String errors in `errors` / `errorMap` | Issue objects in `field.errors`, `group.state.errors`, `form.state.errors`; render `error.message` |
| Form-level `{ fields: {...} }` return | return `createErrorMap(...)` result directly |
| Server error routing from `onSubmit` | return `createValidationError(...)` |
| `useStore(form.store, ...)` | `useSelector(form.atom, ...)`; `form.store` / `field.store` become `form.atom` / `field.atom` |
| `<form.Field mode="array">` | `<form.ArrayField>`; mutate with `array.pushValue(...)` or path methods like `form.pushFieldValue(...)` |
| `withForm` | removed; plain component with a `form` prop typed `ReactFormType<typeof formOpts>` (or `AnyReactFormApi` / `FieldWithValue<T>` for generic UI) |
| `useFormGroup` | `form.FormGroup` |
| `withFieldGroup` | `defineFieldGroup(...).bindComponent(...)`; with app hooks, `defineAppFieldGroup` plus `getFormHookHelpers()` |
| `createServerValidate` from the adapter | `serverValidateHelper({ framework: start() })` from `@tanstack/react-form` plus the adapter's `start()` / Next.js helper; server-only validators use `triggers: ['server']` with `runOnSubmit: false`; failures return `serverState` for `useForm({ ...formOpts, serverState })` |

Other alpha additions: `createValidator(...)` for reusable scheduling policies, default form/field/group options on `createFormHook` (alpha.1/alpha.2), tuple inference for subscription selectors without `as const` (alpha.2). In alpha.2, `formOptions.looseSchema` / `formOptions.strictSchema` take the schema as the first argument.

## Migration Order

1. Get the smallest form compiling with ESM imports, required `defaultValues`, `form.Field`, and `form.handleSubmit()`.
2. Move field `defaultValue` into form `defaultValues`; drop `defaultMeta`.
3. Switch render props from `field.state.*` to `field.value` / `field.meta`.
4. Replace `useStore(...store...)` with `useSelector(...atom...)`.
5. Convert validators and listeners to arrays; check submit-time behavior.
6. Convert `mode="array"` to `form.ArrayField`.
7. Return `createErrorMap(...)` from form, group, and server validators; route submit errors with `createValidationError(...)`.
8. Rework composition: `formOptions`, `ReactFormType`, `form.FormGroup`, `defineFieldGroup(...).bindComponent(...)`.
9. Re-run integration tests for validation timing, rerenders, groups, server error hydration, and array mutations.

Do not mix v1 and v2 patterns in one form. If the repo is on v1, keep using the v1 references in this skill.
