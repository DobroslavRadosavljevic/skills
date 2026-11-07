# Forms

## Contents

- [Labels and help text](#labels-and-help-text)
- [Submitting data](#submitting-data)
- [Controlled fields](#controlled-fields)
- [Validation decision table](#validation-decision-table)
- [Constraint validation](#constraint-validation)
- [Custom validation](#custom-validation)
- [Realtime validation](#realtime-validation)
- [Server validation](#server-validation)
- [Form libraries](#form-libraries)

Docs: https://react-aria.adobe.com/forms. Per-component props are in [components-fields.md](components-fields.md).

## Labels and help text

A `Label` inside a field connects itself. `Text slot="description"` and `FieldError` are read by screen readers when the field gets focus.

```tsx
import {FieldError, Input, Label, Text, TextField} from 'react-aria-components/TextField';

<TextField type="password" name="password" isRequired>
  <Label>Password</Label>
  <Input />
  <Text slot="description">Password must be at least 8 characters.</Text>
  <FieldError />
</TextField>;
```

A field with no visible label needs `aria-label` or `aria-labelledby`.

## Submitting data

Fields need a `name` to appear in `FormData`. Fields are uncontrolled by default.

React 19: use `action`.

```tsx
import {Form} from 'react-aria-components/Form';
import {Input, Label, TextField} from 'react-aria-components/TextField';
import {Button} from 'react-aria-components/Button';

<Form
  action={formData => {
    let name = formData.get('name');
    save(name);
  }}>
  <TextField name="name">
    <Label>Name</Label>
    <Input />
  </TextField>
  <Button type="submit">Submit</Button>
</Form>;
```

After an `action` finishes, React resets the form. The `<select>` hidden inside a React Aria `Select` is reset too, but the trigger still shows the old choice. Native validation then blocks the retry with no visible error, and the handler does not run (tested with React 19.2 and 1.22.1, in Chromium and jsdom). When a form has a `Select` and a submit can fail and be retried, use `onSubmit` with `event.preventDefault()` and call the server function yourself, or control the `Select` value and validate it yourself.

React 18: use `onSubmit`, call `event.preventDefault()`, read `new FormData(event.currentTarget)`, and call `form.reset()` when done.

`Button type="submit"` is required. The default `Button` type is `button`, so it does not submit.

`Form` renders a `<form>` and accepts standard form props. It also accepts `validationBehavior` and `validationErrors`, which apply to all fields inside.

## Controlled fields

Use `value` and `onChange` when another part of the UI must react during editing. `onChange` receives the value, not an event.

```tsx
import {Input, Label, TextField} from 'react-aria-components/TextField';
import {useState} from 'react';

function Example() {
  let [name, setName] = useState('');
  return (
    <TextField value={name} onChange={setName}>
      <Label>Name</Label>
      <Input />
    </TextField>
  );
}
```

## Validation decision table

| Need | Use |
| --- | --- |
| Required, length, pattern, email, URL, min and max | Constraint props plus `FieldError` |
| Custom messages for those constraints | `FieldError` render function |
| Rule in code, shown on commit (blur) or submit | `validate` |
| Rule shown as the user types | Controlled value plus `isInvalid` and a controlled error |
| Rules that need the server | `validationErrors` on `Form` |
| A form library owns validation | `validationBehavior="aria"` plus `isInvalid` |

Default behavior: `validationBehavior="native"` blocks submit when a field is invalid. `validationBehavior="aria"` marks fields invalid for assistive technology and does not block submit.

Always validate on the server as well. Client validation is feedback, not security.

## Constraint validation

Fields use HTML constraint validation. The browser checks on commit and on submit.

- `isRequired`
- `minValue` and `maxValue` for number and date fields
- `minLength`, `maxLength`, and `pattern` for text
- `type="email"` and `type="url"` for format

`FieldError` with no children shows the browser's message in the browser or OS language. `I18nProvider` has no effect on these messages. To control the words and the language, use a render function:

```tsx
import {FieldError} from 'react-aria-components/FieldError';

<FieldError>
  {({validationDetails, validationErrors}) =>
    validationDetails.valueMissing ? 'Please enter a name.' : validationErrors.join(' ')
  }
</FieldError>;
```

Keep the `validationErrors` fallback. The docs example returns `''` for other errors, and that also blanks server errors from `validationErrors` on `Form`: the field is invalid but shows no text.

The render values also include `validationErrors` (a list of strings) and `isInvalid`.

## Custom validation

`validate` receives the value and returns a string, a list of strings, or `null`. Errors show after commit, so typing is not interrupted.

```tsx
import {FieldError, Input, Label, TextField} from 'react-aria-components/TextField';

<TextField name="username" validate={value => (value === 'admin' ? 'Nice try!' : null)}>
  <Label>Username</Label>
  <Input />
  <FieldError />
</TextField>;
```

## Realtime validation

Control the value and set `isInvalid`. Children of `FieldError` show the message.

```tsx
import {FieldError, Input, Label, TextField} from 'react-aria-components/TextField';
import {useState} from 'react';

function Example() {
  let [password, setPassword] = useState('');
  let error = password.length < 8 ? 'Password must be 8 characters or more.' : undefined;

  return (
    <TextField value={password} onChange={setPassword} isInvalid={!!error}>
      <Label>Password</Label>
      <Input />
      <FieldError>{error}</FieldError>
    </TextField>
  );
}
```

`isInvalid` still blocks submit under native behavior. Use `validationBehavior="aria"` to allow submit.

## Server validation

`validationErrors` maps a field's `name` to one or more messages. Errors show when the prop is set. Each clears on commit after the user edits that field: for a text field that is blur, not each keystroke (tested at 1.22.1).

```tsx
'use client';
import {Form} from 'react-aria-components/Form';
import {FieldError, Input, Label, TextField} from 'react-aria-components/TextField';
import {Button} from 'react-aria-components/Button';
import {useActionState} from 'react';
import {createTodo} from './actions';

export function AddForm() {
  let [{errors}, formAction] = useActionState(createTodo, {errors: {}});

  return (
    <Form action={formAction} validationErrors={errors}>
      <TextField name="todo">
        <Label>Task</Label>
        <Input />
        <FieldError />
      </TextField>
      <Button type="submit">Add</Button>
    </Form>
  );
}
```

Works with Server Functions, React Router `actionData`, and any response shape that you convert to this map. For Zod, convert with `z.flattenError(result.error).fieldErrors` in Zod 4 or `result.error.flatten().fieldErrors` in Zod 3. For uncontrolled fields, return submitted values and set `defaultValue`, as the docs' `useActionState` example does, so input stays after a server round trip. See the `Select` warning under [Submitting data](#submitting-data).

Localize server messages on the server. Send the locale with the form data so client bundles stay small.

## Form libraries

Most forms do not need one. For a complex form or an existing form library, keep the rule: the library owns validation, and the field gets `validationBehavior="aria"` and `isInvalid`.

React Hook Form uses `Controller`:

```tsx
import {Controller, useForm} from 'react-hook-form';
import {Form} from 'react-aria-components/Form';
import {FieldError, Input, Label, TextField} from 'react-aria-components/TextField';
import {Button} from 'react-aria-components/Button';

function App() {
  let {handleSubmit, control} = useForm({defaultValues: {name: ''}});

  return (
    <Form onSubmit={handleSubmit(data => save(data))}>
      <Controller
        control={control}
        name="name"
        rules={{required: 'Name is required.'}}
        render={({field: {name, value, onChange, onBlur, ref}, fieldState: {invalid, error}}) => (
          <TextField
            name={name}
            value={value}
            onChange={onChange}
            onBlur={onBlur}
            ref={ref}
            isRequired
            validationBehavior="aria"
            isInvalid={invalid}>
            <Label>Name</Label>
            <Input />
            <FieldError>{error?.message}</FieldError>
          </TextField>
        )}
      />
      <Button type="submit">Submit</Button>
    </Form>
  );
}
```

The same mapping applies to TanStack Form, Formik, and Formisch: value and change handler, `onBlur`, `isInvalid`, the error inside `FieldError`, and `validationBehavior="aria"`. Note that React Aria change handlers receive values, not DOM events. Pass `value` directly to libraries that accept values, and do not read `event.target.value`.
