# Setup And Core API

## Installation

React projects install the React adapter:

```sh
bun add @tanstack/react-form
```

Meta-framework adapters exist for server validation and form-state merging:

```sh
bun add @tanstack/react-form-start
bun add @tanstack/react-form-nextjs
bun add @tanstack/react-form-remix
```

Devtools are separate:

```sh
bun add @tanstack/react-devtools @tanstack/react-form-devtools
```

## Core Model

TanStack Form is headless and controlled. It does not own markup, labels, layout, or focus management. You bind each input to the field API:

```tsx
import { useForm } from '@tanstack/react-form'

function ProfileForm() {
  const form = useForm({
    defaultValues: {
      firstName: '',
      age: 0,
    },
    onSubmit: async ({ value }) => {
      await saveProfile(value)
    },
  })

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault()
        event.stopPropagation()
        void form.handleSubmit()
      }}
    >
      <form.Field name="firstName">
        {(field) => (
          <label>
            First name
            <input
              name={field.name}
              value={field.state.value}
              onBlur={field.handleBlur}
              onChange={(event) => field.handleChange(event.target.value)}
            />
          </label>
        )}
      </form.Field>
    </form>
  )
}
```

Let TypeScript infer the form shape from `defaultValues`. If you need to reuse options, keep the type source in the value:

```tsx
import { formOptions } from '@tanstack/react-form'

const profileFormOptions = formOptions({
  defaultValues: {
    firstName: '',
    age: 0,
  },
})
```

## Field State

Common field state:

- `field.state.value`
- `field.state.meta.errors`
- `field.state.meta.errorMap`
- `field.state.meta.isTouched`
- `field.state.meta.isDirty`
- `field.state.meta.isPristine`
- `field.state.meta.isBlurred`
- `field.state.meta.isValid`
- `field.state.meta.isValidating`
- `field.state.meta.isDefaultValue`

`isDirty` is persistent once a field changes. If the UX needs "currently differs from default", use `!field.state.meta.isDefaultValue`.

If React warns about changing an uncontrolled input to controlled, check missing or incomplete `defaultValues` first.

## Form State And Subscriptions

The form object itself does not cause React re-renders on every state change. Subscribe explicitly:

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
  {([canSubmit, isSubmitting]) => (
    <button type="submit" disabled={!canSubmit || isSubmitting}>
      {isSubmitting ? 'Saving...' : 'Save'}
    </button>
  )}
</form.Subscribe>
```

Use `useStore` when component logic needs reactive values:

```tsx
import { useStore } from '@tanstack/react-form'

const firstName = useStore(form.store, (state) => state.values.firstName)
const errors = useStore(form.store, (state) => state.errorMap)
```

Always pass a selector. Whole-store subscriptions cause unnecessary re-renders.

## App Form Hooks

For production forms, wrap repeated UI with `createFormHook`:

```tsx
import { createFormHook, createFormHookContexts } from '@tanstack/react-form'

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts()

function TextField({ label }: { label: string }) {
  const field = useFieldContext<string>()

  return (
    <label>
      {label}
      <input
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(event) => field.handleChange(event.target.value)}
      />
    </label>
  )
}

function SubmitButton() {
  const form = useFormContext()

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <button type="submit" disabled={isSubmitting}>
          Submit
        </button>
      )}
    </form.Subscribe>
  )
}

export const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    TextField,
  },
  formComponents: {
    SubmitButton,
  },
})
```

Use `form.AppField` for pre-bound field components and `form.AppForm` for form components that read form context:

```tsx
const form = useAppForm({
  defaultValues: {
    firstName: '',
  },
})

return (
  <form.AppForm>
    <form.AppField name="firstName">
      {(field) => <field.TextField label="First name" />}
    </form.AppField>
    <form.SubmitButton />
  </form.AppForm>
)
```

The context values are static class instances with reactive stores, so app form context is not the same performance risk as passing changing values through React context.

## Async Initial Values

For async defaults, fetch data outside the form and provide fallback controlled values until data arrives. TanStack Query is a natural fit:

```tsx
const profileQuery = useQuery({
  queryKey: ['profile', userId],
  queryFn: () => fetchProfile(userId),
})

const form = useForm({
  defaultValues: {
    firstName: profileQuery.data?.firstName ?? '',
    age: profileQuery.data?.age ?? 0,
  },
})
```

Avoid rendering inputs whose values can be `undefined` unless the input intentionally supports that value.

## UI Libraries

TanStack Form integrates through render props. Adapt the library component's event shape to `field.handleChange`:

```tsx
<form.Field name="accepted">
  {(field) => (
    <Checkbox
      checked={field.state.value}
      onCheckedChange={(checked) => field.handleChange(checked === true)}
      onBlur={field.handleBlur}
    />
  )}
</form.Field>
```

For text inputs, bind `value`; for number inputs, convert with `valueAsNumber` or a project-specific parser; for checkbox-like components, pass booleans.
