---
name: tanstack-form
description: "Build, review, debug, migrate, or plan TanStack Form v1 React forms with current docs. Use for @tanstack/react-form, @tanstack/form-core, useForm, form.Field, createFormHook, createFormHookContexts, withForm, withFieldGroup, formOptions, form.Subscribe, useStore, validators, Standard Schema validation, Zod, Valibot, ArkType, Effect Schema, async validation, dynamic validation, array fields, FormGroup, linked fields, listeners, SSR, TanStack Start, Next.js, Remix, devtools, UI libraries, accessibility, and production form composition."
---

# TanStack Form

Use this skill when work touches TanStack Form v1, especially `@tanstack/react-form`, form state, validation, reusable app form hooks, SSR adapters, or migrations from ad hoc React form handling.

## Workflow

1. Inspect the local form stack before changing code:
   - Package versions for `@tanstack/react-form`, `@tanstack/form-core`, SSR adapters, devtools, React, schema libraries, UI libraries, and test utilities.
   - Form pattern: one-off `useForm`, app-wide `createFormHook`, nested `withForm`, reusable `withFieldGroup`, SSR adapter forms, or React Native.
   - Validation intent: field-level, form-level, Standard Schema, async validators, dynamic revalidation, server validation, or submit-time errors.
   - Rendering contract: controlled fields, labels, error display, focus management, submit state, and accessibility expectations.
2. Refresh current docs and package evidence when behavior or versions matter. Start from [source-map.md](references/source-map.md).
3. For installation, core APIs, `useForm`, `form.Field`, `createFormHook`, app fields, subscriptions, async defaults, and UI-library wiring, use [setup-core.md](references/setup-core.md).
4. For field/form validators, Standard Schema, async validation, dynamic validation, server errors, custom errors, submit metadata, and transformed values, use [validation-state.md](references/validation-state.md).
5. For large forms, reusable app form hooks, `withForm`, `withFieldGroup`, arrays, `FormGroup`, linked fields, and listeners, use [composition-arrays-groups.md](references/composition-arrays-groups.md).
6. For TanStack Start, Next.js App Router, Remix, server validation, devtools, debugging, accessibility, and production checks, use [ssr-production.md](references/ssr-production.md).

## Implementation Judgment

- Prefer type inference from `defaultValues` or shared `formOptions`. Avoid adding broad `useForm<MyType>()` generics unless the local codebase already needs them.
- Use plain `useForm` plus `form.Field` for small or one-off forms. For product forms and design-system integration, prefer `createFormHook` with pre-bound field and form components.
- Treat TanStack Form fields as controlled fields. Wire `value`, `onBlur`, and `onChange` explicitly to the field API.
- Subscribe deliberately. Use `form.Subscribe` for UI fragments and `useStore(form.store, selector)` for component logic. Avoid whole-store subscriptions.
- Keep validation timing intentional. Choose `onChange`, `onBlur`, `onSubmit`, `onMount`, `onDynamic`, and async validators based on UX, not by habit.
- Standard Schema validation checks input values; it does not hand transformed output to `onSubmit`. Parse inside `onSubmit` when transformed schema output matters.
- Use `onChangeListenTo` or `onBlurListenTo` for cross-field validation and `listeners` for side effects such as resets, analytics, or autosave.
- For multi-step forms, prefer `FormGroup` over separate isolated forms when one final submitted value and shared validation state are needed.
- In SSR frameworks, share the form shape through adapter `formOptions`, validate server-side with `createServerValidate`, and merge returned form state with `mergeForm` plus `useTransform`.

## Verification

Prefer the repo's existing checks. For meaningful TanStack Form changes, include the relevant subset:

- Typecheck for field names, deep keys, default values, validators, submit metadata, field groups, and SSR adapter imports.
- Focused tests for validation timing, async debounce, submit errors, array mutations, linked fields, listener side effects, and reset/default behavior.
- Browser smoke for controlled inputs, error rendering, disabled or aria-disabled submit behavior, focus on invalid submit, loading defaults, and server-returned errors.
- SSR/action tests when changing TanStack Start, Next.js, or Remix adapter flows.
- Devtools or debug inspection when state appears stale; form state is non-reactive unless explicitly subscribed.
