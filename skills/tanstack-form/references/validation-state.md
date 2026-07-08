# Validation And State

## Validator Timing

Validators can be declared on fields or on the form:

```tsx
const form = useForm({
  defaultValues: {
    email: '',
  },
  validators: {
    onSubmit: ({ value }) => {
      if (!value.email.includes('@')) {
        return {
          fields: {
            email: 'Enter a valid email address',
          },
        }
      }
    },
  },
})
```

Common validation hooks:

- `onMount`
- `onChange`
- `onChangeAsync`
- `onBlur`
- `onBlurAsync`
- `onSubmit`
- `onSubmitAsync`
- `onDynamic`
- `onDynamicAsync`
- `onServer` in server validation contexts

Field-level validators override form-level field errors for the same field and timing. Use form-level validators for cross-field rules and schemas; use field-level validators for local field UX.

## Errors

Display flattened errors from `field.state.meta.errors` for simple UIs:

```tsx
{field.state.meta.errors.map((error) => (
  <p role="alert" key={String(error)}>
    {String(error)}
  </p>
))}
```

Use `field.state.meta.errorMap` when the UI needs source-specific treatment:

```tsx
<form.Field
  name="email"
  disableErrorFlat
  validators={{
    onChange: ({ value }) =>
      value.includes('@') ? undefined : 'Invalid email',
    onBlur: ({ value }) =>
      value.endsWith('.com') ? undefined : 'Only .com domains allowed',
  }}
>
  {(field) => (
    <>
      {field.state.meta.errorMap.onChange && <p>Fix while typing</p>}
      {field.state.meta.errorMap.onBlur && <p>Fix before submitting</p>}
    </>
  )}
</form.Field>
```

Validators may return strings, booleans, numbers, objects, arrays, or any truthy error value. Falsy values mean valid.

## Standard Schema

TanStack Form supports Standard Schema validation. Current docs call out Zod, Valibot, ArkType, Yup, and Effect Schema support. Use current major versions of those libraries and verify their own docs for parser behavior.

```tsx
import { z } from 'zod'

const schema = z.object({
  age: z.number().min(13),
})

const form = useForm({
  defaultValues: {
    age: 0,
  },
  validators: {
    onChange: schema,
  },
})
```

Schema validation does not pass transformed output values into `onSubmit`; `onSubmit` receives the input values. Parse inside submit handling when transformed output matters:

```tsx
const schema = z.object({
  age: z.coerce.number().min(13),
})

const form = useForm({
  defaultValues: {
    age: '',
  },
  onSubmit: ({ value }) => {
    const parsed = schema.parse(value)
    return save(parsed)
  },
})
```

Use field API parsing helpers, such as `parseValueWithSchema`, when combining custom async logic with schemas at field level.

## Async Validation

Async validators run after sync validators for the same timing. By default, if sync validation fails, async validation does not run. Set `asyncAlways: true` when async validation must still run.

```tsx
<form.Field
  name="username"
  validators={{
    onChange: ({ value }) =>
      value.length < 3 ? 'Use at least 3 characters' : undefined,
    onChangeAsyncDebounceMs: 500,
    onChangeAsync: async ({ value }) => {
      const available = await checkUsername(value)
      return available ? undefined : 'Username is already taken'
    },
  }}
>
  {(field) => <input value={field.state.value} />}
</form.Field>
```

Use `asyncDebounceMs` for all async validators on a field or timing-specific values such as `onChangeAsyncDebounceMs`.

## Dynamic Validation

`onDynamic` only runs when the form uses `revalidateLogic`:

```tsx
import { revalidateLogic, useForm } from '@tanstack/react-form'

const form = useForm({
  defaultValues,
  validationLogic: revalidateLogic({
    mode: 'submit',
    modeAfterSubmission: 'change',
  }),
  validators: {
    onDynamic: schema,
  },
})
```

Supported dynamic modes are `change`, `blur`, and `submit`. Defaults are submit before the first submission and change after submission. Access dynamic errors through `form.state.errorMap.onDynamic` or by subscribing to the store.

For `FormGroup`, pass the `onDynamic` validator to the group itself instead of relying on the parent form's dynamic validator.

## Server And Submit Errors

`onSubmitAsync` can return form and field errors:

```tsx
const form = useForm({
  defaultValues,
  validators: {
    onSubmitAsync: async ({ value }) => {
      const result = await validateOnServer(value)

      if (!result.ok) {
        return {
          form: 'The form could not be saved',
          fields: {
            age: 'Age is not allowed',
            'socials[0].url': 'Invalid URL',
            'details.email': 'Email already exists',
          },
        }
      }
    },
  },
})
```

Use `onSubmitInvalid` for client-side invalid-submit side effects such as focusing the first invalid input.

## Submit Metadata

Use `onSubmitMeta` when submissions need metadata:

```tsx
const form = useForm({
  defaultValues,
  onSubmitMeta: {
    intent: 'save',
  },
  onSubmit: ({ value, meta }) => {
    return submit(value, meta.intent)
  },
})

form.handleSubmit({ intent: 'publish' })
```

Calling `handleSubmit()` with no argument uses the default metadata from `onSubmitMeta`.

## Submit State

`state.canSubmit` is `true` before the form is touched even if a validator would fail. To block submit before interaction, combine it with pristine state:

```tsx
<form.Subscribe selector={(state) => [state.canSubmit, state.isPristine]}>
  {([canSubmit, isPristine]) => (
    <button type="submit" disabled={!canSubmit || isPristine}>
      Submit
    </button>
  )}
</form.Subscribe>
```

When a disabled button would harm accessibility or discoverability, prefer `aria-disabled`, keep the button focusable, and prevent submission in the click or submit handler.
