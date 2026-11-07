# Buttons, fields, and forms

Package: `react-aria-components` 1.22.1. Docs: `https://react-aria.adobe.com/<Page>` (add `.md` for Markdown).

Contents:

- [Shared rules for all fields](#shared-rules-for-all-fields)
- [Shared field parts](#shared-field-parts): Label, Input, TextArea, Text, FieldError, Group
- [Button](#button)
- [ToggleButton](#togglebutton)
- [ToggleButtonGroup](#togglebuttongroup)
- [TextField](#textfield)
- [NumberField](#numberfield)
- [SearchField](#searchfield)
- [Checkbox](#checkbox): CheckboxField and CheckboxButton
- [CheckboxGroup](#checkboxgroup)
- [RadioGroup](#radiogroup): RadioField and RadioButton
- [Switch](#switch): SwitchField and SwitchButton
- [Slider](#slider)
- [TokenField](#tokenfield)
- [Form](#form)

## Shared rules for all fields

- Components ship no styles. Each part gets a default class (`react-aria-TextField`). If you pass `className`, it **replaces** the default class.
- `className`, `style`, and `children` accept a function of the render props. Render props map to `data-*` attributes for CSS.
- Every part accepts `render` to swap the DOM element. Render the same element type, spread the props, and forward the ref.
- Validation props are the same on most fields: `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `name`, `form`.
  - `validate: (value) => ValidationError | true | null | undefined`. `ValidationError` is `string | string[]`.
  - `validationBehavior`: `'native'` (default) blocks submit and shows errors on submit. `'aria'` does not block submit and marks fields invalid as the value changes.
  - The forms guide covers strategy. This file lists per-component props only.
- Set a visible `<Label>` or pass `aria-label` / `aria-labelledby`. Without one, the field has no accessible name and React Aria logs a warning.
- Each component subpath re-exports the parts it needs, so one import line is usually enough. Exceptions are noted below.
- Mark the field root `isDisabled`, `isReadOnly`, `isRequired`, `isInvalid`. Do not set these on `Input`. The root passes them down through context.
- Starter kits in the docs add props such as `label`, `description`, `errorMessage`. Real components do not have them on most fields. Compose the parts.

## Shared field parts

| Part | Import | Renders | Default class | Notes |
| --- | --- | --- | --- | --- |
| `Label` | `react-aria-components/Label` | `<label>` | `react-aria-Label` | `elementType` overrides the tag. Gets `htmlFor` and `id` from the field. |
| `Input` | `react-aria-components/Input` | `<input>` | `react-aria-Input` | `placeholder`, `onHoverStart` and friends. Props such as `type`, `value`, `name` belong on the field root. |
| `TextArea` | `react-aria-components/TextArea` | `<textarea>` | `react-aria-TextArea` | Same render props as `Input`. Use `rows`, `placeholder` here. |
| `Text` | `react-aria-components/Text` | `<span>` | none | `slot="description"` or `slot="errorMessage"` links it with `aria-describedby`. `elementType` overrides the tag. |
| `FieldError` | `react-aria-components/FieldError` | `<span>` | `react-aria-FieldError` | Renders only when invalid. |
| `Group` | `react-aria-components/Group` | `<div role="group">` | `react-aria-Group` | Wraps an input with its buttons. |

`Input` and `TextArea` data attributes: `data-hovered`, `data-focused`, `data-focus-visible`, `data-disabled`, `data-invalid`.

`Group` data attributes: `data-hovered`, `data-focus-within`, `data-focus-visible`, `data-disabled`, `data-invalid`.

`FieldError` render props are the `ValidationResult`: `isInvalid`, `validationErrors: string[]`, `validationDetails: ValidityState`. With no children it joins `validationErrors` as text. A function child customizes the text. Set `elementType="div"` when children hold block elements such as `<ul>`.

```tsx
import {FieldError} from 'react-aria-components/FieldError';

<FieldError elementType="div">
  {({validationErrors, validationDetails}) =>
    validationDetails.valueMissing ? (
      'Enter a name.'
    ) : (
      <ul>
        {validationErrors.map(error => (
          <li key={error}>{error}</li>
        ))}
      </ul>
    )
  }
</FieldError>
```

Reusable wrapper pattern (this is what the starter kits do):

```tsx
import {
  FieldError,
  Input,
  Label,
  Text,
  TextField,
  type TextFieldProps,
  type ValidationResult
} from 'react-aria-components/TextField';

interface MyTextFieldProps extends TextFieldProps {
  label?: string;
  description?: string;
  errorMessage?: string | ((validation: ValidationResult) => string);
  placeholder?: string;
}

export function MyTextField({label, description, errorMessage, placeholder, ...props}: MyTextFieldProps) {
  return (
    <TextField {...props}>
      {label && <Label>{label}</Label>}
      <Input placeholder={placeholder} />
      {description && <Text slot="description">{description}</Text>}
      <FieldError>{errorMessage}</FieldError>
    </TextField>
  );
}
```

## Button

Performs an action. Use `Link` for navigation that looks like a button, `ToggleButton` for on/off state. Docs: https://react-aria.adobe.com/Button

```tsx
import {Button} from 'react-aria-components/Button';

<Button onPress={() => save()}>Save</Button>
```

Key props:

- Events: `onPress`, `onPressStart`, `onPressEnd`, `onPressChange(isPressed)`, `onPressUp`, `onHoverStart`, `onHoverEnd`, `onHoverChange`, `onFocusChange`. `onClick` is an alias for compatibility. Prefer `onPress`.
- State: `isDisabled`, `isPending`.
- Form: `type: 'button' | 'submit' | 'reset'` (default **`'button'`**), `name`, `value`, `form`, `formAction`, `formMethod`, `formEncType`, `formNoValidate`, `formTarget`.
- Focus: `autoFocus`, `excludeFromTabOrder`, `preventFocusOnPress`.
- Composition: `slot`, `render`.

Styling: class `react-aria-Button`. Data attributes: `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`, `data-disabled`, `data-pending`.

`PressEvent`: `type`, `pointerType`, `target`, `shiftKey`, `ctrlKey`, `metaKey`, `altKey`, `x`, `y`, `key`, and `continuePropagation()`. Press events stop propagation by default. Call `continuePropagation()` to pass one to a parent.

Pending state:

- `isPending` disables press and hover but keeps focus, and announces the change.
- The spinner must be in the accessibility tree as soon as the button is pending. To delay a spinner, use `opacity: 0`, not `visibility: hidden` or `display: none`.
- To hold the label's width, use one of two ways. Set the label to `visibility: hidden` and give the `ProgressBar` a full `aria-label` ("Saving"). Or set the label to `opacity: 0`, and the accessible name combines both ("Save, pending").

```tsx
import {Button} from 'react-aria-components/Button';
import {ProgressBar} from 'react-aria-components/ProgressBar';

<Button isPending={isPending} onPress={save}>
  {({isPending}) => (
    <>
      <span style={{opacity: isPending ? 0 : 1}}>Save</span>
      {isPending && <ProgressBar aria-label="pending" isIndeterminate />}
    </>
  )}
</Button>
```

Common mistakes:

- A `<Button>` in a `<Form>` does not submit unless you set `type="submit"`.
- `Button` has no `href`. A link that looks like a button is a `Link` with the same class:

```tsx
import {Link} from 'react-aria-components/Link';

<Link className="button-base" href="https://adobe.com/" target="_blank">Adobe</Link>
```

- An icon-only button needs `aria-label`.
- Do not use `onClick` for pointer type or modifier logic. Read `e.pointerType` from `onPress`.
- Inside a composed component, a `slot` prop picks the context. `slot={null}` opts out of the parent's props.

## ToggleButton

A button with a selected state, for example star or mute. Use `Switch` for a setting that takes effect at once with a label, and `Checkbox` for a form value. Docs: https://react-aria.adobe.com/ToggleButton

```tsx
import {ToggleButton} from 'react-aria-components/ToggleButton';

<ToggleButton aria-label="Star" isSelected={isStarred} onChange={setStarred}>
  <StarIcon />
</ToggleButton>
```

Key props: `isSelected`, `defaultSelected`, `onChange(isSelected: boolean)`, `isDisabled`, `id` (the `Key` in a group), `preventFocusOnPress`, plus the press and hover events of `Button`.

Styling: class `react-aria-ToggleButton`. Data attributes: all from `Button` except `data-pending`, plus `data-selected`. Render props add `state: ToggleState`.

## ToggleButtonGroup

A set of toggle buttons with single or multiple selection: toolbars, segmented controls. Use `RadioGroup` for a form value with labels. Docs: https://react-aria.adobe.com/ToggleButtonGroup

```tsx
import {useState} from 'react';
import {ToggleButton, ToggleButtonGroup, type Key} from 'react-aria-components/ToggleButtonGroup';

function TextStyle() {
  let [selected, setSelected] = useState(new Set<Key>(['bold']));
  return (
    <ToggleButtonGroup
      aria-label="Text style"
      selectionMode="multiple"
      selectedKeys={selected}
      onSelectionChange={setSelected}>
      <ToggleButton id="bold" aria-label="Bold"><BoldIcon /></ToggleButton>
      <ToggleButton id="italic" aria-label="Italic" isDisabled><ItalicIcon /></ToggleButton>
      <ToggleButton id="underline" aria-label="Underline"><UnderlineIcon /></ToggleButton>
    </ToggleButtonGroup>
  );
}
```

Key props:

- Selection: `selectionMode: 'single' | 'multiple'` (default `'single'`), `selectedKeys: Iterable<Key>`, `defaultSelectedKeys`, `onSelectionChange(keys: Set<Key>)`, `disallowEmptySelection`.
- `isDisabled`, `orientation` (default `'horizontal'`).
- Each `ToggleButton` needs an `id`. The `id` is the key.

Styling: class `react-aria-ToggleButtonGroup`. Data attributes: `data-orientation`, `data-disabled`. Render props add `state: ToggleGroupState`.

Animated segmented control: place a `SelectionIndicator` inside each button. It moves between items through CSS transitions. Include `translate` in `transition-property`. It has class `react-aria-SelectionIndicator` and `data-entering` / `data-exiting`.

```tsx
import {composeRenderProps} from 'react-aria-components/composeRenderProps';
import {
  SelectionIndicator,
  ToggleButton,
  ToggleButtonGroup,
  type ToggleButtonProps
} from 'react-aria-components/ToggleButtonGroup';

function SegmentItem(props: ToggleButtonProps) {
  return (
    <ToggleButton {...props}>
      {composeRenderProps(props.children, children => (
        <>
          <SelectionIndicator />
          <span>{children}</span>
        </>
      ))}
    </ToggleButton>
  );
}

<ToggleButtonGroup aria-label="Time period" defaultSelectedKeys={['day']} disallowEmptySelection>
  <SegmentItem id="day">Day</SegmentItem>
  <SegmentItem id="week">Week</SegmentItem>
</ToggleButtonGroup>
```

## TextField

Single-line or multi-line plain text. Use `SearchField` for search with clear, `NumberField` for numbers, `TokenField` for inline tokens. Docs: https://react-aria.adobe.com/TextField

```tsx
import {FieldError, Input, Label, Text, TextField} from 'react-aria-components/TextField';

<TextField name="email" type="email" isRequired>
  <Label>Email</Label>
  <Input placeholder="you@example.com" />
  <Text slot="description">We only use this for receipts.</Text>
  <FieldError />
</TextField>
```

Replace `Input` with `TextArea` (same import) for multi-line text.

Key props:

- Value: `value`, `defaultValue`, `onChange(value: string)`.
- Input: `type: 'text' | 'email' | 'password' | 'search' | 'tel' | 'url' | (string & {})` (default `'text'`), `inputMode`, `autoComplete`, `autoCorrect`, `spellCheck`, `enterKeyHint`, `maxLength`, `minLength`, `pattern`.
- Validation: `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `name`, `form`.
- State: `isDisabled`, `isReadOnly`.

Styling: class `react-aria-TextField`. Data attributes: `data-disabled`, `data-invalid`, `data-readonly`, `data-required`.

Gotchas:

- `placeholder` goes on `Input`, not the root. `value`, `type`, and `name` go on the root.
- A placeholder does not replace a label.
- `onChange` receives a string, not an event.

## NumberField

Number input with locale formatting and steppers. Use `Slider` for a rough value from a range. Docs: https://react-aria.adobe.com/NumberField

```tsx
import {Button, FieldError, Group, Input, Label, NumberField, Text} from 'react-aria-components/NumberField';

<NumberField name="width" defaultValue={1024} minValue={0} step={10} formatOptions={{style: 'unit', unit: 'pixel'}}>
  <Label>Width</Label>
  <Group>
    <Button slot="decrement">-</Button>
    <Input />
    <Button slot="increment">+</Button>
  </Group>
  <Text slot="description">Canvas width.</Text>
  <FieldError />
</NumberField>
```

Key props:

- Value: `value`, `defaultValue`, `onChange(value: number)`.
- Scale: `minValue`, `maxValue`, `step`. Steps count from the minimum: `minValue={2} step={3}` allows 2, 5, 8, 11.
- Format: `formatOptions: Intl.NumberFormatOptions`. This also limits which characters the user can type.
- Commit: `commitBehavior: 'snap' | 'validate'` (default `'snap'`). `'snap'` clamps to min/max and snaps to the nearest step on blur. `'validate'` keeps the value and reports it as invalid.
- `isWheelDisabled`, `incrementAriaLabel`, `decrementAriaLabel` (defaults are localized "Increment" and "Decrement").
- Validation and state: `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `name`, `form`, `isDisabled`, `isReadOnly`.

Styling: class `react-aria-NumberField`. Data attributes: `data-disabled`, `data-invalid`, `data-readonly`, `data-required`. Render props add `state: NumberFieldState`.

Gotchas:

- `onChange` runs when the user **finishes** editing (blur, increment, decrement), not per keystroke.
- `name` submits the raw number, not the formatted string.
- An empty field has the value `NaN`. Handle it in your `onChange` when `value` is controlled.
- Numerals follow the locale. To override the numbering system, use the Unicode locale extension. Latin, Arabic, Devanagari, Bengali, and Han positional decimal are supported.

```tsx
import {I18nProvider} from 'react-aria-components/I18nProvider';

<I18nProvider locale="en-US-u-nu-deva">
  <MyNumberField />
</I18nProvider>
```

## SearchField

Text input with a clear button and submit on Enter. Docs: https://react-aria.adobe.com/SearchField

```tsx
import {Button, FieldError, Input, Label, SearchField, Text} from 'react-aria-components/SearchField';

<SearchField name="q" onSubmit={runSearch} onClear={resetResults}>
  <Label>Search</Label>
  <SearchIcon />
  <Input placeholder="Search documents" />
  <Button><CloseIcon /></Button>
  <Text slot="description">Search by title.</Text>
  <FieldError />
</SearchField>
```

Key props:

- Value: `value`, `defaultValue`, `onChange(value: string)`.
- Events: `onSubmit(value: string)` on Enter, `onClear()` when the user clears the field with the button or Escape.
- `type` (default `'search'`), `maxLength`, `minLength`, `pattern`, `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `name`, `form`, `isDisabled`, `isReadOnly`.

Styling: class `react-aria-SearchField`. Data attributes: `data-empty`, `data-disabled`, `data-invalid`, `data-readonly`, `data-required`. Render props add `state: SearchFieldState`.

Hide the clear button when empty with CSS, for example `.react-aria-SearchField[data-empty] .clear-button { display: none; }`. The field gives the `Button` its behavior and localized label through context, so no `slot` or `aria-label` is needed.

## Checkbox

Single boolean choice in a form, with help text and validation. Docs: https://react-aria.adobe.com/Checkbox

`Checkbox` is **deprecated** in the types. Use `CheckboxField` with `CheckboxButton`. The `<label>` is `CheckboxButton`, so its children are the label. Draw the box yourself.

```tsx
import {CheckboxButton, CheckboxField, FieldError, Text} from 'react-aria-components/Checkbox';

<CheckboxField name="terms" value="agree" isRequired>
  <CheckboxButton>
    {({isSelected, isIndeterminate}) => (
      <>
        <div className="indicator" aria-hidden>
          {isIndeterminate ? <MinusIcon /> : isSelected ? <CheckIcon /> : null}
        </div>
        Accept terms and conditions
      </>
    )}
  </CheckboxButton>
  <Text slot="description">You agree to the terms.</Text>
  <FieldError />
</CheckboxField>
```

`CheckboxField` props:

- Selection: `isSelected`, `defaultSelected`, `onChange(isSelected: boolean)`.
- `isIndeterminate`: visual only. It stays until you remove it, whatever the user does.
- Form: `name`, `value`, `form`, `isRequired`, `isInvalid`, `validate`, `validationBehavior`.
- `isDisabled`, `isReadOnly`, `inputRef`.

Styling:

- `react-aria-CheckboxField`: `data-selected`, `data-indeterminate`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`.
- `react-aria-CheckboxButton`: the same, plus `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`.
- Show the focus ring from `CheckboxButton[data-focus-visible]`. The real input is visually hidden.

## CheckboxGroup

A list of checkboxes with one shared label, value, and validation. Docs: https://react-aria.adobe.com/CheckboxGroup

The `CheckboxGroup` subpath does not export `CheckboxField` or `CheckboxButton`. Import them from `react-aria-components/Checkbox`.

```tsx
import {CheckboxButton, CheckboxField} from 'react-aria-components/Checkbox';
import {CheckboxGroup, FieldError, Label, Text} from 'react-aria-components/CheckboxGroup';

<CheckboxGroup name="condiments" isRequired defaultValue={['lettuce']}>
  <Label>Condiments</Label>
  <CheckboxField value="lettuce"><CheckboxButton>Lettuce</CheckboxButton></CheckboxField>
  <CheckboxField value="tomato"><CheckboxButton>Tomato</CheckboxButton></CheckboxField>
  <Text slot="description">Pick at least one.</Text>
  <FieldError />
</CheckboxGroup>
```

Key props: `value: string[]`, `defaultValue: string[]`, `onChange(value: string[])`, `name`, `form`, `isRequired`, `isInvalid`, `validate(value: string[])`, `validationBehavior`, `isDisabled`, `isReadOnly`.

Styling: class `react-aria-CheckboxGroup`. Data attributes: `data-disabled`, `data-readonly`, `data-required`, `data-invalid`. Render props add `state: CheckboxGroupState`.

Gotchas:

- `isRequired` on the group means "at least one". `isRequired` on each checkbox means "all of these".
- Each `CheckboxField` needs a `value` inside a group.
- The docs prop table for this page lists design-system props (`label`, `size`, `isEmphasized`, `orientation`, `errorMessage`). They are **not** on this component. For layout, use your own CSS.

## RadioGroup

One choice from a short, always visible list. Use `Select` for a long list. Docs: https://react-aria.adobe.com/RadioGroup

`Radio` is **deprecated** in the types. Use `RadioField` with `RadioButton`.

```tsx
import {FieldError, Label, RadioButton, RadioField, RadioGroup, Text} from 'react-aria-components/RadioGroup';

<RadioGroup name="shipping" isRequired orientation="vertical">
  <Label>Shipping</Label>
  <RadioField value="standard">
    <RadioButton>
      <div className="indicator" aria-hidden />
      Standard
    </RadioButton>
    <Text slot="description">Delivers in 5-7 business days.</Text>
  </RadioField>
  <RadioField value="overnight">
    <RadioButton>
      <div className="indicator" aria-hidden />
      Overnight
    </RadioButton>
  </RadioField>
  <Text slot="description">Choose a speed.</Text>
  <FieldError />
</RadioGroup>
```

Key props:

- `RadioGroup`: `value: string | null`, `defaultValue: string | null`, `onChange(value: string)`, `orientation`, `name`, `form`, `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `isDisabled`, `isReadOnly`.
- `RadioField`: `value: string` (required), `isDisabled`, `inputRef`.

Styling:

- `react-aria-RadioGroup`: `data-orientation`, `data-disabled`, `data-readonly`, `data-required`, `data-invalid`. Render props add `state: RadioGroupState`.
- `react-aria-RadioField`: `data-selected`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`.
- `react-aria-RadioButton`: the same, plus `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`.
- Each radio can hold its own `Text slot="description"`. It goes in `RadioField`, outside the `RadioButton`.

Render `<SelectionIndicator />` in `RadioButton` to animate the mark between radios.

## Switch

A setting that takes effect at once. Use `Checkbox` when the value applies on submit. Docs: https://react-aria.adobe.com/Switch

`Switch` is **deprecated** in the types. Use `SwitchField` with `SwitchButton`.

```tsx
import {FieldError, SwitchButton, SwitchField, Text} from 'react-aria-components/Switch';

<SwitchField name="two-factor" isSelected={enabled} onChange={setEnabled}>
  <SwitchButton>
    <div className="track"><div className="handle" /></div>
    Two-factor authentication
  </SwitchButton>
  <Text slot="description">Your organization requires it.</Text>
  <FieldError />
</SwitchField>
```

`SwitchField` props: `isSelected`, `defaultSelected`, `onChange(isSelected: boolean)`, `name`, `value`, `form`, `isRequired`, `isInvalid`, `validate`, `validationBehavior`, `isDisabled`, `isReadOnly`, `inputRef`.

Styling:

- `react-aria-SwitchField`: `data-selected`, `data-disabled`, `data-readonly`, `data-invalid`, `data-required`. Render props add `state: ToggleState`.
- `react-aria-SwitchButton`: the same, plus `data-hovered`, `data-pressed`, `data-focused`, `data-focus-visible`.

`isRequired`, `isInvalid`, and `validate` exist only on `SwitchField`, not on the deprecated `Switch`.

## Slider

One or more numeric values in a range, by dragging. Use `NumberField` for exact values, `ColorSlider` for colors. Docs: https://react-aria.adobe.com/Slider

```tsx
import {Label, Slider, SliderFill, SliderOutput, SliderThumb, SliderTrack} from 'react-aria-components/Slider';

<Slider defaultValue={[30, 60]} minValue={0} maxValue={100} step={5} formatOptions={{style: 'currency', currency: 'USD'}}>
  <Label>Price</Label>
  <SliderOutput />
  <SliderTrack>
    {({state}) => (
      <>
        <div className="track" />
        <SliderFill />
        {state.values.map((_, i) => (
          <SliderThumb key={i} index={i} aria-label={i === 0 ? 'Minimum' : 'Maximum'} name="price" />
        ))}
      </>
    )}
  </SliderTrack>
</Slider>
```

Key props:

- `Slider<T extends number | number[]>`: `value`, `defaultValue`, `onChange(value: T)`, `onChangeEnd(value: T)`, `minValue` (0), `maxValue` (100), `step` (1), `orientation` (`'horizontal'`), `formatOptions`, `isDisabled`.
- `SliderThumb`: `index` (0), `name`, `form`, `isDisabled`, `inputRef`, `aria-label`. It may hold a `Label` child.
- `SliderFill`: `offset` (0), the value where the fill starts. Set it for a bipolar slider.
- `SliderOutput`: children or render function. It shows the formatted value by default.

Styling:

| Part | Class | Data attributes |
| --- | --- | --- |
| `Slider`, `SliderOutput` | `react-aria-Slider`, `react-aria-SliderOutput` | `data-orientation`, `data-disabled` |
| `SliderTrack`, `SliderFill` | `react-aria-SliderTrack`, `react-aria-SliderFill` | as above, plus `data-hovered` |
| `SliderThumb` | `react-aria-SliderThumb` | `data-dragging`, `data-hovered`, `data-focused`, `data-focus-visible`, `data-disabled` |

Render props on `Slider`, `SliderOutput`, `SliderTrack`, `SliderFill`, and `SliderThumb` include `state: SliderState`. Useful members: `values`, `getThumbValue(i)`, `getThumbValueLabel(i)`, `getFormattedValue(v)`, `getThumbPercent(i)`, `incrementThumb(i)`, `isThumbDragging(i)`.

Gotchas:

- The array shape of `value` decides the number of thumbs. Render one `SliderThumb` per value, with `index`.
- Each thumb needs its own label in a multi-thumb slider.
- Thumbs position themselves. Give the track a size in CSS, and center the thumb on the track's cross axis. `data-orientation="vertical"` is your cue for vertical layout.
- `onChange` runs during the drag. Do expensive work in `onChangeEnd`.
- `formatOptions` sets the text of `SliderOutput` and the announced value.

## TokenField

A rich input with inline tokens. Use for AI prompt fields, tag inputs, structured search, mentions, and multi-select comboboxes. Docs: https://react-aria.adobe.com/TokenField

```tsx
import {useState} from 'react';
import {Label} from 'react-aria-components/Label';
import {Text} from 'react-aria-components/Text';
import {Token, TokenField, TokenFieldValue, TokenInput} from 'react-aria-components/TokenField';

function Message() {
  let [value, setValue] = useState(
    new TokenFieldValue([
      {type: 'text', text: 'Hello '},
      {type: 'token', text: '@username'},
      {type: 'text', text: '!'}
    ])
  );
  return (
    <TokenField value={value} onChange={setValue}>
      <Label>Message</Label>
      <TokenInput data-placeholder="Write a message">
        {segment => <Token>{segment.text}</Token>}
      </TokenInput>
      <Text slot="description">Tokens stay whole when edited.</Text>
    </TokenField>
  );
}
```

The `TokenField` subpath has no `Label` or `Text`. Import them from their own subpaths. There is no `FieldError` in the anatomy.

Key props:

- `TokenField<T extends TokenFieldValue>`: `value`, `defaultValue`, `onChange(value: T)`, `allowsNewlines`, `isDisabled`, `isReadOnly`, `onSubmit()` on Enter, `role: 'textbox' | 'searchbox' | 'combobox'` (default `'textbox'`), `onCopy`, `onCut`, `onPaste`, `onKeyDown`, `onKeyUp`.
- `TokenInput`: `children: (segment: TokenSegment) => ReactElement`, called for each token segment. Plain text renders by itself. `isDisabled` here disables hover events only.
- `Token`: renders `<span>`.

Styling:

- `react-aria-TokenField`: `data-disabled`, `data-readonly`.
- `react-aria-TokenInput` (a `<div>`): `data-hovered`, `data-focused`, `data-focus-visible`, `data-disabled`, `data-readonly`. The starter shows placeholders with `data-placeholder` and its own CSS. The attribute is not a built-in prop.
- `react-aria-Token`: `data-selected`, `data-disabled`.

`TokenFieldValue<T>` is immutable. Methods return a new value:

- Segments: `{type: 'text', text}` and `{type: 'token', text, value?: T}`. `value` holds any data for the token.
- Read: `segments`, `selectedRange`, `caretPosition: {index, offset}`, `toString()`.
- Edit: `replaceRange(start, end, text, coalesce?)`, `replaceRangeWithSegments(start, end, segments, coalesce?)`, `delete(pos, segmenter, direction, coalesce?)`, `deleteLine(pos, direction, coalesce?)`, `slice(start, end)`.
- Find: `findText(pos, direction, search: string | RegExp)`, `findLineBoundary(pos, direction)`, `findBoundaryWithSegmenter(pos, segmenter, direction)`. Direction is `TokenFieldValue.Direction.Forward` or `.Backward`.
- Caret: `withCaretPosition(pos)`, `withSelectedRange(range)`, `new TokenFieldValue.SelectedRange(anchor, current?)`.
- History: `undo()`, `redo()`, `endCoalescing()`.
- Protected, for subclasses: `tokenize(text)`, `createFieldValue(segments)`.

Automatic tokenizing: subclass and override `tokenize`. Override `createFieldValue` too, so new values keep your subclass and its fields.

```ts
import {TokenFieldValue, type TokenFieldSegment} from 'react-aria-components/TokenField';

class TokenizingFieldValue extends TokenFieldValue {
  tokenRegex: RegExp;
  constructor(tokens: readonly TokenFieldSegment[], tokenRegex: RegExp) {
    super(tokens);
    this.tokenRegex = tokenRegex;
  }
  protected createFieldValue(segments: readonly TokenFieldSegment[]): this {
    let Constructor = this.constructor as new (s: readonly TokenFieldSegment[], r: RegExp) => this;
    return new Constructor(segments, this.tokenRegex);
  }
  protected tokenize(text: string): TokenFieldSegment[] {
    let segments: TokenFieldSegment[] = [];
    let start = 0;
    this.tokenRegex.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = this.tokenRegex.exec(text))) {
      if (match.index > start) {
        segments.push({type: 'text', text: text.slice(start, match.index)});
      }
      segments.push({type: 'token', text: match[0]});
      start = match.index + match[0].length;
    }
    if (start < text.length) {
      segments.push({type: 'text', text: text.slice(start)});
    }
    return segments.length ? segments : [{type: 'text', text}];
  }
}
```

The docs use a regex that requires whitespace or the zero-width space `​` around a token, so the text the user is typing does not become a token yet: `/(?<=[\s​]|^)[#@][^\s​]+(?=[\s​])/g`.

Mentions and slash commands: wrap in `Autocomplete`. Find the anchor with `findText`. Position a non-modal `Popover` with `tokenFieldPositionToDOMRange`. Replace the typed text on select.

```tsx
import {Autocomplete} from 'react-aria-components/Autocomplete';
import {Label} from 'react-aria-components/Label';
import {Menu, MenuItem} from 'react-aria-components/Menu';
import {Popover} from 'react-aria-components/Popover';
import {Token, TokenField, TokenFieldValue, TokenInput, tokenFieldPositionToDOMRange} from 'react-aria-components/TokenField';
import {useMemo, useRef, useState} from 'react';

function Prompt({users}: {users: {username: string}[]}) {
  let inputRef = useRef<HTMLDivElement>(null);
  let [value, setValue] = useState(new TokenFieldValue([{type: 'text', text: ''}]));
  let [anchor, filter] = useMemo(() => {
    let anchor = value.findText(value.caretPosition, TokenFieldValue.Direction.Backward, /(?<=^|\s)@/);
    return anchor ? [anchor, value.slice(anchor, value.caretPosition).toString()] : [null, null];
  }, [value]);
  let items = filter == null ? [] : users.filter(u => u.username.includes(filter.slice(1)));

  return (
    <Autocomplete>
      <TokenField value={value} onChange={setValue} allowsNewlines>
        <Label>Prompt</Label>
        <TokenInput ref={inputRef}>{segment => <Token>{segment.text}</Token>}</TokenInput>
      </TokenField>
      <Popover
        triggerRef={inputRef}
        isOpen={anchor != null && items.length > 0}
        isNonModal
        placement="bottom start"
        trigger="MenuTrigger"
        getTargetRect={target => tokenFieldPositionToDOMRange(target, anchor!).getBoundingClientRect()}>
        <Menu items={items} dependencies={[anchor]}>
          {item => (
            <MenuItem
              id={item.username}
              onAction={() =>
                setValue(v =>
                  v.replaceRangeWithSegments(
                    anchor!,
                    v.caretPosition,
                    [{type: 'token', text: '@' + item.username}, {type: 'text', text: ' '}],
                    false
                  )
                )
              }>
              {item.username}
            </MenuItem>
          )}
        </Menu>
      </Popover>
    </Autocomplete>
  );
}
```

`setValue` must accept an updater function here, which `useState` does.

Other patterns from the docs:

- **Tag field**: a subclass whose `tokenize` turns comma, space, or newline separated text into tokens. Set `allowsNewlines`.
- **Structured search**: `role="searchbox"`. Read the current text with `value.segments[value.caretPosition.index]`. Offer "From: x" suggestions in `MenuSection`s. On select, replace from `{index: value.caretPosition.index, offset: 0}` to the caret with a token.
- **Multi-select ComboBox**: render `TokenField` as the ComboBox input with `selectionMode="multiple"`. Bind `value` and `inputValue` from a subclass of `TokenFieldValue` that you write (the docs name it `ComboBoxTokenFieldValue`, with `getSelectedKeys()`, `getInputValue()`, `setSelectedKeys()`). The docs do not print its source, and the class is not in the package.

Also exported: `setTokenFieldSelection(root, selectedRange, fireEvent?)`.

## Form

A `<form>` with validation behavior and server errors. Docs: https://react-aria.adobe.com/Form

```tsx
import {Button} from 'react-aria-components/Button';
import {Form} from 'react-aria-components/Form';
import {FieldError, Input, Label, TextField} from 'react-aria-components/TextField';

<Form
  action={formData => {
    console.log(formData.get('username'));
  }}
  validationErrors={serverErrors}>
  <TextField name="username" isRequired validate={v => (v === 'admin' ? 'Nice try.' : null)}>
    <Label>Username</Label>
    <Input />
    <FieldError />
  </TextField>
  <Button type="submit">Submit</Button>
  <Button type="reset">Reset</Button>
</Form>
```

Key props:

- `action: string | ((formData: FormData) => void | Promise<void>)` for React 19. Use `onSubmit` with `event.preventDefault()` and `new FormData(event.currentTarget)` in React 18.
- `onSubmit`, `onReset`, `onInvalid`.
- `validationBehavior: 'native' | 'aria'` (default `'native'`). It applies to the fields inside.
- `validationErrors: Record<string, string | string[]>`: server errors keyed by field `name`.
- `method`, `encType`, `target`, `autoComplete`, `autoCapitalize`, `role: 'search' | 'presentation'`.

Styling: class `react-aria-Form`. No state data attributes.

Behavior:

- After a failed submit, the first invalid field takes focus. To change this, call `e.preventDefault()` in `onInvalid` and move focus yourself, for example to a `role="alert"` summary.
- Server errors in `validationErrors` show at once and clear on commit after the user edits that field. For a text field that is blur, not each keystroke (tested at 1.22.1).
- Fields submit by `name`. A field without `name` is not in `FormData`.
