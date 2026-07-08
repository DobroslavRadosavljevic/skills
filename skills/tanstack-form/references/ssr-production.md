# SSR And Production

## SSR Adapter Packages

TanStack Form supports React SSR directly, with meta-framework adapters for server validation and state merging:

- TanStack Start: `@tanstack/react-form-start`
- Next.js App Router: `@tanstack/react-form-nextjs`
- Remix: `@tanstack/react-form-remix`

The common pattern:

1. Share the form shape through adapter `formOptions`.
2. Validate submitted `FormData` on the server with `createServerValidate`.
3. Return adapter form state when server validation fails.
4. Merge server-returned state into the client form with `mergeForm` and `useTransform`.
5. Ensure posted inputs have `name` attributes.

## TanStack Start

Use Start adapter exports for shared options and server validation:

```tsx
import { formOptions } from '@tanstack/react-form-start'

export const formOpts = formOptions({
  defaultValues: {
    firstName: '',
    age: 0,
  },
})
```

Server function outline:

```tsx
import {
  createServerValidate,
  ServerValidateError,
} from '@tanstack/react-form-start'

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: ({ value }) =>
    value.age < 12 ? 'You must be at least 12' : undefined,
})

export const handleForm = createServerFn({ method: 'POST' })
  .inputValidator((data: unknown) => {
    if (!(data instanceof FormData)) {
      throw new Error('Invalid form data')
    }

    return data
  })
  .handler(async ({ data }) => {
    try {
      const validatedData = await serverValidate(data)
      return save(validatedData)
    } catch (error) {
      if (error instanceof ServerValidateError) {
        return error.response
      }

      throw error
    }
  })
```

Client outline:

```tsx
import {
  mergeForm,
  useForm,
  useTransform,
} from '@tanstack/react-form-start'

const form = useForm({
  ...formOpts,
  transform: useTransform((baseForm) => mergeForm(baseForm, state), [state]),
})
```

## Next.js App Router

Use the Next.js adapter in server files and client files. If a component errors because it imports hooks into a Server Component, verify the import path and `"use client"` boundaries.

Shared server options:

```tsx
import { formOptions } from '@tanstack/react-form-nextjs'

export const formOpts = formOptions({
  defaultValues: {
    firstName: '',
    age: 0,
  },
})
```

Server action outline:

```tsx
'use server'

import {
  createServerValidate,
  ServerValidateError,
} from '@tanstack/react-form-nextjs'

const serverValidate = createServerValidate({
  ...formOpts,
  onServerValidate: ({ value }) =>
    value.age < 12 ? 'You must be at least 12' : undefined,
})

export async function submitAction(_previous: unknown, formData: FormData) {
  try {
    return await serverValidate(formData)
  } catch (error) {
    if (error instanceof ServerValidateError) {
      return error.formState
    }

    throw error
  }
}
```

Client outline:

```tsx
'use client'

import { useActionState } from 'react'
import {
  initialFormState,
  mergeForm,
  useForm,
  useTransform,
} from '@tanstack/react-form-nextjs'

const [state, action] = useActionState(submitAction, initialFormState)

const form = useForm({
  ...formOpts,
  transform: useTransform((baseForm) => mergeForm(baseForm, state), [state]),
})
```

Use `<form action={action as never} onSubmit={() => form.handleSubmit()}>` only when it matches the local framework pattern and tests confirm both client and server validation paths.

## Remix

Use Remix adapter exports for server action validation:

```tsx
import {
  createServerValidate,
  ServerValidateError,
  formOptions,
  initialFormState,
} from '@tanstack/react-form-remix'
```

On the client, merge `useActionData()` into the form:

```tsx
import {
  Form,
  mergeForm,
  useForm,
  useTransform,
} from '@tanstack/react-form'

const actionData = useActionData<typeof action>()

const form = useForm({
  ...formOpts,
  transform: useTransform(
    (baseForm) => mergeForm(baseForm, actionData ?? initialFormState),
    [actionData],
  ),
})
```

Check import paths carefully. Remix examples import the route `Form` from `@tanstack/react-form` while server validation helpers come from `@tanstack/react-form-remix`.

## Devtools

Install:

```sh
npm i @tanstack/react-devtools @tanstack/react-form-devtools
```

Root setup:

```tsx
import { TanStackDevtools } from '@tanstack/react-devtools'
import { formDevtoolsPlugin } from '@tanstack/react-form-devtools'

<TanStackDevtools plugins={[formDevtoolsPlugin()]} />
```

Use devtools while debugging stale-looking state. If UI does not update, confirm the component subscribes with `form.Subscribe` or `useStore`.

## Debugging

Common issues:

- Uncontrolled-to-controlled warning: add complete `defaultValues` before rendering controlled inputs.
- `field.state.value` is `unknown`: the form type may be too large; break the form into smaller pieces or narrow the field type locally.
- TypeScript reports "type instantiation is excessively deep": isolate a minimal reproduction, reduce composition depth, and check for overly large inferred form types.
- ESLint flags hooks inside `withForm` render: use `render: function Render(...)` instead of an anonymous arrow.
- Next.js complains about hooks in a Server Component: use the correct adapter import and client boundary.

## Accessibility And Focus

TanStack Form does not inspect markup, so implement accessibility in the app:

- Associate labels with inputs.
- Set `name` attributes for native form submission and server actions.
- Use `aria-invalid` when a touched field is invalid.
- Render error text with an accessible announcement pattern, commonly `role="alert"`.
- On invalid submit, focus the first invalid input from `onSubmitInvalid`.
- Avoid relying only on disabled buttons for explanations. Use visible errors, helper text, or `aria-disabled` patterns when users need to understand why submit is blocked.

Focus example:

```tsx
const form = useForm({
  defaultValues,
  onSubmitInvalid() {
    const input = document.querySelector(
      '[aria-invalid="true"]',
    ) as HTMLInputElement | null

    input?.focus()
  },
})
```

React Native cannot query the DOM; keep refs for focus management.

## Production Checklist

Before calling a TanStack Form change done, verify:

- Every controlled input has a defined default value.
- Validation timing matches product expectations.
- Async validators are debounced and race-safe enough for the UX.
- Server errors render at both form and field levels.
- Array mutations preserve the intended item identity.
- Field groups and form groups use relative keys where required.
- SSR adapters import from the correct package for the current environment.
- Submit buttons reflect `canSubmit`, `isSubmitting`, and pristine behavior intentionally.
- Tests cover invalid submit, successful submit, server-returned errors, resets, and any debounced validation or listener behavior.
