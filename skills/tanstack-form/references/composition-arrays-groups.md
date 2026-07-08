# Composition, Arrays, And Groups

## Choosing An API

Use the smallest composition API that solves the problem:

- `useForm` and `form.Field` for local one-off forms.
- `createFormHook` and `form.AppField` for design-system fields and repeated product forms.
- `withForm` for splitting a large form into smaller typed components.
- `withFieldGroup` for reusable groups of related fields that can be mounted under different object paths.
- `FormGroup` for multi-step or sub-form workflows that need scoped submit and validation state.

## `withForm`

`withForm` preserves type safety without requiring callers to pass generics:

```tsx
const formOpts = formOptions({
  defaultValues: {
    firstName: '',
    lastName: '',
  },
})

const NameSection = withForm({
  ...formOpts,
  props: {
    title: 'Name',
  },
  render: function Render({ form, title }) {
    return (
      <section>
        <h2>{title}</h2>
        <form.AppField name="firstName">
          {(field) => <field.TextField label="First name" />}
        </form.AppField>
      </section>
    )
  },
})
```

Prefer a named `render: function Render(...)` when the render body uses hooks, because lint rules may not recognize an inline arrow as a component.

Avoid deep chains of `extendForm`; the docs warn that many app-form extensions can reduce TypeScript performance. Keep extension chains shallow.

The context fallback from `useTypedAppFormContext` is for integration constraints, such as routes or outlets that cannot receive props. Prefer passing `form` explicitly through `withForm` when possible.

## Field Groups

Use `withFieldGroup` for reusable sets of fields:

```tsx
type PasswordFields = {
  password: string
  confirmPassword: string
}

const defaultValues: PasswordFields = {
  password: '',
  confirmPassword: '',
}

const PasswordFieldsGroup = withFieldGroup({
  defaultValues,
  props: {
    title: 'Password',
  },
  render: function Render({ group, title }) {
    return (
      <fieldset>
        <legend>{title}</legend>
        <group.AppField name="password">
          {(field) => <field.TextField label="Password" />}
        </group.AppField>
        <group.AppField
          name="confirmPassword"
          validators={{
            onChangeListenTo: ['password'],
            onChange: ({ value }) =>
              value === group.getFieldValue('password')
                ? undefined
                : 'Passwords do not match',
          }}
        >
          {(field) => <field.TextField label="Confirm password" />}
        </group.AppField>
      </fieldset>
    )
  },
})
```

Mount a group by object path:

```tsx
<PasswordFieldsGroup form={form} fields="account.passwords" title="Password" />
```

Or by field map when the names differ:

```tsx
<PasswordFieldsGroup
  form={form}
  fields={{
    password: 'newPassword',
    confirmPassword: 'confirmNewPassword',
  }}
  title="Password"
/>
```

Group fields are typed to the group, but the parent form could contain broader values. Prefer `group.getFieldValue` and group methods inside group render functions.

## Arrays

Use `mode="array"` when the field value is an array:

```tsx
<form.Field name="people" mode="array">
  {(field) => (
    <>
      {field.state.value.map((_, index) => (
        <form.Field key={index} name={`people[${index}].name`}>
          {(nameField) => (
            <input
              value={nameField.state.value}
              onChange={(event) =>
                nameField.handleChange(event.target.value)
              }
            />
          )}
        </form.Field>
      ))}
      <button
        type="button"
        onClick={() => field.pushValue({ name: '', age: 0 })}
      >
        Add person
      </button>
    </>
  )}
</form.Field>
```

Useful array field methods:

- `pushValue`
- `insertValue`
- `removeValue`
- `swapValues`
- `moveValue`
- `replaceValue`
- `clearValues`

Use stable domain keys when possible. If no stable id exists yet, index keys may be acceptable for simple append-only examples, but they are fragile for reordering.

## FormGroup

Use `<form.FormGroup>` for sub-forms such as multi-step flows:

```tsx
<form.FormGroup
  name="step1"
  onGroupSubmit={() => setStep(1)}
  onGroupSubmitInvalid={() => reportInvalidStep()}
>
  {(group) => (
    <form.Field name="step1.name">
      {(field) => (
        <input
          value={field.state.value}
          onChange={(event) => field.handleChange(event.target.value)}
        />
      )}
    </form.Field>
  )}
</form.FormGroup>
```

Inside a group, `group.handleSubmit()` submits only the group. `form.handleSubmit()` submits the whole form.

Group validators can return group-level errors and relative field errors:

```tsx
<form.FormGroup
  name="step1"
  validators={{
    onChange: ({ value }) => ({
      group: value.name ? undefined : 'Complete this step',
      fields: {
        name: value.name ? undefined : 'Name is required',
      },
    }),
  }}
/>
```

For Standard Schema, pass the sub-schema to the group. Relative keys are intentional so step schemas compose into a parent schema.

Group state includes:

- `group.state.value`
- `group.state.meta.errors`
- `group.state.meta.errorMap`
- `group.state.meta.isFieldsValid`
- `group.state.meta.isGroupValid`
- `group.state.meta.isValid`
- `group.state.meta.isSubmitting`

## Linked Fields

Use `onChangeListenTo` or `onBlurListenTo` when one field's validator must rerun because another field changed:

```tsx
<form.Field
  name="confirmPassword"
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) =>
      value === fieldApi.form.getFieldValue('password')
        ? undefined
        : 'Passwords do not match',
  }}
/>
```

Use linked validation for rules; use listeners for side effects.

## Listeners

Listeners react to field or form events:

- `onChange`
- `onBlur`
- `onMount`
- `onSubmit`
- `onUnmount`

Field listener example:

```tsx
<form.Field
  name="country"
  listeners={{
    onChange: () => {
      form.setFieldValue('province', '')
    },
  }}
/>
```

Debounce listeners that perform expensive work:

```tsx
<form.Field
  name="search"
  listeners={{
    onChangeDebounceMs: 500,
    onChange: ({ value }) => {
      void preloadOptions(value)
    },
  }}
/>
```

Form-level listeners receive form and field APIs for propagated change and blur events. They are useful for autosave, analytics, and logging, but keep side effects idempotent and test debounced behavior with fake timers when possible.
